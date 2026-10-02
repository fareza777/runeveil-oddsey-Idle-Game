import { h, fmt, fmtTime, mount } from './dom';
import { bar, ico, iconUrl, itemIcon, setBar } from './icons';
import { ActivityScene } from './scene';
import { toast } from './modal';
import { costChip, goldChip, moneyText } from './common';
import { audio } from './audio';
import { host } from './host';
import { stackSheet } from './itemSheet';
import type { Screen } from './screen';
import { GATHER, GATHER_MAP, HEROES, ITEMS, RECIPES, RECIPE_MAP, SKILLS, SKILL_MAP, MAX_LEVEL } from '@/data';
import { skillXpOf, countItem, type GameEvent } from '@/core/state';
import { xpAtLevel } from '@/core/xp';
import type { GatherDef, RecipeDef, SkillId } from '@/core/types';

const GROUPS = ['Combat', 'Gathering', 'Crafting', 'Support'] as const;

// ---- skill web: which skills supply and consume each other ----
const producers = new Map<string, Set<SkillId>>();
for (const g of GATHER) for (const d of g.drops) (producers.get(d.item) ?? producers.set(d.item, new Set()).get(d.item)!).add(g.skill);
for (const r of RECIPES) for (const o of r.out) (producers.get(o.item) ?? producers.set(o.item, new Set()).get(o.item)!).add(r.skill);
const needs = new Map<SkillId, Set<SkillId>>();
const supplies = new Map<SkillId, Set<SkillId>>();
for (const r of RECIPES) {
  for (const i of r.inputs) {
    for (const p of producers.get(i.item) ?? []) {
      if (p === r.skill) continue;
      (needs.get(r.skill) ?? needs.set(r.skill, new Set()).get(r.skill)!).add(p);
      (supplies.get(p) ?? supplies.set(p, new Set()).get(p)!).add(r.skill);
    }
  }
}

type Row = { id: string; kind: 'gather' | 'craft'; bar: HTMLElement; btn: HTMLButtonElement; costs?: HTMLElement; recipe?: RecipeDef };

export class SkillsScreen implements Screen {
  el = h('div', { class: 'screen' });
  private open: SkillId | null = null;
  private rows: Row[] = [];
  private cards = new Map<SkillId, { xp: HTMLElement; lv: HTMLElement; card: HTMLElement }>();
  private tick = 0;
  private showAllLocked = false;
  private scene: ActivityScene | null = null;

  show() {
    if (this.open) this.showDetail(this.open);
    else this.showGrid();
  }

  reset() {
    this.open = null;
  }

  private dropScene() {
    this.scene?.destroy();
    this.scene = null;
  }

  /** Reward popups inside the scene for the open skill. */
  event(e: GameEvent) {
    if (!this.scene) return;
    const act = host.game.state.activity;
    const running = act && act.type !== 'combat' ? (act.type === 'gather' ? GATHER_MAP[act.id]?.skill : RECIPE_MAP[act.id]?.skill) : undefined;
    if (running !== this.open && e.t !== 'level') return;
    if (e.t === 'item' && ITEMS[e.id]) this.scene.reward(`+${fmt(e.n)} ${ITEMS[e.id].name}`, iconUrl(ITEMS[e.id].icon).url);
    else if (e.t === 'gear') this.scene.reward(ITEMS[e.inst.id].name, iconUrl(ITEMS[e.inst.id].icon).url);
    else if (e.t === 'level' && this.open === e.skill) this.scene.reward(`Level ${e.level}!`);
  }

  openSkill(id: SkillId) {
    this.open = id;
    this.showAllLocked = false;
  }

  private showGrid() {
    this.open = null;
    this.rows = [];
    this.cards.clear();
    this.dropScene();
    const s = host.game.state;
    const total = SKILLS.reduce((n, k) => n + s.skills[k.id], 0);
    const act = s.activity;
    const runSkill: SkillId | null = act?.type === 'gather' ? GATHER_MAP[act.id]?.skill ?? null : act?.type === 'craft' ? RECIPE_MAP[act.id]?.skill ?? null : null;
    let banner: HTMLElement | null = null;
    if (runSkill) {
      this.scene = new ActivityScene(runSkill, { compact: true });
      banner = h('div', { class: 'tap', onclick: () => { this.openSkill(runSkill); this.show(); } }, this.scene.el);
    }
    const kids: (HTMLElement | null)[] = [
      h('div', { class: 'row' }, h('h2', { style: 'margin:4px 0;flex:1', text: 'Skills' }), h('span', { class: 'chip gold', text: `Total level ${total}` })),
      banner,
      h('div', { class: 'small muted', style: 'margin-bottom:6px', text: 'Gather raw materials, refine them, then craft gear and supplies for your heroes. Tap a skill to begin.' }),
    ];
    for (const grp of GROUPS) {
      kids.push(h('h3', { text: grp, style: 'color:var(--muted)' }));
      kids.push(h('div', { class: 'grid g3' }, ...SKILLS.filter((k) => k.group === grp).map((k) => {
        const lv = h('span', { class: 'lv', text: `Lv ${s.skills[k.id]}` });
        const xp = bar('xp thin', this.xpFrac(k.id));
        const card = h('div', { class: 'card tap skillcard', style: `margin:0;border-color:${k.color}55`, onclick: () => { audio.sfx('ui_click'); this.openSkill(k.id); this.show(); } },
          lv, ico(k.icon), h('div', { class: 'nm', text: k.name }), xp);
        this.cards.set(k.id, { xp, lv, card });
        return card;
      })));
    }
    mount(this.el, kids);
    this.el.scrollTop = 0;
    this.update();
  }

  private xpFrac(id: SkillId): number {
    const s = host.game.state;
    const lv = s.skills[id];
    if (lv >= MAX_LEVEL) return 1;
    const a = xpAtLevel(lv);
    const b = xpAtLevel(lv + 1);
    return (skillXpOf(s, id) - a) / (b - a);
  }

  private showDetail(id: SkillId) {
    const g = host.game;
    const s = g.state;
    const def = SKILL_MAP[id];
    const lv = s.skills[id];
    this.rows = [];
    this.dropScene();
    this.scene = new ActivityScene(id);
    const a = xpAtLevel(lv);
    const b = xpAtLevel(Math.min(MAX_LEVEL, lv + 1));
    const xpBar = bar('xp tall', this.xpFrac(id), lv >= MAX_LEVEL ? 'MAX' : `${fmt(skillXpOf(s, id) - a)} / ${fmt(b - a)} XP`);
    const cur = Math.floor(lv / 10) * def.passive.per10;
    const nextAt = (Math.floor(lv / 10) + 1) * 10;

    const chips = (set?: Set<SkillId>) => [...(set ?? [])].map((k) => h('span', { class: 'chip tap', style: 'cursor:pointer', text: SKILL_MAP[k].name, onclick: () => { this.openSkill(k); this.show(); } }));
    const head = h('div', { class: 'card' },
      h('div', { class: 'item' }, ico(def.icon, 'lg'),
        h('div', { class: 'meta' }, h('b', { style: `font-size:18px;color:${def.color}`, text: def.name }), h('span', { text: `Level ${lv} / ${MAX_LEVEL}` }))),
      h('div', { style: 'margin:8px 0' }, xpBar),
      h('div', { class: 'small', text: def.desc }),
      h('div', { class: 'small muted', style: 'margin-top:4px', text: def.feeds }),
      h('div', { class: 'small', style: 'margin-top:6px' }, h('span', { class: 'gold', text: 'Passive: ' }), `${def.passive.text} per 10 levels (now ${cur.toFixed(1)}, next at Lv ${nextAt})`),
      needs.get(id)?.size ? h('div', { class: 'row', style: 'margin-top:8px;flex-wrap:wrap;gap:4px' }, h('span', { class: 'tiny muted', text: 'Needs from:' }), ...chips(needs.get(id))) : null,
      supplies.get(id)?.size ? h('div', { class: 'row', style: 'margin-top:6px;flex-wrap:wrap;gap:4px' }, h('span', { class: 'tiny muted', text: 'Supplies:' }), ...chips(supplies.get(id))) : null);

    const list = h('div');
    const gathers = GATHER.filter((x) => x.skill === id).sort((x, y) => x.level - y.level);
    const recipes = RECIPES.filter((x) => x.skill === id).sort((x, y) => x.level - y.level);
    if (!gathers.length && !recipes.length) {
      const hero = HEROES.find((x) => x.skill === id);
      list.append(h('div', { class: 'empty', text: hero ? `${hero.name} trains this skill while fighting. Send the party into battle.` : 'This skill grows while your heroes fight in battle.' }),
        h('button', { class: 'btn gold block', text: 'Go to battle', onclick: () => host.go('battle') }));
    }
    const lock = (lvl: number) => lvl > lv;
    const visible = <T extends { level: number }>(arr: T[]) => {
      if (this.showAllLocked) return arr;
      let locked = 0;
      return arr.filter((x) => (lock(x.level) ? ++locked <= 4 : true));
    };
    for (const n of visible(gathers)) list.append(this.gatherRow(n));
    for (const r of visible(recipes)) list.append(this.recipeRow(r));
    const hidden = gathers.length + recipes.length - visible(gathers).length - visible(recipes).length;
    if (hidden > 0) list.append(h('button', { class: 'btn ghost block', text: `Show ${hidden} more locked`, onclick: () => { this.showAllLocked = true; this.showDetail(id); } }));

    mount(this.el,
      h('button', { class: 'back', text: '‹ All skills', onclick: () => { this.showGrid(); } }),
      this.scene.el,
      head,
      gathers.length || recipes.length ? h('h3', { text: gathers.length ? 'Gather' : 'Craft', style: 'color:var(--muted)' }) : null,
      list);
    this.update();
  }

  private begin(type: 'gather' | 'craft', id: string) {
    const g = host.game;
    const active = g.state.activity;
    if (active?.type === type && active.id === id) {
      g.stop('Stopped');
    } else {
      const err = g.start(type, id);
      if (err) { toast(err, 'bad'); return; }
      audio.sfx(type === 'gather' ? 'harvest' : 'anvil', 0.6);
      this.el.scrollTo({ top: 0, behavior: 'smooth' });
    }
    host.refresh();
    this.updateRows(true);
  }

  private gatherRow(n: GatherDef): HTMLElement {
    const g = host.game;
    const s = g.state;
    const locked = n.level > s.skills[n.skill];
    const pr = bar('act thin', 0);
    const btn = h('button', { class: 'btn sm gold', text: 'Start', onclick: () => this.begin('gather', n.id) });
    const time = g.actionTime(n.time);
    const main = ITEMS[n.drops[0].item];
    this.rows.push({ id: n.id, kind: 'gather', bar: pr, btn });
    return h('div', { class: `card ${locked ? 'locked' : ''}` },
      h('div', { class: 'item' }, ico(main?.icon ?? n.icon, 'lg'),
        h('div', { class: 'meta' }, h('b', { text: n.name }), h('span', { text: locked ? `Requires level ${n.level}` : `${fmtTime(time)} · ${fmt(n.xp)} XP` })),
        locked ? h('span', { class: 'chip', text: `Lv ${n.level}` }) : btn),
      locked ? null : h('div', { class: 'row', style: 'margin-top:6px;flex-wrap:wrap;gap:3px' },
        ...n.drops.slice(0, 5).map((d, i) => h('span', { class: 'cost', title: ITEMS[d.item]?.name, onclick: () => stackSheet(d.item) }, ico(ITEMS[d.item]?.icon ?? 'img:ui_icon_gift'), i === 0 ? `×${d.min ?? 1}${d.max && d.max !== d.min ? '–' + d.max : ''}` : `${Math.max(0.1, Math.round(d.chance * 1000) / 10)}%`))),
      locked ? null : h('div', { style: 'margin-top:6px' }, pr));
  }

  private recipeRow(r: RecipeDef): HTMLElement {
    const g = host.game;
    const s = g.state;
    const locked = r.level > s.skills[r.skill];
    const pr = bar('act thin', 0);
    const btn = h('button', { class: 'btn sm gold', text: 'Craft', onclick: () => this.begin('craft', r.id) });
    const costs = h('div', { class: 'row', style: 'margin-top:6px;flex-wrap:wrap;gap:0' });
    const out = r.out[0] ? ITEMS[r.out[0].item] : null;
    this.rows.push({ id: r.id, kind: 'craft', bar: pr, btn, costs, recipe: r });
    const row = h('div', { class: `card ${locked ? 'locked' : ''}` },
      h('div', { class: 'item' }, out ? itemIcon(out.id, undefined, '') : ico(r.icon, 'lg'),
        h('div', { class: 'meta' }, h('b', { text: r.name }), h('span', { text: locked ? `Requires level ${r.level}` : `${fmtTime(g.actionTime(r.time))} · ${fmt(r.xp)} XP${r.outGold ? ` · sells ${moneyText(r.outGold)}` : ''}` })),
        locked ? h('span', { class: 'chip', text: `Lv ${r.level}` }) : btn),
      locked ? null : costs,
      locked ? null : h('div', { style: 'margin-top:6px' }, pr));
    if (!locked) this.renderCosts(r, costs);
    return row;
  }

  private renderCosts(r: RecipeDef, host_: HTMLElement) {
    const s = host.game.state;
    mount(host_, r.inputs.map((i) => costChip(s, i.item, i.n)), r.gold ? goldChip(s.gold, r.gold) : null);
  }

  update() {
    if (this.open) this.updateRows(false);
    else this.updateCards();
    this.tick++;
  }

  private updateCards() {
    const s = host.game.state;
    const act = s.activity;
    for (const [id, c] of this.cards) {
      setBar(c.xp, this.xpFrac(id));
      const t = `Lv ${s.skills[id]}`;
      if (c.lv.textContent !== t) c.lv.textContent = t;
      let running = false;
      if (act?.type === 'gather') running = SKILL_MAP[id] && !!GATHER.find((x) => x.id === act.id && x.skill === id);
      else if (act?.type === 'craft') running = !!RECIPES.find((x) => x.id === act.id && x.skill === id);
      else if (act?.type === 'combat') running = HEROES.some((x) => x.skill === id) || id === 'fortitude';
      c.card.classList.toggle('run', running);
    }
  }

  private updateRows(force: boolean) {
    const g = host.game;
    const act = g.state.activity;
    const refreshCosts = force || this.tick % 8 === 0;
    for (const r of this.rows) {
      const on = act && act.type === r.kind && act.id === r.id;
      let frac = 0;
      if (on) {
        const base = r.kind === 'gather' ? GATHER.find((x) => x.id === r.id)!.time : r.recipe!.time;
        frac = act.progress / g.actionTime(base);
      }
      setBar(r.bar, frac);
      const txt = on ? 'Stop' : r.kind === 'gather' ? 'Start' : 'Craft';
      if (r.btn.textContent !== txt) {
        r.btn.textContent = txt;
        r.btn.classList.toggle('red', !!on);
        r.btn.classList.toggle('gold', !on);
      }
      if (r.recipe && r.costs && refreshCosts) {
        this.renderCosts(r.recipe, r.costs);
        r.btn.classList.toggle('off', !on && !g.canAfford(r.recipe));
      }
    }
  }

  countOf(id: string) { return countItem(host.game.state, id); }
}

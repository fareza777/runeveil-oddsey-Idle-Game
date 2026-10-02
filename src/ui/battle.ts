import { h, fmt, mount } from './dom';
import { ico, itemIcon, monsterSprite, setBar, bar, spriteEl, statusBadge } from './icons';
import { zoneBgUrl } from './bg';
import { openSheet, toast } from './modal';
import { audio, musicForZone } from './audio';
import { enemyList } from './bestiary';
import { buzz, danger, moneyEl, readiness } from './common';
import { host } from './host';
import type { Screen } from './screen';
import type { Fighter } from '@/core/combat';
import type { GameEvent } from '@/core/state';
import { BOSSES, ELEMENT_MAP, ITEMS, ZONES, ZONE_MAP, rarity } from '@/data';
import { countItem, heroDef } from '@/core/state';
import type { MonsterDef } from '@/core/types';

export class BattleScreen implements Screen {
  el = h('div', { class: 'screen flush' });
  private arena!: HTMLElement;
  private enemyWrap!: HTMLElement;
  private enemyBody!: HTMLElement;
  private enemyName!: HTMLElement;
  private enemyBar!: HTMLElement;
  private enemyStat!: HTMLElement;
  private zoneTag!: HTMLElement;
  private killTag!: HTMLElement;
  private fx!: HTMLElement;
  private heroEls: { root: HTMLElement; hp: HTMLElement; cd: HTMLElement; stat: HTMLElement; sig: string }[] = [];
  private info!: HTMLElement;
  private loadout!: HTMLElement;
  private ticker!: HTMLElement;
  private enemies!: HTMLElement;
  private enemiesSig = '';
  private shownEnemy = '';
  private shownZone = 0;
  private enemySig = '';
  private lastHurt = 0;
  private lastKey = '';
  private partySize = 0;

  show() {
    const g = host.game;
    const zone = ZONE_MAP[this.currentZone()];
    this.shownZone = zone.id;
    this.shownEnemy = '';
    this.heroEls = [];

    this.zoneTag = h('div', { class: 'zonetag' });
    this.killTag = h('div', { class: 'killtag' });
    this.enemyName = h('div', { class: 'ename' });
    this.enemyBar = bar('hp tall', 1, '');
    this.enemyBar.className += ' ebar';
    this.enemyStat = h('div', { class: 'estat' });
    this.enemyBody = h('div', { class: 'body' });
    this.enemyWrap = h('div', { class: 'enemy' }, this.enemyName, this.enemyBar, this.enemyStat, this.enemyBody);
    this.fx = h('div', { class: 'fx' });
    this.partySize = g.state.heroes.length;
    const heroes = h('div', { class: 'heroes' }, ...g.state.heroes.map((_, i) => {
      const hd = heroDef(g.state, i);
      const hp = bar('hp ally', 1);
      const cd = bar('cd', 0);
      const stat = h('div', { class: 'hstat' });
      const root = h('div', { class: 'hero', style: `--d:${(i * 0.37).toFixed(2)}s` }, stat,
        h('div', { class: 'hb' }, spriteEl(hd.sprite, { zoom: 1.6, max: 118 })), hp, cd);
      this.heroEls.push({ root, hp, cd, stat, sig: '' });
      return root;
    }));
    this.arena = h('div', { class: 'arena' }, this.zoneTag, this.killTag, this.enemyWrap, heroes, this.fx);
    this.arena.style.backgroundImage = `url(${zoneBgUrl(zone)})`;

    this.info = h('div', { class: 'card', style: 'margin:10px 12px 8px' });
    this.loadout = h('div', { class: 'row', style: 'margin:0 12px 6px;gap:8px' });
    this.ticker = h('div', { class: 'ticker', style: 'margin:0 8px' });
    this.enemies = h('div', { style: 'margin:10px 12px 0' });
    this.enemiesSig = '';
    mount(this.el, this.arena, this.info, this.loadout, this.enemies, h('div', { class: 'small muted', style: 'margin:10px 14px 0', text: 'Recent loot' }), this.ticker);
    this.renderInfo();
    this.renderLoadout();
    this.update();
    audio.playMusic(musicForZone(zone.id, !!g.rt?.boss));
  }

  private currentZone(): number {
    const g = host.game;
    const a = g.state.activity;
    if (a?.type === 'combat' && g.rt) return g.rt.zone;
    return g.state.zone;
  }

  private renderInfo() {
    const g = host.game;
    const s = g.state;
    const a = s.activity;
    const fighting = a?.type === 'combat';
    const zid = this.currentZone();
    const zone = ZONE_MAP[zid];
    const boss = BOSSES[zone.boss];
    const r = readiness(s, zid);
    const d = danger(r);
    const bossFight = fighting && g.rt?.boss;
    const actions = h('div', { class: 'row', style: 'margin-top:10px' });
    actions.append(h('button', { class: 'btn grow', text: 'Zones', onclick: () => this.zoneSheet() }));
    if (!fighting) {
      actions.append(h('button', { class: 'btn gold grow', text: 'Battle!', onclick: () => this.begin(`zone:${zid}`) }));
    } else if (bossFight) {
      actions.append(h('button', { class: 'btn red grow', text: 'Retreat', onclick: () => this.begin(`zone:${zid}`) }));
    } else {
      actions.append(h('button', { class: 'btn red grow', text: `Boss: ${boss.name}`, onclick: () => this.begin(boss.id) }));
    }
    if (fighting) actions.append(h('button', { class: 'btn ghost', text: 'Stop', onclick: () => { g.stop('You rest.'); host.refresh(); this.show(); } }));

    mount(this.info,
      h('div', { class: 'row' },
        h('div', { class: 'grow' }, h('b', { style: 'font-size:16px', text: zone.name }), h('div', { class: 'small muted', text: `Level ${zone.levelRange[0]}–${zone.levelRange[1]} · ${bossFight ? 'Boss fight' : fighting ? 'Hunting' : 'Resting'}` })),
        h('span', { class: `chip ${d.cls}`, text: `${d.label} ${Math.round(r * 100)}%` })),
      actions);
    this.lastKey = this.key();
  }

  private key(): string {
    const g = host.game;
    return `${g.state.activity?.type}|${g.state.activity?.id}|${g.rt?.boss}|${g.state.zone}|${g.state.heroes.length}`;
  }

  private begin(id: string) {
    const g = host.game;
    const err = g.start('combat', id);
    if (err) { toast(err, 'bad'); return; }
    audio.sfx('ui_confirm');
    this.show();
    host.refresh();
  }

  private renderLoadout() {
    const g = host.game;
    const s = g.state;
    const slot = (kind: 'food' | 'potion', label: string) => {
      const id = s.loadout[kind];
      const have = id ? countItem(s, id) : 0;
      return h('div', { class: 'card tap grow row', style: 'margin:0;padding:6px 8px;gap:8px', onclick: () => this.pickConsumable(kind) },
        id && have > 0 ? itemIcon(id, undefined, 'sm') : h('span', { class: 'slotbox sm empty' }, ico(kind === 'food' ? 'img:ui_icon_gift' : 'img:ui_icon_flask')),
        h('div', { class: 'grow' }, h('div', { class: 'tiny muted', text: label }), h('div', { class: 'small', style: 'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:110px', text: id && have > 0 ? `${ITEMS[id].name} ×${fmt(have)}` : 'None set' })));
    };
    mount(this.loadout, slot('food', `Auto-eat < ${Math.round(s.settings.autoEat * 100)}% HP`), slot('potion', s.settings.autoPotion ? 'Auto-potion' : 'Potion (off)'));
  }

  private pickConsumable(kind: 'food' | 'potion') {
    const g = host.game;
    const s = g.state;
    const list = Object.keys(s.stacks).filter((id) => {
      const d = ITEMS[id];
      return d && (kind === 'food' ? d.kind === 'food' : d.kind === 'potion' && d.buff);
    }).sort((a, b) => ITEMS[b].tier - ITEMS[a].tier);
    openSheet(kind === 'food' ? 'Choose food' : 'Choose potion', (body, close) => {
      if (!list.length) {
        body.append(h('div', { class: 'empty', text: kind === 'food' ? 'No food yet. Catch fish or hunt, then Cook it.' : 'No potions yet. Gather herbs and brew them with Alchemy.' }));
        return;
      }
      if (s.loadout[kind]) body.append(h('button', { class: 'btn ghost block', style: 'margin-bottom:8px', text: 'Clear slot', onclick: () => { g.setLoadout(kind, null); this.renderLoadout(); close(); } }));
      for (const id of list) {
        const d = ITEMS[id];
        body.append(h('div', { class: 'card tap item', onclick: () => { g.setLoadout(kind, id); this.renderLoadout(); close(); } }, itemIcon(id),
          h('div', { class: 'meta' }, h('b', { text: d.name }), h('span', { text: d.heal ? `Heals ${fmt(d.heal)}` : d.buff ? `${d.buff.status} ${Math.round(d.buff.potency * 100)}% · ${d.buff.duration}s` : '' })),
          h('span', { class: 'chip', text: `×${fmt(countItem(s, id))}` })));
      }
    });
  }

  private zoneSheet() {
    const g = host.game;
    openSheet('World map', (body, close) => {
      for (const z of ZONES) {
        const lockErr = g.canEnterZone(z.id);
        const boss = BOSSES[z.boss];
        const r = readiness(g.state, z.id);
        const d = danger(r);
        const wb = Object.values(BOSSES).find((b) => b.id.startsWith('wboss') && b.zone === z.id);
        const card = h('div', { class: `card ${lockErr ? 'locked' : ''} ${g.state.zone === z.id ? 'active' : ''}` },
          h('div', { class: 'zonecard' },
            h('div', { class: 'thumb', style: `background-image:url(${zoneBgUrl(z)})` }),
            h('div', { class: 'grow' },
              h('b', { text: `${z.id}. ${z.name}` }),
              h('div', { class: 'tiny muted', text: `Lv ${z.levelRange[0]}–${z.levelRange[1]} · ${lockErr ?? z.desc}`, style: 'display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden' })),
            lockErr ? null : h('span', { class: `chip ${d.cls}`, text: d.label })));
        if (!lockErr) {
          const killed = (g.state.bossKills[boss.id] ?? 0) > 0;
          card.append(h('div', { class: 'row', style: 'margin-top:8px;flex-wrap:wrap' },
            h('button', { class: 'btn sm grow', text: 'Enemies', onclick: () => openSheet(`${z.name} enemies`, (b2) => { b2.append(enemyList(z.id)); }) }),
            h('button', { class: 'btn sm gold grow', text: 'Fight here', onclick: () => { g.state.zone = z.id; this.go(`zone:${z.id}`, close); } }),
            h('button', { class: 'btn sm red grow', text: `${killed ? '✓ ' : ''}Boss ${boss.name}`, onclick: () => { g.state.zone = z.id; this.go(boss.id, close); } }),
            wb ? h('button', { class: 'btn sm ghost grow', text: `${(g.state.bossKills[wb.id] ?? 0) > 0 ? '✓ ' : ''}${wb.name}`, onclick: () => { g.state.zone = z.id; this.go(wb.id, close); } }) : null));
        }
        body.append(card);
      }
    });
  }

  private go(id: string, close: () => void) {
    const g = host.game;
    const err = g.start('combat', id);
    if (err) { toast(err, 'bad'); return; }
    close();
    audio.sfx('ui_confirm');
    host.refresh();
    this.show();
  }

  // ---------- per frame ----------
  update() {
    const g = host.game;
    const rt = g.rt;
    if (this.key() !== this.lastKey) {
      const z = this.currentZone();
      if (z !== this.shownZone || host.game.state.heroes.length !== this.partySize) { this.show(); return; }
      this.renderInfo();
    }
    const fighting = g.state.activity?.type === 'combat' && !!rt;
    const zone = ZONE_MAP[this.shownZone];
    this.syncEnemies(fighting ? rt!.enemyDef.id : undefined);
    this.zoneTag.replaceChildren(h('b', { text: zone.name }), `Lv ${zone.levelRange[0]}–${zone.levelRange[1]}`);
    mount(this.killTag, h('span', { class: 'muted', text: 'Kills ' }), fmt(fighting ? rt!.kills : 0), rt?.boss ? h('div', { class: 'bad', text: 'BOSS' }) : null);
    this.heroEls.forEach((he, i) => {
      const f = rt?.heroes[i];
      if (!f || !fighting) {
        setBar(he.hp, 1); setBar(he.cd, 0); he.root.classList.remove('down'); he.stat.replaceChildren();
        return;
      }
      setBar(he.hp, f.hp / f.maxHp);
      setBar(he.cd, 1 - Math.max(0, f.abilityTimer) / heroDef(host.game.state, i).ability.cd);
      he.root.classList.toggle('down', !f.alive);
      this.syncStatuses(he, f);
    });
    if (!fighting) {
      if (this.shownEnemy !== '-') this.clearEnemy();
      return;
    }
    const e = rt!.enemy;
    const def = rt!.enemyDef;
    if (e && this.shownEnemy !== def.id) this.setEnemy(def, false);
    if (e) {
      this.enemyWrap.classList.remove('dead');
      setBar(this.enemyBar, e.hp / e.maxHp, `${fmt(Math.max(0, e.hp))} / ${fmt(e.maxHp)}`);
      const sig = e.statuses.filter((s) => s.left > 0).map((s) => s.status + s.stacks).join(',');
      if (sig !== this.enemySig) {
        this.enemySig = sig;
        this.enemyStat.replaceChildren(...e.statuses.filter((s) => s.left > 0).map((s) => statusBadge(s.status, s.stacks)));
      }
    } else if (this.shownEnemy) {
      this.enemyWrap.classList.add('dead');
    }
  }

  private syncEnemies(activeId?: string) {
    const s = host.game.state;
    const zone = ZONE_MAP[this.shownZone];
    const ids = [...zone.monsters, zone.elite, zone.boss];
    const sig = `${this.shownZone}|${activeId ?? ''}|${ids.map((id) => `${s.codex.monsters[id] ? 1 : 0}${s.kills[id] ?? 0}`).join(',')}`;
    if (sig === this.enemiesSig) return;
    this.enemiesSig = sig;
    this.enemies.replaceChildren(enemyList(this.shownZone, activeId));
  }

  private syncStatuses(he: { stat: HTMLElement; sig: string; root: HTMLElement }, f: Fighter) {
    const live = f.statuses.filter((s) => s.left > 0);
    const sig = live.map((s) => s.status + s.stacks).join(',') + (f.shield > 0 ? 's' : '');
    if (sig === he.sig) return;
    he.sig = sig;
    he.stat.replaceChildren(...live.slice(0, 3).map((s) => statusBadge(s.status, s.stacks)));
  }

  private clearEnemy() {
    this.shownEnemy = '-';
    this.enemyName.replaceChildren(h('span', { class: 'idletxt', text: 'Your party is resting' }));
    setBar(this.enemyBar, 0, '');
    this.enemyBar.style.visibility = 'hidden';
    this.enemyStat.replaceChildren();
    this.enemyBody.replaceChildren(h('div', { class: 'idletxt small center', style: 'align-self:center;margin:0 36px', text: 'Press Battle! to hunt monsters in this zone. Heroes keep fighting while you are away.' }));
  }

  private setEnemy(def: MonsterDef, _spawn: boolean) {
    this.shownEnemy = def.id;
    this.enemySig = '';
    this.enemyBar.style.visibility = 'visible';
    const boss = BOSSES[def.id];
    this.enemyName.replaceChildren(h('span', { style: `color:${def.boss ? '#ff9aa6' : def.elite ? '#ffd35a' : '#fff'}`, text: def.name }), h('em', { text: `Lv ${def.level}${boss ? ' · ' + boss.title : def.elite ? ' · Elite' : ''}` }));
    this.enemyBody.replaceChildren(monsterSprite(def));
    this.enemyWrap.classList.remove('dead');
    this.enemyWrap.classList.add('spawn');
    setTimeout(() => this.enemyWrap.classList.remove('spawn'), 320);
    if (def.boss) audio.playMusic('m_boss');
  }

  // ---------- events ----------
  event(e: GameEvent) {
    const g = host.game;
    const reduce = g.state.settings.reduceMotion;
    switch (e.t) {
      case 'dmg': {
        if (e.side === 'enemy') {
          if (!e.miss && !e.heal) {
            this.enemyWrap.classList.remove('hit');
            if (!reduce) { void this.enemyWrap.offsetWidth; this.enemyWrap.classList.add('hit'); }
            audio.sfx(e.crit ? 'hit_heavy' : 'hit', 0.6, e.crit ? 150 : 110);
          }
          this.floatNum(this.enemyBody, e, 50 + (Math.random() - 0.5) * 30);
        } else {
          const he = this.heroEls[e.idx];
          if (he) {
            if (!e.miss && !e.heal) {
              he.root.classList.remove('hit');
              if (!reduce) { void he.root.offsetWidth; he.root.classList.add('hit'); }
              const now = performance.now();
              if (now - this.lastHurt > 300) { this.lastHurt = now; audio.sfx('player_hurt', 0.5); buzz('light'); }
            }
            this.floatNum(he.root, e, 50);
          }
        }
        break;
      }
      case 'swing': if (!reduce) this.swing(e); break;
      case 'ability': {
        audio.sfx('cast', 0.8, 150);
        const he = this.heroEls[e.idx];
        if (he && !reduce) {
          he.root.classList.remove('cast'); void he.root.offsetWidth; he.root.classList.add('cast');
          this.floatText(he.root, e.name);
        } else if (e.idx < 0) this.banner(e.name, true);
        break;
      }
      case 'kill':
        audio.sfx(e.boss ? 'boss_death' : 'enemy_death', 0.7);
        break;
      case 'boss':
        if (e.first) { this.banner('Boss defeated!'); audio.sfx('quest_complete'); buzz('heavy'); }
        break;
      case 'wipe':
        this.banner(e.final ? 'Defeated' : 'Party down!', true);
        audio.sfx('player_death');
        break;
      case 'zone': this.banner('New zone unlocked!'); break;
      case 'item': this.tick(h('div', {}, ico(ITEMS[e.id]?.icon ?? 'img:ui_icon_gift', 'sm'), `+${fmt(e.n)} ${ITEMS[e.id]?.name ?? e.id}`)); break;
      case 'gear': {
        const r = rarity(e.inst.rarity);
        this.tick(h('div', {}, itemIcon(e.inst.id, e.inst, 'sm'), h('span', { style: `color:${r.color}`, text: `${r.name} ${ITEMS[e.inst.id].name}` })));
        if (e.inst.rarity >= 10) audio.sfx('loot_legendary'); else if (e.inst.rarity >= 4) audio.sfx('loot_rare', 0.7);
        break;
      }
      case 'gold': this.tick(h('div', { class: 'gold' }, '+', moneyEl(e.n))); break;
      case 'sold': this.tick(h('div', { class: 'muted' }, `Auto-sold ${e.n} for `, moneyEl(e.gold))); break;
      case 'heroLevel': toast(`${heroDef(g.state, e.idx).name} reached level ${e.level}`, 'good'); audio.sfx('level_up'); break;
      case 'food': audio.sfx('heal', 0.5); this.floatText(this.heroEls[e.idx]?.root ?? this.arena, 'Ate ' + (ITEMS[e.item]?.name ?? '')); break;
      default: break;
    }
  }

  /** Attack animation: the attacker lunges and a slash or projectile travels to the target. */
  private swing(e: Extract<GameEvent, { t: 'swing' }>) {
    if (this.fx.childElementCount > 20) return;
    const a = this.arena.getBoundingClientRect();
    const col = ELEMENT_MAP[e.elem]?.color ?? '#ffffff';
    const centre = (r: DOMRect, fy: number) => ({ x: r.left - a.left + r.width / 2, y: r.top - a.top + r.height * fy });
    const play = (el: HTMLElement, frames: Keyframe[], ms: number) => {
      this.fx.appendChild(el);
      const an = el.animate(frames, { duration: ms, easing: 'ease-out', fill: 'forwards' });
      an.onfinish = () => el.remove();
    };
    if (e.side === 'hero') {
      const he = this.heroEls[e.idx];
      if (!he) return;
      he.root.classList.remove('atk'); void he.root.offsetWidth; he.root.classList.add('atk');
      const from = centre(he.root.getBoundingClientRect(), 0.28);
      const to = centre(this.enemyBody.getBoundingClientRect(), 0.5);
      if (e.style === 'melee') {
        const s = h('div', { class: 'slashfx' });
        s.style.setProperty('--c', col);
        s.style.left = `${to.x - 35}px`; s.style.top = `${to.y - 35}px`;
        play(s, [{ transform: 'rotate(-60deg) scale(.4)', opacity: 0 }, { transform: 'rotate(10deg) scale(1.05)', opacity: 1, offset: 0.4 }, { transform: 'rotate(50deg) scale(1.2)', opacity: 0 }], 300);
      } else {
        const ang = Math.atan2(to.y - from.y, to.x - from.x);
        const p = h('div', { class: `proj ${e.style === 'ranged' ? 'arrow' : ''}` });
        p.style.setProperty('--c', e.style === 'ranged' ? '#f0e6c8' : col);
        p.style.left = `${from.x - 6}px`; p.style.top = `${from.y - 2}px`;
        const rot = e.style === 'ranged' ? ` rotate(${ang}rad)` : '';
        play(p, [{ transform: `translate(0,0)${rot} scale(.8)`, opacity: 1 }, { transform: `translate(${to.x - from.x}px,${to.y - from.y}px)${rot} scale(1.1)`, opacity: 1, offset: 0.85 }, { transform: `translate(${to.x - from.x}px,${to.y - from.y}px)${rot} scale(1.8)`, opacity: 0 }], 280);
      }
    } else {
      this.enemyWrap.classList.remove('foe'); void this.enemyWrap.offsetWidth; this.enemyWrap.classList.add('foe');
      const he = this.heroEls[e.idx];
      if (he) {
        const to = centre(he.root.getBoundingClientRect(), 0.4);
        const s = h('div', { class: 'slashfx foe' });
        s.style.setProperty('--c', col === '#ffffff' ? '#ff8a8a' : col);
        s.style.left = `${to.x - 30}px`; s.style.top = `${to.y - 30}px`;
        play(s, [{ transform: 'rotate(120deg) scale(.4)', opacity: 0 }, { transform: 'rotate(40deg) scale(1)', opacity: 1, offset: 0.4 }, { transform: 'rotate(-10deg) scale(1.1)', opacity: 0 }], 320);
      }
    }
  }

  private tick(row: HTMLElement) {
    if (!this.ticker) return;
    this.ticker.prepend(row);
    while (this.ticker.children.length > 6) this.ticker.lastElementChild?.remove();
  }

  private floatNum(parent: HTMLElement, e: Extract<GameEvent, { t: 'dmg' }>, leftPct: number) {
    if (this.fx.childElementCount > 24) return;
    const r = parent.getBoundingClientRect();
    const a = this.arena.getBoundingClientRect();
    const txt = e.text ?? (e.heal ? `+${fmt(e.n)}` : fmt(e.n));
    const cls = e.miss ? 'miss' : e.text ? 'text' : e.heal ? 'heal' : e.side === 'hero' ? 'hurt' : e.crit ? 'crit' : '';
    const n = h('div', { class: `num ${cls}`, text: e.crit && !e.heal ? `${txt}!` : txt });
    n.style.left = `${r.left - a.left + (r.width * leftPct) / 100}px`;
    n.style.top = `${r.top - a.top + Math.min(r.height * 0.3, 40) + (Math.random() - 0.5) * 14}px`;
    if (e.elem !== 'physical' && !e.heal && !e.miss && e.side === 'enemy' && !e.crit) n.style.color = '#ffd9a0';
    this.fx.appendChild(n);
    setTimeout(() => n.remove(), 950);
  }

  private floatText(parent: HTMLElement, text: string) {
    if (this.fx.childElementCount > 24) return;
    const r = parent.getBoundingClientRect();
    const a = this.arena.getBoundingClientRect();
    const n = h('div', { class: 'num text', text });
    n.style.left = `${r.left - a.left + r.width / 2}px`;
    n.style.top = `${r.top - a.top - 8}px`;
    this.fx.appendChild(n);
    setTimeout(() => n.remove(), 950);
  }

  private banner(text: string, bad = false) {
    const b = h('div', { class: `banner ${bad ? 'bad' : ''}`, text });
    this.arena.appendChild(b);
    setTimeout(() => b.remove(), 1850);
  }

  refreshLoadout() { this.renderLoadout(); }
}

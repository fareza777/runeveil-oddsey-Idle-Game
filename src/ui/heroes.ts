import { h, fmt, mount } from './dom';
import { bar, ico, itemIcon, spriteEl } from './icons';
import { openSheet, toast } from './modal';
import { SLOT_ICON, SLOT_NAME, SLOT_ORDER, buzz } from './common';
import { audio } from './audio';
import { host } from './host';
import { gearSheet } from './itemSheet';
import type { Screen } from './screen';
import { HEROES, ITEMS, ELEMENT_MAP, rarity } from '@/data';
import { computeHero, itemStats, partyPower } from '@/core/stats';
import { HERO_MAX_LEVEL, heroXpToNext } from '@/core/xp';
import type { Slot } from '@/core/types';

export class HeroesScreen implements Screen {
  el = h('div', { class: 'screen' });
  private idx = 0;

  show() {
    const g = host.game;
    const s = g.state;
    const hd = HEROES[this.idx];
    const hs = s.heroes[this.idx];
    const c = computeHero(s, this.idx);

    const tabs = h('div', { class: 'herotabs' }, ...HEROES.map((x, i) =>
      h('button', { class: i === this.idx ? 'on' : '', onclick: () => { this.idx = i; audio.sfx('ui_click'); this.show(); } },
        spriteEl(x.sprite, { zoom: 1, max: 44 }), h('i', { text: `Lv ${s.heroes[i].level}` }))));

    const need = heroXpToNext(hs.level);
    const header = h('div', { class: 'card' },
      h('div', { class: 'row', style: 'align-items:flex-end' },
        h('div', { style: `width:92px;height:128px;display:flex;align-items:flex-end;justify-content:center;background:radial-gradient(circle at 50% 80%, ${hd.color}33, transparent 70%);border-radius:10px` }, spriteEl(hd.sprite, { zoom: 1.7, max: 122 })),
        h('div', { class: 'grow col' },
          h('b', { style: `font-size:20px;font-family:var(--head);color:${hd.color}`, text: hd.name }),
          h('div', { class: 'small muted', text: `${hd.title} · ${hd.cls}` }),
          h('div', { class: 'row', style: 'flex-wrap:wrap;gap:4px' },
            h('span', { class: 'chip', text: hd.style }),
            h('span', { class: 'chip', style: `color:${ELEMENT_MAP[c.element].color}`, text: ELEMENT_MAP[c.element].name }),
            h('span', { class: 'chip gold', text: `Weapon: ${c.weaponKind}` })),
          h('div', { style: 'margin-top:4px' }, bar('xp tall', hs.level >= HERO_MAX_LEVEL ? 1 : hs.xp / need, hs.level >= HERO_MAX_LEVEL ? `Lv ${hs.level} MAX` : `Lv ${hs.level} · ${fmt(hs.xp)}/${fmt(need)}`)))),
      h('div', { class: 'small muted', style: 'margin-top:8px', text: hd.bio }),
      h('div', { class: 'ability' }, h('b', { text: `${hd.ability.name} ` }), `(every ${hd.ability.cd}s) — ${hd.ability.desc}`));

    const grid = h('div', { class: 'equipgrid' }, ...SLOT_ORDER.map((slot) => {
      const inst = hs.equip[slot];
      const box = inst ? itemIcon(inst.id, inst) : h('span', { class: 'slotbox empty' }, ico(SLOT_ICON[slot]));
      return h('div', { class: 'cell', onclick: () => { audio.sfx('ui_click'); this.slotSheet(slot); } }, box, h('span', { text: SLOT_NAME[slot] }));
    }));

    const best = h('button', { class: 'btn green block', style: 'margin-top:10px', text: 'Auto-equip best gear', onclick: () => {
      const n = g.autoEquipBest(this.idx);
      toast(n ? `Equipped ${n} better item${n > 1 ? 's' : ''}` : 'Already wearing your best gear', n ? 'good' : 'info');
      if (n) { audio.sfx('pickup'); buzz(); }
      this.show(); host.refresh();
    } });

    const stat = (label: string, v: string) => h('div', { class: 'statline' }, h('span', { text: label }), h('b', { text: v }));
    const stats = h('div', { class: 'card' },
      stat('Attack', fmt(c.atk)), stat('Defense', fmt(c.def)), stat('Max HP', fmt(c.maxHp)),
      stat('Attack time', `${c.interval.toFixed(2)}s`), stat('Crit chance', `${c.crit.toFixed(1)}%`), stat('Crit damage', `${Math.round(c.critDmg)}%`),
      stat('Haste', `${c.haste.toFixed(1)}%`), stat('Evasion', `${c.eva.toFixed(1)}%`), stat('Life leech', `${c.leech.toFixed(1)}%`),
      stat('HP regen', `${c.regen.toFixed(1)}/s`), stat('Luck', `${c.luck.toFixed(1)}%`), stat('Elemental resist', `${c.res.toFixed(1)}%`));

    mount(this.el, tabs, header,
      h('div', { class: 'list-hd' }, h('h2', { text: 'Equipment' }), h('span', { class: 'chip gold', text: `Party power ${fmt(partyPower(s))}` })),
      h('div', { class: 'card' }, grid), best,
      h('h2', { text: 'Stats' }), stats);
  }

  update() { /* static between actions */ }

  private slotSheet(slot: Slot) {
    const g = host.game;
    const s = g.state;
    const idx = this.idx;
    openSheet(`${SLOT_NAME[slot]} · ${HEROES[idx].name}`, (body, close) => {
      const cur = s.heroes[idx].equip[slot];
      if (cur) {
        const r = rarity(cur.rarity);
        body.append(h('div', { class: 'small muted', text: 'Equipped' }),
          h('div', { class: 'card tap item active', onclick: () => { close(); gearSheet(cur.uid, { heroIdx: idx, equipped: true, onChange: () => this.show() }); } }, itemIcon(cur.id, cur),
            h('div', { class: 'meta' }, h('b', { style: `color:${r.color}`, text: ITEMS[cur.id].name }), h('span', { text: `${r.name} · tier ${ITEMS[cur.id].tier}` }))));
      }
      const cands = s.gear.filter((x) => ITEMS[x.id].slot === slot).sort((a, b) => g.gearScore(b) - g.gearScore(a));
      body.append(h('div', { class: 'small muted', style: 'margin:8px 0 4px', text: `In bag (${cands.length})` }));
      if (!cands.length) body.append(h('div', { class: 'empty', text: `No ${SLOT_NAME[slot].toLowerCase()} items in your bag. Defeat monsters or craft some.` }));
      const curScore = cur ? g.gearScore(cur) : 0;
      for (const inst of cands.slice(0, 60)) {
        const r = rarity(inst.rarity);
        const fit = g.fitsHero(idx, inst);
        const diff = g.gearScore(inst) - curScore;
        const st = itemStats(inst);
        body.append(h('div', { class: 'card item', style: 'padding:8px' },
          h('div', { onclick: () => gearSheet(inst.uid, { heroIdx: idx, onChange: () => { this.show(); } }) }, itemIcon(inst.id, inst)),
          h('div', { class: 'meta' }, h('b', { style: `color:${r.color}`, text: ITEMS[inst.id].name }),
            h('span', { text: Object.entries(st).slice(0, 3).map(([k, v]) => `${k} ${Math.round((v as number) * 10) / 10}`).join(' · ') + (fit ? '' : ' · wrong style') })),
          h('button', { class: `btn sm ${diff > 0 && fit ? 'green' : 'ghost'}`, text: diff > 0 ? `▲ ${fmt(diff)}` : diff < 0 ? `▼ ${fmt(-diff)}` : 'Equip', onclick: () => {
            g.equip(idx, inst.uid); audio.sfx('pickup'); buzz(); close(); this.show(); host.refresh();
          } })));
      }
    });
  }
}

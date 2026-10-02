import { h, fmt, mount } from './dom';
import { bar, ico, itemIcon, spriteEl } from './icons';
import { openSheet, toast } from './modal';
import { SLOT_ICON, SLOT_NAME, SLOT_ORDER, buzz, goldChip } from './common';
import { audio } from './audio';
import { host } from './host';
import { gearSheet } from './itemSheet';
import type { Screen } from './screen';
import { HEROES, HERO_MAP, HERO_ABILITY2_LEVEL, ITEMS, ELEMENT_MAP, rarity } from '@/data';
import { computeHeroFor, itemStats, partyPower } from '@/core/stats';
import { HERO_MAX_LEVEL, heroXpToNext } from '@/core/xp';
import { BAL, hallCost } from '@/core/balance';
import { PARTY_MAX, heroDef, ownsHero } from '@/core/state';
import type { Slot } from '@/core/types';

export class HeroesScreen implements Screen {
  el = h('div', { class: 'screen' });
  private idx = 0;
  /** index into the bench when a resting hero is selected, otherwise -1 */
  private benchIdx = -1;
  private lockedId: string | null = null;

  show() {
    const g = host.game;
    const s = g.state;
    if (this.idx >= s.heroes.length) this.idx = 0;
    if (this.benchIdx >= s.bench.length) this.benchIdx = -1;

    const tabs = h('div', { class: 'herotabs' });
    s.heroes.forEach((hs, i) => {
      const x = heroDef(s, i);
      tabs.append(h('button', { class: i === this.idx && !this.lockedId && this.benchIdx < 0 ? 'on' : '', onclick: () => { this.idx = i; this.benchIdx = -1; this.lockedId = null; audio.sfx('ui_click'); this.show(); } },
        spriteEl(x.sprite, { zoom: 1, max: 44 }), h('i', { text: `Lv ${hs.level}` })));
    });
    s.bench.forEach((hs, i) => {
      const x = HERO_MAP[hs.id];
      tabs.append(h('button', { class: `bench ${i === this.benchIdx && !this.lockedId ? 'on' : ''}`, onclick: () => { this.benchIdx = i; this.lockedId = null; audio.sfx('ui_click'); this.show(); } },
        spriteEl(x.sprite, { zoom: 1, max: 44 }), h('i', { text: `Lv ${hs.level}` })));
    });
    for (const x of HEROES) {
      if (ownsHero(s, x.id)) continue;
      const sil = spriteEl(x.sprite, { zoom: 1, max: 44, cls: 'silhouette' });
      tabs.append(h('button', { class: `locked ${this.lockedId === x.id ? 'on' : ''}`, onclick: () => { this.lockedId = x.id; audio.sfx('ui_click'); this.show(); } }, sil, h('i', { text: '🔒' })));
    }

    if (this.lockedId) { this.showLocked(tabs); return; }

    const resting = this.benchIdx >= 0;
    const hs = resting ? s.bench[this.benchIdx] : s.heroes[this.idx];
    const hd = HERO_MAP[hs.id];
    const c = computeHeroFor(s, hs);
    const need = heroXpToNext(hs.level);
    const a2 = hs.level >= HERO_ABILITY2_LEVEL;
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
      h('div', { class: 'ability' }, h('b', { text: `${hd.ability.name} ` }), `(every ${hd.ability.cd}s) — ${hd.ability.desc}`),
      h('div', { class: `ability ${a2 ? '' : 'off'}` }, h('b', { text: `${hd.ability2.name} ` }),
        a2 ? `(every ${hd.ability2.cd}s) — ${hd.ability2.desc}` : `Unlocks at hero level ${HERO_ABILITY2_LEVEL}. ${hd.ability2.desc}`),
      h('div', { class: 'ability' }, h('b', { text: `Passive · ${hd.passive.name} ` }), hd.passive.desc));

    const grid = h('div', { class: 'equipgrid' }, ...SLOT_ORDER.map((slot) => {
      const inst = hs.equip[slot];
      const box = inst ? itemIcon(inst.id, inst) : h('span', { class: 'slotbox empty' }, ico(SLOT_ICON[slot]));
      return h('div', { class: 'cell', onclick: () => {
        audio.sfx('ui_click');
        if (!resting) this.slotSheet(slot);
        else if (inst) gearSheet(inst.uid, { equipped: true, onChange: () => this.show() });
        else toast('Bring this hero into the active party to change gear', 'info');
      } }, box, h('span', { text: SLOT_NAME[slot] }));
    }));

    const partyCard = h('div', { class: 'card' },
      h('div', { class: 'row' }, h('b', { class: 'grow', text: `Active party ${s.heroes.length}/${PARTY_MAX}` }), h('span', { class: 'chip', text: `Roster ${s.heroes.length + s.bench.length}/${HEROES.length}` })),
      h('div', { class: 'tiny muted', style: 'margin:4px 0 8px', text: `Only the active party fights and earns experience. Recruited heroes beyond ${PARTY_MAX} rest on the bench and can be swapped in any time.` }),
      resting
        ? h('button', { class: 'btn green block', text: s.heroes.length < PARTY_MAX ? 'Join the active party' : 'Swap into the party...', onclick: () => {
          if (s.heroes.length < PARTY_MAX) { g.swapHero(-1, this.benchIdx); this.idx = s.heroes.length - 1; this.benchIdx = -1; audio.sfx('pickup'); this.show(); host.refresh(); } else this.swapSheet();
        } })
        : h('button', { class: `btn ghost block ${s.heroes.length <= 1 ? 'off' : ''}`, text: 'Rest on the bench', onclick: () => {
          if (g.benchHeroAt(this.idx)) { this.idx = 0; audio.sfx('ui_click'); this.show(); host.refresh(); } else toast('At least one hero must stay in the party', 'bad');
        } }));

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

    const rank = s.hall[hd.id] ?? 0;
    const canTrain = !resting;
    const maxed = rank >= BAL.hallMaxRank;
    const cost = hallCost(rank);
    const hall = h('div', { class: 'card' },
      h('div', { class: 'row' }, h('b', { class: 'grow', text: `Training Hall · rank ${rank}/${BAL.hallMaxRank}` }), h('span', { class: 'chip gold', text: `+${rank * BAL.hallPctPerRank}% atk & HP` })),
      h('div', { class: 'tiny muted', style: 'margin:4px 0 8px', text: `Each rank grants +${BAL.hallPctPerRank}% attack and max HP to ${hd.name.split(' ')[0]}.` }),
      h('div', { class: 'row' }, maxed ? h('span', { class: 'chip good', text: 'Fully trained' }) : goldChip(s.gold, cost), h('span', { class: 'grow' }),
        h('button', { class: `btn sm gold ${maxed || s.gold < cost || !canTrain ? 'off' : ''}`, text: maxed ? 'MAX' : canTrain ? 'Train' : 'Bench', onclick: () => {
          if (!canTrain) { toast('Bring this hero into the active party to train', 'info'); return; }
          const err = g.trainHero(this.idx);
          if (err) { toast(err, 'bad'); return; }
          audio.sfx('upgrade'); buzz('medium'); this.show(); host.refresh();
        } })));

    mount(this.el, tabs, header, partyCard,
      h('div', { class: 'list-hd' }, h('h2', { text: 'Equipment' }), h('span', { class: 'chip gold', text: `Party power ${fmt(partyPower(s))}` })),
      h('div', { class: 'card' }, grid), resting ? h('div', { class: 'tiny muted center', text: 'Resting heroes keep their gear.' }) : best,
      h('h2', { text: 'Training' }), hall,
      h('h2', { text: 'Stats' }), stats);
  }

  private showLocked(tabs: HTMLElement) {
    const x = HEROES.find((hd) => hd.id === this.lockedId)!;
    const kind = x.recruit.kind === 'side' ? 'Side quest hero' : 'Story hero';
    const hint = x.recruit.kind === 'start' ? '' : x.recruit.hint;
    mount(this.el, tabs,
      h('div', { class: 'card center' },
        h('div', { style: 'height:132px;display:flex;align-items:flex-end;justify-content:center' }, spriteEl(x.sprite, { zoom: 1.7, max: 122, cls: 'silhouette' })),
        h('b', { style: 'font-size:20px;font-family:var(--head);color:var(--gold)', text: '???' }),
        h('div', { class: 'small muted', text: `${x.cls} · ${x.style}` }),
        h('span', { class: `chip ${x.recruit.kind === 'side' ? 'bad' : 'gold'}`, style: 'margin-top:6px', text: kind }),
        h('p', { class: 'small', style: 'line-height:1.45;margin:10px 4px 2px', text: hint })));
  }

  update() { /* static between actions */ }

  private swapSheet() {
    const g = host.game;
    const s = g.state;
    openSheet('Swap into the party', (body, close) => {
      body.append(h('div', { class: 'small muted', style: 'margin-bottom:6px', text: `Who rests so ${HERO_MAP[s.bench[this.benchIdx].id].name} can fight?` }));
      s.heroes.forEach((hs, i) => {
        const x = HERO_MAP[hs.id];
        body.append(h('div', { class: 'card tap item', onclick: () => {
          if (g.swapHero(i, this.benchIdx)) { this.idx = i; this.benchIdx = -1; audio.sfx('pickup'); buzz(); close(); this.show(); host.refresh(); }
        } }, spriteEl(x.sprite, { zoom: 1, max: 44 }), h('div', { class: 'meta' }, h('b', { text: x.name }), h('span', { text: `Lv ${hs.level} · ${x.cls}` }))));
      });
    });
  }

  private slotSheet(slot: Slot) {
    const g = host.game;
    const s = g.state;
    const idx = this.idx;
    openSheet(`${SLOT_NAME[slot]} · ${heroDef(s, idx).name}`, (body, close) => {
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

import { h, fmt } from './dom';
import { cardEl, GRADE_COLOR } from './icons';
import { openSheet, toast } from './modal';
import { audio } from './audio';
import { host } from './host';
import { ITEMS, MONSTERS, ZONES, CARD_IDS, GRADE_NAME, KIND_NAME, describeFx } from '@/data';
import type { ItemInstance } from '@/core/types';

const pct = (p: number): string => {
  const v = p * 100;
  return `${v < 0.001 ? v.toExponential(1) : v.toFixed(v < 0.01 ? 4 : 3).replace(/0+$/, '').replace(/\.$/, '')}%`;
};

/** Effects, source and drop chance for one card. */
export function cardSheetBody(id: string): HTMLElement {
  const def = ITEMS[id];
  const c = def.card!;
  const m = MONSTERS[c.monster];
  const drop = m?.drops.find((d) => d.item === id);
  return h('div', {},
    h('div', { class: 'row', style: 'flex-wrap:wrap;gap:4px;margin-bottom:6px' },
      h('span', { class: 'chip', style: `color:${GRADE_COLOR[c.grade]}`, text: GRADE_NAME[c.grade] }),
      h('span', { class: 'chip gold', text: `${KIND_NAME[c.kind]} gear` })),
    h('div', { class: 'card' }, ...describeFx(c.fx).map((l) => h('div', { class: 'statline' }, h('span', { text: l })))),
    h('p', { class: 'tiny muted', style: 'margin-top:6px', text: `Dropped by ${m?.name ?? c.monster}${m ? ` in ${ZONES[m.zone - 1]?.name}` : ''}. ${drop ? `Drop chance ${pct(drop.chance)} per defeat.` : ''} Socket it into ${c.kind} gear from the gear sheet.` }));
}

export function pickCardSheet(inst: ItemInstance, done: () => void) {
  const g = host.game;
  openSheet('Socket a card', (body, close) => {
    const ids = g.cardsFor(inst).filter((id) => !(inst.cards ?? []).includes(ITEMS[id].card!.monster));
    if (!ids.length) {
      body.append(h('div', { class: 'empty', text: 'No matching cards in your bag. Monster cards drop very rarely from any monster; each fits weapons, armor or trinkets.' }));
      return;
    }
    ids.sort((a, b) => ITEMS[b].card!.grade - ITEMS[a].card!.grade);
    for (const id of ids) {
      const d = ITEMS[id];
      body.append(h('div', { class: 'card tap item', onclick: () => {
        const err = g.socketCard(inst.uid, id);
        if (err) { toast(err, 'bad'); return; }
        audio.sfx('upgrade'); close(); done();
      } }, cardEl(id, 'sm'),
      h('div', { class: 'meta' }, h('b', { text: d.name.replace(' Card', '') }), h('span', { text: describeFx(d.card!.fx).slice(0, 3).join(' · ') })),
      h('span', { class: 'chip', text: `x${fmt(g.state.stacks[id])}` })));
    }
  });
}

export function albumSheet() {
  const g = host.game;
  const s = g.state;
  let zone = 1;
  openSheet('Card album', (body) => {
    const render = () => {
      const found = Object.keys(s.cardsFound).length;
      const tabs = h('div', { class: 'row', style: 'flex-wrap:nowrap;overflow-x:auto;gap:5px;margin:6px 0;scrollbar-width:none' },
        ...ZONES.map((z) => h('button', { class: `chip ${z.id === zone ? 'gold' : ''}`, text: String(z.id), onclick: () => { zone = z.id; render(); } })));
      const list = CARD_IDS.filter((id) => MONSTERS[ITEMS[id].card!.monster].zone === zone);
      const grid = h('div', { class: 'grid bag' }, ...list.map((id) => {
        const owned = !!s.cardsFound[id];
        const el = cardEl(id);
        if (!owned) el.style.filter = 'brightness(0) opacity(.5)';
        if (s.stacks[id]) el.append(h('i', { class: 'qty', text: fmt(s.stacks[id]) }));
        el.addEventListener('click', () => {
          const d = ITEMS[id];
          if (!owned) { toast(`Not found yet: ${MONSTERS[d.card!.monster].name}`, 'info'); return; }
          openSheet(d.name, (b) => b.append(h('div', { class: 'item' }, cardEl(id, 'lg'), h('div', { class: 'meta' }, h('b', { text: d.name }), h('span', { text: ZONES[zone - 1].name }))), cardSheetBody(id)));
        });
        return el;
      }));
      body.replaceChildren(h('div', { class: 'small muted', text: `${found}/${CARD_IDS.length} cards discovered.` }), tabs, grid);
    };
    render();
  });
}

import { h } from './dom';
import { cardEl, itemIcon, monsterSprite } from './icons';
import { openSheet, toast } from './modal';
import { audio } from './audio';
import { danger, goldChip, readiness } from './common';
import { host } from './host';
import { watchAd } from './rewards';
import { BOSSES, ITEMS, ZONE_MAP, rarity } from '@/data';
import { MERCHANT_EXTEND_MAX, MERCHANT_EXTEND_MIN, UNIQUE_IDS, merchantStock, rareLeft, rareMax } from '@/core/daily';
import { describeFx } from '@/data/cards';

const hhmm = (min: number): string => {
  const m = Math.round(((min % 1440) + 1440) % 1440);
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};
const span = (min: number): string => {
  const m = Math.max(0, Math.ceil(min));
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
};

/** Daily named enemies: rare ones twice a day, legendary ones once. */
export function huntsSheet(onStart?: () => void) {
  const g = host.game;
  openSheet('Daily hunts', (body, close) => {
    body.append(h('p', { class: 'small muted', style: 'line-height:1.45', text: 'Named enemies stalk the land. Each can be fought a limited number of times per day (resets at local midnight). They hit far harder than bosses, so bring your best gear and cards.' }));
    for (const id of UNIQUE_IDS) {
      const b = BOSSES[id];
      const z = ZONE_MAP[b.zone];
      const err = g.canEnterZone(b.zone);
      const left = rareLeft(g.state, id);
      const r = readiness(g.state, b.zone);
      const d = danger(r * 0.55);
      const u = b.unique ? ITEMS[b.unique] : undefined;
      const card = ITEMS[`card_${id}`];
      body.append(h('div', { class: `card ${err ? 'locked' : ''}`, style: 'padding:8px' },
        h('div', { class: 'row', style: 'gap:8px;align-items:flex-start' },
          h('div', { class: 'slotbox', style: 'width:64px;height:64px;overflow:hidden;align-items:end' }, monsterSprite(b, 1.3, 60)),
          h('div', { class: 'grow', style: 'min-width:0' },
            h('b', { style: `color:${b.rare === 'legendary' ? '#ff9a4d' : '#c78bff'}`, text: b.name }),
            h('div', { class: 'tiny muted', text: `${b.title} · ${z.name} · Lv ${b.level}` }),
            h('div', { class: 'row', style: 'gap:4px;flex-wrap:wrap;margin-top:3px' },
              h('span', { class: 'chip', style: `color:${b.rare === 'legendary' ? '#ff9a4d' : '#c78bff'}`, text: b.rare === 'legendary' ? 'Legendary · 1/day' : 'Rare · 2/day' }),
              err ? null : h('span', { class: `chip ${d.cls}`, text: d.label }),
              h('span', { class: 'chip', text: `${left}/${rareMax(id)} left` })))),
        u ? h('div', { class: 'row tiny', style: 'margin-top:6px;gap:6px' }, itemIcon(u.id, undefined, 'sm'), h('span', { class: 'gold', text: `${u.name} · 35% per kill, guaranteed the first time` })) : null,
        card?.card ? h('div', { class: 'row tiny muted', style: 'margin-top:4px;gap:6px' }, cardEl(card.id, 'sm'), h('span', { text: `${card.name}: ${describeFx(card.card.fx).slice(0, 2).join(' · ')}` })) : null,
        h('button', { class: `btn sm red block ${err || left <= 0 ? 'off' : ''}`, style: 'margin-top:8px', text: err ?? (left <= 0 ? 'Returns tomorrow' : 'Hunt'), onclick: () => {
          if (err || left <= 0) { toast(err ?? 'Returns tomorrow', 'info'); return; }
          const e2 = g.start('combat', id);
          if (e2) { toast(e2, 'bad'); return; }
          g.state.zone = b.zone;
          audio.sfx('ui_confirm'); close(); host.refresh(); onStart?.();
        } })));
    }
  });
}

/** The wandering merchant: one hour a day, a rotating stock of unique and high-rarity goods. */
export function merchantSheet(onChange?: () => void) {
  const g = host.game;
  openSheet('Wandering merchant', (body) => {
    const render = () => {
      if (!body.isConnected) return;
      const m = g.merchant();
      const s = g.state;
      body.replaceChildren();
      body.append(h('div', { class: 'merchant-hd' },
        h('img', { src: `${import.meta.env.BASE_URL}assets/gen/art/merchant.png`, alt: '' }),
        h('div', { class: 'grow' },
          h('b', { text: 'Old Tamsin, Road-Without-End' }),
          h('div', { class: 'small muted', style: 'line-height:1.4', text: m.open ? `"Quickly now, I do not stay." Leaves in ${span(m.endsIn)}.` : m.startsIn > 0 ? `Arrives at ${hhmm(m.start)} (in ${span(m.startsIn)}).` : 'Gone for today. She returns tomorrow.' }))));
      if (m.open) {
        const used = Math.round(s.merchant.extraMin / MERCHANT_EXTEND_MIN);
        if (used < MERCHANT_EXTEND_MAX) {
          body.append(h('button', { class: 'btn sm gold block', style: 'margin-top:8px', text: `Ask her to stay ${MERCHANT_EXTEND_MIN} minutes longer (watch ad)`, onclick: async () => {
            if (!(await watchAd())) return;
            if (g.extendMerchant()) { toast(`She will stay ${MERCHANT_EXTEND_MIN} minutes longer`, 'good'); audio.sfx('quest_complete'); }
            render();
          } }));
        }
        for (const e of merchantStock(s)) {
          const def = ITEMS[e.id];
          const sold = s.merchant.bought.includes(e.key);
          const r = rarity(e.rarity);
          const icon = e.kind === 'gear' ? itemIcon(e.id, { uid: e.key, id: e.id, rarity: e.rarity, up: 0 }) : itemIcon(e.id);
          body.append(h('div', { class: 'card item', style: `padding:8px;${sold ? 'opacity:.45' : ''}` }, icon,
            h('div', { class: 'meta' },
              h('b', { style: e.kind === 'gear' ? `color:${r.color}` : '', text: def.name }),
              h('span', { text: e.kind === 'gear' ? `${r.name} · tier ${def.tier}${e.unique ? ' · unique' : ''}` : e.kind === 'card' ? 'Monster card' : 'Scroll' })),
            sold ? h('span', { class: 'chip', text: 'Sold' }) : h('div', { class: 'col', style: 'align-items:flex-end;gap:4px' }, goldChip(s.gold, e.price),
              h('button', { class: `btn sm gold ${s.gold < e.price ? 'off' : ''}`, text: 'Buy', onclick: () => {
                const err = g.buyFromMerchant(e.key);
                if (err) { toast(err, 'bad'); return; }
                audio.sfx('coin'); toast(`Bought ${def.name}`, 'good'); host.refresh(); onChange?.(); render();
              } }))));
        }
        body.append(h('div', { class: 'tiny muted center', style: 'margin-top:6px', text: 'Stock is the same until midnight. Prices are in coin.' }));
      } else {
        body.append(h('div', { class: 'empty', text: m.startsIn > 0
          ? `The merchant visits once a day, for about an hour, at a different time each day (between 08:00 and 21:00). She sells unique gear, high-rarity gear, scrolls and monster cards. Today she arrives at ${hhmm(m.start)}.`
          : 'You missed her today. Her visit time changes every day, so check back tomorrow.' }));
      }
    };
    render();
    let lastOpen = g.merchant().open;
    const iv = setInterval(() => {
      if (!body.isConnected) { clearInterval(iv); return; }
      const o = g.merchant().open;
      if (o !== lastOpen) { lastOpen = o; render(); }
    }, 5000);
  });
}

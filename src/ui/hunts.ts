import { h } from './dom';
import { cardEl, itemIcon, monsterSprite } from './icons';
import { openSheet, toast } from './modal';
import { audio } from './audio';
import { danger, goldChip, readiness } from './common';
import { host } from './host';
import { watchAd } from './rewards';
import { BOSSES, ITEMS, ZONE_MAP, rarity } from '@/data';
import { MERCHANT_EXTEND_MAX, MERCHANT_EXTEND_MIN, UNIQUE_IDS, merchantStock } from '@/core/daily';
import { describeFx } from '@/data/cards';

const hhmm = (min: number): string => {
  const m = Math.round(((min % 1440) + 1440) % 1440);
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};
const span = (min: number): string => {
  const m = Math.max(0, Math.ceil(min));
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
};

/** The day's named enemy: one of twelve, picked at random, fightable for a single hour. */
export function huntsSheet(onStart?: () => void) {
  const g = host.game;
  openSheet('Daily hunt', (body, close) => {
    const render = () => {
      if (!body.isConnected) return;
      const s = g.state;
      const hu = g.hunt();
      const b = BOSSES[hu.id];
      const z = ZONE_MAP[b.zone];
      const err = g.canEnterZone(b.zone);
      const legend = b.rare === 'legendary';
      const col = legend ? '#ff9a4d' : '#c78bff';
      const u = b.unique ? ITEMS[b.unique] : undefined;
      const card = ITEMS[`card_${hu.id}`];
      const r = readiness(s, b.zone);
      const d = danger(r * 0.55);
      body.replaceChildren();
      body.append(h('p', { class: 'small muted', style: 'line-height:1.45', text: 'Each day one named enemy, chosen at random from twelve, walks the land. It can only be fought for one hour, at a different time every day. It hits far harder than any boss, so bring your best gear and cards.' }));
      const status = hu.open ? `Here now. Slips away in ${span(hu.endsIn)}.` : hu.startsIn > 0 ? `Appears at ${hhmm(hu.start)} (in ${span(hu.startsIn)}) and stays until ${hhmm(hu.end)}.` : `It has gone for today (it was here ${hhmm(hu.start)}-${hhmm(hu.end)}).`;
      body.append(h('div', { class: `card hunt-card ${hu.open ? 'live' : ''}`, style: 'padding:10px' },
        h('div', { class: 'row', style: 'gap:10px;align-items:flex-start' },
          h('div', { class: `slotbox hunt-pic ${hu.open ? '' : 'dim'}`, style: 'width:88px;height:88px;overflow:hidden;align-items:end' }, monsterSprite(b, 1.6, 82)),
          h('div', { class: 'grow', style: 'min-width:0' },
            h('b', { style: `color:${col};font-size:16px`, text: b.name }),
            h('div', { class: 'tiny muted', text: `${b.title} · ${z.name} · Lv ${b.level}` }),
            h('div', { class: 'row', style: 'gap:4px;flex-wrap:wrap;margin-top:4px' },
              h('span', { class: 'chip', style: `color:${col}`, text: legend ? 'Legendary' : 'Rare' }),
              hu.open ? h('span', { class: 'chip live-chip', text: 'LIVE' }) : null,
              err || !hu.open ? null : h('span', { class: `chip ${d.cls}`, text: d.label }),
              hu.kills ? h('span', { class: 'chip', text: `Felled ${hu.kills}x today` }) : null))),
        h('div', { class: 'small', style: `margin-top:8px;color:${hu.open ? '#8be39a' : 'var(--muted)'}`, text: status }),
        u ? h('div', { class: 'row tiny', style: 'margin-top:6px;gap:6px' }, itemIcon(u.id, undefined, 'sm'), h('span', { class: 'gold', text: `${u.name} · 35% per kill, guaranteed the first time` })) : null,
        card?.card ? h('div', { class: 'row tiny muted', style: 'margin-top:4px;gap:6px' }, cardEl(card.id, 'sm'), h('span', { text: `${card.name}: ${describeFx(card.card.fx).slice(0, 2).join(' · ')}` })) : null,
        h('button', { class: `btn sm red block ${err || !hu.open ? 'off' : ''}`, style: 'margin-top:8px', text: err ?? (hu.open ? 'Hunt now' : hu.startsIn > 0 ? `Appears at ${hhmm(hu.start)}` : 'Gone until tomorrow'), onclick: () => {
          if (err || !hu.open) { toast(err ?? (hu.startsIn > 0 ? `Appears at ${hhmm(hu.start)}` : 'Gone until tomorrow'), 'info'); return; }
          const e2 = g.start('combat', hu.id);
          if (e2) { toast(e2, 'bad'); return; }
          s.zone = b.zone;
          audio.sfx('ui_confirm'); close(); host.refresh(); onStart?.();
        } })));
      body.append(h('div', { class: 'tiny muted', style: 'margin:10px 0 4px', text: 'The twelve who may come' }));
      body.append(h('div', { class: 'row', style: 'flex-wrap:wrap;gap:6px' }, ...UNIQUE_IDS.map((id) => {
        const x = BOSSES[id];
        return h('div', { class: `slotbox sm ${id === hu.id ? 'hi' : ''}`, title: x.name, style: `overflow:hidden;align-items:end;${id === hu.id ? '' : 'opacity:.55'}` }, monsterSprite(x, 0.6, 34));
      })));
    };
    render();
    let last = g.hunt().open;
    const iv = setInterval(() => {
      if (!body.isConnected) { clearInterval(iv); return; }
      const o = g.hunt().open;
      if (o !== last) { last = o; render(); }
    }, 5000);
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

import { add, h, fmt } from './dom';
import { cardEl, ico, monsterSprite } from './icons';
import { openSheet } from './modal';
import { moneyText } from './common';
import { host } from './host';
import { BOSSES, ITEMS, MONSTERS, ZONE_MAP } from '@/data';

const pct = (c: number): string => {
  const v = c * 100;
  if (v >= 1) return `${Math.round(v * 10) / 10}%`;
  if (v >= 0.01) return `${v.toFixed(2)}%`;
  return `${v.toFixed(5).replace(/0+$/, '')}%`;
};

/** Full detail sheet for one monster, boss or elite. */
export function monsterSheet(id: string) {
  const s = host.game.state;
  const m = MONSTERS[id];
  const b = BOSSES[id];
  openSheet(m.name, (body) => {
    add(body,
      h('div', { class: 'center', style: 'min-height:120px;display:flex;align-items:flex-end;justify-content:center;margin-bottom:8px' }, monsterSprite(m, 2.4)),
      h('div', { class: 'row', style: 'flex-wrap:wrap;gap:4px;justify-content:center' },
        h('span', { class: 'chip', text: `Lv ${m.level}` }),
        m.boss ? h('span', { class: 'chip bad', text: 'Boss' }) : m.elite ? h('span', { class: 'chip gold', text: 'Elite' }) : null,
        h('span', { class: 'chip', text: m.element }),
        m.weak ? h('span', { class: 'chip good', text: `weak: ${m.weak}` }) : null,
        m.resist ? h('span', { class: 'chip bad', text: `resists: ${m.resist}` }) : null,
        m.inflicts ? h('span', { class: 'chip gold', text: `inflicts ${m.inflicts.status}` }) : null,
        h('span', { class: 'chip', text: `defeated ${fmt(s.kills[id] ?? 0)}` })),
      b ? h('p', { class: 'small muted', style: 'line-height:1.4', text: `${b.title}. ${b.lore}` }) : null,
      b ? h('div', { class: 'ability' }, ...b.abilities.map((a) => h('div', {}, h('b', { text: a.name + ' ' }), `every ${a.every}s · ${a.kind}`))) : null,
      h('div', { class: 'small muted', style: 'margin-top:8px', text: `Reward per kill: ${moneyText(m.gold[0])}–${moneyText(m.gold[1])} · ${fmt(m.xp)} hero XP` }),
      h('h3', { text: 'Drops' }),
      h('div', { class: 'row', style: 'flex-wrap:wrap;gap:4px' }, ...m.drops.filter((d) => ITEMS[d.item]).map((d) =>
        h('span', { class: 'cost' }, ITEMS[d.item].kind === 'card' ? cardEl(d.item, 'sm') : ico(ITEMS[d.item].icon), `${ITEMS[d.item].name} ${pct(d.chance)}`))),
      b?.unique && ITEMS[b.unique] ? h('p', { class: 'small gold', style: 'margin-top:8px', text: `Unique: ${ITEMS[b.unique].name} (first kill, then ${b.rare ? '35' : '8'}% per kill)` }) : null);
  });
}

/** Compact list of every enemy found in a zone. Unmet enemies stay hidden. */
export function enemyList(zoneId: number, activeId?: string): HTMLElement {
  const s = host.game.state;
  const zone = ZONE_MAP[zoneId];
  const ids = [...zone.monsters, zone.elite, zone.boss];
  const met = ids.filter((id) => s.codex.monsters[id]).length;
  const rows = ids.map((id) => {
    const m = MONSTERS[id];
    const known = !!s.codex.monsters[id];
    const kills = s.kills[id] ?? 0;
    const tag = m.boss ? 'Boss' : m.elite ? 'Elite' : '';
    const thumb = h('div', { class: `slotbox sm ${known ? '' : 'empty'}`, style: 'overflow:hidden;flex:none' },
      known ? monsterSprite(m, 1) : h('span', { class: 'muted', text: '?' }));
    const img = thumb.querySelector('img') as HTMLElement | null;
    if (img) { img.style.maxHeight = '85%'; img.style.height = 'auto'; img.style.maxWidth = '85%'; }
    const top = known ? [...m.drops].filter((d) => ITEMS[d.item] && ITEMS[d.item].kind !== 'card').sort((a, b) => a.chance - b.chance)[0] : undefined;
    return h('div', { class: `card tap row ${id === activeId ? 'active' : ''}`, style: 'margin:0 0 6px;padding:6px 8px;gap:8px', onclick: () => known && monsterSheet(id) },
      thumb,
      h('div', { class: 'grow', style: 'min-width:0' },
        h('div', { style: 'white-space:nowrap;overflow:hidden;text-overflow:ellipsis' },
          h('b', { style: `color:${m.boss ? '#ff9aa6' : m.elite ? '#ffd35a' : 'inherit'}`, text: known ? m.name : '???' }), tag ? h('span', { class: 'tiny muted', text: ` · ${tag}` }) : null),
        h('div', { class: 'tiny muted', style: 'white-space:nowrap;overflow:hidden;text-overflow:ellipsis',
          text: known
            ? `Lv ${m.level} · ${m.element}${m.weak ? ` · weak ${m.weak}` : ''}${top ? ` · rare: ${ITEMS[top.item].name}` : ''}`
            : `Lv ${m.level} · not met yet` })),
      h('span', { class: 'chip', text: known ? `×${fmt(kills)}` : '–' }));
  });
  return h('div', {},
    h('div', { class: 'row', style: 'margin:0 0 6px' },
      h('b', { class: 'grow', text: 'Enemies in this zone' }),
      h('span', { class: 'tiny muted', text: `${met}/${ids.length} met` })),
    ...rows);
}

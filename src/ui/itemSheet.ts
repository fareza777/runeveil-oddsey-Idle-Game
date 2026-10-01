import { add, h, fmt, mount } from './dom';
import { ico, itemIcon, spriteEl } from './icons';
import { openSheet, toast } from './modal';
import { SLOT_NAME, STAT_LABEL, buzz, costChip, fmtStat, goldChip, statLines } from './common';
import { audio } from './audio';
import { host } from './host';
import { GATHER, HEROES, ITEMS, RECIPES, SKILL_MAP, rarity } from '@/data';
import { itemStats, MAX_UP, affixesOf } from '@/core/stats';
import { countItem, itemSellPrice, sellPrice } from '@/core/state';
import type { ItemInstance, Slot, StatKey } from '@/core/types';

/** Where an item comes from and what it feeds, so crafting chains are visible. */
function chain(id: string): HTMLElement | null {
  const made = RECIPES.filter((r) => r.out.some((o) => o.item === id));
  const gathered = GATHER.filter((g) => g.drops.some((d) => d.item === id));
  const used = RECIPES.filter((r) => r.inputs.some((i) => i.item === id));
  if (!made.length && !gathered.length && !used.length) return null;
  const line = (label: string, names: string[]) =>
    names.length ? h('div', { class: 'small', style: 'margin-top:4px' }, h('span', { class: 'muted', text: `${label}: ` }), names.slice(0, 4).join(', '), names.length > 4 ? ` +${names.length - 4}` : '') : null;
  return h('div', { class: 'ability' },
    line('Gathered', [...new Set(gathered.map((g) => `${SKILL_MAP[g.skill].name} · ${g.name}`))]),
    line('Crafted', [...new Set(made.map((r) => `${SKILL_MAP[r.skill].name} · ${r.name}`))]),
    line('Used in', [...new Set(used.map((r) => `${SKILL_MAP[r.skill].name} · ${r.name}`))]));
}

export function stackSheet(id: string, onChange?: () => void) {
  const g = host.game;
  const def = ITEMS[id];
  openSheet(def.name, (body, close) => {
    const render = () => {
      mount(body, );
      const have = countItem(g.state, id);
      add(body, 
        h('div', { class: 'item' }, itemIcon(id, undefined, 'lg'),
          h('div', { class: 'meta' }, h('b', { text: def.name }), h('span', { text: `Tier ${def.tier} · ${def.kind} · owned ${fmt(have)}` }))),
        def.desc ? h('p', { class: 'muted small', text: def.desc }) : null,
        def.heal ? h('div', { class: 'chip good', text: `Heals ${fmt(def.heal)} HP` }) : null,
        def.buff ? h('div', { class: 'chip gold', text: `${def.buff.status} +${def.buff.potency} for ${Math.round(def.buff.duration)}s` }) : null,
        def.xpBoost ? h('div', { class: 'chip gold', text: `+${Math.round(def.xpBoost.pct * 100)}% XP for ${Math.round(def.xpBoost.duration / 60)}m` }) : null,
        chain(id),
      );
      const btns = h('div', { class: 'row', style: 'margin-top:12px;flex-wrap:wrap' });
      if (def.kind === 'food') add(btns, h('button', { class: 'btn green grow', text: 'Set as auto-food', onclick: () => { g.setLoadout('food', id); toast(`${def.name} equipped as food`, 'good'); render(); onChange?.(); } }));
      if (def.kind === 'potion' && def.buff) {
        add(btns, h('button', { class: 'btn green grow', text: 'Set as auto-potion', onclick: () => { g.setLoadout('potion', id); toast(`${def.name} set`, 'good'); render(); onChange?.(); } }));
      }
      if ((def.buff || def.xpBoost) && have > 0) add(btns, h('button', { class: 'btn grow', text: 'Use now', onclick: () => { g.useItem(id); audio.sfx('potion'); render(); onChange?.(); } }));
      if (have > 0 && !def.unique) {
        const p = itemSellPrice(g.state, id);
        add(btns, 
          h('button', { class: 'btn gold', onclick: () => { g.sellItem(id, 1); audio.sfx('coin'); host.refresh(); onChange?.(); if (countItem(g.state, id) <= 0) close(); else render(); } }, 'Sell 1 ', goldChip(0, p)),
          have > 1 ? h('button', { class: 'btn gold', onclick: () => { const gain = g.sellItem(id, have); toast(`Sold for ${fmt(gain)} gold`, 'gold'); audio.sfx('coin'); host.refresh(); onChange?.(); close(); } }, 'Sell all ', goldChip(0, p * have)) : null,
        );
      }
      add(body, btns);
    };
    render();
  });
}

export interface GearOpts {
  heroIdx?: number;
  equipped?: boolean;
  onChange?: () => void;
}

export function gearSheet(uid: string, opts: GearOpts = {}) {
  const g = host.game;
  const find = (): ItemInstance | undefined => g.findGear(uid) ?? g.state.heroes.flatMap((x) => Object.values(x.equip)).find((i) => i?.uid === uid);
  const first = find();
  if (!first) return;
  openSheet(ITEMS[first.id].name, (body, close) => {
    const render = () => {
      const inst = find();
      if (!inst) { close(); return; }
      const def = ITEMS[inst.id];
      const r = rarity(inst.rarity);
      const slot = def.slot as Slot;
      const cur = opts.heroIdx !== undefined ? g.state.heroes[opts.heroIdx].equip[slot] : undefined;
      const st = itemStats(inst);
      const aff = affixesOf(inst);
      const heroRow = h('div', { class: 'row', style: 'gap:4px;margin:10px 0' });
      mount(body, 
        h('div', { class: 'item' }, itemIcon(inst.id, inst, 'lg'),
          h('div', { class: 'meta' },
            h('b', { text: def.name, style: `color:${r.color}` }),
            h('span', {}, h('span', { class: 'badge-r', style: `--rc:${r.color}`, text: r.name }), ` T${def.tier} · ${SLOT_NAME[slot]}${def.style ? ' · ' + def.style : ''}`))),
        def.unique && def.desc ? h('p', { class: 'small gold', text: def.desc }) : null,
        h('div', { class: 'card', style: 'margin-top:10px' }, ...statLines(st, cur && cur !== inst ? itemStats(cur) : undefined)),
        Object.keys(aff).length ? h('div', { class: 'small muted' }, 'Affixes: ', (Object.entries(aff) as [StatKey, number][]).map(([k, v]) => `${STAT_LABEL[k]} ${fmtStat(k, v)}`).join(' · ')) : null,
        def.apply ? h('div', { class: 'chip gold', style: 'margin-top:6px', text: `Inflicts ${def.apply} on hit` }) : null,
        def.element ? h('div', { class: 'chip', style: 'margin-top:6px', text: `Element: ${def.element}` }) : null,
      );

      if (!opts.equipped) {
        heroRow.append(...HEROES.map((hd, i) => {
          const fit = g.fitsHero(i, inst);
          const b = h('button', { class: `btn sm ${fit ? '' : 'ghost'}`, style: 'flex:1;padding:4px 2px;display:flex;flex-direction:column;align-items:center;gap:2px', onclick: () => {
            g.equip(i, uid);
            audio.sfx('pickup'); buzz();
            opts.onChange?.(); host.refresh();
            close();
          } }, spriteEl(hd.sprite, { zoom: 0.8, max: 40 }), h('span', { class: 'tiny', text: hd.name }));
          if (!fit) b.title = 'Different weapon style: 40% less attack';
          return b;
        }));
        add(body, h('div', { class: 'tiny muted', text: 'Equip on:' }), heroRow);
      } else if (opts.heroIdx !== undefined) {
        add(body, h('button', { class: 'btn block ghost', style: 'margin:10px 0', text: 'Unequip', onclick: () => { g.unequip(opts.heroIdx!, slot); opts.onChange?.(); host.refresh(); close(); } }));
      }

      // upgrade
      if (def.kind === 'equip') {
        const scroll = g.scrollFor(inst);
        const cost = g.upgradeCost(inst);
        const chance = g.upgradeChance(inst);
        const row = h('div', { class: 'card' },
          h('div', { class: 'row' }, h('b', { class: 'grow', text: `Enhance +${inst.up} → +${inst.up + 1}` }), h('span', { class: 'chip', text: `${Math.round(chance * 100)}%` })),
          h('div', { class: 'tiny muted', style: 'margin:4px 0', text: inst.up >= 5 ? 'Failure lowers the level by 1.' : 'Failure is safe until +5.' }),
          h('div', { class: 'row' },
            scroll ? costChip(g.state, scroll, 1) : h('span', { class: 'cost no', text: 'Needs enchant scroll' }),
            goldChip(g.state.gold, cost),
            h('span', { class: 'grow' }),
            h('button', { class: `btn sm gold ${inst.up >= MAX_UP ? 'off' : ''}`, text: inst.up >= MAX_UP ? 'MAX' : 'Enhance', onclick: () => {
              const res = g.upgradeGear(uid);
              if (res === 'ok') { toast(`Enhanced to +${find()!.up}!`, 'good'); audio.sfx('upgrade'); buzz('medium'); }
              else if (res === 'fail') { toast('Enhancement failed', 'bad'); audio.sfx('upgrade_fail'); }
              else if (res === 'noscroll') toast('You need an enchant scroll (craft with Enchanting)', 'bad');
              else if (res === 'nogold') toast('Not enough gold', 'bad');
              opts.onChange?.(); host.refresh(); render();
            } })));
        add(body, row);
      }
      if (!opts.equipped) {
        const p = sellPrice(g.state, inst);
        add(body, h('button', { class: 'btn gold block', onclick: () => {
          g.sellGear([uid]); audio.sfx('coin'); toast(`Sold for ${fmt(p)} gold`, 'gold'); opts.onChange?.(); host.refresh(); close();
        } }, 'Sell for ', ico('img:ui_icon_gold', 'sm'), ` ${fmt(p)}`));
      }
    };
    render();
  });
}

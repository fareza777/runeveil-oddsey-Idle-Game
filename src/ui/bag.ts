import { h, fmt, mount } from './dom';
import { itemIcon } from './icons';
import { openSheet, toast } from './modal';
import { SLOT_NAME, SLOT_ORDER, goldChip, moneyText } from './common';
import { audio } from './audio';
import { host } from './host';
import { gearSheet, stackSheet } from './itemSheet';
import type { Screen } from './screen';
import { ITEMS, RARITIES, rarity } from '@/data';
import { BAG_MAX, sellPrice } from '@/core/state';
import type { ItemInstance, Slot } from '@/core/types';

type Tab = 'gear' | 'mats' | 'supplies';
type Sort = 'rarity' | 'tier' | 'power' | 'new';
const SORTS: Sort[] = ['rarity', 'tier', 'power', 'new'];

export class BagScreen implements Screen {
  el = h('div', { class: 'screen' });
  private tab: Tab = 'gear';
  private slot: Slot | 'all' = 'all';
  private sort: Sort = 'rarity';
  private tag = 'all';

  show() {
    const g = host.game;
    const s = g.state;
    const seg = h('div', { class: 'seg' },
      ...(['gear', 'mats', 'supplies'] as Tab[]).map((t) => h('button', { class: this.tab === t ? 'on' : '', text: t === 'gear' ? `Gear ${s.gear.length}/${BAG_MAX}` : t === 'mats' ? 'Materials' : 'Supplies', onclick: () => { this.tab = t; this.show(); } })));
    const body = h('div');
    if (this.tab === 'gear') this.gear(body);
    else if (this.tab === 'mats') this.stacks(body, (d) => d.kind === 'material' || d.kind === 'misc');
    else this.stacks(body, (d) => d.kind === 'food' || d.kind === 'potion' || d.kind === 'scroll');
    const st = this.el.scrollTop;
    mount(this.el, seg, body);
    this.el.scrollTop = st;
  }

  update() { /* refreshed on demand */ }

  private chips<T extends string>(opts: { id: T; label: string }[], cur: T, set: (v: T) => void) {
    return h('div', { class: 'row', style: 'flex-wrap:nowrap;overflow-x:auto;margin-bottom:8px;gap:5px;scrollbar-width:none' },
      ...opts.map((o) => h('button', { class: `chip ${o.id === cur ? 'gold' : ''}`, style: o.id === cur ? 'background:rgba(242,199,92,.15)' : '', text: o.label, onclick: () => { set(o.id); this.show(); } })));
  }

  private gear(body: HTMLElement) {
    const g = host.game;
    const s = g.state;
    body.append(this.chips<Slot | 'all'>([{ id: 'all', label: 'All' }, ...SLOT_ORDER.map((x) => ({ id: x, label: SLOT_NAME[x] }))], this.slot, (v) => (this.slot = v)));
    body.append(h('div', { class: 'row', style: 'margin-bottom:8px' },
      h('span', { class: 'tiny muted', text: 'Sort' }),
      ...SORTS.map((x) => h('button', { class: `chip ${x === this.sort ? 'gold' : ''}`, text: x, onclick: () => { this.sort = x; this.show(); } })),
      h('span', { class: 'grow' }),
      h('button', { class: 'btn sm gold', text: 'Sell junk', onclick: () => this.junkSheet() })));
    let list = s.gear.filter((x) => this.slot === 'all' || ITEMS[x.id].slot === this.slot);
    const score = (x: ItemInstance) => g.gearScore(x);
    if (this.sort === 'rarity') list = list.sort((a, b) => b.rarity - a.rarity || ITEMS[b.id].tier - ITEMS[a.id].tier);
    else if (this.sort === 'tier') list = list.sort((a, b) => ITEMS[b.id].tier - ITEMS[a.id].tier || b.rarity - a.rarity);
    else if (this.sort === 'power') list = list.sort((a, b) => score(b) - score(a));
    else list = list.reverse();
    if (!list.length) {
      body.append(h('div', { class: 'empty', text: 'No gear here yet. Fight monsters, or craft gear with Smithing, Carpentry, Leatherworking and Jewelcrafting.' }));
      return;
    }
    body.append(h('div', { class: 'grid bag' }, ...list.slice(0, 300).map((inst) => {
      const el = itemIcon(inst.id, inst);
      el.addEventListener('click', () => { audio.sfx('ui_click'); gearSheet(inst.uid, { onChange: () => this.show() }); });
      return el;
    })));
    if (list.length > 300) body.append(h('div', { class: 'tiny muted center', style: 'margin-top:8px', text: `Showing 300 of ${list.length}` }));
  }

  private stacks(body: HTMLElement, pred: (d: (typeof ITEMS)[string]) => boolean) {
    const g = host.game;
    const s = g.state;
    const ids = Object.keys(s.stacks).filter((id) => ITEMS[id] && pred(ITEMS[id]));
    const tags = [...new Set(ids.map((id) => ITEMS[id].tag ?? ITEMS[id].kind))].sort();
    if (this.tag !== 'all' && !tags.includes(this.tag)) this.tag = 'all';
    if (tags.length > 1) body.append(this.chips<string>([{ id: 'all', label: 'All' }, ...tags.map((t) => ({ id: t, label: t }))], this.tag, (v) => (this.tag = v)));
    const filtered = ids.filter((id) => this.tag === 'all' || (ITEMS[id].tag ?? ITEMS[id].kind) === this.tag).sort((a, b) => ITEMS[b].tier - ITEMS[a].tier || ITEMS[a].name.localeCompare(ITEMS[b].name));
    if (!filtered.length) {
      body.append(h('div', { class: 'empty', text: 'Nothing here yet. Gather, hunt, and craft to fill your bag.' }));
      return;
    }
    const total = filtered.reduce((n, id) => n + Math.round(ITEMS[id].value * 0.5) * s.stacks[id], 0);
    body.append(h('div', { class: 'small muted', style: 'margin-bottom:6px', text: `${filtered.length} kinds · worth about ${fmt(total)} gold` }));
    body.append(h('div', { class: 'grid bag' }, ...filtered.map((id) => {
      const el = itemIcon(id);
      el.append(h('i', { class: 'qty', text: fmt(s.stacks[id]) }));
      el.addEventListener('click', () => { audio.sfx('ui_click'); stackSheet(id, () => this.show()); });
      return el;
    })));
  }

  private junkSheet() {
    const g = host.game;
    const s = g.state;
    let limit = Math.min(5, Math.max(...RARITIES.map((r) => r.id)));
    openSheet('Sell junk', (body, close) => {
      const preview = h('div', { class: 'card' });
      const sel = () => s.gear.filter((x) => x.rarity <= limit && !ITEMS[x.id].unique && x.up === 0);
      const upd = () => {
        const list = sel();
        const total = list.reduce((n, x) => n + sellPrice(s, x), 0);
        const r = rarity(limit);
        preview.replaceChildren(
          h('div', { class: 'row' }, h('span', { class: 'badge-r', style: `--rc:${r.color}`, text: `Up to ${r.name}` }), h('span', { class: 'grow' }), h('b', { text: `${list.length} items` })),
          h('div', { class: 'row', style: 'margin-top:6px' }, h('span', { class: 'muted small', text: 'You receive' }), h('span', { class: 'grow' }), goldChip(0, total)));
        btn.classList.toggle('off', list.length === 0);
      };
      const slider = h('input', { type: 'range', class: 'slider', min: '1', max: '25', value: String(limit), oninput: (e: Event) => { limit = Number((e.target as HTMLInputElement).value); upd(); } });
      const btn = h('button', { class: 'btn gold block', text: 'Sell selected', onclick: () => {
        const list = sel();
        const gold = g.sellGear(list.map((x) => x.uid));
        audio.sfx('coin'); toast(`Sold ${list.length} items for ${moneyText(gold)}`, 'gold');
        host.refresh(); close(); this.show();
      } });
      body.append(h('p', { class: 'small muted', text: 'Sells every bag item up to the chosen rarity. Enhanced and unique items are always kept. Equipped gear is never sold.' }), slider, h('div', { class: 'sp' }), preview, h('div', { class: 'sp' }), btn);
      upd();
    });
  }
}

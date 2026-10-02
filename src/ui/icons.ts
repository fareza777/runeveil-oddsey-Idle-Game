import { h } from './dom';
import { genIconUrl } from './iconGen';
import { STATUS_MAP } from '@/data';
import type { ItemInstance, MonsterDef, StatusId } from '@/core/types';
import { ITEMS, MONSTERS, rarity } from '@/data';

export const GRADE_COLOR = ['#9a9ab0', '#8fd0a0', '#6ea8ff', '#c78bff', '#ff9a4d', '#ff5d7a'];

export const asset = (p: string) => `${import.meta.env.BASE_URL}assets/${p}`;

export function iconUrl(spec: string): { url: string; hue: number } {
  let hue = 0;
  let s = spec;
  const hm = /\|h(-?\d+)/.exec(s);
  if (hm) {
    hue = Number(hm[1]);
    s = s.replace(hm[0], '');
  }
  if (s.startsWith('gen:')) {
    const [kind, ...rest] = s.slice(4).split('|');
    const c = rest.find((r) => r.startsWith('c='))?.slice(2) ?? '#9a9ab0';
    return { url: genIconUrl(kind, c), hue };
  }
  if (s.startsWith('art:')) return { url: asset(`gen/items/${s.slice(4)}.png`), hue };
  const name = s.startsWith('img:') ? s.slice(4) : s;
  if (name.startsWith('ui_')) return { url: asset(`gen/ui/${name.slice(3)}.png`), hue };
  return { url: asset(`icons/${name}.png`), hue };
}

export function ico(spec: string, cls = ''): HTMLElement {
  const { url, hue } = iconUrl(spec);
  const img = h('img', { src: url, alt: '', draggable: false, loading: 'lazy' });
  if (hue) img.style.filter = `hue-rotate(${hue}deg)`;
  return h('span', { class: `ico ${cls}` }, img);
}

/** A monster card: the monster's portrait on a framed card. */
export function cardEl(id: string, cls = ''): HTMLElement {
  const def = ITEMS[id];
  const m = def?.card ? MONSTERS[def.card.monster] : undefined;
  const el = h('span', { class: `slotbox cardbox ${cls}` });
  el.style.setProperty('--cc', GRADE_COLOR[def?.card?.grade ?? 1]);
  if (m) el.append(monsterSprite(m, 1.1, 44));
  return el;
}

export function itemIcon(id: string, inst?: ItemInstance, cls = ''): HTMLElement {
  const def = ITEMS[id];
  if (def?.kind === 'card') return cardEl(id, cls);
  const r = inst ? rarity(inst.rarity) : null;
  const el = h('span', { class: `slotbox ${cls} ${r ? 'r' : ''}` }, ico(def?.icon ?? 'img:ui_icon_gift'));
  if (r) {
    el.style.setProperty('--rc', r.color);
    el.style.setProperty('--rg', r.glow);
    if (inst!.rarity >= 12) el.classList.add('hi');
    if (inst!.rarity >= 20) el.classList.add('epic');
    if (inst!.up > 0) el.appendChild(h('i', { class: 'up', text: `+${inst!.up}` }));
  }
  return el;
}

export function statusBadge(id: StatusId, stacks = 1): HTMLElement {
  const s = STATUS_MAP[id];
  const el = h('span', { class: `sbadge ${s.harm ? 'harm' : 'good'}`, title: s.name }, s.name.slice(0, 2).toUpperCase(), stacks > 1 ? h('sup', { text: String(stacks) }) : null);
  el.style.setProperty('--sc', s.color);
  return el;
}

const heroSizeCache = new Map<string, number>();
export function spriteEl(sprite: string, opts: { hue?: number; sat?: number; zoom: number; max?: number; scale?: number; cls?: string; dir?: string }): HTMLImageElement {
  const src = sprite.startsWith('gen/') ? asset(`${sprite}.png`) : asset(`${opts.dir ?? 'pack/battlers'}/${sprite}.png`);
  const img = h('img', { class: `sprite ${opts.cls ?? ''}`, src, alt: '', draggable: false });
  const apply = (nh: number) => {
    let px = nh * opts.zoom * (opts.scale ?? 1);
    if (opts.max) px = Math.min(opts.max, px);
    img.style.height = `${Math.round(px)}px`;
  };
  const cached = heroSizeCache.get(sprite);
  if (cached) apply(cached);
  else {
    img.style.height = `${Math.round(60 * opts.zoom)}px`;
    img.addEventListener('load', () => {
      heroSizeCache.set(sprite, img.naturalHeight);
      apply(img.naturalHeight);
    });
  }
  const f: string[] = [];
  if (opts.hue) f.push(`hue-rotate(${opts.hue}deg)`);
  if (opts.sat && opts.sat !== 1) f.push(`saturate(${opts.sat})`);
  if (f.length) img.style.filter = f.join(' ');
  return img;
}

export function monsterSprite(m: MonsterDef, big = 3.2, cap?: number): HTMLImageElement {
  if (m.boss) return spriteEl(m.id, { zoom: big, max: cap ?? 175, dir: 'gen/bosses' });
  const sc = Math.min(1.35, Math.pow(Math.max(0.6, m.scale), 0.6));
  return spriteEl(m.sprite, { hue: m.hue, sat: m.sat, zoom: big, max: cap ?? 150, scale: sc });
}

export function bar(cls: string, value: number, label?: string): HTMLElement {
  const fill = h('i', { style: `width:${Math.max(0, Math.min(1, value)) * 100}%` });
  return h('div', { class: `bar ${cls}` }, fill, label ? h('span', { text: label }) : null);
}

export function setBar(el: Element, value: number, label?: string) {
  const fill = el.firstElementChild as HTMLElement | null;
  if (fill) fill.style.width = `${Math.max(0, Math.min(1, value)) * 100}%`;
  if (label !== undefined) {
    const sp = el.querySelector('span');
    if (sp && sp.textContent !== label) sp.textContent = label;
  }
}

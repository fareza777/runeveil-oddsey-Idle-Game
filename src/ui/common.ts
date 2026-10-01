import { h, fmt } from './dom';
import { ico } from './icons';
import { ITEMS } from '@/data';
import { countItem } from '@/core/state';
import type { GameState, Slot, StatKey, Stats } from '@/core/types';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { host } from './host';
import { expected } from '@/core/expected';
import { BAL } from '@/core/balance';
import { zoneEase } from '@/core/monsterStats';
import { computeHero, skillBonuses } from '@/core/stats';

export const STAT_LABEL: Record<StatKey, string> = {
  atk: 'Attack', def: 'Defense', hp: 'Max HP', crit: 'Crit chance', critDmg: 'Crit damage', haste: 'Haste', eva: 'Evasion',
  leech: 'Life leech', regen: 'HP regen', luck: 'Luck', res: 'Resist',
};
const SUFFIX: Record<StatKey, string> = { atk: '', def: '', hp: '', crit: '%', critDmg: '%', haste: '%', eva: '%', leech: '%', regen: '/s', luck: '%', res: '%' };
export const fmtStat = (k: StatKey, v: number) => `${v >= 0 ? '+' : ''}${Math.abs(v) >= 100 ? Math.round(v) : Math.round(v * 10) / 10}${SUFFIX[k]}`;

export const SLOT_NAME: Record<Slot, string> = {
  weapon: 'Weapon', offhand: 'Offhand', head: 'Head', body: 'Body', legs: 'Legs', hands: 'Hands', feet: 'Feet', neck: 'Amulet', ring: 'Ring', rune: 'Rune',
};
export const SLOT_ICON: Record<Slot, string> = {
  weapon: 'img:item_sword_1', offhand: 'gen:shield|c=#8a8aa0', head: 'img:item_helm_1', body: 'img:item_armor_1', legs: 'gen:legs|c=#8a8aa0',
  hands: 'gen:gloves|c=#8a8aa0', feet: 'img:item_boots_1', neck: 'img:item_amulet_1', ring: 'img:item_ring_1', rune: 'img:relic_void_lens',
};
export const SLOT_ORDER: Slot[] = ['weapon', 'offhand', 'head', 'body', 'legs', 'hands', 'feet', 'neck', 'ring', 'rune'];

export function statLines(st: Stats, cmp?: Stats): HTMLElement[] {
  const keys = (Object.keys(st) as StatKey[]).filter((k) => st[k]);
  if (cmp) for (const k of Object.keys(cmp) as StatKey[]) if (!keys.includes(k) && cmp[k]) keys.push(k);
  return keys.map((k) => {
    const v = st[k] ?? 0;
    const d = cmp ? v - (cmp[k] ?? 0) : 0;
    return h('div', { class: 'statline' },
      h('span', { text: STAT_LABEL[k] }),
      h('b', null, fmtStat(k, v), cmp && Math.abs(d) > 0.05 ? h('span', { class: d > 0 ? 'good' : 'bad', style: 'margin-left:6px;font-size:11px', text: `${d > 0 ? '▲' : '▼'}${Math.abs(Math.round(d * 10) / 10)}` }) : null));
  });
}

/** Cost/requirement chip: icon, have/need, red if short. */
export function costChip(s: GameState, item: string, n: number): HTMLElement {
  const have = countItem(s, item);
  const def = ITEMS[item];
  return h('span', { class: `cost ${have < n ? 'no' : ''}`, title: def?.name }, ico(def?.icon ?? 'img:ui_icon_gift'), `${fmt(have)}/${fmt(n)}`);
}

export function goldChip(have: number, need: number): HTMLElement {
  return h('span', { class: `cost ${have < need ? 'no' : ''}` }, ico('img:ui_icon_gold'), fmt(need));
}

export function buzz(kind: 'light' | 'medium' | 'heavy' = 'light') {
  if (!host.game?.state.settings.haptics) return;
  const style = kind === 'heavy' ? ImpactStyle.Heavy : kind === 'medium' ? ImpactStyle.Medium : ImpactStyle.Light;
  void Haptics.impact({ style }).catch(() => undefined);
}

/** How the party compares to a well-prepared party for the zone. 1.0 means on par. */
export function readiness(s: GameState, zone: number): number {
  const e = expected(zone);
  const b = skillBonuses(s);
  let dps = 0;
  let hp = 0;
  for (let i = 0; i < s.heroes.length; i++) {
    const c = computeHero(s, i, b);
    dps += (c.atk * (1 + (c.crit / 100) * (c.critDmg / 100 - 1))) / c.interval;
    hp += c.maxHp;
  }
  return Math.sqrt(((dps * BAL.abilityDpsBonus) / e.dps) * (hp / e.partyHp)) / zoneEase(zone);
}

export function danger(r: number): { label: string; cls: string } {
  if (r >= 1.35) return { label: 'Easy', cls: 'good' };
  if (r >= 0.95) return { label: 'Fair', cls: 'gold' };
  if (r >= 0.7) return { label: 'Hard', cls: 'bad' };
  return { label: 'Deadly', cls: 'bad' };
}

export const heroPortrait = (sprite: string) => h('img', { class: 'sprite', src: `${import.meta.env.BASE_URL}assets/pack/battlers/${sprite}.png`, style: 'height:52px' });

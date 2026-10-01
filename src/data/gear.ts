import type { SkillId, Slot, StatKey, Stats, Style } from '@/core/types';
import { GEAR_COLORS, GEAR_TIERS, GEAR_WORDS, scaleOf } from './tiers';

export interface GearType {
  key: string;
  name: string;
  slot: Slot;
  style?: Style;
  skill: SkillId;
  base: Stats;
  /** attack interval in seconds for weapons */
  interval?: number;
  icon: (t: number) => string;
}

const variant = (t: number) => Math.max(1, Math.min(8, Math.ceil((t * 8) / GEAR_TIERS)));
const img = (k: string) => (t: number) => `img:item_${k}_${variant(t)}`;
const gen = (k: string) => (t: number) => `gen:${k}|c=${GEAR_COLORS[t - 1]}`;

export const GEAR_TYPES: GearType[] = [
  { key: 'sword', name: 'Sword', slot: 'weapon', style: 'melee', skill: 'smithing', base: { atk: 9, crit: 2 }, interval: 2.2, icon: img('sword') },
  { key: 'mace', name: 'Warhammer', slot: 'weapon', style: 'melee', skill: 'smithing', base: { atk: 12, haste: -8 }, interval: 3, icon: img('hammer') },
  { key: 'dagger', name: 'Dagger', slot: 'weapon', style: 'melee', skill: 'smithing', base: { atk: 6, haste: 15, crit: 6 }, interval: 1.6, icon: img('dagger') },
  { key: 'bow', name: 'Bow', slot: 'weapon', style: 'ranged', skill: 'carpentry', base: { atk: 8, crit: 5, eva: 1 }, interval: 2, icon: gen('bow') },
  { key: 'staff', name: 'Staff', slot: 'weapon', style: 'magic', skill: 'carpentry', base: { atk: 10, res: 3 }, interval: 2.8, icon: img('staff') },
  { key: 'shield', name: 'Shield', slot: 'offhand', skill: 'smithing', base: { def: 5, hp: 14 }, icon: gen('shield') },
  { key: 'orb', name: 'Focus Orb', slot: 'offhand', style: 'magic', skill: 'jewelcrafting', base: { atk: 3, res: 3, regen: 0.4 }, icon: gen('orb') },
  { key: 'helm', name: 'Helm', slot: 'head', skill: 'smithing', base: { def: 3, hp: 12 }, icon: img('helm') },
  { key: 'cuirass', name: 'Cuirass', slot: 'body', skill: 'smithing', base: { def: 6, hp: 30 }, icon: img('armor') },
  { key: 'greaves', name: 'Greaves', slot: 'legs', skill: 'smithing', base: { def: 4, hp: 20 }, icon: gen('legs') },
  { key: 'gloves', name: 'Gauntlets', slot: 'hands', skill: 'leatherworking', base: { def: 2, atk: 1.5, crit: 1 }, icon: gen('gloves') },
  { key: 'boots', name: 'Boots', slot: 'feet', skill: 'leatherworking', base: { def: 2, eva: 1.5, haste: 2 }, icon: img('boots') },
  { key: 'amulet', name: 'Amulet', slot: 'neck', skill: 'jewelcrafting', base: { hp: 15, luck: 2, regen: 0.3 }, icon: img('amulet') },
  { key: 'ring', name: 'Ring', slot: 'ring', skill: 'jewelcrafting', base: { atk: 2, crit: 1.5, critDmg: 4 }, icon: img('ring') },
];
export const GEAR_TYPE_MAP = Object.fromEntries(GEAR_TYPES.map((g) => [g.key, g]));

const PCT: StatKey[] = ['crit', 'critDmg', 'haste', 'eva', 'leech', 'luck', 'res', 'regen'];
const SCALED: StatKey[] = ['atk', 'def', 'hp'];

export const gearId = (type: string, t: number) => `eq_${type}_${t}`;
export const gearName = (type: GearType, t: number) => `${GEAR_WORDS[t - 1]} ${type.name}`;

export function gearBase(type: GearType, t: number): Stats {
  const s = scaleOf(t);
  const out: Stats = {};
  for (const [k, v] of Object.entries(type.base) as [StatKey, number][]) {
    if (SCALED.includes(k)) out[k] = Math.max(1, Math.round(v * s * 10) / 10);
    else if (k === 'regen') out[k] = Math.round(v * s * 0.5 * 10) / 10;
    else if (PCT.includes(k)) out[k] = Math.round(v * (1 + 0.05 * (t - 1)) * 10) / 10;
  }
  return out;
}

import type { Element, ItemDef, StatusId } from '@/core/types';
import { ELEMENTS } from './combatData';
import { GEAR_TYPES, gearBase, gearId, gearName } from './gear';
import {
  CROPS, FAMILIES, FISH, GEAR_COLORS, GEAR_TIERS, GEMS, GEM_COLORS, HERBS, HIDES, HIDE_COLORS, METALS,
  METAL_COLORS, RES_TIERS, WOODS, WOOD_COLORS, dropId,
} from './tiers';

export const ITEMS: Record<string, ItemDef> = {};
export const add = (d: ItemDef) => {
  if (ITEMS[d.id]) throw new Error(`duplicate item ${d.id}`);
  ITEMS[d.id] = d;
};
const val = (t: number, f = 1) => Math.max(1, Math.round(4 * Math.pow(1.3, t) * f));

// ---------- equipment ----------
for (const type of GEAR_TYPES) {
  for (let t = 1; t <= GEAR_TIERS; t++) {
    add({
      id: gearId(type.key, t), name: gearName(type, t), kind: 'equip', tier: t, icon: type.icon(t),
      value: val(t, 6), slot: type.slot, style: type.style, weaponKind: type.slot === 'weapon' ? type.key : undefined,
      base: gearBase(type, t), tag: type.key,
    });
  }
}

// ---------- resource chains ----------
for (let r = 0; r < RES_TIERS; r++) {
  add({ id: `ore_${r}`, name: `${METALS[r]} Ore`, kind: 'material', tier: r, icon: `gen:ore|c=${METAL_COLORS[r]}`, value: val(r * 1.6, 1), tag: 'ore' });
  add({ id: `bar_${r}`, name: `${METALS[r]} Bar`, kind: 'material', tier: r, icon: `gen:bar|c=${METAL_COLORS[r]}`, value: val(r * 1.6, 2.6), tag: 'bar' });
  add({ id: `log_${r}`, name: `${WOODS[r]} Log`, kind: 'material', tier: r, icon: `gen:log|c=${WOOD_COLORS[r]}`, value: val(r * 1.6, 1), tag: 'log' });
  add({ id: `plank_${r}`, name: `${WOODS[r]} Plank`, kind: 'material', tier: r, icon: `gen:plank|c=${WOOD_COLORS[r]}`, value: val(r * 1.6, 2.4), tag: 'plank' });
  add({ id: `hide_${r}`, name: `${HIDES[r]} Hide`, kind: 'material', tier: r, icon: `gen:hide|c=${HIDE_COLORS[r]}`, value: val(r * 1.6, 1.2), tag: 'hide' });
  add({ id: `leather_${r}`, name: `${HIDES[r]} Leather`, kind: 'material', tier: r, icon: `gen:leather|c=${HIDE_COLORS[r]}`, value: val(r * 1.6, 2.8), tag: 'leather' });
}
GEMS.forEach((g, i) => {
  add({ id: `gemr_${i}`, name: `Rough ${g}`, kind: 'material', tier: i, icon: `gen:gemrough|c=${GEM_COLORS[i]}`, value: val(i * 1.25, 2), tag: 'gem' });
  add({ id: `gem_${i}`, name: `Cut ${g}`, kind: 'material', tier: i, icon: `gen:gem|c=${GEM_COLORS[i]}`, value: val(i * 1.25, 5), tag: 'gem' });
});

// ---------- fish, cooking ----------
FISH.forEach((f, i) => {
  add({ id: `fish_${i}`, name: `Raw ${f}`, kind: 'material', tier: i, icon: `gen:fish|c=${fishColor(i)}`, value: val(i * 0.9, 1.2), tag: 'fish' });
  add({
    id: `cfish_${i}`, name: `Grilled ${f}`, kind: 'food', tier: i, icon: `gen:dish|c=${fishColor(i)}`, value: val(i * 0.9, 2.4),
    heal: 0.1 + 0.0125 * i, tag: 'food', desc: `Restores ${Math.round((0.1 + 0.0125 * i) * 100)}% max HP.`,
  });
});
function fishColor(i: number): string {
  return ['#9ab0c8', '#b8c8d8', '#c8a060', '#d88a70', '#a0b878', '#7ab0a0', '#8a9a70', '#e07860', '#9a8a70', '#6a8aa0', '#5a7ac0', '#a0b0e0', '#e05a4a', '#6a8ae0', '#8a98a8', '#b0c8ff', '#7affd0', '#a070e0', '#8a70ff', '#5af0d0'][i];
}
const HERB_COLORS = ['#7fd06a', '#a8c870', '#c8e0b0', '#e04a5a', '#9fe0ff', '#ff7a3a', '#e8f0ff', '#8a50c0', '#ffd860', '#b8c0ff', '#ffe27a', '#6fe0a0', '#d890f0', '#80f0c0', '#9a50ff', '#ff9a4a'];
const CROP_COLORS = ['#e8c868', '#f08a30', '#c8a070', '#d8b0d0', '#e04a3a', '#f09a30', '#f0d850', '#a03050', '#e0a030', '#9fe090', '#9fd0ff', '#e0402a', '#f0c840', '#f0e070', '#a0e0c0', '#8a40c0'];
HERBS.forEach((h, i) => add({ id: `herb_${i}`, name: h, kind: 'material', tier: i, icon: `gen:herb|c=${HERB_COLORS[i]}`, value: val(i * 1.4, 1.4), tag: 'herb' }));
CROPS.forEach((c, i) => add({ id: `crop_${i}`, name: c, kind: 'material', tier: i, icon: `gen:crop|c=${CROP_COLORS[i]}`, value: val(i * 1.4, 1.2), tag: 'crop' }));

// ---------- monster drops ----------
FAMILIES.forEach((f, fi) => {
  f.drops.forEach((n, i) => {
    add({ id: dropId(f.id, i as 0 | 1), name: n, kind: 'material', tier: fi, icon: dropIcon(fi, i), value: val(6 + i * 3, 1.5), tag: 'drop' });
  });
});
function dropIcon(fi: number, i: number): string {
  const imgs = ['mat_slime_gel', 'mat_epic_core', 'mat_mushroom_cap', 'mat_wasp_stinger', 'mat_chitin', 'mat_ancient_linen', 'mat_bone_dust', 'relic_whetstone', 'mat_grave_moss', 'mat_ectoplasm', 'mat_sand_pearl', 'relic_blood_chalice', 'mat_arcane_dust', 'relic_gorehorn_horn', 'mat_void_essence'];
  return i === 0 ? `img:${imgs[fi]}` : `img:${imgs[(fi + 7) % imgs.length]}|h${(fi * 47) % 360}`;
}

// ---------- excavation relics, essences ----------
export const RELIC_NAMES = [
  'Cracked Pottery', 'Stone Idol', 'Old Coin Hoard', 'Fossilized Shell', 'Rusted Compass', 'Gilded Mask',
  'Ancient Tablet', 'Sunken Crown Shard', 'Starmap Plate', 'Void Idol', 'Primal Totem', 'First Rune Tablet',
];
RELIC_NAMES.forEach((n, i) => add({ id: `relic_${i}`, name: n, kind: 'material', tier: i, icon: `gen:relic|c=${GEAR_COLORS[Math.min(19, i * 2 + 1)]}`, value: val(i * 1.6, 8), tag: 'relic' }));
ELEMENTS.forEach((e, i) => add({ id: `ess_${e.id}`, name: `Essence of ${e.name === 'Physical' ? 'Might' : e.name}`, kind: 'material', tier: i + 2, icon: `gen:essence|c=${e.color}`, value: val(8 + i, 5), tag: 'essence' }));

// ---------- meals ----------
export const MEAL_NAMES = [
  'Farmhand Stew', 'Potato Mash', 'Fish Chowder', 'Pumpkin Pie', 'Mushroom Skewers', 'Roast Corn Platter', 'Salmon Teriyaki', 'Beetroot Bake',
  'Sunroot Curry', 'Hunter Pot Roast', 'Moonmelon Salad', 'Frostberry Tart', 'Ember Chili', 'Lobster Bisque', 'Golden Grain Pilaf', 'Starfruit Sorbet',
  'Dreamgourd Casserole', 'Wyrm Steak', 'Void Pepper Noodles', 'Reef Shark Feast', 'Moonfin Sashimi', 'Glowray Hotpot', 'Star Whale Banquet', "Leviathan's Last Supper",
];
export const MEAL_BUFFS: StatusId[] = ['regen', 'might', 'fortify', 'haste'];
MEAL_NAMES.forEach((n, i) => {
  const status = MEAL_BUFFS[i % 4];
  const potency = status === 'regen' ? 0.004 + i * 0.0006 : 0.04 + i * 0.006;
  add({
    id: `meal_${i}`, name: n, kind: 'food', tier: i, icon: `gen:dish|c=${CROP_COLORS[i % 16]}`, value: val(i * 0.85, 6),
    heal: 0.2 + i * 0.017, buff: { status, potency, duration: 120 }, tag: 'meal',
    desc: `Restores ${Math.round((0.2 + i * 0.017) * 100)}% max HP and grants a ${status} buff for 2 minutes.`,
  });
});

// ---------- potions ----------
export const POTION_PREFIX = ['Minor', 'Lesser', 'Standard', 'Greater', 'Grand', 'Superior', 'Supreme'];
export interface PotionLine { key: string; name: string; status?: StatusId; tiers: number; start: number; step: number; color: string; icon: string; xp?: boolean; cleanse?: boolean }
export const POTION_LINES: PotionLine[] = [
  { key: 'vigor', name: 'Vigor Draught', status: 'regen', tiers: 5, start: 3, step: 18, color: 'red', icon: 'elixir_red' },
  { key: 'might', name: 'Might Tonic', status: 'might', tiers: 5, start: 8, step: 17, color: 'orange', icon: 'elixir_orange' },
  { key: 'ward', name: 'Ward Elixir', status: 'fortify', tiers: 5, start: 12, step: 17, color: 'blue', icon: 'elixir_blue' },
  { key: 'haste', name: 'Swiftness Brew', status: 'haste', tiers: 4, start: 20, step: 20, color: 'yellow', icon: 'elixir_yellow' },
  { key: 'thorns', name: 'Thornbark Tonic', status: 'thorns', tiers: 3, start: 30, step: 25, color: 'green', icon: 'elixir_green' },
  { key: 'cleanse', name: 'Cleansing Salve', tiers: 3, start: 10, step: 30, color: 'purple', icon: 'elixir_purple', cleanse: true },
  { key: 'scholar', name: "Scholar's Infusion", tiers: 4, start: 15, step: 22, color: 'gold', icon: 'elixir_gold', xp: true },
];
for (const line of POTION_LINES) {
  for (let k = 0; k < line.tiers; k++) {
    const pre = POTION_PREFIX[Math.min(POTION_PREFIX.length - 1, Math.round((k * (POTION_PREFIX.length - 1)) / Math.max(1, line.tiers - 1)))];
    const id = `pot_${line.key}_${k}`;
    const name = `${pre} ${line.name}`;
    const t = line.start + k * line.step;
    if (line.status) {
      const potency = line.status === 'regen' ? 0.006 + k * 0.004 : line.status === 'thorns' ? 0.08 + k * 0.08 : 0.06 + k * 0.04;
      add({ id, name, kind: 'potion', tier: t / 5, icon: `img:${line.icon}`, value: val(t / 5, 8), buff: { status: line.status, potency, duration: 180 }, tag: line.key, desc: `Grants ${line.status} (${Math.round(potency * 1000) / 10}%) for 3 minutes.` });
    } else if (line.xp) {
      const pct = 0.1 + k * 0.05;
      add({ id, name, kind: 'potion', tier: t / 5, icon: `img:${line.icon}`, value: val(t / 5, 8), xpBoost: { pct, duration: 900 }, tag: line.key, desc: `+${Math.round(pct * 100)}% XP in all skills for 15 minutes.` });
    } else {
      add({ id, name, kind: 'potion', tier: t / 5, icon: `img:${line.icon}`, value: val(t / 5, 8), tag: line.key, heal: 0.1 + k * 0.1, desc: `Cleanses all harmful effects and restores ${10 + k * 10}% HP.` });
    }
  }
}

// ---------- runes ----------
export const RUNE_TIERS: { key: string; name: string; tier: number }[] = [
  { key: 'lesser', name: 'Lesser', tier: 6 },
  { key: 'greater', name: 'Greater', tier: 14 },
];
for (const e of ELEMENTS) {
  for (const rt of RUNE_TIERS) {
    add({
      id: `rune_${e.id}_${rt.key}`, name: `${rt.name} Rune of ${e.id === 'physical' ? 'Force' : e.name}`, kind: 'rune', tier: rt.tier,
      icon: `gen:rune|c=${e.color}`, value: val(rt.tier, 10), slot: 'rune', element: e.id as Element,
      base: { atk: Math.round(4 * Math.pow(1.27, rt.tier - 1) * 0.6), res: 8 + rt.tier * 0.6 }, tag: 'rune',
    });
  }
}
const UTIL_RUNES: { key: string; name: string; base: Record<string, number>; color: string }[] = [
  { key: 'might', name: 'Rune of Wrath', base: { atk: 1.3, critDmg: 18 }, color: '#ff6a4a' },
  { key: 'fortune', name: 'Rune of Fortune', base: { luck: 14, crit: 4 }, color: '#f5d34a' },
  { key: 'ward', name: 'Rune of Warding', base: { def: 1.1, hp: 4.4, regen: 0.6 }, color: '#9fd0ff' },
  { key: 'swift', name: 'Rune of Swiftness', base: { haste: 12, eva: 6 }, color: '#7affd0' },
];
for (const u of UTIL_RUNES) {
  const t = 10;
  const s = Math.pow(1.27, t - 1);
  const base: Record<string, number> = {};
  for (const [k, v] of Object.entries(u.base)) base[k] = ['atk', 'def', 'hp'].includes(k) ? Math.round(v * s * 3 * 10) / 10 : v;
  add({ id: `rune_${u.key}`, name: u.name, kind: 'rune', tier: t, icon: `gen:rune|c=${u.color}`, value: val(t, 12), slot: 'rune', base, tag: 'rune' });
}

// ---------- enchant scrolls ----------
const NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
NUMERALS.forEach((n, i) => {
  add({
    id: `scroll_${i + 1}`, name: `Scroll of Reinforcement ${n}`, kind: 'scroll', tier: i * 2.5, icon: `gen:scroll|c=${GEAR_COLORS[Math.min(19, i * 3)]}`,
    value: val(i * 2.5 + 3, 14), upgradeTier: i + 1, tag: 'scroll',
    desc: `Upgrades gear up to tier ${Math.round((i + 1) * 2.5)} by one level (max +10). May fail at higher levels.`,
  });
});

// ---------- misc ----------
export const ITEM_LIST = (): ItemDef[] => Object.values(ITEMS);

export const itemBaseCount = () => Object.keys(ITEMS).length;

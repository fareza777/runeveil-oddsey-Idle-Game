import type { RecipeDef } from '@/core/types';
import { xpForReq } from '@/core/xp';
import { econScale, money, zoneOfTier } from '@/core/money';
import { ELEMENTS } from './combatData';
import { GEAR_TYPES, gearId, gearName } from './gear';
import { ITEMS, MEAL_NAMES, POTION_LINES, POTION_PREFIX, RUNE_TIERS } from './items';
import { CROPS, FAMILIES, FISH, GEAR_TIERS, GEMS, HERBS, RES_TIERS, dropId, gemTierOf, resTierOf, reqLevelForGear, reqLevelForRes } from './tiers';

export const RECIPES: RecipeDef[] = [];
const push = (r: RecipeDef) => RECIPES.push(r);
const inp = (item: string, n: number) => ({ item, n });
const iconOf = (id: string) => ITEMS[id].icon;

// ---------- primary processing ----------
for (let r = 0; r < RES_TIERS; r++) {
  const L = reqLevelForRes(r);
  push({ id: `smelt_${r}`, skill: 'smithing', name: ITEMS[`bar_${r}`].name, level: L, xp: xpForReq(L, 0.8), time: 3, inputs: [inp(`ore_${r}`, 2)], out: [inp(`bar_${r}`, 1)], icon: iconOf(`bar_${r}`) });
  push({ id: `saw_${r}`, skill: 'carpentry', name: ITEMS[`plank_${r}`].name, level: L, xp: xpForReq(L, 0.8), time: 3, inputs: [inp(`log_${r}`, 2)], out: [inp(`plank_${r}`, 1)], icon: iconOf(`plank_${r}`) });
  push({ id: `cure_${r}`, skill: 'leatherworking', name: ITEMS[`leather_${r}`].name, level: L, xp: xpForReq(L, 0.8), time: 3, inputs: [inp(`hide_${r}`, 2)], out: [inp(`leather_${r}`, 1)], icon: iconOf(`leather_${r}`) });
}
GEMS.forEach((_, i) => {
  const L = 1 + Math.round(i * 5.9);
  push({ id: `cut_${i}`, skill: 'jewelcrafting', name: ITEMS[`gem_${i}`].name, level: L, xp: xpForReq(L, 0.8), time: 3, inputs: [inp(`gemr_${i}`, 1)], out: [inp(`gem_${i}`, 1)], icon: iconOf(`gem_${i}`) });
});

// ---------- gear ----------
function gearInputs(key: string, t: number): { item: string; n: number }[] {
  const r = resTierOf(t);
  const g = gemTierOf(t);
  const k = Math.ceil(t / 4);
  const bar = (n: number) => inp(`bar_${r}`, n);
  const plank = (n: number) => inp(`plank_${r}`, n);
  const leather = (n: number) => inp(`leather_${r}`, n);
  const gem = (n: number) => inp(`gem_${g}`, n);
  switch (key) {
    case 'sword': return [bar(3 + k), plank(1)];
    case 'mace': return [bar(4 + k), plank(2)];
    case 'dagger': return [bar(2 + k), leather(1)];
    case 'bow': return [plank(3 + k), leather(2)];
    case 'staff': return [plank(3 + k), gem(1)];
    case 'shield': return [bar(4 + k), plank(2)];
    case 'orb': return [gem(2), bar(1 + Math.floor(k / 2))];
    case 'helm': return [bar(3 + k), leather(1)];
    case 'cuirass': return [bar(6 + k * 2), leather(3)];
    case 'greaves': return [bar(5 + k), leather(2)];
    case 'gloves': return [leather(3 + k), bar(1)];
    case 'boots': return [leather(3 + k), bar(1)];
    case 'amulet': return [bar(2), gem(1)];
    default: return [bar(1), gem(1)];
  }
}
GEAR_TYPES.forEach((type, ti) => {
  for (let t = 1; t <= GEAR_TIERS; t++) {
    const L = Math.min(95, Math.max(reqLevelForGear(t), reqLevelForRes(resTierOf(t))));
    const inputs = gearInputs(type.key, t);
    if (t >= 5) {
      const fam = FAMILIES[(t * 4 + ti) % FAMILIES.length];
      inputs.push(inp(dropId(fam.id, (t % 2) as 0 | 1), 2));
    }
    push({
      id: `craft_${type.key}_${t}`, skill: type.skill, name: gearName(type, t), level: L, xp: xpForReq(L, 1.5),
      time: 4 + t * 0.2, inputs, gold: Math.round(12 * Math.pow(1.32, t - 1) * econScale(zoneOfTier(t))), out: [inp(gearId(type.key, t), 1)], quality: true, icon: ITEMS[gearId(type.key, t)].icon,
    });
  }
});

// ---------- cooking ----------
FISH.forEach((_, i) => {
  const L = 1 + Math.round(i * 4.6);
  push({ id: `grill_${i}`, skill: 'cooking', name: ITEMS[`cfish_${i}`].name, level: L, xp: xpForReq(L, 0.9), time: 2.5, inputs: [inp(`fish_${i}`, 1)], out: [inp(`cfish_${i}`, 1)], icon: iconOf(`cfish_${i}`) });
});
MEAL_NAMES.forEach((_, i) => {
  const L = 4 + Math.round(i * 3.9);
  const inputs = [inp(`crop_${Math.floor((i * CROPS.length) / MEAL_NAMES.length)}`, 2), inp(`cfish_${Math.floor((i * FISH.length) / MEAL_NAMES.length)}`, 1)];
  if (i >= 8) inputs.push(inp(`herb_${Math.floor(((i - 8) * HERBS.length) / 16)}`, 1));
  push({ id: `cook_${i}`, skill: 'cooking', name: ITEMS[`meal_${i}`].name, level: L, xp: xpForReq(L, 1.3), time: 4.5, inputs, gold: money(4 + i * 6, 1 + (i * 21) / 23), out: [inp(`meal_${i}`, 1)], icon: iconOf(`meal_${i}`) });
});

// ---------- alchemy ----------
for (const line of POTION_LINES) {
  for (let k = 0; k < line.tiers; k++) {
    const L = Math.min(95, line.start + k * line.step);
    const h = Math.min(HERBS.length - 1, Math.round(L / 6));
    const inputs = [inp(`herb_${h}`, 3), inp(`crop_${Math.min(CROPS.length - 1, Math.round(L / 6.2))}`, 1)];
    if (line.cleanse) inputs.push(inp(dropId('slime', 0), 2));
    if (line.xp) inputs.push(inp(`relic_${Math.min(11, Math.floor(L / 9))}`, 1));
    const pre = POTION_PREFIX[Math.min(POTION_PREFIX.length - 1, Math.round((k * (POTION_PREFIX.length - 1)) / Math.max(1, line.tiers - 1)))];
    void pre;
    const id = `pot_${line.key}_${k}`;
    push({ id: `brew_${line.key}_${k}`, skill: 'alchemy', name: ITEMS[id].name, level: L, xp: xpForReq(L, 1.3), time: 5, inputs, gold: money(6 + Math.round(L * 1.4), 1 + (L * 21) / 99), out: [inp(id, 1)], icon: iconOf(id) });
  }
}

// ---------- enchanting ----------
const ESS_SRC: Record<string, string[]> = {
  physical: ['drop_minotaur_0', 'drop_skelwar_0'], fire: ['drop_genie_0', 'drop_scorpion_1'], frost: ['drop_ghost_1', 'drop_zombie_1'],
  nature: ['drop_slime_0', 'drop_mushroom_0'], shock: ['drop_slimesword_1', 'drop_wasp_0'], shadow: ['drop_skeleton_0', 'drop_succubus_0'],
  holy: ['drop_wasp_1', 'drop_lamia_0'], arcane: ['drop_magus_0', 'drop_genie_1'],
};
ELEMENTS.forEach((e, i) => {
  const L = 5 + i * 10;
  const [a, b] = ESS_SRC[e.id];
  push({ id: `distill_${e.id}`, skill: 'enchanting', name: ITEMS[`ess_${e.id}`].name, level: L, xp: xpForReq(L, 1), time: 4, inputs: [inp(a, 3), inp(b, 2)], out: [inp(`ess_${e.id}`, 1)], icon: iconOf(`ess_${e.id}`) });
});
for (let k = 1; k <= 8; k++) {
  const L = 1 + Math.round((k - 1) * 13);
  const el = ELEMENTS[k % ELEMENTS.length].id;
  push({
    id: `scribe_${k}`, skill: 'enchanting', name: ITEMS[`scroll_${k}`].name, level: L, xp: xpForReq(L, 1.4), time: 6,
    inputs: [inp('ess_physical', 1 + Math.ceil(k / 2)), inp(`ess_${el}`, 1), inp(`relic_${Math.round(((k - 1) * 11) / 7)}`, 1)],
    gold: money(80 * Math.pow(2.2, k), 1 + (k - 1) * 3), out: [inp(`scroll_${k}`, 1)], icon: iconOf(`scroll_${k}`),
  });
}

// ---------- runecrafting ----------
ELEMENTS.forEach((e, i) => {
  RUNE_TIERS.forEach((rt, ti) => {
    const L = ti === 0 ? 18 + i * 3 : 58 + i * 3;
    const r = ti === 0 ? 3 : 8;
    const id = `rune_${e.id}_${rt.key}`;
    push({
      id: `carve_${e.id}_${rt.key}`, skill: 'runecrafting', name: ITEMS[id].name, level: L, xp: xpForReq(L, 1.4), time: 6,
      inputs: [inp(`plank_${r}`, 2), inp(`ess_${e.id}`, ti === 0 ? 3 : 8), inp(`relic_${r}`, 1)], gold: money(300 * Math.pow(3.3, ti), ti === 0 ? 8 : 15), out: [inp(id, 1)], quality: true, icon: iconOf(id),
    });
  });
});
[['might', 40], ['fortune', 46], ['ward', 52], ['swift', 58]].forEach(([k, L], i) => {
  push({
    id: `carve_${k}`, skill: 'runecrafting', name: ITEMS[`rune_${k}`].name, level: L as number, xp: xpForReq(L as number, 1.4), time: 7,
    inputs: [inp('plank_5', 3), inp(`ess_${ELEMENTS[(i * 2) % 8].id}`, 4), inp('relic_6', 1)], gold: money(2500, 10), out: [inp(`rune_${k}`, 1)], quality: true, icon: iconOf(`rune_${k}`),
  });
});

// ---------- trading caravans ----------
const CARAVANS = ['Village Peddling', 'Roadside Stall', 'Market Haggling', 'Caravan Escort', 'Guild Contract', 'River Barge Trade', 'Spice Route', 'Royal Charter', 'Skyship Freight', 'Aurum Exchange'];
CARAVANS.forEach((n, i) => {
  const L = 1 + i * 9;
  const cost = Math.round(60 * Math.pow(3, i));
  push({ id: `trade_${i}`, skill: 'trading', name: n, level: L, xp: xpForReq(L, 1), time: 5, inputs: [], gold: cost, out: [], outGold: Math.round(cost * 1.22), icon: 'img:relic_coin_purse' });
});

export const RECIPE_MAP: Record<string, RecipeDef> = Object.fromEntries(RECIPES.map((r) => [r.id, r]));

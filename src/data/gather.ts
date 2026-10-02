import type { GatherDef } from '@/core/types';
import { xpForReq } from '@/core/xp';
import { ITEMS } from './items';
import { CROPS, FAMILIES, FISH, GEMS, GEM_COLORS, HERBS, METALS, RES_TIERS, WOODS, dropId, reqLevelForRes } from './tiers';
import { ZONE_NAMES } from './zoneNames';

import { money, zoneOfTier } from '@/core/money';

export const GATHER: GatherDef[] = [];
/** Zone-like progress index for a resource tier (12 tiers span the 22 zones). */
const zr = (r: number) => 1 + (r * 21) / (RES_TIERS - 1);
const goldDrop = (z: number, chance: number, min: number, max: number) => ({ item: 'gold', chance, min: money(min, z), max: money(max, z) });
const push = (g: GatherDef) => GATHER.push(g);

const MINE_NODES = ['Surface Outcrop', 'Iron Seam', 'Deep Vein', 'Silver Lode', 'Cobalt Pocket', 'Mithril Vein', 'Adamant Cavern', 'Orichalcum Crag', 'Starsteel Meteorite', 'Voidglass Fissure', 'Aether Geode', 'Runic Monolith'];
const TREES = ['Pine Grove', 'Old Oak', 'Birch Stand', 'Maple Ridge', 'Yew Hollow', 'Ashwood', 'Ironwood Thicket', 'Redwood Giant', 'Moonwood Glade', 'Shadowbark Tree', 'Crystalwood Spire', 'Worldroot Bough'];
const BEASTS = ['Hare Warren', 'Wolf Den', 'Boar Wallow', 'Bear Cave', 'Panther Ledge', 'Wyvern Roost', 'Basilisk Lair', 'Mammoth Plain', 'Direwolf Pack', 'Shadowcat Prowl', 'Dragon Aerie', 'Primeval Herd'];
const DIGS = ['Shallow Dig', 'Buried Cellar', 'Barrow Mound', 'Sunken Midden', 'Collapsed Mine', 'Forgotten Vault', 'Fossil Bed', 'Pharaoh Shaft', 'Starfall Crater', 'Void Tomb', 'Primal Barrow', 'First Ruins'];

for (let r = 0; r < RES_TIERS; r++) {
  const L = reqLevelForRes(r);
  const gi = Math.floor((r * GEMS.length) / RES_TIERS);
  push({ id: `mine_${r}`, skill: 'mining', name: `${METALS[r]} ${r % 2 ? 'Seam' : 'Outcrop'}`, level: L, xp: xpForReq(L), time: 3 + r * 0.12, icon: `gen:ore|c=ore${r}`, desc: MINE_NODES[r], drops: [{ item: `ore_${r}`, chance: 1, min: 1, max: 2 }, { item: `gemr_${gi}`, chance: 0.03 }] });
  push({ id: `wood_${r}`, skill: 'woodcutting', name: WOODS[r] + ' Tree', level: L, xp: xpForReq(L), time: 3 + r * 0.12, icon: `gen:log|c=wood${r}`, desc: TREES[r], drops: [{ item: `log_${r}`, chance: 1, min: 1, max: 2 }, { item: `herb_${Math.min(15, Math.floor(r * 1.3))}`, chance: 0.04 }] });
  push({ id: `hunt_${r}`, skill: 'hunting', name: BEASTS[r], level: L, xp: xpForReq(L), time: 3.6 + r * 0.14, icon: `gen:hide|c=hide${r}`, desc: BEASTS[r], drops: [{ item: `hide_${r}`, chance: 1, min: 1, max: 2 }, { item: dropId(FAMILIES[(r * 5 + 3) % FAMILIES.length].id, 0), chance: 0.2 }, goldDrop(zr(r), 0.35, 4 + r * 6, 10 + r * 12)] });
  push({ id: `dig_${r}`, skill: 'excavation', name: DIGS[r], level: L, xp: xpForReq(L, 1.05), time: 3.8 + r * 0.14, icon: `gen:relic|c=${GEM_COLORS[gi]}`, desc: DIGS[r], drops: [{ item: `gemr_${gi}`, chance: 1, min: 1, max: 2 }, { item: `gemr_${Math.min(15, gi + 1)}`, chance: 0.3 }, { item: `relic_${r}`, chance: 0.14 }, { item: `ore_${r}`, chance: 0.18 }, goldDrop(zr(r), 0.25, 6 + r * 8, 16 + r * 16)] });
}

FISH.forEach((f, i) => {
  const L = 1 + Math.round(i * 4.6);
  push({ id: `fish_${i}`, skill: 'fishing', name: `${f} Shoal`, level: L, xp: xpForReq(L), time: 3.4 + i * 0.1, icon: `gen:fish|c=fish${i}`, desc: `Cast for ${f}.`, drops: [{ item: `fish_${i}`, chance: 1, min: 1, max: 2 }, { item: `herb_${Math.min(15, Math.floor(i * 0.8))}`, chance: 0.03 }, goldDrop(zoneOfTier(i + 1), 0.15, 3 + i * 5, 8 + i * 10)] });
});
HERBS.forEach((h, i) => {
  const L = 1 + Math.round(i * 5.8);
  push({ id: `herb_${i}`, skill: 'herbalism', name: `${h} Patch`, level: L, xp: xpForReq(L), time: 3.2 + i * 0.12, icon: `gen:herb|c=herb${i}`, desc: `Pick ${h}.`, drops: [{ item: `herb_${i}`, chance: 1, min: 1, max: 3 }, { item: `crop_${Math.min(15, i)}`, chance: 0.05 }] });
});
CROPS.forEach((c, i) => {
  const L = 1 + Math.round(i * 5.8);
  push({ id: `farm_${i}`, skill: 'farming', name: `${c} Field`, level: L, xp: xpForReq(L), time: 4.2 + i * 0.14, icon: `gen:crop|c=crop${i}`, desc: `Tend ${c}.`, drops: [{ item: `crop_${i}`, chance: 1, min: 2, max: 4 }, { item: `herb_${Math.min(15, i)}`, chance: 0.05 }] });
});

// Exploration: scout each zone
ZONE_NAMES.forEach((z, i) => {
  const L = Math.max(1, Math.round(1 + i * 4.3));
  const r = Math.min(RES_TIERS - 1, Math.floor((i * RES_TIERS) / ZONE_NAMES.length));
  push({
    id: `scout_${i + 1}`, skill: 'exploration', name: `Scout ${z}`, level: L, xp: xpForReq(L, 1.1), time: 6 + i * 0.2, icon: 'img:ui_icon_map', desc: `Map hidden paths in ${z}.`,
    drops: [goldDrop(i + 1, 0.7, 10 + i * 14, 30 + i * 30), { item: `relic_${r}`, chance: 0.12 }, { item: `ore_${r}`, chance: 0.2, min: 1, max: 2 }, { item: `log_${r}`, chance: 0.2, min: 1, max: 2 }, { item: `herb_${Math.min(15, i)}`, chance: 0.2 }, { item: `scroll_${Math.min(8, 1 + Math.floor(i / 3))}`, chance: 0.02 }],
  });
});

for (const g of GATHER) {
  if (g.skill === 'exploration') continue;
  const main = ITEMS[g.drops[0].item];
  if (main) g.icon = main.icon;
}

export const GATHER_MAP: Record<string, GatherDef> = Object.fromEntries(GATHER.map((g) => [g.id, g]));

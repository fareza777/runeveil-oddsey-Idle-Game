import type { DropEntry, GameState, MonsterDef } from './types';
import { ITEMS, MAX_RARITY } from '@/data';
import { GEAR_TYPES, gearId } from '@/data/gear';
import type { Rand } from './rng';
import { gearTierForLevel } from './balance';
import { partyLuck, skillBonuses } from './stats';
import { addGear, addGold, addItem, newGear, type Ctx } from './state';

export const maxRarityForZone = (zone: number): number => Math.min(MAX_RARITY, Math.floor(3 + 1.1 * zone));

/** Lowest rarity a guaranteed boss drop can roll. Rises with the zone so early bosses cannot hand out endgame rarities. */
export const bossGearMinRarity = (zone: number): number => Math.min(8, 2 + Math.floor(zone / 3));
/** Uniques are special but still belong to their zone: Fine at the start, Valiant by the late game. */
export const uniqueMinRarity = (zone: number): number => Math.min(9, 3 + Math.floor(zone * 0.45));

export function rarityQ(state: GameState, extra = 0): number {
  const luck = partyLuck(state);
  const b = skillBonuses(state);
  return Math.max(0.3, Math.min(0.8, 0.44 + luck / 500 + b.rarityPct / 400 + extra));
}

export function rollRarity(rng: Rand, maxR: number, q: number, minR = 1): number {
  let r = minR;
  while (r < maxR && rng() < q) r++;
  return r;
}

export function rollEntry(state: GameState, d: DropEntry, luckMult: number, maxR: number, q: number, ctx: Ctx, minRarity = 1) {
  if (ctx.rng() >= Math.min(1, d.chance * luckMult)) return;
  const n = d.min !== undefined ? d.min + Math.floor(ctx.rng() * ((d.max ?? d.min) - d.min + 1)) : 1;
  if (d.item === 'gold') {
    addGold(state, n * (1 + skillBonuses(state).goldPct / 100), ctx);
    return;
  }
  const def = ITEMS[d.item];
  if (!def) return;
  if (def.kind === 'equip' || def.kind === 'rune') {
    const r = rollRarity(ctx.rng, maxR, q, minRarity);
    addGear(state, newGear(state, d.item, r), ctx);
  } else if (def.kind === 'card') {
    addItem(state, d.item, 1, ctx);
    state.cardsFound[d.item] = (state.cardsFound[d.item] ?? 0) + 1;
    ctx.emit({ t: 'toast', text: `Monster card found: ${def.name}!`, kind: 'good' });
  } else addItem(state, d.item, n, ctx);
}

export function rollMonsterLoot(state: GameState, m: MonsterDef, ctx: Ctx, firstBossKill = false) {
  const luck = partyLuck(state);
  const luckMult = 1 + luck / 200;
  const maxR = maxRarityForZone(m.zone) + (m.boss ? 2 : m.elite ? 1 : 0);
  const q = rarityQ(state, m.boss ? 0.08 : m.elite ? 0.04 : 0);
  const g = m.gold[0] + Math.floor(ctx.rng() * (m.gold[1] - m.gold[0] + 1));
  addGold(state, g * (1 + skillBonuses(state).goldPct / 100), ctx);
  for (const d of m.drops) rollEntry(state, d, luckMult, maxR, q, ctx);
  if (m.boss) {
    const tier = gearTierForLevel(m.level);
    const type = GEAR_TYPES[Math.floor(ctx.rng() * GEAR_TYPES.length)];
    const r = rollRarity(ctx.rng, maxR, Math.min(0.85, q + 0.06), bossGearMinRarity(m.zone));
    addGear(state, newGear(state, gearId(type.key, tier), r), ctx);
    const unique = (m as { unique?: string }).unique;
    if (unique && ITEMS[unique] && (firstBossKill || ctx.rng() < (m.rare ? 0.35 : 0.08) * luckMult)) {
      addGear(state, newGear(state, unique, rollRarity(ctx.rng, maxR, q, Math.min(maxR, uniqueMinRarity(m.zone)))), ctx);
      ctx.emit({ t: 'toast', text: `Unique drop: ${ITEMS[unique].name}!`, kind: 'good' });
    }
  }
}


/** Three-tier currency. All balances are stored as whole silver; gold and platinum are display denominations. */
export const SILVER_PER_GOLD = 10_000;
export const GOLD_PER_PLATINUM = 10_000;
export const SILVER_PER_PLATINUM = SILVER_PER_GOLD * GOLD_PER_PLATINUM;

/**
 * Money growth on top of each source's own curve, so late zones pay in gold and platinum.
 * `z` is a zone-like progress index (1 = start of the game, 22 = last zone).
 */
export const ECON_GROWTH = 1.33;
export const econScale = (z: number): number => Math.pow(ECON_GROWTH, Math.max(0, z - 1));

/** Zone-like index for a 1-based gear tier (20 tiers span the 22 zones). */
export const zoneOfTier = (tier: number): number => 1 + ((tier - 1) * 21) / 19;

export interface MoneyParts { platinum: number; gold: number; silver: number }

export function splitMoney(silver: number): MoneyParts {
  let n = Math.max(0, Math.floor(silver));
  const platinum = Math.floor(n / SILVER_PER_PLATINUM);
  n -= platinum * SILVER_PER_PLATINUM;
  const gold = Math.floor(n / SILVER_PER_GOLD);
  return { platinum, gold, silver: n - gold * SILVER_PER_GOLD };
}

/** Scale a base amount of silver by the economy curve at progress `z`. */
export const money = (base: number, z: number): number => Math.max(1, Math.round(base * econScale(z)));

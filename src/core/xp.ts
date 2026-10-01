import { MAX_LEVEL } from '@/data/skills';

/** Cumulative XP needed to reach `level` (level 1 = 0). */
const TABLE: number[] = [0, 0];
{
  let acc = 0;
  for (let l = 1; l < 140; l++) {
    acc += Math.floor((l + 60 * Math.pow(2, l / 8)) / 4);
    TABLE[l + 1] = acc;
  }
}

export const xpAtLevel = (level: number): number => TABLE[Math.min(139, Math.max(1, level))];
export const xpToNext = (level: number): number => xpAtLevel(level + 1) - xpAtLevel(level);

export function levelFromXp(xp: number, cap = MAX_LEVEL): number {
  let lo = 1;
  let hi = cap;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (TABLE[mid] <= xp) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

/** Skill XP for one action at a given required level, tuned so ~7 actions give the first level and ~150 give level 90+. */
export const xpForReq = (reqLevel: number, mult = 1): number =>
  Math.max(2, Math.round((xpToNext(reqLevel) / (5 + 1.6 * reqLevel)) * mult));

export const HERO_MAX_LEVEL = 100;
/** Hero level curve (separate from skills): gentler growth. */
export const heroXpToNext = (level: number): number => Math.round(40 * Math.pow(level, 1.9) + 60);

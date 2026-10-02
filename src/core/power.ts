import type { GameState } from './types';
import { expected } from './expected';
import { computeHero } from './stats';
import { BAL } from './balance';

/**
 * How the party compares with the party a zone is built around: 1 means "as prepared as designed".
 * Measured with the geometric mean of damage output and total HP.
 */
export function partyPower(s: GameState, zone: number): number {
  let dps = 0;
  let hp = 0;
  for (let i = 0; i < s.heroes.length; i++) {
    const c = computeHero(s, i);
    dps += (c.atk * (1 + (c.crit / 100) * (c.critDmg / 100 - 1))) / c.interval;
    hp += c.maxHp;
  }
  const e = expected(zone);
  return Math.sqrt((dps / e.dps) * (hp / e.partyHp));
}

/** Power at which a zone boss becomes a fair fight (found by simulation, see tests/sim.test.ts). */
export const bossPowerNeeded = (zone: number): number => Math.min(0.9, 0.5 + 0.1 * zone) * (1 + BAL.lateGrowth * Math.max(0, zone - 10));

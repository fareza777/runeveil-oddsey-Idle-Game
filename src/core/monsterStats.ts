import type { MonsterDef } from './types';
import { ZONE_MAP } from '@/data';
import { BAL } from './balance';
import { expected } from './expected';

const cache = new Map<string, { hp: number; atk: number; def: number; interval: number; ref: number }>();

/** Early zones scale monsters down so a fresh party can win; reaches 1 at BAL.easeUntil. */
export const zoneEase = (zone: number): number =>
  Math.min(1, BAL.easeStart + ((1 - BAL.easeStart) * (zone - 1)) / (BAL.easeUntil - 1));

/** Monster stats are derived from the party a well-prepared player would bring to that zone. */
export function monsterStats(m: MonsterDef) {
  const hit = cache.get(m.id);
  if (hit) return hit;
  const ex = expected(m.zone);
  const zone = ZONE_MAP[m.zone];
  const span = Math.max(1, zone.levelRange[1] - zone.levelRange[0]);
  const lf = 0.85 + 0.3 * Math.max(0, Math.min(1, (m.level - zone.levelRange[0]) / span));
  const hpK = m.boss ? BAL.bossHp : m.elite ? BAL.eliteHp : 1;
  const atkK = m.boss ? BAL.bossAtk : m.elite ? BAL.eliteAtk : 1;
  const ease = zoneEase(m.zone);
  const ref = ex.def;
  const mit = ref / (ref + BAL.defK * ref);
  const hits = BAL.killSeconds / 2.6;
  const perHit = (BAL.fightLoss * ex.partyHp) / hits;
  const out = {
    hp: Math.round(ex.dps * BAL.killSeconds * m.hpMul * lf * hpK * ease),
    atk: Math.round((perHit / (1 - mit)) * m.atkMul * lf * atkK * ease * 10) / 10,
    def: Math.round(ref * BAL.monsterDefShare * m.defMul * 10) / 10,
    interval: m.speed,
    ref,
  };
  cache.set(m.id, out);
  return out;
}

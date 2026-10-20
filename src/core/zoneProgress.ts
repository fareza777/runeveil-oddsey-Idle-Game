import type { GameState } from './types';
import { MONSTERS, ZONE_MAP } from '@/data';

/** Boss access is earned once by defeating each regular enemy type in the zone. */
export function zoneClearProgress(s: GameState, zone: number) {
  const ids = ZONE_MAP[zone].monsters;
  const remaining = ids.filter((id) => !(s.kills[id] > 0));
  return { defeated: ids.length - remaining.length, total: ids.length, remaining };
}

export function bossLockReason(s: GameState, id: string): string | null {
  const m = MONSTERS[id];
  if (!m?.boss) return null;
  const p = zoneClearProgress(s, m.zone);
  return p.remaining.length
    ? `Defeat every regular enemy in ${ZONE_MAP[m.zone].name} first (${p.defeated}/${p.total})`
    : null;
}

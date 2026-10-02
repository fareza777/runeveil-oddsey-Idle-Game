import type { GameState, PlanStep } from './types';
import { GATHER, GATHER_MAP, MONSTERS, RECIPE_MAP, ZONE_MAP, ZONES } from '@/data';

/** Limits that keep the auto plan from running forever unattended. */
export const PLAN_RULES = {
  maxSteps: 4,
  /** Allowed lengths of one step, in minutes. */
  stepMinutes: [10, 20, 30, 45, 60, 90, 120, 180],
  /** How long one start may run before it stops by itself, in hours. */
  baseHours: 8,
  /** A rewarded ad adds this many hours, up to `extendMax` times per start. */
  extendHours: 4,
  extendMax: 2,
  /** A crafting step makes this many pieces per round before it starts counting again. */
  craftBatch: 10,
};

export function stepLabel(st: PlanStep): string {
  if (st.kind === 'gather') return GATHER_MAP[st.id]?.name ?? st.id;
  if (st.kind === 'craft') return RECIPE_MAP[st.id]?.name ?? st.id;
  return ZONE_MAP[Number(st.id.slice(5))]?.name ?? MONSTERS[st.id]?.name ?? st.id;
}

export const KIND_LABEL: Record<PlanStep['kind'], string> = { gather: 'Gather', craft: 'Craft', combat: 'Battle' };

export const fmtMin = (min: number): string => (min >= 60 ? `${Math.floor(min / 60)}h${min % 60 ? ` ${min % 60}m` : ''}` : `${min}m`);

/** The zone with the highest level the party can currently enter. */
export function bestZoneId(s: GameState): number {
  let best = 1;
  for (const z of ZONES) if (z.id <= s.zoneUnlocked && z.reqExploration <= s.skills.exploration) best = z.id;
  return best;
}

/** The highest-level gather node the player can already work for a skill. */
export function bestNodeFor(s: GameState, skill: string): string | null {
  const n = GATHER.filter((g) => g.skill === skill && g.level <= s.skills[g.skill] && (skill !== 'exploration' || Number(g.id.split('_')[1]) <= s.zoneUnlocked)).sort((a, b) => b.level - a.level)[0];
  return n?.id ?? null;
}

/** A sensible first plan: gather for an hour, then fight for two. */
export function defaultPlan(s: GameState): PlanStep[] {
  const node = bestNodeFor(s, 'mining') ?? bestNodeFor(s, 'woodcutting') ?? GATHER[0].id;
  return [
    { kind: 'gather', id: node, min: 60 },
    { kind: 'combat', id: `zone:${bestZoneId(s)}`, min: 120 },
  ];
}

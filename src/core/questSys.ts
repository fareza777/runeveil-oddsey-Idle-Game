import type { GameState, QuestDef, QuestStep } from './types';
import { ITEMS, QUESTS, QUEST_MAP } from '@/data';
import { addGold, addItem, gainXp, recruitHero, type Ctx } from './state';

export function isAvailable(s: GameState, q: QuestDef): boolean {
  if (s.quests.done.includes(q.id) || s.quests.active.includes(q.id)) return false;
  if (q.requires && !s.quests.done.includes(q.requires)) return false;
  if (q.reqZone && s.zoneUnlocked < q.reqZone) return false;
  if (q.reqSkill && s.skills[q.reqSkill.skill] < q.reqSkill.level) return false;
  return true;
}

export function availableQuests(s: GameState): QuestDef[] {
  return QUESTS.filter((q) => q.kind !== 'main' && isAvailable(s, q));
}

export function autoAcceptMain(s: GameState, ctx?: Ctx) {
  for (const q of QUESTS) {
    if (q.kind === 'main' && isAvailable(s, q)) {
      s.quests.active.push(q.id);
      ctx?.emit({ t: 'quest', id: q.id, what: 'accepted' });
    }
  }
}

export function acceptQuest(s: GameState, id: string, ctx?: Ctx): boolean {
  const q = QUEST_MAP[id];
  if (!q || !isAvailable(s, q)) return false;
  s.quests.active.push(id);
  ctx?.emit({ t: 'quest', id, what: 'accepted' });
  return true;
}

export function stepProgress(s: GameState, q: QuestDef, i: number): number {
  const st = q.steps[i];
  switch (st.type) {
    case 'skill': return s.skills[st.target as keyof typeof s.skills] ?? 0;
    case 'own': return Math.min(st.n, s.stacks[st.target!] ?? 0);
    case 'gold': return Math.min(st.n, s.gold);
    case 'heroLevel': return Math.max(...s.heroes.concat(s.bench).map((h) => h.level));
    case 'zone': return s.zoneUnlocked;
    default: return Math.min(st.n, s.quests.progress[q.id]?.[i] ?? 0);
  }
}

export const stepDone = (s: GameState, q: QuestDef, i: number): boolean => stepProgress(s, q, i) >= q.steps[i].n;
export const questDone = (s: GameState, q: QuestDef): boolean => q.steps.every((_, i) => stepDone(s, q, i));

export function questEvent(s: GameState, type: QuestStep['type'], target: string, n = 1) {
  for (const id of s.quests.active) {
    const q = QUEST_MAP[id];
    if (!q) continue;
    q.steps.forEach((st, i) => {
      if (st.type !== type || st.target !== target) return;
      const arr = (s.quests.progress[id] ??= q.steps.map(() => 0));
      arr[i] = Math.min(st.n, arr[i] + n);
    });
  }
}

/** Gather events count either by node id (one per action) or by item id (quantity). */
export function gatherEvent(s: GameState, nodeId: string, gained: Record<string, number>) {
  for (const id of s.quests.active) {
    const q = QUEST_MAP[id];
    if (!q) continue;
    q.steps.forEach((st, i) => {
      if (st.type !== 'gather') return;
      const add = st.target === nodeId ? 1 : (gained[st.target ?? ''] ?? 0);
      if (!add) return;
      const arr = (s.quests.progress[id] ??= q.steps.map(() => 0));
      arr[i] = Math.min(st.n, arr[i] + add);
    });
  }
}

export function refreshQuests(s: GameState, ctx?: Ctx) {
  autoAcceptMain(s, ctx);
  for (const id of s.quests.active) {
    const q = QUEST_MAP[id];
    if (!q) continue;
    const flag = `${id}#r`;
    if (questDone(s, q) && !s.quests.progress[flag]) {
      s.quests.progress[flag] = [1];
      ctx?.emit({ t: 'quest', id, what: 'ready' });
    }
  }
}

export function claimQuest(s: GameState, id: string, ctx?: Ctx): boolean {
  const q = QUEST_MAP[id];
  if (!q || !s.quests.active.includes(id) || !questDone(s, q)) return false;
  s.quests.active = s.quests.active.filter((x) => x !== id);
  s.quests.done.push(id);
  delete s.quests.progress[id];
  delete s.quests.progress[`${id}#r`];
  const r = q.reward;
  if (r.gold) addGold(s, r.gold, ctx);
  for (const it of r.items ?? []) if (ITEMS[it.item]) addItem(s, it.item, it.n, ctx);
  for (const x of r.xp ?? []) gainXp(s, x.skill, x.n, ctx);
  if (r.hero) recruitHero(s, r.hero, ctx);
  ctx?.emit({ t: 'quest', id, what: 'done' });
  autoAcceptMain(s, ctx);
  return true;
}

export function readyCount(s: GameState): number {
  return s.quests.active.reduce((n, id) => n + (QUEST_MAP[id] && questDone(s, QUEST_MAP[id]) ? 1 : 0), 0);
}

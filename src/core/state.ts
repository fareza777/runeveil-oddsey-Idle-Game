import type { Element, GameState, ItemInstance, SkillId, StatusId } from './types';
import { HEROES, ITEMS, MAX_LEVEL, SKILL_IDS, rarity } from '@/data';
import { skillBonuses } from './stats';
import { HERO_MAX_LEVEL, heroXpToNext, levelFromXp, xpAtLevel } from './xp';
import type { Rand } from './rng';

export type GameEvent =
  | { t: 'xp'; skill: SkillId; n: number }
  | { t: 'level'; skill: SkillId; level: number; from: number }
  | { t: 'item'; id: string; n: number }
  | { t: 'gear'; inst: ItemInstance }
  | { t: 'gold'; n: number }
  | { t: 'sold'; n: number; gold: number }
  | { t: 'dmg'; side: 'hero' | 'enemy'; idx: number; n: number; crit: boolean; elem: Element; heal?: boolean; miss?: boolean; text?: string }
  | { t: 'status'; side: 'hero' | 'enemy'; idx: number; status: StatusId; on: boolean }
  | { t: 'spawn'; id: string }
  | { t: 'kill'; id: string; boss: boolean }
  | { t: 'boss'; id: string; first: boolean }
  | { t: 'wipe'; final: boolean }
  | { t: 'ability'; idx: number; name: string }
  | { t: 'heroLevel'; idx: number; level: number }
  | { t: 'quest'; id: string; what: 'ready' | 'accepted' | 'done' }
  | { t: 'toast'; text: string; kind?: 'good' | 'bad' | 'info' }
  | { t: 'stop'; reason: string }
  | { t: 'zone'; id: number }
  | { t: 'action'; kind: 'gather' | 'craft' | 'combat'; id: string }
  | { t: 'food'; idx: number; item: string };

export interface Ctx {
  emit(e: GameEvent): void;
  rng: Rand;
}

export const BAG_MAX = 150;
export const GAME_VERSION = 1;

export function defaultSettings() {
  return {
    sfx: 0.7, music: 0.5, haptics: true, offlineNotice: true, numberFormat: 'short' as const, autoEat: 0.5, autoPotion: true,
    reduceMotion: false, combatLog: false, autoSell: 0,
  };
}

export function newState(name = 'Wayfarer', seed = (Date.now() ^ 0x9e3779b9) >>> 0): GameState {
  const skills = {} as Record<SkillId, number>;
  const skillXp = {} as Record<SkillId, number>;
  for (const id of SKILL_IDS) {
    skills[id] = 1;
    skillXp[id] = 0;
  }
  return {
    v: GAME_VERSION, name, createdAt: Date.now(), lastSeen: Date.now(), playTime: 0, clock: 0,
    settings: defaultSettings(), skills, skillXp,
    heroes: HEROES.map((h) => ({ id: h.id, level: 1, xp: 0, equip: {} })),
    stacks: { cfish_0: 6 }, gear: [], gold: 50, gems: 0, activity: null, zone: 1, zoneUnlocked: 1,
    kills: {}, bossKills: {}, loadout: { food: null, potion: null }, buffs: [], xpBoost: null,
    quests: { done: [], active: ['main_0'], progress: {} }, codex: { items: {}, monsters: {} }, stats: {}, uidSeq: 1, tutorial: 0, seed, achievements: [], gatherCounts: {},
  };
}

// ---------- inventory ----------
export const countItem = (s: GameState, id: string): number => s.stacks[id] ?? 0;

export function addItem(s: GameState, id: string, n: number, ctx?: Ctx) {
  if (n <= 0) return;
  if (id === 'gold') return addGold(s, n, ctx);
  s.stacks[id] = (s.stacks[id] ?? 0) + n;
  s.codex.items[id] = 1;
  ctx?.emit({ t: 'item', id, n });
}

export function takeItem(s: GameState, id: string, n: number): boolean {
  if ((s.stacks[id] ?? 0) < n) return false;
  s.stacks[id] -= n;
  if (s.stacks[id] <= 0) delete s.stacks[id];
  return true;
}

export function addGold(s: GameState, n: number, ctx?: Ctx) {
  const g = Math.round(n);
  if (g <= 0) return;
  s.gold += g;
  s.stats.goldEarned = (s.stats.goldEarned ?? 0) + g;
  ctx?.emit({ t: 'gold', n: g });
}

export function newGear(s: GameState, id: string, r: number): ItemInstance {
  const inst: ItemInstance = { uid: (s.uidSeq++).toString(36), id, rarity: r, up: 0 };
  s.codex.items[id] = 1;
  return inst;
}

export function sellPrice(s: GameState, inst: ItemInstance): number {
  const def = ITEMS[inst.id];
  const b = skillBonuses(s);
  return Math.max(1, Math.round(def.value * rarity(inst.rarity).value * (1 + b.goldPct / 100) * (1 + inst.up * 0.3) * 0.5));
}

export function itemSellPrice(s: GameState, id: string): number {
  const b = skillBonuses(s);
  return Math.max(1, Math.round(ITEMS[id].value * 0.5 * (1 + b.goldPct / 100)));
}

export function addGear(s: GameState, inst: ItemInstance, ctx?: Ctx): 'kept' | 'sold' {
  const limit = s.settings.autoSell;
  const sellIt = (limit > 0 && inst.rarity < limit && !ITEMS[inst.id].unique) || s.gear.length >= BAG_MAX;
  if (sellIt) {
    const g = sellPrice(s, inst);
    s.gold += g;
    s.stats.goldEarned = (s.stats.goldEarned ?? 0) + g;
    s.stats.autoSold = (s.stats.autoSold ?? 0) + 1;
    ctx?.emit({ t: 'sold', n: 1, gold: g });
    return 'sold';
  }
  s.gear.push(inst);
  ctx?.emit({ t: 'gear', inst });
  return 'kept';
}

// ---------- xp ----------
export function xpMultiplier(s: GameState, skill: SkillId): number {
  let m = 1 + skillBonuses(s).xpPct / 100;
  const b = s.xpBoost;
  if (b && b.left > 0 && (b.skill === 'all' || b.skill === skill)) m += b.pct;
  return m;
}

export function gainXp(s: GameState, skill: SkillId, base: number, ctx?: Ctx) {
  const amount = base * xpMultiplier(s, skill);
  const before = s.skills[skill];
  s.skillXp[skill] = (s.skillXp[skill] ?? xpAtLevel(before)) + amount;
  const lv = levelFromXp(s.skillXp[skill], MAX_LEVEL);
  s.stats.xpTotal = (s.stats.xpTotal ?? 0) + amount;
  if (lv > before) {
    s.skills[skill] = lv;
    ctx?.emit({ t: 'level', skill, level: lv, from: before });
  }
  if (lv >= MAX_LEVEL) s.skillXp[skill] = xpAtLevel(MAX_LEVEL);
  ctx?.emit({ t: 'xp', skill, n: amount });
}

export function skillXpOf(s: GameState, skill: SkillId): number {
  return s.skillXp[skill] ?? xpAtLevel(s.skills[skill]);
}

export function gainHeroXp(s: GameState, idx: number, amount: number, ctx?: Ctx) {
  const h = s.heroes[idx];
  if (h.level >= HERO_MAX_LEVEL) return;
  h.xp += amount;
  while (h.level < HERO_MAX_LEVEL && h.xp >= heroXpToNext(h.level)) {
    h.xp -= heroXpToNext(h.level);
    h.level++;
    ctx?.emit({ t: 'heroLevel', idx, level: h.level });
  }
  if (h.level >= HERO_MAX_LEVEL) h.xp = 0;
}



import type { GameState } from './types';
import { BOSSES, ITEMS, rarity } from '@/data';
import { GEAR_TYPES, gearId } from '@/data/gear';
import { seeded } from './rng';
import { gearTierForLevel } from './balance';
import { maxRarityForZone, rollRarity, uniqueMinRarity } from './loot';

export const todayKey = (now = Date.now()): string => {
  const d = new Date(now);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Resets the daily counters when the local calendar day changed. */
export function ensureDaily(s: GameState, now = Date.now()): void {
  const day = todayKey(now);
  if (s.daily.day !== day) s.daily = { day, rare: {}, ads: 0 };
  if (s.merchant.day !== day) s.merchant = { day, bought: [], extraMin: 0 };
}

// ---------- unique daily enemies ----------
export const UNIQUE_IDS: string[] = Object.keys(BOSSES).filter((id) => id.startsWith('ue_')).sort((a, b) => Number(a.slice(3)) - Number(b.slice(3)));

export const HUNT_MIN = 60;

export interface HuntStatus { id: string; open: boolean; start: number; end: number; startsIn: number; endsIn: number; kills: number }

/**
 * One named enemy walks the land each day, picked at random from the twelve, and can only be fought for
 * one hour. The pick and the start time come from the day and the save seed, so they hold until midnight.
 */
export function huntStatus(s: GameState, now = Date.now()): HuntStatus {
  ensureDaily(s, now);
  const r = seeded(`hunt:${todayKey(now)}:${s.seed}`);
  const id = UNIQUE_IDS[Math.floor(r() * UNIQUE_IDS.length)];
  const start = 7 * 60 + Math.floor(r() * 16 * 60);
  const end = start + HUNT_MIN;
  const d = new Date(now);
  const cur = d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60;
  return { id, open: cur >= start && cur < end, start, end, startsIn: start - cur, endsIn: end - cur, kills: s.daily.rare[id] ?? 0 };
}

// ---------- wandering merchant ----------
export const MERCHANT_BASE_MIN = 60;
export const MERCHANT_EXTEND_MIN = 30;
export const MERCHANT_EXTEND_MAX = 2;

export interface StockEntry { key: string; kind: 'gear' | 'card' | 'item'; id: string; rarity: number; price: number; unique?: boolean }

/** Minutes after local midnight at which today's visit starts. Always between 08:00 and 21:00. */
export function merchantStart(s: GameState, now = Date.now()): number {
  return 8 * 60 + Math.floor(seeded(`merchant:${todayKey(now)}:${s.seed}`)() * 13 * 60);
}

export interface MerchantStatus { open: boolean; startsIn: number; endsIn: number; start: number; end: number }

export function merchantStatus(s: GameState, now = Date.now()): MerchantStatus {
  ensureDaily(s, now);
  const d = new Date(now);
  const cur = d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60;
  const start = merchantStart(s, now);
  const end = start + MERCHANT_BASE_MIN + s.merchant.extraMin;
  return { open: cur >= start && cur < end, startsIn: start - cur, endsIn: end - cur, start, end };
}

/** Today's stock, built from the day and the save seed so it stays the same until midnight. */
export function merchantStock(s: GameState, now = Date.now()): StockEntry[] {
  const day = todayKey(now);
  const r = seeded(`stock:${day}:${s.seed}`);
  const zone = Math.max(1, Math.min(32, s.zoneUnlocked));
  const maxR = maxRarityForZone(zone) + 1;
  const out: StockEntry[] = [];
  const uniques = Object.values(BOSSES).filter((b) => b.unique && ITEMS[b.unique] && b.zone <= zone && !b.id.startsWith('ue_')).map((b) => b.unique as string);
  const pickUnique = (k: number) => {
    if (!uniques.length) return;
    const id = uniques.splice(Math.floor(r() * uniques.length), 1)[0];
    const rar = rollRarity(r, maxR, 0.55, Math.min(maxR, uniqueMinRarity(zone) + 2));
    out.push({ key: `u${k}`, kind: 'gear', id, rarity: rar, price: Math.round(ITEMS[id].value * rarity(rar).value * 7), unique: true });
  };
  pickUnique(0); pickUnique(1); pickUnique(2);
  const tier = gearTierForLevel(Math.min(100, 4 * zone));
  for (let k = 0; k < 3; k++) {
    const type = GEAR_TYPES[Math.floor(r() * GEAR_TYPES.length)];
    const id = gearId(type.key, tier);
    if (!ITEMS[id]) continue;
    const rar = rollRarity(r, maxR, 0.6, Math.max(3, maxR - 6));
    out.push({ key: `g${k}`, kind: 'gear', id, rarity: rar, price: Math.round(ITEMS[id].value * rarity(rar).value * 4) });
  }
  const scrollTier = Math.min(8, 1 + Math.floor(zone / 3));
  const scroll = `scroll_${scrollTier}`;
  if (ITEMS[scroll]) out.push({ key: 's0', kind: 'item', id: scroll, rarity: 1, price: ITEMS[scroll].value * 5 * 3 });
  const cards = Object.values(ITEMS).filter((i) => i.kind === 'card' && i.card && i.card.grade <= 2 && (i.card.grade === 2 || i.card.grade === 1) && (ITEMS[i.id].tier <= tier + 1));
  if (cards.length) {
    const c = cards[Math.floor(r() * cards.length)];
    out.push({ key: 'c0', kind: 'card', id: c.id, rarity: 1, price: Math.round(c.value * 2.5) });
  }
  return out;
}

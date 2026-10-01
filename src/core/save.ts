import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import type { GameState } from './types';
import { defaultSettings, newState, GAME_VERSION } from './state';
import { SKILL_IDS } from '@/data';
import { xpAtLevel } from './xp';

const KEY = 'runeveil.save.v1';
const native = () => Capacitor.isNativePlatform();

export async function readRaw(): Promise<string | null> {
  try {
    if (native()) return (await Preferences.get({ key: KEY })).value;
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export async function writeRaw(json: string): Promise<void> {
  try {
    if (native()) await Preferences.set({ key: KEY, value: json });
    else localStorage.setItem(KEY, json);
  } catch (e) {
    console.warn('save failed', e);
  }
}

export async function clearSave(): Promise<void> {
  try {
    if (native()) await Preferences.remove({ key: KEY });
    else localStorage.removeItem(KEY);
  } catch { /* ignore */ }
}

/** Fill in anything a save from an older build might be missing. */
export function migrate(raw: Partial<GameState>): GameState {
  const base = newState(raw.name ?? 'Wayfarer', raw.seed);
  const s: GameState = { ...base, ...raw, settings: { ...defaultSettings(), ...(raw.settings ?? {}) } } as GameState;
  s.skills = { ...base.skills, ...(raw.skills ?? {}) };
  s.skillXp = { ...base.skillXp, ...(raw.skillXp ?? {}) };
  for (const id of SKILL_IDS) {
    if (s.skillXp[id] < xpAtLevel(s.skills[id])) s.skillXp[id] = xpAtLevel(s.skills[id]);
  }
  s.quests = { done: [], active: [], progress: {}, ...(raw.quests ?? {}) };
  s.codex = { items: {}, monsters: {}, ...(raw.codex ?? {}) };
  s.heroes = base.heroes.map((h, i) => ({ ...h, ...(raw.heroes?.[i] ?? {}), equip: { ...(raw.heroes?.[i]?.equip ?? {}) } }));
  s.v = GAME_VERSION;
  return s;
}

export async function loadState(): Promise<GameState | null> {
  const raw = await readRaw();
  if (!raw) return null;
  try {
    return migrate(JSON.parse(raw));
  } catch (e) {
    console.warn('corrupt save', e);
    return null;
  }
}

export async function saveState(s: GameState): Promise<void> {
  s.lastSeen = Date.now();
  await writeRaw(JSON.stringify(s));
}

export function exportSave(s: GameState): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(s))));
}

export function importSave(code: string): GameState | null {
  try {
    return migrate(JSON.parse(decodeURIComponent(escape(atob(code.trim())))));
  } catch {
    return null;
  }
}

export const hasSave = async (): Promise<boolean> => (await readRaw()) !== null;

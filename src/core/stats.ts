import type { Element, GameState, HeroDef, HeroState, ItemInstance, StatKey, Stats, StatusId } from './types';
import { hashStr, mulberry32 } from './rng';
import { HERO_MAP, ITEMS, SKILLS, rarity } from '@/data';
import type { CardFx } from './types';
import { scaleOf } from '@/data/tiers';
import { BAL } from './balance';

export const MAX_UP = 10;

/** Card sockets on a piece of equipment: 1 at the bottom, 2 from rarity 8 and 3 from rarity 16. */
export const socketCount = (inst: ItemInstance): number => (ITEMS[inst.id]?.kind === 'equip' ? Math.min(3, 1 + Math.floor(inst.rarity / 8)) : 0);
export const UP_BONUS = 0.06;

const AFFIX_POOL: StatKey[] = ['atk', 'def', 'hp', 'crit', 'critDmg', 'haste', 'eva', 'leech', 'regen', 'luck', 'res'];
const AFFIX_UNIT: Record<StatKey, number> = { atk: 2.5, def: 1.5, hp: 12, crit: 2, critDmg: 6, haste: 3, eva: 2, leech: 0.8, regen: 0.4, luck: 3, res: 3 };
const SCALED = new Set<StatKey>(['atk', 'def', 'hp', 'regen']);

export function affixesOf(inst: ItemInstance): Stats {
  const def = ITEMS[inst.id];
  const n = rarity(inst.rarity).affixes;
  const out: Stats = {};
  if (!def || def.kind !== 'equip' || n === 0) return out;
  const r = mulberry32(hashStr(inst.uid));
  const pool = [...AFFIX_POOL];
  for (let i = 0; i < n; i++) {
    const k = pool.splice(Math.floor(r() * pool.length), 1)[0];
    const roll = 0.6 + r() * 0.8;
    const unit = AFFIX_UNIT[k];
    const v = SCALED.has(k) ? unit * scaleOf(def.tier) * roll * (k === 'regen' ? 0.5 : 1) : unit * (1 + 0.05 * (def.tier - 1)) * roll;
    out[k] = Math.round(v * 10) / 10;
  }
  return out;
}

const cache = new Map<string, Stats>();
export function itemStats(inst: ItemInstance): Stats {
  const key = `${inst.uid}:${inst.id}:${inst.rarity}:${inst.up}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const def = ITEMS[inst.id];
  const out: Stats = {};
  if (def?.base) {
    const mult = rarity(inst.rarity).mult * (1 + UP_BONUS * inst.up);
    for (const [k, v] of Object.entries(def.base) as [StatKey, number][]) out[k] = Math.round(v * mult * 10) / 10;
  }
  const aff = affixesOf(inst);
  for (const [k, v] of Object.entries(aff) as [StatKey, number][]) out[k] = Math.round(((out[k] ?? 0) + v) * 10) / 10;
  if (cache.size > 4000) cache.clear();
  cache.set(key, out);
  return out;
}

export interface SkillBonus {
  atkPct: number; hpPct: number; defPct: number; haste: number; crit: number; res: number; eva: number; regen: number;
  luck: number; critDmg: number; leech: number; goldPct: number; xpPct: number; speedPct: number; rarityPct: number;
}

export function skillBonuses(state: GameState): SkillBonus {
  const b: SkillBonus = { atkPct: 0, hpPct: 0, defPct: 0, haste: 0, crit: 0, res: 0, eva: 0, regen: 0, luck: 0, critDmg: 0, leech: 0, goldPct: 0, xpPct: 0, speedPct: 0, rarityPct: 0 };
  for (const s of SKILLS) {
    const lv = state.skills[s.id] ?? 1;
    const steps = Math.floor(lv / 10);
    const v = steps * s.passive.per10;
    switch (s.passive.stat) {
      case 'atk': b.atkPct += v; break;
      case 'hp': b.hpPct += v; break;
      case 'def': b.defPct += v; break;
      case 'gold': b.goldPct += v; break;
      case 'xp': b.xpPct += v; break;
      case 'speed': b.speedPct += v; break;
      case 'rarity': b.rarityPct += v; break;
      case 'haste': b.haste += v; break;
      case 'crit': b.crit += v; break;
      case 'res': b.res += v; break;
      case 'eva': b.eva += v; break;
      case 'regen': b.regen += v; break;
      case 'luck': b.luck += v; break;
      case 'critDmg': b.critDmg += v; break;
      case 'leech': b.leech += v; break;
    }
  }
  return b;
}

export interface HeroCombat {
  atk: number; def: number; maxHp: number; crit: number; critDmg: number; haste: number; eva: number; leech: number;
  regen: number; luck: number; res: number; interval: number; element: Element; procs: { status: StatusId; chance: number }[];
  weaponKind: string; style: string;
  retaliate: { status: StatusId; chance: number }[];
}

const DEFAULT_ELEMENT: Record<string, Element> = { melee: 'physical', ranged: 'physical', magic: 'arcane' };

export function heroLevelMult(level: number): number {
  return 1 + 0.012 * (level - 1);
}

export function computeHero(state: GameState, idx: number, bonus = skillBonuses(state)): HeroCombat {
  return computeHeroFor(state, state.heroes[idx], bonus);
}

/** Same as computeHero for any roster member, including heroes resting on the bench. */
export function computeHeroFor(state: GameState, hs: HeroState, bonus = skillBonuses(state)): HeroCombat {
  const def: HeroDef = HERO_MAP[hs.id];
  const total: Required<Stats> = { atk: 0, def: 0, hp: 0, crit: 0, critDmg: 0, haste: 0, eva: 0, leech: 0, regen: 0, luck: 0, res: 0 };
  for (const [k, v] of Object.entries(def.base) as [StatKey, number][]) total[k] += v;
  let element: Element = DEFAULT_ELEMENT[def.style];
  let interval = 2.4;
  let weaponKind = 'fist';
  const procs: { status: StatusId; chance: number }[] = [];
  const retaliate: { status: StatusId; chance: number }[] = [];
  const cardPct = { atk: 0, def: 0, hp: 0 };
  let weaponAtkPenalty = 0;
  for (const [slot, inst] of Object.entries(hs.equip) as [string, ItemInstance | undefined][]) {
    if (!inst) continue;
    const idef = ITEMS[inst.id];
    const st = itemStats(inst);
    for (const [k, v] of Object.entries(st) as [StatKey, number][]) {
      if (k === 'atk' && slot === 'weapon' && idef.style && idef.style !== def.style) {
        weaponAtkPenalty = v * 0.4;
      }
      total[k] += v;
    }
    if (slot === 'weapon') {
      weaponKind = idef.weaponKind ?? 'sword';
      interval = WEAPON_INTERVAL[weaponKind] ?? 2.4;
      if (idef.element) element = idef.element;
    }
    if (slot === 'rune' && idef.element) element = idef.element;
    if (idef.apply) procs.push({ status: idef.apply, chance: 0.14 });
    for (const cid of inst.cards ?? []) {
      const fx: CardFx | undefined = ITEMS[`card_${cid}`]?.card?.fx;
      if (!fx) continue;
      cardPct.atk += fx.atkPct ?? 0; cardPct.def += fx.defPct ?? 0; cardPct.hp += fx.hpPct ?? 0;
      for (const k of ['crit', 'critDmg', 'haste', 'eva', 'leech', 'regen', 'luck', 'res'] as const) total[k] += fx[k] ?? 0;
      if (fx.proc) procs.push(fx.proc);
      if (fx.retaliate) retaliate.push(fx.retaliate);
    }
  }
  total.atk -= weaponAtkPenalty;
  const mods = def.passive.mods;
  for (const k of ['crit', 'critDmg', 'haste', 'eva', 'leech', 'regen', 'luck', 'res'] as StatKey[]) total[k] += mods[k] ?? 0;
  const lvl = heroLevelMult(hs.level);
  const skillLv = state.skills[def.skill] ?? 1;
  const hall = ((state.hall?.[hs.id] ?? 0) * BAL.hallPctPerRank) / 100;
  const atk = total.atk * lvl * (1 + hall + 0.012 * skillLv + (bonus.atkPct + cardPct.atk + (mods.atkPct ?? 0)) / 100);
  const maxHp = total.hp * lvl * (1 + hall + bonus.hpPct / 100 + 0.01 * (state.skills.fortitude ?? 1) * (def.skill === 'fortitude' ? 1.5 : 0.5) + (mods.hpPct ?? 0) / 100 + cardPct.hp / 100);
  const def_ = total.def * lvl * (1 + (bonus.defPct + cardPct.def + (mods.defPct ?? 0)) / 100);
  const haste = total.haste + bonus.haste;
  return {
    atk, def: def_, maxHp: Math.max(20, maxHp), crit: Math.min(75, total.crit + bonus.crit), critDmg: total.critDmg + bonus.critDmg, haste,
    eva: Math.min(60, total.eva + bonus.eva), leech: total.leech + bonus.leech, regen: total.regen + bonus.regen, luck: total.luck + bonus.luck,
    res: Math.min(75, total.res + bonus.res), interval: Math.max(0.6, interval / Math.max(0.3, 1 + haste / 100)), element, procs, retaliate, weaponKind, style: def.style,
  };
}

export const WEAPON_INTERVAL: Record<string, number> = { sword: 2.2, mace: 3, dagger: 1.6, bow: 2, staff: 2.8, fist: 2.4 };

export function partyLuck(state: GameState): number {
  const b = skillBonuses(state);
  let luck = b.luck;
  for (let i = 0; i < state.heroes.length; i++) luck += computeHero(state, i, b).luck / state.heroes.length;
  return luck;
}

export function partyPower(state: GameState): number {
  const b = skillBonuses(state);
  let p = 0;
  for (let i = 0; i < state.heroes.length; i++) {
    const h = computeHero(state, i, b);
    p += (h.atk / h.interval) * 10 + h.maxHp * 0.1 + h.def * 2;
  }
  return Math.round(p);
}

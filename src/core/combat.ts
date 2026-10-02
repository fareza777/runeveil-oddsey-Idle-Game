import type { BossDef, Element, GameState, MonsterDef, StatusId } from './types';
import { BOSSES, ELEMENT_MAP, ITEMS, MONSTERS, STATUS_MAP } from '@/data';
import { BAL } from './balance';
import { monsterStats } from './monsterStats';
import { computeHero, skillBonuses, type HeroCombat } from './stats';
import { heroKillXp } from './xp';
import { addGold, addItem, gainHeroXp, gainXp, heroDef, takeItem, type Ctx } from './state';
import { rollMonsterLoot } from './loot';
import { questEvent } from './questSys';
import { HERO_ABILITY2_LEVEL, RESIST_MULT, WEAK_MULT } from '@/data/combatData';
import type { AbilityKind } from './types';

export interface StatusInst { status: StatusId; potency: number; left: number; stacks: number }

export interface Fighter {
  idx: number;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  interval: number;
  timer: number;
  crit: number;
  critDmg: number;
  eva: number;
  leech: number;
  regen: number;
  res: number;
  element: Element;
  procs: HeroCombat['procs'];
  statuses: StatusInst[];
  abilityTimer: number;
  abilityTimer2: number;
  /** attack bonus from Rally Cry */
  rallyPct: number;
  rallyLeft: number;
  shield: number;
  taunt: number;
  dotAcc: number;
  alive: boolean;
}

export interface CombatRt {
  zone: number;
  boss: boolean;
  monsterId: string;
  enemy: Fighter | null;
  enemyDef: MonsterDef;
  heroes: Fighter[];
  respawn: number;
  wipeTimer: number;
  wipes: number;
  bossTimers: number[];
  enraged: boolean;
  fightTime: number;
  foodCd: number;
  potionCd: number;
  power: number;
  atkBoost: number;
  elapsed: number;
  bossFirst: boolean;
  kills: number;
  chooser?: (rng: () => number) => MonsterDef;
}

const DOT: StatusId[] = ['poison', 'burn', 'bleed'];
const STACKS: Partial<Record<StatusId, number>> = { poison: 5, bleed: 4 };
const HARM = (id: StatusId) => STATUS_MAP[id].harm;

const mkFighter = (idx: number, c: HeroCombat | null): Fighter => ({
  idx, hp: c?.maxHp ?? 1, maxHp: c?.maxHp ?? 1, atk: c?.atk ?? 0, def: c?.def ?? 0, interval: c?.interval ?? 2, timer: 0, crit: c?.crit ?? 0,
  critDmg: c?.critDmg ?? 150, eva: c?.eva ?? 0, leech: c?.leech ?? 0, regen: c?.regen ?? 0, res: c?.res ?? 0, element: c?.element ?? 'physical',
  procs: c?.procs ?? [], statuses: [], abilityTimer: 0, abilityTimer2: 0, rallyPct: 0, rallyLeft: 0, shield: 0, taunt: 1, dotAcc: 0, alive: true,
});

export function createCombat(state: GameState, zone: number, boss: boolean, monsterId?: string): CombatRt {
  const bonus = skillBonuses(state);
  const heroes = state.heroes.map((_, i) => mkFighter(i, computeHero(state, i, bonus)));
  heroes.forEach((h, i) => {
    const d = heroDef(state, i);
    h.abilityTimer = d.ability.cd * 0.5;
    h.abilityTimer2 = d.ability2.cd * 0.6;
  });
  const id = monsterId ?? 'm_1_1';
  return {
    zone, boss, monsterId: id, enemy: null, enemyDef: MONSTERS[id], heroes, respawn: 0.4, wipeTimer: 0, wipes: 0, bossTimers: [], enraged: false,
    fightTime: 0, foodCd: 0, potionCd: 0, power: 0, atkBoost: 1, elapsed: 0, bossFirst: false, kills: 0,
  };
}

/** Recompute hero stats in place, preserving HP ratios. */
export function refreshHeroes(state: GameState, rt: CombatRt) {
  const bonus = skillBonuses(state);
  state.heroes.forEach((_, i) => {
    const f = rt.heroes[i];
    const c = computeHero(state, i, bonus);
    const ratio = f.maxHp > 0 ? f.hp / f.maxHp : 1;
    f.maxHp = c.maxHp; f.atk = c.atk; f.def = c.def; f.interval = c.interval; f.crit = c.crit; f.critDmg = c.critDmg; f.eva = c.eva;
    f.leech = c.leech; f.regen = c.regen; f.res = c.res; f.element = c.element; f.procs = c.procs;
    f.hp = f.alive ? Math.max(1, Math.min(f.maxHp, f.maxHp * ratio)) : 0;
  });
}

function spawnEnemy(rt: CombatRt, ctx: Ctx) {
  if (rt.chooser) {
    rt.enemyDef = rt.chooser(ctx.rng);
    rt.monsterId = rt.enemyDef.id;
  }
  const m = rt.enemyDef;
  const s = monsterStats(m);
  rt.enemy = { ...mkFighter(0, null), hp: s.hp, maxHp: s.hp, atk: s.atk, def: s.def, interval: s.interval, element: m.element, timer: s.interval * 0.5 };
  rt.fightTime = 0;
  rt.enraged = false;
  rt.atkBoost = 1;
  const abilities = (m as BossDef).abilities ?? [];
  rt.bossTimers = abilities.map((a) => (a.kind === 'enrage' ? 0 : a.every * 0.6));
  rt.power = s.ref;
  ctx.emit({ t: 'spawn', id: m.id });
}

const buffPotency = (state: GameState, status: StatusId): number => {
  let p = 0;
  for (const b of state.buffs) if (b.status === status && b.left > 0) p += b.potency;
  return p;
};

function hasStatus(f: Fighter, id: StatusId): StatusInst | undefined {
  return f.statuses.find((s) => s.status === id && s.left > 0);
}

export function applyStatus(f: Fighter, side: 'hero' | 'enemy', status: StatusId, potency: number, duration: number, ctx: Ctx) {
  const ex = hasStatus(f, status);
  if (ex) {
    ex.left = Math.max(ex.left, duration);
    const cap = STACKS[status] ?? 1;
    if (cap > 1) {
      ex.stacks = Math.min(cap, ex.stacks + 1);
      ex.potency = Math.max(ex.potency, potency);
    } else ex.potency = Math.max(ex.potency, potency);
    return;
  }
  f.statuses.push({ status, potency, left: duration, stacks: 1 });
  ctx.emit({ t: 'status', side, idx: f.idx, status, on: true });
}

function cleanse(f: Fighter, side: 'hero' | 'enemy', ctx: Ctx, all = false) {
  const harmful = f.statuses.filter((s) => HARM(s.status) && s.left > 0);
  const list = all ? harmful : harmful.slice(0, 1);
  for (const s of list) {
    s.left = 0;
    ctx.emit({ t: 'status', side, idx: f.idx, status: s.status, on: false });
  }
}

function tickStatuses(f: Fighter, side: 'hero' | 'enemy', dt: number, rt: CombatRt, state: GameState, ctx: Ctx) {
  let dot = 0;
  for (const s of f.statuses) {
    if (s.left <= 0) continue;
    if (DOT.includes(s.status)) dot += s.potency * s.stacks * dt;
    s.left -= dt;
    if (s.left <= 0) ctx.emit({ t: 'status', side, idx: f.idx, status: s.status, on: false });
  }
  if (f.statuses.length > 12) f.statuses = f.statuses.filter((s) => s.left > 0);
  if (dot > 0) {
    f.dotAcc += dot;
    if (f.dotAcc >= Math.max(1, f.maxHp * 0.004)) {
      const n = Math.round(f.dotAcc);
      f.dotAcc = 0;
      damageTaken(f, side, n, 'nature', false, rt, state, ctx, true);
    }
  }
}

function damageTaken(f: Fighter, side: 'hero' | 'enemy', raw: number, elem: Element, crit: boolean, rt: CombatRt, state: GameState, ctx: Ctx, dot = false) {
  let n = Math.max(1, Math.round(raw));
  if (f.shield > 0) {
    const ab = Math.min(f.shield, n);
    f.shield -= ab;
    n -= ab;
    if (n <= 0) {
      ctx.emit({ t: 'dmg', side, idx: f.idx, n: 0, crit: false, elem, text: 'Blocked' });
      return;
    }
  }
  f.hp -= n;
  ctx.emit({ t: 'dmg', side, idx: f.idx, n, crit, elem });
  if (f.hp <= 0) {
    f.hp = 0;
    f.alive = false;
    if (side === 'hero') state.stats.heroDowns = (state.stats.heroDowns ?? 0) + 1;
  }
  void rt; void dot;
}

function mitigation(def: number, p: number): number {
  return Math.min(0.85, def / (def + BAL.defK * p));
}

function heroStrike(state: GameState, rt: CombatRt, h: Fighter, mult: number, ctx: Ctx, opts: { element?: Element; critBonus?: number; noProc?: boolean } = {}) {
  const e = rt.enemy;
  if (!e || !e.alive) return;
  const elem = opts.element ?? h.element;
  ctx.emit({ t: 'swing', side: 'hero', idx: h.idx, elem, style: heroDef(state, h.idx).style });
  if (hasStatus(h, 'blind') && ctx.rng() < 0.25) {
    ctx.emit({ t: 'dmg', side: 'enemy', idx: 0, n: 0, crit: false, elem, miss: true, text: 'Miss' });
    return;
  }
  const crit = ctx.rng() * 100 < h.crit + (opts.critBonus ?? 0);
  let dmg = h.atk * mult * (0.92 + ctx.rng() * 0.16);
  if (crit) dmg *= h.critDmg / 100;
  dmg *= 1 + buffPotency(state, 'might') + (h.rallyLeft > 0 ? h.rallyPct : 0);
  if (hasStatus(h, 'weaken')) dmg *= 0.75;
  const m = rt.enemyDef;
  if (m.weak === elem) dmg *= WEAK_MULT;
  else if (m.resist === elem) dmg *= RESIST_MULT;
  if (hasStatus(e, 'shock')) dmg *= 1.2;
  const edef = e.def * (hasStatus(e, 'vulnerable') ? 0.7 : 1);
  dmg *= 1 - mitigation(edef, rt.power);
  damageTaken(e, 'enemy', dmg, elem, crit, rt, state, ctx);
  const dealt = Math.max(1, Math.round(dmg));
  state.stats.damageDealt = (state.stats.damageDealt ?? 0) + dealt;
  if (h.leech > 0 && h.alive) healFighter(h, 'hero', dealt * (h.leech / 100), state, ctx);
  if (!opts.noProc) {
    for (const p of h.procs) {
      if (ctx.rng() < p.chance && e.alive) applyOnEnemy(h, e, p.status, ctx);
    }
  }
  if (e.hp <= 0) e.alive = false;
}

function applyOnEnemy(h: Fighter, e: Fighter, status: StatusId, ctx: Ctx) {
  const dotBase = DOT.includes(status) ? h.atk * (status === 'burn' ? 0.45 : status === 'bleed' ? 0.3 : 0.25) : 0;
  applyStatus(e, 'enemy', status, dotBase, 5, ctx);
}

function healFighter(f: Fighter, side: 'hero' | 'enemy', amount: number, state: GameState, ctx: Ctx) {
  if (!f.alive) return;
  let a = amount;
  if (hasStatus(f, 'curse')) a *= 0.5;
  a = Math.min(f.maxHp - f.hp, a);
  if (a < 0.5) return;
  f.hp += a;
  ctx.emit({ t: 'dmg', side, idx: f.idx, n: Math.round(a), crit: false, elem: 'holy', heal: true });
  void state;
}

function pickTarget(rt: CombatRt, ctx: Ctx): Fighter | null {
  const alive = rt.heroes.filter((h) => h.alive);
  if (!alive.length) return null;
  const total = alive.reduce((a, h) => a + h.taunt, 0);
  let r = ctx.rng() * total;
  for (const h of alive) {
    r -= h.taunt;
    if (r <= 0) return h;
  }
  return alive[0];
}

function enemyStrike(state: GameState, rt: CombatRt, e: Fighter, mult: number, target: Fighter, ctx: Ctx, status = true) {
  const m = rt.enemyDef;
  ctx.emit({ t: 'swing', side: 'enemy', idx: target.idx, elem: m.element, style: 'melee' });
  if (hasStatus(e, 'blind') && ctx.rng() < 0.25) {
    ctx.emit({ t: 'dmg', side: 'hero', idx: target.idx, n: 0, crit: false, elem: m.element, miss: true, text: 'Miss' });
    return;
  }
  if (ctx.rng() * 100 < target.eva) {
    ctx.emit({ t: 'dmg', side: 'hero', idx: target.idx, n: 0, crit: false, elem: m.element, miss: true, text: 'Dodge' });
    return;
  }
  let dmg = e.atk * mult * rt.atkBoost * (0.9 + ctx.rng() * 0.2);
  if (hasStatus(e, 'weaken')) dmg *= 0.75;
  const crit = ctx.rng() < 0.06;
  if (crit) dmg *= 1.5;
  const fort = buffPotency(state, 'fortify');
  const def = target.def * (1 + fort) * (hasStatus(target, 'vulnerable') ? 0.7 : 1);
  dmg *= 1 - mitigation(def, rt.power);
  if (m.element !== 'physical') dmg *= 1 - target.res / 100;
  if (hasStatus(target, 'shock')) dmg *= 1.2;
  dmg = Math.max(1, dmg);
  damageTaken(target, 'hero', dmg, m.element, crit, rt, state, ctx);
  const thorns = buffPotency(state, 'thorns');
  if (thorns > 0 && e.alive) damageTaken(e, 'enemy', dmg * thorns, 'nature', false, rt, state, ctx);
  if (status && m.inflicts && target.alive && ctx.rng() < m.inflicts.chance) {
    const dotAbs = DOT.includes(m.inflicts.status) ? target.maxHp * m.inflicts.potency * 0.25 : 0;
    applyStatus(target, 'hero', m.inflicts.status, dotAbs, m.inflicts.duration, ctx);
  }
}

function hasteMult(f: Fighter, state: GameState, side: 'hero' | 'enemy'): number {
  let m = 1;
  if (hasStatus(f, 'chill')) m *= 0.75;
  if (hasStatus(f, 'slow')) m *= 0.6;
  if (side === 'hero') m *= 1 + buffPotency(state, 'haste');
  return m;
}

const stunned = (f: Fighter) => !!(hasStatus(f, 'stun') || hasStatus(f, 'freeze'));

function heroAbility(state: GameState, rt: CombatRt, i: number, ctx: Ctx, second = false) {
  const h = rt.heroes[i];
  const def = heroDef(state, i);
  const ab = second ? def.ability2 : def.ability;
  const e = rt.enemy;
  ctx.emit({ t: 'ability', idx: i, name: ab.name });
  const arc = 1 + (state.skills.arcana ?? 1) / 200;
  const kind: AbilityKind = ab.kind;
  const stun = (secs: number) => {
    if (e?.alive) applyStatus(e, 'enemy', 'stun', 0, rt.boss ? secs * 0.5 : secs, ctx);
  };
  switch (kind) {
    case 'cleave':
      heroStrike(state, rt, h, 2.6, ctx, { noProc: true });
      if (e?.alive) applyOnEnemy(h, e, 'bleed', ctx);
      break;
    case 'volley':
      for (let k = 0; k < 5; k++) heroStrike(state, rt, h, 0.7, ctx, { critBonus: 20, noProc: k > 0 });
      break;
    case 'fireball':
      heroStrike(state, rt, h, 3.0, ctx, { element: 'fire', noProc: true });
      if (e?.alive) applyOnEnemy(h, e, 'burn', ctx);
      break;
    case 'shieldwall':
      for (const t of rt.heroes) if (t.alive) t.shield = Math.max(t.shield, t.maxHp * 0.18);
      h.taunt = 3;
      h.statuses.push({ status: 'fortify', potency: 0, left: 6, stacks: 1 });
      break;
    case 'heal': {
      for (const t of rt.heroes) {
        if (!t.alive) continue;
        healFighter(t, 'hero', t.maxHp * 0.3 * arc, state, ctx);
      }
      const worst = rt.heroes.find((t) => t.alive && t.statuses.some((s) => HARM(s.status) && s.left > 0));
      if (worst) cleanse(worst, 'hero', ctx);
      break;
    }
    case 'rally':
      for (const t of rt.heroes) if (t.alive) { t.rallyPct = 0.25; t.rallyLeft = 8; }
      break;
    case 'pin':
      heroStrike(state, rt, h, 1.6, ctx, { noProc: true });
      if (e?.alive) applyStatus(e, 'enemy', 'slow', 0, 6, ctx);
      break;
    case 'frostlance':
      heroStrike(state, rt, h, 2.8, ctx, { element: 'frost', noProc: true });
      if (e?.alive) applyStatus(e, 'enemy', 'chill', 0, 6, ctx);
      break;
    case 'bash':
      heroStrike(state, rt, h, 1.8, ctx, { noProc: true });
      stun(2.5);
      break;
    case 'smite': {
      heroStrike(state, rt, h, 2.4, ctx, { element: 'holy', noProc: true });
      const weak = rt.heroes.filter((t) => t.alive).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
      if (weak) healFighter(weak, 'hero', weak.maxHp * 0.15 * arc, state, ctx);
      break;
    }
    case 'execute': {
      const missing = e ? 1 - e.hp / e.maxHp : 0;
      heroStrike(state, rt, h, 2.2 + 2.0 * missing, ctx, { critBonus: 25, noProc: true });
      if (e?.alive) applyOnEnemy(h, e, 'bleed', ctx);
      break;
    }
    case 'venom':
      for (let k = 0; k < 4; k++) {
        heroStrike(state, rt, h, 0.55, ctx, { noProc: true });
        if (e?.alive) applyOnEnemy(h, e, 'poison', ctx);
      }
      break;
    case 'chain':
      for (let k = 0; k < 3; k++) heroStrike(state, rt, h, 1.1, ctx, { element: 'shock', noProc: k > 0 });
      if (e?.alive) applyStatus(e, 'enemy', 'shock', 0, 5, ctx);
      break;
    case 'thunder':
      heroStrike(state, rt, h, 2.6, ctx, { element: 'shock', noProc: true });
      stun(2);
      break;
  }
}

function bossAbilities(state: GameState, rt: CombatRt, dt: number, ctx: Ctx) {
  const e = rt.enemy;
  const def = rt.enemyDef as BossDef;
  if (!e || !e.alive || !def.abilities) return;
  def.abilities.forEach((a, k) => {
    if (a.kind === 'enrage') {
      if (!rt.enraged && e.hp / e.maxHp <= a.every) {
        rt.enraged = true;
        rt.atkBoost *= a.mult ?? 1.5;
        ctx.emit({ t: 'toast', text: `${def.name} is enraged!`, kind: 'bad' });
      }
      return;
    }
    rt.bossTimers[k] -= dt;
    if (rt.bossTimers[k] > 0) return;
    rt.bossTimers[k] = a.every;
    const living = rt.heroes.filter((h) => h.alive);
    if (!living.length) return;
    ctx.emit({ t: 'ability', idx: -1, name: a.name });
    switch (a.kind) {
      case 'smash': {
        const t = pickTarget(rt, ctx);
        if (t) enemyStrike(state, rt, e, a.mult ?? 2.5, t, ctx);
        break;
      }
      case 'aoe':
        for (const t of living) enemyStrike(state, rt, e, a.mult ?? 0.9, t, ctx, false);
        break;
      case 'heal':
        healFighter(e, 'enemy', e.maxHp * (a.mult ?? 0.07), state, ctx);
        break;
      case 'shield':
        e.shield = e.maxHp * (a.mult ?? 0.1);
        break;
      case 'status':
        if (a.status) {
          const stat = a.status.status;
          for (const t of living) applyStatus(t, 'hero', stat, DOT.includes(stat) ? t.maxHp * a.status.potency * 0.25 : 0, a.status.duration, ctx);
        }
        break;
    }
  });
}

function autoSupplies(state: GameState, rt: CombatRt, dt: number, ctx: Ctx) {
  rt.foodCd -= dt;
  rt.potionCd -= dt;
  // keep buff potions running
  const potionId = state.loadout.potion;
  if (potionId && state.settings.autoPotion && rt.potionCd <= 0 && (state.stacks[potionId] ?? 0) > 0) {
    const pd = ITEMS[potionId];
    if (pd?.buff && !state.buffs.some((b) => b.src === potionId && b.left > 8)) {
      takeItem(state, potionId, 1);
      state.buffs = state.buffs.filter((b) => b.src !== potionId);
      state.buffs.push({ status: pd.buff.status, potency: pd.buff.potency, left: pd.buff.duration, src: potionId });
      state.stats.potionsUsed = (state.stats.potionsUsed ?? 0) + 1;
      rt.potionCd = 2;
    }
  }
  if (rt.foodCd > 0) return;
  if (!state.loadout.food || (state.stacks[state.loadout.food] ?? 0) <= 0) {
    let best: string | null = null;
    let heal = 0;
    for (const id in state.stacks) {
      const d = ITEMS[id];
      if (d?.kind === 'food' && d.heal && state.stacks[id] > 0 && d.heal > heal) { best = id; heal = d.heal; }
    }
    if (!best) return;
    state.loadout.food = best;
  }
  const foodId = state.loadout.food;
  if ((state.stacks[foodId] ?? 0) <= 0) return;
  const fd = ITEMS[foodId];
  if (!fd?.heal) return;
  const worst = rt.heroes.filter((h) => h.alive).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
  if (!worst || worst.hp / worst.maxHp > state.settings.autoEat) return;
  takeItem(state, foodId, 1);
  state.stats.foodEaten = (state.stats.foodEaten ?? 0) + 1;
  const fort = 1 + (state.skills.fortitude ?? 1) / 300;
  healFighter(worst, 'hero', worst.maxHp * fd.heal * fort, state, ctx);
  if (fd.buff) {
    state.buffs = state.buffs.filter((b) => b.src !== foodId);
    state.buffs.push({ status: fd.buff.status, potency: fd.buff.potency, left: fd.buff.duration, src: foodId });
  }
  ctx.emit({ t: 'food', idx: worst.idx, item: foodId });
  rt.foodCd = 1.6;
}

function onKill(state: GameState, rt: CombatRt, ctx: Ctx) {
  const m = rt.enemyDef;
  rt.kills++;
  state.kills[m.id] = (state.kills[m.id] ?? 0) + 1;
  state.codex.monsters[m.id] = 1;
  state.stats.kills = (state.stats.kills ?? 0) + 1;
  const first = !!m.boss && !(state.bossKills[m.id] > 0);
  if (m.boss) {
    state.bossKills[m.id] = (state.bossKills[m.id] ?? 0) + 1;
    state.stats.bossKills = (state.stats.bossKills ?? 0) + 1;
  }
  rollMonsterLoot(state, m, ctx, first);
  const skills = new Set<string>();
  const heroXp = heroKillXp(m.level, m.boss ? 8 : m.elite ? 2.2 : 1);
  state.heroes.forEach((_, i) => {
    gainHeroXp(state, i, heroXp, ctx);
    skills.add(heroDef(state, i).skill);
  });
  for (const sk of skills) gainXp(state, sk as never, m.xp, ctx);
  questEvent(state, 'kill', m.id);
  questEvent(state, 'killAny', String(m.zone));
  if (m.boss) {
    questEvent(state, 'boss', m.id);
    if (first) {
      const b = m as BossDef;
      addGold(state, b.first.gold, ctx);
      for (const it of b.first.items) addItem(state, it.item, it.n, ctx);
      if (b.id.startsWith('boss_') && state.zoneUnlocked < b.zone + 1 && b.zone < 22) {
        state.zoneUnlocked = b.zone + 1;
        ctx.emit({ t: 'zone', id: b.zone + 1 });
      }
      ctx.emit({ t: 'toast', text: `First victory over ${b.name}! Bonus rewards claimed.`, kind: 'good' });
    }
    ctx.emit({ t: 'boss', id: m.id, first });
  }
  ctx.emit({ t: 'kill', id: m.id, boss: !!m.boss });
  ctx.emit({ t: 'action', kind: 'combat', id: m.id });
}

export type StepResult = 'ok' | 'bossDown' | 'stopped';

/** Advance combat by dt seconds (callers should use dt <= 1). */
export function combatStep(state: GameState, rt: CombatRt, dt: number, ctx: Ctx): StepResult {
  rt.elapsed += dt;
  // revive window after a wipe
  if (rt.wipeTimer > 0) {
    rt.wipeTimer -= dt;
    if (rt.wipeTimer <= 0) {
      for (const h of rt.heroes) {
        h.alive = true; h.hp = h.maxHp; h.statuses = []; h.shield = 0; h.timer = 0; h.taunt = 1;
      }
      rt.enemy = null;
      rt.respawn = 0.5;
    }
    return 'ok';
  }
  if (rt.respawn > 0) {
    rt.respawn -= dt;
    for (const h of rt.heroes) {
      if (h.alive) healFighter(h, 'hero', h.regen * dt + h.maxHp * 0.03 * dt, state, ctx);
    }
    if (rt.respawn <= 0) {
      for (const h of rt.heroes) {
        if (!h.alive) { h.alive = true; h.hp = h.maxHp * 0.3; h.statuses = []; }
        h.timer = Math.min(h.timer, h.interval * 0.5);
      }
      spawnEnemy(rt, ctx);
    }
    return 'ok';
  }
  const e = rt.enemy;
  if (!e) { rt.respawn = 0.3; return 'ok'; }
  rt.fightTime += dt;
  // bloodlust to stop endless stalling on bosses
  if (rt.boss && rt.fightTime > 150) rt.atkBoost += dt * 0.01;

  autoSupplies(state, rt, dt, ctx);

  // buffs tick
  for (const b of state.buffs) b.left -= dt;
  if (state.buffs.some((b) => b.left <= 0)) state.buffs = state.buffs.filter((b) => b.left > 0);
  if (state.xpBoost) { state.xpBoost.left -= dt; if (state.xpBoost.left <= 0) state.xpBoost = null; }

  const regenBuff = buffPotency(state, 'regen');
  for (const h of rt.heroes) {
    if (!h.alive) continue;
    tickStatuses(h, 'hero', dt, rt, state, ctx);
    if (!h.alive) continue;
    if (h.regen > 0 || regenBuff > 0) healFighter(h, 'hero', (h.regen + h.maxHp * regenBuff) * dt, state, ctx);
    if (h.taunt > 1 && !h.statuses.some((s) => s.status === 'fortify' && s.left > 0)) h.taunt = 1;
    if (stunned(h)) continue;
    h.timer += dt * hasteMult(h, state, 'hero');
    h.abilityTimer -= dt;
    if (h.rallyLeft > 0) h.rallyLeft -= dt;
    if (h.abilityTimer <= 0 && e.alive) {
      h.abilityTimer = heroDef(state, h.idx).ability.cd;
      heroAbility(state, rt, h.idx, ctx);
    }
    if (state.heroes[h.idx].level >= HERO_ABILITY2_LEVEL) {
      h.abilityTimer2 -= dt;
      if (h.abilityTimer2 <= 0 && e.alive) {
        h.abilityTimer2 = heroDef(state, h.idx).ability2.cd;
        heroAbility(state, rt, h.idx, ctx, true);
      }
    }
    while (h.timer >= h.interval && e.alive) {
      h.timer -= h.interval;
      heroStrike(state, rt, h, 1, ctx);
    }
    if (!e.alive) break;
  }

  if (e.alive) {
    tickStatuses(e, 'enemy', dt, rt, state, ctx);
    if (e.hp <= 0) e.alive = false;
  }
  if (!e.alive) {
    onKill(state, rt, ctx);
    const wasBoss = rt.boss;
    for (const h of rt.heroes) {
      h.statuses = h.statuses.filter((s) => !HARM(s.status));
      if (h.alive) healFighter(h, 'hero', h.maxHp * 0.04, state, ctx);
    }
    rt.enemy = null;
    rt.respawn = 1.0;
    rt.wipes = 0;
    return wasBoss ? 'bossDown' : 'ok';
  }

  bossAbilities(state, rt, dt, ctx);
  if (!stunned(e)) {
    e.timer += dt * hasteMult(e, state, 'enemy');
    while (e.timer >= e.interval && e.alive) {
      e.timer -= e.interval;
      const t = pickTarget(rt, ctx);
      if (!t) break;
      enemyStrike(state, rt, e, 1, t, ctx);
    }
  }
  if (!rt.heroes.some((h) => h.alive)) {
    rt.wipes++;
    state.stats.wipes = (state.stats.wipes ?? 0) + 1;
    const final = rt.wipes >= 3;
    ctx.emit({ t: 'wipe', final });
    if (final) return 'stopped';
    rt.wipeTimer = 5;
  }
  return 'ok';
}

export const bossDef = (id: string): BossDef | undefined => BOSSES[id];
export const elementColor = (e: Element): string => ELEMENT_MAP[e].color;



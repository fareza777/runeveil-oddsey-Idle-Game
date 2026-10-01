import type { BossAbility, BossDef, DropEntry, Element, MonsterDef, StatusId, ZoneDef } from '@/core/types';
import { gearTierForLevel } from '@/core/balance';
import { seeded } from '@/core/rng';
import { xpForReq } from '@/core/xp';
import { GEAR_TYPES, gearId } from './gear';
import { FAMILY_MAP, RES_TIERS, dropId } from './tiers';
import { NOUNS, WORLD_BOSSES, ZONE_SEEDS } from './zoneSeeds';

interface Profile { hp: number; atk: number; def: number; speed: number; status: StatusId[]; scale: number }
const PROFILE: Record<string, Profile> = {
  slime: { hp: 1.25, atk: 0.7, def: 0.8, speed: 2.8, status: ['slow', 'poison'], scale: 0.9 },
  slimesword: { hp: 1.0, atk: 1.0, def: 0.9, speed: 2.2, status: ['bleed', 'weaken'], scale: 0.95 },
  mushroom: { hp: 1.1, atk: 0.8, def: 1.0, speed: 3.0, status: ['poison', 'blind'], scale: 1 },
  wasp: { hp: 0.7, atk: 1.1, def: 0.6, speed: 1.7, status: ['poison', 'bleed'], scale: 0.9 },
  scorpion: { hp: 0.95, atk: 1.15, def: 1.2, speed: 2.4, status: ['poison', 'vulnerable'], scale: 1 },
  worm: { hp: 1.35, atk: 0.85, def: 0.9, speed: 2.9, status: ['bleed', 'slow'], scale: 1 },
  skeleton: { hp: 0.9, atk: 1.0, def: 0.9, speed: 2.3, status: ['bleed', 'weaken'], scale: 1 },
  skelwar: { hp: 1.1, atk: 1.2, def: 1.3, speed: 2.5, status: ['bleed', 'vulnerable'], scale: 1.05 },
  zombie: { hp: 1.5, atk: 0.9, def: 0.8, speed: 3.1, status: ['curse', 'weaken'], scale: 1 },
  ghost: { hp: 0.8, atk: 1.1, def: 0.5, speed: 2.1, status: ['chill', 'blind'], scale: 1 },
  lamia: { hp: 1.0, atk: 1.15, def: 1.0, speed: 2.2, status: ['poison', 'stun'], scale: 1.05 },
  succubus: { hp: 0.9, atk: 1.25, def: 0.8, speed: 2.0, status: ['curse', 'weaken'], scale: 1.05 },
  genie: { hp: 1.15, atk: 1.2, def: 1.0, speed: 2.5, status: ['burn', 'stun'], scale: 1.05 },
  minotaur: { hp: 1.35, atk: 1.1, def: 1.3, speed: 3.0, status: ['stun', 'bleed'], scale: 1.1 },
  magus: { hp: 0.85, atk: 1.4, def: 0.7, speed: 2.6, status: ['burn', 'shock', 'chill'], scale: 1.05 },
};

export const WEAK_TO: Record<Element, Element> = {
  physical: 'arcane', fire: 'frost', frost: 'fire', nature: 'fire', shock: 'nature', shadow: 'holy', holy: 'shadow', arcane: 'physical',
};
export const STATUS_FOR_ELEMENT: Record<Element, StatusId> = {
  physical: 'bleed', fire: 'burn', frost: 'chill', nature: 'poison', shock: 'shock', shadow: 'curse', holy: 'weaken', arcane: 'vulnerable',
};

export const MONSTERS: Record<string, MonsterDef> = {};
export const BOSSES: Record<string, BossDef> = {};
export const ZONES: ZoneDef[] = [];

const ZONE_LEVEL_STEP = 4.5;
const zoneBaseLevel = (z: number) => 1 + (z - 1) * ZONE_LEVEL_STEP;
const zoneMaxLevel = (z: number) => Math.min(100, Math.round(zoneBaseLevel(z) + ZONE_LEVEL_STEP));

function lootFor(id: string, z: number, level: number, i: number, famId: string, elite: boolean, boss: boolean): DropEntry[] {
  const r = seeded('loot:' + id);
  const v = () => 0.6 + r() * 0.9;
  const fam = FAMILY_MAP[famId];
  const res = Math.min(RES_TIERS - 1, Math.floor(((level - 1) * RES_TIERS) / 100));
  const tier = gearTierForLevel(level);
  const m = elite ? 3 : boss ? 6 : 1;
  const drops: DropEntry[] = [
    { item: dropId(fam.id, 0), chance: Math.min(1, 0.5 * v() * (elite ? 1.5 : 1)), min: 1, max: 2 + (elite ? 1 : 0) },
    { item: dropId(fam.id, 1), chance: Math.min(1, 0.1 * v() * m), min: 1, max: 1 },
  ];
  const mats = [`ore_${res}`, `log_${res}`, `hide_${res}`, `herb_${Math.min(15, Math.round(level / 6.2))}`, `crop_${Math.min(15, Math.round(level / 6.2))}`, `gemr_${Math.min(15, Math.floor((res * 16) / 12))}`];
  for (let k = 0; k < 3; k++) {
    const item = mats[(i + k * 2 + z) % mats.length];
    drops.push({ item, chance: Math.min(1, (0.28 - k * 0.06) * v() * (elite ? 1.4 : 1)), min: 1, max: 2 + Math.floor(z / 8) });
  }
  drops.push({ item: `cfish_${Math.min(19, Math.floor(((level - 1) * 20) / 100))}`, chance: 0.09 * v(), min: 1, max: 2 });
  if (level > 6) drops.push({ item: `meal_${Math.min(23, Math.floor(((level - 1) * 24) / 100))}`, chance: 0.015 * v() * m, min: 1, max: 1 });
  drops.push({ item: `scroll_${Math.min(8, 1 + Math.floor(tier / 2.6))}`, chance: 0.012 * v() * m, min: 1, max: 1 });
  drops.push({ item: `relic_${Math.min(11, res)}`, chance: 0.03 * v() * m, min: 1, max: 1 });
  const typeA = GEAR_TYPES[(z * 7 + i * 3) % GEAR_TYPES.length];
  const typeB = GEAR_TYPES[(z * 5 + i * 11 + 4) % GEAR_TYPES.length];
  drops.push({ item: gearId(typeA.key, tier), chance: Math.min(1, 0.055 * v() * (elite ? 2.6 : boss ? 6 : 1)) });
  drops.push({ item: gearId(typeB.key, Math.min(20, tier + 1)), chance: Math.min(1, 0.007 * v() * (elite ? 3 : boss ? 8 : 1)) });
  if (elite || boss) {
    const el = ['physical', 'fire', 'frost', 'nature', 'shock', 'shadow', 'holy', 'arcane'][(z + i) % 8];
    drops.push({ item: `ess_${el}`, chance: Math.min(1, 0.12 * v() * (boss ? 4 : 1)), min: 1, max: 2 });
    drops.push({ item: `rune_${el}_${level > 55 ? 'greater' : 'lesser'}`, chance: Math.min(1, 0.012 * v() * (boss ? 5 : 1)) });
  }
  return drops;
}

ZONE_SEEDS.forEach((seed, zi) => {
  const z = zi + 1;
  const ids: string[] = [];
  for (let i = 0; i < 14; i++) {
    const elite = i === 13;
    const famId = seed.families[i % seed.families.length];
    const fam = FAMILY_MAP[famId];
    const prof = PROFILE[famId];
    const nouns = NOUNS[famId];
    const id = `m_${z}_${i + 1}`;
    const r = seeded('mon:' + id);
    const level = Math.min(100, Math.round(zoneBaseLevel(z) + (i / 13) * (ZONE_LEVEL_STEP - 0.1)));
    const noun = nouns[Math.floor(i / seed.families.length) % nouns.length];
    const name = elite ? seed.elite : `${seed.prefixes[i]} ${noun}`;
    const element: Element = i % 4 === 3 ? (fam.element as Element) : seed.element;
    const tintable = i % 3 !== 0;
    const hue = tintable ? Math.round(((z * 53 + i * 31) % 360) / 5) * 5 : 0;
    const status = prof.status[(i + z) % prof.status.length];
    const inflictChance = i % 2 === 0 ? 0.12 + r() * 0.18 : 0;
    const m: MonsterDef = {
      id, name, zone: z, level, family: famId, sprite: fam.sprites[(i + z) % fam.sprites.length], hue, sat: 0.9 + r() * 0.3,
      scale: (0.8 + level / 260) * prof.scale * (elite ? 1.3 : 1), hpMul: prof.hp * (0.85 + r() * 0.35), atkMul: prof.atk * (0.85 + r() * 0.3),
      defMul: prof.def * (0.85 + r() * 0.3), speed: Math.round((prof.speed * (0.9 + r() * 0.25)) * 10) / 10, element,
      weak: WEAK_TO[element], resist: element === 'physical' ? undefined : element,
      inflicts: inflictChance > 0 || elite ? { status, chance: elite ? 0.3 : inflictChance, potency: 0.05 + z * 0.004, duration: 5 } : undefined,
      drops: lootFor(id, z, level, i, famId, elite, false),
      gold: [Math.round(3 * Math.pow(1.24, z - 1) * (elite ? 3 : 1)), Math.round(7 * Math.pow(1.24, z - 1) * (elite ? 3 : 1.4))],
      xp: xpForReq(Math.max(1, Math.round(level * 0.92)), elite ? 2.2 : 1) , elite,
    };
    MONSTERS[id] = m;
    ids.push(id);
  }

  const bossTemplates: Record<string, BossAbility[]> = {
    brute: [
      { name: 'Crushing Blow', every: 10, kind: 'smash', mult: 2.1 },
      { name: 'Roar', every: 16, kind: 'aoe', mult: 0.8 },
      { name: 'Frenzy', every: 0.35, kind: 'enrage', mult: 1.5 },
    ],
    caster: [
      { name: 'Veil Burst', every: 11, kind: 'aoe', mult: 0.95 },
      { name: 'Hex', every: 14, kind: 'status', status: { status: STATUS_FOR_ELEMENT[seed.boss.element], potency: 0.08, duration: 8 } },
      { name: 'Ward', every: 24, kind: 'shield', mult: 0.12 },
    ],
    beast: [
      { name: 'Savage Strike', every: 8, kind: 'smash', mult: 2.3 },
      { name: 'Regenerate', every: 20, kind: 'heal', mult: 0.07 },
      { name: 'Venomous Spray', every: 15, kind: 'status', status: { status: STATUS_FOR_ELEMENT[seed.boss.element], potency: 0.08, duration: 8 } },
    ],
  };
  const arch = (f: string) => (['minotaur', 'skelwar', 'skeleton'].includes(f) ? 'brute' : ['magus', 'genie', 'succubus', 'ghost'].includes(f) ? 'caster' : 'beast');
  const bid = `boss_${z}`;
  const bfam = FAMILY_MAP[seed.boss.family];
  const blevel = Math.min(100, zoneMaxLevel(z) + 1);
  const bprof = PROFILE[seed.boss.family];
  const boss: BossDef = {
    id: bid, name: seed.boss.name, title: seed.boss.title, lore: seed.boss.lore, zone: z, level: blevel, family: seed.boss.family,
    sprite: bfam.sprites[z % bfam.sprites.length], hue: seed.boss.hue, sat: 1.05, scale: 1.55 + z * 0.015, hpMul: bprof.hp, atkMul: bprof.atk, defMul: bprof.def * 1.2,
    speed: Math.max(2, bprof.speed - 0.2), element: seed.boss.element, weak: WEAK_TO[seed.boss.element], resist: seed.boss.element === 'physical' ? undefined : seed.boss.element,
    inflicts: { status: STATUS_FOR_ELEMENT[seed.boss.element], chance: 0.25, potency: 0.06 + z * 0.004, duration: 6 },
    drops: lootFor(bid, z, blevel, 3, seed.boss.family, false, true),
    gold: [Math.round(40 * Math.pow(1.25, z - 1)), Math.round(80 * Math.pow(1.25, z - 1))],
    xp: xpForReq(Math.round(blevel * 0.95), 10), boss: true,
    abilities: bossTemplates[arch(seed.boss.family)], unique: `uni_${bid}`,
    first: { gold: Math.round(300 * Math.pow(1.5, z - 1)), items: [{ item: `scroll_${Math.min(8, 1 + Math.floor(z / 3))}`, n: 1 + Math.floor(z / 8) }, { item: `relic_${Math.min(11, Math.floor(z / 2))}`, n: 2 }] },
    bg: `zone_${z}`,
  };
  BOSSES[bid] = boss;
  MONSTERS[bid] = boss;

  ZONES.push({
    id: z, key: seed.key, name: seed.name, desc: seed.desc, levelRange: [Math.round(zoneBaseLevel(z)), zoneMaxLevel(z)], tier: gearTierForLevel(zoneBaseLevel(z) + 2),
    monsters: ids.slice(0, 13), elite: ids[13], boss: bid, gather: [], bg: `zone_${z}`, color: seed.color,
    reqExploration: z <= 2 ? 1 : Math.round(1 + (z - 1) * 3.6), reqPower: 0,
  });
});

WORLD_BOSSES.forEach((wb, i) => {
  const id = `wboss_${i + 1}`;
  const z = wb.zone;
  const bfam = FAMILY_MAP[wb.family];
  const bprof = PROFILE[wb.family];
  const level = Math.min(100, zoneMaxLevel(z) + 3);
  const abilities: BossAbility[] = [
    { name: 'Cataclysm', every: 10, kind: 'aoe', mult: 1.1 },
    { name: 'Titan Strike', every: 8, kind: 'smash', mult: 2.9 },
    { name: 'Elemental Curse', every: 13, kind: 'status', status: { status: STATUS_FOR_ELEMENT[wb.element], potency: 0.1, duration: 9 } },
    { name: 'Rage of Ages', every: 0.4, kind: 'enrage', mult: 1.6 },
  ];
  const boss: BossDef = {
    id, name: wb.name, title: wb.title, lore: wb.lore, zone: z, level, family: wb.family, sprite: bfam.sprites[(i + 1) % bfam.sprites.length], hue: wb.hue, sat: 1.1,
    scale: 1.9, hpMul: bprof.hp, atkMul: bprof.atk, defMul: bprof.def * 1.3, speed: 2.7, element: wb.element, weak: WEAK_TO[wb.element], resist: wb.element === 'physical' ? undefined : wb.element,
    inflicts: { status: STATUS_FOR_ELEMENT[wb.element], chance: 0.3, potency: 0.08 + z * 0.004, duration: 7 },
    drops: lootFor(id, z, level, 7, wb.family, false, true).map((d) => (d.item.startsWith('eq_') ? { ...d, chance: Math.min(1, d.chance * 1.5) } : d)),
    gold: [Math.round(120 * Math.pow(1.25, z - 1)), Math.round(220 * Math.pow(1.25, z - 1))],
    xp: xpForReq(Math.round(level * 0.95), 22), boss: true, elite: false, abilities, unique: `uni_${id}`,
    first: { gold: Math.round(900 * Math.pow(1.5, z - 1)), items: [{ item: `scroll_${Math.min(8, 2 + Math.floor(z / 3))}`, n: 2 }, { item: `ess_${wb.element}`, n: 5 }] }, bg: `zone_${z}`,
  };
  BOSSES[id] = boss;
  MONSTERS[id] = boss;
});

export const ZONE_MAP: Record<number, ZoneDef> = Object.fromEntries(ZONES.map((z) => [z.id, z]));
export const BOSS_LIST: BossDef[] = Object.values(BOSSES);
export const monsterCount = () => Object.values(MONSTERS).filter((m) => !m.boss).length;


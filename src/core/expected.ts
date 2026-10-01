import type { GameState } from './types';
import { HEROES, SKILL_IDS, ZONE_MAP } from '@/data';
import { GEAR_TYPES, gearId } from '@/data/gear';
import { BAL, gearTierForLevel } from './balance';
import { computeHero } from './stats';
import { newGear, newState } from './state';
import { xpAtLevel } from './xp';

const WEAPON_FOR: Record<string, string> = { melee: 'sword', ranged: 'bow', magic: 'staff' };

export const expectedRarity = (zone: number): number => Math.min(25, Math.round(BAL.expRarityBase + BAL.expRarityPerZone * zone));

/** A full party outfitted the way a well-prepared player should be when arriving in `zone`. */
export function expectedState(zone: number, rarityLevel = expectedRarity(zone)): GameState {
  const s = newState('Expected', 1);
  const z = ZONE_MAP[zone];
  const lvl = Math.round((z.levelRange[0] + z.levelRange[1]) / 2);
  const tier = gearTierForLevel(lvl);
  const sl = Math.min(99, Math.round(lvl * 0.95));
  for (const id of SKILL_IDS) {
    s.skills[id] = sl;
    s.skillXp[id] = xpAtLevel(sl);
  }
  HEROES.forEach((h, i) => {
    s.heroes[i].level = Math.min(100, lvl);
    const put = (key: string) => {
      const t = GEAR_TYPES.find((g) => g.key === key)!;
      s.heroes[i].equip[t.slot] = newGear(s, gearId(key, tier), rarityLevel);
    };
    put(WEAPON_FOR[h.style]);
    ['shield', 'helm', 'cuirass', 'greaves', 'gloves', 'boots', 'amulet', 'ring'].forEach(put);
    if (h.style === 'magic') put('orb');
  });
  return s;
}

export interface Expect { dps: number; partyHp: number; heroHp: number; def: number }
const cache = new Map<number, Expect>();

export function expected(zone: number): Expect {
  const hit = cache.get(zone);
  if (hit) return hit;
  const s = expectedState(zone);
  let dps = 0, hp = 0, def = 0;
  for (let i = 0; i < s.heroes.length; i++) {
    const c = computeHero(s, i);
    dps += (c.atk * (1 + (c.crit / 100) * (c.critDmg / 100 - 1))) / c.interval;
    hp += c.maxHp;
    def += c.def;
  }
  const out = { dps: dps * BAL.abilityDpsBonus, partyHp: hp, heroHp: hp / s.heroes.length, def: def / s.heroes.length };
  cache.set(zone, out);
  return out;
}

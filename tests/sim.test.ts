import { describe, expect, it } from 'vitest';
import { Game } from '@/core/engine';
import { newState } from '@/core/state';
import { GEAR_TYPES, gearId } from '@/data/gear';
import { BOSSES, storyPartyAt, ITEMS, ZONES, ZONE_MAP, SKILL_IDS } from '@/data';
import { gearTierForLevel } from '@/core/balance';
import { newGear } from '@/core/state';
import { computeHero } from '@/core/stats';
import { expectedRarity } from '@/core/expected';
import { xpAtLevel } from '@/core/xp';
import type { GameState, Slot } from '@/core/types';

const SLOTS: Record<string, { slot: Slot; types: Record<string, string> }> = {};
void SLOTS;
const WEAPON_FOR: Record<string, string> = { melee: 'sword', ranged: 'bow', magic: 'staff' };

export function geared(zone: number, rarityLevel: number, heroLevel?: number, skillLevel?: number): GameState {
  const s = newState('T', 1234);
  const z = ZONE_MAP[zone];
  const lvl = Math.round((z.levelRange[0] + z.levelRange[1]) / 2);
  const tier = gearTierForLevel(lvl);
  const sl = skillLevel ?? Math.min(99, Math.round(lvl * 0.5));
  for (const id of SKILL_IDS) { s.skills[id] = sl; s.skillXp[id] = xpAtLevel(sl); }
  s.zoneUnlocked = 22;
  s.skills.exploration = 99;
  const party = storyPartyAt(zone);
  s.heroes = party.map((h) => ({ id: h.id, level: 1, xp: 0, equip: {} }));
  party.forEach((h, i) => {
    s.heroes[i].level = heroLevel ?? Math.min(100, Math.round(lvl * 1.0));
    const put = (key: string) => {
      const t = GEAR_TYPES.find((g) => g.key === key)!;
      s.heroes[i].equip[t.slot] = newGear(s, gearId(key, tier), rarityLevel);
    };
    put(WEAPON_FOR[h.style]);
    ['shield', 'helm', 'cuirass', 'greaves', 'gloves', 'boots', 'amulet', 'ring'].forEach(put);
    if (h.style === 'magic') put('orb');
  });
  const foodIdx = Math.min(19, Math.floor(((lvl - 1) * 20) / 100) + 3);
  s.stacks[`cfish_${foodIdx}`] = 9999;
  s.loadout.food = `cfish_${foodIdx}`;
  return s;
}

function run(state: GameState, id: string, secs: number) {
  const g = new Game(state);
  const err = g.start('combat', id);
  if (err) throw new Error(err);
  let wipes = 0, kills = 0, taken = 0, firstKill = -1, tm = 0;
  g.on((e) => { if (e.t === 'wipe') wipes++; if (e.t === 'kill') { kills++; if (firstKill < 0) firstKill = tm; } if (e.t === 'dmg' && e.side === 'hero' && e.n > 0 && !e.heal) taken += e.n; });
  const food0 = state.stacks[state.loadout.food!] ?? 0;
  for (let t = 0; t < secs; t += 0.5) { tm = t; g.advance(0.5); }
  const eaten = food0 - (state.stacks[state.loadout.food!] ?? 0);
  const party = g.rt ? g.rt.heroes.reduce((a, h) => a + h.maxHp, 0) : 1;
  return { wipes, kills, eaten, stopped: !state.activity, firstKill: Math.round(firstKill), lossPct: kills > 0 ? Math.round((taken / kills / party) * 100) : 0 };
}

describe('combat balance', () => {
  it('prints a progression table', () => {
    const rows: string[] = [];
    for (const z of ZONES) {
      const rar = expectedRarity(z.id);
      const s = geared(z.id, rar);
      const c = computeHero(s, 0);
      const r = run(s, `zone:${z.id}`, 120);
      const b = geared(z.id, rar);
      const bossRun = run(b, z.boss, 240);
      rows.push(`Z${String(z.id).padStart(2)} tier${String(z.tier).padStart(2)} rar${String(rar).padStart(2)} atk${c.atk.toFixed(0).padStart(5)} hp${c.maxHp.toFixed(0).padStart(5)} def${c.def.toFixed(0).padStart(4)} | zone: kills ${String(r.kills).padStart(3)} loss${String(r.lossPct).padStart(3)}% wipes ${r.wipes} food ${String(r.eaten).padStart(3)} | boss: t=${bossRun.firstKill}s kills ${bossRun.kills} wipes ${bossRun.wipes} food ${bossRun.eaten} ${bossRun.stopped ? 'STOPPED' : ''}`);
    }
    console.log('\n' + rows.join('\n'));
    expect(rows.length).toBe(22);
  });

  it('keeps boss ids intact', () => {
    expect(BOSSES.boss_1.name).toBe('Brambleback');
    expect(ITEMS[BOSSES.boss_1.unique!]).toBeTruthy();
  });
});




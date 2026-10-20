import { describe, expect, it, vi } from 'vitest';
import { Game } from '@/core/engine';
import { huntStatus } from '@/core/daily';
import { guideFor } from '@/core/questGuide';
import { migrate } from '@/core/save';
import { newState, starterState } from '@/core/state';
import { BOSSES, QUESTS, ZONE_MAP } from '@/data';

describe('boss access', () => {
  it('locks a boss on first entering its zone', () => {
    const g = new Game(newState('Test', 7));
    expect(g.start('combat', 'boss_1')).toMatch(/defeat.*regular enem.*0\/13/i);
    expect(g.state.activity).toBeNull();
    expect(g.rt).toBeNull();
  });

  it('counts defeated enemy types, not sightings, repeated kills or another zone', () => {
    const s = newState('Test', 7);
    for (const id of ZONE_MAP[1].monsters) s.codex.monsters[id] = 1;
    s.kills[ZONE_MAP[1].monsters[0]] = 99;
    for (const id of ZONE_MAP[2].monsters) s.kills[id] = 1;
    expect(new Game(s).start('combat', 'boss_1')).toMatch(/1\/13/);
  });

  it('unlocks only after the final regular enemy type is defeated, without requiring the elite', () => {
    const s = newState('Test', 7);
    const zone = ZONE_MAP[1];
    for (const id of zone.monsters.slice(0, -1)) s.kills[id] = 1;
    const g = new Game(s);
    expect(g.start('combat', zone.boss)).toMatch(/12\/13/);
    s.kills[zone.monsters[zone.monsters.length - 1]] = 1;
    expect(s.kills[zone.elite]).toBeUndefined();
    expect(g.start('combat', zone.boss)).toBeNull();
    expect(s.activity?.id).toBe(zone.boss);
    expect(g.rt?.boss).toBe(true);
  });

  it('keeps the next zone boss locked after clearing an earlier zone', () => {
    const s = newState('Test', 7);
    s.zoneUnlocked = 2;
    for (const id of ZONE_MAP[1].monsters) s.kills[id] = 1;
    expect(new Game(s).start('combat', 'boss_2')).toMatch(/0\/13/);
  });

  it('allows regular and elite enemies before the boss is unlocked', () => {
    const g = new Game(newState('Test', 7));
    expect(g.start('combat', ZONE_MAP[1].monsters[0])).toBeNull();
    expect(g.start('combat', ZONE_MAP[1].elite)).toBeNull();
    expect(g.start('combat', 'zone:1')).toBeNull();
  });

  it('does not interrupt the current activity or plan when a locked boss is requested', () => {
    const g = new Game(newState('Test', 7));
    expect(g.startPlan([{ kind: 'gather', id: 'wood_0', min: 10 }], false)).toBeNull();
    const activity = g.state.activity;
    expect(g.start('combat', 'boss_1')).not.toBeNull();
    expect(g.state.activity).toBe(activity);
    expect(g.state.plan?.on).toBe(true);
  });

  it('uses saved kill history to retain a completed zone unlock', () => {
    const s = newState('Test', 7);
    for (const id of ZONE_MAP[1].monsters) s.kills[id] = 1;
    const g = new Game(migrate(JSON.parse(JSON.stringify(s))));
    expect(g.start('combat', 'boss_1')).toBeNull();
  });

  it('stops an old saved boss fight that has not met the new requirement', () => {
    const s = newState('Test', 7);
    s.activity = { type: 'combat', id: 'boss_1', progress: 0, boss: true };
    const g = new Game(migrate(JSON.parse(JSON.stringify(s))));
    expect(g.state.activity).toBeNull();
    expect(g.rt).toBeNull();
  });

  it('resumes a saved boss fight after every regular enemy has been defeated', () => {
    const s = newState('Test', 7);
    for (const id of ZONE_MAP[1].monsters) s.kills[id] = 1;
    s.activity = { type: 'combat', id: 'boss_1', progress: 0, boss: true };
    const g = new Game(migrate(JSON.parse(JSON.stringify(s))));
    expect(g.state.activity?.id).toBe('boss_1');
    expect(g.rt?.boss).toBe(true);
  });

  it('safely stops a locked boss when combat has to be rebuilt', () => {
    const g = new Game(newState('Test', 7));
    g.state.activity = { type: 'combat', id: 'boss_1', progress: 0, boss: true };
    expect(() => g.advance(0.25)).not.toThrow();
    expect(g.state.activity).toBeNull();
    expect(g.rt).toBeNull();
  });

  it('unlocks the boss immediately after an actual kill of the final regular enemy', () => {
    const s = starterState('Test');
    s.heroes[0].level = 100;
    const zone = ZONE_MAP[1];
    for (const id of zone.monsters.slice(0, -1)) s.kills[id] = 1;
    const last = zone.monsters[zone.monsters.length - 1];
    const g = new Game(s);
    expect(g.start('combat', last)).toBeNull();
    for (let i = 0; i < 120 && !s.kills[last]; i++) g.advance(0.25);
    expect(s.kills[last]).toBeGreaterThan(0);
    expect(g.start('combat', zone.boss)).toBeNull();
  });

  it('applies the requirement to world bosses and an open daily hunt', () => {
    const s = newState('Test', 7);
    s.zoneUnlocked = 32;
    s.skills.exploration = 99;
    const worldBoss = Object.values(BOSSES).find((b) => b.id.startsWith('wboss_'))!;
    const midnight = new Date(2030, 1, 1).getTime();
    const hunt = huntStatus(s, midnight);
    const now = vi.spyOn(Date, 'now').mockReturnValue(midnight + (hunt.start + 1) * 60_000);
    try {
      const g = new Game(s);
      expect(huntStatus(s).open).toBe(true);
      expect(g.start('combat', worldBoss.id)).toMatch(/regular enem/i);
      expect(g.start('combat', hunt.id)).toMatch(/regular enem/i);
      for (const zoneId of [worldBoss.zone, BOSSES[hunt.id].zone]) {
        for (const id of ZONE_MAP[zoneId].monsters) s.kills[id] = 1;
      }
      expect(g.start('combat', worldBoss.id)).toBeNull();
      expect(g.start('combat', hunt.id)).toBeNull();
    } finally {
      now.mockRestore();
    }
  });

  it('guides a boss quest toward the remaining regular enemy', () => {
    const s = newState('Test', 7);
    const zone = ZONE_MAP[1];
    for (const id of zone.monsters.slice(0, -1)) s.kills[id] = 1;
    const q = QUESTS.find((q) => q.steps.some((st) => st.type === 'boss' && st.target === zone.boss))!;
    const step = q.steps.findIndex((st) => st.type === 'boss' && st.target === zone.boss);
    const guide = guideFor(s, q, step);
    expect(guide?.kind).toBe('combat');
    expect(guide?.id).toBe(zone.monsters[zone.monsters.length - 1]);
    expect(guide?.label).toMatch(/12\/13/);
  });
});

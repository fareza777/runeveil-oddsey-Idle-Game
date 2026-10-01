import { describe, expect, it } from 'vitest';
import { Game, OFFLINE_CAP } from '@/core/engine';
import { migrate } from '@/core/save';
import { questDone, stepProgress } from '@/core/questSys';
import { addItem, newGear, newState } from '@/core/state';
import { levelFromXp, xpAtLevel, xpForReq } from '@/core/xp';
import { QUEST_MAP } from '@/data';
import { mulberry32 } from '@/core/rng';
import { rollRarity } from '@/core/loot';

const fresh = () => new Game(newState('Test', 42));

describe('xp curve', () => {
  it('is monotonic and reaches 99', () => {
    for (let l = 1; l < 99; l++) expect(xpAtLevel(l + 1)).toBeGreaterThan(xpAtLevel(l));
    expect(levelFromXp(xpAtLevel(50))).toBe(50);
    expect(levelFromXp(xpAtLevel(99) + 1e9)).toBe(99);
    expect(xpForReq(1)).toBeGreaterThanOrEqual(2);
  });
});

describe('gathering', () => {
  it('yields items and xp', () => {
    const g = fresh();
    expect(g.start('gather', 'mine_0')).toBeNull();
    for (let i = 0; i < 400; i++) g.advance(0.5);
    expect(g.state.stacks.ore_0).toBeGreaterThan(10);
    expect(g.state.skills.mining).toBeGreaterThan(1);
  });

  it('rejects activities above skill level', () => {
    expect(fresh().start('gather', 'mine_5')).toMatch(/level/i);
  });
});

describe('crafting', () => {
  it('consumes inputs and stops when out', () => {
    const g = fresh();
    addItem(g.state, 'ore_0', 6);
    expect(g.start('craft', 'smelt_0')).toBeNull();
    for (let i = 0; i < 100; i++) g.advance(0.5);
    expect(g.state.stacks.bar_0).toBe(3);
    expect(g.state.stacks.ore_0 ?? 0).toBe(0);
    expect(g.state.activity).toBeNull();
  });

  it('produces gear instances with a rarity', () => {
    const g = fresh();
    g.state.skills.smithing = 20;
    addItem(g.state, 'bar_0', 20);
    addItem(g.state, 'plank_0', 5);
    g.state.gold = 1000;
    g.state.settings.autoSell = 0;
    expect(g.start('craft', 'craft_sword_1')).toBeNull();
    for (let i = 0; i < 40; i++) g.advance(0.5);
    expect(g.state.gear.some((x) => x.id === 'eq_sword_1')).toBe(true);
  });
});

describe('equipment', () => {
  it('equips, swaps and upgrades', () => {
    const g = fresh();
    const a = newGear(g.state, 'eq_sword_1', 1);
    const b = newGear(g.state, 'eq_sword_2', 3);
    g.state.gear.push(a, b);
    expect(g.equip(0, a.uid)).toBe(true);
    expect(g.equip(0, b.uid)).toBe(true);
    expect(g.state.heroes[0].equip.weapon?.uid).toBe(b.uid);
    expect(g.state.gear.map((x) => x.uid)).toContain(a.uid);
    addItem(g.state, 'scroll_1', 5);
    g.state.gold = 100000;
    let ok = 0;
    for (let i = 0; i < 5; i++) if (g.upgradeGear(a.uid) === 'ok') ok++;
    expect(ok).toBeGreaterThan(0);
    expect(a.up).toBeGreaterThan(0);
  });

  it('rarity roll is bounded and decays', () => {
    const r = mulberry32(7);
    const counts = new Array(26).fill(0);
    for (let i = 0; i < 20000; i++) counts[rollRarity(r, 12, 0.5)]++;
    expect(counts[13]).toBe(0);
    expect(counts[1]).toBeGreaterThan(counts[3]);
  });
});

describe('quests', () => {
  it('tracks the first main quest', () => {
    const g = fresh();
    const q = QUEST_MAP.main_0;
    g.start('gather', 'wood_0');
    for (let i = 0; i < 200; i++) g.advance(0.5);
    expect(stepProgress(g.state, q, 0)).toBe(q.steps[0].n);
    g.start('gather', 'mine_0');
    for (let i = 0; i < 200; i++) g.advance(0.5);
    expect(stepProgress(g.state, q, 1)).toBe(q.steps[1].n);
    expect(questDone(g.state, q)).toBe(false);
  });
});

describe('offline progression', () => {
  it('simulates gathering with a cap', () => {
    const g = fresh();
    g.start('gather', 'fish_0');
    const rep = g.simulate(OFFLINE_CAP * 2);
    expect(rep.capped).toBe(true);
    expect(rep.seconds).toBe(OFFLINE_CAP);
    expect(rep.actions).toBeGreaterThan(5000);
    expect(Object.keys(rep.items).length).toBeGreaterThan(0);
    expect(rep.levelUps.length).toBeGreaterThan(0);
  });

  it('simulates combat and may end in defeat', () => {
    const g = fresh();
    g.start('combat', 'zone:1');
    const rep = g.simulate(3600);
    expect(rep.kills + rep.wipes).toBeGreaterThan(0);
  });
});

describe('save migration', () => {
  it('round-trips and fills gaps', () => {
    const s = newState('Hero', 5);
    const back = migrate(JSON.parse(JSON.stringify(s)));
    expect(back.heroes.length).toBe(5);
    const partial = migrate({ name: 'Old', gold: 99 } as never);
    expect(partial.gold).toBe(99);
    expect(partial.skills.combat).toBe(1);
    expect(partial.settings.autoEat).toBeGreaterThan(0);
  });
});

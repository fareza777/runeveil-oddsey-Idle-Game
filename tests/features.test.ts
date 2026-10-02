import { describe, expect, it } from 'vitest';
import { Game } from '@/core/engine';
import { addItem, newGear, newState, recruitHero, PARTY_MAX } from '@/core/state';
import { migrate } from '@/core/save';
import { UNIQUE_IDS, huntStatus, merchantStatus, merchantStock } from '@/core/daily';
import { CARD_IDS, cardDef } from '@/data/cards';
import { ITEMS, RECIPES } from '@/data';
import { socketCount } from '@/core/stats';

function fullRoster() {
  const s = newState('Tester', 7);
  for (const id of ['sylra', 'orren', 'brynna', 'mirel', 'vex', 'thessaly']) recruitHero(s, id);
  return s;
}

describe('party and roster', () => {
  it('keeps five heroes in the field and rests the rest', () => {
    const s = fullRoster();
    expect(s.heroes.length).toBeLessThanOrEqual(PARTY_MAX);
    expect(s.heroes.length + s.bench.length).toBe(7);
  });

  it('swaps a benched hero in without losing anyone', () => {
    const g = new Game(fullRoster());
    const ids = [...g.state.heroes, ...g.state.bench].map((h) => h.id).sort();
    const incoming = g.state.bench[0].id;
    expect(g.swapHero(0, 0)).toBe(true);
    expect(g.state.heroes[0].id).toBe(incoming);
    expect([...g.state.heroes, ...g.state.bench].map((h) => h.id).sort()).toEqual(ids);
    expect(g.state.heroes.length).toBe(PARTY_MAX);
  });

  it('moves overflow heroes to the bench when loading a save', () => {
    const s = fullRoster();
    s.bench = [];
    s.heroes = [...fullRoster().heroes, ...fullRoster().bench];
    const m = migrate(JSON.parse(JSON.stringify(s)));
    expect(m.heroes.length).toBe(PARTY_MAX);
    expect(m.bench.length).toBe(2);
  });
});

describe('monster cards', () => {
  it('has a card for every monster and respects the gear type', () => {
    expect(CARD_IDS.length).toBeGreaterThan(400);
    const g = new Game(newState('Tester', 3));
    const weaponCard = CARD_IDS.find((id) => cardDef(id)!.kind === 'weapon')!;
    const armorCard = CARD_IDS.find((id) => cardDef(id)!.kind === 'armor')!;
    const sword = newGear(g.state, 'eq_sword_8', 16);
    g.state.gear.push(sword);
    addItem(g.state, weaponCard, 2);
    addItem(g.state, armorCard, 1);
    expect(socketCount(sword)).toBeGreaterThanOrEqual(2);
    expect(g.socketCard(sword.uid, armorCard)).not.toBeNull();
    expect(g.socketCard(sword.uid, weaponCard)).toBeNull();
    expect(sword.cards?.length).toBe(1);
    expect(g.socketCard(sword.uid, weaponCard)).not.toBeNull();
    expect(g.unsocketCard(sword.uid, 0)).toBeNull();
    expect(sword.cards?.length ?? 0).toBe(0);
  });

  it('keeps card drop rates tiny', () => {
    for (const id of CARD_IDS) expect(cardDef(id)).toBeTruthy();
    expect(ITEMS[CARD_IDS[0]].kind).toBe('card');
  });
});

describe('wandering merchant', () => {
  it('opens for about an hour and stocks unique gear', () => {
    const s = newState('Tester', 11);
    const day = new Date(2030, 0, 15);
    let openAt = -1;
    for (let m = 0; m < 24 * 60; m++) {
      if (merchantStatus(s, day.getTime() + m * 60000).open) { openAt = openAt < 0 ? m : openAt; }
    }
    expect(openAt).toBeGreaterThanOrEqual(8 * 60);
    let mins = 0;
    for (let m = 0; m < 24 * 60; m++) if (merchantStatus(s, day.getTime() + m * 60000).open) mins++;
    expect(mins).toBe(60);
    const stock = merchantStock(s, day.getTime());
    expect(stock.length).toBeGreaterThanOrEqual(6);
    expect(merchantStock(s, day.getTime()).map((e) => e.key)).toEqual(stock.map((e) => e.key));
  });
});

describe('crafting odds', () => {
  it('make higher tiers harder and skill help', () => {
    const g = new Game(newState('Tester', 5));
    const rs = RECIPES.filter((r) => r.out[0] && ITEMS[r.out[0].item]?.kind === 'equip' && r.skill === 'smithing');
    const low = rs[0];
    const high = rs[rs.length - 1];
    const lo = g.craftOdds(low, low.out[0].item);
    const hi = g.craftOdds(high, high.out[0].item);
    expect(hi.q).toBeLessThanOrEqual(lo.q + 0.2);
    expect(hi.maxR).toBeGreaterThan(lo.maxR);
    expect(g.craftChanceAtLeast(high, high.out[0].item, 8)).toBeLessThan(g.craftChanceAtLeast(high, high.out[0].item, 4));
    expect(g.craftChanceAtLeast(low, low.out[0].item, hi.maxR + 1)).toBe(0);
  });
});

describe('daily hunt', () => {
  it('picks one of the twelve and is open for exactly one hour', () => {
    const s = newState('Tester', 21);
    const day = new Date(2030, 2, 9);
    const id = huntStatus(s, day.getTime()).id;
    expect(UNIQUE_IDS).toContain(id);
    let mins = 0;
    for (let m = 0; m < 24 * 60; m++) {
      const h = huntStatus(s, day.getTime() + m * 60000);
      expect(h.id).toBe(id);
      if (h.open) mins++;
    }
    expect(mins).toBe(60);
  });

  it('varies between days and refuses a fight outside the window', () => {
    const s = newState('Tester', 21);
    const ids = new Set<string>();
    for (let d = 1; d <= 40; d++) ids.add(huntStatus(s, new Date(2030, 3, d, 12).getTime()).id);
    expect(ids.size).toBeGreaterThan(5);
    const g = new Game(s);
    const hu = g.hunt();
    const other = UNIQUE_IDS.find((u) => u !== hu.id)!;
    expect(g.start('combat', other)).toMatch(/not abroad today/);
  });
});
describe('auto-supplied crafting', () => {
  it('mines, smelts and forges a copper sword from an empty bag', () => {
    const g = new Game(newState('Tester', 31));
    expect(g.startChain('craft_sword_1', 1)).toBeNull();
    const seen = new Set<string>();
    for (let i = 0; i < 60 * 60 * 4 && g.state.activity; i++) {
      seen.add(g.state.activity.id);
      g.advance(1);
    }
    expect(g.state.activity).toBeNull();
    expect(g.state.stats.crafts).toBeGreaterThanOrEqual(2);
    expect(seen.has('craft_sword_1')).toBe(true);
    expect([...seen].some((id) => id.startsWith('smelt_'))).toBe(true);
    expect([...seen].some((id) => id.startsWith('mine_'))).toBe(true);
  });

  it('explains why a chain cannot run', () => {
    const g = new Game(newState('Tester', 32));
    expect(g.startChain(RECIPES.filter((r) => r.skill === 'smithing').slice(-1)[0].id, 1)).toMatch(/level|coin/i);
  });
});

describe('auto plan', () => {
  it('runs steps in order, loops, and respects its time limit', () => {
    const s = newState('Tester', 41);
    const g = new Game(s);
    const err = g.startPlan([{ kind: 'gather', id: 'wood_0', min: 10 }, { kind: 'combat', id: 'zone:1', min: 10 }], true);
    expect(err).toBeNull();
    const order: string[] = [];
    for (let i = 0; i < 60 * 60 * 2; i++) {
      g.advance(1);
      const a = s.activity;
      const tag = a ? a.type : 'none';
      if (order[order.length - 1] !== tag) order.push(tag);
    }
    expect(order.slice(0, 5)).toEqual(['gather', 'combat', 'gather', 'combat', 'gather']);
    expect(s.plan!.on).toBe(true);
    for (let i = 0; i < 60 * 60 * 7; i++) g.advance(1);
    expect(s.plan!.on).toBe(false);
    expect(s.activity).toBeNull();
    expect(s.plan!.note).toMatch(/time limit/);
  });

  it('pauses when the player starts something else, and ads add time once per slot', () => {
    const g = new Game(newState('Tester', 42));
    g.startPlan([{ kind: 'gather', id: 'wood_0', min: 30 }], false);
    expect(g.start('gather', 'mine_0')).toBeNull();
    expect(g.state.plan!.on).toBe(false);
    const before = g.state.plan!.budget;
    expect(g.extendPlan()).toBe(true);
    expect(g.state.plan!.budget).toBeGreaterThan(before);
    expect(g.extendPlan()).toBe(true);
    expect(g.extendPlan()).toBe(false);
  });

  it('skips a step that cannot run and finishes when a non-looping plan ends', () => {
    const s = newState('Tester', 43);
    const g = new Game(s);
    expect(g.startPlan([{ kind: 'combat', id: 'zone:9', min: 10 }, { kind: 'gather', id: 'wood_0', min: 10 }], false)).toBeNull();
    expect(s.activity?.id).toBe('wood_0');
    for (let i = 0; i < 60 * 15; i++) g.advance(1);
    expect(s.plan!.on).toBe(false);
  });
});
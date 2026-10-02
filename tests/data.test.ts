import { describe, expect, it } from 'vitest';
import { BOSS_LIST, GATHER, ITEMS, MONSTERS, QUESTS, RARITIES, RECIPES, SKILLS, ZONES } from '@/data';

describe('content integrity', () => {
  it('has the promised content volume', () => {
    const regular = Object.values(MONSTERS).filter((m) => !m.boss).length;
    const items = Object.keys(ITEMS).length;
    console.log({ skills: SKILLS.length, rarities: RARITIES.length, zones: ZONES.length, monsters: regular, bosses: BOSS_LIST.length, items, recipes: RECIPES.length, gather: GATHER.length, quests: QUESTS.length });
    expect(SKILLS.length).toBe(21);
    expect(RARITIES.length).toBe(25);
    expect(ZONES.length).toBeGreaterThanOrEqual(20);
    expect(ZONES.length).toBeLessThanOrEqual(22);
    expect(regular).toBeGreaterThanOrEqual(280);
    expect(BOSS_LIST.length).toBeGreaterThanOrEqual(25);
    expect(BOSS_LIST.length).toBeLessThanOrEqual(30);
    expect(items).toBeGreaterThanOrEqual(500);
  });

  it('references only existing items', () => {
    const bad: string[] = [];
    const chk = (id: string, where: string) => { if (id !== 'gold' && !ITEMS[id]) bad.push(`${where}: ${id}`); };
    for (const m of Object.values(MONSTERS)) m.drops.forEach((d) => chk(d.item, m.id));
    for (const g of GATHER) g.drops.forEach((d) => chk(d.item, g.id));
    for (const r of RECIPES) { r.inputs.forEach((i) => chk(i.item, r.id)); r.out.forEach((i) => chk(i.item, r.id)); }
    for (const q of QUESTS) { (q.reward.items ?? []).forEach((i) => chk(i.item, q.id)); q.steps.forEach((s) => { if (s.type === 'own') chk(s.target!, q.id); }); }
    for (const b of BOSS_LIST) { b.first.items.forEach((i) => chk(i.item, b.id)); if (b.unique) chk(b.unique, b.id); }
    expect(bad).toEqual([]);
  });

  it('quest steps point to real targets', () => {
    const rec = new Set(RECIPES.map((r) => r.id));
    const gat = new Set(GATHER.map((g) => g.id));
    const bad: string[] = [];
    for (const q of QUESTS) for (const s of q.steps) {
      if (s.type === 'craft' && !rec.has(s.target!)) bad.push(`${q.id}: craft ${s.target}`);
      if (s.type === 'gather' && !gat.has(s.target!) && !ITEMS[s.target!]) bad.push(`${q.id}: gather ${s.target}`);
      if (s.type === 'kill' && !MONSTERS[s.target!]) bad.push(`${q.id}: kill ${s.target}`);
      if (s.type === 'boss' && !MONSTERS[s.target!]) bad.push(`${q.id}: boss ${s.target}`);
    }
    expect(bad).toEqual([]);
  });

  it('has consistent quest chains', () => {
    const ids = new Set<string>();
    const bad: string[] = [];
    for (const q of QUESTS) { if (ids.has(q.id)) bad.push(`dup ${q.id}`); ids.add(q.id); }
    for (const q of QUESTS) if (q.requires && !ids.has(q.requires)) bad.push(`${q.id} requires missing ${q.requires}`);
    expect(bad).toEqual([]);
    expect(QUESTS.filter((q) => q.kind === 'main').length).toBeGreaterThanOrEqual(60);
  });

  it('has unique ids and names', () => {
    const names = new Map<string, string>();
    for (const it of Object.values(ITEMS)) {
      expect(names.has(it.name), `dup name ${it.name} (${it.id} / ${names.get(it.name)})`).toBe(false);
      names.set(it.name, it.id);
    }
    const mn = new Set<string>();
    for (const m of Object.values(MONSTERS)) {
      expect(mn.has(m.name), `dup monster ${m.name}`).toBe(false);
      mn.add(m.name);
    }
  });

  it('every recipe is craftable from reachable materials', () => {
    const gatherable = new Set<string>(['gold']);
    GATHER.forEach((g) => g.drops.forEach((d) => gatherable.add(d.item)));
    Object.values(MONSTERS).forEach((m) => m.drops.forEach((d) => gatherable.add(d.item)));
    RECIPES.forEach((r) => r.out.forEach((o) => gatherable.add(o.item)));
    const missing: string[] = [];
    for (const r of RECIPES) for (const i of r.inputs) if (!gatherable.has(i.item)) missing.push(`${r.id} needs ${i.item}`);
    expect(missing).toEqual([]);
  });
});

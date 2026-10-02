import { describe, expect, it } from 'vitest';
import { Game } from '@/core/engine';
import { claimQuest, questDone, stepDone } from '@/core/questSys';
import { guideFor } from '@/core/questGuide';
import { partyPower } from '@/core/power';
import { starterState } from '@/core/state';
import { computeHero } from '@/core/stats';
import { expected } from '@/core/expected';
import { QUESTS, QUEST_MAP, RECIPE_MAP } from '@/data';

/** Plays one quest by following the same guidance the Quests screen offers. Returns a problem description, or null. */
const trace: string[] = [];
function play(game: Game, qid: string, maxSeconds: number): string | null {
  trace.length = 0;
  const s = game.state;
  const q = QUEST_MAP[qid];
  let t = 0;
  while (!questDone(s, q) && t < maxSeconds) {
    const i = q.steps.findIndex((_, k) => !stepDone(s, q, k));
    const g = guideFor(s, q, i);
    if (!g) return `${qid}: no guidance for step ${i} (${q.steps[i].text})`;
    if (g.kind === 'open') return `${qid}: blocked, ${g.label} (step ${i}: ${q.steps[i].text})`;
    const sig = `${g.kind}:${g.id}`;
    if (trace.length === 0 || trace[trace.length - 1] !== `${sig} ${g.label.slice(0, 60)}`) trace.push(`${sig} ${g.label.slice(0, 60)}`);
    const cur = s.activity;
    const stalled = g.kind === 'craft' && cur?.type === 'craft' && !game.canAfford(RECIPE_MAP[g.id]);
    if (!cur || `${cur.type}:${cur.id}` !== sig || stalled) {
      const err = game.start(g.kind, g.id);
      if (err) return `${qid}: cannot start ${sig}: ${err}`;
    }
    for (let k = 0; k < 20; k++) game.advance(0.5);
    t += 10;
    for (let h = 0; h < s.heroes.length; h++) game.autoEquipBest(h);
  }
  if (questDone(s, q)) return null;
  const i = q.steps.findIndex((_, k) => !stepDone(s, q, k));
  const g = guideFor(s, q, i);
  const food = s.loadout.food ? `${s.loadout.food}x${s.stacks[s.loadout.food] ?? 0}` : 'none';
  const e = expected(q.reqZone ?? 1);
  const cs = s.heroes.map((_, k) => computeHero(s, k));
  const dps = cs.reduce((a, c) => a + c.atk / c.interval, 0) / e.dps;
  const hp = cs.reduce((a, c) => a + c.maxHp, 0) / e.partyHp;
  const def = cs.reduce((a, c) => a + c.def, 0) / cs.length / e.def;
  const gear = s.heroes.map((h) => Object.entries(h.equip).map(([k, v]) => (v ? `${k}:${v.id}r${v.rarity}` : '')).join(',')).join(' | ');
  return `${qid}: not finished after ${maxSeconds}s. step "${q.steps[i].text}" guide="${g?.label}" act=${s.activity?.type}:${s.activity?.id} wipes=${s.stats.wipes ?? 0} levels=${s.heroes.map((h) => h.level)} food=${food} power=${partyPower(s, q.reqZone ?? 1).toFixed(2)} dps=${dps.toFixed(2)} hp=${hp.toFixed(2)} def=${def.toFixed(2)} gear=${gear} TRACE(last 14)=${trace.slice(-14).join(' >> ')}`;
}

describe('main story is playable from a fresh start', () => {
  it('walks the opening quests using only in-game guidance', () => {
    const start = starterState('Bot');
    start.seed = 7;
    const game = new Game(start);
    const main = QUESTS.filter((q) => q.kind === 'main').slice(0, 7);
    const problems: string[] = [];
    let clock = 0;
    for (const q of main) {
      if (!game.state.quests.active.includes(q.id)) { problems.push(`${q.id} was not auto-accepted`); break; }
      const before = game.state.playTime;
      const err = play(game, q.id, 4 * 3600);
      clock += game.state.playTime - before;
      if (err) { problems.push(err); break; }
      expect(claimQuest(game.state, q.id, game.ctx)).toBe(true);
    }
    console.log('PROGRESS', problems.join('\n') || 'none', '| heroes', game.state.heroes.length, 'zone', game.state.zoneUnlocked, 'playHours', (clock / 3600).toFixed(1));
    expect(problems).toEqual([]);
  });
});

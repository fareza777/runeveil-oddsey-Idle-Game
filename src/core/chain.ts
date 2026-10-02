import type { GameState } from './types';
import { GATHER, RECIPES, RECIPE_MAP, ITEMS, SKILL_MAP } from '@/data';
import { countItem } from './state';

export type ChainNext =
  | { kind: 'gather' | 'craft'; id: string }
  | { kind: 'fail'; reason: string };

/**
 * The next thing to do to make `n` of a recipe: gather or craft whatever is still missing, one
 * ingredient at a time, and finally the recipe itself. Used so a player can press one button and
 * watch the whole chain (mine, smelt, forge) run by itself.
 */
export function chainNext(s: GameState, recipeId: string, n: number, depth = 0): ChainNext {
  const r = RECIPE_MAP[recipeId];
  if (!r) return { kind: 'fail', reason: 'Unknown recipe' };
  if (depth > 6) return { kind: 'fail', reason: 'Too many steps to make automatically' };
  if (s.skills[r.skill] < r.level) return { kind: 'fail', reason: `Needs ${SKILL_MAP[r.skill].name} level ${r.level}` };
  if ((r.gold ?? 0) * n > s.gold) return { kind: 'fail', reason: 'Not enough coin' };
  for (const inp of r.inputs) {
    const deficit = inp.n * n - countItem(s, inp.item);
    if (deficit <= 0) continue;
    const name = ITEMS[inp.item]?.name ?? inp.item;
    const chance = (g: (typeof GATHER)[number]) => g.drops.find((d) => d.item === inp.item)?.chance ?? 0;
    const node = GATHER.filter((g) => chance(g) > 0).sort((a, b) => chance(b) - chance(a) || a.level - b.level)[0];
    if (node) {
      if (s.skills[node.skill] < node.level) return { kind: 'fail', reason: `${name} needs ${SKILL_MAP[node.skill].name} level ${node.level}` };
      return { kind: 'gather', id: node.id };
    }
    const maker = RECIPES.filter((x) => x.out.some((o) => o.item === inp.item)).sort((a, b) => a.level - b.level)[0];
    if (maker) {
      const per = maker.out.find((o) => o.item === inp.item)!.n;
      return chainNext(s, maker.id, Math.ceil(deficit / per), depth + 1);
    }
    return { kind: 'fail', reason: `${name} only drops from monsters` };
  }
  return { kind: 'craft', id: r.id };
}

/** What is missing for one craft, e.g. "4 Copper Bar". Empty when everything is in the bag. */
export function missingFor(s: GameState, recipeId: string, n = 1): string {
  const r = RECIPE_MAP[recipeId];
  if (!r) return '';
  const parts: string[] = [];
  for (const inp of r.inputs) {
    const d = inp.n * n - countItem(s, inp.item);
    if (d > 0) parts.push(`${d} ${ITEMS[inp.item]?.name ?? inp.item}`);
  }
  if ((r.gold ?? 0) * n > s.gold) parts.push('coin');
  return parts.join(', ');
}

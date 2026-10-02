import type { GameState, QuestDef, SkillId } from './types';
import { GATHER, MONSTERS, RECIPES, RECIPE_MAP, GATHER_MAP, ITEMS, SKILL_MAP, ZONES } from '@/data';
import { stepDone } from './questSys';
import { countItem, heroDef } from './state';
import { gearTierForLevel } from './balance';
import { GEAR_TYPE_MAP } from '@/data/gear';
import { bossPowerNeeded, partyPower } from './power';

export interface Guide {
  /** What pressing "Go" does. `open` shows the skill page when no single activity fits. */
  kind: 'combat' | 'gather' | 'craft' | 'open';
  id: string;
  skill?: SkillId;
  /** Short hint, e.g. "Mine Copper Outcrop" or "Needs 4 more Copper Ore". */
  label: string;
}

const COMBAT_SKILLS: SkillId[] = ['combat', 'marksmanship', 'arcana', 'fortitude'];

/** A skill is too low for the step: point at the best way to train it, labelled with the level that is needed. */
function train(s: GameState, skill: SkillId, need: number): Guide {
  const g = guideSkill(s, skill);
  return { ...g, label: `Reach ${SKILL_MAP[skill].name} ${need} first: ${g.label.charAt(0).toLowerCase()}${g.label.slice(1)}` };
}

/** The strongest zone the party may enter right now. */
const bestZone = (s: GameState) => {
  let best = 1;
  for (const z of ZONES) if (z.id <= s.zoneUnlocked && z.reqExploration <= s.skills.exploration) best = z.id;
  return best;
};

/** Fight in `zone`, or point at Exploration training when the zone is not reachable yet. */
function fight(s: GameState, zone: number, label: string): Guide {
  const z = ZONES.find((x) => x.id === zone);
  if (z && s.skills.exploration < z.reqExploration) return train(s, 'exploration', z.reqExploration);
  return { kind: 'combat', id: `zone:${zone}`, label };
}

/** The cheapest way to obtain `n` of an item: a gather node, or a recipe whose inputs are covered (recursing into missing inputs). */
function guideItem(s: GameState, item: string, depth = 0): Guide | null {
  const name = ITEMS[item]?.name ?? item;
  const chance = (g: (typeof GATHER)[number]) => g.drops.find((d) => d.item === item)?.chance ?? 0;
  const node = GATHER.filter((g) => chance(g) > 0).sort((a, b) => chance(b) - chance(a) || a.level - b.level)[0];
  if (node) {
    return s.skills[node.skill] >= node.level
      ? { kind: 'gather', id: node.id, label: `Gather ${node.name} for ${name}` }
      : train(s, node.skill, node.level);
  }
  const dropper = Object.values(MONSTERS).filter((m) => !m.boss && m.drops.some((d) => d.item === item)).sort((a, b) => a.zone - b.zone)[0];
  if (dropper) return fight(s, dropper.zone, `Fight ${dropper.name} for ${name}`);
  if (depth > 4) return null;
  const rec = RECIPES.filter((r) => r.out.some((o) => o.item === item)).sort((a, b) => a.level - b.level)[0];
  if (!rec) return null;
  return guideRecipe(s, rec.id, depth + 1);
}

function guideRecipe(s: GameState, id: string, depth = 0): Guide | null {
  const r = RECIPE_MAP[id];
  if (!r) return null;
  if (s.skills[r.skill] < r.level) return train(s, r.skill, r.level);
  for (const inp of r.inputs) {
    const have = countItem(s, inp.item);
    if (have < inp.n) return guideItem(s, inp.item, depth) ?? { kind: 'open', id: r.skill, skill: r.skill, label: `Open ${r.skill}` };
  }
  if ((r.gold ?? 0) > s.gold) return { ...fight(s, bestZone(s), 'Earn silver'), label: `Earn more coin to craft ${r.name}: fight in your best zone` };
  return s.skills[r.skill] >= r.level
    ? { kind: 'craft', id: r.id, label: `Craft ${r.name}` }
    : train(s, r.skill, r.level);
}

const WEAPON_KEY = { melee: 'sword', ranged: 'bow', magic: 'staff' } as const;
const ARMOR_KEYS = ['cuirass', 'greaves', 'helm', 'boots', 'gloves', 'shield', 'amulet', 'ring'];

/** The gear piece that lags furthest behind what the zone calls for, and a way to craft it. */
function upgradeGuide(s: GameState, zone: number): Guide | null {
  const z = ZONES.find((x) => x.id === zone);
  if (!z) return null;
  const target = gearTierForLevel(Math.round((z.levelRange[0] + z.levelRange[1]) / 2));
  const bagBest = (key: string) => s.gear.reduce((t, g) => (g.id.startsWith(`eq_${key}_`) ? Math.max(t, ITEMS[g.id]?.tier ?? 0) : t), 0);
  let pick: { key: string; tier: number } | null = null;
  s.heroes.forEach((h, i) => {
    const style = heroDef(s, i).style;
    const keys = [WEAPON_KEY[style], style === 'magic' ? 'orb' : 'shield', ...ARMOR_KEYS.filter((k) => k !== 'shield')];
    for (const key of keys) {
      const slot = GEAR_TYPE_MAP[key].slot;
      const have = Math.max(h.equip[slot] ? ITEMS[h.equip[slot]!.id]?.tier ?? 0 : 0, bagBest(key));
      if (have < target - 1 && (!pick || have < pick.tier)) pick = { key, tier: have };
    }
  });
  const want = pick as { key: string; tier: number } | null;
  if (!want) return null;
  // Craft the best tier the smith can already make, rather than a tier far out of reach.
  let t = target;
  const skill = GEAR_TYPE_MAP[want.key].skill;
  while (t > want.tier + 1 && (RECIPE_MAP[`craft_${want.key}_${t}`]?.level ?? 0) > s.skills[skill]) t--;
  if ((RECIPE_MAP[`craft_${want.key}_${t}`]?.level ?? 0) > s.skills[skill]) return null;
  const g = guideRecipe(s, `craft_${want.key}_${t}`);
  return g && g.kind !== 'open' ? { ...g, label: `Upgrade gear: ${g.label}` } : null;
}

/** Boss fights burn through food; when the party is short, point at the best fish the player can already catch and grill. */
function foodGuide(s: GameState): Guide | null {
  let stock = 0;
  for (const id in s.stacks) if (ITEMS[id]?.kind === 'food') stock += s.stacks[id];
  // Start restocking below 25 and keep going until 40, so the player is not bounced between fighting and cooking.
  const restocking = s.activity?.type === 'craft' ? s.activity.id.startsWith('grill_') : s.activity?.type === 'gather' && s.activity.id.startsWith('fish_');
  if (stock >= (restocking ? 40 : 25)) return null;
  const rec = RECIPES.filter((r) => r.skill === 'cooking' && r.id.startsWith('grill_') && r.level <= s.skills.cooking)
    .sort((a, b) => b.level - a.level)
    .find((r) => {
      const node = GATHER.find((g) => g.drops.some((d) => d.item === r.inputs[0].item && d.chance >= 0.5));
      return !!node && s.skills[node.skill] >= node.level;
    });
  if (!rec) return null;
  const fish = rec.inputs[0].item;
  if (countItem(s, fish) >= 10) return { kind: 'craft', id: rec.id, label: `Stock up on food first: ${rec.name}` };
  const node = GATHER.find((g) => g.drops.some((d) => d.item === fish && d.chance >= 0.5))!;
  return { kind: 'gather', id: node.id, label: `Stock up on food first: catch fish at ${node.name}` };
}

function guideSkill(s: GameState, skill: SkillId): Guide {
  if (COMBAT_SKILLS.includes(skill)) return fight(s, bestZone(s), 'Fight in your best zone');
  const node = GATHER.filter((g) => g.skill === skill && g.level <= s.skills[skill] && (skill !== 'exploration' || Number(g.id.split('_')[1]) <= s.zoneUnlocked)).sort((a, b) => b.level - a.level)[0];
  if (node) return { kind: 'gather', id: node.id, label: `Train with ${node.name}` };
  const usable = RECIPES.filter((r) => r.skill === skill && r.level <= s.skills[skill]).sort((a, b) => b.level - a.level);
  const rec = usable.find((r) => r.inputs.every((i) => countItem(s, i.item) >= i.n) && (r.gold ?? 0) <= s.gold);
  if (rec) return { kind: 'craft', id: rec.id, label: `Train with ${rec.name}` };
  // Nothing affordable: head for the ingredients of the cheapest recipe.
  const cheapest = usable[usable.length - 1];
  const need = cheapest && guideRecipe(s, cheapest.id);
  if (need && need.kind !== 'open') return { ...need, label: `${need.label} (for ${cheapest.name})` };
  return { kind: 'open', id: skill, skill, label: `Open ${skill}` };
}

/** What the player should do next for step `i` of quest `q`, or null when the step is already done. */
export function guideFor(s: GameState, q: QuestDef, i: number): Guide | null {
  if (stepDone(s, q, i)) return null;
  const st = q.steps[i];
  switch (st.type) {
    case 'killAny': return fight(s, Number(st.target), `Fight in ${ZONES.find((z) => z.id === Number(st.target))?.name ?? 'the zone'}`);
    case 'kill': {
      const m = MONSTERS[st.target ?? ''];
      return m ? fight(s, m.zone, `Hunt ${m.name}`) : null;
    }
    case 'boss': {
      const m = MONSTERS[st.target ?? ''];
      if (!m) return null;
      const g = fight(s, m.zone, `Challenge ${m.name}`);
      if (g.kind !== 'combat') return g;
      const have = partyPower(s, m.zone);
      const need = bossPowerNeeded(m.zone);
      if (have < need) {
        const up = upgradeGuide(s, m.zone);
        if (up) return up;
        // Farm the toughest zone the party handles comfortably, so food and health last.
        let farm = 1;
        for (const z of ZONES) if (z.id <= m.zone && z.reqExploration <= s.skills.exploration && partyPower(s, z.id) >= 0.95) farm = z.id;
        const name = ZONES.find((z) => z.id === farm)?.name ?? 'an easier zone';
        return { kind: 'combat', id: `zone:${farm}`, label: `Grow stronger first (power ${Math.round(have * 100)}%, need ${Math.round(need * 100)}%): fight in ${name} for gear and levels, then Auto-equip` };
      }
      return foodGuide(s) ?? { ...g, id: m.id };
    }
    case 'gather': {
      if (GATHER_MAP[st.target ?? '']) {
        const g = GATHER_MAP[st.target!];
        return s.skills[g.skill] >= g.level
          ? { kind: 'gather', id: g.id, label: `Gather ${g.name}` }
          : train(s, g.skill, g.level);
      }
      return guideItem(s, st.target ?? '');
    }
    case 'craft': return guideRecipe(s, st.target ?? '');
    case 'own': return guideItem(s, st.target ?? '');
    case 'skill': return guideSkill(s, st.target as SkillId);
    case 'heroLevel': case 'gold': case 'zone': return fight(s, bestZone(s), 'Fight in your best zone');
    default: return null;
  }
}

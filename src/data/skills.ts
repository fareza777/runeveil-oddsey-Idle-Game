import type { SkillId, StatKey } from '@/core/types';

export interface SkillDef {
  id: SkillId;
  name: string;
  group: 'Combat' | 'Gathering' | 'Crafting' | 'Support';
  color: string;
  icon: string;
  desc: string;
  feeds: string;
  passive: { stat: StatKey | 'gold' | 'xp' | 'speed' | 'rarity'; per10: number; text: string };
}

export const MAX_LEVEL = 99;

export const SKILLS: SkillDef[] = [
  { id: 'combat', name: 'Combat', group: 'Combat', color: '#e5614f', icon: 'item_sword_3', desc: 'Raw melee mastery. Trained by Kaelen in battle.', feeds: 'Boosts melee damage for every hero.', passive: { stat: 'atk', per10: 1.5, text: '+1.5% party attack' } },
  { id: 'fortitude', name: 'Fortitude', group: 'Combat', color: '#c9a35a', icon: 'relic_iron_skin', desc: 'Endurance earned by weathering blows.', feeds: 'Raises max HP and healing taken.', passive: { stat: 'hp', per10: 2, text: '+2% party max HP' } },
  { id: 'marksmanship', name: 'Marksmanship', group: 'Combat', color: '#7fc46a', icon: 'relic_eagle_eye', desc: 'Precision with bow and thrown weapons.', feeds: 'Boosts ranged damage and crit chance.', passive: { stat: 'crit', per10: 0.6, text: '+0.6% crit chance' } },
  { id: 'arcana', name: 'Arcana', group: 'Combat', color: '#9a7cf0', icon: 'relic_wild_magic', desc: 'Spellcraft and the study of the Veil.', feeds: 'Boosts magic damage and healing.', passive: { stat: 'res', per10: 0.8, text: '+0.8% elemental resist' } },

  { id: 'mining', name: 'Mining', group: 'Gathering', color: '#b9b5c8', icon: 'mat_iron_ore', desc: 'Break rock for ore and stone.', feeds: 'Ore feeds Smithing and Jewelcrafting.', passive: { stat: 'def', per10: 1.2, text: '+1.2% party defense' } },
  { id: 'woodcutting', name: 'Woodcutting', group: 'Gathering', color: '#9b7a4a', icon: 'item_axe_2', desc: 'Fell ancient trees for timber.', feeds: 'Logs feed Carpentry and Runecrafting.', passive: { stat: 'haste', per10: 0.5, text: '+0.5% attack speed' } },
  { id: 'fishing', name: 'Fishing', group: 'Gathering', color: '#4fa8d8', icon: 'elixir_blue', desc: 'Cast lines in rivers, lakes, and the deep.', feeds: 'Fish feed Cooking and Alchemy.', passive: { stat: 'regen', per10: 0.6, text: '+0.6 HP regen per second' } },
  { id: 'herbalism', name: 'Herbalism', group: 'Gathering', color: '#5fc27a', icon: 'mat_moonpetal', desc: 'Pick herbs and rare blooms.', feeds: 'Herbs feed Alchemy and Cooking.', passive: { stat: 'regen', per10: 0.4, text: '+0.4 HP regen per second' } },
  { id: 'farming', name: 'Farming', group: 'Gathering', color: '#d6b84a', icon: 'mat_sunroot', desc: 'Tend fields and orchards.', feeds: 'Crops feed Cooking and Alchemy.', passive: { stat: 'hp', per10: 1, text: '+1% party max HP' } },
  { id: 'hunting', name: 'Hunting', group: 'Gathering', color: '#c47a4f', icon: 'relic_fletching', desc: 'Track beasts for hide, bone, and meat.', feeds: 'Hides feed Leatherworking, meat feeds Cooking.', passive: { stat: 'eva', per10: 0.5, text: '+0.5% evasion' } },
  { id: 'excavation', name: 'Excavation', group: 'Gathering', color: '#d8a15a', icon: 'relic_meteor_map', desc: 'Dig ruins for gems, fossils, and relics.', feeds: 'Gems feed Jewelcrafting, relics feed Enchanting.', passive: { stat: 'luck', per10: 1.2, text: '+1.2% loot luck' } },

  { id: 'smithing', name: 'Smithing', group: 'Crafting', color: '#f09a4a', icon: 'item_hammer_3', desc: 'Smelt bars and forge weapons and plate.', feeds: 'Needs ore from Mining. Makes gear for heroes.', passive: { stat: 'atk', per10: 1, text: '+1% party attack' } },
  { id: 'carpentry', name: 'Carpentry', group: 'Crafting', color: '#c08a52', icon: 'item_staff_3', desc: 'Saw planks, carve bows and staves.', feeds: 'Needs logs from Woodcutting.', passive: { stat: 'haste', per10: 0.4, text: '+0.4% attack speed' } },
  { id: 'leatherworking', name: 'Leatherworking', group: 'Crafting', color: '#b5693f', icon: 'item_boots_3', desc: 'Cure hides and stitch gloves and boots.', feeds: 'Needs hides from Hunting.', passive: { stat: 'eva', per10: 0.4, text: '+0.4% evasion' } },
  { id: 'jewelcrafting', name: 'Jewelcrafting', group: 'Crafting', color: '#e57fc9', icon: 'item_ring_4', desc: 'Cut gems, set rings and amulets.', feeds: 'Needs gems from Excavation and bars from Smithing.', passive: { stat: 'critDmg', per10: 1.5, text: '+1.5% crit damage' } },
  { id: 'cooking', name: 'Cooking', group: 'Crafting', color: '#ee8a45', icon: 'relic_herb_pouch', desc: 'Turn catch and crops into healing food.', feeds: 'Needs fish, crops, and meat. Food heals in combat.', passive: { stat: 'leech', per10: 0.3, text: '+0.3% life leech' } },
  { id: 'alchemy', name: 'Alchemy', group: 'Crafting', color: '#5fd1c6', icon: 'elixir_green', desc: 'Brew potions that buff the party.', feeds: 'Needs herbs and crops. Potions power fights and training.', passive: { stat: 'xp', per10: 1, text: '+1% XP from all skills' } },
  { id: 'enchanting', name: 'Enchanting', group: 'Crafting', color: '#b58cff', icon: 'relic_prism', desc: 'Bind magic into scrolls that upgrade gear.', feeds: 'Needs relics and essence. Upgrades equipment.', passive: { stat: 'rarity', per10: 1, text: '+1% rarity roll strength' } },
  { id: 'runecrafting', name: 'Runecrafting', group: 'Crafting', color: '#6fb5ff', icon: 'talent_might', desc: 'Carve runes that grant elemental power.', feeds: 'Needs logs, relics, and stone. Runes sit in the rune slot.', passive: { stat: 'res', per10: 0.5, text: '+0.5% elemental resist' } },

  { id: 'exploration', name: 'Exploration', group: 'Support', color: '#58c4a5', icon: 'ui_icon_map', desc: 'Scout the Veil for new zones and secrets.', feeds: 'Unlocks zones and speeds up all activities.', passive: { stat: 'speed', per10: 0.8, text: '-0.8% activity time' } },
  { id: 'trading', name: 'Trading', group: 'Support', color: '#f2cf5a', icon: 'relic_coin_purse', desc: 'Haggle, run caravans, and read the market.', feeds: 'Raises sell prices and gold drops.', passive: { stat: 'gold', per10: 2, text: '+2% gold gain' } },
];

export const SKILL_MAP: Record<SkillId, SkillDef> = Object.fromEntries(SKILLS.map((s) => [s.id, s])) as Record<SkillId, SkillDef>;
export const SKILL_IDS = SKILLS.map((s) => s.id);
export const GROUPS: SkillDef['group'][] = ['Combat', 'Gathering', 'Crafting', 'Support'];

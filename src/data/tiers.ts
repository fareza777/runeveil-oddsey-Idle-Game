/** Name tables that drive generated content. Add a row here and every generator picks it up. */

export const GEAR_TIERS = 20;
export const RES_TIERS = 12;

export const METALS = ['Copper', 'Iron', 'Steel', 'Silver', 'Cobalt', 'Mithril', 'Adamant', 'Orichalcum', 'Starsteel', 'Voidglass', 'Aetherium', 'Runic'];
export const METAL_COLORS = ['#c87a45', '#8e94a8', '#aab4c8', '#dfe6f2', '#3f7fd0', '#6fe0d2', '#4fbf6a', '#f0a64a', '#7a8cff', '#9a5cf0', '#7affef', '#ff7ae0'];
export const WOODS = ['Pine', 'Oak', 'Birch', 'Maple', 'Yew', 'Ash', 'Ironwood', 'Redwood', 'Moonwood', 'Shadowbark', 'Crystalwood', 'Worldroot'];
export const WOOD_COLORS = ['#c9a56a', '#a9763e', '#e0d2b0', '#c9703a', '#8a5a34', '#b8a58a', '#5a4a42', '#a8402e', '#b7c4ff', '#4a3a5a', '#9fe8ff', '#5fc27a'];
export const HIDES = ['Rabbit', 'Wolf', 'Boar', 'Bear', 'Panther', 'Wyvern', 'Basilisk', 'Mammoth', 'Direwolf', 'Shadowcat', 'Dragon', 'Primeval'];
export const HIDE_COLORS = ['#c9b79a', '#8a8a96', '#8a5a3a', '#5a3a2a', '#2a2a3a', '#5fa05a', '#4f8a7a', '#d8c8a8', '#6a6a7a', '#3a2a5a', '#c04a3a', '#d8a85a'];

export const GEMS = ['Quartz', 'Garnet', 'Amber', 'Topaz', 'Jade', 'Amethyst', 'Aquamarine', 'Sapphire', 'Emerald', 'Ruby', 'Opal', 'Diamond', 'Onyx', 'Moonstone', 'Sunstone', 'Starshard'];
export const GEM_COLORS = ['#e8e4f0', '#c0304a', '#f0a830', '#ffd04a', '#4fc07a', '#a064e0', '#58d0e8', '#3a6fe0', '#2fd070', '#e02f4f', '#f0c8ff', '#dff8ff', '#3a3a4a', '#b7c4ff', '#ffb04a', '#ffe8a0'];

/** Gear tier -> metal word (20). */
export const GEAR_WORDS = [
  'Copper', 'Bronze', 'Iron', 'Steel', 'Tempered Steel', 'Silver', 'Cobalt', 'Mithril', 'Gilded Mithril', 'Adamant',
  'Orichalcum', 'Sunforged', 'Starsteel', 'Moonsilver', 'Voidglass', 'Dragonbone', 'Aetherium', 'Celestine', 'Runic', 'Eternium',
];
export const GEAR_COLORS = [
  '#c87a45', '#b08a4a', '#8e94a8', '#aab4c8', '#c0d0e8', '#dfe6f2', '#3f7fd0', '#6fe0d2', '#f0d27a', '#4fbf6a',
  '#f0a64a', '#ffb04a', '#7a8cff', '#b7c4ff', '#9a5cf0', '#e8e0c8', '#7affef', '#ffd8f8', '#ff7ae0', '#fff0a8',
];

export const resTierOf = (gearTier: number): number => Math.floor(((gearTier - 1) * RES_TIERS) / GEAR_TIERS);
export const gemTierOf = (gearTier: number): number => Math.floor(((gearTier - 1) * GEMS.length) / GEAR_TIERS);
export const reqLevelForGear = (t: number): number => Math.min(95, 1 + Math.round((t - 1) * 4.6));
export const reqLevelForRes = (r: number): number => 1 + Math.round(r * 8.2);
export const scaleOf = (t: number): number => Math.pow(1.27, t - 1);

export const FISH = [
  'Minnow', 'Sardine', 'Carp', 'Trout', 'Perch', 'Bass', 'Pike', 'Salmon', 'Catfish', 'Eel',
  'Tuna', 'Swordfish', 'Lobster', 'Manta Ray', 'Reef Shark', 'Moonfin', 'Glowray', 'Voidangler', 'Starwhale', 'Leviathan Eel',
];
export const HERBS = [
  'Meadowleaf', 'Sageroot', 'Dewcap', 'Bloodthistle', 'Frostbell', 'Emberbloom', 'Ghostcap', 'Nightshade',
  'Sunpetal', 'Moonpetal', 'Stormvine', 'Wyrmwort', 'Dreamlily', 'Starfern', 'Voidbloom', 'Phoenix Aster',
];
export const CROPS = [
  'Wheat', 'Carrot', 'Potato', 'Onion', 'Tomato', 'Pumpkin', 'Corn', 'Beetroot',
  'Sunroot', 'Moonmelon', 'Frostberry', 'Emberpepper', 'Goldengrain', 'Starfruit', 'Dreamgourd', 'Voidpepper',
];

export interface FamilyDef { id: string; name: string; sprites: string[]; drops: [string, string]; element: string }
export const FAMILIES: FamilyDef[] = [
  { id: 'slime', name: 'Slime', sprites: ['SlimeA', 'SlimeB', 'SlimeC', 'SlimeD', 'SlimeE', 'SlimeF', 'SlimeG', 'SlimeH'], drops: ['Slime Gel', 'Gooey Core'], element: 'nature' },
  { id: 'slimesword', name: 'Bladeslime', sprites: ['SlimeswordA', 'SlimeswordB', 'SlimeswordC', 'SlimeswordD', 'SlimeswordE', 'SlimeswordF', 'SlimeswordG', 'SlimeswordH'], drops: ['Jelly Shard', 'Quicksilver Gel'], element: 'physical' },
  { id: 'mushroom', name: 'Fungus', sprites: ['MushroomA', 'MushroomB', 'MushroomC'], drops: ['Mushroom Cap', 'Spore Sac'], element: 'nature' },
  { id: 'wasp', name: 'Wasp', sprites: ['WaspA', 'WaspB', 'WaspC'], drops: ['Wasp Stinger', 'Royal Jelly'], element: 'nature' },
  { id: 'scorpion', name: 'Scorpion', sprites: ['ScorpionA', 'ScorpionB', 'ScorpionC'], drops: ['Chitin Shard', 'Venom Sac'], element: 'nature' },
  { id: 'worm', name: 'Worm', sprites: ['WormA', 'WormB', 'WormC'], drops: ['Worm Silk', 'Burrow Ichor'], element: 'physical' },
  { id: 'skeleton', name: 'Skeleton', sprites: ['SkeletonA', 'SkeletonB', 'SkeletonC'], drops: ['Bone Dust', 'Grave Coin'], element: 'shadow' },
  { id: 'skelwar', name: 'Bone Warrior', sprites: ['SkeletonwarriorA', 'SkeletonwarriorB', 'SkeletonwarriorC'], drops: ['Rusted Blade Chip', 'Soldier Tag'], element: 'physical' },
  { id: 'zombie', name: 'Ghoul', sprites: ['ZombiA', 'ZombiB', 'ZombiC', 'ZombiD'], drops: ['Grave Moss', 'Rotten Cloth'], element: 'shadow' },
  { id: 'ghost', name: 'Wraith', sprites: ['GhostA', 'GhostB', 'GhostC', 'GhostD'], drops: ['Ectoplasm', 'Wraith Silk'], element: 'shadow' },
  { id: 'lamia', name: 'Lamia', sprites: ['LamiaA', 'LamiaB', 'LamiaC'], drops: ['Lamia Scale', 'Serpent Fang'], element: 'nature' },
  { id: 'succubus', name: 'Succubus', sprites: ['SuccubusA', 'SuccubusB'], drops: ['Dusk Feather', 'Charm Dust'], element: 'shadow' },
  { id: 'genie', name: 'Djinn', sprites: ['GeniusA', 'GeniusB'], drops: ['Djinn Ash', 'Wish Shard'], element: 'arcane' },
  { id: 'minotaur', name: 'Minotaur', sprites: ['MinotaurA', 'MinotaurB'], drops: ['Horn Fragment', 'Titan Sinew'], element: 'physical' },
  { id: 'magus', name: 'Magus', sprites: ['BlackMagusA', 'BlackMagusB'], drops: ['Arcane Dust', 'Void Thread'], element: 'arcane' },
];
export const FAMILY_MAP = Object.fromEntries(FAMILIES.map((f) => [f.id, f]));

export const dropId = (fam: string, i: 0 | 1): string => `drop_${fam}_${i}`;

import type { Element } from '@/core/types';

export interface ZoneSeed {
  name: string;
  key: string;
  desc: string;
  color: string;
  element: Element;
  families: string[];
  prefixes: string[];
  elite: string;
  boss: { name: string; title: string; family: string; lore: string; hue: number; element: Element };
}

export const NOUNS: Record<string, string[]> = {
  slime: ['Slime', 'Ooze', 'Jelly', 'Blob', 'Glob'],
  slimesword: ['Bladeslime', 'Swordjelly', 'Edgeooze', 'Razorblob'],
  mushroom: ['Shroom', 'Fungling', 'Sporecap', 'Toadstool', 'Puffcap'],
  wasp: ['Wasp', 'Hornet', 'Stinger', 'Drone', 'Buzzer'],
  scorpion: ['Scorpion', 'Stingtail', 'Clawer', 'Skitter', 'Pincer'],
  worm: ['Worm', 'Crawler', 'Burrower', 'Maggot', 'Wyrmling'],
  skeleton: ['Skeleton', 'Bonewalker', 'Rattler', 'Marrowman'],
  skelwar: ['Bone Soldier', 'Skeleton Knight', 'Grave Guard', 'Boneblade', 'Deathwatch'],
  zombie: ['Ghoul', 'Shambler', 'Zombie', 'Husk', 'Rotter'],
  ghost: ['Wraith', 'Specter', 'Phantom', 'Haunt', 'Shade'],
  lamia: ['Lamia', 'Serpentess', 'Coilwitch', 'Snakeblade', 'Viper Maiden'],
  succubus: ['Succubus', 'Temptress', 'Nightwing', 'Siren', 'Harpy'],
  genie: ['Djinn', 'Genie', 'Efreet', 'Marid', 'Wish Spirit'],
  minotaur: ['Minotaur', 'Brute', 'Bullguard', 'Warhorn', 'Ogre'],
  magus: ['Magus', 'Warlock', 'Hexer', 'Mystic', 'Sorcerer'],
};

export const ZONE_SEEDS: ZoneSeed[] = [
  {
    name: 'Greenhollow Vale', key: 'greenhollow', color: '#6fd16a', element: 'nature',
    desc: 'A sleepy farming valley where the Veil first thinned. The gentlest creatures here have started to bite.',
    families: ['slime', 'wasp', 'mushroom'],
    prefixes: ['Meadow', 'Clover', 'Dew', 'Barley', 'Thistle', 'Brook', 'Daisy', 'Hedge', 'Pasture', 'Bramble', 'Moss', 'Fern', 'Hollow', 'Elder'],
    elite: 'Elder Greenhollow Slime',
    boss: { name: 'Brambleback', title: 'the Gluttonous Slime King', family: 'slime', lore: 'It swallowed a whole orchard, then the orchard keeper. Now it wears the crown of thorns he left behind.', hue: 20, element: 'nature' },
  },
  {
    name: 'Whisperwood', key: 'whisperwood', color: '#4fb88a', element: 'nature',
    desc: 'An ancient forest where the trees murmur. Travelers who answer them are rarely seen again.',
    families: ['wasp', 'mushroom', 'worm', 'slime'],
    prefixes: ['Whisper', 'Bark', 'Glade', 'Twig', 'Mist', 'Canopy', 'Root', 'Lichen', 'Owlwood', 'Thorn', 'Moonleaf', 'Sap', 'Gnarl', 'Ancient'],
    elite: 'Ancient Whisperwood Hornet',
    boss: { name: 'Mistwing', title: 'the Hive Matriarch', family: 'wasp', lore: 'Her hive hums with a song only the forest understands. The song is a warning.', hue: 100, element: 'nature' },
  },
  {
    name: 'Mossback Marsh', key: 'mossback', color: '#8a9a4a', element: 'nature',
    desc: 'A fetid bog of sinking paths. Things that should have rotted away still crawl here.',
    families: ['worm', 'zombie', 'slime', 'mushroom'],
    prefixes: ['Bog', 'Reed', 'Mire', 'Peat', 'Fen', 'Sump', 'Lily', 'Leech', 'Slough', 'Gloom', 'Rotten', 'Swamp', 'Murk', 'Grand'],
    elite: 'Grand Mossback Crawler',
    boss: { name: 'Mawgrim', title: 'the Bog Tyrant', family: 'worm', lore: 'It is said Mawgrim is the marsh. Burn a patch of it and the rest remembers.', hue: 60, element: 'nature' },
  },
  {
    name: 'Ironcrest Foothills', key: 'ironcrest', color: '#a8a8b8', element: 'physical',
    desc: 'Rocky slopes dotted with abandoned watchposts. Hill brutes now claim every ledge.',
    families: ['minotaur', 'skelwar', 'scorpion', 'zombie'],
    prefixes: ['Crag', 'Flint', 'Ridge', 'Cairn', 'Rubble', 'Granite', 'Scree', 'Boulder', 'Slate', 'Cliff', 'Watch', 'Pike', 'Anvil', 'Warlord'],
    elite: 'Warlord Ironcrest Brute',
    boss: { name: 'Grakk Ironhorn', title: 'Warden of the Pass', family: 'minotaur', lore: 'He guarded the old pass for a king long dead. Orders, once given, are never withdrawn.', hue: 200, element: 'physical' },
  },
  {
    name: 'Sunscar Dunes', key: 'sunscar', color: '#f0c060', element: 'fire',
    desc: 'A burning ocean of sand. Wind exposes ruins that remember a kinder sun.',
    families: ['scorpion', 'genie', 'lamia', 'worm'],
    prefixes: ['Dune', 'Scorch', 'Mirage', 'Dust', 'Sirocco', 'Gilt', 'Parched', 'Cactus', 'Ember', 'Glaring', 'Oasis', 'Basalt', 'Sandstorm', 'Sultan'],
    elite: 'Sultan Sunscar Stingtail',
    boss: { name: 'Zahkira', title: 'the Sandsong Queen', family: 'scorpion', lore: 'Her claws sing as they close. Caravan masters pay her tribute in silence.', hue: 40, element: 'fire' },
  },
  {
    name: 'Gloamroot Caverns', key: 'gloamroot', color: '#8a6af0', element: 'shadow',
    desc: 'Lightless caves threaded with glowing roots. The roots pulse in time with something breathing.',
    families: ['mushroom', 'ghost', 'worm', 'skeleton'],
    prefixes: ['Gloam', 'Lumen', 'Spore', 'Dank', 'Cavern', 'Pallid', 'Glimmer', 'Stalactite', 'Hushed', 'Echo', 'Nether', 'Blight', 'Dread', 'Deep'],
    elite: 'Deep Gloamroot Sporecap',
    boss: { name: 'Myconis', title: 'the Sporelord', family: 'mushroom', lore: 'Under the caverns a single mind spreads through every mushroom. Myconis is merely the loudest thought.', hue: 270, element: 'shadow' },
  },
  {
    name: 'Brinewatch Coast', key: 'brinewatch', color: '#4fa8d8', element: 'frost',
    desc: 'Wreck-strewn cliffs and salt-bitten lighthouses. The tide leaves strange things behind.',
    families: ['skelwar', 'scorpion', 'zombie', 'ghost'],
    prefixes: ['Brine', 'Tide', 'Wreck', 'Kelp', 'Barnacle', 'Gull', 'Spray', 'Reef', 'Anchor', 'Drift', 'Squall', 'Salt', 'Harbor', 'Admiral'],
    elite: 'Admiral Brinewatch Guard',
    boss: { name: 'Captain Saltbone', title: 'Dread Admiral of the Drowned Fleet', family: 'skelwar', lore: 'His fleet sank a century ago. He has been trying to take the harbor back every night since.', hue: 190, element: 'frost' },
  },
  {
    name: 'Frostmere Tundra', key: 'frostmere', color: '#a9e8ff', element: 'frost',
    desc: 'A white wasteland of howling wind. Even the dead are slow to move here.',
    families: ['ghost', 'minotaur', 'slimesword', 'zombie'],
    prefixes: ['Frost', 'Rime', 'Snow', 'Icicle', 'Blizzard', 'Glacial', 'Hail', 'Permafrost', 'Floe', 'Sleet', 'Frozen', 'Bitter', 'Winter', 'Jarl'],
    elite: 'Jarl Frostmere Brute',
    boss: { name: 'Hrimwyn', title: 'the Rimewraith Queen', family: 'ghost', lore: 'Hrimwyn never died. She simply stopped, and the winter rushed in to fill the space.', hue: 180, element: 'frost' },
  },
  {
    name: 'Cinderpeak Caldera', key: 'cinderpeak', color: '#ff7a3a', element: 'fire',
    desc: 'A living volcano wreathed in smoke. Fire-spirits tend the vents like an army tends a wall.',
    families: ['genie', 'minotaur', 'slimesword', 'scorpion'],
    prefixes: ['Cinder', 'Magma', 'Ash', 'Slag', 'Pyre', 'Soot', 'Obsidian', 'Fumarole', 'Smolder', 'Lava', 'Furnace', 'Char', 'Blaze', 'Pyroclast'],
    elite: 'Pyroclast Cinderpeak Efreet',
    boss: { name: 'Pyrrhax', title: 'the Cinder Djinn', family: 'genie', lore: 'Granted a thousand wishes, Pyrrhax burned each one down to see what remained.', hue: 330, element: 'fire' },
  },
  {
    name: 'Sunken Crypts of Vael', key: 'vael', color: '#7a8aa8', element: 'shadow',
    desc: 'A drowned necropolis beneath the old kingdom. Every sarcophagus lid has been slid aside from within.',
    families: ['skeleton', 'skelwar', 'ghost', 'zombie'],
    prefixes: ['Crypt', 'Tomb', 'Ossuary', 'Sepulcher', 'Burial', 'Catacomb', 'Dirge', 'Vigil', 'Mournful', 'Shroud', 'Vault', 'Funeral', 'Lich', 'Regent'],
    elite: 'Regent Vael Deathwatch',
    boss: { name: 'Warden Vael', title: 'the Lich-Archivist', family: 'magus', lore: 'He catalogs every soul that enters. If your name is not in his ledger yet, he is happy to add it.', hue: 250, element: 'shadow' },
  },
  {
    name: 'Thornveil Jungle', key: 'thornveil', color: '#38c070', element: 'nature',
    desc: 'A steaming jungle of razor vines. Serpents coil in every branch.',
    families: ['lamia', 'wasp', 'slime', 'mushroom'],
    prefixes: ['Thorn', 'Viper', 'Liana', 'Orchid', 'Canopy', 'Venom', 'Mangrove', 'Tendril', 'Hydra', 'Spore', 'Fang', 'Emerald', 'Tangle', 'Empress'],
    elite: 'Empress Thornveil Viper',
    boss: { name: 'Ssaleth', title: 'the Serpent Empress', family: 'lamia', lore: 'Her court of coils spans the jungle. Those who bow are spared. Those who do not are decorative.', hue: 140, element: 'nature' },
  },
  {
    name: 'Crystalline Depths', key: 'crystalline', color: '#6fd0ff', element: 'arcane',
    desc: 'A cavern city of living crystal. Every facet reflects something that is not you.',
    families: ['slimesword', 'magus', 'genie', 'minotaur'],
    prefixes: ['Crystal', 'Prism', 'Facet', 'Shard', 'Geode', 'Quartz', 'Refract', 'Gleam', 'Lattice', 'Resonant', 'Glass', 'Sparkling', 'Diamond', 'Matrix'],
    elite: 'Matrix Crystalline Hexer',
    boss: { name: 'Voruun', title: 'Heart of the Geode', family: 'minotaur', lore: 'The crystals grew around Voruun, and then through him. He hums the last note of an old song.', hue: 190, element: 'arcane' },
  },
  {
    name: 'Stormspire Heights', key: 'stormspire', color: '#ffe27a', element: 'shock',
    desc: 'Mountain peaks crowned by perpetual lightning. The wind carries voices and sometimes teeth.',
    families: ['succubus', 'genie', 'wasp', 'ghost'],
    prefixes: ['Storm', 'Thunder', 'Gale', 'Volt', 'Cirrus', 'Bolt', 'Zephyr', 'Tempest', 'Arcing', 'Crackle', 'Skyward', 'Squall', 'Aerie', 'Stormcaller'],
    elite: 'Stormcaller Heights Siren',
    boss: { name: 'Zaraka', title: 'the Tempest Matron', family: 'succubus', lore: 'She rides the thunderheads like horses. The mountains rearrange themselves to avoid her.', hue: 50, element: 'shock' },
  },
  {
    name: 'Ashen Wastes', key: 'ashen', color: '#9a8a82', element: 'fire',
    desc: 'The burnt remains of a great war. The ash never settles, and the dead never stay down.',
    families: ['skelwar', 'zombie', 'skeleton', 'minotaur'],
    prefixes: ['Ash', 'Charred', 'Ruin', 'Scorched', 'Singed', 'Embertide', 'Burnt', 'Gray', 'Siege', 'Banner', 'Vanguard', 'Remnant', 'Legion', 'Marshal'],
    elite: 'Marshal Ashen Grave Guard',
    boss: { name: 'The Ashen Marshal', title: 'Last General of the Burnt Host', family: 'skelwar', lore: 'He lost every battle and every soldier, but he still holds the field. Nobody has told him the war ended.', hue: 20, element: 'fire' },
  },
  {
    name: 'Moonlit Bastion', key: 'moonlit', color: '#b7c4ff', element: 'shadow',
    desc: 'A haunted fortress under a permanent half-moon. Its portraits watch you as you pass.',
    families: ['succubus', 'ghost', 'skeleton', 'magus'],
    prefixes: ['Moon', 'Lunar', 'Gothic', 'Ivory', 'Velvet', 'Night', 'Gargoyle', 'Chandelier', 'Mourning', 'Candle', 'Silver', 'Crimson', 'Nocturne', 'Baron'],
    elite: 'Baron Moonlit Nightwing',
    boss: { name: 'Count Mordrake', title: 'Lord of the Midnight Court', family: 'succubus', lore: 'The Count throws a ball every night. The guests are not invited, and they never leave.', hue: 280, element: 'shadow' },
  },
  {
    name: 'Dreamreach Glade', key: 'dreamreach', color: '#e29aff', element: 'arcane',
    desc: 'A forest that exists half in dreams. The shapes between the trees change if you look away.',
    families: ['lamia', 'succubus', 'mushroom', 'wasp'],
    prefixes: ['Dream', 'Lullaby', 'Fey', 'Twilight', 'Gossamer', 'Pixie', 'Murmuring', 'Mirror', 'Blossom', 'Reverie', 'Slumber', 'Glimmer', 'Wisp', 'Sovereign'],
    elite: 'Sovereign Dreamreach Siren',
    boss: { name: 'Titania Thornshade', title: 'Queen of the Waking Dream', family: 'lamia', lore: 'She rules every dream in the glade and, increasingly, the waking world around it.', hue: 300, element: 'arcane' },
  },
  {
    name: 'Obsidian Reaches', key: 'obsidian', color: '#5a4a7a', element: 'shadow',
    desc: 'Black glass plains shaped by an ancient cataclysm. The reflections do not match the sky.',
    families: ['minotaur', 'magus', 'slimesword', 'genie'],
    prefixes: ['Obsidian', 'Onyx', 'Voidglass', 'Jet', 'Umbral', 'Razor', 'Shatter', 'Dusk', 'Midnight', 'Basalt', 'Eclipse', 'Gloaming', 'Dread', 'Warlord'],
    elite: 'Warlord Obsidian Warhorn',
    boss: { name: 'Karn', title: 'the Obsidian Warlord', family: 'minotaur', lore: 'He forged his army out of the glass left by the cataclysm. Each soldier carries a piece of his reflection.', hue: 270, element: 'shadow' },
  },
  {
    name: 'Gilded Ruins of Aurum', key: 'aurum', color: '#f5c542', element: 'holy',
    desc: 'The collapsed capital of a golden empire. Its guardians still polish their armor.',
    families: ['skelwar', 'genie', 'minotaur', 'lamia'],
    prefixes: ['Gilded', 'Aurum', 'Gold', 'Regal', 'Imperial', 'Laurel', 'Trophy', 'Marble', 'Ducal', 'Opulent', 'Radiant', 'Sovereign', 'Tribute', 'Emperor'],
    elite: 'Emperor Aurum Deathwatch',
    boss: { name: 'Aurum', title: 'the Gilded King', family: 'skelwar', lore: 'He turned his whole kingdom to gold, then his subjects, then himself. He is very, very lonely.', hue: 45, element: 'holy' },
  },
  {
    name: 'Voidtouched Rift', key: 'voidrift', color: '#b04aff', element: 'arcane',
    desc: 'A wound in reality. Shapes unlearn their names the closer you walk.',
    families: ['worm', 'magus', 'ghost', 'slimesword'],
    prefixes: ['Void', 'Rift', 'Null', 'Aberrant', 'Warped', 'Stellar', 'Eldritch', 'Hollow', 'Unmade', 'Twisted', 'Fractal', 'Nameless', 'Entropic', 'Voidlord'],
    elite: 'Voidlord Rift Burrower',
    boss: { name: "Xyr'Kath", title: 'the Maw Between Stars', family: 'worm', lore: "It does not hunt. It is simply where things go when they stop being somewhere else.", hue: 280, element: 'arcane' },
  },
  {
    name: 'Celestial Spire', key: 'celestial', color: '#fff3a8', element: 'holy',
    desc: 'A tower rising out of the clouds. Its guardians keep one last promise they cannot recall.',
    families: ['genie', 'magus', 'succubus', 'skelwar'],
    prefixes: ['Celestial', 'Halo', 'Seraph', 'Solar', 'Aurora', 'Zenith', 'Hymn', 'Luminous', 'Dawnlit', 'Beacon', 'Ascendant', 'Starlit', 'Divine', 'Archon'],
    elite: 'Archon Celestial Efreet',
    boss: { name: 'Seraphex', title: 'Last Warden of the Spire', family: 'genie', lore: 'Seraphex was told to guard the stairway until relieved. The relief never came.', hue: 55, element: 'holy' },
  },
  {
    name: 'The Abyssal Maw', key: 'abyssal', color: '#2f6fe0', element: 'frost',
    desc: 'An ocean trench so deep the pressure rewrites bone. Things down here predate light.',
    families: ['worm', 'ghost', 'zombie', 'slimesword'],
    prefixes: ['Abyssal', 'Trench', 'Pressure', 'Leviathan', 'Anglerfish', 'Murk', 'Benthic', 'Drowned', 'Tentacle', 'Black', 'Hadal', 'Silent', 'Crushing', 'Kraken'],
    elite: 'Kraken Abyssal Crawler',
    boss: { name: "Nhal'zul", title: 'the Drowned Leviathan', family: 'worm', lore: 'It surfaced once, a thousand years ago. The tide has not gone back out since.', hue: 210, element: 'frost' },
  },
  {
    name: 'Throne of the First Rune', key: 'firstrune', color: '#ff5ae0', element: 'arcane',
    desc: 'Where the first rune was written. Everything here is a sentence, and you are the punctuation.',
    families: ['magus', 'genie', 'minotaur', 'succubus'],
    prefixes: ['Runic', 'Sigil', 'Glyph', 'Primal', 'Eternal', 'Archaic', 'Scribe', 'Aeon', 'Genesis', 'Oracle', 'Rune', 'Ultimate', 'Paragon', 'Herald'],
    elite: 'Herald of the First Rune',
    boss: { name: 'The First Rune', title: 'Aeon Sovereign of the Veil', family: 'magus', lore: 'It is a word older than speech. When it is spoken, the Veil closes, or opens. Nobody agrees which.', hue: 320, element: 'arcane' },
  },
];

export interface WorldBossSeed { name: string; title: string; family: string; lore: string; hue: number; element: Element; zone: number }
export const WORLD_BOSSES: WorldBossSeed[] = [
  { name: 'Ignaroth', title: 'the Infernal Colossus', family: 'minotaur', lore: 'A walking foundry. The calderas cool whenever he leaves them.', hue: 340, element: 'fire', zone: 9 },
  { name: 'Skarn', title: 'the Winter Titan', family: 'minotaur', lore: 'The frozen heart of the old tundra. Snow remembers his footsteps.', hue: 190, element: 'frost', zone: 12 },
  { name: 'Verdantyr', title: 'the Thorn Colossus', family: 'worm', lore: 'The jungle grew a king, and the king grew roots through the world.', hue: 110, element: 'nature', zone: 15 },
  { name: 'Umbraxis', title: 'the Eclipse Devourer', family: 'ghost', lore: 'Where Umbraxis passes, shadows detach and follow him home.', hue: 270, element: 'shadow', zone: 18 },
  { name: 'Voltarion', title: 'the Storm Sovereign', family: 'genie', lore: 'He was a wish made in a thunderhead. He grew impatient.', hue: 55, element: 'shock', zone: 20 },
  { name: 'Lumenar', title: 'the Dawn Reliquary', family: 'magus', lore: 'A guardian built of the first dawn. It remembers every sunrise it has lost.', hue: 45, element: 'holy', zone: 22 },
];

import type { ZoneSeed } from './zoneSeeds';

/**
 * Mythic zones 23-32. Every monster here is level 100; difficulty comes from larger packs, a bigger expected party
 * (six heroes from zone 27, seven from zone 30) and upgraded gear in the reference model.
 */
export const MYTHIC_SEEDS: ZoneSeed[] = [
  {
    name: 'Shattered Firmament', key: 'firmament', color: '#8fb8ff', element: 'arcane',
    desc: 'The sky itself broke here. Islands of cloud drift between jagged shards, each guarded by something that fell with them.',
    families: ['magus', 'ghost', 'genie', 'succubus'],
    prefixes: ['Splintered', 'Skyshard', 'Cloudbreak', 'Gale', 'Zephyr', 'Stratus', 'Aether', 'Drifting', 'Windshear', 'Halcyon', 'Nimbus', 'Contrail', 'Vaulted', 'Firmament'],
    elite: 'Firmament Shardlord Efreet',
    boss: { name: 'Aethrion', title: 'the Sky Unmoored', family: 'genie', lore: 'He was the keeper of the horizon. When it cracked, he decided the sky belonged to nobody.', hue: 205, element: 'arcane' },
  },
  {
    name: 'Cinderglass Sea', key: 'cinderglass', color: '#ff7a3a', element: 'fire',
    desc: 'A sea of molten glass that never cools. Fleets of slag-ships sail it in slow, burning circles.',
    families: ['genie', 'lamia', 'scorpion', 'magus'],
    prefixes: ['Cinderglass', 'Slagtide', 'Molten', 'Glassfire', 'Magma', 'Scald', 'Brimstone', 'Furnace', 'Sootwave', 'Kiln', 'Emberfoam', 'Blazing', 'Ashbrine', 'Tidefire'],
    elite: 'Tidefire Cinderglass Marid',
    boss: { name: 'Pyrelith', title: 'the Molten Tidecaller', family: 'lamia', lore: 'She sings, and the sea answers by boiling. Sailors say the song is a lullaby.', hue: 15, element: 'fire' },
  },
  {
    name: 'Bonewhite Citadel', key: 'bonewhite', color: '#d8d0c0', element: 'shadow',
    desc: 'A fortress built from the bones of an army that never stopped marching. The drums still beat inside.',
    families: ['skelwar', 'skeleton', 'zombie', 'minotaur'],
    prefixes: ['Bonewhite', 'Ossuary', 'Marrow', 'Ribcage', 'Grim', 'Cairn', 'Tombguard', 'Crypt', 'Skullcap', 'Charnel', 'Drumbone', 'Pale', 'Rampart', 'Citadel'],
    elite: 'Citadel Warbone Brute',
    boss: { name: 'Marshal Osseous', title: 'the Unburied Regent', family: 'skelwar', lore: 'He never lost a battle, so he never accepted that the war was over. Neither did his dead.', hue: 40, element: 'shadow' },
  },
  {
    name: 'Verdant Labyrinth', key: 'verdantmaze', color: '#3fc46a', element: 'nature',
    desc: 'Hedge walls taller than towers, rearranging themselves whenever nobody looks. Something gardens the maze.',
    families: ['worm', 'mushroom', 'lamia', 'wasp'],
    prefixes: ['Hedgemaze', 'Verdure', 'Thicket', 'Tangle', 'Briar', 'Labyrinthine', 'Overgrown', 'Creeper', 'Boxwood', 'Garden', 'Sapling', 'Wildgrowth', 'Maze', 'Gardener'],
    elite: 'Gardener of the Verdant Maze',
    boss: { name: 'Mother Thicket', title: 'the Maze That Breathes', family: 'mushroom', lore: 'Every wall is a branch, every path a root. She only wants company, and a little fertilizer.', hue: 120, element: 'nature' },
  },
  {
    name: 'Starless Vault', key: 'starless', color: '#5a3a8a', element: 'shadow',
    desc: 'A sealed treasury where light is the only thing nobody was allowed to bring in.',
    families: ['ghost', 'succubus', 'magus', 'slimesword'],
    prefixes: ['Starless', 'Lightless', 'Umbral', 'Gloaming', 'Nightbound', 'Inkblack', 'Sealed', 'Hushvault', 'Tenebrous', 'Moonless', 'Blackglass', 'Dusken', 'Vigil', 'Vaultkeeper'],
    elite: 'Vaultkeeper Starless Shade',
    boss: { name: 'Nocturne', title: 'the Last Lock', family: 'ghost', lore: 'It guards a door that opens only from the inside. Nobody remembers what was locked in.', hue: 260, element: 'shadow' },
  },
  {
    name: 'Hall of a Thousand Echoes', key: 'echoes', color: '#c07aff', element: 'arcane',
    desc: 'A cathedral of mirrors and voices. Whatever you say here comes back stronger, and wearing teeth.',
    families: ['succubus', 'ghost', 'skelwar', 'magus'],
    prefixes: ['Echoing', 'Resonant', 'Choral', 'Reverb', 'Mirrored', 'Whispering', 'Antiphon', 'Refrain', 'Harmonic', 'Cantor', 'Sonorous', 'Aria', 'Cadence', 'Chorister'],
    elite: 'Chorister of a Thousand Echoes',
    boss: { name: 'Vox Aeterna', title: 'the Voice That Repeats', family: 'succubus', lore: 'She has said one word for a thousand years. It is your name, and she is getting closer to pronouncing it right.', hue: 300, element: 'arcane' },
  },
  {
    name: 'Wyrmgrave Peaks', key: 'wyrmgrave', color: '#9fe0ff', element: 'frost',
    desc: 'Mountains made of dragon-spine and frozen breath. The avalanches here are not natural.',
    families: ['worm', 'minotaur', 'scorpion', 'skelwar'],
    prefixes: ['Wyrmgrave', 'Glacial', 'Rimeborn', 'Icefang', 'Blizzard', 'Permafrost', 'Hoarwind', 'Spineridge', 'Crevasse', 'Snowdrift', 'Frostbitten', 'Tundral', 'Wyrmbone', 'Rimelord'],
    elite: 'Rimelord Wyrmgrave Brute',
    boss: { name: 'Glaciermaw', title: 'the Wyrm Beneath the Snow', family: 'worm', lore: 'It has been asleep so long that the glacier grew over it. It is waking up now, and the glacier is going with it.', hue: 190, element: 'frost' },
  },
  {
    name: 'Crown of Thunder', key: 'thundercrown', color: '#ffe14a', element: 'shock',
    desc: 'The summit where every storm on the continent is born. The air hums, and the ground hums back.',
    families: ['genie', 'magus', 'minotaur', 'wasp'],
    prefixes: ['Thundercrowned', 'Voltaic', 'Stormborn', 'Forked', 'Static', 'Tempest', 'Thunderhead', 'Sparkling', 'Boltforged', 'Galvanic', 'Cloudsplit', 'Ionized', 'Rumbling', 'Stormlord'],
    elite: 'Stormlord Thundercrown Marid',
    boss: { name: 'Tempestus', title: 'the Hundred-Handed Storm', family: 'minotaur', lore: 'He wields a lightning bolt in every hand, and has been waiting for a hundred volunteers.', hue: 55, element: 'shock' },
  },
  {
    name: 'The Hollow Sun', key: 'hollowsun', color: '#ffd27a', element: 'holy',
    desc: 'A dead sun, hollowed out and furnished. Its inhabitants still bow to a light that went out long ago.',
    families: ['genie', 'skelwar', 'succubus', 'magus'],
    prefixes: ['Sunless', 'Hollowed', 'Gilt', 'Solstice', 'Eclipsed', 'Corona', 'Zealous', 'Cinderlit', 'Penitent', 'Vesper', 'Brazen', 'Heliacal', 'Tithe', 'Priest'],
    elite: 'High Priest of the Hollow Sun',
    boss: { name: 'Helion', title: 'the Sun That Forgot to Rise', family: 'genie', lore: 'Helion was the dawn, until he fell asleep on the job. The world has been dim ever since.', hue: 40, element: 'holy' },
  },
  {
    name: 'Edge of Unwriting', key: 'unwriting', color: '#f0f0ff', element: 'arcane',
    desc: 'The last page of the world, where the ink runs thin. Things are erased here, and some do not stay erased.',
    families: ['magus', 'worm', 'ghost', 'slimesword', 'minotaur'],
    prefixes: ['Unwritten', 'Erased', 'Blank', 'Margin', 'Redacted', 'Inkless', 'Palimpsest', 'Struck', 'Smudged', 'Footnote', 'Vellum', 'Errata', 'Colophon', 'Editor'],
    elite: 'Editor of the Last Margin',
    boss: { name: 'The Last Margin', title: 'Eraser of Stories', family: 'magus', lore: 'It was never a monster. It is the end of the page, and it has started to close the book.', hue: 320, element: 'arcane' },
  },
];

// Builds tools/art_jobs_v3.json: portraits for the 10 mythic bosses, 12 unique (daily) enemies, 10 mythic zone backdrops and the wandering merchant.
import fs from 'node:fs';

const bosses = [
  [23, 'a towering sky-genie of cracked blue crystal with floating shards orbiting him, the Sky Unmoored, pale blue and white color theme'],
  [24, 'a lamia queen made of molten glass with a tail of living lava, the Molten Tidecaller, orange and black color theme'],
  [25, 'a skeletal regent in a crown of ribs seated in armor made of fused bones, the Unburied Regent, bone white and violet color theme'],
  [26, 'a colossal walking hedge-maze creature of thorned vines with a glowing mushroom heart, the Maze That Breathes, deep green color theme'],
  [27, 'a faceless ghostly warden holding an enormous black key, the Last Lock, dark purple and silver color theme'],
  [28, 'a siren queen with a mouth of many mirrors, sound waves rippling around her, the Voice That Repeats, magenta and lavender color theme'],
  [29, 'a massive ice wyrm coiled around a mountain peak, frozen breath, the Wyrm Beneath the Snow, icy cyan color theme'],
  [30, 'a giant minotaur with a hundred arms each holding crackling lightning, the Hundred-Handed Storm, electric yellow color theme'],
  [31, 'a hollow golden sun-djinn with a dark empty sun for a chest, the Sun That Forgot to Rise, gold and black color theme'],
  [32, 'a cloaked scribe-sorcerer with a blank white void for a face holding a giant eraser-quill, Eraser of Stories, white and pale violet color theme'],
];
const uniques = [
  [1, 'an ancient bloated marsh worm with moss and old coins growing on its hide, scarred and enormous, mossy green color theme'],
  [2, 'a ghostly lamia queen shimmering like a desert mirage with veils of sand, golden sand color theme'],
  [3, 'an undead sea captain skeleton in a tattered coat with barnacles, holding a rusty cutlass, teal and bone color theme'],
  [4, 'a gigantic burning hound-minotaur with a molten furnace maw, fire orange color theme'],
  [5, 'a venomous snake empress with jeweled hood and dripping fangs, poison green color theme'],
  [6, 'a robed storm sorceress floating within crackling lightning, yellow and blue color theme'],
  [7, 'a pale vampire countess in a dark gown surrounded by bats and veils, crimson and black color theme'],
  [8, 'a knight made of mirror glass reflecting a twin of itself, silver and violet color theme'],
  [9, 'a monstrous eldritch worm tearing out of a rift in reality with many eyes, purple and black color theme'],
  [10, 'a deep sea abomination with glowing lures and tentacles, abyssal blue color theme'],
  [11, 'a crowned genie sovereign of living cinders and obsidian, red and gold color theme'],
  [12, 'an enormous runic specter assembled from glowing glyphs and floating stone words, magenta color theme'],
];
const zones = [
  [23, 'Shattered Firmament: floating cloud islands and jagged shards of broken sky, pale blue'],
  [24, 'Cinderglass Sea: a sea of molten glass with burning slag-ships, orange and black'],
  [25, 'Bonewhite Citadel: a fortress built of bones and ribs under a violet sky'],
  [26, 'Verdant Labyrinth: giant hedge walls and glowing mushrooms, deep green'],
  [27, 'Starless Vault: a sealed dark treasury with faint violet glints, no light'],
  [28, 'Hall of a Thousand Echoes: a cathedral of mirrors and floating sound ripples, magenta'],
  [29, 'Wyrmgrave Peaks: icy mountains made of dragon spines and frozen breath, cyan'],
  [30, 'Crown of Thunder: a storm summit with endless lightning, electric yellow'],
  [31, 'The Hollow Sun: the inside of a dead hollow sun, gilded halls, dim gold'],
  [32, 'Edge of Unwriting: the blank edge of a page where the world dissolves into white ink'],
];
const jobs = [];
for (const [z, p] of bosses) jobs.push({ out: `public/assets/gen/bosses/boss_${z}.png`, model: 'rd-plus', style: 'default', w: 128, h: 128, remove_bg: true, seed: 3000 + z,
  prompt: `fantasy RPG boss monster, ${p}, menacing, full body, front view, centered, dark fantasy pixel art, detailed shading, plain background` });
for (const [n, p] of uniques) jobs.push({ out: `public/assets/gen/bosses/ue_${n}.png`, model: 'rd-plus', style: 'default', w: 128, h: 128, remove_bg: true, seed: 3100 + n,
  prompt: `fantasy RPG named rare elite monster, ${p}, legendary, menacing, full body, front view, centered, dark fantasy pixel art, detailed shading, plain background` });
for (const [z, p] of zones) jobs.push({ out: `public/assets/gen/zones/zone_${z}.png`, model: 'rd-plus', style: 'environment', w: 192, h: 192, seed: 2000 + z,
  prompt: `fantasy RPG battle backdrop, side view landscape, ${p}, empty open ground in the foreground for fighting, no characters, no text, atmospheric depth` });
jobs.push({ out: 'public/assets/gen/art/merchant.png', model: 'rd-plus', style: 'default', w: 128, h: 128, remove_bg: true, seed: 3200,
  prompt: 'fantasy wandering merchant with a huge backpack stacked with lanterns, scrolls and trinkets, hooded, friendly, full body, front view, centered, pixel art, detailed shading, plain background' });
fs.writeFileSync('tools/art_jobs_v3.json', JSON.stringify(jobs, null, 1));
console.log(jobs.length, 'jobs');

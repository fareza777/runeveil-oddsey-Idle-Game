import { writeFileSync } from 'node:fs';
const TYPES = {
  sword: 'a one-handed straight sword with crossguard, blade pointing up diagonally',
  mace: 'a heavy warhammer with a large head and thick handle',
  dagger: 'a short curved dagger with a small guard',
  bow: 'a recurve archery bow with a bowstring',
  staff: 'a tall magic staff topped with a gem or ornament',
  shield: 'a heater shield with a boss in the center',
  orb: 'a floating magical focus orb held in a small ornate cradle',
  helm: 'a knight helmet with a visor',
  cuirass: 'a chest plate armor breastplate with shoulder pauldrons',
  greaves: 'a pair of plate leg armor greaves',
  gloves: 'a pair of armored gauntlets',
  boots: 'a pair of sturdy boots',
  amulet: 'a pendant amulet on a chain with a central gem',
  ring: 'a single ring with a gem setting',
};
const TIERS = [
  ['crude copper', 'plain and simple'], ['bronze', 'plain with small rivets'], ['iron', 'sturdy and unadorned'], ['polished steel', 'clean and well made'],
  ['blued tempered steel', 'refined with fine edges'], ['bright silver', 'with engraved trim'], ['cobalt blue metal', 'sleek with blue sheen'], ['glowing teal mithril', 'elegant and light'],
  ['gilded mithril with gold trim', 'ornate'], ['dark green adamant', 'heavy and imposing'], ['orange-gold orichalcum', 'glowing with warm light'], ['radiant sunforged gold', 'with sun motifs and flames'],
  ['blue-violet starsteel', 'with star motifs and sparkles'], ['pale moonsilver', 'with crescent moon motifs'], ['black and purple voidglass', 'jagged glass shards with void glow'], ['white dragonbone', 'with dragon spikes and fangs'],
  ['cyan aetherium', 'crackling with energy'], ['white-gold celestine', 'with angelic wings and halo light'], ['magenta runic', 'covered in glowing runes'], ['prismatic legendary eternium', 'epic, radiant aura, rainbow glow'],
];
const jobs = [];
const base = { model: 'rd-plus', style: 'default', w: 64, h: 64, remove_bg: true };
for (const [k, d] of Object.entries(TYPES)) TIERS.forEach(([mat, sty], i) => jobs.push({ ...base, out: `public/assets/gen/items/eq_${k}_${i + 1}.png`, seed: 4000 + jobs.length,
  prompt: `fantasy RPG item icon, ${d}, made of ${mat}, ${sty}, single object centered, side view, clean dark outline, detailed pixel art, plain background` }));
const key = [];
const METALS = ['copper', 'iron', 'steel', 'silver', 'cobalt', 'mithril', 'adamant', 'orichalcum', 'starsteel', 'voidglass', 'aetherium', 'runic glowing'];
METALS.forEach((m, i) => { key.push([`ore_${i}`, `a chunk of raw ${m} ore, rocky lump with ${m} veins`]); key.push([`bar_${i}`, `a stacked ${m} metal ingot bar`]); });
const RELICS = ['cracked clay pottery', 'carved stone idol', 'old gold coin hoard in a pile', 'fossilized spiral shell', 'rusted brass compass', 'gilded ceremonial mask', 'ancient engraved stone tablet', 'broken golden crown shard', 'star map engraved metal plate', 'dark void idol statue with purple glow', 'primal carved wooden totem', 'glowing first rune tablet'];
RELICS.forEach((r, i) => key.push([`relic_${i}`, `ancient relic treasure, ${r}`]));
const SC = ['copper', 'silver', 'blue', 'green', 'violet', 'white', 'pink', 'golden'];
SC.forEach((c, i) => key.push([`scroll_${i + 1}`, `a rolled magic scroll with ${c} wax seal and glowing symbols`]));
const GEMS = ['quartz', 'garnet red', 'amber orange', 'topaz yellow', 'jade green', 'amethyst purple', 'aquamarine light blue', 'sapphire blue', 'emerald green', 'ruby red', 'opal iridescent', 'diamond clear white', 'onyx black', 'moonstone pale blue', 'sunstone orange', 'starshard glowing gold'];
GEMS.forEach((g, i) => key.push([`gem_${i}`, `a single cut faceted ${g} gemstone`]));
for (const [id, p] of key) jobs.push({ ...base, out: `public/assets/gen/items/${id}.png`, seed: 5000 + jobs.length, prompt: `fantasy RPG item icon, ${p}, single object centered, clean dark outline, detailed pixel art, plain background` });
writeFileSync('tools/item_jobs.json', JSON.stringify(jobs, null, 1));
writeFileSync('tools/.cache/item_test.json', JSON.stringify([jobs[0], jobs[14], jobs[20 * 7 + 7], jobs[20 * 9 + 4], jobs[280], jobs[280 + 25]], null, 1));
console.log(jobs.length);

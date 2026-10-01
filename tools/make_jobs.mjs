import { readFileSync, writeFileSync } from 'node:fs';
const d = JSON.parse(readFileSync('tools/.cache/world_dump.json', 'utf8').replace(/^\uFEFF/, ''));
const FAM = {
  slime: 'a giant gelatinous slime wearing a crown of thorns',
  wasp: 'a huge queen wasp with iridescent wings and a bloated hive abdomen',
  worm: 'a colossal armored worm with a gaping toothed maw',
  minotaur: 'a hulking minotaur warlord with horns and heavy armor holding a massive weapon',
  scorpion: 'a giant scorpion queen with glowing claws and a barbed tail',
  mushroom: 'a towering fungal horror with a glowing spore-cap and many eyes',
  skelwar: 'an undead skeleton warlord in tattered royal armor holding a greatsword',
  ghost: 'a tall spectral banshee with flowing tattered robes and hollow eyes',
  genie: 'a fierce genie emerging from smoke with floating jeweled bracers',
  magus: 'a robed archmage floating with a runed staff and orbiting glyphs',
  lamia: 'a serpentine lamia with a long coiled snake body and a hooded humanoid torso',
  succubus: 'a winged noble vampire-demoness in an elegant cloak with glowing eyes',
};
const EL = { nature: 'green and leafy', physical: 'steel gray and brown', fire: 'burning orange and red embers', shadow: 'dark purple and black mist', frost: 'icy blue and white', shock: 'bright yellow lightning crackling', arcane: 'violet and cyan magic glyphs', holy: 'radiant gold and white light' };
const jobs = [];
for (const b of d.b) {
  jobs.push({ out: `public/assets/gen/bosses/${b.id}.png`, model: 'rd-plus', style: 'default', w: 128, h: 128, remove_bg: true, seed: 1000 + jobs.length,
    prompt: `fantasy RPG boss monster, ${FAM[b.family]}, ${b.title}, ${EL[b.element]} color theme, menacing, full body, front view, centered, dark fantasy pixel art, detailed shading, plain background` });
}
for (const z of d.z) {
  jobs.push({ out: `public/assets/gen/zones/zone_${z.id}.png`, model: 'rd-plus', style: 'environment', w: 192, h: 192, seed: 2000 + z.id,
    prompt: `fantasy RPG battle backdrop, side view landscape, ${z.name}: ${z.desc} Dominant color ${z.color}, empty open ground in the foreground for fighting, no characters, no text, atmospheric depth` });
}
const extra = [
  ['gen/brand/rv_icon.png', 128, 128, false, 'app icon, a glowing rune-engraved lantern with a sword hilt, mystical teal and gold veil of light behind it, centered emblem, dark navy background, bold simple shapes, game icon'],
  ['gen/brand/rv_icon_fg.png', 128, 128, true, 'a glowing rune-engraved lantern with a sword hilt, mystical teal and gold light, centered emblem, bold simple shapes, game icon'],
  ['gen/art/rv_title.png', 216, 384, false, 'portrait fantasy title screen, a party of five tiny adventurers with lanterns standing on a cliff looking at a huge shimmering rune-veil of aurora light stretching across the night sky over a valley, teal purple and gold, epic, atmospheric'],
  ['gen/art/rv_intro_1.png', 216, 384, false, 'peaceful fantasy village at dusk under a huge glowing curtain of rune light in the sky, lanterns on every house, calm, warm and teal colors'],
  ['gen/art/rv_intro_2.png', 216, 384, false, 'the glowing rune veil in the sky tearing open with dark cracks, monsters silhouettes crawling out over a dark field, ominous purple and red'],
  ['gen/art/rv_intro_3.png', 216, 384, false, 'a vast fantasy world map seen from above on old parchment with twenty-two glowing marked locations connected by a winding road, forests mountains deserts ocean'],
  ['gen/art/rv_intro_4.png', 216, 384, false, 'five heroes (swordsman, archer, rogue, ranger, mage) standing together each holding a glowing lantern at night, heroic, dramatic lighting'],
  ['gen/art/rv_intro_5.png', 216, 384, false, 'a cozy campfire camp at night with a blacksmith anvil, a workbench and potions, a tent and sleeping heroes, warm firelight under stars'],
];
for (const [o, w, h, rb, p] of extra) jobs.push({ out: `public/assets/${o}`, model: 'rd-plus', style: 'default', w, h, remove_bg: rb, seed: 3000 + jobs.length, prompt: p });
writeFileSync('tools/.cache/jobs_all.json', JSON.stringify(jobs, null, 1));
writeFileSync('tools/.cache/jobs_test.json', JSON.stringify([jobs[0], jobs[28], jobs[50]], null, 1));
console.log(jobs.length);

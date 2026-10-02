import type { QuestDef, QuestStep, SkillId } from '@/core/types';
import { SKILL_MAP } from './skills';
import { ZONE_SEEDS } from './zoneSeeds';
import { money } from '@/core/money';
import { buildExtraQuests } from './questsExtra';
import { buildMoreQuests } from './questsMore';
import { GATHER_MAP } from './gather';
import { RECIPE_MAP } from './recipes';

const kill = (target: string, n: number, text: string): QuestStep => ({ type: 'kill', target, n, text });
const killAny = (zone: number, n: number, text: string): QuestStep => ({ type: 'killAny', target: String(zone), n, text });
const boss = (target: string, text: string): QuestStep => ({ type: 'boss', target, n: 1, text });
const gather = (target: string, n: number, text: string): QuestStep => ({ type: 'gather', target, n, text });
const craft = (target: string, n: number, text: string): QuestStep => ({ type: 'craft', target, n, text });
const skill = (target: SkillId, n: number): QuestStep => ({ type: 'skill', target, n, text: `Reach ${SKILL_MAP[target].name} level ${n}` });
const own = (target: string, n: number, text: string): QuestStep => ({ type: 'own', target, n, text });
const heroLevel = (n: number): QuestStep => ({ type: 'heroLevel', n, text: `Raise any hero to level ${n}` });

export const QUESTS: QuestDef[] = [];

// ---------- main story ----------
const MAIN_STORY: [string, string][] = [
  ['The Thinning Veil', 'Elder Maeva: "The fields hum at night. Something is leaking through the Veil. Start where it is thinnest, in Greenhollow."'],
  ['Hornets in the Hollow', 'Scout Pell: "The wasps in Whisperwood are swarming earlier every year. Follow the humming and find the nest. Take Sylra Windmere along, the best tracker of the high woods. She has been waiting for someone worth following."'],
  ['What the Marsh Remembers', 'Scholar Ilya: "The old marsh maps are wrong. The ground rearranges. Bring me proof."'],
  ['The Pass Remains Guarded', 'Quartermaster Tobin: "We need the foothill road open. Something with horns is collecting tolls. Brynna Stoneward holds the gate there. If you clear the pass, she will fight beside you."'],
  ['Gold in the Glare', 'Merchant Zeyla: "The dunes hide a ruined city. If you bring back anything shiny, the caravan guilds will pay handsomely."'],
  ['A Pulse Beneath the Stone', 'Forgemaster Brann: "The caverns glow wrong. Roots that breathe. Go down and see what is waking."'],
  ['The Fleet That Wouldn\'t Sink', 'Harbormaster Quill: "Every dusk the wrecks float back up. Please make them stop. A hooded scholar named Orren Ashgrove says he can read what drives them. He will join you if you sink the fleet for good."'],
  ['Cold Truths', 'Warden Hallis: "The tundra queen\'s winter is spreading. If it reaches the valley, the harvest is over."'],
  ['Fire Under Glass', 'Ashwright Corin: "The caldera djinn is bargaining with the mountain. I do not like what it is asking for."'],
  ['The Archivist\'s Ledger', 'Elder Maeva: "Beneath the sunken crypts sits a ledger of every soul. Our names may already be in it. Mirel Dawnsong, a cleric of the lost sun-order, will walk with you once the Warden falls."'],
  ['Coils and Courts', 'Huntress Rahne: "The jungle empress sends serpents to the border. Cut the head, and the vines forget."'],
  ['Heart of the Geode', 'Scholar Ilya: "The crystals are singing one note. It is getting louder."'],
  ['Thunder on the Peaks', 'Skywatcher Odd: "Storms circle the heights without moving. Something is riding them."'],
  ['The Burnt Host', 'Quartermaster Tobin: "The wastes hold one last general. He has not noticed the war ended."'],
  ['Midnight Invitation', 'Lady Veyra: "A letter arrived under my door. It is from a Count I buried a century ago."'],
  ['The Waking Dream', 'Mirel Dawnsong: "I dreamt of a glade where nobody sleeps. It is real, and it is hungry."'],
  ['Glass Throne', 'Forgemaster Brann: "The obsidian warlord is smithing an army out of reflections. Break his anvil."'],
  ['The Golden Silence', 'Merchant Zeyla: "Aurum\'s king turned everyone to gold. The market there has been closed for a thousand years."'],
  ['Where Things Go', 'Scholar Ilya: "The rift is not a monster. It is a direction. Be careful which way you step."'],
  ['The Last Stairway', 'Orren Ashgrove: "Seraphex still waits at the top. I would like to tell her she may rest."'],
  ['Pressure', 'Harbormaster Quill: "The tide has not gone out since the Leviathan surfaced. We are running out of coastline."'],
  ['The First Rune', 'Elder Maeva: "Everything ends where it began. The first rune waits. Whatever happens, thank you for walking this far."'],
  ['The Sky Breaks', 'Elder Maeva: "I was wrong. The rune did not end it, it only woke what was beneath. Look up. The sky has cracked, and the pieces are falling."'],
  ['A Sea of Cooled Glass', 'Forgemaster Brann: "Whatever fell turned the southern sea to glass. Pyrelith is melting it back, one wish at a time. Stop her before the shore forgets it was ever water."'],
  ['The Citadel That Kept Count', 'Warden Hallis: "Bonewhite Citadel still musters soldiers who died before my grandfather. Their Marshal has not accepted the armistice."'],
  ['The Garden That Eats Maps', 'Huntress Rahne: "Verdant Labyrinth rewrites itself every dusk. Three scouts came out. Not the same three who went in."'],
  ['Where the Stars Are Kept', 'Orren Ashgrove: "The Starless Vault holds every light the sky has misplaced. Nocturne guards it. I suspect he is lonely."'],
  ['A Thousand Echoes, One Voice', 'Mirel Dawnsong: "The hall repeats everything said inside it, a little changed each time. Vox Aeterna has been collecting my prayers. I would like them back."'],
  ['Teeth of the Mountain', 'Skywatcher Odd: "The peaks are not mountains. They are what remains of a wyrm that did not finish dying. Glaciermaw is still using it."'],
  ['The Crown That Calls Lightning', 'Skywatcher Odd: "Every storm I ever tracked leads here. Tempestus wears them like a crown. Take it off his head."'],
  ['Eclipse of the Hollow Sun', 'Scholar Ilya: "A sun with nothing inside it. It gives light and no warmth. Helion thinks that is a kindness. Convince him otherwise."'],
  ['The Last Margin', 'Elder Maeva: "Beyond the final page there is only margin, and something is erasing it. If it finishes, there will be nothing left to remember us. Go. Write us a better ending."'],
];

QUESTS.push({
  id: 'main_0', kind: 'main', name: 'A Small Beginning', giver: 'Elder Maeva',
  story: 'Elder Maeva: "Welcome to Candlemere camp. Before the Veil, you will need supplies. Learn the basics: chop, mine, and fight."',
  steps: [gather('log_0', 10, 'Gather 10 Pine Logs'), gather('ore_0', 10, 'Mine 10 Copper Ore'), killAny(1, 8, 'Defeat 8 monsters in Greenhollow Vale')],
  reward: { gold: 120, items: [{ item: 'cfish_0', n: 5 }], xp: [{ skill: 'combat', n: 40 }] },
});

const HERO_FOR_MAIN: Record<number, string> = { 2: 'sylra', 4: 'brynna', 7: 'orren', 10: 'mirel' };

ZONE_SEEDS.forEach((seed, i) => {
  const z = i + 1;
  const [name, story] = MAIN_STORY[i];
  const steps: QuestStep[] = [killAny(z, 18 + z * 3, `Defeat ${18 + z * 3} monsters in ${seed.name}`)];
  const mode = z % 4;
  // Skill steps use the best node a player who has trained about as far as the zone's Exploration gate can reach.
  const cap = z <= 2 ? 5 : Math.round(1 + (z - 1) * 2.4) + 1;
  const best = (prefix: string, levelOf: (id: string) => number | undefined) => {
    let k = 0;
    while ((levelOf(`${prefix}${k + 1}`) ?? 999) <= cap) k++;
    return `${prefix}${k}`;
  };
  const nodeLevel = (id: string) => GATHER_MAP[id]?.level;
  const recipeLevel = (id: string) => RECIPE_MAP[id]?.level;
  if (mode === 0) steps.push(gather(best('mine_', nodeLevel), 15 + z, `Mine ${15 + z} ore from the nodes of ${seed.name}`));
  else if (mode === 1) steps.push(craft(best('smelt_', recipeLevel), 5 + z, `Smelt ${5 + z} bars`));
  else if (mode === 2) steps.push(gather(best('fish_', nodeLevel), 10 + z, `Catch ${10 + z} fish`));
  else steps.push(craft(best('cook_', recipeLevel), 3 + Math.floor(z / 2), 'Cook meals for the road'));
  steps.push(boss(`boss_${z}`, `Defeat ${seed.boss.name}, ${seed.boss.title}`));
  QUESTS.push({
    id: `main_${z}`, kind: 'main', name, giver: story.split(':')[0], story, steps,
    reward: {
      gold: money(150 * Math.pow(1.45, z - 1), z), hero: [2, 4, 7, 10].includes(z) ? HERO_FOR_MAIN[z] : undefined,
      items: [{ item: `scroll_${Math.min(8, 1 + Math.floor(z / 3))}`, n: 1 }, { item: `cfish_${Math.min(19, z)}`, n: 10 }],
      xp: [{ skill: 'combat', n: 80 * z }],
    },
    requires: `main_${z - 1}`, reqZone: z,
  });
});

// ---------- side quests ----------
interface S { requires?: string; id: string; name: string; giver: string; story: string; steps: QuestStep[]; gold: number; items?: { item: string; n: number }[]; zone?: number; skill?: [SkillId, number]; xp?: [SkillId, number] }
const SIDE: S[] = [
  { id: 's_pie', name: "Maeva's Pumpkin Pie", giver: 'Elder Maeva', story: 'The elder wants a pie for the harvest festival. Carrots will not do.', steps: [gather('farm_5', 6, 'Grow 6 Pumpkins'), craft('cook_3', 1, 'Bake a Pumpkin Pie')], gold: 300, xp: ['cooking', 120], skill: ['farming', 8] },
  { id: 's_blade', name: 'A Blade for Tobin', giver: 'Quartermaster Tobin', story: 'The quartermaster needs a sturdy sword for the watch.', steps: [craft('smelt_0', 8, 'Smelt 8 Copper Bars'), craft('craft_sword_1', 1, 'Forge a Copper Sword')], gold: 250, xp: ['smithing', 100] },
  { id: 's_shoal', name: 'The Quiet Shoal', giver: 'Harbormaster Quill', story: 'Fish stopped biting at the river. Prove it is not the bait.', steps: [gather('fish_2', 12, 'Catch 12 Carp'), craft('grill_2', 6, 'Grill 6 Carp')], gold: 320, xp: ['fishing', 140], skill: ['fishing', 4] },
  { id: 's_herbs', name: 'Dew for Ilya', giver: 'Scholar Ilya', story: 'Ilya is cataloging the herbs of the Vale. She is behind schedule.', steps: [gather('herb_1', 10, 'Pick 10 Sageroot'), gather('herb_2', 10, 'Pick 10 Dewcap')], gold: 380, xp: ['herbalism', 160], skill: ['herbalism', 5] },
  { id: 's_potion', name: 'A Steadier Hand', giver: 'Ashwright Corin', story: 'Corin\'s hands shake. A Vigor Draught might help.', steps: [craft('brew_vigor_0', 3, 'Brew 3 Minor Vigor Draughts')], gold: 420, xp: ['alchemy', 200], skill: ['alchemy', 3] },
  { id: 's_wood', name: 'Timber for the Palisade', giver: 'Scout Pell', story: 'Camp needs a taller wall. Many planks.', steps: [gather('wood_0', 30, 'Chop 30 Pine Logs'), craft('saw_0', 10, 'Saw 10 Pine Planks')], gold: 360, xp: ['carpentry', 150] },
  { id: 's_bow', name: "Pell's Shortbow", giver: 'Scout Pell', story: 'A scout is only as good as her bow.', steps: [craft('saw_0', 6, 'Saw 6 Pine Planks'), craft('cure_0', 4, 'Cure 4 Rabbit Leather'), craft('craft_bow_1', 1, 'Craft a Copper Bow')], gold: 500, xp: ['carpentry', 220], skill: ['carpentry', 6] },
  { id: 's_ring', name: 'A Ring for Zeyla', giver: 'Merchant Zeyla', story: 'Zeyla wants a trinket to impress the guilds.', steps: [gather('dig_0', 6, 'Excavate 6 times at the Shallow Dig'), craft('cut_0', 2, 'Cut 2 Quartz'), craft('craft_ring_1', 1, 'Craft a Copper Ring')], gold: 520, xp: ['jewelcrafting', 220] },
  { id: 's_hunt', name: 'Wolves at the Door', giver: 'Huntress Rahne', story: 'Wolves again. Thin their number, and bring me hides.', steps: [gather('hunt_1', 12, 'Track 12 Wolf Hides'), craft('cure_1', 4, 'Cure 4 Wolf Leather')], gold: 640, xp: ['hunting', 260], skill: ['hunting', 9] },
  { id: 's_slime', name: 'Gel Quota', giver: 'Ashwright Corin', story: 'Alchemy needs gel. Slimes have it. You do the math.', steps: [kill('m_1_1', 12, 'Defeat 12 Meadow Slimes'), own('drop_slime_0', 10, 'Hold 10 Slime Gel')], gold: 280, xp: ['combat', 100] },
  { id: 's_elite1', name: 'The Elder Slime', giver: 'Elder Maeva', story: 'A great slime blocks the old well. Please deal with it.', steps: [kill('m_1_14', 3, 'Defeat 3 Elder Greenhollow Slimes')], gold: 450, xp: ['combat', 200], zone: 1 },
  { id: 's_hero10', name: 'Proving Ground', giver: 'Quartermaster Tobin', story: 'Tobin wants to see the party earn their stripes.', steps: [heroLevel(10)], gold: 600, items: [{ item: 'scroll_1', n: 2 }] },
  { requires: 'main_4', id: 's_fort', name: 'Take the Hit', giver: 'Brynna Stoneward', story: 'A bulwark learns by being struck. Do not wince.', steps: [skill('fortitude', 10)], gold: 700, xp: ['fortitude', 300] },
  { requires: 'main_7', id: 's_arc', name: 'The Study of Embers', giver: 'Orren Ashgrove', story: 'Orren asks you to practice spellcraft until your hands glow.', steps: [skill('arcana', 10)], gold: 700, xp: ['arcana', 300] },
  { requires: 'main_2', id: 's_mark', name: 'Straight Shot', giver: 'Sylra Windmere', story: 'Sylra has a challenge: hit the mark a hundred times without looking away.', steps: [skill('marksmanship', 10)], gold: 700, xp: ['marksmanship', 300] },
  { id: 's_foreign', name: 'The Desert Bargain', giver: 'Merchant Zeyla', story: 'Zeyla wants sand pearls, and a fair price.', steps: [killAny(5, 25, 'Defeat 25 monsters in Sunscar Dunes'), own('gem_3', 3, 'Hold 3 Cut Topaz')], gold: 1100, zone: 5, xp: ['trading', 400] },
  { id: 's_trade', name: 'Merchant Prince', giver: 'Merchant Zeyla', story: 'Run a caravan. Make a profit. Zeyla will do the paperwork.', steps: [craft('trade_0', 10, 'Run 10 Village Peddling trips'), craft('trade_1', 10, 'Run 10 Roadside Stall trips')], gold: 900, xp: ['trading', 300] },
  { id: 's_mine20', name: 'Deep Veins', giver: 'Forgemaster Brann', story: 'Brann wants his miners to go deeper. You are the miners.', steps: [skill('mining', 20)], gold: 1200, xp: ['mining', 600] },
  { id: 's_cook20', name: 'Camp Cuisine', giver: 'Elder Maeva', story: 'The party deserves proper meals. Cook up a storm.', steps: [skill('cooking', 20), craft('cook_5', 5, 'Prepare 5 Roast Corn Platters')], gold: 1300, xp: ['cooking', 700] },
  { id: 's_ench', name: 'Scribe of Scrolls', giver: 'Scholar Ilya', story: 'Ilya wants a working Scroll of Reinforcement. Not a theory. A scroll.', steps: [craft('distill_physical', 2, 'Distill 2 Essence of Might'), craft('scribe_1', 1, 'Scribe a Scroll of Reinforcement I')], gold: 900, xp: ['enchanting', 300] },
  { id: 's_rune', name: 'Carve and Cast', giver: 'Orren Ashgrove', story: 'A rune is a sentence. Write a good one.', steps: [craft('carve_fire_lesser', 1, 'Carve a Lesser Rune of Fire')], gold: 1600, skill: ['runecrafting', 18], xp: ['runecrafting', 500] },
  { id: 's_pass', name: 'Safe Passage', giver: 'Quartermaster Tobin', story: 'Escort the supply wagons through the foothills.', steps: [killAny(4, 40, 'Defeat 40 monsters in Ironcrest Foothills')], gold: 1400, zone: 4 },
  { id: 's_ships', name: 'Salvage Rights', giver: 'Harbormaster Quill', story: 'The wrecks keep floating back. Loot them, then burn them.', steps: [killAny(7, 40, 'Defeat 40 monsters in Brinewatch Coast'), gather('dig_3', 10, 'Dig 10 times at the Sunken Midden')], gold: 2100, zone: 7 },
  { id: 's_frost', name: 'A Hearth for Hallis', giver: 'Warden Hallis', story: 'Winter is hungry. Feed the fires.', steps: [killAny(8, 45, 'Defeat 45 monsters in Frostmere Tundra'), gather('wood_4', 20, 'Chop 20 Yew Logs')], gold: 2600, zone: 8 },
  { id: 's_ember', name: 'Forge Fuel', giver: 'Forgemaster Brann', story: 'Cinderpeak coals burn hotter. Bring me a crate.', steps: [killAny(9, 45, 'Defeat 45 monsters in Cinderpeak Caldera'), craft('smelt_5', 15, 'Smelt 15 Mithril Bars')], gold: 3400, zone: 9 },
  { id: 's_crypt', name: 'Ledger Pages', giver: 'Scholar Ilya', story: 'Torn pages of the Archivist\'s ledger are scattered across the crypt.', steps: [killAny(10, 50, 'Defeat 50 monsters in the Sunken Crypts'), own('relic_4', 3, 'Hold 3 Rusted Compasses')], gold: 4200, zone: 10 },
  { id: 's_jungle', name: 'Venom Samples', giver: 'Huntress Rahne', story: 'Samples from the Thornveil will teach us what the empress weaponizes.', steps: [killAny(11, 50, 'Defeat 50 monsters in Thornveil Jungle'), craft('brew_cleanse_1', 3, 'Brew 3 Cleansing Salves')], gold: 5200, zone: 11 },
  { id: 's_storm', name: 'Lightning Rod', giver: 'Skywatcher Odd', story: 'Odd wants to measure the storm. From the inside.', steps: [killAny(13, 55, 'Defeat 55 monsters in Stormspire Heights')], gold: 7200, zone: 13 },
  { id: 's_veyra', name: 'Letters from the Dead', giver: 'Lady Veyra', story: 'Veyra needs closure. Count Mordrake needs defeat.', steps: [kill('m_15_14', 2, 'Defeat 2 Baron Moonlit Nightwings'), boss('boss_15', 'Defeat Count Mordrake')], gold: 9000, zone: 15 },
  { id: 's_wb1', name: 'Calamity: Ignaroth', giver: 'Forgemaster Brann', story: 'A colossus walks the caldera. Brann cannot say no to a challenge.', steps: [boss('wboss_1', 'Defeat Ignaroth, the Infernal Colossus')], gold: 6000, items: [{ item: 'scroll_4', n: 2 }], zone: 9 },
  { id: 's_wb2', name: 'Calamity: Skarn', giver: 'Warden Hallis', story: 'A titan of winter has woken. Hallis wants it stopped.', steps: [boss('wboss_2', 'Defeat Skarn, the Winter Titan')], gold: 9000, items: [{ item: 'scroll_5', n: 2 }], zone: 12 },
  { id: 's_wb3', name: 'Calamity: Verdantyr', giver: 'Huntress Rahne', story: 'The jungle grew a king. Rahne wants the crown.', steps: [boss('wboss_3', 'Defeat Verdantyr, the Thorn Colossus')], gold: 14000, items: [{ item: 'scroll_6', n: 2 }], zone: 15 },
  { id: 's_wb4', name: 'Calamity: Umbraxis', giver: 'Lady Veyra', story: 'Something is eating the shadows of the town. Bring them back.', steps: [boss('wboss_4', 'Defeat Umbraxis, the Eclipse Devourer')], gold: 22000, items: [{ item: 'scroll_7', n: 2 }], zone: 18 },
  { id: 's_wb5', name: 'Calamity: Voltarion', giver: 'Skywatcher Odd', story: 'A wish with a temper. Do not wish back.', steps: [boss('wboss_5', 'Defeat Voltarion, the Storm Sovereign')], gold: 32000, items: [{ item: 'scroll_8', n: 2 }], zone: 20 },
  { requires: 'main_10', id: 's_wb6', name: 'Calamity: Lumenar', giver: 'Mirel Dawnsong', story: 'The last guardian of the first dawn. Mirel will sing while you fight.', steps: [boss('wboss_6', 'Defeat Lumenar, the Dawn Reliquary')], gold: 60000, items: [{ item: 'scroll_8', n: 4 }], zone: 22 },
  { id: 's_all', name: 'Jack of Many Trades', giver: 'Elder Maeva', story: 'The elder dares you to master the basics of every craft.', steps: [skill('smithing', 15), skill('carpentry', 15), skill('leatherworking', 15), skill('jewelcrafting', 15), skill('alchemy', 15)], gold: 4000, xp: ['exploration', 800] },
  { id: 's_explore', name: 'Cartographer\'s Dream', giver: 'Scout Pell', story: 'Fill in the maps. Pell will pay by the square mile.', steps: [skill('exploration', 25), gather('scout_5', 20, 'Scout Sunscar Dunes 20 times')], gold: 3000, xp: ['exploration', 900] },
];

const sideZone = (s: S): number => s.zone ?? (s.skill ? Math.min(22, 1 + Math.floor((s.skill[1] * 21) / 99)) : 2);

for (const s of SIDE) {
  QUESTS.push({
    id: s.id, kind: 'side', name: s.name, giver: s.giver, story: s.story, steps: s.steps,
    reward: { gold: money(s.gold, sideZone(s)), items: s.items, xp: s.xp ? [{ skill: s.xp[0], n: s.xp[1] }] : undefined },
    requires: s.requires, reqZone: s.zone, reqSkill: s.skill ? { skill: s.skill[0], level: s.skill[1] } : undefined,
  });
}

QUESTS.push(...buildExtraQuests());
QUESTS.push(...buildMoreQuests());

export const QUEST_MAP: Record<string, QuestDef> = Object.fromEntries(QUESTS.map((q) => [q.id, q]));

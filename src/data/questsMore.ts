import type { QuestDef, QuestStep, SkillId } from '@/core/types';
import { BOSSES, MONSTERS, ZONES } from './world';
import { ITEMS } from './items';
import { SKILL_MAP } from './skills';
import { food, scroll, toDef, eliteOf, type Q } from './questsExtra';

const kill = (target: string, n: number, text: string): QuestStep => ({ type: 'kill', target, n, text });
const killAny = (zone: number, n: number, text: string): QuestStep => ({ type: 'killAny', target: String(zone), n, text });
const boss = (target: string, text: string, n = 1): QuestStep => ({ type: 'boss', target, n, text });
const gather = (target: string, n: number, text: string): QuestStep => ({ type: 'gather', target, n, text });
const craft = (target: string, n: number, text: string): QuestStep => ({ type: 'craft', target, n, text });
const skill = (target: SkillId, n: number): QuestStep => ({ type: 'skill', target, n, text: `Reach ${SKILL_MAP[target].name} level ${n}` });
const own = (target: string, n: number, text: string): QuestStep => ({ type: 'own', target, n, text });
const heroLevel = (n: number): QuestStep => ({ type: 'heroLevel', n, text: `Raise any hero to level ${n}` });
const reach = (n: number, name: string): QuestStep => ({ type: 'zone', n, text: `Unlock ${name}` });
const wealth = (n: number, text: string): QuestStep => ({ type: 'gold', n, text });

const SILVER_PER_GOLD = 10_000;
const bn = (id: string): string => BOSSES[id]?.name ?? id;

// ---------- Echoes of the Veil: a third main-story strand, one act per zone ----------
const ECHOES: [string, string, string][] = [
  ['Echo in the Furrows', 'Elder Maeva', 'The fields keep humming after the monsters are gone. Maeva thinks the Veil remembers every wound.'],
  ['The Hive Remembers', 'Scout Pell', 'The wasps are quiet, but the hollow is not. Pell asks you to strike the nest a second time and listen.'],
  ['Footprints in Black Water', 'Scholar Ilya', 'The marsh draws new maps overnight. Ilya wants the thing that holds the pen.'],
  ['Toll Collectors', 'Quartermaster Tobin', 'Another horned thing collects tolls at the pass. Tobin wants it taught arithmetic.'],
  ['Mirage and Mortar', 'Merchant Zeyla', 'The ruined city shows itself only at noon. Zeyla wants the guards of that hour dealt with.'],
  ['The Roots Answer', 'Forgemaster Brann', 'Something below answers every hammer blow. Brann would like it to stop, or at least to keep time.'],
  ['Salt in the Hull', 'Harbormaster Quill', 'The wrecks sail again, this time with crews. Quill needs the ships boarded and the crews put to bed.'],
  ['A Second Winter', 'Warden Hallis', 'The cold has a captain now. Hallis asks you to break the line before the thaw is forgotten.'],
  ['What the Mountain Asked', 'Ashwright Corin', 'The djinn named its price. Corin refuses to pay it, and asks you to explain why.'],
  ['Blank Pages', 'Scholar Ilya', 'Whole pages of the ledger have gone blank. Somebody has been erasing names, and Ilya wants a word.'],
  ['The Gardener\'s Shears', 'Huntress Rahne', 'The empress prunes her border at dusk. Rahne would like her gardeners to take the night off.'],
  ['The Chord Resolves', 'Mirel Dawnsong', 'The crystal song is almost a sentence now. Mirel needs the note-keepers silenced before the last word.'],
  ['Eye of the Storm', 'Skywatcher Odd', 'Odd sees a calm in the middle of the storm. Nothing good lives in calm like that.'],
  ['Parade Rest', 'Quartermaster Tobin', 'The Ashen host holds a parade for the dead. Tobin asks you to be a poor audience.'],
  ['Courtesy Calls', 'Lady Veyra', 'The Count sends flowers every Tuesday. Veyra suggests you return the favor in person.'],
  ['The Last Lullaby', 'Mirel Dawnsong', 'The dreamers are waking. What was feeding on them is not pleased.'],
  ['Shards and Orders', 'Forgemaster Brann', 'Karn\'s soldiers march in perfect rows. Brann hopes you are unpredictable.'],
  ['Tarnish', 'Merchant Zeyla', 'Gold does not rust, but it can be tarnished. Zeyla wants to know who is doing it.'],
  ['The Rift Has Edges', 'Scholar Ilya', 'The rift grows wherever it is ignored. Ilya asks you to be loud about it.'],
  ['Stair by Stair', 'Orren Ashgrove', 'Every step of the Last Stairway remembers a climber. Orren hopes you will be remembered kindly.'],
  ['The Tide Turns', 'Harbormaster Quill', 'The Leviathan breathes in. Quill reminds you that everything breathes out.'],
  ['The Final Verse', 'Elder Maeva', 'The First Rune writes the last line of the story. Maeva insists you hold the pen.'],
];

function echoes(): Q[] {
  return ECHOES.map(([name, giver, story], i): Q => {
    const z = i + 1;
    const zone = ZONES[i];
    const b = BOSSES[zone.boss];
    const reg = MONSTERS[`m_${z}_2`];
    const drop = reg.drops.filter((d) => ITEMS[d.item]).sort((a, c) => c.chance - a.chance)[0];
    const steps: QuestStep[] = [
      killAny(z, 50 + z * 4, `Defeat ${50 + z * 4} monsters in ${zone.name}`),
      boss(b.id, `Defeat ${b.name} twice`, 2),
    ];
    if (drop) steps.splice(1, 0, own(drop.item, 8 + z, `Hold ${8 + z} ${ITEMS[drop.item].name}`));
    return {
      id: `ve_${z}`, kind: 'main', name, giver, story, steps, z, gold: 160 * Math.pow(1.42, z - 1),
      items: [scroll(z, 2), food(z, 10)], xp: ['combat', 100 * z], requires: i === 0 ? 'ch_1' : `ve_${z - 1}`, reqZone: z,
    };
  });
}

function finale(): Q[] {
  return [
    {
      id: 've_final', kind: 'main', name: 'Calamity Eve', giver: 'Elder Maeva', z: 22, gold: 6000, reqZone: 22, requires: 've_22',
      story: 'Maeva: "Six great calamities still walk this world. If the First Rune is to rest, they must rest first. This is the last thing I will ask of you."',
      steps: [1, 2, 3, 4, 5, 6].map((n) => boss(`wboss_${n}`, `Defeat ${bn(`wboss_${n}`)}`)),
      items: [scroll(22, 5), food(19, 25)],
    },
  ];
}

// ---------- Field Guide: hunt four different species in every zone ----------
function fieldGuide(): Q[] {
  return ZONES.map((zone): Q => {
    const z = zone.id;
    const picks = [4, 6, 8, 10].map((k) => MONSTERS[`m_${z}_${k}`]).filter(Boolean);
    return {
      id: `fg_${z}`, kind: 'side', name: `Field Guide: ${zone.name}`, giver: 'Scholar Ilya', z, gold: 140 * Math.pow(1.34, z - 1), reqZone: z,
      story: `Ilya is compiling a bestiary of ${zone.name}. She needs firsthand notes on four species, and is willing to pay for every scratch.`,
      steps: picks.map((m) => kill(m.id, 12 + z, `Defeat ${12 + z} ${m.name}`)), items: [food(z, 6)], xp: ['combat', 60 * z],
    };
  });
}

// ---------- Milestones: hero levels, fortune and exploration ----------
function milestones(): Q[] {
  const out: Q[] = [];
  const lv = [(15), 25, 35, 45, 55, 65, 75, 85, 95];
  const titles = ['Fresh Blood', 'Seasoned', 'Hardened', 'Respected', 'Renowned', 'Feared', 'Storied', 'Mythic', 'Beyond the Veil'];
  lv.forEach((n, i) => {
    const z = Math.max(1, Math.min(22, Math.round(1 + (n - 1) / 4.5)));
    out.push({
      id: `hl_${n}`, kind: 'side', name: `Hero's Road: ${titles[i]}`, giver: 'Quartermaster Tobin', z, gold: 300 * Math.pow(1.4, z - 1),
      story: `Tobin keeps a ledger of every hero who survives. He wants your name under "level ${n}".`,
      steps: [heroLevel(n)], items: [scroll(z, 2), food(z, 8)], xp: ['combat', 120 * z], requires: i ? `hl_${lv[i - 1]}` : undefined,
    });
  });
  const wealthTiers: [number, string, string][] = [
    [SILVER_PER_GOLD, 'Pocket Change', 'Merchant Zeyla'],
    [SILVER_PER_GOLD * 20, 'Honest Savings', 'Merchant Zeyla'],
    [SILVER_PER_GOLD * 300, 'A Comfortable Hoard', 'Merchant Zeyla'],
    [SILVER_PER_GOLD * 5000, 'Guild Credit', 'Merchant Zeyla'],
    [SILVER_PER_GOLD * 100000, 'Dragon\'s Ledger', 'Merchant Zeyla'],
    [SILVER_PER_GOLD * 2_000_000, 'The Silver Sea', 'Merchant Zeyla'],
  ];
  wealthTiers.forEach(([n, name, giver], i) => {
    const z = 3 + i * 3;
    out.push({
      id: `w_${i + 1}`, kind: 'side', name: `Fortune: ${name}`, giver, z, gold: 400 * Math.pow(1.5, i * 3), reqZone: Math.max(2, z - 2),
      story: `Zeyla's rule: a coin you do not hold cannot be spent. Show her a full purse worth at least ${n >= SILVER_PER_GOLD ? `${(n / SILVER_PER_GOLD).toLocaleString('en-US')}g` : `${n}s`}.`,
      steps: [wealth(n, `Hold ${(n / SILVER_PER_GOLD).toLocaleString('en-US')} gold`)], items: [scroll(z)], requires: i ? `w_${i}` : undefined,
    });
  });
  [3, 5, 7, 9, 11, 14, 17, 20, 22].forEach((n) => {
    out.push({
      id: `pf_${n}`, kind: 'side', name: `Pathfinder: ${ZONES[n - 1].name}`, giver: 'Scout Pell', z: n, gold: 220 * Math.pow(1.38, n - 1),
      story: `Pell's map has a blank where ${ZONES[n - 1].name} should be. He needs a boot on the ground there, and a reliable way back.`,
      steps: [reach(n, ZONES[n - 1].name)], items: [food(n, 8)], xp: ['exploration', 100 + n * 40], reqSkill: ['exploration', Math.max(1, Math.round(1 + (n - 3) * 3.6))],
    });
  });
  return out;
}

// ---------- Hand-written chains ----------
function chains(): Q[] {
  const e6 = eliteOf(6);
  return [
    {
      id: 't_watch_1', kind: 'side', name: 'The Night Watch', giver: 'Quartermaster Tobin', z: 3, gold: 420, reqZone: 3, requires: 'main_2',
      story: 'Tobin: "The watch is short on hands and long on timber. Clear the road, then help me raise a new tower."',
      steps: [killAny(2, 45, 'Defeat 45 monsters in Whisperwood'), gather('wood_0', 40, 'Chop 40 Pine Logs')], items: [scroll(3)],
    },
    {
      id: 't_watch_2', kind: 'side', name: 'Iron for the Tower', giver: 'Quartermaster Tobin', z: 5, gold: 1500, reqZone: 4, requires: 't_watch_1',
      story: 'Tobin: "Wood burns. Iron does not. Bring me iron, and anything that tries to stop you, bring me that too."',
      steps: [killAny(4, 55, 'Defeat 55 monsters in Ironcrest Foothills'), craft('smelt_1', 20, 'Smelt 20 Iron Bars')], items: [scroll(5)],
    },
    {
      id: 't_watch_3', kind: 'side', name: 'The Watch Holds', giver: 'Quartermaster Tobin', z: 8, gold: 5200, reqZone: 6, requires: 't_watch_2',
      story: 'Tobin: "The tower stands. Now the thing that wanted it down is coming back. Be there when it does."',
      steps: [kill(e6.id, 10, `Defeat 10 ${e6.name}`), boss('boss_6', `Defeat ${bn('boss_6')} twice`, 2)], items: [scroll(8, 2)],
    },
    {
      id: 'r_hunt_1', kind: 'side', name: 'First Blood Moon', giver: 'Huntress Rahne', z: 4, gold: 800, reqZone: 3, requires: 'main_2',
      story: 'Rahne: "The wolves come when the moon swells. Bring me hides, and I will teach you what the pack is afraid of."',
      steps: [gather('hunt_1', 30, 'Track 30 Wolf Hides'), craft('cure_1', 10, 'Cure 10 Wolf Leather')], items: [scroll(4)], xp: ['hunting', 500],
    },
    {
      id: 'r_hunt_2', kind: 'side', name: 'The Antlered Shadow', giver: 'Huntress Rahne', z: 8, gold: 4200, reqZone: 7, requires: 'r_hunt_1',
      story: 'Rahne: "Something with antlers watches my traps and leaves them untouched. Nothing leaves my traps untouched."',
      steps: [killAny(7, 60, 'Defeat 60 monsters in Brinewatch Coast'), craft('cure_1', 20, 'Cure 20 Wolf Leather')], items: [scroll(8)], xp: ['hunting', 900],
    },
    {
      id: 'r_hunt_3', kind: 'side', name: 'The Last Hunt', giver: 'Huntress Rahne', z: 12, gold: 14000, reqZone: 11, requires: 'r_hunt_2',
      story: 'Rahne: "Every hunter has one that got away. Mine is in the jungle, and it has been waiting."',
      steps: [boss('boss_11', `Defeat ${bn('boss_11')} twice`, 2), skill('hunting', 30)], items: [scroll(12, 2)], xp: ['hunting', 2000],
    },
    {
      id: 'i_arch_1', kind: 'side', name: 'Pressed Flowers', giver: 'Scholar Ilya', z: 3, gold: 520, reqZone: 3, requires: 'main_2',
      story: 'Ilya: "Specimens, specimens. The archive wants pressed flowers, and I wish to be left alone with my tea."',
      steps: [gather('herb_1', 30, 'Pick 30 Sageroot'), gather('herb_2', 30, 'Pick 30 Dewcap')], items: [scroll(3)], xp: ['herbalism', 400],
    },
    {
      id: 'i_arch_2', kind: 'side', name: 'Ink and Essence', giver: 'Scholar Ilya', z: 6, gold: 2400, reqZone: 5, requires: 'i_arch_1',
      story: 'Ilya: "Good ink is half essence. Distill me some Might, and scribe a scroll worthy of being copied."',
      steps: [craft('distill_physical', 6, 'Distill 6 Essence of Might'), craft('scribe_1', 3, 'Scribe 3 Scrolls of Reinforcement I')], items: [scroll(6)], xp: ['enchanting', 700],
    },
    {
      id: 'i_arch_3', kind: 'side', name: 'The Margin Notes', giver: 'Scholar Ilya', z: 11, gold: 11000, reqZone: 8, requires: 'i_arch_2',
      story: 'Ilya: "Somebody has been writing in the margins of the Archivist\'s ledger. In my handwriting. I would like to meet her."',
      steps: [skill('enchanting', 30), boss('boss_9', `Defeat ${bn('boss_9')} twice`, 2)], items: [scroll(11, 2)], xp: ['enchanting', 2200],
    },
    // Companion tales for the two optional heroes
    {
      id: 'h_vex_1', kind: 'side', name: 'Ledger of the Dead', giver: 'Vex Nightblade', z: 10, gold: 7000, reqZone: 9, requires: 's_vex',
      story: 'Vex: "My contract lists ninety names. Eighty-nine are crossed out. The last one is a monster. Of course it is."',
      steps: [killAny(9, 70, 'Defeat 70 monsters in Cinderpeak Caldera'), boss('boss_9', `Defeat ${bn('boss_9')}`)], items: [scroll(10, 2)],
    },
    {
      id: 'h_vex_2', kind: 'side', name: 'No Debts Left', giver: 'Vex Nightblade', z: 17, gold: 32000, reqZone: 16, requires: 'h_vex_1',
      story: 'Vex: "Finish this one, and I owe nobody. I have no idea what a person does then. I suppose I will find out."',
      steps: [boss('boss_14', `Defeat ${bn('boss_14')} twice`, 2), heroLevel(60)], items: [scroll(17, 3)],
    },
    {
      id: 'h_the_1', kind: 'side', name: 'Static', giver: 'Thessaly Stormcall', z: 14, gold: 21000, reqZone: 13, requires: 's_thessaly',
      story: 'Thessaly: "The Spire hums, and I hum with it. I would like to know whether that is a coincidence."',
      steps: [killAny(13, 80, 'Defeat 80 monsters in Stormspire Heights'), boss('boss_13', `Defeat ${bn('boss_13')}`)], items: [scroll(14, 2)],
    },
    {
      id: 'h_the_2', kind: 'side', name: 'The Voice of Thunder', giver: 'Thessaly Stormcall', z: 20, gold: 64000, reqZone: 19, requires: 'h_the_1',
      story: 'Thessaly: "Voltarion is the storm that dropped me. I want to hear it say sorry. Out loud. In thunder."',
      steps: [boss('wboss_5', `Defeat ${bn('wboss_5')}`), heroLevel(75)], items: [scroll(20, 3)],
    },
  ];
}

export function buildMoreQuests(): QuestDef[] {
  return [...echoes(), ...finale(), ...fieldGuide(), ...milestones(), ...chains()].map(toDef);
}

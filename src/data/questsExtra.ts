import type { QuestDef, QuestStep, SkillId } from '@/core/types';
import { money } from '@/core/money';
import { GATHER } from './gather';
import { RECIPES } from './recipes';
import { BOSSES, MONSTERS, ZONES } from './world';
import { SKILLS, SKILL_MAP } from './skills';

const kill = (target: string, n: number, text: string): QuestStep => ({ type: 'kill', target, n, text });
const killAny = (zone: number, n: number, text: string): QuestStep => ({ type: 'killAny', target: String(zone), n, text });
const boss = (target: string, text: string, n = 1): QuestStep => ({ type: 'boss', target, n, text });
const gather = (target: string, n: number, text: string): QuestStep => ({ type: 'gather', target, n, text });
const craft = (target: string, n: number, text: string): QuestStep => ({ type: 'craft', target, n, text });
const skill = (target: SkillId, n: number): QuestStep => ({ type: 'skill', target, n, text: `Reach ${SKILL_MAP[target].name} level ${n}` });
const heroLevel = (n: number): QuestStep => ({ type: 'heroLevel', n, text: `Raise any hero to level ${n}` });

/** Zone-like progress index for a skill level, so rewards track the same economy as monsters. */
const zoneOfLevel = (lvl: number): number => Math.max(1, Math.min(22, 1 + Math.floor(((lvl - 1) * 21) / 98)));
const scroll = (z: number, n = 1) => ({ item: `scroll_${Math.min(8, 1 + Math.floor(z / 3))}`, n });
const food = (z: number, n = 10) => ({ item: `cfish_${Math.min(19, z)}`, n });

interface Q {
  id: string; kind: 'main' | 'side'; name: string; giver: string; story: string; steps: QuestStep[];
  z: number; gold: number; items?: { item: string; n: number }[]; xp?: [SkillId, number]; hero?: string;
  requires?: string; reqZone?: number; reqSkill?: [SkillId, number];
}

function toDef(q: Q): QuestDef {
  return {
    id: q.id, kind: q.kind, name: q.name, giver: q.giver, story: q.story, steps: q.steps,
    reward: { gold: money(q.gold, q.z), items: q.items, xp: q.xp ? [{ skill: q.xp[0], n: q.xp[1] }] : undefined, hero: q.hero },
    requires: q.requires, reqZone: q.reqZone, reqSkill: q.reqSkill ? { skill: q.reqSkill[0], level: q.reqSkill[1] } : undefined,
  };
}

const eliteOf = (z: number) => Object.values(MONSTERS).find((m) => m.zone === z && m.elite)!;
const commonOf = (z: number, k: number) => MONSTERS[`m_${z}_${k}`];

// ---------- Chronicle of the Veil: a second main-story strand, one chapter per zone ----------
const CHRONICLE: [string, string, string][] = [
  ['Roots and Rumours', 'Elder Maeva', 'The camp is full of rumours. Gather proof of what is crawling out of the fields before panic does the work for us.'],
  ['The Woodcutter\'s Debt', 'Scout Pell', 'Pell needs timber to rebuild the lookout the hornets wrecked. Honest work, honest pay.'],
  ['Marsh Medicine', 'Scholar Ilya', 'The marsh water makes people sick. Ilya believes the cure grows in the same mud.'],
  ['Hammer and Anvil', 'Forgemaster Brann', 'Brann will re-arm the pass guard if you bring him the steel and prove you can swing it.'],
  ['Salt and Sand', 'Merchant Zeyla', 'Caravans are vanishing between the dunes. Zeyla wants the road scouted and the thieves discouraged.'],
  ['Lanterns Underground', 'Ashwright Corin', 'The caverns eat torches. Corin has a recipe, and needs somebody brave enough to test it.'],
  ['Wreckwood', 'Harbormaster Quill', 'Planks from the drowned fleet are cursed. Quill wants them hauled out, dried, and burned.'],
  ['The Long Night', 'Warden Hallis', 'Frostmere\'s night is getting longer. Keep the watchfires lit and the wolves away.'],
  ['Slag and Song', 'Forgemaster Brann', 'Something in the caldera sings when metal is hammered. Brann wants to know why.'],
  ['Names in Ink', 'Scholar Ilya', 'The crypt pages are crumbling. Ilya will pay for anything that helps copy them before they turn to dust.'],
  ['The Empress\'s Gardeners', 'Huntress Rahne', 'Vines tend themselves in Thornveil. Rahne wants the gardeners found, and stopped.'],
  ['Hymn of the Deep', 'Mirel Dawnsong', 'The crystals sing in the depths. Mirel believes the song is a warning, and wants every word of it.'],
  ['Weather Report', 'Skywatcher Odd', 'Odd has measured the storm for three winters. This season, it measured him back.'],
  ['Ash and Ember', 'Quartermaster Tobin', 'The Ashen Marshal still recruits. Tobin needs to know how many soldiers remain in the wastes.'],
  ['A Letter Answered', 'Lady Veyra', 'Veyra has written back to the Count. She needs courage, and a reliable escort.'],
  ['Sleepwalkers', 'Mirel Dawnsong', 'The glade\'s dreamers walk at dusk. Wake them gently, and bring the hungry thing out of the dream.'],
  ['The Mirror Forge', 'Forgemaster Brann', 'Karn forges soldiers from reflections. Brann wants a fistful of their glass to study.'],
  ['Weighing Gold', 'Merchant Zeyla', 'In Aurum, everything is worth exactly what it weighs. Zeyla wants to test whether that includes you.'],
  ['The Direction Home', 'Scholar Ilya', 'The rift points somewhere. Ilya has a compass, and a terrible feeling about north.'],
  ['Feathers and Flame', 'Orren Ashgrove', 'Seraphex sheds light like a burning bird sheds feathers. Orren collects them. For research.'],
  ['Pressure Gauge', 'Harbormaster Quill', 'The Abyssal Maw has a tide of its own. Quill has run out of instruments and optimism.'],
  ['Final Account', 'Elder Maeva', 'When the First Rune falls silent, someone must tell the world. Maeva insists it should be a good story.'],
];

function chronicle(): Q[] {
  return CHRONICLE.map(([name, giver, story], i): Q => {
    const z = i + 1;
    const zn = ZONES[i].name;
    const steps: QuestStep[] = [
      kill(eliteOf(z).id, 4 + Math.floor(z / 3), `Defeat ${4 + Math.floor(z / 3)} ${eliteOf(z).name}`),
    ];
    const m = z % 5;
    if (m === 0) steps.push(heroLevel(Math.max(5, Math.round(ZONES[i].levelRange[0] * 0.9))));
    else if (m === 1) steps.push(gather(`wood_${Math.min(11, Math.floor(z / 2))}`, 20 + z * 2, `Chop ${20 + z * 2} logs`));
    else if (m === 2) steps.push(craft(`saw_${Math.min(11, Math.floor(z / 2))}`, 8 + z, `Saw ${8 + z} planks`));
    else if (m === 3) steps.push(gather(`herb_${Math.min(15, z - 1)}`, 15 + z, `Pick ${15 + z} herbs`));
    else steps.push(gather(`hunt_${Math.min(11, Math.floor(z / 2))}`, 12 + z, `Track ${12 + z} beasts`));
    steps.push(killAny(z, 30 + z * 2, `Defeat ${30 + z * 2} monsters in ${zn}`));
    return {
      id: `ch_${z}`, kind: 'main', name, giver, story, steps, z, gold: 90 * Math.pow(1.4, z - 1), items: [scroll(z), food(z, 8)],
      xp: ['exploration', 60 * z], requires: `main_${z}`, reqZone: z,
    };
  });
}

// ---------- Personal quests for each companion ----------
function personal(): Q[] {
  const out: Q[] = [];
  out.push(
    {
      id: 'h_kae_1', kind: 'side', name: 'Old Scars', giver: 'Kaelen Vance', z: 2, gold: 400, reqZone: 2,
      story: 'Kaelen: "Every scar has a name. I will tell you the first one if you are still standing after forty fights."',
      steps: [killAny(2, 40, 'Defeat 40 monsters in Whisperwood'), heroLevel(10)], items: [scroll(2)],
    },
    {
      id: 'h_kae_2', kind: 'side', name: 'The Sellsword\'s Oath', giver: 'Kaelen Vance', z: 7, gold: 2600, reqZone: 7, requires: 'h_kae_1',
      story: 'Kaelen: "I swore to find what is breaking the Veil. I will not break that oath. I will, however, bring a friend with a very large sword."',
      steps: [boss('boss_6', 'Defeat Myconis, the cavern\'s mind'), heroLevel(28)], items: [scroll(7, 2)],
    },
    {
      id: 'h_syl_1', kind: 'side', name: 'Tracks in the Mist', giver: 'Sylra Windmere', z: 4, gold: 900, reqZone: 4, requires: 'main_2',
      story: 'Sylra: "Something old walks the marsh edge at night. I have seen the tracks. I have not seen the owner."',
      steps: [kill('m_3_14', 3, `Defeat 3 ${MONSTERS['m_3_14'].name}`), gather('hunt_2', 15, 'Track 15 Boars')], items: [scroll(4)], xp: ['marksmanship', 400],
    },
    {
      id: 'h_syl_2', kind: 'side', name: 'The Last Arrow of Windmere', giver: 'Sylra Windmere', z: 11, gold: 6500, reqZone: 11, requires: 'h_syl_1',
      story: 'Sylra: "My clan buried one arrow with every elder. The jungle took ours. Help me bring it home."',
      steps: [boss('boss_10', 'Defeat Warden Vael'), skill('marksmanship', 30)], items: [scroll(11, 2)], xp: ['marksmanship', 1500],
    },
    {
      id: 'h_bry_1', kind: 'side', name: 'Nine Days at the Gate', giver: 'Brynna Stoneward', z: 6, gold: 1800, reqZone: 6, requires: 'main_4',
      story: 'Brynna: "Nine days I held the gate. On the tenth, someone brought soup. I never learned the name. Find them."',
      steps: [killAny(5, 40, 'Defeat 40 monsters in Sunscar Dunes'), craft('cook_3', 4, 'Cook 4 Pumpkin Pies')], items: [food(6, 15)], xp: ['fortitude', 600],
    },
    {
      id: 'h_bry_2', kind: 'side', name: 'A Shield Remembers', giver: 'Brynna Stoneward', z: 13, gold: 9000, reqZone: 13, requires: 'h_bry_1',
      story: 'Brynna: "My shield cracked on the ninth day. I kept it. Bring me ore worth reforging it, and a worthy enemy to test it on."',
      steps: [craft('smelt_6', 12, 'Smelt 12 bars of Adamant'), boss('wboss_2', 'Defeat Skarn, the Winter Titan')], items: [scroll(13, 2)], xp: ['fortitude', 2000],
    },
    {
      id: 'h_orr_1', kind: 'side', name: 'The Whisper in the Runes', giver: 'Orren Ashgrove', z: 9, gold: 3800, reqZone: 9, requires: 'main_7',
      story: 'Orren: "The old runes whisper in a language I almost know. Carve me three of them and I will learn one more word."',
      steps: [skill('runecrafting', 15), craft('carve_fire_lesser', 3, 'Carve 3 Lesser Runes of Fire')], items: [scroll(9)], xp: ['arcana', 800],
    },
    {
      id: 'h_orr_2', kind: 'side', name: 'Keeper of Embers', giver: 'Orren Ashgrove', z: 16, gold: 17000, reqZone: 16, requires: 'h_orr_1',
      story: 'Orren: "I kept an ember alive for forty years. Today it asked for something to burn. Let us oblige it."',
      steps: [boss('wboss_3', 'Defeat Verdantyr, the Thorn Colossus'), skill('arcana', 45)], items: [scroll(16, 2)], xp: ['arcana', 3000],
    },
    {
      id: 'h_mir_1', kind: 'side', name: 'A Hymn for the Quiet', giver: 'Mirel Dawnsong', z: 12, gold: 7600, reqZone: 12, requires: 'main_10',
      story: 'Mirel: "There is a village that stopped singing. I want to remember how it ended, and perhaps help it begin again."',
      steps: [killAny(11, 45, 'Defeat 45 monsters in Thornveil Jungle'), craft('brew_cleanse_1', 5, 'Brew 5 Cleansing Salves')], items: [scroll(12)], xp: ['alchemy', 900],
    },
    {
      id: 'h_mir_2', kind: 'side', name: 'First Light', giver: 'Mirel Dawnsong', z: 19, gold: 44000, reqZone: 19, requires: 'h_mir_1',
      story: 'Mirel: "My order had a dawn song that no one finished. I think the Veil is waiting for the last verse."',
      steps: [boss('wboss_4', 'Defeat Umbraxis, the Eclipse Devourer'), heroLevel(80)], items: [scroll(19, 3)],
    },
  );
  return out;
}

// ---------- Hard recruit quests for the two optional heroes ----------
function recruits(): Q[] {
  const e8 = eliteOf(8);
  const e12 = eliteOf(12);
  return [
    {
      id: 's_vex', kind: 'side', name: 'A Debt in the Dark', giver: 'Vex Nightblade', z: 9, gold: 5200, reqZone: 8, requires: 'main_7',
      story: 'A woman in a grey hood waits at the edge of the firelight. Vex: "I collect debts for the dead. One of them is owed to you, or you to him. Survive my contract and I will fight for whoever is left standing."',
      steps: [
        killAny(8, 90, 'Defeat 90 monsters in Frostmere Tundra'),
        kill(e8.id, 8, `Defeat 8 ${e8.name}`),
        boss('boss_8', 'Defeat Hrimwyn three times', 3),
        heroLevel(35),
      ],
      items: [scroll(9, 2)], hero: 'vex',
    },
    {
      id: 's_thessaly', kind: 'side', name: 'The Storm Remembers', giver: 'Thessaly Stormcall', z: 13, gold: 16000, reqZone: 12, requires: 'main_10',
      story: 'Lightning walks the crystal depths without a storm. A falling star of a woman stands in the crackle. Thessaly: "The Spire dropped me, and the Spire is not done. Match my thunder and I will lend you my voice."',
      steps: [
        killAny(12, 110, 'Defeat 110 monsters in Crystalline Depths'),
        kill(e12.id, 10, `Defeat 10 ${e12.name}`),
        boss('boss_12', 'Defeat Voruun three times', 3),
        boss('wboss_2', 'Defeat Skarn, the Winter Titan'),
        heroLevel(55),
      ],
      items: [scroll(13, 3)], hero: 'thessaly',
    },
  ];
}

// ---------- Skill mastery series (every skill, eleven ranks) ----------
const RANKS: [number, string][] = [
  [5, 'Novice'], [10, 'Apprentice'], [20, 'Journeyman'], [30, 'Adept'], [40, 'Skilled'], [50, 'Expert'],
  [60, 'Veteran'], [70, 'Master'], [80, 'Grandmaster'], [90, 'Legend'], [99, 'Paragon'],
];

const MASTER_GIVER: Record<SkillId, string> = {
  combat: 'Quartermaster Tobin', fortitude: 'Sergeant Hask', marksmanship: 'Scout Pell', arcana: 'Scholar Ilya',
  mining: 'Forgemaster Brann', woodcutting: 'Scout Pell', fishing: 'Harbormaster Quill', herbalism: 'Scholar Ilya', farming: 'Elder Maeva',
  hunting: 'Huntress Rahne', excavation: 'Merchant Zeyla', smithing: 'Forgemaster Brann', carpentry: 'Scout Pell', leatherworking: 'Huntress Rahne',
  jewelcrafting: 'Merchant Zeyla', cooking: 'Elder Maeva', alchemy: 'Ashwright Corin', enchanting: 'Scholar Ilya', runecrafting: 'Orren Ashgrove',
  exploration: 'Scout Pell', trading: 'Merchant Zeyla',
};

const MASTER_REQUIRES: Partial<Record<SkillId, string>> = { marksmanship: 'main_2', fortitude: 'main_4', arcana: 'main_7' };

const RANK_LINE = (rank: string, name: string): string => {
  switch (rank) {
    case 'Novice': return `Everyone starts somewhere. Prove you can do more than hold the tool: show a little ${name.toLowerCase()} the village will remember.`;
    case 'Apprentice': return `You have the basics of ${name.toLowerCase()}. Now show you can do it on a schedule.`;
    case 'Journeyman': return `Word is spreading about your ${name.toLowerCase()}. A journeyman is judged by the quantity of work, not the speed of boasting.`;
    case 'Adept': return `Few reach this far in ${name.toLowerCase()} without a mentor. Here is the work they would have assigned.`;
    case 'Skilled': return `Your ${name.toLowerCase()} is starting to look like a trade. Keep going before it becomes a habit.`;
    case 'Expert': return `The guild has a seat for experts in ${name.toLowerCase()}, and a pile of orders to go with it.`;
    case 'Veteran': return `You have outlasted most. A veteran of ${name.toLowerCase()} takes the hard contracts.`;
    case 'Master': return `A master of ${name.toLowerCase()} needs no instructions, only a long list of difficult requests.`;
    case 'Grandmaster': return `They tell stories about ${name.toLowerCase()} at this level. Make sure they are true.`;
    case 'Legend': return `Legends in ${name.toLowerCase()} are expected to leave something behind. Begin with a pile of proof.`;
    default: return `Nothing remains to prove in ${name.toLowerCase()}. Do it once more for the ones who will tell the story.`;
  }
};

function mastery(): Q[] {
  const out: Q[] = [];
  for (const sk of SKILLS) {
    const nodes = GATHER.filter((g) => g.skill === sk.id).sort((a, b) => a.level - b.level);
    const recs = RECIPES.filter((r) => r.skill === sk.id).sort((a, b) => a.level - b.level);
    for (const [lvl, rank] of RANKS) {
      const z = zoneOfLevel(lvl);
      const steps: QuestStep[] = [skill(sk.id, lvl)];
      if (nodes.length) {
        const n = [...nodes].reverse().find((x) => x.level <= lvl) ?? nodes[0];
        steps.push(gather(n.id, 12 + Math.round(lvl * 0.6), `${sk.id === 'exploration' ? 'Scout' : 'Work'} ${n.name} ${12 + Math.round(lvl * 0.6)} times`));
      } else if (recs.length) {
        const r = [...recs].reverse().find((x) => x.level <= lvl) ?? recs[0];
        steps.push(craft(r.id, 4 + Math.round(lvl / 8), `Make ${4 + Math.round(lvl / 8)}× ${r.name}`));
      } else {
        const zz = Math.min(z, 22);
        steps.push(killAny(zz, 30 + Math.round(lvl / 2), `Defeat ${30 + Math.round(lvl / 2)} monsters in ${ZONES[zz - 1].name}`));
      }
      out.push({
        id: `m_${sk.id}_${lvl}`, kind: 'side', name: `${rank} ${sk.name}`, giver: MASTER_GIVER[sk.id], story: RANK_LINE(rank, sk.name),
        steps, z, gold: 220 * Math.pow(1.22, z - 1) * (lvl >= 99 ? 3 : 1), items: lvl >= 20 ? [scroll(z)] : undefined, xp: [sk.id, 40 + lvl * 8],
        reqSkill: [sk.id, Math.max(1, lvl - 8)], requires: MASTER_REQUIRES[sk.id], reqZone: nodes.length || recs.length ? undefined : z,
      });
    }
  }
  return out;
}

// ---------- Zone bounties ----------
function bounties(): Q[] {
  const out: Q[] = [];
  ZONES.forEach((zone) => {
    const z = zone.id;
    const el = eliteOf(z);
    const common = commonOf(z, 3) ?? commonOf(z, 1);
    const b = BOSSES[zone.boss];
    out.push(
      {
        id: `b_elite_${z}`, kind: 'side', name: `Wanted: ${el.name}`, giver: 'Bounty Board', z, gold: 160 * Math.pow(1.3, z - 1), reqZone: z,
        story: `A notice nailed to the post: "${el.name} has been seen in ${zone.name}. Bring proof. Payment on delivery."`,
        steps: [kill(el.id, 5 + Math.floor(z / 4), `Defeat ${5 + Math.floor(z / 4)} ${el.name}`)], items: [food(z, 6)],
      },
      {
        id: `b_pest_${z}`, kind: 'side', name: `Pest Control: ${common.name}`, giver: 'Bounty Board', z, gold: 110 * Math.pow(1.3, z - 1), reqZone: z,
        story: `The ${common.name} are multiplying in ${zone.name}. Thin the herd before it thins the villagers.`,
        steps: [kill(common.id, 25 + z * 2, `Defeat ${25 + z * 2} ${common.name}`)],
      },
      {
        id: `b_boss_${z}`, kind: 'side', name: `Rematch: ${b.name}`, giver: 'Bounty Board', z, gold: 320 * Math.pow(1.32, z - 1), reqZone: Math.min(22, z + 1),
        story: `${b.name} fell once. The people of ${zone.name} would feel better if it fell twice more.`,
        steps: [boss(b.id, `Defeat ${b.name} three times`, 3)], items: [scroll(z)],
      },
    );
  });
  return out;
}

// ---------- Crafting commissions ----------
const COMM_GIVER: Partial<Record<SkillId, string>> = {
  smithing: 'Forgemaster Brann', carpentry: 'Scout Pell', leatherworking: 'Huntress Rahne', jewelcrafting: 'Merchant Zeyla',
};

function commissions(): Q[] {
  const out: Q[] = [];
  for (const skillId of Object.keys(COMM_GIVER) as SkillId[]) {
    const pieces = RECIPES.filter((r) => r.skill === skillId && r.id.startsWith('craft_')).sort((a, b) => a.level - b.level);
    const step = Math.max(1, Math.floor(pieces.length / 14));
    for (let i = 0; i < pieces.length; i += step) {
      const r = pieces[i];
      const z = zoneOfLevel(r.level);
      const n = 1 + (i % 3);
      out.push({
        id: `c_${r.id}`, kind: 'side', name: `Commission: ${r.name}`, giver: COMM_GIVER[skillId]!, z, gold: 260 * Math.pow(1.25, z - 1) * n,
        story: `${COMM_GIVER[skillId]} has a customer who will accept nothing but a ${r.name.toLowerCase()}${n > 1 ? `, and a few spares` : ''}.`,
        steps: [craft(r.id, n, `Craft ${n}× ${r.name}`)], reqSkill: [skillId, Math.max(1, r.level - 6)], xp: [skillId, 60 + r.level * 6],
      });
    }
  }
  return out;
}

export function buildExtraQuests(): QuestDef[] {
  return [...chronicle(), ...personal(), ...recruits(), ...mastery(), ...bounties(), ...commissions()].map(toDef);
}

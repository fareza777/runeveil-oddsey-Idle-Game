export type SkillId =
  | 'combat' | 'fortitude' | 'marksmanship' | 'arcana'
  | 'mining' | 'woodcutting' | 'fishing' | 'herbalism' | 'farming' | 'hunting' | 'excavation'
  | 'smithing' | 'carpentry' | 'leatherworking' | 'jewelcrafting' | 'cooking' | 'alchemy' | 'enchanting' | 'runecrafting'
  | 'exploration' | 'trading';

export type Element = 'physical' | 'fire' | 'frost' | 'nature' | 'shock' | 'shadow' | 'holy' | 'arcane';
export type Slot = 'weapon' | 'offhand' | 'head' | 'body' | 'legs' | 'hands' | 'feet' | 'neck' | 'ring' | 'rune';
export type Style = 'melee' | 'ranged' | 'magic';

export type StatKey = 'atk' | 'def' | 'hp' | 'crit' | 'critDmg' | 'haste' | 'eva' | 'leech' | 'regen' | 'luck' | 'res';
export type Stats = Partial<Record<StatKey, number>>;

export type StatusId =
  | 'poison' | 'burn' | 'bleed' | 'chill' | 'freeze' | 'stun' | 'shock' | 'curse' | 'weaken' | 'blind'
  | 'regen' | 'shield' | 'haste' | 'might' | 'fortify' | 'thorns' | 'vulnerable' | 'slow';

export type ItemKind = 'material' | 'food' | 'potion' | 'equip' | 'rune' | 'scroll' | 'misc';

export interface ItemDef {
  id: string;
  name: string;
  kind: ItemKind;
  tier: number;
  icon: string;
  value: number;
  desc?: string;
  tag?: string;
  slot?: Slot;
  style?: Style;
  weaponKind?: string;
  base?: Stats;
  element?: Element;
  unique?: boolean;
  heal?: number;
  buff?: { status: StatusId; potency: number; duration: number };
  xpBoost?: { skill?: SkillId; pct: number; duration: number };
  upgradeTier?: number;
  apply?: StatusId;
}

export interface ItemInstance {
  uid: string;
  id: string;
  rarity: number;
  up: number;
  ench?: StatKey;
}

export interface DropEntry {
  item: string;
  chance: number;
  min?: number;
  max?: number;
}

export interface GatherDef {
  id: string;
  skill: SkillId;
  name: string;
  level: number;
  xp: number;
  time: number;
  drops: DropEntry[];
  icon: string;
  desc?: string;
}

export interface RecipeDef {
  id: string;
  skill: SkillId;
  name: string;
  level: number;
  xp: number;
  time: number;
  inputs: { item: string; n: number }[];
  gold?: number;
  out: { item: string; n: number }[];
  outGold?: number;
  quality?: boolean;
  icon: string;
}

export interface MonsterDef {
  id: string;
  name: string;
  zone: number;
  level: number;
  sprite: string;
  hue: number;
  sat: number;
  scale: number;
  hpMul: number;
  atkMul: number;
  defMul: number;
  speed: number;
  element: Element;
  weak?: Element;
  resist?: Element;
  inflicts?: { status: StatusId; chance: number; potency: number; duration: number };
  drops: DropEntry[];
  gold: [number, number];
  xp: number;
  family: string;
  boss?: boolean;
  elite?: boolean;
}

export interface BossAbility {
  name: string;
  every: number;
  kind: 'smash' | 'aoe' | 'heal' | 'enrage' | 'summon' | 'status' | 'shield';
  mult?: number;
  status?: { status: StatusId; potency: number; duration: number };
}

export interface BossDef extends MonsterDef {
  title: string;
  lore: string;
  abilities: BossAbility[];
  unique?: string;
  first: { gold: number; items: { item: string; n: number }[] };
  bg: string;
}

export interface ZoneDef {
  id: number;
  key: string;
  name: string;
  desc: string;
  levelRange: [number, number];
  tier: number;
  monsters: string[];
  boss: string;
  elite: string;
  gather: string[];
  bg: string;
  color: string;
  reqExploration: number;
  reqPower: number;
}

export interface HeroDef {
  id: string;
  name: string;
  cls: string;
  title: string;
  style: Style;
  skill: SkillId;
  sprite: string;
  color: string;
  base: Stats;
  ability: HeroAbility;
  /** Second ability, learned at HERO_ABILITY2_LEVEL. */
  ability2: HeroAbility;
  passive: { name: string; desc: string; mods: HeroMods };
  recruit: { kind: 'start' } | { kind: 'main'; quest: string; hint: string } | { kind: 'side'; quest: string; hint: string };
  bio: string;
}

export type AbilityKind =
  | 'cleave' | 'volley' | 'fireball' | 'shieldwall' | 'heal'
  | 'rally' | 'pin' | 'frostlance' | 'bash' | 'smite' | 'execute' | 'venom' | 'chain' | 'thunder';

export interface HeroAbility { name: string; cd: number; desc: string; kind: AbilityKind }

/** Percent modifiers (or flat for crit/haste/eva/leech/regen/luck/res) applied on top of a hero's computed stats. */
export type HeroMods = Partial<Record<'atkPct' | 'hpPct' | 'defPct' | StatKey, number>>;

export interface QuestStep {
  type: 'kill' | 'killAny' | 'boss' | 'gather' | 'craft' | 'skill' | 'zone' | 'own' | 'gold' | 'heroLevel';
  target?: string;
  n: number;
  text: string;
}

export interface QuestDef {
  id: string;
  kind: 'main' | 'side' | 'daily';
  name: string;
  giver: string;
  story: string;
  steps: QuestStep[];
  reward: { gold?: number; items?: { item: string; n: number }[]; xp?: { skill: SkillId; n: number }[]; unlock?: string; hero?: string };
  requires?: string;
  reqZone?: number;
  reqSkill?: { skill: SkillId; level: number };
}

export interface RarityDef {
  id: number;
  name: string;
  color: string;
  glow: string;
  mult: number;
  weight: number;
  affixes: number;
  value: number;
}

export type ActivityType = 'gather' | 'craft' | 'combat';
export interface ActivityState {
  type: ActivityType;
  id: string;
  progress: number;
  zone?: number;
  boss?: boolean;
}

export interface Settings {
  sfx: number;
  music: number;
  haptics: boolean;
  offlineNotice: boolean;
  numberFormat: 'short' | 'full';
  autoEat: number;
  autoPotion: boolean;
  reduceMotion: boolean;
  combatLog: boolean;
  autoSell: number;
}

export interface HeroState {
  id: string;
  level: number;
  xp: number;
  equip: Partial<Record<Slot, ItemInstance>>;
}

export interface BuffState {
  status: StatusId;
  potency: number;
  left: number;
  src: string;
}

export interface GameState {
  v: number;
  name: string;
  createdAt: number;
  lastSeen: number;
  playTime: number;
  clock: number;
  settings: Settings;
  skills: Record<SkillId, number>;
  skillXp: Record<SkillId, number>;
  heroes: HeroState[];
  stacks: Record<string, number>;
  gear: ItemInstance[];
  gold: number;
  gems: number;
  activity: ActivityState | null;
  zone: number;
  zoneUnlocked: number;
  kills: Record<string, number>;
  bossKills: Record<string, number>;
  loadout: { food: string | null; potion: string | null };
  buffs: BuffState[];
  xpBoost: { skill: SkillId | 'all'; pct: number; left: number } | null;
  quests: { done: string[]; active: string[]; progress: Record<string, number[]> };
  codex: { items: Record<string, 1>; monsters: Record<string, 1> };
  stats: Record<string, number>;
  uidSeq: number;
  tutorial: number;
  seed: number;
  achievements: string[];
  gatherCounts: Record<string, number>;
  /** Training Hall ranks bought with gold, per hero id. */
  hall: Record<string, number>;
}

export interface OfflineReport {
  seconds: number;
  capped: boolean;
  items: Record<string, number>;
  gear: ItemInstance[];
  gold: number;
  xp: Partial<Record<SkillId, number>>;
  kills: number;
  bossKills: number;
  wipes: number;
  actions: number;
  levelUps: { skill: SkillId; from: number; to: number }[];
  activityName: string;
}


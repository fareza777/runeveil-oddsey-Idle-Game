import type { Element, HeroDef, StatusId } from '@/core/types';

export interface ElementDef { id: Element; name: string; color: string; icon: string }

export const ELEMENTS: ElementDef[] = [
  { id: 'physical', name: 'Physical', color: '#cfcfd8', icon: 'item_sword_1' },
  { id: 'fire', name: 'Fire', color: '#ff7a3a', icon: 'relic_ember_stone' },
  { id: 'frost', name: 'Frost', color: '#7ad9ff', icon: 'relic_frost_stone' },
  { id: 'nature', name: 'Nature', color: '#6fd16a', icon: 'relic_venom_stone' },
  { id: 'shock', name: 'Shock', color: '#ffe27a', icon: 'relic_storm_stone' },
  { id: 'shadow', name: 'Shadow', color: '#a06cf0', icon: 'relic_night_stone' },
  { id: 'holy', name: 'Holy', color: '#fff3a8', icon: 'relic_sun_stone' },
  { id: 'arcane', name: 'Arcane', color: '#ff7ae0', icon: 'relic_void_lens' },
];
export const ELEMENT_MAP = Object.fromEntries(ELEMENTS.map((e) => [e.id, e])) as Record<Element, ElementDef>;

export interface StatusDef {
  id: StatusId;
  name: string;
  harm: boolean;
  color: string;
  glyph: string;
  desc: string;
  stacks?: boolean;
}

export const STATUSES: StatusDef[] = [
  { id: 'poison', name: 'Poison', harm: true, color: '#6fd16a', glyph: '☠', desc: 'Takes nature damage every second. Stacks.', stacks: true },
  { id: 'burn', name: 'Burn', harm: true, color: '#ff7a3a', glyph: '♨', desc: 'Takes fire damage every second.' },
  { id: 'bleed', name: 'Bleed', harm: true, color: '#e5414f', glyph: '✚', desc: 'Takes physical damage every second. Stacks.', stacks: true },
  { id: 'chill', name: 'Chill', harm: true, color: '#7ad9ff', glyph: '❄', desc: 'Attack speed reduced.' },
  { id: 'freeze', name: 'Freeze', harm: true, color: '#b9ecff', glyph: '❅', desc: 'Cannot act for a short time.' },
  { id: 'stun', name: 'Stun', harm: true, color: '#f2cf5a', glyph: '✦', desc: 'Cannot act for a short time.' },
  { id: 'shock', name: 'Shock', harm: true, color: '#ffe27a', glyph: '⚡', desc: 'Takes extra damage from the next hits.' },
  { id: 'curse', name: 'Curse', harm: true, color: '#a06cf0', glyph: '☾', desc: 'Healing received is reduced.' },
  { id: 'weaken', name: 'Weaken', harm: true, color: '#c9a35a', glyph: '▼', desc: 'Deals less damage.' },
  { id: 'blind', name: 'Blind', harm: true, color: '#8a8a96', glyph: '◉', desc: 'Attacks may miss.' },
  { id: 'vulnerable', name: 'Vulnerable', harm: true, color: '#ff8a8a', glyph: '✖', desc: 'Defense reduced.' },
  { id: 'slow', name: 'Slow', harm: true, color: '#8aa0ff', glyph: '⌛', desc: 'Attack speed greatly reduced.' },
  { id: 'regen', name: 'Regeneration', harm: false, color: '#5fe08a', glyph: '♥', desc: 'Restores health every second.' },
  { id: 'shield', name: 'Barrier', harm: false, color: '#9fd0ff', glyph: '◈', desc: 'Absorbs incoming damage.' },
  { id: 'haste', name: 'Haste', harm: false, color: '#ffd35a', glyph: '»', desc: 'Attack speed increased.' },
  { id: 'might', name: 'Might', harm: false, color: '#ff8a4a', glyph: '▲', desc: 'Deals more damage.' },
  { id: 'fortify', name: 'Fortify', harm: false, color: '#c9d0e0', glyph: '▣', desc: 'Defense increased.' },
  { id: 'thorns', name: 'Thorns', harm: false, color: '#8ae07a', glyph: '✱', desc: 'Reflects damage to attackers.' },
];
export const STATUS_MAP = Object.fromEntries(STATUSES.map((s) => [s.id, s])) as Record<StatusId, StatusDef>;

/** Damage multiplier when an attacker element hits a defender with weakness/resist. */
export const WEAK_MULT = 1.5;
export const RESIST_MULT = 0.6;

export const HEROES: HeroDef[] = [
  {
    id: 'kaelen', name: 'Kaelen Vance', cls: 'Vanguard', title: 'Blade of the Vale', style: 'melee', skill: 'combat',
    sprite: 'Character_01', color: '#e5614f', base: { atk: 10, def: 4, hp: 120, crit: 5, critDmg: 150, haste: 0, eva: 3, leech: 0, regen: 0.5, luck: 0, res: 0 },
    ability: { name: 'Cleaving Arc', cd: 9, kind: 'cleave', desc: 'A sweeping blow for 260% damage that also causes Bleed.' },
    bio: 'A wandering sellsword who swore to find the cause of the creeping Veil. Quick to laugh, slower to forgive.',
  },
  {
    id: 'sylra', name: 'Sylra Windmere', cls: 'Wayfinder', title: 'Eyes of the Wild', style: 'ranged', skill: 'marksmanship',
    sprite: 'Character_02', color: '#7fc46a', base: { atk: 9, def: 2, hp: 95, crit: 12, critDmg: 165, haste: 6, eva: 8, leech: 0, regen: 0.3, luck: 4, res: 0 },
    ability: { name: 'Gale Volley', cd: 8, kind: 'volley', desc: 'Looses five arrows for 70% damage each, each with bonus crit chance.' },
    bio: 'A scout from the high woods. She reads weather and footprints better than books.',
  },
  {
    id: 'orren', name: 'Orren Ashgrove', cls: 'Veilmage', title: 'Keeper of Embers', style: 'magic', skill: 'arcana',
    sprite: 'BlackMagusA', color: '#9a7cf0', base: { atk: 12, def: 1, hp: 80, crit: 8, critDmg: 160, haste: 2, eva: 2, leech: 0, regen: 0.2, luck: 2, res: 6 },
    ability: { name: 'Cinder Nova', cd: 10, kind: 'fireball', desc: 'A burst of flame for 300% fire damage that applies Burn.' },
    bio: 'A hooded scholar who hears the old runes whisper. He rarely shows his face, and never explains.',
  },
  {
    id: 'brynna', name: 'Brynna Stoneward', cls: 'Bulwark', title: 'Shield of the Pass', style: 'melee', skill: 'fortitude',
    sprite: 'Character_04', color: '#c9a35a', base: { atk: 7, def: 8, hp: 160, crit: 3, critDmg: 140, haste: -2, eva: 1, leech: 1, regen: 0.8, luck: 0, res: 4 },
    ability: { name: 'Bulwark Call', cd: 12, kind: 'shieldwall', desc: 'Raises a barrier on the whole party and draws enemy attacks for 6s.' },
    bio: 'She held a mountain gate alone for nine days. The gate is still standing.',
  },
  {
    id: 'mirel', name: 'Mirel Dawnsong', cls: 'Lightbinder', title: 'Hymn of First Light', style: 'magic', skill: 'arcana',
    sprite: 'Character_03', color: '#f2cf5a', base: { atk: 8, def: 3, hp: 100, crit: 4, critDmg: 145, haste: 1, eva: 4, leech: 0, regen: 1.2, luck: 3, res: 8 },
    ability: { name: 'Dawn Hymn', cd: 10, kind: 'heal', desc: 'Heals the whole party for 30% max HP and cleanses one harmful status.' },
    bio: 'A cleric of a lost sun-order. Where she sings, the Veil thins.',
  },
];
export const HERO_MAP = Object.fromEntries(HEROES.map((h) => [h.id, h]));

import type { Element, ItemDef, StatusId } from '@/core/types';
import { gearTierForLevel } from '@/core/balance';
import { econScale, zoneOfTier } from '@/core/money';
import { GEAR_TYPE_MAP, gearBase } from './gear';
import { add } from './items';
import { BOSSES } from './world';

/** [boss id, item name, gear type, icon, element, on-hit status] */
type U = [string, string, string, string, Element, StatusId, string];
const UNIQUES: U[] = [
  ['boss_1', "Thornking's Crown", 'helm', 'unique_hollow_crown', 'nature', 'poison', 'Crowned in the bramble that choked an orchard.'],
  ['boss_2', 'Hivequeen Signet', 'ring', 'unique_wasp_ring', 'nature', 'poison', 'Hums faintly when enemies are near.'],
  ['boss_3', 'Mossheart Charm', 'amulet', 'unique_mossheart', 'nature', 'poison', 'A heart of living moss that refuses to die.'],
  ['boss_4', 'Ironhorn Cleaver', 'mace', 'unique_gorehorn_axe', 'physical', 'stun', 'Every swing remembers an old order.'],
  ['boss_5', 'Venomtail Sting', 'dagger', 'unique_scorpion_tail', 'nature', 'poison', 'Still dripping, a century later.'],
  ['boss_6', "Sporelord's Lantern", 'amulet', 'unique_lantern_charm', 'shadow', 'blind', 'The light inside is not quite a flame.'],
  ['boss_7', "Admiral's Cutlass", 'sword', 'unique_maren_blade', 'frost', 'chill', 'Salt crusts the edge but never dulls it.'],
  ['boss_8', 'Rimewraith Crown', 'helm', 'unique_frost_crown', 'frost', 'freeze', 'Cold enough to quiet a battlefield.'],
  ['boss_9', 'Cinderstride Boots', 'boots', 'unique_magma_boots', 'fire', 'burn', 'Leave footprints that smolder for an hour.'],
  ['boss_10', "Archivist's Choir Bell", 'orb', 'unique_choir_bell', 'shadow', 'curse', 'Rings once for each name it keeps.'],
  ['boss_11', 'Empress Fang', 'dagger', 'unique_lamia_fang', 'nature', 'poison', 'Courtiers bowed. The fang did not.'],
  ['boss_12', 'Geode Heartplate', 'cuirass', 'unique_glacier_plate', 'arcane', 'vulnerable', 'Facets refract blows into somewhere else.'],
  ['boss_13', 'Stormbreaker', 'sword', 'unique_stormbreaker', 'shock', 'shock', 'Splits the sky on a clean hit.'],
  ['boss_14', "Marshal's Dawnblade", 'sword', 'unique_dawnblade', 'fire', 'burn', 'Forged to end a war that never ended.'],
  ['boss_15', 'Vampiric Signet', 'ring', 'unique_vamp_ring', 'shadow', 'bleed', 'Drinks deeply, and gives some back.'],
  ['boss_16', 'Dreamwalker Staff', 'staff', 'unique_chanter_staff', 'arcane', 'weaken', 'Whispers a lullaby to its target.'],
  ['boss_17', 'Earthshaker', 'mace', 'unique_earthshaker', 'physical', 'stun', 'The ground flinches first.'],
  ['boss_18', 'Midas Hammer', 'mace', 'unique_golden_hammer', 'holy', 'weaken', 'Everything it touches becomes heavier.'],
  ['boss_19', 'Voidfang Dagger', 'dagger', 'unique_void_dagger', 'arcane', 'vulnerable', 'Cuts a path through where things are.'],
  ['boss_20', 'Sunspear of the Warden', 'sword', 'unique_sunspear', 'holy', 'weaken', 'It remembers the stairway it guarded.'],
  ['boss_21', "Tidecaller's Shawl", 'cuirass', 'unique_desert_wind', 'frost', 'chill', 'Smells of deep water and old promises.'],
  ['boss_22', 'Eternity Band', 'ring', 'unique_eternity', 'arcane', 'vulnerable', 'A circle with no beginning and no end.'],
  ['wboss_1', 'Gauntlets of the Foundry', 'gloves', 'img:relic_gloves', 'fire', 'burn', 'Still warm from a forge that never cools.'],
  ['wboss_2', 'Winterheart Amulet', 'amulet', 'img:relic_frozen_heart', 'frost', 'freeze', 'A slow, steady pulse of ice.'],
  ['wboss_3', 'Rootwalker Boots', 'boots', 'unique_boots_hare', 'nature', 'poison', 'The ground makes room.'],
  ['wboss_4', 'Umbral Shroud', 'cuirass', 'unique_ghost_veil', 'shadow', 'curse', 'Stitched from what shadows leave behind.'],
  ['wboss_5', 'Starcaller Rod', 'staff', 'unique_starcaller', 'shock', 'shock', 'Draws lightning like a promise.'],
  ['wboss_6', 'Worldheart Reliquary', 'amulet', 'unique_worldheart', 'holy', 'weaken', 'A seed of the first dawn.'],
  ['boss_23', "Aethrion's Shard-Staff", 'staff', 'unique_starcaller', 'arcane', 'vulnerable', 'A splinter of the sky, still falling.'],
  ['boss_24', 'Glasstide Trident', 'sword', 'unique_dawnblade', 'fire', 'burn', 'Hot enough to write on water.'],
  ['boss_25', 'Regent\'s Ribcage Plate', 'cuirass', 'unique_glacier_plate', 'shadow', 'curse', 'Armor that still believes it is on duty.'],
  ['boss_26', 'Thicket Mother\'s Heart', 'amulet', 'unique_mossheart', 'nature', 'poison', 'Beats slowly, in time with something large.'],
  ['boss_27', 'Key of the Last Lock', 'ring', 'unique_eternity', 'shadow', 'blind', 'It opens nothing. That is the point.'],
  ['boss_28', 'Mirrortongue Dagger', 'dagger', 'unique_void_dagger', 'arcane', 'weaken', 'Repeats every wound it makes.'],
  ['boss_29', 'Wyrmbone Greaves', 'boots', 'unique_magma_boots', 'frost', 'freeze', 'Cold clings to every footprint.'],
  ['boss_30', 'Hundred-Hand Maul', 'mace', 'unique_earthshaker', 'shock', 'shock', 'Strikes a hundred times, once.'],
  ['boss_31', 'Hollow Sun Crown', 'helm', 'unique_frost_crown', 'holy', 'weaken', 'Gold, and nothing inside.'],
  ['boss_32', 'Quill of the Last Margin', 'staff', 'unique_chanter_staff', 'arcane', 'vulnerable', 'Writes only what has been erased.'],
  ['ue_1', 'Gnarlmaw Tooth', 'dagger', 'unique_scorpion_tail', 'nature', 'poison', 'Yellowed, ancient, still sharp.'],
  ['ue_2', 'Mirage Veil Spear', 'sword', 'unique_sunspear', 'fire', 'burn', 'Real only when it hits.'],
  ['ue_3', 'Rotbeard\'s Hook', 'sword', 'unique_maren_blade', 'frost', 'chill', 'Salted and smug.'],
  ['ue_4', 'Emberjaw Collar', 'amulet', 'unique_lantern_charm', 'fire', 'burn', 'Warm to the touch, loyal to no one.'],
  ['ue_5', 'Ssilith\'s Signet', 'ring', 'unique_lamia_fang', 'nature', 'poison', 'A crown made small.'],
  ['ue_6', 'Aurelle\'s Conduit', 'orb', 'unique_choir_bell', 'shock', 'shock', 'Hums just before the thunder.'],
  ['ue_7', 'Mourne\'s Evening Gloves', 'gloves', 'img:relic_gloves', 'shadow', 'curse', 'Silk, soft as a threat.'],
  ['ue_8', 'Twin Shard Aegis', 'shield', 'unique_golden_hammer', 'shadow', 'vulnerable', 'Shows you what you will do next.'],
  ['ue_9', 'Zhal\'s Paper Blade', 'dagger', 'unique_void_dagger', 'arcane', 'vulnerable', 'Thinner than a thought.'],
  ['ue_10', 'Nhal-Spawn Tooth Choker', 'amulet', 'unique_desert_wind', 'frost', 'chill', 'Hums with the sound of deep water.'],
  ['ue_11', 'Cindermaw Scepter', 'staff', 'unique_stormbreaker', 'fire', 'burn', 'A wish that never cools.'],
  ['ue_12', 'Rune of the Answering Word', 'ring', 'unique_eternity', 'arcane', 'vulnerable', 'It finishes your sentences.'],
];

for (const [bossId, name, typeKey, icon, element, apply, desc] of UNIQUES) {
  const boss = BOSSES[bossId];
  if (!boss) throw new Error('unknown boss ' + bossId);
  const type = GEAR_TYPE_MAP[typeKey];
  const t = Math.min(20, gearTierForLevel(boss.level) + 2);
  const base = gearBase(type, t);
  for (const k of Object.keys(base) as (keyof typeof base)[]) base[k] = Math.round((base[k] ?? 0) * 1.35 * 10) / 10;
  const def: ItemDef = {
    id: `uni_${bossId}`, name, kind: 'equip', tier: t, icon: `img:${icon.replace(/^(img:)?unique_(u_)?/, 'unique_u_')}`, value: Math.round(60 * Math.pow(1.3, t) * econScale(zoneOfTier(t))),
    slot: type.slot, style: type.style, weaponKind: type.slot === 'weapon' ? typeKey : undefined, base, element, apply, unique: true, desc, tag: typeKey,
  };
  add(def);
}

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
];

for (const [bossId, name, typeKey, icon, element, apply, desc] of UNIQUES) {
  const boss = BOSSES[bossId];
  if (!boss) throw new Error('unknown boss ' + bossId);
  const type = GEAR_TYPE_MAP[typeKey];
  const t = Math.min(20, gearTierForLevel(boss.level) + 2);
  const base = gearBase(type, t);
  for (const k of Object.keys(base) as (keyof typeof base)[]) base[k] = Math.round((base[k] ?? 0) * 1.35 * 10) / 10;
  const def: ItemDef = {
    id: `uni_${bossId}`, name, kind: 'equip', tier: t, icon: icon.startsWith('img:') ? icon : `img:${icon}`, value: Math.round(60 * Math.pow(1.3, t) * econScale(zoneOfTier(t))),
    slot: type.slot, style: type.style, weaponKind: type.slot === 'weapon' ? typeKey : undefined, base, element, apply, unique: true, desc, tag: typeKey,
  };
  add(def);
}

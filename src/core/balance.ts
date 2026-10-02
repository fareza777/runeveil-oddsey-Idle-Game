/** All difficulty tuning lives here so the data files stay free of magic numbers. */
export const BAL = {
  /** rarity a well-prepared player is expected to wield in zone z: round(expRarityBase + expRarityPerZone * z) */
  expRarityBase: 2,
  expRarityPerZone: 0.75,
  /** seconds the expected party needs to kill an average regular monster */
  killSeconds: 8,
  /** share of the party's total HP an average fight is meant to cost the expected party */
  fightLoss: 0.45,
  monsterDefShare: 0.25,
  defK: 0.8,
  bossHp: 6,
  bossAtk: 0.4,
  /** per-zone growth of monster hp/atk beyond zone 10, so late-game gear keeps mattering */
  lateGrowth: 0.02,
  eliteHp: 2.6,
  eliteAtk: 1.25,
  abilityDpsBonus: 1.2,
  /** monster hp/atk multiplier in zone 1; rises linearly to 1 by easeUntil so a fresh party can win */
  easeStart: 0.2,
  easeUntil: 6,
  /** fraction of the hero level a well-played character is assumed to have in the matching skill (expected-party model) */
  expSkillShare: 0.5,
  /** Training Hall: max ranks per hero, +2% atk/hp per rank, price base in silver */
  hallMaxRank: 20,
  hallPctPerRank: 2,
  /** Enemy packs: from this zone on, regular monsters arrive in groups of 1..packMax(zone). Extra members add this share of attack each. */
  packFromZone: 8,
  packAtk: 0.18,
  /** Giants: oversized regular monsters (hp/atk multipliers), appear from giantFromZone. */
  giantFromZone: 10,
  giantHp: 2.4,
  giantAtk: 1.2,
  /** Adaptive threat: enemies grow with (party power / expected power)^adapt, capped, so over-gearing still helps but never trivialises a zone. */
  adaptFromZone: 4,
  adapt: 0.5,
  adaptCap: 2.4,
  /** Named daily enemies, on top of the boss multipliers */
  rareHp: 2.2, rareAtk: 1.25, legendHp: 3.2, legendAtk: 1.5,
};

/** Largest pack a regular monster can arrive in. */
export const packMax = (zone: number): number => (zone < BAL.packFromZone ? 1 : Math.min(5, 1 + Math.floor((zone - 3) / 6)));
export const eliteChance = (zone: number): number => Math.min(0.12, 0.07 + 0.002 * zone);
export const giantChance = (zone: number): number => (zone < BAL.giantFromZone ? 0 : Math.min(0.12, 0.03 + 0.003 * (zone - BAL.giantFromZone)));

/** Silver price of the next Training Hall rank. */
export const hallCost = (rank: number): number => Math.round(1500 * 1.5 ** rank);

export const gearTierForLevel = (level: number): number => Math.max(1, Math.min(20, Math.round(1 + ((level - 1) * 19) / 99)));




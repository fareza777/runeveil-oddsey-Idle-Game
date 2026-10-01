/** All difficulty tuning lives here so the data files stay free of magic numbers. */
export const BAL = {
  /** rarity a well-prepared player is expected to wield in zone z: round(expRarityBase + expRarityPerZone * z) */
  expRarityBase: 2,
  expRarityPerZone: 0.9,
  /** seconds the expected party needs to kill an average regular monster */
  killSeconds: 8,
  /** share of the party's total HP an average fight is meant to cost the expected party */
  fightLoss: 0.24,
  monsterDefShare: 0.25,
  defK: 0.8,
  bossHp: 7,
  bossAtk: 0.5,
  eliteHp: 2.6,
  eliteAtk: 1.25,
  abilityDpsBonus: 1.2,
  /** monster hp/atk multiplier in zone 1; rises linearly to 1 by easeUntil so a fresh party can win */
  easeStart: 0.4,
  easeUntil: 5,
};

export const gearTierForLevel = (level: number): number => Math.max(1, Math.min(20, Math.round(1 + ((level - 1) * 19) / 99)));



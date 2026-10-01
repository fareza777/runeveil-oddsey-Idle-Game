import type { RarityDef } from '@/core/types';

const NAMES = [
  'Common', 'Uncommon', 'Fine', 'Rare', 'Superior', 'Exquisite', 'Epic', 'Heroic', 'Valiant', 'Legendary',
  'Relic', 'Ancient', 'Primal', 'Astral', 'Celestial', 'Ethereal', 'Runic', 'Divine', 'Transcendent', 'Immortal',
  'Eternal', 'Cosmic', 'Primordial', 'Genesis', 'Mythic',
];

const COLORS = [
  '#a8a8b0', '#6fd16a', '#4fd1b0', '#4f9bf0', '#5a7bff', '#a06cf0', '#c05cf0', '#e05cc0', '#f0607f', '#f5a52d',
  '#e8c13c', '#c9a15a', '#ff7a4a', '#7a8cff', '#7ad9ff', '#a9f0ff', '#58f0c8', '#ffe27a', '#ffb0ff', '#ff6a8a',
  '#ff4a4a', '#9a6aff', '#ff3ad0', '#fff3a8', '#ff5ae0',
];

export const RARITIES: RarityDef[] = NAMES.map((name, i) => ({
  id: i + 1,
  name,
  color: COLORS[i],
  glow: COLORS[i] + '88',
  mult: 1 + 0.1 * i + 0.004 * i * i,
  weight: 100 * Math.pow(0.58, i),
  affixes: Math.min(4, Math.floor(i / 6)),
  value: Math.round(Math.pow(1.45, i)),
}));

export const MAX_RARITY = RARITIES.length;
export const rarity = (r: number): RarityDef => RARITIES[Math.max(0, Math.min(MAX_RARITY - 1, r - 1))];

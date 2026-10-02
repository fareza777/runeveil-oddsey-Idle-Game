import type { CardDef, CardFx, CardKind, ItemDef, MonsterDef, Slot, StatusId } from '@/core/types';
import { seeded } from '@/core/rng';
import { gearTierForLevel } from '@/core/balance';
import { econScale } from '@/core/money';
import { add, ITEMS } from './items';
import { MONSTERS, STATUS_FOR_ELEMENT } from './world';

/** Card drop chances per kill. Tune here: common monsters 0.05% down to 0.02%, rarer enemies far less. */
export const CARD_RATE = { commonTop: 0.0005, commonBottom: 0.0002, elite: 0.0001, boss: 0.00005, world: 0.00002, unique: 0.000005 };

const GRADE_POWER = [0, 1, 1.5, 2.2, 3, 4];
export const GRADE_NAME = ['', 'Common', 'Elite', 'Boss', 'Calamity', 'Unique'];
export const KIND_NAME: Record<CardKind, string> = { weapon: 'Weapon', armor: 'Armor', trinket: 'Trinket' };

export const cardId = (monsterId: string): string => `card_${monsterId}`;
export const cardKindForSlot = (slot: Slot | undefined): CardKind | null => {
  if (!slot) return null;
  if (slot === 'weapon') return 'weapon';
  if (slot === 'neck' || slot === 'ring' || slot === 'rune') return 'trinket';
  return 'armor';
};

const gradeOf = (m: MonsterDef): number => (m.rare ? 5 : m.id.startsWith('wboss') ? 4 : m.boss ? 3 : m.elite ? 2 : 1);
const r1 = (n: number): number => Math.round(n * 10) / 10;

function fxFor(m: MonsterDef, kind: CardKind, grade: number): CardFx {
  const power = (0.6 + (0.4 * Math.min(32, m.zone)) / 32) * GRADE_POWER[grade];
  const natural: StatusId = m.inflicts?.status ?? STATUS_FOR_ELEMENT[m.element];
  const element: StatusId = STATUS_FOR_ELEMENT[m.element];
  if (kind === 'weapon') {
    return { atkPct: r1(3 * power), crit: r1(1.2 * power), proc: { status: natural, chance: Math.min(0.4, 0.04 + 0.02 * grade + 0.004 * power) } };
  }
  if (kind === 'armor') {
    return { defPct: r1(4 * power), hpPct: r1(3 * power), res: r1(1.6 * power), retaliate: { status: element, chance: Math.min(0.4, 0.05 + 0.02 * grade) } };
  }
  return { crit: r1(1.8 * power), luck: r1(2.5 * power), leech: r1(Math.min(3, 0.3 * power)), haste: r1(1.2 * power) };
}

const PCT_KEYS: [keyof CardFx, string, string][] = [
  ['atkPct', 'Attack', '%'], ['defPct', 'Defense', '%'], ['hpPct', 'Max HP', '%'], ['crit', 'Crit chance', '%'], ['critDmg', 'Crit damage', '%'],
  ['haste', 'Haste', '%'], ['eva', 'Evasion', '%'], ['leech', 'Life leech', '%'], ['regen', 'Regen', ''], ['luck', 'Luck', '%'], ['res', 'Resist', '%'],
];

/** Human readable lines for a card effect. */
export function describeFx(fx: CardFx): string[] {
  const out: string[] = [];
  for (const [k, label, unit] of PCT_KEYS) {
    const v = fx[k] as number | undefined;
    if (v) out.push(`+${v}${unit} ${label}`);
  }
  if (fx.proc) out.push(`${Math.round(fx.proc.chance * 100)}% chance to inflict ${fx.proc.status} on hit`);
  if (fx.retaliate) out.push(`${Math.round(fx.retaliate.chance * 100)}% chance to inflict ${fx.retaliate.status} on attackers`);
  return out;
}

export const CARD_IDS: string[] = [];

for (const m of Object.values(MONSTERS)) {
  const grade = gradeOf(m);
  const r = seeded(`card:${m.id}`);
  const roll = r();
  const kind: CardKind = roll < 0.4 ? 'weapon' : roll < 0.8 ? 'armor' : 'trinket';
  const card: CardDef = { monster: m.id, kind, fx: fxFor(m, kind, grade), grade };
  const id = cardId(m.id);
  const def: ItemDef = {
    id, name: `${m.name} Card`, kind: 'card', tier: gearTierForLevel(m.level), icon: `card:${m.id}`,
    value: Math.round(1500 * Math.pow(3, grade) * econScale(Math.min(32, m.zone))), tag: 'card', card,
    desc: `${GRADE_NAME[grade]} ${KIND_NAME[kind]} card. ${describeFx(card.fx).join('. ')}.`,
  };
  add(def);
  CARD_IDS.push(id);
  let chance: number;
  if (grade === 1) {
    const idx = Math.max(1, Number(m.id.split('_')[2]) || 1);
    chance = CARD_RATE.commonTop - ((CARD_RATE.commonTop - CARD_RATE.commonBottom) * (idx - 1)) / 12;
  } else chance = grade === 2 ? CARD_RATE.elite : grade === 3 ? CARD_RATE.boss : grade === 4 ? CARD_RATE.world : CARD_RATE.unique;
  m.drops.push({ item: id, chance });
}

export const cardDef = (id: string): CardDef | undefined => ITEMS[id]?.card;

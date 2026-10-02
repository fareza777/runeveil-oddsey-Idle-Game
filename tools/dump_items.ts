import { ITEMS } from '../src/data';
const ids = Object.keys(ITEMS);
const pick = (re: RegExp) => ids.filter((i) => re.test(i)).map((i) => `${i}|${ITEMS[i].name}|${ITEMS[i].icon}`);
console.log(ids.length);
for (const re of [/^ore_/, /^bar_/, /^relic_/, /^ess_/, /^scroll_/, /^gem_/, /^rune_/, /^eq_sword_(1|10|20)$/, /^meal_(0|1)$/]) console.log(pick(re).join('\n'));
const kinds: Record<string, number> = {}; for (const i of ids) { const k = i.replace(/_.*$/, ''); kinds[k] = (kinds[k] ?? 0) + 1; }
console.log(JSON.stringify(kinds));

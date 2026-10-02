import { GATHER } from '../src/data';
import { xpAtLevel } from '../src/core/xp';
function hours(skill: string, targets: number[]) {
  const nodes = GATHER.filter((g) => g.skill === skill);
  let xp = 0, t = 0, lv = 1; const out: string[] = [];
  const tl = [...targets];
  while (tl.length && t < 1e8) {
    const avail = nodes.filter((n) => n.level <= lv);
    const best = avail.sort((a, b) => b.xp / b.time - a.xp / a.time)[0];
    xp += best.xp; t += best.time;
    while (xpAtLevel(lv + 1) <= xp && lv < 99) lv++;
    if (lv >= tl[0]) { out.push(`L${tl[0]}=${(t / 3600).toFixed(1)}h`); tl.shift(); }
  }
  return out.join(' ');
}
for (const s of ['mining', 'woodcutting', 'fishing', 'farming']) console.log(s, hours(s, [10, 25, 50, 75, 99]));

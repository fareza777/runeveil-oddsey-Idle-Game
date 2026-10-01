import { BOSS_LIST, ZONES } from '../src/data';
import { writeFileSync } from 'node:fs';
const b = BOSS_LIST.map((x: any) => ({ id: x.id, name: x.name, title: x.title, lore: x.lore, element: x.element, zone: x.zone, family: x.family }));
const z = ZONES.map((x: any) => ({ id: x.id, key: x.key, name: x.name, desc: x.desc, color: x.color, bg: x.bg }));
writeFileSync('tools/.cache/world_dump.json', JSON.stringify({ b, z }, null, 1));
console.log(b.length, z.length);

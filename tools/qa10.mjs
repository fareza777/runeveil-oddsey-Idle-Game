// QA part 2: merchant stocked (fake clock sweep), bench swap, mythic zone battle, craft odds.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const URL = 'http://localhost:5174/?ads=sim';
const b = await puppeteer.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: 'new', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
const errs = [];
const save = JSON.parse(fs.readFileSync('qa/save.json', 'utf8'));
save.zone = 28; save.zoneUnlocked = 32;
for (const h of save.heroes) h.level = 99;
save.bench = [{ id: 'vex', level: 60, xp: 0, equip: {} }, { id: 'thessaly', level: 55, xp: 0, equip: {} }];
save.gold = 5e7; save.gems = 500; save.lastSeen = Date.now();
save.activity = null;
async function open(hour) {
  const p = await b.newPage();
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  p.on('pageerror', (e) => errs.push('pageerror ' + e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await p.evaluateOnNewDocument((hour) => {
    const real = Date.now; const d0 = new Date(); const t = new Date(d0.getFullYear(), d0.getMonth(), d0.getDate(), Math.floor(hour), (hour % 1) * 60, 0).getTime();
    const off = t - real();
    const RD = Date;
    class FD extends RD { constructor(...a) { if (a.length) super(...a); else super(real() + off); } static now() { return real() + off; } }
    window.Date = FD;
  }, hour);
  await p.goto(URL, { waitUntil: 'networkidle0' });
  await p.evaluate((s) => localStorage.setItem('runeveil.save.v1', s), JSON.stringify(save));
  await p.goto(URL, { waitUntil: 'networkidle0' }); await sleep(900);
  return p;
}
const click = async (p, t, sel = 'button, .card.tap, .cell, .slotbox, .skillcard, .tap') => {
  const ok = await p.evaluate((t, s) => { const e = [...document.querySelectorAll(s)].find((x) => x.textContent.toLowerCase().includes(t.toLowerCase()) && x.offsetParent); if (e) { e.click(); return true; } return false; }, t, sel);
  if (!ok) console.log('!! not found:', t); await sleep(500); return ok;
};
let p;
for (let h = 8.3; h < 22; h += 1) {
  p = await open(h);
  await click(p, 'Continue'); await sleep(1500);
  await click(p, 'Battle', '.nav button'); await sleep(1000);
  await click(p, 'Merchant');
  const open_ = await p.evaluate(() => /Buy|Extend|ends in|Closes/i.test(document.querySelector('.overlay')?.textContent ?? ''));
  console.log('hour', h.toFixed(1), 'open', open_);
  if (open_) break;
  await p.close();
}
await p.screenshot({ path: 'qa/v3b_merchant.png' });
await p.evaluate(() => { const o = document.querySelector('.overlay .sheet, .overlay'); o && o.scrollTo?.(0, 400); });
await p.evaluate(() => document.querySelectorAll('.overlay').forEach((o) => o.remove()));
await sleep(300);
await p.screenshot({ path: 'qa/v3b_battle28.png' });
await click(p, 'Heroes', '.nav button'); await sleep(500);
await p.evaluate(() => document.querySelectorAll('.herotabs button')[5].click()); await sleep(500);
await p.screenshot({ path: 'qa/v3b_bench_hero.png' });
await click(p, 'Swap into'); await sleep(500);
await p.screenshot({ path: 'qa/v3b_swap.png' });
await p.evaluate(() => document.querySelectorAll('.overlay').forEach((o) => o.remove())); await click(p, 'Skills', '.nav button'); await sleep(400);
await click(p, 'Smithing', '.skillcard'); await sleep(600);
await p.evaluate(() => { const s = document.querySelector('.screen'); s && (s.scrollTop = 600); });
await p.screenshot({ path: 'qa/v3b_smith.png' });
console.log('ERRORS:\n' + errs.join('\n')); await b.close();


// QA: battle animation frames + the one-hour daily hunt (fake clock sweep).
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const URL = 'http://localhost:5174/?ads=sim';
const b = await puppeteer.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: 'new', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
const errs = [];
const save = JSON.parse(fs.readFileSync('qa/save.json', 'utf8'));
save.zone = 6; save.zoneUnlocked = 32;
for (const h of save.heroes) h.level = 60;
for (const k of Object.keys(save.skills)) save.skills[k] = 90; save.skillXp = {}; save.gold = 5e7; save.lastSeen = Date.now(); save.activity = null;
async function open(hour) {
  const p = await b.newPage();
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  p.on('pageerror', (e) => errs.push('pageerror ' + e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await p.evaluateOnNewDocument((hour) => {
    const real = Date.now; const d0 = new Date(); const t = new Date(d0.getFullYear(), d0.getMonth(), d0.getDate(), Math.floor(hour), (hour % 1) * 60, 0).getTime();
    const off = t - real(); const RD = Date;
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
let p = await open(12);
await click(p, 'Continue'); await sleep(1500);
await click(p, 'Battle', '.nav button'); await sleep(500);
await click(p, 'Battle!'); 
for (let i = 0; i < 6; i++) { await sleep(900); await p.screenshot({ path: `qa/v4_fight${i}.png`, clip: { x: 0, y: 70, width: 390, height: 400 } }); }
await p.close();

let live = false;
for (let h = 7.2; h < 23; h += 1) {
  p = await open(h);
  await click(p, 'Continue'); await sleep(1200);
  await click(p, 'Battle', '.nav button'); await sleep(600);
  live = await p.evaluate(() => [...document.querySelectorAll('button')].some((x) => x.textContent.includes('LIVE')));
  console.log('hour', h.toFixed(1), 'live', live);
  if (live) break;
  await p.close();
}
if (live) {
  await click(p, 'LIVE'); await sleep(1500);
  await p.screenshot({ path: 'qa/v4_hunt_live.png' });
  await click(p, 'Hunt now'); await sleep(1500);
  for (let i = 0; i < 4; i++) { await sleep(1000); await p.screenshot({ path: `qa/v4_hunt_fight${i}.png`, clip: { x: 0, y: 70, width: 390, height: 400 } }); }
} else {
  p = await open(3);
  await click(p, 'Continue'); await sleep(1000);
  await click(p, 'Battle', '.nav button'); await sleep(500);
  await click(p, 'Daily hunt');
  await p.screenshot({ path: 'qa/v4_hunt_closed.png' });
}
console.log('ERRORS:\n' + errs.join('\n')); await b.close();

// QA: onboarding through the first craft (auto chain) + Auto Plan sheet.
import puppeteer from 'puppeteer-core';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const URL = 'http://localhost:5174/?ads=sim';
const b = await puppeteer.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: 'new', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
const errs = [];
const p = await b.newPage();
await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
p.on('pageerror', (e) => errs.push('pageerror ' + e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
const click = async (t, sel = 'button, .card.tap, .cell, .slotbox, .skillcard, .tap') => {
  const ok = await p.evaluate((t, s) => { const e = [...document.querySelectorAll(s)].find((x) => x.textContent.toLowerCase().includes(t.toLowerCase()) && x.offsetParent); if (e) { e.click(); return true; } return false; }, t, sel);
  if (!ok) console.log('!! not found:', t); await sleep(500); return ok;
};
const shot = (n) => p.screenshot({ path: `qa/v5_${n}.png` });
const hint = () => p.evaluate(() => document.querySelector('.hint')?.textContent ?? '(none)');
await p.goto(URL, { waitUntil: 'networkidle0' });
await p.evaluate(() => localStorage.clear());
await p.goto(URL, { waitUntil: 'networkidle0' }); await sleep(1000);
await shot('title');
console.log('buttons:', await p.evaluate(() => [...document.querySelectorAll('button')].filter((x) => x.offsetParent).map((x) => x.textContent.trim()).join(' | ')));
await click('New'); await sleep(800); await shot('after_new');
console.log('buttons:', await p.evaluate(() => [...document.querySelectorAll('button')].filter((x) => x.offsetParent).map((x) => x.textContent.trim()).join(' | ')));
for (let k = 0; k < 12; k++) { if (!(await click('Skip'))) break; }
await sleep(800); console.log('buttons:', await p.evaluate(() => [...document.querySelectorAll('button')].filter((x) => x.offsetParent).map((x) => x.textContent.trim()).join(' | ')));
await click('Start Adventure'); await sleep(2000); console.log('buttons:', await p.evaluate(() => [...document.querySelectorAll('button')].filter((x) => x.offsetParent).map((x) => x.textContent.trim()).join(' | '))); await shot('home');
let last = '';
for (let i = 0; i < 40; i++) {
  const hh = await hint();
  if (hh !== last) { console.log('t', i, 'hint:', hh); await shot('hint' + i); last = hh; }
  if (hh.startsWith('Welcome')) { await click('Battle!'); await sleep(8000); }
  else if (hh.includes('Go')) { await click('Go', '.hint .btn'); await sleep(2500); }
  else await sleep(2000);
}
await shot('end');
console.log('state', await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('runeveil.save.v1') || '{}'); return JSON.stringify({ tut: s.tutorial, act: s.activity, made: s.stats?.crafts }); }));
console.log('ERRORS:\n' + errs.join('\n')); await b.close();




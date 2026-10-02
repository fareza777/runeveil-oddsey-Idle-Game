// QA: Auto Plan sheet, start, action bar tag, stop.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const URL = 'http://localhost:5174/?ads=sim';
const b = await puppeteer.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: 'new', args: ['--no-sandbox'] });
const errs = [];
const save = JSON.parse(fs.readFileSync('qa/save.json', 'utf8'));
save.lastSeen = Date.now(); save.activity = null; save.plan = null; save.tutorial = 99;
const p = await b.newPage();
await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
p.on('pageerror', (e) => errs.push('pageerror ' + e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
await p.goto(URL, { waitUntil: 'networkidle0' });
await p.evaluate((s) => localStorage.setItem('runeveil.save.v1', s), JSON.stringify(save));
await p.goto(URL, { waitUntil: 'networkidle0' }); await sleep(900);
const click = async (t, sel = 'button, .card.tap, .cell, .slotbox, .skillcard, .tap') => {
  const ok = await p.evaluate((t, s) => { const e = [...document.querySelectorAll(s)].find((x) => x.textContent.toLowerCase().includes(t.toLowerCase()) && x.offsetParent); if (e) { e.click(); return true; } return false; }, t, sel);
  if (!ok) console.log('!! not found:', t); await sleep(600); return ok;
};
const shot = (n) => p.screenshot({ path: `qa/v5_${n}.png` });
await click('Continue'); await sleep(1200);
await click('Battle', '.nav button'); await sleep(500);
await shot('battle_btns');
await click('Auto plan'); await sleep(600);
await shot('plan_sheet');
await click('Add step'); await sleep(400);
await shot('plan_sheet2');
await click('Start plan'); await sleep(2500);
await shot('plan_running');
console.log('actbar:', await p.evaluate(() => document.querySelector('.actbar')?.textContent));
await click('Auto plan'); await sleep(600);
await shot('plan_status');
await click('Stop plan'); await sleep(800);
await sleep(1500); console.log('after stop:', await p.evaluate(() => [...document.querySelectorAll('button')].filter((x) => x.offsetParent).map((x) => x.textContent.trim()).join(' | '))); await shot('after_stop');
console.log('ERRORS:\n' + errs.join('\n')); await b.close();



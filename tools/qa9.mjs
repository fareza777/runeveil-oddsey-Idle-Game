// QA for the v3 features: bench/swap, cards, sockets, hunts, merchant, rewards, craft odds, intro VO.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const URL = 'http://localhost:5174/?ads=sim';
const b = await puppeteer.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: 'new', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
const p = await b.newPage();
await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const errs = []; p.on('pageerror', (e) => errs.push('pageerror ' + e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
p.on('response', (r) => { if (r.status() >= 400) errs.push('HTTP ' + r.status() + ' ' + r.url()); });
const shot = async (n) => { await p.screenshot({ path: `qa/v3_${n}.png` }); console.log('shot', n); };
const click = async (t, sel = 'button, .card.tap, .cell, .slotbox, .skillcard, .tap') => {
  const ok = await p.evaluate((t, s) => { const e = [...document.querySelectorAll(s)].find((x) => x.textContent.toLowerCase().includes(t.toLowerCase()) && x.offsetParent); if (e) { e.click(); return true; } return false; }, t, sel);
  if (!ok) console.log('!! not found:', t); await sleep(500); return ok;
};
const nav = (t) => click(t, '.nav button');
const closeSheet = async () => { await p.evaluate(() => document.querySelectorAll('.overlay').forEach((o) => o.remove())); await sleep(200); };

// 1. intro with VO
await p.goto(URL, { waitUntil: 'networkidle0' }); await p.evaluate(() => localStorage.clear()); await p.goto(URL, { waitUntil: 'networkidle0' });
await sleep(800); await click('New Game'); await sleep(2500);
await shot('01_intro');
console.log('vo words', await p.evaluate(() => document.querySelectorAll('.vw').length));
await click('Skip'); await sleep(1200);

// 2. rich save
const save = JSON.parse(fs.readFileSync('qa/save.json', 'utf8'));
save.zone = 26; save.zoneUnlocked = 32;
for (const h of save.heroes) h.level = 90;
save.bench = [{ id: 'vex', level: 60, xp: 0, equip: {} }, { id: 'thessaly', level: 55, xp: 0, equip: {} }];
save.stacks.card_m_1_1 = 2; save.stacks.card_m_5_3 = 1; save.stacks.card_ue_10 = 1; save.stacks.card_m_20_2 = 3;
save.cardsFound = { card_m_1_1: 2, card_m_5_3: 1, card_ue_10: 1, card_m_20_2: 3 };
save.gold = 5e7; save.gems = 500; save.lastSeen = Date.now() - 40 * 60 * 1000;
await p.evaluate((s) => localStorage.setItem('runeveil.save.v1', s), JSON.stringify(save));
await p.goto(URL, { waitUntil: 'networkidle0' }); await sleep(1200);
await click('Continue'); await sleep(2500);
await shot('02_after_continue');
await click('Collect'); await sleep(800); await shot('03_offline');
await closeSheet();
await click('Battle', '.nav button'); await sleep(5000); await shot('04_battle');
await click('Daily hunts'); await shot('05_hunts'); await closeSheet();
await click('Merchant'); await shot('06_merchant'); await closeSheet();
await nav('Heroes'); await shot('07_heroes');
await click('Vex'); await shot('08_vex'); 
await click('Join'); await sleep(500); await shot('09_swapsheet'); await closeSheet();
await nav('Bag'); await shot('10_bag');
await click('Cards'); await shot('11_cards');
await p.evaluate(() => document.querySelector('.grid.bag .slotbox')?.click()); await sleep(500); await shot('12_card_detail'); await closeSheet();
await nav('Skills'); await click('Smithing', '.skillcard'); await sleep(600); await shot('13_smithing');
await nav('More'); await shot('14_more');
await click('Card album'); await shot('15_album'); await closeSheet();
await click('Wandering merchant'); await shot('16_merchant_more'); await closeSheet();
console.log('ERRORS:\n' + errs.join('\n')); await b.close();

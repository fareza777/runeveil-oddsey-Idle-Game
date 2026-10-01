// Headless-Chrome smoke test + screenshots. Usage: node tools/qa.mjs [url] [outDir]
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

const URL = process.argv[2] ?? 'http://localhost:5174/';
const OUT = process.argv[3] ?? 'qa';
const CHROME = process.env.CHROME ?? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
fs.mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const errors = [];
page.on('response', (r) => { if (r.status() >= 400) errors.push('HTTP ' + r.status() + ' ' + r.url()); });
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

const shot = async (name) => { await page.screenshot({ path: `${OUT}/${name}.png` }); console.log('shot', name); };
const clickText = async (text, sel = 'button') => {
  const ok = await page.evaluate((t, s) => {
    const el = [...document.querySelectorAll(s)].reverse().find((e) => e.textContent.trim().toLowerCase().includes(t.toLowerCase()));
    if (el) { el.click(); return true; }
    return false;
  }, text, sel);
  if (!ok) console.log('!! not found:', text);
  await sleep(350);
  return ok;
};

await page.goto(URL, { waitUntil: 'networkidle0' });
await sleep(1500);
await shot('01_splash');
await clickText('New Game');
await sleep(500);
await shot('02_onboarding');
await clickText('Skip');
await sleep(300);
await shot('03_name');
await page.type('input.field', 'Tester');
await clickText('Start Adventure');
await sleep(1500);
await shot('04_battle_idle');
await clickText('Battle!');
await sleep(9000);
await shot('05_battle');
for (const tab of ['Skills', 'Heroes', 'Bag', 'Quests', 'More']) {
  await page.evaluate((t) => { [...document.querySelectorAll('.nav button')].find((b) => b.textContent.includes(t)).click(); }, tab);
  await sleep(600);
  await shot('06_' + tab.toLowerCase());
}
console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'no console errors');
await browser.close();

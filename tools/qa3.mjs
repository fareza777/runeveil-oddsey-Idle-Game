import puppeteer from 'puppeteer-core';
const URL='http://localhost:5174/';
const CHROME='C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
const only=process.argv.slice(2);
const b=await puppeteer.launch({executablePath:CHROME,headless:'new',args:['--no-sandbox']});
const p=await b.newPage();
await p.setViewport({width:390,height:844,deviceScaleFactor:2,isMobile:true,hasTouch:true});
const errs=[];
p.on('pageerror',e=>errs.push('pageerror: '+e.message));
p.on('response',r=>{if(r.status()>=400)errs.push('HTTP '+r.status()+' '+r.url())});
p.on('console',m=>{if(m.type()==='error')errs.push('console: '+m.text())});
await p.goto(URL,{waitUntil:'networkidle0'});
await p.evaluate(()=>localStorage.clear());
await p.goto(URL,{waitUntil:'networkidle0'});
const click=(sel,t)=>p.evaluate((sel,t)=>{const e=[...document.querySelectorAll(sel)].find(b=>b.textContent.includes(t)&&b.offsetParent);if(e){e.click();return true}return false},sel,t);
await sleep(800);
await click('button','New Game'); await sleep(500);
await click('button','Skip'); await sleep(1500); await click('button','Start Adventure'); await sleep(2000);
await p.screenshot({path:'qa/s_start.png'});
const names=await (async()=>{await click('.nav button','Skills');await sleep(500);return p.evaluate(()=>[...document.querySelectorAll('.skillcard')].map(c=>c.textContent.trim().slice(0,20)))})();
console.log(names.join(' | '));
for(const n of names){
  const key=n.replace(/^Lv \d+/,'').trim();
  if(only.length&&!only.some(o=>key.toLowerCase().includes(o)))continue;
  await click('.nav button','Skills');await sleep(300);
  await p.evaluate(()=>document.querySelector('.nav button.on')?.click());
  await click('.skillcard',key);await sleep(500);
  await click('button','Start');await sleep(1800);
  const el=await p.$('.scene');
  if(!el){console.log('no scene for',key);continue}
  await el.screenshot({path:`qa/sc_${key.toLowerCase().replace(/\W/g,'')}.png`});
}
console.log(errs.slice(0,20).join('\n'));
await b.close();



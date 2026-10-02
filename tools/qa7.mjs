import puppeteer from 'puppeteer-core';
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
const b=await puppeteer.launch({executablePath:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',headless:'new',args:['--no-sandbox']});
const p=await b.newPage();
await p.setViewport({width:390,height:844,deviceScaleFactor:2,isMobile:true,hasTouch:true});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
const URL='http://localhost:5174/';
await p.goto(URL,{waitUntil:'networkidle0'});await p.evaluate(()=>localStorage.clear());await p.goto(URL,{waitUntil:'networkidle0'});
const click=(sel,t)=>p.evaluate((sel,t)=>{const e=[...document.querySelectorAll(sel)].find(b=>b.textContent.includes(t)&&b.offsetParent);if(e){e.click();return true}return false},sel,t);
await sleep(800);await click('button','New Game');await sleep(400);await click('button','Skip');await sleep(1200);await click('button','Start Adventure');await sleep(2000);
await p.screenshot({path:'qa/s0.png'});
await click('.nav button','Quests');await sleep(800);await p.screenshot({path:'qa/s1.png'});
console.log('go1',await click('button','Go'));
for (let k=0;k<4;k++){ await sleep(2500); await p.screenshot({path:`qa/s${2+k}.png`}); }
console.log(errs.join('\n'));await b.close();

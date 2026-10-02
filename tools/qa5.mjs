import puppeteer from 'puppeteer-core';
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
const b=await puppeteer.launch({executablePath:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',headless:'new',args:['--no-sandbox']});
const p=await b.newPage();
await p.setViewport({width:390,height:844,deviceScaleFactor:2,isMobile:true,hasTouch:true});
p.on('response',r=>{if(r.url().includes('eq_'))console.log(r.status(),r.url())});
const URL='http://localhost:5174/';
await p.goto(URL,{waitUntil:'networkidle0'});await p.evaluate(()=>localStorage.clear());await p.goto(URL,{waitUntil:'networkidle0'});
const click=(sel,t)=>p.evaluate((sel,t)=>{const e=[...document.querySelectorAll(sel)].find(b=>b.textContent.includes(t)&&b.offsetParent);if(e){e.click();return true}return false},sel,t);
await sleep(800);await click('button','New Game');await sleep(400);await click('button','Skip');await sleep(1200);await click('button','Start Adventure');await sleep(2000);
await click('.nav button','Heroes');await sleep(1500);
await p.screenshot({path:'qa/h1.png'});console.log(await p.evaluate(()=>[...document.querySelectorAll('.cell img, .slotbox img')].map(i=>i.src.split('/').pop()+' '+i.naturalWidth+'x'+i.naturalHeight+' '+i.getBoundingClientRect().width).join('\n')));
await b.close();


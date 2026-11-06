// r36 Enhanced long browser run (Claude, Nov 2026). One desktop Watch duel with the AI selector on Enhanced (experimental),
// run until turn >= minTurn, the duel ends, or the time limit. Records the turn label every 30 s, page errors, the banner,
// and a screenshot at the end. Usage: node tools/r36-enhanced-long-browser.mjs <url> <outdir> [minTurn=6] [minutes=40] [seed=71007] [a=branded] [b=sky]
import {createRequire} from 'node:module';import fs from 'node:fs';const require=createRequire(import.meta.url);
const {chromium}=require('/opt/npm-tools/node_modules/playwright');
const [url,out,minTurn='6',mins='40',seed='71007',a='branded',b='sky']=process.argv.slice(2);fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch(/^https:/.test(url)&&process.env.HTTPS_PROXY?{proxy:{server:process.env.HTTPS_PROXY}}:{});/* live site: through the container proxy */const ctx=await browser.newContext({viewport:{width:1366,height:900}});const p=await ctx.newPage();
const errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
const report={url,minTurn:+minTurn,minutes:+mins,seed:+seed,decks:[a,b],samples:[],errors};const t0=Date.now();
await p.goto(url);await p.waitForFunction(()=>document.querySelector('#start')&&!document.querySelector('#start').disabled,null,{timeout:120000});
await p.evaluate(([seed,a,b])=>{const $=s=>document.querySelector(s);$('#deck-a').value=a;$('#deck-a').dispatchEvent(new Event('change'));$('#deck-b').value=b;$('#deck-b').dispatchEvent(new Event('change'));$('#mode').value='watch';$('#mode').dispatchEvent(new Event('change'));$('#ai-mode').value='enhanced';$('#ai-mode').dispatchEvent(new Event('change'));$('#game-seed').value=seed;$('#first').value='0';$('#start').click()},[seed,a,b]);
const state=()=>p.evaluate(()=>{const t=document.querySelector('#turn-label')?.textContent||'';const m=t.match(/(\d+)/);return {turn:t,n:m?+m[1]:0,title:document.querySelector('#decision-title')?.textContent||'',banner:document.querySelector('#match-study')?.textContent||'',over:!!document.querySelector('#duel-summary')}});
let s;for(;;){await p.waitForTimeout(30000);s=await state();report.samples.push({sec:Math.round((Date.now()-t0)/1000),...s});
 if(s.n>=+minTurn||s.over||Date.now()-t0>+mins*60000)break}
report.final=s;report.reachedTurn=s.n;report.ended=s.over;report.wallSec=Math.round((Date.now()-t0)/1000);
await p.screenshot({path:out+'/enhanced-long.png'});fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,1));
console.log(JSON.stringify({reachedTurn:report.reachedTurn,ended:report.ended,wallSec:report.wallSec,errors:errors.length,banner:s.banner.slice(0,160)}));await browser.close();

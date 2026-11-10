// r43 browser smoke: node smoke-r43.mjs <url> <theme> <mode watch|play> <pace> <secs> <out.png> [w h]
import {chromium} from '/workspace/tools-pw/node_modules/playwright-core/index.mjs';
const [,,URL,THEME,MODE,PACE,SECS,OUT,W='1280',H='800']=process.argv;
const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
const ctx=await b.newContext({viewport:{width:+W,height:+H}});
await ctx.addInitScript(({t,pace})=>{const k='doctrine-lab-media-v2';const p=JSON.parse(localStorage.getItem(k)||'{}');if(!p.__s){Object.assign(p,{theme:t,preset:pace,__s:1});if(t!=='aurora'){p.auroraIntro=1;p.showtimeIntro=1}localStorage.setItem(k,JSON.stringify(p))}},{t:THEME,pace:PACE});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push('pageerror '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push('console '+m.text())});
await p.goto(URL);await p.waitForFunction(()=>!document.querySelector('#start').disabled,null,{timeout:180000});
const theme=await p.evaluate(()=>document.body.dataset.theme);
await p.selectOption('#mode',MODE);await p.fill('#game-seed','4242');await p.click('#start');
const t0=Date.now();let answered=0,lastChange=Date.now(),lastSig='',maxStall=0,finished=false,turn='';
while(Date.now()-t0<+SECS*1000){await p.waitForTimeout(500);
 const s=await p.evaluate(()=>({sig:(document.querySelector('#turn-label')?.textContent||'')+'|'+document.querySelectorAll('#event-log li').length+'|'+(document.querySelector('#decision-title')?.textContent||''),turn:document.querySelector('#turn-label')?.textContent,fin:document.querySelector('#victory-scene')?.open||/complete/i.test(document.querySelector('#active-turn')?.textContent||'')}));
 turn=s.turn;if(s.fin){finished=true;break}
 if(s.sig!==lastSig){lastSig=s.sig;lastChange=Date.now()}else maxStall=Math.max(maxStall,Date.now()-lastChange);
 if(MODE==='play'){const n=await p.evaluate(()=>{const vis=e=>e&&e.offsetParent!==null;const c=[...document.querySelectorAll('#choices button:not([disabled]), .chain-prompt button:not([disabled])')].filter(vis);if(!c.length){const o=document.querySelector('#cue-open');if(vis(o)&&/View actions/.test(o.textContent))o.click();return 0}const pass=c.find(b=>/no, do not|pass|end turn|don.t|skip/i.test(b.textContent));(pass||c[c.length-1]).click();return 1}).catch(()=>0);answered+=n;
  if(!n)await p.evaluate(()=>{const b=document.querySelector('#confirm');if(b&&b.offsetParent)b.click()}).catch(()=>{})}}
await p.screenshot({path:OUT});
console.log(JSON.stringify({THEME,theme,MODE,PACE,finished,turn,answered,maxStallMs:maxStall,errs:errs.slice(0,5)}));await b.close();

// r44 home shots: node shots-r44.mjs <url> <outdir> <tag>
import {chromium} from '/workspace/tools-pw/node_modules/playwright-core/index.mjs';
const [,,URL,OUT,TAG='local']=process.argv;
const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
const res=[];
for(const [name,w,h,mobile] of [['desktop',1280,800,false],['phone',390,844,true]]){
 const ctx=await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:mobile?2:1,isMobile:mobile,hasTouch:mobile});
 const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push('pageerror '+e.message));p.on('console',m=>{if(m.type()==='error')errs.push('console '+m.text())});
 await p.goto(URL,{waitUntil:'networkidle'});await p.waitForFunction(()=>!document.querySelector('#start').disabled,null,{timeout:180000});
 await p.evaluate(()=>{const d=document.querySelector('dialog[open]');if(d)d.close()});await p.waitForTimeout(1200);await p.evaluate(()=>{const n=document.querySelector('#notice');if(n){n.querySelector('button')?.click();n.hidden=true}});
 await p.waitForTimeout(1500);
 const info=await p.evaluate(()=>({theme:document.body.dataset.theme,tiles:[...document.querySelectorAll('.deck-tile')].map(t=>{const i=t.querySelector('img');return {deck:t.dataset.deck,boss:t.dataset.boss,img:i?.getAttribute('src'),cls:i?.className,loaded:!!(i&&i.complete&&i.naturalWidth>0),bg:getComputedStyle(t,'::before').backgroundImage.slice(0,80)}})}));
 await p.screenshot({path:`${OUT}/${TAG}-${name}-home.png`});
 const g=await p.$('#deck-grid');if(g){await g.scrollIntoViewIfNeeded();await p.waitForTimeout(600);await g.screenshot({path:`${OUT}/${TAG}-${name}-deck-grid.png`})}
 res.push({name,w,h,errs,...info});await ctx.close();
}
console.log(JSON.stringify(res,null,1));await b.close();

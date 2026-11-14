// r61 prototype: reach decisions in Play mode, optionally inject a CSS file, screenshot the first N decision states.
const {chromium}=require('playwright');const fs=require('fs');const [url,out,vpName,cssFile,n]=process.argv.slice(2);
const VPS={phone:{width:412,height:915,m:true},tab:{width:1280,height:900},land:{width:844,height:390,m:true},z150:{width:569,height:400,dsf:1.5,m:true},s8:{width:1138,height:712}};
(async()=>{const b=await chromium.launch();const vp=VPS[vpName];const ctx=await b.newContext({viewport:{width:vp.width,height:vp.height},deviceScaleFactor:vp.dsf||1,hasTouch:!!vp.m,isMobile:!!vp.m});
 const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(url);await p.waitForFunction(()=>document.querySelector('#start')&&!document.querySelector('#start').disabled,null,{timeout:240000});
 if(cssFile&&cssFile!=='-')await p.addStyleTag({content:fs.readFileSync(cssFile,'utf8')});
 await p.evaluate(o=>{for(const [k,v] of Object.entries(o)){const n=document.querySelector(k);if(!n)continue;n.value=v;n.dispatchEvent(new Event('change',{bubbles:true}))}},{'#mode':'play','#deck-a':'branded','#deck-b':'kashtira','#seat':'0','#game-seed':'71055','#first':'0'});
 await p.evaluate(()=>document.querySelector('#start').click());await p.waitForTimeout(3000);await p.evaluate(()=>document.querySelector('#portrait-continue')?.click());
 let shots=0;const t0=Date.now();const R=[];
 while(shots<Number(n||4)&&Date.now()-t0<300000){
  const s=await p.evaluate(()=>{const vis=e=>{if(!e)return null;const cs=getComputedStyle(e);if(e.hidden||cs.display==='none'||cs.visibility==='hidden')return null;const r=e.getBoundingClientRect();return r.width>2&&r.height>2?[r.left,r.top,r.right,r.bottom].map(Math.round):null};
   const bs=[...document.querySelectorAll('#choices button')].filter(x=>!x.disabled&&vis(x));return {cls:document.body.className,scale:getComputedStyle(document.body).getPropertyValue('--stage-scale')||getComputedStyle(document.documentElement).getPropertyValue('--stage-scale'),n:bs.length,title:document.querySelector('#decision-title')?.textContent,screen:document.querySelector('#duel').dataset.screen,cue:document.querySelector('#cue-owner')?.textContent,dec:vis(document.querySelector('#duel .decision-column')),board:vis(document.querySelector('#arena-scroll')),cueBox:vis(document.querySelector('.field-cue')),bar:vis(document.querySelector('#pc-bar')),ret:vis(document.querySelector('#arena-return'))}});
  if(/COMPLETE/.test(s.cue||''))break;
  if(s.n){R.push(s);await p.screenshot({path:`${out}/${vpName}-${++shots}.png`});
   await p.evaluate(()=>{const bs=[...document.querySelectorAll('#choices button')].filter(n=>!n.disabled&&!n.dataset.inspect);const want=[/Activate/,/Special Summon/,/Normal Summon/,/./];let j=null;for(const w of want){j=bs.find(x=>w.test(x.innerText.trim()));if(j)break}j?.click()});await p.waitForTimeout(500);
   await p.evaluate(()=>{const c=document.querySelector('#confirm');if(c&&!c.disabled&&c.offsetParent!==null)c.click()});await p.waitForTimeout(500);continue}
  if(s.cue==='YOUR DECISION'&&s.title&&!/Get ready|Continuing|Preparing/.test(s.title)){await p.evaluate(()=>document.querySelector('#cue-open')?.click());await p.waitForTimeout(400);continue}
  await p.waitForTimeout(300)}
 console.log(JSON.stringify({errors,R}).replace(/\},\{/g,'},\n{'));await b.close()})();

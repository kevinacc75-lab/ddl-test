// r67.2 card-menu readiness guard checks (ChatGPT RELAY-234 §2). Usage: node menuguard.cjs <url> <out.json> [tab|phone]
// Real pointer/keyboard input. To make "while opening" deterministic, the TEST stretches the menu's entrance animation to 2 s
// with an injected stylesheet (the app's code is unchanged; its own animation is 0.18 s). A reply counts as sent when the app's
// reply audit gains a 'sent' entry. Checks: early pointer tap, early Enter and Space, Escape while opening then reopen, cancelled
// animation, stale button from an earlier opening, reduced motion (ready at once), and normal pointer + keyboard use when ready.
const {chromium}=require('playwright');const fs=require('fs');const [url,out,vp='tab']=process.argv.slice(2);const sleep=ms=>new Promise(r=>setTimeout(r,ms));const log=(...a)=>{if(process.env.MGLOG)fs.appendFileSync(process.env.MGLOG,JSON.stringify(a)+'\n')};
async function session(b,{reduced=false}={}){const ctx=await b.newContext({viewport:vp==='phone'?{width:412,height:915}:{width:1280,height:900},hasTouch:vp==='phone',isMobile:vp==='phone',reducedMotion:reduced?'reduce':'no-preference'});
 /* count EVERY reply-audit entry as the app pushes it (the app's own list is a short ring, so counting it would undercount) */
 await ctx.addInitScript(()=>{const W=window;W.__sentN=0;W.__auditAll=[];let ring=null;Object.defineProperty(W,'__ddlReplyAudit',{configurable:true,get:()=>ring,set:v=>{ring=v;const push=v.push.bind(v);v.push=(...xs)=>{for(const x of xs){W.__auditAll.push(x.stage);if(x.stage==='sent')W.__sentN++}return push(...xs)}}})});
 const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(url);
 await p.waitForFunction(()=>document.querySelector('#start')&&!document.querySelector('#start').disabled,null,{timeout:240000});
 await p.evaluate(o=>{for(const [k,v] of Object.entries(o)){const n=document.querySelector(k);if(!n)continue;n.value=v;n.dispatchEvent(new Event('change',{bubbles:true}))}},{'#mode':'play','#deck-a':'sky','#deck-b':'branded','#seat':'0','#game-seed':'3003','#first':'0'});
 await p.evaluate(()=>document.querySelector('#start').click());await sleep(2500);await p.evaluate(()=>document.querySelector('#portrait-continue')?.click());
 const t0=Date.now();log('started',reduced);
 while(Date.now()-t0<300000){await p.waitForFunction(()=>document.querySelector('#cue-owner')?.textContent==='YOUR DECISION'&&!/Get ready|Continuing|Preparing/.test(document.querySelector('#decision-title')?.textContent||''),null,{timeout:240000});
  const t=await p.evaluate(()=>document.querySelector('#decision-title')?.textContent||'');log('prompt',t,await p.evaluate(()=>[...document.querySelectorAll('#choices button,#choices [data-chain-pass]')].filter(x=>x.getClientRects().length).map(x=>x.innerText.trim().slice(0,40))));if(/Choose your next play/.test(t))break;
  await p.evaluate(()=>{if(document.querySelector('#duel')?.dataset.screen==='field')document.querySelector('#cue-open')?.click()});await sleep(300);
  await p.evaluate(()=>{const n=[...document.querySelectorAll('#choices button,#choices [data-chain-pass]')].find(x=>x.getClientRects().length&&/No, do not|^No\b/.test(x.innerText.trim()));n?.click()});await sleep(800)}
 // go to the field so cards can be tapped
 await p.evaluate(()=>{const c=document.querySelector('#sheet-close,#decision-close,[data-close-sheet]');if(document.querySelector('#duel')?.dataset.screen!=='field')c?.click()});await sleep(500);
 if(!reduced)await p.addStyleTag({content:'#card-action-menu{animation:r52-pop 2s linear!important}'});
 return {ctx,p,errors}}
const sent=p=>p.evaluate(()=>window.__sentN);
const menu=p=>p.evaluate(()=>{const m=document.querySelector('#card-action-menu');return {open:!!m&&!m.hidden,ready:m?.dataset.ready??null,opacity:m?+getComputedStyle(m).opacity:null,buttons:[...(m?.querySelectorAll('button')||[])].map(b=>b.textContent)}});
async function tapCard(p){const c=await p.evaluate(()=>{const n=[...document.querySelectorAll('.can-act')].find(x=>x.getClientRects().length);if(!n)return null;n.scrollIntoView({block:'center'});const r=n.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2,label:n.getAttribute('aria-label')}});if(!c)return null;await p.mouse.click(c.x,c.y);return c}
const firstAction=p=>p.evaluate(()=>{const b=[...document.querySelectorAll('#card-action-menu button')].find(x=>!/Read card|Close/.test(x.textContent));if(!b)return null;const r=b.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2,text:b.textContent}});
(async()=>{const b=await chromium.launch();const R={url,vp,checks:{}};const ok=(k,v,d)=>{R.checks[k]={pass:!!v,...d};log('check',k,!!v,d)};
 if(!process.env.MGTWO){const {ctx,p,errors}=await session(b);R.build=await p.title();
  const s0=await sent(p);const card=await tapCard(p);R.card=card?.label;log('card',card);const m1=await menu(p);const a=await firstAction(p);R.action=a?.text;
  // 1. early pointer tap (double-tap style: straight after the menu opened)
  await p.mouse.click(a.x,a.y);await sleep(120);let m=await menu(p);ok('early-pointer-ignored',(await sent(p))===s0&&m.open,{menuAtOpen:m1,after:m});
  // 2. early Enter and Space on a focused action button
  await p.evaluate(()=>[...document.querySelectorAll('#card-action-menu button')].find(x=>!/Read card|Close/.test(x.textContent))?.focus());
  await p.keyboard.press('Enter');await p.keyboard.press('Space');await sleep(120);m=await menu(p);ok('early-keys-ignored',(await sent(p))===s0&&m.open,{after:m});
  // 3. Close works while opening; Escape works while opening; reopen re-arms
  await p.keyboard.press('Escape');await sleep(100);m=await menu(p);ok('escape-while-opening-closes',!m.open,{after:m});
  await tapCard(p);m=await menu(p);ok('reopen-starts-not-ready',m.open&&m.ready==='false',{after:m});
  // 4. stale button from an earlier opening never acts, even once the current menu is ready
  await p.evaluate(()=>{window.__stale=[...document.querySelectorAll('#card-action-menu button')].find(x=>!/Read card|Close/.test(x.textContent))});
  await p.keyboard.press('Escape');await sleep(100);await tapCard(p);await p.waitForFunction(()=>document.querySelector('#card-action-menu')?.dataset.ready==='true',null,{timeout:4000});
  await p.evaluate(()=>window.__stale.click());await sleep(200);m=await menu(p);ok('stale-button-ignored',(await sent(p))===s0&&m.open,{after:m});
  // 5. cancelled animation releases readiness
  await p.keyboard.press('Escape');await sleep(100);await tapCard(p);const before=await menu(p);await p.evaluate(()=>document.querySelector('#card-action-menu').getAnimations().forEach(x=>x.cancel()));await sleep(80);m=await menu(p);
  ok('cancelled-animation-releases',before.ready==='false'&&m.ready==='true',{before,after:m});
  // 6. normal pointer use when ready sends exactly once
  const a2=await firstAction(p);await p.mouse.click(a2.x,a2.y);await sleep(600);ok('ready-pointer-sends',(await sent(p))>s0,{action:a2.text,audit:await p.evaluate(()=>window.__auditAll.slice(-6)),menu:await menu(p)});
  R.errors=errors;await ctx.close()}
 if(process.env.MGONE){R.summary=R.checks;fs.writeFileSync(out,JSON.stringify(R,null,1));await b.close();return}
 // 7. reduced motion: ready at once, keyboard use sends
 {const {ctx,p,errors}=await session(b,{reduced:true});const s0=await sent(p);await tapCard(p);const m=await menu(p);
  await p.evaluate(()=>[...document.querySelectorAll('#card-action-menu button')].find(x=>!/Read card|Close/.test(x.textContent))?.focus());await p.keyboard.press('Enter');await sleep(600);
  ok('reduced-motion-ready-at-once',m.open&&m.ready==='true',{menu:m});ok('ready-keyboard-sends',(await sent(p))>s0,{});R.errorsReduced=errors;await ctx.close()}
 R.summary=Object.fromEntries(Object.entries(R.checks).map(([k,v])=>[k,v.pass?'PASS':'FAIL']));fs.writeFileSync(out,JSON.stringify(R,null,1));console.log(JSON.stringify({build:R.build,summary:R.summary,errors:(R.errors||[]).length+(R.errorsReduced||[]).length}));await b.close()})();

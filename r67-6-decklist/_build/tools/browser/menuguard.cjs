// Card-menu readiness guard checks. r67.2 (ChatGPT RELAY-234 §2), extended in r67.3 (RELAY-236 §3).
// Usage: node menuguard.cjs <url> <out.json> [tab|phone]
// Real pointer/keyboard input. To make "while opening" deterministic the TEST stretches the menu's entrance animation with an
// injected stylesheet (the app's own animation is 0.18 s; the app code is untouched). Every reply-audit entry is counted as the app
// pushes it. Manual and automatic answers are told apart the way the app records them: automatic entries carry a `setting` field.
// "Exactly one" checks require exactly one new MANUAL attempted entry and exactly one new MANUAL sent entry with the same id.
// Not covered natively here: "Attack anyway" (the attack-caution menu) and a stale menu after a new prompt is drawn; both are
// guarded by the same generation check (static test R67.2-5) but are not reached by this script.
const {chromium}=require('playwright');const fs=require('fs');const [url,out,vp='tab']=process.argv.slice(2);const sleep=ms=>new Promise(r=>setTimeout(r,ms));const log=(...a)=>{if(process.env.MGLOG)fs.appendFileSync(process.env.MGLOG,JSON.stringify(a)+'\n')};
async function session(b,{reduced=false}={}){const ctx=await b.newContext({viewport:vp==='phone'?{width:412,height:915}:{width:1280,height:900},hasTouch:vp==='phone',isMobile:vp==='phone',reducedMotion:reduced?'reduce':'no-preference'});
 await ctx.addInitScript(()=>{const W=window;W.__aud=[];let ring=null;Object.defineProperty(W,'__ddlReplyAudit',{configurable:true,get:()=>ring,set:v=>{ring=v;const push=v.push.bind(v);W.__kind=new Map();v.push=(...xs)=>{for(const x of xs){/* a drained send carries no setting field: take manual/automatic from that reply id's first entry */if(!W.__kind.has(x.id))W.__kind.set(x.id,!('setting' in x));W.__aud.push({id:x.id,stage:x.stage,manual:W.__kind.get(x.id),route:x.route??null})}return push(...xs)}}})});
 const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(url);
 await p.waitForFunction(()=>document.querySelector('#start')&&!document.querySelector('#start').disabled,null,{timeout:240000});
 await p.evaluate(o=>{for(const [k,v] of Object.entries(o)){const n=document.querySelector(k);if(!n)continue;n.value=v;n.dispatchEvent(new Event('change',{bubbles:true}))}},{'#mode':'play','#deck-a':'sky','#deck-b':'branded','#seat':'0','#game-seed':'3003','#first':'0'});
 await p.evaluate(()=>document.querySelector('#start').click());await sleep(2500);await p.evaluate(()=>document.querySelector('#portrait-continue')?.click());
 const t0=Date.now();log('started',reduced);
 while(Date.now()-t0<300000){await p.waitForFunction(()=>document.querySelector('#cue-owner')?.textContent==='YOUR DECISION'&&!/Get ready|Continuing|Preparing/.test(document.querySelector('#decision-title')?.textContent||''),null,{timeout:240000});
  const t=await p.evaluate(()=>document.querySelector('#decision-title')?.textContent||'');log('prompt',t);if(/Choose your next play/.test(t))break;
  await p.evaluate(()=>{if(document.querySelector('#duel')?.dataset.screen==='field')document.querySelector('#cue-open')?.click()});await sleep(300);
  await p.evaluate(()=>{const n=[...document.querySelectorAll('#choices button,#choices [data-chain-pass]')].find(x=>x.getClientRects().length&&/No, do not|^No\b/.test(x.innerText.trim()));n?.click()});await sleep(800)}
 await p.evaluate(()=>{const c=document.querySelector('#sheet-close,#decision-close,[data-close-sheet]');if(document.querySelector('#duel')?.dataset.screen!=='field')c?.click()});await sleep(500);
 await p.evaluate(()=>{const s=document.createElement('style');s.id='mg-style';document.head.append(s)})/* test-only stylesheet, empty until a check fills it */;
 return {ctx,p,errors}}
const style=(p,css)=>p.evaluate(c=>{document.querySelector('#mg-style').textContent=c},css);
const STRETCH='#card-action-menu{animation:r52-pop 2s linear!important}';
const counts=p=>p.evaluate(()=>{const a=window.__aud;return {sent:a.filter(x=>x.stage==='sent').length,manualAttempted:a.filter(x=>x.manual&&x.stage==='attempted').length,manualSent:a.filter(x=>x.manual&&x.stage==='sent').length,n:a.length}});
const since=(p,n)=>p.evaluate(n=>window.__aud.slice(n),n);
const menu=p=>p.evaluate(()=>{const m=document.querySelector('#card-action-menu');return {open:!!m&&!m.hidden,ready:m?.dataset.ready??null,opacity:m?+getComputedStyle(m).opacity:null,buttons:[...(m?.querySelectorAll('button')||[])].map(b=>b.textContent)}});
const modalOpen=p=>p.evaluate(()=>!!document.querySelector('dialog[open]'));
async function tapCard(p){const c=await p.evaluate(()=>{const n=[...document.querySelectorAll('.can-act')].find(x=>x.getClientRects().length);if(!n)return null;n.scrollIntoView({block:'center'});const r=n.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2,label:n.getAttribute('aria-label')}});if(!c)return null;await p.mouse.click(c.x,c.y);return c}
const btn=(p,re)=>p.evaluate(src=>{const re=new RegExp(src);const b=[...document.querySelectorAll('#card-action-menu button')].find(x=>re.test(x.textContent));if(!b)return null;const r=b.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2,text:b.textContent}},re.source);
const ACTION=/^(?!Read card|Close).+/;
const focusAction=p=>p.evaluate(()=>[...document.querySelectorAll('#card-action-menu button')].find(x=>!/Read card|Close/.test(x.textContent))?.focus());
const reopen=async p=>{await p.keyboard.press('Escape');await sleep(120);await tapCard(p);await sleep(30)};
const unchanged=(a,b)=>a.sent===b.sent&&a.manualAttempted===b.manualAttempted;
async function exactlyOneManual(p,c0,act){await act();await sleep(900);const c1=await counts(p),tail=await since(p,c0.n);const man=tail.filter(x=>x.manual);
 const ids=[...new Set(man.map(x=>x.id))];const ok=c1.manualAttempted===c0.manualAttempted+1&&c1.manualSent===c0.manualSent+1&&ids.length===1&&man.some(x=>x.stage==='sent'&&x.id===ids[0]);
 return {ok,manual:man,automaticSent:tail.filter(x=>!x.manual&&x.stage==='sent').length}}
(async()=>{const b=await chromium.launch();const R={url,vp,checks:{}};const ok=(k,v,d)=>{R.checks[k]={pass:!!v,...d};log('check',k,!!v,d)};
 if(!process.env.MGTWO){const {ctx,p,errors}=await session(b);R.build=await p.title();await style(p,STRETCH);
  const c0=await counts(p);const card=await tapCard(p);R.card=card?.label;const m1=await menu(p);const a=await btn(p,ACTION);R.action=a?.text;
  await p.mouse.click(a.x,a.y);await sleep(120);let m=await menu(p);ok('early-pointer-ignored',unchanged(await counts(p),c0)&&m.open,{menuAtOpen:m1,after:m});
  await focusAction(p);await p.keyboard.press('Enter');await sleep(100);m=await menu(p);ok('early-enter-ignored',unchanged(await counts(p),c0)&&m.open&&m.ready==='false',{after:m});
  await focusAction(p);await p.keyboard.press('Space');await sleep(100);m=await menu(p);ok('early-space-ignored',unchanged(await counts(p),c0)&&m.open&&m.ready==='false',{after:m});
  const rc=await btn(p,/^Read card$/);if(rc){await p.mouse.click(rc.x,rc.y);await sleep(150);m=await menu(p);ok('early-read-card-ignored',!(await modalOpen(p))&&m.open,{after:m})}else ok('early-read-card-ignored',false,{why:'no Read card button'});
  const cl=await btn(p,/Close/);await p.mouse.click(cl.x,cl.y);await sleep(120);m=await menu(p);ok('close-while-opening-closes',!m.open,{after:m});
  await tapCard(p);await sleep(30);await p.keyboard.press('Escape');await sleep(120);m=await menu(p);ok('escape-while-opening-closes',!m.open,{after:m});
  await tapCard(p);await sleep(30);m=await menu(p);ok('reopen-starts-not-ready',m.open&&m.ready==='false',{after:m});
  await p.evaluate(()=>{window.__stale=[...document.querySelectorAll('#card-action-menu button')].find(x=>!/Read card|Close/.test(x.textContent))});
  await reopen(p);await p.waitForFunction(()=>document.querySelector('#card-action-menu')?.dataset.ready==='true',null,{timeout:4000});
  await p.evaluate(()=>window.__stale.click());await sleep(200);m=await menu(p);ok('stale-button-ignored',unchanged(await counts(p),c0)&&m.open,{after:m});
  // time cap with a 10 s entrance: at the cap the entrance is finished first, so it is fully visible when it becomes usable
  await style(p,'#card-action-menu{animation:r52-pop 10s linear!important}');await reopen(p);await sleep(1500);const mid=await menu(p);await sleep(2000);m=await menu(p);
  ok('long-animation-cap-finishes-then-enables',mid.ready==='false'&&m.ready==='true'&&m.opacity>=0.95,{mid,after:m});
  // a menu still invisible at the cap stays inert; Close still works
  await style(p,'#card-action-menu{animation:r52-pop 10s linear!important;opacity:0!important}');await reopen(p);await sleep(3600);m=await menu(p);
  const ia=await btn(p,ACTION);await p.mouse.click(ia.x,ia.y);await sleep(150);const after=await menu(p);
  ok('invisible-at-cap-stays-inert',m.ready==='false'&&unchanged(await counts(p),c0)&&after.open,{atCap:m,after});
  await p.keyboard.press('Escape');await sleep(120);ok('escape-closes-inert-menu',!(await menu(p)).open,{});
  await style(p,STRETCH);await tapCard(p);await sleep(30);const before=await menu(p);await p.evaluate(()=>document.querySelector('#card-action-menu').getAnimations().forEach(x=>x.cancel()));await sleep(80);m=await menu(p);
  ok('cancelled-animation-releases',before.ready==='false'&&m.ready==='true',{before,after:m});
  const cr=await counts(p);const a2=await btn(p,ACTION);const r=await exactlyOneManual(p,cr,()=>p.mouse.click(a2.x,a2.y));ok('ready-pointer-sends-exactly-one-manual',r.ok,{action:a2.text,...r});
  R.errors=errors;await ctx.close()}
 if(process.env.MGONE){R.summary=R.checks;fs.writeFileSync(out,JSON.stringify(R,null,1));await b.close();return}
 {const {ctx,p,errors}=await session(b,{reduced:true});await tapCard(p);const m=await menu(p);ok('reduced-motion-ready-at-once',m.open&&m.ready==='true',{menu:m});
  const c0=await counts(p);await focusAction(p);const r=await exactlyOneManual(p,c0,()=>p.keyboard.press('Enter'));ok('ready-keyboard-sends-exactly-one-manual',r.ok,r);R.errorsReduced=errors;await ctx.close()}
 R.summary=Object.fromEntries(Object.entries(R.checks).map(([k,v])=>[k,v.pass?'PASS':'FAIL']));fs.writeFileSync(out,JSON.stringify(R,null,1));console.log(JSON.stringify({build:R.build,summary:R.summary,errors:(R.errors||[]).length+(R.errorsReduced||[]).length}));await b.close()})();

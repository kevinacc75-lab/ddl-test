// r63 route check v2 (ChatGPT RELAY-218 §2 items 1–5). Version string printed in every result. v1 kept as route-check-v1.cjs.
// Oracle: the decision is identified at INPUT time, synchronously, by a capture-phase listener on every click/keydown:
//   - which control was hit (route: sheet / card-menu / quick-bar / phase / card-tap / Space / other),
//   - whether that control was hit-testable at that instant (in the viewport, not inert, not disabled, and the element at
//     its centre is the control or inside it: catches off-screen, hidden, covered or inert controls),
//   - the rendered prompt identity the page reports (body[data-rendered-rev], set by app.mjs when it draws a human prompt).
// Every worker reply is paired with the app's own reply audit entry (window.__ddlReplyAudit: route, ok, revision, rendered
// revision) and with the last input. An answer is UNSEEN if it is manual and either (a) its revision was not the rendered
// revision at input time, or (b) the control was not hit-testable. Automatic and add-on answers are listed by label.
// Stray inputs: during "Get ready…/Continuing…" a Space keydown + #pc-pass click every 20 ms; while a sheet is open, Space
// with body focus, asserting that it changes neither the reply count nor the rendered revision.
// Raw logs (inputs, replies, audit) are written to <out>.json. The picker clicks with a real pointer at the control's
// position (page.mouse.click), so the browser's own hit-testing applies.
// Usage: node route-check.cjs <url> <deckA> <deckB> <seed> <phone|tab> <seconds> <out>
const VERSION='route-check v2 (r63)';
const {chromium}=require('playwright');const fs=require('fs');const [url,deckA,deckB,seed,vpName,secs,out]=process.argv.slice(2);
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:vpName==='phone'?{width:412,height:915}:{width:1280,height:900},hasTouch:vpName==='phone',isMobile:vpName==='phone'});
 await ctx.addInitScript(()=>{const W=window;W.__inputs=[];W.__sent=[];W.__spaceOpen={n:0,changed:0};
  const placeholder=t=>/^(Get ready…|Continuing…|Preparing the duel…)$/.test(t||'');
  const hit=el=>{if(!el)return {ok:false,why:'none'};if(el.disabled)return {ok:false,why:'disabled'};if(el.closest('[inert]'))return {ok:false,why:'inert'};const r=el.getBoundingClientRect();if(!r.width||!r.height)return {ok:false,why:'no box'};
   if(r.bottom<=0||r.right<=0||r.top>=innerHeight||r.left>=innerWidth)return {ok:false,why:'off-screen'};const cx=Math.min(Math.max(r.left+r.width/2,0),innerWidth-1),cy=Math.min(Math.max(r.top+r.height/2,0),innerHeight-1);const at=document.elementFromPoint(cx,cy);
   if(!at||!(at===el||el.contains(at)||at.contains(el)))return {ok:false,why:'covered by '+(at?.id||String(at?.className||'').slice(0,40)||at?.tagName)};const cs=getComputedStyle(el);if(cs.visibility==='hidden'||+cs.opacity<.05)return {ok:false,why:'invisible'};return {ok:true}};
  const route=t=>!t?.closest?'other':t.closest('#choices,#selection-bar')?'sheet':t.closest('#card-action-menu')?'card-menu':t.closest('#pc-bar')?'quick-bar':t.closest('#phase-tracker')?'phase':t.closest('[data-slot],#my-hand')?'card-tap':(t.id||t.tagName);
  const rec=(type,t,extra={})=>{const ctl=t?.closest?.('button,[role=button],[data-slot],[data-hand-sequence]')||t;W.__inputs.push({t:performance.now(),type,trusted:extra.trusted,route:route(t),rendered:document.body.dataset.renderedRev??null,title:document.querySelector('#decision-title')?.textContent,hit:type==='keydown'?{ok:null}:hit(ctl),...extra});if(W.__inputs.length>20000)W.__inputs.shift()};
  document.addEventListener('click',e=>rec('click',e.target,{trusted:e.isTrusted}),true);
  document.addEventListener('keydown',e=>{if(e.code==='Space')rec('keydown',document.activeElement,{key:'Space',trusted:e.isTrusted})},true);
  setInterval(()=>{const t=document.querySelector('#decision-title')?.textContent;
   if(placeholder(t)&&t!=='Preparing the duel…'){document.dispatchEvent(new KeyboardEvent('keydown',{code:'Space',key:' ',bubbles:true}));document.querySelector('#pc-pass')?.click()}
   else if(document.querySelector('#duel')?.dataset.screen==='play'&&[...document.querySelectorAll('#choices button')].some(x=>!x.disabled&&x.getClientRects().length)){
    document.activeElement?.blur?.();const before=W.__sent.length,rev=document.body.dataset.renderedRev;W.__spaceOpen.n++;document.dispatchEvent(new KeyboardEvent('keydown',{code:'Space',key:' ',bubbles:true}));
    setTimeout(()=>{if(W.__sent.length!==before)W.__spaceOpen.changed++},0)/* counts only answers sent right after the Space (a new prompt arriving is not a change caused by Space) */}},20);
  const pm=Worker.prototype.postMessage;Worker.prototype.postMessage=function(m,...a){try{if(m&&m.type==='reply'){const audit=(W.__ddlReplyAudit||[]).filter(x=>x.ok).at(-1)||null;const inp=W.__inputs.at(-1)||null;
   W.__sent.push({t:performance.now(),rev:m.revision,rt:m.response?.type,idx:m.response?.index,title:document.querySelector('#decision-title')?.textContent,audit,lastInput:inp,inputAgeMs:inp?Math.round(performance.now()-inp.t):null})}}catch(e){W.__sent.push({err:String(e)})}return pm.call(this,m,...a)}});
 const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(url);await p.waitForFunction(()=>document.querySelector('#start')&&!document.querySelector('#start').disabled,null,{timeout:240000});
 const build=await p.evaluate(()=>document.title);
 await p.evaluate(o=>{for(const [k,v] of Object.entries(o)){const n=document.querySelector(k);if(!n)continue;n.value=v;n.dispatchEvent(new Event('change',{bubbles:true}))}},{'#mode':'play','#deck-a':deckA,'#deck-b':deckB,'#seat':'0','#game-seed':seed,'#first':'0'});
 await p.evaluate(()=>document.querySelector('#start').click());await p.waitForTimeout(2500);await p.evaluate(()=>document.querySelector('#portrait-continue')?.click());
 let decisions=0;const t0=Date.now(),limit=1000*Number(secs||240);
 while(Date.now()-t0<limit){
  const s=await p.evaluate(()=>({t:document.querySelector('#decision-title')?.textContent,cue:document.querySelector('#cue-owner')?.textContent,screen:document.querySelector('#duel')?.dataset.screen,n:[...document.querySelectorAll('#choices button')].filter(x=>!x.disabled&&!x.dataset.inspect&&x.getClientRects().length).length}));
  if(/COMPLETE/.test(s.cue||''))break;
  if(s.cue==='YOUR DECISION'&&!/Get ready|Continuing|Preparing/.test(s.t||'')){
   if(!s.n&&s.screen==='field'&&(decisions%2===0)){/* card-tap route: tap a playable card on the field/hand, then the first action in its menu */
    const card=await p.evaluate(()=>{const n=[...document.querySelectorAll('.can-act')].find(x=>x.getClientRects().length);if(!n)return null;n.scrollIntoView({block:'center'});const r=n.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2}});
    if(card){decisions++;await p.mouse.click(card.x,card.y);await p.waitForTimeout(250);const mb=await p.evaluate(()=>{const b=[...document.querySelectorAll('#card-action-menu button')].find(x=>x.getClientRects().length&&!/Read card|Close/.test(x.textContent));if(!b)return null;const r=b.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2}});if(mb)await p.mouse.click(mb.x,mb.y);else await p.keyboard.press('Escape');await p.waitForTimeout(200);continue}}
   if(!s.n&&s.screen==='field'){const r=await p.evaluate(()=>{const c=document.querySelector('#cue-open');if(!c||!c.getClientRects().length)return null;const b=c.getBoundingClientRect();return {x:b.left+b.width/2,y:b.top+b.height/2}});if(r)await p.mouse.click(r.x,r.y);await p.waitForTimeout(250);continue}
   if(s.n){decisions++;const pick=await p.evaluate(()=>{const bs=[...document.querySelectorAll('#choices button')].filter(n=>!n.disabled&&!n.dataset.inspect&&n.getClientRects().length);const want=[/No, do not/,/Activate/,/Special Summon/,/Normal Summon/,/Enter Battle/,/Attack/,/End turn/,/./];let j=null;for(const w of want){j=bs.find(x=>w.test(x.innerText.trim()));if(j)break}if(!j)return null;j.scrollIntoView({block:'center'});const r=j.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2}});
    if(pick)await p.mouse.click(pick.x,pick.y);await p.waitForTimeout(150);
    const c=await p.evaluate(()=>{const c=document.querySelector('#confirm');if(c&&!c.disabled&&c.getClientRects().length){c.scrollIntoView({block:'center'});const r=c.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2}}return null});if(c)await p.mouse.click(c.x,c.y);await p.waitForTimeout(150);continue}}
  await p.waitForTimeout(60)}
 const raw=await p.evaluate(()=>({sent:window.__sent,inputs:window.__inputs.slice(-3000),spaceOpen:window.__spaceOpen,audit:window.__ddlReplyAudit||null}));
 const manual=r=>r.audit&&!/^(automatic|addon)/.test(r.audit.route);
 const unseen=raw.sent.filter(r=>manual(r)&&(r.lastInput?.rendered==null||String(r.lastInput.rendered)!==String(r.rev)||r.lastInput?.hit?.ok===false));
 const auto=raw.sent.filter(r=>r.audit&&/^automatic/.test(r.audit.route)),addon=raw.sent.filter(r=>r.audit&&/^addon/.test(r.audit.route)),noAudit=raw.sent.filter(r=>!r.audit);
 const summary={version:VERSION,build,url,deckA,deckB,seed,vp:vpName,secs:+secs,decisions,replies:raw.sent.length,manual:raw.sent.filter(manual).length,manualRoutes:Object.entries(raw.sent.filter(manual).reduce((a,r)=>{a[r.audit.route]=(a[r.audit.route]||0)+1;return a},{})),automatic:auto.length,addon:addon.length,noAuditEntry:noAudit.length,unseenManual:unseen.length,unseen:unseen.slice(0,10),spaceWhileOpen:{presses:raw.spaceOpen.n,answersWhoseLastInputWasSpace:raw.sent.filter(r=>r.lastInput?.type==='keydown'&&!/^automatic/.test(r.audit?.route||'')).length},errors:errors.slice(0,5)};
 fs.writeFileSync(out+'.json',JSON.stringify({summary,raw}));console.log(JSON.stringify(summary));await b.close()})();

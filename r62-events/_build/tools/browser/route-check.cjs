// r62 (ChatGPT RELAY-216 J1-01): per-route stray-input check with a "drawn" oracle based on what is actually visible.
// A prompt revision counts as drawn only when its controls are on screen (a visible, enabled #choices button, or a visible
// quick bar) and the sheet is not a "Get ready…/Continuing…/Preparing…" placeholder. While a prompt is NOT drawn, the probe
// fires stray inputs every 20 ms: a Space keydown on the document, and a click on #pc-pass. While a sheet IS drawn it also
// presses Space with focus on the page body (the quick bar is hidden by the stylesheet then, so Space must do nothing).
// Every reply sent to the duel worker is recorded with its revision; a reply for a revision that was never drawn, other
// than the engine's own "Continuing…" auto-skip of an empty window, is an UNSEEN ANSWER.
// Usage: node route-check.cjs <url> <deckA> <deckB> <seed> <phone|tab> [seconds]
const {chromium}=require('playwright');const [url,deckA,deckB,seed,vpName,secs]=process.argv.slice(2);
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:vpName==='phone'?{width:412,height:915}:{width:1280,height:900},hasTouch:vpName==='phone',isMobile:vpName==='phone'});
 await ctx.addInitScript(()=>{const W=window;W.__drawn=new Set();W.__sent=[];W.__lastRev=null;W.__stray={space:0,bar:0,spaceOpen:0};
  W.addEventListener('duel-human-decision',e=>{const d=e.detail;W.__lastRev=d.human&&d.state?.prompt?d.state.revision:null});
  const placeholder=t=>/^(Get ready…|Continuing…|Preparing the duel…)$/.test(t||'');
  const shown=()=>{const t=document.querySelector('#decision-title')?.textContent;if(placeholder(t))return false;const bar=document.querySelector('#pc-bar');const barVis=!!bar&&!bar.hidden&&bar.getClientRects().length>0;
   const btn=[...document.querySelectorAll('#choices button')].some(x=>!x.disabled&&x.getClientRects().length>0&&getComputedStyle(x).visibility!=='hidden');return barVis||btn};
  setInterval(()=>{const t=document.querySelector('#decision-title')?.textContent;
   if(W.__lastRev!=null&&shown())W.__drawn.add(W.__lastRev);
   if(placeholder(t)&&t!=='Preparing the duel…'){W.__stray.space++;document.dispatchEvent(new KeyboardEvent('keydown',{code:'Space',key:' ',bubbles:true}));const p=document.querySelector('#pc-pass');if(p){W.__stray.bar++;p.click()}}
   else if(document.querySelector('#duel')?.dataset.screen==='play'&&shown()){document.activeElement?.blur?.();W.__stray.spaceOpen++;document.dispatchEvent(new KeyboardEvent('keydown',{code:'Space',key:' ',bubbles:true}))}},20);
  const pm=Worker.prototype.postMessage;Worker.prototype.postMessage=function(m,...a){try{if(m&&m.type==='reply'){W.__sent.push({rev:m.revision,rt:m.response?.type,idx:m.response?.index,title:document.querySelector('#decision-title')?.textContent,drawn:W.__drawn.has(m.revision)})}}catch{}return pm.call(this,m,...a)}});
 const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(url);await p.waitForFunction(()=>document.querySelector('#start')&&!document.querySelector('#start').disabled,null,{timeout:240000});
 await p.evaluate(o=>{for(const [k,v] of Object.entries(o)){const n=document.querySelector(k);if(!n)continue;n.value=v;n.dispatchEvent(new Event('change',{bubbles:true}))}},{'#mode':'play','#deck-a':deckA,'#deck-b':deckB,'#seat':'0','#game-seed':seed,'#first':'0'});
 await p.evaluate(()=>document.querySelector('#start').click());await p.waitForTimeout(2500);await p.evaluate(()=>document.querySelector('#portrait-continue')?.click());
 let decisions=0;const t0=Date.now(),limit=1000*Number(secs||240);
 while(Date.now()-t0<limit){
  const s=await p.evaluate(()=>({t:document.querySelector('#decision-title')?.textContent,cue:document.querySelector('#cue-owner')?.textContent,screen:document.querySelector('#duel')?.dataset.screen,n:[...document.querySelectorAll('#choices button')].filter(x=>!x.disabled&&!x.dataset.inspect&&x.getClientRects().length).length}));
  if(/COMPLETE/.test(s.cue||''))break;
  if(s.cue==='YOUR DECISION'&&!/Get ready|Continuing|Preparing/.test(s.t||'')){
   if(!s.n&&s.screen==='field'){await p.evaluate(()=>document.querySelector('#cue-open')?.click());await p.waitForTimeout(250);continue}
   if(s.n){decisions++;await p.evaluate(()=>{const bs=[...document.querySelectorAll('#choices button')].filter(n=>!n.disabled&&!n.dataset.inspect&&n.getClientRects().length);const want=[/No, do not/,/Activate/,/Special Summon/,/Normal Summon/,/Enter Battle/,/Attack/,/End turn/,/./];let j=null;for(const w of want){j=bs.find(x=>w.test(x.innerText.trim()));if(j)break}j?.click()});await p.waitForTimeout(150);
    await p.evaluate(()=>{const c=document.querySelector('#confirm');if(c&&!c.disabled&&c.getClientRects().length)c.click()});await p.waitForTimeout(150);continue}}
  await p.waitForTimeout(60)}
 const r=await p.evaluate(()=>({sent:window.__sent,stray:window.__stray,drawn:window.__drawn.size}));
 const unseen=r.sent.filter(x=>!x.drawn&&x.title!=='Continuing…');
 console.log(JSON.stringify({decisions,replies:r.sent.length,drawnRevisions:r.drawn,stray:r.stray,unseenAnswers:unseen.length,unseenByKind:Object.entries(unseen.reduce((a,x)=>{const k=x.title+' · type '+x.rt;a[k]=(a[k]||0)+1;return a},{})),unseenSample:unseen.filter(x=>x.title!=='Choose a field zone').slice(0,5),autoSkips:r.sent.filter(x=>x.title==='Continuing…').length,errors:errors.slice(0,3)}));await b.close()})();

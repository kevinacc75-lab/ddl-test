// RELAY-213 A-1 behavioural check: while a prompt waits behind "Get ready…", is the previous No response bar still live, and
// does pressing it send an answer for a prompt the player never saw? Plays Play mode, presses #pc-pass whenever it is visible
// (including during "Get ready…"), and records every answer sent to the duel worker with the prompt shown at that time.
const {chromium}=require('playwright');const [url,deckA,deckB,seed,vpName]=process.argv.slice(2);
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:vpName==='phone'?{width:412,height:915}:{width:1280,height:900}});
 await ctx.addInitScript(()=>{window.__sent=[];window.__shown=new Set();window.__stale=0;window.__staleTitles=[];setInterval(()=>{const bar=document.querySelector('#pc-bar'),t=document.querySelector('#decision-title')?.textContent;if(bar&&!bar.hidden&&t==='Get ready…'){window.__stale++;window.__staleTitles.push(document.querySelector('#pc-bar small')?.textContent||'');window.__clickAt=Date.now();document.querySelector('#pc-pass')?.click()}},20);
  window.addEventListener('duel-human-decision',e=>{const d=e.detail;if(d.human&&d.state?.prompt)window.__shown.add(d.state.revision)});
  const pm=Worker.prototype.postMessage;Worker.prototype.postMessage=function(m,...a){try{if(m&&(m.type==='reply'||m.type==='human-reply'||m.response)){const rev=m.revision??m.human?.revision;window.__sent.push({afterStaleClick:window.__clickAt&&Date.now()-window.__clickAt<4000,type:m.type,rt:m.response?.type,idx:m.response?.index,rev,shown:rev==null?null:window.__shown.has(rev),title:document.querySelector('#decision-title')?.textContent})}}catch{}return pm.call(this,m,...a)}});
 const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(url);await p.waitForFunction(()=>document.querySelector('#start')&&!document.querySelector('#start').disabled,null,{timeout:240000});
 await p.evaluate(o=>{for(const [k,v] of Object.entries(o)){const n=document.querySelector(k);if(!n)continue;n.value=v;n.dispatchEvent(new Event('change',{bubbles:true}))}},{'#mode':'play','#deck-a':deckA,'#deck-b':deckB,'#seat':'0','#game-seed':seed,'#first':'0'});
 await p.evaluate(()=>document.querySelector('#start').click());await p.waitForTimeout(2500);await p.evaluate(()=>document.querySelector('#portrait-continue')?.click());
 let staleVisible=0,staleClicks=0,decisions=0;const t0=Date.now();
 while(Date.now()-t0<240000){
  const s=await p.evaluate(()=>({title:document.querySelector('#decision-title')?.textContent,bar:!!document.querySelector('#pc-bar')&&!document.querySelector('#pc-bar').hidden,cue:document.querySelector('#cue-owner')?.textContent,n:[...document.querySelectorAll('#choices button')].filter(x=>!x.disabled&&!x.dataset.inspect).length}));
  if(/COMPLETE/.test(s.cue||''))break;
  if(s.bar&&s.title==='Get ready…'){staleVisible++;staleClicks++;await p.evaluate(()=>document.querySelector('#pc-pass')?.click());await p.waitForTimeout(80);continue}
  if(s.bar&&s.n&&s.title!=='Get ready…'){await p.evaluate(()=>[...document.querySelectorAll('#choices button')].find(x=>/No, do not (chain|activate)/.test(x.innerText))?.click());await p.waitForTimeout(150);continue}
  if(s.bar){await p.evaluate(()=>document.querySelector('#pc-pass')?.click());await p.waitForTimeout(150);continue}
  if(s.cue==='YOUR DECISION'&&s.n&&s.title!=='Get ready…'){decisions++;await p.evaluate(()=>{const bs=[...document.querySelectorAll('#choices button')].filter(n=>!n.disabled&&!n.dataset.inspect);const want=[/Activate/,/Special Summon/,/Normal Summon/,/Enter Battle/,/Attack/,/End turn/,/./];let j=null;for(const w of want){j=bs.find(x=>w.test(x.innerText.trim()));if(j)break}j?.click()});await p.waitForTimeout(200);await p.evaluate(()=>{const c=document.querySelector('#confirm');if(c&&!c.disabled&&c.offsetParent!==null)c.click()});await p.waitForTimeout(200);continue}
  await p.waitForTimeout(60)}
 const sent=await p.evaluate(()=>window.__sent);const st=await p.evaluate(()=>({n:window.__stale,t:[...new Set(window.__staleTitles)].slice(0,5)}));const unseen=sent.filter(x=>x.shown===false);
 console.log(JSON.stringify({inPageStale:st,passesAfterStaleClick:sent.filter(x=>x.afterStaleClick&&x.rt===8&&x.title!=='Continuing…').length,decisions,staleVisible,staleClicks,sent:sent.length,unseen:unseen.length,unseenSample:unseen.slice(0,4),errors:errors.slice(0,3)}));await b.close()})();

// r66 targeted fixtures (ChatGPT RELAY-224 §2 and §4). Usage: node fixtures66.cjs <url> <out-prefix>
//  F1 same-key redraw: the previous drawing's own #choices handler (its closure holds the old token) is invoked after a
//     redraw of the same prompt → the answer must be refused ("token from another drawing"), nothing sent.
//  F2 stale card menu: open a card's action menu, redraw the same prompt → the menu closes; and the old menu's action,
//     invoked directly, is refused.
//  F3 expanded copies (seed 77, Reinforcement of the Army): Show each copy, press copy A then copy B → exactly 1 selected
//     (B); Group copies → the group's representative is kept; Show each copy again, press the later Roze, Confirm → the
//     reply sent, the audit chain, and the NEXT state recorded (revision, our hand, Deck count).
const {chromium}=require('playwright');const fs=require('fs');const [url,out]=process.argv.slice(2);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function duel(b,seed,vp){const ctx=await b.newContext({viewport:vp==='phone'?{width:412,height:915}:{width:1280,height:900},hasTouch:vp==='phone',isMobile:vp==='phone'});
 await ctx.addInitScript(()=>{const W=window;W.__sent=[];W.__states=[];W.addEventListener('duel-human-decision',e=>{const d=e.detail;if(d.state)W.__states.push({rev:d.state.revision,human:d.human,prompt:d.state.prompt?.type??null,hand:(d.state.players?.[0]?.zones?.[2]||[]).filter(Boolean).map(c=>c.code),deck:(d.state.players?.[0]?.zones?.[1]||[]).length,deckN:d.state.players?.[0]?.deckCount??d.state.players?.[0]?.deck??null,pkeys:Object.keys(d.state.players?.[0]||{}),zlen:Object.fromEntries(Object.entries(d.state.players?.[0]?.zones||{}).map(([k,v])=>[k,Array.isArray(v)?v.length:typeof v]))})});
  const pm=Worker.prototype.postMessage;Worker.prototype.postMessage=function(m,...a){if(m&&m.type==='reply')W.__sent.push({rev:m.revision,response:m.response});return pm.call(this,m,...a)}});
 const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(url);
 await p.waitForFunction(()=>document.querySelector('#start')&&!document.querySelector('#start').disabled,null,{timeout:240000});
 await p.evaluate(o=>{for(const [k,v] of Object.entries(o)){const n=document.querySelector(k);if(!n)continue;n.value=v;n.dispatchEvent(new Event('change',{bubbles:true}))}},{'#mode':'play','#deck-a':'sky','#deck-b':'branded','#seat':'0','#game-seed':String(seed),'#first':'0'});
 await p.evaluate(()=>document.querySelector('#start').click());await sleep(2500);await p.evaluate(()=>document.querySelector('#portrait-continue')?.click());return {ctx,p,errors}}
const ready=p=>p.waitForFunction(()=>document.querySelector('#cue-owner')?.textContent==='YOUR DECISION'&&!/Get ready|Continuing|Preparing/.test(document.querySelector('#decision-title')?.textContent||'')&&document.body.dataset.renderedRev!=null,null,{timeout:120000});
const audit=p=>p.evaluate(()=>(window.__ddlReplyAudit||[]).slice(-4).map(a=>({id:a.id,stage:a.stage,route:a.route,why:a.why,token:a.token,liveToken:a.liveToken})));
(async()=>{const b=await chromium.launch();const R={url,build:null,F1:null,F2:null,F3:null};
 {const {ctx,p,errors}=await duel(b,3003,'tab');R.build=await p.evaluate(()=>document.title);await ready(p);
  // F1
  const f1=await p.evaluate(async()=>{const oldHandler=document.querySelector('#choices').onclick,oldRev=document.body.dataset.renderedRev;const sent0=window.__sent.length;
   document.dispatchEvent(new Event('duel-response-policy'));await new Promise(r=>setTimeout(r,50));
   const btn=document.querySelector('#choices [data-choice],#choices [data-chain-index],#choices [data-chain-pass],#choices [data-select]');
   if(!btn||!oldHandler)return {skipped:'no control or handler',title:document.querySelector('#decision-title')?.textContent};
   oldHandler({target:btn,stopPropagation(){}});await new Promise(r=>setTimeout(r,50));
   return {title:document.querySelector('#decision-title')?.textContent,oldRev,newRev:document.body.dataset.renderedRev,newHandlerDiffers:document.querySelector('#choices').onclick!==oldHandler,sentAfter:window.__sent.length-sent0,last:(window.__ddlReplyAudit||[]).at(-1)}});
  R.F1={...f1,pass:f1.sentAfter===0&&f1.last?.stage==='refused'&&/token from another drawing/.test(f1.last?.why||'')};
  // F2: play on until a card on the field/hand offers a menu
  let f2=null;const t0=Date.now();
  while(!f2&&Date.now()-t0<150000){await ready(p).catch(()=>{});
   const card=await p.evaluate(()=>{const n=[...document.querySelectorAll('.can-act')].find(x=>x.getClientRects().length);if(!n)return null;n.scrollIntoView({block:'center'});const r=n.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2}});
   const field=await p.evaluate(()=>document.querySelector('#duel')?.dataset.screen==='field');
   if(card&&field){await p.mouse.click(card.x,card.y);await sleep(400);
    const open=await p.evaluate(()=>{const m=document.querySelector('#card-action-menu');return !!m&&!m.hidden&&!!m.querySelector('button')});
    if(open){const r=await p.evaluate(async()=>{const m=document.querySelector('#card-action-menu');const act=[...m.querySelectorAll('button')].find(x=>!/Read card|Close/.test(x.textContent));const sent0=window.__sent.length;
      document.dispatchEvent(new Event('duel-response-policy'));await new Promise(r=>setTimeout(r,80));const closed=m.hidden;
      act?.onclick?.();await new Promise(r=>setTimeout(r,80));return {action:act?.textContent,menuClosedOnRedraw:closed,sentAfter:window.__sent.length-sent0,last:(window.__ddlReplyAudit||[]).at(-1)}});
     f2={...r,pass:r.menuClosedOnRedraw&&r.sentAfter===0};break}}
   // otherwise make progress through the sheet
   await p.evaluate(()=>{if(document.querySelector('#duel')?.dataset.screen==='field'){document.querySelector('#cue-open')?.click();return}const bs=[...document.querySelectorAll('#choices button')].filter(n=>!n.disabled&&!n.dataset.inspect&&n.getClientRects().length);const want=[/No, do not/,/Normal Summon/,/Activate/,/./];let j=null;for(const w of want){j=bs.find(x=>w.test(x.innerText.trim()));if(j)break}j?.click();const c=document.querySelector('#confirm');if(c&&!c.disabled&&c.getClientRects().length)c.click()});await sleep(300)}
  R.F2=f2||{skipped:'no card menu reached in 150 s'};R.F12errors=errors.slice(0,5);await ctx.close()}
 {const {ctx,p,errors}=await duel(b,77,'tab');let f3=null;const t0=Date.now();
  while(!f3&&Date.now()-t0<200000){await sleep(150);
   const g=await p.evaluate(()=>document.querySelectorAll('#choices [data-group]').length);
   if(g){const click=async sel=>{const r=await p.evaluate(s=>{const b=document.querySelector(s);if(!b)return null;b.scrollIntoView({block:'center'});const q=b.getBoundingClientRect();return {x:q.left+q.width/2,y:q.top+q.height/2}},sel);if(r)await p.mouse.click(r.x,r.y);await sleep(200);return !!r};
    const prompt=await p.evaluate(()=>{const s=window.__states.filter(x=>x.human).at(-1);return s});
    await click('#copies-toggle');const rows=await p.evaluate(()=>[...document.querySelectorAll('#choices [data-copy]')].map(b=>({i:+b.dataset.select,label:b.getAttribute('aria-label')})));
    const roze=rows.filter(r=>/Roze/.test(r.label));
    await click('#choices [data-copy="'+roze[0].i+'"]');await click('#choices [data-copy="'+roze[1].i+'"]');
    const afterTwo=await p.evaluate(()=>({info:document.querySelector('#selection-info').textContent,pressed:[...document.querySelectorAll('#choices [data-select][aria-pressed=true]')].map(b=>+b.dataset.select),confirmDisabled:document.querySelector('#confirm').disabled}));
    await click('#copies-toggle');const regroup=await p.evaluate(()=>({toggle:document.querySelector('#copies-toggle').textContent,pressed:[...document.querySelectorAll('#choices [data-select][aria-pressed=true]')].map(b=>+b.dataset.select),focus:document.activeElement?.dataset?.select??document.activeElement?.id}));
    await click('#copies-toggle');const reexpand=await p.evaluate(()=>({pressed:[...document.querySelectorAll('#choices [data-select][aria-pressed=true]')].map(b=>+b.dataset.select),focus:document.activeElement?.dataset?.select??null}));
    await click('#choices [data-copy="'+roze[1].i+'"]');/* replaces the kept representative with the later copy */
    const before=await p.evaluate(()=>({sent:window.__sent.length,states:window.__states.length,pressed:[...document.querySelectorAll('#choices [data-select][aria-pressed=true]')].map(b=>+b.dataset.select)}));
    await click('#confirm');await p.waitForFunction(n=>window.__states.slice(n).some(s=>s.human&&s.prompt!=null),before.states,{timeout:60000}).catch(()=>{});await sleep(500);
    const after=await p.evaluate(n=>({sent:window.__sent.slice(n.sent),next:window.__states.slice(n.states).filter(s=>s.human&&s.prompt!=null).slice(0,1),audit:(window.__ddlReplyAudit||[]).slice(-3).map(a=>({id:a.id,stage:a.stage,route:a.route,inputId:a.inputId??null,token:a.token??null}))}),before);
    f3={prompt,rows,afterTwo,regroup,reexpand,pressedBeforeConfirm:before.pressed,...after};
    f3.pass=afterTwo.pressed.length===1&&afterTwo.pressed[0]===roze[1].i&&!afterTwo.confirmDisabled&&regroup.pressed.length===1&&reexpand.pressed.length===1&&after.sent.length>=1&&after.sent[0].rev===prompt.rev&&JSON.stringify(after.sent[0].response.indicies)===JSON.stringify([roze[1].i])&&after.next.length===1&&after.next[0].rev>prompt.rev&&after.next[0].hand.includes(37351133)&&after.next[0].deckN===prompt.deckN-1;/* the first reply is ours for the search prompt; later automatic answers (e.g. an empty window) may follow before the next human prompt */break}
   await p.evaluate(()=>{if(document.querySelector('#cue-owner')?.textContent!=='YOUR DECISION')return;if(document.querySelector('#duel')?.dataset.screen==='field'){document.querySelector('#cue-open')?.click();return}const bs=[...document.querySelectorAll('#choices button')].filter(n=>!n.disabled&&!n.dataset.inspect&&n.getClientRects().length);const want=[/Reinforcement|Engage/,/No, do not/,/Activate/,/./];let j=null;for(const w of want){j=bs.find(x=>w.test(x.innerText.trim()));if(j)break}j?.click();const c=document.querySelector('#confirm');if(c&&!c.disabled&&c.getClientRects().length)c.click()})}
  R.F3=f3||{skipped:'no grouped prompt in 200 s'};R.F3errors=errors.slice(0,5);await ctx.close()}
 fs.writeFileSync(out+'.json',JSON.stringify(R,null,1));console.log(JSON.stringify({build:R.build,F1:R.F1?.pass??R.F1,F2:R.F2?.pass??R.F2,F3:R.F3?.pass??R.F3,F1why:R.F1?.last?.why,F2why:R.F2?.last?.why,F3sent:R.F3?.sent,F3next:R.F3?.next,errors:[...(R.F12errors||[]),...(R.F3errors||[])]}));await b.close()})();

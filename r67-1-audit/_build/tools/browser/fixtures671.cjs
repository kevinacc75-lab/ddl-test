// r67.1 native header fixtures from ChatGPT RELAY-232 addendum r1 (seed 3003, Kevy's Branded Deck = A, Sky Striker = B, human A).
// Usage: node fixtures671.cjs <url> <out.json> [tab|phone] [C02|C08|all]
// Real clicks only. At EVERY human prompt on the way it records the native title, the header line, its row, whether it was
// proven, and the visible buttons. A case is PASS only if its prompt is reached AND the header equals the expected row/text.
// Anything not reached is reported NOT REACHED, never assumed.
const {chromium}=require('playwright');const fs=require('fs');const [url,out,vp='tab',which='all']=process.argv.slice(2);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const CASES={
 // ChatGPT C02: Branded first. Albion → Activate; its send-to-GY selection. Generic activation header, mixed zones (no "from your").
 C02:{first:'0',expect:['A-SELECT_CARD-A','Activating · Albion the Shrouded Dragon · choose 1 card'],
  plan:[[/Choose your next play/,/^Activate · Albion the Shrouded Dragon/],[/send to the GY/i,'RECORD']]},
 // ChatGPT C08: Sky first. Summon Cartesia, activate it, Impermanence negates, go to Battle, attack with Cartesia; attack target.
 // Expected header for r67.1 is the SAFE FALLBACK (own-attack intent is not implemented yet; RELAY-232 §3).
 C08:{first:'1',expect:['A-SELECT_CARD-B','Source not verified · choose 1 card'],
  plan:[[/Choose your next play/,/^Normal Summon · Blazing Cartesia|^Summon · Blazing Cartesia/,'once'],[/Response window|Chain response/,/Cartesia/,'once'],[/Choose your next play/,/Battle Phase|^Battle\b|Enter Battle/,'once'],[/battle action/i,/^Attack · Blazing Cartesia/,'once'],[/attack target/i,'RECORD']]}};
async function runCase(b,id){const C=CASES[id];
 const ctx=await b.newContext({viewport:vp==='phone'?{width:412,height:915}:{width:1280,height:900},hasTouch:vp==='phone',isMobile:vp==='phone'});
 await ctx.addInitScript(()=>{const W=window;W.__states=[];W.addEventListener('duel-human-decision',e=>{const d=e.detail;if(d.state)W.__states.push({rev:d.state.revision,prompt:d.state.prompt?.type??null,phase:d.state.phase})})});
 const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(url);
 await p.waitForFunction(()=>document.querySelector('#start')&&!document.querySelector('#start').disabled,null,{timeout:240000});
 await p.evaluate(o=>{for(const [k,v] of Object.entries(o)){const n=document.querySelector(k);if(!n)continue;n.value=v;n.dispatchEvent(new Event('change',{bubbles:true}))}},{'#mode':'play','#deck-a':'branded','#deck-b':'sky','#seat':'0','#game-seed':'3003','#first':C.first});
 await p.evaluate(()=>document.querySelector('#start').click());await sleep(2500);await p.evaluate(()=>document.querySelector('#portrait-continue')?.click());
 const R={id,vp,build:await p.title(),log:[],errors,expectedRow:C.expect[0],expected:C.expect[1]};const t0=Date.now();
 const ready=()=>p.waitForFunction(()=>document.querySelector('#cue-owner')?.textContent==='YOUR DECISION'&&!/Get ready|Continuing|Preparing/.test(document.querySelector('#decision-title')?.textContent||'')&&document.body.dataset.renderedRev!=null,null,{timeout:240000});
 const look=()=>p.evaluate(()=>{const c=window.__ddlChoiceContext?.()||{},s=window.__states.at(-1)||{};const btns=[...document.querySelectorAll('#choices button,#choices [data-chain-index]')].filter(n=>n.getClientRects().length).map(n=>n.innerText.trim().replace(/\s+/g,' ').slice(0,80));return {rev:document.body.dataset.renderedRev,title:document.querySelector('#decision-title')?.textContent,header:c.text,row:c.shown?.row??null,verified:c.shown?.verified??null,promptType:s.prompt,phase:s.phase,buttons:btns}});
 const click=re=>p.evaluate(src=>{const re=new RegExp(src);const n=[...document.querySelectorAll('#choices button,#choices [data-chain-index],#choices [data-chain-pass]')].find(x=>x.getClientRects().length&&!x.disabled&&!x.dataset.inspect&&re.test(x.innerText.trim().replace(/\s+/g,' ')));if(!n)return false;n.click();return true},re.source);
 const openSheet=()=>p.evaluate(()=>{if(document.querySelector('#duel')?.dataset.screen==='field')document.querySelector('#cue-open')?.click()});
 let step=0,lastRev=null;
 while(Date.now()-t0<420000){try{await ready()}catch{R.log.push({timeout:true,step});break}
  await openSheet();await sleep(350);const v=await look();if(v.rev===lastRev){await sleep(300);continue}lastRev=v.rev;R.log.push({step,...v});
  if(process.env.SHOTS)await p.screenshot({path:process.env.SHOTS+'/'+id+'-'+vp+'-rev'+v.rev+'.png'});
  const t=v.title||'',[tre,act]=C.plan[step]||[];let ok=false;
  if(tre&&tre.test(t)){if(act==='RECORD'){R.reached=v;break}ok=await click(act);if(ok)step++}
  if(!ok){/* not this step's prompt: decline responses, pass on anything else that has an obvious pass */
   if(/Response window|Chain response/.test(t))ok=await click(/No, do not/);
   else if(/^Use .*effect\?/.test(t))ok=await click(/^No\b/);
   else if(/zone/i.test(t))ok=await click(/./);
   else if(/battle position/i.test(t))ok=await click(/Attack|ATK/);
   if(!ok)R.log.at(-1).note='no matching control (step '+step+')'}
  await sleep(400)}
 if(R.reached){const v=R.reached;R.pass=v.row===C.expect[0]&&v.header===C.expect[1];R.status=R.pass?'PASS':'FAIL'}else R.status='NOT REACHED';
 R.unverifiedSeen=R.log.filter(l=>l.verified===false).map(l=>({title:l.title,header:l.header,row:l.row}));
 await ctx.close();return R}
(async()=>{const b=await chromium.launch();const ids=which==='all'?Object.keys(CASES):[which];const res={url,vp,cases:{}};
 for(const id of ids)res.cases[id]=await runCase(b,id);
 res.summary=Object.fromEntries(Object.entries(res.cases).map(([k,v])=>[k,v.status]));
 fs.writeFileSync(out,JSON.stringify(res,null,1));console.log(JSON.stringify({summary:res.summary,errors:Object.values(res.cases).reduce((n,c)=>n+c.errors.length,0),prompts:Object.fromEntries(Object.entries(res.cases).map(([k,v])=>[k,v.log.length]))}));await b.close()})();

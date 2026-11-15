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
 // r67.2: own-attack intent (ChatGPT own-attack-header-spec-r1). r67.1 showed the safe fallback "Source not verified · choose 1 card".
 C08:{first:'1',expect:['A-SELECT_CARD-ATK','Attack target · Blazing Cartesia, the Virtuous · choose 1 monster'],
  plan:[[/Choose your next play/,/^Normal Summon · Blazing Cartesia|^Summon · Blazing Cartesia/,'once'],[/Response window|Chain response/,/Cartesia/,'once'],[/Choose your next play/,/Battle Phase|^Battle\b|Enter Battle/,'once'],[/battle action/i,/^Attack · Blazing Cartesia/,'once'],[/attack target/i,'RECORD']]},
 // ChatGPT RELAY-234 C01: Branded A vs Branded B, Control both seats, A first. Decline B's Fuwalos in Draw/Standby (default
 // handler), A activates Nadir Servant, B chains Fuwalos (CL2), pass the rest; CL2 resolves, then CL1 Nadir asks its send.
 C01:{first:'0',mode:'manual',deckB:'branded',expect:['A-SELECT_CARD-R','Resolving CL 1 · Nadir Servant · choose 1 card from your Extra Deck'],
  plan:[[/Choose your next play/,/^Activate · Nadir Servant/],[/Chain response|Response window/,/Fuwalos/,'once'],[/send to the GY/i,'RECORD']]},
 // ChatGPT RELAY-236 C05: Toon A vs Branded B, Control both seats, A first. Toon Bookmark searches Toon Kingdom; Kingdom activates;
 // A ends; B's The Fallen & The Virtuous (Destroy, send Alba-Lenatus, target Kingdom) resolves as CL1 and Bookmark's replacement
 // is offered DURING that resolution. r67.3 wording (ChatGPT replay-and-effect-offer-wording-r1).
 C05:{first:'0',mode:'manual',deckA:'toon',deckB:'branded',expect:['A-SELECT_EFFECTYN-RO','During CL 1 · Toon Bookmark · use this effect?'],
  plan:[[/Choose your next play/,/^Activate · Toon Bookmark/],[/./,'PICK:Toon Kingdom'],[/Choose your next play/,/^Activate · Toon Kingdom/],[/Choose your next play/,/^End turn|End Phase/],
   [/Choose your next play/,/^Activate · The Fallen & The Virtuous/],[/./,/Destroy/],[/./,'PICK:Alba-Lenatus'],[/./,'PICK:Toon Kingdom'],[/Use Toon Bookmark/,'RECORD']]},
 // ChatGPT RELAY-236 C10: Sky A vs Branded B, Control both seats, A first. B chains its PREVIOUSLY SET Fallen & Virtuous to A's
 // Area Zero; A then has a real Chain response. Expected: the SAFE FALLBACK (seat views change in this mode, which clears proof;
 // ChatGPT: do not weaken resets to recover the name). A named header here would need a new, reviewed public-source rule.
 C10:{first:'0',mode:'manual',deckA:'sky',deckB:'branded',expect:[null,'Response window · source not verified · choose an effect'],
  plan:[[/Choose your next play/,/^Set · Infinite Impermanence/],[/Choose your next play/,/^End turn|End Phase/],[/Choose your next play/,/^Set · The Fallen & The Virtuous/],
   [/Choose your next play/,/Summon · Tri-Brigade Mercourier/],[/Choose your next play/,/^End turn|End Phase/],[/Choose your next play/,/^Activate · Sky Striker Airspace - Area Zero/],
   [/Response window|Chain response/,/Fallen & The Virtuous/],[/./,/Destroy/],[/./,'PICK:Alba-Lenatus'],[/./,'PICK:Area Zero'],[/Chain response/,'RECORD']]}};
async function runCase(b,id){const C=CASES[id];
 const ctx=await b.newContext({viewport:vp==='phone'?{width:412,height:915}:{width:1280,height:900},hasTouch:vp==='phone',isMobile:vp==='phone'});
 await ctx.addInitScript(()=>{const W=window;W.__states=[];W.addEventListener('duel-human-decision',e=>{const d=e.detail;if(d.state)W.__states.push({rev:d.state.revision,prompt:d.state.prompt?.type??null,phase:d.state.phase})})});
 const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(url);
 await p.waitForFunction(()=>document.querySelector('#start')&&!document.querySelector('#start').disabled,null,{timeout:240000});
 await p.evaluate(o=>{for(const [k,v] of Object.entries(o)){const n=document.querySelector(k);if(!n)continue;n.value=v;n.dispatchEvent(new Event('change',{bubbles:true}))}},{'#mode':C.mode||'play','#deck-a':C.deckA||'branded','#deck-b':C.deckB||'sky','#seat':'0','#game-seed':'3003','#first':C.first});
 await p.evaluate(()=>document.querySelector('#start').click());await sleep(2500);await p.evaluate(()=>document.querySelector('#portrait-continue')?.click());
 const R={id,vp,build:await p.title(),log:[],errors,expectedRow:C.expect[0],expected:C.expect[1]};const t0=Date.now();
 const ready=()=>p.waitForFunction(()=>document.querySelector('#cue-owner')?.textContent==='YOUR DECISION'&&!/Get ready|Continuing|Preparing/.test(document.querySelector('#decision-title')?.textContent||'')&&document.body.dataset.renderedRev!=null,null,{timeout:240000});
 const look=()=>p.evaluate(()=>{const c=window.__ddlChoiceContext?.()||{},s=window.__states.at(-1)||{};const btns=[...document.querySelectorAll('#choices button,#choices [data-chain-index]')].filter(n=>n.getClientRects().length).map(n=>n.innerText.trim().replace(/\s+/g,' ').slice(0,80));return {rev:document.body.dataset.renderedRev,title:document.querySelector('#decision-title')?.textContent,header:c.text,row:c.shown?.row??null,verified:c.shown?.verified??null,promptType:s.prompt,phase:s.phase,buttons:btns,trail:(c.reducer?.trail||[]).slice(-2),ctx:c.shown?.ctx??null}});
 const click=re=>p.evaluate(src=>{const re=new RegExp(src);const n=[...document.querySelectorAll('#choices button,#choices [data-chain-index],#choices [data-chain-pass]')].find(x=>x.getClientRects().length&&!x.disabled&&!x.dataset.inspect&&re.test(x.innerText.trim().replace(/\s+/g,' ')));if(!n)return false;n.click();return true},re.source);
 const openSheet=()=>p.evaluate(()=>{if(document.querySelector('#duel')?.dataset.screen==='field')document.querySelector('#cue-open')?.click()});
 let step=0,lastRev=null;
 while(Date.now()-t0<420000){try{await ready()}catch{R.log.push({timeout:true,step});break}
  await openSheet();await sleep(350);const v=await look();if(v.rev===lastRev){await sleep(300);continue}lastRev=v.rev;R.log.push({step,...v});
  if(process.env.SHOTS)await p.screenshot({path:process.env.SHOTS+'/'+id+'-'+vp+'-rev'+v.rev+'.png'});
  const t=v.title||'',[tre,act]=C.plan[step]||[];let ok=false;
  if(tre&&tre.test(t)){if(act==='RECORD'){R.reached=v;break}
   if(typeof act==='string'&&act.startsWith('PICK:')){ok=await click(new RegExp(act.slice(5)));if(ok){await sleep(250);await p.evaluate(()=>{const c=document.querySelector('#confirm');if(c&&!c.disabled)c.click()})}}
   else ok=await click(act);if(ok)step++}
  if(!ok){/* not this step's prompt: decline responses, pass on anything else that has an obvious pass */
   if(/Response window|Chain response|response window/i.test(t))ok=await click(/No, do not|^Do not chain/);
   else if(/^Use .*effect\?/.test(t))ok=await click(/^No\b/);
   else if(/zone/i.test(t))ok=await click(/./);
   else if(/battle position/i.test(t))ok=await click(/Attack|ATK/);
   if(!ok)R.log.at(-1).note='no matching control (step '+step+')'}
  await sleep(400)}
 if(R.reached){const v=R.reached;R.pass=(C.expect[0]===null||v.row===C.expect[0])&&v.header===C.expect[1];R.status=R.pass?'PASS':'FAIL'}else R.status='NOT REACHED';
 R.unverifiedSeen=R.log.filter(l=>l.verified===false).map(l=>({title:l.title,header:l.header,row:l.row}));
 await ctx.close();return R}
(async()=>{const b=await chromium.launch();const ids=which==='all'?Object.keys(CASES):[which];const res={url,vp,cases:{}};
 for(const id of ids)res.cases[id]=await runCase(b,id);
 res.summary=Object.fromEntries(Object.entries(res.cases).map(([k,v])=>[k,v.status]));
 fs.writeFileSync(out,JSON.stringify(res,null,1));console.log(JSON.stringify({summary:res.summary,errors:Object.values(res.cases).reduce((n,c)=>n+c.errors.length,0),prompts:Object.fromEntries(Object.entries(res.cases).map(([k,v])=>[k,v.log.length]))}));await b.close()})();

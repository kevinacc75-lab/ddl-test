// r67 native header fixtures (ChatGPT RELAY-230 Job C, seed 3003, Sky Striker vs Kevy's Branded Deck, Sky first, human Sky).
// Usage: node fixtures67.cjs <url> <out.json> [tab|phone]
// Follows ChatGPT's commonSequence with real clicks and records, at EVERY human prompt on the way, the native prompt type,
// the native title, the header line (#decision-context), its matrix row and whether it was proven. The five reached cases
// are then compared with ChatGPT's expected row and wording. Anything not reached is reported NOT REACHED, never assumed.
const {chromium}=require('playwright');const fs=require('fs');const [url,out,vp='tab']=process.argv.slice(2);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const EXPECT={C06:['A-SELECT_CHAIN-E','Draw Phase · no Chain Link · choose an effect'],C07:['A-SELECT_CHAIN-C','Response to CL 1 · Mulcharmy Fuwalos · choose an effect'],C04:['A-SELECT_UNSELECT_CARD-S','Summon procedure · Sky Striker Ace - Kagari · adjust the selected cards'],C03:['A-SELECT_CARD-A','Activating · Sky Striker Ace - Kagari · choose 1 card from your GY'],C09:['A-SELECT_POSITION-R','Resolving CL 2 · Sky Striker Ace - Roze · choose a battle position'],'optional-offer-after-chain':['A-SELECT_EFFECTYN-O','Effect choice · Sky Striker Ace - Roze · use this effect?']};
// r67.1 (RELAY-232 §2): the Roze Yes/No at rev12 comes AFTER the chain ended (summon,resolutionReady,move,chainEnd); it is NOT ChatGPT's
// C05 (a Yes/No during resolution), which stays open. Renamed, and its expected wording follows errata r2 (ChatGPT, pending Seto/team).
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:vp==='phone'?{width:412,height:915}:{width:1280,height:900},hasTouch:vp==='phone',isMobile:vp==='phone'});
 await ctx.addInitScript(()=>{const W=window;W.__states=[];W.addEventListener('duel-human-decision',e=>{const d=e.detail;if(d.state)W.__states.push({rev:d.state.revision,human:d.human,prompt:d.state.prompt?.type??null,phase:d.state.phase})})});
 const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(url);
 await p.waitForFunction(()=>document.querySelector('#start')&&!document.querySelector('#start').disabled,null,{timeout:240000});
 await p.evaluate(o=>{for(const [k,v] of Object.entries(o)){const n=document.querySelector(k);if(!n)continue;n.value=v;n.dispatchEvent(new Event('change',{bubbles:true}))}},{'#mode':'play','#deck-a':'sky','#deck-b':'branded','#seat':'0','#game-seed':'3003','#first':'0'});
 await p.evaluate(()=>document.querySelector('#start').click());await sleep(2500);await p.evaluate(()=>document.querySelector('#portrait-continue')?.click());
 const R={url,vp,build:await p.title(),log:[],cases:{},errors};let stage=0;const t0=Date.now();
 const ready=()=>p.waitForFunction(()=>document.querySelector('#cue-owner')?.textContent==='YOUR DECISION'&&!/Get ready|Continuing|Preparing/.test(document.querySelector('#decision-title')?.textContent||'')&&document.body.dataset.renderedRev!=null,null,{timeout:90000});
 const look=()=>p.evaluate(()=>{const c=window.__ddlChoiceContext?.()||{},s=window.__states.at(-1)||{};const btns=[...document.querySelectorAll('#choices button,#choices [data-chain-index]')].filter(n=>n.getClientRects().length).map(n=>n.innerText.trim().replace(/\s+/g,' ').slice(0,80));return {rev:document.body.dataset.renderedRev,screen:document.querySelector('#duel')?.dataset.screen,title:document.querySelector('#decision-title')?.textContent,header:c.text,row:c.shown?.row??null,verified:c.shown?.verified??null,ctx:c.shown?.ctx??null,promptType:s.prompt,phase:s.phase,buttons:btns,resolving:c.reducer?.resolving?.chain??null,activating:c.reducer?.activating?{code:c.reducer.activating.code,player:c.reducer.activating.player}:null,trail:(c.reducer?.trail||[]).slice(-3)}});
 const click=re=>p.evaluate(src=>{const re=new RegExp(src);const n=[...document.querySelectorAll('#choices button,#choices [data-chain-index],#choices [data-chain-pass]')].find(x=>x.getClientRects().length&&!x.disabled&&!x.dataset.inspect&&re.test(x.innerText.trim().replace(/\s+/g,' ')));if(!n)return false;n.click();return true},re.source);
 const openSheet=()=>p.evaluate(()=>{if(document.querySelector('#duel')?.dataset.screen==='field')document.querySelector('#cue-open')?.click()});
 const rec=(id,v)=>{if(!R.cases[id])R.cases[id]={...v,expectedRow:EXPECT[id][0],expected:EXPECT[id][1],pass:v.row===EXPECT[id][0]&&v.header===EXPECT[id][1]&&v.verified===true}};
 let lastRev=null;
 while(stage<99&&Date.now()-t0<420000){try{await ready()}catch{R.log.push({timeout:true,stage});break}
  await openSheet();await sleep(350);const v=await look();if(v.rev===lastRev){await sleep(300);continue}lastRev=v.rev;R.log.push({stage,...v});if(process.env.SHOTS)await p.screenshot({path:process.env.SHOTS+'/'+vp+'-rev'+v.rev+'.png'});
  const t=v.title||'',bs=v.buttons.join(' | ');let ok=false;
  if(/^Use Sky Striker Ace - Roze/.test(t)){rec('optional-offer-after-chain',v);ok=await click(/^No\b/)}
  else if(stage===0&&/Response window/.test(t)){rec('C06',v);ok=await click(/No, do not/);stage=1}
  else if(stage===1&&/Chain response/.test(t)&&/Fuwalos/.test(v.header||'')){rec('C07',v);ok=await click(/No, do not/);stage=2}
  else if(stage>=1&&stage<=3&&/Response window|Chain response/.test(t)&&/Hornet/.test(bs)&&stage===3){ok=await click(/Hornet/);stage=4}
  else if(stage>=1&&stage<=2&&/Response window|Chain response/.test(t)){ok=await click(/No, do not/);if(stage===2)stage=3}
  else if(stage===4&&/Choose your next play/.test(t)){ok=await click(/Special Summon · Sky Striker Ace - Kagari/);if(ok)stage=5}
  else if(stage===5&&/Link materials/.test(t)){rec('C04',v);ok=await click(/Use · Sky Striker Ace Token/);stage=6}
  else if(stage===6&&/Response window|Chain response/.test(t)&&/Kagari/.test(bs)){ok=await click(/Kagari/);stage=7}
  else if(stage===7&&/add to hand|Choose a card/.test(t)){rec('C03',v);ok=await click(/Hornet/);await sleep(250);await p.evaluate(()=>{const c=document.querySelector('#confirm');if(c&&!c.disabled)c.click()});ok=true;stage=8}
  else if(stage===8&&/Chain response|Response window/.test(t)&&/Roze/.test(bs)){ok=await click(/Roze/);stage=9}
  else if(stage===9&&/Chain response|Response window/.test(t)){ok=await click(/No, do not/)}
  else if(stage>=8&&/battle position/.test(t)){rec('C09',v);stage=99;break}
  else if(/Response window|Chain response/.test(t)){ok=await click(/No, do not/)}
  else if(/zone/.test(t)){ok=await click(/./)}
  if(!ok)R.log.at(-1).note='no matching control (stage '+stage+')';await sleep(400)}
 for(const id of Object.keys(EXPECT))if(!R.cases[id])R.cases[id]={status:'NOT REACHED',expectedRow:EXPECT[id][0],expected:EXPECT[id][1]};
 R.summary=Object.fromEntries(Object.entries(R.cases).map(([k,v])=>[k,v.status||(v.pass?'PASS':'FAIL')]));
 R.unverifiedSeen=R.log.filter(l=>l.verified===false).map(l=>({title:l.title,header:l.header,row:l.row}));
 fs.writeFileSync(out,JSON.stringify(R,null,1));console.log(JSON.stringify({build:R.build,summary:R.summary,errors:errors.length,prompts:R.log.length}));await b.close()})();

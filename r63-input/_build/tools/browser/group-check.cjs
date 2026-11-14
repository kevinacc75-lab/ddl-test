// r63 grouped-copies browser check (ChatGPT Grouped-copy-selection-spec-r1 acceptance rows 1, 5, 7). Plays Sky Striker in
// Play mode, prefers activating Engage, and when a grouped row (data-group) appears: records the raw prompt (selects with
// original indexes), the rows shown, clicks the row (real pointer), checks the pressed state and Confirm, confirms, and
// records the reply sent to the duel worker. Usage: node group-check.cjs <url> <seed> <phone|tab> <out> [seconds]
const {chromium}=require('playwright');const fs=require('fs');const [url,seed,vpName,out,secs]=process.argv.slice(2);
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:vpName==='phone'?{width:412,height:915}:{width:1280,height:900},hasTouch:vpName==='phone',isMobile:vpName==='phone'});
 await ctx.addInitScript(()=>{const W=window;W.__sent=[];W.__prompts=[];W.addEventListener('duel-human-decision',e=>{const d=e.detail;if(d.human&&d.state?.prompt)W.__prompts.push({rev:d.state.revision,type:d.state.prompt.type,min:d.state.prompt.min,max:d.state.prompt.max,selects:(d.state.prompt.selects||[]).map((c,i)=>({i,code:c.code,controller:c.controller,location:c.location,sequence:c.sequence,position:c.position})),chainTop:d.state.chain?.at?.(-1)?.code??null})});
  const pm=Worker.prototype.postMessage;Worker.prototype.postMessage=function(m,...a){if(m&&m.type==='reply')W.__sent.push({rev:m.revision,response:m.response});return pm.call(this,m,...a)}});
 const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(url);await p.waitForFunction(()=>document.querySelector('#start')&&!document.querySelector('#start').disabled,null,{timeout:240000});
 await p.evaluate(o=>{for(const [k,v] of Object.entries(o)){const n=document.querySelector(k);if(!n)continue;n.value=v;n.dispatchEvent(new Event('change',{bubbles:true}))}},{'#mode':'play','#deck-a':'sky','#deck-b':'branded','#seat':'0','#game-seed':seed,'#first':'0'});
 await p.evaluate(()=>document.querySelector('#start').click());await p.waitForTimeout(2500);await p.evaluate(()=>document.querySelector('#portrait-continue')?.click());
 const R={seed,vp:vpName,found:null,errors};const t0=Date.now();
 while(Date.now()-t0<1000*Number(secs||300)&&!R.found){
  const s=await p.evaluate(()=>({t:document.querySelector('#decision-title')?.textContent,cue:document.querySelector('#cue-owner')?.textContent,screen:document.querySelector('#duel')?.dataset.screen,groups:document.querySelectorAll('#choices [data-group]').length,n:[...document.querySelectorAll('#choices button')].filter(x=>!x.disabled&&!x.dataset.inspect&&x.getClientRects().length).length}));
  if(/COMPLETE/.test(s.cue||''))break;
  if(s.groups){const before=await p.evaluate(()=>({rows:[...document.querySelectorAll('#choices [data-group]')].map(b=>({select:+b.dataset.select,label:b.getAttribute('aria-label'),text:b.innerText.replace(/\s+/g,' '),count:b.querySelector('.choice-copy-count')?.textContent||null})),prompt:window.__prompts.at(-1),html:document.querySelector('#choices').innerHTML.slice(0,3000),info:document.querySelector('#selection-info')?.textContent,confirmDisabled:document.querySelector('#confirm').disabled}));
   const row=await p.evaluate(()=>{const b=[...document.querySelectorAll('#choices [data-group]')].find(x=>x.querySelector('.choice-copy-count'))||document.querySelector('#choices [data-group]');b.scrollIntoView({block:'center'});const r=b.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2,select:+b.dataset.select}});
   await p.mouse.click(row.x,row.y);await p.waitForTimeout(200);
   const after=await p.evaluate(()=>({pressed:[...document.querySelectorAll('#choices [data-group]')].map(b=>b.getAttribute('aria-pressed')),info:document.querySelector('#selection-info')?.textContent,confirmDisabled:document.querySelector('#confirm').disabled}));
   const sentBefore=await p.evaluate(()=>window.__sent.length);
   const c=await p.evaluate(()=>{const c=document.querySelector('#confirm');c.scrollIntoView({block:'center'});const r=c.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2}});await p.mouse.click(c.x,c.y);await p.waitForTimeout(1500);
   const sent=await p.evaluate(n=>window.__sent.slice(n),sentBefore);const audit=await p.evaluate(()=>(window.__ddlReplyAudit||[]).slice(-3));
   const next=await p.evaluate(()=>({t:document.querySelector('#decision-title')?.textContent,prompts:window.__prompts.slice(-2).map(x=>({rev:x.rev,type:x.type}))}));
   R.found={before,clicked:row,after,sent,audit,next};break}
  if(s.cue==='YOUR DECISION'&&!/Get ready|Continuing|Preparing/.test(s.t||'')){
   if(!s.n&&s.screen==='field'){await p.evaluate(()=>document.querySelector('#cue-open')?.click());await p.waitForTimeout(250);continue}
   if(s.n){await p.evaluate(()=>{const bs=[...document.querySelectorAll('#choices button')].filter(n=>!n.disabled&&!n.dataset.inspect&&n.getClientRects().length);const want=[/Engage/,/No, do not/,/Activate · Sky Striker Mecha/,/Activate/,/Special Summon/,/Normal Summon/,/End turn/,/./];let j=null;for(const w of want){j=bs.find(x=>w.test(x.innerText.trim()));if(j)break}j?.click()});await p.waitForTimeout(150);
    await p.evaluate(()=>{const c=document.querySelector('#confirm');if(c&&!c.disabled&&c.getClientRects().length)c.click()});await p.waitForTimeout(150);continue}}
  await p.waitForTimeout(80)}
 R.cardPrompts=await p.evaluate(()=>window.__prompts.filter(x=>x.type===15||x.selects.length>1).slice(-12).map(x=>({rev:x.rev,type:x.type,min:x.min,max:x.max,top:x.chainTop,codes:x.selects.map(c=>c.code+'@'+c.location+'/'+c.controller)})));
 if(R.found)await p.screenshot({path:out+'.png'});fs.writeFileSync(out+'.json',JSON.stringify(R,null,1));console.log(JSON.stringify({seed,found:!!R.found,sent:R.found?.sent,clicked:R.found?.clicked?.select,rows:R.found?.before?.rows?.map(r=>r.text+' ['+r.select+']'),errors:errors.slice(0,3)}));await b.close()})();

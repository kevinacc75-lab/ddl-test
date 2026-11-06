// r36 default-build browser checks (Claude as builder, 7 Nov 2026; ChatGPT RELAY-119 G4). Chromium via the pre-installed
// Playwright against a served dist/. Parts (comma list, default all):
//  cold     - desktop and tablet portrait: cold load selects Enhanced, the options are "Enhanced" / "Classic (r35.12 AI)",
//             no "experimental" text on the page; a Watch duel started WITHOUT touching the selector shows "AI Enhanced"
//             in the banner and "AI ENHANCED" in the arena tag and reaches turn >= minTurn with no page errors.
//  classic  - Classic is one click away: New, choose Classic, start -> banner "AI Classic", tag "AI CLASSIC", progresses.
//  replay   - "Save replay" during an Enhanced duel downloads JSON with aiMode "enhanced" and the build string; opening it
//             with the dropdown on Classic replays as Enhanced; the same file without aiMode/build (a pre-selector replay)
//             with the dropdown on Enhanced replays as Classic; aiMode "bogus" is refused with a notice and no duel.
//  finish   - Instant pace, Watch duels to the end: after the end, the effect dock status is not "RESOLVING", the chain
//             list and chain strip are empty, and every visible element's text is recorded if it still says RESOLVING.
// Usage: node tools/r36-default-browser.mjs <url> <outdir> [parts] [minTurn=4] [finishSeeds=71025,71021]
import {createRequire} from 'node:module';import fs from 'node:fs';const require=createRequire(import.meta.url);
const {chromium,devices}=require('/opt/npm-tools/node_modules/playwright');
const [url,out,partsArg='cold,classic,replay,finish',minTurn='4',finishArg='71025,71021']=process.argv.slice(2);const PARTS=partsArg.split(',');fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch(/^https:/.test(url)&&process.env.HTTPS_PROXY?{proxy:{server:process.env.HTTPS_PROXY}}:{});const report={url,parts:{}};
const ready=p=>p.waitForFunction(()=>document.querySelector('#start')&&!document.querySelector('#start').disabled,null,{timeout:180000});
const setup=(p,{mode='watch',ai=null,seed,a='branded',b='sky'})=>p.evaluate(([mode,ai,seed,a,b])=>{const $=s=>document.querySelector(s);$('#deck-a').value=a;$('#deck-a').dispatchEvent(new Event('change'));$('#deck-b').value=b;$('#deck-b').dispatchEvent(new Event('change'));$('#mode').value=mode;$('#mode').dispatchEvent(new Event('change'));if(ai){$('#ai-mode').value=ai;$('#ai-mode').dispatchEvent(new Event('change'))}$('#game-seed').value=seed;$('#first').value='0'},[mode,ai,seed,a,b]);
const start=p=>p.evaluate(()=>document.querySelector('#start').click());
const st=p=>p.evaluate(()=>{const t=document.querySelector('#turn-label')?.textContent||'';const m=t.match(/(\d+)/);const tag=document.querySelector('#spectator-tag');const n=document.querySelector('#notice');
 return {turn:m?+m[1]:0,title:document.querySelector('#decision-title')?.textContent||'',banner:(document.querySelector('#match-study')?.textContent||'').match(/AI (Enhanced|Classic)[^·]*$/)?.[0]?.trim()||'',tag:tag&&!tag.hidden?tag.textContent:'',notice:n&&!n.hidden?n.textContent:'',over:!!document.querySelector('#duel-summary')}});
const toNew=async p=>{await p.evaluate(()=>document.querySelector('#new')?.click());await ready(p)};
const waitTurn=async(p,n,ms=360000)=>{const end=Date.now()+ms;let s;for(;;){s=await st(p);if(s.turn>=n||s.over||Date.now()>end)return s;await p.waitForTimeout(1500)}};
async function page(dev={viewport:{width:1366,height:900}},preset=null){const ctx=await browser.newContext({...dev,acceptDownloads:true});if(preset)await ctx.addInitScript(pr=>{try{localStorage.setItem('doctrine-lab-media-v2',JSON.stringify({preset:pr,modePaces:{watch:pr,play:pr}}))}catch{}},preset);
 const p=await ctx.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});await p.goto(url);await ready(p);return {p,ctx,errors}}
const run=async(name,f)=>{try{report.parts[name]=await f()}catch(e){report.parts[name]={pass:false,exception:e.message.split('\n')[0]}}console.log(name,JSON.stringify(report.parts[name]).slice(0,600))};
if(PARTS.includes('cold'))await run('cold',async()=>{const R={};
 for(const [name,dev] of Object.entries({desktop:{viewport:{width:1366,height:900}},tabletPortrait:devices['Galaxy Tab S4']})){const {p,ctx,errors}=await page(dev);const D=R[name]={};
  D.select=await p.evaluate(()=>{const s=document.querySelector('#ai-mode');return {value:s.value,options:[...s.options].map(o=>o.textContent),experimental:/experimental/i.test(document.documentElement.outerHTML),title:document.title,badge:document.querySelector('.release')?.textContent}});
  await setup(p,{seed:'71034'});await start(p);D.s=await waitTurn(p,+minTurn);D.errors=errors;await p.screenshot({path:`${out}/cold-${name}.png`});
  D.pass=D.select.value==='enhanced'&&JSON.stringify(D.select.options)==='["Enhanced","Classic (r35.12 AI)"]'&&!D.select.experimental&&D.s.banner.startsWith('AI Enhanced')&&/AI ENHANCED$/.test(D.s.tag)&&(D.s.turn>=+minTurn||D.s.over)&&!errors.length;await ctx.close()}
 R.pass=Object.values(R).every(d=>d.pass);return R});
if(PARTS.includes('classic'))await run('classic',async()=>{const {p,ctx,errors}=await page();const R={};await setup(p,{seed:'71035'});await start(p);R.first=await waitTurn(p,2);await toNew(p);
 await setup(p,{ai:'classic',seed:'71036'});await start(p);R.s=await waitTurn(p,+minTurn);R.errors=errors;await p.screenshot({path:`${out}/classic.png`});
 R.pass=R.first.banner.startsWith('AI Enhanced')&&R.s.banner.startsWith('AI Classic')&&/AI CLASSIC$/.test(R.s.tag)&&(R.s.turn>=+minTurn||R.s.over)&&!errors.length;await ctx.close();return R});
if(PARTS.includes('replay'))await run('replay',async()=>{const {p,ctx,errors}=await page(undefined,'instant');const R={};
 await setup(p,{seed:'71037'});await start(p);R.live=await waitTurn(p,3);
 const [dl]=await Promise.all([p.waitForEvent('download',{timeout:60000}),p.evaluate(()=>[...document.querySelectorAll('button')].find(b=>b.textContent==='Save replay').click())]);
 const file=out+'/replay-enhanced.json';await dl.saveAs(file);const rep=JSON.parse(fs.readFileSync(file,'utf8'));R.saved={aiMode:rep.aiMode,build:rep.build,responses:rep.responses?.length,version:rep.version};
 const legacy={...rep};delete legacy.aiMode;delete legacy.build;fs.writeFileSync(out+'/replay-legacy.json',JSON.stringify(legacy));fs.writeFileSync(out+'/replay-bogus.json',JSON.stringify({...rep,aiMode:'bogus'}));
 const openReplay=async(f,dropdown)=>{await toNew(p);await p.evaluate(ai=>{const s=document.querySelector('#ai-mode');s.value=ai;s.dispatchEvent(new Event('change'))},dropdown);
  const input=await p.evaluateHandle(()=>[...document.querySelectorAll('input[type=file]')].find(i=>i.accept==='.json'));await input.asElement().setInputFiles(f);
  await p.waitForFunction(()=>{const n=document.querySelector('#notice');return n&&!n.hidden&&/Saved responses restored|replay/i.test(n.textContent)},null,{timeout:120000}).catch(()=>{});
  await p.waitForTimeout(4000);return {...await st(p),dropdownAfter:await p.evaluate(()=>document.querySelector('#ai-mode').value)}};
 R.explicit=await openReplay(file,'classic');R.legacy=await openReplay(out+'/replay-legacy.json','enhanced');
 const before=await st(p);R.bogus=await openReplay(out+'/replay-bogus.json','enhanced');R.bogusStartedDuel=R.bogus.banner!==''&&R.bogus.turn>0;
 R.errors=errors.filter(e=>!/unknown AI mode/i.test(e));await p.screenshot({path:`${out}/replay.png`});
 R.pass=R.saved.aiMode==='enhanced'&&R.saved.build==='ddl-test r36 2026-11-07-r36'&&R.saved.responses>0&&R.explicit.banner.startsWith('AI Enhanced')&&/Enhanced/.test(R.explicit.notice)&&R.legacy.banner.startsWith('AI Classic')&&/Classic/.test(R.legacy.notice)&&/unknown AI mode/i.test(R.bogus.notice)&&!R.bogusStartedDuel&&!R.errors.length;await ctx.close();return R});
if(PARTS.includes('finish'))await run('finish',async()=>{const R={games:[]};
 for(const seed of finishArg.split(',')){const {p,ctx,errors}=await page(undefined,'instant');const decks=seed==='71025'?{a:'mikanko',b:'kashtira'}:{a:'sky',b:'mikanko'};
  await setup(p,{seed,...decks});await start(p);const end=Date.now()+20*60000;let s;for(;;){s=await st(p);if(s.over||Date.now()>end)break;await p.waitForTimeout(2000)}
  await p.waitForTimeout(6000);const after=await p.evaluate(()=>{const vis=n=>{const r=n.getBoundingClientRect();const cs=getComputedStyle(n);return r.width>0&&r.height>0&&cs.visibility!=='hidden'&&cs.display!=='none'};
   const hits=[...document.querySelectorAll('body *')].filter(n=>n.children.length===0&&/RESOLVING/.test(n.textContent)&&vis(n)).map(n=>({id:n.id,cls:n.className,text:n.textContent.slice(0,60)}));
   return {dock:document.querySelector('#effect-dock-status')?.textContent,dockHidden:document.querySelector('#effect-dock')?.hidden,chain:document.querySelector('#chain')?.innerHTML.length,strip:document.querySelector('#event-chain-strip')?.hidden,visibleResolving:hits}});
  await p.screenshot({path:`${out}/finish-${seed}.png`});const G={seed,...decks,over:s.over,turn:s.turn,title:s.title,...after,errors};G.pass=s.over&&after.dock!=='RESOLVING'&&!after.chain&&after.strip!==false&&!after.visibleResolving.length&&!errors.length;R.games.push(G);await ctx.close()}
 R.pass=R.games.every(g=>g.pass);return R});
report.pass=Object.values(report.parts).every(x=>x.pass);fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,1));console.log(JSON.stringify({pass:report.pass,parts:Object.fromEntries(Object.entries(report.parts).map(([k,v])=>[k,v.pass]))}));await browser.close();

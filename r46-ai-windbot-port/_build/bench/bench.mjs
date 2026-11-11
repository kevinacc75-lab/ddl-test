// r45 v4 benchmark harness (from AI-STATUS 11 Nov h2h.mjs; adds per-decision timing + search-status counts). Original header: AI status 11 Nov 2026 (Seto, READ-ONLY research): our OptimalPilot vs in-browser WindBot (WASM), on the r43 build bytes.
// Run with cwd=/workspace/r43-build. Canonical site deck ids (RELAY-122 finding 1), tcg-2026-10-19 variants, fail-closed executor check.
// Our seat: search on, node budget 400 (the site's non-Instant budget), 1500 ms deadline, world pool, Enhanced (site default).
import fs from 'node:fs';import path from 'node:path';import {pathToFileURL} from 'node:url';
const arg=(k,v)=>{const i=process.argv.indexOf('--'+k);return i>0?process.argv[i+1]:v};
const ourDeckId=arg('ours','branded'),wbDeckId=arg('wb','branded'),wbSeat=+arg('wb-seat',1),first=+arg('first',0),seed=+arg('seed',91101),maxTurn=+arg('max-turn',30),budget=+arg('budget',400),deadlineMs=+arg('deadline-ms',1500),mode=arg('mode','enhanced'),out=arg('out'),logf=arg('log');
const dist=path.resolve('dist'),imp=f=>import(pathToFileURL(path.join(dist,f)).href);
const {db,scripts}=await import(pathToFileURL(path.resolve('tests/lib/engine-scenario.mjs')).href);
if(process.env.V4_PATCH&&fs.existsSync(path.resolve('dist/ai/v4-flags.mjs'))){const {setV4}=await import(pathToFileURL(path.resolve('dist/ai/v4-flags.mjs')).href);setV4(JSON.parse(process.env.V4_PATCH))}/* r45 benchmark ablations only */
if(process.env.R46_PATCH&&fs.existsSync(path.resolve('dist/ai/r46-flags.mjs'))){const {setR46}=await import(pathToFileURL(path.resolve('dist/ai/r46-flags.mjs')).href);setR46(JSON.parse(process.env.R46_PATCH))}/* r46 benchmark ablations only */
const {Duel}=await imp('duel.mjs');const {setAiMode,midgameLabel}=await imp('ai/midgame-flags.mjs');setAiMode(mode);
const {WindBotPilot,loadWindBot,windBotFor}=await imp('windbot/pilot.mjs');const {createOptimalPilots}=await imp('optimal-pilot.mjs');const {createSearchCore}=await imp('ai/engine-snapshot.mjs');
const decks=JSON.parse(fs.readFileSync('dist/decks.json')).decks.map(d=>d.banlistVariants?.['tcg-2026-10-19']?{...d,...d.banlistVariants['tcg-2026-10-19'],id:d.id}:d);
const D=id=>{const d=decks.find(x=>x.id===id);if(!d)throw Error('no deck '+id);return d};
const ourSeat=1-wbSeat,pair=[];pair[ourSeat]=D(ourDeckId);pair[wbSeat]=D(wbDeckId);
if(!windBotFor(wbDeckId))throw Error('WindBot has no script for '+wbDeckId);
const logs=[],real=console.log,realW=process.stdout.write.bind(process.stdout);console.log=(...a)=>logs.push(a.join(' '));process.stdout.write=(c)=>{logs.push(String(c));return true};
const exports=await loadWindBot(db,pathToFileURL(path.resolve('dist/wb')+'/'),fs.readFileSync('dist/wb/default.json','utf8'));
let deadline=Infinity;const shouldStop=()=>performance.now()>=deadline;
const ours=createOptimalPilots({seed,nodeBudget:budget,searchCore:await createSearchCore(db,scripts),worldPool:true,poolKey:'ais:'+seed+':'+ourSeat,poolSize:10,seatCapBytes:40*1048576,shouldStop})[ourSeat];
const live=await Duel.create(db,scripts),d=new Duel(live.core,db,scripts);
const bot=new WindBotPilot({seat:wbSeat,seed,deck:pair[wbSeat],exports});await bot.attach(d,wbSeat===first?0:1);
const counts=[0,1].map(t=>{const s=t===0?first:1-first;return [pair[s].main.length,pair[s].extra.length]});
globalThis.__ocgRawHook=(h,raw)=>{if(h===d.handle)bot.batch(d,raw,counts)};
const t0=Date.now(),trace=[],dec=[0,0],ms=[],sstat={};let end='running',err=null,rej=[0,0],n=0;
const brief=(p)=>({rule:p?.rule??p?.why?.rule??null,kind:p?.kind??null,label:p?.label??p?.title??p?.choice?.label??null,card:p?.card??p?.code??null,search:p?.search?.status??null});
try{d.start(pair,{seed,first});
 const exec=logs.find(l=>/Deck (not )?found/.test(l))||null;if(!exec||!exec.includes('loading AI_'+windBotFor(wbDeckId).executor))throw Error('executor check failed: '+exec);
 while(d.prompt&&!d.finished&&n<20000){n++;if(d.turn>maxTurn){end='turn cap';break}const m=d.prompt,s=m.seat,before=d.retries;let plan;
  if(s===wbSeat){plan=bot.plan(d);if(!plan){end='windbot stall';break}}else{const q0=performance.now();deadline=deadlineMs>0?q0+deadlineMs:Infinity;plan=ours.plan(d);deadline=Infinity;ms.push(performance.now()-q0);if(plan?.search){const k=plan.search.status||'?';sstat[k]=(sstat[k]||0)+1;if(plan.search.finished)sstat.finished=(sstat.finished||0)+1;sstat.searches=(sstat.searches||0)+1;sstat.searchMs=(sstat.searchMs||[]);sstat.searchMs.push(Math.round(ms.at(-1)))};if(!plan?.response){end='ours stall';break}}
  d.respond(plan.response);if(d.retries===before){(s===wbSeat?bot:ours).observe(plan);dec[s]++}else{rej[s]++;(globalThis.REJ??=[]).push({seat:s,t:d.turn,ph:d.phase,type:m.type,hint:d.hint,response:plan.response,rule:plan?.rule??plan?.book?.rule??null,kind:plan?.kind??plan?.book?.kind??null,cards:(m.selects||m.select_cards||[]).map(c=>d.name?.(c.code)),min:m.min,max:m.max,effect:d.currentEffect?.code?d.name(d.currentEffect.code):null,forced:m.forced,raw:JSON.stringify(m,(k,v)=>typeof v==="bigint"?String(v):v).slice(0,1500),choices:(d.choices?.()||[]).map(o=>o.label+":"+JSON.stringify(o.response))});if(rej[s]>(s===wbSeat?5:0)){end=(s===wbSeat?'windbot':'ours')+' rejected';break}}
  if(logf)trace.push({t:d.turn,ph:d.phase??null,s,who:s===wbSeat?'WB':'OURS',pt:m.type,...brief(plan)})}
 if(end==='running')end=d.finished?'win reason '+(d.winReason??'?'):'stopped';
}catch(e){end='error';err=String(e?.stack||e).split('\n').slice(0,3).join(' | ')}
finally{globalThis.__ocgRawHook=null;console.log=real;process.stdout.write=realW}
const winner=d.finished&&d.winner!=null?(d.winner===wbSeat?'windbot':'ours'):null;
let poolStats=null;try{const wp=await imp('ai/world-pool.mjs');const p=wp.poolFor(['ais:'+seed+':'+ourSeat,ourSeat,10].join('|'),10);const S=p.summary();poolStats={maintenances:S.maintenances,created:S.created,advanced:S.advanced,scheduled:S.scheduled,turnCycle:S.turnCycle,discarded:S.discarded,averageWorldAge:S.averageWorldAge}}catch(e){poolStats=String(e)}
const row={rejectInfo:globalThis.REJ||undefined,seed,first,ourDeck:ourDeckId,wbDeck:wbDeckId,ourSeat,wbSeat,oursFirst:ourSeat===first,mode:mode+' '+midgameLabel(),budget,deadlineMs,winner,end,turns:d.turn,lp:d.lp,decisions:{ours:dec[ourSeat],wb:dec[wbSeat]},rejected:{ours:rej[ourSeat],wb:rej[wbSeat]},engineErrors:(d.errors||[]).length,oursMs:(()=>{const a=[...ms].sort((x,y)=>x-y);return {n:a.length,median:Math.round(a[a.length>>1]||0),p95:Math.round(a[Math.floor(a.length*.95)]||0),max:Math.round(a.at(-1)||0),over1500:a.filter(x=>x>1500).length}})(),searchStatus:(()=>{const a=(sstat.searchMs||[]).sort((x,y)=>x-y);const o={...sstat};delete o.searchMs;o.searchMsMedian=a[a.length>>1]??null;o.searchMsP95=a[Math.floor(a.length*.95)]??null;o.searchOver1500=a.filter(x=>x>1500).length;return o})(),pool:poolStats,err,wallSec:Math.round((Date.now()-t0)/1000),node:process.version};
if(logf)fs.writeFileSync(logf,JSON.stringify({row,trace,events:(d.log||d.events||[]).slice?.(-4000)??null},(k,v)=>typeof v==='bigint'?String(v):v));
const line=JSON.stringify(row,(k,v)=>typeof v==='bigint'?String(v):v);if(out)fs.appendFileSync(out,line+'\n');realW(line+'\n');try{d.stop();bot.close()}catch{}process.exit(0);

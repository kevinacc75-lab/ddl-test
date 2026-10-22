// TASK c smoke (Claude, 21 Oct): N CPU-v-CPU duels per preset under the 19 Oct list (the app's 19 Oct versions),
// each against the other legal presets in turn, alternating who goes first. Checks every duel ends (or reaches the
// decision cap) with no script errors, engine retries or pilot failures. --search on uses the full optimal pilot
// (world pool, fixed work budget per decision, as tools/r19-budget-probe.mjs); off uses its base policy (fast).
//   node tools/taskc-smoke.mjs --deck hero --duels 20 [--search on --work 900] [--max-decisions 1500]
import fs from 'node:fs';import zlib from 'node:zlib';
import {Duel} from '../dist/duel.mjs';import {createOptimalPilots} from '../dist/optimal-pilot.mjs';import {safeView} from '../dist/ai/knowledge.mjs';
import {createSearchCore} from '../dist/ai/engine-snapshot.mjs';import {dropAllPools} from '../dist/ai/world-pool.mjs';
const arg=(k,v)=>{const i=process.argv.indexOf('--'+k);return i>0?process.argv[i+1]:v};
const id=arg('deck','hero'),N=+arg('duels',20),search=arg('search','off')==='on',work=+arg('work',900),cap=+arg('max-decisions',1500);
const db=JSON.parse(zlib.gunzipSync(fs.readFileSync('dist/cards.json.gz'))),scripts=JSON.parse(zlib.gunzipSync(fs.readFileSync('dist/scripts.json.gz')));
const all=JSON.parse(fs.readFileSync('dist/decks.json')).decks.map(d=>d.banlistVariants?.['tcg-2026-10-19']?{...d,...d.banlistVariants['tcg-2026-10-19']}:d);
const me=all.find(d=>d.id===id),opps=all.filter(d=>d.id!==id); // r25: Branded v5.3 is legal under 19 Oct
let units=0;const respond=Duel.prototype.respond;Duel.prototype.respond=function(...a){units++;return respond.apply(this,a)};
const live=await Duel.create(db,scripts),core=search?await createSearchCore(db,scripts):null,rows=[],t0=Date.now();
for(let k=0;k<N;k++){const opp=opps[k%opps.length],seed=9100+k,first=k%2,d=new Duel(live.core,db,scripts);let decisions=0,fail=null;
 const pilots=createOptimalPilots(search?{seed,nodeBudget:400,searchCore:core,worldPool:true,poolKey:'smoke:'+seed,poolSize:10,seatCapBytes:40*1048576,shouldStop:()=>units>=limit}:{seed,searchEnabled:false});let limit=Infinity;
 try{d.start([me,opp],{seed,first});
  while(d.prompt&&!d.finished&&decisions<cap){const p=pilots[d.prompt.seat];limit=units+work;const plan=search?p.plan(d):p.base(safeView(d,d.prompt.seat));limit=Infinity;if(!plan?.response){fail='no response';break}
   d.respond(plan.response);if(!search)p.observe(plan);decisions++;if(d.retries>5){fail="engine retries";if(process.env.DEBUG)console.log(JSON.stringify({prompt:d.prompt,resp:plan.response,rule:plan.rule,log:d.log.slice(-8).map(x=>x.text)},(k,v)=>typeof v==="bigint"?String(v):v).slice(0,2500));break}}}
 catch(e){fail=e.message.slice(0,160)}
 const row={k,opp:opp.id,seed,first,finished:d.finished,winner:d.finished?(d.winner===0?id:d.winner===1?opp.id:'draw'):null,turns:d.turn,decisions,errors:d.errors.slice(0,3),fail};
 rows.push(row);console.log(JSON.stringify(row));d.stop();if(search)dropAllPools()}
const summary={deck:id,list:'tcg-2026-10-19',search,work:search?work:null,node:process.version,duels:N,finished:rows.filter(r=>r.finished).length,capped:rows.filter(r=>!r.finished&&!r.fail).length,
 failures:rows.filter(r=>r.fail).length,scriptErrors:rows.reduce((s,r)=>s+r.errors.length,0),wins:rows.filter(r=>r.winner===id).length,meanTurns:+(rows.reduce((s,r)=>s+r.turns,0)/N).toFixed(1),wallSec:Math.round((Date.now()-t0)/1000)};
console.log(JSON.stringify(summary));

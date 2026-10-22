// r18 TASK a0 probe (Claude, 20 Oct): a CPU-v-CPU duel where every search decision gets the browser's per-decision
// deadline (the live worker's shouldStop), with the persistent world pool on, as in the Watch-mode AI worker
// (10 slots per seat, 40 MB per seat, 400 nodes). Reports completed worlds per decision, the share of decisions under
// 8 worlds, pin conflicts and pool flags. Usage:
//   node tools/r18-browser-probe.mjs --seed 808 --a 0 --b 2 --first 0 --deadline-ms 1500 --max-decisions 400 [--out file.json]
import fs from 'node:fs';import zlib from 'node:zlib';
import {Duel} from '../dist/duel.mjs';import {createOptimalPilots} from '../dist/optimal-pilot.mjs';import {createSearchCore} from '../dist/ai/engine-snapshot.mjs';import {dropAllPools} from '../dist/ai/world-pool.mjs';
const arg=(k,v)=>{const i=process.argv.indexOf('--'+k);return i>0?process.argv[i+1]:v};
const seed=+arg('seed',808),A=+arg('a',0),B=+arg('b',2),first=+arg('first',0),deadlineMs=+arg('deadline-ms',1500),maxDecisions=+arg('max-decisions',400),poolSize=+arg('pool-size',10),nodes=+arg('nodes',400);
const db=JSON.parse(zlib.gunzipSync(fs.readFileSync('dist/cards.json.gz'))),scripts=JSON.parse(zlib.gunzipSync(fs.readFileSync('dist/scripts.json.gz'))),decks=JSON.parse(fs.readFileSync('dist/decks.json')).decks;
const d=await Duel.create(db,scripts),searchCore=await createSearchCore(db,scripts);let deadline=Infinity;const shouldStop=()=>performance.now()>=deadline;
const pilots=createOptimalPilots({seed,nodeBudget:nodes,searchCore,worldPool:true,poolKey:'probe:'+seed,poolSize,seatCapBytes:80*1048576/2,shouldStop});
const rows=[];let decisions=0;const t0=Date.now();
try{d.start([decks[A],decks[B]],{seed,first});
 while(d.prompt&&!d.finished&&decisions<maxDecisions){const seat=d.prompt.seat,p=pilots[seat],n=d.responseHistory.length;
  const start=performance.now();deadline=start+deadlineMs;const plan=p.plan(d);const ms=Math.round(performance.now()-start);deadline=Infinity;decisions++;
  const s=plan?.search;if(s&&s.determinizations!==undefined)rows.push({n,seat,turn:d.turn,ms,worlds:s.determinizations,aggregated:s.aggregatedWorlds,status:s.status,pinConflicts:s.pinConflicts||0,lastRejection:s.lastRejection??null,rejections:s.rejectionHistogram||{},pinDetails:s.pinConflictDetails||[],attempts:s.sampleAttempts,failedRemaps:s.failedRemaps,pool:s.pool?{complete:s.pool.complete,created:s.pool.created,advanced:s.pool.advanced,failedRefills:s.pool.failedRefills,behind:s.pool.behind,outOfSync:s.pool.outOfSync,worlds:s.pool.worlds}:null});
  if(!plan?.response)break;d.respond(plan.response)}
}finally{d.stop();dropAllPools()}
const roots=rows.length,under8=rows.filter(r=>r.worlds<8).length,zero=rows.filter(r=>r.worlds===0).length,pins=rows.reduce((s,r)=>s+r.pinConflicts,0),rootsWithPins=rows.filter(r=>r.pinConflicts).length;
const hist={};for(const r of rows)if(r.worlds<16)for(const [k,v] of Object.entries(r.rejections||{})){const key=k.replace(/\d+/g,'#').slice(0,90);hist[key]=(hist[key]||0)+v}
const summary={rejectionHistogram:hist,seed,decks:[decks[A].id,decks[B].id],first,deadlineMs,poolSize,nodes,node:process.version,decisions,searchRoots:roots,under8Pct:roots?+(100*under8/roots).toFixed(1):null,zeroWorldPct:roots?+(100*zero/roots).toFixed(1):null,meanWorlds:roots?+(rows.reduce((s,r)=>s+r.worlds,0)/roots).toFixed(2):null,pinConflicts:pins,rootsWithPinConflicts:rootsWithPins,finished:d.finished,turns:d.turn,wallSec:Math.round((Date.now()-t0)/1000)};
console.log(JSON.stringify(summary));const out=arg('out',null);if(out)fs.writeFileSync(out,JSON.stringify({summary,rows},null,1));

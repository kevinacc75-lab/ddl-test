// r18b TASK a2 probe (Claude, 20 Oct): N seeded CPU-v-CPU Branded openings. Reports, per opening and in total, the
// Branded end board after its first turn (monsters + Spells/Traps on the field), whether a payoff is on board,
// passivePass decisions, book steps, and Trap/Quick-Play cards still in hand (unset) at the end of Branded's turns 1 and 2.
// --book off runs the same build with every r18b rule disabled (the "before").  --search on uses the live AI search
// with the browser deadline (slow; for Seto). Usage:
//   node tools/r18b-opening-probe.mjs --seeds 20 --start 1 --book on --search off [--own-turns 2] [--order alternate|first|second] --out r18b-openings.json
import fs from 'node:fs';import zlib from 'node:zlib';
import {Duel} from '../dist/duel.mjs';import {createOptimalPilots,isPayoff} from '../dist/optimal-pilot.mjs';import {createSearchCore} from '../dist/ai/engine-snapshot.mjs';import {dropAllPools} from '../dist/ai/world-pool.mjs';import {holdReason} from '../dist/ai/book/book.mjs';
const arg=(k,v)=>{const i=process.argv.indexOf('--'+k);return i>0?process.argv[i+1]:v};
const N=+arg('seeds',20),start=+arg('start',1),book=arg('book','on')!=='off',search=arg('search','off')==='on',deadlineMs=+arg('deadline-ms',1500),opps=(arg('opps','sky,luna,mikanko')).split(','),ownTurnsMax=+arg('own-turns',2),order=arg('order','alternate');
const db=JSON.parse(zlib.gunzipSync(fs.readFileSync('dist/cards.json.gz'))),scripts=JSON.parse(zlib.gunzipSync(fs.readFileSync('dist/scripts.json.gz'))),decks=JSON.parse(fs.readFileSync('dist/decks.json')).decks.map(x=>{const v=x.banlistVariants?.[arg('list','')];return v?{...x,...v}:x});// r26: --list tcg-2026-10-19 uses the 19 Oct preset versions (Branded v5.3)

const d=await Duel.create(db,scripts),searchCore=search?await createSearchCore(db,scripts):null;let deadline=Infinity;const shouldStop=()=>performance.now()>=deadline;
const rows=[];const t0=Date.now(),cost={decisions:0,ms:0,searches:0,searchMs:0,slowOther:0,slowOtherMs:0};
for(let k=0;k<N;k++){const seed=start+k,opp=opps[k%opps.length],first=order==='first'?0:order==='second'?1:k%2===0?0:1;// Branded is seat 0; --order alternate|first|second
 const pilots=createOptimalPilots({seed,searchEnabled:search,nodeBudget:400,searchCore,worldPool:search,poolKey:'open:'+seed,poolSize:10,seatCapBytes:40*1048576,shouldStop,book});
 d.start([decks.find(x=>x.id==='branded'),decks.find(x=>x.id===opp)],{seed,first});
 const nm=c=>d.name(c.code),startHand=d.zone(0,2).filter(Boolean).map(nm);let ownTurns=0,lastTurn=d.turn,lastActive=d.active,row={seed,opp,first:first===0,hand:startHand,passivePass:[],unsetT1:null,unsetT2:null};
 // Trap/Quick-Play cards left in hand at the end of the turn that no r18b hold rule covers (same rule for book on and off).
 const settableInHand=()=>d.zone(0,2).filter(c=>c&&((d.db[c.code]?.type&4)||(d.db[c.code]?.type&65536))&&!holdReason(d,0,c)).map(nm),heldInHand=()=>d.zone(0,2).filter(c=>c&&((d.db[c.code]?.type&4)||(d.db[c.code]?.type&65536))&&holdReason(d,0,c)).map(c=>holdReason(d,0,c));
 const snapEnd=()=>{ownTurns++;const mons=d.zone(0,4).filter(Boolean),st=d.zone(0,8).filter(Boolean).filter(c=>c.sequence<5);
  if(ownTurns===1){row.board=mons.map(nm);row.backrow=st.map(c=>(c.position&5)?nm(c):'set:'+nm(c));row.endBoard=mons.length+st.length;row.payoff=mons.some(c=>isPayoff(nm(c)));row.unsetT1=settableInHand();row.heldT1=heldInHand()}
  if(ownTurns===2)row.unsetT2=settableInHand()};
 let n=0;while(d.prompt&&!d.finished&&ownTurns<ownTurnsMax&&n<1500){
  if(d.turn!==lastTurn){if(lastActive===0)snapEnd();lastTurn=d.turn;lastActive=d.active;if(ownTurns>=ownTurnsMax)break}
  const s=d.prompt.seat,tp=performance.now();deadline=search?tp+deadlineMs:Infinity;const plan=pilots[s].plan(d);deadline=Infinity;if(!plan)break;const dt=performance.now()-tp;cost.decisions++;cost.ms+=dt;if(plan.search){cost.searches++;cost.searchMs+=dt}else if(dt>50){cost.slowOther++;cost.slowOtherMs+=dt}
  if(s===0&&plan.passivePass)row.passivePass.push('t'+d.turn+': '+plan.passivePass);
  d.respond(plan.response);for(const p of pilots)p.observe?.(plan);n++}
 if(d.finished&&ownTurns<ownTurnsMax&&lastActive===0)snapEnd();
 row.book=pilots[0].info().book;row.finished=d.finished;rows.push(row);
 console.log(JSON.stringify({seed,opp,first:row.first,endBoard:row.endBoard,board:row.board,backrow:row.backrow,payoff:row.payoff,passivePass:row.passivePass.length,unsetT1:row.unsetT1,heldT1:row.heldT1,unsetT2:row.unsetT2,steps:row.book?.steps}));
 d.stop();if(search)dropAllPools();
}
const mean=a=>a.length?+(a.reduce((x,y)=>x+y,0)/a.length).toFixed(2):null;
const firstRows=rows.filter(r=>r.first);
const summary={book,search,ownTurns:ownTurnsMax,node:process.version,openings:rows.length,meanEndBoard:mean(rows.map(r=>r.endBoard??0)),meanEndBoardFirst:mean(firstRows.map(r=>r.endBoard??0)),boards2plus:rows.filter(r=>(r.endBoard??0)>=2).length,payoffBoards:rows.filter(r=>r.payoff).length,passivePass:rows.reduce((s,r)=>s+r.passivePass.length,0),unsetEndT1:rows.reduce((s,r)=>s+(r.unsetT1?.length||0),0),heldByRuleT1:rows.reduce((s,r)=>s+(r.heldT1?.length||0),0),unsetEndT2:rows.reduce((s,r)=>s+(r.unsetT2?.length||0),0),bookSteps:rows.reduce((s,r)=>s+(r.book?.steps||0),0),decisions:cost.decisions,searchDecisions:cost.searches,msPerDecision:+(cost.ms/Math.max(1,cost.decisions)).toFixed(1),msPerSearch:+(cost.searchMs/Math.max(1,cost.searches)).toFixed(1),slowNonSearch:cost.slowOther,slowNonSearchMs:Math.round(cost.slowOtherMs),wallSec:Math.round((Date.now()-t0)/1000)};
console.log(JSON.stringify(summary));const out=arg('out',null);if(out)fs.writeFileSync(out,JSON.stringify({summary,rows},null,1));

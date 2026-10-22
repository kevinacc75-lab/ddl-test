// r21 (Seto, 21 Oct: passivePass was 16 in 11 of 20 openings with search ON): never pass with a live hand holds when
// search is on. The live AI (search, world pool, 400 nodes) plays Branded's openings with a fixed work budget per
// decision (engine responses counted, never the clock), so the run is deterministic. No decision may be passive:
// ending the Main Phase, or Normal Summoning a card that starts nothing, while a starter is playable.
import assert from 'node:assert/strict';import fs from 'node:fs';import {gunzipSync} from 'node:zlib';
import {Duel} from '../dist/duel.mjs';import {createOptimalPilots} from '../dist/optimal-pilot.mjs';import {createSearchCore} from '../dist/ai/engine-snapshot.mjs';import {dropAllPools} from '../dist/ai/world-pool.mjs';
const db=JSON.parse(gunzipSync(fs.readFileSync('dist/cards.json.gz'))),scripts=JSON.parse(gunzipSync(fs.readFileSync('dist/scripts.json.gz'))),decks=JSON.parse(fs.readFileSync('dist/decks.json')).decks;
let units=0,limit=Infinity;const respond=Duel.prototype.respond;Duel.prototype.respond=function(...a){units++;return respond.apply(this,a)};
const d=await Duel.create(db,scripts),core=await createSearchCore(db,scripts),out=[];
for(const [seed,opp,first] of [[1,'sky',0],[2,'luna',1],[3,'mikanko',0],[4,'sky',1]]){
 const pilots=createOptimalPilots({seed,nodeBudget:400,searchCore:core,worldPool:true,poolKey:'r21:'+seed,poolSize:10,seatCapBytes:40*1048576,shouldStop:()=>units>=limit});
 d.start([decks.find(x=>x.id==='branded'),decks.find(x=>x.id===opp)],{seed,first});
 let n=0,searched=0;const passive=[];
 while(d.prompt&&!d.finished&&d.turn<=2&&n<500){const p=d.prompt;limit=units+1500;const plan=pilots[p.seat].plan(d);limit=Infinity;assert.ok(plan);
  if(p.seat===0){if(plan.search)searched++;if(plan.passivePass)passive.push('t'+d.turn+': '+plan.passivePass)}
  const before=units;d.respond(plan.response);units=before;for(const x of pilots)x.observe?.(plan);n++}
 d.stop();dropAllPools();
 out.push({seed,opp,first:first===0,searched,passive:passive.length});
 assert.ok(searched>0,'search ran for Branded');
 assert.equal(passive.length,0,'seed '+seed+': no passive decision with search on: '+passive.join(' | '));
}
console.log(JSON.stringify({test:'r21-no-passive-search',pass:true,openings:out}));

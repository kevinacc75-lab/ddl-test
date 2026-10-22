// r19 (Seto-approved 21 Oct): batch known-draw placement + the copy-count pin fix. Deterministic: the work budget is
// counted in engine responses, never the clock.
// 1. Seed 808, decision 218, seat 0: r18b put two pins on the one Sky Striker Mecha Modules - Multirole (two hidden-draw
//    repairs for the same physical card). r19 replaces the older hypothesis: no pin conflict.
// 2. Seed 808, decision 287, seat 1: with 2000 engine responses, batch placement reaches a world; one-at-a-time repair
//    (batch off) does not. Accepted worlds still pass the unchanged strict root check; the live duel is untouched.
import assert from 'node:assert/strict';import fs from 'node:fs';import {gunzipSync} from 'node:zlib';
import {Duel} from '../dist/duel.mjs';import {Determinizations} from '../dist/ai/determinize.mjs';import {createSearchCore,restorePristine} from '../dist/ai/engine-snapshot.mjs';import {publicKey,promptKey} from '../dist/ai/knowledge.mjs';
const db=JSON.parse(gunzipSync(fs.readFileSync('dist/cards.json.gz'))),scripts=JSON.parse(gunzipSync(fs.readFileSync('dist/scripts.json.gz'))),decks=JSON.parse(fs.readFileSync('dist/decks.json')).decks;
const f=JSON.parse(fs.readFileSync('tests/fixtures/r19-batch-placement.json'));
let units=0;const respond=Duel.prototype.respond;Duel.prototype.respond=function(...a){units++;return respond.apply(this,a)};
const live=await Duel.create(db,scripts),core=await createSearchCore(db,scripts);
const at=n=>{const d=new Duel(live.core,db,scripts);d.start(f.decks.map(id=>decks.find(x=>x.id===id)),{seed:f.seed,first:f.first});for(const r of f.responses.slice(0,n))d.respond(r);assert.equal(d.responseHistory.length,n);return d};
const snapshot=d=>JSON.stringify([d.responseHistory,publicKey(d,0),publicKey(d,1),promptKey(d,d.prompt.seat)]);
// 1. copy-count pin fix
{const d=at(218),seat=d.prompt.seat,before=snapshot(d);assert.equal(seat,0);
 const sampler=new Determinizations(d,seat,f.seed+':ai:'+seat+':218',{searchCore:core});
 for(let k=0;k<3;k++){restorePristine(core);const w=sampler.sample(k);if(w)w.stop()}
 assert.equal(sampler.pinConflicts.length,0,'no pins beyond the copies in the Deck: '+JSON.stringify(sampler.pinConflicts[0]||null));
 assert.ok((sampler.replacedCorrections||0)>0,'the fixture exercises a replaced repair hypothesis');
 assert.equal(snapshot(d),before,'sampling never changes the live duel');d.stop()}
// 2. batch placement at a fixed work budget
const run=(d,seat,batch,budget)=>{const sampler=new Determinizations(d,seat,f.seed+':ai:'+seat+':287',{searchCore:core});sampler.batchKnownDraws=batch;const u0=units,stop=()=>units-u0>=budget;let worlds=0;
 for(let k=0;k<256&&worlds<16&&!stop();k++){restorePristine(core);const w=sampler.sample(k,stop);if(w){worlds++;assert.equal(publicKey(w,seat)+'|'+promptKey(w,seat),publicKey(d,seat)+'|'+promptKey(d,seat),'accepted world matches the public root');w.stop()}}
 return {worlds,attempts:sampler.attempts,placed:sampler.batchPlacements||0,maxBatch:Math.max(0,...sampler.failures.map(x=>x.batch?.size||0)),pins:sampler.pinConflicts.length}};
{const d=at(287),seat=d.prompt.seat,before=snapshot(d);assert.equal(seat,1);
 const single=run(d,seat,false,2000),batch=run(d,seat,true,2000);
 assert.equal(single.placed,0,'batch off places nothing in batches');
 assert.ok(batch.maxBatch>=2,'one replay queues two or more placements: '+JSON.stringify(batch));
 assert.ok(batch.worlds>single.worlds,'batch placement finds more worlds at the same work: '+JSON.stringify({single,batch}));
 assert.equal(batch.pins+single.pins,0,'no pin conflicts');
 assert.equal(snapshot(d),before,'sampling never changes the live duel');d.stop();
 console.log(JSON.stringify({test:'r19-batch-placement',pass:true,single,batch}))}

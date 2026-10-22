// r18 TASK a (Seto 20 Oct): semantic find() must replay the SAME physical copy when several same-code copies sit in a
// public zone. Seed 808, decision 226, seat 0: two Fallen of Albaz in the GY; step 223 banishes the copy that was
// Special Summoned on turn 1 (its GY status keeps STATUS_SPSUMMON_TURN). r17 banished the other copy in every rebuilt
// world, so the strict root check rejected it ("root differs ... zones.16.7.4"). Fails on r17, passes on r18.
import assert from 'node:assert/strict';import fs from 'node:fs';import {gunzipSync} from 'node:zlib';
import {Duel} from '../dist/duel.mjs';import {Determinizations} from '../dist/ai/determinize.mjs';import {createSearchCore,restorePristine} from '../dist/ai/engine-snapshot.mjs';import {publicKey,promptKey} from '../dist/ai/knowledge.mjs';
const db=JSON.parse(gunzipSync(fs.readFileSync('dist/cards.json.gz'))),scripts=JSON.parse(gunzipSync(fs.readFileSync('dist/scripts.json.gz'))),decks=JSON.parse(fs.readFileSync('dist/decks.json')).decks;
const f=JSON.parse(fs.readFileSync('tests/fixtures/r18-duplicate-copy.json')),live=await Duel.create(db,scripts),core=await createSearchCore(db,scripts);
const d=new Duel(live.core,db,scripts);d.start(f.pair.map(id=>decks.find(x=>x.id===id)),{seed:f.seed,first:f.first});for(const r of f.responses)d.respond(r);
assert.equal(d.responseHistory.length,f.decision);assert.equal(d.prompt.seat,f.seat);
const albaz=(duel,loc)=>duel.zone(0,loc).filter(c=>c&&c.code===f.albaz).map(c=>c.status);
assert.deepEqual([albaz(d,16),albaz(d,32)],[[f.liveStatus.gy],[f.liveStatus.banished]],'fixture: live GY keeps copy B, copy A (Special Summoned turn 1) is banished');
const unchanged=JSON.stringify([d.responseHistory,publicKey(d,0),publicKey(d,1),promptKey(d,f.seat)]);
const sampler=new Determinizations(d,f.seat,f.seed+':ai:'+f.seat+':'+f.decision,{searchCore:core});restorePristine(core);
let world=null,k=0;for(;k<4&&!world;k++){restorePristine(core);world=sampler.sample(k)}
const rootDiffers=sampler.failures.filter(x=>/^root differs/.test(x.reason));
assert.equal(rootDiffers.length,0,'no rebuilt world may banish the wrong Albaz copy (root differs): '+rootDiffers.map(x=>x.reason).join('; '));
assert.ok(world,'a world must be accepted within the first four proposals');
assert.deepEqual([albaz(world,16),albaz(world,32)],[[f.liveStatus.gy],[f.liveStatus.banished]],'the accepted world banished the same physical Albaz copy at step 223 as the live duel');
assert.equal(publicKey(world,f.seat)+'|'+promptKey(world,f.seat),publicKey(d,f.seat)+'|'+promptKey(d,f.seat),'accepted world matches the public root, GY status included');
assert.equal(JSON.stringify([d.responseHistory,publicKey(d,0),publicKey(d,1),promptKey(d,f.seat)]),unchanged,'sampling never changes the live duel');
const orders=world.sampleOrders,seed=world.sampleCoreSeed,responses=structuredClone(world.responseHistory),expected=publicKey(world,f.seat)+'|'+promptKey(world,f.seat);world.stop();restorePristine(core);
const replay=new Duel(core,db,scripts);replay.start(d.decks,{seed,coreSeed:seed,first:f.first,deckOrders:orders,observerSeat:f.seat});for(const r of responses)replay.respond(r);
assert.equal(publicKey(replay,f.seat)+'|'+promptKey(replay,f.seat),expected,'a plain replay of the accepted responses reaches the same public root');replay.stop();d.stop();
console.log(JSON.stringify({test:'duplicate-copy-remap',seed:f.seed,decision:f.decision,proposalsUsed:k,failures:sampler.failures.length,rootDiffers:rootDiffers.length,pass:true}));

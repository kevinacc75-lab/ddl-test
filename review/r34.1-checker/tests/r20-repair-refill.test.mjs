// r20 (Seto-approved 21 Oct): world-pool repair-refill. Deterministic (engine responses counted, never the clock).
// Seed 808, seat 0: a 4-world pool built at search root 140 (turn 3) loses its worlds at root 153 (turn 4) to the own
// Draw Phase draw. r20 rebuilds each from its own deck order with one exact exchange (the drawn card <-> the required
// card still in the Deck), so every slot is current again after one replay each; worlds still pass the strict root
// check. Then renew-when-ready: with no budget left, a world due for renewal keeps serving and is logged; and the r21
// hard cap: no world serves past 24 decisions.
import assert from 'node:assert/strict';import fs from 'node:fs';import {gunzipSync} from 'node:zlib';
import {Duel} from '../dist/duel.mjs';import {Determinizations} from '../dist/ai/determinize.mjs';import {createSearchCore,restorePristine,restoreWorld} from '../dist/ai/engine-snapshot.mjs';import {WorldPool} from '../dist/ai/world-pool.mjs';import {publicKey,promptKey} from '../dist/ai/knowledge.mjs';
const db=JSON.parse(gunzipSync(fs.readFileSync('dist/cards.json.gz'))),scripts=JSON.parse(gunzipSync(fs.readFileSync('dist/scripts.json.gz'))),decks=JSON.parse(fs.readFileSync('dist/decks.json')).decks;
const f=JSON.parse(fs.readFileSync('tests/fixtures/r20-repair-refill.json'));
let units=0;const respond=Duel.prototype.respond;Duel.prototype.respond=function(...a){units++;return respond.apply(this,a)};
const live=await Duel.create(db,scripts),core=await createSearchCore(db,scripts);
const at=n=>{const d=new Duel(live.core,db,scripts);d.start(f.decks.map(id=>decks.find(x=>x.id===id)),{seed:f.seed,first:f.first});for(const r of f.responses.slice(0,n))d.respond(r);return d};
const dA=at(140),dB=at(153);assert.equal(dA.prompt.seat,0);assert.equal(dB.prompt.seat,0);
const pool=new WorldPool('r20-test',4);
const a=pool.maintain(new Determinizations(dA,0,'808:ai:0:140',{searchCore:core}));
assert.equal(a.worlds.length,4,'pool filled at root 140');
const u0=units,before=JSON.stringify([dB.responseHistory,publicKey(dB,0),promptKey(dB,0)]);
const b=pool.maintain(new Determinizations(dB,0,'808:ai:0:153',{searchCore:core}));const used=units-u0,rep=b.report;
assert.ok(rep.discarded>=3,'the own draw retires most worlds: '+JSON.stringify(rep));
assert.ok((rep.exactSwaps||0)>=rep.discarded-1,'an exact exchange is found for the discarded worlds: '+JSON.stringify(rep));
assert.equal(b.worlds.length,4,'every slot is current again after maintenance: '+JSON.stringify(rep));
assert.ok((rep.repaired||0)>=rep.discarded-(rep.created||0),'discarded worlds come back by repair-refill');
for(const w of b.worlds){const sim=restoreWorld(w.snap);assert.equal(publicKey(sim,0)+'|'+promptKey(sim,0),publicKey(dB,0)+'|'+promptKey(dB,0),'repaired world matches the public root')}
restorePristine(core);
assert.equal(JSON.stringify([dB.responseHistory,publicKey(dB,0),promptKey(dB,0)]),before,'the live duel is unchanged');
// renew-when-ready: every slot is due (age 15 > 12), but the budget is already spent: worlds stay, counted as
// renewDeferred, and each world kept past 12 decisions is logged (r21).
for(const w of pool.slots)if(w)w.n-=15;
const c=pool.maintain(new Determinizations(dB,0,'808:ai:0:153b',{searchCore:core}),{shouldStop:()=>true});
assert.equal(pool.slots.filter(Boolean).length,4,'a world due for renewal is not dropped before its replacement exists');
assert.ok((c.report.renewDeferred||0)>=1,'renewals were deferred: '+JSON.stringify(c.report));
assert.equal(c.report.keptOverAge,4,'every world kept past 12 decisions is logged');assert.ok(pool.stats.overAgeLog.length>=4);
// r21 hard cap (Seto): never past 24 decisions. Worlds aged 30 are dropped and replaced even though they still advance.
for(const w of pool.slots)if(w)w.n-=15;
const e=pool.maintain(new Determinizations(dB,0,'808:ai:0:153c',{searchCore:core}));
assert.ok((e.report.hardCapped||0)>=4,'over-cap worlds are dropped: '+JSON.stringify(e.report));
assert.ok(pool.slots.every(w=>!w||e.report.decision-w.n<24),'no world older than 24 decisions remains');
pool.release();dA.stop();dB.stop();
console.log(JSON.stringify({test:'r20-repair-refill',pass:true,maintenance:{discarded:rep.discarded,exactSwaps:rep.exactSwaps||0,repaired:rep.repaired||0,created:rep.created,units:used}}));

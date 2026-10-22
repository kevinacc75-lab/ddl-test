// r19 (Claude, 21 Oct): rebuild one decision from a saved probe trajectory (r19-budget-probe --out) and compare the
// sampler with batch known-draw placement on and off at a fixed work budget. Deterministic. Reports accepted worlds,
// attempts, engine responses used, the failure-reason breakdown and pin conflicts. Usage:
//   node tools/r19-sampler-compare.mjs --from out/base-808.json --decisions 600,700 [--work 900] [--proposals 256]
import fs from 'node:fs';import zlib from 'node:zlib';
import {Duel} from '../dist/duel.mjs';import {Determinizations} from '../dist/ai/determinize.mjs';import {createSearchCore,restorePristine} from '../dist/ai/engine-snapshot.mjs';
const arg=(k,v)=>{const i=process.argv.indexOf('--'+k);return i>0?process.argv[i+1]:v};
const src=JSON.parse(fs.readFileSync(arg('from'))),work=+arg('work',900),proposals=+arg('proposals',256),wanted=arg('decisions','').split(',').filter(Boolean).map(Number);
const db=JSON.parse(zlib.gunzipSync(fs.readFileSync('dist/cards.json.gz'))),scripts=JSON.parse(zlib.gunzipSync(fs.readFileSync('dist/scripts.json.gz'))),decks=JSON.parse(fs.readFileSync('dist/decks.json')).decks;
let units=0;const respond=Duel.prototype.respond;Duel.prototype.respond=function(...a){units++;return respond.apply(this,a)};
const live=await Duel.create(db,scripts),core=await createSearchCore(db,scripts),s=src.summary,out=[];
for(const n of wanted){const d=new Duel(live.core,db,scripts);d.start(s.decks.map(id=>decks.find(x=>x.id===id)),{seed:s.seed,first:s.first});for(const r of src.responses.slice(0,n))d.respond(r);
 const seat=d.prompt.seat,row={n,seat,turn:d.turn};
 for(const batch of [false,true]){const sampler=new Determinizations(d,seat,s.seed+':ai:'+seat+':'+n,{searchCore:core});sampler.batchKnownDraws=batch;restorePristine(core);
  const u0=units,stop=()=>units-u0>=work;let worlds=0;for(let k=0;k<proposals&&worlds<16&&!stop();k++){restorePristine(core);const w=sampler.sample(k,stop);if(w){worlds++;w.stop()}}
  const hist={};for(const f of sampler.failures)hist[f.reason.replace(/\d+/g,'#').slice(0,60)]=(hist[f.reason.replace(/\d+/g,'#').slice(0,60)]||0)+1;
  row[batch?'batch':'single']={worlds,attempts:sampler.attempts,units:units-u0,failures:sampler.failures.length,batchRetries:sampler.batchRetries||0,batchPlacements:sampler.batchPlacements||0,pinConflicts:sampler.pinConflicts.length,pinDetail:sampler.pinConflicts[0]||null,reasons:hist}}
 d.stop();out.push(row);console.log(JSON.stringify(row))}
const out2=arg('out',null);if(out2)fs.writeFileSync(out2,JSON.stringify(out,null,1));

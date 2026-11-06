// r36 S4 flag F, friendly-chain guard (Claude as builder, 6 Nov 2026; ChatGPT RELAY-117 live play-test). In PREVIEW 2 seed
// 71091 (Sky v Mikanko, Mikanko first) Sky chained its OWN Ash Blossom to its OWN Sky Striker Ace = Zero (response 127,
// turn 3). The base pilot already declined ("Save the interruption"); the information-set root search overrode it, in
// Classic as well as Enhanced. F (Enhanced only) plays the decline without search when every open link is ours and a
// negating card is on offer. Fixture: the site's own export embedded in RELAY-117 (tests/fixtures/r36-relay117).
import assert from 'node:assert/strict';import fs from 'node:fs';
import {engine,stopEngine,db,scripts,M} from '../tools/s3-harness.mjs';import {Duel} from '../dist/duel.mjs';
import {createOptimalPilots} from '../dist/optimal-pilot.mjs';import {setAiMode,AI_S4} from '../dist/ai/midgame-flags.mjs';import {S4,setS4} from '../dist/ai/s4-flags.mjs';
import {friendlyChainNoSearch,battleNoSearch} from '../dist/ai/midgame-rules.mjs';import {safeView} from '../dist/ai/knowledge.mjs';import {createSearchCore} from '../dist/ai/engine-snapshot.mjs';
let pass=0,fail=0;const ok=async(n,f)=>{try{await f();pass++;console.log('ok',pass+fail,n)}catch(e){fail++;console.log('not ok',pass+fail,n,'--',e.message.split('\n')[0])}};
const R=JSON.parse(fs.readFileSync(new URL('./fixtures/r36-relay117/replay71091.json',import.meta.url),'utf8'));const ASH=14558127;
const live=await engine();
async function at(step,mode,search){setAiMode(mode);const d=new Duel(live.core,db,scripts);d.start(R.decks,{seed:R.seed,first:R.first});
 const ps=search?await (async()=>{const core=await createSearchCore(db,scripts);return createOptimalPilots({seed:R.seed,nodeBudget:search,searchCore:core,worldPool:true,poolKey:'fc:'+mode+':'+step,poolSize:10,seatCapBytes:40*1048576,shouldStop:()=>false})})():createOptimalPilots({seed:R.seed,searchEnabled:false});
 for(let i=0;i<step;i++){const m=d.prompt,s=m.seat??m.player,resp=R.responses[i];const before=d.retries;d.respond(resp);assert.equal(d.retries,before,'replay response '+i+' accepted');ps[s]?.observe?.({response:resp,seat:s})}
 const label=x=>d.choices().find(o=>JSON.stringify(o.response)===JSON.stringify(x.response))?.label;const pl=ps[0].plan(d);
 return {d,label:label(pl),rule:pl.rule,stat:ps[0].midgameStats.friendlyChainNoSearch,open:(d.chain||[]).filter(c=>!c.solved).map(c=>[c.code,c.controller])}}
await ok('mode maps: F is Enhanced only (Classic stays r35.12)',()=>{assert.deepEqual(JSON.parse(JSON.stringify(AI_S4)),{classic:{E:false,F:false},enhanced:{E:true,F:true}});setAiMode('enhanced');assert.equal(S4.F,true);setAiMode('classic');assert.equal(S4.F,false)});
await ok('fixture replays exactly on this build: 518 responses accepted, Sky (seat 0) wins 6200-0 on turn 8',()=>{setAiMode('classic');const d=new Duel(live.core,db,scripts);d.start(R.decks,{seed:R.seed,first:R.first});for(const r of R.responses){const b=d.retries;d.respond(r);assert.equal(d.retries,b)}assert.equal(d.finished,true);assert.equal(d.winner,0);assert.deepEqual(d.lp,[6200,0]);assert.equal(d.turn,8)});
await ok('the RELAY-117 prompt (response 127): open chain = our own Zero only; Ash and "Do not chain" offered',async()=>{const {d,open}=await at(127,'classic',0);assert.deepEqual(open,[[76072561,0]]);const c=d.choices();assert.ok(c.some(o=>o.code===ASH));assert.ok(c.some(o=>o.label==='Do not chain'))});
await ok('friendly: Enhanced with search (100 nodes) now declines - "Do not chain", guard counted once',async()=>{const r=await at(127,'enhanced',100);assert.equal(r.label,'Do not chain');assert.equal(r.stat,1)});
await ok('friendly, Classic with search (100 nodes): still chains its own Ash - the r35.12 defect, left unchanged by policy (Classic = r35.12)',async()=>{const r=await at(127,'classic',100);assert.equal(r.label,'Chain · Ash Blossom & Joyous Spring');assert.equal(r.stat,0)});
await ok('enemy control (response 306, turn 5): open chain = opponent\'s Ohime; the guard does NOT apply (Ash against the opponent stays available to search)',async()=>{const {d,open}=await at(306,'enhanced',0);assert.deepEqual(open.map(x=>x[1]),[1]);setAiMode('enhanced');const v=safeView(d,0),decline=d.choices().find(o=>o.label==='Do not chain');
 assert.equal(friendlyChainNoSearch(v,0,{response:decline.response}),null,'not friendly');const r=await at(306,'enhanced',100);assert.equal(r.stat,0,'guard not counted')});
await ok('pure guard: needs F, a chain prompt, only our open links, the base decline, and a negating card on offer',async()=>{const {d}=await at(127,'enhanced',0);setAiMode('enhanced');const v=safeView(d,0),c=d.choices(),decline=c.find(o=>o.label==='Do not chain'),ash=c.find(o=>o.code===ASH);
 assert.equal(friendlyChainNoSearch(v,0,{response:decline.response}),'friendlyChainNoSearch');assert.equal(battleNoSearch(v,0,{response:decline.response}),'friendlyChainNoSearch','wired into the Enhanced no-search hook');
 assert.equal(friendlyChainNoSearch(v,0,{response:ash.response}),null,'base itself chained: not overridden');setS4({F:false});assert.equal(friendlyChainNoSearch(v,0,{response:decline.response}),null,'F off');setAiMode('enhanced');
 const fake=Object.create(v);fake.chain=[{chain_size:1,code:76072561,controller:0,solved:false},{chain_size:2,code:1,controller:1,solved:false}];assert.equal(friendlyChainNoSearch(fake,0,{response:decline.response}),null,'an opposing link is open');
 const noNeg=Object.create(v);noNeg.choices=()=>c.filter(o=>o.code!==ASH);assert.equal(friendlyChainNoSearch(noNeg,0,{response:decline.response}),null,'no negating card on offer');
 const notChain=Object.create(v);notChain.prompt={...v.prompt,type:M.SELECT_IDLECMD};assert.equal(friendlyChainNoSearch(notChain,0,{response:decline.response}),null,'not a chain prompt')});
setAiMode('classic');stopEngine();console.log('r36 friendly-chain tests: '+pass+' passed'+(fail?', '+fail+' FAILED':''));process.exitCode=fail?1:0;process.exit();

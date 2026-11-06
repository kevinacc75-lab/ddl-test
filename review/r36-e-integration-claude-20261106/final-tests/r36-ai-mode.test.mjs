// r36 AI selector (Claude as builder, Nov 2026; Kevy 4 Nov 11:09: experimental Enhanced preview, the old AI kept as
// Classic = default; ChatGPT RELAY-105 readiness: one exact recipe with a flag map, cold load = Classic, a change takes
// effect on a new duel, stale async responses discarded). SELF-VERIFIED; for ChatGPT review.
//  1. Recipes: Classic = every r36 switch off; Enhanced = A+B only (C/T/Z held).
//  2. The REAL ai-worker.mjs (Node, fetch stubbed to dist/) runs each think in the mode the think names, whatever ran
//     before: the pilot's base() is spied for the live switches and the carried removal follow-up (Finding B).
//  3. Source isolation: app.mjs / index.html / worker.mjs / ai-worker.mjs differ from r35.12 (git d3177e0) ONLY by the
//     selector lines listed here (each file minus those lines = the r35.12 bytes).
//  4. Cold load = Classic: the select's default is Classic and nothing stores the choice.
import assert from 'node:assert/strict';import fs from 'node:fs';import crypto from 'node:crypto';import path from 'node:path';import {execFileSync} from 'node:child_process';
import {engine,stopEngine,scenario,drive,M} from '../tools/s3-harness.mjs';
import {exportSeatContext} from '../dist/ai/knowledge.mjs';
import {AI_MODES,AI_S4,aiModeOf,setAiMode,MIDGAME} from '../dist/ai/midgame-flags.mjs';
import {OptimalPilot} from '../dist/optimal-pilot.mjs';import {S4,setS4} from '../dist/ai/s4-flags.mjs';
let pass=0,fail=0;const ok=async(n,f)=>{try{await f();pass++;console.log('ok',pass+fail,n)}catch(e){fail++;console.log('not ok',pass+fail,n,'--',e.message.split('\n')[0])}};
await ok('recipes: Classic = all off; Enhanced = A+B; C, T, Z off in both; unknown/missing mode = Classic',()=>{
 assert.deepEqual({...AI_MODES.classic},{A:false,B:false,C:false,T:false,Z:false});assert.deepEqual({...AI_MODES.enhanced},{A:true,B:true,C:false,T:false,Z:false});
 for(const v of [undefined,null,'','ENHANCED','abc','classic'])assert.equal(aiModeOf(v),'classic',String(v));assert.equal(aiModeOf('enhanced'),'enhanced');
 setAiMode('enhanced');assert.deepEqual({...MIDGAME},{A:true,B:true,C:false,T:false,Z:false});setAiMode('classic');assert.deepEqual({...MIDGAME},{A:false,B:false,C:false,T:false,Z:false})});
// ---- 2. real ai-worker ----
globalThis.fetch=async u=>new Response(fs.readFileSync(path.join('dist',path.basename(String(u)))));
const out=[];globalThis.postMessage=m=>out.push(m);globalThis.onmessage=null;
await import('../dist/ai/ai-worker.mjs');const handle=globalThis.onmessage;assert.equal(typeof handle,'function');
const seen=[];const base0=OptimalPilot.prototype.base;OptimalPilot.prototype.base=function(d,o){seen.push({midgame:{...MIDGAME},s4:{...S4},pending:this.pendingRemoval??null});return base0.call(this,d,o)};
await engine();
const d=scenario(['sky','branded'],[{name:'Sky Striker Mecha - Widow Anchor',location:2,owner:0},{name:'Sky Striker Ace - Kagari',location:4,sequence:5,owner:0},{name:'Upstart Goblin',location:16,owner:0},{name:'Upstart Goblin',location:16,owner:0},{name:'Upstart Goblin',location:16,owner:0},{name:'Albion the Shrouded Dragon',location:4,sequence:0,owner:1}],{first:0,seed:7});
const endTurn=d=>{const m=d.prompt;if(m.type===M.SELECT_IDLECMD&&d.turn<3){const c=d.choices().find(o=>/End Turn|End phase|End Phase/i.test(o.label));if(c){d.respond(c.response);return true}}return false};
assert.ok(drive(d,{until:d=>d.turn>=3&&d.prompt?.type===M.SELECT_IDLECMD&&d.prompt.seat===0,onPrompt:endTurn,max:400}).stopped,'turn 3');
let id=0;const think=async(extra)=>{seen.length=0;out.length=0;const x={type:'think',id:++id,revision:d.revision,startedAt:Date.now(),seatContext:exportSeatContext(d,0),seed:7,first:0,seat:0,capMs:60000,nodeBudget:40,doctrine:true,decisionCount:0,duelId:900+id,aiSeats:1,poolSize:4,...extra};await handle({data:x});const dec=out.find(m=>m.type==='decision'||m.type==='error');assert.ok(dec,'a reply');assert.equal(dec.type,'decision',dec.message);return dec};
const fakeIntent={code:98338152,effect:'control',activation:{type:1,action:5,index:0},target:{code:1,location:4,sequence:0,controller:1},costs:null,preferredCost:null,turn:d.turn,link:1,seat:0};
await ok('real ai-worker: a Classic think runs with every switch off and ignores a carried pendingRemoval',async()=>{
 await think({aiMode:'classic',pendingRemoval:fakeIntent});assert.ok(seen.length>0,'base() ran');for(const s of seen){assert.deepEqual(s.midgame,{A:false,B:false,C:false,T:false,Z:false});assert.equal(s.pending,null)}});
await ok('real ai-worker: an Enhanced think runs A+B and the fresh pilot starts with the carried pendingRemoval (Finding B)',async()=>{
 await think({aiMode:'enhanced',pendingRemoval:fakeIntent});assert.deepEqual(seen[0].midgame,{A:true,B:true,C:false,T:false,Z:false});assert.equal(seen[0].pending?.code,98338152)});
await ok('real ai-worker: the mode is per think - Enhanced then a think with no mode field runs Classic (a stale global never leaks)',async()=>{
 await think({aiMode:'enhanced'});assert.equal(seen[0].midgame.A,true);await think({});assert.ok(seen.every(s=>!s.midgame.A&&!s.midgame.B))});
await ok('real ai-worker: same position, Classic think = the in-process Classic pilot\'s search-off baseline (no r36 rule reached the decision)',async()=>{
 const dec=await think({aiMode:'classic',nodeBudget:0});setAiMode('classic');const p=new OptimalPilot({seat:0,seed:7,searchEnabled:false});
 const {safeView}=await import('../dist/ai/knowledge.mjs');const b=base0.call(p,safeView(d,0));assert.ok(dec.response&&b?.response);assert.deepEqual(dec.response,b.response,'ai-worker Classic decision = Classic baseline');assert.ok(!dec.plan?.removalIntent,'no removal intent in Classic');
 setAiMode('enhanced');const e=base0.call(new OptimalPilot({seat:0,seed:7,searchEnabled:false}),safeView(d,0));setAiMode('classic');assert.ok(e.removalIntent,'control: the same position in Enhanced does arm the removal (the check can see a difference)')});
await ok('S4 lifecycle (RELAY-109/112): setAiMode sets the COMPLETE S4 map from the recipe (Classic E=false, Enhanced E=true); Classic after Enhanced, cold/missing mode and a stray setS4 are all reset; real ai-worker thinks carry the recipe',async()=>{
 assert.deepEqual(JSON.parse(JSON.stringify(AI_S4)),{classic:{E:false},enhanced:{E:true}},'mode maps');
 for(const [m,e] of [['enhanced',true],['classic',false],[undefined,false],['bogus',false]]){for(const stray of [true,false]){setS4({E:stray});setAiMode(m);assert.deepEqual({...S4},{E:e},String(m)+' after setS4 '+stray)}}
 setAiMode('enhanced');setAiMode('classic');assert.equal(S4.E,false,'Classic after Enhanced');
 for(const [m,e] of [['enhanced',true],['classic',false],['enhanced',true],[undefined,false]]){setS4({E:!e});await think({aiMode:m});assert.ok(seen.length&&seen.every(x=>x.s4.E===e),String(m)+': E='+e+' in every base() of the think')}
 const W=fs.readFileSync('dist/worker.mjs','utf8');assert.ok(W.includes("aiMode='classic';setAiMode(aiMode);"),'import-replay resets to Classic (S4 included)');assert.ok(W.includes('aiMode=aiModeOf(x.aiMode);setAiMode(aiMode);'),'duel start sets the mode (S4 included)')});
await ok('served r36 PREVIEW index.html whole-file pin (RELAY-112): e4399b3b...',()=>assert.equal(crypto.createHash('sha256').update(fs.readFileSync('dist/index.html')).digest('hex'),'e4399b3b7a846477e2185f1c3b6f45a6fd62b5887c34756a3006a425c7050d3a'));
OptimalPilot.prototype.base=base0;stopEngine();
// ---- 3. source isolation vs r35.12 ----
const r3512=f=>execFileSync('git',['show','d3177e0:'+f],{maxBuffer:64<<20}).toString();
const SEL={
 'dist/app.mjs':[["doctrine:$('#doctrine-guidance').checked,aiMode:$('#ai-mode')?.value==='enhanced'?'enhanced':'classic',","doctrine:$('#doctrine-guidance').checked,"],["· Doctrine ${x.match.doctrine?'on':'off'} · AI ${x.match.aiMode==='enhanced'?'Enhanced (experimental)':'Classic'}</small>","· Doctrine ${x.match.doctrine?'on':'off'}</small>"]],
 'dist/index.html':[[/<label class="doctrine-toggle ai-mode-toggle">.*?<\/label>/s,''],['<title>TEST PHASE C r36 PREVIEW</title>','<title>TEST PHASE C r35.12</title>'],['<span class="release">TEST PHASE C r36 PREVIEW · Enhanced AI experimental</span>','<span class="release">TEST PHASE C r35.12</span>']],/* + the 2 r36 PREVIEW label hunks (15b6b88, Kevy 6 Nov 03:17 AEDT) */
 'dist/worker.mjs':[["\nimport {AI_MODES,aiModeOf,setAiMode} from './ai/midgame-flags.mjs';\nimport {carryRemovalIntent} from './ai/midgame-rules.mjs';\nlet aiMode='classic';/* r36 AI selector: Classic (default) / Enhanced, fixed per duel */",''],["aiMode=aiModeOf(x.aiMode);setAiMode(aiMode);pilots=createPilots(","pilots=createPilots("],["strategy:'optimal',aiMode,pilots:","strategy:'optimal',pilots:"],["aiMode='classic';setAiMode(aiMode);matchInfo={...matchInfo,seed:r.seed,first:r.first,aiMode};","matchInfo={...matchInfo,seed:r.seed,first:r.first};"],["if(bestAggregated&&aiMode==='enhanced')plan=carryRemovalIntent(plan,publicDecision,seat);/* r36 B1 worker-state (RELAY-108): the capped plan keeps the matching baseline intent */",''],[",aiMode,midgame:AI_MODES[aiMode],pendingRemoval:aiMode==='enhanced'?pilots[seat].pendingRemoval??null:null});","});"]],
 'dist/ai/ai-worker.mjs':[["\nimport {aiModeOf,setAiMode} from './midgame-flags.mjs';",''],[/ setAiMode\(x\.aiMode\);\/\*.*?\*\/\n/s,''],[/if\(aiModeOf\(x\.aiMode\)==='enhanced'&&x\.pendingRemoval\)pilot\.pendingRemoval=x\.pendingRemoval;\/\*.*?\*\//s,'']]};
for(const [f,reps] of Object.entries(SEL))await ok(f+' minus the selector lines = r35.12 (d3177e0) bytes',()=>{let s=fs.readFileSync(f,'utf8');for(const [a,b] of reps){const before=s;s=s.replace(a,b);assert.notEqual(s,before,'selector line present: '+String(a).slice(0,60))}assert.equal(s,r3512(f))});
// ---- 4. cold load ----
await ok('cold load = Classic: the select defaults to Classic and the choice is not stored or restored',()=>{
 const html=fs.readFileSync('dist/index.html','utf8');assert.match(html,/<select id="ai-mode"[^>]*><option value="classic" selected>Classic<\/option><option value="enhanced">Enhanced \(experimental\)<\/option><\/select>/);
 const app=fs.readFileSync('dist/app.mjs','utf8');assert.equal((app.match(/ai-mode/g)||[]).length,1,'app.mjs only reads #ai-mode when a duel starts');assert.ok(!/aiMode[^;]{0,80}localStorage|localStorage[^;]{0,200}aiMode/.test(app))});
console.log('r36 AI selector tests: '+pass+' passed'+(fail?', '+fail+' FAILED':''));if(fail)process.exitCode=1;

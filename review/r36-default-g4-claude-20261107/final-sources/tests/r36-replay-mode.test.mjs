// r36 replay AI-mode compatibility (Claude as builder, 7 Nov 2026; ChatGPT RELAY-119 G4 requirements). SELF-VERIFIED.
// Runs the REAL dist/worker.mjs in this Node process, messaged as the browser does (Node has no Worker, so the worker takes
// its synchronous AI path). Checks:
//  1. A duel started in Enhanced exports a replay with aiMode 'enhanced' and the exact build string; the same for Classic.
//  2. Import honours an explicit aiMode ('enhanced' / 'classic'): the duel's match info and the live module state
//     (A-Z flags and the complete S4 map) are that mode's recipe.
//  3. A legacy replay WITHOUT aiMode (every replay saved before the selector) is Classic, also right after an Enhanced duel,
//     so old evidence never silently replays under Enhanced.
//  4. An unknown aiMode is refused with an error. Nothing is guessed.
//  5. Mode-state transitions Enhanced -> Classic -> Enhanced across start / import never leak (stale global state).
//  6. app.mjs: a replay file's aiMode (missing = Classic) decides the replayed duel's mode, not the setup dropdown.
import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import {pathToFileURL} from 'node:url';
let pass=0,fail=0;const ok=async(n,f)=>{try{await f();pass++;console.log('ok',pass+fail,n)}catch(e){fail++;console.log('not ok',pass+fail,n,'--',e.message.split('\n')[0])}};
const dist=path.resolve(process.env.R36_DIST||'dist');/* R36_DIST=<older dist> runs the same checks on another build (control) */
globalThis.fetch=async url=>{const b=fs.readFileSync(path.join(dist,String(url)));return {ok:true,arrayBuffer:async()=>b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength)}};
const decksAll=JSON.parse(fs.readFileSync(path.join(dist,'decks.json'))).decks,v19=id=>{const x=decksAll.find(y=>y.id===id);return {...x,...(x.banlistVariants?.['tcg-2026-10-19']||{})}};
let inbox=[];globalThis.onmessage=null;globalThis.postMessage=x=>inbox.push(x);
await import(pathToFileURL(path.join(dist,'worker.mjs')).href);
const {MIDGAME,AI_MODES,AI_S4}=await import(pathToFileURL(path.join(dist,'ai/midgame-flags.mjs')).href);const {S4}=await import(pathToFileURL(path.join(dist,'ai/s4-flags.mjs')).href);
const send=data=>globalThis.onmessage({data});const tick=()=>new Promise(r=>setTimeout(r,0));
const waitFor=async(pred,ms=120000)=>{const t=Date.now();for(;;){const m=inbox.find(pred);if(m)return m;if(Date.now()-t>ms)throw Error('timeout waiting');await new Promise(r=>setTimeout(r,20))}};
const BUILD="ddl-test r36 2026-11-07-r36";
const recipe=m=>({midgame:{...MIDGAME},s4:{...S4},want:{midgame:{...AI_MODES[m]},s4:{...AI_S4[m]}}});
const isRecipe=m=>{const r=recipe(m);assert.deepEqual(r.midgame,r.want.midgame,m+' A-Z flags');assert.deepEqual(r.s4,r.want.s4,m+' S4 map')};
const lastMatch=()=>[...inbox].reverse().find(x=>x.type==='state'&&x.match)?.match;
// Start a Watch duel, let a few states pass (presentation-done after each), then pause it and export the replay.
async function startAndExport(aiMode,seed){inbox=[];send({type:'start',decks:['branded','blueeyes'].map(v19),seed,first:0,view:0,mode:'watch',study:false,preset:'instant',delay:1,cinematics:false,doctrine:true,interactionProtocol:1,aiMode});
 let n=0;for(;n<6;){const s=await waitFor(x=>x.type==='state'&&!x._seen);s._seen=true;n++;if(s.state.finished)break;send({type:'presentation-done',eventId:s.lastEventId});await tick()}
 const m=lastMatch();inbox=inbox.filter(x=>x.type!=='export-replay');send({type:'export-replay'});const r=(await waitFor(x=>x.type==='export-replay')).replay;return {match:m,replay:r}}
async function importReplay(replay){inbox=[];try{send({type:'import-replay',replay})}catch(e){return {error:e.message}}await tick();const err=inbox.find(x=>x.type==='error');if(err)return {error:err.message};const s=await waitFor(x=>x.type==='state'&&x.match);return {match:s.match}}
let enh,cls;
await ok('Enhanced duel: match info and module state are the Enhanced recipe; the exported replay carries aiMode enhanced and the build string',async()=>{
 enh=await startAndExport('enhanced',71031);assert.equal(enh.match.aiMode,'enhanced');isRecipe('enhanced');
 assert.equal(enh.replay.aiMode,'enhanced');assert.equal(enh.replay.build,BUILD);assert.equal(enh.replay.version,'2.2.0-rc');assert.ok(enh.replay.responses.length>0,'responses recorded')});
await ok('Classic duel (started right after Enhanced): Classic recipe, replay aiMode classic',async()=>{
 cls=await startAndExport('classic',71032);assert.equal(cls.match.aiMode,'classic');isRecipe('classic');assert.equal(cls.replay.aiMode,'classic');assert.equal(cls.replay.build,BUILD)});
await ok('import honours explicit aiMode enhanced (after a Classic duel)',async()=>{const r=await importReplay(enh.replay);assert.ok(!r.error,r.error);assert.equal(r.match.aiMode,'enhanced');isRecipe('enhanced')});
await ok('legacy replay without aiMode (and without build) imports as Classic, right after an Enhanced import',async()=>{
 const legacy={...enh.replay};delete legacy.aiMode;delete legacy.build;const r=await importReplay(legacy);assert.ok(!r.error,r.error);assert.equal(r.match.aiMode,'classic');isRecipe('classic')});
await ok('import honours explicit aiMode classic (after the Enhanced import path was used)',async()=>{await importReplay(enh.replay);isRecipe('enhanced');const r=await importReplay(cls.replay);assert.ok(!r.error,r.error);assert.equal(r.match.aiMode,'classic');isRecipe('classic')});
await ok('an unknown aiMode is refused (no guess)',async()=>{for(const bad of ['ENHANCED','bogus','',null,1]){const r=await importReplay({...enh.replay,aiMode:bad});assert.ok(r.error&&/AI mode/i.test(r.error),String(bad)+': '+JSON.stringify(r))}});
await ok('a new Enhanced duel after a Classic import runs Enhanced again (no stale state either way)',async()=>{const x=await startAndExport('enhanced',71033);assert.equal(x.match.aiMode,'enhanced');isRecipe('enhanced')});
// ---- 6. app.mjs replay-file path (source; the browser check covers the click path) ----
await ok('app.mjs: the replay file decides the mode (explicit enhanced/classic, missing = Classic, unknown refused); the dropdown is used only for new duels',()=>{
 const A=fs.readFileSync('dist/app.mjs','utf8');
 assert.ok(A.includes("aiMode:importedResponses?importedAiMode:$('#ai-mode')?.value==='classic'?'classic':'enhanced',"),'start: replay mode first, else the dropdown (default Enhanced)');
 assert.ok(A.includes("if(r.aiMode!==undefined&&r.aiMode!=='classic'&&r.aiMode!=='enhanced')throw Error('This replay names an unknown AI mode.');"),'unknown mode refused');
 assert.ok(A.includes("importedAiMode=r.aiMode==='enhanced'?'enhanced':'classic';$('#start').click();"),'missing = Classic');
 const t=A.indexOf("aiMode:importedResponses?"),reset=A.indexOf('importedResponses=null',t);assert.ok(reset>t&&reset-t<400,'importedResponses is cleared right after that start, so the next new duel uses the dropdown')});
console.log('r36 replay mode tests: '+pass+' passed'+(fail?', '+fail+' FAILED':''));if(fail)process.exitCode=1;process.exit();

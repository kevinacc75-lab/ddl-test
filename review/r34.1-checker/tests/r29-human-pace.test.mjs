// r29 (Claude, 22 Oct; Kevy 13:06: "have the learning mode mimic this time frame ... the feel of watching a true to life
// game"; Duel: "happy to add 1-2 seconds"). SELF-VERIFIED (builder = verifier), NOT independent.
//  1. Human-paced pauses: Learning = 0.6 s mechanical / 1.5 s quick / 2 s picks / 3 s combo steps / 6 s big decisions;
//     Duel = +1 s on big decisions only; Broadcast / Instant: none; one legal choice = no pause.
//  2. Pace only: the AI's work (node budget 400, 40 at Instant) is unchanged, so every preset plays the same moves.
//  3. Classes on a real duel: the first main-phase decision of a turn is "big", later ones are "step".
import assert from 'node:assert/strict';import fs from 'node:fs';import {gunzipSync} from 'node:zlib';
globalThis.onmessage=null;globalThis.postMessage=()=>{};
const {HUMAN_MS,decisionClass}=await import('../dist/worker.mjs');
assert.deepEqual(HUMAN_MS.learning,{auto:0,mechanical:600,quick:1500,pick:2000,step:3000,big:6000});
assert.deepEqual(HUMAN_MS.duel,{auto:0,mechanical:0,quick:0,pick:0,step:0,big:1000});
assert.equal(HUMAN_MS.broadcast,undefined);assert.equal(HUMAN_MS.instant,undefined);
const src=fs.readFileSync('dist/worker.mjs','utf8');
assert.ok(src.includes("nodeBudget:preset==='instant'?40:400"),'node budget unchanged (pace only, never more work)');
assert.ok(src.includes('presentationUntil-Date.now(),humanWait()'),'the pause is part of the step timer');
const {Duel,M}=await import('../dist/duel.mjs');const {createOptimalPilots}=await import('../dist/optimal-pilot.mjs');
const db=JSON.parse(gunzipSync(fs.readFileSync('dist/cards.json.gz'))),scripts=JSON.parse(gunzipSync(fs.readFileSync('dist/scripts.json.gz')));
const decks=JSON.parse(fs.readFileSync('dist/decks.json')).decks;const d=await Duel.create(db,scripts);d.start([decks.find(x=>x.id==='branded'),decks.find(x=>x.id==='luna')],{seed:5,first:0});
const pilots=createOptimalPilots({seed:5,searchEnabled:false});const seen=[];let n=0;
while(d.prompt&&!d.finished&&d.turn<=1&&n<400){const p=d.prompt;if(p.seat===0)seen.push([p.type,decisionClass(d,0)]);const plan=pilots[p.seat].plan(d);d.respond(plan.response);for(const x of pilots)x.observe?.(plan);n++}
const idle=seen.filter(([t])=>t===M.SELECT_IDLECMD).map(([,c])=>c);
assert.equal(idle[0],'big','first main-phase decision of the turn is big');assert.ok(idle.slice(1).every(c=>c==='step'||c==='auto'),'later main-phase decisions are combo steps');
assert.ok(seen.filter(([t])=>[M.SELECT_PLACE,M.SELECT_POSITION].includes(t)).every(([,c])=>c==='mechanical'||c==='auto'),'zone and position choices are mechanical');
d.stop?.();console.log(JSON.stringify({test:'r29-human-pace',pass:true,node:process.version,classes:[...new Set(seen.map(x=>x[1]))],selfVerified:true}));

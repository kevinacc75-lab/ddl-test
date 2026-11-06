// r36 S4a flag E (Claude as builder, 5 Nov 2026). Engine-native puzzle S2-e (tools/r36-s2-puzzles.mjs, controlled decks):
// Scareclaw Kashtira in face-up Defence Position vs an empty board. With E off (default, both Classic and Enhanced
// recipes) the battle planner drops the engine-offered attacker (r35 behaviour, kept for Classic parity); with E on it
// attacks and its DEF is used. Since RELAY-112, E is in the Enhanced recipe only (AI_S4).
import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {S4,setS4} from '../dist/ai/s4-flags.mjs';import {AI_MODES,AI_S4} from '../dist/ai/midgame-flags.mjs';
// RELAY-112 (6 Nov): E joins Enhanced only. Classic keeps r35 behaviour (E=false); --flags E forces it on for a dev screen.
assert.deepEqual({...S4},{E:false,F:false},'E and F default off at module load (no DDL_S4 in the test env)');
assert.ok(!('E' in AI_MODES.classic)&&!('E' in AI_MODES.enhanced),'E stays out of the reviewed A/B/C/T/Z shape');
assert.deepEqual(JSON.parse(JSON.stringify(AI_S4)),{classic:{E:false,F:false},enhanced:{E:true,F:true}},'S4 recipe: Enhanced only');
assert.deepEqual(setS4({E:true}),{E:true,F:false});setS4({E:false});
const out=fs.mkdtempSync(path.join(os.tmpdir(),'s4e-'));
const run=(first,f)=>execFileSync(process.execPath,['tools/r36-s2-puzzles.mjs',out,'--only','e,e2,e3','--modes','classic,enhanced','--first',String(first),...(f?['--flags',f]:[])],{encoding:'utf8'});
for(const first of [0,1]){const r=run(first,'');const tag=` s0 f${first}: `;
 assert.match(r,new RegExp('e classic'+tag+'FAIL - stop=turn-end .*checks=offered:y,selectedAttack:N'),'Classic f'+first+': r35 behaviour, no Defence attacker');
 assert.match(r,new RegExp('e enhanced'+tag+'PASS - stop=turn-end '),'Enhanced f'+first+': direct attack from Defence (recipe E)');
 assert.match(r,new RegExp('e2 enhanced'+tag+'PASS - .*checks=offered:y,noAttack:y'),'Enhanced f'+first+': offered but declines the losing attack into 3000 ATK');
 assert.match(r,new RegExp('e3 enhanced'+tag+'PASS - .*selectedAttack:y,targetDestroyed:y'),'Enhanced f'+first+': destroys the 2500 DEF target, no damage');
 assert.match(r,new RegExp('e3 classic'+tag+'FAIL - '),'Classic f'+first+': no Defence attacker');
 assert.match(r,/matrix: 6 runs = requested; PASS 4, FAIL 2, INVALID 0/)}
const forced=run(0,'E');assert.match(forced,/e classic\+E s0 f0: PASS - stop=turn-end /,'dev --flags E on Classic: attacks');
const gateRun=(m,f)=>{try{execFileSync(process.execPath,['tools/r36-s2-puzzles.mjs',out,'--only','e','--modes',m,'--gate',...(f?['--flags',f]:[])],{encoding:'utf8'});return 0}catch(e){return e.status}};
assert.equal(gateRun('classic',''),1,'--gate exits 1 when a run FAILs (Classic, E off)');assert.equal(gateRun('enhanced',''),0,'--gate exits 0 (Enhanced recipe)');
const T=JSON.parse(fs.readFileSync(out+'/e-enhanced-s0-f0.json','utf8'));assert.equal(T.boardAfter[1].lp,8000-2600,'damage = Scareclaw Kashtira DEF 2600');assert.deepEqual(T.s4,{E:true,F:true},'record shows the recipe S4');
console.log(JSON.stringify({test:'r36-s4-e',pass:true,node:process.version,selfVerified:true}));

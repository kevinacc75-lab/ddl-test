// r67.7 (Claude): ChatGPT RELAY-254 MED-I254-1 / BR-MID-QUAERITIS-03. Native fixture: ChatGPT's live r67.6 Watch duel 11008
// (Sky A / Branded B, first 0), retained replay from RELAY-254a (sha in duel-summary.json), replayed to response 327.
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {brandedNov08ActivationBlock} from '../dist/ai/book/branded-nov08.mjs';import {M} from '../dist/duel.mjs';
const decks=JSON.parse(fs.readFileSync('dist/decks.json')).decks;const B=decks.find(x=>x.id==='branded');
const db=Object.fromEntries([[72272462,{type:64|1,level:8}],[44146295,{type:64|1,level:8}],[62962630,{type:1,level:4}],[26077387,{type:1,level:4}],[86066372,{type:1,level:4}]]);
function view({mine,theirs,active=0,phase=4,card={code:72272462,location:4,controller:0}}={}){const z=[mine,theirs];
 return {db,decks:[B,decks.find(x=>x.id==='sky')],active,phase,fromEngine:c=>c,zone:(p,l)=>l===4?z[p]:[],prompt:{type:M.SELECT_CHAIN},card}}
const Q=(o)=>{const v=view(o);return brandedNov08ActivationBlock(v,0,v.card,M)};
const ALU={code:62962630,position:1,attack:1800,level:4},MJ={code:44146295,position:1,attack:3000,level:8},QUA={code:72272462,position:1,attack:2500,level:8};
const RAYE_DEF={code:26077387,position:4,attack:1500,level:4},RAYE_ATK={code:26077387,position:1,attack:1500,level:4};

test('(R67.7-Q1) native 11008 i327: the recorded game shrank our own attackers vs a lone Defense Position Raye; now held and declined',async()=>{
 const {loadBuild,db:cdb,scripts}=await import('./lib/engine-scenario.mjs');const {createOptimalPilots}=await import('../dist/optimal-pilot.mjs');const {safeView}=await import('../dist/ai/knowledge.mjs');const {bookActivationBlock}=await import('../dist/ai/book/book.mjs');
 const build=await loadBuild(true),{Duel}=build;const rp=JSON.parse(fs.readFileSync('tests/fixtures/r677-chatgpt-11008-replay.json'));
 const q=f=>{const l=console.log,w=console.warn;console.log=()=>{};console.warn=()=>{};try{return f()}finally{console.log=l;console.warn=w}};
 const d=new Duel(build.live.core,cdb,scripts);q(()=>d.start(rp.decks,{seed:rp.seed,first:rp.first}));q(()=>{for(let i=0;i<327;i++)d.respond(rp.responses[i])});
 const m=d.prompt,seat=m.seat,v=safeView(d,seat);
 assert.equal(m.type,build.M.SELECT_CHAIN);assert.equal(seat,1);assert.equal(d.phase,4);assert.equal(d.active,1);assert.deepEqual(rp.responses[327],{type:8,index:0},'the recorded game activated it');
 assert.deepEqual(m.selects.map(c=>cdb[c.code].name),['Despian Quaeritis']);
 assert.match(bookActivationBlock(v,seat,m.selects[0]),/hold Quaeritis/);
 const P=createOptimalPilots({seed:rp.seed,searchEnabled:false});let r;q(()=>{r=P[seat].base(v)});assert.equal(r.response.index,null,'declined');d.stop();
});
test('(R67.7-Q2) never held when it can help, or outside our Main Phase 1 (opponent turn, Main Phase 2, its other effect)',()=>{
 assert.match(Q({mine:[ALU,QUA],theirs:[RAYE_DEF]})||'',/hold Quaeritis/,'control: the 11008 shape');
 assert.match(Q({mine:[ALU,QUA],theirs:[RAYE_DEF,MJ]})||'',/hold Quaeritis/,'their only attacker is a Level 8+ Fusion (exempt): still nothing to gain');
 for(const [why,o] of Object.entries({
  'an opposing Attack Position monster would drop':{mine:[ALU,QUA],theirs:[RAYE_ATK]},
  "opponent's turn (defensive use)":{mine:[ALU,QUA],theirs:[RAYE_DEF],active:1},
  'Main Phase 2':{mine:[ALU,QUA],theirs:[RAYE_DEF],phase:256},
  'nothing of ours would shrink (only exempt Fusions)':{mine:[MJ,QUA],theirs:[RAYE_DEF]},
  'own monster already 0 ATK':{mine:[{...ALU,attack:0},QUA],theirs:[RAYE_DEF]},
  'its leave-the-field effect (not on the field)':{mine:[ALU],theirs:[RAYE_DEF],card:{code:72272462,location:16,controller:0}},
  "the opponent's Quaeritis":{mine:[ALU],theirs:[RAYE_DEF],card:{code:72272462,location:4,controller:1}}}))assert.equal(Q(o),null,why);
});

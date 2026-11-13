// r57 Choke Point Lab (Claude, 13 Nov 2026). Engine reproduction of CP-001 r1 (ChatGPT RELAY-193): Ash on Primite Lordly
// Lode's search, against the BE-SAGE line. Constructed teaching state: opponent (seat 1) goes first with Lode + Sage in
// hand; learner (seat 0) holds Ash. Named preset cards + vanilla filler (narrowed fixture, not full presets). The opponent's
// moves are SCRIPTED from BE-SAGE's three steps and its picks/announce rules (an illustration of the book line, not an
// autonomous AI trace). Every choice is one the engine actually offered. ENGINE OUTCOMES ONLY; rules check is the team's.
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {loadBuild,scenario,toIdle,answer,q,LOC} from './lib/engine-scenario.mjs';
const build=await loadBuild(true);const {M,R}=build;
const LODE=56506740,SAGE=8240199,BERYL=63198739,BEWD=89631139,MAIDEN=17947697,SPIRIT=59822133,ASH=14558127,FILL=69247929;
const at=(code,location,p)=>({p,code,location});
const seatOf=m=>m.seat??m.player,idx=(l,c)=>(l||[]).findIndex(x=>x.code===c);
const count=(d,p,loc,code,extra='')=>Number(q(d,`return Duel.GetMatchingGroupCount(function(c) return c:IsCode(${code}) ${extra} end,${d.toEngine(p)},${loc},0,nil)`));
export function cp001(withAsh){
 const fill=(l,n)=>[...l,...Array(n).fill(FILL)].slice(0,n);
 const place=[at(LODE,LOC.HAND,1),at(SAGE,LOC.HAND,1),at(ASH,LOC.HAND,0)];
 const decks=[{id:'learner',name:'Learner',main:fill([ASH],40),extra:[]},{id:'opp',name:'Opponent',main:fill([LODE,SAGE,BERYL,MAIDEN,BEWD],40),extra:[SPIRIT]}];
 const d=scenario(build,{decks,first:1,seed:11,place});toIdle(build,d,1);
 const T=[],obs={},chainsAt=()=>d.chains.length;
 const snap=()=>({beryl:count(d,1,LOC.HAND,BERYL),maiden:count(d,1,LOC.HAND,MAIDEN),ash:count(d,0,LOC.HAND,ASH),lodeUp:count(d,1,LOC.SZONE,LODE,'and c:IsFaceup()')});
 obs.start=snap();
 // L1.01 child A: Lode card activation (search)
 const a=(d.prompt.activates||[]).findIndex(c=>c.code===LODE&&c.location===LOC.HAND);assert.ok(a>=0,'Lode card activation offered from the hand');
 d.respond({type:R.SELECT_IDLECMD,action:5,index:a});T.push('opp activates Lode (CL1)');
 let window=null,usedAsh=false;
 for(let i=0;i<60&&d.prompt&&!(d.prompt.type===M.SELECT_IDLECMD&&seatOf(d.prompt)===1);i++){const m=d.prompt;
  if(m.type===M.SELECT_CHAIN&&seatOf(m)===0&&!window){window={offered:(m.selects||[]).map(c=>c.code),forced:!!m.forced,chainLen:chainsAt()};
   if(withAsh&&idx(m.selects,ASH)>=0){usedAsh=true;obs.beforeAsh=snap();T.push('learner chains Ash (CL2)');d.respond({type:R.SELECT_CHAIN,index:idx(m.selects,ASH)});obs.afterAshCost=snap();continue}
   T.push('learner passes');d.respond(answer(build,d));continue}
  if(seatOf(m)===1&&m.type===M.SELECT_CARD&&idx(m.selects,BERYL)>=0){T.push('Lode adds Ether Beryl');d.respond({type:R.SELECT_CARD,indicies:[idx(m.selects,BERYL)]});continue}
  d.respond(answer(build,d))}
 obs.afterChain1=snap();obs.chain1=d.chains.slice(-2);obs.window=window;obs.usedAsh=usedAsh;
 // L1.01 child B: Lode's separate declaration effect, fresh chain
 const b=(d.prompt.activates||[]).findIndex(c=>c.code===LODE&&c.location===LOC.SZONE);obs.declOffered=b>=0;if(b<0)return {d,T,obs};
 d.respond({type:R.SELECT_IDLECMD,action:5,index:b});T.push('opp activates Lode declaration (fresh chain)');
 for(let i=0;i<60&&d.prompt&&!(d.prompt.type===M.SELECT_IDLECMD&&seatOf(d.prompt)===1);i++){const m=d.prompt;
  if(m.type===M.ANNOUNCE_CARD&&seatOf(m)===1){T.push('declares Blue-Eyes White Dragon');d.respond({type:R.ANNOUNCE_CARD,card:BEWD});continue}
  if(m.type===M.SELECT_CARD&&seatOf(m)===1&&idx(m.selects,BEWD)>=0){d.respond({type:R.SELECT_CARD,indicies:[idx(m.selects,BEWD)]});continue}
  d.respond(answer(build,d))}
 obs.bewd=count(d,1,LOC.MZONE,BEWD);obs.bewdDef=count(d,1,LOC.MZONE,BEWD,'and c:IsDefensePos()');
 // L1.02: Normal Summon Sage; its trigger adds Maiden (book pick)
 const s=idx(d.prompt.summons,SAGE);obs.sageOffered=s>=0;if(s<0)return {d,T,obs};
 d.respond({type:R.SELECT_IDLECMD,action:0,index:s});T.push('opp Normal Summons Sage');
 for(let i=0;i<60&&d.prompt&&!(d.prompt.type===M.SELECT_IDLECMD&&seatOf(d.prompt)===1);i++){const m=d.prompt;
  if(seatOf(m)===1&&(m.type===M.SELECT_EFFECTYN||m.type===M.SELECT_YESNO)){T.push('Sage search: yes');d.respond({type:m.type===M.SELECT_EFFECTYN?R.SELECT_EFFECTYN:R.SELECT_YESNO,yes:true});continue}
  if(seatOf(m)===1&&m.type===M.SELECT_CHAIN&&idx(m.selects,SAGE)>=0){T.push('Sage search: activate');d.respond({type:R.SELECT_CHAIN,index:idx(m.selects,SAGE)});continue}
  if(seatOf(m)===1&&m.type===M.SELECT_CARD&&idx(m.selects,MAIDEN)>=0){T.push('Sage adds Maiden');d.respond({type:R.SELECT_CARD,indicies:[idx(m.selects,MAIDEN)]});continue}
  d.respond(answer(build,d))}
 obs.sage=count(d,1,LOC.MZONE,SAGE);obs.maiden=count(d,1,LOC.HAND,MAIDEN);
 // L1.03: Spirit Dragon Synchro with Sage + BEWD
 const x=idx(d.prompt.special_summons,SPIRIT);obs.spiritOffered=x>=0;if(x<0)return {d,T,obs};
 d.respond({type:R.SELECT_IDLECMD,action:1,index:x});T.push('opp Synchro Summons Spirit Dragon');
 for(let i=0;i<60&&d.prompt&&!(d.prompt.type===M.SELECT_IDLECMD&&seatOf(d.prompt)===1);i++)d.respond(answer(build,d));
 obs.spirit=count(d,1,LOC.MZONE,SPIRIT);obs.materialsGone=count(d,1,LOC.MZONE,SAGE)+count(d,1,LOC.MZONE,BEWD);obs.end=snap();
 return {d,T,obs}}
test('(CP-001 F1) Ash on Lode’s search: Ash offered, CL2 resolves first, no Beryl added, Lode stays face-up; the declaration, Sage and Spirit Dragon still happen',()=>{
 const {obs,T}=cp001(true);
 assert.ok(obs.window&&obs.window.offered.includes(ASH)&&!obs.window.forced,'Ash offered at the learner’s response window (Pass also allowed)');assert.ok(obs.usedAsh);
 assert.equal(obs.afterAshCost.ash,obs.beforeAsh.ash-1,'Ash discarded as its cost before anything resolves');
 assert.deepEqual(obs.chain1,[LODE,ASH],'CL1 Lode, CL2 Ash');
 assert.equal(obs.afterChain1.beryl,obs.start.beryl,'no Beryl added: the search effect was negated');assert.equal(obs.afterChain1.lodeUp,1,'Lode stays face-up');
 assert.ok(obs.declOffered,'Lode’s separate declaration is still offered');assert.equal(obs.bewd,1);assert.equal(obs.bewdDef,1,'Blue-Eyes summoned in Defense Position');
 assert.ok(obs.sageOffered);assert.equal(obs.sage,1);assert.equal(obs.maiden,obs.start.maiden+1,'Sage added Maiden');
 assert.ok(obs.spiritOffered,'Spirit Dragon Synchro offered');assert.equal(obs.spirit,1,'Spirit Dragon Synchro Summoned');assert.equal(obs.materialsGone,0,'Sage and Blue-Eyes used as material');
 assert.equal(obs.end.beryl,obs.start.beryl,'still no Beryl at the end');console.log(T.join(' | '));
});
test('(CP-001 F0) control, the learner passes: Lode adds Beryl, then the same declaration, Sage and Spirit Dragon line',()=>{
 const {obs,T}=cp001(false);
 assert.ok(obs.window&&obs.window.offered.includes(ASH),'the same window offered Ash');assert.ok(!obs.usedAsh);
 assert.equal(obs.afterChain1.beryl,obs.start.beryl+1,'Beryl added');assert.equal(obs.afterChain1.lodeUp,1);
 assert.ok(obs.declOffered);assert.equal(obs.bewdDef,1);assert.equal(obs.sage,1);assert.equal(obs.maiden,obs.start.maiden+1);assert.equal(obs.spirit,1);
 assert.equal(obs.end.beryl,obs.start.beryl+1,'Beryl unused in hand');assert.equal(obs.end.ash,obs.start.ash,'Ash still in the learner’s hand');console.log(T.join(' | '));
});

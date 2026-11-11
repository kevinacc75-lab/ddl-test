// r44 regression (RELAY-135, ChatGPT 11 Nov 2026; fix approved by Kevy 11 Nov 01:58 AEDT "Yes, fix the Super Poly Sanctifire bug in r44"):
// Super Polymerization may use our own face-down monster as material. The engine offered Albion the Sanctifire Dragon
// (own face-up Fallen of Albaz + own face-down Incredible Ecclesia), but the r42 policy prefilter (face-up only) rejected it
// and, with Mirrorjade also offered (opposing face-up Lubellion), switched the native Sanctifire choice to Mirrorjade.
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {loadBuild,scenario,toIdle,answer,LOC,POS} from './lib/engine-scenario.mjs';
import {BRANDED_NOV08,brandedNov08RoutePick,superPolyTargetOk} from '../dist/ai/book/branded-nov08.mjs';
import {safeView} from '../dist/ai/knowledge.mjs';
const A=68468459,E=55273560,S=38811586,LEN=3410461,JADE=44146295,SP=48130397,WOLF=69247929,LUB=70534340,T=41373230;
const build=await loadBuild(true);const {M,R}=build;
const hand=(code,p=0)=>({p,code,location:LOC.HAND});
const field=(code,sequence,p=0)=>({p,code,location:LOC.MZONE,sequence,position:POS.ATK});
const set=(code,sequence,p=0)=>({p,code,location:LOC.MZONE,sequence,position:POS.FD});
function make(place,extra,seed=19){
 const decks=[{id:'branded',format:BRANDED_NOV08,name:'Branded fixture',main:[...place.filter(x=>x.p===0).map(x=>x.code),...Array(41).fill(WOLF)].slice(0,41),extra},{id:'fixture-b',name:'Opponent fixture',main:[...place.filter(x=>x.p===1).map(x=>x.code),...Array(40).fill(WOLF)].slice(0,40),extra:[]}];
 const d=scenario(build,{decks,first:0,seed,place});toIdle(build,d,0);return d;
}
// Activate Super Polymerization from hand and stop at its Fusion-target prompt (hint 509).
function toSuperPolyTarget(d){
 const i=d.prompt.activates.findIndex(c=>c.code===SP);assert.ok(i>=0,'Super Polymerization offered');
 d.respond({type:R.SELECT_IDLECMD,action:5,index:i});
 for(let k=0;k<40&&d.prompt;k++){
  if(d.hint===509&&d.prompt.seat===0&&[M.SELECT_CARD,M.SELECT_UNSELECT_CARD].includes(d.prompt.type))return d.prompt;
  const s=d.prompt.seat??d.prompt.player;if(s!==0){d.respond(answer(build,d,{}));continue}
  const cards=[...(d.prompt.selects||[]),...(d.prompt.select_cards||[])];const w=cards.findIndex(c=>c.code===WOLF);
  d.respond(d.prompt.type===M.SELECT_CARD&&w>=0?{type:R.SELECT_CARD,indicies:[w]}:answer(build,d,{}));
 }
 assert.fail('no Super Polymerization target prompt');
}
const pick=(d,code)=>{const cards=d.prompt.selects||d.prompt.select_cards;const i=cards.findIndex(c=>c.code===code);assert.ok(i>=0,code+' offered: '+JSON.stringify(cards.map(c=>c.code)));return {cards,i}};
const routed=(d,i)=>{const v=safeView(d,0);const vm=v.prompt;return brandedNov08RoutePick(v,0,vm,{type:vm.type===M.SELECT_CARD?R.SELECT_CARD:R.SELECT_UNSELECT_CARD,indicies:[i]},M,R)};

test('(R44-SP1) own face-up Albaz + own face-down Ecclesia: the engine offers Sanctifire and the policy keeps it (seed 19)',()=>{
 const d=make([field(A,0),set(E,1),hand(SP),hand(WOLF)],[JADE,LEN,S]);
 try{
  assert.equal(d.zone(0,4).find(c=>c?.code===E).position&5,0,'Ecclesia is face-down');
  toSuperPolyTarget(d);const {i}=pick(d,S);
  const v=safeView(d,0);assert.equal(superPolyTargetOk(v,S,0),true,'own face-down Ecclesia counts as the LIGHT Spellcaster');
  assert.equal(routed(d,i),null,'native Sanctifire choice is not overridden');
 }finally{d.stop()}
});
test('(R44-SP2) + opposing face-up Lubellion: Mirrorjade and Sanctifire both offered; a Sanctifire pick is not switched to Mirrorjade',()=>{
 const d=make([field(A,0),set(E,1),hand(SP),hand(WOLF),field(LUB,0,1)],[JADE,LEN,S]);
 try{toSuperPolyTarget(d);pick(d,JADE);const {i}=pick(d,S);assert.equal(routed(d,i),null)}finally{d.stop()}
});
test('(R44-SP3) other guards kept: opponent face-down monsters never count; Lenatus still needs Albaz + a real Dragon; no seat = r42 reading',()=>{
 const d=make([field(A,0),set(E,0,1),set(T,1,1),hand(SP)],[JADE,LEN,S]);
 try{
  const v=safeView(d,0);assert.equal(superPolyTargetOk(v,S,0),false,'opponent set Ecclesia is hidden and not Super Poly material');assert.equal(superPolyTargetOk(v,LEN,0),false,'opponent set Dragon does not count');
  assert.equal(superPolyTargetOk(d,S,0),false,'even with full engine state, the opponent face-down card is excluded');
 }finally{d.stop()}
 const e=make([field(A,0),set(T,1),hand(SP)],[JADE,LEN,S]);
 try{const v=safeView(e,0);assert.equal(superPolyTargetOk(v,LEN,0),true,'own set Dragon is legal Super Poly material');assert.equal(superPolyTargetOk(v,LEN),false,'without a seat the face-up-only r42 reading is kept');assert.equal(superPolyTargetOk(v,S,0),false,'no LIGHT Spellcaster')}finally{e.stop()}
 const f=make([set(E,1),hand(SP)],[JADE,LEN,S]);
 try{assert.equal(superPolyTargetOk(safeView(f,0),S,0),false,'Sanctifire still needs Albaz')}finally{f.stop()}
});
test('(R44-SP4) the fix is confined to the Super Poly material reading in branded-nov08.mjs',async()=>{
 const fs=await import('node:fs');const a=fs.readFileSync('dist/ai/book/branded-nov08.mjs','utf8').split('\n'),b=fs.readFileSync('/workspace/ddl-test-r39/r43-aurora-p1/ai/book/branded-nov08.mjs','utf8').split('\n');
 const r44=fs.readFileSync('/workspace/ddl-test-r39/r44-aurora-boss-art/ai/book/branded-nov08.mjs','utf8').split('\n');/* r45-adapted: r45 AI v4 lines (not in r44) are pinned by r45-ai-v4.test.mjs */
 const changed=a.filter(l=>!b.includes(l)&&r44.includes(l));
 for(const l of changed)assert.match(l,/matOk|superPolyTargetOk|r44 \(RELAY-135|our OWN face-down|ours to know|on our own field in any position/,l.slice(0,120));
 assert.ok(changed.some(l=>/const matOk=\(s,c,seat\)=>Boolean\(c\)&&\(faceUp\(c\)\|\|\(seat!==undefined&&s===seat&&c\.code>0\)\)/.test(l)));
});
test('(R44-SP5) replacement filter also reads own face-down material: an unsupported Lenatus pick is replaced by the legal Sanctifire',()=>{
 const d=make([field(A,0),set(E,1),hand(SP)],[LEN,S]);
 try{
  const v=Object.create(safeView(d,0),{currentEffect:{value:{code:SP}},hint:{value:509}});
  const r=brandedNov08RoutePick(v,0,{type:M.SELECT_CARD,selects:[{code:LEN},{code:S}]},{type:R.SELECT_CARD,indicies:[0]},M,R);
  assert.ok(r,'unsupported Lenatus pick is replaced');assert.deepEqual(r.response.indicies,[1]);
 }finally{d.stop()}
});

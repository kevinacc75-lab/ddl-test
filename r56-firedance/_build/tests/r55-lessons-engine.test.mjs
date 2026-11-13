// r55 (Claude, 13 Nov 2026). Engine reproduction of Ruling Desk RD-004 (ChatGPT RELAY-184 r1): a cost is paid before the
// answer. Teaching fixture: named cards dealt to zones, the rest vanilla Normal Monsters. ENGINE OUTCOMES ONLY; the
// rules re-check is the Seto team's.
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {loadBuild,scenario,toIdle,answer,q,LOC} from './lib/engine-scenario.mjs';
const build=await loadBuild(true);const {M,R}=build;
const RISE=31149212,BIGBANG=33925864,VEILER=97268402,FILL=69247929;
const hand=(code,p=0)=>({p,code,location:LOC.HAND});
function make(place,{main0=[]}={},seed=11){const fill=(l,n)=>[...l,...Array(n).fill(FILL)].slice(0,n);
 const decks=[{id:'lesson-a',name:'Lesson A',main:fill([...place.filter(x=>x.p===0).map(x=>x.code),...main0],40),extra:[]},{id:'lesson-b',name:'Lesson B',main:fill(place.filter(x=>x.p===1).map(x=>x.code),40),extra:[]}];
 const d=scenario(build,{decks,first:0,seed,place});toIdle(build,d,0);return d}
const seatOf=m=>m.seat??m.player,idx=(l,c)=>(l||[]).findIndex(x=>x.code===c);
const count=(d,p,loc,code,extra='')=>Number(q(d,`return Duel.GetMatchingGroupCount(function(c) return ${code?`c:IsCode(${code})`:'true'} ${extra} end,${d.toEngine(p)},${loc},0,nil)`));
function run(d,pick=()=>null,limit=80){const seen=[];for(let i=0;i<limit&&d.prompt;i++){const m=d.prompt;seen.push({type:m.type,seat:seatOf(m),codes:[...(m.selects||[]),...(m.select_cards||[])].map(c=>c.code).concat(m.code?[m.code]:[])});if(m.type===M.SELECT_IDLECMD&&seatOf(m)===0&&i>0)return seen;const r=pick(m,d);d.respond(r||answer(build,d))}return seen}
function riseheart(withVeiler){
 const d=make(withVeiler?[hand(RISE),hand(VEILER,1)]:[hand(RISE)],{main0:[BIGBANG,BIGBANG]});
 d.respond({type:R.SELECT_IDLECMD,action:0,index:idx(d.prompt.summons,RISE)});run(d);
 const a=idx(d.prompt.activates,RISE);assert.ok(a>=0,'Riseheart Deck-banish effect offered after its Normal Summon');
 const opp0=count(d,1,LOC.REMOVED,0);d.respond({type:R.SELECT_IDLECMD,action:5,index:a});
 let usedVeiler=false,costBeforeAnswer=null;
 const seen=run(d,(m)=>{if(seatOf(m)===0&&[M.SELECT_CARD,M.SELECT_UNSELECT_CARD].includes(m.type)){const i=idx(m.selects||m.select_cards,BIGBANG);if(i>=0)return m.type===M.SELECT_CARD?{type:R.SELECT_CARD,indicies:[i]}:{type:R.SELECT_UNSELECT_CARD,index:i}}
  if(m.type===M.SELECT_CHAIN&&seatOf(m)===1){if(costBeforeAnswer===null)costBeforeAnswer=count(d,0,LOC.REMOVED,BIGBANG);if(withVeiler&&!usedVeiler&&idx(m.selects,VEILER)>=0){usedVeiler=true;return {type:R.SELECT_CHAIN,index:idx(m.selects,VEILER)}}}
  return null});
 return {d,usedVeiler,costBeforeAnswer,opp0,seen,level:Number(q(d,`local g=Duel.GetMatchingGroup(function(c) return c:IsCode(${RISE}) end,${d.toEngine(0)},LOCATION_MZONE,0,nil) local c=g:GetFirst() return c and c:GetLevel() or -1`))}}
test('(RD-004) the cost is paid before the answer; Veiler negates the effect; the cost is not refunded; Big Bang has no target',()=>{
 const {d,usedVeiler,costBeforeAnswer,opp0,seen,level}=riseheart(true);
 assert.ok(usedVeiler,'Veiler offered to the opponent and used');assert.equal(costBeforeAnswer,1,'Big Bang already banished when the opponent could answer');
 assert.equal(count(d,0,LOC.REMOVED,BIGBANG),1,'Big Bang stays banished (cost not refunded)');
 assert.equal(count(d,1,LOC.REMOVED,0),opp0,'no opponent cards banished (effect negated)');assert.equal(level,4,'Riseheart stays Level 4');
 assert.ok(!seen.some(s=>s.seat===0&&s.codes.includes(BIGBANG)&&[M.SELECT_EFFECTYN,M.SELECT_CHAIN].includes(s.type)),'no Big Bang trigger offered (no Kashtira Xyz to target)');
});
test('(RD-004 control) without Veiler: the top 3 opposing cards are banished face-down and Riseheart becomes Level 7',()=>{
 const {d,opp0,level}=riseheart(false);assert.equal(count(d,1,LOC.REMOVED,0)-opp0,3);assert.equal(count(d,1,LOC.REMOVED,0,'and c:IsFacedown()'),3,'r55 RD-004 r2 s6 (ChatGPT RELAY-192): face-down');assert.equal(level,7);
});

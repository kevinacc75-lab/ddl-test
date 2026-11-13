// r56 (Claude, 13 Nov 2026). Engine reproduction of Ruling Desk RD-005 r2 (ChatGPT RELAY-192; ruling corrected by the Seto
// team in RELAY-190): Fire Dance limits ACTIVATIONS. Teaching fixture: named cards dealt to zones, the rest vanilla Normal
// Monsters (narrowed fixture, not full presets: disclosed per RELAY-189/192). ENGINE OUTCOMES ONLY; rules check is the team's.
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {loadBuild,scenario,toIdle,answer,q,LOC} from './lib/engine-scenario.mjs';
const build=await loadBuild(true);const {M,R}=build;
const FD=80044027,HARE=18377261,HULI=6327734,GB=73642296,FILL=69247929;
const at=(code,location,p=0)=>({p,code,location});
function make(place,seed=11){const fill=(l,n)=>[...l,...Array(n).fill(FILL)].slice(0,n);
 const decks=[{id:'lesson-a',name:'Lesson A',main:fill(place.filter(x=>x.p===0).map(x=>x.code),40),extra:[]},{id:'lesson-b',name:'Lesson B',main:fill(place.filter(x=>x.p===1).map(x=>x.code),40),extra:[]}];
 const d=scenario(build,{decks,first:0,seed,place});toIdle(build,d,0);return d}
const seatOf=m=>m.seat??m.player,idx=(l,c)=>(l||[]).findIndex(x=>x.code===c);
const count=(d,p,loc,code)=>Number(q(d,`return Duel.GetMatchingGroupCount(function(c) return c:IsCode(${code}) end,${d.toEngine(p)},${loc},0,nil)`));
const fdOffers=d=>(d.prompt.activates||[]).filter(c=>c.code===FD&&c.location===LOC.HAND).length;
function run(d,pick=()=>null,limit=80){const seen=[];for(let i=0;i<limit&&d.prompt;i++){const m=d.prompt;seen.push({type:m.type,seat:seatOf(m),codes:[...(m.selects||[]),...(m.select_cards||[])].map(c=>c.code)});if(m.type===M.SELECT_IDLECMD&&seatOf(m)===0&&i>0)return seen;const r=pick(m,d);d.respond(r||answer(build,d))}return seen}
// our picks: revive the named Mikanko; decline every optional (Ha-Re search, opponent revival) via the default responder
const pickMikanko=code=>(m)=>{if(seatOf(m)!==0)return null;if(m.type===M.SELECT_CARD){const i=idx(m.selects,code);if(i>=0)return {type:R.SELECT_CARD,indicies:[i]}}return null};
function fireDance(d,{belle=false,revive=HARE}={}){const a=(d.prompt.activates||[]).findIndex(c=>c.code===FD&&c.location===LOC.HAND);assert.ok(a>=0,'first Fire Dance offered');
 d.respond({type:R.SELECT_IDLECMD,action:5,index:a});let used=false;
 const seen=run(d,(m,dd)=>{if(m.type===M.SELECT_CHAIN&&seatOf(m)===1&&belle&&!used&&idx(m.selects,GB)>=0){used=true;return {type:R.SELECT_CHAIN,index:idx(m.selects,GB)}}return pickMikanko(revive)(m,dd)});
 return {used,seen}}
test('(RD-005 A) Ghost Belle negates Fire Dance’s activation; the negated activation does not use the limit: the second Fire Dance is offered',()=>{
 const d=make([at(FD,LOC.HAND),at(FD,LOC.HAND),at(HARE,LOC.GRAVE),at(GB,LOC.HAND,1)]);
 assert.equal(fdOffers(d),2,'both Fire Dance copies offered at the start');
 const {used}=fireDance(d,{belle:true});assert.ok(used,'Ghost Belle offered to the opponent and chained');
 assert.deepEqual(d.chains.slice(-2),[FD,GB],'Chain Link 1 Fire Dance, Chain Link 2 Ghost Belle');
 assert.equal(count(d,0,LOC.GRAVE,HARE),1,'Ha-Re still in the GY (activation negated, no summon)');assert.equal(count(d,0,LOC.MZONE,HARE),0);
 assert.equal(count(d,0,LOC.GRAVE,FD),1,'the negated Fire Dance went to the GY');
 assert.equal(fdOffers(d),1,'the second Fire Dance is still offered this turn');
});
test('(RD-005 B) control: the first Fire Dance resolves; the limit is used: the second copy is NOT offered although Hu-Li is a valid GY target',()=>{
 const d=make([at(FD,LOC.HAND),at(FD,LOC.HAND),at(HARE,LOC.GRAVE),at(HULI,LOC.GRAVE)]);
 assert.equal(fdOffers(d),2);
 fireDance(d,{belle:false,revive:HARE});
 assert.equal(count(d,0,LOC.MZONE,HARE),1,'Ha-Re Special Summoned');
 assert.equal(q(d,`local g=Duel.GetMatchingGroup(function(c) return c:IsCode(${HARE}) end,${d.toEngine(0)},LOCATION_MZONE,0,nil) local c=g:GetFirst() return c and c:GetEquipCount() or -1`),'1','Ha-Re equipped with Fire Dance');
 assert.equal(count(d,0,LOC.GRAVE,HULI),1,'Hu-Li still in the GY (a valid candidate)');
 assert.equal(fdOffers(d),0,'second Fire Dance not offered: the resolved activation used the limit');
});

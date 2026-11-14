// r53 (Claude, 13 Nov 2026). Engine reproduction of the first three Ruling Desk lessons (ChatGPT RELAY-175 RD-001..003,
// with the Seto team's RELAY-180 fixes). Teaching fixtures: the named cards are dealt straight to their zones and the rest
// of each deck is a vanilla Normal Monster, so nothing else can interfere. These tests prove ENGINE OUTCOMES only; the
// rules fact-check is the Seto team's (RELAY-180), shown as a separate badge in the app.
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {loadBuild,scenario,toIdle,answer,q,LOC} from './lib/engine-scenario.mjs';
const build=await loadBuild(true);const {M,R}=build;
const LINKAGE=9726840,WIDOW=98338152,SKY=[9726840,9726840,9726840,98338152,98338152,98338152];/* searchable Sky Striker cards that stay in the Deck whatever the opening draw */
const GB=73642296,ENGAGE=63166095,RAYE=26077387,KAGARI=63288573,FENRIR=32909498,RISE=31149212,ASH=14558127,TENKI=57103969,LEO=8379983,FILL=69247929;
const hand=(code,p=0)=>({p,code,location:LOC.HAND});
function make(place,{main0=[],extra0=[],main1=[]}={},seed=11){
 const fill=(list,n)=>[...list,...Array(n).fill(FILL)].slice(0,n);
 const decks=[{id:'lesson-a',name:'Lesson A',main:fill([...place.filter(x=>x.p===0).map(x=>x.code),...main0],40),extra:extra0},{id:'lesson-b',name:'Lesson B',main:fill([...place.filter(x=>x.p===1).map(x=>x.code),...main1],40),extra:[]}];
 const d=scenario(build,{decks,first:0,seed,place});toIdle(build,d,0);return d}
const seatOf=m=>m.seat??m.player;
const count=(d,p,loc,code)=>Number(q(d,`return Duel.GetMatchingGroupCount(function(c) return c:IsCode(${code}) end,${d.toEngine(p)},${loc},0,nil)`));
const has=(d,p,loc,code)=>q(d,`return Duel.IsExistingMatchingCard(function(c) return c:IsCode(${code}) end,${d.toEngine(p)},${loc},0,1,nil)`)==='true';
// Drive the duel until our idle prompt comes back; `pick` may answer any prompt first; records every prompt seen.
function run(d,pick=()=>null,limit=80){const seen=[];for(let i=0;i<limit&&d.prompt;i++){const m=d.prompt;seen.push({type:m.type,seat:seatOf(m),hint:d.hint,codes:[...(m.selects||[]),...(m.select_cards||[])].map(c=>c.code).concat(m.code?[m.code]:[])});if(m.type===M.SELECT_IDLECMD&&seatOf(m)===0&&i>0)return seen;const r=pick(m,d);d.respond(r||answer(build,d))}return seen}
const idx=(list,code)=>(list||[]).findIndex(c=>c.code===code);

test('(RD-001) Engage is offered with empty Main Monster Zones; after a legal Ghost Belle Normal Summon it is not offered; nothing was negated',()=>{
 const d=make([hand(GB),hand(ENGAGE)],{main0:SKY});
 assert.ok(idx(d.prompt.activates,ENGAGE)>=0,'Engage offered while the Main Monster Zones are empty');
 const s=idx(d.prompt.summons,GB);assert.ok(s>=0,'Ghost Belle Normal Summon is offered (legal)');
 d.respond({type:R.SELECT_IDLECMD,action:0,index:s});run(d);
 assert.ok(has(d,0,LOC.MZONE,GB),'Ghost Belle is in a Main Monster Zone');
 assert.equal(idx(d.prompt.activates,ENGAGE),-1,'Engage is no longer offered (condition not met)');
 assert.ok(!d.chains.includes(ENGAGE),'Engage was never activated, so it was never negated');
});
test('(RD-001 control) a Link in the Extra Monster Zone leaves the Main Monster Zones empty: Engage is offered; Kagari recovery is NOT offered',()=>{
 const d=make([hand(RAYE),hand(ENGAGE)],{main0:SKY,extra0:[KAGARI]});
 d.respond({type:R.SELECT_IDLECMD,action:0,index:idx(d.prompt.summons,RAYE)});run(d);
 const k=idx(d.prompt.special_summons,KAGARI);assert.ok(k>=0,'Kagari Link Summon offered');
 d.respond({type:R.SELECT_IDLECMD,action:1,index:k});
 const seen=run(d,(m)=>m.type===M.SELECT_PLACE?d.choices().find(o=>o.response.places?.[0]?.sequence>=5)?.response:null);
 assert.ok(q(d,`local c=Duel.GetFieldCard(${d.toEngine(0)},LOCATION_MZONE,5) or Duel.GetFieldCard(${d.toEngine(0)},LOCATION_MZONE,6) return c~=nil and c:IsCode(${KAGARI})`)==='true','Kagari is in an Extra Monster Zone');
 assert.ok(!seen.some(s=>s.seat===0&&s.codes.includes(KAGARI)&&[M.SELECT_EFFECTYN,M.SELECT_CHAIN].includes(s.type)),'Kagari recovery not offered (no Spell in the GY to target)');
 assert.ok(idx(d.prompt.activates,ENGAGE)>=0,'Engage is offered again');
});
test('(RD-002) Fenrir summon procedure makes no Chain Link; its later search does, and Ash negates that search',()=>{
 const d=make([hand(FENRIR),hand(ASH,1)],{main0:[RISE,RISE]});
 const s=idx(d.prompt.special_summons,FENRIR);assert.ok(s>=0,'Fenrir procedure offered (you control no monsters)');
 const before=d.chains.length,rise0=count(d,0,LOC.HAND,RISE);d.respond({type:R.SELECT_IDLECMD,action:1,index:s});run(d);
 assert.ok(has(d,0,LOC.MZONE,FENRIR),'Fenrir summoned');assert.equal(d.chains.length,before,'the procedure made no Chain Link');
 const a=idx(d.prompt.activates,FENRIR);assert.ok(a>=0,'Fenrir search offered');
 d.respond({type:R.SELECT_IDLECMD,action:5,index:a});
 let usedAsh=false;run(d,(m)=>{if(m.type===M.SELECT_CHAIN&&seatOf(m)===1&&idx(m.selects,ASH)>=0&&!usedAsh){usedAsh=true;return {type:R.SELECT_CHAIN,index:idx(m.selects,ASH)}}return null});
 assert.ok(usedAsh,'Ash was offered to the opponent as a response to the search');
 assert.deepEqual(d.chains.slice(-2),[FENRIR,ASH],'Chain Link 1 Fenrir, Chain Link 2 Ash');
 assert.equal(count(d,0,LOC.HAND,RISE),rise0,'no Riseheart added (search negated)');assert.ok(has(d,0,LOC.MZONE,FENRIR),'Fenrir stays on the field (summon not negated)');
});
function tenki(withAsh){const d=make(withAsh?[hand(TENKI),hand(ASH,1)]:[hand(TENKI)],{main0:[LEO,LEO]});
 const leo0=count(d,0,LOC.HAND,LEO),a=idx(d.prompt.activates,TENKI);assert.ok(a>=0,'Tenki offered');d.respond({type:R.SELECT_IDLECMD,action:5,index:a});
 let usedAsh=false;run(d,(m)=>{if(withAsh&&m.type===M.SELECT_CHAIN&&seatOf(m)===1&&idx(m.selects,ASH)>=0&&!usedAsh){usedAsh=true;return {type:R.SELECT_CHAIN,index:idx(m.selects,ASH)}}
  if(seatOf(m)===0&&(m.type===M.SELECT_YESNO||m.type===M.SELECT_EFFECTYN))return {type:m.type===M.SELECT_EFFECTYN?R.SELECT_EFFECTYN:R.SELECT_YESNO,yes:true};
  if(seatOf(m)===0&&m.type===M.SELECT_CARD){const i=idx(m.selects,LEO);if(i>=0)return {type:R.SELECT_CARD,indicies:[i]}}return null});
 return {d,usedAsh,leo0}}
test('(RD-003) Tenki Chain Link 1, Ash Chain Link 2: Ash resolves first, no search, Tenki stays face-up',()=>{
 const {d,usedAsh,leo0}=tenki(true);assert.ok(usedAsh,'Ash offered and used');
 assert.deepEqual(d.chains.slice(-2),[TENKI,ASH]);
 assert.equal(count(d,0,LOC.HAND,LEO),leo0,'no Gold Leo added');assert.ok(has(d,0,LOC.SZONE,TENKI),'Tenki still face-up in the Spell & Trap Zone');
});
test('(RD-003 control) without Ash, Tenki resolves and adds Gold Leo',()=>{
 const {d,leo0}=tenki(false);assert.equal(count(d,0,LOC.HAND,LEO),leo0+1,'Gold Leo added');assert.ok(has(d,0,LOC.SZONE,TENKI));
});

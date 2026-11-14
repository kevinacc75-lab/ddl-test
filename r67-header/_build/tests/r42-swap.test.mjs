// r42 regression tests: budget Extra Deck swap (Kevy 10 Nov 2026 23:20 AEDT, "Let's go Alba lentus and sanctsfire dragon"):
// Alba-Lenatus the Abyss Dragon + Albion the Sanctifire Dragon replace Hyperinvoked Aeon + Ecclesia and the Dark Dragon.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import z from 'node:zlib';
import {test} from 'node:test';
import {loadBuild,scenario,toIdle,answer,db,LOC,POS} from './lib/engine-scenario.mjs';
import {validateDeck} from '../dist/deck-validator.mjs';
import {BRANDED_NOV08,brandedNov08Idle,brandedNov08Book,brandedNov08SpecialBlock,brandedNov08RoutePick,brandedNov08ActivationBlock,superPolyTargetOk,NOV08_EXTRA} from '../dist/ai/book/branded-nov08.mjs';
import {createOptimalPilots} from '../dist/optimal-pilot.mjs';
import {safeView} from '../dist/ai/knowledge.mjs';
import {nov08Brain} from '../dist/ai/brain/branded-brain.mjs';
import {deckYdk,presetFor} from '../dist/deck-list.mjs';
import {parseYdk} from '../dist/windbot/edo.mjs';

const approved=JSON.parse(fs.readFileSync('approved.json')),data=JSON.parse(fs.readFileSync('dist/decks.json')),list=JSON.parse(fs.readFileSync('dist/banlists/tcg-2026-10-19.json'));
const r41=JSON.parse(fs.readFileSync('/workspace/ddl-test-r39/r41-branded-video41-fixes/decks.json')).decks.find(d=>d.id==='branded');
const deck={...data.decks.find(d=>d.id==='branded'),...data.decks.find(d=>d.id==='branded').banlistVariants[list.id]};
const scripts=JSON.parse(z.gunzipSync(fs.readFileSync('dist/scripts.json.gz')));
const A=68468459,W=73819701,E=55273560,AL=62962630,Q=45883110,CA=95515789,THREE=74405783,T=41373230,JADE=44146295,WOLF=69247929,
 S=38811586,LEN=3410461,AEON=33166263,ED=78397661,SP=48130397,F=44362883,DOGMA=76666602;
const EXPECT=[JADE,DOGMA,DOGMA,DOGMA,80843006,72272462,24915933,24915933,70534340,51409648,T,11765832,THREE,LEN,S];
const build=await loadBuild(true);const {M,R}=build;
const hand=(code,p=0)=>({p,code,location:LOC.HAND});
const field=(code,sequence,p=0)=>({p,code,location:LOC.MZONE,sequence,position:POS.ATK});
const grave=(code,p=0)=>({p,code,location:LOC.GRAVE});
function make(place,extra,{first=0,more=[],seed=11}={}){
 const decks=[{id:'branded',format:BRANDED_NOV08,name:'Branded fixture',main:[...place.filter(x=>x.p===0).map(x=>x.code),...more,...Array(41).fill(WOLF)].slice(0,41),extra},{id:'fixture-b',name:'Opponent fixture',main:[...place.filter(x=>x.p===1).map(x=>x.code),...Array(40).fill(WOLF)].slice(0,40),extra:[]}];
 const d=scenario(build,{decks,first,seed,place});toIdle(build,d,first);return d;
}
const pilot=()=>createOptimalPilots({seed:1,searchEnabled:false,doctrine:true})[0];
const fake=(d,props)=>Object.create(d,Object.fromEntries(Object.entries(props).map(([k,v])=>[k,{value:v}])));

test('(R42-D) Extra = Mirrorjade, 3 Dogma, Mixousia, Quaeritis, 2 Granguignol, Lubellion, Rindbrumm, Titaniklad, Garura, Three Champions, Alba-Lenatus, Sanctifire; Main/Side = r41; legal',()=>{
 assert.deepEqual([...deck.extra].sort(),[...EXPECT].sort());assert.deepEqual(data.decks[0].extra,deck.extra);
 for(const id of [AEON,ED])assert.equal(deck.extra.includes(id),false);
 assert.equal(db[LEN].name,'Alba-Lenatus the Abyss Dragon');assert.equal(db[S].name,'Albion the Sanctifire Dragon');
 assert.deepEqual(deck.main,r41.banlistVariants[list.id].main);assert.deepEqual(deck.side,r41.banlistVariants[list.id].side);
 for(const z of ['main','extra','side'])assert.deepEqual(deck[z],approved[z]);
 const v=validateDeck(deck,db,list,{scripts,exactSizes:{main:41,extra:15,side:15}});assert.deepEqual(v.errors,[]);
 assert.equal(deck.name,"Kevy's Branded Deck");/* r45: display name renamed by Kevy 11 Nov 11:55 AEDT */assert.match(deck.subtitle,/Alba-Lenatus \+ Sanctifire/);assert.equal(deck.format,BRANDED_NOV08);
 assert.deepEqual(parseYdk(deckYdk(presetFor(data.decks.find(d=>d.id==='branded'),'tcg-2026-10-19'))),approved);
 for(const id of [LEN,S])assert.ok(fs.existsSync('dist/art/'+id+'.jpg')&&scripts['c'+id+'.lua'],'art/script '+id);
});

test('(R42-AI) no Aeon or Ecclesia-and-the-Dark-Dragon route left in the nov08 book or brain; swap points are centralised',async()=>{
 const book=brandedNov08Book,src=fs.readFileSync('dist/ai/book/branded-nov08.mjs','utf8');
 const names=JSON.stringify(book.picks)+JSON.stringify(book.lines||[]);
 assert.doesNotMatch(names,/Hyperinvoked Aeon|Ecclesia and the Dark Dragon/);
 assert.doesNotMatch(src.replace(/\/\/.*$/gm,'').replace(/'retired'|retired=new Set\(\[[^\]]*\]\)/,''),/78397661|33166263|DARK_DRAGON/);
 assert.deepEqual([...NOV08_EXTRA.synchroL8],[THREE]);assert.deepEqual([...NOV08_EXTRA.notMaterial].sort(),[LEN,S].sort());
 const b=await nov08Brain();
 for(const n of ['Hyperinvoked Aeon','Ecclesia and the Dark Dragon'])assert.equal(n in b.cards,false,n);
 assert.match(b.cards['Albion the Sanctifire Dragon'].does,/LIGHT Spellcaster/);assert.match(b.cards['Albion the Sanctifire Dragon'].does,/Cannot be used as Fusion Material/);
 assert.match(b.cards['Alba-Lenatus the Abyss Dragon'].does,/Monster Zones/);assert.match(b.cards['Alba-Lenatus the Abyss Dragon'].does,/Branded Fusion qualifies, Super Polymerization \(a Quick-Play\) does not/);
 assert.doesNotMatch(b.cards['Alba-Lenatus the Abyss Dragon'].does+b.cards['Albion the Sanctifire Dragon'].does,/Fleurdelis|Fusion Deployment/);
 const routes=Object.fromEntries(b.routes.map(r=>[r.id,r]));
 for(const id of ['K08-SANCTIFIRE','K08-LENATUS'])assert.ok(routes[id],id);
 assert.doesNotMatch(JSON.stringify(routes['K08-WHITE']),/Dark Dragon/);assert.match(JSON.stringify(routes['K08-WHITE']),/Three Champions only against a worthwhile/);
 const W504=book.picks.find(p=>p.source==='Fallen of the White Dragon'&&p.hint?.includes(504));
 assert.equal(W504.prefer[0],'Titaniklad the Ash Dragon');assert.ok(W504.prefer.includes('Alba-Lenatus the Abyss Dragon')&&W504.prefer.includes('Albion the Sanctifire Dragon'));
});

test('(R42-K) Kitt lesson: search only when the original Springans Kitt is Normal or Special Summoned; Tri-Brigade Kitt has no search',async()=>{
 const b=await nov08Brain(),k=b.cards['Springans Kitt'].does,t=b.cards['Tri-Brigade Springans Kitt'].does,r=JSON.stringify(b.routes.find(x=>x.id==='K08-KITT'));
 assert.match(k,/^Original Springans Kitt \(45484331\) only/);assert.match(k,/search happens only when this card is Normal Summoned or Special Summoned/);assert.match(k,/Tri-Brigade Springans Kitt is a different card with no search/);
 assert.match(r,/Original Springans Kitt only/);assert.match(r,/When it is Normal or Special Summoned/);assert.match(r,/Tri-Brigade Springans Kitt has no search/);
 assert.match(t,/No Normal Summon effect/);
 assert.match(scripts['c45484331.lua'],/EVENT_SUMMON_SUCCESS/);assert.match(scripts['c45484331.lua'],/EVENT_SPSUMMON_SUCCESS/);assert.doesNotMatch(scripts['c19304410.lua'],/CATEGORY_SEARCH/);
});

test('(R42-1) White + Ecclesia: Three Champions is held on an empty or vanilla board (book and base policy); made against a real target',()=>{
 for(const opp of [[],[field(WOLF,0,1)]]){
  const d=make([field(W,0),field(E,1),...opp],[THREE,T,LEN,S],{more:[A],seed:1});
  try{
   const i=d.prompt.special_summons.findIndex(c=>c.code===THREE);assert.ok(i>=0,'engine offers Three Champions');
   assert.match(brandedNov08SpecialBlock(d,0,d.prompt.special_summons[i])||'',/hold the Three Champions Synchro/);
   const p=pilot().base(safeView(d,0));
   assert.ok(!(p.response.action===1&&d.prompt.special_summons[p.response.index]?.code===THREE),'no fallback Synchro: '+JSON.stringify(p.book||p.response));
   assert.doesNotMatch(p.book?.rule||'',/WHITE-SYN/);
  }finally{d.stop()}
 }
 const d=make([field(W,0),field(E,1),field(AL,0,1)],[THREE,T,LEN,S],{more:[A],seed:1});
 try{
  const i=d.prompt.special_summons.findIndex(c=>c.code===THREE);assert.equal(brandedNov08SpecialBlock(d,0,d.prompt.special_summons[i]),null);
  const p=pilot().base(safeView(d,0));assert.equal(p.response.action,1);assert.equal(d.prompt.special_summons[p.response.index].code,THREE);assert.match(p.book.rule,/WHITE-SYN/);
 }finally{d.stop()}
});

test('(R42-1b) the White Idle step itself never picks a Synchro without a target, and only ever Three Champions (no other Level 8 Synchro)',()=>{
 const d=make([field(W,0),field(E,1)],[ED,THREE,T],{more:[A],seed:1});
 try{const r=brandedNov08Idle(d,0,d.prompt,null,R);assert.doesNotMatch(r?.rule||'',/WHITE-SYN/);assert.ok(!(r?.action===1))}finally{d.stop()}
 const e=make([field(W,0),field(E,1),field(AL,0,1)],[ED,THREE,T],{more:[A],seed:1});
 try{
  assert.ok(e.prompt.special_summons.findIndex(c=>c.code===ED)<e.prompt.special_summons.findIndex(c=>c.code===THREE),'fixture offers the other Synchro first');
  const r=brandedNov08Idle(e,0,e.prompt,null,R);assert.equal(r.action,1);assert.equal(e.prompt.special_summons[r.index].code,THREE);
 }finally{e.stop()}
});

test('(R42-2 pick) Cartesia on our turn with White + Ecclesia picks Sanctifire over another offered Level 8 Fusion; not with Mirrorjade offered',()=>{
 const d=make([field(W,0),field(E,1),field(CA,2)],[T,S,JADE],{more:[A],seed:1});
 try{
  const x=fake(d,{currentEffect:{code:CA},hint:509});
  const r=brandedNov08RoutePick(x,0,{type:M.SELECT_CARD,selects:[{code:T},{code:S}]},{type:R.SELECT_CARD,indicies:[0]},M,R);assert.deepEqual(r.response.indicies,[1]);
  assert.equal(brandedNov08RoutePick(x,0,{type:M.SELECT_CARD,selects:[{code:JADE},{code:S}]},{type:R.SELECT_CARD,indicies:[0]},M,R),null);
 }finally{d.stop()}
});

test('(R42-2 native) White + Ecclesia + field Cartesia: the pilot fuses Albion the Sanctifire Dragon (Albaz-as-White + LIGHT Spellcaster)',()=>{
 const d=make([field(W,0),field(E,1),field(CA,2)],[THREE,T,LEN,S,JADE],{more:[A],seed:1});
 try{
  const pl=pilot();let p=pl.base(safeView(d,0));
  assert.equal(p.response.action,5);assert.equal(d.prompt.activates[p.response.index].code,CA);assert.match(p.book.rule,/K08-WHITE-SANCTIFIRE/);
  d.respond(p.response);
  for(let i=0;i<60&&d.prompt&&!(d.prompt.type===M.SELECT_IDLECMD&&d.prompt.seat===0);i++){
   const s=d.prompt.seat??d.prompt.player;d.respond(s===0?pl.base(safeView(d,0)).response:answer(build,d,{}));
  }
  assert.ok(d.zone(0,4).some(c=>c?.code===S),'Sanctifire on field: '+JSON.stringify(d.zone(0,4).map(c=>c?.code)));
  assert.equal(d.retries,0);assert.deepEqual(d.errors,[]);
 }finally{d.stop()}
});

test('(R42-3) Super Polymerization guard: Sanctifire / Alba-Lenatus only with Albaz (or White) on a field plus the other material on a field',()=>{
 const cases=[
  [[field(E,0)],S,false],[[field(E,0),field(A,0,1)],S,true],[[field(Q,0,1),field(W,0)],S,true],
  [[field(A,0)],LEN,false],[[field(T,0)],LEN,false]/* Dragon but no Albaz */,[[field(A,0),field(S,1)],LEN,false],[[field(A,0),field(T,0,1)],LEN,true],[[field(W,0),field(T,1)],LEN,true],[[field(W,0),field(JADE,1)],LEN,false]/* Mirrorjade is a Wyrm */,[[field(A,0),field(W,1)],LEN,true],
 ];
 for(const [place,code,ok] of cases){const d=make(place,[JADE,LEN,S],{seed:1});try{assert.equal(superPolyTargetOk(d,code),ok,JSON.stringify([place.map(p=>p.code),code,d.zone(0,4),d.zone(1,4)]));assert.equal(superPolyTargetOk(d,JADE),true)}finally{d.stop()}}
 // RoutePick: a base Super Poly pick of an unsupported Sanctifire is replaced (Mirrorjade preferred); a supported one is kept.
 const d=make([field(E,0)],[JADE,LEN,S],{seed:1});
 try{
  const x=fake(d,{currentEffect:{code:SP},hint:509});const m={type:M.SELECT_CARD,selects:[{code:S},{code:LEN},{code:JADE}]};
  const r=brandedNov08RoutePick(x,0,m,{type:R.SELECT_CARD,indicies:[0]},M,R);assert.deepEqual(r.response.indicies,[2]);
 }finally{d.stop()}
 const e=make([field(E,0),field(A,0,1)],[JADE,LEN,S],{seed:1});
 try{const x=fake(e,{currentEffect:{code:SP},hint:509});assert.equal(brandedNov08RoutePick(x,0,{type:M.SELECT_CARD,selects:[{code:S},{code:JADE}]},{type:R.SELECT_CARD,indicies:[0]},M,R),null)}finally{e.stop()}
});

test('(R42-4) Sanctifire and Alba-Lenatus are never Fusion Material: the 511 guard, and the engine never offers them for Mirrorjade',()=>{
 const d=make([field(A,0),field(S,1),field(LEN,2),field(T,3),hand(SP),hand(WOLF)],[JADE,LEN,S],{seed:1});
 try{
  const x=fake(d,{currentEffect:{code:SP},hint:511});
  const r=brandedNov08RoutePick(x,0,{type:M.SELECT_CARD,selects:[{code:S},{code:LEN},{code:T}]},{type:R.SELECT_CARD,indicies:[1]},M,R);assert.deepEqual(r.response.indicies,[2]);
  for(const s of [S,LEN])assert.match(scripts['c'+s+'.lua'],/EFFECT_CANNOT_BE_FUSION_MATERIAL/);
  const i=d.prompt.activates.findIndex(c=>c.code===SP);assert.ok(i>=0,'Super Polymerization offered');
  d.respond({type:R.SELECT_IDLECMD,action:5,index:i});
  let materialPrompts=0;
  for(let k=0;k<80&&d.prompt&&!(d.prompt.type===M.SELECT_IDLECMD&&d.prompt.seat===0);k++){
   const p=d.prompt,cards=[...(p.selects||[]),...(p.select_cards||[]),...(p.selects_must||[])];
   if(d.hint===511){materialPrompts++;assert.ok(!cards.some(c=>c.code===S||c.code===LEN),'offered as material: '+JSON.stringify(cards.map(c=>c.code)))}
   if(d.hint===509&&cards.some(c=>c.code===JADE)){d.respond({type:R.SELECT_CARD,indicies:[cards.findIndex(c=>c.code===JADE)]});continue}
   d.respond(answer(build,d,{}));
  }
  assert.ok(materialPrompts>0,'a material prompt was reached');
  assert.ok(d.zone(0,4).some(c=>c?.code===JADE),'Mirrorjade from Albaz + Titaniklad');
  assert.ok(d.zone(0,4).some(c=>c?.code===S)&&d.zone(0,4).some(c=>c?.code===LEN),'Sanctifire and Alba-Lenatus stayed on the field');
 }finally{d.stop()}
});

test('(R42-5) Alba-Lenatus End Phase search: Branded Fusion (Fusion Normal Spell) qualifies, Super Polymerization (Quick-Play) does not',()=>{
 const s=scripts['c3410461.lua'];assert.match(s,/function s\.thfilter\(c\)\s+return c:IsNormalSpell\(\) and c:IsSetCard\(SET_FUSION\)/);
 const isNormalSpell=c=>(c.type&2)&&!(c.type&(0x10000|0x20000|0x40000|0x80000|0x100000|0x800000|0x1000000)),fusionSet=c=>c.setcodes.some(x=>(x&0xfff)===0x46);
 assert.ok(isNormalSpell(db[F])&&fusionSet(db[F]),'Branded Fusion');
 assert.ok(fusionSet(db[SP])&&!isNormalSpell(db[SP]),'Super Polymerization is a Quick-Play');
});

test('(R42-6) Sanctifire opponent-turn revive: held with no Albaz-line body in our GY; picks our best body and gives them the weakest',()=>{
 const d=make([field(S,0),grave(A),field(WOLF,0,1)],[JADE],{seed:1});
 try{
  const card={code:S,location:4};
  assert.equal(brandedNov08ActivationBlock(fake(d,{active:1}),0,card,M),null,'Albaz in our GY: revive allowed');
  const y=fake(d,{active:1,zone:(s,l)=>l===16&&s===0?[]:d.zone(s,l)});
  assert.match(brandedNov08ActivationBlock(y,0,card,M)||'',/Hold Albion the Sanctifire Dragon/);
  const x=fake(d,{currentEffect:{code:S},hint:509});
  const own={code:A,controller:0,location:16},theirs={code:WOLF,controller:1,location:16},big={code:JADE,controller:1,location:16};
  const r1=brandedNov08RoutePick(x,0,{type:M.SELECT_UNSELECT_CARD,select_cards:[theirs,big,own],unselect_cards:[]},{type:R.SELECT_UNSELECT_CARD,index:1},M,R);
  assert.equal(r1.response.index,2);
  const r2=brandedNov08RoutePick(x,0,{type:M.SELECT_UNSELECT_CARD,select_cards:[big,theirs],unselect_cards:[own]},{type:R.SELECT_UNSELECT_CARD,index:0},M,R);
  assert.equal(r2.response.index,1);
 }finally{d.stop()}
});

test('(R42-7) Nadir is not kept waiting for a Three Champions Synchro that the r42 hold would refuse',()=>{
 const N=1984618;
 const d=make([hand(N),field(Q,0),field(AL,1)],[THREE,T],{more:[A]});
 try{const i=d.prompt.activates.findIndex(c=>c.code===N);assert.ok(i>=0);assert.equal(brandedNov08ActivationBlock(d,0,d.prompt.activates[i],M),null)}finally{d.stop()}
});

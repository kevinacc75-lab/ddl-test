import assert from 'node:assert/strict';
import fs from 'node:fs';
import {test} from 'node:test';
import {loadBuild,scenario,toIdle,answer,db,LOC,POS} from './lib/engine-scenario.mjs';
import {validateDeck,nameKey} from '../dist/deck-validator.mjs';
import {BRANDED_NOV08,isBrandedNov08} from '../dist/ai/book/branded-nov08.mjs';
import {createOptimalPilots} from '../dist/optimal-pilot.mjs';
import {safeView} from '../dist/ai/knowledge.mjs';
import {bookActivationBlock,bookPick,idleStep,newBookState,keyCards,optionPick} from '../dist/ai/book/book.mjs';
const approved=JSON.parse(fs.readFileSync('approved.json')),data=JSON.parse(fs.readFileSync('dist/decks.json')),list=JSON.parse(fs.readFileSync('dist/banlists/tcg-2026-10-19.json'));
const deck={...data.decks.find(d=>d.id==='branded'),...data.decks.find(d=>d.id==='branded').banlistVariants[list.id]};
const A=68468459,W=73819701,Q=45883110,E=55273560,C=95515789,AL=62962630,K=45484331,F=44362883,V=30271097,N=1984618,T=41373230,G=24915933,L=70534340,D=76666602,THREE=74405783,GARURA=11765832,SP=48130397,ASH=14558127,MAG=33854624,WOLF=69247929;
const build=await loadBuild(true);
const {M,R}=build;
const hand=(code,p=0)=>({p,code,location:LOC.HAND});
const gy=(code,p=0)=>({p,code,location:LOC.GRAVE});
const field=(code,sequence,p=0)=>({p,code,location:LOC.MZONE,sequence,position:POS.ATK});
function make(place,extra,{first=0,other=[],more=[],seed=11,auto=false,opponentId='fixture-b'}={}){
 const decks=[{id:'branded',format:BRANDED_NOV08,name:'Branded fixture',main:[...place.filter(x=>x.p===0&&x.location!==LOC.GRAVE).map(x=>x.code),...place.filter(x=>x.p===0&&x.location===LOC.GRAVE&&!(db[x.code].type&(64|8192))).map(x=>x.code),...more,...Array(41).fill(WOLF)].slice(0,41),extra:[...extra,...place.filter(x=>x.p===0&&x.location===LOC.GRAVE&&(db[x.code].type&(64|8192))).map(x=>x.code)]},{id:opponentId,name:'Opponent fixture',main:[...place.filter(x=>x.p===1).map(x=>x.code),...other,...Array(41).fill(WOLF)].slice(0,41),extra:[]}];
 const d=scenario(build,{decks,first,seed,place});if(!auto)toIdle(build,d,first);return d;
}
const acts=(d,code)=>d.prompt.activates?.findIndex(c=>c.code===code)??-1;
const summons=(d,code)=>d.prompt.special_summons?.some(c=>c.code===code);
function activate(d,code){const i=acts(d,code);assert.ok(i>=0,db[code].name+' offered');d.respond({type:R.SELECT_IDLECMD,action:5,index:i})}
function normal(d,code){const i=d.prompt.summons?.findIndex(c=>c.code===code)??-1;assert.ok(i>=0,db[code].name+' Normal Summon offered');d.respond({type:R.SELECT_IDLECMD,action:0,index:i})}
function until(d,predicate,pick){for(let i=0;i<48&&d.prompt;i++){if(predicate(d.prompt))return d.prompt;d.respond(answer(build,d,{pick:pick?((m)=>pick(m,d)):undefined}));}assert.fail('Expected prompt not reached: '+JSON.stringify(d.prompt,(k,v)=>typeof v==='bigint'?String(v):v)?.slice(0,380));}
const choose=(d,code)=>{const i=d.prompt.selects?.findIndex(c=>c.code===code)??-1;assert.ok(i>=0,db[code].name+' selectable');d.respond({type:R.SELECT_CARD,indicies:[i]});};
const idle=m=>m.type===M.SELECT_IDLECMD&&m.seat===0;
const selects=(d,code)=>d.prompt?.selects?.some(c=>c.code===code);
const trigger=(d,code)=>{
 const m=until(d,m=>m.seat===0&&(m.type===M.SELECT_EFFECTYN&&m.code===code||m.type===M.SELECT_CHAIN&&m.selects.some(c=>c.code===code)));
 if(m.type===M.SELECT_EFFECTYN)d.respond({type:R.SELECT_EFFECTYN,yes:true});
 else d.respond({type:R.SELECT_CHAIN,index:m.selects.findIndex(c=>c.code===code)});
};
const exactSizes={main:41,extra:15,side:15};

test('(M) exact approved 41/15/15, original + Tri-Kitt, shared Albaz cap across zones',()=>{
 for(const zone of ['main','extra','side'])assert.deepEqual(deck[zone],approved[zone]);
 assert.equal(deck.main.length,41);assert.equal(deck.extra.length,15);assert.equal(deck.side.length,15);
 assert.equal(deck.main.filter(x=>x===K).length,1);
 assert.equal(deck.main.filter(x=>x===19304410).length,1);
 assert.ok(Object.values(approved).flat().includes(24203749),'Gallant Bandit in side');
 assert.equal(deck.main.filter(x=>nameKey(db,x)===A).length,3);
 assert.equal(nameKey(db,25451383),25451383);
 assert.deepEqual(validateDeck(deck,db,list,{exactSizes}).errors,[]);
 const overs={...deck,main:[W,W,...deck.main.slice(0,-2)]};
 assert.ok(validateDeck(overs,db,list,{exactSizes}).errors.some(e=>e.code==='COPIES'&&e.id===A&&e.count===5));
 const across={...deck,side:[A,...deck.side.slice(0,-1)]};
 assert.ok(validateDeck(across,db,list).errors.some(e=>e.code==='COPIES'&&e.count===4));
 assert.ok(validateDeck({...deck,side:[]},db,list,{exactSizes}).errors.some(e=>e.code==='EXACT_SIZE'&&e.zone==='side'));
 assert.equal(isBrandedNov08(deck),true);
 assert.equal(isBrandedNov08({id:'branded',format:'other'}),false);
 assert.equal(keyCards('branded',deck).has('Springans Kitt'),true);
 assert.equal(keyCards('branded',deck).has('Tri-Brigade Springans Kitt'),true);
 assert.equal(keyCards('branded',deck).has('Branded in White'),true);
});

test('(M) Ash on Branded Fusion preserves the activation-turn Fusion lock (shipped engine)',()=>{
 const d=make([hand(F),hand(A),field(Q,0),field(AL,1),hand(ASH,1)],[THREE,L]);
 try{
  assert.ok(summons(d,THREE),'control: legal Synchro before Fusion activation');
  activate(d,F);
  until(d,m=>m.type===M.SELECT_CHAIN&&m.seat===1&&m.selects.some(c=>c.code===ASH));
  d.respond({type:R.SELECT_CHAIN,index:d.prompt.selects.findIndex(c=>c.code===ASH)});
  until(d,idle);
  assert.ok(!summons(d,THREE),'Synchro unavailable after effect negation');
  assert.ok(!d.zone(0,4).some(c=>c?.code===L),'negated Fusion did not resolve');
  assert.equal(d.retries,0);
 }finally{d.stop()}
});

test('(M/P) Nadir delay is enforced by policy while Synchro is offered; engine suppresses it after resolution',()=>{
 // r42: Three Champions only counts as an offered route against a worthwhile opposing target (Aluber on their field).
 {const e=make([hand(N),field(Q,0),field(AL,1)],[THREE,T],{more:[A]});try{assert.ok(summons(e,THREE));assert.equal(bookActivationBlock(e,0,e.prompt.activates[acts(e,N)]),null,'no target: the held Synchro does not keep Nadir waiting')}finally{e.stop()}}
 const d=make([hand(N),field(Q,0),field(AL,1),field(AL,0,1)],[THREE,T],{more:[A]});
 try{
  assert.ok(summons(d,THREE));
  assert.match(bookActivationBlock(d,0,d.prompt.activates[acts(d,N)]),/keep Nadir/);
  activate(d,N);
  until(d,idle,(m)=>m.type===M.SELECT_CARD&&selects(d,T)?{type:R.SELECT_CARD,indicies:[m.selects.findIndex(c=>c.code===T)]}:undefined);
  assert.ok(d.zone(0,16).some(c=>c?.code===T));
  assert.ok(!summons(d,THREE));
  assert.equal(d.retries,0);
 }finally{d.stop()}
});

test('(M) White sends a legal Albaz-mentioned Extra Deck card and recruits Ecclesia, never Cartesia',()=>{
 const d=make([hand(W),hand(C)],[T,G],{more:[E]});
 try{
  activate(d,W);
  until(d,m=>m.type===M.SELECT_CARD&&selects(d,T));
  assert.ok(!selects(d,G),'Granguignol absent from the legal send prompt');
  choose(d,T);
  trigger(d,W);
  until(d,m=>m.type===M.SELECT_CARD&&selects(d,E));
  assert.ok(!selects(d,C),'Cartesia absent from the recruit prompt');
  choose(d,E);until(d,idle);
  assert.ok(d.zone(0,4).some(c=>c?.code===E));
  assert.equal(d.retries,0);
 }finally{d.stop()}
});

test('(M) White restricts Garura summon but permits an otherwise-legal Nadir send',()=>{
 const d=make([hand(W),hand(SP),hand(N),field(46986414,0,1),field(38033121,1,1)],[T,GARURA],{more:[Q]});
 try{
  assert.ok(acts(d,SP)>=0,'control: Garura available via Super Poly');
  activate(d,W);until(d,m=>m.type===M.SELECT_CARD&&selects(d,T));choose(d,T);until(d,idle);
  assert.ok(acts(d,SP)<0,'Level 6 Garura not summonable');
  activate(d,N);until(d,m=>m.type===M.SELECT_CARD&&selects(d,GARURA));
  choose(d,GARURA);until(d,m=>m.type===M.SELECT_CARD&&selects(d,Q));
  assert.ok(!selects(d,W)&&!selects(d,A),'Garura 1500 ATK permits Quem, not Albaz');
  choose(d,Q);until(d,idle);
  assert.ok(d.zone(0,16).some(c=>c?.code===GARURA),'Garura may be sent');
 }finally{d.stop()}
});

test('(M) F&V send excludes Granguignol; dumped Fusion is not a legal revive target',()=>{
 const d=make([hand(V),field(AL,0)],[G,T]);
 try{activate(d,V);until(d,m=>m.type===M.SELECT_CARD&&selects(d,T));assert.ok(!selects(d,G));}finally{d.stop()}
 const d2=make([hand(V),field(E,0),gy(G),gy(A)],[]);
 try{
  activate(d2,V);until(d2,m=>m.type===M.SELECT_CARD&&selects(d2,A));
  assert.ok(!selects(d2,G),'dumped Granguignol cannot be revived');
  choose(d2,A);until(d2,idle);
  assert.ok(d2.zone(0,4).some(c=>c?.code===A),'legal comparison target revived');
 }finally{d2.stop()}
});

test('(M/P) original Kitt is a legal Branded Spell search, book prefers Branded Fusion',()=>{
 const d=make([hand(K)],[L],{more:[F,V,A],seed:1});
 try{
  assert.equal(idleStep(d,0,d.prompt,newBookState(),()=>false)?.card,'Springans Kitt');
  normal(d,K);
  trigger(d,K);
  until(d,m=>m.type===M.SELECT_CARD&&selects(d,F)&&selects(d,V));
  const p=bookPick(d,0,d.prompt,{type:R.SELECT_CARD,indicies:[d.prompt.selects.findIndex(c=>c.code===V)]});
  assert.equal(p?.card,'Branded Fusion');
  d.respond(p.response);until(d,idle);
  assert.ok(d.zone(0,2).some(c=>c?.code===F));
 }finally{d.stop()}
});

test('(M) Branded Fusion cannot offer three-material Dogma',()=>{
 const d=make([hand(F),hand(A),hand(AL),hand(Q)],[D,L]);
 try{activate(d,F);until(d,m=>m.type===M.SELECT_CARD&&selects(d,L));assert.ok(!selects(d,D));}finally{d.stop()}
});

test('(P) Bystial holds our only protected GY resource; otherwise prefers legal opposing target',()=>{
 const d=make([hand(MAG),gy(A)],[T]);
 try{assert.match(bookActivationBlock(d,0,d.prompt.activates[acts(d,MAG)]),/hold Bystial/);}finally{d.stop()}
 const d2=make([hand(MAG),gy(A),gy(AL,1)],[T]);
 try{
  assert.equal(bookActivationBlock(d2,0,d2.prompt.activates[acts(d2,MAG)]),null);
  activate(d2,MAG);until(d2,m=>m.type===M.SELECT_CARD&&selects(d2,A)&&selects(d2,AL));
  const p=bookPick(d2,0,d2.prompt,{type:R.SELECT_CARD,indicies:[d2.prompt.selects.findIndex(c=>c.code===A)]});
  assert.equal(p?.card,db[AL].name);
  d2.respond(p.response);until(d2,idle);
  assert.ok(d2.zone(0,16).some(c=>c?.code===A));
 }finally{d2.stop()}
});

const ED=78397661,LL=53971455,JADE=44146295,STARVING=41209827;
function auto(d,done,limit=160){
 const pilots=createOptimalPilots({seed:d.seed,searchEnabled:false,doctrine:true}),trace=[];
 for(let i=0;i<limit&&d.prompt&&!d.finished;i++){
  if(done(d))break;
  const p=d.prompt,seat=p.seat,plan=pilots[seat].base(safeView(d,seat));
  assert.ok(plan?.response,'policy returned no response');
  const r=plan.response,src=d.currentEffect?.code;
  const card=p.type===M.SELECT_IDLECMD?p[{0:'summons',1:'special_summons',5:'activates'}[r.action]]?.[r.index]?.code:
    p.type===M.SELECT_CHAIN?p.selects?.[r.index]?.code:p.type===M.SELECT_EFFECTYN&&r.yes?p.code:null;
  if(card||src&&r.indicies?.length)trace.push({turn:d.turn,seat,action:r.action,card,src,hint:d.hint,rule:plan.book?.rule,picks:r.indicies?.map(j=>p.selects?.[j]?.code)});
  d.respond(r);assert.equal(d.retries,0,'engine rejected an autonomous response');
  pilots[seat].observe(plan);
 }
 assert.ok(done(d),JSON.stringify({turn:d.turn,phase:d.phase,trace}));
 return trace;
}
test('(A) r42: White first-turn line makes no empty-board Synchro (Three Champions held without a target)',()=>{
 const d=make([hand(W)],[T,THREE,38811586,3410461],{more:[E,A],seed:1,auto:true});
 try{
  const trace=auto(d,d=>d.turn>1);
  assert.ok(trace.some(t=>t.card===W),JSON.stringify(trace));
  assert.ok(!trace.some(t=>t.action===1&&t.card===THREE),JSON.stringify(trace));
  assert.ok(!d.zone(0,4).some(c=>c?.code===THREE));
 }finally{d.stop()}
});
test('(A) White converts Ecclesia into original Albaz to break an opposing Extra Deck board',()=>{
 const d=make([hand(W),field(STARVING,0,1)],[T,ED,THREE,JADE],{more:[E,A],seed:1,auto:true});
 try{
  const trace=auto(d,d=>d.zone(0,4).some(c=>c?.code===JADE));
  assert.ok(trace.some(t=>t.action===5&&t.card===E&&/WHITE-BREAK/.test(t.rule||'')),JSON.stringify(trace));
  assert.ok(!trace.some(t=>t.action===1&&[ED,THREE].includes(t.card)));
  assert.ok(!d.zone(1,4).some(c=>c?.code===STARVING),'opposing monster used as Fusion material');
 }finally{d.stop()}
});
test('(A) Nadir after Extra Deck prefers Garura/Titaniklad; removed Lulu route does not crash',()=>{
 const d=make([hand(N)],[T,GARURA,G],{more:[Q,A,C],seed:1,auto:true});
 try{
  const trace=auto(d,d=>d.zone(0,16).some(c=>c?.code===GARURA||c?.code===T)||d.turn>=2,180);
  assert.ok(trace.some(t=>t.src===N&&(t.picks?.includes(GARURA)||t.picks?.includes(T))),JSON.stringify(trace));
  assert.ok(!trace.some(t=>t.picks?.includes(LL)),'no Luluwalilith pick on this list');
  assert.equal(d.retries,0);
 }finally{d.stop()}
});

test('(A) after opposing Ash, pilot recovers into a Fusion without a Synchro rescue',()=>{
 // Branded in White needs a legal Dragon Fusion; Albaz+Aluber on field supplies Lubellion/Mirrorjade materials.
 const WHITE_SPELL=34995106;
 const d=make([hand(F),hand(WHITE_SPELL),field(A,0),field(AL,1),hand(ASH,1)],[L,G,THREE,JADE],{more:[C,19096726],seed:1,auto:true});
 try{
  const trace=auto(d,d=>d.zone(0,4).some(c=>[L,G,JADE].includes(c?.code)),140);
  assert.ok(trace.some(t=>t.seat===1&&t.card===ASH),JSON.stringify(trace));
  assert.ok(d.events.some(e=>e.type==='negate'&&e.code===F),'Branded Fusion effect was negated');
  assert.ok(!trace.some(t=>t.action===1&&t.card===THREE),'no Synchro after Branded Fusion activation');
  assert.ok(trace.some(t=>t.action===5&&t.card===WHITE_SPELL)||d.zone(0,4).some(c=>[L,G,JADE].includes(c?.code)),JSON.stringify(trace));
 }finally{d.stop()}
});

test('(P) Nadir without Cartesia does not force the Garura delayed line',()=>{
 const d=make([hand(N)],[GARURA,T,G],{more:[Q,A],seed:1});
 try{
  activate(d,N);until(d,m=>m.type===M.SELECT_CARD&&selects(d,GARURA)&&selects(d,T));
  for(const code of [GARURA,T]){
   const m=d.prompt,response={type:R.SELECT_CARD,indicies:[m.selects.findIndex(c=>c.code===code)]};
   const p=bookPick(d,0,m,response);
   const chosen=m.selects[(p?.response||response).indicies[0]].code;
   assert.equal(chosen,T);
   if(code===GARURA)assert.equal(p?.card,db[T].name);
   if(code===T)assert.equal(p,null);
  }
 }finally{d.stop()}
});

test('(P) delayed Nadir with Cartesia/Quem live prefers Garura at the native send prompt',()=>{
 const d=make([hand(N)],[GARURA,T,G],{more:[Q,A,C],seed:1});
 try{
  activate(d,N);until(d,m=>m.type===M.SELECT_CARD&&selects(d,GARURA)&&selects(d,T));
  for(const code of [GARURA,T]){
   const m=safeView(d,0).prompt,response={type:R.SELECT_CARD,indicies:[m.selects.findIndex(c=>c.code===code)]};
   const p=bookPick(safeView(d,0),0,m,response);
   assert.match(p?.rule,/Nadir: Garura|Nadir delayed|Nadir: Titaniklad/);
   assert.equal(m.selects[p.response.indicies[0]].code,GARURA);
  }
 }finally{d.stop()}
});
test('(P) delayed Nadir Garura line is not forced after the native Normal Summon was used',()=>{
 const d=make([hand(N),hand(WOLF)],[GARURA,T,G],{more:[Q,A,C],seed:1});
 try{
  normal(d,WOLF);until(d,idle);activate(d,N);until(d,m=>m.type===M.SELECT_CARD&&selects(d,GARURA)&&selects(d,T));
  for(const code of [GARURA,T]){
   const m=safeView(d,0).prompt,response={type:R.SELECT_CARD,indicies:[m.selects.findIndex(c=>c.code===code)]};
   const p=bookPick(safeView(d,0),0,m,response);
   const chosen=m.selects[(p?.response||response).indicies[0]].code;
   assert.equal(chosen,T,'after NS, Garura delayed route must not keep; Titaniklad preferred');
   if(code===GARURA)assert.equal(p?.card,db[T].name);
   if(code===T)assert.equal(p,null); // already on preferred general pick
  }
 }finally{d.stop()}
});

test('(P/A) Three Champions does not negate its own field against an empty or vanilla board',()=>{
 for(const opponent of [[],[field(WOLF,0,1)]]){
  const d=make([field(THREE,0),field(AL,1),...opponent],[],{seed:1,auto:true});
  try{
   until(d,idle);
   const offered=d.prompt.activates[acts(d,THREE)];
   assert.ok(offered,'engine offers ignition because our own cards are legal targets');
   assert.match(bookActivationBlock(safeView(d,0),0,offered),/no worthwhile opposing/);
   const trace=auto(d,x=>x.turn===2);
   assert.ok(!trace.some(t=>t.seat===0&&t.card===THREE&&t.action===5),JSON.stringify(trace));
  }finally{d.stop()}
 }
});
test('(P) Three Champions chooses a worthwhile opposing card over the legal friendly card',()=>{
 const d=make([field(THREE,0),field(AL,1),field(STARVING,0,1)],[],{seed:1});
 try{
  assert.equal(bookActivationBlock(safeView(d,0),0,d.prompt.activates[acts(d,THREE)]),null);
  activate(d,THREE);until(d,m=>m.type===M.SELECT_CARD&&selects(d,AL)&&selects(d,STARVING));
  const v=safeView(d,0),m=v.prompt,r={type:R.SELECT_CARD,indicies:[m.selects.findIndex(c=>c.code===AL)]};
  const p=bookPick(v,0,m,r);
  assert.match(p?.rule,/engine-offered opposing/);
  assert.equal(m.selects[p.response.indicies[0]].code,STARVING);
  d.respond(p.response);
  assert.equal(d.retries,0);
 }finally{d.stop()}
});
test('(A) r42: White does not Synchro Three Champions against vanilla; with a worthwhile target it does',()=>{
 const d=make([hand(W),field(WOLF,0,1)],[T,THREE,38811586],{more:[E,A],seed:1,auto:true});
 try{
  const trace=auto(d,x=>x.turn>1);
  assert.ok(!trace.some(t=>t.action===1&&t.card===THREE),JSON.stringify(trace));
 }finally{d.stop()}
 const e=make([field(W,0),field(E,1),hand(WOLF),field(AL,0,1)],[THREE,T],{more:[A],seed:1});
 try{
  assert.ok(summons(e,THREE));const p=createOptimalPilots({seed:1,searchEnabled:false,doctrine:true})[0].base(safeView(e,0));
  assert.equal(p.response.action,1);assert.equal(e.prompt.special_summons[p.response.index].code,THREE);assert.match(p.book.rule,/WHITE-SYN/);
 }finally{e.stop()}
});

test('(P) White and Ecclesia keep offered Branded Fusion ahead of Branded in White and Synchro',()=>{
 const WHITE_SPELL=34995106,MIX=80843006;
 // Mixousia makes BIW legal off White(Dragon)+Ecclesia(Spellcaster); BF must still win the preference.
 const d=make([field(W,0),field(E,1),hand(F),hand(WHITE_SPELL)],[T,ED,THREE,G,L,JADE,MIX],{more:[A,C,19096726],seed:1});
 try{
  assert.ok(summons(d,ED)&&acts(d,F)>=0&&acts(d,WHITE_SPELL)>=0, JSON.stringify({
    syn:summons(d,ED),F:acts(d,F),W:acts(d,WHITE_SPELL),
    acts:d.prompt.activates?.map(c=>db[c.code].name)
  }));
  const v=safeView(d,0),p=createOptimalPilots({seed:1,searchEnabled:false,doctrine:true})[0].base(v);
  assert.equal(p.response.action,5);
  assert.equal(d.prompt.activates[p.response.index].code,F);
  assert.match(p.book.rule,/WHITE-FUSION/);
 }finally{d.stop()}
});
test('(A) White + Branded in White produces a Fusion payoff without stranding the spell',()=>{
 const WHITE_SPELL=34995106;
 const d=make([hand(W),hand(WHITE_SPELL)],[T,ED,THREE,G,L,JADE],{more:[E,A,C,19096726],seed:1,auto:true});
 try{
  const trace=auto(d,x=>x.turn===1&&x.zone(0,4).some(c=>c?.code===JADE||c?.code===G||c?.code===L),160);
  assert.ok(trace.some(t=>t.action===5&&t.card===WHITE_SPELL&&/WHITE-FUSION/.test(t.rule||'')),JSON.stringify(trace));
  assert.ok(!trace.some(t=>t.action===1&&[ED,THREE].includes(t.card)));
 }finally{d.stop()}
});
test('(A) White uses offered original Kitt to search Branded Fusion before Synchro',()=>{
 const d=make([hand(W),hand(K)],[T,ED,THREE,G,L,JADE],{more:[E,A,F,19096726],seed:1,auto:true});
 try{
  const trace=auto(d,x=>x.chain.some(c=>c.code===F),180);
  assert.ok(trace.some(t=>t.card===K&&/WHITE-KITT/.test(t.rule||'')),JSON.stringify(trace));
  assert.ok(trace.some(t=>t.src===K&&t.hint===506&&t.picks?.includes(F)),JSON.stringify(trace));
  assert.ok(trace.some(t=>t.src===K&&t.hint===507&&t.picks?.includes(WOLF)),JSON.stringify(trace));
  assert.ok(!trace.some(t=>t.action===1&&[ED,THREE].includes(t.card)));
 }finally{d.stop()}
});

test('(P) F&V chooses revival with no opponent target and destruction when one is available',()=>{
 for(const enemy of [false,true]){
  const d=make([hand(V),field(E,0),gy(A),...(enemy?[field(WOLF,0,1)]:[])],[T],{seed:1});
  try{
   activate(d,V);until(d,m=>m.type===M.SELECT_OPTION);
   assert.equal(d.prompt.options.length,2);
   const v=safeView(d,0),r=optionPick(v,0,v.prompt);
   assert.match(d.description(d.prompt.options[r.index]),enemy?/destroy/i:/special summon/i);
   d.respond(r);
   until(d,m=>m.type===M.SELECT_CARD&&selects(d,enemy?T:A));
   assert.equal(d.retries,0);
   if(!enemy)assert.ok(d.zone(0,64).some(c=>c?.code===T),'revival leaves the Extra Deck resource');
  }finally{d.stop()}
 }
});
for(const trap of [ASH,59438930])test('(P) Branded uses '+db[trap].name+' on opposing on-field Aluber',()=>{
 const d=make([hand(trap),hand(AL,1)],[L],{first:1,other:[F],opponentId:'branded',seed:1});
 try{
  normal(d,AL);
  const trigger=until(d,m=>m.seat===1&&(m.type===M.SELECT_EFFECTYN&&m.code===AL||m.type===M.SELECT_CHAIN&&m.selects.some(c=>c.code===AL)));
  d.respond(trigger.type===M.SELECT_EFFECTYN?{type:R.SELECT_EFFECTYN,yes:true}:{type:R.SELECT_CHAIN,index:trigger.selects.findIndex(c=>c.code===AL)});
  until(d,m=>m.seat===0&&m.type===M.SELECT_CHAIN&&m.selects.some(c=>c.code===trap));
  const v=safeView(d,0),plan=createOptimalPilots({seed:1,searchEnabled:false,doctrine:true})[0].base(v);
  assert.equal(v.prompt.selects[plan.response.index]?.code,trap);
  assert.equal(d.chain.at(-1).code,AL);
 }finally{d.stop()}
});

test('(P) an opposing Fusion that cannot be used as material does not trigger White’s Albaz board-break override',()=>{
 for(const code of [38811586,3410461]){
  const d=make([field(W,0),field(E,1),hand(WOLF),field(code,0,1)],[THREE,JADE],{more:[A],seed:1});
  try{
   assert.ok(acts(d,E)>=0,'Ecclesia activation offered');
   const v=safeView(d,0),p=createOptimalPilots({seed:1,searchEnabled:false,doctrine:true})[0].base(v);
   assert.doesNotMatch(p.book?.rule||'',/WHITE-BREAK/);
   // r42: Alba-Lenatus is a worthwhile Three Champions target; Sanctifire cannot be targeted, so no Synchro at all.
   if(code===3410461){assert.equal(p.response.action,1);assert.match(p.book.rule,/WHITE-SYN/)}
   else assert.ok(!(p.response.action===1&&d.prompt.special_summons[p.response.index]?.code===THREE));
  }finally{d.stop()}
 }
});

test('(P) after an opposing Aluber search, Branded takes the native Droll response window',()=>{
 const DROLL=94145021,d=make([hand(DROLL),hand(AL,1)],[L],{first:1,other:[F],opponentId:'branded',seed:1});
 try{
  normal(d,AL);
  const p=until(d,m=>m.seat===1&&(m.type===M.SELECT_EFFECTYN&&m.code===AL||m.type===M.SELECT_CHAIN&&m.selects.some(c=>c.code===AL)));
  d.respond(p.type===M.SELECT_EFFECTYN?{type:R.SELECT_EFFECTYN,yes:true}:{type:R.SELECT_CHAIN,index:p.selects.findIndex(c=>c.code===AL)});
  until(d,m=>m.seat===1&&m.type===M.SELECT_CARD&&selects(d,F));choose(d,F);
  until(d,m=>m.seat===0&&m.type===M.SELECT_CHAIN&&m.selects.some(c=>c.code===DROLL));
  const v=safeView(d,0),plan=createOptimalPilots({seed:1,searchEnabled:false,doctrine:true})[0].base(v);
  assert.equal(v.prompt.selects[plan.response.index]?.code,DROLL);
  assert.equal(d.active,1);
 }finally{d.stop()}
});
test('(M/P) Branded uses Fuwalos in an offered opponent-turn window with an empty field',()=>{
 const FUW=42141493,d=make([hand(FUW)],[L],{first:1,opponentId:'blueeyes',seed:1,auto:true});
 try{
  const p=until(d,m=>m.seat===0&&m.type===M.SELECT_CHAIN&&m.selects.some(c=>c.code===FUW));
  assert.equal(d.active,1);assert.ok(!d.zone(0,4).some(Boolean)&&!d.zone(0,8).some(Boolean));
  const v=safeView(d,0),plan=createOptimalPilots({seed:1,searchEnabled:false,doctrine:true})[0].base(v);
  assert.equal(p.selects[plan.response.index]?.code,FUW);
 }finally{d.stop()}
});
test('(P) Retribution recovers the offered Branded Fusion and leaves F&V in the GY',()=>{
 const RET=17751597,d=make([gy(RET),gy(F),gy(V),hand(A)],[L],{seed:1});
 try{
  activate(d,RET);until(d,m=>m.type===M.SELECT_CARD&&selects(d,F)&&selects(d,V));
  const v=safeView(d,0),p=bookPick(v,0,v.prompt,{type:R.SELECT_CARD,indicies:[v.prompt.selects.findIndex(c=>c.code===V)]});
  assert.equal(p?.card,db[F].name);
  d.respond(p.response);until(d,idle);
  assert.ok(d.zone(0,2).some(c=>c?.code===F)&&d.zone(0,16).some(c=>c?.code===V));
 }finally{d.stop()}
});

test('(P) B4 holds F&V when Ecclesia is present but the only GY monster is a dumped Fusion',()=>{
 const d=make([hand(V),field(E,0),gy(T)],[D],{seed:1});
 try{
  const i=acts(d,V);
  assert.ok(i>=0,'engine offers the destroy-only activation because our Ecclesia is face up');
  assert.equal(d.zone(0,LOC.GRAVE).find(c=>c?.code===T)?.status&8,0,'dumped Titaniklad lacks procedure-complete status');
  const v=safeView(d,0);
  assert.match(bookActivationBlock(v,0,v.prompt.activates[i]),/no opposing face-up target and no plausible legal revival/);
  const plan=createOptimalPilots({seed:1,searchEnabled:false,doctrine:true})[0].base(v);
  assert.ok(plan?.response);
  assert.ok(!(plan.response.action===5&&plan.response.index===i),'base pilot must not take the offered F&V activation');
  assert.equal(d.retries,0);
 }finally{d.stop()}
});

test('(P) B4 releases F&V when the same board has a legal target in the opposing GY',()=>{
 const d=make([hand(V),field(E,0),gy(T),gy(A,1)],[D],{seed:1});
 try{
  const v=safeView(d,0);
  assert.ok(acts(d,V)>=0);
  assert.equal(bookActivationBlock(v,0,v.prompt.activates[acts(d,V)]),null);
  activate(d,V);until(d,m=>m.type===M.SELECT_OPTION);
  const op=optionPick(safeView(d,0),0,d.prompt);
  assert.match(d.description(d.prompt.options[op.index]),/special summon/i);
  d.respond(op);until(d,m=>m.type===M.SELECT_CARD&&selects(d,A));
  assert.ok(!selects(d,T),'native revival prompt does not offer dumped Titaniklad');
  const p=createOptimalPilots({seed:1,searchEnabled:false,doctrine:true})[0].base(safeView(d,0));
  assert.equal(d.prompt.selects[p.response.indicies[0]].code,A);
  d.respond(p.response);until(d,idle);
  assert.ok(d.zone(0,LOC.MZONE).some(c=>c?.code===A));
  assert.ok(d.zone(0,LOC.EXTRA).some(c=>c?.code===D),'revival does not pay the destruction cost');
  assert.equal(d.retries,0);
 }finally{d.stop()}
});

test('(P) B4 releases F&V for an opposing face-up target and overrides a friendly destroy pick',()=>{
 const d=make([hand(V),field(E,0),gy(T),field(WOLF,0,1)],[D],{seed:1});
 try{
  const v=safeView(d,0);
  assert.ok(acts(d,V)>=0);
  assert.equal(bookActivationBlock(v,0,v.prompt.activates[acts(d,V)]),null);
  activate(d,V);until(d,m=>m.type===M.SELECT_CARD&&selects(d,D));choose(d,D);
  until(d,m=>m.type===M.SELECT_CARD&&selects(d,WOLF)&&selects(d,E));
  assert.equal(d.hint,502);
  const vv=safeView(d,0),m=vv.prompt,base={type:R.SELECT_CARD,indicies:[m.selects.findIndex(c=>c.code===E)]};
  const p=bookPick(vv,0,m,base);
  assert.equal(m.selects[p.response.indicies[0]].code,WOLF);
  d.respond(p.response);until(d,idle);
  assert.ok(d.zone(0,LOC.MZONE).some(c=>c?.code===E));
  assert.ok(d.zone(1,LOC.GRAVE).some(c=>c?.code===WOLF));
  assert.equal(d.retries,0);
 }finally{d.stop()}
});

test('(P) removed-card routes (Bystial/Deployment/Lost/Lulu) do not crash bookIdle/bookPick',()=>{
 const DEP=6498706,LOST=82738008,BLS=32731036;
 // Fixture can still place retired codes; policy must return null/safe without throw.
 const d=make([hand(DEP),hand(LOST),hand(BLS),hand(F)],[L,LL],{more:[A],seed:1});
 try{
  assert.doesNotThrow(()=>idleStep(d,0,d.prompt,newBookState(),()=>false));
  const plan=createOptimalPilots({seed:1,searchEnabled:false,doctrine:true})[0].base(safeView(d,0));
  assert.ok(plan?.response);
  assert.equal(d.retries,0);
 }finally{d.stop()}
});

test('(P) Branded in White is a preferred Aluber/Kitt search behind Fusion',()=>{
 const WHITE_SPELL=34995106;
 const d=make([hand(K)],[L],{more:[F,WHITE_SPELL,V,A],seed:1});
 try{
  normal(d,K);trigger(d,K);until(d,m=>m.type===M.SELECT_CARD&&selects(d,F));
  const p=bookPick(d,0,d.prompt,{type:R.SELECT_CARD,indicies:[d.prompt.selects.findIndex(c=>c.code===V)]});
  assert.equal(p?.card,'Branded Fusion');
 }finally{d.stop()}
});

test('(M) Gallant Bandit is in card DB with script and side art present',()=>{
 assert.equal(db[24203749]?.name,'The Great Gallant Bandit');
 assert.equal(db[24203749]?.scriptSupported,true);
 assert.ok(approved.side.filter(x=>x===24203749).length===3);
 assert.ok(fs.existsSync('dist/art/24203749.jpg'));
});


// r41 regression tests: RELAY-131 items 1-4 and the 15:40 Extra Deck change (Kevy 10 Nov 2026 22:48 AEDT).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import z from 'node:zlib';
import {test} from 'node:test';
import {loadBuild,scenario,toIdle,answer,db,LOC,POS} from './lib/engine-scenario.mjs';
import {validateDeck} from '../dist/deck-validator.mjs';
import {BRANDED_NOV08,brandedNov08Book} from '../dist/ai/book/branded-nov08.mjs';
import {createOptimalPilots} from '../dist/optimal-pilot.mjs';
import {safeView} from '../dist/ai/knowledge.mjs';
import {idleStep,newBookState,liveStarter} from '../dist/ai/book/book.mjs';
import {nov08Brain} from '../dist/ai/brain/branded-brain.mjs';
import {deckYdk,presetFor} from '../dist/deck-list.mjs';
import {parseYdk} from '../dist/windbot/edo.mjs';
import {planBatch,runBatch,clearDlfx,chainAnchor,chainAnchors,recordChain,DLFX_CAP,DLFX_CHIP_MS} from '../dist/dl-fx.mjs';

const approved=JSON.parse(fs.readFileSync('approved.json')),data=JSON.parse(fs.readFileSync('dist/decks.json')),list=JSON.parse(fs.readFileSync('dist/banlists/tcg-2026-10-19.json'));
const r40=JSON.parse(fs.readFileSync('/workspace/ddl-test-r39/r40-branded-video41-dl-fx/decks.json')).decks.find(d=>d.id==='branded');
const deck={...data.decks.find(d=>d.id==='branded'),...data.decks.find(d=>d.id==='branded').banlistVariants[list.id]};
const scripts=JSON.parse(z.gunzipSync(fs.readFileSync('dist/scripts.json.gz')));
const A=68468459,W=73819701,E=55273560,AL=62962630,F=44362883,BIW=34995106,TK=19304410,MER=19096726,DOGMA=76666602,WING=87758525,ED=78397661,THREE=74405783,T=41373230,L=70534340,JADE=44146295,G=24915933,WOLF=69247929;
const build=await loadBuild(true);const {M,R}=build;
const hand=(code,p=0)=>({p,code,location:LOC.HAND});
const field=(code,sequence,p=0)=>({p,code,location:LOC.MZONE,sequence,position:POS.ATK});
function make(place,extra,{first=0,more=[],seed=11}={}){
 const decks=[{id:'branded',format:BRANDED_NOV08,name:'Branded fixture',main:[...place.filter(x=>x.p===0).map(x=>x.code),...more,...Array(41).fill(WOLF)].slice(0,41),extra},{id:'fixture-b',name:'Opponent fixture',main:[...place.filter(x=>x.p===1).map(x=>x.code),...Array(41).fill(WOLF)].slice(0,41),extra:[]}];
 const d=scenario(build,{decks,first,seed,place});toIdle(build,d,first);return d;
}
const acts=(d,code)=>d.prompt?.activates?.findIndex(c=>c.code===code)??-1;
const until=(d,pred,limit=60)=>{for(let i=0;i<limit&&d.prompt;i++){if(pred(d.prompt))return d.prompt;d.respond(answer(build,d,{}))}assert.fail('prompt not reached')};
const idle=m=>m.type===M.SELECT_IDLECMD&&m.seat===0;

// ---- Fix 1: Branded in White has no Synchro lock and needs a Dragon material, not an Albaz-listing Fusion
test('(R41-1 script) Branded in White Lua: no Extra Deck lock / activity counter; Dragon material required; GY banish only with Albaz',()=>{
 const s=scripts['c34995106.lua'];assert.ok(s);
 assert.doesNotMatch(s,/EFFECT_CANNOT_SPECIAL_SUMMON|AddCustomActivityCounter|GetCustomActivityCount|SetTargetRange/);
 assert.match(s,/IsRace,1,nil,RACE_DRAGON/);assert.match(s,/LOCATION_GRAVE\) then\s+return sg:IsExists\(Card\.IsCode,1,nil,CARD_ALBAZ\)/);
 assert.match(db[BIW].desc,/including a Dragon monster/);assert.doesNotMatch(db[BIW].desc,/cannot Special Summon/i);
 // contrast: Branded Fusion does carry the Fusion-only restriction
 assert.match(db[F].desc,/cannot Special Summon monsters from the Extra Deck/i);
});
test('(R41-1 native) after a Synchro, Branded in White is still offered while Branded Fusion is not',()=>{
 const d=make([field(W,0),field(E,1),hand(BIW),hand(F),hand(A),hand(AL)],[ED,THREE,T,L,JADE,G],{more:[19096726]});
 try{
  assert.ok(acts(d,BIW)>=0&&acts(d,F)>=0,'both offered before the Synchro');
  const i=d.prompt.special_summons.findIndex(c=>c.code===ED);assert.ok(i>=0,'Dark Dragon offered');
  d.respond({type:R.SELECT_IDLECMD,action:1,index:i});until(d,idle);
  assert.ok(d.zone(0,4).some(c=>c?.code===ED),'Synchro on field');
  assert.equal(acts(d,F),-1,'Branded Fusion locked out after a Synchro');
  assert.ok(acts(d,BIW)>=0,'Branded in White still offered after a Synchro');
  d.respond({type:R.SELECT_IDLECMD,action:5,index:acts(d,BIW)});
  until(d,idle);
  assert.equal(d.retries,0);assert.deepEqual(d.errors,[]);
  assert.ok(d.zone(0,4).some(c=>c&&db[c.code]?.type&64),'a Fusion Monster was summoned by Branded in White after the Synchro');
  assert.ok(d.zone(0,4).some(c=>c?.code===JADE),'Mirrorjade (Albaz + the Synchro Dragon as material)');
 }finally{d.stop()}
});
test('(R41-1 teaching) Branded in White card, K08-WHITE-SPELL, K08-WHITE and lock table: no Synchro lock, Dragon material',async()=>{
 const b=await nov08Brain(),c=b.cards['Branded in White'].does;
 assert.match(c,/Dragon/);assert.match(c,/No Extra Deck lock/);assert.match(c,/does not need to list Albaz/);
 assert.doesNotMatch(c,/whole-turn|Fusion-only|lists Fallen of Albaz by/);
 const spell=b.routes.find(r=>r.id==='K08-WHITE-SPELL'),white=b.routes.find(r=>r.id==='K08-WHITE');
 assert.doesNotMatch(JSON.stringify(spell),/Fusion-only|whole-turn|Albaz Fusion using/);assert.match(JSON.stringify(spell),/Dragon/);assert.match(JSON.stringify(spell),/after a Synchro/);
 assert.doesNotMatch(JSON.stringify(white),/Branded in White or Kitt before a Synchro would lock/);assert.match(JSON.stringify(white),/Branded in White is not locked/);
 assert.equal(b.locks.some(l=>l.card==='Branded in White'),false);
 assert.match(b.cards['Fallen of the White Dragon'].does,/Branded in White is not locked by a Synchro/);
 assert.match(fs.readFileSync('dist/ai/book/branded-nov08.mjs','utf8'),/a Synchro would not lock it/);
});

// ---- Fix 2: Tri-Brigade Springans Kitt has no Normal Summon search; the policy does not assume one
test('(R41-2 native) Normal Summoning Tri-Brigade Springans Kitt offers no effect and adds nothing',()=>{
 const d=make([hand(TK)],[DOGMA],{more:[F,BIW]});
 try{
  const handBefore=d.zone(0,2).filter(Boolean).length,deckBefore=d.zone(0,1).filter(Boolean).length;
  const i=d.prompt.summons.findIndex(c=>c.code===TK);assert.ok(i>=0);d.respond({type:R.SELECT_IDLECMD,action:0,index:i});
  let offered=false;for(let k=0;k<20&&d.prompt&&!idle(d.prompt);k++){const m=d.prompt;if(m.seat===0&&(m.type===M.SELECT_EFFECTYN&&m.code===TK||m.type===M.SELECT_CHAIN&&m.selects?.some(c=>c.code===TK)))offered=true;d.respond(answer(build,d,{}))}
  assert.equal(offered,false,'no on-summon activation');
  assert.equal(d.zone(0,2).filter(Boolean).length,handBefore-1);assert.equal(d.zone(0,1).filter(Boolean).length,deckBefore);
  assert.equal(d.zone(0,2).some(c=>c&&[F,BIW].includes(c.code)),false);
 }finally{d.stop()}
});
test('(R41-2 policy) no Normal Summon line or starter status for Tri-Kitt; hand Special Summon only beside Mercourier',()=>{
 assert.equal(brandedNov08Book.starters.includes('Tri-Brigade Springans Kitt'),false);
 assert.equal(brandedNov08Book.starters.includes('Springans Kitt'),true);
 const tri=brandedNov08Book.lines.find(l=>l.id==='K08-TRI-KITT');
 assert.ok(tri);assert.equal(tri.steps.some(s=>s.do==='summon'),false);assert.deepEqual(tri.when.field,['Tri-Brigade Mercourier']);
 assert.doesNotMatch(tri.name,/send\/search Branded Fusion/);
 const d=make([hand(TK)],[DOGMA]);
 try{
  const v=safeView(d,0),step=idleStep(v,0,d.prompt,newBookState(),null);
  assert.ok(!step||step.card!=='Tri-Brigade Springans Kitt',JSON.stringify(step));
  const live=liveStarter(v,0,d.prompt,null);assert.ok(!live||live.card!=='Tri-Brigade Springans Kitt',JSON.stringify(live));
 }finally{d.stop()}
 const e=make([field(MER,0),hand(TK)],[DOGMA]);
 try{
  assert.ok(acts(e,TK)>=0,'engine offers the hand Special Summon beside Mercourier');
  const step=idleStep(safeView(e,0),0,e.prompt,newBookState(),null);
  assert.equal(step?.line,'K08-TRI-KITT');assert.equal(step.action,5);assert.equal(e.prompt.activates[step.index].code,TK);
 }finally{e.stop()}
});
test('(R41-2 teaching) Tri-Kitt card text: no Normal Summon effect; original Kitt stays the searcher',async()=>{
 const b=await nov08Brain(),t=b.cards['Tri-Brigade Springans Kitt'].does;
 assert.match(t,/No Normal Summon effect/);assert.doesNotMatch(t,/Normal Summon extender|can send\/search/);
 assert.match(b.cards['Springans Kitt'].does,/Original Springans Kitt.*search happens only when this card is Normal Summoned or Special Summoned: add 1 Branded Spell\/Trap/);
 assert.doesNotMatch(scripts['c19304410.lua'],/EVENT_SUMMON_SUCCESS|CATEGORY_SEARCH/);assert.match(scripts['c45484331.lua'],/EVENT_SUMMON_SUCCESS/);
});

// ---- Deck change: 15:40 Extra = 3 Dogma, no Wingman; Main/Side unchanged
test('(R41-D) Extra Deck matches the 15:40 frame; Main 41 and Side 15 unchanged from r40; legal on tcg-2026-10-19',async()=>{
 assert.equal(db[DOGMA].name,'The Dragon that Devours the Dogma');
 assert.equal(deck.extra.filter(x=>x===DOGMA).length,3);assert.equal(deck.extra.includes(WING),false);assert.equal(deck.extra.length,15);
 assert.deepEqual(deck.main,r40.banlistVariants[list.id].main);assert.deepEqual(deck.side,r40.banlistVariants[list.id].side);
 const before=[...r40.banlistVariants[list.id].extra].sort(),after=[...deck.extra].sort();
 const diff=(a,b)=>{const m=new Map();for(const x of a)m.set(x,(m.get(x)||0)+1);for(const x of b)m.set(x,(m.get(x)||0)-1);return [...m].filter(([,n])=>n).map(([x,n])=>[x,n])};
 // r42: + budget swap (Aeon 33166263 -> Alba-Lenatus 3410461, Ecclesia and the Dark Dragon 78397661 -> Sanctifire 38811586)
 assert.deepEqual(diff(after,before).sort(),[[DOGMA,1],[WING,-1],[33166263,-1],[78397661,-1],[3410461,1],[38811586,1]].sort());
 for(const z of ['main','extra','side'])assert.deepEqual(deck[z],approved[z]);
 assert.equal(JSON.stringify(list).includes(String(DOGMA)),false,'Dogma is unlimited on 19 Oct 2026');
 const v=validateDeck(deck,db,list,{scripts,exactSizes:{main:41,extra:15,side:15}});assert.deepEqual(v.errors,[]);
 assert.match(deck.name,/budget Extra/);assert.match(deck.subtitle,/15:40 Extra/);
 const y=deckYdk(presetFor(data.decks.find(d=>d.id==='branded'),'tcg-2026-10-19'));assert.deepEqual(parseYdk(y),approved);
 const b=await nov08Brain();assert.equal('Favorite HERO Shining Flare Wingman' in b.cards,false);
 assert.doesNotMatch(fs.readFileSync('dist/ai/book/branded-nov08.mjs','utf8'),/Wingman|87758525/);
 for(const id of new Set([...deck.main,...deck.extra,...deck.side]))assert.ok(fs.existsSync('dist/art/'+id+'.jpg'),'art '+id);
});

// ---- DOM shim for dl-fx runtime tests
function shim(){
 const nodes=[];const mk=tag=>{const n={tag,className:'',style:{props:{},setProperty(k,v){this.props[k]=v}},dataset:{},attrs:{},isConnected:true,innerHTML:'',textContent:'',
  classList:{s:new Set(),add(c){this.s.add(c)},remove(c){this.s.delete(c)},contains(c){return this.s.has(c)}},setAttribute(k,v){this.attrs[k]=v},remove(){this.isConnected=false},getBoundingClientRect(){return {left:0,top:0,width:0,height:0}}};nodes.push(n);return n};
 const body=mk('body');body.append=n=>{n.parent=body};
 const doc={body,nodes,createElement:mk,querySelector:()=>null,getElementById:()=>null,defaultView:{innerWidth:1280,innerHeight:800,matchMedia:()=>({matches:false})}};
 return doc;
}
const rect={left:100,top:100,width:60,height:80,bottom:180,right:160};
function withTimers(fn){const real=globalThis.setTimeout,seen=[];globalThis.setTimeout=(f,ms)=>{seen.push(ms);return real(()=>{},0)};try{return {out:fn(),seen}}finally{globalThis.setTimeout=real}}
const mounted=doc=>doc.nodes.filter(n=>/\bdlfx\b/.test(n.className));

// ---- Fix 3: legacy chain mode NEGATED badge without a source card
test('(R41-3) unanchored negate uses the recorded activation anchor of the same chain link',()=>{
 clearDlfx();chainAnchors.clear();const doc=shim(),asked=[];const point=src=>{asked.push(src);return src?{getBoundingClientRect:()=>rect}:null};
 const act={type:'activate',chain:2,code:14558127,player:1,source:{controller:1,location:2,sequence:0},effectLocation:2};
 runBatch({events:[act],preset:'duel',duration:900,point},doc);
 const neg={type:'negate',chain:2,code:14558127,description:'0',effectLocation:2};// raw engine event: no source, no player
 assert.deepEqual(chainAnchor(neg),{source:act.source,player:1});
 const d2=shim();runBatch({events:[neg],preset:'duel',duration:900,point},d2);
 const badge=mounted(d2).find(n=>n.className.includes('dlfx-chain'));assert.ok(badge,'NEGATED badge mounted');
 assert.equal(badge.dataset.kind,'negate');assert.match(badge.innerHTML,/NEGATED · CL 2/);assert.doesNotMatch(badge.className,/generic/);
 assert.deepEqual(asked.at(-1),act.source);
 clearDlfx();
});
test('(R41-3) unanchored negate with no known link mounts a generic table-centre NEGATED badge; a mismatched code is not reused',()=>{
 clearDlfx();chainAnchors.clear();const doc=shim(),point=()=>null;
 const neg={type:'negate',chain:1,code:999,effectLocation:4};
 assert.equal(chainAnchor(neg),null);
 runBatch({events:[neg],preset:'learning',duration:1200,point},doc);
 const badge=mounted(doc).find(n=>n.className.includes('dlfx-chain'));assert.ok(badge);assert.match(badge.className,/dlfx-chain-generic/);assert.equal(badge.dataset.kind,'negate');
 recordChain([{type:'activate',chain:1,code:111,player:0,source:{controller:0,location:4,sequence:1}}]);
 assert.equal(chainAnchor({type:'negate',chain:1,code:222}),null,'different card on the same link number is not reused');
 assert.ok(chainAnchor({type:'negate',chain:1,code:111}));
 recordChain([{type:'chainEnd'}]);assert.equal(chainAnchor({type:'negate',chain:1,code:111}),null,'chain end forgets links');
 // an activate or resolve with no anchor still mounts nothing (only NEGATED gets the generic fallback)
 const d3=shim();runBatch({events:[{type:'resolve',chain:3,code:5}],preset:'duel',duration:900,point},d3);assert.equal(mounted(d3).length,0);
 // Instant and FX-off still plan nothing
 assert.deepEqual(planBatch([neg],{preset:'instant',duration:900}),[]);assert.deepEqual(planBatch([neg],{preset:'duel',duration:900,enabled:false}),[]);
 clearDlfx();
});

// ---- Fix 4: decorative lifetimes stay within min(batch duration, cap)
test('(R41-4) turn, burst, tags, pillar, chain and slash are removed within the batch budget (Broadcast 400 ms; 150 ms)',()=>{
 for(const [preset,duration] of [['broadcast',400],['duel',150],['learning',5000]]){
  clearDlfx();const doc=shim(),point=()=>({getBoundingClientRect:()=>rect}),budget=Math.min(duration,DLFX_CAP[preset]);
  const events=[{type:'turn',turn:3,player:0},{type:'damage',player:1,amount:2400,combat:true},{type:'recover',player:0,amount:500},
   {type:'summon',code:1,player:0,sequence:2,special:true},{type:'activate',chain:1,code:2,player:0,source:{controller:0,location:4,sequence:2},effectLocation:4},
   {type:'attack',from:{controller:0,location:4,sequence:2},to:null},
   ...Array.from({length:8},(_,i)=>({type:'move',reason:0x40,from:{controller:0,location:1},to:{controller:0,location:16,sequence:i}}))];
  const {seen}=withTimers(()=>runBatch({events,preset,duration,point},doc));
  const ns=mounted(doc);assert.ok(ns.length>=8,preset+' mounted '+ns.length);
  for(const n of ns){const ms=parseInt(n.style.props['--dlfx-ms']),delay=parseInt(n.style.props['--dlfx-delay']||'0');assert.ok(ms+delay<=budget,`${preset} ${n.className} ${ms}+${delay}>${budget}`)}
  for(const ms of seen)assert.ok(ms<=budget,preset+' timer '+ms+'>'+budget);
 }
 clearDlfx();
});
test('(R41-4) documented exception: the compact coin chip keeps DLFX_CHIP_MS only when the full cutscene is off; none at Instant',()=>{
 const toss={type:'coinToss',toss:{kind:'coin',results:[true],code:0}};
 assert.deepEqual(planBatch([toss],{preset:'instant',duration:0}),[]);
 assert.deepEqual(planBatch([toss],{preset:'duel',duration:3000,coinShown:true}),[]);
 assert.equal(planBatch([toss],{preset:'duel',duration:0}).length,1);assert.equal(DLFX_CHIP_MS,1900);
 assert.match(fs.readFileSync('dist/dl-fx.mjs','utf8'),/Documented exception: the compact coin \/ dice chip/);
 assert.doesNotMatch(fs.readFileSync('dist/dl-fx.mjs','utf8'),/Math\.max\(ms,(700|900)\)|Math\.max\(200,ms-delay\)|ms\+40\)/);
});
test('(R41-4) accent sound bus fades to zero by the batch budget and its cut timer is within budget',()=>{
 clearDlfx();const calls=[];
 const ctx={state:'running',currentTime:10,createGain(){return {gain:{value:1,setValueAtTime(v,t){calls.push(['set',v,t])},linearRampToValueAtTime(v,t){calls.push(['ramp',v,t])},cancelScheduledValues(){}},disconnect(){}}}};
 const sound={context:ctx,route(){},tone(){},noise(){},enabled:true,volume:.5,levels:{sfx:.8},seat:0};
 const doc=shim(),point=()=>({getBoundingClientRect:()=>rect});
 const {seen}=withTimers(()=>runBatch({events:[{type:'turn',turn:2,player:0}],preset:'broadcast',duration:400,point,sound},doc));
 const ramp=calls.find(c=>c[0]==='ramp');assert.ok(ramp,'fade scheduled');assert.equal(ramp[1],0);assert.ok(ramp[2]<=10.4+1e-9,'fade ends by the budget');
 assert.ok(seen.length&&seen.every(ms=>ms<=400),'timers '+seen);
 clearDlfx();
});

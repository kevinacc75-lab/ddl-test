// r26 (Claude, 21 Oct; Kevy's tablet recording): Branded v5.3 combo-book lines under the 19 Oct 2026 list.
// SELF-VERIFIED (builder = verifier), NOT independent; Akiza (lines) and Alexis (rulings) review pending.
// (a) Kevy's weak hand (Fusion Deployment, Guiding Quem, Nadir Servant, Super Polymerization, The Fallen & The Virtuous)
//     no longer ends turn 1 with Albaz + Quem and no Fusion: it reaches an Extra Deck monster (Quem -> Deployment
//     revealing Granguignol -> Cartesia -> Granguignol).
// (b) Fusion Deployment reveals Lubellion (Special Summon Albaz) when Cartesia is already in hand, Granguignol otherwise.
// (c) Despian Luluwalilith: the book only asks for it with a Level 4 Tuner + two Level 4 non-Tuners, and its materials
//     pick never spends a Level 8 payoff (Mirrorjade) when Level 4 monsters are offered.
// (d) every book IDLECMD move is one of the engine's legal choices.
import assert from 'node:assert/strict';import fs from 'node:fs';import {gunzipSync} from 'node:zlib';
import {Duel,M} from '../dist/duel.mjs';import {createOptimalPilots} from '../dist/optimal-pilot.mjs';import {safeView} from '../dist/ai/knowledge.mjs';import {shuffleDeck} from '../dist/random.mjs';
import {idleStep,bookPick,newBookState} from '../dist/ai/book/book.mjs';
const db=JSON.parse(gunzipSync(fs.readFileSync('dist/cards.json.gz'))),scripts=JSON.parse(gunzipSync(fs.readFileSync('dist/scripts.json.gz')));
const LIST='tcg-2026-10-19',decks=JSON.parse(fs.readFileSync('dist/decks.json')).decks.map(x=>{const v=x.banlistVariants?.[LIST];return v?{...x,...v}:x});
const deck=id=>decks.find(x=>x.id===id),code=n=>+Object.keys(db).find(k=>db[k].name===n);
const d=await Duel.create(db,scripts);
const stacked=(seed,top)=>{const order=shuffleDeck(deck('branded').main,seed,0);for(const n of top){const i=order.findIndex(c=>db[c].name===n);assert.ok(i>=0,n+' in Branded v5.3 main');order.push(order.splice(i,1)[0])}return order};
function ownTurn1(seed,opp,top){
 const pilots=createOptimalPilots({seed,searchEnabled:false,book:true});
 d.start([deck('branded'),deck(opp)],{seed,first:0,deckOrders:[{main:stacked(seed,top),extra:deck('branded').extra},{main:shuffleDeck(deck(opp).main,seed,1),extra:deck(opp).extra}]});
 const nm=c=>d.name(c.code),hand0=d.zone(0,2).filter(Boolean).map(nm),lines=[],picks=[];let n=0;
 while(d.prompt&&!d.finished&&d.turn<=1&&n<500){const p=d.prompt,plan=pilots[p.seat].plan(d);assert.ok(plan,'a plan at every prompt');
  if(p.seat===0&&plan.book){if(p.type===M.SELECT_IDLECMD&&plan.book.kind==='step'){const legal=safeView(d,0).choices().map(c=>JSON.stringify(c.response));assert.ok(legal.includes(JSON.stringify(plan.response)),'book move is legal: '+JSON.stringify(plan.response));lines.push(String(plan.book.rule).replace('Opening book ',''))}
   if(plan.book.kind==='pick')picks.push(plan.book.card)}
  d.respond(plan.response);for(const x of pilots)x.observe?.(plan);n++}
 assert.ok(n<500,'turn 1 ends without a loop');
 const out={hand0,monsters:d.zone(0,4).filter(Boolean).map(nm),lines,picks};return out}
const ED=new Set(deck('branded').extra.map(c=>db[c].name));
// (a) Kevy's recorded hand.
const kevy=['Fusion Deployment','Guiding Quem, the Virtuous','Nadir Servant','Super Polymerization','The Fallen & The Virtuous'];
for(const [seed,opp] of [[16,'sky'],[4,'mikanko'],[7,'luna']]){
 const r=ownTurn1(seed,opp,kevy);
 for(const n of kevy)assert.ok(r.hand0.includes(n),'stacked hand has '+n+' '+JSON.stringify(r.hand0));
 const negated=!r.monsters.length;// a hand trap can still stop the line; then nothing is asserted about the board
 if(!negated)assert.ok(r.monsters.some(n=>ED.has(n)),`seed ${seed} vs ${opp}: an Extra Deck monster on board, got ${JSON.stringify(r.monsters)} lines ${JSON.stringify(r.lines)}`);
 assert.ok(r.lines.includes('V53-L3'),'the v5.3 Quem -> Deployment line runs');
}
// (b)/(c) pick and line rules on a small public view (no engine needed).
const mk=(name,extra={})=>({code:code(name),position:1,location:4,...extra});
const view=({hand=[],field=[],opp=[]})=>{const z={2:hand.map(n=>mk(n,{location:2})),4:field.map(n=>mk(n))};
 return {active:0,phase:4,turn:1,order:[0,1],decks:[{id:'branded'},{id:'sky'}],db,name:c=>db[c]?.name||'',hint:0,currentEffect:null,attempts:new Map(),key:c=>c.code,
  zone:(s,l)=>s===0?(z[l]||[]):(l===4?opp.map(n=>mk(n)):[])}};
const pickFor=(v,source,hint,offered,type=M.SELECT_CARD)=>{v.currentEffect={code:code(source)};v.hint=hint;const m={type,selects:offered.map(n=>mk(n,{location:64}))};
 const res=bookPick(v,0,m,type===M.SELECT_CARD?{indicies:[offered.length-1]}:{index:offered.length-1});return res?res.card:offered[offered.length-1]};
const reveal=['Granguignol the Dusk Dragon','Lubellion the Searing Dragon','Titaniklad the Ash Dragon','Mirrorjade the Iceblade Dragon'].reverse();
assert.equal(pickFor(view({hand:['Super Polymerization'],field:['Guiding Quem, the Virtuous']}),'Fusion Deployment',526,reveal),'Granguignol the Dusk Dragon','no Cartesia in hand: reveal Granguignol (Special Summon Cartesia from the Deck)');
assert.equal(pickFor(view({hand:['Blazing Cartesia, the Virtuous','Springans Kitt']}),'Fusion Deployment',526,reveal),'Lubellion the Searing Dragon','Cartesia in hand: reveal Lubellion (Special Summon Albaz)');
assert.equal(pickFor(view({field:['Fallen of Albaz','Blazing Cartesia, the Virtuous']}),'Blazing Cartesia, the Virtuous',509,['Albion the Sanctifire Dragon','Granguignol the Dusk Dragon','Lubellion the Searing Dragon']),'Lubellion the Searing Dragon','Cartesia: Lubellion (then Mirrorjade) before Granguignol');
const lulu={type:M.SELECT_IDLECMD,summons:[],activates:[],spell_sets:[],monster_sets:[],special_summons:[mk('Despian Luluwalilith',{location:64})]};
const kevyBoard=['Mirrorjade the Iceblade Dragon','Fallen of Albaz','Guiding Quem, the Virtuous','Incredible Ecclesia, the Virtuous','Fallen of the White Dragon'];
const step=idleStep(view({field:kevyBoard}),0,lulu,newBookState(),()=>false);
assert.equal(step?.line,'V53-SYN','Kevy\'s board (Tuner + two Level 4 non-Tuners) with Luluwalilith legal: the book Synchro Summons it');
assert.equal(idleStep(view({field:['Guiding Quem, the Virtuous','Mirrorjade the Iceblade Dragon']}),0,lulu,newBookState(),()=>false),null,'Quem + Mirrorjade only: the book never asks to Synchro with the payoff');
assert.equal(idleStep(view({field:['Guiding Quem, the Virtuous','Incredible Ecclesia, the Virtuous','Fallen of Albaz']}),0,lulu,newBookState(),()=>false),null,'two Tuners + one non-Tuner is not enough');
assert.equal(pickFor(view({field:kevyBoard}),'(Synchro Summon procedure: no effect source)',512,['Mirrorjade the Iceblade Dragon','Fallen of Albaz','Guiding Quem, the Virtuous'].reverse(),M.SELECT_UNSELECT_CARD)!=='Mirrorjade the Iceblade Dragon',true,'Synchro materials skip Mirrorjade');
d.stop?.();
console.log(JSON.stringify({test:'r26-branded-v53-book',pass:true,node:process.version,list:LIST,selfVerified:true}));

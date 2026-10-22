// r18b TASK a2 (Claude, 20 Oct): Branded opening book, never-pass-with-a-live-hand, set/hold/activate rules.
// Base policy only (search off), so it is fast and exercises exactly what the live AI plays when search falls back.
// (a) Aluber + Branded Fusion + Golden Swordsoul must not end turn 1 with one body.
// (b) a Trap/Quick-Play with no hold rule is Set by the end of turn 1; hold rules keep Called by the Grave (vs Sky
//     Striker) and Branded Retribution (no Albaz Fusion) in hand.
// (c) every book move is one of the engine's legal choices, and the book gives up cleanly when a hand trap hits.
// (e) no Tribute Summon over the line's payoff; no turn-1 Super Polymerization on our own monsters.
import assert from 'node:assert/strict';import fs from 'node:fs';import {gunzipSync} from 'node:zlib';
import {Duel,M} from '../dist/duel.mjs';import {createOptimalPilots} from '../dist/optimal-pilot.mjs';import {safeView} from '../dist/ai/knowledge.mjs';import {shuffleDeck} from '../dist/random.mjs';
const db=JSON.parse(gunzipSync(fs.readFileSync('dist/cards.json.gz'))),scripts=JSON.parse(gunzipSync(fs.readFileSync('dist/scripts.json.gz'))),decks=JSON.parse(fs.readFileSync('dist/decks.json')).decks;
const d=await Duel.create(db,scripts),deck=id=>decks.find(x=>x.id===id),code=n=>+Object.keys(db).find(k=>db[k].name===n);
// Seeded order with the named cards moved to the top (the last five cards of deckOrders.main are the opening hand).
const stacked=(seed,top)=>{const order=shuffleDeck(deck('branded').main,seed,0);for(const n of top){const i=order.findIndex(c=>db[c].name===n||db[db[c].alias]?.name===n);assert.ok(i>=0,n+' in Branded main');order.push(order.splice(i,1)[0])}return order};
function ownTurn1(seed,opp,{book=true,top=null}={}){
 const pilots=createOptimalPilots({seed,searchEnabled:false,book});
 d.start([deck('branded'),deck(opp)],{seed,first:0,...(top?{deckOrders:[{main:stacked(seed,top),extra:deck('branded').extra},{main:shuffleDeck(deck(opp).main,seed,1),extra:deck(opp).extra}]}:{})});
 const nm=c=>d.name(c.code),hand0=d.zone(0,2).filter(Boolean).map(nm),bookMoves=[],passive=[],traps=[];let n=0;
 while(d.prompt&&!d.finished&&d.turn<=1&&n<400){const p=d.prompt,plan=pilots[p.seat].plan(d);assert.ok(plan,'a plan at every prompt');
  if(p.seat===0){if(plan.book&&['step','set','prevented','hold'].includes(plan.book.kind)&&p.type===M.SELECT_IDLECMD){const legal=safeView(d,0).choices().map(c=>JSON.stringify(c.response));assert.ok(legal.includes(JSON.stringify(plan.response)),'book move is a legal engine choice: '+JSON.stringify(plan.response));bookMoves.push(plan.book.rule)}if(plan.passivePass)passive.push(plan.passivePass)}
  if(p.seat===1&&p.type===M.SELECT_CHAIN&&plan.response.index!=null)traps.push(nm(p.selects[plan.response.index]));
  d.respond(plan.response);for(const x of pilots)x.observe?.(plan);n++}
 assert.ok(n<400,'turn 1 ends without a loop');
 const st=d.zone(0,8).filter(c=>c&&c.sequence<5);
 const out={hand0,decisions:n,monsters:d.zone(0,4).filter(Boolean).map(nm),set:st.filter(c=>!(c.position&5)).map(nm),hand:d.zone(0,2).filter(Boolean).map(nm),gy:d.zone(0,16).filter(Boolean).map(nm),bookMoves,passive,traps,stats:pilots[0].info().book};
 // Retribution is only ever Set with an Albaz Fusion to return (Akiza S-RET).
 if(out.set.includes('Branded Retribution'))assert.ok(d.zone(0,4).some(c=>c&&(c.position&5)&&(db[c.code].type&64)&&/Fallen of Albaz/.test(db[c.code].desc))||d.zone(0,16).filter(c=>c&&(db[c.code].type&64)&&/Fallen of Albaz/.test(db[c.code].desc)).length>=2,'Retribution Set only with an Albaz Fusion');
 return out;
}
const results={};
// (a) Kevy's r17 watch: many starters, and the AI Normal Summoned a body instead of comboing.
const a=ownTurn1(808,'mikanko',{top:['Mulcharmy Fuwalos','Mulcharmy Fuwalos','The Golden Swordsoul','Branded Fusion','Aluber the Jester of Despia']});
assert.deepEqual([...a.hand0].sort(),['Aluber the Jester of Despia','Branded Fusion','Mulcharmy Fuwalos','Mulcharmy Fuwalos','The Golden Swordsoul'].sort(),'stacked opening hand');
assert.ok(a.monsters.length>=2,'(a) must not end turn 1 with one body: '+a.monsters.join(', '));
assert.ok(a.monsters.includes('Mirrorjade the Iceblade Dragon'),'(a) L-01 reaches Mirrorjade: '+a.monsters.join(', '));
assert.equal(a.passive.length,0,'(a) no passivePass');
results.a={monsters:a.monsters,book:a.bookMoves};
const aOff=ownTurn1(808,'mikanko',{book:false,top:['Mulcharmy Fuwalos','Mulcharmy Fuwalos','The Golden Swordsoul','Branded Fusion','Aluber the Jester of Despia']});results.aBookOff={monsters:aOff.monsters};
// (b) The Fallen & The Virtuous (Quick-Play, no hold rule vs Mikanko) is Set or used by the end of turn 1.
const b=ownTurn1(826,'mikanko');
assert.ok(b.hand0.includes('The Fallen & The Virtuous'),'fixture hand holds The Fallen & The Virtuous');
assert.ok(!b.hand.includes('The Fallen & The Virtuous'),'(b) The Fallen & The Virtuous is Set or used by end of turn 1; hand: '+b.hand.join(', '));
results.b={set:b.set,monsters:b.monsters,hand:b.hand};
// (b, hold) vs Sky Striker, Called by the Grave stays in hand for their Ash (S-CBTG); Super Poly is Set only with material + a discard.
const h=ownTurn1(805,'sky');
assert.ok(h.hand0.includes('Called by the Grave'),'fixture hand holds Called by the Grave');
assert.ok(!h.set.includes('Called by the Grave'),'(b) Called by the Grave is held vs Sky Striker, not Set');
if(h.set.includes('Super Polymerization'))assert.ok(h.monsters.length>=1&&h.hand.length>=1,'Super Poly Set only with a face-up material of ours and a card left for its discard');
results.hold={set:h.set,hand:h.hand,monsters:h.monsters};
// (c) hand traps: Ash on Aluber (813), Ash on Branded Opening + Imperm on Aluber (837). Legal moves only; clean give-up.
for(const seed of [813,837]){const c=ownTurn1(seed,'sky');
 assert.ok(c.traps.some(t=>/Ash Blossom|Impermanence|Droll/.test(t)),'(c) seed '+seed+' exercises a hand trap: '+c.traps.join(', '));
 assert.equal(c.passive.length,0,'(c) no passivePass after the hand trap');
 results['c'+seed]={traps:c.traps,monsters:c.monsters,set:c.set,book:c.bookMoves};
}
// (e) guards the book's own lines need. 15: the Normal Summon stays free after Opening Special Summons Aluber, and the
// base policy used to Tribute Summon Dark Magician over Mirrorjade. 11: Super Polymerization used to fuse our own
// board into Dogma on turn 1 (no opposing monster); it now waits for the opponent's turn.
const e15=ownTurn1(15,'mikanko');
assert.ok(e15.monsters.includes('Mirrorjade the Iceblade Dragon'),'(e) Mirrorjade is not tributed: '+e15.monsters.join(', '));
const e11=ownTurn1(11,'luna');
assert.ok(!e11.gy.includes('Super Polymerization'),'(e) Super Polymerization is not spent on our own monsters going first');
assert.ok(e11.monsters.includes('Mirrorjade the Iceblade Dragon'),'(e) L-06/L-01 board keeps Mirrorjade: '+e11.monsters.join(', '));
results.e={s15:e15.monsters,s11:{monsters:e11.monsters,set:e11.set}};
d.stop();
console.log(JSON.stringify({test:'r18b-combo-book',pass:true,results}));

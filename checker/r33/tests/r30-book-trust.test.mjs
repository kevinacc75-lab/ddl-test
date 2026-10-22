// r30 (Claude, 22 Oct; Kevy: "it needs to feel like I am watching a competitive player pilot the deck").
// SELF-VERIFIED (builder = verifier), NOT independent. Measured on 30 seeded hands per deck (REPLY r30): the live search
// overrode good combo-book steps and declined our own useful triggers, so with search on the AI played its combo decks
// worse than the book alone. bookTrust (default on) plays a book step as written and keeps our own-turn trigger
// activations the policy wants; search still decides where the book is silent and on the opponent's turn.
//  1. bookTrust is on by default, off when the book is off, and switchable for tools.
//  2. The plan() rule: a book step skips search; an own-turn chain activation skips search; the opponent's turn does not.
//  3. Branded book: The Fallen & The Virtuous is held while the opponent has no card (it would destroy our own), and the
//     last-resort Guiding Quem summon line exists after every other line.
import assert from 'node:assert/strict';import fs from 'node:fs';
import {createOptimalPilots,OptimalPilot,trustBook} from '../dist/optimal-pilot.mjs';import {BOOKS} from '../dist/ai/book/book.mjs';import {M} from '../dist/duel.mjs';
const [p0]=createOptimalPilots({seed:1});assert.equal(p0.bookTrust,true,'on by default');
assert.equal(createOptimalPilots({seed:1,book:false})[0].bookTrust,false,'off without a book');
assert.equal(new OptimalPilot({seat:0,seed:1,bookTrust:false}).bookTrust,false,'tools can switch it off');
// 2. The rule: a book step and an own-turn chain activation skip search; the opponent's turn and a non-book move do not.
const pl=new OptimalPilot({seat:0,seed:1}),D=(type,active)=>({prompt:{type},active});
assert.equal(trustBook(pl,{prompt:{type:M.SELECT_IDLECMD},active:0,decks:[{id:'sky'},{id:'branded'}]},{response:{},book:{kind:'step'}}),false,'a deck with no combo book plays exactly as before');
assert.equal(trustBook(pl,{prompt:{type:M.SELECT_CHAIN},active:0,decks:[{id:'mikanko'},{id:'branded'}]},{response:{index:0}}),false,'r31: Mikanko book has trust off, so search decides as before');
assert.equal(trustBook(pl,{prompt:{type:M.SELECT_IDLECMD},active:0,decks:[{id:'hero'},{id:'branded'}]},{response:{},book:{kind:'step'}}),true,'r31: HERO book steps are trusted');
assert.equal(trustBook(pl,{prompt:{type:M.SELECT_CHAIN},active:0,decks:[{id:'luna'},{id:'branded'}]},{response:{index:0}}),true,'Lunalight own-turn activation: no search');
assert.equal(trustBook(pl,D(M.SELECT_IDLECMD,0),{response:{action:5,index:0},book:{kind:'step'}}),true,'book step: no search');
assert.equal(trustBook(pl,D(M.SELECT_CHAIN,0),{response:{index:0}}),true,'own-turn activation: no search');
assert.equal(trustBook(pl,D(M.SELECT_CHAIN,0),{response:{index:null}}),false,'own-turn pass: search may still find an activation');
assert.equal(trustBook(pl,D(M.SELECT_CHAIN,1),{response:{index:0}}),false,"opponent's turn (hand traps): search");
assert.equal(trustBook(pl,D(M.SELECT_IDLECMD,0),{response:{action:5,index:0}}),false,'no book step: search');
assert.equal(trustBook(new OptimalPilot({seat:0,seed:1,bookTrust:false}),D(M.SELECT_IDLECMD,0),{response:{},book:{kind:'step'}}),false,'switched off: always search');
assert.ok(fs.readFileSync('dist/optimal-pilot.mjs','utf8').includes('&&!trustBook(this,d,baseline))decision=this.search(d,baseline);'),'plan() uses the rule');
// 3. Branded book data.
const b=BOOKS.branded;assert.ok(b.blocks.some(x=>x.card==='The Fallen & The Virtuous'&&x.unless?.oppCardsMin===1),'F&V held with no opposing card');
assert.equal(b.lines.at(-1).id,'R30-QNS','last-resort Quem summon is the last line');
console.log(JSON.stringify({test:'r30-book-trust',pass:true,node:process.version,selfVerified:true}));

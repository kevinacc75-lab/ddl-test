// r33.1 (Claude, 23 Oct): fixes for ChatGPT's independent r32 review (RELAY-011, ChatGPT to Claude, N1 / N2 / item 3).
// SELF-VERIFIED (builder = verifier), NOT independent. ChatGPT's native seed-17 fixture
// (native-imperm-grave-trigger.mjs, evidence ZIP sha256 466f5091…) was re-run: r32.1 uses Imperm (index 0, "on
// Titaniklad"), r33.1 passes (index null).
//  N1 Infinite Impermanence / Effect Veiler are only used on a monster effect activated by a face-up monster on the
//     opponent's field: never on a GY trigger (Titaniklad in the End Phase) or a hand effect.
//  N2 The combo-plan caption resets (banner and lines already shown) on New matchup, back to setup and rewinds, so a
//     restart on the same turn number announces its line again.
//  3  No hand-trap hold against a deck with no profile (imported decks); draw spells (Pot of Desires ...) count as key.
import assert from 'node:assert/strict';import fs from 'node:fs';import {JSDOM} from 'jsdom';
import {handTrapUse,handTrapHold} from '../dist/ai/book/book.mjs';import {M} from '../dist/duel.mjs';
const N={1:'Ash Blossom & Joyous Spring',2:'Infinite Impermanence',9:'Effect Veiler',20:'Titaniklad the Ash Dragon',21:'Aluber the Jester of Despia',22:'Pot of Desires',23:'Some Imported Card'};
const DB={1:{type:0x21},2:{type:0x20004},9:{type:0x21},20:{type:0x41},21:{type:0x21},22:{type:2},23:{type:0x21}};
const fake=({top,loc,seq,oppMons=[],decks=['sky','branded'],active=1,turn=1,oppHand=5})=>({active,turn,phase:4,db:DB,name:c=>N[c]||'?',decks:decks.map(id=>({id})),order:[1,0],
 chain:[{code:top,controller:1,triggering_location:loc,triggering_sequence:seq}],fromEngine:x=>x,
 zone:(s,l)=>s===0?[]:(l===2?Array.from({length:oppHand},()=>({code:0,controller:1,location:2})):l===4?oppMons.map(([code,sequence,position=1])=>({code,sequence,position,controller:1,location:4})):[])});
const chain=(...codes)=>({type:M.SELECT_CHAIN,selects:codes.map(code=>({code,location:2}))});
// N1 (native seed 17 shape): Titaniklad's End Phase trigger from the GY, Aluber on their field, Imperm in our hand.
assert.equal(handTrapUse(fake({top:20,loc:16,oppMons:[[21,0]]}),0,chain(2)),null,'Imperm is not used on a GY trigger');
assert.equal(handTrapUse(fake({top:20,loc:16,oppMons:[[21,0]]}),0,chain(9)),null,'nor Veiler');
// Legal Main Phase cases: the activating monster is face-up on their field.
assert.equal(handTrapUse(fake({top:21,loc:4,seq:2,oppMons:[[21,2]]}),0,chain(9))?.index,0,'Veiler on Aluber activated on the field');
assert.equal(handTrapUse(fake({top:21,loc:4,seq:2,oppMons:[[21,2]]}),0,chain(2))?.index,0,'Imperm likewise');
assert.equal(handTrapUse(fake({top:21,loc:4,seq:2,oppMons:[[21,1]]}),0,chain(2)),null,'not when that zone holds a different copy (identity check)');
assert.equal(handTrapUse(fake({top:21,loc:4,seq:2,oppMons:[[21,2,8]]}),0,chain(2)),null,'not on a face-down monster');
assert.equal(handTrapUse(fake({top:21,loc:2,oppMons:[[21,0]]}),0,chain(2)),null,'not on an effect from the hand');
// Item 3
assert.equal(handTrapHold(fake({top:23,loc:4,decks:['sky','custom-abc']}),0,{code:1,location:2}),null,'imported deck: no hold');
assert.equal(handTrapHold(fake({top:22,loc:8}),0,{code:1,location:2}),null,'Pot of Desires: Ash not held');
assert.equal(handTrapUse(fake({top:22,loc:8}),0,chain(1))?.index,0,'Pot of Desires: Ash used');
// N2: captions reset.
const dom=new JSDOM('<!doctype html><body></body>',{url:'https://lab.test/'});Object.assign(globalThis,{document:dom.window.document,window:dom.window});
const {createLearningCaptions}=await import('../dist/learning-captions.mjs');
const cap=createLearningCaptions({root:dom.window.document.body,getDecks:()=>[{id:'branded',name:'Crimson Abyss'},{id:'luna',name:'Moonlit Hunt'}],on:()=>true,timingScale:0.01});
const msg={state:{turn:1,finished:false},coach:{last:null,intent:{seat:0,turn:1,book:{kind:'step',rule:'Opening book L-01'}}}};
cap.state(msg);assert.equal(cap.shown?.id,'L-01');const n=dom.window.document.querySelector('.lr-plan');
cap.reset();assert.ok(n.hidden&&!cap.shown,'reset hides the banner');
cap.state(msg);assert.equal(cap.shown?.id,'L-01','a restart still on turn 1 announces its line again');
const shell=fs.readFileSync('dist/app-shell.mjs','utf8');
assert.match(shell,/rewound\(\)\{lastSummary=-1;captions\.reset\(\)\}/,'rewinds reset the caption');
assert.match(shell,/presentation\.reset=\(\.\.\.a\)=>\{try\{captions\.reset\(\)\}catch\{\}return r0\(\.\.\.a\)\}/,'New matchup and back-to-setup (presentation.reset) reset the caption');
console.log(JSON.stringify({test:'r33-1-review-fixes',pass:true,node:process.version,selfVerified:true}));

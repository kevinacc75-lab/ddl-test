// r64 J3(b) Sky holds (ChatGPT sky-implementation-spec-r1, pending Seto team). Synthetic duel views; OFF by default.
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {SKY_J3B,bookActivationBlock,skyJ3bPick} from '../dist/ai/book/book.mjs';
import {M,R} from '../dist/duel.mjs';
const N={1:'Sky Striker Mecha - Eagle Booster',2:'Sky Striker Maneuver - Afterburners!',44146295:'Mirrorjade the Iceblade Dragon',7:'Sky Striker Ace - Kagari',8:'Lubellion the Searing Dragon'};
const view=({own=[],opp=[],effect=null}={})=>({name:c=>N[c]||'?',db:{},decks:[{id:'sky'},{id:'branded'}],active:0,turn:3,chain:[],events:[],currentEffect:effect?{code:effect}:null,fromEngine:p=>p,
 zone:(s,l)=>l===4?(s===0?own:opp).map(code=>({code,position:1})):[]});
test('(R64-1) on from r64 (benchmarked); only for our Sky deck',()=>{assert.equal(SKY_J3B.on,true);const v=view();v.decks=[{id:'branded'},{id:'sky'}];assert.equal(bookActivationBlock(v,0,{code:1}),null,'other decks unaffected')});
test('(R64-2) on: Eagle Booster only with our own face-up monster; Afterburners! not into a lone Mirrorjade while we have a monster; target swap',()=>{
 const was=SKY_J3B.on;SKY_J3B.on=true;try{
  assert.match(bookActivationBlock(view({opp:[44146295]}),0,{code:1})||'',/SKY-J3B: Eagle Booster/);
  assert.equal(bookActivationBlock(view({own:[7],opp:[44146295]}),0,{code:1}),null);
  assert.match(bookActivationBlock(view({own:[7],opp:[44146295]}),0,{code:2})||'',/Mirrorjade/);
  assert.equal(bookActivationBlock(view({own:[],opp:[44146295]}),0,{code:2}),null,'no monster of ours to wipe');
  assert.equal(bookActivationBlock(view({own:[7],opp:[44146295,8]}),0,{code:2}),null,'another target exists');
  const m={type:M.SELECT_CARD,min:1,max:1,selects:[{code:44146295,controller:1,location:4,position:1},{code:8,controller:1,location:4,position:1}]};
  const r=skyJ3bPick(view({own:[7],opp:[44146295,8],effect:2}),0,m,{type:R.SELECT_CARD,indicies:[0]});
  assert.deepEqual(r?.response?.indicies,[1]);
 }finally{SKY_J3B.on=was}});

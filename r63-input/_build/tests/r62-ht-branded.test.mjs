// r62 J3(a) shared hand-trap policy vs Branded (ChatGPT Shared-HT-Branded-r1; pending Seto team). Unit checks on a synthetic
// duel view: public information only (chain top, this turn's public activations, their hand size). OFF by default.
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {HT_BRANDED_R1,htBrandedHold,handTrapHold} from '../dist/ai/book/book.mjs';
const N={1:'Ash Blossom & Joyous Spring',2:'Albion the Shrouded Dragon',3:'Branded Fusion',4:'Guiding Quem, the Virtuous',5:'Aluber the Jester of Despia',6:'Effect Veiler'};
const view=({top=2,events=[],hand=4,opp='branded'}={})=>({name:c=>N[c]||'?',decks:[{id:'sky'},{id:opp}],active:1,turn:1,db:{},chain:[{code:top,controller:1}],events,zone:(s,l)=>l===2?Array(s===1?hand:5).fill({code:9}):[]});
const ASH={code:1,location:2};
test('(R62-HT-1) off by default: no change to the hand-trap rules',()=>{assert.equal(HT_BRANDED_R1.on,false);assert.equal(htBrandedHold(view(),0,ASH),null)});
test('(R62-HT-2) on: Ash is saved on Albion / Quem while Branded Fusion has not been activated this turn and they hold 2+ cards',()=>{
 HT_BRANDED_R1.on=true;try{
  assert.match(htBrandedHold(view({top:2}),0,ASH),/HT-BRANDED-r1: Ash held on Albion the Shrouded Dragon/);
  assert.match(htBrandedHold(view({top:4}),0,ASH),/Guiding Quem/);
  assert.match(handTrapHold(view({top:2}),0,ASH),/HT-BRANDED-r1/,'the existing hold hook carries it');
  // used normally once Branded Fusion was activated this turn, on a higher-value link, at 1 card in hand, or vs another deck
  assert.equal(htBrandedHold(view({top:2,events:[{type:'turn'},{type:'activate',player:1,code:3}]}),0,ASH),null);
  assert.notEqual(htBrandedHold(view({top:2,events:[{type:'activate',player:1,code:3},{type:'turn'}]}),0,ASH),null,'a previous turn does not count');
  assert.equal(htBrandedHold(view({top:3}),0,ASH),null,'Branded Fusion itself: use');
  assert.equal(htBrandedHold(view({top:5}),0,ASH),null,'Aluber: use');
  assert.equal(htBrandedHold(view({top:2,hand:1}),0,ASH),null);
  assert.equal(htBrandedHold(view({top:2,opp:'kashtira'}),0,ASH),null);
  assert.equal(htBrandedHold(view({top:2}),0,{code:6,location:2}),null,'only Ash');
 }finally{HT_BRANDED_R1.on=false}});

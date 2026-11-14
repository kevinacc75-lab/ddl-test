// r46 WindBot port (Kevy 11 Nov 2026 14:54 AEDT: "I approve all ... If we can out perform Windbot that should be our new goal").
// Unit tests for the ported WindBot rules W1-W12 (ai/book/windbot-port.mjs, hooks in ai/book/book.mjs and optimal-pilot.mjs)
// on small public-board fixtures. Each rule is switchable (ai/r46-flags.mjs); "off" must give back the r45 answer (null).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {test} from 'node:test';
import {R46,setR46} from '../dist/ai/r46-flags.mjs';
import {wbActivationBlock,wbPick,wbGhostOgre,wbAttackBlock,wbCartesiaMaterial} from '../dist/ai/book/windbot-port.mjs';
import {handTrapUse,bookActivationBlock,bookPick} from '../dist/ai/book/book.mjs';
import {M,R} from '../dist/duel.mjs';
const cards=JSON.parse(fs.readFileSync(new URL('../dist/deck-cards.json',import.meta.url))).cards;
const decks=JSON.parse(fs.readFileSync(new URL('../dist/decks.json',import.meta.url))).decks;
const branded=decks.find(d=>d.id==='branded'),sky=decks.find(d=>d.id==='sky');
const DB=new Proxy({},{get:(_,k)=>{const c=cards[String(k)];return c?{...c,type:c.type??0}:undefined}});
const ALBAZ=68468459,JADE=44146295,ALUBER=62962630,OGRE=59438930,ASH=14558127,FUSION=44362883,CART=95515789,QUEM=45883110,LUB=70534340,TITAN=41373230,RIND=51409648,LEN=3410461,SANCT=38811586,FUW=42141493,IMPERM=10045474,GRANG=24915933;
const name=c=>DB[c]?.name||String(c);
const card=(code,location,extra={})=>({code,location,controller:0,position:5,sequence:0,...extra});
function fixture({active=1,phase=4,chain=[],zones={},prompt={type:M.SELECT_CHAIN},hint=0,effect=null,mine='branded',theirs='branded'}={}){
 const dk={branded,sky};
 return {active,phase,chain,prompt,hint,currentEffect:effect?{code:effect}:null,db:DB,decks:[dk[mine],dk[theirs]],name,
  zone:(s,l)=>(zones[s+':'+l]||[]).map(c=>({controller:s,...c})),fromEngine:x=>x,description:()=>'',attempts:new Map(),key:()=>''};
}
const SHIPPED={...R46};/* the flags as imported, before any test changes them */
const reset=()=>setR46({on:true,ownChainGuard:true,ghostOgre:true,mirrorjadeTiming:true,mirrorjadeCost:true,fuwalosTiming:true,setTraps:true,cartesia:true,attackGuard:true});
test('(R46-W1) a hand trap is never chained to our own chain link (WindBot DefaultTrap); off gives r45 (fails on r45)',()=>{reset();
 const d=fixture({active:0,chain:[{code:ALBAZ,controller:0,location:4}]});
 for(const c of [card(OGRE,2),card(ASH,2)])assert.match(wbActivationBlock(d,0,c)||'',/W1/);
 assert.match(bookActivationBlock(d,0,card(OGRE,2))||'',/W1/,'wired into bookActivationBlock (base and search filters)');
 const o=fixture({active:0,chain:[{code:ALBAZ,controller:0,location:4},{code:ASH,controller:1,location:2}]});assert.equal(wbActivationBlock(o,0,card(OGRE,2)),null,'their link on top: allowed');
 setR46({ownChainGuard:false});assert.equal(wbActivationBlock(d,0,card(OGRE,2)),null);reset();
});
test('(R46-W2) Ghost Ogre answers their key / Extra Deck card activated on the field, never their Mirrorjade (fails on r45)',()=>{reset();
 const m={type:M.SELECT_CHAIN,selects:[card(OGRE,2)]};
 const d=fixture({chain:[{code:ALUBER,controller:1,location:4}]});d.prompt=m;
 assert.equal(wbGhostOgre(d,0,m,null,()=>true)?.index,0);
 const j=fixture({chain:[{code:JADE,controller:1,location:4}]});j.prompt=m;assert.equal(wbGhostOgre(j,0,m,null,()=>true),null);
 const h=handTrapUse(d,0,m,()=>false);assert.equal(h?.index,0,'book handTrapUse returns it (Aluber is a Branded key card)');assert.match(h.reason,/W2/);
 setR46({ghostOgre:false});assert.equal(handTrapUse(d,0,m,()=>false),null);reset();
});
test('(R46-W3) Mirrorjade on their turn waits for an Extra Deck monster, an activating Albaz, battle or their End Phase (fails on r45)',()=>{reset();
 const z={'1:4':[card(ALUBER,4)]},jade=card(JADE,4);
 assert.match(wbActivationBlock(fixture({zones:z,chain:[{code:ALUBER,controller:1,location:4}]}),0,jade)||'',/W3/);
 assert.equal(wbActivationBlock(fixture({zones:{'1:4':[card(LUB,4)]}}),0,jade),null,'their Lubellion (Fusion) on the field');
 assert.equal(wbActivationBlock(fixture({zones:z,phase:512}),0,jade),null,'their End Phase');
 assert.equal(wbActivationBlock(fixture({zones:z,phase:16}),0,jade),null,'Battle Phase');
 assert.equal(wbActivationBlock(fixture({zones:z,chain:[{code:ALBAZ,controller:1,location:4}]}),0,jade),null,'activating Albaz');
 assert.equal(wbActivationBlock(fixture({active:0,zones:z}),0,jade),null,'our turn unchanged');
});
test('(R46-W4) Mirrorjade cost follows the WindBot order adapted to the 41 list (fails on r45)',()=>{reset();
 const m={type:M.SELECT_CARD,selects:[card(LUB,64),card(SANCT,64),card(LEN,64),card(TITAN,64),card(RIND,64)]};
 const d=fixture({active:0,hint:504,effect:JADE,prompt:m});
 const p=wbPick(d,0,m,{type:R.SELECT_CARD,indicies:[0]},M,R);assert.equal(m.selects[p.response.indicies[0]].code,TITAN,'Titaniklad while Quem is still in the Deck');
 const o=fixture({active:1,hint:504,effect:JADE,prompt:m,zones:{'0:16':[card(ALBAZ,16)],'0:2':[card(ASH,2)]}});
 assert.equal(m.selects[wbPick(o,0,m,{type:R.SELECT_CARD,indicies:[0]},M,R).response.indicies[0]].code,RIND,'their turn, Albaz in GY: Rindbrumm');
 assert.ok(bookPick(d,0,m,{type:R.SELECT_CARD,indicies:[0]}),'wired into bookPick');
 setR46({mirrorjadeCost:false});assert.equal(wbPick(d,0,m,{type:R.SELECT_CARD,indicies:[0]},M,R),null);reset();
});
test('(R46-W9) Mulcharmy Fuwalos only on their turn before the Battle Phase (fails on r45)',()=>{reset();
 const f=card(FUW,2);assert.match(wbActivationBlock(fixture({active:0}),0,f)||'',/W9/);assert.match(wbActivationBlock(fixture({phase:8}),0,f)||'',/W9/);
 assert.equal(wbActivationBlock(fixture({phase:1}),0,f),null);assert.equal(wbActivationBlock(fixture({phase:4}),0,f),null);
});
test('(R46-W10) a SET Infinite Impermanence answers their key monster effect on the field (fails on r45)',()=>{reset();
 const m={type:M.SELECT_CHAIN,selects:[card(IMPERM,8)]};
 const d=fixture({chain:[{code:ALUBER,controller:1,location:4,sequence:2}],zones:{'1:4':[card(ALUBER,4,{sequence:2})]},mine:'sky'});d.prompt=m;
 const h=handTrapUse(d,0,m,()=>false);assert.equal(h?.index,0);
 setR46({setTraps:false});assert.equal(handTrapUse(d,0,m,()=>false),null);reset();
});
test('(R46-W11) Cartesia never fuses away our Mirrorjade; on their turn only Mirrorjade / Sanctifire / delayed Nadir (fails on r45)',()=>{reset();
 const cart=card(CART,4,{sequence:1});
 assert.match(wbActivationBlock(fixture({active:0,zones:{'0:4':[cart,card(JADE,4,{sequence:2,attack:3000})]}}),0,cart)||'',/W11/);
 assert.equal(wbActivationBlock(fixture({active:0,zones:{'0:4':[cart,card(ALBAZ,4,{sequence:2,attack:1800})]}}),0,cart),null);
 assert.match(wbActivationBlock(fixture({active:1,zones:{'0:4':[cart,card(JADE,4,{sequence:2,attack:3000}),card(ALUBER,4,{sequence:3,attack:1800})]}}),0,cart)||'',/W11/);
 assert.equal(wbActivationBlock(fixture({active:1,zones:{'0:4':[cart,card(JADE,4,{sequence:2,attack:3000}),card(QUEM,4,{sequence:3,attack:1500})]}}),0,cart),null,'Kevy delayed Nadir Granguignol');
 const m={type:M.SELECT_CARD,selects:[card(JADE,4,{attack:3000}),card(ALUBER,4,{attack:1800})]};const d=fixture({active:0,hint:511,effect:CART,prompt:m});
 assert.equal(wbCartesiaMaterial(d,0,m,{type:R.SELECT_CARD,indicies:[0]},M,R).response.indicies[0],1);
 assert.equal(bookPick(d,0,m,{type:R.SELECT_CARD,indicies:[0]})?.response.indicies[0],1,'wired into bookPick');
 setR46({cartesia:false});assert.equal(wbCartesiaMaterial(d,0,m,{type:R.SELECT_CARD,indicies:[0]},M,R),null);reset();
});
test('(R46-W12) no attack into a face-up monster it cannot destroy; direct / weaker / face-down targets still allowed (fails on r45)',()=>{reset();
 const al=card(ALUBER,4,{attack:1800});
 assert.match(wbAttackBlock(fixture({active:0,zones:{'0:4':[al],'1:4':[card(JADE,4,{position:1,attack:3000})]}}),0,al)||'',/W12/);
 assert.equal(wbAttackBlock(fixture({active:0,zones:{'0:4':[al],'1:4':[card(JADE,4,{position:1,attack:3000}),card(QUEM,4,{position:1,attack:1500})]}}),0,al),null);
 assert.equal(wbAttackBlock(fixture({active:0,zones:{'0:4':[al],'1:4':[card(JADE,4,{position:10,attack:3000,defense:2500})]}}),0,al),null,'face-down');
 {const eq=fixture({active:0,zones:{'0:4':[al],'1:4':[card(ALUBER,4,{position:1,attack:1800})]}});assert.equal(wbAttackBlock(eq,0,al),null,'r47 (RELAY-140): an equal-ATK trade into Attack Position is left to the policy');setR46({w12Battle:false});assert.match(wbAttackBlock(eq,0,al)||'',/W12/,'r46 rule (w12Battle off): equal ATK, no attack');setR46({w12Battle:true})}
 assert.equal(wbAttackBlock(fixture({active:0,zones:{'0:4':[al]}}),0,al),null,'direct attack');
 const pilot=fs.readFileSync(new URL('../dist/optimal-pilot.mjs',import.meta.url),'utf8');assert.match(pilot,/key==='attacks'\?wbAttackBlock\(d,seat,c\)/);assert.match(pilot,/key==='attacks'&&this\.book&&wbAttackBlock\(view,seat,c\)/);
 setR46({attackGuard:false});assert.equal(wbAttackBlock(fixture({active:0,zones:{'0:4':[al],'1:4':[card(JADE,4,{position:1,attack:3000})]}}),0,al),null);reset();
});
test('(R46-OFF) shipped with every ported rule on; R46.on=false turns them all off',()=>{
 for(const k of ['on','ownChainGuard','ghostOgre','mirrorjadeTiming','mirrorjadeCost','fuwalosTiming','setTraps','cartesia','attackGuard'])assert.equal(SHIPPED[k],true,k);
 reset();setR46({on:false});
 assert.equal(wbActivationBlock(fixture({active:0,chain:[{code:ALBAZ,controller:0,location:4}]}),0,card(OGRE,2)),null);
 assert.equal(wbAttackBlock(fixture({active:0,zones:{'1:4':[card(JADE,4,{position:1,attack:3000})]}}),0,card(ALUBER,4,{attack:1800})),null);reset();
});
test('(R46-SCOPE) human-flow.mjs, play-flow.mjs, human-holds.mjs and presentation.mjs are byte-identical to r45',()=>{
 for(const f of ['human-flow.mjs','play-flow.mjs','human-holds.mjs','presentation.mjs','duel.mjs','pilot.mjs','tactics.mjs'])
  assert.equal(fs.readFileSync(new URL('../dist/'+f,import.meta.url),'utf8'),fs.readFileSync('/workspace/ddl-test-r39/r45-ai-v4/'+f,'utf8'),f);
});

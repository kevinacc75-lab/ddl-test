// r32 (Claude, 22 Oct; Kevy 16:50 items 1, 2, 3 and 5). SELF-VERIFIED (builder = verifier), NOT independent.
//  1. Hand traps (all decks): on the opponent's turn, Ash Blossom / Ghost Belle / Effect Veiler / Infinite Impermanence
//     from the hand are saved for the opponent's key cards (their deck's starters and combo pieces, or an Extra Deck
//     monster) while they still hold 3+ cards in their first turns; Nibiru, Droll and Mulcharmy are never held; our own
//     turn and our own chain links are never affected; the rule can be switched off for tools.
//  2. Mikanko: a Kaiju / Lava Golem tribute takes the opponent's best monster (Extra Deck boss first).
//  3. Book conditions for going second: second, oppMonstersMin, gyAny, notField.
//  4. HERO book: Vyon sends Malicious, Malicious recursion, A Hero Lives, Miracle Ejector -> EN Shuffle into Shadow Mist.
import assert from 'node:assert/strict';
import {BOOKS,HANDTRAP,handTrapUse,handTrapHold,keyCards,bookActivationBlock,oppValue,bookPick,idleStep,newBookState} from '../dist/ai/book/book.mjs';import {M,R} from '../dist/duel.mjs';
const NAMES={1:'Ash Blossom & Joyous Spring',2:'Infinite Impermanence',3:'Nibiru, the Primal Being',4:'Branded Fusion',5:'Guiding Quem, the Virtuous',6:'Mirrorjade the Iceblade Dragon',7:'Aluber the Jester of Despia',8:'Dogmatika Fleurdelis, the Knighted',9:'Effect Veiler',10:'Foolish Burial Goods',11:'Thunder King, the Lightningstrike Kaiju',12:'Lunalight Gold Leo',13:'Fusion Deployment',14:'Mulcharmy Fuwalos'};
const DB={1:{type:0x21,desc:'Quick Effect'},2:{type:0x20004,desc:''},3:{type:0x21},4:{type:2},5:{type:0x21,desc:''},6:{type:0x41,attack:3000,desc:'Quick Effect: banish'},7:{type:0x21,attack:1200},8:{type:0x41,attack:2500,desc:'negate'},9:{type:0x21},10:{type:2},11:{type:0x21,attack:3300},12:{type:0x21,attack:1600},13:{type:2},14:{type:0x21}};
function fake({seat=0,active=1,turn=1,top=4,topSeat=1,oppHand=5,oppMons=[],own=[],ownHand=[],gy=[],first=false,decks=['luna','branded']}={}){
 const card=(code,controller,location,position=1)=>({code,controller,location,position});
 return {active,turn,phase:4,db:DB,name:c=>NAMES[c]||'?',decks:decks.map(id=>({id})),order:first?[seat,1-seat]:[1-seat,seat],chain:top?[{code:top,controller:topSeat}]:[],fromEngine:x=>x,
  zone:(s,l)=>s===seat?(l===2?ownHand.map(c=>card(c,s,2)):l===4?own.map(c=>card(c,s,4)):l===16?gy.map(c=>card(c,s,16)):[]):(l===2?Array.from({length:oppHand},()=>card(0,s,2)):l===4?oppMons.map(c=>card(c,s,4)):[])}}
const ash={code:1,location:2},imperm={code:2,location:2},nib={code:3,location:2},veiler={code:9,location:2},fuwa={code:14,location:2};
// 1. Hand traps.
assert.ok(keyCards('branded').has('Branded Fusion')&&keyCards('branded').has('Fusion Deployment'),'key cards come from the books and game plans');
assert.equal(handTrapHold(fake({top:4}),0,ash),null,'Ash on Branded Fusion (a key card): allowed');
assert.match(handTrapHold(fake({top:10}),0,ash)||'',/held/,'Ash on a non-key card while they hold 5 cards: held');
assert.match(bookActivationBlock(fake({top:10}),0,ash)||'',/held/,'the hold is part of the activation blocks (binds search too)');
assert.equal(handTrapHold(fake({top:10,oppHand:2}),0,ash),null,'down to 2 cards: use it');
assert.equal(handTrapHold(fake({top:10,turn:3}),0,ash),null,'after their first turns: use it');
assert.equal(handTrapHold(fake({top:8}),0,imperm),null,'an Extra Deck monster: use it');
assert.match(handTrapHold(fake({top:10}),0,veiler)||'',/held/,'Effect Veiler held the same way');
assert.equal(handTrapHold(fake({top:10}),0,nib),null,'Nibiru is never held');
assert.equal(handTrapHold(fake({top:10}),0,fuwa),null,'Mulcharmy is never held');
assert.equal(handTrapHold(fake({top:10,active:0}),0,ash),null,'our own turn: not affected');
assert.equal(handTrapHold(fake({top:10,topSeat:0}),0,ash),null,'our own chain link: not affected');
assert.equal(handTrapHold(fake({top:10}),0,{code:2,location:8}),null,'a Set Imperm on the field is not a hand trap');
HANDTRAP.on=false;assert.equal(handTrapHold(fake({top:10}),0,ash),null,'switchable for tools');HANDTRAP.on=true;
{const chain=(sel)=>({type:M.SELECT_CHAIN,selects:sel.map(c=>({...c}))});
 assert.equal(handTrapUse(fake({top:4}),0,chain([ash]))?.index,0,'Ash is USED on Branded Fusion (key card)');
 assert.equal(handTrapUse(fake({top:10}),0,chain([ash])),null,'not on a non-key card');
 assert.equal(handTrapUse(fake({top:4}),0,chain([imperm])),null,'Impermanence is not spent on a Spell');
 assert.equal(handTrapUse(fake({top:7}),0,chain([veiler,ash]))?.index,1,'Ash first when both can answer');
 assert.equal(handTrapUse(fake({top:7}),0,chain([imperm]))?.index,0,'Impermanence on a key monster effect (Aluber)');
 assert.equal(handTrapUse(fake({top:8}),0,chain([imperm]))?.index,0,'any Extra Deck monster effect');
 assert.equal(handTrapUse(fake({top:4,active:0}),0,chain([ash])),null,'never on our own turn');
 assert.equal(handTrapUse(fake({top:4}),0,chain([ash]),()=>true),null,'a blocked activation is not forced');
 assert.equal(handTrapUse(fake({top:4}),0,chain([{code:1,location:8}])),null,'only hand traps from the hand')}
{const {trustBook,OptimalPilot}=await import('../dist/optimal-pilot.mjs');const pl=new OptimalPilot({seat:0,seed:1});
 assert.equal(trustBook(pl,{prompt:{type:M.SELECT_CHAIN},active:1,decks:[{id:'sky'},{id:'branded'}]},{response:{index:0},book:{kind:'handtrap'}}),true,'a hand trap on a key card is played without search, for every deck');}
// 2. Mikanko Kaiju tribute: the best opposing monster.
assert.ok(oppValue(fake(),{code:6,position:1})>oppValue(fake(),{code:8,position:1})&&oppValue(fake(),{code:8,position:1})>oppValue(fake(),{code:7,position:1}),'Mirrorjade > Fleurdelis > Aluber');
{const d=fake({decks:['mikanko','branded'],active:0,oppMons:[7,8,6]});d.hint=500;d.currentEffect={code:0};
 const m={type:M.SELECT_UNSELECT_CARD,selects:[{code:7,controller:1,location:4,position:1},{code:8,controller:1,location:4,position:1},{code:6,controller:1,location:4,position:1}]};
 const r=bookPick(d,0,m,{type:R.SELECT_UNSELECT_CARD,index:1});assert.equal(r?.response.index,2,'Thunder King tributes Mirrorjade, not Fleurdelis');
 const own={type:M.SELECT_UNSELECT_CARD,selects:[{code:5,controller:0,location:4,position:1}]};assert.equal(bookPick(d,0,own,{type:R.SELECT_UNSELECT_CARD,index:0}),null,'own-only tributes (Rituals) are left to the base policy')}
{const D2={db:{20:{type:0x11,attack:3000,desc:''},21:{type:0x1021,attack:0,desc:'discard this card ... negate its effects'}}};assert.ok(oppValue(D2,{code:20,position:4})>oppValue(D2,{code:21,position:1}),'a 3000 ATK Blue-Eyes White Dragon outranks a 0 ATK hand trap on the field (reads the card database ATK field)')}
assert.ok(BOOKS.mikanko.picks.some(p=>p.source==='*'&&p.hint?.includes(500)&&p.preferBest==='opp'));
// 3. Going-second conditions.
{const lines=[{id:'X',when:{second:true,oppMonstersMin:1},steps:[{do:'activate',card:'Fusion Deployment'}]}];const save=BOOKS.luna;BOOKS.luna={...save,lines};
 const m={type:M.SELECT_IDLECMD,activates:[{code:13,controller:0,location:2}],summons:[],special_summons:[]};
 const step=(o)=>idleStep({...fake({active:0,...o}),attempts:new Map(),key:()=>'k',turn:2},0,m,newBookState(),()=>false);
 assert.equal(step({first:false,oppMons:[12]})?.line,'X','going second with an opposing monster');
 assert.equal(step({first:true,oppMons:[12]}),null,'not when going first');
 assert.equal(step({first:false,oppMons:[]}),null,'not into an empty board');
 BOOKS.luna={...save,lines:[{id:'Y',when:{gyAny:['Lunalight Gold Leo'],notField:['Guiding Quem, the Virtuous']},steps:[{do:'activate',card:'Fusion Deployment'}]}]};
 assert.equal(step({gy:[12]})?.line,'Y');assert.equal(step({gy:[]}),null,'gyAny');assert.equal(step({gy:[12],own:[5]}),null,'notField');
 BOOKS.luna=save}
// 4. HERO book.
const h=BOOKS.hero,pick=s=>h.picks.find(p=>p.source===s);
assert.equal(pick('Vision HERO Vyon').prefer[0],'Destiny HERO - Malicious','Vyon sends Malicious (was Neos)');
assert.equal(pick('EN Shuffle').prefer[0],'Elemental HERO Shadow Mist','EN Shuffle brings Shadow Mist (was Neos)');
for(const id of ['HE-AHL','HE-VYON','HE-MAL','HE-EJ'])assert.ok(h.lines.some(l=>l.id===id),id);
assert.ok(h.lines.findIndex(l=>l.id==='HE-AHL')<h.lines.findIndex(l=>l.id==='HE-STRAT'),'A Hero Lives before a Normal Summon (it needs an empty field)');
console.log(JSON.stringify({test:'r32-books-handtraps',pass:true,node:process.version,selfVerified:true}));

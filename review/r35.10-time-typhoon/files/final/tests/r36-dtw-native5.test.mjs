// r36 Time Typhoon, NATIVE fixtures for the last items of Seto's 11:24 plan (Claude, 29 Oct 2026). SELF-VERIFIED
// (builder = verifier), NOT independent. Real engine; tools/s3-harness.mjs.
//  AA Sleepy Scapegoats' Extra Deck lock still allows Red-Eyes Black Dragon Exceed (a Fusion Monster, R8): Sleepy first,
//     then Dark Time Wizard's coin destroys a monster (seed 11 here: called right, their Izuna destroyed), and Exceed is
//     offered while no non-Fusion Extra Deck summon is.
//  AB Fisherman of Legend's second window: their monster declares an attack while our face-up Alligator is on the field.
//  AC Alligator's Dragon Knight's search is once per turn by name: after the first Alligator (Special Summoned from the
//     hand) searched, a second Alligator Tribute Summoned the same turn does not offer its search again.
import assert from 'node:assert/strict';
import {engine,stopEngine,scenario,drive,labels,seatOf,M,R,hand,field,gy} from '../tools/s3-harness.mjs';
await engine();
const ALLI="Alligator's Dragon Knight",EX='Red-Eyes Black Dragon Exceed',DTW='Dark Time Wizard',F='Fisherman of Legend';
const nm=(d,l)=>l.map(c=>d.name(c.code));
const auto=d=>{const m=d.prompt;if(m.type===M.SELECT_PLACE){d.respond(d.choices()[0].response);return true}if(m.type===M.SELECT_POSITION){d.respond((d.choices().find(o=>o.label==='Face-up Attack')||d.choices()[0]).response);return true}return false};
const idle=dd=>dd.prompt.type===M.SELECT_IDLECMD&&seatOf(dd.prompt)===0;
const results={};
// AA
{const d=scenario(['dtw','dtw'],[{name:'Sleepy Scapegoats',location:2,owner:0},{name:DTW,location:2,owner:0},{name:'K9-17 Izuna',location:4,owner:1}],{first:0,seed:11});
 const r1=drive(d,{steps:{0:['Activate · Sleepy Scapegoats']},onPrompt:dd=>{if(auto(dd))return true;const m=dd.prompt;if(m.type===M.ANNOUNCE_NUMBER){dd.respond(dd.choices().at(-1).response);return true}
   if(seatOf(m)===0&&(m.type===M.SELECT_EFFECTYN||m.type===M.SELECT_YESNO)){dd.respond(dd.choices().find(o=>o.label==='No').response);return true}/* no Panther from the Deck: keep the field to Tokens */return false},
  until:dd=>idle(dd)&&field(dd,0).some(c=>/Token/.test(dd.name(c.code)))});
 assert.ok(r1.stopped,'(AA) Tokens summoned: '+JSON.stringify(r1).slice(0,300));
 const r2=drive(d,{steps:{0:['Activate · '+DTW,'Toss a coin','Choose an available effect']},onPrompt:auto,until:dd=>idle(dd)&&gy(dd,0).some(c=>dd.name(c.code)===DTW)});
 assert.ok(r2.stopped,'(AA) Dark Time Wizard resolved');
 const right=!field(d,1).length,wrong=!field(d,0).some(c=>/Token/.test(d.name(c.code)));
 assert.ok(right!==wrong,'(AA) exactly one coin branch happened (a monster was destroyed by Dark Time Wizard): '+nm(d,field(d,0))+' / '+nm(d,field(d,1)));
 assert.ok(labels(d).includes('Special Summon · '+EX),'(AA) Exceed offered under the Sleepy lock: '+labels(d));
 assert.ok(!labels(d).some(l=>/Special Summon · (K9|N\.As|M-X|Totem|Number|I:P|S:P)/.test(l)),'(AA) no non-Fusion Extra Deck summon offered');
 results.AA={call:right?'right':'wrong',offered:labels(d).filter(l=>/Special Summon/.test(l))};d.stop()}
// AB
{const d=scenario(['dtw','dtw'],[{name:ALLI,location:4,owner:0},{name:F,location:2,owner:0},{name:'K9-17 Izuna',location:4,owner:1}],{first:0,seed:11});
 let offered=false;
 const r=drive(d,{steps:{0:['End turn'],1:['Battle']},max:400,onPrompt:dd=>{if(auto(dd))return true;const m=dd.prompt;
   if(seatOf(m)===1&&m.type===M.SELECT_CARD){dd.respond({type:R.SELECT_CARD,indicies:[0]});return true}/* attack target: our Alligator */
   if(seatOf(m)===1&&m.type===M.SELECT_BATTLECMD){const c=dd.choices().find(o=>/Attack/.test(o.label));if(c){dd.respond(c.response);return true}}
   if(seatOf(m)===0&&dd.turn===2&&((m.type===M.SELECT_EFFECTYN&&m.code&&dd.name(m.code)===F)||(m.type===M.SELECT_CHAIN&&labels(dd).some(l=>l.includes(F))))){offered=true;return 'stop'}
   return false},
  until:()=>offered});
 results.AB={offered,turn:d.turn};
 assert.equal(offered,true,'(AB) Fisherman offered when their monster declares an attack: '+JSON.stringify(r).slice(0,300));d.stop()}
// AC
{let d=null,seed=null;for(let s=31;s<120&&!d;s++){const x=scenario(['dtw','dtw'],[{name:ALLI,location:2,owner:0},{name:ALLI,location:2,owner:0},{name:DTW,location:2,owner:0},{name:'Swiftwind Panther Warrior',location:4,owner:0}],{first:0,seed:s});drive(x,{onPrompt:auto,until:idle});
  if(hand(x,0).filter(c=>x.name(c.code)===ALLI).length===2)(d=x,seed=s);else x.stop()}
 assert.ok(d,'(AC) setup');let searches=0;
 const r1=drive(d,{steps:{0:['Activate · '+ALLI]}/* Level 5: Special Summoned from the hand by revealing Dark Time Wizard */,onPrompt:dd=>{if(auto(dd))return true;const m=dd.prompt;if(seatOf(m)!==0)return false;
   if(m.type===M.SELECT_EFFECTYN&&m.code&&dd.name(m.code)===ALLI){searches++;dd.respond(dd.choices().find(o=>o.label==='Yes').response);return true}
   if([M.SELECT_CARD,M.SELECT_UNSELECT_CARD].includes(m.type)){if(m.type===M.SELECT_UNSELECT_CARD&&m.can_finish&&m.unselect_cards?.length){dd.respond({type:R.SELECT_UNSELECT_CARD,index:null});return true}
    const sel=m.selects||m.select_cards||[];const j=Math.max(0,sel.findIndex(c=>dd.name(c.code)!==ALLI));/* never reveal-and-discard the second Alligator */dd.respond(m.type===M.SELECT_UNSELECT_CARD?{type:R.SELECT_UNSELECT_CARD,index:j}:{type:R.SELECT_CARD,indicies:[j]});return true}return false},
  until:dd=>idle(dd)&&searches===1&&field(dd,0).some(c=>dd.name(c.code)===ALLI)});
 assert.ok(r1.stopped,'(AC) first Alligator searched: '+JSON.stringify(r1).slice(0,300));
 const hasAlli=hand(d,0).some(c=>d.name(c.code)===ALLI);assert.ok(hasAlli,'(AC) the second Alligator is still in hand');
 let again=false;
 const r2=drive(d,{steps:{0:['Normal Summon · '+ALLI]}/* its hand effect is once per turn too, so Tribute Summon it (Tributing Panther) */,onPrompt:dd=>{if(auto(dd))return true;const m=dd.prompt;if(seatOf(m)!==0)return false;
   if(m.type===M.SELECT_TRIBUTE){const j=(m.selects||[]).findIndex(c=>dd.name(c.code)!==ALLI);dd.respond({type:R.SELECT_CARD,indicies:[j]});return true}
   if(m.type===M.SELECT_EFFECTYN&&m.code&&dd.name(m.code)===ALLI){again=true;dd.respond(dd.choices().find(o=>o.label==='No').response);return true}
   if(m.type===M.SELECT_CHAIN&&labels(dd).some(l=>l.includes(ALLI))){again=true}
   if([M.SELECT_CARD,M.SELECT_UNSELECT_CARD].includes(m.type)){const sel=m.selects||m.select_cards||[];const j=Math.max(0,sel.findIndex(c=>dd.name(c.code)!==ALLI));dd.respond(m.type===M.SELECT_UNSELECT_CARD?{type:R.SELECT_UNSELECT_CARD,index:j}:{type:R.SELECT_CARD,indicies:[j]});return true}return false},
  until:dd=>idle(dd)&&field(dd,0).filter(c=>dd.name(c.code)===ALLI).length===2});
 assert.ok(r2.stopped,'(AC) second Alligator Special Summoned: '+JSON.stringify(r2).slice(0,300));
 assert.equal(again,false,'(AC) its search is not offered a second time this turn');
 d.stop();
 // control: in a fresh duel (same seed), the same Tribute Summon with no earlier Alligator search DOES offer the search
 const c=scenario(['dtw','dtw'],[{name:ALLI,location:2,owner:0},{name:ALLI,location:2,owner:0},{name:DTW,location:2,owner:0},{name:'Swiftwind Panther Warrior',location:4,owner:0}],{first:0,seed});let ctl=false;
 const r3=drive(c,{steps:{0:['Normal Summon · '+ALLI]},onPrompt:dd=>{if(auto(dd))return true;const m=dd.prompt;if(seatOf(m)!==0)return false;
   if(m.type===M.SELECT_TRIBUTE){dd.respond({type:R.SELECT_CARD,indicies:[(m.selects||[]).findIndex(x=>dd.name(x.code)!==ALLI)]});return true}
   if((m.type===M.SELECT_EFFECTYN&&m.code&&dd.name(m.code)===ALLI)||(m.type===M.SELECT_CHAIN&&labels(dd).some(l=>l.includes(ALLI)))){ctl=true;return 'stop'}return false},
  until:dd=>ctl||(idle(dd)&&field(dd,0).some(x=>dd.name(x.code)===ALLI))});
 assert.equal(ctl,true,'(AC) control: the Tribute-Summoned Alligator offers its search when it is unused: '+JSON.stringify(r3).slice(0,200));
 results.AC={seed,searches,again,control:ctl};c.stop()}
stopEngine();
console.log(JSON.stringify({test:'r36-dtw-native5',pass:true,node:process.version,results}));

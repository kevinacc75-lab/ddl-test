// r36 Time Typhoon, NATIVE fixtures with the opponent acting (Claude, 29 Oct 2026; Seto 11:24 item 4, Alexis R3/R7/R1).
// SELF-VERIFIED (builder = verifier), NOT independent. Real engine; tools/s3-harness.mjs.
//  U  Swiftwind Panther Warrior's Tribute is a COST (R3): their Ash Blossom on Panther's effect leaves the Tribute paid
//     (the Tributed card is in our GY) and no monster is summoned.
//  Q  Fisherman of Legend (R7): when they activate a monster effect on the field while a FACE-UP card that mentions Dark
//     Time Wizard (our Alligator) is on the field, Fisherman's summon is offered; with only a SET Reversal Box it is not.
//  O  Foolish Graverobber: sends a Dark Time Wizard card from the Deck, then Special Summons a monster from THEIR GY to
//     our field.
//  N  Swiftwind Panther Warrior cannot declare an attack unless a monster was Tributed this turn.
//  P  Reversal Box (R-extra): activated on their turn, its Standby Phase roll places 1..6 counters (we are offered 1 up to
//     the roll); when their monster effect activates on the field we remove a counter and toss a coin. Wrong call
//     (seed 12): nothing happens. Right call (seed 14): a Dark Time Wizard monster (Panther) comes from the Deck and
//     their monster becomes 0 ATK with its effects negated.
//  S  Red-Eyes Black Dragon Exceed is unaffected by their activated Spell: their Raigeki destroys our other monster, not
//     Exceed (R1; the Trap side is not covered here).
import assert from 'node:assert/strict';
import {engine,stopEngine,scenario,drive,labels,seatOf,M,R,hand,field,gy} from '../tools/s3-harness.mjs';
await engine();
const ALLI="Alligator's Dragon Knight",EX='Red-Eyes Black Dragon Exceed',P='Swiftwind Panther Warrior';
const nm=(d,l)=>l.map(c=>d.name(c.code));
const auto=d=>{const m=d.prompt;if(m.type===M.SELECT_PLACE){d.respond(d.choices()[0].response);return true}if(m.type===M.SELECT_POSITION){d.respond((d.choices().find(o=>o.label==='Face-up Attack')||d.choices()[0]).response);return true}return false};
const results={};
// U
{const d=scenario(['dtw','dtw'],[{name:P,location:4,owner:0},{name:'Radiant Typhoon Swen',location:2,owner:0},{name:'Ash Blossom & Joyous Spring',location:2,owner:1}],{first:0,seed:11});
 const r=drive(d,{steps:{0:['Activate · '+P,'pick:Radiant Typhoon Swen','Special Summon 1 appropriate monster'],1:['Chain · Ash Blossom & Joyous Spring']},onPrompt:auto,
  until:dd=>dd.prompt.type===M.SELECT_IDLECMD&&seatOf(dd.prompt)===0&&gy(dd,1).some(c=>dd.name(c.code)==='Ash Blossom & Joyous Spring')});
 assert.ok(r.stopped,'(U) their Ash Blossom resolved: '+JSON.stringify(r).slice(0,300));
 assert.ok(gy(d,0).some(c=>d.name(c.code)==='Radiant Typhoon Swen'),'(U) the Tribute stays paid (Swen in our GY)');
 assert.ok(!field(d,0).some(c=>[ALLI,'Fisherman of Legend'].includes(d.name(c.code))),'(U) nothing summoned: '+nm(d,field(d,0)));
 results.U={ourField:nm(d,field(d,0)),ourGy:nm(d,gy(d,0))};d.stop()}
// Q
for(const [label,ours] of [['face-up Alligator',[{name:ALLI,location:4,owner:0}]],['set Reversal Box only',[{name:'Reversal Box',location:8,owner:0,position:10}]]]){
 const d=scenario(['dtw','dtw'],[...ours,{name:'Fisherman of Legend',location:2,owner:0},{name:'Radiant Typhoon Eldam',location:2,owner:1}],{first:1,seed:11});
 let offered=false;const r=drive(d,{steps:{1:['Normal Summon · Radiant Typhoon Eldam','Yes','pick:Radiant Typhoon Swen']}/* Normal Summon: a Set card of ours would block its own Special Summon */,onPrompt:dd=>{if(auto(dd))return true;const m=dd.prompt;if(seatOf(m)===0&&((m.type===M.SELECT_CHAIN&&labels(dd).some(l=>l.includes('Fisherman of Legend')))||(m.type===M.SELECT_EFFECTYN&&m.code&&dd.name(m.code)==='Fisherman of Legend')))offered=true;return false/* an optional trigger from the hand: offered as Yes/No (m.code) or in a chain list */},
  until:dd=>seatOf(dd.prompt)===1&&dd.prompt.type===M.SELECT_IDLECMD&&field(dd,1).some(c=>dd.name(c.code)==='Radiant Typhoon Eldam')&&!dd.chain?.length});
 assert.ok(r.stopped,'(Q) their Eldam summoned and its effect used ('+label+'): '+JSON.stringify(r).slice(0,300));
 if(label.startsWith('face-up'))assert.equal(offered,true,'(Q) Fisherman offered with a face-up Dark Time Wizard card on the field');
 else assert.equal(offered,false,'(Q) Fisherman NOT offered with only a Set Dark Time Wizard card');
 (results.Q||={})[label]=offered;d.stop()}
// O
{const d=scenario(['dtw','dtw'],[{name:'Foolish Graverobber',location:8,owner:0,position:10},{name:'K9-17 Izuna',location:16,owner:1}],{first:1,seed:11});
 const r=drive(d,{steps:{0:['Chain · Foolish Graverobber','pick:Graceful & Skull Dice','Yes','pick:K9-17 Izuna']},onPrompt:auto,max:300,
  until:dd=>field(dd,0).some(c=>dd.name(c.code)==='K9-17 Izuna')||dd.turn>1});
 assert.ok(field(d,0).some(c=>d.name(c.code)==='K9-17 Izuna'),'(O) their Izuna from their GY is now on our field: '+JSON.stringify(r).slice(0,300));
 assert.ok(gy(d,0).some(c=>d.name(c.code)==='Graceful & Skull Dice'),'(O) Graceful & Skull Dice sent from our Deck');
 results.O={ourField:nm(d,field(d,0))};d.stop()}
// N
{const d=scenario(['dtw','dtw'],[{name:P,location:2,owner:0}],{first:1,seed:11});
 const r=drive(d,{steps:{0:['Normal Summon · '+P,'Battle'],1:['End turn']},onPrompt:auto,max:400,until:dd=>seatOf(dd.prompt)===0&&dd.prompt.type===M.SELECT_BATTLECMD});
 assert.ok(r.stopped,'(N) our Battle Phase: '+JSON.stringify(r).slice(0,300));
 const atk=(d.prompt.attacks||[]).map(c=>d.name(c.code));assert.ok(!atk.includes(P),'(N) Panther cannot attack with no Tribute this turn: '+atk);
 results.N={attackers:atk};d.stop()}
// P
for(const [seed,right] of [[12,false],[14,true]]){const d=scenario(['dtw','dtw'],[{name:'Reversal Box',location:8,owner:0,position:10},{name:'Radiant Typhoon Eldam',location:2,owner:1}],{first:1,seed});
 let counters=null,coin=false,ss=false;
 const pol=dd=>{if(auto(dd))return true;const m=dd.prompt;if(seatOf(m)!==0||dd.turn!==1)return false;const L=labels(dd);
  if(m.type===M.SELECT_CHAIN){const c=dd.choices().find(o=>o.label==='Chain · Reversal Box');if(c){dd.respond(c.response);return true}}
  if(m.type===M.ANNOUNCE_NUMBER){counters=L;dd.respond(dd.choices().at(-1).response);return true}
  if(m.type===M.SELECT_OPTION&&L.every(l=>l==='Choose an available effect')){coin=true;dd.respond(dd.choices()[0].response);return true}
  if((m.type===M.SELECT_EFFECTYN||m.type===M.SELECT_YESNO)&&/Special Summon/.test(dd.description?.(m.description)||'')){ss=true;dd.respond(dd.choices().find(o=>o.label==='Yes').response);return true}
  if(m.type===M.SELECT_CARD&&dd.hint===509){const i=(m.selects||[]).findIndex(c=>dd.name(c.code)===P);if(i>=0){dd.respond({type:R.SELECT_CARD,indicies:[i]});return true}}
  return false};
 drive(d,{steps:{1:['Normal Summon · Radiant Typhoon Eldam','Yes','pick:Radiant Typhoon Swen']},max:300,onPrompt:pol,until:dd=>coin&&!dd.chain?.length&&seatOf(dd.prompt)===1&&dd.prompt.type===M.SELECT_IDLECMD});
 assert.ok(counters&&counters.length>=1&&counters.length<=6&&counters[0]==='1','(P) Standby counters offered 1..roll: '+counters);
 assert.ok(coin,'(P) Reversal Box answered their monster effect with a coin toss');
 const e=field(d,1).find(c=>d.name(c.code)==='Radiant Typhoon Eldam');
 if(right){assert.ok(ss&&field(d,0).some(c=>d.name(c.code)===P),'(P) right call: Panther from the Deck');assert.equal(e.attack,0,'(P) right call: their Eldam 0 ATK');assert.ok(e.status&1,'(P) right call: their Eldam negated')}
 else{assert.ok(!ss&&!field(d,0).length,'(P) wrong call: nothing summoned');assert.equal(e.attack,1300,'(P) wrong call: Eldam unchanged')}
 (results.P||={})[seed]={counters,right,ourField:nm(d,field(d,0)),eldamAtk:e.attack};d.stop()}
// S
{const d=scenario(['dtw','mikanko'],[{name:EX,location:4,owner:0},{name:P,location:4,owner:0,sequence:1},{name:'Raigeki',location:2,owner:1}],{first:1,seed:11});
 const r=drive(d,{steps:{1:['Activate · Raigeki']},onPrompt:auto,until:dd=>gy(dd,1).some(c=>dd.name(c.code)==='Raigeki')&&seatOf(dd.prompt)===1&&dd.prompt.type===M.SELECT_IDLECMD});
 assert.ok(r.stopped,'(S) their Raigeki resolved: '+JSON.stringify(r).slice(0,300));
 assert.ok(field(d,0).some(c=>d.name(c.code)===EX),'(S) Exceed is unaffected by their activated Spell');assert.ok(!field(d,0).some(c=>d.name(c.code)===P),'(S) our Panther was destroyed');
 results.S={ourField:nm(d,field(d,0))};d.stop()}
stopEngine();
console.log(JSON.stringify({test:'r36-dtw-native3',pass:true,node:process.version,results}));

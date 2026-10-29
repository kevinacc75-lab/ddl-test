// r36 Time Typhoon, more NATIVE fixtures (Claude, 29 Oct 2026; Seto 11:24 verification plan item 4, Alexis R1-R8).
// SELF-VERIFIED (builder = verifier), NOT independent. Real engine, Kevy's list ('dtw'); tools/s3-harness.mjs.
//  H  Dark Time Wizard coin called RIGHT (seed 16): all their monsters destroyed, burn = half their total original ATK
//     (2100 + 2000 -> 2050), ours survive, and Red-Eyes Black Dragon Exceed is offered (seed 11 = wrong call: native C).
//  I  Exceed is NOT offered without a Dark Time Wizard destroy; after one Exceed summon this turn the second copy is not
//     offered again (once per turn, R1), though a Tribute target remains.
//  J  With no monster on either field, Dark Time Wizard offers only its search (the coin needs a monster, R-extra).
//  K  Each mode once per turn: after the search, a second Dark Time Wizard offers only the coin.
//  L  Sleepy Scapegoats' Tokens can pay Swiftwind Panther Warrior's Tribute cost (R8: only Tribute Summons are barred).
//  M  Alligator's Dragon Knight can reveal a second Alligator to Special Summon itself (R4).
//  R  The add-lock is tied to the "Number C" material: with Number C104 detached from CXyz Hope Chaos Barian Dragon,
//     their Radiant Typhoon Eldam's search is offered again (compare native B, where it is not).
import assert from 'node:assert/strict';
import {engine,stopEngine,scenario,drive,labels,seatOf,M,hand,field,gy} from '../tools/s3-harness.mjs';
await engine();
const ALLI="Alligator's Dragon Knight",B='CXyz Hope Chaos Barian Dragon',EX='Red-Eyes Black Dragon Exceed',DTW='Dark Time Wizard';
const nm=(d,l)=>l.map(c=>d.name(c.code));
const auto=d=>{const m=d.prompt;if(m.type===M.SELECT_PLACE){d.respond(d.choices()[0].response);return true}if(m.type===M.SELECT_POSITION){d.respond((d.choices().find(o=>o.label==='Face-up Attack')||d.choices()[0]).response);return true}return false};
const idle=dd=>dd.prompt.type===M.SELECT_IDLECMD&&seatOf(dd.prompt)===0;
const results={};
const coinBoard=seed=>scenario(['dtw','dtw'],[{name:DTW,location:2,owner:0},{name:'Swiftwind Panther Warrior',location:4,owner:0},{name:'K9-17 Izuna',location:4,owner:1},{name:'K9-66a Jokul',location:4,owner:1,sequence:1}],{first:0,seed});
// H
{const d=coinBoard(16),lp=d.lp[1];
 const r=drive(d,{steps:{0:['Activate · '+DTW,'Toss a coin','Choose an available effect']},onPrompt:auto,until:dd=>idle(dd)&&gy(dd,0).some(c=>dd.name(c.code)===DTW)});
 assert.ok(r.stopped,'(H) resolved');assert.deepEqual(nm(d,field(d,1)),[],'(H) right call: all their monsters destroyed');
 assert.equal(lp-d.lp[1],2050,'(H) burn = half of 2100 + 2000');assert.deepEqual(nm(d,field(d,0)),['Swiftwind Panther Warrior'],'(H) ours survive');
 assert.ok(labels(d).includes('Special Summon · '+EX),'(H) Exceed offered after a right call too (their monsters were destroyed by Dark Time Wizard)');
 results.H={burn:lp-d.lp[1]};d.stop()}
// I
{const d=scenario(['dtw','dtw'],[{name:'Swiftwind Panther Warrior',location:4,owner:0},{name:'K9-17 Izuna',location:4,owner:1}],{first:0,seed:11});
 drive(d,{onPrompt:auto,until:idle});assert.ok(!labels(d).some(l=>l.includes(EX)),'(I) no Exceed without a Dark Time Wizard destroy: '+labels(d));d.stop()}
{const d=coinBoard(11);
 const r=drive(d,{steps:{0:['Activate · '+DTW,'Toss a coin','Choose an available effect','Special Summon · '+EX,'pick:K9-66a Jokul','No']},onPrompt:auto,until:dd=>idle(dd)&&field(dd,0).some(c=>dd.name(c.code)===EX)});
 assert.ok(r.stopped,'(I) first Exceed summoned: '+JSON.stringify(r).slice(0,300));
 assert.ok(field(d,1).length>=1,'(I) a face-up monster to Tribute remains');assert.ok(!labels(d).some(l=>l.includes(EX)),'(I) the second Exceed is not offered the same turn: '+labels(d));
 results.I={afterFirst:labels(d).filter(l=>/Special Summon/.test(l))};d.stop()}
// J
{const d=scenario(['dtw','dtw'],[{name:DTW,location:2,owner:0}],{first:0,seed:11});
 const r=drive(d,{steps:{0:['Activate · '+DTW]},onPrompt:auto,until:dd=>dd.prompt.type===M.SELECT_OPTION||(idle(dd)&&dd.prompt.type!==M.SELECT_IDLECMD)});
 const L=labels(d);results.J={options:L};
 if(d.prompt.type===M.SELECT_OPTION){assert.ok(L.some(l=>/Search/.test(l))&&!L.some(l=>/coin/i.test(l)),'(J) no monster on the field: only the search is offered: '+L)}
 else assert.ok(!L.some(l=>/coin/i.test(l)),'(J) no coin offered');
 d.stop()}
// K
{const d=scenario(['dtw','dtw'],[{name:DTW,location:2,owner:0},{name:DTW,location:2,owner:0},{name:'Swiftwind Panther Warrior',location:4,owner:0},{name:'K9-17 Izuna',location:4,owner:1}],{first:0,seed:11});
 const r1=drive(d,{steps:{0:['Activate · '+DTW,'Search 1 card','pick:Reversal Box']},onPrompt:auto,until:dd=>idle(dd)&&hand(dd,0).some(c=>dd.name(c.code)==='Reversal Box')});assert.ok(r1.stopped,'(K) searched');
 const r2=drive(d,{steps:{0:['Activate · '+DTW]},onPrompt:auto,until:dd=>dd.prompt.type!==M.SELECT_IDLECMD&&dd.prompt.type!==M.SELECT_CHAIN&&seatOf(dd.prompt)===0});
 const L=labels(d);results.K={secondCopy:L,type:d.prompt.type};
 assert.ok(!L.some(l=>/Search 1 card/.test(l)),'(K) the search is not offered twice in a turn: '+L);d.stop()}
// L
{const d=scenario(['dtw','dtw'],[{name:'Sleepy Scapegoats',location:2,owner:0},{name:'Swiftwind Panther Warrior',location:4,owner:0}],{first:0,seed:11});
 const r=drive(d,{steps:{0:['Activate · Sleepy Scapegoats']},onPrompt:dd=>{if(auto(dd))return true;if(dd.prompt.type===M.ANNOUNCE_NUMBER){dd.respond(dd.choices().at(-1).response);return true}return false},until:dd=>idle(dd)&&field(dd,0).some(c=>/Token/.test(dd.name(c.code)))});
 assert.ok(r.stopped,'(L) Tokens summoned');
 const r2=drive(d,{steps:{0:['Activate · Swiftwind Panther Warrior']},onPrompt:auto,until:dd=>seatOf(dd.prompt)===0&&(dd.prompt.type===M.SELECT_UNSELECT_CARD||dd.prompt.type===M.SELECT_CARD)});
 assert.ok(r2.stopped,'(L) Panther asks for its Tribute');const opts=nm(d,d.prompt.select_cards||d.prompt.selects||[]);
 assert.ok(opts.some(n=>/Token/.test(n)),'(L) a Scapegoat Token can pay the Tribute: '+opts);results.L={tributeOptions:opts};d.stop()}
// M
{const MENT=/^(Dark Time Wizard|Swiftwind Panther Warrior|Fisherman of Legend|Sleepy Scapegoats|Graceful & Skull Dice|Foolish Graverobber|Reversal Box)$/;let d=null,seedM=null;
 for(let seed=31;seed<80&&!d;seed++){const x=scenario(['dtw','dtw'],[{name:ALLI,location:2,owner:0},{name:ALLI,location:2,owner:0}],{first:0,seed});drive(x,{onPrompt:auto,until:idle});
  if(nm(x,hand(x,0)).some(n=>MENT.test(n)))x.stop();else{d=x;seedM=seed}}
 assert.ok(d,'(M) setup: a hand with two Alligators and no other Dark Time Wizard card');
 assert.ok(labels(d).includes('Activate · '+ALLI),'(M) a second Alligator is a legal reveal (its hand effect is offered): '+labels(d));
 const r=drive(d,{steps:{0:['Activate · '+ALLI,'pick:'+ALLI]},onPrompt:auto,until:dd=>field(dd,0).some(c=>dd.name(c.code)===ALLI)});assert.ok(r.stopped,'(M) Alligator Special Summoned');
 results.M={seed:seedM,hand:nm(d,hand(d,0))};d.stop()}
// R
{const d=scenario(['dtw','dtw'],[{name:'K9-17 Izuna',location:2,owner:0},{name:ALLI,location:4,owner:0},{name:'Radiant Typhoon Eldam',location:2,owner:1}],{first:0,seed:11});
 const s0=['Normal Summon · K9-17 Izuna','Normal Summon ("K9-17 Izuna")','Yes','pick:K9-ØØ Lupis','Special Summon · N.As.H. Knight','pick:'+ALLI,'pick:K9-17 Izuna','Special Summon · CXyz N.As.Ch. Knight','pick:N.As.H. Knight',
  'Activate · CXyz N.As.Ch. Knight','pick:'+ALLI,'pick:Number C104: Umbral Horror Masquerade','Special Summon · '+B,'pick:Number C104: Umbral Horror Masquerade','Activate · '+B,'pick:Number C104: Umbral Horror Masquerade','End turn'];
 let offered=false;const r=drive(d,{steps:{0:s0,1:['Special Summon · Radiant Typhoon Eldam']},max:800,onPrompt:dd=>{if(auto(dd))return true;const m=dd.prompt;if(dd.turn===2&&seatOf(m)===1&&(m.type===M.SELECT_EFFECTYN||m.type===M.SELECT_CHAIN)&&[m.code,dd.currentEffect?.code].some(x=>x&&dd.name(x)==='Radiant Typhoon Eldam')){offered=true}return false},
  until:dd=>dd.turn===2&&seatOf(dd.prompt)===1&&dd.prompt.type===M.SELECT_IDLECMD&&field(dd,1).some(c=>dd.name(c.code)==='Radiant Typhoon Eldam')});
 assert.ok(r.stopped,'(R) reached their Main Phase: '+JSON.stringify(r).slice(0,300));
 const b=field(d,0).find(c=>d.name(c.code)===B),mats=(b?.overlayCards||[]).map(x=>d.name(x));
 assert.ok(!mats.some(n=>/^Number C/.test(n)),'(R) setup: Number C104 detached by hand: '+mats);
 assert.equal(offered,true,'(R) without a Number C material the lock is off: their Eldam search is offered');
 results.R={materials:mats,eldamOffered:offered};d.stop()}
stopEngine();
console.log(JSON.stringify({test:'r36-dtw-native2',pass:true,node:process.version,results}));

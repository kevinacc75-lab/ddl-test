// r35 job 29 fix (Claude, 29 Oct 2026; Seto 00:30 + 01:25 conditions; Alexis / Akiza rulings). SELF-VERIFIED (builder =
// verifier), NOT independent. NATIVE engine fixtures for "targeting Spell/Trap removal needs a TARGETABLE opposing
// Spell/Trap" with Hu-Li the Jewel Mikanko's shield. The real engine is the referee: in every board the cards the engine
// offers at Cosmic Cyclone's target prompt are compared with the pilot's targetable() view.
//  (a) job 29 shape: their face-up Hu-Li + Mikanko Fire Dance equipped to it (an Equip Card they control); our Cosmic
//      Cyclone in hand, our set Mikanko Spiritwalk. New rule blocks Cosmic Cyclone; the OLD rule (r35.5) did not; the engine
//      offers only OUR card. The pilot does not activate it.
//  (b) (a) + their Double-Edged Sword (a non-"Mikanko" Equip Spell) equipped: Cosmic Cyclone allowed; the engine offers
//      Double-Edged Sword (not Fire Dance); the pilot's target pick is Double-Edged Sword.
//  (c) their Hu-Li with NO Equip Card on their side, their set Mikanko Spiritwalk: shield off; allowed; the engine offers it.
//  (d) (a) + our Forbidden Droplet negating Hu-Li: shield off; allowed; the engine offers Fire Dance.
import assert from 'node:assert/strict';
import {engine,stopEngine,scenario,drive,labels,seatOf,M} from '../tools/s3-harness.mjs';
import * as NEW from '../dist/optimal-pilot.mjs';
import {safeView} from '../dist/ai/knowledge.mjs';
const OLD_PATH=process.env.R35_OLD_PILOT;/* optional: path to the r35.5 optimal-pilot.mjs for the before/after control */
const OLD=OLD_PATH?await import(OLD_PATH):null;
await engine();
const CC='Cosmic Cyclone',HU='Hu-Li the Jewel Mikanko',FD='Mikanko Fire Dance';
const toOurMain=d=>drive(d,{until:dd=>dd.turn>=2&&seatOf(dd.prompt)===0&&dd.prompt.type===M.SELECT_IDLECMD});
const ccCard=d=>(d.prompt.activates||[]).find(c=>d.name(c.code)===CC);
// The engine's own target offer for Cosmic Cyclone (activated from our Main Phase), without changing the board under test:
// done on the SAME duel at the end of each case.
function engineOffer(d){const r=drive(d,{steps:{0:['Activate · '+CC,'Your Spell / Trap zone 2']},until:dd=>{const m=dd.prompt;return seatOf(m)===0&&m.type===M.SELECT_CARD&&dd.hint===503}});
 assert.ok(r.stopped,'reached Cosmic Cyclone target prompt: '+JSON.stringify(r).slice(0,300));
 return (d.prompt.selects||[]).map(c=>({name:d.name(c.code),seat:d.fromEngine(c.controller),c}))}
const results={};
function caseRun(label,placements,seat1Steps,check){
 const d=scenario(['mikanko','mikanko'],placements,{first:1});
 const r=drive(d,{steps:{1:seat1Steps},until:dd=>dd.turn>=2&&seatOf(dd.prompt)===0&&dd.prompt.type===M.SELECT_IDLECMD});
 assert.ok(r.stopped,label+': reached our Main Phase: '+JSON.stringify(r).slice(0,300));
 const out=check(d);results[label]=out;d.stop();return out}
const theirST=d=>d.zone(1,8).filter(Boolean),stName=(d,c)=>d.name(c.code);
// (a)
caseRun('a',[{name:FD,location:2,owner:1},{name:HU,location:16,owner:1},{name:CC,location:2,owner:0},{name:'Mikanko Spiritwalk',location:8,owner:0,position:10}],
 ['Activate · '+FD,'Your Spell / Trap zone 1','pick:'+HU,'Your Monster zone 1','Face-up Attack','End turn'],d=>{
 const v=safeView(d,0),cc=ccCard(d);assert.ok(cc,'(a) Cosmic Cyclone is offered by the engine at our idle');
 assert.ok(NEW.huLiShield(v,1),'(a) shield up: face-up unnegated Hu-Li and their Equip Card');
 const fd=theirST(d).find(c=>stName(d,c)===FD);assert.ok(fd?.equipCard,'(a) Fire Dance is an Equip Card');assert.equal(NEW.targetable(v,0,fd),false);
 const block=NEW.activationBlock(v,0,cc);assert.match(block||'',/no targetable opposing Spell\/Trap/,'(a) new rule blocks Cosmic Cyclone');
 const oldBlock=OLD?OLD.activationBlock(v,0,cc):'(old not loaded)';if(OLD)assert.equal(oldBlock,null,'(a) control: the r35.5 rule allowed it (job 29)');
 const pilots=NEW.createOptimalPilots({seed:466300,budget:0,nodeBudget:0,searchEnabled:false}),plan=pilots[0].plan(d);
 const chose=plan?.response?.action===5&&d.prompt.activates[plan.response.index]&&d.name(d.prompt.activates[plan.response.index].code)===CC;assert.ok(!chose,'(a) the pilot does not activate Cosmic Cyclone');
 const offer=engineOffer(d);assert.ok(offer.length>0&&offer.every(o=>o.seat===0),'(a) engine referee: only OUR cards are legal targets: '+JSON.stringify(offer.map(o=>o.name+'@'+o.seat)));
 return {block,oldBlock,pilotRule:plan?.rule||null,offer:offer.map(o=>o.name+'@'+o.seat)}});
// (b)
caseRun('b',[{name:FD,location:2,owner:1},{name:HU,location:16,owner:1},{name:'Double-Edged Sword',location:2,owner:1},{name:CC,location:2,owner:0},{name:'Mikanko Spiritwalk',location:8,owner:0,position:10}],
 ['Activate · '+FD,'Your Spell / Trap zone 1','pick:'+HU,'Your Monster zone 1','Face-up Attack','Activate · Double-Edged Sword','Your Spell / Trap zone 2','pick:'+HU,'End turn'],d=>{
 const v=safeView(d,0),cc=ccCard(d),des=theirST(d).find(c=>stName(d,c)==='Double-Edged Sword'),fd=theirST(d).find(c=>stName(d,c)===FD);
 assert.ok(des&&fd,'(b) both their Equip Spells are on the field: '+theirST(d).map(c=>stName(d,c)));
 assert.equal(NEW.targetable(v,0,des),true,'(b) Double-Edged Sword is not a Mikanko card: targetable');assert.equal(NEW.targetable(v,0,fd),false);
 assert.equal(NEW.activationBlock(v,0,cc),null,'(b) Cosmic Cyclone allowed');
 const offer=engineOffer(d),names=offer.filter(o=>o.seat===1).map(o=>o.name);
 assert.deepEqual(names,['Double-Edged Sword'],'(b) engine referee: of theirs, only Double-Edged Sword is offered');
 const pilots=NEW.createOptimalPilots({seed:1,budget:0,nodeBudget:0,searchEnabled:false}),plan=pilots[0].plan(d),pick=(plan.response.indicies||[])[0];
 assert.equal(d.name(d.prompt.selects[pick].code),'Double-Edged Sword','(b) the pilot targets Double-Edged Sword, not our own card');
 return {offer:offer.map(o=>o.name+'@'+o.seat),pick:d.name(d.prompt.selects[pick].code)}});
// (c)
caseRun('c',[{name:HU,location:4,owner:1},{name:'Mikanko Spiritwalk',location:8,owner:1,position:10},{name:CC,location:2,owner:0},{name:'Mikanko Spiritwalk',location:8,owner:0,position:10}],
 ['End turn'],d=>{
 const v=safeView(d,0),cc=ccCard(d),promise=theirST(d)[0];assert.ok(promise&&!(promise.position&5),'(c) their set card');
 assert.equal(NEW.huLiShield(v,1),false,'(c) no Equip Card on their side: shield off');assert.equal(NEW.targetable(v,0,promise),true);
 assert.equal(NEW.activationBlock(v,0,cc),null,'(c) Cosmic Cyclone allowed');
 const offer=engineOffer(d);assert.ok(offer.some(o=>o.seat===1),'(c) engine referee: their set card is offered');
 return {offer:offer.map(o=>(o.seat===1&&!(o.c.position&5)?'set card':o.name)+'@'+o.seat)}});
// (d)
caseRun('d',[{name:FD,location:2,owner:1},{name:HU,location:16,owner:1},{name:CC,location:2,owner:0},{name:'Forbidden Droplet',location:2,owner:0},{name:'Raigeki',location:2,owner:0},{name:'Mikanko Spiritwalk',location:8,owner:0,position:10}],
 ['Activate · '+FD,'Your Spell / Trap zone 1','pick:'+HU,'Your Monster zone 1','Face-up Attack','End turn'],d=>{
 const before=NEW.activationBlock(safeView(d,0),0,ccCard(d));assert.match(before||'',/no targetable/,'(d) before the negation: blocked');
 const r=drive(d,{steps:{0:['Activate · Forbidden Droplet','Your Spell / Trap zone 2','pick:Raigeki','pick:'+HU]},until:dd=>{const hu=dd.zone(1,4).find(c=>c&&dd.name(c.code)===HU);return !!(hu&&(hu.status&1))&&seatOf(dd.prompt)===0&&dd.prompt.type===M.SELECT_IDLECMD}});
 assert.ok(r.stopped,'(d) Hu-Li negated by Forbidden Droplet and back at our idle: '+JSON.stringify(r).slice(0,400));
 const v=safeView(d,0);assert.equal(NEW.huLiShield(v,1),false,'(d) negated Hu-Li: shield off');assert.equal(NEW.activationBlock(v,0,ccCard(d)),null,'(d) Cosmic Cyclone allowed');
 const offer=engineOffer(d);assert.ok(offer.some(o=>o.seat===1&&o.name===FD),'(d) engine referee: Fire Dance is offered once Hu-Li is negated: '+JSON.stringify(offer.map(o=>o.name+'@'+o.seat)));
 return {before,offer:offer.map(o=>o.name+'@'+o.seat)}});
stopEngine();
console.log(JSON.stringify({test:'r35-cyclone-hu-li-native',pass:true,node:process.version,oldControl:!!OLD,results}));

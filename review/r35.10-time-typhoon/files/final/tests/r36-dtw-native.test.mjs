// r36 Time Typhoon (Claude, 29 Oct 2026; Kevy: new deck "K9 Radiant Typhoon Dark Time Wizard"). SELF-VERIFIED (builder =
// verifier), NOT independent. NATIVE engine fixtures for the new Beyond the Brave cards and the deck's key lines, on
// Kevy's list ('dtw'). Each case drives the real engine by its own choice labels (tools/s3-harness.mjs).
//  A  Eldam line: Eldam (no opposing Spell/Trap) -> Swen -> M-X-Saber Invoker -> Swiftwind Panther Warrior from the Deck
//     -> Panther Tributes Invoker -> Alligator's Dragon Knight from the Deck -> adds 2 different Dark Time Wizard
//     Spells/Traps, discards 1. 0 Normal Summons used.
//  B  Rank 5 to the search lock: Izuna (Normal Summon without Tributing, sends Lupis) + Alligator (Level 5) ->
//     N.As.H. Knight -> CXyz N.As.Ch. Knight -> Number C104 -> CXyz Hope Chaos Barian Dragon (4 materials, 4000 ATK);
//     on their turn their Radiant Typhoon Eldam's "add from the Deck" cannot be activated and their hand does not grow.
//  C  Dark Time Wizard coin (seed 11: called wrong, our Panther destroyed) -> Red-Eyes Black Dragon Exceed is offered,
//     Tributes THEIR monster (either field), and its summon revives our Panther.
//  D  Dark Time Wizard search: the card is found, and Dark Time Wizard returns from the GY to the hand in the End Phase.
//  E  Sleepy Scapegoats: Tokens, and for the rest of the turn no non-Fusion Extra Deck summon is offered (Rank 5 was).
//  F  The AI (base policy + this deck's book) plays a fixed opening (Eldam, Swen, Izuna, Graceful & Skull Dice, Ash
//     Blossom) going first: Alligator is summoned from the Deck and adds Dark Time Wizard + Foolish Graverobber, the
//     discard is Graceful & Skull Dice, and the turn ends on Hope Chaos Barian Dragon, not linked into I:P Masquerena.
//  G  Seto/Alexis R6: when CXyz Hope Chaos Barian Dragon detaches for its own effect, the AI never takes its "Number C"
//     material (Number C104), so the add-lock stays on.
import assert from 'node:assert/strict';
import {engine,stopEngine,scenario,drive,labels,seatOf,M,hand,field,gy} from '../tools/s3-harness.mjs';
import {createOptimalPilots} from '../dist/optimal-pilot.mjs';
await engine();
const ALLI="Alligator's Dragon Knight";
const nm=(d,l)=>l.map(c=>d.name(c.code));
const auto=d=>{const m=d.prompt;if(m.type===M.SELECT_PLACE){d.respond(d.choices()[0].response);return true}if(m.type===M.SELECT_POSITION){d.respond((d.choices().find(o=>o.label==='Face-up Attack')||d.choices()[0]).response);return true}return false};
const results={};
// A
{const d=scenario(['dtw','dtw'],[{name:'Radiant Typhoon Eldam',location:2,owner:0}],{first:0,seed:11});
 const s0=['Special Summon · Radiant Typhoon Eldam','Yes','pick:Radiant Typhoon Swen','Special Summon · Radiant Typhoon Swen','Yes','pick:Mystical Space Typhoon',
  'Special Summon · M-X-Saber Invoker','pick:Radiant Typhoon Eldam','pick:Radiant Typhoon Swen','Activate · M-X-Saber Invoker','pick:Radiant Typhoon Eldam','pick:Swiftwind Panther Warrior',
  'Activate · Swiftwind Panther Warrior','pick:M-X-Saber Invoker','Special Summon 1 appropriate monster','pick:'+ALLI,'Yes','pick:Dark Time Wizard','pick:Foolish Graverobber','pick:Mystical Space Typhoon'];
 const r=drive(d,{steps:{0:s0},onPrompt:auto,until:dd=>dd.turn===1&&dd.prompt.type===M.SELECT_IDLECMD&&field(dd,0).some(c=>dd.name(c.code)===ALLI)&&gy(dd,0).length>=4});
 assert.ok(r.stopped,'(A) reached our Main Phase with Alligator: '+JSON.stringify(r).slice(0,400));
 const h=nm(d,hand(d,0)),g=nm(d,gy(d,0)),f=nm(d,field(d,0));
 assert.ok(f.includes(ALLI)&&f.includes('Swiftwind Panther Warrior'),'(A) Alligator and Panther on the field: '+f);
 assert.ok(h.includes('Foolish Graverobber')&&h.includes('Dark Time Wizard'),'(A) Alligator added Dark Time Wizard + Foolish Graverobber: '+h);
 assert.ok(g.includes('M-X-Saber Invoker')&&g.includes('Mystical Space Typhoon'),'(A) Invoker Tributed, MST discarded: '+g);
 assert.equal(d.log.filter(e=>/Normal Summon/.test(e.text||'')).length,0,'(A) no Normal Summon used');
 results.A={field:f,hand:h,gy:g};d.stop()}
// B
{const d=scenario(['dtw','dtw'],[{name:'K9-17 Izuna',location:2,owner:0},{name:ALLI,location:4,owner:0},{name:'Radiant Typhoon Eldam',location:2,owner:1}],{first:0,seed:11});
 const s0=['Normal Summon · K9-17 Izuna','Normal Summon ("K9-17 Izuna")','Yes','pick:K9-ØØ Lupis','Special Summon · N.As.H. Knight','pick:'+ALLI,'pick:K9-17 Izuna','Special Summon · CXyz N.As.Ch. Knight','pick:N.As.H. Knight',
  'Activate · CXyz N.As.Ch. Knight','pick:'+ALLI,'pick:Number C104: Umbral Horror Masquerade','Special Summon · CXyz Hope Chaos Barian Dragon','pick:Number C104: Umbral Horror Masquerade','End turn'];
 let oppHand=null,eldamOffered=false;
 const r=drive(d,{steps:{0:s0,1:['Special Summon · Radiant Typhoon Eldam']},max:800,onPrompt:dd=>{if(auto(dd))return true;const m=dd.prompt;
   if(dd.turn===2&&seatOf(m)===1){if(oppHand===null&&m.type===M.SELECT_IDLECMD)oppHand=hand(dd,1).length;if((m.type===M.SELECT_EFFECTYN||m.type===M.SELECT_CHAIN)&&[m.code,dd.currentEffect?.code].some(x=>x&&dd.name(x)==='Radiant Typhoon Eldam'))eldamOffered=true/* the trigger prompt names its card in m.code */}return false},
  until:dd=>dd.turn===2&&seatOf(dd.prompt)===1&&dd.prompt.type===M.SELECT_IDLECMD&&field(dd,1).some(c=>dd.name(c.code)==='Radiant Typhoon Eldam')});
 assert.ok(r.stopped,'(B) reached their Main Phase with their Eldam summoned: '+JSON.stringify(r).slice(0,400));
 const b=field(d,0).find(c=>d.name(c.code)==='CXyz Hope Chaos Barian Dragon');assert.ok(b,'(B) Hope Chaos Barian Dragon on our field');
 assert.equal(b.attack,4000,'(B) 1000 ATK per material, 4 materials');
 assert.equal(eldamOffered,false,'(B) the lock: their Eldam search is not offered');
 assert.equal(hand(d,1).length,oppHand-1,'(B) their hand only lost the Eldam (nothing added)');
 assert.ok(gy(d,0).some(c=>d.name(c.code)==='K9-ØØ Lupis'),'(B) Izuna sent Lupis');
 results.B={barianAtk:b.attack,eldamOffered,oppHandBefore:oppHand,oppHandAfter:hand(d,1).length};d.stop()}
// C
{const d=scenario(['dtw','dtw'],[{name:'Dark Time Wizard',location:2,owner:0},{name:'Swiftwind Panther Warrior',location:4,owner:0},{name:'K9-17 Izuna',location:4,owner:1},{name:'K9-66a Jokul',location:4,owner:1}],{first:0,seed:11});
 const r1=drive(d,{steps:{0:['Activate · Dark Time Wizard','Toss a coin','Choose an available effect']},onPrompt:auto,until:dd=>dd.prompt.type===M.SELECT_IDLECMD&&gy(dd,0).some(c=>dd.name(c.code)==='Dark Time Wizard')});
 assert.ok(r1.stopped,'(C) Dark Time Wizard resolved: '+JSON.stringify(r1).slice(0,300));
 const ourDestroyed=gy(d,0).some(c=>d.name(c.code)==='Swiftwind Panther Warrior'),theirsLeft=field(d,1).length;
 assert.ok(ourDestroyed||theirsLeft===0,'(C) one side was destroyed by Dark Time Wizard');
 assert.ok(labels(d).includes('Special Summon · Red-Eyes Black Dragon Exceed'),'(C) Exceed is offered after a monster was destroyed by Dark Time Wizard: '+labels(d));
 const tribute=theirsLeft?'K9-66a Jokul':'Swiftwind Panther Warrior';
 const r2=drive(d,{steps:{0:['Special Summon · Red-Eyes Black Dragon Exceed','pick:'+tribute,'Yes','pick:Swiftwind Panther Warrior']},onPrompt:auto,until:dd=>dd.prompt.type===M.SELECT_IDLECMD&&field(dd,0).some(c=>dd.name(c.code)==='Red-Eyes Black Dragon Exceed')&&field(dd,0).length>=2});
 assert.ok(r2.stopped,'(C) Exceed summoned and its revival resolved: '+JSON.stringify(r2).slice(0,300));
 if(theirsLeft)assert.ok(!field(d,1).some(c=>d.name(c.code)==='K9-66a Jokul'),'(C) Exceed Tributed their Jokul (a monster on either field)');
 results.C={calledRight:!ourDestroyed,ourField:nm(d,field(d,0)),theirField:nm(d,field(d,1))};d.stop()}
// D
{const d=scenario(['dtw','dtw'],[{name:'Dark Time Wizard',location:2,owner:0}],{first:0,seed:11});
 const r=drive(d,{steps:{0:['Activate · Dark Time Wizard','Search 1 card','pick:Reversal Box','End turn','pick:Dark Time Wizard','pick:Fisherman of Legend']},max:400,onPrompt:auto,until:dd=>dd.turn===2&&seatOf(dd.prompt)===1&&dd.prompt.type===M.SELECT_IDLECMD});
 assert.ok(r.stopped,'(D) reached their turn: '+JSON.stringify(r).slice(0,300));
 const h=nm(d,hand(d,0));assert.ok(h.includes('Reversal Box'),'(D) Reversal Box was added: '+h);
 assert.ok(h.includes('Dark Time Wizard')&&!gy(d,0).some(c=>d.name(c.code)==='Dark Time Wizard'),'(D) Dark Time Wizard came back to the hand in the End Phase: '+h);
 results.D={hand:h};d.stop()}
// E
{const d=scenario(['dtw','dtw'],[{name:'Sleepy Scapegoats',location:2,owner:0},{name:ALLI,location:4,owner:0},{name:'K9-17 Izuna',location:4,owner:0,sequence:1}],{first:0,seed:11});
 const r0=drive(d,{onPrompt:auto,until:dd=>dd.prompt.type===M.SELECT_IDLECMD&&dd.turn===1});assert.ok(r0.stopped);
 const before=labels(d).filter(l=>/^Special Summon · (N\.As\.H\. Knight|K9-17 "Ripper")/.test(l));assert.ok(before.length>0,'(E) Rank 5 offered before Sleepy Scapegoats: '+labels(d));
 const r=drive(d,{steps:{0:['Activate · Sleepy Scapegoats']},onPrompt:dd=>{if(auto(dd))return true;if(dd.prompt.type===M.SELECT_EFFECTYN||dd.prompt.type===M.SELECT_YESNO){const y=dd.choices().find(o=>o.label==='Yes');if(y){dd.respond(y.response);return true}}if(dd.prompt.type===M.ANNOUNCE_NUMBER){dd.respond(dd.choices().at(-1).response);return true}return false},
  until:dd=>dd.prompt.type===M.SELECT_IDLECMD&&field(dd,0).some(c=>/Token/.test(dd.name(c.code)))});
 assert.ok(r.stopped,'(E) Sleepy Scapegoats resolved: '+JSON.stringify(r).slice(0,300));
 const tokens=field(d,0).filter(c=>/Token/.test(d.name(c.code))).length;assert.ok(tokens>=1,'(E) Scapegoat Tokens summoned');
 const extra=labels(d).filter(l=>/^Special Summon · /.test(l)&&!/Red-Eyes Black Dragon Exceed/.test(l));
 assert.deepEqual(extra.filter(l=>/N\.As\.H\.|Ripper|Jacks|Invoker|Totem|Gossip|Masquerena|Little Knight/.test(l)),[],'(E) no non-Fusion Extra Deck summon after Sleepy Scapegoats: '+extra);
 results.E={tokens,offeredAfter:extra};d.stop()}
// F
{const d=scenario(['dtw','branded'],[{name:'Radiant Typhoon Eldam',location:2,owner:0},{name:'Radiant Typhoon Swen',location:2,owner:0},{name:'K9-17 Izuna',location:2,owner:0},{name:'Graceful & Skull Dice',location:2,owner:0},{name:'Ash Blossom & Joyous Spring',location:2,owner:0}],{first:0,seed:21});
 const pilots=createOptimalPilots({seed:21,searchEnabled:false});const moves=[];
 for(let i=0;i<600&&d.prompt&&d.turn===1;i++){const p=pilots[d.prompt.seat].plan(d);if(p.book?.rule)moves.push(p.book.rule);d.respond(p.response);for(const x of pilots)x.observe?.(p)}
 const L=d.log.map(e=>e.text||'');const f=nm(d,field(d,0)),g=nm(d,gy(d,0));
 assert.ok(L.some(t=>/Alligator's Dragon Knight.*(Deck|Special Summon)/.test(t)),'(F) Alligator was summoned');
 assert.ok(g.includes('Graceful & Skull Dice'),'(F) Graceful & Skull Dice discarded to Alligator (GY pop live): '+g);
 assert.ok(f.some(n=>/CXyz Hope Chaos Barian Dragon/.test(n)),'(F) the turn ends on Hope Chaos Barian Dragon (the book line, not linked away): '+f);
 assert.ok(!f.includes('I:P Masquerena'),'(F) no Link ate the boss: '+f);
 results.F={field:f,gy:g,bookRules:[...new Set(moves)].slice(0,12)};d.stop()}
// G
{const B='CXyz Hope Chaos Barian Dragon';const d=scenario(['dtw','dtw'],[{name:'K9-17 Izuna',location:2,owner:0},{name:ALLI,location:4,owner:0}],{first:0,seed:11});
 const s0=['Normal Summon · K9-17 Izuna','Normal Summon ("K9-17 Izuna")','Yes','pick:K9-ØØ Lupis','Special Summon · N.As.H. Knight','pick:'+ALLI,'pick:K9-17 Izuna','Special Summon · CXyz N.As.Ch. Knight','pick:N.As.H. Knight',
  'Activate · CXyz N.As.Ch. Knight','pick:'+ALLI,'pick:Number C104: Umbral Horror Masquerade','Special Summon · '+B,'pick:Number C104: Umbral Horror Masquerade','Activate · '+B];
 const r=drive(d,{steps:{0:s0},onPrompt:auto,until:dd=>seatOf(dd.prompt)===0&&dd.prompt.type===M.SELECT_CARD&&dd.hint===519&&dd.currentEffect&&dd.name(dd.currentEffect.code)===B});
 assert.ok(r.stopped,'(G) reached Barian\'s detach prompt: '+JSON.stringify(r).slice(0,300));
 const pilots=createOptimalPilots({seed:11,searchEnabled:false}),p=pilots[0].plan(d),cards=d.prompt.selects||d.prompt.select_cards,picked=(p.response.indicies||[]).map(i=>d.name(cards[i].code));
 assert.ok(cards.some(c=>/^Number C/.test(d.name(c.code))),'(G) the Number C is among the detachable materials: '+cards.map(c=>d.name(c.code))+' / materials '+(field(d,0).find(c=>d.name(c.code)===B)?.overlayCards||[]).map(x=>d.name(x)));
 assert.ok(picked.length&&!picked.some(n=>/^Number C/.test(n)),'(G) the AI does not detach the Number C: '+picked);
 d.respond(p.response);drive(d,{onPrompt:auto,until:dd=>dd.prompt.type===M.SELECT_IDLECMD});
 const b=field(d,0).find(c=>d.name(c.code)===B);assert.ok(b&&(b.overlayCards||[]).some(code=>/^Number C/.test(d.name(code))),'(G) Barian still has its Number C after its effect');
 results.G={detached:picked,materialsAfter:(b.overlayCards||[]).map(code=>d.name(code)),atk:b.attack};d.stop()}
stopEngine();
console.log(JSON.stringify({test:'r36-dtw-native',pass:true,node:process.version,results}));

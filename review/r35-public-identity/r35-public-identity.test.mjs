// r35 (Claude, 24 Oct): public-identity fix (R34-01) on the REAL event stream, to Alexis's ruling
// ("r35-public-identity-rulings-alexis-2026-10-23") and Seto's limits L1-L4 (23 Oct 21:40 / 21:45, 24 Oct 00:10).
// Rule (dist/public-identity.mjs): name the moving card if its SOURCE was public at the moment of the move, OR its
// DESTINATION is public; otherwise code 0. (c) "active reveal" is DEFERRED (L2): a revealed hand card stays hidden.
// The spec below is written separately from Alexis's table (not imported from the helper), then checked against every
// engine MOVE in the duels played here: event code, log text (L1) and the Fusion panel / summon summary (P6).
//  P1  Super Polymerization reproducer (exact board dealt, real engine): face-up field -> Extra Deck material named
//  P2  GY -> Deck Fusion material named (Branded v Mikanko seed 121, Mikanko first: Fallen of Albaz)
//  P3  seed 121 Lubellion -> Mirrorjade: both materials named in the event stream and the Fusion panel
//  P4  face-up Pendulum Zone -> face-up Extra Deck named; the opponent's snapshot shows it
//  P5  face-up banished -> Deck named
//  P6  seed 121 Mirrorjade summon summary names both public materials (same helper)
//  C1  hand -> Deck stays code 0          C2  Set card -> hand stays code 0
//  C3  private at both ends stays code 0: face-down Extra Deck -> face-down banished, Deck -> face-down banished.
//      (Face-down banished -> Deck never occurs with the 8 preset decks; the rule test below covers it.)
//  C4  face-down Extra Deck: opponent snapshot hidden, owner sees the code
//  R1  Set card destroyed -> GY named     R2  Xyz Material detached -> GY named, parsed with no error
//  R3  a Token leaving the field: no move event, no material entry, no error
//  R5  (L3) face-up field -> hand named; face-down field -> hand code 0
//  R4  (responsesHash) is tools/r35-identity-hash.mjs, run before/after; not repeated here (too slow for a test).
import assert from 'node:assert/strict';import fs from 'node:fs';import zlib from 'node:zlib';
import {Duel,M} from '../dist/duel.mjs';import {createOptimalPilots} from '../dist/optimal-pilot.mjs';import {safeView} from '../dist/ai/knowledge.mjs';
import {FusionMaterials} from '../dist/fusion-materials.mjs';import {SummonCutscenes,summonLine} from '../dist/summon-cutscenes.mjs';
import {publicMove} from '../dist/public-identity.mjs';
import {loadBuild,scenario,LOC,POS,deck,code,toIdle} from './lib/engine-scenario.mjs';
const db=JSON.parse(zlib.gunzipSync(fs.readFileSync('dist/cards.json.gz'))),scripts=JSON.parse(zlib.gunzipSync(fs.readFileSync('dist/scripts.json.gz')));
const all=JSON.parse(fs.readFileSync('dist/decks.json')).decks.map(d=>d.banlistVariants?.['tcg-2026-10-19']?{...d,...d.banlistVariants['tcg-2026-10-19']}:d);
const pick=id=>all.find(d=>d.id===id);
// Alexis's table, written out independently: is this place/position public to the opponent?
const isPublic=z=>{const l=z?.location||0,up=!!(z?.position&5);return l===16||([4,8,32,64].includes(l)&&up)};
const destPublic=z=>{const l=z?.location||0;if(l===1||l===2)return false;if([4,8,32,64].includes(l))return !!(z.position&5);return true};
const spec=(from,to)=>isPublic(from)||destPublic(to);
const L=l=>({1:'Deck',2:'Hand',4:'M',8:'S',16:'GY',32:'Ban',64:'Ex'})[l]??String(l);
const key=m=>L(m.from.location)+([4,8,32,64].includes(m.from.location)?((m.from.position&5)?'-up':'-down'):'')+'>'+L(m.to.location)+([4,8,32,64].includes(m.to.location)?((m.to.position&5)?'-up':'-down'):'');
const seen={};let moves=0,logChecks=0;
// Hook one Duel: pair every engine MOVE with the event and log line the wrapper made from it.
function watch(d){const evs=[],oe=d.event.bind(d);d.event=(t,x)=>{oe(t,x);evs.push(d.events.at(-1))};
 const hm=d.handleMessage.bind(d);d.handleMessage=m=>{if(m.type!==M.MOVE)return hm(m);const e0=evs.length,l0=d.log.length;const r=hm(m);
  const ev=evs.slice(e0).find(e=>e.type==='move'),logged=d.log.slice(l0).find(e=>e.kind==='move'),k=key(m);
  if(!m.to.location){(seen.TOKEN??=[]).push(k);assert.equal(ev,undefined,'R3: leaving play (Token) makes no move event');return r}
  if(m.from.overlay_sequence!==undefined)(seen.OVERLAY??=[]).push([k,ev?.code===m.card]);
  if(ev){moves++;const want=spec(m.from,m.to)?m.card:0;assert.equal(ev.code,want,k+' '+db[m.card]?.name+': event code follows the rule');(seen[k]??=[]).push(ev.code);
   if(logged){const text=logged.text??logged.message??String(logged.line??'');if(text){logChecks++;assert.equal(/^A card /.test(text),!want,'L1: log concealed flag = event code ('+k+')')}}}
  return r};return evs}
function play(a,b,seed,first){const live=play.live;const d=new Duel(live.core,db,scripts),pilots=createOptimalPilots({seed,searchEnabled:false});const evs=watch(d);
 d.start([pick(a),pick(b)],{seed,first});let k=0;while(d.prompt&&!d.finished&&k++<1500){const p=pilots[d.prompt.seat],plan=p.base(safeView(d,d.prompt.seat));if(!plan?.response)break;d.respond(plan.response);p.observe(plan)}
 return {d,evs}}
play.live=await Duel.create(db,scripts);
// --- P2 / P3 / P6: Branded v Mikanko seed 121, Mikanko (seat B) first
{const {d,evs}=play('branded','mikanko',121,1);const fm=new FusionMaterials(),sc=new SummonCutscenes();fm.observe(evs,db);sc.observe(evs,db);
 const mirror=code('Mirrorjade the Iceblade Dragon'),lub=code('Lubellion the Searing Dragon'),albaz=code('Fallen of Albaz');
 const g=[...fm.confirmed].find(([id])=>evs.find(e=>e.id===id)?.code===mirror)?.[1];assert.ok(g,'P3: Mirrorjade Fusion seen');
 assert.deepEqual(g.items.map(i=>[i.code,i.origin,i.destination]),[[lub,'Field','Extra Deck'],[albaz,'GY','Deck']],'P3: both public materials named (Field -> Extra Deck, GY -> Deck)');
 const info=[...sc.confirmed].find(([id])=>evs.find(e=>e.id===id)?.code===mirror)?.[1];const line=summonLine({code:mirror,b2Summon:info},db);
 assert.match(line,/Public materials: Lubellion the Searing Dragon; Fallen of Albaz$/,'P6: summon summary names both');assert.doesNotMatch(line,/Face-down material/);d.stop?.()}
// --- natural duels for the other cases (base AI, 19 Oct lists, seed 500)
const snap={};
for(const [a,b] of [['blueeyes','luna'],['branded','hero'],['branded','kashtira'],['sky','toon'],['sky','branded'],['branded','luna'],['mikanko','sky']]){const {d}=play(a,b,500,0);
 if(a==='blueeyes'){// P4: Lunalight Tiger left the Pendulum Zone face-up to the Extra Deck; the opponent sees it there
  const tiger=code('Lunalight Tiger'),seat=1,opp=d.snapshot(0).players[seat].zones[64].filter(Boolean);snap.p4=opp.some(c=>c.code===tiger&&!c.hidden)}
 if(a==='branded'&&b==='kashtira'){// C4: face-down Extra Deck cards: hidden to the opponent, known to the owner
  const own=d.snapshot(0).players[0].zones[64].filter(Boolean),opp=d.snapshot(1).players[0].zones[64].filter(Boolean);
  snap.c4=own.some(c=>!((c.position||0)&5))&&own.filter(c=>!((c.position||0)&5)).every(c=>c.code&&!c.hidden)&&opp.filter(c=>!((c.position||0)&5)).every(c=>c.hidden)}
 d.stop?.()}
// --- P1: Super Polymerization reproducer (board dealt exactly; every step is the real engine and wrapper)
{const b=await loadBuild(true),C=n=>code(n);
 const d=scenario(b,{decks:[deck('branded'),deck('mikanko')],first:0,seed:7,place:[{code:C('Super Polymerization'),p:0,location:LOC.HAND},{code:C('Branded Fusion'),p:0,location:LOC.HAND},{code:C('Branded Opening'),p:0,location:LOC.HAND},
  {code:C('Fallen of Albaz'),p:0,location:LOC.MZONE,sequence:2,position:POS.ATK},{code:C('Ohime the Manifested Mikanko'),p:1,location:LOC.MZONE,sequence:2,position:POS.ATK}]});
 toIdle(b,d,0);const evs=watch(d),want=['Lubellion the Searing Dragon','Mirrorjade the Iceblade Dragon','Fallen of Albaz','Ohime the Manifested Mikanko','Branded Opening'];
 const rank=s=>{const i=want.findIndex(w=>s.includes(w));return i<0?99:i};
 const step=()=>{const m=d.prompt,ch=d.choices(),s=m.seat??m.player;
  if(m.type===M.SELECT_UNSELECT_CARD){const fin=ch.find(o=>/finish|done|confirm/i.test(o.label));if(fin)return fin.response;return ch.filter(o=>/^Use/.test(o.label)).sort((x,y)=>rank(x.label)-rank(y.label))[0].response}
  if(m.type===M.SELECT_CARD||m.type===M.SELECT_TRIBUTE){const cards=m.selects||m.select_cards||m.cards||[];const order=[...cards.keys()].sort((x,y)=>rank(d.name(cards[x].code))-rank(d.name(cards[y].code)));return {type:b.R.SELECT_CARD,indicies:order.slice(0,Math.max(m.min||1,1))}}
  if(m.type===M.SELECT_EFFECTYN||m.type===M.SELECT_YESNO)return ch.find(o=>o.label===(s===0?'Yes':'No')).response;
  if(m.type===M.SELECT_CHAIN)return (m.forced?ch[0]:ch.find(o=>o.response.index===null)).response;
  return ch[0].response};
 const run=label=>{d.respond(d.choices().find(o=>o.label===label).response);for(let i=0;i<80&&d.prompt&&!(d.prompt.type===M.SELECT_IDLECMD&&(d.prompt.seat??d.prompt.player)===0);i++)d.respond(step())};
 run('Activate · Super Polymerization'); // Albion (Albaz + their Ohime), then its Fusion (Lubellion), then Lubellion's (Mirrorjade)
 const mats=evs.filter(e=>e.type==='move'&&(e.reason&8)&&(e.reason&262144));
 const f2x=mats.find(e=>e.from.location===4&&(e.from.position&5)&&e.to.location===64);assert.ok(f2x,'P1: a face-up field -> Extra Deck material move happened');assert.equal(f2x.code,code('Lubellion the Searing Dragon'),'P1: named');
 const b2d=mats.find(e=>e.from.location===32&&(e.from.position&5)&&e.to.location===1);assert.ok(b2d,'P5 (reproducer): face-up banished -> Deck move happened');assert.equal(b2d.code,code('Fallen of Albaz'),'P5: named');
 const fm=new FusionMaterials();fm.observe(evs,db);const last=[...fm.confirmed.values()].at(-1);assert.ok(last.items.every(i=>!i.hidden),'P1: Mirrorjade panel names every material');d.stop?.()}
// --- every case seen, with the expected outcome
const has=(k,named)=>(seen[k]||[]).length>0&&(seen[k]||[]).every(c=>named?c!==0:c===0);
assert.ok(has('M-up>Ex-down',true),'P1 natural: face-up field -> Extra Deck named');
assert.ok(has('GY>Deck',true),'P2: GY -> Deck named');
assert.ok(has('S-up>Ex-up',true)&&snap.p4,'P4: face-up Pendulum -> face-up Extra Deck named, opponent sees it');
assert.ok(has('Ban-up>Deck',true),'P5: face-up banished -> Deck named');
assert.ok(has('Hand>Deck',false),'C1: hand -> Deck stays code 0');
assert.ok(has('S-down>Hand',false),'C2: Set card -> hand stays code 0');
assert.ok(has('Ex-down>Ban-down',false)&&has('Deck>Ban-down',false),'C3: private at both ends stays code 0');
assert.ok(snap.c4,'C4: face-down Extra Deck hidden to the opponent, known to the owner');
assert.ok(has('S-down>GY',true),'R1: Set card -> GY named');
assert.ok((seen.OVERLAY||[]).length>0&&seen.OVERLAY.every(([,named])=>named),'R2: Xyz Material detached and named');
assert.ok((seen.TOKEN||[]).length>0,'R3: a Token left the field with no move event');
assert.ok(has('M-up>Hand',true)&&has('S-down>Hand',false),'R5 (L3): face-up bounce named, face-down bounce hidden');
// rule cases that never occur with the preset decks (helper = spec)
for(const [f,t,named] of [[{location:32,position:10},{location:1,position:10},false],[{location:4,position:10},{location:1,position:10},false],[{location:4,position:8},{location:2,position:10},false],
 [{location:2,position:10},{location:64,position:10},false],[{location:64,position:5},{location:2,position:10},true],[{location:8,position:10},{location:32,position:5},true]])
 assert.equal(publicMove(f,t),named,JSON.stringify([f,t]));
for(const [f,t] of [[{location:16,position:5},{location:1}],[{location:4,position:1},{location:2}],[{location:32,position:8},{location:1}],[{location:2},{location:16}]])assert.equal(publicMove(f,t),spec(f,t));
assert.ok(logChecks>100,'L1 checked on logged moves ('+logChecks+')');
console.log(JSON.stringify({test:'r35-public-identity',pass:true,moves,logChecks,categories:Object.keys(seen).length,node:process.version,selfVerified:true}));

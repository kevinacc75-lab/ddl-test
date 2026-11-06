// r36 S2 midgame puzzle suite, v2 (Claude as builder while Seto is out, 5 Nov 2026; plan item S2; ChatGPT RELAY-109
// validity conditions). CONTROLLED SYNTHETIC FIXTURES: named cards are dealt to chosen zones at duel creation, and each
// side's deck is only its placed cards plus unplayable filler (see FILLER). This isolates one question - "does the pilot
// use this legal engine offer?" - and is NOT proof that the position is reachable from a legal real deck or that it has
// a proper summon history; the filler is still a resource (cost/discard, hand size, deck knowledge).
// Turns before the AI's own turn T (T=3 when the AI moves first, T=4 when it moves second) are passed (End Turn; chains
// declined; any other forced prompt answered by a pilot). On turn T seat 0's real OptimalPilot plays its whole turn; seat
// 1 declines every chain/yes-no (scripted declines: NOT adversarial coverage) and otherwise uses its own pilot.
// Each run records validity metadata; a run is INVALID (not PASS/FAIL) on: setup failure, an exception, engine errors, a
// rejected response, the step bound, a missing own-turn start, or a turn that did not end normally. Only a VALID run is
// judged by its strict predicate (offer + selected attack + target + resolved result). Expected plays are PENDING
// Alexis (rulings) and Akiza (strategy).
// Usage: node tools/r36-s2-puzzles.mjs <outdir> [--search N] [--only a,b] [--modes classic,enhanced] [--flags E]
//        [--first 0|1] [--gate]    (--gate: exit 1 if any run is FAIL or INVALID; default screen mode exits 0.
//        Either mode exits 2 on an INVALID SELECTION (unknown/empty) or if the executed records != the requested matrix.)
import fs from 'node:fs';import crypto from 'node:crypto';import {pathToFileURL} from 'node:url';
import {engine,stopEngine,db,scripts,labels,v19,code,M} from './s3-harness.mjs';
import {Duel} from '../dist/duel.mjs';
import {createOptimalPilots} from '../dist/optimal-pilot.mjs';
import {setAiMode} from '../dist/ai/midgame-flags.mjs';
import {setS4,S4} from '../dist/ai/s4-flags.mjs';
import {createSearchCore} from '../dist/ai/engine-snapshot.mjs';
const argv=process.argv.slice(2),out=argv[0]||'s2-out',opt=(k,v)=>{const i=argv.indexOf('--'+k);return i>0?argv[i+1]:v};
const nodes=+opt('search',0),only=(opt('only','')||'').split(',').filter(Boolean),modes=opt('modes','classic,enhanced').split(','),extra=(opt('flags','')||'').toUpperCase(),first=+opt('first',0),gate=argv.includes('--gate');
const OWN=first===0?3:4,STEPS=3000;
const sha=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const IDENTITY={node:process.version,tool:sha(new URL(import.meta.url)),files:Object.fromEntries(['dist/tactics.mjs','dist/optimal-pilot.mjs','dist/ai/midgame-rules.mjs','dist/ai/midgame-flags.mjs','dist/ai/s4-flags.mjs','dist/duel.mjs','dist/cards.json.gz','dist/scripts.json.gz','dist/decks.json'].map(f=>[f,sha(f)]))};
// FILLER: Black Luster Soldier, a Ritual Monster with no Ritual Spell in these decks, so it can never be summoned or
// activated; it can still be a cost or a discard. Decks keep their real ids (books and doctrine are keyed by them).
const FILLER=code('Black Luster Soldier'),EXTRA=0x40|0x2000|0x800000|0x4000000;
function deckLists(deckIds,placements){return deckIds.map((id,o)=>{const mine=placements.filter(p=>p.owner===o).map(p=>code(p.name));const main=mine.filter(c=>!(db[c].type&EXTRA)),extra=mine.filter(c=>db[c].type&EXTRA);
 return {...v19(id),main:[...main,...Array(Math.max(0,40-main.length)).fill(FILLER)],extra,side:[]}})}
// RELAY-115 LP fixture: lp:[p0,p1] in LOGICAL seats (default 8000/8000). core.createDuel's team startingLP is wrapped for
// this one Duel.start (engine team i = logical seat order[i]) and restored with the placement wrapper on every route; the
// engine's own LP (duelQueryField) is then read back, mapped to logical seats and must equal the request; only then is the
// wrapper's d.lp synced FROM that verified engine state - before any pilot, seat context or search snapshot exists.
export function checkLP(lp){if(lp==null)return [8000,8000];if(!Array.isArray(lp)||lp.length!==2||!lp.every(v=>Number.isInteger(v)&&v>0&&v<=1000000))throw Error('invalid lp '+JSON.stringify(lp)+' (need two positive integers, logical seats)');return [...lp]}
export function nativeLP(core,d){const f=core.duelQueryField(d.handle),out=[null,null];(f?.players||[]).forEach((p,e)=>{out[d.fromEngine(e)]=Number(p.lp)});return out}
async function scenario(decks,placements,{seed=7,lp=null}={}){const live=await engine(),core=live.core,orig=core.duelNewCard,origCreate=core.createDuel;
 const want=checkLP(lp),order=first===0?[0,1]:[1,0];
 const left=placements.map(p=>({...p,codes:new Set([code(p.name)])}));let d;
 core.createDuel=function(o){return origCreate.call(core,{...o,team1:{...o.team1,startingLP:want[order[0]]},team2:{...o.team2,startingLP:want[order[1]]}})};
 core.duelNewCard=(h,info)=>{const p=left.find(x=>!x.used&&x.codes.has(info.code)&&d.toEngine(x.owner)===info.team);if(p){p.used=true;info={...info,location:p.location,sequence:p.sequence??0,position:p.position??1}}return orig.call(core,h,info)};
 try{d=new Duel(core,db,scripts);d.start(decks,{seed,first})}finally{core.duelNewCard=orig;core.createDuel=origCreate}
 if(core.createDuel!==origCreate||core.duelNewCard!==orig)throw Error('stale fixture wrapper');if(JSON.stringify(d.order)!==JSON.stringify(order))throw Error('seat mapping '+JSON.stringify(d.order)+' != '+JSON.stringify(order));
 const nat=nativeLP(core,d);if(JSON.stringify(nat)!==JSON.stringify(want))throw Error('native LP '+JSON.stringify(nat)+' != requested '+JSON.stringify(want));d.lp[0]=nat[0];d.lp[1]=nat[1];
 if(!left.every(p=>p.used))throw Error('not placed: '+left.filter(p=>!p.used).map(p=>p.name));if(d.errors?.length)throw Error('script errors: '+JSON.stringify(d.errors));return d}
const ATK=1,DEF=4,SET_ST=10;/* POS_FACEUP_ATTACK, POS_FACEUP_DEFENSE, POS_FACEDOWN (Spell/Trap Set) */
const stat=(n,k)=>db[code(n)][k];
const OH='Ohime the Manifested Mikanko',HL='Hu-Li the Jewel Mikanko',UPSTART=70368879,GG='Granguignol the Dusk Dragon',DA='Dark Armed, the Dragon of Annihilation',FL='Dogmatika Fleurdelis, the Knighted',SK='Scareclaw Kashtira',BE='Blue-Eyes White Dragon';
// Strict predicates (only for VALID runs). Each returns {pass, checks:{...}}; pass = every check true.
const judge=checks=>({pass:Object.values(checks).every(Boolean),checks});
const offered=(T,n)=>T.battleOffers.some(o=>o.some(l=>l.includes(n)));
const attacked=(T,n)=>T.own.some(x=>x.kind==='attack'&&(x.label||'').includes(n));
const onField=(b,n)=>b.field.some(c=>c.name===n);
const directOnly=(T,n,dmg)=>judge({offered:offered(T,n),selectedAttack:attacked(T,n),noPositionChange:!T.own.some(x=>x.kind==='position'&&(x.label||'').includes(n)),attackerStays:onField(T.boardAfter[0],n),damage:T.boardAfter[1].lp===T.boardStart[1].lp-dmg,ownLp:T.boardAfter[0].lp===T.boardStart[0].lp});
export const P={
 a:{title:'(a) attacker vs an empty board (+1 set card): attack directly, never switch to Defence',decks:['branded','sky'],
  place:[{name:GG,location:4,sequence:2,owner:0,position:ATK},{name:'Sky Striker Mobilize - Engage!',location:8,sequence:2,owner:1,position:SET_ST}],
  expect:T=>directOnly(T,GG,stat(GG,'attack'))},
 a2:{title:'(a2) as (a), the opponent holds real cards (3 in hand + 2 set; scripted declines)',decks:['branded','sky'],
  place:[{name:GG,location:4,sequence:2,owner:0,position:ATK},{name:'Sky Striker Mobilize - Engage!',location:8,sequence:2,owner:1,position:SET_ST},{name:'Infinite Impermanence',location:8,sequence:1,owner:1,position:SET_ST},
   {name:'Ash Blossom & Joyous Spring',location:2,owner:1},{name:'Sky Striker Maneuver - Jamming Waves!',location:2,owner:1},{name:'Forbidden Droplet',location:2,owner:1}],
  expect:T=>directOnly(T,GG,stat(GG,'attack'))},
 b:{title:'(b) Dark Armed (2800) vs Fleurdelis (2500, ATK): attack Fleurdelis',decks:['kashtira','branded'],
  place:[{name:DA,location:4,sequence:2,owner:0,position:ATK},{name:FL,location:4,sequence:2,owner:1,position:ATK}],
  expect:T=>judge({offered:offered(T,DA),selectedAttack:attacked(T,DA),targetFleurdelis:T.targets.length===0||T.targets.some(t=>t.includes(FL)),fleurdelisDestroyed:T.boardAfter[1].gy.includes(FL)&&!onField(T.boardAfter[1],FL),attackerStays:onField(T.boardAfter[0],DA),damage:T.boardAfter[1].lp===T.boardStart[1].lp-(stat(DA,'attack')-stat(FL,'attack')),ownLp:T.boardAfter[0].lp===T.boardStart[0].lp})},
 b2:{title:'(b2) as (b), the opponent holds real cards (3 in hand + 1 set; scripted declines)',decks:['kashtira','branded'],
  place:[{name:DA,location:4,sequence:2,owner:0,position:ATK},{name:FL,location:4,sequence:2,owner:1,position:ATK},{name:'Branded Retribution',location:8,sequence:2,owner:1,position:SET_ST},
   {name:'Ash Blossom & Joyous Spring',location:2,owner:1},{name:'Branded in Red',location:2,owner:1},{name:'Fallen of Albaz',location:2,owner:1}],
  expect:T=>P.b.expect(T)},
 d1:{title:'(d1) Granguignol 2500 ATK at OUR LP 2000 vs Ohime the Manifested Mikanko (0/0, ATK): Ohime is not destroyed by battle and our 2500 would be dealt to us instead - do not attack',decks:['branded','mikanko'],lp:[2000,8000],
  place:[{name:GG,location:4,sequence:2,owner:0,position:ATK},{name:OH,location:4,sequence:2,owner:1,position:ATK}],
  expect:T=>judge({offered:offered(T,GG),noAttack:!attacked(T,GG),attackerStays:onField(T.boardAfter[0],GG),ohimeStays:onField(T.boardAfter[1],OH),ownLp:T.boardAfter[0].lp===T.boardStart[0].lp,oppLp:T.boardAfter[1].lp===T.boardStart[1].lp})},
 d2:{title:'(d2) Granguignol 2500 ATK vs UNEQUIPPED Hu-Li the Jewel Mikanko (0/0, ATK): no reflection and no battle protection without an Equip - attack and destroy it, no LP change',decks:['branded','mikanko'],
  place:[{name:GG,location:4,sequence:2,owner:0,position:ATK},{name:HL,location:4,sequence:2,owner:1,position:ATK}],
  expect:T=>judge({offered:offered(T,GG),selectedAttack:attacked(T,GG),targetHuLi:T.targets.length===0||T.targets.some(t=>t.includes(HL)),huLiDestroyed:T.boardAfter[1].gy.includes(HL)&&!onField(T.boardAfter[1],HL),attackerStays:onField(T.boardAfter[0],GG),ownLp:T.boardAfter[0].lp===T.boardStart[0].lp,oppLp:T.boardAfter[1].lp===T.boardStart[1].lp})},
 f:{title:'(f) Granguignol 2500 ATK, Upstart Goblin in hand, opponent at 2500 LP with no monsters: take the direct lethal; no Upstart Goblin activation first (it would give them 1000 LP)',decks:['branded','sky'],lp:[8000,2500],
  place:[{name:GG,location:4,sequence:2,owner:0,position:ATK},{name:'Upstart Goblin',location:2,owner:0}],
  expect:T=>judge({upstartOffered:T.idleOffers.includes(UPSTART),attackOffered:offered(T,GG),selectedAttack:attacked(T,GG),noUpstartActivation:!T.activations.some(a=>a.code===UPSTART&&a.controller===0),finished:!!T.end?.finished,winnerSeat0:T.end?.winner===0,oppLpZero:T.boardAfter[1].lp===0,ownLp:T.boardAfter[0].lp===T.boardStart[0].lp})},
 e2:{title:'(e2) Scareclaw Kashtira in face-up Defence (DEF 2600 used) vs Blue-Eyes White Dragon 3000 ATK: the attack would lose, so do not attack',decks:['kashtira','blueeyes'],
  place:[{name:SK,location:4,sequence:2,owner:0,position:DEF},{name:BE,location:4,sequence:2,owner:1,position:ATK}],
  expect:T=>judge({offered:offered(T,SK),noAttack:!attacked(T,SK),attackerStays:onField(T.boardAfter[0],SK),targetStays:onField(T.boardAfter[1],BE),ownLp:T.boardAfter[0].lp===T.boardStart[0].lp,oppLp:T.boardAfter[1].lp===T.boardStart[1].lp})},
 e3:{title:'(e3) Scareclaw Kashtira in face-up Defence (DEF 2600 used) vs Blue-Eyes White Dragon in face-up DEF 2500: attack and destroy it, no damage either way',decks:['kashtira','blueeyes'],
  place:[{name:SK,location:4,sequence:2,owner:0,position:DEF},{name:BE,location:4,sequence:2,owner:1,position:DEF}],
  expect:T=>judge({offered:offered(T,SK),selectedAttack:attacked(T,SK),targetDestroyed:T.boardAfter[1].gy.includes(BE)&&!onField(T.boardAfter[1],BE),attackerStays:onField(T.boardAfter[0],SK),ownLp:T.boardAfter[0].lp===T.boardStart[0].lp,oppLp:T.boardAfter[1].lp===T.boardStart[1].lp})},
 e:{title:'(e) Scareclaw Kashtira in face-up Defence vs an empty board: the engine offers the attack; take it (DEF used)',decks:['kashtira','branded'],
  place:[{name:SK,location:4,sequence:2,owner:0,position:DEF}],
  expect:T=>directOnly(T,SK,stat(SK,'defense'))},
};
const kindOf=(type,label)=>type===M.SELECT_BATTLECMD&&/^Attack/i.test(label)?'attack':type===M.SELECT_IDLECMD&&/Defen[cs]e|Change position|position/i.test(label)?'position':type===M.SELECT_IDLECMD&&/Activate|Summon|Set|Special/i.test(label)?'play':/Battle Phase|End Turn|End phase|Main Phase 2/i.test(label)?'phase':'other';
const cardOf=(d,c)=>c?{name:d.name(c.code),position:c.position,sequence:c.sequence}:null;
const board=d=>[0,1].map(p=>({lp:d.lp[p],field:d.zone(p,4).filter(Boolean).map(c=>cardOf(d,c)),st:d.zone(p,8).filter(Boolean).map(c=>cardOf(d,c)),hand:d.zone(p,2).filter(Boolean).length,gy:d.zone(p,16).filter(Boolean).map(c=>d.name(c.code))}));
// Validity first, then the strict predicate: INVALID on a missing own-turn start, an abnormal stop (setup failure, error,
// step bound, rejected response, no prompt, wrong seat), engine errors, a rejected response or an error note.
export const lpAgrees=T=>{const c=T.lpCheck;if(!c||!c.start||!c.end)return false;const eq=(a,b)=>Array.isArray(a)&&a.length===2&&a.every(v=>Number.isFinite(v))&&JSON.stringify(a)===JSON.stringify(b);return eq(c.start.native,c.start.wrapper)&&eq(c.end.native,c.end.wrapper)&&JSON.stringify(c.setup)===JSON.stringify(c.requested)};
export function classify(T,pz){const valid=!!T.boardStart&&lpAgrees(T)&&['turn-end','finished'].includes(T.stop)&&!(T.errors||[]).length&&!T.rejected&&!(T.notes||[]).some(x=>/^error|^setup|^rejected/.test(x));
 T.valid=valid;if(valid){T.result=pz.expect(T);T.outcome=T.result.pass?'PASS':'FAIL'}else{T.result=null;T.outcome='INVALID'}return T}
async function pilotsFor(seed){if(!nodes)return createOptimalPilots({seed,searchEnabled:false});const ps=[];
 for(const s of [0,1]){const core=await createSearchCore(db,scripts);ps[s]=createOptimalPilots({seed,nodeBudget:nodes,searchCore:core,worldPool:true,poolKey:'s2:'+seed+':'+s,poolSize:10,seatCapBytes:40*1048576,shouldStop:()=>false})[s]}return ps}
const MAIN=import.meta.url===pathToFileURL(process.argv[1]||'').href;
// RELAY-110: the requested matrix must be valid and nonempty BEFORE anything runs, and the executed records must equal
// it exactly; a zero-run or unknown selection is INVALID SELECTION (exit 2 in every mode), never a success.
export function selectionErrors({only,modes,extra,first,search=0}){const e=[],ids=Object.keys(P);
 for(const id of (only.length?only:ids))if(P[id]?.lp&&search>0)e.push('puzzle '+id+' has a non-default LP fixture: search-off only until search-root LP is verified (RELAY-115)');
 for(const x of only)if(!ids.includes(x))e.push('unknown puzzle id: '+x);if(!modes.length||modes.some(m=>!['classic','enhanced'].includes(m)))e.push('modes must be classic and/or enhanced: '+modes.join(','));
 if(new Set(modes).size!==modes.length)e.push('duplicate mode');for(const k of extra)if(!(k in S4))e.push('unknown S4 flag: '+k);if(![0,1].includes(first))e.push('--first must be 0 or 1');
 if(!(only.length?only:ids).length)e.push('empty selection');return e}
export const requested=({only,modes,extra})=>(only.length?Object.keys(P).filter(id=>only.includes(id)):Object.keys(P)).flatMap(id=>modes.map(m=>id+'|'+m+(extra?'+'+extra:'')));
if(MAIN){const selErr=selectionErrors({only,modes,extra,first,search:nodes});if(selErr.length){console.log('INVALID SELECTION: '+selErr.join('; '));process.exit(2)}
 const want=requested({only,modes,extra});fs.mkdirSync(out,{recursive:true});const CORE=(await engine()).core;const rows=[];
for(const [id,pz] of Object.entries(P)){if(only.length&&!only.includes(id))continue;
 for(const mode of modes){setAiMode(mode);if(extra)setS4(Object.fromEntries([...extra].map(k=>[k,true])));const seed=7;
  const T={puzzle:id,title:pz.title,fixture:'controlled synthetic',mode:mode+(extra?'+'+extra:''),s4:{...S4},search:nodes,seed,first,ownTurn:OWN,decks:pz.decks,placements:pz.place,identity:IDENTITY,own:[],targets:[],battleOffers:[],idleOffers:[],activations:[],seq:0,notes:[],rejected:0,decisions:0,stop:null,lpCheck:{requested:checkLP(pz.lp)}};
  const lists=deckLists(pz.decks,pz.place);T.deckLists=lists.map(x=>({id:x.id,main:x.main,extra:x.extra,mainNames:Object.fromEntries([...new Set(x.main)].map(c=>[db[c].name,x.main.filter(y=>y===c).length]))}));
  let d;try{d=await scenario(lists,pz.place,{seed,lp:pz.lp});T.lpCheck.setup=nativeLP(CORE,d)}catch(e){T.stop='setup-failed';T.notes.push('setup failed: '+e.message);T.outcome='INVALID';rows.push(T);fs.writeFileSync(`${out}/${id}-${T.mode}-s${nodes}-f${first}.json`,JSON.stringify(T,null,1));continue}
  const ps=await pilotsFor(seed);let n=0;
  let chainLen=0;const trackChain=()=>{const ch=d.chain||[];if(ch.length<chainLen)chainLen=0;for(const c of ch.slice(chainLen))T.activations.push({seq:T.seq,turn:d.turn,code:c.code,controller:c.controller,link:c.chain_size});chainLen=ch.length};
  const respond=(r,who)=>{const before=d.retries;T.seq++;d.respond(r);trackChain();if(d.retries!==before){T.rejected++;T.notes.push('rejected response ('+who+') at turn '+d.turn)};return d.retries===before};
  const decline=()=>{const c=d.choices().find(o=>['Do not chain','No'].includes(o.label));if(c){respond(c.response,'decline');return true}return false};
  try{for(;;){if(d.finished){T.stop='finished';break}if(!d.prompt){T.stop='no-prompt';break}if(d.turn>OWN){T.stop='turn-end';break}if(++n>STEPS){T.stop='step-bound';break}if(T.rejected){T.stop='rejected';break}
    const m=d.prompt,s=m.seat??m.player;
    if(d.turn<OWN){if(m.type===M.SELECT_IDLECMD){const c=d.choices().find(o=>/End Turn|End phase|End Phase/i.test(o.label));if(c){respond(c.response,'pass-turn');continue}}
     if([M.SELECT_CHAIN,M.SELECT_EFFECTYN,M.SELECT_YESNO].includes(m.type)&&decline())continue;const p=ps[s].plan(d);respond(p.response,'pre-turn');continue}
    if(!T.boardStart){if(!(s===0&&d.active===0)){T.stop='own-turn-not-seat-0';break}T.boardStart=board(d);T.lpCheck.start={native:nativeLP(CORE,d),wrapper:[...d.lp]};T.turnStart={turn:d.turn,phase:d.phase,active:d.active}}
    if(s===1){if([M.SELECT_CHAIN,M.SELECT_EFFECTYN,M.SELECT_YESNO].includes(m.type)&&decline())continue;const p=ps[1].plan(d);if(respond(p.response,'seat1'))for(const x of ps)x.observe?.(p);continue}
    const ls=labels(d);if(m.type===M.SELECT_IDLECMD)T.idleOffers.push(...d.choices().filter(o=>/^Activate/.test(o.label)).map(o=>o.code));if(m.type===M.SELECT_BATTLECMD)T.battleOffers.push(ls.filter(l=>/^Attack/i.test(l)));
    const p=ps[0].plan(d);const label=d.choices().find(o=>JSON.stringify(o.response)===JSON.stringify(p.response))?.label||null;
    if(m.type===M.SELECT_IDLECMD||m.type===M.SELECT_BATTLECMD)T.own.push({seq:T.seq+1,phase:d.phase,type:m.type===M.SELECT_IDLECMD?'idle':'battle',label,kind:kindOf(m.type,label||''),rule:p.rule||p.book?.rule||null,reason:p.book?.reason||p.reason||null});
    if(m.type===M.SELECT_CARD&&d.hint===549/* HINTMSG_ATTACKTARGET */)T.targets.push(...(p.response.indicies||[]).map(j=>d.name((m.selects||[])[j]?.code)));
    T.decisions++;if(respond(p.response,'seat0'))for(const x of ps)x.observe?.(p)}}catch(e){T.stop='error';T.notes.push('error: '+e.message)}
  T.end={turn:d.turn,phase:d.phase,active:d.active,finished:!!d.finished,winner:d.finished?d.winner:null};T.boardAfter=board(d);try{T.lpCheck.end={native:nativeLP(CORE,d),wrapper:[...d.lp]}}catch(e){T.lpCheck.end={native:null,wrapper:[...d.lp],error:e.message}}T.errors=[...(d.errors||[])];T.stats=ps[0].midgameStats||null;
  classify(T,pz);
  rows.push(T);fs.writeFileSync(`${out}/${id}-${T.mode}-s${nodes}-f${first}.json`,JSON.stringify(T,null,1));try{d.stop?.()}catch{}}}
const sum=rows.map(T=>`${T.puzzle} ${T.mode} s${T.search} f${T.first}: ${T.outcome} - stop=${T.stop} decisions=${T.decisions} rejected=${T.rejected} errors=${T.errors?.length??'-'}${T.result?' checks='+Object.entries(T.result.checks).map(([k,v])=>k+':'+(v?'y':'N')).join(','):''}${T.notes.length?' notes='+T.notes.join('; '):''}\n   own-turn plays: ${T.own.map(x=>x.kind+':'+(x.label||'?')).join(' | ')}${T.targets.length?' targets='+T.targets.join(','):''}\n   LP start/after: ${T.boardStart?.map(b=>b.lp).join('/')} -> ${T.boardAfter?.map(b=>b.lp).join('/')}`);
fs.writeFileSync(`${out}/SUMMARY-s${nodes}-f${first}${extra?'-'+extra:''}.txt`,sum.join('\n')+'\n');console.log(sum.join('\n'));stopEngine();
const got=rows.map(T=>T.puzzle+'|'+T.mode).sort(),matrixOk=JSON.stringify(got)===JSON.stringify([...want].sort());
if(!matrixOk){console.log('INVALID RUN: executed records '+JSON.stringify(got)+' != requested '+JSON.stringify(want));process.exit(2)}
console.log('matrix: '+rows.length+' runs = requested; '+['PASS','FAIL','INVALID'].map(o=>o+' '+rows.filter(T=>T.outcome===o).length).join(', '));
process.exit(gate&&rows.some(T=>T.outcome!=='PASS')?1:0);}

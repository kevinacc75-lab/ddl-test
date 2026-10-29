// r36 (Claude, 29 Oct 2026; Kevy 18:35: "After turn 3 the AI plays so poorly. Having a full board but doesn't attack
// directly?"). A CPU-v-CPU duel with the browser's Watch-mode pilots (search on, per-decision deadline, world pool), that
// records every Main Phase and Battle Phase decision from turn 3 on: what attacks were possible, what was chosen and
// which rule / search chose it. Usage:
//   node tools/r36-battle-probe.mjs --a dtw --b branded --seed 7 --first 0 --deadline-ms 1500 --max-turn 8 [--out f.json]
import fs from 'node:fs';import zlib from 'node:zlib';
import {Duel,M} from '../dist/duel.mjs';import {createOptimalPilots} from '../dist/optimal-pilot.mjs';import {createSearchCore} from '../dist/ai/engine-snapshot.mjs';import {dropAllPools} from '../dist/ai/world-pool.mjs';
const arg=(k,v)=>{const i=process.argv.indexOf('--'+k);return i>0?process.argv[i+1]:v};
const seed=+arg('seed',7),first=+arg('first',0),deadlineMs=+arg('deadline-ms',1500),maxTurn=+arg('max-turn',8),A=arg('a','dtw'),B=arg('b','branded');
const db=JSON.parse(zlib.gunzipSync(fs.readFileSync('dist/cards.json.gz'))),scripts=JSON.parse(zlib.gunzipSync(fs.readFileSync('dist/scripts.json.gz')));
const all=JSON.parse(fs.readFileSync('dist/decks.json')).decks.map(d=>d.banlistVariants?.['tcg-2026-10-19']?{...d,...d.banlistVariants['tcg-2026-10-19']}:d);
const d=await Duel.create(db,scripts),searchCore=await createSearchCore(db,scripts);let deadline=Infinity;const shouldStop=()=>performance.now()>=deadline;
const pilots=createOptimalPilots({seed,nodeBudget:400,searchCore,worldPool:true,poolKey:'battle:'+seed,poolSize:10,seatCapBytes:40*1048576,shouldStop});
const rows=[],turns=[];let n=0;const t0=Date.now();
const mons=s=>d.zone(s,4).filter(Boolean).map(c=>({name:d.name(c.code),atk:c.attack,pos:c.position&1?'ATK':(c.position&4?'DEF':'set')}));
try{d.start([all.find(x=>x.id===A),all.find(x=>x.id===B)],{seed,first});let lastTurn=0;
 while(d.prompt&&!d.finished&&d.turn<=maxTurn&&n<3000){const m=d.prompt,s=m.seat;
  if(d.turn!==lastTurn){turns.push({turn:d.turn,active:d.active,lp:[...d.lp],ownMons:mons(d.active),oppMons:mons(1-d.active)});lastTurn=d.turn}
  deadline=performance.now()+deadlineMs;const plan=pilots[s].plan(d);deadline=Infinity;if(!plan?.response)break;
  if(d.turn>=3&&s===d.active&&(m.type===M.SELECT_IDLECMD||m.type===M.SELECT_BATTLECMD)){const r=plan.response;
   const row={turn:d.turn,seat:s,deck:s===0?A:B,type:m.type===M.SELECT_IDLECMD?'main':'battle',lp:[...d.lp],own:mons(s),opp:mons(1-s),
    canBattle:!!m.to_bp,attacks:(m.attacks||[]).map(c=>({name:d.name(c.code),direct:!!(c.direct_attackable??c.can_direct)})),
    chose:m.type===M.SELECT_IDLECMD?({0:'normal summon',1:'special summon',2:'position',4:'set',5:'activate',6:'BATTLE',7:'END TURN',3:'set monster'})[r.action]+(r.index!=null?' '+d.name((r.action===5?m.activates:r.action===0?m.summons:r.action===1?m.special_summons:r.action===4?m.spell_sets:r.action===3?m.monster_sets:m.pos_changes)?.[r.index]?.code||0):''):({0:'activate',1:'ATTACK',2:'to Main 2',3:'END TURN'})[r.action]+(r.action===1?' with '+d.name(m.attacks[r.index]?.code||0):''),
    rule:plan.rule||plan.book?.rule||null,why:(plan.reasons||plan.why||[]).slice?.(0,2),search:plan.search?{status:plan.search.status,worlds:plan.search.determinizations}:null};
   rows.push(row)}
  d.respond(plan.response);for(const x of pilots)x.observe?.(plan);n++}
}finally{d.stop();dropAllPools()}
const out={seed,first,decks:[A,B],deadlineMs,node:process.version,finished:d.finished,winner:d.finished?d.winner:null,turn:d.turn,lp:[...d.lp],wallSec:Math.round((Date.now()-t0)/1000),turns,rows};
const f=arg('out',null);if(f)fs.writeFileSync(f,JSON.stringify(out,null,1));
console.log(JSON.stringify({seed,turn:d.turn,lp:d.lp,finished:d.finished,winner:out.winner,battleRows:rows.filter(r=>r.type==='battle').length,mainEndWithAttackers:rows.filter(r=>r.type==='main'&&/END TURN/.test(r.chose)&&r.canBattle&&r.own.some(c=>c.pos==='ATK'&&c.atk>0)).length,wallSec:out.wallSec}));

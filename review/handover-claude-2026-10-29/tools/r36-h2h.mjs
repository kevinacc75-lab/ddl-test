// r36 midgame project (Claude, 29 Oct 2026; Seto 20:15 measurement design). Head-to-head duel between two AI builds:
// seat A uses the pilots of tree --a-tree, seat B those of --b-tree; the duel engine (duel.mjs, cards, scripts) comes from
// --engine-tree (the engines are byte-identical between the arms, checked by the caller). Watch-mode pilots: search on,
// world pool, per-decision deadline (--deadline-ms). Writes ONE JSONL row with Seto's section 7 fields:
//   seed, decks, order (first), which side is new/old, deadline, winner, end reason, turns, LP after every turn,
//   per-turn action counts, skip and idle events with reasons, safety counters (blocks / retries / errors), wall time,
//   tool and tree hashes.
// Usage: node tools/r36-h2h.mjs --engine-tree T --a-tree T1 --b-tree T2 --a-label new --b-label old --a dtw --b branded
//          --seed 70001 --first 0 --deadline-ms 1500 [--max-turn 40] [--out file.jsonl]
import fs from 'node:fs';import zlib from 'node:zlib';import path from 'node:path';import crypto from 'node:crypto';import {pathToFileURL,fileURLToPath} from 'node:url';
const arg=(k,v)=>{const i=process.argv.indexOf('--'+k);return i>0?process.argv[i+1]:v};
const here=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const ET=path.resolve(arg('engine-tree',here)),AT=path.resolve(arg('a-tree',here)),BT=path.resolve(arg('b-tree',here));
const seed=+arg('seed',70001),first=+arg('first',0),deadlineMs=+arg('deadline-ms',1500),maxTurn=+arg('max-turn',40),A=arg('a','dtw'),B=arg('b','branded'),labels=[arg('a-label','A'),arg('b-label','B')];
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const imp=(tree,f)=>import(pathToFileURL(path.join(tree,'dist',f)).href);
const {Duel,M}=await imp(ET,'duel.mjs');
const db=JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(ET,'dist/cards.json.gz')))),scripts=JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(ET,'dist/scripts.json.gz'))));
const all=JSON.parse(fs.readFileSync(path.join(ET,'dist/decks.json'))).decks.map(d=>d.banlistVariants?.['tcg-2026-10-19']?{...d,...d.banlistVariants['tcg-2026-10-19']}:d);
let deadline=Infinity;const shouldStop=()=>performance.now()>=deadline;
async function pilotsFrom(tree,seat){const {createOptimalPilots}=await imp(tree,'optimal-pilot.mjs'),{createSearchCore}=await imp(tree,'ai/engine-snapshot.mjs');
 const core=await createSearchCore(db,scripts);return createOptimalPilots({seed,nodeBudget:400,searchCore:core,worldPool:true,poolKey:'h2h:'+seed+':'+seat+':'+tree,poolSize:10,seatCapBytes:40*1048576,shouldStop})[seat]}
const pilots=[await pilotsFrom(AT,0),await pilotsFrom(BT,1)];
const d=await Duel.create(db,scripts);const t0=Date.now();
const mons=s=>d.zone(s,4).filter(Boolean);
const turns=[],skips=[],idles=[];let cur=null,n=0,end='running',err=null;
const close=()=>{if(!cur)return;cur.lpAfter=[...d.lp];const s=cur.seat,a=cur.actions;
 if(cur.turn>=3&&!a.summon&&!a.activate&&!a.attack&&!a.set&&!a.position){idles.push({turn:cur.turn,seat:s,reason:cur.lockedHint||'none',productiveAlternative:cur.hadAlternative})}
 turns.push(cur);cur=null};
try{d.start([all.find(x=>x.id===A),all.find(x=>x.id===B)],{seed,first});
 while(d.prompt&&!d.finished&&n<6000){
  if(!cur||cur.turn!==d.turn){close();if(d.turn>maxTurn){end='turn cap';break}cur={turn:d.turn,seat:d.active,lpBefore:[...d.lp],actions:{summon:0,activate:0,attack:0,set:0,position:0,decisions:0},hadAlternative:false}}
  const m=d.prompt,s=m.seat;deadline=performance.now()+deadlineMs;const plan=pilots[s].plan(d);deadline=Infinity;if(!plan?.response){end='no response';break}
  const r=plan.response;
  if(s===d.active){cur.actions.decisions++;
   if(m.type===M.SELECT_IDLECMD){if(r.action===0||r.action===1)cur.actions.summon++;else if(r.action===5)cur.actions.activate++;else if(r.action===3||r.action===4)cur.actions.set++;else if(r.action===2)cur.actions.position++;
    if((r.action===6||r.action===7)&&((m.summons||[]).length||(m.special_summons||[]).length||(m.activates||[]).length))cur.hadAlternative=true;
    if(r.action===7&&d.turn>=3&&m.to_bp&&!mons(1-s).length&&mons(s).some(c=>(c.position&1)&&(c.attack||0)>0))skips.push({turn:d.turn,seat:s,kind:'end turn with an attacker and no opposing monster',cards:mons(s).filter(c=>c.position&1).map(c=>d.name(c.code)),rule:plan.rule||plan.book?.rule||null})}
   if(m.type===M.SELECT_BATTLECMD){if(r.action===1)cur.actions.attack++;
    else if(d.turn>=3&&!mons(1-s).length&&(m.attacks||[]).length)skips.push({turn:d.turn,seat:s,kind:'left battle with a legal attack and no opposing monster',cards:(m.attacks||[]).map(c=>d.name(c.code)),rule:plan.rule||plan.book?.rule||null})}}
  d.respond(r);for(const x of pilots)x.observe?.(plan);n++}
 close();if(d.finished)end=d.winReason!=null?'win reason '+d.winReason:'finished';else if(end==='running')end=n>=6000?'decision cap':'stopped';
}catch(e){err=String(e?.message||e);end='error'}finally{try{d.stop()}catch{}}
const row={tool:'r36-h2h',toolSha256:sha(fs.readFileSync(fileURLToPath(import.meta.url))),node:process.version,seed,decks:[A,B],first,sides:labels,trees:{engine:ET,a:AT,b:BT},
 pilotSha256:{a:sha(fs.readFileSync(path.join(AT,'dist/optimal-pilot.mjs'))),b:sha(fs.readFileSync(path.join(BT,'dist/optimal-pilot.mjs')))},deadlineMs,
 winner:d.finished?d.winner:null,winnerLabel:d.finished&&d.winner!=null?labels[d.winner]:null,end,turns:d.turn,lpPerTurn:turns.map(t=>({turn:t.turn,seat:t.seat,before:t.lpBefore,after:t.lpAfter})),
 actionsPerTurn:turns.map(t=>({turn:t.turn,seat:t.seat,...t.actions})),skips,idles,
 safety:{blocks:pilots.map(p=>(p.blocks||[]).length),retries:d.retries||0,errors:[...(d.errors||[]),...(err?[err]:[])]},decisions:n,wallSec:Math.round((Date.now()-t0)/1000)};
const line=JSON.stringify(row);const out=arg('out',null);if(out)fs.appendFileSync(out,line+'\n');console.log(line.slice(0,400));

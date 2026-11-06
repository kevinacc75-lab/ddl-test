// r36 midgame project (Claude, 29 Oct 2026; Seto 20:15 measurement design). Head-to-head duel between two AI builds:
// seat A uses the pilots of tree --a-tree, seat B those of --b-tree; the duel engine (duel.mjs, cards, scripts) comes from
// --engine-tree (the engines are byte-identical between the arms, checked by the caller). Watch-mode pilots: search on,
// world pool, per-decision deadline (--deadline-ms). Writes ONE JSONL row with Seto's section 7 fields:
//   seed, decks, order (first), which side is new/old, deadline, winner, end reason, turns, LP after every turn,
//   per-turn action counts, skip and idle events with reasons, safety counters (blocks / retries / errors), wall time,
//   tool and tree hashes.
// Usage: node tools/r36-h2h.mjs --engine-tree T --a-tree T1 --b-tree T2 --a-label new --b-label old --a dtw --b branded
//          --seed 71001 --first 0 --deadline-ms 1500 [--max-turn 40] [--out file.jsonl] [--a-flags ABC] [--b-flags off]
// r36 Seto 30 Oct: --a-flags / --b-flags set the r36 midgame arms (ai/midgame-flags.mjs) of that side's tree; a tree without
// that module (r35.11) must get 'off'. Adds the whole-dist hash per tree (sha256 over sorted "path NUL sha256(file) LF"),
// the response stream (sha256 of all responses + the turn 1-2 responses in full), search status counts per seat and the
// r36 midgame hold counters. Dev seeds only: refuses seeds outside 71001-71100 unless --allow-proof-seeds (pre-registration).
// r36 think-time trial (Kevy 30 Oct): --a-think-ms / --b-think-ms N give that side N ms per decision (flag DDL_THINK_MS in
// that tree's dist/ai/think-flags.mjs: N ms cap + node budget 400 x N/1500); omitted or <= 1500 = off (that side keeps
// --deadline-ms and 400 nodes). Row gains think:{ms, deadlineMs, ends} (per seat: searches ended by node budget / clock / other).
// RELAY-075 B2: T (ahead/trade penalty) and Z (zero-damage direct tie-break) are separate held-for-review policies; pass them explicitly.
import fs from 'node:fs';import zlib from 'node:zlib';import path from 'node:path';import crypto from 'node:crypto';import {pathToFileURL,fileURLToPath} from 'node:url';
const arg=(k,v)=>{const i=process.argv.indexOf('--'+k);return i>0?process.argv[i+1]:v};
const here=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const ET=path.resolve(arg('engine-tree',here)),AT=path.resolve(arg('a-tree',here)),BT=path.resolve(arg('b-tree',here));
const seed=+arg('seed',71001),first=+arg('first',0),deadlineMs=+arg('deadline-ms',1500),maxTurn=+arg('max-turn',40),A=arg('a','dtw'),B=arg('b','branded'),labels=[arg('a-label','A'),arg('b-label','B')];
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const imp=(tree,f)=>import(pathToFileURL(path.join(tree,'dist',f)).href);
const {Duel,M}=await imp(ET,'duel.mjs');
const db=JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(ET,'dist/cards.json.gz')))),scripts=JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(ET,'dist/scripts.json.gz'))));
const all=JSON.parse(fs.readFileSync(path.join(ET,'dist/decks.json'))).decks.map(d=>d.banlistVariants?.['tcg-2026-10-19']?{...d,...d.banlistVariants['tcg-2026-10-19']}:d);
if(!(seed>=71001&&seed<=71100)&&!process.argv.includes('--allow-proof-seeds')){console.error('seed '+seed+' is not a dev seed (71001-71100); proof seeds wait for the pre-registration review');process.exit(2)}
const flagsOf=[arg('a-flags','off'),arg('b-flags','off')].map(f=>f.toUpperCase()==='OFF'?'':f.toUpperCase());
if(AT===BT&&flagsOf[0]!==flagsOf[1]){console.error('one tree, one flag set: both seats share the module (use two trees)');process.exit(2)}
const distHash=tree=>{const root=path.join(tree,'dist'),files=[];const walk=dir=>{for(const e of fs.readdirSync(dir,{withFileTypes:true})){const f=path.join(dir,e.name);if(e.isDirectory())walk(f);else files.push(path.relative(root,f))}};walk(root);files.sort();return sha(files.map(f=>f+'\0'+sha(fs.readFileSync(path.join(root,f)))+'\n').join(''))};
async function setFlags(tree,flags){const f=path.join(tree,'dist/ai/midgame-flags.mjs');if(!fs.existsSync(f)){if(flags)throw new Error('tree '+tree+' has no midgame flags');return 'n/a'}const {setMidgame,midgameLabel}=await import(pathToFileURL(f).href);setMidgame(Object.fromEntries(['A','B','C','T','Z'].map(k=>[k,flags.includes(k)])));return midgameLabel()}
// r36 (Claude, 7 Nov; Kevy 01:21 'finish the AI ... making it the default'): --a-mode / --b-mode classic|enhanced set that
// tree's FULL recipe through its own setAiMode (A/B/C/T/Z + the complete S4 map E/F), overriding --a-flags/--b-flags.
const modeOf=[arg('a-mode',''),arg('b-mode','')];
if(AT===BT&&modeOf[0]!==modeOf[1]){console.error('one tree, one mode: both seats share the module (use two trees)');process.exit(2)}
async function setMode(tree,mode){const f=path.join(tree,'dist/ai/midgame-flags.mjs'),{setAiMode,midgameLabel}=await import(pathToFileURL(f).href);if(!['classic','enhanced'].includes(mode))throw new Error('mode must be classic or enhanced');setAiMode(mode);
 const s4=await import(pathToFileURL(path.join(tree,'dist/ai/s4-flags.mjs')).href);return mode+' '+midgameLabel()+' S4 '+JSON.stringify({...s4.S4})}
const flagLabels=[modeOf[0]?await setMode(AT,modeOf[0]):await setFlags(AT,flagsOf[0]),modeOf[1]?await setMode(BT,modeOf[1]):await setFlags(BT,flagsOf[1])];
const thinkArg=[+arg('a-think-ms',0),+arg('b-think-ms',0)];
async function setThinkOf(tree,ms){const f=path.join(tree,'dist/ai/think-flags.mjs');if(!fs.existsSync(f)){if(ms>1500)throw new Error('tree '+tree+' has no think-time flag');return 0}const {setThink}=await import(pathToFileURL(f).href);return setThink(ms)}
const thinkMs=[await setThinkOf(AT,thinkArg[0]),await setThinkOf(BT,thinkArg[1])];
if(AT===BT&&thinkMs[0]!==thinkMs[1]){console.error('one tree, one think setting: both seats share the module (use two trees)');process.exit(2)}
const seatDeadline=thinkMs.map(ms=>ms>0?Math.max(ms,deadlineMs):deadlineMs),thinkEnds=[{searches:0,nodeBudget:0,clock:0,other:0,nodes:0,thinkMs:0},{searches:0,nodeBudget:0,clock:0,other:0,nodes:0,thinkMs:0}];
const stream=[],open12=[],searchCounts=[{},{}];
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
  const m=d.prompt,s=m.seat;const tStart=performance.now();deadline=tStart+seatDeadline[s];const plan=pilots[s].plan(d);const tEnd=performance.now(),clockOut=tEnd>=deadline;deadline=Infinity;
  if(plan?.search&&plan.search.status){const e=thinkEnds[s],sr=plan.search;e.searches++;e.thinkMs+=tEnd-tStart;e.nodes+=sr.nodes||0;if(clockOut)e.clock++;else if(sr.nodeBudget&&(sr.nodes||0)>=sr.nodeBudget)e.nodeBudget++;else e.other++}if(!plan?.response){end='no response';break}
  const r=plan.response;const st=plan.search?(plan.search.status||'full'):'none';searchCounts[s][st]=(searchCounts[s][st]||0)+1;stream.push(JSON.stringify(r));if(d.turn<=2)open12.push({turn:d.turn,seat:s,type:m.type,r});
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
 distSha256:{a:distHash(AT),b:distHash(BT)},flags:flagLabels,responseStreamSha256:sha(stream.join('\n')),openingResponses:open12,search:searchCounts,midgame:pilots.map(p=>p.midgameStats||null),
 pilotSha256:{a:sha(fs.readFileSync(path.join(AT,'dist/optimal-pilot.mjs'))),b:sha(fs.readFileSync(path.join(BT,'dist/optimal-pilot.mjs')))},deadlineMs,think:{ms:thinkMs,deadlineMs:seatDeadline,ends:thinkEnds.map(e=>({...e,thinkMs:Math.round(e.thinkMs)}))},
 winner:d.finished?d.winner:null,winnerLabel:d.finished&&d.winner!=null?labels[d.winner]:null,end,turns:d.turn,lpPerTurn:turns.map(t=>({turn:t.turn,seat:t.seat,before:t.lpBefore,after:t.lpAfter})),
 actionsPerTurn:turns.map(t=>({turn:t.turn,seat:t.seat,...t.actions})),skips,idles,
 safety:{blocks:pilots.map(p=>(p.blocks||[]).length),retries:d.retries||0,errors:[...(d.errors||[]),...(err?[err]:[])]},decisions:n,wallSec:Math.round((Date.now()-t0)/1000)};
const line=JSON.stringify(row);const out=arg('out',null);if(out)fs.appendFileSync(out,line+'\n');console.log(line.slice(0,400));

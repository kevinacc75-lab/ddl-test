#!/usr/bin/env node
// S2a split runner, revision 2 (Claude, 28 Oct 2026). Answers ChatGPT RELAY-047 (F1, F2, notes). Kevy-approved plan:
// "HANDOVER - Seto to Claude - 2026-10-27 - S2a split-run plan". Plays S2a jobs of the FROZEN tests/ai-gate.mjs one duel
// at a time per process and writes one JSON line per finished job. Counting shards are started ONLY by
// tools/s2a-supervisor.mjs, which serializes stale-claim recovery before any worker starts (RELAY-047 F2).
//
// Gate reuse (unchanged from rev 1): the frozen file is read and sha256-checked (1c380d58…), cut at the first
// "async function main() {", and everything before the cut is used byte-for-byte (prefix sha256 pinned below). A driver
// that repeats main()'s first statements (load, whitelist read, WL = JSON.parse, candidate import, make = withEngine(...))
// is appended, written to a temp .mjs and imported. Jobs use the gate's own schedule(200) and playDuel(job,[make,make]).
//
// Fail-closed rules (RELAY-047 F1):
//  - Before claiming anything, every finished line in the out-dir is scanned. A line with any nonzero blunder array (or an
//    unreadable line), or any record in errors/, means STOP: STOP is (re)written durably and this process refuses to run.
//  - After a duel with a blunder, errors/job-<i>.json and STOP are written and fsync'd BEFORE the job line, so an
//    interruption at any point leaves either nothing for that job (interrupted: replayable) or a failure record.
//  - An exception escaping the gate's playDuel is caught: errors/job-<i>.json (message, stack) + STOP, exit code 3.
//  - STOP is checked before every claim and while waiting at the Stage-A barrier; the supervisor kills running shards as
//    soon as STOP appears (a running duel can't poll it).
// Claims (RELAY-047 F2): the claim's full content (job, pid, host, shard, runId, token) is written to a temp file, fsync'd,
// and published with link() (atomic; fails if the claim exists), so a claim is never visible empty.
// Stage-A barrier (RELAY-047 note): a job >= 40 is not started until jobs 0-39 all have clean finished lines.
//
// Usage: (supervisor)   node tools/s2a-split-runner.mjs --out-dir runs/s2a --shard A --run-id <id>
//        reproduction:  node tools/s2a-split-runner.mjs --s2b-repro [--repro-part k/n] --out-dir runs/repro --shard r0
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import os from 'node:os';import {pathToFileURL} from 'node:url';
import {PIN,BLUNDERS,readLines,queueOrder,STAGE_A} from './s2a-common.mjs';
const ROOT=process.cwd();
const a=(k,d)=>{const i=process.argv.indexOf('--'+k);return i>0?process.argv[i+1]:d};const has=k=>process.argv.includes('--'+k);
const STUB=process.env.S2A_TEST_STUB||null;/* adversarial tests only: replaces the gate module; every line it writes is non-counting */
const sha256=b=>crypto.createHash('sha256').update(b).digest('hex'),sha1=b=>crypto.createHash('sha1').update(b).digest('hex'),rd=f=>fs.readFileSync(path.resolve(ROOT,f));
const nonCounting=has('non-counting')||!!STUB;
const fsyncWrite=(file,text,flag='w')=>{const fd=fs.openSync(file,flag);fs.writeSync(fd,text);fs.fsyncSync(fd);fs.closeSync(fd)};
const iso=()=>{const d=new Date(),o=-d.getTimezoneOffset(),p=n=>String(Math.floor(Math.abs(n))).padStart(2,'0');return new Date(d.getTime()+o*60000).toISOString().slice(0,19)+(o>=0?'+':'-')+p(o/60)+':'+p(o%60)};
// ---- identity (refuse on any difference)
const src=STUB?'':rd('tests/ai-gate.mjs').toString('utf8'),CUT='async function main() {',at=src.indexOf(CUT),prefix=STUB?'':src.slice(0,at);
const ident=STUB?{frozen:PIN.frozen,engineSha1:PIN.engineSha1,prefixSha256:PIN.prefixSha256,version:PIN.version,stub:true}:{frozen:Object.fromEntries(Object.keys(PIN.frozen).map(f=>[f,sha256(rd(f))])),engineSha1:Object.fromEntries(Object.keys(PIN.engineSha1).map(f=>[f,sha1(rd(f))])),prefixSha256:sha256(prefix),version:JSON.parse(rd('package.json')).version};
const bad=[];
if(!STUB){if(at<0)bad.push('cut marker not found');
 for(const [f,h] of Object.entries(PIN.frozen))if(ident.frozen[f]!==h)bad.push(f+' sha256 '+ident.frozen[f]);
 for(const [f,h] of Object.entries(PIN.engineSha1))if(ident.engineSha1[f]!==h)bad.push(f+' sha1 '+ident.engineSha1[f]);
 if(ident.prefixSha256!==PIN.prefixSha256)bad.push('gate prefix sha256 '+ident.prefixSha256);if(ident.version!==PIN.version)bad.push('version '+ident.version);
 if(process.version!==PIN.node&&!nonCounting)bad.push('node '+process.version)}
for(const k of ['budget','random-seeds','engine','stage','duels','whitelist','candidate','auditor-seed','baseline','out'])if(has(k))bad.push('--'+k+' is fixed by the plan and may not be passed');
console.log('IDENTITY '+JSON.stringify({...ident,node:process.version,budget:PIN.budget,randomSeeds:0,engine:'snapshot'}));
if(bad.length){console.error('REFUSED: '+bad.join('; '));process.exit(2)}
// ---- out-dir state and fail-closed scan (before any claim)
const outDir=path.resolve(ROOT,a('out-dir','runs/s2a')),shard=a('shard','A'),runId=a('run-id',null),repro=has('s2b-repro');
for(const d of ['claims','errors'])fs.mkdirSync(path.join(outDir,d),{recursive:true});
const STOP=path.join(outDir,'STOP'),linesFile=path.join(outDir,'jobs-shard'+shard+'.jsonl'),logFile=path.join(outDir,'shard'+shard+'.log');
const log=s=>{const t=new Date().toISOString()+' '+s;fs.appendFileSync(logFile,t+'\n');console.log(t)};
const writeStop=rec=>{try{fsyncWrite(STOP,JSON.stringify(rec,null,1)+'\n','wx')}catch{fsyncWrite(STOP,JSON.stringify(rec)+'\n','a')}};
function failClosedScan(){
 const lines=readLines(outDir),failed=lines.filter(r=>r.__bad||BLUNDERS.some(k=>!Array.isArray(r[k])||r[k].length)),errs=fs.readdirSync(path.join(outDir,'errors'));
 if(failed.length||errs.length){if(!fs.existsSync(STOP))writeStop({restoredAt:iso(),by:'startup scan',failedLines:failed.map(r=>({job:r.job,seed:r.seed,file:r.__file,line:r.__line})),errorRecords:errs});return true}
 return fs.existsSync(STOP);
}
if(!repro&&!runId){console.error('REFUSED: counting shards are started by tools/s2a-supervisor.mjs (--run-id missing)');process.exit(2)}
if(!repro&&failClosedScan()){console.error('REFUSED: STOP / failure record present in '+outDir);process.exit(4)}
// ---- gate module: verbatim prefix + driver (or the test stub)
const DRIVER=`
// ---- split-runner driver (not part of the frozen gate) ----
export async function __splitInit(){
  await load(); const wlRaw = fs.readFileSync(path.resolve(ROOT, WL_PATH), 'utf8'); WL = JSON.parse(wlRaw);
  const cand = await imp(CANDIDATE), rawMake = cand.createOptimalPilots; if (!rawMake) throw Error(CANDIDATE + ' must export createOptimalPilots');
  const make = withEngine(rawMake, ENGINE);
  return {make, STAGE, DUELS, BUDGET, RANDOM_SEEDS, ENGINE, WL_PATH, CANDIDATE, ACCEPT_SEEDS};
}
export const __schedule = n => schedule(n);
export const __playDuel = (job, make) => playDuel(job, [make, make]);
export const __rootQuality = () => rootQuality;
`;
let G;if(STUB)G=await import(pathToFileURL(path.resolve(STUB)).href);
else{const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'s2a-split-'));const gen=path.join(tmp,'gate-prefix-plus-driver.mjs');fs.writeFileSync(gen,prefix+DRIVER);G=await import(pathToFileURL(gen).href)}
const init=await G.__splitInit();
if(init.STAGE!=='S2a'||init.DUELS!==200||init.BUDGET!==PIN.budget||init.RANDOM_SEEDS!==0||init.ENGINE!=='snapshot'||init.WL_PATH!=='tests/self-target-whitelist.json'||init.CANDIDATE!=='dist/optimal-pilot.mjs'){console.error('REFUSED: gate defaults differ');process.exit(2)}
// ---- queue
const sched=G.__schedule(200);let jobs;
if(repro){jobs=init.ACCEPT_SEEDS.map((seed,i)=>({index:'s2b-'+i,job:{seed,a:0,b:[1,2,3,0][i%4],first:i%2}}));/* S2b's own job definitions */
 if(has('repro-part')){const [k,n]=a('repro-part').split('/').map(Number);jobs=jobs.filter((_,i)=>i%n===k)}}
else{let order=queueOrder();if(new Set(order).size!==200||order.some(i=>!Number.isInteger(i)||i<0||i>199))throw Error('queue does not cover 0-199 exactly once');
 if(has('jobs')){order=a('jobs').split(',').map(Number);if(!order.length||new Set(order).size!==order.length||order.some(i=>!Number.isInteger(i)||i<0||i>199)){console.error('REFUSED: --jobs must be unique integers 0-199');process.exit(2)}}
 jobs=order.map(i=>({index:i,job:sched[i]}))}
// ---- atomic claim (content published with link(); never visible empty)
function claim(i){const dst=path.join(outDir,'claims',String(i)),token=crypto.randomBytes(8).toString('hex'),tmp=path.join(outDir,'claims','.tmp-'+process.pid+'-'+token);
 fsyncWrite(tmp,JSON.stringify({job:i,pid:process.pid,host:os.hostname(),shard,runId,token,at:iso()}),'wx');
 try{fs.linkSync(tmp,dst);return true}catch(e){if(e.code==='EEXIST')return false;throw e}finally{fs.unlinkSync(tmp)}}
const stageADone=()=>{const clean=new Set(readLines(outDir).filter(r=>!r.__bad&&BLUNDERS.every(k=>Array.isArray(r[k])&&!r[k].length)).map(r=>r.job));return STAGE_A.every(j=>clean.has(j))};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
log('shard '+shard+' start; run '+runId+'; prefixSha256 '+ident.prefixSha256+'; jobs '+jobs.length+(repro?' (S2b repro)':'')+(nonCounting?' NON-COUNTING':''));
for(const {index,job} of jobs){
 if(!repro&&fs.existsSync(STOP)){log('STOP present; shard '+shard+' stops');break}
 if(!repro&&fs.existsSync(path.join(outDir,'claims',String(index))))continue;
 if(!repro&&index>=40){while(!stageADone()){if(fs.existsSync(STOP)){log('STOP present while waiting at the Stage-A barrier');process.exit(0)}await sleep(Number(process.env.S2A_BARRIER_POLL_MS||30000))}}
 if(!repro&&!claim(index))continue;
 const rqBefore=G.__rootQuality().length,start=iso(),t0=Date.now();
 log('job '+index+' seed '+job.seed+' a'+job.a+' b'+job.b+' f'+job.first+' start');
 let m;
 try{m=await G.__playDuel(job,init.make)}
 catch(e){const rec={job:index,seed:job.seed,a:job.a,b:job.b,first:job.first,shard,runId,at:iso(),kind:'execution-error',message:String(e?.message||e),stack:String(e?.stack||'')};
  if(!repro){fsyncWrite(path.join(outDir,'errors','job-'+index+'.json'),JSON.stringify(rec,null,1),'wx');writeStop(rec)}log('EXECUTION ERROR job '+index+': '+rec.message);process.exit(3)}
 const roots=G.__rootQuality().slice(rqBefore);
 const line={job:index,seed:m.seed,pair:m.pair,first:m.first,a:job.a,b:job.b,hash:m.hash,decisions:m.decisions,searched:m.searched,finished:m.finished,winner:m.winner,turns:m.turns,retries:m.retries,
  ownHarmWithOppTarget:m.ownHarmWithOppTarget,nonWhitelistedOwn:m.nonWhitelistedOwn,cutShortTurns:m.cutShortTurns,throws:m.throws,stalls:m.stalls,forcedOwnUnlogged:m.forcedOwnUnlogged,forcedOwnPicks:m.forcedOwnPicks,
  rootQuality:roots,shard,runId,start,end:iso(),wallSec:Math.round((Date.now()-t0)/1000),frozen:ident.frozen,engineSha1:ident.engineSha1,prefixSha256:ident.prefixSha256,node:process.version,budget:PIN.budget,randomSeeds:0,engine:'snapshot',version:ident.version,
  host:{name:os.hostname(),cpus:os.cpus().length,model:os.cpus()[0]?.model,memGB:Math.round(os.totalmem()/1073741824)},nonCounting:nonCounting||undefined,s2bRepro:repro||undefined};
 const hit=BLUNDERS.filter(k=>m[k].length);
 if(hit.length&&!repro){const rec={job:index,seed:m.seed,pair:m.pair,first:m.first,shard,runId,at:iso(),kind:'blunder',counts:Object.fromEntries(BLUNDERS.map(k=>[k,m[k].length])),sample:hit.map(k=>({kind:k,entry:m[k][0]}))};
  fsyncWrite(path.join(outDir,'errors','job-'+index+'.json'),JSON.stringify(rec,null,1),'wx');writeStop(rec)}/* failure record + STOP BEFORE the line */
 if(STUB&&process.env.S2A_TEST_CRASH_BEFORE_LINE)process.exit(9);/* adversarial test hook (stub runs only) */
 fsyncWrite(linesFile,JSON.stringify(line)+'\n','a');
 log(`seed ${m.seed} ${m.pair.join('-')} f${m.first}: own=${m.nonWhitelistedOwn.length} harmOpp=${m.ownHarmWithOppTarget.length} cut=${m.cutShortTurns.length} throw=${m.throws.length} stall=${m.stalls.length} hash=${String(m.hash).slice(0,8)} decisions=${m.decisions} roots=${roots.length}`);
 if(hit.length&&!repro){log('BLUNDER -> STOP '+hit.join(','));break}
}
if(repro){const rows=readLines(outDir).filter(r=>r.s2bRepro),roots=rows.flatMap(r=>r.rootQuality);
 log('S2B-REPRO '+rows.map(r=>r.seed+' '+r.pair.join('-')+' f'+r.first+' '+r.hash.slice(0,8)+' '+r.decisions).join(' | ')+' || roots '+roots.length+' full16 '+roots.filter(r=>r.status==='full').length+' fallback '+roots.filter(r=>r.status==='fallback').length+' unlogged '+roots.filter(r=>r.status!=='full'&&!r.logged).length)}
log('shard '+shard+' end');

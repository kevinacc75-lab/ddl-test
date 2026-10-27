#!/usr/bin/env node
// S2a split runner (Claude, 27 Oct 2026; Kevy-approved plan in "HANDOVER - Seto to Claude - 2026-10-27 - S2a split-run
// plan"). Plays S2a jobs of the FROZEN tests/ai-gate.mjs one duel at a time, in a separate node process per shard, and
// writes one JSON line per finished job. It does not edit or re-implement the gate's duel logic:
//
//   1. It reads tests/ai-gate.mjs, checks its sha256 (1c380d58…), and cuts the file at the first occurrence of
//      "async function main() {". Everything BEFORE that cut (imports, argument parsing, constants, load, withEngine,
//      seedList, schedule, playDuel, ownTrace, `let WL = {};const rootQuality=[];`) is used byte-for-byte.
//   2. It appends a small driver (DRIVER below) to that verbatim prefix, writes the result to a temporary .mjs file and
//      imports it. The driver repeats main()'s first three statements (load, read whitelist, WL = JSON.parse) and
//      main()'s `make = withEngine(rawMake, ENGINE)`, then plays the requested job indices with the gate's own
//      schedule(200) and playDuel(job, [make, make]). Nothing else in the gate is changed or bypassed.
//   3. Before any duel it refuses to run unless: ai-gate.mjs, the whitelist and dist/ai/world-pool.mjs have the frozen
//      sha256s; the engine files' sha1 prefixes match Seto's S2b JSON; Node is v22.22.2; budget 400; random-seeds 0;
//      engine snapshot. (--non-counting allows another Node for dry runs; such lines are stamped and the recombine
//      refuses them.)
//
// Job queue: shards share a claim directory. A shard claims job i by creating claims/i with O_EXCL; the order is the
// Kevy-approved risk order (stage A: jobs 0-39 so every cell reaches 2 duels; stage B: cells 0-3 and 8-9 first, then the
// rest). The order can't change a result: each job is a fresh Duel, and world-pool has one active duel per module
// instance (one duel at a time per process; shards are separate processes).
// Fail-fast: any nonzero blunder array, throw or stall writes STOP (seed, job, decision, sample) and every shard stops
// claiming new jobs.
//
// Usage (from the gate tree root):
//   node tools/s2a-split-runner.mjs --out-dir runs/s2a --shard 1            (claims jobs until none are left or STOP)
//   node tools/s2a-split-runner.mjs --out-dir runs/s2a --shard 1 --jobs 0,1 (only these indices)
//   node tools/s2a-split-runner.mjs --s2b-repro --out-dir runs/repro          (S2b's 8 job definitions, one pass each)
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import os from 'node:os';import {pathToFileURL} from 'node:url';
const ROOT=process.cwd();
const a=(k,d)=>{const i=process.argv.indexOf('--'+k);return i>0?process.argv[i+1]:d};const has=k=>process.argv.includes('--'+k);
const FROZEN={'tests/ai-gate.mjs':'1c380d58afc51f07ce76615d4b5cd8f185e7675de19b3fea72e1950088a14dee','tests/self-target-whitelist.json':'9f1fb5f5487ea60ea7afdc3aac624c269608510e4cdab598878c2ec86bae0ee3','dist/ai/world-pool.mjs':'807133d3049dc7af690042b258d7bba8f7e2672c8e908af27605ed1bb4b000b8'};
const ENGINE_SHA1={'dist/ai/engine-snapshot.mjs':'64a4b25a','dist/ai/info-set.mjs':'9337e197','dist/ai/determinize.mjs':'f81fee91'};
const NODE='v22.22.2',BUDGET=400;
const sha256=f=>crypto.createHash('sha256').update(fs.readFileSync(path.resolve(ROOT,f))).digest('hex'),sha1=f=>crypto.createHash('sha1').update(fs.readFileSync(path.resolve(ROOT,f))).digest('hex');
const nonCounting=has('non-counting');
// --- start-up identity checks (refuse on any difference)
const ident={frozen:Object.fromEntries(Object.keys(FROZEN).map(f=>[f,sha256(f)])),engineSha1:Object.fromEntries(Object.keys(ENGINE_SHA1).map(f=>[f,sha1(f)])),node:process.version,budget:BUDGET,randomSeeds:0,engine:'snapshot',stage:'S2a',version:JSON.parse(fs.readFileSync(path.resolve(ROOT,'package.json'))).version};
const bad=[];for(const [f,h] of Object.entries(FROZEN))if(ident.frozen[f]!==h)bad.push(f+' sha256 '+ident.frozen[f]+' != '+h);
for(const [f,p] of Object.entries(ENGINE_SHA1))if(!ident.engineSha1[f].startsWith(p))bad.push(f+' sha1 '+ident.engineSha1[f]+' does not start with '+p);
if(process.version!==NODE&&!nonCounting)bad.push('node '+process.version+' != '+NODE);
for(const k of ['budget','random-seeds','engine','stage','duels','whitelist','candidate'])if(has(k))bad.push('--'+k+' is fixed by the plan and may not be passed');
console.log('IDENTITY '+JSON.stringify(ident));
if(bad.length){console.error('REFUSED: '+bad.join('; '));process.exit(2)}
// --- build the module: verbatim frozen prefix + driver
const src=fs.readFileSync(path.resolve(ROOT,'tests/ai-gate.mjs'),'utf8'),CUT='async function main() {',at=src.indexOf(CUT);
if(at<0)throw Error('cut marker not found');const prefix=src.slice(0,at);
const prefixSha=crypto.createHash('sha256').update(prefix).digest('hex');
const DRIVER=`
// ---- split-runner driver (not part of the frozen gate) ----
export async function __splitInit(){
  await load(); const wlRaw = fs.readFileSync(path.resolve(ROOT, WL_PATH), 'utf8'); WL = JSON.parse(wlRaw);
  const cand = await imp(CANDIDATE), rawMake = cand.createOptimalPilots; if (!rawMake) throw Error(CANDIDATE + ' must export createOptimalPilots');
  const make = withEngine(rawMake, ENGINE);
  return {make, wlRaw, STAGE, DUELS, BUDGET, RANDOM_SEEDS, ENGINE, WL_PATH, CANDIDATE, ACCEPT_SEEDS};
}
export const __schedule = n => schedule(n);
export const __playDuel = (job, make) => playDuel(job, [make, make]);
export const __rootQuality = () => rootQuality;
`;
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'s2a-split-'));const gen=path.join(tmp,'gate-prefix-plus-driver.mjs');fs.writeFileSync(gen,prefix+DRIVER);
const G=await import(pathToFileURL(gen).href);
const init=await G.__splitInit();
if(init.STAGE!=='S2a'||init.DUELS!==200||init.BUDGET!==BUDGET||init.RANDOM_SEEDS!==0||init.ENGINE!=='snapshot'||init.WL_PATH!=='tests/self-target-whitelist.json'||init.CANDIDATE!=='dist/optimal-pilot.mjs'){console.error('REFUSED: gate defaults differ '+JSON.stringify(init));process.exit(2)}
const outDir=path.resolve(ROOT,a('out-dir','runs/s2a'));fs.mkdirSync(path.join(outDir,'claims'),{recursive:true});
const shard=a('shard','1'),STOP=path.join(outDir,'STOP');
const linesFile=path.join(outDir,'jobs-shard'+shard+'.jsonl'),logFile=path.join(outDir,'shard'+shard+'.log');
const log=s=>{const t=new Date().toISOString()+' '+s;fs.appendFileSync(logFile,t+'\n');console.log(t)};
const writeLine=o=>{const fd=fs.openSync(linesFile,'a');fs.writeSync(fd,JSON.stringify(o)+'\n');fs.fsyncSync(fd);fs.closeSync(fd)};
const iso=()=>{const d=new Date(),o=-d.getTimezoneOffset(),p=n=>String(Math.floor(Math.abs(n))).padStart(2,'0');return new Date(d.getTime()+o*60000).toISOString().slice(0,19)+(o>=0?'+':'-')+p(o/60)+':'+p(o%60)};
// --- job list
let jobs,repro=has('s2b-repro');
if(repro)jobs=init.ACCEPT_SEEDS.map((seed,i)=>({index:'s2b-'+i,job:{seed,a:0,b:[1,2,3,0][i%4],first:i%2}}));/* S2b's own job definitions (ai-gate.mjs, S2b branch) */
if(repro&&has('repro-part')){const [k,n]=a('repro-part').split('/').map(Number);jobs=jobs.filter((_,i)=>i%n===k)}/* split the 8 S2b jobs across processes for speed; each job is still one fresh duel */
else{const sched=G.__schedule(200);
 const A=[0,20,1,21, 2,22,3,23, 8,28,9,29, 4,24,5,25, 10,30,11,31, 14,34,15,35, 16,36,17,37, 6,26,7,27, 12,32,13,33, 18,38,19,39];
 const firstCells=[0,1,2,3,8,9],B=[];for(let k=2;k<10;k++)for(const c of firstCells)B.push(c+20*k);for(let k=2;k<10;k++)for(let c=0;c<20;c++)if(!firstCells.includes(c))B.push(c+20*k);
 let order=[...A,...B];if(new Set(order).size!==200||order.some(i=>i<0||i>199))throw Error('queue does not cover 0-199 exactly once');
 if(has('jobs'))order=a('jobs').split(',').map(Number);
 jobs=order.map(i=>({index:i,job:sched[i]}));}
// --reclaim-stale: a claim with no finished line whose owner process is gone (machine slept or restarted) is released so
// the job can be played again from the start. Logged in reclaims.log; the recombine still sees exactly one line per job.
if(has('reclaim-stale')&&!repro){const done=new Set(fs.readdirSync(outDir).filter(f=>/^jobs-shard.*\.jsonl$/.test(f)).flatMap(f=>fs.readFileSync(path.join(outDir,f),'utf8').split('\n').filter(Boolean).map(t=>JSON.parse(t).job)));
 for(const c of fs.readdirSync(path.join(outDir,'claims'))){if(done.has(Number(c)))continue;let info={};try{info=JSON.parse(fs.readFileSync(path.join(outDir,'claims',c),'utf8'))}catch{}
  let alive=false;if(info.host===os.hostname()&&info.pid){try{process.kill(info.pid,0);alive=true}catch{}}
  if(!alive){fs.unlinkSync(path.join(outDir,'claims',c));fs.appendFileSync(path.join(outDir,'reclaims.log'),iso()+' job '+c+' reclaimed (owner '+JSON.stringify(info)+' not running; no finished line)\n')}}}
log('shard '+shard+' start; prefixSha256 '+prefixSha+'; jobs '+jobs.length+(repro?' (S2b repro)':'')+(nonCounting?' NON-COUNTING':''));
const BLUNDERS=['ownHarmWithOppTarget','nonWhitelistedOwn','cutShortTurns','throws','stalls','forcedOwnUnlogged'];
for(const {index,job} of jobs){
 if(fs.existsSync(STOP)){log('STOP present; shard '+shard+' stops claiming');break}
 if(!repro){try{const fd=fs.openSync(path.join(outDir,'claims',String(index)),'wx');fs.writeSync(fd,JSON.stringify({pid:process.pid,host:os.hostname(),shard,at:iso()}));fs.closeSync(fd)}catch{continue}}/* claimed by another shard */
 const rqBefore=G.__rootQuality().length,start=iso(),t0=Date.now();
 log('job '+index+' seed '+job.seed+' a'+job.a+' b'+job.b+' f'+job.first+' start');
 const m=await G.__playDuel(job,init.make);
 const roots=G.__rootQuality().slice(rqBefore);
 const line={job:index,seed:m.seed,pair:m.pair,first:m.first,a:job.a,b:job.b,hash:m.hash,decisions:m.decisions,searched:m.searched,finished:m.finished,winner:m.winner,turns:m.turns,retries:m.retries,
  ownHarmWithOppTarget:m.ownHarmWithOppTarget,nonWhitelistedOwn:m.nonWhitelistedOwn,cutShortTurns:m.cutShortTurns,throws:m.throws,stalls:m.stalls,forcedOwnUnlogged:m.forcedOwnUnlogged,forcedOwnPicks:m.forcedOwnPicks,
  rootQuality:roots,shard,start,end:iso(),wallSec:Math.round((Date.now()-t0)/1000),frozen:ident.frozen,engineSha1:ident.engineSha1,prefixSha256:prefixSha,node:process.version,budget:BUDGET,randomSeeds:0,engine:'snapshot',version:ident.version,host:{cpus:os.cpus().length,model:os.cpus()[0]?.model,memGB:Math.round(os.totalmem()/1073741824)},
  nonCounting:nonCounting||undefined,s2bRepro:repro||undefined};
 writeLine(line);
 // same per-duel summary line as the frozen gate's S2a loop
 log(`seed ${m.seed} ${m.pair.join('-')} f${m.first}: own=${m.nonWhitelistedOwn.length} harmOpp=${m.ownHarmWithOppTarget.length} cut=${m.cutShortTurns.length} throw=${m.throws.length} stall=${m.stalls.length} hash=${m.hash.slice(0,8)} decisions=${m.decisions} roots=${roots.length}`);
 const hit=BLUNDERS.filter(k=>m[k].length);
 if(hit.length&&!repro){const s={job:index,seed:m.seed,pair:m.pair,first:m.first,shard,counts:Object.fromEntries(BLUNDERS.map(k=>[k,m[k].length])),sample:hit.map(k=>({kind:k,entry:m[k][0]}))};
  try{fs.writeFileSync(STOP,JSON.stringify(s,null,1),{flag:'wx'})}catch{fs.appendFileSync(STOP,'\n'+JSON.stringify(s))}log('BLUNDER -> STOP '+JSON.stringify(s.counts));break}
}
if(repro){const rows=fs.readdirSync(outDir).filter(f=>/^jobs-shard.*\.jsonl$/.test(f)).flatMap(f=>fs.readFileSync(path.join(outDir,f),'utf8').trim().split('\n').filter(Boolean).map(JSON.parse)).filter(r=>r.s2bRepro);const roots=rows.flatMap(r=>r.rootQuality);
 const full=roots.filter(r=>r.status==='full').length,fb=roots.filter(r=>r.status==='fallback').length,unl=roots.filter(r=>r.status!=='full'&&!r.logged).length;
 log('S2B-REPRO '+rows.map(r=>r.seed+' '+r.pair.join('-')+' f'+r.first+' '+r.hash.slice(0,8)+' '+r.decisions).join(' | ')+' || roots '+roots.length+' full16 '+full+' fallback '+fb+' unlogged '+unl)}
log('shard '+shard+' end');

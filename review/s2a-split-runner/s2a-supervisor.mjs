#!/usr/bin/env node
// S2a supervisor (Claude, 28 Oct 2026; RELAY-047 F1/F2). The only way counting shards are started.
//  1. Single instance: supervisor.lock holds {pid, host, runId, cmd}; a second supervisor exits if the first is alive.
//  2. Refuses to start if STOP exists, any errors/ record exists, or any finished line has a blunder or is unreadable.
//  3. Serialized stale-claim recovery, BEFORE any worker starts (no worker ever reclaims):
//     a claim with no finished line is released only if its owner is provably dead on THIS host: same hostname, and
//     its pid is not running, or is running but its command line is not a split runner with that claim's run id.
//     Malformed or empty claims, or claims from another host, are not assumed dead: the supervisor refuses to start and
//     logs them for review. Released claims are MOVED to claims-stale/<job>.<time> (kept as evidence) and logged in
//     reclaims.log. A job with an errors/ record is never released.
//  4. Starts N shard processes with a fresh run id, and watches every 10 s: if STOP appears it SIGKILLs every shard (a
//     running duel can't poll STOP) and logs it. Exits when the shards exit.
//   node tools/s2a-supervisor.mjs --out-dir runs/s2a --shards 2 --node <path to node v22.22.2>
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import os from 'node:os';import {spawn} from 'node:child_process';
import {BLUNDERS,readLines} from './s2a-common.mjs';
const ROOT=process.cwd();const a=(k,d)=>{const i=process.argv.indexOf('--'+k);return i>0?process.argv[i+1]:d};
const outDir=path.resolve(ROOT,a('out-dir','runs/s2a')),N=Number(a('shards','2')),NODE=a('node',process.execPath),runId=new Date().toISOString().replace(/[:.]/g,'')+'-'+crypto.randomBytes(3).toString('hex');
for(const d of ['claims','errors','claims-stale'])fs.mkdirSync(path.join(outDir,d),{recursive:true});
const slog=s=>{const t=new Date().toISOString()+' '+s;fs.appendFileSync(path.join(outDir,'supervisor.log'),t+'\n');console.log(t)};
const alive=pid=>{try{process.kill(pid,0);return true}catch{return false}};
const cmdline=pid=>{try{return fs.readFileSync('/proc/'+pid+'/cmdline','utf8').split('\0').join(' ')}catch{return ''}};
// 1. single instance
const lockFile=path.join(outDir,'supervisor.lock');
try{const l=JSON.parse(fs.readFileSync(lockFile,'utf8'));if(l.host===os.hostname()&&alive(l.pid)&&cmdline(l.pid).includes('s2a-supervisor.mjs')){slog('another supervisor is running (pid '+l.pid+', run '+l.runId+'); exiting');process.exit(0)}}catch{}
fs.writeFileSync(lockFile,JSON.stringify({pid:process.pid,host:os.hostname(),runId,at:new Date().toISOString()}));
// 2. refuse on any failure evidence
const lines=readLines(outDir),failed=lines.filter(r=>r.__bad||BLUNDERS.some(k=>!Array.isArray(r[k])||r[k].length)),errs=fs.readdirSync(path.join(outDir,'errors'));
if(fs.existsSync(path.join(outDir,'STOP'))||failed.length||errs.length){slog('REFUSED: STOP / failure evidence present (failed lines '+failed.length+', error records '+errs.length+'); fix-and-review needed');process.exit(4)}
// 3. serialized stale-claim recovery
const done=new Set(lines.map(r=>r.job)),review=[];
for(const c of fs.readdirSync(path.join(outDir,'claims')).filter(f=>!f.startsWith('.'))){const job=Number(c);if(done.has(job))continue;
 let info=null;try{info=JSON.parse(fs.readFileSync(path.join(outDir,'claims',c),'utf8'))}catch{}
 if(!info||info.job!==job||!info.pid||!info.runId||!info.host){review.push(c+': malformed/empty claim');continue}
 if(info.host!==os.hostname()){review.push(c+': claimed on another host '+info.host);continue}
 const live=alive(info.pid)&&cmdline(info.pid).includes('s2a-split-runner.mjs')&&cmdline(info.pid).includes(info.runId);
 if(live){review.push(c+': owner still running (pid '+info.pid+')');continue}
 const dst=path.join(outDir,'claims-stale',c+'.'+Date.now());fs.renameSync(path.join(outDir,'claims',c),dst);
 fs.appendFileSync(path.join(outDir,'reclaims.log'),new Date().toISOString()+' run '+runId+' released job '+c+' (owner '+JSON.stringify(info)+' not running; no finished line; no error record) -> '+path.basename(dst)+'\n')}
for(const t of fs.readdirSync(path.join(outDir,'claims')).filter(f=>f.startsWith('.tmp-'))){const pid=Number(t.split('-')[1]);if(!alive(pid))fs.unlinkSync(path.join(outDir,'claims',t))}/* temp files of a dead claimer: never a published claim */
if(review.length){slog('REFUSED: claims need review: '+review.join('; '));process.exit(5)}
// 4. start shards and watch STOP
const kids=[];slog('run '+runId+' starting '+N+' shards with '+NODE);
for(let i=0;i<N;i++){const id=String.fromCharCode(65+i);const out=fs.openSync(path.join(outDir,'shard'+id+'.stdout'),'a');
 const k=spawn(NODE,[path.join(ROOT,'tools/s2a-split-runner.mjs'),'--out-dir',outDir,'--shard',id,'--run-id',runId],{cwd:ROOT,stdio:['ignore',out,out],env:process.env});
 kids.push(k);k.on('exit',(code,sig)=>slog('shard '+id+' exited code '+code+(sig?' signal '+sig:'')))}
const timer=setInterval(()=>{if(fs.existsSync(path.join(outDir,'STOP'))){slog('STOP seen: killing all shards');for(const k of kids)if(k.exitCode===null)try{k.kill('SIGKILL')}catch{}}},Number(process.env.S2A_SUPERVISOR_POLL_MS||10000));
await Promise.all(kids.map(k=>new Promise(r=>k.exitCode!==null?r():k.on('exit',r))));clearInterval(timer);
try{const l=JSON.parse(fs.readFileSync(lockFile,'utf8'));if(l.pid===process.pid)fs.unlinkSync(lockFile)}catch{}
slog('run '+runId+' ended');

#!/usr/bin/env node
// S2a supervisor, rev 3 (Claude, 28 Oct 2026; RELAY-047 F1/F2, RELAY-049 R2-01/R2-02). The only way counting shards start.
//  1. Exclusive ownership (R2-01): the supervisor re-executes itself under the kernel lock `flock -n <out-dir>/supervisor.flock`.
//     The kernel grants it to one process tree only and releases it only when every holder is gone (the supervisor AND any
//     shard it started is handed the locked descriptor as fd 3), so there is no stale-lock guess and no check-then-write race. A second supervisor
//     gets "busy" and exits 6. Inside, the lock is re-tested (a fresh flock attempt must report busy) before anything else;
//     if flock(1) is missing or the lock can't be confirmed, the supervisor refuses (exit 6). supervisor.owner is information
//     only, never used for decisions.
//  2. Refuses to start if STOP exists, any errors/ record exists, or any finished line has a blunder or is unreadable.
//  3. Serialized stale-claim recovery, BEFORE any worker starts (no worker ever reclaims; the kernel lock makes this the only
//     recovery owner). Owner state is one of four (R2-02):
//       dead     kill(pid,0) fails with ESRCH, or /proc/<pid>/stat shows Z/X (exited, unreaped) -> released
//       reused   pid alive, /proc/<pid>/cmdline READ OK and it is not a split runner with that claim's run id -> released
//       live     pid alive, cmdline read OK and it is that run's split runner  -> refuse for review
//       unknown  kill fails with anything but ESRCH (e.g. EPERM), or stat/cmdline can't be read, or cmdline is empty -> refuse for review
//     Malformed or empty claims and claims from another host are also refused for review (exit 5). Released claims are
//     MOVED to claims-stale/<job>.<time> (kept as evidence) and logged in reclaims.log. A job with an errors/ record is
//     never released.
//  4. Starts N shard processes with a fresh run id, and watches STOP (every 10 s): if STOP appears it SIGKILLs every shard
//     (a running duel can't poll it) and logs it. Exits when the shards exit.
//   node tools/s2a-supervisor.mjs --out-dir runs/s2a --shards 2 --node <path to node v22.22.2>
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import os from 'node:os';import {spawn,spawnSync} from 'node:child_process';import {fileURLToPath} from 'node:url';
import {BLUNDERS,readLines} from './s2a-common.mjs';
const ROOT=process.cwd();const a=(k,d)=>{const i=process.argv.indexOf('--'+k);return i>0?process.argv[i+1]:d};
const outDir=path.resolve(ROOT,a('out-dir','runs/s2a')),N=Number(a('shards','2')),NODE=a('node',process.execPath),runId=new Date().toISOString().replace(/[:.]/g,'')+'-'+crypto.randomBytes(3).toString('hex');
for(const d of ['claims','errors','claims-stale'])fs.mkdirSync(path.join(outDir,d),{recursive:true});
const slog=s=>{const t=new Date().toISOString()+' '+s;fs.appendFileSync(path.join(outDir,'supervisor.log'),t+'\n');console.log(t)};
// Owner state (R2-02): 'dead' | 'live' | 'reused' | 'unknown'. Only a positive observation counts; any failure is 'unknown'.
// Test injection (honoured only with S2A_TEST_STUB set): S2A_TEST_KILL_ERROR=<code>, S2A_TEST_PROC_ERROR=<code>.
const TEST=!!process.env.S2A_TEST_STUB,inj=k=>TEST?process.env[k]||null:null;
function ownerState(pid,needles){
 try{const ke=inj('S2A_TEST_KILL_ERROR');if(ke)throw Object.assign(Error('injected'),{code:ke});process.kill(pid,0)}catch(e){return e.code==='ESRCH'?'dead':'unknown'}
 try{const pe=inj('S2A_TEST_PROC_ERROR');if(pe)throw Object.assign(Error('injected'),{code:pe});const st=fs.readFileSync('/proc/'+pid+'/stat','utf8'),state=st.slice(st.lastIndexOf(')')+2,st.lastIndexOf(')')+3);if(state==='Z'||state==='X')return 'dead'/* zombie: exited, not yet reaped */}catch{return 'unknown'}
 let cmd;try{const pe=inj('S2A_TEST_PROC_ERROR');if(pe)throw Object.assign(Error('injected'),{code:pe});cmd=fs.readFileSync('/proc/'+pid+'/cmdline','utf8').split('\0').join(' ').trim()}catch{return 'unknown'}
 if(!cmd)return 'unknown';return needles.every(n=>cmd.includes(n))?'live':'reused'}
// 1. exclusive ownership via the kernel lock (R2-01)
const flockFile=path.join(outDir,'supervisor.flock'),BUSY=75;
const flockBusy=()=>{const r=spawnSync('flock',['-n','-E',String(BUSY),flockFile,'true']);if(r.error)return null;return r.status===BUSY?true:r.status===0?false:null};
if(process.env.S2A_SUP_LOCKED!==flockFile){
 const r=spawnSync('flock',['-n','-E',String(BUSY),flockFile,process.execPath,fileURLToPath(import.meta.url),...process.argv.slice(2)],{cwd:ROOT,stdio:'inherit',env:{...process.env,S2A_SUP_LOCKED:flockFile}});
 if(r.error){slog('REFUSED: flock(1) not available ('+r.error.code+'); exclusive ownership cannot be established');process.exit(6)}
 if(r.status===BUSY){slog('REFUSED: another supervisor (or shards it started) holds '+flockFile+'; exiting');process.exit(6)}
 process.exit(r.status??1)}
const lockFd=()=>{try{const real=fs.realpathSync(flockFile);const n=fs.readdirSync('/proc/self/fd').find(n=>{try{return fs.readlinkSync('/proc/self/fd/'+n)===real}catch{return false}});return n===undefined?null:Number(n)}catch{return null}};
const holdsFd=()=>lockFd()!==null;
if(flockBusy()!==true||!holdsFd()){slog('REFUSED: running as the locked supervisor but '+flockFile+' is not confirmed held by this process (busy='+flockBusy()+', fd='+holdsFd()+')');process.exit(6)}
fs.writeFileSync(path.join(outDir,'supervisor.owner'),JSON.stringify({pid:process.pid,host:os.hostname(),runId,at:new Date().toISOString(),note:'information only; ownership is the kernel lock on supervisor.flock'}));
// 2. refuse on any failure evidence
const lines=readLines(outDir),failed=lines.filter(r=>r.__bad||BLUNDERS.some(k=>!Array.isArray(r[k])||r[k].length)),errs=fs.readdirSync(path.join(outDir,'errors'));
if(fs.existsSync(path.join(outDir,'STOP'))||failed.length||errs.length){slog('REFUSED: STOP / failure evidence present (failed lines '+failed.length+', error records '+errs.length+'); fix-and-review needed');process.exit(4)}
// 3. serialized stale-claim recovery
const done=new Set(lines.map(r=>r.job)),review=[];
for(const c of fs.readdirSync(path.join(outDir,'claims')).filter(f=>!f.startsWith('.'))){const job=Number(c);if(done.has(job))continue;
 let info=null;try{info=JSON.parse(fs.readFileSync(path.join(outDir,'claims',c),'utf8'))}catch{}
 if(!info||info.job!==job||!info.pid||!info.runId||!info.host){review.push(c+': malformed/empty claim');continue}
 if(info.host!==os.hostname()){review.push(c+': claimed on another host '+info.host);continue}
 if(!Number.isInteger(info.pid)||info.pid<=0){review.push(c+': bad pid');continue}
 const st=ownerState(info.pid,['s2a-split-runner.mjs',info.runId]);
 if(st==='live'||st==='unknown'){review.push(c+': owner '+st+' (pid '+info.pid+')');continue}
 const dst=path.join(outDir,'claims-stale',c+'.'+Date.now());fs.renameSync(path.join(outDir,'claims',c),dst);
 fs.appendFileSync(path.join(outDir,'reclaims.log'),new Date().toISOString()+' run '+runId+' released job '+c+' (owner '+JSON.stringify(info)+' '+st+'; no finished line; no error record) -> '+path.basename(dst)+'\n')}
for(const t of fs.readdirSync(path.join(outDir,'claims')).filter(f=>f.startsWith('.tmp-'))){const pid=Number(t.split('-')[1]);const st=Number.isInteger(pid)&&pid>0?ownerState(pid,['s2a-split-runner.mjs']):'unknown';if(st==='dead'||st==='reused')fs.unlinkSync(path.join(outDir,'claims',t))}/* temp files of a dead claimer (never a published claim); unknown owners' temp files are left alone */
if(review.length){slog('REFUSED: claims need review: '+review.join('; '));process.exit(5)}
// 4. start shards and watch STOP
const kids=[];slog('run '+runId+' starting '+N+' shards with '+NODE);
for(let i=0;i<N;i++){const id=String.fromCharCode(65+i);const out=fs.openSync(path.join(outDir,'shard'+id+'.stdout'),'a');
 const k=spawn(NODE,[path.join(ROOT,'tools/s2a-split-runner.mjs'),'--out-dir',outDir,'--shard',id,'--run-id',runId],{cwd:ROOT,stdio:['ignore',out,out,lockFd()],env:process.env});/* fd 3 = the locked description: shards share the lock, so orphans block a new supervisor */
 kids.push(k);k.on('exit',(code,sig)=>slog('shard '+id+' exited code '+code+(sig?' signal '+sig:'')))}
const timer=setInterval(()=>{if(fs.existsSync(path.join(outDir,'STOP'))){slog('STOP seen: killing all shards');for(const k of kids)if(k.exitCode===null)try{k.kill('SIGKILL')}catch{}}},Number(process.env.S2A_SUPERVISOR_POLL_MS||10000));
await Promise.all(kids.map(k=>new Promise(r=>k.exitCode!==null?r():k.on('exit',r))));clearInterval(timer);
slog('run '+runId+' ended');

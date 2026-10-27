// Adversarial tests for the S2a split runner rev 2, supervisor and recombine rev 2 (RELAY-047). Uses the test stub (no
// real duels; stub lines are non-counting by construction). Run from the gate tree root:  node tools/s2a-adversarial-test.mjs
import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import crypto from 'node:crypto';import {spawnSync,spawn} from 'node:child_process';import assert from 'node:assert/strict';
import {PIN,BLUNDERS,STAGE_A} from './s2a-common.mjs';
const ROOT=process.cwd(),NODE=process.execPath,STUB=path.join(ROOT,'tools/s2a-test-stub.mjs');
const tmp=()=>fs.mkdtempSync(path.join(os.tmpdir(),'s2a-adv-'));
const run=(args,env={})=>spawnSync(NODE,['tools/s2a-split-runner.mjs',...args],{cwd:ROOT,env:{...process.env,S2A_TEST_STUB:STUB,...env},encoding:'utf8'});
const sup=(args,env={})=>spawnSync(NODE,['tools/s2a-supervisor.mjs',...args],{cwd:ROOT,env:{...process.env,S2A_TEST_STUB:STUB,...env},encoding:'utf8',timeout:120000});
const lines=d=>fs.readdirSync(d).filter(f=>/^jobs-shard.*\.jsonl$/.test(f)).flatMap(f=>fs.readFileSync(path.join(d,f),'utf8').split('\n').filter(Boolean).map(JSON.parse));
const results=[];const ok=async(name,fn)=>{await fn();results.push(name);console.log('PASS '+name)};
// T1 (F1): a completed failed line without STOP blocks every later start; STOP is restored; nothing else is played.
await ok('T1 failed line without STOP: refuse, restore STOP, play nothing',()=>{const d=tmp();fs.mkdirSync(path.join(d,'claims'));fs.writeFileSync(path.join(d,'claims','0'),JSON.stringify({job:0,pid:1,host:os.hostname(),runId:'old',token:'x'}));
 fs.writeFileSync(path.join(d,'jobs-shardA.jsonl'),JSON.stringify({job:0,seed:2026,throws:[{decision:1}],ownHarmWithOppTarget:[],nonWhitelistedOwn:[],cutShortTurns:[],stalls:[],forcedOwnUnlogged:[]})+'\n');
 const r=run(['--out-dir',d,'--shard','B','--run-id','t1','--jobs','0,1']);assert.equal(r.status,4);assert.ok(fs.existsSync(path.join(d,'STOP')));assert.equal(lines(d).length,1)});
// T2 (F1): crash after the failure record and STOP but before the line: the failure is durable and blocks restarts.
await ok('T2 crash between failure record and line: durable, restart refused',()=>{const d=tmp();const r=run(['--out-dir',d,'--shard','A','--run-id','t2','--jobs','0,1'],{S2A_STUB_MODE:'blunder:0',S2A_TEST_CRASH_BEFORE_LINE:'1'});
 assert.equal(r.status,9);assert.ok(fs.existsSync(path.join(d,'errors','job-0.json')));assert.ok(fs.existsSync(path.join(d,'STOP')));assert.equal(lines(d).length,0);
 const r2=run(['--out-dir',d,'--shard','A','--run-id','t2b','--jobs','1']);assert.equal(r2.status,4);assert.equal(lines(d).length,0)});
// T3 (F1): an exception escaping playDuel leaves an error record and STOP (exit 3); the next job is not played.
await ok('T3 execution error: error record + STOP, exit 3',()=>{const d=tmp();const r=run(['--out-dir',d,'--shard','A','--run-id','t3','--jobs','0,1'],{S2A_STUB_MODE:'throw:0'});
 assert.equal(r.status,3);const e=JSON.parse(fs.readFileSync(path.join(d,'errors','job-0.json'),'utf8'));assert.equal(e.kind,'execution-error');assert.ok(fs.existsSync(path.join(d,'STOP')));assert.equal(lines(d).length,0)});
// T4: a blunder in a normal run writes record + STOP before the line, and the shard stops.
await ok('T4 blunder: record + STOP, line kept, shard stops',()=>{const d=tmp();const r=run(['--out-dir',d,'--shard','A','--run-id','t4','--jobs','0,1,2'],{S2A_STUB_MODE:'blunder:1'});
 assert.equal(r.status,0);assert.deepEqual(lines(d).map(x=>x.job),[0,1]);assert.ok(fs.existsSync(path.join(d,'errors','job-1.json')));assert.ok(fs.existsSync(path.join(d,'STOP')))});
// T5 (F2): two shards starting together claim each job exactly once (claims are published atomically with link()).
await ok('T5 concurrent shards: each job exactly once',async()=>{const d=tmp();const jobsArg=Array.from({length:30},(_,i)=>i).join(',');
 const ps=['A','B','C'].map(s=>spawn(NODE,['tools/s2a-split-runner.mjs','--out-dir',d,'--shard',s,'--run-id','t5','--jobs',jobsArg],{cwd:ROOT,env:{...process.env,S2A_TEST_STUB:STUB,S2A_STUB_MODE:'slow:20'},stdio:'ignore'}));
 await Promise.all(ps.map(p=>new Promise(r=>p.on('exit',r))));const js=lines(d).map(x=>x.job).sort((a,b)=>a-b);assert.deepEqual(js,Array.from({length:30},(_,i)=>i));
 for(const c of fs.readdirSync(path.join(d,'claims')))assert.ok(JSON.parse(fs.readFileSync(path.join(d,'claims',c),'utf8')).token,'claim published with content')});
// T6 (F2): supervisor recovery is serialized: dead same-host claim released (moved, logged); malformed, other-host and
// live-owner claims are not assumed dead (refuse for review).
await ok('T6a dead same-host claim released before workers start',()=>{const d=tmp();fs.mkdirSync(path.join(d,'claims'),{recursive:true});
 fs.writeFileSync(path.join(d,'claims','0'),JSON.stringify({job:0,pid:999999,host:os.hostname(),runId:'deadrun',token:'t'}));
 const r=sup(['--out-dir',d,'--shards','2','--node',NODE],{S2A_BARRIER_POLL_MS:'100'});assert.equal(r.status,0,r.stdout+r.stderr);assert.match(fs.readFileSync(path.join(d,'reclaims.log'),'utf8'),/released job 0/);
 assert.equal(fs.readdirSync(path.join(d,'claims-stale')).length,1);assert.equal(lines(d).length,200,'all 200 stub jobs played once');assert.equal(new Set(lines(d).map(x=>x.job)).size,200)});
await ok('T6b malformed / other-host claims: refuse for review',()=>{for(const content of ['',JSON.stringify({job:0,pid:1,host:'elsewhere',runId:'r',token:'t'})]){const d=tmp();fs.mkdirSync(path.join(d,'claims'),{recursive:true});fs.writeFileSync(path.join(d,'claims','0'),content);
 const r=sup(['--out-dir',d,'--shards','1','--node',NODE]);assert.equal(r.status,5);assert.ok(fs.existsSync(path.join(d,'claims','0')),'claim not deleted')}});
await ok('T6c live owner (pid running a split runner with that run id): refuse for review',async()=>{const d=tmp();fs.mkdirSync(path.join(d,'claims'),{recursive:true});const fake=spawn(NODE,['-e','setTimeout(()=>{},60000)','s2a-split-runner.mjs','liverun'],{stdio:'ignore'});await new Promise(r=>setTimeout(r,300));
 fs.writeFileSync(path.join(d,'claims','0'),JSON.stringify({job:0,pid:fake.pid,host:os.hostname(),runId:'liverun',token:'t'}));
 const r=sup(['--out-dir',d,'--shards','1','--node',NODE]);fake.kill();assert.equal(r.status,5);assert.ok(fs.existsSync(path.join(d,'claims','0')))});
// T7 (F1): STOP during running duels: the supervisor kills every shard; no further jobs.
await ok('T7 supervisor kills running shards on STOP',async()=>{const d=tmp();const p=spawn(NODE,['tools/s2a-supervisor.mjs','--out-dir',d,'--shards','2','--node',NODE],{cwd:ROOT,env:{...process.env,S2A_TEST_STUB:STUB,S2A_STUB_MODE:'slow:30000',S2A_SUPERVISOR_POLL_MS:'300'},stdio:'ignore'});
 await new Promise(r=>setTimeout(r,2500));fs.writeFileSync(path.join(d,'STOP'),'{"test":"stop"}');const t0=Date.now();await new Promise(r=>p.on('exit',r));
 assert.ok(Date.now()-t0<10000,'killed promptly');assert.match(fs.readFileSync(path.join(d,'supervisor.log'),'utf8'),/STOP seen: killing all shards/);assert.equal(lines(d).length,0)});
// T8: Stage-A barrier: job 40 waits until 0-39 are clean; STOP while waiting exits without playing.
await ok('T8a Stage-A barrier holds job 40 until STOP',async()=>{const d=tmp();const t0=Date.now();
 const p=spawn(NODE,['tools/s2a-split-runner.mjs','--out-dir',d,'--shard','A','--run-id','t8','--jobs','40'],{cwd:ROOT,env:{...process.env,S2A_TEST_STUB:STUB,S2A_BARRIER_POLL_MS:'200'},stdio:'ignore'});
 await new Promise(r=>setTimeout(r,1500));assert.equal(p.exitCode,null,'still waiting at the barrier');assert.ok(!fs.existsSync(path.join(d,'claims','40')),'job 40 not claimed while waiting');
 fs.writeFileSync(path.join(d,'STOP'),'x');await new Promise(r=>p.on('exit',r));assert.equal(lines(d).length,0)});
await ok('T8b barrier opens once 0-39 are clean',()=>{const d=tmp();assert.equal(run(['--out-dir',d,'--shard','A','--run-id','t8b','--jobs',STAGE_A.join(',')]).status,0);
 const r=run(['--out-dir',d,'--shard','A','--run-id','t8c','--jobs','40'],{S2A_BARRIER_POLL_MS:'100'});assert.equal(r.status,0);assert.equal(lines(d).length,41)});
// T9 --jobs validation
await ok('T9 --jobs must be unique integers 0-199',()=>{for(const j of ['0,0','200','-1','x']){const r=run(['--out-dir',tmp(),'--shard','A','--run-id','t9','--jobs',j]);assert.equal(r.status,2)}});
// T10-T13 recombine rev 2 (F3/F4) on synthetic rows with the full pinned identity
const sched=(await import('./s2a-test-stub.mjs')).__schedule(200),ids=['branded','mikanko','sky','luna'];
const row=(j,over={})=>({job:j,seed:sched[j].seed,a:sched[j].a,b:sched[j].b,first:sched[j].first,pair:[ids[sched[j].a],ids[sched[j].b]],hash:crypto.createHash('sha1').update('r'+j).digest('hex'),decisions:100,searched:20,finished:true,winner:0,turns:5,retries:0,
 ...Object.fromEntries(BLUNDERS.map(k=>[k,[]])),forcedOwnPicks:[],rootQuality:[{status:'full',logged:true,matchedWorlds:16}],frozen:PIN.frozen,engineSha1:PIN.engineSha1,prefixSha256:PIN.prefixSha256,node:PIN.node,budget:400,randomSeeds:0,engine:'snapshot',version:PIN.version,...over});
const rec=(rows,extra=[])=>{const d=tmp();fs.writeFileSync(path.join(d,'jobs-shardA.jsonl'),rows.map(r=>JSON.stringify(r)).join('\n')+'\n');return spawnSync(NODE,['tools/s2a-recombine.mjs','--in-dir',d,'--out',path.join(d,'o.json'),...extra],{cwd:ROOT,encoding:'utf8'})};
const all=Array.from({length:200},(_,j)=>row(j));
await ok('T10 recombine: 200 valid rows -> PASS',()=>{const r=rec(all);assert.equal(r.status,0,r.stderr);assert.match(r.stdout,/VERDICT PASS/)});
await ok('T11 recombine: any duplicate fails closed (even identical, even a conflicting failed one)',()=>{assert.equal(rec([...all,row(0)]).status,2);assert.equal(rec([...all,row(0,{seed:-1,node:'v0.0.0',throws:[{x:1}]})]).status,2)});
await ok('T12 recombine: missing hash/decisions refused',()=>{assert.equal(rec(all.map(r=>({...r,hash:undefined}))).status,2);assert.equal(rec(all.map(r=>({...r,decisions:undefined}))).status,2)});
await ok('T13 recombine: mixed engine identity refused',()=>{for(const over of [{engine:'wrong'},{randomSeeds:999},{version:'wrong'},{engineSha1:{...PIN.engineSha1,'dist/ai/info-set.mjs':'0'.repeat(40)}}])assert.equal(rec(all.map(r=>({...r,...over}))).status,2)});
await ok('T14 recombine interim never prints PASS below 200',()=>{const r=rec(all.slice(0,40),['--interim']);assert.equal(r.status,0);assert.doesNotMatch(r.stdout,/VERDICT PASS/);assert.match(r.stdout,/CANDIDATE \(interim, 40\/200\), not a PASS/)});
console.log(JSON.stringify({test:'s2a-adversarial',pass:true,cases:results.length,node:process.version}));

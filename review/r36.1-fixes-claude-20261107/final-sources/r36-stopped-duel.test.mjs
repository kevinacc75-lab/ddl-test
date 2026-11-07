// r36.1 stopped-duel guard (Claude as builder, 7 Nov 2026; SELF-VERIFIED). Found in the r36 browser checks and also in
// r35.12: after an Instant Watch duel, New -> Open saved replay showed "DUEL ENGINE · ATTENTION Cannot destructure 'object
// null' as it is null". Stack (debug copy of the worker): onmessage('cinematics') -> schedule() -> planned() -> safeView ->
// Duel.snapshot -> core.duelQueryCount on the duel that 'stop' had destroyed (handle null). schedule() now returns early
// when the duel has no engine handle. The worker runs in a VM as in tests/r32-review-fixes.test.mjs.
// Usage: node tests/r36-stopped-duel.test.mjs [worker.mjs path] (another path = control on an older build)
import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import {M} from '../dist/duel.mjs';
const file=process.argv[2]||'dist/worker.mjs';let pass=0,fail=0;const ok=(n,f)=>{try{f();pass++;console.log('ok',pass+fail,n)}catch(e){fail++;console.log('not ok',pass+fail,n,'--',e.message.split('\n')[0])}};
function run(duelInit,msg){const posted=[];let planned=0;
 const w=fs.readFileSync(file,'utf8').replace(/^import .*;\s*$/gm,'').replace(/export /g,'');
 const ctx=vm.createContext({HumanResponseBridge:class{},WorkerPauseOwners:class{},ChainDirector:class{},Date,M,postMessage:x=>posted.push(x),setTimeout:()=>1,clearTimeout(){},
  safeView:d=>{planned++;if(!d.handle)throw TypeError("Cannot destructure 'object null' as it is null.");return {choices:()=>[1,2]}}});
 vm.runInContext(w,ctx);vm.runInContext('shuffleTap={disarm(){}};coinTap={disarm(){}};resetHumanTransport=()=>{};send=()=>{};',ctx);/* the worker's own catch path needs these */
 vm.runInContext(`duel=${duelInit};mode='watch';paused=false;disabled=false;presentationPending=false;presentationUntil=0;preset='instant';delay=1;plan=null;thinking=null;`,ctx);
 try{vm.runInContext(`onmessage({data:${JSON.stringify(msg)}})`,ctx)}catch(e){posted.push({type:'thrown',message:e.message})}
 return {posted,planned,disabled:vm.runInContext('disabled',ctx)}}
const stopped="{revision:3,handle:null,prompt:{type:M.SELECT_IDLECMD,seat:0},finished:false}";
ok('a settings message after stop (duel destroyed, handle null) plans nothing and posts no error',()=>{
 const r=run(stopped,{type:'cinematics',preset:'instant',value:false});assert.equal(r.planned,0,'planned() not reached');assert.deepEqual(r.posted.filter(x=>x.type==='error'||x.type==='thrown'),[]);assert.equal(r.disabled,false)});
ok('a live duel (engine handle present) still plans on the same message (the guard does not stop live play)',()=>{
 const r=run("{revision:3,handle:1,prompt:{type:M.SELECT_IDLECMD,seat:0},finished:false}",{type:'cinematics',preset:'instant',value:false});assert.ok(r.planned>=1,'planned() reached')});
console.log('r36 stopped-duel tests ('+file+'): '+pass+' passed'+(fail?', '+fail+' FAILED':''));if(fail)process.exitCode=1;

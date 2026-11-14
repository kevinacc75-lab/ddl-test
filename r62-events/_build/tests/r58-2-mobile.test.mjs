// r58.2 (Claude, 13 Nov 2026): Kevy 23:06, phone stuck on "Loading card library…" after asking for a Guided Duel.
// SELF-VERIFIED until reviewed. Browser checks (slow library, 600 kbps throttle, offline reload) are in the release notes.
import assert from 'node:assert/strict';import {test} from 'node:test';import fs from 'node:fs';import http from 'node:http';import {gzipSync} from 'node:zlib';
import {readCompressed} from '../dist/load.mjs';
const read=f=>fs.readFileSync(new URL('../dist/'+f,import.meta.url),'utf8');
function server(handler){return new Promise(r=>{const s=http.createServer(handler).listen(0,'127.0.0.1',()=>r(s))})}
test('(R58.2-1) a slow download that keeps arriving is not cut off at 15 s; a stalled one stops with a clear message',async()=>{
 const body=gzipSync(Buffer.from(JSON.stringify({ok:1,pad:'x'.repeat(4000)})));
 const slow=await server((q,res)=>{res.writeHead(200);let i=0;const step=Math.ceil(body.length/6);const t=setInterval(()=>{res.write(body.subarray(i,i+step));i+=step;if(i>=body.length){clearInterval(t);res.end()}},120)});
 const url='http://127.0.0.1:'+slow.address().port+'/c.json.gz';
 assert.equal((await readCompressed(url,{stallMs:500})).ok,1,'trickling data under the stall limit completes');slow.close();
 const stall=await server((q,res)=>{res.writeHead(200);res.write(body.subarray(0,10))/* then nothing */});
 await assert.rejects(readCompressed('http://127.0.0.1:'+stall.address().port+'/c.json.gz',{stallMs:300}),/The download stopped \(no data for 0 seconds\)|The download stopped/);stall.closeAllConnections?.();stall.close();
});
test('(R58.2-2) the offline worker installs only the duel files; art, tutor sheets and music are saved on first use; caches are per build folder',()=>{
 const s=read('sw.js');assert.match(s,/const LAZY=path=>\/\\\.mp3\$\/i\.test\(path\)\|\|path\.startsWith\('\.\/art\/'\)\|\|path\.startsWith\('\.\/learn\/tutors\/'\);/);
 assert.match(s,/\.filter\(f=>!LAZY\(f\)\)/,'r59: the core list still leaves art, tutor sheets and music to first use');assert.match(s,/CACHE=CACHE_PREFIX\+'2026-11-14-r62-events'\+'@'\+SCOPE/);
 assert.match(s,/\(!key\.includes\('@'\)\|\|key\.endsWith\('@'\+SCOPE\)\)/,'only this folder’s old caches and the old full-download caches are removed');
 assert.match(s,/response\.status===200&&response\.type==='basic'&&!SKIP\(rel\)/,'r59: only full (200) responses are saved, so partial (206) music responses are never cached');
 const a=JSON.parse(read('offline-assets.json')),core=a.filter(f=>!(/\.mp3$/i.test(f)||f.startsWith('./art/')||f.startsWith('./learn/tutors/')));
 const mb=core.reduce((t,f)=>t+(fs.existsSync(new URL('../dist/'+f.slice(2),import.meta.url))?fs.statSync(new URL('../dist/'+f.slice(2),import.meta.url)).size:0),0)/1e6;
 assert.ok(mb<20,'first-visit offline download is under 20 MB (was 110 MB): '+mb.toFixed(1));assert.ok(core.includes('./cards.json.gz')&&core.includes('./scripts.json.gz'));
});
test('(R58.2-3) the worker is registered only after the card library loads; Learn waits for the library and says so',()=>{
 const sh=read('app-shell.mjs');assert.match(sh,/if\(document\.body\?\.dataset\.libraryReady==='1'\)registerOffline\(\);else document\.addEventListener\('ddl-library-ready',registerOffline,\{once:true\}\);/);
 const app=read('app.mjs');assert.match(app,/document\.body\.dataset\.libraryReady='1';document\.dispatchEvent\(new Event\('ddl-library-ready'\)\)/);assert.match(app,/new CustomEvent\('ddl-library-failed'/);
 assert.match(app,/Still loading the card library — this connection is slow\. Please wait…/);assert.doesNotMatch(app,/timed out after 15 seconds/);
 const l=read('learn/learn.mjs');assert.match(l,/The card library is still loading on this connection\. I’ll take you to the duel setup as soon as it’s ready\./);assert.match(l,/addEventListener\('ddl-library-failed'/);assert.match(l,/data-act="setup"\$\{waitingLib\?' disabled':''\}>/,'a redraw keeps the waiting state');
});

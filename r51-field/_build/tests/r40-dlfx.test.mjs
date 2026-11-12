// r40 Duel Links-inspired original accents: display-only checks.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {planBatch,moveTag,chainTag,lpTag,summonTag,dlfxSpan,DLFX_CAP,dlfxEnabled,dlfxSound,playCoinAudition} from '../dist/dl-fx.mjs';
const dist=f=>new URL('../dist/'+f,import.meta.url);
const read=f=>fs.readFileSync(dist(f),'utf8');
const r39=JSON.parse(fs.readFileSync(new URL('./fixtures/r39-served-hashes.json',import.meta.url)));
const sha=f=>crypto.createHash('sha256').update(fs.readFileSync(dist(f))).digest('hex');

// r41 adaptation: the r40-vs-r39 identity now allows exactly the r41 files (RELAY-131 teaching/policy, decks, FX fixes).
import {R45_AI_CHANGED,R45_DISPLAY,R45_BUILD,R45_CACHE,R45_NAME,r47Undo} from './lib/r45-scope.mjs';/* r45-adapted */
const R41_CHANGED_R41=['ai/book/book.mjs','ai/book/branded-nov08.mjs','ai/brain/branded-brain.mjs','decks.json'];/* r45: + the listed r45 AI v4 files (lib/r45-scope.mjs) */
const R41_CHANGED_IGNORED=['ai/book/book.mjs','ai/book/branded-nov08.mjs','ai/brain/branded-brain.mjs','decks.json'];
// r43 adaptation (P1 visual system): deck-list.mjs gains image alt text; no other r39 file changes.
const R41_CHANGED=[...new Set([...R41_CHANGED_R41,...R45_AI_CHANGED.filter(f=>f!=='optimal-pilot.mjs')])];
const R43_CHANGED=['deck-list.mjs'];
test('r40 display only (r41-adapted): engine, rules data and random are byte-identical to r39; only the listed r41 AI/deck files differ',()=>{
 const changed=Object.keys(r39).filter(f=>fs.existsSync(dist(f))&&sha(f)!==r39[f]).sort();
 assert.deepEqual(changed,['app.mjs','index.html','offline-assets.json','presentation.mjs','release-notes.md','SOUND_CREDITS.md','sw.js','worker.mjs','library-worker.mjs'/* r49.1: art-additions.json loading */,...R41_CHANGED,...R43_CHANGED,'optimal-pilot.mjs'].sort());
 for(const f of Object.keys(r39))assert.ok(fs.existsSync(dist(f)),'r39 file missing: '+f);
 for(const f of Object.keys(r39).filter(f=>(f.startsWith('ai/')&&!R41_CHANGED.includes(f))||f.startsWith('core/')||f.startsWith('windbot/')||f.startsWith('wb/')||f.startsWith('art/')))assert.equal(sha(f),r39[f],f);
 for(const f of ['duel.mjs','random.mjs','cards.json.gz','scripts.json.gz','optimal-pilot.mjs','pilot.mjs','pilot-agent.mjs','coin-tap.mjs','coin-cutscene.mjs','event-data.mjs','deck-cards.json'].filter(f=>!R45_AI_CHANGED.includes(f)))assert.equal(sha(f),r39[f],f);/* r45: optimal-pilot.mjs is an AI v4 file */
});
test('r41 worker.mjs differs from r39 only in the BUILD identity line',()=>{
 const a=r47Undo('worker.mjs',read('worker.mjs')).split('\n')/* r47-adapted: minus the Concede handler */,b=fs.readFileSync('/workspace/ddl-test-r39/r39-branded-video41/worker.mjs','utf8').split('\n');
 assert.equal(a.length,b.length);const diff=a.map((l,i)=>l===b[i]?null:i).filter(i=>i!==null);
 assert.equal(diff.length,1);assert.match(a[diff[0]],R45_BUILD);
});
test('r40 presentation hook is one fire-and-forget dispatch at the start of each batch',()=>{
 const p=read('presentation.mjs'),b=fs.readFileSync('/workspace/ddl-test-r39/r39-branded-video41/presentation.mjs','utf8');
 const hook=p.match(/  try\{document\.dispatchEvent\(new window\.CustomEvent\('ddl-dlfx-batch'.*\n/)?.[0];assert.ok(hook);
 assert.equal(p.replace(hook,''),b);assert.doesNotMatch(hook.replace(/\/\*.*\*\//,''),/await|return|duration\s*=|batch\.duration|setTimeout/);
});
test('r40 dl-fx.mjs never touches the duel, worker, randomness or timing',()=>{
 const s=read('dl-fx.mjs').replace(/^\/\/.*$/mg,'');
 assert.deepEqual([...s.matchAll(/^import .* from '(.*)';$/mg)].map(m=>m[1]),['./coin-cutscene.mjs']);
 for(const bad of [/postMessage/,/Math\.random/,/\.respond\(/,/new Worker/,/duel\./,/crypto/])assert.doesNotMatch(s,bad);
 const html=read('index.html');assert.match(html,/<script type="module" src="dl-fx\.mjs"><\/script>/);/* r43: dl-fx.css is bundled verbatim (urls rebased) into css/fx.css */assert.match(html,/href="\.\/css\/fx\.css"/);assert.ok(read('css/fx.css').includes('==== dl-fx.css'));
 const off=JSON.parse(read('offline-assets.json'));for(const f of ['./dl-fx.mjs','./css/fx.css'])assert.ok(off.includes(f));
 assert.match(read('sw.js'),R45_CACHE);
});
test('r40 plan: nothing at Instant, nothing without a batch duration, nothing when switched off',()=>{
 const ev=[{type:'summon',code:1,player:0,sequence:2,special:true},{type:'move',reason:0x80,from:{controller:0,location:2},to:{controller:0,location:16}}];
 assert.deepEqual(planBatch(ev,{preset:'instant',duration:900}),[]);
 assert.deepEqual(planBatch(ev,{preset:'learning',duration:0}),[]);
 assert.deepEqual(planBatch(ev,{preset:'learning',duration:900,enabled:false}),[]);
 const p=planBatch(ev,{preset:'learning',duration:5000});assert.deepEqual(p.map(x=>x.kind),['pillar','tag']);
 for(const x of p)assert.ok(x.span<=DLFX_CAP.learning&&x.span<=5000);
 assert.equal(dlfxSpan('broadcast',300),300);assert.equal(dlfxSpan('duel',9000),DLFX_CAP.duel);assert.equal(dlfxSpan('instant',9000),0);
 assert.equal(dlfxEnabled({getItem:()=> 'off'}),false);assert.equal(dlfxEnabled({getItem:()=>null}),true);
 const many=Array.from({length:12},(_,i)=>({type:'move',reason:0x40,from:{controller:0,location:1},to:{controller:0,location:16,sequence:i}}));
 assert.equal(planBatch(many,{preset:'duel',duration:2000}).length,6);
});
test('r40 coin / dice chip only when the full cutscene is not shown, never at Instant; result read, never made',()=>{
 const toss={type:'coinToss',id:3,player:1,code:0,toss:{id:1,kind:'coin',seat:1,results:[true],call:'tails',code:0}};
 assert.deepEqual(planBatch([toss],{preset:'learning',duration:4800,coinShown:true}),[]);
 assert.deepEqual(planBatch([toss],{preset:'instant',duration:0}),[]);
 assert.deepEqual(planBatch([toss],{preset:'duel',duration:0,coinShown:false}).map(x=>x.kind),['coin']);
});
test('r40 tags follow the engine reason bits and never name a card',()=>{
 const m=(reason,from,to,pos=0)=>({type:'move',code:12345,reason,from:{controller:0,location:from},to:{controller:0,location:to,position:pos}});
 assert.equal(moveTag(m(0x80|0x40,2,16)),'COST → GY');
 assert.equal(moveTag(m(0x40,1,16)),'SENT TO GY');
 assert.equal(moveTag(m(0x8|0x40,4,16)),'MATERIAL → GY');
 assert.equal(moveTag(m(0x1|0x40,4,16)),'DESTROYED');
 assert.equal(moveTag(m(0x1|0x20,4,16)),'DESTROYED BY BATTLE');
 assert.equal(moveTag(m(0x4000|0x40,2,16)),'DISCARDED');
 assert.equal(moveTag(m(0x40,4,32,8)),'BANISHED · FACE-DOWN');
 assert.equal(moveTag(m(0x40,1,2)),'ADDED FROM DECK');
 assert.equal(moveTag(m(0,2,8,8)),'SET');
 assert.equal(moveTag(m(0,2,4,1)),null);
 for(const t of [moveTag(m(0x40,1,2)),moveTag(m(0x40,4,32))])assert.doesNotMatch(t,/12345/);
 assert.equal(chainTag({type:'activate',chain:2}),'ACTIVATE · CL 2');assert.equal(chainTag({type:'resolve',chain:2}),'RESOLVING · CL 2');
 assert.equal(chainTag({type:'negate',chain:1}),'NEGATED · CL 1');assert.equal(chainTag({type:'resolve',silent:true,chain:1}),null);
 assert.equal(lpTag({type:'damage',amount:2400,combat:true}).caption,'BATTLE DAMAGE');assert.equal(lpTag({type:'damage',amount:800}).caption,'EFFECT DAMAGE');
 assert.equal(lpTag({type:'cost',amount:1000}).caption,'LP COST');assert.equal(lpTag({type:'recover',amount:500}).sign,'+');
 assert.equal(summonTag({special:true}),'SPECIAL SUMMON');assert.equal(summonTag({kind:'flip'}),'FLIP SUMMON');
 const atk=planBatch([{type:'attack',from:{controller:0,location:4,sequence:0},to:null}],{preset:'duel',duration:1500});assert.equal(atk[0].text,'DIRECT ATTACK DECLARED');
 const lp=planBatch([{type:'damage',player:0,amount:2400,combat:true},{type:'recover',player:1,amount:500}],{preset:'duel',duration:1500});assert.deepEqual(lp.map(x=>[x.kind,x.lpKind,x.caption]),[['burst','damage','BATTLE DAMAGE'],['burst','gain','LP GAINED']]);
});
test('r40 sounds are silent unless audio is running and audible (muted or no context: nothing scheduled)',()=>{
 let calls=0;const s={tone:()=>calls++,noise:()=>calls++,enabled:false,volume:.5,levels:{sfx:.8},context:{state:'running'},seat:0};
 assert.equal(dlfxSound(s,'pillar'),false);assert.equal(playCoinAudition(s,'coin'),false);
 s.enabled=true;s.levels.sfx=0;assert.equal(dlfxSound(s,'slash'),false);
 s.levels.sfx=.8;s.context.state='suspended';assert.equal(dlfxSound(s,'burst'),false);assert.equal(calls,0);
 s.context.state='running';assert.equal(dlfxSound(s,'turn'),true);assert.ok(calls>0);assert.equal(s.seat,0);
});

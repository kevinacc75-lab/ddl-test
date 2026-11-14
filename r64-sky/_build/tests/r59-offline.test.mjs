// r59 (Claude, 14 Nov 2026): Seto team RELAY-206 (offline core, rules revision binding, CP-001 r1.1, loading) and ChatGPT
// RELAY-205/207. SELF-VERIFIED until reviewed. Browser checks (offline with the HTTP cache cleared, r45 wipe and heal,
// throttled first duel, five sizes) are in the release notes.
import assert from 'node:assert/strict';import {test} from 'node:test';import fs from 'node:fs';import path from 'node:path';
import {moduleGraph} from '../tools/module-graph.mjs';import {CHOKEPOINTS,cpBeats} from '../dist/learn/chokepoints.mjs';import {LESSONS} from '../dist/learn/lessons.mjs';import {rulesChecked,rulesBadge,authorNote} from '../dist/learn/learn.mjs';
const dist=new URL('../dist/',import.meta.url).pathname,read=f=>fs.readFileSync(path.join(dist,f),'utf8');
test('(R59-1) MED-1: every runtime file the module graph reaches is in the offline core (not art, tutor sheets or music)',()=>{
 const list=JSON.parse(read('offline-assets.json')),LAZY=f=>/\.mp3$/i.test(f)||f.startsWith('./art/')||f.startsWith('./learn/tutors/');
 const graph=moduleGraph(dist).filter(f=>!f.endsWith('/')&&!f.startsWith('./wb/')&&fs.statSync(path.join(dist,f)).isFile());
 assert.ok(graph.length>140,'graph walked: '+graph.length);for(const f of ['./public-identity.mjs','./ai/midgame.mjs','./worker.mjs','./library-worker.mjs','./app.mjs'])assert.ok(graph.includes(f),f);
 const missing=graph.filter(f=>!list.includes(f));assert.deepEqual(missing,[],'graph files missing from offline-assets.json');
 assert.ok(graph.filter(f=>!LAZY(f)).every(f=>list.includes(f)));assert.ok(list.includes('./offline-assets.json'));
});
test('(R59-2) MED-2/3: the worker saves what it serves, heals a missing core on request, reports honestly; precache waits for the first duel or idle',()=>{
 const s=read('sw.js');assert.match(s,/self\.addEventListener\('install',event=>event\.waitUntil\(self\.skipWaiting\(\)\)\);/,'no download at install');
 assert.match(s,/response\.status===200&&response\.type==='basic'&&!SKIP\(rel\)/,'any served same-origin file is saved (self-heal)');
 assert.match(s,/type==='offline-fill'\?\(filling\|\|=coreStatus\(true\)/);assert.match(s,/return \{ready:missing\.length===0,missing:missing\.length,total:list\.length\}/);
 assert.match(s,/CACHE=CACHE_PREFIX\+'2026-11-15-r64-sky'\+'@'\+SCOPE/);
 const a=read('app-shell.mjs');assert.match(a,/if\(st\?\.ready\)notify\('Offline duel files are ready\./,'"ready" only when the worker confirms');assert.doesNotMatch(a,/if\(registration\.active\)notify\('Offline duel files are ready/);
 assert.match(a,/c\.saveData\|\|\/\(\^\|-\)\(2g\|3g\)\$\/\.test/);assert.match(a,/window\.addEventListener\('duel-state',\(\)=>\{duelReady=true\},\{once:true\}\)/);assert.match(a,/},45000\)/);
});
test('(R59-3) LOW-1/2: rules credit only for the exact checked revision, badge and ruling note together',()=>{
 for(const l of LESSONS)assert.equal(rulesChecked(l),l.rulesCheck.relay,l.id);
 const cp=CHOKEPOINTS.find(l=>l.id==='CP-001');assert.equal(cp.revision,1.1);assert.equal(rulesChecked(cp),'RELAY-210','r60: CP-001 r1.1 rules-checked in RELAY-210');
 assert.match(rulesBadge(cp),/Rules: checked by Seto team \(RELAY-210\)/);assert.equal(authorNote(cp),'Authored by ChatGPT · rules checked by Seto team (RELAY-210)');
 const bumped={...LESSONS[0],revision:LESSONS[0].revision+1};assert.equal(rulesChecked(bumped),null);assert.match(rulesBadge(bumped),/pending/);assert.match(authorNote(bumped),/pending/);
 assert.equal(authorNote(LESSONS[3]),'Authored by ChatGPT · rules checked by Seto team (RELAY-199)');assert.equal(rulesChecked({rulesCheck:'RELAY-200',revision:1}),null,'old string form no longer counts');
});
test('(R59-4) CP-001 r1.1 (RELAY-207): exact F0-only words and chips; F1 unchanged; ending and ruling disclose the passed windows',()=>{
 const cp=CHOKEPOINTS[0],f0=cpBeats(cp,'F0'),f1=cpBeats(cp,'F1');
 assert.equal(f0[3].say,'You kept Ash. Lode’s declaration is another Ash window. This replay passes it, so Blue-Eyes White Dragon is summoned.');
 assert.ok(f0[3].chips.some(c=>c.text==='Ash still in hand · later windows passed in this replay'));
 assert.equal(f0[4].say,'Sage was already in hand. Its Normal Summon search is another Ash window. This replay passes that window too, so Maiden is added.');
 assert.ok(f0[4].chips.some(c=>c.text==='Ash kept · Sage’s search passed in this replay')&&f0[4].chips.some(c=>c.text==='Normal Summoned · Lode’s lock doesn’t apply'));
 assert.equal(f1[4].say,'Lode stays face-up. Its separate declaration effect can still summon Blue-Eyes White Dragon.');assert.ok(!f1.some(b=>(b.chips||[]).some(c=>/passed in this replay/.test(c.text))));
 assert.match(cp.question.answer,/In the Pass branch, Ash stayed live at Lode’s declaration and Sage’s search; this replay passed both\. A separate F2 branch using Ash on the declaration has not been reviewed\.$/);
 assert.match(cp.ruling,/The Pass branch also passes the later Ash windows at Lode’s declaration and Sage’s search\. Reaching Spirit Dragon here does not mean those later windows are unavailable\.$/);
});
test('(R59-5) MED-5 and loading LOWs: normal-flow footer on short screens; no hard cap on a download still arriving; one wait, one pair of listeners',()=>{
 assert.match(read('css/r58-learn-temple.css'),/@media\(max-height:640px\)\{#learn \.lr-play\[data-studio="temple"\] \.lr-footer\{position:static\}\}/);assert.doesNotMatch(read('css/r58-learn-temple.css'),/\.lr-footer\{position:sticky/);
 const app=read('app.mjs');assert.doesNotMatch(app,/timed out after 3 minutes/);assert.doesNotMatch(app,/made no progress|setTimeout\(\(\)=>\{clearTimeout\(slow\);w\.terminate/,'no overall cap');
 const l=read('learn/learn.mjs');assert.match(l,/const wait=new AbortController\(\)/);assert.equal((l.match(/signal:wait\.signal/g)||[]).length,2);
});

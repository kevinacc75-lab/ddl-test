// r60 (Claude, 14 Nov 2026): Kevy's playtest (15:30 AEDT) and Seto team RELAY-210 LOW-1/2 with ChatGPT RELAY-211.
import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs';
const read=f=>fs.readFileSync(new URL('../dist/'+f,import.meta.url),'utf8');
test('(R60-1) card text: the rest of the printed text is fully readable; only the clause in use is highlighted',()=>{
 const css=read('css/r60-focus.css'),html=read('index.html');
 assert.match(css,/#event-effect-text \.effect-context,\s*body\[data-theme\] #event-stage #event-effect-text \.effect-context\{opacity:1!important;filter:none!important;color:#eef1f8!important;font-size:1em!important\}/);
 assert.match(css,/#card-live-effect \.effect-context\{opacity:1!important/);assert.match(css,/#effect-dock-text \.effect-context\{opacity:1!important/);
 assert.doesNotMatch(css,/url\(|@import/i);
 const links=[...html.matchAll(/<link rel="stylesheet" href="([^"]+)">/g)].map(m=>m[1]);assert.equal(links.at(-1),'./css/r60-focus.css','loaded last');
 assert.ok(JSON.parse(read('offline-assets.json')).includes('./css/r60-focus.css'),'saved for offline use');
 // the highlight itself is untouched: effect-focus still wraps the active clause in <mark data-active-clause>
 assert.match(read('effect-focus.mjs'),/<mark data-active-clause><strong>/);
 assert.match(read('app.mjs'),/if\(cap\.textContent==='RESOLVING TEXT · TIMING \/ COST IN GREY'\)cap\.textContent='RESOLVING TEXT · ACTIVE PART HIGHLIGHTED'/);
});
test('(R60-2) one thing at a time: every human prompt waits for the scene, as chain responses already did',()=>{
 const a=read('app.mjs');
 assert.match(a,/if\(!isAi&&!disabled&&!state\.finished&&!!state\.prompt&&fxBusy\)\{/);
 assert.doesNotMatch(a,/state\.prompt\?\.type===M\.SELECT_CHAIN&&fxBusy/);
 // the deferred prompt is presented on the existing onBusy(false) path
 assert.match(a,/if\(!value\)\{worker\?\.postMessage\(\{type:'presentation-done',eventId\}\);queueMicrotask\(finishPendingChainDecision\)\}/);
 assert.match(a,/function finishPendingChainDecision\(\)\{\n if\(fxBusy\)return;/);
});
test('(R60-3) Learn short-screen cue (RELAY-211 option a): labels, only scroll + focus, never answers or advances',()=>{
 const l=read('learn/learn.mjs'),css=read('css/r60-focus.css');
 for(const t of ['Choose ↓','The ruling ↓','Compare and ruling ↓','Next ↓'])assert.ok(l.includes("'"+t+"'"),t);
 assert.match(l,/class="lr-jump" data-act="jump" aria-label="\$\{esc\(name\)\}" hidden>/);
 const jump=l.match(/function jump\(\)\{[^\n]*\}/)[0];assert.doesNotMatch(jump,/beat|branch|playBeat|click\(\)/,'jump only scrolls and focuses');assert.match(jump,/scrollIntoView\(\{block:'end',behavior:reduced\(\)\?'auto':'smooth'\}\)/);
 assert.match(l,/if\(a==='jump'\)return jump\(\);/);
 assert.match(css,/#learn \.lr-jump\{min-height:44px;min-width:44px/);assert.match(css,/#learn \.lr-jump:focus-visible\{outline:/);
});
test('(R60-4) offline start with missing core files stops with a message and Retry (RELAY-210 LOW-2); online starts unchanged',()=>{
 const a=read('app.mjs');
 assert.match(a,/reallyOffline\(\)\.then\(off=>\{if\(!off\|\|state\|\|!busy\)return;offlineGuard=setTimeout\(offlineStop,Math\.max\(0,15000-\(Date\.now\(\)-started\)\)\);offlineCoreStatus\(\)\.then\(st=>\{if\(st&&!st\.ready&&busy&&!state\)offlineStop\(\)\}\)\}\)/);
 assert.match(a,/if\(!state&&busy\)reallyOffline\(\)\.then\(off=>off\?offlineStop\(\):fail\(\)\);else fail\(\)\}/);
 assert.match(a,/async function reallyOffline\(\)\{if\(navigator\.onLine===false\)return true;try\{const r=await fetch\('\.\/\?online-check='\+Date\.now\(\),\{method:'HEAD',cache:'no-store'\}\);return !r\.ok\}catch\{return true\}\}/);
 assert.match(a,/worker\.onmessage=e=>\{clearTimeout\(offlineGuard\);receive\(e\)\}/);
 assert.match(a,/This duel needs files that aren’t saved for offline use yet\. Go online and start one duel \(or stay on the page for about 45 s\) to save them\./);
 assert.match(a,/id="offline-retry">Retry<\/button>/);
 assert.ok(JSON.parse(read('offline-assets.json')).includes('./'),'the page shell is part of the offline fill');
});

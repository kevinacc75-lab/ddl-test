// r62 (Claude, 14 Nov 2026): ChatGPT declutter r1 step 2 + r2 addendum + RELAY-216 r61 review. Presentation only.
import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs';
const read=f=>fs.readFileSync(new URL('../dist/'+f,import.meta.url),'utf8');
test('(R62-1) landscape Play: the chain scene is a rail panel (no full-screen blur), the board keeps the rail column free',()=>{
 const c=read('css/r62-events.css');
 assert.match(c,/#event-stage\[data-spotlight=true\]\{\n inset:auto!important;top:var\(--rail-top\)!important;right:8px!important;width:var\(--rail-w\)!important;/);
 assert.match(c,/background:#0b1226!important;backdrop-filter:none!important;/);
 assert.match(c,/\[data-pc-play="1"\] #duel #arena-scroll\{\n right:calc\(\(1600px - 100vw \/ var\(--stage-scale\)\) \/ 2 \+ \(16px \+ var\(--rail-w\)\) \/ var\(--stage-scale\)\)!important\}/);
 for(const rule of c.replace(/\/\*[^]*?\*\//g,'').split('}').filter(r=>r.includes('{')&&!r.trim().startsWith('@media')))assert.match(rule,/data-pc-play="1"/,'Play only: '+rule.slice(0,80));
});
test('(R62-2) one caption per movement: duplicate ring tags, RESOLVE stamp and RESOLVING tag are dropped in Play; the flight label stays',()=>{
 const c=read('css/r62-events.css');
 assert.match(c,/#fx-layer \.flight-ring>span,\nbody\.in-duel\[data-pc-play="1"\] #fx-layer \.fx23-chain-stamp,\nbody\.in-duel\[data-pc-play="1"\] \.dlfx-chain>\.dlfx-tag\{display:none!important\}/);
 assert.doesNotMatch(c,/\.flight-label\{display:none/);
});
test('(R62-3) no empty "Pilot B is choosing" sheet in Play; phase context on no-chain windows; portrait opens without the rotate wall',()=>{
 const a=read('app.mjs'),c=read('css/r62-events.css');
 assert.match(a,/document\.body\.dataset\.decider=isAi\?'ai':'human';/);
 assert.match(c,/body\.in-duel\[data-pc-play="1"\]\[data-decider=ai\]:not\(#_\):not\(#_\):not\(#_\) #duel \.decision-column\{display:none!important\}/);
 assert.match(a,/ctx\.textContent=phName\+' · response window · nothing is on the chain'/);
 assert.match(read('app-shell.mjs'),/let portraitOverride=true\/\*/);
});
test('(R62-4) RELAY-216: the quick bar never answers when it is not visible, nor when a control has focus; activate vs chain wording',()=>{
 const p=read('play-comfort.mjs');
 assert.match(p,/if\(e\.code!=='Space'\|\|bar\.hidden\|\|!bar\.getClientRects\(\)\.length/);
 assert.match(p,/\/\^\(INPUT\|SELECT\|TEXTAREA\|BUTTON\|A\|SUMMARY\)\$\/\.test\(t\.tagName\)/);
 assert.match(p,/\(state\.chain\?\.length\?'You can chain: ':'You can activate: '\)/);
 const html=read('index.html'),links=[...html.matchAll(/<link rel="stylesheet" href="([^"]+)">/g)].map(m=>m[1]);assert.equal(links.at(-1),'./css/r62-events.css');
 assert.ok(JSON.parse(read('offline-assets.json')).includes('./css/r62-events.css'));
});

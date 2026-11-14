// r61 step 1 (Claude, 14 Nov 2026): one decision surface, from ChatGPT's Duel-screen-declutter-r1. CSS only; engine
// choices, timing and answers unchanged. Geometry is checked in a browser (tools/browser/decision-surface-check.cjs).
import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs';
const read=f=>fs.readFileSync(new URL('../dist/'+f,import.meta.url),'utf8');
test('(R61-1) the decision sheet is the only route while open: View actions, the floating No response and Return to field hide',()=>{
 const c=read('css/r61-decide.css');
 assert.match(c,/body\.in-duel\[data-pc-play="1"\]:has\(#duel:not\(\[data-screen=field\]\)\) :is\(#duel \.field-cue,#pc-bar,#arena-return\)\{display:none!important\}/);
 assert.match(c,/body\.in-duel\.portrait-overview\[data-pc-play="1"\]:has\(#duel:not\(\[data-screen=field\]\)\) #pc-chain\{display:none!important\}/);
 assert.doesNotMatch(c,/url\(|@import/i);
});
test('(R61-2) landscape: a counter-scaled right rail (real pixel text) and a board that narrows beside it',()=>{
 const c=read('css/r61-decide.css');
 assert.match(c,/transform:scale\(calc\(1 \/ var\(--stage-scale\)\)\);transform-origin:top right;/);
 assert.match(c,/#arena-scroll\{\n right:calc\(\(1600px - 100vw \/ var\(--stage-scale\)\) \/ 2 \+ \(2 \* var\(--rail-gap\) \+ var\(--rail-w\)\) \/ var\(--stage-scale\)\)!important\}/);
 assert.match(read('app-shell.mjs'),/stage\.style\.setProperty\('--stage-scale',String\(scale\)\)/,'the scale variable the rail relies on');
});
test('(R61-3) Play mode only, loaded last, saved for offline use',()=>{
 const c=read('css/r61-decide.css'),html=read('index.html');
 for(const rule of c.replace(/\/\*[^]*?\*\//g,'').split('}').filter(r=>r.includes('{')&&!r.trim().startsWith('@media')))assert.match(rule,/data-pc-play="1"/,'every rule is scoped to Play: '+rule.slice(0,80));
 const links=[...html.matchAll(/<link rel="stylesheet" href="([^"]+)">/g)].map(m=>m[1]);assert.equal(links.at(-1),'./css/r61-decide.css');
 assert.ok(JSON.parse(read('offline-assets.json')).includes('./css/r61-decide.css'));
});

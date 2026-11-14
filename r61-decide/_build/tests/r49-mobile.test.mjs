// r49 (Claude, 12 Nov 2026; Kevy 19:45 AEDT: mobile layout). SELF-VERIFIED until reviewed. Source-level checks only:
// the layout itself is checked in a browser at 412x790, 800x1200 and 1280x740 (see release notes / relay).
import assert from 'node:assert/strict';import {test} from 'node:test';import fs from 'node:fs';import {createHash} from 'node:crypto';
const read=f=>fs.readFileSync(new URL('../dist/'+f,import.meta.url),'utf8');
test('(R49-1) the mobile sheet is the last stylesheet, is listed for offline use, and only styles (no script, no url)',()=>{
 const html=read('index.html'),links=[...html.matchAll(/<link rel="stylesheet" href="([^"]+)">/g)].map(m=>m[1]);
 assert.deepEqual(links.slice(-7),['./css/r49-mobile.css','./css/r50-egypt.css','./css/r52-polish.css','./css/r53-learn.css','./css/r58-learn-temple.css','./css/r60-focus.css'/* r60: card text + Learn cue */,'./css/r61-decide.css'/* r61: one decision surface */],'r50: the layout sheet, then the look sheet (colours only); r52: then the showcase/polish sheet');assert.equal(links.filter(x=>x.includes('r49-mobile')).length,1);
 assert.ok(JSON.parse(read('offline-assets.json')).assets?.includes?.('./css/r49-mobile.css')??read('offline-assets.json').includes('"./css/r49-mobile.css"'));
 const css=read('css/r49-mobile.css');assert.doesNotMatch(css,/url\(|@import|expression\(/i);
 let depth=0;for(const ch of css.replace(/\/\*[^]*?\*\//g,'')){if(ch==='{')depth++;if(ch==='}')depth--;assert.ok(depth>=0)}assert.equal(depth,0,'balanced braces')});
test('(R49-2) phone-upright, tablet-upright and landscape blocks exist; the decision sheet can never be wider than the screen',()=>{
 const css=read('css/r49-mobile.css');
 assert.match(css,/@media \(max-width:600px\) and \(orientation:portrait\)\{/);assert.match(css,/@media \(min-width:601px\) and \(orientation:portrait\)\{/);assert.match(css,/@media \(max-height:480px\) and \(orientation:landscape\)\{/);
 const sheets=[...css.matchAll(/#duel \.decision-column\{([^}]*)\}/g)].map(m=>m[1]);assert.equal(sheets.length,2);
 for(const s of sheets){assert.match(s,/width:auto!important/);assert.match(s,/max-width:(100|92)vw!important/);assert.match(s,/overflow-x:hidden!important/)}
 assert.match(css,/body\[data-pc-play\] #play-response-status\{display:none!important\}/);assert.match(css,/body\[data-pc-play\] #duel-quickbar\{display:none!important\}/);assert.match(css,/body\[data-pc-play\] #quick-pace\{display:none!important\}/)});
test('(R49-3) play-comfort marks Play on the body, keeps the old auto-pass action reachable, and only skips the rotate card on upright phones',()=>{
 const p=read('play-comfort.mjs');
 assert.ok(p.includes("if(show)document.body.dataset.pcPlay='1';else delete document.body.dataset.pcPlay;"));
 assert.ok(p.includes("document.querySelector('#play-response-status button')"),'the hidden bar\'s own button is what gets pressed');
 assert.ok(p.includes("matchMedia('(max-width:600px) and (orientation:portrait)').matches"));
 assert.ok(p.includes("/Offline duel files are ready/.test"),'only that one notice is dismissed');
 const pins=JSON.parse(fs.readFileSync(new URL('./fixtures/r48_1-flow-sha256.json',import.meta.url),'utf8'));for(const [f,h] of Object.entries(pins))assert.equal(createHash('sha256').update(fs.readFileSync(new URL('../dist/'+f,import.meta.url))).digest('hex'),h,f+' unchanged from r48.1 (sha256 pinned in tests/fixtures/r48_1-flow-sha256.json; RELAY-152 asked for no absolute path)')});

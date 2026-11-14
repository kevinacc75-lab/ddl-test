// r44 deck select boss art (Kevy 11 Nov 2026 01:48 AEDT: "In the deck selection menu Keep the boss monster of each deck as the background and art work").
// Presentation only: pins that r44 changes nothing outside the deck-tile presentation and build identity versus r43.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {R45_AI_CHANGED,R45_DISPLAY,R45_BUILD,R46_TITLE,R46_SCRIPT,r47Undo,R52_CHANGED} from './lib/r45-scope.mjs';/* r45-adapted; r46-adapted */
const dist=f=>new URL('../dist/'+f,import.meta.url);
const read=f=>fs.readFileSync(dist(f),'utf8');
const sha=f=>crypto.createHash('sha256').update(fs.readFileSync(dist(f))).digest('hex');
const r43=JSON.parse(fs.readFileSync(new URL('./fixtures/r43-served-hashes.json',import.meta.url)));
test('(R44-1) only app.mjs, css/aurora.css, identity files and the Super Poly policy file differ from r43; engine, rest of AI, rules, decks.json, art and emblems byte-identical',()=>{
 const changed=Object.keys(r43).filter(f=>sha(f)!==r43[f]).sort();
 assert.deepEqual(changed,[...new Set(['ai/book/branded-nov08.mjs','app.mjs','css/aurora.css','index.html','release-notes.md','sw.js','worker.mjs',...R45_AI_CHANGED,...R45_DISPLAY,'offline-assets.json','library-worker.mjs'/* r49.1 */,...R52_CHANGED/* r52 */])].sort());/* r45: + AI v4 files, the display rename and the manifest entries for the two new AI files *//* the one AI file is the Super Poly own-face-down fix, pinned by r44-superpoly.test.mjs */
 for(const f of Object.keys(r43))assert.ok(fs.existsSync(dist(f)),'r43 file missing: '+f);
 const w=r47Undo('worker.mjs',read('worker.mjs')).split('\n')/* r47-adapted: minus the Concede handler */,w0=fs.readFileSync('/workspace/ddl-test-r39/r43-aurora-p1/worker.mjs','utf8').split('\n');const d=w.map((l,i)=>l===w0[i]?null:i).filter(i=>i!==null);assert.equal(d.length,1);assert.match(w[d[0]],R45_BUILD);
 const h=r47Undo('index.html',read('index.html')),h0=fs.readFileSync('/workspace/ddl-test-r39/r43-aurora-p1/index.html','utf8');assert.equal(h.replace(R46_TITLE,'<title>TEST r43 — Duel Doctrine Lab · Aurora</title>').replace(R46_SCRIPT,'').replace(/TEST r64/g,'TEST r43'),h0);/* r46-adapted: title, badge and the victory-boss script tag */
 assert.ok(read('css/aurora.css').startsWith(fs.readFileSync('/workspace/ddl-test-r39/r43-aurora-p1/css/aurora.css','utf8')),'aurora.css only appends');
});
test('(R44-2) every preset deck has a boss in its own list with local card art, used on its tile',()=>{
 const {decks}=JSON.parse(read('decks.json'));const {cards}=JSON.parse(read('deck-cards.json'));const off=JSON.parse(read('offline-assets.json'));
 assert.equal(decks.length,9);
 for(const d of decks){assert.ok([...d.main,...d.extra].includes(d.boss),d.id+' boss in list');const a=cards[String(d.boss)]?.art;assert.match(a,/^art\/\d+\.(jpg|webp)$/,d.id);assert.ok(fs.existsSync(dist(a)),a);assert.ok(off.includes('./'+a),'precached '+a)}
 const app=read('app.mjs');assert.match(app,/const bossArt=d=>art\(d\.boss\)/);assert.match(app,/data-boss="\$\{esc\(String\(d\.boss\|\|''\)\)\}"\$\{bossBg\(d\)\}>\$\{bossTile\(d\)\}<div class="tile-body">/);
 assert.match(app,/--tile-art:url\(&quot;\$\{esc\(absArt\(bossArt\(d\)\)\)\}&quot;\)/);
});
test('(R44-3) Aurora tile background: blurred boss art under a readable gradient; LP avatars and hero crest keep emblems',()=>{
 const c=read('css/aurora.css');assert.match(c,/\.deck-tile\[style\*="--tile-art"\]::before\{[^}]*background:var\(--tile-art\)[^}]*filter:blur\(/);assert.match(c,/\.deck-tile \.tile-body\{background:linear-gradient\(/);
 const app=read('app.mjs');assert.match(app,/avatar\.src=emblemSrc\(theme\)/);assert.match(read('index.html'),/emblems\/home-crest\.svg/);
});

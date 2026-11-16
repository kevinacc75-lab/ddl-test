// r67.6 (Claude, 16 Nov 2026): Kevy's Branded Deck = Kevy's own 40/15/15 list. Found by the live browser check: the app still required
// exactly 41 Main Deck cards for this preset and refused to start it. This test ties the app's preset size rule to the shipped preset.
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import z from 'node:zlib';
import {presetFor} from '../dist/deck-list.mjs';import {validateDeck} from '../dist/deck-validator.mjs';import {isBrandedNov08} from '../dist/ai/book/branded-nov08.mjs';
const read=f=>JSON.parse(fs.readFileSync('dist/'+f,'utf8'));
test('(R67.6-1) the app\'s preset size rule matches Kevy\'s shipped list, so the deck can start (fails on the first r67.6 deploy)',()=>{
 const app=fs.readFileSync('dist/app.mjs','utf8');const m=app.match(/isBrandedNov08\(d\)\?\{exactSizes:\{main:(\d+),extra:(\d+),side:(\d+)\}\}/);assert.ok(m,'app preset size rule found');
 const sizes={main:+m[1],extra:+m[2],side:+m[3]};const base=read('decks.json').decks.find(d=>d.id==='branded');
 for(const deck of [base,presetFor(base,'tcg-2026-10-19')]){assert.equal(isBrandedNov08(deck),true);
  const v=validateDeck(deck,JSON.parse(z.gunzipSync(fs.readFileSync('dist/cards.json.gz'))),read('banlists/tcg-2026-10-19.json'),{exactSizes:sizes});
  assert.deepEqual(v.errors.filter(e=>e.code!=='NO_SCRIPT'),[],JSON.stringify(v.errors.slice(0,3)))}
});
test('(R67.6-2) Kevy\'s 16 Nov list exactly: 2 Albaz, 1 White Dragon, no Albion the Shrouded Dragon, 2 Dogma, 1 Shining Flare Wingman',()=>{
 const b=presetFor(read('decks.json').decks.find(d=>d.id==='branded'),'tcg-2026-10-19'),n=(z,c)=>b[z].filter(x=>x===c).length;
 assert.equal(b.main.length,40);assert.equal(b.extra.length,15);assert.equal(n('main',68468459),2);assert.equal(n('main',73819701),1);assert.equal(n('main',25451383),0);
 assert.equal(n('extra',76666602),2);assert.equal(n('extra',87758525),1);assert.equal(n('extra',13243124),1);
 assert.deepEqual({main:b.main,extra:b.extra},(({main,extra})=>({main,extra}))(JSON.parse(fs.readFileSync('approved.json','utf8'))));
});

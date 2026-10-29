// r36 Time Typhoon effect titles (Claude, 29 Oct 2026; ChatGPT RELAY-067). SELF-VERIFIED.
//  1 Every RELAY-067 record of kind activated / activation-choice / delayed-operation is in EFFECT_TITLES with its title,
//    and its clause is an exact substring of the card's text (a title shows only when that exact clause is highlighted).
//  2 No menu, prompt, status, procedure, replacement or activation-only record became a title (RELAY-067 rules 1-5).
//  3 Every other card's titles are unchanged: EFFECT_TITLES minus the 11 new cards = the r35.9 object byte for byte.
import assert from 'node:assert/strict';import fs from 'node:fs';import crypto from 'node:crypto';import {gunzipSync} from 'node:zlib';
import {EFFECT_TITLES} from '../dist/effect-titles.mjs';
const cards=JSON.parse(gunzipSync(fs.readFileSync('dist/cards.json.gz'))),r67=JSON.parse(fs.readFileSync('tools/data/relay-067-effect-titles.json','utf8'));
assert.equal(r67.source.sha256,'9707b41df5b6e9c4a6346374a831e358e7d0d9b46987748790b83715d6259889');
const KEEP=new Set(['activated','activation-choice','delayed-operation']);let kept=0,dropped=0;
for(const [code,keys] of Object.entries(r67.records))for(const [k,r] of Object.entries(keys)){
 assert.ok(cards[code].desc.includes(r.clause),code+':'+k+' clause is in the card text');assert.ok(r.title.length<=48);
 if(KEEP.has(r.kind)){assert.deepEqual(EFFECT_TITLES[code]?.[k],{clause:r.clause,title:r.title},code+':'+k+' kept');kept++}
 else{assert.equal(EFFECT_TITLES[code]?.[k],undefined,code+':'+k+' ('+r.kind+') must not be a title');dropped++}}
const rest={...EFFECT_TITLES};for(const c of Object.keys(r67.records))delete rest[c];
assert.equal(crypto.createHash('sha256').update(JSON.stringify(rest)).digest('hex'),'afdda22b5002f643a06bee8c7c4ab2197ed714be0d4cbb475e77fbe919e3b6e2','every other card unchanged');
console.log(JSON.stringify({test:'r36-effect-titles',pass:true,node:process.version,kept,dropped}));

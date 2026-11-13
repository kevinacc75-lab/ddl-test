// r51 (Claude, 13 Nov 2026; Kevy 08:53 AEDT asked to fact-check the field layout). SELF-VERIFIED until reviewed.
// Renders the real board() markup order: own side Field/Extra on the left and Banish/Graveyard/Deck on the right;
// the opponent's side turned to face them (their Graveyard side on our left, both columns reversed).
import assert from 'node:assert/strict';import {test} from 'node:test';import fs from 'node:fs';
const app=fs.readFileSync(new URL('../dist/app.mjs',import.meta.url),'utf8');
const src=app.slice(app.indexOf('function board(p,opponent)'),app.indexOf('// MR5\'s two shared EMZs'));
const z=()=>({4:Array(7).fill(null),8:Array(6).fill(null),16:[1,2],32:[3],64:[4,5,6]});
const state={players:[{zones:z(),deck:30},{zones:z(),deck:31}]};
const board=new Function('state','cardSlot',src+';return board')(state,(c,label)=>`<i data-z="${label}"></i>`);
const order=html=>[...html.matchAll(/zone-(field|grave|banish|deck|extra)"|data-z="(FIELD SPELL|MONSTER 1|S \/ T 1)"/g)].map(m=>m[1]||m[2]);
test('(R51-1) own side, left to right and top to bottom: Field, Extra | rows | Banish, Graveyard, Deck',()=>{
 const o=order(board(0,false));assert.deepEqual(o.filter(x=>!/1$/.test(x)),['FIELD SPELL','extra','banish','grave','deck']);
 const h=board(0,false);assert.ok(h.indexOf('MONSTER 1')<h.indexOf('S / T 1'),'monsters (front row) above spells/traps');
 assert.match(h,/^<div class="pile-col field-side">/);assert.match(h,/<div class="pile-col gy-side">[^]*<\/div>$/)});
test('(R51-2) opponent side is turned to face them: Deck, Graveyard, Banish on our left; Extra, Field on our right; spells/traps above monsters',()=>{
 const h=board(1,true),o=order(h).filter(x=>!/1$/.test(x));assert.deepEqual(o,['deck','grave','banish','extra','FIELD SPELL']);
 assert.ok(h.indexOf('S / T 1')<h.indexOf('MONSTER 1'));assert.match(h,/^<div class="pile-col gy-side">/)});
test('(R51-3) every pile keeps its data hooks (click to view Graveyard, Banish, Extra Deck; Deck count)',()=>{
 const h=board(0,false);for(const k of ['data-pile="0:16"','data-pile="0:32"','data-pile="0:64"','data-deck-pile="0"'])assert.ok(h.includes(k),k)});

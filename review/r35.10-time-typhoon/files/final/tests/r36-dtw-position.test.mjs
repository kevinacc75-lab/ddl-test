// r36 Time Typhoon P5 (Claude, 29 Oct 2026; Kevy 18:35 play-test: "a full board but doesn't attack"). SELF-VERIFIED.
// A battle probe (tools/r36-battle-probe.mjs, seed 15) showed CXyz Hope Chaos Barian Dragon summoned in Defence Position
// (printed ATK 0, so the base pilot's "printed ATK < 1500 -> Defence" rule) and never attacking on an empty board.
//  1 Control: for a deck without this rule (Mikanko's seat), the pilot still picks Defence for printed-0 Barian.
//  2 For Time Typhoon the pilot (base + book) now picks Attack Position for Barian (it gains 1000 ATK per material); the
//    book pick hook overrides a Defence answer.
//  3 Nothing else changes: a low-ATK monster that does not gain ATK per material (Scapegoat Token, K9-ØØ Lupis is 2300 so
//    not low) keeps the base choice, and another deck's Barian-like card is untouched.
import assert from 'node:assert/strict';
import {engine,stopEngine,scenario,M,R} from '../tools/s3-harness.mjs';
import {bookPick} from '../dist/ai/book/book.mjs';
import {createOptimalPilots} from '../dist/optimal-pilot.mjs';
import {safeView} from '../dist/ai/knowledge.mjs';
await engine();
const d=scenario(['dtw','mikanko'],[],{first:0,seed:11});
const prompt=code=>({type:M.SELECT_POSITION,code,positions:1|4,seat:0,player:0});
const ps=createOptimalPilots({seed:1,searchEnabled:false}),p=ps[0];
const real=d.prompt;
// base choice for Barian
d.prompt={...prompt(79791695),seat:1,player:1};const ctl=ps[1].base(safeView(d,1)).response;assert.equal(ctl.position,4,'(1) control: another deck still puts printed-0 Barian in Defence');
d.prompt=prompt(79791695);const base=p.base(safeView(d,0)).response;assert.equal(base.position,1,'(2) Time Typhoon pilot: Attack Position');
const r=bookPick(d,0,d.prompt,{type:R.SELECT_POSITION,position:4});assert.ok(r,'(2) book overrides');assert.equal(r.response.position,1,'(2) Attack Position');assert.match(r.rule,/P5/);
// a low-ATK card without the per-material clause is untouched
d.prompt=prompt(3129528);const baseTok=p.base(safeView(d,0)).response;assert.equal(bookPick(d,0,d.prompt,baseTok)?.response?.position??baseTok.position,baseTok.position,'(3) Scapegoat Token: base choice kept');
// seat 1 (Mikanko) is not Time Typhoon: no override even for Barian
d.prompt={...prompt(79791695),seat:1,player:1};const r1=bookPick(d,1,d.prompt,{type:R.SELECT_POSITION,position:4});assert.ok(!r1||r1.response.position===4||!/P5/.test(r1.rule||''),'(3) other decks untouched');
d.prompt=real;d.stop();stopEngine();
console.log(JSON.stringify({test:'r36-dtw-position',pass:true,node:process.version,base:base.position,book:r.response.position}));

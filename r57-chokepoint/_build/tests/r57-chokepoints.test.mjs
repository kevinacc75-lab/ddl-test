// r57 Choke Point Lab (Claude, 13 Nov 2026): CP-001 r1 content as authored by ChatGPT (RELAY-193). SELF-VERIFIED until the
// Seto team checks it. Engine outcomes: r57-chokepoint-engine.test.mjs.
import assert from 'node:assert/strict';import {test} from 'node:test';import fs from 'node:fs';import {gunzipSync} from 'node:zlib';
import {CHOKEPOINTS,CP_CARDS,cpBeats} from '../dist/learn/chokepoints.mjs';import {MOODS} from '../dist/learn/tutors.mjs';import {boardHTML} from '../dist/learn/learn.mjs';
const db=JSON.parse(gunzipSync(fs.readFileSync(new URL('../dist/cards.json.gz',import.meta.url))));
const read=f=>fs.readFileSync(new URL('../'+f,import.meta.url),'utf8');const T=s=>s.replace(/’/g,"'");
const cp=CHOKEPOINTS.find(l=>l.id==='CP-001');
test('(R57-1) CP-001: ChatGPT’s exact bubbles, ruling and catch; Pass branch skips the Ash-only beats',()=>{
 const F1=["This lesson reveals the opponent's starting hand: Lode and Sage. We'll test one response to that exact line.","Lode's search is Chain Link 1. Ash is offered here. Try it, or pass to watch the control.","Ash is discarded before its effect resolves. It's now Chain Link 2.","Ash resolves first. Lode's search effect is negated, so Beryl isn't added.","Lode stays face-up. Its separate declaration effect can still summon Blue-Eyes White Dragon.","Sage was already in hand. Normal Summoning it still supplies the Tuner for this line.","With Sage and Blue-Eyes on the field, the shown line can still Synchro Summon Spirit Dragon.","We stopped a search, but this hand still has its main route. One negated effect isn't the same as stopping a deck."];
 assert.deepEqual(cpBeats(cp,'F1').map(b=>T(b.say)),F1);
 assert.deepEqual(cpBeats(cp,'F0').map(b=>T(b.say)),[F1[0],F1[1],"Lode resolves and adds Beryl. Now watch the same declared summon and Sage line.",F1[4],F1[5],F1[6]]);
 assert.equal(cpBeats(cp,null).length,2,'before choosing, the player stops at the choice');
 assert.equal(T(cp.ruling),"Ash negates Lode's search effect, not its card activation. Lode stays face-up and its separate summon effect remains available. With Sage already held, this fixed hand can still assemble Spirit Dragon's materials. This does not establish the best response against other hands.");
 assert.equal(T(cp.beats.find(b=>b.catch).catch),"We stopped Lode's search, not its separate summon effect. Sage was already in the revealed hand, so this line can still reach Spirit Dragon.");
 assert.equal(cp.strategy,'candidate');assert.deepEqual(cp.beats[1].choice.options.map(o=>o.branch),['F1','F0']);
 for(const b of cp.beats){assert.ok(MOODS.includes(b.mood),b.mood);assert.ok(b.say.length<=140)}
});
test('(R57-2) cards and text: names match the bundled data, quoted Lode text is exact, highlights are inside it, art exists',()=>{
 for(const [c,v] of Object.entries(CP_CARDS)){assert.equal(db[c].name,v.name);assert.ok(fs.existsSync(new URL('../dist/'+v.art,import.meta.url)),v.art);if(v.text)assert.equal(v.text,db[c].desc)}
 for(const b of cp.beats)if(b.text&&b.text.code===56506740)assert.ok(CP_CARDS[56506740].text.includes(b.text.hl));
 assert.ok(cp.sources.every(s=>/^https:\/\//.test(s.url)));assert.equal(cp.provenance,'Neuron EN / Rulebook v10');
});
test('(R57-3) the scripted reveal is labelled, the opponent field draws, and the engine tests named by the lesson exist',()=>{
 const h=boardHTML(cp.beats[1].board);assert.match(h,/SCRIPTED LESSON · HAND REVEALED/);assert.match(h,/OPPONENT’S SPELL &amp; TRAP ZONE/);assert.doesNotMatch(h,/YOUR MAIN MONSTER ZONES/);
 assert.match(boardHTML(cp.beats[5].board),/OPPONENT’S MONSTER ZONES[^]*Blue-Eyes White Dragon/);
 const titles=read('tests/r57-chokepoint-engine.test.mjs');for(const id of cp.engineTests)assert.ok(titles.includes(`test('(${id})`),id);
});
test('(R57-4) wiring: one player for both kinds, choices sit in the sticky control bar, compare the other branch, flags carry the branch and this build',()=>{
 const s=read('dist/learn/learn.mjs');
 assert.match(s,/const ALL=\[\.\.\.LESSONS,\.\.\.CHOKEPOINTS\]/);assert.match(s,/class="lr-controls lr-choice"/);assert.match(s,/data-act="otherbranch"/);
 assert.match(s,/branch:branch\|\|'before choice'/);assert.match(s,/build:ENGINE_EVIDENCE\.build/);assert.doesNotMatch(s,/build:'r53'/);
});

// r55 (Claude, 13 Nov 2026): ChatGPT RELAY-192 author revisions and RELAY-189 R53-I1. SELF-VERIFIED until reviewed.
import assert from 'node:assert/strict';import {test} from 'node:test';import fs from 'node:fs';
import {LESSONS,engineState} from '../dist/learn/lessons.mjs';import {ENGINE_EVIDENCE} from '../dist/learn/engine-evidence.mjs';
const read=f=>fs.readFileSync(new URL('../'+f,import.meta.url),'utf8');
test('(R55-E1) the engine badge needs a recorded pass for EVERY listed test; missing is NOT RUN, any failure is visible',()=>{
 const l={engineTests:['A','B']};
 assert.equal(engineState(l,{results:{A:'pass',B:'pass'}}),'reproduced');assert.equal(engineState(l,{results:{A:'pass'}}),'notrun');
 assert.equal(engineState(l,{results:{A:'pass',B:'fail'}}),'failed');assert.equal(engineState({engineTests:[]},{results:{}}),'notrun');assert.equal(engineState(l,undefined),'notrun');
 const titles=read('tests/r53-lessons-engine.test.mjs')+read('tests/r55-lessons-engine.test.mjs');
 for(const x of LESSONS)for(const id of x.engineTests)assert.ok(titles.includes(`test('(${id})`),x.id+': '+id+' is a real engine test');
 assert.match(ENGINE_EVIDENCE.build,/^r55/);assert.ok(Object.values(ENGINE_EVIDENCE.results).every(v=>v==='pass'||v==='fail'));
 const src=read('dist/learn/learn.mjs');assert.equal((src.match(/✓ Engine outcome reproduced/g)||[]).length,1,'one place draws the success badge, behind engineState');
});
test('(R55-E2) RELAY-192 content: RD-004 r2 s6 wording, exact Rulebook label, RD-002 r3 title',()=>{
 const rd4=LESSONS.find(l=>l.id==='RD-004');assert.equal(rd4.revision,2);assert.equal(rd4.beats[5].say,'In a fresh replay without Veiler, Riseheart banishes your opponent’s top three cards face-down and becomes Level 7.');
 const rb=LESSONS.flatMap(l=>l.sources).filter(s=>/SD_RuleBook_EN_10/.test(s.url));assert.ok(rb.length>=3);for(const s of rb)assert.equal(s.label,'Official Rulebook v10 (Chains pp. 44–47; ‘Actions which cannot be Chained to’ p. 50)');
 assert.equal(LESSONS.find(l=>l.id==='RD-002').revision,3);
});
test('(R55-E3) Learn is a real modal: background inert while open, Tab wraps both ways, focus restored on close',()=>{
 const s=read('dist/learn/learn.mjs');
 assert.match(s,/function open\(\)\{lastFocus=document\.activeElement;setInert\(true\);/);assert.match(s,/function close\(\)\{el\.hidden=true;setInert\(false\);/);
 assert.match(s,/if\(e\.key==='Tab'\)\{/);assert.match(s,/e\.shiftKey&&\(document\.activeElement===first/);assert.match(s,/lastFocus\?\.focus/);
});

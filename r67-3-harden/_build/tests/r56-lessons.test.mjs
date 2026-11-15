// r56 (Claude, 13 Nov 2026): RD-005 r2 content as authored by ChatGPT (RELAY-192). SELF-VERIFIED until the Seto team re-checks.
import assert from 'node:assert/strict';import {test} from 'node:test';
import {LESSONS} from '../dist/learn/lessons.mjs';import {boardHTML} from '../dist/learn/learn.mjs';
const T=s=>s.replace(/’/g,"'");/* compare with the packet's straight apostrophes */
test('(R56-1) RD-005 r2: exact bubbles, verdicts, ruling; s06 is marked source-led; both engine scenes listed',()=>{
 const l=LESSONS.find(x=>x.id==='RD-005');assert.equal(l.revision,2);assert.equal(l.title,'A negated activation and a negated effect are different');
 assert.deepEqual(l.beats.map(b=>T(b.say)),["Fire Dance says you can only activate 1 per turn. Watch exactly what Ghost Belle negates.","Fire Dance can Special Summon from the GY, so Ghost Belle can answer its activation.","Ghost Belle negates the activation. That is different from negating only an effect.","A negated activation doesn't use up Fire Dance's limit, so your second copy can still be activated.","Reset: let the first Fire Dance resolve. Now the limit is used, so the second copy can't be activated this turn.","If only Fire Dance's effect were negated, the activation would still count: no second copy that turn."]);
 assert.deepEqual(l.beats.map(b=>b.verdict),['observation','observation','activation_negated','legal_action','condition_not_met','observation']);
 assert.equal(T(l.ruling),"Fire Dance limits activations, not uses. If its card activation is negated, it doesn't count, so another Fire Dance can be activated that turn. If the activation resolves, even with its effect negated, the limit is used.");
 assert.ok(l.beats[5].tags.includes('SOURCE-LED'));assert.deepEqual(l.engineTests,['RD-005 A','RD-005 B']);
 assert.ok(l.sources.some(s=>/Libromancer-Manual\.pdf$/.test(s.url))&&l.sources.some(s=>/cid=18020&ope=4/.test(s.url)));
});
test('(R56-2) the lesson board can show the Graveyard',()=>{assert.match(boardHTML({gy:[18377261]}),/YOUR GRAVEYARD[^]*Ha-Re the Sword Mikanko/)});
test('(R56-3) handOff greys only the hand copy, not the same card on the field',()=>{const h=boardHTML({st:[80044027],hand:[80044027],handOff:[80044027]});
 assert.equal((h.match(/lr-card off/g)||[]).length,1)});

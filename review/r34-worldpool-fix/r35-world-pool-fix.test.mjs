// r35 world-pool fix (TEST branch from r34). SELF-VERIFIED (builder); the S2b determinism run is Seto's independent check.
// 1. The pool's random streams no longer depend on the process-wide duel counter: pools for the same seed and seat in
//    duel17 and duel18 get the same seedKey; live and tool keys keep their own key.
// 2. A new duel's first pool drops every pool left by an earlier duel (both seats) at once.
import assert from 'node:assert/strict';
import {WorldPool, poolFor, dropAllPools, duelIdentity} from '../dist/ai/world-pool.mjs';
assert.equal(new WorldPool('duel17|0|16').seedKey, new WorldPool('duel18|0|16').seedKey);
assert.equal(new WorldPool('duel17|1|16').seedKey, 'duel|1|16');
assert.notEqual(new WorldPool('duel17|0|16').seedKey, new WorldPool('duel17|1|16').seedKey, 'seats still differ');
assert.equal(new WorldPool('live:3|0|10').seedKey, 'live:3|0|10', 'live keys unchanged');
assert.equal(new WorldPool('audit:mikanko:201|0|10').seedKey, 'audit:mikanko:201|0|10', 'tool keys unchanged');
dropAllPools();
const a = duelIdentity({}), b = duelIdentity({});
const a0 = poolFor(a + '|0|16'), a1 = poolFor(a + '|1|16');
let released = 0; for (const p of [a0, a1]) { const r = p.release.bind(p); p.release = () => { released++; r(); }; }
const b0 = poolFor(b + '|0|16');
assert.equal(released, 2, 'both pools of the earlier duel are released when the next duel makes its first pool');
assert.equal(poolFor(b + '|0|16'), b0, 'same duel and seat: same pool');
dropAllPools();
console.log(JSON.stringify({test: 'r35-world-pool-fix', pass: true, node: process.version, selfVerified: true}));

// r54 AI-1 (Claude, 13 Nov 2026; ChatGPT RELAY-162/164 found the same route). The deck-brain "never Normal Summon" holds
// (bookSummonBlock) now also bind the root search options and the close-out extras, as they already bound the base pool.
// Benchmark (2 x 128 per arm, same machine, sequential): fix 101-27 + 100-28 = 201-55; baseline 99-29 + 100-28 = 199-57.
// Within noise: kept for correctness (not worse), no strength gain claimed.
import assert from 'node:assert/strict';import {test} from 'node:test';import fs from 'node:fs';
const src=fs.readFileSync(new URL('../dist/optimal-pilot.mjs',import.meta.url),'utf8');
test('(R54-AI1) Normal Summon holds bind root search and close-out extras',()=>{
 assert.match(src,/key==='summons'&&\(tributeBlock\(view,seat,c\)\|\|this\.book&&bookSummonBlock\(view,seat,c,isPayoff\)\)\/\* r52 AI-1/);
 assert.match(src,/!\(key==='summons'&&\(tributeBlock\(view,seat,c\)\|\|this\.book&&bookSummonBlock\(view,seat,c,isPayoff\)\)\)\/\* r52 AI-1 \*\//);
});

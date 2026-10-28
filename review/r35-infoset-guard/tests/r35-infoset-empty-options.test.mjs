// r35 (Claude, 28 Oct 2026). SELF-VERIFIED (builder = verifier), NOT independent. searchInfoSet on the REPLAY path (no
// snapshot search core) with an EMPTY candidate list used to throw "Cannot read properties of undefined (reading
// 'rejected')" (evaluateAction(particle, 0) with stats[0] undefined). It must now return the empty report (response null),
// which OptimalPilot.search turns into its baseline plan, and must not sample any world.
import assert from 'node:assert/strict';
import {searchInfoSet} from '../dist/ai/info-set.mjs';
let sampled=0;const sampler={failures:[],pinConflicts:[],sample(){sampled++;return null}};
const d={turn:3,prompt:{type:11,seat:0},knowledge:[{},{}]};
const r=searchInfoSet({d,seat:0,sampler,options:[],policies:()=>null,evaluate:()=>0,nodeBudget:40,rng:()=>0});
assert.equal(r.response,null,'nothing to search: no response, the caller keeps its baseline');
assert.equal(r.aggregatedWorlds,0);assert.equal(r.status,'fallback');assert.deepEqual(r.candidates,[]);assert.equal(sampled,0,'no world sampled');
// 2 (added 29 Oct): the real failure. A sampler that DOES produce a world: without the guard, evaluateAction(world, 0)
// reaches stats[0].rejected and throws "Cannot read properties of undefined (reading 'rejected')". With it: no throw,
// no world sampled, empty report.
let sampled2=0;const world={sampleId:0,sampleOrders:[],sampleCoreSeed:0,responseHistory:[],stop(){}};
const sampler2={failures:[],pinConflicts:[],sample(){sampled2++;return world},repeat(){return world}};
const r2=searchInfoSet({d,seat:0,sampler:sampler2,options:[],policies:()=>null,evaluate:()=>0,nodeBudget:40,rng:()=>0});
assert.equal(r2.response,null);assert.equal(sampled2,0,'no world sampled (sampler that would produce one)');
console.log(JSON.stringify({test:'r35-infoset-empty-options',pass:true,node:process.version}));

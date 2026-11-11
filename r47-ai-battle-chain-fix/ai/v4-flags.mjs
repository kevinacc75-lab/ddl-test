// r45 v4 AI (Kevy approved 11 Nov 2026 11:53 AEDT: "Yes, build the v4 AI after r44"). One switchboard for the v4 changes
// so tests and the benchmark can turn each one off (V4.on=false gives the r44 behaviour for the switched parts).
export const V4={
 on:true,
 // item 6: search work caps (see ai/world-pool.mjs maintain) and a soft per-decision search budget inside the 1.5 s deadline.
 search:{softMs:1250,refillCap:4,renewCap:1,minRefillMs:550},
 // item 3: lethal finder / whole-turn push (ai/book/v4-plan.mjs).
 lethal:true,
 // item 2: recovery lines after a turn-1 interruption and the no-hand-trap-revive rule (ai/book/branded-nov08.mjs).
 recovery:true,
 // item 5: Sky Striker lines (ai/book/sky-lines.mjs). Shipped OFF in r45 (r44 Sky behaviour): in 16-game pilots against
 // WindBot Branded the lines went 2-14 (trusted), 2-14 (search-compared) and 4-12 (Raye->Zero pick, no caps) versus 5-11 with
 // them off, so they stay in the build for review but do not play. setV4({sky:true}) turns them on.
 sky:false
};
export const setV4=(patch={})=>{for(const [k,v] of Object.entries(patch))V4[k]=v&&typeof v==='object'&&!Array.isArray(v)?{...V4[k],...v}:v;return V4};

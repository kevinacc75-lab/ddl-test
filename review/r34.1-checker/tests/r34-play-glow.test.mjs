// r34 gold aura (Kevy 23 Oct 13:04: "implement an aura glow now so I can see"). SELF-VERIFIED (builder = verifier).
// In Play / Control-both modes, cards usable right now carry .can-act (play-flow.mjs refresh, pinned by r23-fx) and, in
// chain windows, .can-chain (chain-glow.mjs): a hand trap you can chain (e.g. Ash Blossom) glows gold too.
import assert from 'node:assert/strict';import fs from 'node:fs';
import {chainSlots} from '../dist/chain-glow.mjs';import {M,R} from '../dist/duel.mjs';
const chainX=(mode='play',view=0)=>({mode,view,ai:false,disabled:false,match:{first:0},state:{finished:false,prompt:{type:M.SELECT_CHAIN,forced:false,selects:[{code:14558127,controller:0,location:2,sequence:3,description:0}]}},
 choices:[{label:'Chain · Ash Blossom & Joyous Spring',response:{type:R.SELECT_CHAIN,index:0},code:14558127},{label:'Do not chain',response:{type:R.SELECT_CHAIN,index:null}}]});
assert.deepEqual([...chainSlots(chainX())],['0:2:3'],'the chainable hand card glows');
assert.equal(chainSlots({...chainX(),ai:true}).size,0,'not while the AI is deciding');
assert.equal(chainSlots(chainX('watch')).size,0,'not in Watch mode');
assert.equal(chainSlots(chainX('play',1)).size,0,'only the viewing player\'s cards');
const css=fs.readFileSync('dist/r34-arena.css','utf8');assert.match(css,/:is\(\.can-act,\.can-chain\)\{outline:2px solid #ffd76a/,'gold aura');assert.match(css,/prefers-reduced-motion:reduce\)\{body\.in-duel :is\(#my-hand \.hand-card,#duel \[data-slot\]\):is\(\.can-act,\.can-chain\)\{animation:none/,'reduced motion: no pulse');
import fs2 from 'node:fs';import {createHash} from 'node:crypto';assert.equal(createHash('sha256').update(fs2.readFileSync('dist/play-flow.mjs')).digest('hex'),'dccc07f05a4c06b9d4c1c1a090dc297ba43d82fde185bacfa7988aa30c757511','play-flow.mjs stays pinned');
console.log(JSON.stringify({test:'r34-play-glow',pass:true,node:process.version,selfVerified:true}));

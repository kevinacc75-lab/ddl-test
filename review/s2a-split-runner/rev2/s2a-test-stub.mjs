// Test stub for tools/s2a-adversarial-test.mjs ONLY (set S2A_TEST_STUB to this file). It stands in for the frozen gate
// module: same exported driver shape, the gate's schedule formula, and a fake playDuel whose behaviour is chosen by
// S2A_STUB_MODE: clean | throw:<job> | blunder:<job> | slow:<ms>. Lines written under a stub are stamped nonCounting.
import crypto from 'node:crypto';
const ACCEPT_SEEDS=[2026,12345,808,777,4242,555,31337,99];const rootQuality=[];
export async function __splitInit(){return {make:null,STAGE:'S2a',DUELS:200,BUDGET:400,RANDOM_SEEDS:0,ENGINE:'snapshot',WL_PATH:'tests/self-target-whitelist.json',CANDIDATE:'dist/optimal-pilot.mjs',ACCEPT_SEEDS}}
export const __schedule=n=>{const pairs=[];for(let a=0;a<4;a++)for(let b=a;b<4;b++)for(const first of [0,1])pairs.push([a,b,first]);const seeds=[...ACCEPT_SEEDS];for(let i=0;seeds.length<n;i++)seeds.push(300001+i*7919);return seeds.slice(0,n).map((seed,i)=>({seed,a:pairs[i%20][0],b:pairs[i%20][1],first:pairs[i%20][2]}))};
const ids=['branded','mikanko','sky','luna'];
export async function __playDuel(job){const mode=process.env.S2A_STUB_MODE||'clean',[kind,arg]=mode.split(':');
 if(kind==='slow')await new Promise(r=>setTimeout(r,Number(arg)));
 const idx=__schedule(200).findIndex(j=>j.seed===job.seed);
 if(kind==='throw'&&Number(arg)===idx)throw Error('stub execution error');
 rootQuality.push({status:'full',logged:true,matchedWorlds:16});
 const m={seed:job.seed,pair:[ids[job.a],ids[job.b]],first:job.first,hash:crypto.createHash('sha1').update('stub'+job.seed).digest('hex'),decisions:10,searched:2,finished:true,winner:0,turns:3,retries:0,
  ownHarmWithOppTarget:[],nonWhitelistedOwn:[],cutShortTurns:[],throws:[],stalls:[],forcedOwnUnlogged:[],forcedOwnPicks:[]};
 if(kind==='blunder'&&Number(arg)===idx)m.throws=[{turn:2,decision:5,message:'stub blunder'}];
 return m}
export const __rootQuality=()=>rootQuality;

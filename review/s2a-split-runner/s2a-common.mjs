// Shared constants for the S2a split runner, supervisor and recombine (Claude, 28 Oct 2026). Pinned identities come from
// Seto's S2b JSON and the reproduction rows (RELAY-047 asked for full engine sha1s, not prefixes).
import fs from 'node:fs';import path from 'node:path';
export const PIN={frozen:{'tests/ai-gate.mjs':'1c380d58afc51f07ce76615d4b5cd8f185e7675de19b3fea72e1950088a14dee','tests/self-target-whitelist.json':'9f1fb5f5487ea60ea7afdc3aac624c269608510e4cdab598878c2ec86bae0ee3','dist/ai/world-pool.mjs':'807133d3049dc7af690042b258d7bba8f7e2672c8e908af27605ed1bb4b000b8'},
 engineSha1:{'dist/ai/engine-snapshot.mjs':'64a4b25ad85697c1601fd651405adbcb1380a344','dist/ai/info-set.mjs':'9337e197e3bfde42414ca642bdc932efd2a85fc4','dist/ai/determinize.mjs':'f81fee91541813ffad79642d319c7bdfae527598'},
 prefixSha256:'eed7e402ce0fa82cec8bb89aead8e7c8392ffca98cb6b5169542982b0da500fa',node:'v22.22.2',budget:400,randomSeeds:0,engine:'snapshot',version:'2.2.0-rc'};
export const BLUNDERS=['ownHarmWithOppTarget','nonWhitelistedOwn','cutShortTurns','throws','stalls','forcedOwnUnlogged'];
export const STAGE_A=[0,20,1,21, 2,22,3,23, 8,28,9,29, 4,24,5,25, 10,30,11,31, 14,34,15,35, 16,36,17,37, 6,26,7,27, 12,32,13,33, 18,38,19,39];
export function queueOrder(){const firstCells=[0,1,2,3,8,9],B=[];for(let k=2;k<10;k++)for(const c of firstCells)B.push(c+20*k);for(let k=2;k<10;k++)for(let c=0;c<20;c++)if(!firstCells.includes(c))B.push(c+20*k);return [...STAGE_A,...B]}
// Every job line in a directory, in file-name then line order; unreadable lines are kept as {__bad:true}.
export function readLines(dir){return fs.readdirSync(dir).filter(f=>/^jobs-shard.*\.jsonl$/.test(f)).sort().flatMap(f=>fs.readFileSync(path.join(dir,f),'utf8').split('\n').filter(Boolean).map((t,n)=>{try{return {...JSON.parse(t),__file:f,__line:n+1}}catch{return {__bad:true,__file:f,__line:n+1}}}))}

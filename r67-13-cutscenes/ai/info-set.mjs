import {M} from '../duel.mjs';
import {actionKey,encodeResponse,remapResponse} from './semantic.mjs';
import {safeView,publicKey,promptKey} from './knowledge.mjs';
import {PROPOSALS_PER_WORLD} from './determinize.mjs';
import {saveWorld,restoreWorld,restorePristine,releaseWorld,snapshotBytesHeld} from './engine-snapshot.mjs';
// Seto: hard cap on snapshot memory held by one search (phones).
export const SNAPSHOT_CAP_BYTES=80*1048576;
export const MACROS=new Set([M.SELECT_IDLECMD,M.SELECT_BATTLECMD,M.SELECT_CHAIN]);
// Stream complete sampled-world evaluations. Live callers can cap compute;
// qualification uses only the deterministic node/proposal limits.
export function searchInfoSet({d,seat,sampler,options,policies,evaluate,nodeBudget,rng,onProgress,shouldStop=()=>false,unsafeTarget,verifyRestores=globalThis.DDL_VERIFY_RESTORES===true,branchByReplay=false,keepSamplingHook=false,snapshotCapBytes=SNAPSHOT_CAP_BYTES,seatCapBytes=snapshotCapBytes,pool=null,priorSearchRoots,turnHorizon=false,poolOptions=null}){
 let nodes=0,opponentWindows=0,accepted=0,proposals=0,rootAccepted=false,risk=0;const stats=options.map(response=>({response,key:actionKey(d,response),sum:0,visits:0,rejected:0}));
 /* r29 experiment (off by default): turnHorizon plays each candidate on to the END OF THE CURRENT TURN with the rollout policy (book + heuristics), so the score is the finished board, not a half-built one three steps in. */
 const horizon=turnHorizon?80:Math.max(1,Math.min(3,Math.floor(nodeBudget/(16*options.length)))),initialTurn=d.turn,semantics=options.map(response=>encodeResponse(d,d.prompt,response,seat,d.knowledge[seat]));
 let matchedMode=false,memoryCapped=false,heldWorlds=0,poolReport=null;
 /* r45 v4 item 6: with a world pool the most worlds a search can compare is the pool size (10 in Watch), so the r44 rule
    "full = 16 matched worlds" could never be met there. full = every candidate compared on min(16, pool size) matched
    worlds; 'finished' (below) additionally requires that no deadline / budget cut happened. */
 const fullWorlds=pool?Math.max(8,Math.min(16,pool.size||16)):16;
 // Seto's matched-worlds rule (snapshot search): moves are compared only on worlds where every
 // compared move has a result. If fewer than eight such worlds exist, the move missing the most
 // worlds drops out and the rest are compared again.
 const rankMatched=()=>{let cands=stats.filter(x=>x.visits>=8&&x.byWorld);
  while(cands.length){const worlds=[...cands[0].byWorld.keys()].filter(w=>cands.every(c=>c.byWorld.has(w)));
   if(worlds.length>=8)return {matched:worlds.length,ranked:cands.map(c=>({...c,visits:worlds.length,score:worlds.reduce((s,w)=>s+c.byWorld.get(w),0)/worlds.length})).sort((a,b)=>b.score-a.score||a.key.localeCompare(b.key))};
   cands=[...cands].sort((a,b)=>a.byWorld.size-b.byWorld.size||b.key.localeCompare(a.key)).slice(1)}
  return {matched:0,ranked:[]}};
 const rank=()=>matchedMode?rankMatched().ranked:stats.filter(x=>x.visits>=8).map(x=>({...x,score:x.sum/x.visits})).sort((a,b)=>b.score-a.score||a.key.localeCompare(b.key));
 const report=()=>{const ranked=rank(),best=ranked[0],shared=matchedMode?(best?.visits||0):null;return {response:best?.response||null,score:best?.score??null,aggregatedWorlds:best?.visits||0,nodes,determinizations:accepted,opponentWindows,horizon,status:matchedMode?(shared>=fullWorlds?'full':shared>=8?'reduced':'fallback'):(accepted>=16?'full':accepted>=8?'reduced':'fallback'),matchedWorlds:shared,comparedMoves:matchedMode?ranked.length:null,memoryCapped,heldWorlds:matchedMode?heldWorlds:null,pool:poolReport,engine:matchedMode?'snapshot':'replay',candidates:stats.map(x=>({key:x.key,visits:x.visits,rejected:x.rejected,score:x.visits?x.sum/x.visits:null,...(x.leaf?{leaf:{...x.leaf}}:{})}))}};
 function applyMacro(sim,response,root=false){const before=sim.retries;sim.respond(response);nodes++;if(sim.retries!==before)throw Error('Root/rollout response rejected');if(root)rootAccepted=true;for(let i=0;i<64&&!sim.finished&&!MACROS.has(sim.prompt.type);i++){if(!(d.prompt.type===M.SELECT_CHAIN&&d.prompt.forced)&&unsafeTarget?.(sim))risk++;const p=policies(sim.prompt.seat),plan=p.base(safeView(sim,sim.prompt.seat),{log:false});if(!plan)throw Error('No sub-pick');const old=sim.retries;sim.respond(plan.response);p.observe(plan);if(sim.retries!==old)throw Error('Sub-pick rejected')}if(!sim.finished&&!MACROS.has(sim.prompt.type))throw Error('Sub-pick bound exceeded')}
 // r36 (TEST branch r36-midgame, Arm A only; Seto 30 Oct, ChatGPT RELAY-075 A1). A plain-number evaluate (boardScore)
 // takes exactly the r35.11 path. An evaluate that returns {score,status,cost,reason} (the Arm A after-battle judge) has
 // its cost (rollout responses + planner work, in node units) charged to this search's node count, and its status kept on
 // the candidate (candidates[].leaf): 'complete' scores as a leaf; 'cutoff' (deadline / node budget / response bound) is
 // not a visit; 'rejected' / 'error' counts as a rejected continuation with the same -100000 penalty as a rejected sub-pick.
 const leafScore=(a,ev,r,counted)=>{if(typeof ev==='number')return ev-100000*r;nodes+=ev.cost||0;const L=stats[a].leaf??={complete:0,cutoff:0,rejected:0,error:0};L[ev.status]=(L[ev.status]||0)+1;
  if(ev.status==='complete'||counted)return ev.score-100000*r;if(ev.status==='cutoff')return null;stats[a].rejected++;return ev.score-100000*(r+1)};
 const deferred=[];
 // keep=true: the sim is a restored world snapshot, so it must stay alive for the next branch.
 function evaluateAction(sim,a,world=null,keep=false){
   rootAccepted=false;risk=0;policies(0,true);if(!sim){stats[a].rejected++;return}
   let score=null;
   try{applyMacro(sim,remapResponse(sim,semantics[a],rng),true);for(let n=1;n<horizon&&!sim.finished&&nodes<nodeBudget&&!shouldStop();n++){
     if(sim.turn>initialTurn+(turnHorizon?0:1))break;const player=sim.prompt.seat;if(player!==seat&&sim.prompt.type===M.SELECT_CHAIN)opponentWindows++;
     const p=policies(player),plan=p.base(safeView(sim,player),{log:false});if(!plan)break;applyMacro(sim,plan.response);p.observe(plan)
    }score=leafScore(a,evaluate(sim,seat,{candidate:a,key:stats[a].key,world,nodesLeft:nodeBudget-nodes,shouldStop}),risk,false);
   }catch{stats[a].rejected++;if(rootAccepted)score=leafScore(a,evaluate(sim,seat,{candidate:a,key:stats[a].key,world,nodesLeft:nodeBudget-nodes,shouldStop,afterError:true}),risk+1,true)}finally{if(!keep)sim.stop()}
   if(score!==null){stats[a].sum+=score;stats[a].visits++;if(world!==null)(stats[a].byWorld??=new Map()).set(world,score)}
   onProgress?.(report());
 }
 // r18 diagnostics (no effect on search): why proposals were rejected, over every attempt in this decision.
 const rejections=()=>{const hist={};for(const f of sampler.failures||[])hist[f.reason]=(hist[f.reason]||0)+1;const pd=pool?.stats?.discardReasons||{};return {lastRejection:sampler.failures?.at(-1)?.reason??null,rejectionHistogram:hist,poolDiscardReasons:{...pd},pinConflictDetails:(sampler.pinConflicts||[]).slice(0,4)}};
 if(sampler.snapshots&&pool){const r=searchWithPool();return {...r,...rejections()}}
 if(sampler.snapshots){const r=searchWithSnapshots();return {...r,...rejections()}}
 // Complete the public policy's action across worlds first. A live deadline
 // can then return an eight-world aggregate before other branches finish.
 // Every uncapped action still receives the same sixteen sampled roots.
 while(accepted<16&&proposals<16*PROPOSALS_PER_WORLD&&nodes<nodeBudget&&!shouldStop()){
  const particle=sampler.sample(proposals++,shouldStop);if(!particle){if(sampler.capped)break;continue}accepted++;
  deferred.push({sampleId:particle.sampleId,sampleOrders:particle.sampleOrders,sampleCoreSeed:particle.sampleCoreSeed,responseHistory:[...particle.responseHistory]});
  evaluateAction(particle,0);
 }
 for(let a=1;a<stats.length&&nodes<nodeBudget&&!shouldStop();a++){
  for(const particle of deferred){if(nodes>=nodeBudget||shouldStop())break;evaluateAction(sampler.repeat(particle),a)}
 }
 return {...report(),capped:shouldStop()||!!sampler.capped,...rejections()};

 // Pool search (Round 2b, Seto ruling A): the persistent world pool is maintained to this root
 // (advance survivors, retire on schedule, refill), then every candidate move is branched from each
 // pool world, world by world, ranked on matched worlds. The pool keeps its snapshots afterwards.
 // Flagged (may differ from the headless pick): maintenance cut, a slot behind or out of sync, or the memory cap.
 function searchWithPool(){
  matchedMode=true;const core=sampler.core;
  // Each world is compared as soon as its slot is current (same evaluation order as comparing after upkeep, so a
  // complete search gives the same per-world scores; a cut one keeps the worlds already compared). World keys are slots.
  // Memory cap (Seto): the AI worker's 80 MB is split across its AI seats (live: 40 MB each in Watch, 80 MB in Play).
  // Once this seat's pool is over its share and eight worlds are compared, further worlds are dropped (the headless
  // pool keeps them, so those slots go out of sync and the pick is flagged until they resync).
  let capped=false;const held=[];
  const compare=(slot,w)=>{
   if(nodes>=nodeBudget||shouldStop())return;
   if(held.length>=8&&pool.bytes()>Math.min(seatCapBytes,snapshotCapBytes)){memoryCapped=capped=true;pool.dropSlot(slot);return}
   held.push(w);accepted=held.length;
   if(branchByReplay){ // test twin: rebuild every branch of this pool world from turn 1 by its own native responses
    const sim0=restoreWorld(w.snap,{verify:verifyRestores}),orders=sim0.sampleOrders,seed=sim0.sampleCoreSeed,history=[...sim0.responseHistory];
    for(let a=0;a<stats.length&&nodes<nodeBudget&&!shouldStop();a++){restorePristine(core);const r=sampler.startFixed(orders,seed);delete r.pendingStartDraws;for(const resp of history)r.respond(resp);evaluateAction(r,a,slot,false)}
    return}
   for(let a=0;a<stats.length&&nodes<nodeBudget&&!shouldStop();a++)evaluateAction(restoreWorld(w.snap,{verify:verifyRestores}),a,slot,true);
  };
  let maint,complete,flagged;
  try{({complete,flagged,report:maint}=pool.maintain(sampler,{shouldStop,verify:verifyRestores,priorSearchRoots,onWorld:compare,...(poolOptions||{})}))}finally{restorePristine(core)}
  heldWorlds=held.length;
  poolReport={...maint,complete,flagged:flagged||capped,cutAt:pool.cutAt,cutLineageWorlds:held.filter(w=>!w.inSync).length,worlds:held.length};
  const cut=shouldStop()||nodes>=nodeBudget,rep=report();return {...rep,capped:cut||!complete,finished:!cut&&!capped&&held.length>=8&&rep.matchedWorlds===held.length&&rep.comparedMoves===stats.filter(x=>x.visits>0||x.rejected===0).length,worldScores:stats.map(x=>x.byWorld?Object.fromEntries(x.byWorld):{})};
 }

 // Snapshot search (Round 2): replay each sampled world to the root once, save it, then branch
 // every candidate move from that copy. World by world, so after eight worlds every move has
 // been compared on the same eight worlds; a deadline cut still has a fair answer.
 function searchWithSnapshots(){
  matchedMode=true;const core=sampler.core,worlds=[];
  const rootKey=sim=>publicKey(sim,seat)+'|'+promptKey(sim,seat)+'|'+sim.responseHistory.length;
  try{
   while(accepted<16&&proposals<16*PROPOSALS_PER_WORLD&&nodes<nodeBudget&&!shouldStop()){
    restorePristine(core);
    const particle=sampler.sample(proposals++,shouldStop);if(!particle){if(sampler.capped)break;continue}
    if(!keepSamplingHook)delete particle.handleMessage; // sampling-only hook; every branch is evaluated by the plain wrapper (test switch keeps Round 1's hook)
    if(branchByReplay){ // test twin: identical world-by-world search, every branch rebuilt by a full replay
     const world=accepted++,sample={sampleId:particle.sampleId,sampleOrders:particle.sampleOrders,sampleCoreSeed:particle.sampleCoreSeed,responseHistory:[...particle.responseHistory]};particle.stop();
     for(let a=0;a<stats.length&&nodes<nodeBudget&&!shouldStop();a++){restorePristine(core);evaluateAction(sampler.repeat(sample),a,world,false)}continue}
    const world=accepted++,snap=saveWorld(particle,rootKey);worlds.push(snap);
    for(let a=0;a<stats.length&&nodes<nodeBudget&&!shouldStop();a++)evaluateAction(restoreWorld(snap,{verify:verifyRestores}),a,world,true);
    // Seto: hard cap on held snapshots; drop back to eight worlds (results already counted) and stop sampling.
    heldWorlds=worlds.length;
    if(snapshotBytesHeld(core)>snapshotCapBytes){memoryCapped=true;for(const w of worlds.splice(8))releaseWorld(w);heldWorlds=worlds.length;if(accepted>=8)break}
   }
  }finally{for(const w of worlds)releaseWorld(w);restorePristine(core)}
  return {...report(),capped:shouldStop()||!!sampler.capped,worldScores:stats.map(x=>x.byWorld?Object.fromEntries(x.byWorld):{})};
 }
}

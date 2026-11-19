// r36 Arm A after-battle rollout and judge (Seto, 30 Oct 2026; ChatGPT RELAY-075 A1/A2). TEST branch r36-midgame only.
// Replaces 98400d6's inline `judge` callback (optimal-pilot.mjs), which ran up to 48 sim.respond calls with no deadline
// check, no node-budget charge, swallowed exceptions, and scored a rejected (sim.retries) continuation as a normal leaf.
// Contract (see searchInfoSet's leafScore in ai/info-set.mjs):
//   * the judge returns {score,status,cost,reason}; cost = rollout macro responses (searchInfoSet's node unit: one macro
//     decision with its sub-picks) + planner nodes / JUDGE.PLANNER_NODES_PER_UNIT (projection + both next-turn planners);
//   * status 'complete' = the leaf was not in our Battle Phase, or the rollout left it / the duel ended -> a scored leaf;
//     'cutoff' = deadline (shouldStop), node budget or the response bound stopped it -> NOT a visit;
//     'rejected' = a continuation response moved sim.retries; 'error' = exception or no policy response -> both are a
//     rejected continuation (penalised like a rejected sub-pick), never a completed after-battle leaf.
//   * an expired deadline at entry is a cutoff before any response or planner work.
//   * RELAY-076 A1: the deadline is re-checked after each policy.base and each sim.respond, and scoring (material +
//     planners) runs under the remaining node allowance and the stop predicate; any truncation = cutoff, never complete.
// Optional `diag` array (tools only, e.g. tools/r36-diag.mjs) receives one record per leaf: root candidate, start/end
// turn+phase, the continuation responses, LP, score parts, cost, status and reason.
import {safeView} from './knowledge.mjs';
import {MACROS} from './info-set.mjs';
import {JUDGE,judgeParts,inBattle} from './midgame.mjs';
const PHASES={1:'draw',2:'standby',4:'main1',8:'battle start',16:'battle step',32:'damage step',64:'damage calc',128:'battle end',256:'main2',512:'end'};
export const phaseName=p=>PHASES[p]||String(p);
const snap=(sim,out)=>{out.endTurn=sim.turn;out.endPhase=sim.phase;out.endActive=sim.active;out.lp=[...(sim.lp||[])];out.finished=!!sim.finished;return out};
// Play `sim` on to the end of `seat`'s current Battle Phase with the rollout policies. Never throws.
export function afterBattleRollout(sim,seat,{policyFor,shouldStop=()=>false,nodesLeft=Infinity,maxResponses=JUDGE.ROLLOUT_MAX,trace=false}={}){
 const out={status:'complete',reason:null,startTurn:sim.turn,startPhase:sim.phase,startActive:sim.active,needed:false,responses:0,macros:0,trace:trace?[]:null};
 const inOurBattle=()=>!sim.finished&&sim.active===seat&&inBattle(sim.phase)&&!!sim.prompt;
 try{
  if(!inOurBattle())return snap(sim,out);
  out.needed=true;
  while(inOurBattle()){
   if(shouldStop()){out.status='cutoff';out.reason='deadline (shouldStop) during the after-battle rollout';break}
   if(out.macros>=nodesLeft){out.status='cutoff';out.reason='node budget used up during the after-battle rollout';break}
   if(out.responses>=maxResponses){out.status='cutoff';out.reason='response bound '+maxResponses+' reached inside our Battle Phase';break}
   const s=sim.prompt.seat,type=sim.prompt.type,p=policyFor(s),plan=p.base(safeView(sim,s),{log:false});
   if(!plan){out.status='error';out.reason='no rollout policy response (prompt type '+type+')';break}
   // RELAY-076 A1: the deadline can fire while the policy computes its plan -> stop before sending the response.
   if(shouldStop()){out.status='cutoff';out.reason='deadline (shouldStop) fired inside the rollout policy; response not sent';break}
   const old=sim.retries;sim.respond(plan.response);out.responses++;if(MACROS.has(type))out.macros++;
   if(trace)out.trace.push({seat:s,type,response:plan.response,phaseAfter:sim.phase});
   if(sim.retries!==old){out.status='rejected';out.reason='continuation response rejected (sim.retries '+old+' -> '+sim.retries+')';break}
   p.observe(plan);
   // RELAY-076 A1: ... or while the engine applies the response; a response that left battle under an expired deadline
   // is truncated work, not a completed rollout.
   if(shouldStop()){out.status='cutoff';out.reason='deadline (shouldStop) fired during a continuation response';break}
  }
 }catch(e){out.status='error';out.reason='exception in the after-battle rollout: '+String(e?.message||e).slice(0,160)}
 return snap(sim,out);
}
// The Arm A evaluate callback for searchInfoSet. material(sim,seat) = boardMaterial. shouldStop = the pilot's deadline.
export function makeAfterBattleJudge({policyFor,material,shouldStop=()=>false,diag=null}){
 return (sim,s,ctx={})=>{
  const stop=()=>shouldStop()||!!ctx.shouldStop?.(),meter={planner:0};let roll;
  if(ctx.afterError)roll=snap(sim,{status:'error',reason:'leaf after a rejected root/rollout sub-pick (searchInfoSet catch path); not played on',startTurn:sim.turn,startPhase:sim.phase,startActive:sim.active,needed:false,responses:0,macros:0,trace:null});
  else if(stop())roll=snap(sim,{status:'cutoff',reason:'deadline already expired when the leaf was reached',startTurn:sim.turn,startPhase:sim.phase,startActive:sim.active,needed:false,responses:0,macros:0,trace:null});
  else roll=afterBattleRollout(sim,s,{policyFor,shouldStop:stop,nodesLeft:ctx.nodesLeft??Infinity,trace:!!diag});
  let score=0,parts=null;
  // RELAY-076 A1: scoring is budgeted work too. Remaining allowance = ctx.nodesLeft minus the rollout's macro responses,
  // in planner nodes (x JUDGE.PLANNER_NODES_PER_UNIT); the stop predicate is checked before material, after material,
  // inside/after each planner (judgeParts `work`) and once more before a score is accepted. A complete rollout whose
  // scoring cannot finish becomes a cutoff (not a visit). A rejected/error leaf keeps its status (penalised as before by
  // searchInfoSet); if its scoring is truncated it gets score 0 and the truncation is added to its reason.
  if(roll.status!=='cutoff'){
   const left=(ctx.nodesLeft??Infinity)-roll.macros,cut=why=>{if(roll.status==='complete'){roll.status='cutoff';roll.reason=why}else roll.reason+='; score truncated: '+why;score=0;parts=null};
   if(stop())cut('deadline (shouldStop) before scoring');
   else if(!(left>0))cut('node budget used up before scoring (nodesLeft '+(ctx.nodesLeft??Infinity)+', rollout macros '+roll.macros+')');
   else{const mat=material(sim,s);
    if(stop())cut('deadline (shouldStop) during material scoring');
    else{const work={left:left*JUDGE.PLANNER_NODES_PER_UNIT,stop,truncated:null},j=judgeParts(sim,s,mat,{meter,work});
     if(j.truncated)cut(j.truncated);else if(stop())cut('deadline (shouldStop) after scoring, before the score was accepted');else{score=j.total;parts=j.parts}}}
  }
  const cost=roll.macros+Math.ceil(meter.planner/JUDGE.PLANNER_NODES_PER_UNIT);
  if(diag)diag.push({candidate:ctx.key??ctx.candidate??null,world:ctx.world??null,...roll,startPhaseName:phaseName(roll.startPhase),endPhaseName:phaseName(roll.endPhase),score,parts,cost,plannerNodes:meter.planner});
  return {score,status:roll.status,cost,reason:roll.reason};
 };
}

// r36 midgame / close-out project (Seto, acting DDL lead, 30 Oct 2026; Kevy 30 Oct 01:36 "Begin fixing our AI").
// TEST branch r36-midgame only. NOT reviewed yet (ChatGPT review pending). Every change is behind a flag:
//   A = search judge (score after this turn's battle, LP weight, lethal / turns-to-win, win sooner)
//   B = generic battle rule (lethal beats the book, WindBot-style trades, blocker removal, attack before extending,
//       no book combos in Main Phase 2 from turn 3)
//   C = per-deck doctrine (book turn/phase limits, attack-ready Main 1 board target, close-out options for search)
// All flags are OFF by default, so with no flag this build plays exactly as r35.11. Headless tools turn them on with the
// environment variable DDL_MIDGAME (any of the letters A, B, C, e.g. DDL_MIDGAME=ABC); a page or worker can call
// setMidgame({A:true,...}). Public information only: every helper here reads our own cards, the public field and LP.
import {tacticalContext,planBattle} from '../tactics.mjs';
import {M} from '../duel.mjs';
export {MIDGAME,setMidgame,midgameLabel} from './midgame-flags.mjs';
export const MAIN1=4,MAIN2=256;
export const inBattle=phase=>phase>=8&&phase<=128;
// Arm A judge constants. K = LP divisor (r35.11: 60). Tuning range ~4-8 (dev seeds only); 6 is the a-priori pick.
export const JUDGE={K:6,THIS_TURN:0.8,LETHAL_NOW:4000,PRESSURE:1500,CLAMP:50000,WIN:100000,TURN_STEP:1000,MAX_TURN:40,DRAW:0,NODE_LIMIT:300,
 /* r36 corrections (RELAY-075 A1/A2): FROM_TURN = first turn the judge runs (diagnostic tools may lower it; never the default);
    ROLLOUT_MAX = response bound of one after-battle rollout; PLANNER_NODES_PER_UNIT = planner nodes charged as one search
    node (a priori: one judge planner call at its 300-node cap = one macro). */
 FROM_TURN:3,ROLLOUT_MAX:48,PLANNER_NODES_PER_UNIT:300};
const cannotAttack=n=>n==='Lubellion the Searing Dragon';/* same exclusion as pilot.mjs:14 */
// r36 corrections (RELAY-076 A1): optional `work` = {left: planner nodes still allowed, stop: deadline predicate,
// truncated: null|reason}. With `work`, a planner never runs past work.left (its cap is min(nodeLimit, work.left)), is
// skipped once the deadline has fired or the allowance is spent, and a planner that reaches its cap (planBattle reports
// nodes capped at the limit, so reaching it is treated as overflow - conservative) marks work.truncated. The caller then
// must not accept the score as complete. Without `work` the planners behave exactly as before (Arms B/C, tools).
function plannerGate(work,what){if(!work)return true;if(work.truncated)return false;if(work.stop?.()){work.truncated='deadline (shouldStop) before the '+what+' planner';return false}if(!(work.left>0)){work.truncated='node budget used up before the '+what+' planner';return false}return true}
function plannerDone(work,r,limit,what){if(!work)return;work.left-=r.nodes||0;if((r.nodes||0)>=limit)work.truncated=(limit<JUDGE.NODE_LIMIT?'node budget reached inside the ':'planner node cap reached (overflow) in the ')+what+' planner';else if(work.stop?.())work.truncated='deadline (shouldStop) during the '+what+' planner'}
// This turn's projected battle for `seat` on the visible board: Main Phase 1 = every face-up Attack Position monster;
// a Battle Phase prompt of ours = the engine's own attack list. Anything else = no battle left this turn.
export function thisTurnBattle(d,seat,{nodeLimit=JUDGE.NODE_LIMIT,meter=null,work=null}={}){
 if(d.finished||d.active!==seat||!(d.turn>1))return null;
 const ctx=tacticalContext(d,seat),m=d.prompt;let offers;
 if(d.phase===MAIN1)offers=ctx.own.filter(c=>(c.position&1)&&!cannotAttack(ctx.name(c))).map(c=>({...c,can_direct:false}));
 else if(inBattle(d.phase)&&m?.type===M.SELECT_BATTLECMD&&m.seat===seat)offers=m.attacks||[];
 else return null;
 if(!offers.length)return null;
 if(!plannerGate(work,'this-turn battle'))return null;const limit=work?Math.min(nodeLimit,Math.floor(work.left)):nodeLimit;
 const r=planBattle(ctx,offers,{nodeLimit:limit});if(meter)meter.planner+=r.nodes||0;plannerDone(work,r,limit,'this-turn battle');return r;
}
// Next-turn threat of `seat`: all of its face-up monsters at their current ATK, as if they could all attack, into the
// other side's visible monsters (face-down = 1800). Public board only; no hidden hand, Deck or future draws.
export function nextTurnDamage(d,seat,{nodeLimit=JUDGE.NODE_LIMIT,meter=null,work=null}={}){
 const ctx=tacticalContext(d,seat),own=ctx.own.filter(c=>(c.position&5)&&!cannotAttack(ctx.name(c))&&(c.attack||0)>0).map(c=>({...c,position:1}));
 if(!own.length)return 0;
 const view={...ctx,own,lp:Number.MAX_SAFE_INTEGER/4};/* survival is not the question here */
 if(!plannerGate(work,'next-turn damage'))return 0;const limit=work?Math.min(nodeLimit,Math.floor(work.left)):nodeLimit;
 const r=planBattle(view,own.map(c=>({sequence:c.sequence,location:c.location,can_direct:false})),{nodeLimit:limit});if(meter)meter.planner+=r.nodes||0;plannerDone(work,r,limit,'next-turn damage');return r.damage||0;
}
// Arm A score. `material` = the r35.11 board terms without its LP term and duel-finished term (see optimal-pilot.mjs).
// Terminal dominance (RELAY-069 point 1, pre-registration H): a win scores > WIN, a loss < -WIN, a draw exactly DRAW (0),
// and every non-final position is clamped to [-CLAMP, CLAMP] with CLAMP < WIN. Sooner wins / later losses score better.
// The LP term is linear and finite at 0 LP (no divide-by-LP). Lethal-now, next-turn pressure and turns-to-win are ONE
// term per side (no stacking): lethal now replaces our pressure term; pressure = PRESSURE / turns-to-win.
// r36 A2: the same score split into its parts (for diagnostics), judgeScore = judgeParts(...).total exactly.
// thisTurn.hypothetical = the leaf is in Main Phase 1, so the current-turn term is a visible-board projection of a battle
// that has not been played (a Battle Phase leaf is played on by the after-battle rollout; a Main Phase 2 leaf gets none).
// RELAY-076 A1: with `work` (see plannerGate) a truncated planner gives {total:null,truncated:reason,parts}, never a score.
export function judgeParts(d,seat,material,{meter=null,work=null}={}){
 const J=JUDGE;
 if(d.finished){const t=Math.min(J.MAX_TURN,Math.max(0,d.turn||0)),sooner=J.TURN_STEP*(J.MAX_TURN+1-t);const total=d.winner===seat?J.WIN+sooner:(d.winner===null||d.winner===undefined)?J.DRAW:-J.WIN-sooner;return {total,parts:{terminal:total}}}
 const my=Math.max(0,d.lp[seat]),op=Math.max(0,d.lp[1-seat]),lp=(my-op)/J.K;let v=material+lp,lethalNow=false;const parts={material,lp,thisTurn:0,thisTurnKind:null,hypothetical:d.phase===MAIN1,ownPressure:0,oppPressure:0,lpNow:[d.lp[0],d.lp[1]]};
 const now=thisTurnBattle(d,seat,{meter,work});if(work?.truncated)return {total:null,truncated:work.truncated,parts};
 if(now){if(now.lethal&&!now.uncertain){v+=J.LETHAL_NOW;lethalNow=true;parts.thisTurn=J.LETHAL_NOW;parts.thisTurnKind='lethal'}else{const x=Math.min(now.damage,op)*J.THIS_TURN/J.K;v+=x;parts.thisTurn=x;parts.thisTurnKind='damage'}}
 if(!lethalNow&&op>0){const dmg=nextTurnDamage(d,seat,{meter,work});if(work?.truncated)return {total:null,truncated:work.truncated,parts};if(dmg>0){const x=J.PRESSURE/Math.ceil(op/dmg);v+=x;parts.ownPressure=x}}
 if(my>0){const dmg=nextTurnDamage(d,1-seat,{meter,work});if(work?.truncated)return {total:null,truncated:work.truncated,parts};if(dmg>0){const x=J.PRESSURE/Math.ceil(my/dmg);v-=x;parts.oppPressure=-x}}
 const total=Math.max(-J.CLAMP,Math.min(J.CLAMP,v));parts.clamped=total!==v;return {total,parts};
}
export function judgeScore(d,seat,material,opts){return judgeParts(d,seat,material,opts).total}

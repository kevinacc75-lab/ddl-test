// r45 v4 AI (Kevy approved 11 Nov 2026 11:53 AEDT). Hybrid plan: scripted expert lines are the backbone (book data in
// branded-nov08.mjs and sky-lines.mjs); these helpers add the whole-turn checks that sit on top of the lines:
//  - lethal now: in our Main Phase 1 (turn 2 or later) when the visible-board battle planner finds lethal, stop
//    extending and attack (the opponent gets no extra response windows from further combo steps);
//  - battle before ending: from turn 2 (r36 Arm B did this from turn 3 only), Main Phase 1 -> End Phase becomes
//    Battle Phase when the planner has a damaging attack line.
// Public information only: our own cards, the public field and LP (same planner as r36 ai/midgame.mjs).
import {M,R} from '../../duel.mjs';
import {thisTurnBattle} from '../midgame.mjs';
import {V4} from '../v4-flags.mjs';
const MAIN1=4;
const ownMain1=(d,seat,m)=>m?.type===M.SELECT_IDLECMD&&d.active===seat&&d.phase===MAIN1&&!!m.to_bp&&d.turn>=2&&!(d.chain||[]).some(c=>!c.solved);
export function v4LethalNow(d,seat,m){
 if(!V4.on||!V4.lethal||!ownMain1(d,seat,m))return null;
 const b=thisTurnBattle(d,seat);if(!b?.lethal||b.uncertain)return null;
 return {response:{type:R.SELECT_IDLECMD,action:6,index:null},reason:'The visible board is lethal this turn ('+(b.damage||0)+' damage into '+d.lp[1-seat]+' LP): attack now instead of extending.'};
}
export function v4EndToBattle(d,seat,r){
 if(!V4.on||!V4.lethal||d.turn!==2||r?.action!==7||!ownMain1(d,seat,d.prompt))return null;
 const b=thisTurnBattle(d,seat);return b?.steps?.length?{type:r.type,action:6,index:null}:null;
}

// r36 midgame flags (see ai/midgame.mjs). Separate module so tactics.mjs can read them without an import cycle.
import {setS4} from './s4-flags.mjs';
const env=String(globalThis.process?.env?.DDL_MIDGAME??globalThis.DDL_MIDGAME??'').toUpperCase();
// RELAY-075 B2: T and Z are separate policy changes HELD FOR REVIEW (default off, not part of arm B):
//   T = ahead/trade penalty (when ahead, a losing trade costs 600+ATK*.2 instead of 1200+ATK*.35), turn 3+, needs B.
//   Z = zero-damage direct-attack +1 tie-break over passing, turn 3+, needs B.
const KEYS=['A','B','C','T','Z'];
export const MIDGAME=Object.fromEntries(KEYS.map(k=>[k,env.includes(k)]));
export function setMidgame(flags={}){for(const k of KEYS)if(k in flags)MIDGAME[k]=!!flags[k];return {...MIDGAME}}
// r36 AI selector (Kevy 4 Nov 11:09: experimental Enhanced preview, old AI kept as Classic = default). One exact recipe per
// mode: Classic = every r36 switch off (r35.12 behaviour); Enhanced = Arm A (after-battle judge) + Arm B (battle rules and the
// removal follow-up). C (doctrine draft), T and Z stay off in both (held for review).
export const AI_MODES=Object.freeze({classic:Object.freeze({A:false,B:false,C:false,T:false,Z:false}),enhanced:Object.freeze({A:true,B:true,C:false,T:false,Z:false})});
export const aiModeOf=v=>v==='enhanced'?'enhanced':'classic';
// r36 S4 (RELAY-109): every mode change also resets the COMPLETE S4 map, so a dev/test
// setting can never leak into a duel or think. setAiMode runs at each duel start (worker.mjs) and each think (ai-worker.mjs).
// RELAY-112 (6 Nov): flag E (engine-offered Defence Position attackers, DEF used when the card says so) joins Enhanced only.
export const AI_S4=Object.freeze({classic:Object.freeze({E:false,F:false}),enhanced:Object.freeze({E:true,F:true})});/* F: RELAY-117 friendly-chain guard, Enhanced only */
export function setAiMode(mode){setS4(AI_S4[aiModeOf(mode)]);return setMidgame(AI_MODES[aiModeOf(mode)])}
export const midgameLabel=()=>KEYS.filter(k=>MIDGAME[k]).join('')||'off';

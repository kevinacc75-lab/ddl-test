// r48 (Claude, 12 Nov 2026; ChatGPT RELAY-142): a concession is a terminal record of the duel, not an engine response.
// It is saved in an exported replay as {concede:{seat, afterResponses}} beside the response list and restored when that
// replay is opened, after exactly afterResponses engine responses. Pure helpers so the worker paths share one rule.
export const CONCEDE_REASON=16;
export const concedeRecord=(seat,responses)=>({seat,afterResponses:responses});
// valid only as the last thing in the file: seat 0 or 1, and the boundary equals the number of saved responses
export const validConcede=(c,responseCount)=>!!c&&typeof c==='object'&&!Array.isArray(c)&&(c.seat===0||c.seat===1)&&Number.isInteger(c.afterResponses)&&c.afterResponses===responseCount;
// ends an unfinished duel: the other seat wins, reason 16. Returns false (and changes nothing) for a finished duel or a bad seat.
export function applyConcede(duel,seat){
 if(!duel||duel.finished||!(seat===0||seat===1))return false;
 const w=1-seat;duel.winProcessed=true;duel.finished=true;duel.prompt=null;duel.winner=w;duel.winReason=CONCEDE_REASON;
 duel.record(duel.decks[seat].name+' conceded · '+duel.decks[w].name+' wins','win');duel.event('win',{player:w,reason:CONCEDE_REASON,lp:[...duel.lp],turn:duel.turn,conceded:seat});return true}
// restore on a replay-opening path, after the saved responses were replayed. Throws on a stale or malformed record.
export function restoreConcede(duel,c,responseCount){
 if(c==null)return null;
 if(!validConcede(c,responseCount)||duel.responseHistory.length!==c.afterResponses||!applyConcede(duel,c.seat))throw Error('Saved replay concession rejected');
 return concedeRecord(c.seat,c.afterResponses)}

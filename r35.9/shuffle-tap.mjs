// r35 item 8 (Claude, 28 Oct 2026): deck-shuffle capture for the on-screen duel only. Design: RELAY-046 (ChatGPT) "Tap B",
// approved with conditions by Seto (27 Oct 10:10): an instance-method interposition on the ONE real duel object owned by
// worker.mjs. duel.mjs, the AI (ai/*), random.mjs and the frozen gate are untouched; the gate never loads worker.mjs.
// Conditions kept here:
//  - install once, before the first start; never on a prototype, the core, duelGetMessage, or any clone / AI / pool duel;
//  - call the original FIRST with the same receiver and message, return its result, let its errors propagate unchanged;
//  - only after the original returns, and only while armed, capture scalars {id, seat, afterEventId} for M.SHUFFLE_DECK;
//    never the raw message, never SHUFFLE_HAND; no await, timer, random number, duel.log write, engine call or postMessage;
//  - the capture itself fails open (a presentation failure can never break the duel);
//  - start / start-with-responses / import-replay / rewind: disarmed for the whole reconstruction (Seto: startup boundary),
//    armed only after it returns; each reset starts a new overlay epoch (duelSerial is NOT touched);
//  - bounded: max 32 pending captures between sends; extra ones are dropped and counted here only (never duel.log);
//  - drain once per send: a repeated send or a re-sent state never replays a shuffle.
export const SHUFFLE_MAX_PENDING=32;
export class ShuffleTap{
 constructor({shuffleType,max=SHUFFLE_MAX_PENDING}={}){
  if(!Number.isInteger(shuffleType))throw Error('ShuffleTap needs the engine SHUFFLE_DECK message type');
  this.type=shuffleType;this.max=max;this.armed=false;this.epoch=0;this.seq=0;this.pending=[];this.dropped=0;this.duel=null;
 }
 // Wrap the given duel object's own handleMessage. Idempotent for the same duel; refuses a second duel object.
 install(duel){
  if(this.duel===duel)return true;if(this.duel)throw Error('ShuffleTap is bound to one duel object');
  const original=duel.handleMessage,tap=this;if(typeof original!=='function')throw Error('Duel has no handleMessage');
  duel.handleMessage=function(m){const result=original.call(this,m);tap.capture(this,m);return result};
  this.duel=duel;return true;
 }
 capture(receiver,m){
  try{if(!this.armed||receiver!==this.duel||!m||m.type!==this.type)return;
   const seat=receiver.fromEngine?.(m.player);if(seat!==0&&seat!==1)return;
   const id=++this.seq;if(this.pending.length>=this.max){this.dropped++;return}
   this.pending.push({id,seat,afterEventId:Number(receiver.eventSeq)||0});
  }catch{/* fail open: decoration only */}
 }
 // New duel, import, rewind: disarm, clear, new epoch. Arm again only after the reconstruction returns.
 reset(){this.armed=false;this.pending=[];this.epoch++;this.seq=0}
 arm(){this.armed=true}
 // Stop, error, teardown: disarm and clear (same epoch until the next reset).
 disarm(){this.armed=false;this.pending=[]}
 // The envelope for one state message. Sent even when empty, so the UI sees an epoch change.
 drain(){const out={epoch:this.epoch,shuffles:this.pending,dropped:this.dropped};this.pending=[];return out}
}

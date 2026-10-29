// r36 (Claude, 29 Oct 2026; Kevy 14:29: "we need a inbuilt randomized coin flip widget for when the user plays card like
// the time wizard spell that needs heads or tails ... a unique animation and cutscene that plays with sound fx").
// Coin-toss / dice-roll capture for the on-screen duel only. Same design and conditions as ShuffleTap (RELAY-046 "Tap B",
// Seto 27 Oct 10:10); duel.mjs, the AI (ai/*), random.mjs and the frozen gate are untouched, and the gate never loads
// worker.mjs. THE RESULT IS NEVER MADE HERE: the engine tosses the coin / rolls the die from the duel's own seed (so a
// replay or rewind gives the same result); this tap only reads the engine's TOSS_COIN / TOSS_DICE message afterwards so
// the screen can show it.
//  - install once, before the first start; only on the ONE real duel object owned by worker.mjs (never a prototype, the
//    core, duelGetMessage, or an AI / pool / clone duel);
//  - call the original handleMessage FIRST with the same receiver and message, return its result, let its errors
//    propagate unchanged; only after it returns, and only while armed, copy scalars:
//      coin: {id, kind:'coin', seat, results:[true=heads|false=tails], call:'heads'|'tails'|null, code, afterEventId}
//      dice: {id, kind:'dice', seat, results:[1..6], call:null, code, afterEventId}
//    'call' is read from the duel's own response history: the response given to the engine's "call it" prompt
//    (SELECT_OPTION whose two options are the system strings 60 Heads / 61 Tails) immediately before the toss. The duel
//    records a response only after the engine accepts it (Duel.respond pushes it after advance), so the tap notes the
//    history position of that prompt and reads the response at drain time, when the worker sends the state.
//    'code' is the card whose chain link is resolving (public; found by the duel's resolvingChain, not the top link). Never the raw message; no await, timer, random number,
//    duel.log write, engine call or postMessage;
//  - fails open (a presentation failure can never break the duel); bounded (max 16 pending, extra dropped and counted);
//  - reset / arm / disarm / drain exactly as ShuffleTap (startup, rewind, import: disarmed during reconstruction).
export const COIN_MAX_PENDING=16,COIN_HEADS_STRING=60,COIN_TAILS_STRING=61;
export class CoinTap{
 constructor({coinType,diceType,optionType,max=COIN_MAX_PENDING}={}){
  if(![coinType,diceType,optionType].every(Number.isInteger))throw Error('CoinTap needs the engine TOSS_COIN, TOSS_DICE and SELECT_OPTION message types');
  Object.assign(this,{coinType,diceType,optionType,max});this.armed=false;this.epoch=0;this.seq=0;this.pending=[];this.dropped=0;this.duel=null;this.callPrompt=null;
 }
 install(duel){
  if(this.duel===duel)return true;if(this.duel)throw Error('CoinTap is bound to one duel object');
  const original=duel.handleMessage,tap=this;if(typeof original!=='function')throw Error('Duel has no handleMessage');
  duel.handleMessage=function(m){const result=original.call(this,m);tap.capture(this,m);return result};
  this.duel=duel;return true;
 }
 capture(receiver,m){
  try{if(!this.armed||receiver!==this.duel||!m)return;
   if(m.type===this.optionType){const o=(m.options||[]).map(Number);
    this.callPrompt=o.length===2&&o.includes(COIN_HEADS_STRING)&&o.includes(COIN_TAILS_STRING)?{options:o,at:(receiver.responseHistory?.length||0)+(receiver._responding?1:0)}/* the response in flight is recorded after advance (same count as the duel's own decision index) */:null;return}
   if(m.type!==this.coinType&&m.type!==this.diceType)return;
   const seat=receiver.fromEngine?.(m.player);if(seat!==0&&seat!==1)return;
   const coin=m.type===this.coinType,results=(Array.isArray(m.results)?m.results:[]).slice(0,8).map(v=>coin?!!v:Number(v)).filter(v=>coin||(Number.isInteger(v)&&v>=1&&v<=6));
   if(!results.length)return;
   const p=coin?this.callPrompt:null;this.callPrompt=null;
   const chain=Array.isArray(receiver.chain)?receiver.chain:[],link=chain.find(c=>c.chain_size===receiver.resolvingChain)||[...chain].reverse().find(c=>!c.solved),code=Number(link?.code)||0;/* the RESOLVING link (a later link that already resolved, e.g. Ash Blossom, stays in the chain list) */
   const id=++this.seq;if(this.pending.length>=this.max){this.dropped++;return}
   this.pending.push({id,kind:coin?'coin':'dice',seat,results,call:null,code,afterEventId:Number(receiver.eventSeq)||0,callAt:p?p.at:null,callOptions:p?p.options:null});
  }catch{/* fail open: decoration only */}
 }
 reset(){this.armed=false;this.pending=[];this.callPrompt=null;this.epoch++;this.seq=0}
 arm(){this.armed=true}
 disarm(){this.armed=false;this.pending=[];this.callPrompt=null}
 // resolve each pending call from the duel's accepted responses, then hand out plain scalars only
 callOf(t){try{const h=this.duel?.responseHistory;if(t.callAt==null||!h||h.length<=t.callAt)return null;const pick=t.callOptions?.[h[t.callAt]?.index];return pick===COIN_HEADS_STRING?'heads':pick===COIN_TAILS_STRING?'tails':null}catch{return null}}
 drain(){const out={epoch:this.epoch,tosses:this.pending.map(({callAt,callOptions,...t})=>({...t,call:t.kind==='coin'?this.callOf({callAt,callOptions}):null})),dropped:this.dropped};this.pending=[];return out}
}

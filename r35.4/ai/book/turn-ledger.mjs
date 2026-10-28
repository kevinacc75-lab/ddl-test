// r35 durable per-turn event ledger (Claude, 28 Oct 2026; RELAY-056 and RELAY-057). The duel keeps only its last 120
// presentation events (duel.mjs shifts the oldest), so "did X happen this turn?" cannot be answered from d.events alone in
// a long turn. This ledger absorbs new events by id each time it is read and never changes the duel.
// Keyed on the object that OWNS the events (the duel itself): every AI view (safeView, the pilot's shadow) is
// Object.create(duel), so walking the prototype chain to the object with an own 'events' property finds the duel from any
// view. The duel can replace its events ARRAY:
//  - a rejected selection (retry) filters one 'effectChosen' event out into a new array (duel.mjs respond): same history,
//    so the ledger carries on and drops any absorbed event that vanished from the window;
//  - start() / rewind restart the event ids from 1 (eventSeq goes back): a new history, so the ledger starts again.
//   events: this turn's events seen so far (from the last 'turn' event).
//   complete: true only if no event of this turn can have been missed. It is false when events rolled out of the window
//     before the ledger saw them since the last 'turn' event, which includes a ledger that first saw the duel after
//     event 1 had rolled out, without a 'turn' event in view (e.g. a replayed search clone). Callers MUST give a conservative answer when false.
// Views without an events array (unit mocks) get null: callers keep their own fallback.
const LEDGERS=new WeakMap();
function owner(d){let o=d;while(o&&!Object.prototype.hasOwnProperty.call(o,'events'))o=Object.getPrototypeOf(o);return o||d}
const fresh=arr=>({arr,seen:0,events:[],complete:true});/* the window test below clears it if ids 1.. were missed */
export function turnLedger(d){
 const ev=d?.events;if(!Array.isArray(ev))return null;
 const key=owner(d);let s=LEDGERS.get(key);
 if(!s){s=fresh(ev);LEDGERS.set(key,s)}
 else if(s.arr!==ev){const top=Number.isFinite(key.eventSeq)?key.eventSeq:ev.reduce((m,e)=>Math.max(m,e.id||0),0);
  if(top<s.seen){s=fresh(ev);LEDGERS.set(key,s)}/* ids went back: a new duel (start / rewind) */
  else{const ids=new Set(ev.map(e=>e.id)),lo=ev.length?ev[0].id:Infinity;s.events=s.events.filter(e=>e.id<lo||ids.has(e.id));s.arr=ev}}
 // Missed events can only be ones that rolled off the FRONT of the window (a retry removes a rejected selection from the
 // middle, which is not a real event): if the window now starts past the next id we expected, events were missed. They
 // precede everything in the window, so a 'turn' event in view still makes the new turn complete.
 if(ev.length&&ev[0].id>s.seen+1)s.complete=false;
 for(const e of ev){if(!(e.id>s.seen))continue;
  if(e.type==='turn'){s.events=[];s.complete=true}else s.events.push(e);
  s.seen=e.id}
 return {events:s.events,complete:s.complete};
}

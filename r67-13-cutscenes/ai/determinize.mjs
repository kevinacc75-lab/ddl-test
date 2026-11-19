let rootObserver=null;
export const PROPOSALS_PER_WORLD=16;
export const START_CURSOR=Object.freeze({historyStep:0,drawIndex:0,observedIndex:0,expectedIndex:0});
export function setRootObserver(observer){rootObserver=observer}
import {compileConstraints,targetedPins} from './constraints.mjs';
import {Duel,M,R} from '../duel.mjs';
import {seedHash,randomStream} from '../random.mjs';
import {exportSeatContext,publicKey,promptKey} from './knowledge.mjs';
import {RemapError,remapResponse,alignedEvent,eventSignature} from './semantic.mjs';
import {isSearchCore} from './engine-snapshot.mjs';
const shuffled=(a,rng)=>{const b=[...a];for(let i=b.length-1;i>0;i--){const j=rng()%(i+1);[b[i],b[j]]=[b[j],b[i]]}return b};
const difference=(a,b,path='root')=>{if(JSON.stringify(a)===JSON.stringify(b))return null;if(a&&b&&typeof a==='object'&&typeof b==='object'){for(const key of new Set([...Object.keys(a),...Object.keys(b)])){const diff=difference(a[key],b[key],path+'.'+key);if(diff)return diff}}return path+': expected '+JSON.stringify(a)+' got '+JSON.stringify(b)};
const bag=a=>{const b=new Map();for(const code of a)b.set(code,(b.get(code)||0)+1);return b};
function deal(cards,pins,rng,base){const out=[...base||shuffled(cards,rng)],fixed=new Set();for(const [index,code] of pins){if(out[index]!==code){const at=out.findIndex((c,i)=>c===code&&!fixed.has(i));if(at<0)throw Error('Observation constraints exceed deck copies');[out[index],out[at]]=[out[at],out[index]]}fixed.add(index)}return out}

// A normal draw can yield a prompt before EVENT_ADJUST publishes the new hand slot's ID.
// Refresh display metadata in the sampled clone only; no effects, responses, RNG or rules change.
function refreshDrawOrigins(clone){
 const before=clone.core.duelGetMessage(clone.handle).length;
 const script='local g=Duel.GetFieldGroup(0,LOCATION_HAND,LOCATION_HAND) for c in g:Iter() do c:SetHint(0,(c:GetCardID()<<32)|c:GetOriginalCode()) end';
 if(!clone.core.loadScript(clone.handle,'r17_draw_origins.lua',script))throw new RemapError('draw identity refresh failed');
 for(const m of clone.core.duelGetMessage(clone.handle).slice(before)){
  if(m.type!==M.CARD_HINT||m.card_hint!==0)throw new RemapError('unexpected draw identity metadata');
  clone.identify(m);
 }
}

export class Determinizations{
 constructor(d,seat,searchSeed,{searchCore=null}={}){this.context=d.seatContext||exportSeatContext(d,seat);this.snapshots=!!searchCore&&isSearchCore(searchCore);this.core=this.snapshots?searchCore:d.core;this.db=d.db;this.scripts=d.scripts;this.seed=searchSeed;this.pins=[new Map(),new Map()];this.attempts=0;this.failures=[];this.accepted=0;this.discarded=0;this.pinConflicts=[];
  this.constraints=compileConstraints(this.context);this.placements=[];this.corrections=[new Map(),new Map()];this.soft=[new Set(),new Set()];
 }
 // Seto's safety net (14 Oct): if the pins still ask for more copies of a card than the deck holds, drop only the
 // conflicting pins (hypothesis pins first, then the highest positions) and log it, so a seat is never left with zero
 // worlds for the rest of the duel. Only fires where dealing would otherwise throw, so other samples are unchanged.
 dropOverflowPins(p,k){const copies=bag(this.context.decks[p].main),byCode=new Map();for(const [index,code] of this.pins[p])(byCode.get(code)??byCode.set(code,[]).get(code)).push(index);
  for(const [code,indexes] of byCode){const extra=indexes.length-(copies.get(code)||0);if(extra<=0)continue;
   const order=[...indexes].sort((a,b)=>(this.soft[p].has(b)?1:0)-(this.soft[p].has(a)?1:0)||b-a).slice(0,extra);
   for(const index of order){this.pins[p].delete(index);this.soft[p].delete(index)}
   if(this.pinConflicts.length<64)this.pinConflicts.push({sample:k,player:p,code,pinned:indexes.length,copies:copies.get(code)||0,dropped:order})}}
 // r19 (Seto-approved: Multirole copy-count pin fix): a repair pins a card per PHYSICAL copy. Repairs are hypotheses
 // tried one after another for the same physical card (e.g. which hidden draw the one Multirole came from); a newer
 // hypothesis for a code replaces the older ones once hard pins plus repairs would exceed the copies in the Deck, instead
 // of piling up into "2 pins for a 1-copy card".
 placeCorrection(p,key,index,code){const copies=bag(this.context.decks[p].main).get(code)||0,hard=[...this.pins[p]].filter(([i,c])=>c===code&&!this.soft[p].has(i)).length,others=[...this.corrections[p]].filter(([k,v])=>v.code===code&&k!==key);
  let excess=hard+others.length+1-copies;for(const [k] of others){if(excess<=0)break;this.corrections[p].delete(k);excess--;this.replacedCorrections=(this.replacedCorrections||0)+1}
  this.corrections[p].set(key,{index,code})}
 origins(clone,orders){const byId=new Map(),uids=[...clone.instances.keys()].sort((a,b)=>a-b);let i=0;for(let p=0;p<2;p++)for(const zone of ['main','extra'])for(let index=0;index<orders[p][zone].length;index++){const uid=uids[i++];if(uid===undefined||clone.instances.get(uid).code!==orders[p][zone][index])return null;byId.set(uid,{player:p,zone,index})}return byId}
 repair(clone,error,orders,origins){if(error.batch){let changed=false;for(const part of error.batch)changed=this.repair(clone,part,orders,origins)||changed;return changed}if(!error.code||!origins)return false;const available=error.offered||[];
  for(const card of available){const owner=clone.fromEngine(card.controller),uid=clone.instanceSlots.get(clone.slot(card)),origin=card._origin||origins.get(uid);if(!origin||origin.zone!=='main'||origin.player!==owner)continue;if(this.pins[owner].has(origin.index)&&!this.soft[owner].has(origin.index))continue;
   const counts=bag(clone.decks[owner].main),used=[...this.pins[owner].values()].filter(c=>c===error.code).length;for(const slot of this.soft[owner])if(this.pins[owner].get(slot)===error.code)this.pins[owner].delete(slot);const remaining=[...this.pins[owner].values()].filter(c=>c===error.code).length;if((counts.get(error.code)||0)<=remaining)continue;this.placeCorrection(owner,error.constraint||('card:'+error.code),origin.index,error.code);this.pins[owner].set(origin.index,error.code);return true;
  }return false;
 }
 // r20 (Seto-approved repair-refill): sample(k, shouldStop, from) with from={orders, coreSeed} rebuilds a world from a
 // pool world that just failed to advance: its own deck order, core seed and recorded native responses are the base (so
 // the first replay repeats that world exactly up to its last root); only fact pins are dealt (draws and deck positions
 // whose card is now known, e.g. an opponent's opening-hand card revealed later), never the targeted pins' random
 // allocations, which would reshuffle that world; the usual repairs plus batch placement fix the rest.
 sample(k,shouldStop=()=>false,from=null){this.corrections=[new Map(),new Map()];this.fix3Tried=new Set();let worldSeed=from?from.coreSeed:seedHash(this.seed+':world:'+k);const dealRng=randomStream(seedHash(this.seed+':deal:'+k)),baseOrders=from?from.orders.map(o=>({main:[...o.main],extra:[...o.extra]})):this.context.decks.map(deck=>({main:shuffled(deck.main,dealRng),extra:shuffled(deck.extra,dealRng)}));const batchWas=this.batchKnownDraws;if(from)this.batchKnownDraws=true;try{let failures=0,initialPlan=null,lastFailedStep=-1,repeatedStep=0;const maxFailures=from?.maxFailures??8;while(failures<maxFailures&&!shouldStop()){const rng=randomStream(seedHash(this.seed+':sample:'+k+':retry:'+failures)),clone=new Duel(this.core,this.db,this.scripts);this.attempts++;
   let orders,origins,historyStep=0,beforeHand=[new Set(),new Set()];const actualDraws=[],postDraws=[],batch=[],handle=clone.handleMessage.bind(clone);clone.handleMessage=m=>{if(m.type===M.MOVE&&origins){const uid=clone.instanceSlots.get(clone.slot(m.from));if(clone.instances.get(uid)?.code===m.card)m.sampleOrigin=origins.get(uid);if(!m.sampleOrigin&&m.from.location===1){const player=clone.fromEngine(m.from.controller),eligible=orders[player].main.map((code,index)=>({code,index})).filter(c=>c.code===m.card&&!this.pins[player].has(c.index));if(eligible.length)m.sampleOrigin={player,zone:'main',index:eligible[0].index}}}if(m.type===M.DRAW)actualDraws.push({player:clone.fromEngine(m.player),codes:m.drawn.map(c=>c.code),step:historyStep,turn:clone.turn,phase:clone.phase,source:clone.currentEffect?.code||null,before:beforeHand[clone.fromEngine(m.player)]});handle(m)};
   try{initialPlan??=targetedPins(this.context,this.constraints,rng);this.pins=initialPlan.pins.map(p=>new Map(p));this.soft=initialPlan.soft.map(p=>new Set(p));if(from){this.pins=[new Map(),new Map()];this.soft=[new Set(),new Set()];for(const row of this.context.draws)for(let i=0;i<row.refs.length;i++){const ref=row.refs[i],origin=row.origins?.[i]?.find(o=>o.kind==='draw')||ref;if(ref.code&&origin.initialIndex!==null&&origin.initialIndex!==undefined)this.pins[row.player].set(origin.initialIndex,ref.code)}for(const proof of this.constraints.position)if(proof.epoch===0&&!this.pins[proof.player].has(proof.sequence))this.pins[proof.player].set(proof.sequence,proof.code)}this.placements=initialPlan.placements;for(let p=0;p<2;p++){const corrections=[...this.corrections[p].values()],codes=new Set(corrections.map(c=>c.code));for(const slot of this.soft[p])if(codes.has(this.pins[p].get(slot)))this.pins[p].delete(slot);for(const {index,code} of corrections){if(this.pins[p].has(index)&&this.pins[p].get(index)!==code&&!this.soft[p].has(index))throw Error('Targeted placement collision');this.pins[p].set(index,code);this.soft[p].add(index)}}for(let p=0;p<2;p++)this.dropOverflowPins(p,k);orders=this.context.decks.map((deck,p)=>({main:deal(deck.main,this.pins[p],rng,baseOrders[p].main),extra:baseOrders[p].extra}));clone.start(this.context.decks,{seed:worldSeed,coreSeed:worldSeed,first:this.context.first,deckOrders:orders,observerSeat:this.context.seat});origins=this.origins(clone,orders);
    let drawIndex=0;const checkDraws=()=>{for(const row of actualDraws.slice(drawIndex)){const expected=this.context.draws[drawIndex++];if(!expected||expected.player!==row.player||expected.refs.length!==row.codes.length)throw new RemapError('draw observation shape differs');if(expected.refs.some(ref=>ref.code&&(ref.initialIndex??null)===null))refreshDrawOrigins(clone);for(let i=0;i<row.codes.length;i++){const code=expected.refs[i].code,actual=row.codes[i];if(code&&code===actual){for(const c of clone.zone(row.player,2).filter(Boolean).filter(c=>c.code===actual)){const uid=clone.instanceSlots.get(clone.slot({...c,controller:clone.toEngine(row.player)}));if(!row.before.has(uid)){const origin=origins?.get(uid);if(origin)this.soft[row.player].delete(origin.index)}}}if((expected.refs[i].initialIndex??null)===null&&code&&code!==actual)postDraws.push({player:row.player,ref:expected.refs[i].id,step:expected.step??historyStep,drawn:actual,required:code,mismatch:true});if(code&&code!==actual){const offered=clone.zone(row.player,2).filter(Boolean).filter(c=>c.code===actual).map(c=>{const controller=clone.toEngine(c.controller),uid=clone.instanceSlots.get(clone.slot({...c,controller}));return {...c,controller,_origin:!row.before.has(uid)?origins?.get(uid):null}}).filter(c=>c._origin);
       // r19 (Seto-approved Step 3 "3c"): batch known-draw placement. A post-shuffle known draw (no initial index) that
       // drew the wrong card is not thrown at once: its repair (the required card at the drawn card's starting position,
       // the same rule as the single fix3 repair) is queued and the replay goes on, so one replay learns every such draw up
       // to the first real divergence. The attempt still fails; the next retry carries all queued repairs at once.
       // OFF by default (sampler.batchKnownDraws=true turns it on): on the fixed-budget probe it cut "known draw differs"
       // rejections but did not add worlds at the browser-sized budget (r19 REPLY); it is the building block for r20.
       if((expected.refs[i].initialIndex??null)===null&&this.batchKnownDraws===true){const ref=expected.refs[i].id,j=offered.map(c=>c._origin).find(o=>o?.player===row.player&&o.zone==='main'&&!(this.pins[row.player].has(o.index)&&!this.soft[row.player].has(o.index))&&!this.fix3Tried.has(ref+':'+code+':'+o.index)&&!batch.some(b=>b.player===row.player&&b.index===o.index))?.index;
        const copies=orders[row.player].main.filter(c=>c===code).length,hardCopies=[...this.pins[row.player]].filter(([x,c])=>c===code&&!this.soft[row.player].has(x)).length,queued=batch.filter(b=>b.player===row.player&&b.code===code).length;
        if(j!==undefined&&hardCopies+queued<copies){batch.push({key:'draw:'+ref,player:row.player,ref,index:j,code,step:expected.step??historyStep,historyStep,offered,drawObservation:{expectedStep:expected.step,actualStep:row.step,turn:row.turn,phase:row.phase,source:row.source,player:row.player,drawIndex:drawIndex-1}});continue}}
       throw Object.assign(new RemapError('known draw differs',code,offered),{constraint:'draw:'+expected.refs[i].id,drawObservation:{expectedStep:expected.step,actualStep:row.step,turn:row.turn,phase:row.phase,source:row.source,player:row.player,drawIndex:drawIndex-1}})}
      // Track B fix 3: remember where the world's card for each hidden draw started, so a hidden card used later can be
      // repaired at the draw it must have come from.
      if((expected.refs[i].initialIndex??null)===null)postDraws.push({player:row.player,ref:expected.refs[i].id,step:expected.step??historyStep,drawn:actual,required:code||0});
      }}};
    let observedIndex=0,expectedIndex=0;
    const publicEvents=events=>events.filter(e=>e.code&&['move','public-effect','reveal'].includes(e.kind));
    const expectedEvents=publicEvents(this.context.observations||[]);
    const eventKey=e=>JSON.stringify([e.kind,e.player,e.location,e.deckTop||[4,8].includes(e.location)?e.sequence:null,e.code,e.to?.controller??null,e.to?.location??null]);
    const hiddenPacket=e=>e.kind==='move'&&e.location===1&&e.to?.location===32&&!(e.to.position&5);
    const mismatch=(expected,event)=>Object.assign(new RemapError('public event timeline differs; first expected step '+(expected?.step??'end'),expected?.code||0,event.location===1?[{code:event.code,controller:clone.toEngine(event.player),location:event.location,sequence:event.sequence,_origin:event._sampleOrigin}]:[]),{constraint:'event:'+expectedIndex,timeline:{expected:expected?[expected.kind,expected.player,expected.location,expected.sequence,expected.code,expected.to]:null,actual:[event.kind,event.player,event.location,event.sequence,event.code,event.to]}});
    const checkEvents=()=>{const all=clone.knowledge[this.context.seat].observations,actual=publicEvents(all.slice(observedIndex));observedIndex=all.length;for(let i=0;i<actual.length;i++){
      const event=actual[i],expected=expectedEvents[expectedIndex];
      if(hiddenPacket(event)&&expected&&hiddenPacket(expected)){const got=[],want=[];while(i<actual.length&&hiddenPacket(actual[i])&&actual[i].player===event.player)got.push(actual[i++]);i--;while(expectedIndex<expectedEvents.length&&hiddenPacket(expectedEvents[expectedIndex])&&expectedEvents[expectedIndex].player===event.player)want.push(expectedEvents[expectedIndex++]);
       const left=[...got],missing=[];for(const e of want){const at=left.findIndex(a=>a.code===e.code);if(at>=0)left.splice(at,1);else missing.push(e)}
       if(missing.length||left.length){const batch=missing.map((e,j)=>({...mismatch(e,left[j]||event),constraint:'packet:'+e.step+':'+e.code+':'+e.sequence}));throw Object.assign(new RemapError('hidden deck packet differs; first expected step '+expected.step),{batch})}continue;
      }
      // Track B fix 2 (Claude, proposed to Seto): cards sent from the Deck by one action (e.g. Branded Fusion's materials)
      // leave in an order that depends on hidden deck positions after a shuffle. Within one history step, a run of
      // public moves out of the Deck is compared as a set, not in order. Everything else stays order-strict.
      const deckRun=(list,at,step)=>{const run=[];while(at<list.length&&list[at].kind==='move'&&list[at].location===1&&!hiddenPacket(list[at])&&list[at].step===step)run.push(list[at++]);return run};
      if(this.context.observations&&expected&&event.kind==='move'&&event.location===1&&!hiddenPacket(event)&&expected.kind==='move'&&expected.location===1&&!hiddenPacket(expected)&&eventKey(expected)!==eventKey(event)){
       const got=deckRun(actual,i,event.step),want=deckRun(expectedEvents,expectedIndex,expected.step);
       if(got.length>1&&got.length===want.length){const left=got.map(eventKey);let same=true;for(const e of want){const at=left.indexOf(eventKey(e));if(at<0){same=false;break}left.splice(at,1)}
        if(same){i+=got.length-1;expectedIndex+=want.length;continue}}
      }
      // r19 (same family as the known-draw batch): a card revealed from the Deck at a known position after a shuffle
      // (e.g. Area Zero's deck-top reveal) that shows a different card is queued as a placement: the required card goes to
      // a starting position of the card the world revealed there (one candidate per retry), and the replay goes on.
      if(this.batchKnownDraws===true&&orders&&expected&&expected.kind==='reveal'&&expected.location===1&&event.kind==='reveal'&&event.location===1&&event.player===expected.player&&event.sequence===expected.sequence&&expected.code&&event.code!==expected.code){
       const p=expected.player,key='reveal:'+expected.step+':'+expected.sequence,hard=j=>this.pins[p].has(j)&&!this.soft[p].has(j);
       const j=orders[p].main.map((c,x)=>c===event.code?x:-1).find(x=>x>=0&&!hard(x)&&!this.fix3Tried.has(key+':'+expected.code+':'+x)&&!batch.some(b=>b.player===p&&b.index===x));
       const copies=orders[p].main.filter(c=>c===expected.code).length,hardCopies=[...this.pins[p]].filter(([x,c])=>c===expected.code&&!this.soft[p].has(x)).length,queued=batch.filter(b=>b.player===p&&b.code===expected.code).length;
       if(j!==undefined&&hardCopies+queued<copies){batch.push({key,player:p,ref:key,index:j,code:expected.code,step:expected.step,historyStep,offered:[],drawObservation:null,reveal:true});expectedIndex++;continue}
      }
      expectedIndex++;if(this.context.observations&&(!expected||eventKey(expected)!==eventKey(event)))throw mismatch(expected,event);
    }};

    checkDraws();checkEvents(0);let extraPasses=0;
    for(const sem of this.context.history){if(shouldStop()){this.capped=true;clone.stop();return null}historyStep++;if(clone.finished)throw new RemapError('sample ends before observed history');const p=clone.prompt;
     if(sem.optionalPass&&(!alignedEvent(clone,sem)||p.type!==sem.promptType||p.seat!==sem.seat))continue;
     while(clone.prompt&&(!alignedEvent(clone,sem)||clone.prompt.type!==sem.promptType||clone.prompt.seat!==sem.seat)&&clone.prompt.seat!==this.context.seat&&extraPasses++<32){const q=clone.prompt;if(q.type===M.SELECT_CHAIN&&!q.forced)clone.respond({type:R.SELECT_CHAIN,index:null});else if([M.SELECT_YESNO,M.SELECT_EFFECTYN].includes(q.type))clone.respond({type:q.type===M.SELECT_YESNO?R.SELECT_YESNO:R.SELECT_EFFECTYN,yes:false});else break;checkDraws()}
     // r20: a repair-refill first replays the world's own recorded native responses (same hidden picks as the world it
     // rebuilds), and falls back to the semantic remap on its later retries.
     const own=from?.native&&failures===0?from.native[historyStep-1]:null,response=own?structuredClone(own):remapResponse(clone,sem,rng),before=clone.retries;(clone.nativeByStep??=[])[historyStep-1]=structuredClone(response);beforeHand=[0,1].map(p=>new Set([...clone.instanceSlots].filter(([key])=>key.startsWith(clone.toEngine(p)+':2:')).map(([,id])=>id)));clone.respond(response);if(clone.retries!==before)throw new RemapError('native rejection after semantic remap');checkDraws();checkEvents(historyStep);
    }
    // Hidden legal offers may add opponent-only windows, including before
    // the first observed response and after the last one. Align to the root.
    while(clone.prompt&&clone.prompt.seat!==this.context.seat&&extraPasses++<32&&(clone.prompt.type!==this.context.promptType||publicKey(clone,this.context.seat)!==JSON.stringify(this.context.root))){const q=clone.prompt;if(q.type===M.SELECT_CHAIN&&!q.forced)clone.respond({type:R.SELECT_CHAIN,index:null});else if([M.SELECT_YESNO,M.SELECT_EFFECTYN].includes(q.type))clone.respond({type:q.type===M.SELECT_YESNO?R.SELECT_YESNO:R.SELECT_EFFECTYN,yes:false});else break;checkDraws();checkEvents()}
    if(this.context.observations&&expectedIndex!==expectedEvents.length)throw new RemapError('public event timeline incomplete');
    if(clone.prompt?.seat!==this.context.seat||clone.prompt?.type!==this.context.promptType||publicKey(clone,this.context.seat)!==JSON.stringify(this.context.root)||promptKey(clone,this.context.seat)!==this.context.promptKey)throw new RemapError('root differs: '+(difference(this.context.root,JSON.parse(publicKey(clone,this.context.seat)))||difference(JSON.parse(this.context.promptKey),JSON.parse(promptKey(clone,this.context.seat)))));
    this.accepted++;clone.sampleId=k;clone.sampleOrders=orders;clone.sampleCoreSeed=worldSeed;clone.sampleCursor={historyStep:this.context.history.length,drawIndex,observedIndex,expectedIndex};rootObserver?.(clone,this.context);return clone;
   }catch(error){
    // Track B fix 3, third attempt (Seto 15 Oct): repair at the draw. After a deck shuffle the engine doesn't say which
    // card went where, so a post-shuffle draw has no known starting position. The shuffle moves positions without looking
    // at codes, so with the same core seed the same starting position comes up at that draw. If the world drew code X
    // where the history needs code R, R is pinned at one of X's starting positions (only positions no observation fixes),
    // one candidate per retry. Only this seat's own knowledge and public events are used; never the true hidden cards.
    let fix3=null;
    if(batch.length){for(const b of batch){this.fix3Tried.add(b.ref+':'+b.code+':'+b.index);this.placeCorrection(b.player,b.key,b.index,b.code)}fix3={batch:batch.length,player:batch[0].player,ref:batch[0].ref,index:batch[0].index,step:batch[0].step,triggeredBy:error.message};this.batchPlacements=(this.batchPlacements||0)+batch.length;this.batchRetries=(this.batchRetries||0)+1}
    else if(orders&&error.code){
     const tried=this.fix3Tried,hard=(p,j)=>this.pins[p].has(j)&&!this.soft[p].has(j);
     const rows=error.message==='known draw differs'?postDraws.filter(r=>r.mismatch&&r.required===error.code).slice(-1)
      :error.message==='semantic card unavailable'&&error.location===2&&error.controller!==undefined?postDraws.filter(r=>r.player===error.controller&&!r.required&&r.step<=historyStep).reverse():[];
     for(const r of rows){const exact=error.message==='known draw differs'?(error.offered||[]).map(c=>c._origin).filter(o=>o?.player===r.player&&o.zone==='main').map(o=>o.index):[];const candidates=error.message==='known draw differs'?exact:orders[r.player].main.map((c,j)=>c===r.drawn?j:-1).filter(j=>j>=0);const j=candidates.find(j=>!hard(r.player,j)&&!tried.has(r.ref+':'+error.code+':'+j));if(j===undefined)continue;
      const copies=orders[r.player].main.filter(c=>c===error.code).length,hardCopies=[...this.pins[r.player]].filter(([i,c])=>c===error.code&&!this.soft[r.player].has(i)).length;if(hardCopies>=copies)continue;
      tried.add(r.ref+':'+error.code+':'+j);this.placeCorrection(r.player,'draw:'+r.ref,j,error.code);fix3={player:r.player,ref:r.ref,index:j,step:r.step};this.fix3DrawRepairs=(this.fix3DrawRepairs||0)+1;break}
    }
    const repaired=!!fix3||this.repair(clone,error,orders,origins);
    // With a batch, the attempt's first cause is the first queued known draw: report it as such (same fields as r18),
    // plus the batch size and the error that finally ended the replay.
    const first=batch[0],cause=first?{message:first.reveal?'deck reveal differs':'known draw differs',drawObservation:first.drawObservation,code:first.code,offered:first.offered,step:first.historyStep}:{message:error.message,drawObservation:error.drawObservation||null,code:error.code,offered:error.offered||[],step:historyStep};
    this.failures.push({sample:k,attempt:failures+1,reason:cause.message,drawObservation:cause.drawObservation,placement:error.placement||null,timeline:first?null:error.timeline||null,historyStep:cause.step,firstMisalignedStep:cause.step,expectedEvent:this.context.history[cause.step-1]?.event||null,actualEvent:!first&&clone.prompt?eventSignature(clone):null,requiredCode:cause.code||null,offeredCodes:cause.offered.map(c=>c.code),sampledOrigins:cause.offered.map(c=>c._origin||null),targetedPins:this.pins.map(p=>[...p]),repaired,fix3,batch:first?{size:batch.length,endedBy:error.message,endedAtStep:historyStep}:null});clone.stop();repeatedStep=fix3?0:historyStep===lastFailedStep?repeatedStep+1:0;lastFailedStep=historyStep;if(!repaired||repeatedStep>=2){if(postDraws.some(r=>r.step<=historyStep))this.fix3Reseeds=(this.fix3Reseeds||0)+1;this.fix3Tried=new Set();worldSeed=seedHash(this.seed+':world:'+k+':rng-attempt:'+failures);this.corrections=[new Map(),new Map()];repeatedStep=0}failures++}
  }if(shouldStop())this.capped=true;else this.discarded++;return null; // discard; never clone original state as fallback
 }finally{this.batchKnownDraws=batchWas}}
 repeat(sample){const clone=new Duel(this.core,this.db,this.scripts),rng=randomStream(seedHash(this.seed+':repeat:'+sample.sampleId));try{clone.start(this.context.decks,{seed:sample.sampleCoreSeed,coreSeed:sample.sampleCoreSeed,first:this.context.first,deckOrders:sample.sampleOrders,observerSeat:this.context.seat});for(const r of sample.responseHistory)clone.respond(r);if(publicKey(clone,this.context.seat)!==JSON.stringify(this.context.root)||promptKey(clone,this.context.seat)!==this.context.promptKey)throw Error('Repeated sampled root differs');return clone}catch{clone.stop();return null}}

 // Round 2b (Claude): replay a world forward from a cursor to this context's root, with the same
 // draw, public-event, alignment and root checks as sample(), but no dealing and no repairs: any
 // mismatch throws, and the caller discards the world. One routine serves three jobs: advancing a
 // kept world from its last root (cursor = its saved cursor), validating a fixed deck order from
 // turn 1 (cursor = START_CURSOR on a freshly started clone), and the rebuild spot-check.
 // Deliberately a separate copy of sample()'s loop so the Ecclesia-verified sampler is untouched.
 replayWorld(clone,cursor,{rngSeed,shouldStop=()=>false}={}){
  const ctx=this.context,seat=ctx.seat,base0=String(rngSeed??this.seed+':replay:'+(clone.sampleId??'x')),rngFor=step=>randomStream(seedHash(base0+':step:'+step));
  let {historyStep,drawIndex,observedIndex,expectedIndex}=cursor,extraPasses=0;const actualDraws=clone.pendingStartDraws?clone.pendingStartDraws.splice(0):[],base=clone.handleMessage;delete clone.pendingStartDraws;
  clone.handleMessage=m=>{if(m.type===M.DRAW)actualDraws.push({player:clone.fromEngine(m.player),codes:m.drawn.map(c=>c.code),step:historyStep});return base.call(clone,m)};
  const publicEvents=events=>events.filter(e=>e.code&&['move','public-effect','reveal'].includes(e.kind));
  const expectedEvents=publicEvents(ctx.observations||[]);
  const eventKey=e=>JSON.stringify([e.kind,e.player,e.location,e.deckTop||[4,8].includes(e.location)?e.sequence:null,e.code,e.to?.controller??null,e.to?.location??null]);
  const hiddenPacket=e=>e.kind==='move'&&e.location===1&&e.to?.location===32&&!(e.to.position&5);
  let consumedDraws=0;
  const checkDraws=()=>{for(const row of actualDraws.slice(consumedDraws)){consumedDraws++;const expected=ctx.draws[drawIndex++];if(!expected||expected.player!==row.player||expected.refs.length!==row.codes.length)throw new RemapError('draw observation shape differs');for(let i=0;i<row.codes.length;i++){const code=expected.refs[i].code;if(code&&code!==row.codes[i])throw Object.assign(new RemapError('known draw differs',code,[]),{controller:row.player,location:2,drawn:row.codes[i]})}}};
  const checkEvents=()=>{const all=clone.knowledge[seat].observations,actual=publicEvents(all.slice(observedIndex));observedIndex=all.length;for(let i=0;i<actual.length;i++){
    const event=actual[i],expected=expectedEvents[expectedIndex];
    if(hiddenPacket(event)&&expected&&hiddenPacket(expected)){const got=[],want=[];while(i<actual.length&&hiddenPacket(actual[i])&&actual[i].player===event.player)got.push(actual[i++]);i--;while(expectedIndex<expectedEvents.length&&hiddenPacket(expectedEvents[expectedIndex])&&expectedEvents[expectedIndex].player===event.player)want.push(expectedEvents[expectedIndex++]);
     const left=[...got],missing=[];for(const e of want){const at=left.findIndex(a=>a.code===e.code);if(at<0)missing.push(e.code);else left.splice(at,1)}if(missing.length||left.length)throw Object.assign(new RemapError('hidden deck packet differs',missing[0]||0,[]),{controller:event.player,location:32,missing,extra:left.map(a=>a.code)});continue}
    // Track B fix 2 parity (Claude, 15 Oct): the same set comparison sample() uses for a run of public moves out of the
    // Deck within one history step, so an advanced or re-validated world passes exactly the checks a fresh world passes.
    if(ctx.observations&&expected&&event.kind==='move'&&event.location===1&&!hiddenPacket(event)&&expected.kind==='move'&&expected.location===1&&!hiddenPacket(expected)&&eventKey(expected)!==eventKey(event)){
     const deckRun=(list,at,step)=>{const run=[];while(at<list.length&&list[at].kind==='move'&&list[at].location===1&&!hiddenPacket(list[at])&&list[at].step===step)run.push(list[at++]);return run};
     const got=deckRun(actual,i,event.step),want=deckRun(expectedEvents,expectedIndex,expected.step);
     if(got.length>1&&got.length===want.length){const left=got.map(eventKey);let same=true;for(const e of want){const at=left.indexOf(eventKey(e));if(at<0){same=false;break}left.splice(at,1)}
      if(same){i+=got.length-1;expectedIndex+=want.length;continue}}
    }
    expectedIndex++;if(ctx.observations&&(!expected||eventKey(expected)!==eventKey(event)))throw new RemapError('public event timeline differs')}};
  const passWindow=()=>{const q=clone.prompt;if(q.type===M.SELECT_CHAIN&&!q.forced)clone.respond({type:R.SELECT_CHAIN,index:null});else if([M.SELECT_YESNO,M.SELECT_EFFECTYN].includes(q.type))clone.respond({type:q.type===M.SELECT_YESNO?R.SELECT_YESNO:R.SELECT_EFFECTYN,yes:false});else return false;return true};
  try{
   checkDraws();checkEvents();
   for(;historyStep<ctx.history.length;){if(shouldStop())throw new RemapError('replay stopped by deadline');const sem=ctx.history[historyStep++];if(clone.finished)throw new RemapError('world ends before observed history');const p=clone.prompt;
    if(sem.optionalPass&&(!alignedEvent(clone,sem)||p.type!==sem.promptType||p.seat!==sem.seat))continue;
    while(clone.prompt&&(!alignedEvent(clone,sem)||clone.prompt.type!==sem.promptType||clone.prompt.seat!==sem.seat)&&clone.prompt.seat!==seat&&extraPasses++<32){if(!passWindow())break;checkDraws()}
    const response=remapResponse(clone,sem,rngFor(historyStep-1)),before=clone.retries;(clone.nativeByStep??=[])[historyStep-1]=structuredClone(response);clone.respond(response);if(clone.retries!==before)throw new RemapError('native rejection after semantic remap');checkDraws();checkEvents();
   }
   while(clone.prompt&&clone.prompt.seat!==seat&&extraPasses++<32&&(clone.prompt.type!==ctx.promptType||publicKey(clone,seat)!==JSON.stringify(ctx.root))){if(!passWindow())break;checkDraws();checkEvents()}
   if(ctx.observations&&expectedIndex!==expectedEvents.length)throw new RemapError('public event timeline incomplete');
   if(clone.prompt?.seat!==seat||clone.prompt?.type!==ctx.promptType||publicKey(clone,seat)!==JSON.stringify(ctx.root)||promptKey(clone,seat)!==ctx.promptKey)throw new RemapError('root differs');
   rootObserver?.(clone,ctx);
   return {historyStep,drawIndex,observedIndex,expectedIndex};
  }finally{clone.handleMessage=base===Duel.prototype.handleMessage?undefined:base;if(clone.handleMessage===undefined)delete clone.handleMessage}
 }
 /** Start a fresh clone with a fixed deck order and core seed (no dealing), ready for replayWorld from START_CURSOR. */
 startFixed(orders,coreSeed){const clone=new Duel(this.core,this.db,this.scripts),draws=[];clone.handleMessage=m=>{if(m.type===M.DRAW)draws.push({player:clone.fromEngine(m.player),codes:m.drawn.map(c=>c.code),step:0});return Duel.prototype.handleMessage.call(clone,m)};try{clone.start(this.context.decks,{seed:coreSeed,coreSeed,first:this.context.first,deckOrders:orders,observerSeat:this.context.seat})}finally{delete clone.handleMessage}clone.pendingStartDraws=draws;clone.sampleOrders=orders;clone.sampleCoreSeed=coreSeed;return clone}
 roots(count=16,shouldStop=()=>false){const roots=[];for(let k=0;k<count*PROPOSALS_PER_WORLD&&roots.length<count&&!shouldStop();k++){const sample=this.sample(k,shouldStop);if(sample)roots.push(sample)}return roots}
}

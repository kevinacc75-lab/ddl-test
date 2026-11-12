import {applyConcede,concedeRecord,restoreConcede} from './concede-record.mjs';import {HumanResponseBridge} from './human-flow.mjs';
import {WorkerPauseOwners} from './human-holds.mjs';
import {exportSeatContext,safeView} from './ai/knowledge.mjs';
import {Duel,M} from './duel.mjs';
import {sumSelections} from './pilot.mjs';
import {createOptimalPilots as createPilots} from './optimal-pilot.mjs';
import {AI_MODES,aiModeOf,setAiMode} from './ai/midgame-flags.mjs';
import {carryRemovalIntent} from './ai/midgame-rules.mjs';
import {WindBotPilot,loadWindBot,windBotFor} from './windbot/pilot.mjs';
// r37 (Kevy 7 Nov 21:57 AEDT): each AI seat can be piloted by our AI or by WindBot, the open-source scripted EDOPro bot
// (dist/windbot/pilot.mjs). WindBot gets every engine message the EDOPro way through the core's raw message hook.
let pilotKinds=['ai','ai'],windBots=[null,null];
function disarmWindBots(){for(const b of windBots)b?.close();windBots=[null,null];globalThis.__ocgRawHook=null}
async function armWindBots(decks,seed,first){disarmWindBots();const want=[0,1].filter(s=>pilotKinds[s]==='windbot'&&aiSeat(s)&&windBotFor(decks[s]?.id));if(!want.length)return;
 const exports=await loadWindBot(duel.db),counts=[0,1].map(t=>{const s=t===0?first:1-first;return [decks[s].main.length,decks[s].extra.length]});/* engine team 0 = the seat that goes first */
 for(const s of want){const p=new WindBotPilot({seat:s,seed,deck:decks[s],exports});await p.attach(duel,s===first?0:1);windBots[s]=p}
 globalThis.__ocgRawHook=(h,raw)=>{if(h!==duel?.handle)return;for(const p of windBots)p?.batch(duel,raw,counts)}}
const withWindBots=list=>list.map((p,s)=>windBots[s]||p);
let aiMode='classic';/* r36 AI selector: Enhanced (the page default since r36) / Classic, fixed per duel; a start or replay without a mode is Classic */
const BUILD='ddl-test r51 standard field layout on r50 Lapis & Gold look on r49.1 Gold Sarcophagus art fix on r49 mobile layout (phone portrait, tablets; one response control) on r48.1 retry fix (an automatic answer is offered once) on r48 play comfort (No response, chain setting, auto-place, gold aura) + concession in replays + S1 position rule on r47 battle/chain rule fix + Concede on r46 AI WindBot port + victory boss art on r45 AI v4 on r44 Aurora boss art on r43 Aurora P1 / r42 Branded MetaGamesGX 41 budget Extra (Alba-Lenatus + Sanctifire) TEST 2026-11-13-r51-field';/* replay build identity = the sw.js cache name of this publish; the review manifest maps it to the served tree hash */
import {readCompressed} from './load.mjs';
import {presentationBatches,visiblePresentationEvents,ChainDirector} from './event-data.mjs';
// r35 item 8 (RELAY-046 Tap B, Seto 27 Oct 10:10): deck-shuffle capture on the one real duel (see shuffle-tap.mjs).
import {ShuffleTap} from './shuffle-tap.mjs';const shuffleTap=new ShuffleTap({shuffleType:M.SHUFFLE_DECK});
// r36 (Kevy 29 Oct 14:29, coin flip cutscene): coin-toss / dice-roll capture on the same one real duel, same conditions (see coin-tap.mjs).
import {CoinTap} from './coin-tap.mjs';const coinTap=new CoinTap({coinType:M.TOSS_COIN,diceType:M.TOSS_DICE,optionType:M.SELECT_OPTION});
const humanBridge=new HumanResponseBridge(),pauseOwners=new WorkerPauseOwners();let interactionProtocol=1,lastHumanState=null;
function resetHumanTransport(session=humanBridge.clientSession){humanBridge.reset(session);pauseOwners.reset(humanBridge.epoch,paused);lastHumanState=null}
function rejectHumanReply(x,reason){postMessage({type:'human-reply-result',clientSession:humanBridge.clientSession,requestId:x.human?.requestId,accepted:false,reason,current:lastHumanState?{...lastHumanState,events:[],shuffle:lastHumanState.shuffle&&{...lastHumanState.shuffle,shuffles:[]},coin:lastHumanState.coin&&{...lastHumanState.coin,tosses:[]},human:{...lastHumanState.human,stateSeq:++humanBridge.stateSeq}}:null})}
const director=new ChainDirector();let preset='learning',tapToContinue=false,chainFlow=true,chainView;let duel,view=0,mode='play',study=false,paused=false,timer,delay=1200,loading,disabled=false,generation=0;
let concession=null;/* r48: the saved terminal concession, if any */let replayHistory=[],dealHand=false;let pilots=[],matchInfo=null,plan,thoughts=[],thoughtSeq=0,deliveredSeq=0,presentationUntil=0,presentationPending=false,cinematics=true,motion=false,pace=1,learnHold=false,effectPace='readable';
const aiSeat=p=>mode==='watch'||(mode==='play'&&p!==view);
let thinkWorker,thinking=null,thinkId=0,thinkTimeout,thinkTimes=[],thinkReady;
// Round 2b (Seto rulings 1-3): think-ahead on a settled position while the scene plays; pace sets how long the
// AI may think, never how much work it does. Learning/Study: up to 4 s (never less than Normal); Duel/Broadcast:
// 1.5 s of visible wait after the scene ends; Instant: 0.4 s. searchRoots counts this duel's searches per seat so a
// lost or rewound world pool is flagged as a cut lineage.
let presentationDoneAt=0,searchRoots=[0,0],duelSerial=0,skipCutins=false;
// Shared deadline (where the browser allows SharedArrayBuffer): a skipped scene shortens the AI worker's own deadline
// too, so a stale think can't hold the AI worker past the new deadline. Without it, the AI worker keeps the deadline it
// was given; the duel never waits longer, but the next decision may fall back to the public-information pick.
const deadlineBox=typeof SharedArrayBuffer==='function'?new Int32Array(new SharedArrayBuffer(8)):null,deadlineBase=Date.now();
const paceKind=()=>preset==='instant'?'instant':preset==='learning'||delay>=4000?'study':'normal';
// r29 (Kevy 22 Oct 13:06: "have the learning mode mimic this time frame ... the feel of watching a true to life game";
// Duel "happy to add 1-2 seconds"): human-paced decisions. A pause before the AI's choice is shown, sized like a
// person's thinking time (Konami Swiss rounds: 50 min per best-of-3; Master Duel: 300 s bank, +60 s own turn, +30 s
// opponent turn). Pace only: the AI's work (node budget) is unchanged, so every preset plays the same moves (Round 2b
// ruling). Broadcast / Instant: no pause. Nothing to decide (one legal choice) = no pause, as Master Duel auto-passes.
export const HUMAN_MS={learning:{auto:0,mechanical:600,quick:1500,pick:2000,step:3000,big:6000},duel:{auto:0,mechanical:0,quick:0,pick:0,step:0,big:1000}};
let humanFirsts=new Set();
export function decisionClass(d,seat){const p=d.prompt;if(!p)return 'auto';let n=0;try{n=safeView(d,seat).choices().length}catch{n=2}if(n<=1)return 'auto';
 if([M.SELECT_PLACE,M.SELECT_DISFIELD,M.SELECT_POSITION].includes(p.type))return 'mechanical';
 if(p.type===M.SELECT_CHAIN)return d.active===seat?'quick':'step';/* a hand trap in hand: a real pause on the opponent's turn */
 if(p.type===M.SELECT_IDLECMD||p.type===M.SELECT_BATTLECMD){const key=d.turn+':'+seat+':'+p.type;if(!humanFirsts.has(key)){humanFirsts.add(key);return 'big'}return 'step'}/* planning the turn / the first attack */
 if([M.SELECT_EFFECTYN,M.SELECT_YESNO].includes(p.type))return 'quick';return 'pick'}
let humanPending=null;/* {revision, ms, started} for the decision being shown */
// r32 (ChatGPT review F3/F4): Learning's hold is a minimum that the AI's thinking runs inside (human thinking time);
// Duel's +1 s on big decisions is ADDED after the normal step timer, once the plan is ready, so thinking time can't
// absorb it. A preset change mid-decision recomputes the pending hold (Instant / Broadcast drop it).
const ADDED_HOLD={duel:true};
const newHumanHold=()=>{const cls=decisionClass(duel,duel.prompt.seat);return {revision:duel.revision,cls,ms:(HUMAN_MS[preset]||{})[cls]||0,started:Date.now(),add:!!ADDED_HOLD[preset],dueAt:null}};/* decisionClass marks the turn's first plan as 'big', so it is called once per decision */
const humanWait=()=>humanPending&&humanPending.revision===duel?.revision&&!humanPending.add?Math.max(humanPending.started,presentationDoneAt)+humanPending.ms-Date.now():0;
const addedWait=stepMs=>{const h=humanPending;if(!h||h.revision!==duel?.revision||!h.add||!(h.ms>0))return 0;if(h.dueAt==null)h.dueAt=Date.now()+Math.max(stepMs,presentationUntil-Date.now(),0)+h.ms;return h.dueAt-Date.now()};
const rehold=()=>{const h=humanPending;if(!h||h.revision!==duel?.revision)return;const ms=(HUMAN_MS[preset]||{})[h.cls]||0;Object.assign(h,{ms,add:!!ADDED_HOLD[preset],dueAt:null})};
const thinkDeadline=started=>{const kind=paceKind(),visibleStart=Math.max(started,presentationPending?presentationUntil:presentationDoneAt);return kind==='instant'?started+400:kind==='study'?Math.max(started+4000,visibleStart+1500):visibleStart+1500};
function cancelThink(terminate=true){clearTimeout(thinkTimeout);thinkWorker?.postMessage({type:'cancel',id:thinking?.id});if(terminate){thinkWorker?.terminate();thinkWorker=null;thinkReady=null}thinking=null}
function warmThinkWorker(){if(typeof Worker==='undefined')return Promise.resolve();if(thinkReady)return thinkReady;thinkWorker??=new Worker('ai/ai-worker.mjs',{type:'module'});thinkReady=new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(Error('AI worker preparation timed out')),15000);thinkWorker.onmessage=({data:x})=>{if(x.type==='ready'){clearTimeout(timeout);resolve()}else if(x.type==='error'){clearTimeout(timeout);reject(Error(x.message))}};thinkWorker.onerror=e=>{clearTimeout(timeout);reject(Error(e.message||'AI worker preparation failed'))};thinkWorker.postMessage({type:'warm'})});return thinkReady}
function planned(){
 if(!duel?.prompt||disabled)return null;if(plan?.revision===duel.revision)return plan;
 if(pilots[duel.prompt.seat]?.kind==='windbot'){if(thinking)cancelThink(false);humanPending=newHumanHold();plan=pilots[duel.prompt.seat].plan(duel);return plan}/* r37: WindBot answers at once, in this worker */
 if(typeof Worker==='undefined'){humanPending=newHumanHold();plan=pilots[duel.prompt.seat].plan(duel);return plan}
 if(thinking?.revision===duel.revision)return null;if(thinking)cancelThink(false);
 let bestAggregated=null,lastProgress=null;humanPending=newHumanHold();const publicDecision=pilots[duel.prompt.seat].base(safeView(duel,duel.prompt.seat));const id=++thinkId,revision=duel.revision,seat=duel.prompt.seat,started=Date.now(),deadlineAt=thinkDeadline(started),capMs=deadlineAt-started;thinking={id,revision,started,deadlineAt};if(deadlineBox){Atomics.store(deadlineBox,1,deadlineAt-deadlineBase);Atomics.store(deadlineBox,0,id)}
 const searchRoot=[M.SELECT_IDLECMD,M.SELECT_BATTLECMD,M.SELECT_CHAIN].includes(duel.prompt.type)&&safeView(duel,seat).choices().length>1,priorSearchRoots=searchRoot?searchRoots[seat]++:searchRoots[seat];
 thinkWorker??=new Worker('ai/ai-worker.mjs',{type:'module'});
 const metric=stats=>postMessage({type:'ai-think-metric',preset:paceKind(),thinkMs:Date.now()-started,visibleWaitMs:presentationPending?0:Math.max(0,Date.now()-Math.max(started,presentationDoneAt)),capMs,seed:matchInfo.seed,decision:duel.responseHistory.length,seat,promptType:duel.prompt.type,isSearchRoot:[M.SELECT_IDLECMD,M.SELECT_BATTLECMD,M.SELECT_CHAIN].includes(duel.prompt.type)&&safeView(duel,seat).choices().length>1,stats});
 const fallback=()=>{if(thinking?.id!==id||duel.revision!==revision)return;cancelThink(false);plan=bestAggregated?.plan||publicDecision;if(bestAggregated&&aiMode==='enhanced')plan=carryRemovalIntent(plan,publicDecision,seat);/* r36 B1 worker-state (RELAY-108): the capped plan keeps the matching baseline intent */if(bestAggregated){plan.search={...bestAggregated.stats,capped:true,status:(bestAggregated.stats.matchedWorlds??bestAggregated.stats.determinizations)>=16?'full':'reduced'};duel.record('think-cap: best action aggregated over '+bestAggregated.stats.aggregatedWorlds+' sampled worlds','guard')}else{duel.record('info-set fallback: fewer than eight aggregated worlds at '+capMs+'ms cap; public-information decision','guard');plan.search={...(lastProgress||{}),nodes:lastProgress?.nodes||0,determinizations:lastProgress?.determinizations||0,aggregatedWorlds:0,status:'fallback',capped:true}}if(duel.log.at(-1))duel.log.at(-1).reason=bestAggregated?'think-cap':'public-information fallback';metric(plan.search);send()};
 thinkWorker.onmessage=({data:x})=>{if(thinking?.id!==id||x.id!==id||x.revision!==revision||duel.revision!==revision)return;if(x.type==='progress'){lastProgress=x.stats;if(x.stats?.aggregatedWorlds>=8&&x.plan)bestAggregated=x;postMessage({type:'ai-progress',revision,stats:x.stats});return}if(x.type==='error'){fallback();return}if(x.type==='decision'){thinkTimes.push(Date.now()-started);thinkTimes=thinkTimes.slice(-15);for(const entry of x.guards||[])if(!duel.log.some(e=>e.kind==='guard'&&e.actionIndex===entry.actionIndex&&e.text===entry.text))duel.log.push(entry);plan=x.plan;metric(x.stats);cancelThink(false);send()}};
 thinkWorker.onerror=fallback;thinking.fallback=fallback;thinkTimeout=setTimeout(fallback,Math.max(0,deadlineAt-Date.now()));
 thinkWorker.postMessage({type:'think',id,revision,startedAt:started,seatContext:exportSeatContext(duel,seat),seed:matchInfo.seed,first:matchInfo.first,seat,capMs,deadlineAt,deadlineBox,deadlineBase,priorSearchRoots,duelId:duelSerial,aiSeats:mode==='watch'?2:1,poolSize:mode==='watch'?10:16/*Seto 14 Oct: Watch (both seats AI) 10 worlds (~35 MB of its 40 MB share); Play 16*/,nodeBudget:preset==='instant'?40:400,doctrine:matchInfo.doctrine,decisionCount:pilots[seat].decisions,aiMode,midgame:AI_MODES[aiMode],pendingRemoval:aiMode==='enhanced'?pilots[seat].pendingRemoval??null:null});return null;
}

function send(){
 if(!duel?.handle)return;
 if(mode==='manual'&&duel.prompt)view=duel.prompt.seat;
 const snap=duel.snapshot(view,study||mode==='watch'),m=duel.prompt,isAi=!!m&&aiSeat(m.seat);
 const events=visiblePresentationEvents(duel.events.filter(e=>e.id>deliveredSeq),view,{study,mode});deliveredSeq=duel.eventSeq;
 const duration=director.ingest(events,duel.db,{cinematics,skipCutins,motion,pace,effectPace,preset,chainView:chainView==='auto'?undefined:chainView,tapToContinue,chainFlow,deferResolution:true}).reduce((sum,b)=>sum+b.duration,0);if(duration){presentationUntil=Math.max(Date.now(),presentationUntil)+duration;presentationPending=true;}
 const multi=m&&[M.SELECT_CARD,M.SELECT_TRIBUTE,M.SELECT_SUM,M.SELECT_COUNTER,M.ANNOUNCE_RACE,M.ANNOUNCE_ATTRIB].includes(m.type);
 if(!pauseOwners.owners.size)pauseOwners.base=paused;
 const human=interactionProtocol===2?{...humanBridge.issue({revision:duel.revision,seat:m?.seat,prompt:m,ai:isAi,disabled,finished:duel.finished}),pauseOwners:[...pauseOwners.owners],basePaused:pauseOwners.base}:undefined;
 const message={type:'state',human,lastEventId:deliveredSeq,shuffle:shuffleTap.drain(),coin:coinTap.drain(),state:{...snap,logBase:Math.max(0,duel.log.length-snap.log.length),prompt:isAi?null:m},events,match:matchInfo,title:isAi?pilots[m.seat].name+' is choosing its next play':duel.title(),description:!isAi&&m?.description?duel.description(m.description):'',choices:isAi?[]:duel.choices(),multi:!!multi,ai:isAi,paused,view,mode,study,disabled,sums:!isAi&&m?.type===M.SELECT_SUM?sumSelections(m):[],coach:mode==='watch'?{pilots:pilots.map(p=>p.info()),intent:isAi?planned():null,last:thoughts.at(-1)||null,history:thoughts.slice(-24),delay}:null};lastHumanState=message;postMessage(message);
 schedule();
}
function schedule(){clearTimeout(timer);if(!duel?.handle)return;/* r36.1: a stopped duel (New) has no engine handle; a settings message must not plan on it */if(duel?.prompt&&aiSeat(duel.prompt.seat)&&!paused&&!duel.finished&&!disabled&&presentationPending)planned();if(duel?.prompt&&aiSeat(duel.prompt.seat)&&!paused&&!duel.finished&&!disabled&&!presentationPending){planned();if(thinking)return;const stepMs=delay<=700&&![M.SELECT_IDLECMD,M.SELECT_BATTLECMD,M.SELECT_CHAIN,M.SELECT_EFFECTYN,M.SELECT_YESNO].includes(duel.prompt.type)?Math.min(delay,65):delay;timer=setTimeout(step,Math.max(stepMs,presentationUntil-Date.now(),humanWait(),addedWait(stepMs)))}}

function step(){
 try{
  const decision=planned();if(!decision&&thinking)return;if(!decision){paused=true;postMessage({type:'notice',message:'This pilot needs help with this choice. Take control of this seat to continue.'});send();return}
  const before=duel.retries;duel.respond(decision.response);if(duel.retries===before)pilots[decision.seat].observe(decision);plan=null;
  replayHistory=duel.responseHistory.slice();thoughts.push({...decision,id:++thoughtSeq,accepted:duel.retries===before});if(thoughts.length>2000)thoughts.shift();
  if(duel.retries>before){paused=true;postMessage({type:'notice',message:'The computer’s selection was rejected. Take control to choose the required cards.'})}
  if(mode==='watch'&&learnHold)paused=true;
  send();
 }catch(e){disabled=true;paused=true;shuffleTap.disarm();coinTap.disarm();postMessage({type:'error',message:e.message});send()}
}
onmessage=async ({data:x})=>{try{
 if(interactionProtocol===2&&['pause','step','control','rewind'].includes(x.type)&&(x.clientSession!==humanBridge.clientSession||x.epoch!==humanBridge.epoch))return;
 if(x.type==='load-library'){postMessage({type:'load-progress',message:'Decompressing card library…'});postMessage({type:'library',db:await readCompressed('cards.json.gz')});return}
 if(x.type==='start'){shuffleTap.reset();coinTap.reset();interactionProtocol=x.interactionProtocol===2?2:1;resetHumanTransport(typeof x.clientSession==='string'?x.clientSession:'');cancelThink();searchRoots=[0,0];presentationDoneAt=0;duelSerial++;humanFirsts=new Set();
  director.reset();preset=x.preset||'learning';tapToContinue=!!x.tapToContinue;chainFlow=x.chainFlow!==false;chainView=x.chainView;const run=++generation;clearTimeout(timer);disabled=false;paused=!!x.dealHand;dealHand=!!x.dealHand;replayHistory=[];concession=null;view=x.view;mode=x.mode;study=x.study;delay=x.delay||2200;cinematics=x.cinematics!==false;skipCutins=!!x.skipCutins;motion=!!x.motion;pace=x.pace||1;effectPace=x.effectPace||'readable';learnHold=!!x.learnHold;thoughts=[];thoughtSeq=0;plan=null;deliveredSeq=0;presentationUntil=0;presentationPending=false;
  if(!duel){postMessage({type:'load-progress',message:'Loading native effect scripts…'});loading??=Promise.all([readCompressed('cards.json.gz'),readCompressed('scripts.json.gz')]).then(async([db,scripts])=>Duel.create(db,scripts)).catch(e=>{loading=null;throw e});duel=await loading}shuffleTap.install(duel);coinTap.install(duel);await warmThinkWorker();
  pilotKinds=[0,1].map(s=>x.pilots?.[s]==='windbot'?'windbot':'ai');try{await armWindBots(x.decks,x.seed,x.first)}catch(e){disarmWindBots();pilotKinds=['ai','ai'];postMessage({type:'notice',message:'WindBot could not start in this browser ('+e.message+'). Our AI pilots both seats.'})}
  if(run!==generation){disarmWindBots();return}duel.start(x.decks,{seed:x.seed,first:x.first});if(Array.isArray(x.responses)){for(const r of x.responses){if(duel.finished)break;duel.respond(r);if(duel.retries)throw Error('Saved replay selection rejected')}paused=true;replayHistory=duel.responseHistory.slice();concession=restoreConcede(duel,x.concede,x.responses.length);/* r48 */deliveredSeq=duel.eventSeq}shuffleTap.arm();coinTap.arm();aiMode=aiModeOf(x.aiMode);setAiMode(aiMode);pilots=withWindBots(createPilots({seed:x.seed,doctrine:x.doctrine!==false,nodeBudget:preset==='instant'?40:400}));matchInfo={seed:x.seed,first:x.first,styles:pilots.map(p=>p.kind==='windbot'?'windbot':'optimal'),variation:'none',doctrine:x.doctrine!==false,strategy:'optimal',aiMode,pilots:pilots.map(p=>p.info())};send();
 }else if(x.type==='reply'){
  if(interactionProtocol===2){const checked=humanBridge.check(x,{prompt:duel?.prompt,choices:duel?.choices()||[],sums:duel?.prompt?.type===M.SELECT_SUM?sumSelections(duel.prompt):[]});if(!checked.ok){rejectHumanReply(x,checked.reason);return}if(pauseOwners.owners.size){humanBridge.used=null;rejectHumanReply(x,'Close the reading panel before submitting.');return}}
  cancelThink();if(disabled)throw Error('This duel is stopped. Start a new duel.');const retries=duel.retries;duel.respond(x.response,x.revision);if(interactionProtocol===2)humanBridge.ack={requestId:x.human.requestId,accepted:duel.retries===retries};replayHistory=duel.responseHistory.slice();plan=null;send()
 }
 else if(x.type==='human-hold'){if(interactionProtocol!==2||x.clientSession!==humanBridge.clientSession||!pauseOwners.change(x))return;paused=pauseOwners.paused;send()}
 else if(x.type==='human-recover'){if(interactionProtocol!==2||x.clientSession!==humanBridge.clientSession||x.epoch!==humanBridge.epoch)return;pauseOwners.releaseAll();paused=pauseOwners.paused;send()}
 else if(x.type==='rewind'){cancelThink();clearTimeout(timer);shuffleTap.reset();coinTap.reset();const index=Math.max(0,Math.min(Number(x.index)||0,replayHistory.length)),saved=replayHistory.slice(),decks=duel.decks;if(windBots.some(Boolean))await armWindBots(decks,matchInfo.seed,matchInfo.first);duel.start(decks,{seed:matchInfo.seed,first:matchInfo.first});pilots=withWindBots(createPilots({seed:matchInfo.seed,doctrine:matchInfo.doctrine,nodeBudget:preset==='instant'?40:400}));for(const r of saved.slice(0,index)){if(duel.finished)break;duel.respond(r)}{const c=concession;concession=null;if(c&&index>=c.afterResponses&&duel.responseHistory.length===c.afterResponses&&applyConcede(duel,c.seat))concession=c}/* r48: a rewind to before the concession clears it; a rewind to the end keeps the conceded result */shuffleTap.arm();coinTap.arm();replayHistory=saved;thoughts=thoughts.filter(t=>t.revision<=duel.revision);plan=null;paused=true;disabled=false;director.reset();deliveredSeq=duel.eventSeq;presentationUntil=0;presentationPending=false;resetHumanTransport();postMessage({type:'rewound',index});send()}
 else if(x.type==='pause'){if(interactionProtocol===2){pauseOwners.manual(x.value);paused=pauseOwners.paused}else paused=x.value===undefined?!paused:!!x.value;send()}
 else if(x.type==='step'){clearTimeout(timer);paused=true;resetHumanTransport();step()}
 else if(x.type==='concede'){/* r47: Play mode only. The human seat concedes: the duel ends at once and the other seat wins. No engine call; recorded and announced like any other win (reason 16 = conceded). r48: the concession is kept as a terminal record for the exported replay. */if(duel&&!duel.finished&&mode==='play'&&(view===0||view===1)){cancelThink();clearTimeout(timer);resetHumanTransport();if(applyConcede(duel,view))concession=concedeRecord(view,duel.responseHistory.length);send()}}
   else if(x.type==='control'){clearTimeout(timer);view=x.seat;mode='play';paused=false;resetHumanTransport();send()}
 else if(x.type==='study'){study=x.value;send()}
 else if(x.type==='speed'){delay=x.value;send()}
 else if(x.type==='cinematics'){preset=x.preset||'learning';rehold();tapToContinue=!!x.tapToContinue;chainFlow=x.chainFlow!==false;chainView=x.chainView;pilots.forEach(p=>p.budget=p.nodeBudget=preset==='instant'?40:400);cinematics=x.value;skipCutins=!!x.skipCutins;motion=!!x.motion;pace=x.pace||1;effectPace=x.effectPace||'readable';schedule()}
 else if(x.type==='learn'){learnHold=x.value;send()}
 else if(x.type==='skip-scene'||x.type==='presentation-done'){if(x.eventId>=deliveredSeq){presentationUntil=0;presentationPending=false;presentationDoneAt=Date.now();if(thinking?.fallback&&paceKind()!=='instant'){const due=thinkDeadline(thinking.started);if(due<thinking.deadlineAt){thinking.deadlineAt=due;if(deadlineBox&&Atomics.load(deadlineBox,0)===thinking.id)Atomics.store(deadlineBox,1,due-deadlineBase);clearTimeout(thinkTimeout);thinkTimeout=setTimeout(thinking.fallback,Math.max(0,due-Date.now()))}}schedule()}}
 else if(x.type==='export-replay'){postMessage({type:'export-replay',replay:{version:'2.2.0-rc',decks:duel.decks,seed:matchInfo.seed,first:matchInfo.first,aiMode:matchInfo.aiMode,build:BUILD,pilots:matchInfo.styles/* r37: 'optimal' (our AI) or 'windbot' per seat; information only */,responses:duel.responseHistory,...(concession&&duel.finished&&duel.winReason===16?{concede:concession}:{})/* r48: terminal concession (seat + response boundary); not an engine response */}})}
 else if(x.type==='import-replay'){cancelThink();shuffleTap.reset();coinTap.reset();searchRoots=[1,1];duelSerial++;clearTimeout(timer);disarmWindBots();pilotKinds=['ai','ai'];/* r37: a saved replay steps through its recorded choices; our AI takes over if it continues */const r=x.replay;if(r.version!=='2.2.0-rc'||!Array.isArray(r.responses)||r.responses.length>10000)throw Error('Unsupported replay file');if(r.aiMode!==undefined&&r.aiMode!=='classic'&&r.aiMode!=='enhanced')throw Error('Unsupported replay AI mode');duel.start(r.decks,{seed:r.seed,first:r.first});for(const response of r.responses){if(duel.finished)break;duel.respond(response);if(duel.retries)throw Error('Replay response was rejected')}concession=restoreConcede(duel,r.concede,r.responses.length);/* r48 */shuffleTap.arm();coinTap.arm();replayHistory=duel.responseHistory.slice();aiMode=aiModeOf(r.aiMode);setAiMode(aiMode);/* RELAY-119: explicit aiMode honoured; missing = Classic (pre-selector replays) */matchInfo={...matchInfo,seed:r.seed,first:r.first,aiMode};pilots=createPilots({seed:r.seed,nodeBudget:preset==='instant'?40:400});plan=null;paused=true;resetHumanTransport();director.reset();deliveredSeq=0;presentationUntil=0;presentationPending=false;send()}
 else if(x.type==='export'){const extra=mode==='watch'?'\n\nINDEPENDENT PROCEDURAL PILOT CHOICES\n'+thoughts.map(t=>'Turn '+t.turn+' · '+duel.decks[t.seat].name+' · '+t.title+'\n'+t.rule+': '+t.reason+(t.doctrine?'\nDOCTRINE: '+t.doctrine.title+' · '+t.doctrine.status:'')).join('\n\n'):'';postMessage({type:'export',text:'GAME SEED '+matchInfo?.seed+' · FIRST SEAT '+matchInfo?.first+' · VARIATION '+matchInfo?.variation+' · PILOT '+matchInfo?.strategy+' · DOCTRINE '+(matchInfo?.doctrine?'ON':'OFF')+'\n'+pilots.map(p=>p.name+': '+p.info().label+' · seed '+p.seed).join('\n')+'\n\n'+(duel?.log.map(e=>e.text).join('\n')||'')+extra})}
 else if(x.type==='stop'){cancelThink();disarmWindBots();shuffleTap.disarm();coinTap.disarm();generation++;clearTimeout(timer);presentationUntil=0;presentationPending=false;duel?.stop();resetHumanTransport();postMessage({type:'stopped'})}
 }catch(e){disabled=true;paused=true;shuffleTap.disarm();coinTap.disarm();postMessage({type:'error',message:e.message});resetHumanTransport();if(duel?.handle)send()}};

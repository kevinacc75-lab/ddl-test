import {Knowledge} from './knowledge.mjs';
import {Duel} from '../duel.mjs';
import {buildPlan} from '../pilot-notes.mjs';
import {createOptimalPilots} from '../optimal-pilot.mjs';
import {readCompressed} from '../load.mjs';
import {createSearchCore} from './engine-snapshot.mjs';
// Round 2b: persistent world pool (Seto ruling A; switched on 14 Oct). One pool per duel and seat, kept between thinks.
export const WORLD_POOL_ENABLED=true;
let cancelled=new Set(),resources;
const warm=()=>resources??=Promise.all([readCompressed('../cards.json.gz'),readCompressed('../scripts.json.gz')]).then(async([db,scripts])=>({db,scripts,core:(await Duel.create(db,scripts)).core,searchCore:await createSearchCore(db,scripts)}));
onmessage=async({data:x})=>{
 if(x.type==='cancel'){cancelled.add(x.id);return}if(x.type==='warm'){try{await warm();postMessage({type:'ready'})}catch(e){resources=null;postMessage({type:'error',message:e.message})}return}if(x.type!=='think')return;
 const capMs=x.capMs??(x.nodeBudget<100?400:1500),deadline=performance.now()+Math.max(0,(x.deadlineAt?x.deadlineAt-Date.now():capMs-(Date.now()-(x.startedAt??Date.now())))-20),box=x.deadlineBox||null,shouldStop=()=>performance.now()>=deadline||(box!==null&&Atomics.load(box,0)===x.id&&Date.now()>=x.deadlineBase+Atomics.load(box,1)-20);
 let d;try{const {db,scripts,core,searchCore}=await warm();if(cancelled.has(x.id))return;
 const foundation=new Duel(core,db,scripts),context=x.seatContext,state=context.publicState;if(!state)throw Error('Sanitized root state missing');d=foundation;Object.assign(d,state);d.handle=null;d.seatContext=context;d.decks=context.decks;d.order=context.first===0?[0,1]:[1,0];d.fromEngine=p=>d.order[p];d.toEngine=p=>d.order.indexOf(p);d.lp=state.players.map(p=>p.lp);d.responseHistory=Array(context.history.length);d.instances=new Map();d.instanceSlots=new Map();d.attempts=new Map();d.stateKeys=new Map();d.actions=0;d.copyCounts=new Map();d.pendingIdentityEntries=new Set();d.log=[];d.events=[];d.knowledge=[0,1].map(view=>new Knowledge(view,d.decks,d.fromEngine));d.zone=(p,l)=>l===1?Array.from({length:state.players[p].deck},(_,sequence)=>({code:0,controller:p,location:l,sequence,hidden:true})):state.players[p].zones[l]||[];d.snapshot=()=>({...state,log:d.log});
 const pilot=createOptimalPilots({seed:x.seed,nodeBudget:x.nodeBudget,doctrine:x.doctrine,shouldStop,searchCore,worldPool:WORLD_POOL_ENABLED,poolKey:x.duelId!==undefined?'live:'+x.duelId:undefined,poolSize:x.poolSize,seatCapBytes:x.aiSeats?80*1048576/x.aiSeats:undefined})[x.seat];pilot.priorSearchRoots=x.priorSearchRoots;pilot.decisions=x.decisionCount||0;pilot.onProgress=stats=>{if(stats.aggregatedWorlds<8){postMessage({type:'progress',id:x.id,revision:x.revision,stats});return}postMessage({type:'progress',id:x.id,revision:x.revision,stats,response:stats.response,plan:{...buildPlan(d,stats.response,{rule:'Capped information-set search',reason:'Best sampled action aggregated over '+stats.aggregatedWorlds+' worlds',kind:'effect'}),revision:x.revision,search:stats}})};const before=d.log.length,plan=pilot.plan(d);plan.revision=x.revision;
 if(!cancelled.has(x.id))postMessage({type:'decision',id:x.id,revision:x.revision,response:plan.response,explain:plan.reason,stats:plan.search||{nodes:0,determinizations:0},plan,guards:d.log.slice(before).filter(e=>e.kind==='guard')});
 }catch(e){postMessage({type:'error',id:x.id,revision:x.revision,message:e.message})}finally{d?.stop()}
};

import fs from 'node:fs';
import {gunzipSync} from 'node:zlib';
import assert from 'node:assert/strict';
import {Duel,M} from '../dist/duel.mjs';
import {safeView} from '../dist/ai/knowledge.mjs';
import {createOptimalPilots} from '../dist/optimal-pilot.mjs';
import {setAiMode} from '../dist/ai/midgame-flags.mjs';

const read=f=>JSON.parse(fs.readFileSync(new URL('../dist/'+f,import.meta.url)));
const ungzip=f=>JSON.parse(gunzipSync(fs.readFileSync(new URL('../dist/'+f,import.meta.url))));
const approved=JSON.parse(fs.readFileSync(new URL('../approved.json',import.meta.url)));
const db=ungzip('cards.json.gz'),scripts=ungzip('scripts.json.gz'),pool=read('decks.json').decks;
const buildDeck=id=>{const d=pool.find(d=>d.id===id);return {...d,...d.banlistVariants['tcg-2026-10-19']}};
const suite=[[81284,'sky'],[81285,'kashtira'],[81286,'blueeyes']];
const write=(file,body)=>fs.writeFileSync(file,JSON.stringify(body,(_,x)=>typeof x==='bigint'?String(x):x,2)+'\n');
const out=process.argv[2]||'full-run';fs.mkdirSync(out,{recursive:true});
const cases=process.argv.slice(3);
const selectedCases=suite.flatMap(([seed,id])=>[0,1].map(first=>({seed,id,first})))
 .filter(({seed,first})=>!cases.length||cases.includes(seed+'-'+first));
if(cases.length)assert.equal(selectedCases.length,cases.length,'expected unique known seed-order cases');
const maxDecisions=1000,stopBeforeTurn=9,summary=[];
setAiMode('enhanced');
for(const {seed,id,first} of selectedCases){
 const decks=['branded',id].map(buildDeck);
 for(const zone of ['main','extra','side'])assert.deepEqual(decks[0][zone],approved[zone]);
 const d=await Duel.create(db,scripts),pilots=createOptimalPilots({seed,searchEnabled:false,doctrine:true}),decisions=[];
 let exception=null;const start=performance.now();
 try{
  d.start(decks,{seed,first});
  while(d.prompt&&!d.finished&&d.turn<stopBeforeTurn&&decisions.length<maxDecisions){
   const p=d.prompt,seat=p.seat,v=safeView(d,seat),plan=pilots[seat].base(v);
   assert.ok(plan?.response,'no pilot response at turn '+d.turn+' / '+p.type);
   const r=plan.response,key=p.type===M.SELECT_IDLECMD?{0:'summons',1:'special_summons',2:'pos_changes',3:'monster_sets',4:'spell_sets',5:'activates'}[r.action]:p.type===M.SELECT_CHAIN?'selects':null;
   decisions.push({turn:d.turn,active:d.active,phase:d.phase,seat,prompt:p.type,hint:d.hint,source:d.currentEffect?.code,
    actionCard:key?p[key]?.[r.index]?.code:undefined,
    pickedCards:r.indicies?.map(i=>(p.selects||p.select_cards)?.[i]?.code),
    virtuousDestroyTargets:d.currentEffect?.code===30271097&&d.hint===502?r.indicies?.map(i=>{
     const c=(p.selects||p.select_cards)?.[i];
     return c?{code:c.code,seat:d.fromEngine(c.controller),location:c.location}:null;
    }):undefined,
    chain:d.chain.map(({code,controller,solved})=>({code,controller,solved})),
    offeredChain:p.type===M.SELECT_CHAIN?p.selects.map(c=>c.code):undefined,
    policyRule:plan.book?.rule??plan.book?.kind,response:r});
   d.respond(r);
   if(d.retries||d.errors.length)break;
   pilots[seat].observe(plan);
  }
 }catch(e){exception=String(e?.stack??e)}
 const status=exception?'exception':d.errors.length?'engine-error':d.retries?'engine-retry':d.finished?'finished':d.turn>=stopBeforeTurn?'turn-boundary':decisions.length>=maxDecisions?'decision-cap':'stalled';
 const result={label:'A (full deck, bounded)',runtime:process.version,aiMode:'enhanced',searchEnabled:false,seed,opponent:id,first,brandedOrder:first===0?'first':'second',
  decks:decks.map(({name,format,main,extra,side})=>({name,format,main,extra,side})),status,
  elapsedMs:Math.round(performance.now()-start),turn:d.turn,decisionCount:decisions.length,retries:d.retries,errors:d.errors,exception,
  final:d.handle?d.snapshot(0,true):null,decisions,log:d.log};
 try{
  write(out+'/'+seed+'-'+first+'.json',result);
  const row=Object.fromEntries(Object.entries(result).filter(([k])=>!['decks','decisions','log','final'].includes(k)));
  summary.push(row);console.log(JSON.stringify(row));
 }finally{d.stop()}
}
write(out+'/summary.json',summary);
if(summary.some(x=>!['finished','turn-boundary'].includes(x.status)))process.exitCode=1;

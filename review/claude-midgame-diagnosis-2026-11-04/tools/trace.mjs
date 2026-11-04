// Dev diagnostic (Claude, 4 Nov): full-duel decision trace with board snapshots, to find "lost steam / redundant plays" after turn 3.
import fs from 'node:fs';import zlib from 'node:zlib';import path from 'node:path';import {pathToFileURL} from 'node:url';
const arg=(k,v)=>{const i=process.argv.indexOf('--'+k);return i>0?process.argv[i+1]:v};
const T=path.resolve(arg('tree','/home/claude/r36-dtw')),seed=+arg('seed'),first=+arg('first',0),A=arg('a'),B=arg('b'),dl=+arg('deadline-ms',1500),out=arg('out'),maxTurn=+arg('max-turn',14);
const imp=f=>import(pathToFileURL(path.join(T,'dist',f)).href);
const {Duel,M}=await imp('duel.mjs'),{createOptimalPilots}=await imp('optimal-pilot.mjs'),{createSearchCore}=await imp('ai/engine-snapshot.mjs');
const db=JSON.parse(zlib.gunzipSync(fs.readFileSync(T+'/dist/cards.json.gz'))),scripts=JSON.parse(zlib.gunzipSync(fs.readFileSync(T+'/dist/scripts.json.gz')));
const all=JSON.parse(fs.readFileSync(T+'/dist/decks.json')).decks.map(d=>d.banlistVariants?.['tcg-2026-10-19']?{...d,...d.banlistVariants['tcg-2026-10-19']}:d);
let deadline=Infinity;const core=await createSearchCore(db,scripts);
const pilots=createOptimalPilots({seed,nodeBudget:400,searchCore:core,worldPool:true,poolKey:'tr:'+seed,poolSize:10,seatCapBytes:40*1048576,shouldStop:()=>performance.now()>=deadline});
const d=await Duel.create(db,scripts);const t0=Date.now();
const nm=c=>c&&c.code?d.name(c.code):null;
const snap=()=>[0,1].map(s=>({lp:d.lp[s],hand:d.zone(s,2).filter(Boolean).map(nm),mon:d.zone(s,4).filter(Boolean).map(c=>nm(c)+((c.position&1)?'':'(def)')),st:d.zone(s,8).filter(Boolean).map(c=>(c.position&8)?'set':nm(c)),gy:d.zone(s,16).filter(Boolean).length,ban:d.zone(s,32).filter(Boolean).length,deck:d.zone(s,1).filter(Boolean).length,extra:d.zone(s,64).filter(Boolean).length}));
const turns=[];let cur=null,n=0,err=null;
try{d.start([all.find(x=>x.id===A),all.find(x=>x.id===B)],{seed,first});
 while(d.prompt&&!d.finished&&n<6000){
  if(!cur||cur.turn!==d.turn){if(cur){cur.after=snap();turns.push(cur);cur=null}if(d.turn>maxTurn)break;/* v2 (RELAY-105 T-D1): cur cleared before the cap break, so the final push cannot duplicate the last turn */cur={turn:d.turn,active:d.active,before:snap(),acts:[]}}
  const m=d.prompt;deadline=performance.now()+dl;const ts=performance.now();const plan=pilots[m.seat].plan(d);deadline=Infinity;if(!plan?.response)break;
  const top=[M.SELECT_IDLECMD,M.SELECT_BATTLECMD].includes(m.type)||(m.type===M.SELECT_CHAIN&&plan.response.index!=null)||[M.SELECT_EFFECTYN,M.SELECT_YESNO].includes(m.type);
  if(top)cur.acts.push({seat:m.seat,phase:d.phase,title:plan.title,rule:plan.book?.rule||plan.rule||null,kind:plan.kind||null,ms:Math.round(performance.now()-ts),opts:m.type===M.SELECT_IDLECMD?{sum:(m.summons||[]).length,ss:(m.special_summons||[]).length,act:(m.activates||[]).length,bp:!!m.to_bp}:m.type===M.SELECT_BATTLECMD?{attacks:(m.attacks||[]).map(c=>d.name(c.code)+(c.direct_attackable?'*direct':'')),oppLp:d.lp[1-m.seat]}:null});
  d.respond(plan.response);for(const p of pilots)p.observe?.(plan);n++}
 if(cur){cur.after=snap();turns.push(cur)}
}catch(e){err=String(e?.stack||e).slice(0,500)}
fs.writeFileSync(out,JSON.stringify({seed,first,decks:[A,B],deadlineMs:dl,finished:d.finished,winner:d.finished?d.winner:null,winReason:d.winReason,turn:d.turn,decisions:n,sec:Math.round((Date.now()-t0)/1000),err,turns},null,0));
console.log(out,'turns',d.turn,'winner',d.finished?d.winner:null,'sec',Math.round((Date.now()-t0)/1000));process.exit(0);

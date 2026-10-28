// r35 item 8 (Claude, 28 Oct 2026): paired tap-OFF / tap-ON probe for the deck-shuffle tap (RELAY-046 section 5, Seto
// 27 Oct proof scope). Runs ONE worker module in this Node process exactly as the browser would message it (start, then a
// presentation-done after every state, then export-replay / export), CPU vs CPU ('watch'), and prints a JSON manifest:
// response bytes sha256, duel log text sha256, final LP / winner / reason, retries / errors, and the shuffle envelopes seen.
// SCOPE: Node has no Worker, so worker.mjs takes its synchronous AI path (no AI worker, no live deadlines / caps). This is
// evidence that the data path does not change the duel; it is NOT the live browser deadline/cap comparison, which needs a
// quiet machine and a real browser (pending).
//   node tools/r35-shuffle-paired.mjs --worker dist/worker.mjs --seed 2026 --first 0 --decks branded,blueeyes [--max-states 4000]
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import {pathToFileURL} from 'node:url';
const arg=(k,v)=>{const i=process.argv.indexOf('--'+k);return i>0?process.argv[i+1]:v};
const workerPath=path.resolve(arg('worker','dist/worker.mjs')),seed=+arg('seed',2026),first=+arg('first',0),ids=arg('decks','branded,blueeyes').split(','),maxStates=+arg('max-states',4000),preset=arg('preset','instant');
const dist=path.dirname(workerPath);const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
globalThis.fetch=async url=>{const f=path.join(dist,String(url));const b=fs.readFileSync(f);return {ok:true,arrayBuffer:async()=>b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength)}};
const decksAll=JSON.parse(fs.readFileSync(path.join(dist,'decks.json'))).decks,v19=id=>{const x=decksAll.find(y=>y.id===id);return {...x,...(x.banlistVariants?.['tcg-2026-10-19']||{})}};
const t0=Date.now();let states=0,replay=null,exportText=null,errors=[],notices=[],envelopes=[],last=null,done;const finished=new Promise(r=>done=r);
globalThis.onmessage=null;
globalThis.postMessage=x=>{
 if(x.type==='state'){states++;last=x;if(states%25===0)process.stderr.write(`[paired] ${path.basename(workerPath)} seed ${seed} first ${first}: ${states} states, turn ${x.state.turn}, ${Math.round((Date.now()-t0)/1000)} s\n`);if(x.shuffle)envelopes.push({epoch:x.shuffle.epoch,n:x.shuffle.shuffles.length,dropped:x.shuffle.dropped,items:x.shuffle.shuffles.map(s=>[s.id,s.seat,s.afterEventId])});
  if(x.state.finished||x.disabled||states>=maxStates){if(!replay)setTimeout(()=>{send({type:'export-replay'});send({type:'export'})},0);return}
  setTimeout(()=>send({type:'presentation-done',eventId:x.lastEventId}),0)}
 else if(x.type==='export-replay'){replay=x.replay}
 else if(x.type==='export'){exportText=x.text;done()}
 else if(x.type==='error')errors.push(x.message);else if(x.type==='notice')notices.push(x.message)};
await import(pathToFileURL(workerPath).href);
const send=data=>globalThis.onmessage({data});
send({type:'start',decks:ids.map(v19),seed,first,view:0,mode:'watch',study:false,preset,delay:1,cinematics:false,doctrine:true,interactionProtocol:1});
await finished;
const responses=JSON.stringify(replay?.responses||[]);
const out={worker:path.relative(process.cwd(),workerPath),workerSha256:sha(fs.readFileSync(workerPath)),node:process.version,seed,first,decks:ids,preset,
 decisions:replay?.responses?.length||0,responsesSha256:sha(responses),logSha256:sha(exportText||''),finished:!!last?.state?.finished,winner:last?.state?.winner??null,winReason:last?.state?.winReason??null,
 lp:last?.state?.players?.map(p=>p.lp),turn:last?.state?.turn,states,errors,notices,
 shuffleEnvelopes:envelopes.length,shuffleEntries:envelopes.reduce((a,e)=>a+e.n,0),shuffleItems:envelopes.flatMap(e=>e.items),epochs:[...new Set(envelopes.map(e=>e.epoch))],wallMs:Date.now()-t0};
fs.writeFileSync(process.env.DUMP,JSON.stringify({responses:replay?.responses||[],log:exportText||''},null,1));console.log(JSON.stringify(out));process.exit(0);

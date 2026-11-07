// r37 our AI vs WindBot - one duel (Claude as builder, 7 Nov 2026; Kevy 21:53/21:57 AEDT). SELF-VERIFIED.
// Seat `--wb-seat` is played by the unmodified WindBot (its scripted executor for the deck) through tools/windbot/bridge.mjs;
// the other seat is played by OUR AI (OptimalPilot, the same pilots and search settings as tools/r36-h2h.mjs: search on,
// world pool, node budget 400, per-decision deadline, Enhanced or Classic recipe). Both seats use WindBot's own decklist for
// that executor (mirror match), so neither side plays a list its logic was not written for. Writes ONE JSONL row.
// Usage: node tools/windbot/match.mjs --executor SkyStriker --ydk AI_SkyStriker --wb-seat 1 --first 0 --seed 71001
//          [--mode enhanced] [--deadline-ms 1500] [--max-turn 30] [--out rows.jsonl] [--log]
//        environment: WINDBOT_DIR (built WindBot + cards.cdb + Decks), DOTNET (dotnet executable), BRIDGE_TREE (scratch dir)
import fs from 'node:fs';import zlib from 'node:zlib';import path from 'node:path';import crypto from 'node:crypto';import {fileURLToPath,pathToFileURL} from 'node:url';
import {makeBridgeTree,WindBotSeat,EdoRouter,decodeResponse,readYdk,importTree} from './bridge.mjs';
const arg=(k,v)=>{const i=process.argv.indexOf('--'+k);return i>0?process.argv[i+1]:v},flag=k=>process.argv.includes('--'+k);
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const WB=process.env.WINDBOT_DIR,DOTNET=process.env.DOTNET||'dotnet',TREE=process.env.BRIDGE_TREE;if(!WB||!TREE)throw Error('set WINDBOT_DIR and BRIDGE_TREE');
const executor=arg('executor','SkyStriker'),ydk=arg('ydk','AI_'+executor),wbSeat=+arg('wb-seat',1),first=+arg('first',0),seed=+arg('seed',71001),mode=arg('mode','enhanced'),deadlineMs=+arg('deadline-ms',1500),maxTurn=+arg('max-turn',30),out=arg('out',null);
const ourSeat=1-wbSeat,sha=b=>crypto.createHash('sha256').update(b).digest('hex'),log=flag('log')?(...a)=>console.error(...a):()=>{};
if(!fs.existsSync(path.join(TREE,'dist/core/index.js'))||flag('rebuild-tree'))makeBridgeTree(repo,TREE);
const {Duel,M}=await importTree(TREE,'duel.mjs');const {setAiMode,midgameLabel}=await importTree(TREE,'ai/midgame-flags.mjs');const {S4}=await importTree(TREE,'ai/s4-flags.mjs');
setAiMode(mode);const modeLabel=mode+' '+midgameLabel()+' S4 '+JSON.stringify({...S4});
const db=JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(TREE,'dist/cards.json.gz')))),scripts=JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(TREE,'dist/scripts.json.gz'))));
const list=readYdk(path.join(WB,'Decks',ydk+'.ydk')),deck=(name)=>({id:'wb-'+executor,name,main:[...list.main],extra:[...list.extra]});
const missing=[...list.main,...list.extra].filter(c=>!db[c]);if(missing.length)throw Error('cards not in the engine database: '+missing);
let deadline=Infinity;const shouldStop=()=>performance.now()>=deadline;
const {createOptimalPilots}=await importTree(TREE,'optimal-pilot.mjs'),{createSearchCore}=await importTree(TREE,'ai/engine-snapshot.mjs');
const pilot=createOptimalPilots({seed,nodeBudget:400,searchCore:await createSearchCore(db,scripts),worldPool:true,poolKey:'wb:'+seed+':'+ourSeat,poolSize:10,seatCapBytes:40*1048576,shouldStop})[ourSeat];
const row={tool:'r37-windbot-match',seed,first,executor,ydk,wbSeat,ourSeat,mode:modeLabel,deadlineMs,maxTurn,node:process.version,ydkSha256:sha(fs.readFileSync(path.join(WB,'Decks',ydk+'.ydk'))),
 windbotDllSha256:sha(fs.readFileSync(path.join(WB,'WindBot.dll'))),bridgeSha256:sha(fs.readFileSync(path.join(repo,'tools/windbot/bridge.mjs'))),matchSha256:sha(fs.readFileSync(fileURLToPath(import.meta.url)))};
const t0=Date.now(),wb=new WindBotSeat({windbotDir:WB,dotnet:DOTNET,executor,deckFile:ydk,log});let d=null,router=null,decisions=[0,0],wbRetries=0,end='running',err=null,wbDeck=null;
try{
 await wb.connect();d=await Duel.create(db,scripts);
 // the bot's engine team: the engine's team 0 moves first
 const W=wbSeat===first?0:1,{D}=await importTree(TREE,'core/index.js').then(m=>({D:m.OcgDuelMode}));
 const flags=D.MODE_MR5|(D.TCG_SEGOC_NONPUBLIC||0n)|(D.TCG_SEGOC_FIRSTTRIGGER||0n);
 wbDeck=await wb.lobby({duelFlags:flags,position:W});row.wbDeckMatchesYdk=JSON.stringify(wbDeck.cards)===JSON.stringify([...list.main,...list.extra]);
 globalThis.__ocgRawHook=(h,raw)=>{if(!d||h!==d.handle)return;if(!router){router=new EdoRouter(d.core,h,W,b=>wb.gameMsg(b));router.startCounts=[[list.main.length,list.extra.length],[list.main.length,list.extra.length]];
   const b=Buffer.alloc(18);b[0]=4;b[1]=W;b.writeUInt32LE(8000,2);b.writeUInt32LE(8000,6);b.writeUInt16LE(list.main.length,10);b.writeUInt16LE(list.extra.length,12);b.writeUInt16LE(list.main.length,14);b.writeUInt16LE(list.extra.length,16);router.msg(b);router.refreshLocation(0,0x381fff,64);router.refreshLocation(1,0x381fff,64);router.started=true}
  router.batch(raw)};
 const decks=[deck(wbSeat===0?'WindBot':'Our AI'),deck(wbSeat===1?'WindBot':'Our AI')];d.start(decks,{seed,first});if(d.toEngine(wbSeat)!==W)throw Error('seat mapping mismatch');
 while(d.prompt&&!d.finished){if(d.turn>maxTurn){end='turn cap';break}if(wb.closed){end='windbot disconnected';break}
  const m=d.prompt,s=m.seat;decisions[s]++;
  if(s===ourSeat){deadline=performance.now()+deadlineMs;const plan=pilot.plan(d);deadline=Infinity;if(!plan?.response){end='no response (ours)';break}const before=d.retries;d.respond(plan.response);if(d.retries===before)pilot.observe(plan)}
  else{const raw=await wb.next(1,120000),resp=decodeResponse(m.type,raw),before=d.retries;d.respond(resp);
   if(d.retries>before){wbRetries++;log('[retry] windbot response rejected',m.type,JSON.stringify(resp,(k,v)=>typeof v==='bigint'?String(v):v));if(wbRetries>5){end='windbot retries';break}if(router.lastPrompt)wb.gameMsg(router.lastPrompt)}}}
 if(end==='running')end=d.finished?(d.winReason!=null?'win reason '+d.winReason:'finished'):'stopped';
}catch(e){err=String(e?.stack||e).split('\n').slice(0,4).join(' | ');end='error';console.error('[match error] '+(e?.stack||e)+'\n[last prompt type] '+d?.prompt?.type+'\n[last raw batch] '+(()=>{const b=globalThis.__ocgLastRaw?Buffer.from(globalThis.__ocgLastRaw):null;if(!b)return 'none';const out=[];let o=0;while(o+4<=b.length){const n=b.readUInt32LE(o);out.push(b[o+4]+':'+b.subarray(o+4,o+4+n).toString('hex'));o+=4+n}return out.join(' ')})())}
finally{globalThis.__ocgRawHook=null;try{d?.stop()}catch{}await wb.close().catch(()=>{})}
Object.assign(row,{winner:d?.finished&&d.winner!=null?(d.winner===wbSeat?'windbot':'ours'):null,end,turns:d?.turn??null,lp:d?.lp??null,decisions:{ours:decisions[ourSeat],windbot:decisions[wbSeat]},
 safety:{ourRetries:(d?.retries??0)-wbRetries,wbRetries,errors:d?.errors??[],error:err},messagesToWindbot:router?.count??0,packetsFromWindbot:wb.received,wbExit:wb.exitCode??null,wallSec:Math.round((Date.now()-t0)/1000)});
const line=JSON.stringify(row);if(out)fs.appendFileSync(out,line+'\n');console.log(line);process.exit(0);

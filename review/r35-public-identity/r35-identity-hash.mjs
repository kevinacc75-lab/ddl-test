// r35 (Claude, 24 Oct): Seto L4 identity check for the public-identity fix. Plays the S2b acceptance seeds
// (2026, 12345, 808, 777, 4242, 555, 31337, 99; pairings exactly as tests/ai-gate.mjs S2b: decks branded/mikanko/sky/luna
// in decks.json order, a=0, b=[1,2,3,0][i%4], first=i%2) and the smoke set (8 decks x 7 opponents, seeds 9100+k, as
// tools/taskc-smoke.mjs), and hashes every AI response (sha1 of the JSON response list), so a build before and after
// the change can be compared. Mode "base": base AI, full duels. Mode "search": optimal-pilot search (nodeBudget 400),
// first N decisions per S2b seed. Also hashes the move events, which are EXPECTED to change.
//   node tools/r35-identity-hash.mjs <root> base|search [maxDecisions]
import fs from 'node:fs';import path from 'node:path';import zlib from 'node:zlib';import crypto from 'node:crypto';import {pathToFileURL} from 'node:url';
const [ROOT,MODE='base',MAX='1500']=process.argv.slice(2);const imp=p=>import(pathToFileURL(path.resolve(ROOT,p)).href);
const {Duel}=await imp('dist/duel.mjs'),{createOptimalPilots}=await imp('dist/optimal-pilot.mjs'),{safeView}=await imp('dist/ai/knowledge.mjs');
const db=JSON.parse(zlib.gunzipSync(fs.readFileSync(path.resolve(ROOT,'dist/cards.json.gz')))),scripts=JSON.parse(zlib.gunzipSync(fs.readFileSync(path.resolve(ROOT,'dist/scripts.json.gz'))));
const all=JSON.parse(fs.readFileSync(path.resolve(ROOT,'dist/decks.json'))).decks;
const v19=d=>d.banlistVariants?.['tcg-2026-10-19']?{...d,...d.banlistVariants['tcg-2026-10-19']}:d;
const gate=all.filter(d=>['branded','mikanko','sky','luna'].includes(d.id)),smoke=all.map(v19);
const sha=s=>crypto.createHash('sha1').update(s).digest('hex');
const searchCore=MODE==='search'?await (await imp('dist/ai/engine-snapshot.mjs')).createSearchCore(db,scripts):null;
const live=await Duel.create(db,scripts);const rows=[];
async function play(tag,decks,seed,first){
 const d=MODE==='search'?await Duel.create(db,scripts):new Duel(live.core,db,scripts);
 const pilots=MODE==='search'?createOptimalPilots({seed,budget:400,nodeBudget:400,searchCore}):createOptimalPilots({seed,searchEnabled:false});
 const responses=[];let err=null;
 try{d.start(decks,{seed,first});while(d.prompt&&!d.finished&&responses.length<+MAX){const p=pilots[d.prompt.seat],plan=MODE==='search'?p.plan(d):p.base(safeView(d,d.prompt.seat));if(!plan?.response){err='no response';break}
  responses.push(JSON.stringify(plan.response));d.respond(plan.response);if(MODE==='search')p.observe?.(plan);else p.observe(plan)}}catch(e){err=e.message}
 const moves=d.events.filter(e=>e.type==='move').map(e=>e.code+':'+e.from?.location+'>'+e.to?.location).join(',');
 const row={tag,seed,first,decks:decks.map(x=>x.id).join('-'),decisions:responses.length,finished:!!d.finished,winner:d.winner??null,err,responsesHash:sha(responses.join('\n')),moveHash:sha(moves),namedMoves:d.events.filter(e=>e.type==='move'&&e.code).length};
 try{d.stop?.()}catch{}rows.push(row);console.error(JSON.stringify(row));
}
const S2B=[2026,12345,808,777,4242,555,31337,99];
for(const [i,seed] of S2B.entries())await play('s2b',[gate[0],gate[[1,2,3,0][i%4]]],seed,i%2);
if(MODE==='base')for(const me of smoke)for(let k=0;k<smoke.length-1;k++){const opp=smoke.filter(d=>d.id!==me.id)[k];await play('smoke',[me,opp],9100+k,k%2)}
console.log(JSON.stringify({root:ROOT,mode:MODE,max:+MAX,node:process.version,duels:rows.length,all:sha(rows.map(r=>r.responsesHash).join(',')),rows}));

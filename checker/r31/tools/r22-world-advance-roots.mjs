// r22b (Claude, 21 Oct; Seto's open item 1): re-record the world-advance roots with fixed Link arrows.
// tests/late-roots-result.json was recorded when Link arrows were broken; with r22 the base-policy duel sky v sky seed
// 662599 plays differently, so its recorded decision numbers no longer land on the same seat. This replays every
// recorded duel with the same driver as world-advance.test.mjs (base policy, book off) and, for each recorded root,
// takes the first decision at or after the recorded one where the same seat faces the same prompt type.
//   node tools/r22-world-advance-roots.mjs [out=tests/fixtures/r22-world-advance-roots.json]
import fs from 'node:fs';import {gunzipSync} from 'node:zlib';
import {Duel} from '../dist/duel.mjs';import {createOptimalPilots} from '../dist/optimal-pilot.mjs';import {safeView} from '../dist/ai/knowledge.mjs';
const db=JSON.parse(gunzipSync(fs.readFileSync('dist/cards.json.gz'))),scripts=JSON.parse(gunzipSync(fs.readFileSync('dist/scripts.json.gz'))),decks=JSON.parse(fs.readFileSync('dist/decks.json')).decks;
const src=JSON.parse(fs.readFileSync(process.argv[3]||'tests/late-roots-result.json')).rows,out=process.argv[2]||'tests/fixtures/r22-world-advance-roots.json';
const live=await Duel.create(db,scripts),groups=new Map();for(const f of src){const k=`${f.seed}:${f.first}:${f.pair}`;(groups.get(k)??groups.set(k,[]).get(k)).push(f)}
const rows=[],changes=[];
for(const g of groups.values()){g.sort((a,b)=>a.decision-b.decision);const f0=g[0],d=new Duel(live.core,db,scripts);d.start(f0.pair.map(id=>decks.find(x=>x.id===id)),{seed:f0.seed,first:f0.first});
 const pilots=createOptimalPilots({seed:f0.seed,searchEnabled:false,book:false}),seen=[];let n=0;
 while(d.prompt&&!d.finished&&n<400){seen.push({n,seat:d.prompt.seat,type:d.prompt.type,turn:d.turn});const p=pilots[d.prompt.seat],plan=p.base(safeView(d,d.prompt.seat));d.respond(plan.response);p.observe(plan);n++}
 let floor=-1;for(const f of g){const hit=seen.find(s=>s.n>=f.decision&&s.n>floor&&s.seat===f.seat&&s.type===f.promptType);if(!hit){changes.push({seed:f.seed,seat:f.seat,decision:f.decision,dropped:true});continue}
  floor=hit.n;rows.push({...f,decision:hit.n,turn:hit.turn,recordedDecision:f.decision});if(hit.n!==f.decision)changes.push({seed:f.seed,pair:f.pair.join('-'),seat:f.seat,from:f.decision,to:hit.n})}
 d.stop()}
fs.writeFileSync(out,JSON.stringify({about:'world-advance roots re-recorded on r22 (fixed Link arrows/Pendulum scales) from tests/late-roots-result.json; base policy, book off',node:process.version,changes,rows},null,1)+'\n');
console.log(JSON.stringify({rows:rows.length,changes}));

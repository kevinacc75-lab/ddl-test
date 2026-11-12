import fs from 'node:fs';
import {gunzipSync} from 'node:zlib';
import assert from 'node:assert/strict';
import {Duel,M} from '../dist/duel.mjs';
import {safeView} from '../dist/ai/knowledge.mjs';
import {createOptimalPilots} from '../dist/optimal-pilot.mjs';
import {bookActivationBlock} from '../dist/ai/book/book.mjs';
import {setAiMode} from '../dist/ai/midgame-flags.mjs';
const read=f=>JSON.parse(fs.readFileSync(new URL('../dist/'+f,import.meta.url)));
const ungzip=f=>JSON.parse(gunzipSync(fs.readFileSync(new URL('../dist/'+f,import.meta.url))));
const db=ungzip('cards.json.gz'),scripts=ungzip('scripts.json.gz'),list=read('decks.json').decks;
const decks=['branded','sky'].map(id=>{const d=list.find(d=>d.id===id);return {...d,...d.banlistVariants['tcg-2026-10-19']}});
setAiMode('enhanced');
for(const first of [0,1]){
 const seed=81284,d=await Duel.create(db,scripts),pilots=createOptimalPilots({seed,searchEnabled:false,doctrine:true}),actions=[];
 try{
  d.start(decks,{seed,first});
  for(let i=0;d.prompt&&!d.finished&&d.turn<3&&i<420;i++){
   const p=d.prompt,seat=p.seat,v=safeView(d,seat),plan=pilots[seat].base(v);
   assert.ok(plan?.response,'no pilot response at turn '+d.turn+' / '+p.type);
   const r=plan.response;
   if(seat===0&&p.type===M.SELECT_IDLECMD&&[0,1,5].includes(r.action)){
    const c=p[{0:"summons",1:"special_summons",5:"activates"}[r.action]][r.index];
    actions.push({turn:d.turn,action:r.action,code:c.code,name:d.name(c.code),book:plan.book?.kind});
    if(c.code===1984618)assert.equal(bookActivationBlock(v,seat,c),null,'Nadir skipped an offered play');
   }
   d.respond(r);
   assert.equal(d.retries,0,'engine rejected a pilot response');
   pilots[seat].observe(plan);
  }
  assert.ok(d.finished||d.turn>=3,'two opening turns not completed');
  assert.deepEqual(d.errors,[]);
  console.log(JSON.stringify({first,seed,turn:d.turn,searchEnabled:false,errors:d.errors.length,retries:d.retries,actions}));
 }finally{d.stop()}
}

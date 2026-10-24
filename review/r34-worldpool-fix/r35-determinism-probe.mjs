// r35 (Claude, 24 Oct): S2b determinism probe for Seto's 808 / 4242 mismatch. Plays one S2b job exactly as the frozen
// gate's playDuel does (fresh Duel per pass, one shared search core, createOptimalPilots({seed,budget,nodeBudget,searchCore}),
// sha1 over the JSON responses) and prints the play hash per pass. --skip N first advances the world-pool duel counter by N
// (as N earlier gate duels would), so a FRESH process can reproduce gate pass k with --skip (duels before it).
//   node tools/r35-determinism-probe.mjs <root> --seed 4242 --b 3 --first 0 --passes 1 --skip 17
import fs from 'node:fs';import path from 'node:path';import zlib from 'node:zlib';import crypto from 'node:crypto';import {pathToFileURL} from 'node:url';
const ROOT=path.resolve(process.argv[2]||'.');const arg=(k,v)=>{const i=process.argv.indexOf('--'+k);return i>0?process.argv[i+1]:v};
const imp=p=>import(pathToFileURL(path.resolve(ROOT,p)).href);
const {Duel}=await imp('dist/duel.mjs'),{createOptimalPilots}=await imp('dist/optimal-pilot.mjs'),ES=await imp('dist/ai/engine-snapshot.mjs'),WP=await imp('dist/ai/world-pool.mjs');
const db=JSON.parse(zlib.gunzipSync(fs.readFileSync(path.resolve(ROOT,'dist/cards.json.gz')))),scripts=JSON.parse(zlib.gunzipSync(fs.readFileSync(path.resolve(ROOT,'dist/scripts.json.gz'))));
const decks=JSON.parse(fs.readFileSync(path.resolve(ROOT,'dist/decks.json'))).decks.filter(d=>['branded','luna','sky','mikanko'].includes(d.id));
const seed=+arg('seed',4242),a=+arg('a',0),b=+arg('b',3),first=+arg('first',0),passes=+arg('passes',1),skip=+arg('skip',0),budget=+arg('budget',400);
for(let i=0;i<skip;i++)WP.duelIdentity({});
const searchCore=await ES.createSearchCore(db,scripts);
const sha1=s=>crypto.createHash('sha1').update(s).digest('hex');
for(let pass=1;pass<=passes;pass++){
 const d=await Duel.create(db,scripts);const log=[];let decisions=0,searched=0;const t0=Date.now();
 try{d.start([decks[a],decks[b]],{seed,first});
  const pilots=[0,1].map(s=>createOptimalPilots({seed,budget,nodeBudget:budget,searchCore})[s]);let steps=0;
  while(d.prompt&&!d.finished&&steps++<2500){const p=pilots[d.prompt.seat],plan=p.plan(d);if(!plan?.response)break;log.push(JSON.stringify(plan.response));d.respond(plan.response);p.observe?.(plan);decisions++;if(plan.search&&plan.search.nodes>0)searched++;
   if(decisions%50===0)console.error('pass',pass,'decision',decisions,'turn',d.turn,'heapMB',Math.round(process.memoryUsage().heapUsed/1048576))}
 }finally{d.stop()}
 console.log(JSON.stringify({seed,pair:[decks[a].id,decks[b].id],first,pass,skip,duelKey:'duel'+(skip+pass),hash:sha1(log.join('\n')).slice(0,8),decisions,searched,sec:Math.round((Date.now()-t0)/1000),node:process.version}));
}

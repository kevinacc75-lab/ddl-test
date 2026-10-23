// r35 (Claude, 24 Oct): Seto seed-808 question. Plays seed 808 (Branded v Lunalight, Branded first) twice in one process with one search core, as the gate does, and prints snapshot bytes held on the core before each search: pass 2 starts with pass 1 pools still counted against the 80 MB cap.
// Does search state survive between two duels in one process? (Seto's seed-808 question)
import fs from 'node:fs';import path from 'node:path';import zlib from 'node:zlib';import {pathToFileURL} from 'node:url';
const ROOT=process.argv[2];const imp=p=>import(pathToFileURL(path.resolve(ROOT,p)).href);
const {Duel}=await imp('dist/duel.mjs'),{createOptimalPilots}=await imp('dist/optimal-pilot.mjs');const ES=await imp('dist/ai/engine-snapshot.mjs');const WP=await imp('dist/ai/world-pool.mjs');
const db=JSON.parse(zlib.gunzipSync(fs.readFileSync(path.resolve(ROOT,'dist/cards.json.gz')))),scripts=JSON.parse(zlib.gunzipSync(fs.readFileSync(path.resolve(ROOT,'dist/scripts.json.gz'))));
const decks=JSON.parse(fs.readFileSync(path.resolve(ROOT,'dist/decks.json'))).decks.filter(d=>['branded','mikanko','sky','luna'].includes(d.id));
const core=await ES.createSearchCore(db,scripts);
async function run(tag,n){const d=await Duel.create(db,scripts);d.start([decks[0],decks[3]],{seed:808,first:0});const pilots=createOptimalPilots({seed:808,budget:400,nodeBudget:400,searchCore:core});const out=[];
 for(let i=0;i<n&&d.prompt&&!d.finished;i++){const before=ES.snapshotBytesHeld(core);const p=pilots[d.prompt.seat],plan=p.plan(d);out.push(JSON.stringify(plan.response));
  if(i<3||plan.search?.nodes)console.log(tag,'decision',i,'seat',d.prompt.seat,'bytesHeldBefore',before,'pools',WP.poolStats?.()??'');d.respond(plan.response);p.observe?.(plan);if(plan.search?.nodes&&i>8)break}
 console.log(tag,'end bytesHeld',ES.snapshotBytesHeld(core));d.stop();return out}
await run('run1',60);await run('run2',60);

// r22b (Claude, 21 Oct; Seto's open item 3): the Kaiju Battle Phase stall. With an effect that forces attacks on the
// field (repro: taskc smoke kashtira v sky, seed 9107), the Battle prompt offers neither Main Phase 2 nor End Phase; the
// pilot used to answer "end turn", the engine refused it and the duel looped. The pilot now makes an offered attack.
import assert from 'node:assert/strict';import fs from 'node:fs';import zlib from 'node:zlib';
import {Duel} from '../dist/duel.mjs';import {createOptimalPilots} from '../dist/optimal-pilot.mjs';import {safeView} from '../dist/ai/knowledge.mjs';import {OcgMessageType as M} from '../dist/core/index.js';
const db=JSON.parse(zlib.gunzipSync(fs.readFileSync('dist/cards.json.gz'))),scripts=JSON.parse(zlib.gunzipSync(fs.readFileSync('dist/scripts.json.gz')));
const all=JSON.parse(fs.readFileSync('dist/decks.json')).decks.map(d=>d.banlistVariants?.['tcg-2026-10-19']?{...d,...d.banlistVariants['tcg-2026-10-19']}:d);
const live=await Duel.create(db,scripts),out=[];
for(const [deck,opp,seed,first] of [['kashtira','sky',9107,1],['kashtira','mikanko',9106,0],['kashtira','luna',9108,0],['kashtira','sky',9119,1],['mikanko','kashtira',9115,1],['luna','kashtira',9115,1]]){
 const d=new Duel(live.core,db,scripts),pilots=createOptimalPilots({seed,searchEnabled:false});d.start([all.find(x=>x.id===deck),all.find(x=>x.id===opp)],{seed,first});let n=0,forced=0;
 while(d.prompt&&!d.finished&&n<1500){const m=d.prompt;if(m.type===M.SELECT_BATTLECMD&&!m.to_m2&&!m.to_ep)forced++;const p=pilots[m.seat],plan=p.base(safeView(d,m.seat));d.respond(plan.response);p.observe(plan);n++;assert.ok(d.retries<=5,`${deck} v ${opp} seed ${seed}: engine retries at decision ${n} (${plan.rule})`)}
 assert.ok(d.finished,`${deck} v ${opp} seed ${seed} finishes`);out.push({deck,opp,seed,forcedPrompts:forced,decisions:n});d.stop()}
assert.ok(out.some(x=>x.forcedPrompts>0),'at least one duel reaches a Battle prompt with no way out but attacking');
console.log(JSON.stringify({test:'r22b-forced-battle',pass:true,node:process.version,duels:out}));

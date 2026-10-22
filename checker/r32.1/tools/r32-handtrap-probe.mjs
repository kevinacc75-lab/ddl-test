// r32 hand-trap probe (Claude, 22 Oct; Kevy item 3: "Smarter hand traps on your turn ... Ash Blossom on the key search
// rather than the first thing you see, Nibiru after the fifth summon, Imperm on the starter").
// Seeded CPU-v-CPU duels; logs every chain window on the NON-active player's side where a hand trap was offered: what was
// on the chain, whether the AI used the hand trap, and on what. Usage:
//   node tools/r32-handtrap-probe.mjs --seeds 16 --start 1 --turns 3 [--handtrap-rule on|off] [--search on --deadline-ms N] [--decks branded,luna,...] [--out f.json]
import fs from 'node:fs';import zlib from 'node:zlib';
import {Duel,M} from '../dist/duel.mjs';import {createOptimalPilots} from '../dist/optimal-pilot.mjs';import {createSearchCore} from '../dist/ai/engine-snapshot.mjs';import {dropAllPools} from '../dist/ai/world-pool.mjs';import {HANDTRAP} from '../dist/ai/book/book.mjs';
const arg=(k,v)=>{const i=process.argv.indexOf('--'+k);return i>0?process.argv[i+1]:v};
HANDTRAP.on=arg('handtrap-rule','on')!=='off';
const N=+arg('seeds',16),start=+arg('start',1),maxTurn=+arg('turns',3),search=arg('search','off')==='on',deadlineMs=+arg('deadline-ms',1500),LIST=arg('list','tcg-2026-10-19');
const db=JSON.parse(zlib.gunzipSync(fs.readFileSync('dist/cards.json.gz'))),scripts=JSON.parse(zlib.gunzipSync(fs.readFileSync('dist/scripts.json.gz')));
const decks=JSON.parse(fs.readFileSync('dist/decks.json')).decks.map(x=>{const v=x.banlistVariants?.[LIST];return v?{...x,...v}:x});
const ids=arg('decks',decks.map(x=>x.id).join(',')).split(',');
export const HT=/^(Ash Blossom & Joyous Spring|Infinite Impermanence|Effect Veiler|Ghost Belle & Haunted Mansion|Ghost Ogre & Snow Rabbit|Nibiru, the Primal Being|Mulcharmy Fuwalos|Mulcharmy Purulia|Droll & Lock Bird|Forbidden Droplet|Maxx "C"|Bystial Saronir|Bystial Magnamhut|Bystial Druiswurm|Called by the Grave|Crossout Designator|D\.D\. Crow|Dimension Shifter|Triple Tactics Thrust|Ghost Mourner & Moonlit Chill)$/;
const d=await Duel.create(db,scripts),searchCore=search?await createSearchCore(db,scripts):null;let deadline=Infinity;const shouldStop=()=>performance.now()>=deadline;
const nm=c=>c?d.name(c.code):'?';const rows=[],ends=[];const t0=Date.now();
for(let k=0;k<N;k++){const seed=start+k,a=ids[k%ids.length],b=ids[(k*3+1)%ids.length]===a?ids[(k*3+2)%ids.length]:ids[(k*3+1)%ids.length],first=k%2;
 const pilots=createOptimalPilots({seed,searchEnabled:search,nodeBudget:400,searchCore,worldPool:search,poolKey:'ht:'+seed,poolSize:10,seatCapBytes:40*1048576,shouldStop});
 d.start([decks.find(x=>x.id===a),decks.find(x=>x.id===b)],{seed,first});let n=0;const summons=[0,0];let lastTurn=-1;
 while(d.prompt&&!d.finished&&n<2500&&d.turn<=maxTurn){const p=d.prompt,s=p.seat;if(d.turn!==lastTurn){lastTurn=d.turn;summons[0]=summons[1]=0}
  const logBefore=d.log.length;deadline=search?performance.now()+deadlineMs:Infinity;const plan=pilots[s].plan(d);deadline=Infinity;if(!plan)break;
  if(p.type===M.SELECT_CHAIN&&s!==d.active){const offered=(p.selects||[]).map((c,i)=>({i,name:nm(c),loc:c.location})).filter(x=>HT.test(x.name));
   if(offered.length){const top=d.chain?.at?.(-1);const r=plan.response;
    rows.push({seed,deck:d.decks[s].id,opp:d.decks[1-s].id,turn:d.turn,phase:d.phase,offered:offered.map(x=>x.name),used:r.index!=null?nm(p.selects[r.index]):null,
     chainTop:top?{card:d.name(top.code),own:top.controller===s}:null,oppHand:d.zone(1-s,2).filter(Boolean).length,oppMonsters:d.zone(1-s,4).filter(Boolean).map(nm),rule:plan.rule||plan.book?.rule||'',searched:!!plan.search?.nodes})}}
  d.respond(plan.response);for(const x of pilots)x.observe?.(plan);n++}
 ends.push({seed,first:d.decks[first].id,second:d.decks[1-first].id,firstBoard:d.zone(first,4).filter(Boolean).map(nm),firstBackrow:d.zone(first,8).filter(Boolean).length,secondHand:d.zone(1-first,2).filter(Boolean).map(nm)});
 d.stop();if(search)dropAllPools();process.stderr.write(`seed ${seed} ${a} v ${b} done (${Math.round((Date.now()-t0)/1000)}s)\n`)}
const out=arg('out',null),json=JSON.stringify({handtrapRule:HANDTRAP.on,search,node:process.version,rows,ends},null,1);if(out)fs.writeFileSync(out,json);else console.log(json);

// r27 deck audit (Claude, 22 Oct; Kevy: "review the AI that is playing the decks to ensure they are actually playing the
// deck optimally"). Seeded CPU-v-CPU duels for one deck; records that deck's own turns move by move (what it summoned,
// activated, set, attacked, chose) and the board / hand / GY at the end of each of its turns, so a person can judge the
// lines. --search on uses the live AI search with the browser deadline (slow).
// Usage: node tools/r27-deck-audit.mjs --deck luna --seeds 10 --start 1 --order first|second|alternate --own-turns 1
//        [--opps sky,branded,...] [--search on] [--list tcg-2026-10-19] [--out file.json]
import fs from 'node:fs';import zlib from 'node:zlib';
import {Duel,M} from '../dist/duel.mjs';import {createOptimalPilots,boardScore} from '../dist/optimal-pilot.mjs';import {goalScore} from '../dist/ai/goal-boards.mjs';import {createSearchCore} from '../dist/ai/engine-snapshot.mjs';import {dropAllPools} from '../dist/ai/world-pool.mjs';
const arg=(k,v)=>{const i=process.argv.indexOf('--'+k);return i>0?process.argv[i+1]:v};
const DECK=arg('deck','luna'),N=+arg('seeds',10),start=+arg('start',1),search=arg('search','off')==='on',deadlineMs=+arg('deadline-ms',1500),order=arg('order','first'),ownTurnsMax=+arg('own-turns',1),LIST=arg('list','tcg-2026-10-19');
const db=JSON.parse(zlib.gunzipSync(fs.readFileSync('dist/cards.json.gz'))),scripts=JSON.parse(zlib.gunzipSync(fs.readFileSync('dist/scripts.json.gz')));
const decks=JSON.parse(fs.readFileSync('dist/decks.json')).decks.map(x=>{const v=x.banlistVariants?.[LIST];return v?{...x,...v}:x});
const opps=arg('opps',decks.map(x=>x.id).filter(x=>x!==DECK).join(',')).split(',');
const d=await Duel.create(db,scripts),searchCore=search?await createSearchCore(db,scripts):null;let deadline=Infinity;const shouldStop=()=>performance.now()>=deadline;
const T=Object.fromEntries(Object.entries(M).map(([k,v])=>[v,k])),nm=c=>c?d.name(c.code):'?';
const KEYS={0:'summon',1:'special',2:'reposition',3:'set monster',4:'set S/T',5:'activate',6:'to BP',7:'to EP'};
function describe(p,r){
 if(p.type===M.SELECT_IDLECMD){const key={0:'summons',1:'special_summons',2:'repos',3:'monster_sets',4:'spell_sets',5:'activates'}[r.action];if(key&&r.index!=null)return KEYS[r.action]+': '+nm(p[key]?.[r.index]);return r.action===6?'→ Battle Phase':r.action===7?'→ End Phase':JSON.stringify(r)}
 if(p.type===M.SELECT_BATTLECMD){if(r.action===1)return 'attack with '+nm(p.attacks?.[r.index]);if(r.action===0)return 'activate (BP): '+nm(p.activates?.[r.index]);return r.action===2?'→ Main Phase 2':'→ End Phase'}
 if(p.type===M.SELECT_CHAIN)return r.index==null?null:'chain: '+nm(p.selects?.[r.index]);
 if(p.type===M.SELECT_EFFECTYN||p.type===M.SELECT_YESNO)return r.yes?null:'declined optional effect ('+(d.name(d.currentEffect?.code||0)||'?')+')';
 if(p.type===M.SELECT_CARD||p.type===M.SELECT_TRIBUTE)return '  pick ['+(d.name(d.currentEffect?.code||0)||'')+' h'+d.hint+']: '+(r.indicies||[]).map(i=>nm((p.selects||p.select_cards||[])[i])).join(', ');
 if(p.type===M.SELECT_UNSELECT_CARD)return r.index==null?null:'  pick ['+(d.name(d.currentEffect?.code||0)||'')+' h'+d.hint+']: '+nm((p.selects||p.select_cards||[])[r.index]);
 if(p.type===M.SELECT_OPTION)return '  option '+r.index+' ('+(d.name(d.currentEffect?.code||0)||'')+')';
 if(p.type===M.SELECT_POSITION||p.type===M.SELECT_PLACE||p.type===M.SELECT_DISFIELD)return null;
 return '  '+(T[p.type]||p.type)+' '+JSON.stringify(r).slice(0,60)}
const zone=(s,l)=>d.zone(s,l).filter(Boolean);
const board=s=>({monsters:zone(s,4).map(c=>nm(c)+((c.position&5)?'':' (set)')+((c.position&4)?' DEF':'')),backrow:zone(s,8).filter(c=>c.sequence<5).map(c=>((c.position&5)?'':'set:')+nm(c)),field:zone(s,8).filter(c=>c.sequence===5).map(nm),hand:zone(s,2).map(nm),gy:zone(s,16).map(nm),banished:zone(s,32).length,lp:d.state?.players?.[s]?.lp??d.lp?.[s]});
// r29 experiment: board score that also values interruptions held for the opponent's turn (Quick Effects on board,
// set Spells/Traps, hand traps in hand), the way competitive players judge an end board.
const HT=/Ash Blossom|Infinite Impermanence|Mulcharmy|Nibiru|Forbidden Droplet|Ghost Belle|Effect Veiler|Maxx|Ghost Ogre|Droll|Bystial/;
function scoreInterrupts(dd,seat){let v=boardScore(dd,seat),k=0;for(const c of dd.zone(seat,4).filter(Boolean))if((c.position&5)&&/Quick Effect|during either player's turn|during your opponent's turn/i.test(dd.db[c.code]?.desc||''))k++;
 for(const c of dd.zone(seat,8).filter(Boolean))if(c.sequence<5&&!(c.position&5))k++;for(const c of dd.zone(seat,2).filter(Boolean))if(HT.test(dd.name(c.code)))k++;return v+300*k}
// r32: --record-prefix DIR saves the responses up to the start of our first turn; --replay-prefix DIR replays them
// (the opponent's turn-1 board is then identical across variants and is not re-planned, which is the slow part).
// r32: --best-picks off removes the 'preferBest' picks (Kaiju / Super Polymerization targets) for an A/B run.
if(arg('best-picks','on')==='off'){const {BOOKS}=await import('../dist/ai/book/book.mjs');for(const b of Object.values(BOOKS))b.picks=b.picks.filter(p=>!p.preferBest)}
const recDir=arg('record-prefix',null),repDir=arg('replay-prefix',null);if(recDir)fs.mkdirSync(recDir,{recursive:true});
const out=[];const t0=Date.now();
for(let k=0;k<N;k++){const seed=start+k,opp=opps[k%opps.length],first=order==='first'?0:order==='second'?1:k%2?1:0;
 const pilots=createOptimalPilots({seed,searchEnabled:search,nodeBudget:+arg('node-budget',400),searchCore,worldPool:search,poolKey:'audit:'+DECK+':'+seed,poolSize:10,seatCapBytes:40*1048576,shouldStop});
 {const o={};if(arg('turn-horizon','off')==='on')o.turnHorizon=true;if(arg('eval','base')==='interrupts')o.evaluate=scoreInterrupts;if(arg('eval','base')==='goal')o.evaluate=(dd,seat)=>boardScore(dd,seat)+goalScore(dd,seat);if(Object.keys(o).length)for(const p of pilots)p.searchTestOptions=o}{const bt=arg('book-trust','default');if(bt!=='default')for(const p of pilots)p.bookTrust=bt==='on'}/* r29 experiments */
 d.start([decks.find(x=>x.id===DECK),decks.find(x=>x.id===opp)],{seed,first});
 const pf=repDir&&repDir+'/'+DECK+'-'+order+'-'+seed+'-'+opp+'.json',prefix=pf&&fs.existsSync(pf)?JSON.parse(fs.readFileSync(pf)):null;
 const row={deck:DECK,opp,seed,first:first===0,hand:zone(0,2).map(nm),turns:[]};let cur=null,n=0,ownTurns=0;
 const close=()=>{if(cur){cur.end=board(0);cur.oppEnd=board(1);row.turns.push(cur);cur=null;ownTurns++}};
 while(d.prompt&&!d.finished&&n<2500){
  if(d.active===0&&(!cur||cur.turn!==d.turn)){close();if(ownTurns>=ownTurnsMax)break;cur={turn:d.turn,startHand:zone(0,2).map(nm),oppStart:board(1),moves:[]};if(recDir&&ownTurns===0&&!prefix)fs.writeFileSync(recDir+'/'+DECK+'-'+order+'-'+seed+'-'+opp+'.json',JSON.stringify(d.responseHistory))}
  if(d.active!==0&&cur)close();if(ownTurns>=ownTurnsMax)break;
  if(prefix&&n<prefix.length){d.respond(prefix[n]);n++;continue}/* r32: replay the recorded opening (opponent's turn 1) instead of re-planning it */
  const p=d.prompt,s=p.seat;deadline=search?performance.now()+deadlineMs:Infinity;const ex0=new Set(pilots[0].excluded.keys());const plan=pilots[s].plan(d);deadline=Infinity;if(!plan)break;
  if(s===0)for(const [k,why] of pilots[0].excluded)if(!ex0.has(k)){const [,key,i]=k.split(':');(row.excluded||=[]).push('t'+d.turn+' '+nm(p[key]?.[+i])+' ('+key+'): '+why)}
  if(s===0&&cur){const txt=describe(p,plan.response);if(txt)cur.moves.push(txt+(plan.book?.rule?'   ['+plan.book.rule+']':''))}
  if(s===0&&!cur&&p.type===M.SELECT_CHAIN&&plan.response.index!=null)(row.oppTurnResponses||=[]).push('t'+d.turn+' chain: '+nm(p.selects[plan.response.index]));
  d.respond(plan.response);for(const x of pilots)x.observe?.(plan);n++}
 close();row.guards=(pilots[0].blocks||[]).filter(b=>b.seat===0).map(b=>'t'+b.turn+': '+b.reason);row.finished=d.finished;row.winner=d.finished?d.winner:null;out.push(row);d.stop();if(search)dropAllPools();
 process.stderr.write(`${DECK} seed ${seed} vs ${opp} done (${Math.round((Date.now()-t0)/1000)}s)\n`)}
const file=arg('out',null);const json=JSON.stringify({deck:DECK,list:LIST,search,order,node:process.version,rows:out},null,1);if(file)fs.writeFileSync(file,json);else console.log(json);

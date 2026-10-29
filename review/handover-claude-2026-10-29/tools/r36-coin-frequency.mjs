// Dev-only: how often does a Time Typhoon AI duel actually toss a coin or roll dice? Dev seeds only.
import fs from 'node:fs';import zlib from 'node:zlib';import path from 'node:path';import {pathToFileURL} from 'node:url';
const T='/home/claude/r36-dtw',arg=(k,v)=>{const i=process.argv.indexOf('--'+k);return i>0?process.argv[i+1]:v};
const seed=+arg('seed'),first=+arg('first',0),A=arg('a','dtw'),B=arg('b','branded'),dl=+arg('deadline-ms',1500),out=arg('out');
const imp=f=>import(pathToFileURL(path.join(T,'dist',f)).href);
const {Duel,M}=await imp('duel.mjs'),{CoinTap}=await imp('coin-tap.mjs'),{createOptimalPilots}=await imp('optimal-pilot.mjs'),{createSearchCore}=await imp('ai/engine-snapshot.mjs');
const db=JSON.parse(zlib.gunzipSync(fs.readFileSync(T+'/dist/cards.json.gz'))),scripts=JSON.parse(zlib.gunzipSync(fs.readFileSync(T+'/dist/scripts.json.gz')));
const all=JSON.parse(fs.readFileSync(T+'/dist/decks.json')).decks.map(d=>d.banlistVariants?.['tcg-2026-10-19']?{...d,...d.banlistVariants['tcg-2026-10-19']}:d);
let deadline=Infinity;const core=await createSearchCore(db,scripts);
const pilots=createOptimalPilots({seed,nodeBudget:400,searchCore:core,worldPool:true,poolKey:'cf:'+seed,poolSize:10,seatCapBytes:40*1048576,shouldStop:()=>performance.now()>=deadline});
const d=await Duel.create(db,scripts);const tap=new CoinTap({coinType:M.TOSS_COIN,diceType:M.TOSS_DICE,optionType:M.SELECT_OPTION});tap.install(d);
const dtwSeat=A==='dtw'?0:1,tosses=[],rules=[],held=[];let n=0;const t0=Date.now();
d.start([all.find(x=>x.id===A),all.find(x=>x.id===B)],{seed,first});tap.arm();
const hand=s=>d.zone(s,2).filter(Boolean).map(c=>d.name(c.code)),sq=s=>d.zone(s,8).filter(Boolean).map(c=>c.code?d.name(c.code):'?');
let lastTurn=0;
while(d.prompt&&!d.finished&&n<5000&&d.turn<=30){
 if(d.turn!==lastTurn){lastTurn=d.turn;const h=hand(dtwSeat),dtwH=h.filter(x=>x==='Dark Time Wizard').length,dice=h.filter(x=>x==='Graceful & Skull Dice').length,setDtw=d.zone(dtwSeat,8).filter(c=>c&&c.code===40235813).length;held.push({turn:d.turn,active:d.active,dtwInHand:dtwH,diceInHand:dice,dtwSet:setDtw,oppFaceUpMonsters:d.zone(1-dtwSeat,4).filter(c=>c&&(c.position&5)).length})}
 const m=d.prompt;deadline=performance.now()+dl;const plan=pilots[m.seat].plan(d);deadline=Infinity;if(!plan?.response)break;
 const rule=plan.book?.rule||plan.rule||'';if(m.seat===dtwSeat&&/Dark Time Wizard|Dice|coin/i.test(rule+' '+(plan.book?.reason||'')))rules.push({turn:d.turn,rule:rule.slice(0,140)});
 d.respond(plan.response);for(const p of pilots)p.observe?.(plan);n++;
 const dr=tap.drain();for(const t of dr.tosses)tosses.push({turn:d.turn,kind:t.kind,results:t.results,call:t.call,code:t.code})}
const row={seed,first,decks:[A,B],winner:d.finished?d.winner:null,turns:d.turn,tosses,dtwRules:rules,perTurn:held,sec:Math.round((Date.now()-t0)/1000)};
fs.appendFileSync(out,JSON.stringify(row)+'\n');console.log(seed,first,'tosses',tosses.length,'turns',d.turn,'sec',row.sec);d.stop();process.exit(0);

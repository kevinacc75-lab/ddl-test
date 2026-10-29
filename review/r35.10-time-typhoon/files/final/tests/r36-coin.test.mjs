// r36 coin toss / dice roll cutscene (Claude, 29 Oct 2026; Kevy 14:29). SELF-VERIFIED (builder = verifier), NOT independent.
//  1 CoinTap on the real engine: Dark Time Wizard's coin gives ONE coin entry with the engine's result, the call read from
//    the duel's own response to the "call it" prompt (options 60 Heads / 61 Tails), the resolving card and the event it
//    followed; right call (seed 16) and wrong call (seed 11) both reported correctly.
//  2 The tap changes nothing: the same duel with and without the tap gives the same responses, log and result.
//  3 Graceful & Skull Dice gives ONE dice entry with two results 1..6, and its effect text agrees with them.
//  4 Disarmed / reset taps capture nothing; drain empties; a second duel object is refused.
//  5 coinBatches: each toss is placed after the event it followed and before later events (so the coin lands before the
//    destruction it causes); tosses in the same gap stay in order; tossLine wording.
import assert from 'node:assert/strict';
import {engine,stopEngine,scenario,drive,labels,M,field,gy} from '../tools/s3-harness.mjs';
import {CoinTap} from '../dist/coin-tap.mjs';
import {coinBatches,tossLine,tossWon,COIN_MS} from '../dist/coin-cutscene.mjs';
await engine();
const DTW='Dark Time Wizard',auto=d=>{const m=d.prompt;if(m.type===M.SELECT_PLACE||m.type===M.SELECT_POSITION){d.respond(d.choices()[0].response);return true}return false};
const newTap=()=>new CoinTap({coinType:M.TOSS_COIN,diceType:M.TOSS_DICE,optionType:M.SELECT_OPTION});
function coinDuel(seed,withTap,callIndex=0){
 const d=scenario(['dtw','dtw'],[{name:DTW,location:2,owner:0},{name:'Swiftwind Panther Warrior',location:4,owner:0},{name:'K9-17 Izuna',location:4,owner:1}],{first:0,seed});
 const tap=withTap?newTap():null;if(tap){tap.install(d);tap.arm()}
 let callSeen=null;
 const r=drive(d,{steps:{0:['Activate · '+DTW,'Toss a coin']},onPrompt:dd=>{if(auto(dd))return true;const m=dd.prompt;
   if(m.type===M.SELECT_OPTION&&(m.options||[]).map(Number).join()==='60,61'){callSeen=true;dd.respond(dd.choices()[callIndex].response);return true}return false},
  until:dd=>dd.prompt.type===M.SELECT_IDLECMD&&gy(dd,0).some(c=>dd.name(c.code)===DTW)});
 assert.ok(r.stopped,'coin duel resolved');assert.equal(callSeen,true,'the engine asked for a call with options 60/61');
 const out={tap:tap?.drain(),responses:JSON.stringify(d.responseHistory),log:d.log.map(x=>x.text).join('\n'),lp:[...d.lp],theirs:field(d,1).length,ours:field(d,0).length,eventSeq:d.eventSeq};d.stop();return out}
// 1 + 2
const results={};
for(const [seed,callIndex] of [[16,0],[11,0],[16,1]]){
 const a=coinDuel(seed,true,callIndex),b=coinDuel(seed,false,callIndex);
 assert.equal(a.tap.tosses.length,1,'one toss captured');const t=a.tap.tosses[0];
 assert.equal(t.kind,'coin');assert.equal(t.seat,0);assert.equal(t.code,40235813,'the resolving card is Dark Time Wizard');
 assert.equal(t.call,callIndex===0?'heads':'tails','the call is read from the duel response');
 assert.equal(t.results.length,1);assert.equal(typeof t.results[0],'boolean');
 const right=tossWon(t);assert.equal(right,a.theirs===0,'right call <=> their monster destroyed (the engine decided; the tap only reports it)');
 assert.ok(t.afterEventId>0&&t.afterEventId<a.eventSeq,'the toss sits between events');
 assert.equal(a.responses,b.responses,'same responses with and without the tap');assert.equal(a.log,b.log,'same log with and without the tap');assert.deepEqual(a.lp,b.lp,'same LP');
 results[seed+'/'+callIndex]={toss:t,line:tossLine(t,DTW)}}
assert.notEqual(results['16/0'].toss.results[0],results['11/0'].toss.results[0],'the two seeds give different coin results (heads vs tails), so both branches are covered');
// 3 dice
{const d=scenario(['dtw','dtw'],[{name:'Graceful & Skull Dice',location:2,owner:0},{name:'Swiftwind Panther Warrior',location:4,owner:0},{name:'K9-17 Izuna',location:4,owner:1}],{first:0,seed:11});
 const tap=newTap();tap.install(d);tap.arm();const atk0=field(d,1)[0].attack;
 const r=drive(d,{steps:{0:['Activate · Graceful & Skull Dice']},onPrompt:auto,until:dd=>dd.prompt.type===M.SELECT_IDLECMD&&gy(dd,0).some(c=>dd.name(c.code)==='Graceful & Skull Dice')});
 assert.ok(r.stopped,'dice resolved');const out=tap.drain();assert.equal(out.tosses.length,1,'one dice entry (two dice in one roll)');const t=out.tosses[0];
 assert.equal(t.kind,'dice');assert.equal(t.results.length,2);assert.ok(t.results.every(v=>v>=1&&v<=6));assert.equal(t.call,null);assert.equal(t.code,76630812);
 const total=t.results[0]+t.results[1],atk1=field(d,1)[0].attack;assert.equal(atk0-atk1,total*200,'their monster lost (total x 200) ATK, matching the captured dice');
 results.dice={toss:t,atk:[atk0,atk1],line:tossLine(t,'Graceful & Skull Dice')};d.stop()}
// 4
{const d=scenario(['dtw','dtw'],[{name:DTW,location:2,owner:0},{name:'Swiftwind Panther Warrior',location:4,owner:0},{name:'K9-17 Izuna',location:4,owner:1}],{first:0,seed:16});
 const tap=newTap();tap.install(d);/* not armed */
 drive(d,{steps:{0:['Activate · '+DTW,'Toss a coin','Choose an available effect']},onPrompt:auto,until:dd=>dd.prompt.type===M.SELECT_IDLECMD&&gy(dd,0).some(c=>dd.name(c.code)===DTW)});
 assert.equal(tap.drain().tosses.length,0,'a disarmed tap captures nothing');assert.throws(()=>tap.install({handleMessage(){}}),/one duel/,'bound to one duel');
 tap.arm();tap.reset();assert.equal(tap.armed,false,'reset disarms');assert.equal(tap.drain().epoch,1,'reset starts a new epoch');d.stop()}
// 4b the card shown is the RESOLVING link, not the top of the chain list (browser run 29 Oct: Ash Blossom CL3 had already
//    resolved while Dark Time Wizard CL2 tossed the coin, and the scene named Ash Blossom)
{const tap=newTap(),fake={responseHistory:[],eventSeq:9,resolvingChain:2,fromEngine:p=>p,chain:[{chain_size:1,code:77482666},{chain_size:2,code:40235813},{chain_size:3,code:14558127,solved:true}],handleMessage(){}};
 tap.install(fake);tap.arm();fake.handleMessage({type:M.TOSS_COIN,player:0,results:[true]});
 assert.equal(tap.drain().tosses[0].code,40235813,'the resolving link (Dark Time Wizard), not the resolved Ash Blossom on top')}
// 5
{const ev=(id,type='move')=>({id,type});
 const batches=[{events:[ev(5,'activate')]},{events:[ev(6,'resolve'),ev(7,'move')]},{events:[ev(8,'move')]}];
 const t1={id:1,kind:'coin',seat:0,results:[true],call:'heads',code:40235813,afterEventId:6},t2={id:2,kind:'dice',seat:0,results:[3,4],call:null,code:76630812,afterEventId:6};
 const out=coinBatches(batches,[t2,t1],'duel');
 const kinds=out.map(b=>b.events[0].type==='coinToss'?'toss'+b.events[0].toss.id:b.events[0].id);
 assert.deepEqual(kinds,[5,'toss1','toss2',6,8],'tosses after event 5 and before the batch holding event 7 (a later event), in toss order');
 assert.equal(out[1].duration,COIN_MS.duel);
 assert.deepEqual(coinBatches(batches,[{...t1,afterEventId:99}],'learning').map(b=>b.events[0].type).at(-1),'coinToss','a toss after every event goes last');
 assert.equal(coinBatches(batches,[],'duel'),batches,'no tosses: unchanged');
 assert.equal(tossLine({kind:'coin',results:[false],call:'heads'},'Dark Time Wizard'),'Dark Time Wizard · Coin: Tails (called Heads · wrong call)');
 assert.equal(tossLine({kind:'dice',results:[3,4]},'Graceful & Skull Dice'),'Graceful & Skull Dice · Dice: 3 + 4 = 7')}
stopEngine();
console.log(JSON.stringify({test:'r36-coin',pass:true,node:process.version,results}));

// r48 (Claude as lead/builder, 12 Nov 2026; Kevy approved 10:58 AEDT). SELF-VERIFIED until reviewed.
//  A. Concession in replays (ChatGPT RELAY-142): real engine duel, concede, export record, reopen -> same finished result.
//  B. Play comfort pure rules (play-comfort.mjs): auto-place choice, chain pass, gold-aura list.
//  C. S1 position rule (windbot-port.mjs wbPosition) and its switch.
import assert from 'node:assert/strict';import {test} from 'node:test';import fs from 'node:fs';
import {loadBuild,scenario,answer,code,LOC} from './lib/engine-scenario.mjs';
import {applyConcede,concedeRecord,validConcede,restoreConcede,CONCEDE_REASON} from '../dist/concede-record.mjs';
import {pickPlace,chainPass,playable,prefs} from '../dist/play-comfort.mjs';
import {wbPosition} from '../dist/ai/book/windbot-port.mjs';import {R46,setR46} from '../dist/ai/r46-flags.mjs';
const build=await loadBuild(true),{M,R}=build;
const WOLF=code('Gene-Warped Warwolf'),pack=id=>({id,name:'Deck '+id,main:Array(40).fill(WOLF),extra:[]});
const fresh=()=>scenario(build,{decks:[pack('A'),pack('B')],first:0,seed:14221,place:[]});
const advance=(d,n)=>{for(let i=0;i<n&&d.prompt&&!d.finished;i++)d.respond(answer(build,d))};
for(const seat of [0,1])for(const prefix of [0,3])test(`(R48-A1) seat ${seat} concedes after ${prefix} responses: the exported record reopens as the same finished duel`,()=>{
 const d=fresh();advance(d,prefix);const n=d.responseHistory.length;assert.equal(n>=prefix?true:false,true);
 assert.equal(applyConcede(d,seat),true);assert.equal(d.finished,true);assert.equal(d.winner,1-seat);assert.equal(d.winReason,CONCEDE_REASON);assert.equal(d.prompt,null);
 const file=JSON.parse(JSON.stringify({responses:d.responseHistory,concede:concedeRecord(seat,n)},(k,v)=>typeof v==='bigint'?Number(v):v));
 assert.equal(file.responses.length,n,'the concession is not an engine response');assert.deepEqual(file.concede,{seat,afterResponses:n});
 const e=fresh();for(const r of d.responseHistory)e.respond(r);assert.equal(e.finished,false,'without the record the reopened duel is unfinished (the r47 defect)');
 const kept=restoreConcede(e,file.concede,file.responses.length);assert.deepEqual(kept,{seat,afterResponses:n});
 assert.equal(e.finished,true);assert.equal(e.winner,1-seat);assert.equal(e.winReason,16);assert.equal(e.retries,0)});
test('(R48-A2) duplicate, stale and malformed concessions are rejected and change nothing',()=>{
 const d=fresh();advance(d,2);const n=d.responseHistory.length;
 assert.equal(applyConcede(d,2),false);assert.equal(d.finished,false);
 for(const bad of [{seat:0,afterResponses:n+1},{seat:0,afterResponses:n-1},{seat:2,afterResponses:n},{seat:0},[0,n],'x',{seat:'0',afterResponses:n}]){assert.equal(validConcede(bad,n),false);assert.throws(()=>restoreConcede(d,bad,n),/concession rejected/);assert.equal(d.finished,false)}
 assert.equal(restoreConcede(d,null,n),null);assert.equal(restoreConcede(d,undefined,n),null);
 assert.equal(applyConcede(d,1),true);const w=d.winner,log=d.log?.length;assert.equal(applyConcede(d,0),false,'a second concession does nothing');assert.equal(d.winner,w);assert.equal(d.log?.length,log);
 assert.throws(()=>restoreConcede(d,{seat:0,afterResponses:n},n),/concession rejected/,'a concession on an already finished duel is stale')});
test('(R48-A3) the worker and page carry the record on every replay path; non-Play concede is still refused',()=>{
 const w=fs.readFileSync('dist/worker.mjs','utf8'),a=fs.readFileSync('dist/app.mjs','utf8');
 assert.match(w,/x\.type==='concede'\)\{[^]*?mode==='play'&&\(view===0\|\|view===1\)\)\{[^]*?applyConcede\(duel,view\)\)concession=concedeRecord\(view,duel\.responseHistory\.length\)/);
 assert.match(w,/\.\.\.\(concession&&duel\.finished&&duel\.winReason===16\?\{concede:concession\}:\{\}\)/,'export');
 assert.match(w,/concession=restoreConcede\(duel,x\.concede,x\.responses\.length\)/,'start with saved responses');
 assert.match(w,/concession=restoreConcede\(duel,r\.concede,r\.responses\.length\)/,'import-replay');
 assert.match(w,/const c=concession;concession=null;if\(c&&index>=c\.afterResponses&&duel\.responseHistory\.length===c\.afterResponses&&applyConcede\(duel,c\.seat\)\)concession=c/,'rewind');
 assert.match(w,/dealHand=!!x\.dealHand;replayHistory=\[\];concession=null;/,'a new duel starts with no concession');
 assert.match(a,/concede:importedResponses\?importedConcede:null/);assert.match(a,/validConcede\(importedConcede,r\.responses\.length\)/)});
const place=(player,location,sequence)=>({response:{type:R.SELECT_PLACE,places:[{player,location,sequence}]}});
test('(R48-B1) auto-place picks only a single zone on our own field: Extra Monster Zone first, then the centre outwards',()=>{
 const p={type:M.SELECT_PLACE,count:1,player:0};
 assert.equal(pickPlace(p,[0,1,2,3,4].map(s=>place(0,4,s)),M).response.places[0].sequence,2);
 assert.equal(pickPlace(p,[0,4,5,6].map(s=>place(0,4,s)),M).response.places[0].sequence,5);
 assert.equal(pickPlace(p,[0,4].map(s=>place(0,8,s)),M).response.places[0].sequence,0);
 assert.equal(pickPlace({...p,player:1},[1,3].map(s=>place(1,4,s)),M).response.places[0].sequence,1,'engine player index, not seat');
 assert.equal(pickPlace(p,[place(0,4,2),place(1,4,2)],M),null,'a zone on the opponent\'s field: ask');
 assert.equal(pickPlace({...p,count:2},[place(0,4,1),place(0,4,2)],M),null,'two zones: ask');
 assert.equal(pickPlace({...p,type:M.SELECT_DISFIELD},[place(0,4,1)],M),null,'choosing a zone to disable: ask');
 assert.equal(pickPlace(p,[],M),null);assert.equal(prefs.autoPlace,true,'default ON (Kevy)');assert.equal(prefs.chain,'auto','default Auto (Kevy)')});
test('(R48-B2) chain pass: only optional windows that offer a card; Auto shows the button, Pass modes answer; mandatory always asks',()=>{
 const pass={response:{type:R.SELECT_CHAIN,index:null}},card={response:{type:R.SELECT_CHAIN,index:0}},p={type:M.SELECT_CHAIN,forced:false,selects:[{code:1}]};
 assert.deepEqual(chainPass(p,[card,pass],'auto',M,R),{pass,auto:false});assert.equal(chainPass(p,[card,pass],'turn',M,R).auto,true);assert.equal(chainPass(p,[card,pass],'off',M,R).auto,true);
 assert.equal(chainPass({...p,forced:true},[card],'off',M,R),null,'mandatory');assert.equal(chainPass({...p,selects:[]},[pass],'off',M,R),null,'nothing to chain: left to the existing empty-window skip');
 assert.equal(chainPass(p,[card],'off',M,R),null,'no pass offered');assert.equal(chainPass({type:M.SELECT_IDLECMD},[pass],'off',M,R),null)});
test('(R48-B3) gold aura lists exactly the cards the engine offers to Summon, Set, activate or attack with',()=>{
 const c=(location,sequence,code=1)=>({controller:0,location,sequence,code});
 const got=playable({type:M.SELECT_IDLECMD,summons:[c(2,0)],special_summons:[c(64,3)],monster_sets:[c(2,0)],spell_sets:[c(2,1)],activates:[c(8,2),c(2,1)],repositions:[c(4,4)]},M).map(x=>x.location+':'+x.sequence).sort();
 assert.deepEqual(got,['2:0','2:1','64:3','8:2']);
 assert.deepEqual(playable({type:M.SELECT_BATTLECMD,attacks:[c(4,1)],activates:[]},M).map(x=>x.sequence),[1]);assert.deepEqual(playable({type:M.SELECT_CHAIN,selects:[c(2,0)]},M),[])});
test('(R48-C) S1: on the opponent\'s turn a small or out-classed Special Summon takes Defense; our turn, big bodies, battle-text monsters and the switch are unchanged',()=>{
 setR46({on:true,posGuard:true});const RAYE=code('Sky Striker Ace - Raye'),MJ=code('Mirrorjade the Iceblade Dragon'),BEWD=code('Blue-Eyes White Dragon'),OHIME=code('Ohime the Manifested Mikanko');
 const d=(active,foes)=>({active,db:build.live?.db||JSON.parse('{}'),name:c=>dbn[c]?.name||'',zone:(p,l)=>p===1?foes:[]});
 const dbn=Object.fromEntries([RAYE,MJ,BEWD,OHIME].map(c=>[c,scenarioDb(c)]));function scenarioDb(c){return fresh().db[c]}
 const view=(active,foes)=>({...d(active,foes),db:dbn}),m=c=>({type:M.SELECT_POSITION,code:c,positions:5}),atk={type:R.SELECT_POSITION,position:1};
 const mj=[{code:MJ,position:1,attack:3000}];
 assert.equal(wbPosition(view(1,mj),0,m(RAYE),atk,M,R).response.position,4,'Raye (1500) under Mirrorjade on their turn');
 assert.equal(wbPosition(view(1,[]),0,m(RAYE),atk,M,R).response.position,4,'1500 ATK on their turn, empty board');
 assert.equal(wbPosition(view(1,mj),0,m(BEWD),atk,M,R).response.position,4,'3000 under an equal 3000');
 assert.equal(wbPosition(view(1,[]),0,m(BEWD),atk,M,R),null,'3000 ATK, nothing bigger: stays Attack');
 assert.equal(wbPosition(view(0,mj),0,m(RAYE),atk,M,R),null,'our own turn: unchanged');
 assert.equal(wbPosition(view(1,mj),0,m(OHIME),atk,M,R),null,'battle-text monster: unchanged');
 assert.equal(wbPosition(view(1,mj),0,{...m(RAYE),positions:1},atk,M,R),null,'Defense not legal');
 assert.equal(wbPosition(view(1,mj),0,m(RAYE),{type:R.SELECT_POSITION,position:4},M,R),null,'already Defense');
 setR46({posGuard:false});assert.equal(wbPosition(view(1,mj),0,m(RAYE),atk,M,R),null,'switch off = r47');setR46({posGuard:true});assert.equal(R46.posGuard,true)});

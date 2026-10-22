// r32 (Claude, 22 Oct): fixes for ChatGPT's independent r31 review (REPLY - ChatGPT - independent r31 review, F1–F6).
// SELF-VERIFIED (builder = verifier), NOT independent; ChatGPT's native fixtures (tools/r32-native-fixtures/) re-run too.
//  F1 HERO: the Destroyer Phoenix Enforcer hold covers only its Quick Effect on the field, never its GY revival trigger.
//  F2 Branded: The Fallen & The Virtuous is not held when an Ecclesia monster is on our field or in our GY, and with no
//     face-up opposing card its revival mode is chosen.
//  F3 Duel's +1 s on a big decision is added after the normal step timer, whatever the thinking time.
//  F4 A preset change mid-decision recomputes the pending hold (Instant / Broadcast: none).
//  F5 createOptimalPilots forwards bookTrust:false.
//  F6 The player-facing reason for a trusted book step no longer says search compares it.
import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
import {M,R} from '../dist/duel.mjs';import {bookActivationBlock,optionPick} from '../dist/ai/book/book.mjs';import {createOptimalPilots} from '../dist/optimal-pilot.mjs';
const DPE=60461804,NAMES={[DPE]:'Destiny HERO - Destroyer Phoenix Enforcer',2:'The Fallen & The Virtuous',3:'Incredible Ecclesia, the Virtuous',4:'Blazing Cartesia, the Virtuous',5:'Ecclesia, the Exiled'};
const fake=({id='hero',own=[],gy=[],opp=[]}={})=>({decks:[{id},{id:'branded'}],active:0,turn:1,phase:4,chain:[],db:{[DPE]:{type:0x61},3:{type:0x21},4:{type:0x21},5:{type:0x21}},name:c=>NAMES[c]||String(c),description:x=>String(x),fromEngine:s=>s,
 zone:(s,l)=>s===0?(l===4?own.map(code=>({code,location:4,position:1})):l===16?gy.map(code=>({code,location:16,position:1})):[]):(l===4?opp.map(code=>({code,location:4,position:1})):[])});
// F1
assert.match(bookActivationBlock(fake(),0,{code:DPE,location:4})||'',/Book hold/,'Quick Effect on the field with no opposing card: held');
assert.equal(bookActivationBlock(fake(),0,{code:DPE,location:16}),null,'GY revival trigger: never held');
// F2
const fv={code:2,location:2};
assert.match(bookActivationBlock(fake({id:'branded'}),0,fv)||'',/Book hold/,'no opposing card and no Ecclesia: held (it would destroy our own card)');
assert.equal(bookActivationBlock(fake({id:'branded',gy:[3]}),0,fv),null,'Incredible Ecclesia in our GY: revival mode live, not held');
assert.equal(bookActivationBlock(fake({id:'branded',gy:[5]}),0,fv),null,'any Ecclesia monster counts');
assert.equal(bookActivationBlock(fake({id:'branded',own:[3]}),0,fv),null,'Ecclesia on our field');
{const d={...fake({id:'branded',gy:[3]}),currentEffect:{code:2},description:v=>['Destroy 1 face-up card on the field','Special Summon 1 monster from either GY'][v]};
 assert.equal(optionPick(d,0,{type:M.SELECT_OPTION,options:[0,1]})?.index,1,'no face-up opposing card: revive');
 const d2={...d,zone:(s,l)=>s===1&&l===4?[{code:4,location:4,position:1}]:d.zone(s,l)};assert.equal(optionPick(d2,0,{type:M.SELECT_OPTION,options:[0,1]}),null,'an opposing card: the base policy decides')}
// F5
assert.deepEqual(createOptimalPilots({seed:1,bookTrust:false}).map(p=>p.bookTrust),[false,false],'factory forwards bookTrust:false');
assert.deepEqual(createOptimalPilots({seed:1}).map(p=>p.bookTrust),[true,true],'default stays on');
// F6
const src=fs.readFileSync('dist/optimal-pilot.mjs','utf8');assert.ok(src.includes("' Played as written from the combo book.'"),'trusted steps say so');
// F3 / F4 (worker in a VM, the same way ChatGPT's review probe drives it)
function timing({switchTo=null,compute=1500}={}){let now=1000+compute,scheduled=[];
 const w=fs.readFileSync('dist/worker.mjs','utf8').replace(/^import .*;\s*$/gm,'').replace(/export /g,'');
 const ctx=vm.createContext({HumanResponseBridge:class{},WorkerPauseOwners:class{},ChainDirector:class{},Date:{now:()=>now},M,postMessage(){},setTimeout:(f,ms)=>{scheduled.push(ms);return 1},clearTimeout(){},safeView:()=>({choices:()=>[1,2]})});
 vm.runInContext(w,ctx);
 vm.runInContext("duel={revision:1,prompt:{type:M.SELECT_IDLECMD,seat:0},finished:false};mode='watch';paused=false;disabled=false;presentationPending=false;presentationUntil=0;presentationDoneAt=1000;preset='duel';delay=75;plan={revision:1};thinking=null;humanPending={revision:1,started:1000,ms:1000,add:true,dueAt:null,cls:'big'};",ctx);
 if(switchTo){vm.runInContext("preset='learning';delay=1;humanPending={revision:1,started:1000,ms:6000,add:false,dueAt:null,cls:'big'};",ctx);vm.runInContext("onmessage({data:{type:'cinematics',preset:'"+switchTo+"',value:false}})",ctx)}
 vm.runInContext('schedule()',ctx);return scheduled.at(-1)}
assert.equal(timing(),1075,'Duel big decision after 1.5 s of thinking: 75 ms step + 1000 ms added');
assert.equal(timing({compute:0}),1075,'the same with no thinking time');
assert.ok(timing({switchTo:'instant'})<=1,'Learning hold dropped when switching to Instant');
assert.ok(timing({switchTo:'broadcast'})<=1,'and to Broadcast');
assert.equal(timing({switchTo:'duel'}),1001,'switching to Duel: its own +1 s on a big decision');
// r32.1 (Kevy's recording 22 Oct 22:26 at 3:36): never Link away a boss for a non-boss Link.
{const {linkBossBlock,bookSpecialBlock}=await import('../dist/ai/book/book.mjs');const {isPayoff}=await import('../dist/optimal-pilot.mjs');
 const N={10:'Lunalight Liger Dancer',11:'Lunalight Perfume Dancer',12:'Knightmare Phoenix',13:'Lunalight Kaleido Chick'};
 const dd=own=>({db:{10:{type:0x41},11:{type:0x41},12:{type:0x4000021,level:2},13:{type:0x21}},name:c=>N[c],decks:[{id:'luna'},{id:'branded'}],zone:(s,l)=>s===0&&l===4?own.map(code=>({code,position:1})):[]});
 assert.match(linkBossBlock(dd([10,11]),0,{code:12},isPayoff)||'',/Keep Lunalight Liger Dancer/,'Liger Dancer + Perfume Dancer: no Knightmare Phoenix');
 assert.match(bookSpecialBlock(dd([10,11]),0,{code:12},isPayoff)||'',/Keep/,'part of the Special Summon holds (binds search too)');
 assert.equal(linkBossBlock(dd([10,11,13]),0,{code:12},isPayoff),null,'two non-boss monsters can be the materials');
 assert.equal(linkBossBlock(dd([11,13]),0,{code:12},isPayoff),null,'no boss on the field: no hold');}
// r32.1 (Kevy's recording 22 Oct 22:53): a live draw spell is played instead of ending the turn, for every deck.
{const {passiveCheck}=await import('../dist/ai/book/book.mjs');const N={30:'Upstart Goblin',31:'Ash Blossom & Joyous Spring'};
 const d={active:0,phase:4,turn:1,decks:[{id:'sky'},{id:'luna'}],order:[0,1],db:{30:{type:2},31:{type:0x21}},name:c=>N[c],attempts:new Map(),key:()=>'k',zone:(s,l)=>s===0&&l===2?[{code:30,location:2},{code:31,location:2}]:[]};
 const m={type:M.SELECT_IDLECMD,activates:[{code:30,location:2}],summons:[],special_summons:[]};
 const r=passiveCheck(d,0,m,{type:R.SELECT_IDLECMD,action:7,index:null},()=>false);assert.equal(r?.live?.card,'Upstart Goblin','ending the turn with Upstart Goblin live is passive: play it')}
console.log(JSON.stringify({test:'r32-review-fixes',pass:true,node:process.version,selfVerified:true}));

// r47 (Claude as builder, 11 Nov 2026; Kevy approved 17:18 AEDT; ChatGPT RELAY-140 findings). SELF-VERIFIED until reviewed.
// Behavioural regressions on the REAL engine for the two r46 WindBot-port rules RELAY-140 blocked:
//  W12 (attack guard) blocked Ohime the Manifested Mikanko (0 ATK, reflects battle damage) attacking Blue-Eyes White Dragon,
//      and Scareclaw Kashtira attacking from Defense Position (its DEF is applied) into Aluber.
//  W1  (own-chain guard) blocked our own Forbidden Droplet chained to our own Branded Fusion against their face-up Lubellion.
// Each case: the engine offers the play, the r47 rule lets it through, the play is executed and the engine result checked;
// with the r47 flag OFF (= the r46 rule) the same call blocks it, so each test fails on r46.
// The guards r46 added are kept: hopeless attacks and answer-type hand traps on our own chain are still blocked.
import assert from 'node:assert/strict';import {test} from 'node:test';
import {loadBuild,scenario,answer,code,LOC,POS,seat as seatOf} from './lib/engine-scenario.mjs';
import {R46,setR46} from '../dist/ai/r46-flags.mjs';
import {wbAttackBlock,wbActivationBlock,wbBattleValue} from '../dist/ai/book/windbot-port.mjs';
import {safeView} from '../dist/ai/knowledge.mjs';
const build=await loadBuild(true),{M,R}=build;
const WOLF=code('Gene-Warped Warwolf'),OHIME=code('Ohime the Manifested Mikanko'),BEWD=code('Blue-Eyes White Dragon'),SCARE=code('Scareclaw Kashtira'),ALUBER=code('Aluber the Jester of Despia'),
 FUSION=code('Branded Fusion'),DROPLET=code('Forbidden Droplet'),ALBAZ=code('Fallen of Albaz'),TITAN=code('Titaniklad the Ash Dragon'),LUB=code('Lubellion the Searing Dragon'),ASH=code('Ash Blossom & Joyous Spring'),IMPERM=code('Infinite Impermanence');
const pack=(id,main,extra=[])=>({id,name:id,main:[...main,...Array(40-main.length).fill(WOLF)],extra});
const reset=()=>setR46({on:true,attackGuard:true,ownChainGuard:true,w1Proactive:true,w12Battle:true});
// Opponent (seat 1) goes first and passes; we reach our turn-2 Battle Phase with the placed boards.
function battle({mine,theirs,seed}){const d=scenario(build,{decks:[pack('t0',[mine.code]),pack('t1',[theirs.code])],first:1,seed,place:[{p:0,code:mine.code,location:LOC.MZONE,sequence:2,position:mine.position},{p:1,code:theirs.code,location:LOC.MZONE,sequence:2,position:theirs.position||POS.ATK}]});
 for(let i=0;i<200&&d.prompt&&!d.finished;i++){const m=d.prompt,s=seatOf(m);
  if(m.type===M.SELECT_BATTLECMD&&s===0)return d;
  if(m.type===M.SELECT_IDLECMD){const c=d.choices(),go=s===0?c.find(o=>/Battle/i.test(o.label)):null;d.respond((go||c.find(o=>/End/i.test(o.label))).response);continue}
  if(m.type===M.SELECT_BATTLECMD){d.respond(d.choices().find(o=>/End|Main Phase 2/i.test(o.label)).response);continue}
  d.respond(answer(build,d))}
 throw Error('no Battle Phase prompt for seat 0')}
function attackThrough(d){const m=d.prompt,i=0,before=d.retries;assert.ok(m.attacks?.length>0,'the engine offers the attack');const atk=m.attacks[i];
 d.respond({type:R.SELECT_BATTLECMD,action:1,index:i});
 for(let n=0;n<60&&d.prompt&&!d.finished&&!(d.prompt.type===M.SELECT_BATTLECMD&&seatOf(d.prompt)===0);n++)d.respond(answer(build,d,{pick:(p,c)=>p.type===M.SELECT_CARD?{type:R.SELECT_CARD,indicies:[0]}:null}));
 assert.equal(d.retries,before,'no rejected response');assert.equal(d.errors.length,0,'no engine error');return atk}
test('(R47-W12a) Ohime the Manifested Mikanko (0 ATK) attacks Blue-Eyes: 3000 reflected, Ohime stays; r46 rule blocked it (fails on r46)',()=>{reset();
 const d=battle({mine:{code:OHIME,position:POS.ATK},theirs:{code:BEWD},seed:14019}),view=safeView(d,0),c=d.prompt.attacks[0];
 assert.equal(d.name(c.code),'Ohime the Manifested Mikanko');assert.equal(wbAttackBlock(view,0,c),null,'r47: not blocked');
 setR46({w12Battle:false});assert.match(wbAttackBlock(view,0,c)||'',/W12/,'the r46 rule blocks it');reset();
 attackThrough(d);assert.deepEqual(d.lp,[8000,5000],'opponent takes the 3000');assert.ok(d.zone(0,LOC.MZONE).some(x=>x?.code===OHIME),'Ohime is still on the field')});
test('(R47-W12b) Scareclaw Kashtira attacks from Defense Position with 2600 DEF into Aluber (1800): 800 damage; r46 rule blocked it (fails on r46)',()=>{reset();
 const d=battle({mine:{code:SCARE,position:POS.DEF},theirs:{code:ALUBER},seed:14019}),view=safeView(d,0),c=d.prompt.attacks[0];
 const mine=view.zone(0,LOC.MZONE).find(x=>x?.code===SCARE);assert.equal(wbBattleValue(view,mine),2600,'battle value = DEF in Defense Position');
 assert.equal(wbAttackBlock(view,0,c),null,'r47: not blocked');
 setR46({w12Battle:false});assert.match(wbAttackBlock(view,0,c)||'',/W12/,'the r46 rule blocks it');reset();
 attackThrough(d);assert.deepEqual(d.lp,[8000,7200]);assert.ok(d.zone(0,LOC.MZONE).some(x=>x?.code===SCARE));assert.ok(!d.zone(1,LOC.MZONE).some(x=>x?.code===ALUBER),'Aluber destroyed')});
test('(R47-W12c) the guard r46 added is kept: Aluber (1800) into Blue-Eyes (3000) is still held back; a 3000 vs 3000 trade is left to the policy',()=>{reset();
 const d=battle({mine:{code:ALUBER,position:POS.ATK},theirs:{code:BEWD},seed:14019}),view=safeView(d,0);
 assert.match(wbAttackBlock(view,0,d.prompt.attacks[0])||'',/W12 .*1800 ATK/);
 const e=battle({mine:{code:BEWD,position:POS.ATK},theirs:{code:BEWD},seed:14019}),ev=safeView(e,0);
 assert.equal(wbAttackBlock(ev,0,e.prompt.attacks[0]),null,'equal ATK into Attack Position: a legal trade, not blocked');
 setR46({w12Battle:false});assert.match(wbAttackBlock(ev,0,e.prompt.attacks[0])||'',/W12/,'r46 blocked the trade');reset();
 const w=battle({mine:{code:WOLF,position:POS.ATK},theirs:{code:BEWD,position:POS.DEF},seed:14019}),wv=safeView(w,0);
 assert.match(wbAttackBlock(wv,0,w.prompt.attacks[0])||'',/W12/,'2000 ATK into a 2500 DEF wall: still blocked');
 setR46({attackGuard:false});assert.equal(wbAttackBlock(view,0,d.prompt.attacks[0]),null,'switch off = r45');reset()});
// W1: our Branded Fusion is on the chain; the engine offers our own Forbidden Droplet (hand) against their face-up Lubellion.
function ownChain({hand,theirMonster,seed=14021}){const d=scenario(build,{decks:[pack('t0',[FUSION,hand,WOLF,ALBAZ,BEWD],[TITAN]),pack('t1',theirMonster?[]:[],theirMonster?[theirMonster]:[])],first:0,seed,
  place:[{p:0,code:FUSION,location:LOC.HAND},{p:0,code:hand,location:LOC.HAND},{p:0,code:WOLF,location:LOC.HAND},...(theirMonster?[{p:1,code:theirMonster,location:LOC.MZONE,sequence:2,position:POS.ATK}]:[])]});
 for(let i=0;i<60&&d.prompt&&!(d.prompt.type===M.SELECT_IDLECMD&&seatOf(d.prompt)===0);i++)d.respond(answer(build,d));
 const act=d.choices().find(o=>o.code===FUSION&&/Activate/i.test(o.label||''))||d.choices().find(o=>o.code===FUSION);assert.ok(act,'Branded Fusion can be activated');d.respond(act.response);
 for(let i=0;i<20&&d.prompt&&!(d.prompt.type===M.SELECT_CHAIN&&seatOf(d.prompt)===0);i++)d.respond(answer(build,d));
 assert.equal(d.prompt?.type,M.SELECT_CHAIN,'we get a chain window on our own Branded Fusion');return d}
test('(R47-W1a) our Forbidden Droplet chained to our own Branded Fusion against their face-up Lubellion is allowed; r46 rule blocked it (fails on r46)',()=>{reset();
 const d=ownChain({hand:DROPLET,theirMonster:LUB}),c=(d.prompt.selects||[]).find(x=>x.code===DROPLET);assert.ok(c,'the engine offers Forbidden Droplet from our hand');
 const view=safeView(d,0);assert.equal(wbActivationBlock(view,0,c),null,'r47: not blocked');
 setR46({w1Proactive:false});assert.match(wbActivationBlock(view,0,c)||'',/W1/,'the r46 rule blocks it');reset()});
test('(R47-W1b) the safeguard is kept: an answer-type hand trap is never chained to our own link, and a monster negate is still held with no face-up Effect Monster to use it on',()=>{reset();
 const view=safeView(ownChain({hand:DROPLET,theirMonster:LUB}),0);
 assert.match(wbActivationBlock(view,0,{code:ASH,location:LOC.HAND,controller:0})||'',/W1/,'Ash Blossom on our own Branded Fusion: blocked (it would negate our own card)');
 const bare=safeView(ownChain({hand:IMPERM,theirMonster:null}),0);
 assert.match(wbActivationBlock(bare,0,{code:IMPERM,location:LOC.HAND,controller:0})||'',/W1/,'Impermanence with no opposing face-up Effect Monster: still blocked');
 const vanilla=safeView(ownChain({hand:DROPLET,theirMonster:BEWD}),0);
 assert.match(wbActivationBlock(vanilla,0,{code:DROPLET,location:LOC.HAND,controller:0})||'',/W1/,'only a Normal Monster opposite: still blocked');
 setR46({ownChainGuard:false});assert.equal(wbActivationBlock(view,0,{code:ASH,location:LOC.HAND,controller:0}),null,'switch off = r45');reset()});
test('(R47-FLAGS) the r47 switches ship ON and the r46 switches are unchanged',()=>{reset();assert.equal(R46.w1Proactive,true);assert.equal(R46.w12Battle,true);assert.equal(R46.attackGuard,true);assert.equal(R46.ownChainGuard,true)});

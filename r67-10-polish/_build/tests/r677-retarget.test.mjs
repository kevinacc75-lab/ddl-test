// r67.7 (Claude): battle-retarget adapter v2 acceptance, ChatGPT RELAY-246 contract scenarios P1-K2 (RELAY-254 R3: all of them
// before release). Native cases replay the retained 11001/11002 duels (RELAY-243 exports, r67.5 lists they were recorded with).
// Synthetic cases drive armReplayToken/replayRetarget directly with small hand-built states and the real battleOutcome model.
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {armReplayToken,replayRetarget,attackProof} from '../dist/ai/battle-retarget.mjs';import {battleOutcome} from '../dist/tactics.mjs';import {M,R} from '../dist/duel.mjs';
const q=f=>{const l=console.log,w=console.warn;console.log=()=>{};console.warn=()=>{};try{return f()}finally{console.log=l;console.warn=w}};
async function native(file){const {loadBuild,db,scripts}=await import('./lib/engine-scenario.mjs');const {createOptimalPilots}=await import('../dist/optimal-pilot.mjs');const {safeView}=await import('../dist/ai/knowledge.mjs');
 const build=await loadBuild(true),{Duel}=build;const rp=JSON.parse(fs.readFileSync('tests/fixtures/'+file));const d=new Duel(build.live.core,db,scripts);q(()=>d.start(rp.decks,{seed:rp.seed,first:rp.first}));
 return {d,rp,db,M:build.M,P:createOptimalPilots({seed:rp.seed,searchEnabled:false}),P2:createOptimalPilots({seed:rp.seed,searchEnabled:true}),safeView}}
// Replay to the Yes/No (bound-1), let the pilot answer it (arms the token), feed the RECORDED Yes, then ask the pilot.
async function nativeTarget(file,bound){const n=await native(file),{d,rp,P,P2,safeView}=n;q(()=>{for(let i=0;i<bound-1;i++)d.respond(rp.responses[i])});
 const seat=d.prompt.seat;P[seat].retargetLog=[];P2[seat].retargetLog=[];let yes;q(()=>{yes=P[seat].base(safeView(d,seat));P2[seat].base(safeView(d,seat))});
 q(()=>d.respond(rp.responses[bound-1]));let base,plan;q(()=>{base=P[seat].base(safeView(d,seat));plan=P2[seat].plan(d)});return {...n,seat,yes,base,plan}}

test('(R67.7-P1) native 11001 i248: after the accepted replay Yes the final dispatch picks the current 0-DEF Maiden; no fixed index',async()=>{
 const {d,db,seat,yes,base,P,rp}=await nativeTarget('r677-replay-11001.json',248);
 assert.deepEqual(yes.response,{type:R.SELECT_YESNO,yes:true});assert.deepEqual(rp.responses[248],{type:5,indicies:[3]},'recorded: Ultimate Spirit Dragon');
 const names=d.prompt.selects.map(c=>db[c.code].name),pick=base.response.indicies[0];
 assert.equal(names[pick],'Maiden of White');assert.equal(names[3],'Blue-Eyes Ultimate Spirit Dragon');
 assert.equal(P[seat].retargetLog.at(-1).attacker,'Guiding Quem, the Virtuous');d.stop();
});
test('(R67.7-P2) native 11002 i398: swapped native player mapping (app seat 0, engine player 1); correct current index',async()=>{
 const {d,db,seat,base,P}=await nativeTarget('r677-replay-11002.json',398);
 assert.equal(seat,0);assert.equal(d.prompt.player,1,'engine player differs from app seat');
 assert.equal(db[d.prompt.selects[base.response.indicies[0]].code].name,'Maiden of White');assert.equal(P[seat].retargetLog.at(-1).attacker,'Fallen of the White Dragon');d.stop();
});
test('(R67.7-K2) later routes cannot overwrite it: plan() with search enabled returns the same current pick',async()=>{
 for(const [f,b] of [['r677-replay-11001.json',248],['r677-replay-11002.json',398]]){const {d,db,base,plan}=await nativeTarget(f,b);
  assert.deepEqual(plan.response,base.response,f);assert.equal(db[d.prompt.selects[plan.response.indicies[0]].code].name,'Maiden of White',f);d.stop()}
});
test('(R67.7-K1) the rest of 11001 is untouched: across every Branded attack target (incl. the good turn-7 attacks) the adapter acts only at i248',async()=>{
 const {d,rp,P,safeView,M:MM}=await native('r677-replay-11001.json');const seat=rp.decks.findIndex(x=>x.id==='branded');P[seat].retargetLog=[];const hits=[],t7=[];
 q(()=>{for(let i=0;i<rp.responses.length&&d.prompt&&!d.finished;i++){const m=d.prompt;
  if(m.seat===seat){const before=P[seat].retargetLog.length;const r=P[seat].base(safeView(d,seat));if(m.type===MM.SELECT_CARD&&d.hint===549){if(d.turn===7)t7.push(i);if(P[seat].retargetLog.slice(before).some(e=>e.at==='target'))hits.push(i)}}
  d.respond(rp.responses[i])}});
 assert.ok(t7.length>=1,'turn-7 attack targets exist');assert.deepEqual(hits,[248],'only the replay target');d.stop();
});

/* ---------- synthetic states (app seat 0 attacks; engine player == app seat here, fromEngine = identity) ---------- */
const DB={500:{name:'Plain Attacker',desc:'A monster.'},600:{name:'Wall',desc:'A monster.'},601:{name:'Zero Def',desc:'A monster.'},602:{name:'Floater',desc:'If this card is destroyed by battle: Special Summon 1 monster from your GY.'},
 603:{name:'Booster',desc:'During damage calculation: this card gains 1000 ATK.'},604:{name:'Ohime the Manifested Mikanko',desc:'Cannot be destroyed by battle, also your opponent takes any battle damage you would have taken from battles involving this card.'},
 605:{name:'Piercer',desc:'If this card attacks a Defense Position monster, inflict piercing battle damage.'},606:{name:'Sturdy',desc:'Cannot be destroyed by battle.'},607:{name:'Timing',desc:'If this card is Summoned (except during the Damage Step): draw 1.'}};
function S({attacker=500,attackerPos=1,atk=1800,targets=[[600,4,0,4000],[601,4,0,0]],events,hist=[{type:9},{type:R.SELECT_YESNO,yes:true}],phase=8,turn=3,handle=1,chain=[],prompt}={}){
 const mine=[null,null,{code:attacker,position:attackerPos,attack:atk,sequence:2,controller:0,location:4},null,null];
 const theirs=targets.map(([code,pos,a,def],i)=>({code,position:pos,attack:a,defense:def,sequence:i,controller:1,location:4}));
 const ev=events??[{id:10,type:'phase',phase:8},{id:11,type:'attack',code:attacker,from:{controller:0,location:4,sequence:2},to:{controller:1,location:4,sequence:1}},{id:12,type:'activate',chain:1,code:601,player:1},{id:13,type:'summon',code:600,player:1,sequence:0,special:true},{id:14,type:'chainEnd'}];
 const d={db:DB,handle,responseHistory:hist,events:ev,phase,turn,chain,fromEngine:c=>c,zone:(p,l)=>l===4?(p===0?mine:theirs):[],
  prompt:prompt??{type:M.SELECT_CARD,seat:0,player:0,min:1,max:1,selects:theirs.map(c=>({code:c.code,controller:1,location:4,sequence:c.sequence}))}};
 return d}
const ctx={name:c=>DB[c.code]?.name||'',db:DB,spells:[],enemySpells:[]};
const enemyOf=d=>d.zone(1,4).filter(Boolean);
// arm on the Yes/No (history before the Yes), then evaluate on d (history after it)
function run(d,{armOn}={}){const pilot={retargetLog:[]};const a=armOn||{...d,responseHistory:d.responseHistory.slice(0,-1)};
 armReplayToken(pilot,a,0,a.armPrompt||{type:M.SELECT_YESNO,seat:0,description:30n},a.armResponse||{type:R.SELECT_YESNO,yes:true});
 const r=replayRetarget(d,0,d.prompt,pilot,battleOutcome,ctx,enemyOf(d));return {r,pilot}}

test('(R67.7-N1/N9) wrong purpose: an open chain, multi-select, tribute or unselect prompts never get a battle override',()=>{
 assert.ok(run(S()).r?.attacker,'control');
 assert.match(run(S({chain:[{chain_size:1}]})).r.abstain,/chain is open/);
 assert.match(run(S({prompt:{type:M.SELECT_CARD,seat:0,min:1,max:2,selects:[{code:600,controller:1,location:4,sequence:0}]}})).r.abstain,/single-select/);
 assert.match(run(S({prompt:{type:M.SELECT_TRIBUTE,seat:0,min:1,max:1,selects:[]}})).r.abstain,/single-select/);
 assert.match(run(S({prompt:{type:M.SELECT_UNSELECT_CARD,seat:0,min:1,max:1}})).r.abstain,/single-select/);
 assert.match(run(S({prompt:{type:M.SELECT_CARD,seat:0,min:1,max:1,selects:[{code:500,controller:0,location:4,sequence:2}]}})).r.abstain,/opposing Monster Zone/,'own monster as candidate');
 assert.match(run(S({prompt:{type:M.SELECT_CARD,seat:0,min:1,max:1,selects:[{code:600,controller:1,location:16,sequence:0}]}})).r.abstain,/opposing Monster Zone/,'GY candidate');
});
test('(R67.7-N2/N3) only OUR Yes to description 30 with a surviving attack arms a token',()=>{
 const d=S(),a={...d,responseHistory:d.responseHistory.slice(0,-1)};
 for(const [why,armPrompt,armResponse] of [['description 31',{type:M.SELECT_YESNO,seat:0,description:31n},null],['a No',null,{type:R.SELECT_YESNO,yes:false}],['an effect Yes/No (EFFECTYN)',{type:M.SELECT_EFFECTYN,seat:0,description:30n},null],['the other seat',{type:M.SELECT_YESNO,seat:1,description:30n},null]]){
  const {r,pilot}=run(d,{armOn:{...a,armPrompt,armResponse}});assert.equal(pilot.replayToken??null,null,why);assert.equal(r,null,why)}
 {const noAtk=S({events:[{id:10,type:'phase',phase:8}]});const {r,pilot}=run(noAtk);assert.equal(pilot.replayToken,null);assert.equal(pilot.retargetLog[0].ok,false);assert.equal(r,null,'N3: no attack')}
 {const ended=S({events:[{id:11,type:'attack',code:500,from:{controller:0,location:4,sequence:2}},{id:12,type:'phase',phase:256}]});assert.equal(run(ended).pilot.replayToken,null,'N3: battle over')}
});
test('(R67.7-N4) attacker left, was replaced (even by the same code), changed position, or a malformed event: invalid',()=>{
 const base=S().events;const after=e=>S({events:[...base,e]});
 for(const [why,e] of Object.entries({
  'moved away':{id:20,type:'move',code:500,from:{controller:0,location:4,sequence:2},to:{controller:0,location:16,sequence:0}},
  'same-code replacement moved in':{id:20,type:'move',code:500,from:{controller:0,location:2,sequence:0},to:{controller:0,location:4,sequence:2}},
  'position change':{id:20,type:'position',code:500,from:{controller:0,location:4,sequence:2}},
  'summon into the slot':{id:20,type:'summon',code:500,player:0,sequence:2},
  'malformed move':{id:20,type:'move',code:1,from:{location:4,sequence:0},to:{controller:1,location:16,sequence:0}},
  'a second attack':{id:20,type:'attack',code:500,from:{controller:0,location:4,sequence:2}}})){
  // the event lands AFTER the Yes was armed: arm on the clean history, evaluate on the dirty one
  const clean=S(),dirty=after(e);const pilot={retargetLog:[]};armReplayToken(pilot,{...clean,responseHistory:clean.responseHistory.slice(0,-1)},0,{type:M.SELECT_YESNO,seat:0,description:30n},{type:R.SELECT_YESNO,yes:true});
  const r=replayRetarget(dirty,0,dirty.prompt,pilot,battleOutcome,ctx,enemyOf(dirty));assert.ok(r?.abstain,why)}
 {const clean=S(),d=S();d.zone=(p,l)=>l===4?(p===0?[null,null,{code:501,position:1,attack:1800,sequence:2},null,null]:enemyOf(clean)):[];
  assert.match(run(d,{armOn:{...clean,responseHistory:clean.responseHistory.slice(0,-1)}}).r?.abstain||'',/not the one the Yes continued|no longer face-up/,'snapshot: a different code in the slot after the Yes');
  assert.equal(run(d).pilot.replayToken,null,'and a Yes given while the slot already held another code arms nothing')}
});
test('(R67.7-N5) reordered candidates: the CURRENT index of the best target is returned by the pilot scoring, never a stored one',()=>{
 const a=run(S({targets:[[600,4,0,4000],[601,4,0,0]]})).r,b=run(S({targets:[[601,4,0,0],[600,4,0,4000]]})).r;assert.ok(a.attacker&&b.attacker);
 const best=r=>{const s=r.targets.map(x=>battleOutcome(ctx,r.attacker,x.t)).map(o=>o.damage-o.taken*2+(o.destroyed?1000:0)-(o.lost?3000:0));return s.indexOf(Math.max(...s))};
 assert.equal(best(a),1);assert.equal(best(b),0);
});
test('(R67.7-N6/N7/N8) unmodelled or uncertain battles abstain; modelled ones (immunity, Mikanko reflection) do not',()=>{
 assert.match(run(S({targets:[[600,8,0,0],[601,4,0,0]]})).r.abstain,/face-down/,'N6: face-down remaining target');
 assert.match(run(S({targets:[[602,1,1000,1000]]})).r.abstain,/battle-destruction effect/,'N7: retaliation/float on a target we would destroy');
 assert.match(run(S({attacker:605})).r.abstain,/attacker's text/,'N7: piercing attacker');
 assert.match(run(S({targets:[[603,1,1000,1000]]})).r.abstain,/does not cover: Booster/,'N8: damage-calculation change');
 assert.ok(run(S({targets:[[604,1,1500,1500],[601,4,0,0]]})).r.attacker,'N8: Mikanko reflection is modelled');
 assert.ok(run(S({targets:[[606,4,0,1000]]})).r.attacker,'N7: plain battle immunity is modelled');
 assert.ok(run(S({attacker:607})).r.attacker,'"(except during the Damage Step)" is timing, not battle');
 assert.ok(run(S({targets:[[602,4,0,4000]]})).r.attacker,'a floater we would NOT destroy is fine');
});
test('(R67.7-N10) restart/rewind, a refused Yes, anything accepted in between, turn or battle end: invalid; the token is single-purpose',()=>{
 const d=S();
 {const {r}=run({...d,handle:2},{armOn:{...d,responseHistory:d.responseHistory.slice(0,-1)}});assert.equal(r,null,'new engine handle (restart/rewind)')}
 {const {r}=run({...d,responseHistory:d.responseHistory.slice(0,-1)});assert.equal(r,null,'Yes refused/not yet accepted (history unchanged)')}
 {const {r}=run({...d,responseHistory:[...d.responseHistory,{type:R.SELECT_CHAIN,index:null}]},{armOn:{...d,responseHistory:d.responseHistory.slice(0,-1)}});assert.equal(r,null,'another accepted response in between')}
 {const {r}=run({...d,responseHistory:[{type:9},{type:R.SELECT_YESNO,yes:false}]},{armOn:{...d,responseHistory:[{type:9}]}});assert.equal(r,null,'the accepted answer was No')}
 {const {r}=run({...d,turn:4},{armOn:{...d,responseHistory:d.responseHistory.slice(0,-1)}});assert.match(r.abstain,/battle phase/,'turn changed')}
 {const {r}=run({...d,phase:256},{armOn:{...d,responseHistory:d.responseHistory.slice(0,-1)}});assert.match(r.abstain,/battle phase/,'Main Phase 2')}
 {const pilot={retargetLog:[]};armReplayToken(pilot,{...d,responseHistory:d.responseHistory.slice(0,-1)},0,{type:M.SELECT_YESNO,seat:0,description:30n},{type:R.SELECT_YESNO,yes:true});assert.ok(pilot.replayToken);
  armReplayToken(pilot,d,0,{type:M.SELECT_BATTLECMD,seat:0},{type:R.SELECT_BATTLECMD,action:3,index:null});assert.equal(pilot.replayToken,null,'an unrelated prompt of ours drops it')}
 assert.equal(attackProof({events:[],zone:()=>[]},0).why,'no attack event in the retained history');
});
test('(R67.7-W) wiring: the tactical target rule uses the adapter only when it proves an attacker; the pilot arms after deciding',()=>{
 const p=fs.readFileSync('dist/pilot.mjs','utf8'),o=fs.readFileSync('dist/optimal-pilot.mjs','utf8');
 assert.match(p,/rt=replayRetarget\(d,p,m,pilot,battleOutcome,context,enemy\)[^;]*,attacker=rt\?\.attacker\|\|own\.find\(c=>c\.code===d\.lastCard\)/);
 assert.match(p,/const pending=rt\?\.attacker\?null[^:]*:pilot\.pendingAttack;/);
 assert.match(o,/armReplayToken\(this,d,seat,m,plan\.response\);[^\n]*\n  return plan;\n \}/);
 assert.equal(fs.readFileSync('dist/duel.mjs','utf8').includes('replayRetarget'),false,'duel.mjs untouched');
});

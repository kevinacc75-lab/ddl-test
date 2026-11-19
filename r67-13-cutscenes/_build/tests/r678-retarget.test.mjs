// r67.8 (Claude): ChatGPT RELAY-259 follow-up to the battle-retarget adapter. MED-R677-1 (whole public board) with the requested
// controls, plus the narrowed N1/N5/N6/N8/K1 assertions. Real card data throughout; native cases replay retained 11001/11002.
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import z from 'node:zlib';
import {armReplayToken,replayRetarget} from '../dist/ai/battle-retarget.mjs';import {battleOutcome,tacticalContext} from '../dist/tactics.mjs';import {M,R} from '../dist/duel.mjs';
const db=JSON.parse(z.gunzipSync(fs.readFileSync('dist/cards.json.gz')));
const TITAN=41373230,BETOON=53183600,KINGDOM=43175858,TWORLD=15259703,OHIME=81260679,MAIDEN=17947697;
const q=f=>{const l=console.log,w=console.warn;console.log=()=>{};console.warn=()=>{};try{return f()}finally{console.log=l;console.warn=w}};

// ChatGPT's kingdom-counterexample shape (RELAY-259a), parameterised. app seat 0 attacks; `swap` = app seat 0 is engine player 1.
function board({field=[],targets=[[BETOON,4,3000,2500]],swap=false,events}={}){
 const a={code:TITAN,controller:0,location:4,sequence:0,position:1,attack:3800,defense:2500};
 const ts=targets.map(([code,pos,atk,def],i)=>({code,controller:1,location:4,sequence:i,position:pos,attack:atk,defense:def}));
 const st=field.map(([code,status=0],i)=>({code,controller:1,location:8,sequence:i===0?5:i-1,position:1,status}));
 const eng=app=>swap?1-app:app;
 const d={db,name:c=>db[c]?.name||'',turn:3,phase:8,active:0,handle:1,lp:[8000,8000],chain:[],responseHistory:[],fromEngine:c=>eng(c),
  events:events||[{type:'turn',id:1},{type:'attack',id:2,code:a.code,from:{controller:0,location:4,sequence:0}},{type:'chainEnd',id:3}],
  zone:(p,l)=>l===4?(p===0?[a]:ts):l===8&&p===1?st:[],
  prompt:{type:M.SELECT_CARD,seat:0,player:eng(0),min:1,max:1,selects:ts.map(t=>({...t,controller:eng(1)}))}};
 const pilot={retargetLog:[]};armReplayToken(pilot,d,0,{type:M.SELECT_YESNO,seat:0,description:30n},{type:R.SELECT_YESNO,yes:true});d.responseHistory.push({type:R.SELECT_YESNO,yes:true});
 const ctx=tacticalContext(d,0);return {d,pilot,ctx,r:replayRetarget(d,0,d.prompt,pilot,battleOutcome,ctx,ctx.enemy)}}

test('(R67.8-1) MED-R677-1: Toon Kingdom protecting a Toon target -> abstain; controls act (absent, irrelevant Spell, negated) in both seat mappings',()=>{
 for(const swap of [false,true]){const m=swap?'engine-swapped':'same mapping';
  {const {r,ctx,d}=board({swap});assert.ok(r?.attacker,m+': Kingdom absent: acts');assert.equal(battleOutcome(ctx,d.zone(0,4)[0],d.zone(1,4)[0]).destroyed,true)}
  {const {r}=board({swap,field:[[KINGDOM]]});assert.equal(r?.attacker,undefined,m);assert.match(r.abstain,/their board: Toon Kingdom/,m+': Kingdom active: abstain, no destruction assumed')}
  {const {r}=board({swap,field:[[TWORLD]]});assert.ok(r?.attacker,m+': an irrelevant public Spell (Toon World) does not block')}
  {const {r}=board({swap,field:[[KINGDOM,1]]});assert.ok(r?.attacker,m+': Kingdom visibly negated (status bit 1): acts')}
 }
});
test('(R67.8-2) whole-board scan scope: our own self-only restrictions do not block; our battle-changing cards and their reactions do',()=>{
 const own=(code)=>{const b=board();const o=b.d.zone;b.d.zone=(p,l)=>p===0&&l===4?[...o(0,4),{code,controller:0,location:4,sequence:3,position:1,attack:2000}]:o(p,l);
  const pilot={retargetLog:[]};const yes={...b.d,responseHistory:[]};armReplayToken(pilot,yes,0,{type:M.SELECT_YESNO,seat:0,description:30n},{type:R.SELECT_YESNO,yes:true});const ctx=tacticalContext(b.d,0);return replayRetarget(b.d,0,b.d.prompt,pilot,battleOutcome,ctx,ctx.enemy)};
 assert.ok(own(70534340)?.attacker,"our Lubellion ('this card cannot attack') is self-only");
 assert.ok(own(60303688)?.attacker,"our Dogmatika Ecclesia (protects only itself) does not block");
 assert.match(own(11765832)?.abstain||'',/our board changes battle: Garura/,'our Garura (doubles battle damage) blocks');
 // their reaction to a destruction only matters when we expect to destroy: Aluber on their side
 {const {r}=board({field:[],targets:[[BETOON,4,3000,2500]]});assert.ok(r.attacker)}
 const theirs=(targets)=>{const b=board({targets});const o=b.d.zone;b.d.zone=(p,l)=>p===1&&l===4?[...o(1,4),{code:62962630,controller:1,location:4,sequence:4,position:1,attack:1200}]:o(p,l);
  const pilot={retargetLog:[]};armReplayToken(pilot,{...b.d,responseHistory:[]},0,{type:M.SELECT_YESNO,seat:0,description:30n},{type:R.SELECT_YESNO,yes:true});const ctx=tacticalContext(b.d,0);return replayRetarget(b.d,0,b.d.prompt,pilot,battleOutcome,ctx,ctx.enemy)};
 assert.match(theirs([[BETOON,4,3000,2500]]).abstain||'',/reacts to a battle destruction: Aluber/,'we would destroy: their Aluber reaction blocks');
 assert.ok(theirs([[BETOON,4,3000,4000]]).attacker,'nothing would be destroyed: their Aluber reaction is irrelevant');
});
test('(R67.8-3) N1: an effect still resolving after the attack (activation with no chain end) is not a retarget window, even with chain[] empty',()=>{
 const ev=[{type:'turn',id:1},{type:'attack',id:2,code:TITAN,from:{controller:0,location:4,sequence:0}},{type:'activate',id:3,code:MAIDEN,chain:1,player:1}];
 assert.match(board({events:ev}).r.abstain,/still resolving/);
 assert.ok(board({events:[...ev,{type:'chainEnd',id:4}]}).r.attacker,'after the chain ends: acts');
});
test('(R67.8-4) N8 real values: Mikanko reflection is modelled (Ohime: not destroyed, 1000 reflected to us) and the adapter does not abstain on it',()=>{
 const {r,ctx,d}=board({targets:[[OHIME,1,1500,1500],[BETOON,4,3000,2500]]});assert.ok(r.attacker);
 const a=d.zone(0,4)[0];assert.deepEqual(battleOutcome(ctx,a,{...d.zone(1,4)[0],attack:1500}),{damage:0,taken:2300,destroyed:false,lost:false,uncertain:false});
 assert.deepEqual(battleOutcome(ctx,{...a,attack:2500},{...d.zone(1,4)[0]}),{damage:0,taken:1000,destroyed:false,lost:false,uncertain:false});
});

/* ---------------- native, full pilot ---------------- */
async function at(file,bound,{reorder,drop,noAdapter}={}){
 const {loadBuild,db:cdb,scripts}=await import('./lib/engine-scenario.mjs');const {createOptimalPilots}=await import('../dist/optimal-pilot.mjs');const {safeView}=await import('../dist/ai/knowledge.mjs');
 const build=await loadBuild(true),{Duel}=build;const rp=JSON.parse(fs.readFileSync('tests/fixtures/'+file));const d=new Duel(build.live.core,cdb,scripts);
 q(()=>d.start(rp.decks,{seed:rp.seed,first:rp.first}));q(()=>{for(let i=0;i<bound-1;i++)d.respond(rp.responses[i])});
 const P=createOptimalPilots({seed:rp.seed,searchEnabled:false}),seat=d.prompt.seat;if(noAdapter)Object.defineProperty(P[seat],'replayToken',{get:()=>null,set:()=>{}});
 q(()=>P[seat].base(safeView(d,seat)));q(()=>d.respond(rp.responses[bound-1]));
 const v=safeView(d,seat),m=d.prompt;let sel=m.selects.slice();if(drop)sel=sel.filter(c=>cdb[c.code].name!==drop);if(reorder)sel=reorder(sel);
 const v2=Object.create(v);v2.prompt={...m,selects:sel};let r;q(()=>{r=P[seat].base(v2)});const names=sel.map(c=>cdb[c.code].name);d.stop();return {pick:names[r.response.indicies[0]],idx:r.response.indicies[0],names}}
test('(R67.8-5) N5 final pilot response: reordered current candidates -> the pilot returns Maiden\'s CURRENT index',async()=>{
 const a=await at('r677-replay-11001.json',248,{reorder:s=>s.slice().reverse()});assert.equal(a.pick,'Maiden of White');assert.equal(a.idx,2);assert.deepEqual(a.names,['Blue-Eyes Ultimate Spirit Dragon','Sage with Eyes of Blue','Maiden of White','Blue-Eyes White Dragon']);
});
test('(R67.8-6) N6 the formerly preferred target removed: a current legal pick from what is left (Sage, 1500 DEF vs Quem 1500: no loss), never the stale index',async()=>{
 const a=await at('r677-replay-11001.json',248,{drop:'Maiden of White',reorder:s=>[s[1],s[0],s[2]]});
 assert.deepEqual(a.names,['Sage with Eyes of Blue','Blue-Eyes White Dragon','Blue-Eyes Ultimate Spirit Dragon']);assert.equal(a.pick,'Sage with Eyes of Blue');assert.equal(a.idx,0,'not the stale index 1');
});
test('(R67.8-7) K1 response equality: across 11001, every Branded attack target except i248 gets the SAME response with or without the adapter',async()=>{
 const {loadBuild,db:cdb,scripts}=await import('./lib/engine-scenario.mjs');const {createOptimalPilots}=await import('../dist/optimal-pilot.mjs');const {safeView}=await import('../dist/ai/knowledge.mjs');
 const build=await loadBuild(true),{Duel}=build;const rp=JSON.parse(fs.readFileSync('tests/fixtures/r677-replay-11001.json'));const d=new Duel(build.live.core,cdb,scripts);q(()=>d.start(rp.decks,{seed:rp.seed,first:rp.first}));
 const seat=rp.decks.findIndex(x=>x.id==='branded');const A=createOptimalPilots({seed:rp.seed,searchEnabled:false})[seat],B=createOptimalPilots({seed:rp.seed,searchEnabled:false})[seat];Object.defineProperty(B,'replayToken',{get:()=>null,set:()=>{}});
 const diff=[],t7=[];q(()=>{for(let i=0;i<rp.responses.length&&d.prompt&&!d.finished;i++){const m=d.prompt;if(m.seat===seat){const ra=A.base(safeView(d,seat)),rb=B.base(safeView(d,seat));
  if(m.type===build.M.SELECT_CARD&&d.hint===549){if(d.turn===7)t7.push(i);if(JSON.stringify(ra.response)!==JSON.stringify(rb.response))diff.push(i)}}d.respond(rp.responses[i])}});
 d.stop();assert.ok(t7.length>=1);assert.deepEqual(diff,[248],'only the replay target differs from the adapter-off baseline');
});

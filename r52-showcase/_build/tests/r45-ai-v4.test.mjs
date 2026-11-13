// r45 AI v4 (Kevy 11 Nov 2026 11:53 AEDT "Yes, build the v4 AI after r44"; hybrid direction 11:57 AEDT; display rename 11:55 AEDT).
// Each behaviour test below was run against the r44 code (tools/run-r45-on-r44.py) and the ones marked "fails on r44" fail there.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {test} from 'node:test';
import {loadBuild,scenario,toIdle,answer,db,code,LOC,POS} from './lib/engine-scenario.mjs';
import {BRANDED_NOV08} from '../dist/ai/book/branded-nov08.mjs';
import {createOptimalPilots} from '../dist/optimal-pilot.mjs';
import {safeView} from '../dist/ai/knowledge.mjs';
import {bookActivationBlock,bookPick,idleStep,newBookState,keyCards,BOOKS} from '../dist/ai/book/book.mjs';
import {R45_NAME} from './lib/r45-scope.mjs';
const A=68468459,E=55273560,C=95515789,V=30271097,T=41373230,D=76666602,ASH=14558127,WOLF=69247929,LUB=70534340,JADE=44146295,LEN=3410461,S=38811586,ALBION=25451383;
const build=await loadBuild(true);const {M,R}=build;
const hand=(code,p=0)=>({p,code,location:LOC.HAND});
const gy=(code,p=0)=>({p,code,location:LOC.GRAVE});
const field=(code,sequence,p=0)=>({p,code,location:LOC.MZONE,sequence,position:POS.ATK});
function make(place,extra,{first=0,other=[],more=[],seed=11,auto=false,opponentId='fixture-b'}={}){
 const decks=[{id:'branded',format:BRANDED_NOV08,name:'Branded fixture',main:[...place.filter(x=>x.p===0&&x.location!==LOC.GRAVE).map(x=>x.code),...place.filter(x=>x.p===0&&x.location===LOC.GRAVE&&!(db[x.code].type&(64|8192))).map(x=>x.code),...more,...Array(41).fill(WOLF)].slice(0,41),extra:[...extra,...place.filter(x=>x.p===0&&x.location===LOC.GRAVE&&(db[x.code].type&(64|8192))).map(x=>x.code)]},{id:opponentId,name:'Opponent fixture',main:[...place.filter(x=>x.p===1).map(x=>x.code),...other,...Array(41).fill(WOLF)].slice(0,41),extra:[]}];
 const d=scenario(build,{decks,first,seed,place});if(!auto)toIdle(build,d,first);return d;
}
const acts=(d,code)=>d.prompt.activates?.findIndex(c=>c.code===code)??-1;
const selects=(d,code)=>d.prompt?.selects?.some(c=>c.code===code);
function until(d,predicate,pick){for(let i=0;i<60&&d.prompt;i++){if(predicate(d.prompt))return d.prompt;d.respond(answer(build,d,{pick:pick?((m)=>pick(m,d)):undefined}));}assert.fail('Expected prompt not reached');}
const pilot=()=>createOptimalPilots({seed:1,searchEnabled:false,doctrine:true})[0];
// Opponent (seat 1) goes first and simply ends its turn; stop at our first Main Phase 1 idle (turn 2).
function toOurTurn2(d){
 return until(d,m=>m.type===M.SELECT_IDLECMD&&m.seat===0&&d.turn===2,(m)=>{const s=m.seat??m.player;if(s===1&&m.type===M.SELECT_IDLECMD){const c=d.choices().find(o=>o.response.action===7);if(c)return c.response}return null});
}

// ---- item 2: never revive the opponent's hand trap with The Fallen & The Virtuous ----
test('(R45-FV1) B4 holds F&V when the only legal revive is the opponent\'s Ash Blossom (fails on r44)',()=>{
 const d=make([hand(V),field(E,0),gy(T),gy(ASH,1)],[D],{seed:1});
 try{
  const i=acts(d,V);assert.ok(i>=0,'engine offers F&V (Ecclesia face up)');
  const v=safeView(d,0);
  assert.match(bookActivationBlock(v,0,v.prompt.activates[i])||'',/no plausible legal revival/);
  const plan=pilot().base(v);assert.ok(!(plan.response.action===5&&plan.response.index===i),'pilot does not activate F&V to revive their Ash');
 }finally{d.stop()}
});
test('(R45-FV2) F&V revival prefers our Fallen of Albaz; a base pick of the opponent\'s Ash Blossom is overridden by the book (fails on r44)',()=>{
 const d=make([hand(V),field(E,0),gy(A),gy(ASH,1)],[D],{seed:1});
 try{
  d.respond({type:R.SELECT_IDLECMD,action:5,index:acts(d,V)});
  for(let k=0;k<30&&!(d.prompt?.type===M.SELECT_CARD&&selects(d,A)&&selects(d,ASH));k++){
   if(d.prompt.type===M.SELECT_OPTION){const o=d.prompt.options.findIndex(x=>/special summon/i.test(d.description(x)));d.respond({type:R.SELECT_OPTION,index:o>=0?o:0});continue}
   d.respond(answer(build,d));
  }
  assert.ok(selects(d,A)&&selects(d,ASH),'native revive prompt offers both');
  const vv=safeView(d,0),m=vv.prompt,base={type:R.SELECT_CARD,indicies:[m.selects.findIndex(c=>c.code===ASH)]};
  const whole=pilot().base(vv);assert.equal(m.selects[whole.response.indicies[0]].code,A,'whole pilot revives our Albaz (r44 also did here)');
  const p=bookPick(vv,0,m,base);assert.ok(p,'the v4 book overrides a base pick of their Ash');assert.equal(m.selects[p.response.indicies[0]].code,A);
 }finally{d.stop()}
});

// ---- item 4: hand-trap key cards cover every Branded starter ----
test('(R45-K) hand-trap key cards against Branded include Fallen of Albaz, Albion the Shrouded Dragon, Super Polymerization, Mercourier, Cocatorium (fails on r44)',()=>{
 const deck=JSON.parse(fs.readFileSync('dist/decks.json')).decks.find(d=>d.id==='branded');
 const keys=keyCards('branded',{...deck,format:BRANDED_NOV08});
 for(const n of ['Fallen of Albaz','Albion the Shrouded Dragon','Super Polymerization','Tri-Brigade Mercourier','Cocatorium the Heavy Metal Avian','Aluber the Jester of Despia','Branded Fusion'])assert.ok(keys.has?keys.has(n):keys.includes(n),n);
});

// ---- item 3: whole-turn lethal and battle before ending ----
test('(R45-L1) visible lethal in Main Phase 1 on turn 2: the pilot enters Battle instead of another book step (fails on r44)',()=>{
 const d=make([field(JADE,0),field(87746184,1),field(S,2),field(LEN,3),hand(C)],[],{first:1,auto:true,seed:3});
 try{
  toOurTurn2(d);assert.ok(!d.zone(1,4).some(Boolean),'opponent field empty');
  const v=safeView(d,0),p=pilot().base(v);
  assert.equal(p.response.action,6,'Battle Phase');assert.equal(p.book?.kind,'lethal');
 }finally{d.stop()}
});
test('(R45-L1b) a lethal baseline is trusted over search for every deck, a plain step is not (fails on r44)',async()=>{
 const {trustBook}=await import('../dist/optimal-pilot.mjs');
 const d={decks:[{id:'fixture-x'},{id:'fixture-y'}],turn:2,active:0,prompt:{type:M.SELECT_IDLECMD}},p={bookTrust:true,seat:0};
 assert.equal(trustBook(p,d,{book:{kind:'lethal'},response:{action:6}}),true);
 assert.equal(trustBook(p,d,{book:{kind:'step'},response:{action:5,index:0}}),false);
 assert.equal(trustBook({bookTrust:false,seat:0},d,{book:{kind:'lethal'}}),false,'no book trust at all: search decides');
});
test('(R45-L2) damage but no lethal (3000 into 8000), or a bigger opposing monster: the lethal rule stays out',async()=>{
 const {v4LethalNow}=await import('../dist/ai/book/v4-plan.mjs');
 for(const place of [[field(JADE,0),hand(C)],[field(WOLF,0),hand(C),field(JADE,0,1)]]){
  const d=make(place,[],{first:1,auto:true,seed:3});
  try{toOurTurn2(d);assert.equal(v4LethalNow(safeView(d,0),0,d.prompt),null);const p=pilot().base(safeView(d,0));assert.notEqual(p.book?.kind,'lethal')}finally{d.stop()}
 }
});
test('(R45-L3) turn 2 End Phase with a damaging attack available becomes Battle Phase; not on turn 1',async()=>{
 const {v4EndToBattle}=await import('../dist/ai/book/v4-plan.mjs');
 const d=make([field(JADE,0)],[],{first:1,auto:true,seed:3});
 try{toOurTurn2(d);const v=safeView(d,0);assert.deepEqual(v4EndToBattle(v,0,{type:R.SELECT_IDLECMD,action:7,index:null}),{type:R.SELECT_IDLECMD,action:6,index:null});
  assert.equal(v4EndToBattle(v,0,{type:R.SELECT_IDLECMD,action:5,index:0}),null,'only End is converted')}finally{d.stop()}
 const e=make([field(JADE,0)],[],{seed:3});
 try{assert.equal(v4EndToBattle(safeView(e,0),0,{type:R.SELECT_IDLECMD,action:7,index:null}),null,'turn 1 has no Battle Phase')}finally{e.stop()}
});

// ---- 41 list second-turn line: Alba-Lenatus contact on their Dragon ----
test('(R45-LEN) our face-up Albaz + their face-up Lubellion on turn 2: Alba-Lenatus is summoned with Albaz + Lubellion (fails on r44)',()=>{
 const d=make([field(A,0),field(LUB,0,1)],[LEN],{first:1,auto:true,seed:3});
 try{
  toOurTurn2(d);
  assert.ok(d.prompt.special_summons?.some(c=>c.code===LEN),'engine offers Alba-Lenatus');
  const p=pilot().base(safeView(d,0));
  assert.equal(p.response.action,1);assert.equal(d.prompt.special_summons[p.response.index].code,LEN);assert.match(p.book?.rule||'',/V4-LENATUS/);
  d.respond(p.response);
  for(let k=0;k<12&&d.prompt&&d.prompt.type===M.SELECT_UNSELECT_CARD&&d.prompt.seat===0;k++){
   const v=safeView(d,0),q=bookPick(v,0,v.prompt,null);assert.ok(q,'material pick from the v4 book');d.respond(q.response);
  }
  until(d,m=>m.type===M.SELECT_IDLECMD&&m.seat===0);
  assert.ok(d.zone(0,4).some(c=>c?.code===LEN),'Alba-Lenatus on our field');
  assert.ok(d.zone(1,16).some(c=>c?.code===LUB),'their Lubellion was used as material');
  assert.equal(d.retries,0);
 }finally{d.stop()}
});
test('(R45-LEN2) no Lenatus contact on turn 1 or against a face-up Mirrorjade only',()=>{
 for(const [opts,opp] of [[{seed:3},LUB],[{first:1,auto:true,seed:3},JADE]]){
  const d=make([field(A,0),field(opp,0,1)],[LEN],opts);
  try{if(opts.auto)toOurTurn2(d);const p=pilot().base(safeView(d,0));assert.doesNotMatch(String(p.book?.line||p.book?.rule||''),/V4-LENATUS|Alba-Lenatus: send/)}finally{d.stop()}
 }
});

// ---- recovery after an interrupted turn 1 ----
test('(R45-REC) recovery lines exist and Albion the Shrouded Dragon in hand starts V4-R-ALBION when no opener applies (fails on r44)',async()=>{
 const {brandedNov08Book}=await import('../dist/ai/book/branded-nov08.mjs');const ids=brandedNov08Book.lines.map(l=>l.id);
 for(const id of ['V4-R-ALBION','V4-R-ECCLESIA','V4-R-QUEM-CART','V4-R-CART'])assert.ok(ids.includes(id),id);
 assert.ok(ids.indexOf('V4-R-ALBION')>ids.indexOf('K08-NADIR'),'recovery lines come after every opener');
 const d=make([hand(ALBION),hand(C),hand(WOLF)],[S,JADE],{seed:2,more:[A]});
 try{
  const v=safeView(d,0),p=pilot().base(v);
  assert.equal(p.response.action,5);assert.equal(d.prompt.activates[p.response.index].code,ALBION);assert.match(String(p.book?.line||p.book?.rule||''),/V4-R-ALBION|Albion the Shrouded/);
 }finally{d.stop()}
});

// ---- item 5: a real Sky Striker playbook ----
test('(R45-SKY) Sky Striker v4 lines exist (three lines, picks, hand-trap holds) but ship OFF: default is the r44 holds-only Sky book',async()=>{
 const sky=BOOKS.sky,{setV4,V4}=await import('../dist/ai/v4-flags.mjs');
 assert.equal(V4.sky,false,'r45 ships the Sky lines off (benchmark pilots were worse than r44)');assert.equal(sky.trust,false);assert.equal(sky.lines.length,0);assert.equal(sky.picks.length,0);
 const ash=()=>sky.blocks.some(b=>b.do==='summon'&&b.card==='Ash Blossom & Joyous Spring');assert.equal(ash(),false);
 try{setV4({sky:true});assert.deepEqual(sky.lines.map(l=>l.id),['V4-SKY-DRAW','V4-SKY-BREAK','V4-SKY-OPEN']);assert.ok(sky.picks.some(p=>/Engage/.test(p.source)));
  for(const l of sky.lines)for(const s of l.steps||[])assert.ok(code(s.card),s.card);assert.ok(ash(),'hand traps never Normal Summoned as bodies when on');assert.equal(sky.trust,false)}finally{setV4({sky:false})}
});
// ---- item 6: look-ahead finishes within its budget ----
test('(R45-POOL) world-pool maintenance obeys refillCap and the time room; defaults unchanged (fails on r44)',async()=>{
 const {WorldPool}=await import('../dist/ai/world-pool.mjs'),{createSearchCore}=await import('../dist/ai/engine-snapshot.mjs');
 const core=await createSearchCore(db,(await import('./lib/engine-scenario.mjs')).scripts);
 const run=o=>{const p=new WorldPool('t',10);let calls=0;p.step=function(slot,x){calls++;this.slots[slot]={n:x.n,turn:x.turn,snap:null};this.lastRoot[slot]=x.r;return 'done'};
  const r=p.maintain({context:{seat:0,history:[],publicState:{turn:1}},seed:1,db,scripts:{},core},o);return {calls,r}};
 assert.equal(run({}).calls,10);
 const c=run({refillCap:4});assert.equal(c.calls,4);assert.equal(c.r.report.refillCapped,6);assert.equal(c.r.flagged,true);
 assert.equal(run({timeLeft:()=>100,minRefillMs:550}).calls,0);assert.equal(run({timeLeft:()=>900,minRefillMs:550}).calls,10);
});
test('(R45-SEARCH) the pilot search passes the v4 caps and soft stop; full is relative to the pool size; finished is reported',async()=>{
 const pilotSrc=fs.readFileSync('dist/optimal-pilot.mjs','utf8'),info=fs.readFileSync('dist/ai/info-set.mjs','utf8'),{V4}=await import('../dist/ai/v4-flags.mjs');
 assert.match(pilotSrc,/poolOptions:soft\?\{refillCap:V4\.search\.refillCap,renewCap:V4\.search\.renewCap,timeLeft,minRefillMs:V4\.search\.minRefillMs\}:null/);assert.match(pilotSrc,/sStop=soft\?\(\)=>outer\(\)\|\|performance\.now\(\)-t0>=V4\.search\.softMs:outer/);assert.match(pilotSrc,/shouldStop:sStop,/);
 assert.match(info,/const fullWorlds=pool\?Math\.max\(8,Math\.min\(16,pool\.size\|\|16\)\):16;/);assert.match(info,/finished:!cut&&!capped/);
 assert.ok(V4.search.softMs<1500&&V4.search.refillCap>=1&&V4.search.renewCap>=1);
});

// ---- item 7: stale comment ----
test('(R45-C) the Albaz Super Poly comment no longer says face-up only',()=>{
 const s=fs.readFileSync('dist/ai/book/branded-nov08.mjs','utf8');
 assert.doesNotMatch(s,/\/\/ Fallen of Albaz \(or White, treated as Albaz\) face-up on a field plus/);assert.match(s,/face-up on either field/);
});

// ---- Kevy 11:55 AEDT: display name ----
test('(R45-N) the Branded deck is shown as "Kevy\'s Branded Deck" in every display; id, format, lists and file names unchanged (fails on r44)',()=>{
 const {decks}=JSON.parse(fs.readFileSync('dist/decks.json','utf8')),b=decks.find(d=>d.id==='branded');
 assert.equal(b.name,R45_NAME);for(const v of Object.values(b.banlistVariants))assert.equal(v.name,R45_NAME);
 assert.equal(b.format.startsWith('TCG Advanced'),true);assert.equal(b.main.length,41);assert.equal(b.extra.length,15);assert.equal(b.side.length,15);
 const app=fs.readFileSync('dist/app.mjs','utf8');
 // tile heading, tile alt text (boss art and emblem), deck screen heading, deck picker options, duel HUD names, watch title
 for(const re of [/<h3>\$\{esc\(d\.name\)\}<\/h3>/,/boss monster of \$\{esc\(d\.name\)\}/,/alt="\$\{esc\(d\.name\)\} emblem/,/<h2>\$\{esc\(d\.name\)\}<\/h2>/,/\$\{esc\(d\.name\)\} · \$\{esc\(d\.subtitle/,/\$\('#my-name'\)\.textContent=duelDecks\[view\]\.name/,/\$\('#opp-name'\)\.textContent=duelDecks\[op\]\.name/])assert.match(app,re);
 for(const f of ['app.mjs','index.html','decks.json','deck-list.mjs','presentation.mjs'])assert.doesNotMatch(fs.readFileSync('dist/'+f,'utf8'),/budget Extra \(10 Nov\)/,f);
});

// ---- found by the v4 benchmark (Branded vs WindBot Blue-Eyes, seed 1910250101, first 1): a forced chain with every option held ----
test('(R45-FORCED) a forced chain is never answered with a pass when every offered option is held (fails on r44)',async()=>{
 const {createOptimalPilots:mk}=await import('../dist/optimal-pilot.mjs');
 const src=fs.readFileSync('dist/optimal-pilot.mjs','utf8');
 assert.match(src,/if\(key==='selects'&&m\.type===M\.SELECT_CHAIN&&m\.forced&&!filtered\.selects\.length\)\{filtered\.selects=m\.selects;indexMaps\.selects=m\.selects\.map\(\(_,i\)=>i\)\}/);
 assert.ok(typeof mk==='function');
});

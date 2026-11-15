// r67 choice header + context reducer (ChatGPT RELAY-226 wording spec r1 and matrix; r67-resolving-context-review-r1).
// Wording authored by ChatGPT; code and tests by Claude; self-checked by Claude, pending Seto team.
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {createChoiceContext,header,ROWS,ERRATA_ROWS,ATTACK_ROWS,OFFER_ROWS,PROMPT_TYPES,CONTEXTS,TYPE_NAME,fill,values} from '../dist/choice-context.mjs';
const MATRIX=JSON.parse(fs.readFileSync(new URL('./fixtures/r67-header-matrix.json',import.meta.url),'utf8'));
const REPRO=JSON.parse(fs.readFileSync(new URL('./fixtures/r67-native-repro.json',import.meta.url),'utf8'));
const read=f=>fs.readFileSync(new URL('../dist/'+f,import.meta.url),'utf8');
const T=Object.fromEntries(Object.entries(TYPE_NAME).map(([k,v])=>[v,Number(k)]));
const NAMES={100:'Sky Striker Ace - Kagari',200:'Sky Striker Ace - Roze',300:'Mulcharmy Fuwalos',400:'Hornet Drones',63166095:'Sky Striker Mobilize - Engage!',777:'Same Card'};
const nameOf=c=>NAMES[c]||'';
// a worker 'state' message: events get consecutive ids from `from`
function msg({from,events=[],chain=[],prompt=null,phase=4,revision=1,view=0,mode='play',epoch=1,complete=true,skipIds=[]}){let id=from;const ev=[];for(const e of events){while(skipIds.includes(id))id++;ev.push({id:id++,...e})}const to=Math.max(from-1,id-1);return {type:'state',human:{epoch},view,mode,study:false,eventSpan:{from,to,complete},events:ev,state:{chain,phase,prompt,revision}}}
const link=(n,code,controller=0,solved=false)=>({chain_size:n,code,controller,solved});
const card=(p={})=>({type:T.SELECT_CARD,seat:0,player:0,min:1,max:1,selects:[{code:400,controller:0,location:16,sequence:0}],...p});
const H=(r,x)=>header(x.state.prompt,r.classify(x),{nameOf,view:x.view,phase:x.state.phase});

test('(R67-1) the 147 rows are exactly ChatGPT\'s matrix (header, fallback, conflict disposition)',()=>{
 assert.equal(MATRIX.rows.length,147);assert.equal(Object.keys(ROWS).length,147);assert.equal(PROMPT_TYPES.length,21);assert.equal(Object.keys(CONTEXTS).length,7);
 for(const r of MATRIX.rows){const k=r.id.slice(2),row=ROWS[k];assert.ok(row,r.id);assert.equal(row[0],r.header_text,r.id);assert.equal(row[1],r.fallback,r.id);assert.equal(row[2],r.disposition.startsWith('context conflict')?1:0,r.id)}
 for(const t of PROMPT_TYPES)for(const c of Object.keys(CONTEXTS))assert.ok(ROWS[t+'-'+c],t+'-'+c);
});

test('(R67-2) every row renders with proof and falls back without it (294 wording vectors; not native interactions)',()=>{
 let n=0;for(const r of MATRIX.rows){const [,t,c]=r.id.match(/^A-(.+)-([RASCEBI])$/);const m={type:T[t],seat:0,player:0,min:1,max:1,count:1,forced:false,selects:[{code:400,controller:0,location:1,sequence:3}],options:[1]};
  const proven={ctx:c,proof:true,cl:2,source:{code:100,seat:0}},bare={ctx:c,proof:false};
  const a=header(m,proven,{nameOf,phase:4}),b=header(m,bare,{nameOf,phase:4});n+=2;
  assert.ok(a&&b,r.id);assert.equal(a.id,r.id);assert.doesNotMatch(a.text+b.text,/[{}]/,r.id);
  const v=values(m,proven,{nameOf,phase:4});
  if(r.disposition.startsWith('context conflict')){assert.equal(a.text,fill(r.fallback,v),r.id+' conflict rows always fall back');assert.equal(a.verified,false)}
  else{assert.equal(a.text,fill(r.header_text,v),r.id);if(r.header_text.includes('{source}'))assert.match(a.text,/Kagari/,r.id);if(r.header_text.includes('{cl}'))assert.match(a.text,/CL 2/,r.id)}
  const needs=/\{(source|cl)\}/.test(r.header_text);
  assert.equal(b.text,fill(needs||r.disposition.startsWith('context conflict')?r.fallback:r.header_text,values(m,bare,{nameOf,phase:4})),r.id+' without proof');
  if(needs)assert.doesNotMatch(b.text,/Kagari|CL 2/,r.id+': nothing unproven is named')}
 assert.equal(n,294);
});

test('(R67-3) CL2 resolves and completes, then CL1 asks: CL2 cleared on resolutionReady, CL1 only on its own resolve',()=>{
 const r=createChoiceContext();
 r.ingest(msg({from:1,events:[{type:'activate',chain:1,code:100,player:0},{type:'activate',chain:2,code:200,player:1}],chain:[link(1,100),link(2,200,1)]}));
 let x=msg({from:3,events:[{type:'resolve',chain:2,code:200,player:1}],chain:[link(1,100),link(2,200,1)],prompt:card({type:T.SELECT_POSITION,code:200}),revision:2});r.ingest(x);
 assert.equal(H(r,x).text,'Resolving CL 2 · Sky Striker Ace - Roze · choose a battle position');
 x=msg({from:4,events:[{type:'resolutionReady',chain:2}],chain:[link(1,100),link(2,200,1,true)],prompt:card(),revision:3});r.ingest(x);
 assert.equal(r.classify(x).ctx,'I');assert.equal(H(r,x).text,'Source not verified · choose 1 card from your GY','between links: no stale CL2, no guessed CL1');
 x=msg({from:5,events:[{type:'resolve',chain:1,code:100,player:0}],chain:[link(1,100),link(2,200,1,true)],prompt:card(),revision:4});r.ingest(x);
 assert.equal(H(r,x).text,'Resolving CL 1 · Sky Striker Ace - Kagari · choose 1 card from your GY');
});

test('(R67-4) resolve + resolutionReady + chainEnd in one message: the last picture is not the current stage',()=>{
 const r=createChoiceContext();r.ingest(msg({from:1,events:[{type:'activate',chain:1,code:100,player:0}],chain:[link(1,100)]}));
 const x=msg({from:2,events:[{type:'resolve',chain:1,code:100,player:0},{type:'resolutionReady',chain:1},{type:'chainEnd'}],chain:[],prompt:card(),revision:2});r.ingest(x);
 assert.notEqual(r.classify(x).ctx,'R');assert.equal(r.state().links.length,0);assert.match(H(r,x).text,/^Source not verified/);
});

test('(R67-5) same card at CL1 and CL2, and a new chain reusing CL1, are told apart by link and lifetime',()=>{
 const r=createChoiceContext();
 r.ingest(msg({from:1,events:[{type:'activate',chain:1,code:777,player:0},{type:'activate',chain:2,code:777,player:0},{type:'resolve',chain:2,code:777,player:0}],chain:[link(1,777),link(2,777)]}));
 let x=msg({from:4,events:[{type:'resolutionReady',chain:2},{type:'resolve',chain:1,code:777,player:0}],chain:[link(1,777),link(2,777,0,true)],prompt:card(),revision:2});r.ingest(x);
 assert.equal(r.classify(x).cl,1);
 x=msg({from:6,events:[{type:'resolutionReady',chain:1},{type:'chainEnd'},{type:'activate',chain:1,code:300,player:1}],chain:[link(1,300,1)],prompt:{type:T.SELECT_CHAIN,seat:0,player:0,selects:[{code:400}],forced:false},revision:3});r.ingest(x);
 assert.equal(H(r,x).text,'Response to CL 1 · Mulcharmy Fuwalos · choose an effect','the new CL1 is the new card, nothing carried over');
});

test('(R67-6) choosing an effect is activation, never resolution; an option refines the same link only',()=>{
 const r=createChoiceContext();
 let x=msg({from:1,events:[{type:'effectChosen',code:100,player:0,option:false,linkedChain:null}],chain:[],prompt:card(),revision:2});r.ingest(x);
 assert.equal(H(r,x).text,'Activating · Sky Striker Ace - Kagari · choose 1 card from your GY');assert.equal(H(r,x).id,'A-SELECT_CARD-A');
 x=msg({from:2,events:[{type:'activate',chain:1,code:100,player:0}],chain:[link(1,100)],prompt:{type:T.SELECT_CHAIN,seat:0,player:0,selects:[{code:200}]},revision:3});r.ingest(x);
 assert.equal(r.state().activating,null,'the activation finished when the link appeared');
 x=msg({from:3,events:[{type:'resolve',chain:1,code:100,player:0},{type:'effectChosen',code:100,player:0,option:true,linkedChain:1,description:'1600'}],chain:[link(1,100)],prompt:{type:T.SELECT_OPTION,seat:0,player:0,options:[1,2]},revision:4});r.ingest(x);
 assert.equal(r.state().resolving.chain,1);assert.equal(r.state().resolving.option,'1600');assert.equal(H(r,x).text,'Resolving CL 1 · Sky Striker Ace - Kagari · choose an option');
 // an opponent's activation in progress never labels this player's prompt
 const r2=createChoiceContext();const y=msg({from:1,events:[{type:'effectChosen',code:300,player:1,option:false}],prompt:card(),revision:2});r2.ingest(y);assert.notEqual(r2.classify(y).ctx,'A');
});

test('(R67-7) a negated link is recorded, never turned into a resolution; completion clears it',()=>{
 const r=createChoiceContext();r.ingest(msg({from:1,events:[{type:'activate',chain:1,code:100,player:0},{type:'activate',chain:2,code:300,player:1},{type:'resolve',chain:2,code:300,player:1},{type:'negate',chain:1}],chain:[link(1,100),link(2,300,1)]}));
 assert.equal(r.state().links.find(l=>l.chain===1).negated,true);
 const x=msg({from:5,events:[{type:'resolutionReady',chain:2},{type:'chainEnd'}],chain:[],prompt:card(),revision:2});r.ingest(x);assert.equal(r.state().links.length,0);assert.notEqual(r.classify(x).ctx,'R');
});

test('(R67-8) gaps, an incomplete ring, a missing span or a duplicate never leave a stale confident header',()=>{
 const base=()=>{const r=createChoiceContext();r.ingest(msg({from:1,events:[{type:'activate',chain:1,code:100,player:0},{type:'resolve',chain:1,code:100,player:0}],chain:[link(1,100)]}));return r};
 for(const [why,x] of [['gap between messages',msg({from:9,chain:[link(1,100)],prompt:card(),revision:2})],['ring overflow',msg({from:3,complete:false,chain:[link(1,100)],prompt:card(),revision:2})],['no span',{...msg({from:3,chain:[link(1,100)],prompt:card(),revision:2}),eventSpan:undefined}]]){const r=base();r.ingest(x);assert.notEqual(r.classify(x).ctx,'R',why);assert.match(H(r,x).text,/^Source not verified/,why)}
 // continuous delivery keeps it
 {const r=base(),x=msg({from:3,chain:[link(1,100)],prompt:card(),revision:2});r.ingest(x);assert.equal(r.classify(x).ctx,'R')}
 // a duplicate of the first message does not restart a finished interval
 {const r=createChoiceContext();const first=msg({from:1,events:[{type:'activate',chain:1,code:100,player:0},{type:'resolve',chain:1,code:100,player:0}],chain:[link(1,100)]});r.ingest(first);
  const done=msg({from:3,events:[{type:'resolutionReady',chain:1}],chain:[link(1,100,0,true)],prompt:card(),revision:2});r.ingest(done);r.ingest(first);assert.equal(r.state().resolving,null);assert.notEqual(r.classify(done).ctx,'R')}
 // a privacy-filtered id inside the span is not a gap (the worker says the span is complete); a fresh resolve after a gap re-establishes context
 {const r=createChoiceContext();r.ingest(msg({from:1,events:[{type:'activate',chain:1,code:100,player:0}],chain:[link(1,100)]}));const x=msg({from:2,skipIds:[2],events:[{type:'resolve',chain:1,code:100,player:0}],chain:[link(1,100)],prompt:card(),revision:2});r.ingest(x);assert.equal(r.classify(x).ctx,'R')}
 {const r=base();const x=msg({from:20,events:[{type:'resolve',chain:1,code:100,player:0}],chain:[link(1,100)],prompt:card(),revision:2});r.ingest(x);assert.equal(r.classify(x).ctx,'R','independently sufficient fresh transition')}
});

test('(R67-9) a rewound or imported mid-chain prompt with no replayed events stays neutral (no latest-unsolved inference)',()=>{
 const r=createChoiceContext();r.reset();
 const x=msg({from:41,chain:[link(1,100),link(2,200)],prompt:card(),revision:30});r.ingest(x);assert.equal(r.classify(x).proof,false);assert.match(H(r,x).text,/^Source not verified/);
 const y=msg({from:41,chain:[link(1,300,1)],prompt:{type:T.SELECT_CHAIN,seat:0,player:0,selects:[{code:400}]},revision:30});const r2=createChoiceContext();r2.ingest(y);assert.equal(H(r2,y).text,'Response window · source not verified · choose an effect');
});

test('(R67-10) a change of viewer, mode or epoch, or a new duel reusing CL1, carries nothing over',()=>{
 const r=createChoiceContext();r.ingest(msg({from:1,events:[{type:'activate',chain:1,code:100,player:0},{type:'resolve',chain:1,code:100,player:0}],chain:[link(1,100)]}));
 for(const ch of [{view:1},{mode:'manual'},{epoch:2}]){const x={...msg({from:3,chain:[link(1,100)],prompt:card(),revision:2}),...ch,human:{epoch:ch.epoch??1}};const q=createChoiceContext();q.ingest(msg({from:1,events:[{type:'activate',chain:1,code:100,player:0},{type:'resolve',chain:1,code:100,player:0}],chain:[link(1,100)]}));q.ingest(x);assert.notEqual(q.classify(x).ctx,'R',JSON.stringify(ch))}
 r.reset();const x=msg({from:1,chain:[link(1,100)],prompt:card(),revision:1});r.ingest(x);assert.notEqual(r.classify(x).ctx,'R');
});

test('(R67-11) hidden information: an opponent link with no public code is named only as a hidden card',()=>{
 const r=createChoiceContext();const x=msg({from:1,events:[{type:'activate',chain:1,code:0,player:1},{type:'resolve',chain:1,code:0,player:1}],chain:[link(1,0,1)],prompt:card(),revision:2});r.ingest(x);
 assert.equal(H(r,x).text,'Resolving CL 1 · Opponent’s hidden card · choose 1 card from your GY');
 const own=createChoiceContext(),y=msg({from:1,events:[{type:'activate',chain:1,code:0,player:0},{type:'resolve',chain:1,code:0,player:0}],chain:[link(1,0,0)],prompt:card(),revision:2});own.ingest(y);assert.match(H(own,y).text,/^Source not verified/,'an own source with no code is not invented');
});

test('(R67-12) a summon procedure needs this player\'s own Summon command and the very next prompt',()=>{
 const r=createChoiceContext();const idle={type:T.SELECT_IDLECMD,seat:0,player:0,summons:[],special_summons:[{code:100}]};
 r.ingest(msg({from:1,prompt:idle,revision:5}));r.noteOwnReply({rev:5,prompt:idle,response:{action:1,index:0}});
 const un={type:T.SELECT_UNSELECT_CARD,seat:0,player:0,select_cards:[{code:9}],unselect_cards:[]};
 let x=msg({from:1,prompt:un,revision:6});r.ingest(x);assert.equal(H(r,x).text,'Summon procedure · Sky Striker Ace - Kagari · adjust the selected cards');assert.equal(H(r,x).id,'A-SELECT_UNSELECT_CARD-S');
 r.noteOwnReply({rev:6,prompt:un,response:{index:0},stage:'S'});x=msg({from:1,events:[{type:'move'}],prompt:{type:T.SELECT_PLACE,seat:0,player:0,count:1},revision:7});r.ingest(x);assert.equal(H(r,x).text,'Summon procedure · Sky Striker Ace - Kagari · choose 1 zone');
 r.noteOwnReply({rev:7,prompt:x.state.prompt,response:{places:[]},stage:'S'});x=msg({from:2,events:[{type:'summon',code:100,player:0}],prompt:card(),revision:8});r.ingest(x);assert.notEqual(r.classify(x).ctx,'S','the summon happened; the procedure is over');
 // skipped revision (someone else answered in between) or another command: no procedure
 const q=createChoiceContext();q.ingest(msg({from:1,prompt:idle,revision:5}));q.noteOwnReply({rev:5,prompt:idle,response:{action:1,index:0}});const z=msg({from:1,prompt:un,revision:7});q.ingest(z);assert.notEqual(q.classify(z).ctx,'S');
 const w=createChoiceContext();w.ingest(msg({from:1,prompt:idle,revision:5}));w.noteOwnReply({rev:5,prompt:idle,response:{action:5,index:0}});const z2=msg({from:1,prompt:un,revision:6});w.ingest(z2);assert.notEqual(w.classify(z2).ctx,'S');
});

test('(R67-13) ChatGPT\'s five reached native cases (RELAY-230, seed 3003) as event-level vectors',()=>{
 const want=Object.fromEntries(REPRO.cases.filter(c=>c.status==='REACHED').map(c=>[c.id,[c.expectedHeaderRowId,c.expectedHeader]]));assert.deepEqual(Object.keys(want).sort(),['C03','C04','C06','C07','C09']);
 const chk=(id,r,x)=>{const h=H(r,x);assert.equal(h.id,want[id][0],id);assert.equal(h.text,want[id][1],id);assert.equal(h.verified,true,id)};
 {const r=createChoiceContext(),x=msg({from:1,phase:1,prompt:{type:T.SELECT_CHAIN,seat:0,player:0,selects:[{code:400}],forced:false}});r.ingest(x);chk('C06',r,x)}
 {const r=createChoiceContext(),x=msg({from:1,phase:1,events:[{type:'effectChosen',code:300,player:1,option:false},{type:'activate',chain:1,code:300,player:1}],chain:[link(1,300,1)],prompt:{type:T.SELECT_CHAIN,seat:0,player:0,selects:[{code:400}]}});r.ingest(x);chk('C07',r,x)}
 {const r=createChoiceContext(),idle={type:T.SELECT_IDLECMD,seat:0,player:0,summons:[],special_summons:[{code:100},{code:100},{code:100}]};r.ingest(msg({from:1,prompt:idle,revision:9}));r.noteOwnReply({rev:9,prompt:idle,response:{action:1,index:0}});const x=msg({from:1,prompt:{type:T.SELECT_UNSELECT_CARD,seat:0,player:0,select_cards:[{code:5}],unselect_cards:[]},revision:10});r.ingest(x);chk('C04',r,x)}
 {const r=createChoiceContext(),x=msg({from:1,events:[{type:'effectChosen',code:100,player:0,option:false},{type:'activate',chain:1,code:100,player:0}],chain:[link(1,100)],prompt:card(),revision:12});r.ingest(x);chk('C03',r,x)}/* native order (r67 browser fixture): CHAINING comes before the target prompt */
 {const r=createChoiceContext();r.ingest(msg({from:1,events:[{type:'activate',chain:1,code:100,player:0},{type:'activate',chain:2,code:200,player:0}],chain:[link(1,100),link(2,200)]}));const x=msg({from:3,events:[{type:'resolve',chain:2,code:200,player:0}],chain:[link(1,100),link(2,200)],prompt:{type:T.SELECT_POSITION,seat:0,player:0,code:200,positions:5},revision:20});r.ingest(x);chk('C09',r,x)}
});

test('(R67-6b, native order) CHAINING precedes cost/target: the activation stays open until priority returns, and never goes stale',()=>{
 const r=createChoiceContext();let x=msg({from:1,events:[{type:'effectChosen',code:100,player:0,option:false},{type:'activate',chain:1,code:100,player:0}],chain:[link(1,100)],prompt:card(),revision:21});r.ingest(x);
 assert.equal(H(r,x).text,'Activating · Sky Striker Ace - Kagari · choose 1 card from your GY');
 // a second activation prompt right after our own answer to the first one
 r.noteOwnReply({rev:21,prompt:x.state.prompt,response:{indicies:[0]},stage:'A',code:100,chain:1})/* r67.1-adapted: the app now passes the shown source identity */;x=msg({from:3,events:[{type:'move'}],chain:[link(1,100)],prompt:card(),revision:22});r.ingest(x);assert.equal(r.classify(x).ctx,'A');
 // somebody else decided in between (revision jumped): not this activation any more
 r.noteOwnReply({rev:22,prompt:x.state.prompt,response:{indicies:[0]},stage:'A',code:100,chain:1});x=msg({from:4,chain:[link(1,100)],prompt:card(),revision:25});r.ingest(x);assert.notEqual(r.classify(x).ctx,'A');
 // priority returned (a response window): the activation is over
 const q=createChoiceContext();q.ingest(msg({from:1,events:[{type:'effectChosen',code:100,player:0,option:false},{type:'activate',chain:1,code:100,player:0}],chain:[link(1,100)],prompt:{type:T.SELECT_CHAIN,seat:0,player:0,selects:[{code:200}]},revision:5}));assert.equal(q.state().activating,null);
 // a trigger's own Yes/No names its own card, never the activation before it
 const w=createChoiceContext(),y=msg({from:1,events:[{type:'effectChosen',code:100,player:0,option:false},{type:'activate',chain:1,code:100,player:0}],chain:[link(1,100)],prompt:{type:T.SELECT_EFFECTYN,seat:0,player:0,code:200},revision:8});w.ingest(y);assert.equal(H(w,y).text,'Effect choice · Sky Striker Ace - Roze · use this effect?')/* r67.1-adapted: errata r2, an offered effect is not "Activating" */;
});

/* ---------------- r67.1 (ChatGPT RELAY-232 review) ---------------- */
test('(R67.1-1) invalid events (outside the span or out of order) prove nothing, even after a continuity clear',()=>{
 for(const [why,evs] of [['id outside the span',[{id:999,type:'resolve',chain:1,code:100,player:0}]],['out of order',[{id:3,type:'activate',chain:1,code:100,player:0},{id:2,type:'resolve',chain:1,code:100,player:0}]],['no id',[{type:'resolve',chain:1,code:100,player:0}]]]){
  const r=createChoiceContext();r.ingest(msg({from:1,events:[{type:'activate',chain:1,code:100,player:0}],chain:[link(1,100)]}));
  const x={...msg({from:2,chain:[link(1,100)],prompt:card(),revision:2}),events:evs};x.eventSpan={from:2,to:3,complete:true};r.ingest(x);
  assert.equal(r.state().resolving,null,why);assert.notEqual(r.classify(x).ctx,'R',why);assert.match(H(r,x).text,/^Source not verified/,why);assert.equal(r.state().trail.at(-1).valid,false,why)}
 // a VALID suffix after a genuine gap may still establish fresh context
 const r=createChoiceContext();r.ingest(msg({from:1,events:[{type:'activate',chain:1,code:100,player:0}],chain:[link(1,100)]}));
 const x=msg({from:9,events:[{type:'resolve',chain:1,code:100,player:0}],chain:[link(1,100)],prompt:card(),revision:3});r.ingest(x);
 assert.equal(r.state().trail.at(-1).continuous,false);assert.equal(H(r,x).text,'Resolving CL 1 · Sky Striker Ace - Kagari · choose 1 card from your GY');
});

test('(R67.1-2) reset and a view/mode/epoch change clear ALL bookkeeping: links, trail, conflicts and last reply',()=>{
 const r=createChoiceContext();r.ingest(msg({from:1,events:[{type:'resolve',chain:1,code:100,player:0},{type:'activate',chain:2,code:200,player:1}],chain:[link(1,100),link(2,200,1)],prompt:card(),revision:1}));
 r.noteOwnReply({rev:1,prompt:card(),response:{indicies:[0]},stage:'A',code:200,chain:2});
 assert.ok(r.state().trail.length&&r.state().conflicts.length);
 r.reset();let st=r.state();assert.deepEqual([st.trail,st.conflicts,st.links,st.resolving,st.activating,st.procedure],[[],[],[],null,null,null]);
 r.ingest(msg({from:1,events:[{type:'activate',chain:1,code:100,player:0}],chain:[link(1,100)],revision:1}));r.noteOwnReply({rev:1,prompt:card(),response:{},stage:'A',code:100,chain:1});
 r.ingest(msg({from:1,view:1,chain:[],revision:2}));st=r.state();assert.equal(st.trail.length,1,'only the new view’s own delivery');assert.deepEqual(st.conflicts,[]);
 // the new view's first prompt cannot inherit the old view's last answer
 // (old last answer: rev 1, stage A, Kagari CL1. Without the full reset, revision 2 here would wrongly continue it.)
 r.ingest(msg({from:2,view:1,events:[{type:'activate',chain:1,code:100,player:0}],chain:[link(1,100)],revision:5}));
 const z=msg({from:3,view:1,chain:[link(1,100)],prompt:card(),revision:2});r.ingest(z);assert.equal(r.state().activating?.code,100);assert.notEqual(r.classify(z).ctx,'A');
});

test('(R67.1-3) an offered effect is context O ("Effect choice"), and answering it never extends an older activation',()=>{
 const r=createChoiceContext();
 // CL1 Kagari is activating (its own target prompt), we answer it
 let x=msg({from:1,events:[{type:'effectChosen',code:100,player:0,option:false},{type:'activate',chain:1,code:100,player:0}],chain:[link(1,100)],prompt:card(),revision:10});r.ingest(x);
 assert.equal(r.classify(x).ctx,'A');
 // next prompt is a DIFFERENT card's offered Yes/No (same seat, revision+1)
 x=msg({from:3,chain:[link(1,100)],prompt:{type:T.SELECT_EFFECTYN,seat:0,player:0,code:200},revision:11});r.ingest(x);
 let c=r.classify(x);assert.equal(c.ctx,'O');assert.equal(H(r,x).text,'Effect choice · Sky Striker Ace - Roze · use this effect?');assert.equal(H(r,x).id,'A-SELECT_EFFECTYN-O');
 // we answer No to Roze's offer; the app records stage O with Roze's code
 r.noteOwnReply({rev:11,prompt:x.state.prompt,response:{yes:false},stage:'O',code:200,chain:null});
 x=msg({from:3,chain:[link(1,100)],prompt:card(),revision:12});r.ingest(x);
 assert.notEqual(r.classify(x).ctx,'A','No to a different offered card must not extend Kagari’s activation');assert.match(H(r,x).text,/^Source not verified/);
 // even a stage-A answer naming a different source does not extend this activation
 const q=createChoiceContext();let y=msg({from:1,events:[{type:'effectChosen',code:100,player:0,option:false},{type:'activate',chain:1,code:100,player:0}],chain:[link(1,100)],prompt:card(),revision:20});q.ingest(y);
 q.noteOwnReply({rev:20,prompt:card(),response:{},stage:'A',code:300,chain:2});y=msg({from:3,chain:[link(1,100)],prompt:card(),revision:21});q.ingest(y);assert.notEqual(q.classify(y).ctx,'A');
 // an offer while a link is proven resolving is still the resolving row
 const w=createChoiceContext();w.ingest(msg({from:1,events:[{type:'activate',chain:1,code:100,player:0}],chain:[link(1,100)]}));
 y=msg({from:2,events:[{type:'resolve',chain:1,code:100,player:0}],chain:[link(1,100)],prompt:{type:T.SELECT_EFFECTYN,seat:0,player:0,code:200},revision:3});w.ingest(y);
 assert.equal(H(w,y).text,'During CL 1 · Sky Striker Ace - Roze · use this effect?')/* r67.3-adapted: a different offered card during proven resolution is named as the offer (ChatGPT wording r1) */;
 // the offered row is an erratum kept apart from the 147-row matrix
 assert.equal(Object.keys(ERRATA_ROWS).length,1);assert.equal(ROWS['SELECT_EFFECTYN-O'],undefined);
});

test('(R67-14) wiring: worker eventSpan, raw ingest before presentation, grouped copies use the reducer, r62 line removed',()=>{
 const w=read('worker.mjs'),a=read('app.mjs');
 assert.match(w,/eventSpan=\{from:spanFrom,to:duel\.eventSeq,complete:/);assert.match(w,/lastEventId:deliveredSeq,eventSpan,/);
 const i=a.indexOf('choiceCtx.ingest(x,humanClientSession)'),p=a.indexOf('presentation.play((x.events');assert.ok(i>0&&p>i,'ingest happens before presentation.play');
 assert.ok(a.indexOf('choiceCtx.ingest(x,humanClientSession)')>a.indexOf('x.human.stateSeq<=humanStateSeq'),'after the admission checks');
 const cg=a.slice(a.indexOf('function copyGroups'),a.indexOf('function renderMulti'));assert.doesNotMatch(cg,/filter\(c=>!c\.solved\)/);assert.match(cg,/c0\.ctx!=='R'\|\|!c0\.proof/);
 assert.doesNotMatch(a,/ctx\.className='open-window-context'/);assert.match(a,/choiceCtx\.reset\(\);shell\?\.play\.reset\(\)/);
 assert.match(a,/noteReplyContext\(response\);choiceCtx\.noteOwnSent\(\{rev:state\.revision,prompt:state\.prompt,response\}\);worker\.postMessage\(\{type:'reply'/)/* r67.2-adapted: the sent-only attack hook sits between */;
});

/* ---------------- r67.2 (ChatGPT RELAY-234: own-attack header spec r1, menu readiness, reduced-motion load) ---------------- */
// C08 shape from the native fixture: BATTLECMD at rev 103 (phase 8, Battle Start), our Attack reply SENT, then rev 104 arrives
// with an empty, continuous span and a 1-of-1 SELECT_CARD over the opponent's Monster Zone cards.
const BCMD=(p={})=>({type:T.SELECT_BATTLECMD,seat:0,player:0,attacks:[{code:500,controller:0,location:4,sequence:2,can_direct:false},{code:500,controller:0,location:4,sequence:3,can_direct:false}],...p});
const ATK_REPLY={type:0,action:1,index:0};
const TGT=(p={})=>card({selects:[{code:600,controller:1,location:4,sequence:0},{code:0,controller:1,location:4,sequence:1,position:8}],...p});
const NAMES2={...NAMES,500:'Blazing Cartesia, the Virtuous',600:'Sky Striker Ace - Raye'};const nameOf2=c=>NAMES2[c]||'';
const HA=(r,x,o={})=>header(x.state.prompt,r.classify(x),{nameOf:nameOf2,view:x.view,phase:x.state.phase,...o});
function attackRun({sentReply=ATK_REPLY,send=true,second={},secondMsg}={}){const r=createChoiceContext();
 const b=msg({from:1,events:[{type:'phase',phase:8}],prompt:BCMD(),phase:8,revision:103});r.ingest(b);
 if(send)r.noteOwnSent({rev:103,prompt:b.state.prompt,response:sentReply});
 const x=secondMsg??msg({from:2,prompt:TGT(),phase:8,revision:104,...second});r.ingest(x);return {r,x}}

test('(R67.2-1) own attack, then the very next quiet prompt over opponent monsters: "Attack target · attacker · choose 1 monster"',()=>{
 const {r,x}=attackRun();const h=HA(r,x);assert.equal(r.classify(x).ctx,'ATK');
 assert.equal(h.text,'Attack target · Blazing Cartesia, the Virtuous · choose 1 monster');assert.equal(h.id,'A-SELECT_CARD-ATK');assert.equal(h.verified,true);
 assert.deepEqual(r.state().attackBound.attacker,{code:500,controller:0,location:4,sequence:2},'the physical attacker (index 0 → sequence 2), not just its code');
 // the same drawing re-delivered (empty span again, same revision) keeps it; the next decision does not
 r.ingest(msg({from:2,prompt:TGT(),phase:8,revision:104}));assert.equal(r.classify(x).ctx,'ATK');
 const y=msg({from:2,prompt:BCMD(),phase:8,revision:105});r.ingest(y);assert.equal(r.state().attackBound,null);
 // a face-down opposing target is never looked up or named: the header names only the attacker
 assert.doesNotMatch(h.text,/Raye|face-down/);
 // the second copy (index 1) is recorded as its own physical card
 const q=attackRun({sentReply:{type:0,action:1,index:1}});assert.equal(q.r.state().attackBound.attacker.sequence,3);
});

test('(R67.2-2) no proof, no attack header: every broken link in the chain of proof falls back to "Source not verified"',()=>{
 const cases={
  'reply only queued, never sent':{send:false},
  'not an Attack (Main Phase 2)':{sentReply:{type:0,action:2,index:null}},
  'index outside the attack list':{sentReply:{type:0,action:1,index:9}},
  'wrong reply code':{sentReply:{type:5,action:1,index:0}},
  'something happened in between (an effect activated)':{second:{events:[{type:'activate',chain:1,code:777,player:1}],chain:[link(1,777,1)]}},
  'attacker moved before the choice':{second:{events:[{type:'move',code:500}]}},
  'revision skipped':{second:{revision:105}},
  'different seat chooses':{second:{prompt:TGT({seat:1,player:1,selects:[{code:500,controller:0,location:4,sequence:2}]})}},
  'own monsters as candidates (not an attack target)':{second:{prompt:TGT({selects:[{code:500,controller:0,location:4,sequence:2}]})}},
  'a Graveyard choice during battle (cost/effect, not an attack target)':{second:{prompt:card()}},
  'choose 1-2 (not a single attack target)':{second:{prompt:TGT({max:2})}},
  'not a battle phase':{second:{phase:4}},
  'history gap':{second:{from:9}},
  'incomplete span':{second:{complete:false}},
  'view changed':{second:{view:1}}};
 for(const [why,o] of Object.entries(cases)){const {r,x}=attackRun(o);const h=HA(r,x);assert.notEqual(r.classify(x).ctx,'ATK',why);assert.doesNotMatch(h.text,/^Attack target/,why)}
 // invalid event list (out of span)
 {const r=createChoiceContext();const b=msg({from:1,prompt:BCMD(),phase:8,revision:103});r.ingest(b);r.noteOwnSent({rev:103,prompt:b.state.prompt,response:ATK_REPLY});
  const x={...msg({from:2,prompt:TGT(),phase:8,revision:104}),events:[{id:99,type:'move'}]};r.ingest(x);assert.notEqual(r.classify(x).ctx,'ATK')}
 // reset between the reply and the prompt (new duel / rewind)
 {const r=createChoiceContext();const b=msg({from:1,prompt:BCMD(),phase:8,revision:103});r.ingest(b);r.noteOwnSent({rev:103,prompt:b.state.prompt,response:ATK_REPLY});r.reset();
  const x=msg({from:1,prompt:TGT(),phase:8,revision:104});r.ingest(x);assert.notEqual(r.classify(x).ctx,'ATK')}
 // attack cancelled at the target choice, then a later attack: only a NEW sent attack proves the new target prompt
 {const {r}=attackRun();const back=msg({from:2,prompt:BCMD(),phase:8,revision:105});r.ingest(back);
  const t2=msg({from:2,prompt:TGT(),phase:8,revision:106});r.ingest(t2);assert.notEqual(r.classify(t2).ctx,'ATK','no carry-over by code alone')}
 // attacker name unknown: fallback, never a generic stand-in such as "Card effect"
 {const {r,x}=attackRun();const h=header(x.state.prompt,r.classify(x),{nameOf:()=>'',view:0,phase:8});assert.equal(h.text,'Source not verified · choose 1 card');assert.equal(h.verified,false)}
});

test('(R67.2-3) proven resolving/activating context wins over a pending attack association',()=>{
 // an attack prompt cannot be both; but if a resolving link is proven, R is used and the attack row is not
 const r=createChoiceContext();r.ingest(msg({from:1,events:[{type:'activate',chain:1,code:100,player:0}],chain:[link(1,100)],phase:8,revision:102}));
 const b=msg({from:2,events:[{type:'resolve',chain:1,code:100,player:0}],chain:[link(1,100)],prompt:BCMD(),phase:8,revision:103});r.ingest(b);r.noteOwnSent({rev:103,prompt:b.state.prompt,response:ATK_REPLY});
 const x=msg({from:3,chain:[link(1,100)],prompt:TGT(),phase:8,revision:104});r.ingest(x);assert.equal(r.classify(x).ctx,'R');
 assert.equal(Object.keys(ATTACK_ROWS).length,1);assert.equal(ROWS['SELECT_CARD-ATK'],undefined);assert.equal(ERRATA_ROWS['SELECT_CARD-ATK'],undefined);
});

test('(R67.2-4) wiring: the attack hook runs only where a reply is actually SENT; the reply code matches the engine',async()=>{
 const a=read('app.mjs');const n=a.split('choiceCtx.noteOwnSent(').length-1;assert.equal(n,2,'direct send and drained queue');
 assert.match(a,/stage:'sent',ok:true,route:'drain'[^;]*\);choiceCtx\.noteOwnSent\(/);assert.match(a,/stage:'sent',ok:true,rev:state\.revision\}\);noteReplyContext\(response\);choiceCtx\.noteOwnSent\(/);
 const q=a.slice(a.indexOf("stage:'queued'")-400,a.indexOf("stage:'queued'"));assert.doesNotMatch(q,/noteOwnSent/,'never at the queued point');
 const {R,M}=await import('../dist/duel.mjs');const c=read('choice-context.mjs');assert.equal(R.SELECT_BATTLECMD,0);assert.equal(M.SELECT_BATTLECMD,10);assert.match(c,/R_SELECT_BATTLECMD=0/);
});

test('(R67.2-5) card menu readiness guard and reduced-motion load order',()=>{
 const f=read('play-flow.mjs');assert.match(f,/function arm\(\)\{const g=\+\+menuGen;menuReady=false/);
 assert.match(f,/b\.onclick=\(\)=>\{if\(!live\(b\.__gen\)\)return;/);assert.match(f,/yes\.onclick=\(\)=>\{if\(!live\(yes\.__gen\)\)return;/);
 assert.match(f,/cancel\.onclick=close;/,'Close is never guarded');assert.match(f,/e\.key==='Escape'\)close\(\)/);
 assert.match(f,/const close=\(\)=>\{[^}]*menuGen\+\+;menuReady=false/,'closing invalidates every button of that opening');
 const a=read('app.mjs');const decl=a.indexOf('let renderGen=0,tokenSerial=0,liveToken=null');const first=a.search(/\napplyPreferences\(\)|[;}]applyPreferences\(\);/);
 assert.ok(decl>0&&decl<a.indexOf('function applyPreferences'),'liveToken is declared before applyPreferences can run (reduced-motion load crash, r66–r67.1)');
});

/* ---------------- r67.3 (ChatGPT RELAY-236 review + replay-and-effect-offer-wording-r1) ---------------- */
test('(R67.3-1) the attack association is settled by EVERY delivery, early returns included (RELAY-236 counterexample)',()=>{
 // ChatGPT: attack sent at rev103 after span 1..1; an overlapping span 1..2 (attacker move id 2) used to keep the pending intent,
 // so the next quiet span 3..2 at rev104 bound it and showed a verified attack header.
 {const r=createChoiceContext();const b=msg({from:1,events:[{type:'phase',phase:8}],prompt:BCMD(),phase:8,revision:103});r.ingest(b);r.noteOwnSent({rev:103,prompt:b.state.prompt,response:ATK_REPLY});
  const o={...msg({from:1,phase:8,revision:103}),events:[{id:1,type:'phase',phase:8},{id:2,type:'move',code:500}]};o.eventSpan={from:1,to:2,complete:true};r.ingest(o);
  assert.equal(r.state().attack,null,'overlap drops the pending intent');
  const x=msg({from:3,prompt:TGT(),phase:8,revision:104});r.ingest(x);assert.notEqual(r.classify(x).ctx,'ATK');assert.doesNotMatch(HA(r,x).text,/^Attack target/)}
 // a pure re-send of the battle prompt before the target prompt: the reply may not have been taken; drop the intent
 {const r=createChoiceContext();const b=msg({from:1,events:[{type:'phase',phase:8}],prompt:BCMD(),phase:8,revision:103});r.ingest(b);r.noteOwnSent({rev:103,prompt:b.state.prompt,response:ATK_REPLY});
  r.ingest(msg({from:1,events:[{type:'phase',phase:8}],prompt:BCMD(),phase:8,revision:103}));assert.equal(r.state().attack,null);
  const x=msg({from:2,prompt:TGT(),phase:8,revision:104});r.ingest(x);assert.notEqual(r.classify(x).ctx,'ATK')}
 // an overlap AFTER binding drops the bound association too; a pure re-send of the same target prompt keeps it
 {const {r,x}=attackRun();r.ingest(msg({from:2,prompt:TGT(),phase:8,revision:104}));assert.equal(r.classify(x).ctx,'ATK','same drawing re-sent');
  const o={...msg({from:1,prompt:TGT(),phase:8,revision:104}),events:[{id:1,type:'phase',phase:8}]};o.eventSpan={from:1,to:2,complete:true};r.ingest(o);assert.equal(r.state().attackBound,null);assert.notEqual(r.classify(x).ctx,'ATK')}
});

test('(R67.3-2) attack target candidates must be EXACTLY the opposing player\'s monsters; malformed seat/player/controller fails',()=>{
 const bad={
  'candidate controller missing':{second:{prompt:TGT({selects:[{code:600,location:4,sequence:0}]})}},
  'candidate controller invalid (2)':{second:{prompt:TGT({selects:[{code:600,controller:2,location:4,sequence:0}]})}},
  'prompt player missing':{second:{prompt:TGT({player:undefined})}},
  // ChatGPT: seat 0 / player 1 with an own (controller 0) candidate used to pass because 0 !== 1
  'seat 0 but engine player 1 (attacker belonged to player 0)':{second:{prompt:TGT({player:1,selects:[{code:600,controller:0,location:4,sequence:0}]})}}};
 for(const [why,o] of Object.entries(bad)){const {r,x}=attackRun(o);assert.notEqual(r.classify(x).ctx,'ATK',why)}
 // capture side: an attack entry whose controller is not the chooser's engine player is never recorded
 const r=createChoiceContext();const b=msg({from:1,prompt:BCMD({attacks:[{code:500,controller:1,location:4,sequence:2}]}),phase:8,revision:103});r.ingest(b);
 r.noteOwnSent({rev:103,prompt:b.state.prompt,response:ATK_REPLY});assert.equal(r.state().attack,null);
 // and the ordinary C08 shape still passes
 const ok=attackRun();assert.equal(ok.r.classify(ok.x).ctx,'ATK');
});

test('(R67.3-3) native C05 shape: a Yes/No naming a DIFFERENT card while CL1 resolves reads "During CL 1 · offered card"',()=>{
 const N={...NAMES,700:'The Fallen & The Virtuous',800:'Toon Bookmark'};const nm=c=>N[c]||'';
 const run=(offer,{name=nm}={})=>{const r=createChoiceContext();r.ingest(msg({from:1,events:[{type:'activate',chain:1,code:700,player:1}],chain:[link(1,700,1)],revision:30}));
  const x=msg({from:2,events:[{type:'resolve',chain:1,code:700,player:1}],chain:[link(1,700,1)],prompt:{type:T.SELECT_EFFECTYN,seat:0,player:0,code:offer},revision:31});r.ingest(x);
  return {c:r.classify(x),h:header(x.state.prompt,r.classify(x),{nameOf:name,view:0,phase:4})}};
 let {c,h}=run(800);assert.equal(c.ctx,'RO');assert.equal(h.id,'A-SELECT_EFFECTYN-RO');assert.equal(h.text,'During CL 1 · Toon Bookmark · use this effect?');assert.equal(h.verified,true);
 // offered name unknown: the proven link stays, the card is not guessed
 ({h}=run(800,{name:c=>c===700?'The Fallen & The Virtuous':''}));assert.equal(h.text,'Resolving CL 1 · effect choice');assert.equal(h.verified,false);
 // same card as the resolving link: the existing R row
 ({c,h}=run(700));assert.equal(c.ctx,'R');assert.equal(h.text,'Resolving CL 1 · The Fallen & The Virtuous · use this effect?');
 // no proven resolution: the offer is context O, never "During CL"
 const r=createChoiceContext();const x=msg({from:1,chain:[link(1,700,1)],prompt:{type:T.SELECT_EFFECTYN,seat:0,player:0,code:800},revision:5});r.ingest(x);
 assert.equal(r.classify(x).ctx,'O');assert.doesNotMatch(header(x.state.prompt,r.classify(x),{nameOf:nm,view:0,phase:4}).text,/^During CL/);
 assert.equal(Object.keys(OFFER_ROWS).length,1);assert.equal(ROWS['SELECT_EFFECTYN-RO'],undefined);
});

test('(R67.3-4) menu readiness: every release requires the menu to be really visible; the time cap finishes the entrance first',()=>{
 const f=read('play-flow.mjs');
 assert.match(f,/const release=\(\)=>\{if\(g===menuGen&&!menu\.hidden&&menuVisible\(\)/,'immediate, finished, cancelled and capped paths all check visibility');
 assert.match(f,/for\(const a of anims\)\{try\{if\(a\.playState!=='finished'\)a\.finish\(\)\}catch\{\}\}\s*if\(menuVisible\(\)\)release\(\)/,'at the cap: finish this opening\'s entrance, then check');
 assert.match(f,/function menuVisible\(\)\{if\(menu\.hidden\|\|!menu\.getClientRects\(\)\.length\)return false;[^}]*\+cs\.opacity<\.95\)return false\}return true\}/);
 assert.doesNotMatch(f,/READY_FALLBACK_MS=600/,'no flat time-based release');
});

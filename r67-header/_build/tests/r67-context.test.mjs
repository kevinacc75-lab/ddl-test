// r67 choice header + context reducer (ChatGPT RELAY-226 wording spec r1 and matrix; r67-resolving-context-review-r1).
// Wording authored by ChatGPT; code and tests by Claude; self-checked by Claude, pending Seto team.
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {createChoiceContext,header,ROWS,PROMPT_TYPES,CONTEXTS,TYPE_NAME,fill,values} from '../dist/choice-context.mjs';
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
 r.noteOwnReply({rev:21,prompt:x.state.prompt,response:{indicies:[0]},stage:'A'});x=msg({from:3,events:[{type:'move'}],chain:[link(1,100)],prompt:card(),revision:22});r.ingest(x);assert.equal(r.classify(x).ctx,'A');
 // somebody else decided in between (revision jumped): not this activation any more
 r.noteOwnReply({rev:22,prompt:x.state.prompt,response:{indicies:[0]},stage:'A'});x=msg({from:4,chain:[link(1,100)],prompt:card(),revision:25});r.ingest(x);assert.notEqual(r.classify(x).ctx,'A');
 // priority returned (a response window): the activation is over
 const q=createChoiceContext();q.ingest(msg({from:1,events:[{type:'effectChosen',code:100,player:0,option:false},{type:'activate',chain:1,code:100,player:0}],chain:[link(1,100)],prompt:{type:T.SELECT_CHAIN,seat:0,player:0,selects:[{code:200}]},revision:5}));assert.equal(q.state().activating,null);
 // a trigger's own Yes/No names its own card, never the activation before it
 const w=createChoiceContext(),y=msg({from:1,events:[{type:'effectChosen',code:100,player:0,option:false},{type:'activate',chain:1,code:100,player:0}],chain:[link(1,100)],prompt:{type:T.SELECT_EFFECTYN,seat:0,player:0,code:200},revision:8});w.ingest(y);assert.equal(H(w,y).text,'Activating · Sky Striker Ace - Roze · use this effect?');
});

test('(R67-14) wiring: worker eventSpan, raw ingest before presentation, grouped copies use the reducer, r62 line removed',()=>{
 const w=read('worker.mjs'),a=read('app.mjs');
 assert.match(w,/eventSpan=\{from:spanFrom,to:duel\.eventSeq,complete:/);assert.match(w,/lastEventId:deliveredSeq,eventSpan,/);
 const i=a.indexOf('choiceCtx.ingest(x,humanClientSession)'),p=a.indexOf('presentation.play((x.events');assert.ok(i>0&&p>i,'ingest happens before presentation.play');
 assert.ok(a.indexOf('choiceCtx.ingest(x,humanClientSession)')>a.indexOf('x.human.stateSeq<=humanStateSeq'),'after the admission checks');
 const cg=a.slice(a.indexOf('function copyGroups'),a.indexOf('function renderMulti'));assert.doesNotMatch(cg,/filter\(c=>!c\.solved\)/);assert.match(cg,/c0\.ctx!=='R'\|\|!c0\.proof/);
 assert.doesNotMatch(a,/ctx\.className='open-window-context'/);assert.match(a,/choiceCtx\.reset\(\);shell\?\.play\.reset\(\)/);
 assert.match(a,/noteReplyContext\(response\);worker\.postMessage\(\{type:'reply'/);
});

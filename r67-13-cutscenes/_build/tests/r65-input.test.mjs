// r65 (Claude, 15 Nov 2026): ChatGPT RELAY-220 (review of r63). Input identity issued after the controls exist and bound
// to the submitting surface (MED-R63-1); the quick bar and Space are manual answers with their own surface, configured
// passes are automatic with a reason (MED-R63-2); grouped copies keyed by passcode, tied to the resolving link and the
// choosing player, with a "Show each copy" control (MED-R63-3). Behaviour in a browser: tools/browser/route-check.cjs v3
// and tools/browser/group-check.cjs (EXPAND=1).
import assert from 'node:assert/strict';
import {createChoiceContext} from '../dist/choice-context.mjs';/* r67 */
import {test} from 'node:test';
import fs from 'node:fs';
const read=f=>fs.readFileSync(new URL('../dist/'+f,import.meta.url),'utf8');
const fnSrc=(a,name)=>{const i=a.indexOf('function '+name+'(');assert.ok(i>=0,name);const j=a.indexOf('\nfunction ',i+10);return a.slice(i,j)};
test('(R65-1, r66) a token is issued before drawing, the controls are drawn with it, then it goes live and is published',()=>{
 const a=read('app.mjs'),r=fnSrc(a,'renderDecision');
 const clear=r.indexOf('clearRendered();'),issue=r.indexOf('const tok=issueToken();drawToken=tok;'),body=r.indexOf('renderDecisionBody(x);'),mark=r.indexOf('markRendered(tok);updatePhaseControls();'),evt=r.indexOf("new CustomEvent('duel-human-decision'");
 assert.ok(clear>=0&&clear<issue&&issue<body&&body<mark&&mark<evt,'clear → issue → draw → mark live → rebind phase buttons → publish');
 assert.match(r,/&&\$\('#choices'\)\.querySelector\('button:not\(\[disabled\]\),input:not\(\[disabled\]\),select'\)\)markRendered\(tok\);/,'live only when the prompt has an active control');
 assert.match(a,/function issueToken\(\)\{const id=\+\+tokenSerial;return Object\.freeze\(\{id,session:humanClientSession,key:humanFlow\.current\?\.key\?\?null,rev:state\?\.revision\?\?null,gen:id\}\)\}/,'immutable');
 assert.match(fnSrc(a,'markRendered'),/renderGen=tok\.gen;liveToken=tok;/);assert.match(fnSrc(a,'clearRendered'),/rendered=null;liveToken=null;/);
});
test('(R65-2, r66) reply: token by identity, stated origin, known automatic policies only, input id; audit stages',()=>{
 const a=read('app.mjs'),r=fnSrc(a,'reply');
 assert.match(r,/^function reply\(response,origin=null,tok=null\)\{/);
 for(const w of ["why='no answer token'","why='token from another drawing of the prompt (token '","why='not the rendered prompt'","why='manual answer without a user input'","why='automatic answer without a stated policy'","why='unknown automatic policy '","why='automatic answer for another prompt'"])assert.ok(r.includes(w),w);
 assert.match(r,/else if\(tok!==liveToken\)why=/,'identity, not equal fields');
 assert.match(a,/const AUTO_POLICIES=new Set\(\['empty-window-skip','chain-pass','auto-place'\]\);/);
 const att=r.indexOf("stage:'attempted'"),ref=r.indexOf("stage:'refused',ok:false,why}");assert.ok(ref>0&&ref<att,'refusals are audited before any attempt is recorded');
 for(const st of ["stage:'queued'","stage:'not-sent'","stage:'sent'"])assert.ok(r.includes(st),st);
 assert.match(r,/pendingReplyId=id;pendingReplyToken=tok\?\.id\?\?null;/,'the token id stays with a queued answer');
 assert.match(fnSrc(a,'drainHumanChoice'),/auditReply\(\{id:pendingReplyId,stage:'sent',ok:true,route:'drain',token:pendingReplyToken,rev:msg\.revision\}\);/);
 assert.doesNotMatch(r,/postMessage\(\{type:'reply',[^}]*(audit|token)/,'worker messages are unchanged');
});
test('(R65-3) replySurface reads the event path: Space outside the sheet is the quick bar; menus and the sheet are their own surfaces',()=>{
 const a=read('app.mjs');const src=fnSrc(a,'replySurface');
 const mk=(id,parent=null,ds={})=>({nodeType:1,id,parent,dataset:ds,matches(sel){return sel.split(',').some(s=>s.trim()==='#'+id||(s.trim()==='[data-slot]'&&'slot' in ds))},closest(sel){for(let n=this;n;n=n.parent)if(n.matches(sel))return n;return null}});
 const bar=mk('pc-bar',null,{gen:'7'}),choices=mk('choices',null,{gen:'7'}),menu=mk('card-action-menu');
 const run=(e,qs={})=>{const window={event:e},document={querySelector:q=>qs[q]||null};return new Function('window','document','return ('+src+')()')(window,document)};
 const ev=(type,code,path)=>({type,code,composedPath:()=>[...path,{nodeType:9}]});
 assert.deepEqual(run(ev('keydown','Space',[]),{'#pc-bar':bar}),{kind:'quick-bar/Space',gen:7,type:'keydown'});
 assert.equal(run(ev('keydown','Space',[choices])).kind,'sheet','Space inside the sheet is not the quick bar');
 assert.equal(run(ev('click',null,[bar])).kind,'quick-bar');assert.equal(run(ev('click',null,[bar])).gen,7);
 assert.equal(run(ev('click',null,[choices])).kind,'sheet');
 assert.equal(run(ev('click',null,[menu])).kind,'card-menu');assert.equal(run(ev('click',null,[menu])).gen,undefined,'menus have no generation (they close themselves)');
 assert.equal(run(ev('click',null,[mk('somewhere')])).kind,'other');
 assert.equal(run(undefined).kind,'none','no user event');
});
test('(R65-4) grouped copies: acceptance matrix (passcode allowlist, resolving link, choosing player, defined controllers)',()=>{
 const a=read('app.mjs');const src=fnSrc(a,'copyGroups');
 const M={SELECT_CARD:15};/* r67-adapted: copyGroups now takes the resolving link from the context reducer (ChatGPT r67 review §8). Each chain below is
    played as events: every link activates in order, then links resolve from the top; a link marked solved also completes.
    The resolving link is the first unsolved one from the top, exactly as before, but now it must be PROVED by a resolve event. */
 const run=(m,cards,chain)=>{const ctx=createChoiceContext(),events=[];chain.forEach((c,i)=>events.push({type:'activate',chain:i+1,code:c.code,player:c.controller}));
  for(let i=chain.length;i>=1;i--){const c=chain[i-1];events.push({type:'resolve',chain:i,code:c.code,player:c.controller});if(c.solved)events.push({type:'resolutionReady',chain:i});else break}events.forEach((e,i)=>e.id=i+1);
  const prompt={...m,selects:cards},x={eventSpan:{from:1,to:events.length,complete:true},events,state:{chain:chain.map((c,i)=>({chain_size:i+1,code:c.code,controller:c.controller,solved:!!c.solved})),prompt}};ctx.ingest(x);
  return new Function('M','state','GROUP_SEARCH_ALLOW','choiceCtx','latestDecisionMessage','return ('+src+')')(M,x.state,new Map([[63166095,'Engage'],[32807846,'RotA']]),ctx,x)(prompt,cards)};
 const roze=37351133,raye=26077387,engage={code:63166095,controller:0},rota={code:32807846,controller:0};
 const deck=(code,seq,ctl=0)=>({code,controller:ctl,location:1,sequence:seq,position:8});
 const cards=[deck(roze,34),deck(raye,25),deck(roze,12),deck(raye,5)],m={type:15,min:1,max:1,player:0,seat:0};
 assert.deepEqual(run(m,cards,[rota]),[[0,2],[1,3]],'happy path: lowest original index represents its group');
 assert.deepEqual(run(m,cards,[engage,{code:1,controller:1,solved:true}]),[[0,2],[1,3]],'a solved link above is skipped: the resolving link counts');
 assert.equal(run(m,cards,[{code:12345678,controller:0}]),null,'effect not on the allowlist');
 assert.equal(run(m,cards,[]),null,'no chain');
 assert.equal(run(m,cards,[{...engage,controller:1}]),null,"the resolving link is the other player's");
 assert.equal(run({...m,player:undefined},cards,[engage]),null,'choosing player unknown');
 assert.equal(run(m,[...cards.slice(0,3),{...deck(raye,5),controller:undefined}],[engage]),null,'a controller is undefined');
 assert.equal(run(m,[...cards.slice(0,3),deck(raye,5,1)],[engage]),null,'a card belongs to the other player');
 assert.equal(run({...m,player:1,seat:0},cards,[engage]),null,"cards are not the choosing player's");
 assert.equal(run(m,[...cards.slice(0,3),deck(raye,34)],[engage]),null,'two references to one physical card');
 assert.equal(run(m,[...cards.slice(0,3),{...deck(raye,5),location:16}],[engage]),null,'not in the Deck');
 assert.equal(run({...m,max:2},cards,[engage]),null,'more than one card to choose');
 assert.equal(run({...m,type:20},cards,[engage]),null,'not a card selection');
 assert.equal(run(m,[deck(roze,34),deck(raye,25)],[engage]),null,'nothing to group');
});
test('(R65-5, r66) copies toggle: next to the count, scoped to the full prompt key, single-replace in both views, distinct labels',()=>{
 const a=read('app.mjs'),css=read('css/r62-events.css');
 assert.match(a,/copiesToggle\.id='copies-toggle';copiesToggle\.className='quiet';copiesToggle\.hidden=true;\$\('#selection-info'\)\?\.after\(copiesToggle\);/);
 assert.match(a,/expanded=!!groups&&ungroupKey!=null&&ungroupKey===promptKey;/,'scoped to humanFlow key (session, epoch, token, revision, structure)');
 assert.match(a,/const i=Number\(n\.dataset\.select\);const had=selected\.has\(i\);selected\.clear\(\);if\(!had\)selected\.add\(i\);sync\(\)/,'one rule for both views: a press replaces');
 assert.match(a,/copy=expanded&&o\.n>1\?` — copy \$\{o\.k\} of \$\{o\.n\}`:''/);
 assert.match(a,/role="button" tabindex="0" aria-label="Inspect \$\{esc\(nm\)\}\$\{copy\}"/);
 assert.match(a,/const wasLive=!!rendered;drawToken=issueToken\(\);renderMulti\(m\);if\(wasLive\)markRendered\(drawToken\);/,'expanding issues a new token');
 assert.match(a,/if\(was!=null\)\{const g=groups\.find\(g=>g\.includes\(was\)\);if\(g\)selected\.add\(expanded\?g\[0\]:was\)\}/,'the chosen card survives the switch');
 assert.match(a,/m\.type===M\.SELECT_CARD&&m\.max===1&&!selected\.has\(i\)\)\{selected\.clear\(\);/,'every one-card choice replaces');
 assert.match(css,/#copies-toggle\{[^}]*min-height:44px/);
});
test('(R65.1-1) landscape: the resolving-scene panel steps aside while YOUR decision sheet is open; phone/rail: Close stays pinned',()=>{
 const css=read('css/r62-events.css');
 assert.match(css,/body\.in-duel\.tablet-stage:not\(\.portrait-overview\)\[data-pc-play="1"\]:not\(\[data-decider=ai\]\):has\(#duel:not\(\[data-screen=field\]\)\):not\(#_\):not\(#_\):not\(#_\) #event-stage\[data-spotlight=true\]\{display:none!important\}/);
 assert.match(css,/:not\(#_\):not\(#_\):not\(#_\):not\(#_\) #duel:not\(\[data-screen=field\]\) \.decision-column button\.pane-close\{position:sticky!important;top:0!important;/);
 assert.doesNotMatch(css,/url\(|@import/i);
});

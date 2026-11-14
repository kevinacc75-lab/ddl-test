// r65 (Claude, 15 Nov 2026): ChatGPT RELAY-220 (review of r63). Input identity issued after the controls exist and bound
// to the submitting surface (MED-R63-1); the quick bar and Space are manual answers with their own surface, configured
// passes are automatic with a reason (MED-R63-2); grouped copies keyed by passcode, tied to the resolving link and the
// choosing player, with a "Show each copy" control (MED-R63-3). Behaviour in a browser: tools/browser/route-check.cjs v3
// and tools/browser/group-check.cjs (EXPAND=1).
import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs';
const read=f=>fs.readFileSync(new URL('../dist/'+f,import.meta.url),'utf8');
const fnSrc=(a,name)=>{const i=a.indexOf('function '+name+'(');assert.ok(i>=0,name);const j=a.indexOf('\nfunction ',i+10);return a.slice(i,j)};
test('(R65-1) the identity is cleared when drawing starts and issued only after the controls exist, then published',()=>{
 const a=read('app.mjs'),r=fnSrc(a,'renderDecision');
 const clear=r.indexOf('clearRendered();'),body=r.indexOf('renderDecisionBody(x);'),mark=r.indexOf('markRendered();'),evt=r.indexOf("new CustomEvent('duel-human-decision'");
 assert.ok(clear>=0&&clear<body&&body<mark&&mark<evt,'clear → draw → mark → publish');
 assert.match(r,/&&\$\('#choices'\)\.querySelector\('button:not\(\[disabled\]\),input:not\(\[disabled\]\),select'\)\)markRendered\(\);/,'only when the prompt has an active control');
 assert.match(a,/const SURFACES=\['#choices','#selection-bar','#phase-tracker','#pc-bar'\];/);
 assert.match(fnSrc(a,'markRendered'),/gen:\+\+renderGen\};.*n\.dataset\.gen=String\(rendered\.gen\)/s,'each render stamps a new generation on every submitting surface');
 assert.match(fnSrc(a,'clearRendered'),/delete n\.dataset\.gen/);
});
test('(R65-2) every answer has an id and audit stages; manual answers need a user event on a known, current surface',()=>{
 const a=read('app.mjs'),r=fnSrc(a,'reply');
 assert.match(r,/^function reply\(response,automatic=false\)\{const id=\+\+replySerial,surf=replySurface\(\);/);
 assert.match(r,/const quick=automatic==='addon'&&\(surf\.kind==='quick-bar'\|\|surf\.kind==='quick-bar\/Space'\);const manual=!automatic\|\|quick;/,'the quick bar and Space are manual');
 assert.match(r,/automatic==='addon'\?'automatic:addon\('\+\(surf\.type\|\|'no event'\)\+'\)':'automatic:empty-window-skip'/,'automatic answers carry their reason');
 for(const w of ["why='manual answer without a user event'","why='manual answer from an unknown surface'","why='surface from another prompt (generation '","why='not the rendered prompt'"])assert.ok(r.includes(w),w);
 const att=r.indexOf("stage:'attempted'"),ref=r.indexOf("stage:'refused',ok:false,why}");assert.ok(ref>0&&ref<att,'refusals are audited before any attempt is recorded');
 for(const st of ["stage:'queued'","stage:'not-sent'","stage:'sent'"])assert.ok(r.includes(st),st);
 assert.match(fnSrc(a,'drainHumanChoice'),/auditReply\(\{id:pendingReplyId,stage:'sent',ok:true,route:'drain',rev:msg\.revision\}\);pendingReplyId=null;worker\?\.postMessage\(msg\)/);
 assert.doesNotMatch(r,/postMessage\(\{type:'reply',[^}]*audit/,'worker messages are unchanged');
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
 const M={SELECT_CARD:15};const run=(m,cards,chain)=>new Function('M','state','GROUP_SEARCH_ALLOW','return ('+src+')')(M,{chain},new Map([[63166095,'Engage'],[32807846,'RotA']]))(m,cards);
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
test('(R65-5) "Show each copy" lists every card by its original index for that prompt only',()=>{
 const a=read('app.mjs'),css=read('css/r62-events.css');
 assert.match(a,/const groups=ungroupRev===state\?\.revision\?null:copyGroups\(m,cards\);/);
 assert.match(a,/<button type="button" class="quiet choice-show-copies" data-show-copies>Show each copy<\/button>/);
 assert.match(a,/if\(e\.target\.closest\?\.\('\[data-show-copies\]'\)\)\{ungroupRev=state\?\.revision\?\?null;selected\.clear\(\);renderMulti\(m\);return\}/);
 assert.match(css,/#choices \.choice-show-copies\{[^}]*min-height:44px/);
});
test('(R65.1-1) landscape: the resolving-scene panel steps aside while YOUR decision sheet is open; phone/rail: Close stays pinned',()=>{
 const css=read('css/r62-events.css');
 assert.match(css,/body\.in-duel\.tablet-stage:not\(\.portrait-overview\)\[data-pc-play="1"\]:not\(\[data-decider=ai\]\):has\(#duel:not\(\[data-screen=field\]\)\):not\(#_\):not\(#_\):not\(#_\) #event-stage\[data-spotlight=true\]\{display:none!important\}/);
 assert.match(css,/:not\(#_\):not\(#_\):not\(#_\):not\(#_\) #duel:not\(\[data-screen=field\]\) \.decision-column button\.pane-close\{position:sticky!important;top:0!important;/);
 assert.doesNotMatch(css,/url\(|@import/i);
});

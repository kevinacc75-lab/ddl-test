// r66 (Claude, 15 Nov 2026): ChatGPT RELAY-224 MED-R65-1/2/3 and §5. Source checks here; behaviour in a browser by
// tools/browser/route-check.cjs v4 (causal input ids, lossless audit) and tools/browser/fixtures66.cjs (F1 stale handler
// after a same-key redraw, F2 stale card menu, F3 expanded copies through to the accepted next state).
import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs';
const read=f=>fs.readFileSync(new URL('../dist/'+f,import.meta.url),'utf8');
test('(R66-1) every control drawn for a prompt submits with that drawing\'s token; phase buttons are rebound after it goes live',()=>{
 const a=read('app.mjs');
 for(const f of ['renderDecisionBody','renderCoinCall','renderChainPrompt','renderOrder','renderMulti']){const i=a.indexOf('\nfunction '+f+'(');const body=a.slice(i,a.indexOf('\nfunction ',i+10)).replace(/\/\*[^]*?\*\//g,'');/* comments out */
  assert.match(body,/\{const tok=drawToken;/,f);const calls=[...body.matchAll(/(?<![A-Za-z_.])reply\(/g)].length;assert.ok(calls>0,f);assert.equal([...body.matchAll(/,null,tok\)/g)].length,calls,f+': every reply passes tok')}
 assert.match(a,/function updatePhaseControls\(\)\{const tok=liveToken;/);assert.match(a,/reply\(choice\.response,null,tok\)/);
});
test('(R66-2) menus: the pile menu passes the token from when it opened; the card menu (play-flow.mjs unchanged) uses an observer; a stale card menu closes',()=>{
 const a=read('app.mjs'),pg=read('pile-glow.mjs'),sh=read('app-shell.mjs');
 assert.match(pg,/m\._from=n;menuKey=windowKey\(latest\);menuTok=getToken\(\);/);assert.match(pg,/close\(\);submit\?\.\(a\.choice\.response,menuTok,'pile-menu'\)/);
 assert.match(sh,/installPileGlow\(\{navigate,submit,getDecision,getToken,getDb\}\)/);assert.match(sh,/installPlayFlow\(\{preferences,save:applyPreferences,getDecision,submit,/,'play-flow keeps its pinned interface');
 assert.match(a,/new MutationObserver\(\(\)=>\{if\(!m\.hidden&&m\.childElementCount\)cardMenuTok=liveToken;else if\(m\.hidden\)cardMenuTok=null\}\)/);
 assert.match(a,/t!==undefined\?t:inMenu\?cardMenuTok:liveToken\)/);
 assert.match(a,/if\(cardMenuTok&&!\$\('#card-action-menu'\)\?\.hidden\)shell\?\.play\.close\?\.\(\);/);
});
test('(R66-3) the quick bar and the automatic policies state their origin once; retries reuse it',()=>{
 const p=read('play-comfort.mjs');
 assert.match(p,/const passNow=e=>\{[^\n]*send\(c\.pass\.response,k,\{manual:'quick-bar',inputId:typeof e\?\.__ddlInputId==='number'\?e\.__ddlInputId:null,inputType:e\?\.type\?\?null\}\)\};/);
 assert.match(p,/send\(ch\.pass\.response,cur\.key,\{auto:'chain-pass',setting:\{chain:prefs\.chain\}/);
 assert.match(p,/send\(p\.response,cur\.key,\{auto:'auto-place',setting:\{autoPlace:true\}/);
 assert.match(read('app.mjs'),/reply\(\{type:R\.SELECT_CHAIN,index:null\},\{auto:'empty-window-skip',setting:\{autoSkipEmptyChain:preferences\.autoSkipEmptyChain!==false\},why:'no chain response is legal'\}/);
});
test('(R66-4) input ids are stamped at the window capture phase, before any handler',()=>{
 const a=read('app.mjs');
 assert.match(a,/for\(const t of \['click','keydown'\]\)window\.addEventListener\(t,e=>\{try\{Object\.defineProperty\(e,'__ddlInputId',\{value:\+\+inputSerial\}\)\}catch\{\}\},true\);/);
});
test('(R66-5) decorative layers cannot catch a tap in Play; copy invariants refuse negative sequences',()=>{
 assert.match(read('css/r62-events.css'),/body\.in-duel\[data-pc-play="1"\] :is\(#duelist-cutin,#duelist-cutin \*,#fx-layer,#fx-layer \*,#pc-toast\)\{pointer-events:none!important\}/);
 assert.match(read('app.mjs'),/!Number\.isInteger\(c\.sequence\)\|\|c\.sequence<0\)return null;/);
});

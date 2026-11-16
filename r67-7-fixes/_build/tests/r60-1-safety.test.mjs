// r60.1 (Claude, 14 Nov 2026): Seto team RELAY-213 A-1 (HIGH). While a prompt waited behind "Get ready…", the previous
// prompt's No response bar stayed live, and a tap or Space passed the new prompt unseen. Source checks here; the behaviour is
// checked in a browser by tools/browser/stale-bar-check.cjs (Sky v Branded, seed 3003: r60 5 stale bars and 5 unseen passes,
// r60.1 0 and 0). A DOM-free unit test is not possible without restructuring app.mjs, so this is stated, not hidden (A-2).
import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs';
const read=f=>fs.readFileSync(new URL('../dist/'+f,import.meta.url),'utf8');
test('(R60.1-1) waiting behind the scene tells the add-ons that no human decision is on screen',()=>{
 const a=read('app.mjs');const i=a.indexOf("$('#decision-title').textContent='Get ready…';");assert.ok(i>0);
 const before=a.slice(Math.max(0,i-600),i);
 assert.match(before,/window\.dispatchEvent\(new CustomEvent\('duel-human-decision',\{detail:\{inDuel:[^}]*human:false,state,choices:\[\],pending:false,flow:'',reply:\(\)=>'refused',slot:\(\)=>''\}\}\)\);/);
 // play-comfort hides its bar and halts any retry on a non-human decision
 assert.match(read('play-comfort.mjs'),/if\(!d\.human\|\|!d\.state\?\.prompt\)\{cur=d\.state\?\{\.\.\.d,human:false,key:null\}:null;sender\.halt\(\);bar\.hidden=true;paint\(\);return\}/);
});
test('(R60.1-2) an answer offered for one prompt is refused once the prompt has changed',()=>{
 const a=read('app.mjs');
 assert.match(a,/function renderDecision\(x\)\{const shownKey=humanFlow\.current\?\.key\?\?null,shownRev=state\?\.revision;/);
 assert.match(a,/if\(disabled\|\|!state\|\|state\.finished\)return 'refused';if\(state\.revision!==shownRev\|\|\(humanFlow\.current\?\.key\?\?null\)!==shownKey\)return 'refused';/);
});
test('(R60.1-3) a response window with nothing on the chain says activate, not chain; engine choices unchanged',()=>{
 const a=read('app.mjs');
 assert.match(a,/function openWindowWords\(model\)\{if\(model\.priorContext\|\|state\?\.chain\?\.length\)return model;/);
 assert.match(a,/\$\('#decision-title'\)\.textContent=model\.openWindow\?'Response window':'Chain response';/);
 assert.match(a,/passLabel:model\.passLabel\?'No, do not activate':model\.passLabel/);
});

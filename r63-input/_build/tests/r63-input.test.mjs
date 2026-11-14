// r63 (Claude, 14 Nov 2026): ChatGPT RELAY-216 J1-01 / RELAY-218 MED-R62-4 central rendered-identity check, and grouped
// copies r1 (Grouped-copy-selection-spec-r1). Source checks; the behaviour is checked in a browser by
// tools/browser/route-check.cjs (v2) and tools/browser/group-check.cjs.
import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs';
const read=f=>fs.readFileSync(new URL('../dist/'+f,import.meta.url),'utf8');
test('(R63-1) every manual answer must be for the rendered prompt; waiting, a new duel and a rewind clear it; answers are audited',()=>{
 const a=read('app.mjs');
 assert.match(a,/function manualAllowed\(\)\{return !!rendered&&!!state&&rendered\.rev===state\.revision&&rendered\.key===\(humanFlow\.current\?\.key\?\?null\)\}/);
 assert.match(a,/function reply\(response,automatic=false\)\{const route=automatic==='addon'\?'addon\/'\+replyRoute\(\):automatic\?'automatic':replyRoute\(\);if\(!automatic&&!manualAllowed\(\)\)\{auditReply\(\{route,ok:false,why:'not the rendered prompt'\}\);return\}/);
 assert.match(a,/function renderDecision\(x\)\{const shownKey=humanFlow\.current\?\.key\?\?null,shownRev=state\?\.revision;if\(!isAi&&!disabled&&state&&!state\.finished&&mode!=='watch'\)markRendered\(\);else clearRendered\(\);/);
 assert.match(a,/clearRendered\(\);\/\* r63 \*\/\n  window\.dispatchEvent\(new CustomEvent\('duel-human-decision',\{detail:\{inDuel:/,'waiting behind a scene clears it');
 assert.match(a,/humanFlow\.reset\(\);clearRendered\(\);\/\* r63 \*\//,'a new duel clears it');
 assert.match(a,/function invalidateHumanContext\(\)\{clearRendered\(\);/,'a rewind clears it');
 assert.match(a,/reply\(r,'addon'\);return humanFlow\.pending\?'queued':'wait'\}if\(busy\|\|fxBusy\)return 'wait';reply\(r,'addon'\);/,'add-on answers keep their own closure check and are labelled');
 assert.match(a,/const replyAudit=\[\];window\.__ddlReplyAudit=replyAudit;/);
});
test('(R63-2) grouped copies r1: one-card own-Deck search under an allowlisted effect only; original index sent; ×n inside .choice-text',()=>{
 const a=read('app.mjs');
 assert.match(a,/const GROUP_SEARCH_ALLOW=new Set\(\['Sky Striker Mobilize - Engage!','Reinforcement of the Army'\]\);/);
 assert.match(a,/if\(m\.type!==M\.SELECT_CARD\|\|m\.min!==1\|\|m\.max!==1\|\|!Array\.isArray\(cards\)\|\|cards\.length<2\)return null;/);
 assert.match(a,/if\(!c\.code\|\|c\.location!==1\|\|c\.controller!==ctl\|\|!Number\.isInteger\(c\.sequence\)\)return null;const p=c\.location\+':'\+c\.sequence;if\(phys\.has\(p\)\)return null;/,'unknown, non-Deck, mixed-controller or duplicate references: no grouping');
 assert.match(a,/<span class="choice-name">\$\{esc\(nm\)\}<\/span>\$\{g\.length>1\?`<span class="choice-copy-count" aria-hidden="true">×\$\{g\.length\}<\/span>`:''\}<small>/);
 assert.match(a,/if\(indexes\.length!==1\|\|!groups\.some\(g=>g\[0\]===indexes\[0\]\)\)return;reply\(\{type:R\.SELECT_CARD,indicies:indexes\}\)/,'sends the original native index of the representative');
 assert.doesNotMatch(a.slice(a.indexOf('const groups=copyGroups')),/^.{0,400}auto-?confirm/);
});

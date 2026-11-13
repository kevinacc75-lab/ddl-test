// r58 (Claude, 13 Nov 2026): Seto team RELAY-199/200 findings and ChatGPT's learn-temple-r1 integration (RELAY-202).
// SELF-VERIFIED until reviewed. Browser checks (focus, bubble in view at 412x915 / 1280x900 / 390 / short landscape) are
// recorded in the release notes, not here.
import assert from 'node:assert/strict';import {test} from 'node:test';import fs from 'node:fs';import {execFileSync} from 'node:child_process';import os from 'node:os';import path from 'node:path';
import {CHOKEPOINTS,cpBeats} from '../dist/learn/chokepoints.mjs';import {LESSONS} from '../dist/learn/lessons.mjs';import {rulesBadge,boardHTML,textHTML} from '../dist/learn/learn.mjs';import {guideValues,guideSVG} from '../dist/learn/tutors.mjs';
const read=f=>fs.readFileSync(new URL('../'+f,import.meta.url),'utf8');
const LODE=56506740,BERYL=63198739,ASH=14558127,MAIDEN=17947697;const cp=CHOKEPOINTS[0];
test('(R58-1) RELAY-200 MED-1: each CP-001 branch shows its own true board after C1',()=>{
 const f0=cpBeats(cp,'F0'),f1=cpBeats(cp,'F1');
 for(const b of f0.slice(2)){assert.ok(b.board.opp.includes(BERYL),'F0 keeps Beryl: '+b.say);assert.deepEqual(b.board.hand,[ASH],'F0 keeps Ash in hand')}
 for(const b of f1.slice(2)){assert.deepEqual(b.board.gy,[ASH],'F1 shows Ash in the GY: '+b.say);assert.ok(!(b.board.hand||[]).includes(ASH))}
 assert.ok(f1.at(-1).board.opp.includes(MAIDEN),'F1 beat 8 keeps Maiden');assert.ok(cp.beats.every(b=>!b.boards||b.board),'F1 default board kept for shared beats');
});
test('(R58-2) rules badge per lesson revision; engine badge says source-led on SOURCE-LED steps; tooltip names the lesson’s own tests',()=>{
 const want={'RD-001':'RELAY-190','RD-002':'RELAY-190','RD-003':'RELAY-190','RD-004':'RELAY-199','RD-005':'RELAY-199'};
 for(const l of LESSONS)assert.equal(l.rulesCheck,want[l.id],l.id);assert.equal(cp.rulesCheck,'RELAY-200');
 assert.equal(rulesBadge(cp),'<span class="lr-badge rules ok">Rules: checked by Seto team (RELAY-200)</span>');assert.match(rulesBadge({}),/Rules: pending Seto team check/);
 const s=read('dist/learn/learn.mjs');assert.match(s,/srcLed\?'<span class="lr-badge engnone">Engine: not replayed for this step \(source-led\)<\/span>':engineBadge\(l\)/);
 assert.match(s,/title="\$\{esc\(\(l\.engineTests\|\|\[\]\)\.join\(', '\)\+' \('\+ENGINE_EVIDENCE\.log\+'\)'\)\}"/);
});
test('(R58-3) RELAY-199 MED-1 and RELAY-200 LOW-4: tutor focus selector, Escape with focus lost, C1 options equal and unfocused',()=>{
 const s=read('dist/learn/learn.mjs');
 assert.match(s,/draw\('button\[data-tutor="'\+t\.dataset\.tutor\+'"\]'\)/);assert.match(s,/document\.addEventListener\('keydown',e=>\{if\(e\.key==='Escape'&&!e\.defaultPrevented&&!el\.hidden&&!el\.contains\(e\.target\)\)/,'one Escape never acts twice');
 assert.match(s,/data-branch="\$\{esc\(o\.branch\)\}">/,'no option-specific class');assert.doesNotMatch(s,/data-branch="\$\{esc\(o\.branch\)\}" class=/);
 assert.match(s,/id="lr-choice-label" tabindex="-1"/);assert.match(s,/el\.querySelector\('#lr-choice-label,\.primary/);
});
test('(R58-4) learn-temple-r1 contract: tutor above the board in DOM order, workspace, footer; zones labelled; card text folds',()=>{
 const s=read('dist/learn/learn.mjs');const i=k=>s.indexOf(k,s.indexOf('function player()'));
 assert.ok(i('class="lr-talk"')<i('class="lr-workspace"')&&i('class="lr-workspace"')<i('class="lr-footer"'));assert.match(s,/class="lr-screen lr-play" data-studio="temple"/);
 assert.match(boardHTML({gy:[ASH]}),/data-zone="gy"/);assert.match(boardHTML({banished:[ASH]}),/data-zone="banished"/);
 assert.match(textHTML({code:LODE,hl:'When this card is activated'},false),/^<details class="lr-text"><summary>/);assert.match(textHTML({code:LODE,hl:'x'},true),/^<details class="lr-text" open>/);
 const h=read('dist/index.html');assert.ok(h.indexOf('css/r53-learn.css')<h.indexOf('css/r58-learn-temple.css'));assert.ok(JSON.parse(read('dist/offline-assets.json')).includes('./css/r58-learn-temple.css'));
 assert.match(read('dist/css/r58-learn-temple.css'),/^\/\* ChatGPT Learn design r1/);
});
test('(R58-5) small fixes: pointing label, CP chips, True Light note, KITT comment, Rulebook p. 51, RD-005 s03 board',()=>{
 assert.deepEqual([guideValues('pointing').label,guideValues('pointing').frame],['pointing it out',3]);assert.match(guideSVG('pointing'),/pointing it out/);
 const chips=cp.beats.flatMap(b=>b.chips||[]).map(c=>c.text);
 assert.ok(chips.includes('After Lode’s declaration resolves: opponent can’t activate effects of Special Summoned monsters on the field this turn'));assert.ok(chips.includes('Normal Summoned · Lode’s lock doesn’t apply'));
 assert.match(read('dist/ai/brain/blueeyes-brain.mjs'),/sent from the Spell & Trap Zone to the GY, destroy all your monsters \(not if it is banished or returned to the hand or Deck\)', advice: 'protect it\. Destruction protection does not stop a negate-and-destroy of True Light\\'s activation \(OCG Q&A fid 23488\)'/);
 assert.match(read('dist/ai/book/branded-lines.mjs'),/run 1 DARK Springans Kitt \(45484331\) AND 1 LIGHT/);
 assert.doesNotMatch(read('dist/learn/lessons.mjs')+read('dist/learn/chokepoints.mjs'),/Chained to’ p\. 50/);
 const s3=LESSONS.find(l=>l.id==='RD-005').beats[2].board;assert.deepEqual([s3.st,s3.gy],[[80044027],[18377261]]);
});
test('(R58-6) evidence parser: a failure is sticky and SKIP/TODO is not a pass',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ev-'));const tap=path.join(dir,'t.txt');fs.writeFileSync(tap,'ok 1 - (RD-001) a\nnot ok 2 - (RD-001) b\nok 3 - (RD-001) c\nok 4 - (CP-001 F1) x # SKIP\nok 5 - (CP-001 F0) y # TODO later\n');
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'evr-'));fs.mkdirSync(path.join(root,'dist/learn'),{recursive:true});
 execFileSync(process.execPath,[new URL('../tools/engine-evidence.mjs',import.meta.url).pathname,tap,'t'],{cwd:root});
 const out=fs.readFileSync(path.join(root,'dist/learn/engine-evidence.mjs'),'utf8');assert.match(out,/"results":\{"RD-001":"fail"\}/);
});

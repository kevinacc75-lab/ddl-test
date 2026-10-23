// r32 (Claude, 22 Oct; Kevy 16:50 item 4). SELF-VERIFIED (builder = verifier), NOT independent.
// Learning-mode combo captions: when a computer pilot plays a combo-book step, a banner names the goal of that line in
// plain words, once per line per turn; it shrinks to a small chip and clears when the turn changes. Other presets and
// play-vs-human mode show nothing. Every book line has a plain-words goal.
import assert from 'node:assert/strict';import fs from 'node:fs';import {JSDOM} from 'jsdom';
import {planLine,captionFor,CAPTION_MS} from '../dist/learning-captions.mjs';
import {LINE_GOALS,lineGoal} from '../dist/ai/book/captions.mjs';
import {BOOKS} from '../dist/ai/book/book.mjs';
// 1. Every shipped book line has a plain-words goal; every goal belongs to a shipped line (no orphan captions).
const ids=Object.values(BOOKS).flatMap(b=>b.lines.map(l=>l.id)).concat(['G-04']);
for(const id of ids)assert.ok(LINE_GOALS[id],'caption for '+id);
for(const id of Object.keys(LINE_GOALS))assert.ok(ids.includes(id),'caption '+id+' has a book line');
for(const g of Object.values(LINE_GOALS))assert.ok(g.length<=64&&!/->/.test(g),'short, plain caption: '+g);
assert.equal(lineGoal('X-1',{name:'A -> B'}),'A → B','fallback is the line name with arrows');
// 2. Which plans are captioned.
const decks=[{id:'branded',name:'Branded Dragoon'},{id:'luna',name:'Lunalight'}];
const step=(seat,turn,line)=>({seat,turn,book:{kind:'step',rule:'Opening book '+line}});
assert.equal(planLine(step(0,1,'L-01')),'L-01');
assert.equal(planLine({seat:0,turn:1,book:{kind:'pick',rule:'Opening book pick (Aluber)'}}),null,'picks are not captioned');
assert.equal(planLine({seat:0,turn:1}),null);
const c=captionFor(step(0,1,'L-01'),decks);
assert.equal(c.goal,LINE_GOALS['L-01']);assert.equal(c.deck,'Branded Dragoon');assert.equal(c.route,'1-card Aluber');assert.match(captionFor(step(1,2,'LU-01'),decks).route,/→/);
// 3. In the page (JSDOM): banner, once per line per turn, chip, cleared on the next turn, nothing outside Learning.
const dom=new JSDOM('<!doctype html><body></body>',{url:'https://lab.test/'});Object.assign(globalThis,{document:dom.window.document,window:dom.window});
const {createLearningCaptions}=await import('../dist/learning-captions.mjs');
let preset='learning';const cap=createLearningCaptions({root:dom.window.document.body,getDecks:()=>decks,on:()=>preset==='learning',timingScale:0.01});
const msg=(turn,last,intent,coach=true)=>({state:{turn,finished:false},coach:coach?{last,intent}:null});
cap.state(msg(1,null,step(0,1,'L-01')));
let n=dom.window.document.querySelector('.lr-plan');assert.ok(n&&!n.hidden,'banner shown');assert.match(n.textContent,/Mirrorjade/);assert.match(n.textContent,/Branded Dragoon/);assert.ok(n.classList.contains('lr-plan-in'));
cap.state(msg(1,step(0,1,'L-01'),step(0,1,'L-01')));assert.equal(cap.shown.id,'L-01');
await new Promise(r=>setTimeout(r,CAPTION_MS.banner*0.01+30));assert.ok(n.classList.contains('lr-plan-mini'),'shrinks to a chip');
cap.state(msg(1,step(0,1,'L-01'),step(0,1,'V53-CART')));assert.equal(cap.shown.id,'V53-CART','a new line is announced');
cap.state(msg(1,step(0,1,'L-01'),null));assert.equal(cap.shown.id,'V53-CART','an older line is not announced again');
cap.state(msg(2,null,null));assert.ok(n.hidden&&!cap.shown,'cleared when the turn changes');
cap.state(msg(2,null,step(1,2,'LU-01')));assert.equal(n.dataset.seat,'1');assert.match(n.textContent,/Liger Dancer/);
cap.state(msg(3,null,step(0,3,'L-01'),false));assert.ok(n.hidden,'nothing when playing against the computer (no coach data)');
preset='duel';cap.state(msg(3,null,step(0,3,'L-02')));assert.ok(n.hidden,'nothing outside Learning');
// 4. Wired in the shell, styled, and listed for offline use.
const shell=fs.readFileSync('dist/app-shell.mjs','utf8');assert.match(shell,/captions\.state\(x\)/);assert.match(shell,/createLearningCaptions/);
assert.match(fs.readFileSync('dist/learning-routes.css','utf8'),/\.lr-plan\{/);
const assets=JSON.parse(fs.readFileSync('dist/offline-assets.json','utf8'));const list=JSON.stringify(assets);
for(const f of ['learning-captions.mjs','ai/book/captions.mjs'])assert.ok(list.includes(f),f+' in offline assets');
console.log('r32-learning-captions: PASS');

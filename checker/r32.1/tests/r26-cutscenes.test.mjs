// r26 (Claude, 21-22 Oct; Kevy 23:01-23:05 tablet recording: "I approve longer cutscenes", "I approve more persona
// inspired style"). SELF-VERIFIED (builder = verifier), NOT independent.
//  1. Timing: banish / cost / Special Summon batches last at least CUTSCENE_MS[preset]; nothing else is lengthened; the
//     pace modules, the 500 ms hold and think time stay byte-identical (pinned in r23-fx); no extension with cinematics
//     off, reduced motion, skip cut-ins or the Instant preset.
//  2. The empty MATERIALS screen: the separate panel no longer plays when the summon cutscene can (that scene shows the
//     materials merging), and when it does play it leaves together with its cards (never an empty "TO GY · TOGETHER").
//  3. Scenes: one counted banish scene, a cost scene with a COST stamp, a COST PAID scene with the LP amount, a summon
//     scene that the B2 / boss scenes take over for their own summons; all cleared by reset.
//  4. Panels: the full-height yellow line (compact stage border) is gone; the stylesheet loads last and is cached offline.
import assert from 'node:assert/strict';import fs from 'node:fs';import {JSDOM} from 'jsdom';
import {createPresentation} from '../dist/presentation.mjs';import {createFx,CUTSCENE_MS,cutsceneKind,fxSpan} from '../dist/fx-r23.mjs';
import {MaterialsScene} from '../dist/fusion-materials.mjs';import {SUMMON_MS} from '../dist/summon-cutscenes.mjs';
// 1a. Table and classifier.
assert.deepEqual(JSON.parse(JSON.stringify(CUTSCENE_MS)),{learning:{summon:2800,banish:2400,cost:2200},duel:{summon:2200,banish:1900,cost:1700},broadcast:{summon:1500,banish:1300,cost:1200},instant:{summon:0,banish:0,cost:0}});
assert.deepEqual({...SUMMON_MS},{learning:6000,duel:3600,broadcast:2200,instant:0});
const db={6:{code:6,name:'Sunrise',type:0x41,desc:'Fusion.',art:'art/22908820.jpg'},5:{code:5,name:'Monster',type:0x21,desc:'Monster effect.',art:'art/40044918.jpg'},7:{code:7,name:'Token',type:0x4011,desc:'Token.'},8:{code:8,name:'Other',type:0x21,desc:'x',art:'art/89631139.jpg'}};
const mv=(to,extra={})=>({type:'move',code:5,from:{controller:0,location:16},to:{controller:0,location:to,position:1},...extra});
assert.equal(cutsceneKind([mv(32)]),'banish');assert.equal(cutsceneKind([mv(16,{reason:0x80,from:{controller:0,location:2}})]),'cost');
assert.equal(cutsceneKind([mv(16,{reason:0x80,from:{controller:0,location:1}})]),null,'a Deck card milled as a cost has no cost scene');
assert.equal(cutsceneKind([{type:'cost',player:0,amount:1000}]),'cost');assert.equal(cutsceneKind([mv(4)]),null);
assert.equal(cutsceneKind([{type:'summon',special:true,code:5}],{db:()=>db}),'summon');assert.equal(cutsceneKind([{type:'summon',special:true,code:7}],{db:()=>db}),null,'no scene for a token without art');
assert.equal(cutsceneKind([{type:'summon',special:true,code:5,b2Summon:{}}],{db:()=>db,skipSummon:e=>!!e.b2Summon}),null,'B2 covers its own summons');
assert.equal(cutsceneKind([mv(16,{reason:0x80,from:{controller:0,location:2}}),{type:'summon',special:true,code:5},mv(32)],{db:()=>db}),'summon','the longest scene wins');
// 2-4. In the real presentation (JSDOM).
const dom=new JSDOM(fs.readFileSync('dist/index.html','utf8'),{url:'https://lab.test/'});Object.assign(globalThis,{document:dom.window.document,window:dom.window});
dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true};dom.window.HTMLDialogElement.prototype.close=function(){this.open=false};
const $=s=>document.querySelector(s);for(const [p,l,s] of [[0,4,0],[0,4,1],[0,4,2],[0,16,0],[0,32,0]])$('#my-board').insertAdjacentHTML('beforeend',`<button data-slot="${p}:${l}:${s}"></button>`);
const rect={left:100,top:100,width:60,height:88,right:160,bottom:188,x:100,y:100};dom.window.HTMLElement.prototype.getBoundingClientRect=function(){return rect};
const extras=[];document.addEventListener('cutscene-extra',e=>extras.push(e.detail));
const seen=new Map();new dom.window.MutationObserver(ms=>{for(const m of ms)for(const n of m.addedNodes){const c=n.getAttribute?.('class')||'';for(const k of c.split(' '))if(k)seen.set(k,(seen.get(k)||0)+1)}}).observe(document.body,{childList:true,subtree:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms)),drain=async p=>{const end=Date.now()+8000;while(p.active&&Date.now()<end)await sleep(5)};
const p=createPresentation({db:()=>db,decks:()=>[{name:'A'},{name:'B'}],view:()=>0,sound:{play(){},setEvent(){},setSeat(){}},timingScale:.01});
const run=async(events,cfg={})=>{seen.clear();extras.length=0;p.reset();p.configure({cinematics:true,motion:false,preset:'duel',...cfg});p.play(events.map((e,i)=>({...e,id:i+1})),events.length);await drain(p)};
try{
 // 1b. A banish batch is lengthened to the banish scene; a plain move is not.
 await run([{type:'phase',phase:4,player:0},mv(32)]);
 assert.ok(extras.some(x=>x.kind==='banish'),'the banish batch gets its cutscene length');assert.ok(seen.get('fx23-banish')>=1&&seen.get('fx26-cut')>=1,'banish cutscene shown');
 await run([{type:'phase',phase:4,player:0},mv(4,{from:{controller:0,location:2}})]);assert.equal(extras.length,0,'an ordinary move keeps its pace');
 await run([{type:'cost',player:0,amount:1000,before:8000,after:7000}]);assert.ok(extras.some(x=>x.kind==='cost')||seen.get('fx23-lp-cost'),'LP cost scene');
 for(const cfg of [{cinematics:false},{motion:true},{skipCutins:true},{preset:'instant'}]){await run([{type:'phase',phase:4,player:0},mv(32)],cfg);assert.equal(extras.length,0,'no extension with '+JSON.stringify(cfg));assert.ok(!seen.get('fx26-cut'),'no cutscene with '+JSON.stringify(cfg))}
 // 2a. Fusion materials then the Fusion Summon: the MATERIALS panel does not play (the summon cutscene shows them); its log line stays.
 const fusion=[{type:'activate',chain:1,code:8,player:0,source:{controller:0,location:2,sequence:0}},{type:'resolve',chain:1,code:8,player:0},
  {type:'move',code:5,reason:8|262144,from:{controller:0,location:4,sequence:0,position:1},to:{controller:0,location:16,position:1}},{type:"move",code:8,reason:8|262144,from:{controller:0,location:4,sequence:1,position:1},to:{controller:0,location:16,position:1}},
  {type:'summon',special:true,code:6,player:0,sequence:2},{type:'chainEnd'}];
 await run(fusion);
 assert.ok(!seen.get('fusion-materials-scene'),'no separate MATERIALS panel when the summon cutscene plays');
 assert.match($('#fusion-materials-log')?.textContent||'',/Fusion materials: Monster/,'the materials line is still logged');
 // 2b. When the panel does play (summon cutscene unavailable), it fades out with its cards.
 {const calls=[];const sc=new MaterialsScene({document,db:()=>db,frame:()=>{const f=document.createElement('div');f.className='card-frame';return f},animate:(node,frames,opt)=>{calls.push({node,frames,opt});return {cancel(){}}}});
  sc.show({materials:[{code:5,hidden:false,origin:'Field',destination:'GY',destinationController:0,destinationLocation:16},{code:8,hidden:false,origin:'Field',destination:'GY',destinationController:0,destinationLocation:16}]},2000,true);
  const panel=calls.find(c=>c.node===sc.node);assert.ok(panel,'the panel itself animates');assert.equal(panel.frames.at(-1).opacity,0,'the panel fades out');
  const lastCard=Math.max(...calls.filter(c=>c.node.classList?.contains('materials-item')).map(c=>c.opt.delay+c.opt.duration));assert.ok(panel.opt.delay+panel.opt.duration<=lastCard+1e-9&&panel.opt.delay+panel.opt.duration>=lastCard-1e-9,'it ends exactly when the last card lands');
  assert.equal(sc.node.querySelectorAll('img.materials-art').length,2,'material cards show their own images');sc.reset()}
 // 3. Scenes directly.
 {const fx=createFx({layer:$('#fx-layer'),point:pos=>document.querySelector(`[data-slot="${pos.controller}:${pos.location}:${pos.sequence}"]`),db:()=>db,timingScale:.01,skipSummon:e=>!!e.b2Summon,state:()=>({enabled:true,reduced:false,skipCutins:false,preset:'duel'})});
  const b1=fx.flight(mv(32),400,'x').banish,b2=fx.flight(mv(32,{code:8}),400,'x').banish;assert.equal(b1,b2,'one banish scene, counted');assert.equal(b1.dataset.count,'2');assert.equal(b1.querySelector('em').textContent,'×2');
  assert.ok(parseFloat(b1.style.getPropertyValue('--fx23-ms'))>=Math.round(CUTSCENE_MS.duel.banish*.94*.01)-1,'the banish scene lasts its cutscene length, not the 400 ms flight');
  fx.flight(mv(16,{reason:0x80,from:{controller:0,location:4,sequence:0}}),400,'x');const cost=document.querySelector('.fx26-cost-cut');assert.ok(cost,'cost scene');assert.equal(cost.querySelector('.fx26-stamp').textContent,'COST');
  const lp=fx.event({type:'cost',player:0,amount:2000},null,1700,'x').cost;assert.ok(lp.textContent.includes('−2000'),'LP amount shown');
  assert.equal(fx.event({type:'summon',special:true,code:6,player:0,sequence:2,b2Summon:{kind:'fusion',confirmed:true}},null,3000,'x'),null,'B2 presents its own summon');
  assert.equal(fx.event({type:'summon',special:true,code:6,player:0,sequence:2},null,2200,'x').summon.dataset.kind,'fusion');
  for(const d of [0,1,1700,2200,3000])assert.ok(fxSpan(d,{share:.92,min:800,max:2800})<=d&&fxSpan(d,{share:.92,min:600,max:2200})<=d,'scenes fit their batch');
  const cuts=document.querySelectorAll('.fx26-cut').length;fx.clear(true);assert.equal(document.querySelectorAll('.fx26-cut').length,cuts,'the next event does not cut a cutscene short');
  fx.clear();assert.equal(fx.live,0);assert.equal(document.querySelectorAll('.fx26-cut').length,0,'clear removes every cutscene')}
}finally{p.reset();dom.window.close();delete globalThis.document;delete globalThis.window}
// 4. Panels.
const css=fs.readFileSync('dist/r26-panels.css','utf8'),html=fs.readFileSync('dist/index.html','utf8');
assert.ok(/#event-stage\[data-compact=true\]\{border:0!important/.test(css),'the compact stage no longer draws a full-height left border');
assert.ok(html.indexOf('r26-panels.css')>html.indexOf('fx-r23.css'),'r26 panels load after the r23 effects');
assert.ok(JSON.parse(fs.readFileSync('dist/offline-assets.json')).includes('./r26-panels.css'),'cached for offline play');
assert.ok(/prefers-reduced-motion:reduce\)\{\.fx26-cut\{display:none/.test(css)&&/body\.quiet-motion \.fx26-cut/.test(css),'reduced motion and quiet motion hide the cutscenes');
console.log(JSON.stringify({test:'r26-cutscenes',pass:true,node:process.version,selfVerified:true}));

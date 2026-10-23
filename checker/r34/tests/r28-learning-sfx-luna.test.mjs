// r28 (Claude, 22 Oct; Kevy 09:45). SELF-VERIFIED (builder = verifier), NOT independent.
//  1. Learning mode: every labelled move draws a bold route line with a label saying why it moved (Fusion / Synchro / Xyz /
//     Link material, equip, cost, banished ...), outlines both ends, and the scene lasts long enough to read it.
//     Duel / Broadcast / Instant draw nothing new and keep their timings.
//  2. Sound: the rendered effects exist, are listed for offline use, chain links 1-4 map to heavier chain sounds, a loaded
//     effect plays as a sample, and the synth cue still plays when the files are not loaded.
//  3. Lunalight: Kaleido Chick may send Leo Dancer from the Extra Deck (boss preservation only covers a boss in hand or on
//     the field) and the opening reaches Lunalight Liger Dancer in some seeded hands (0 of 14 before r28).
import assert from 'node:assert/strict';import fs from 'node:fs';import {gunzipSync} from 'node:zlib';import {JSDOM} from 'jsdom';
import {routeLabel,routeKind,learningMinimum,LEARN_ROUTE_MS} from '../dist/learning-routes.mjs';
import {Soundscape,SFX_FILES} from '../dist/sound-engine.mjs';
// 1a. Labels.
const mv=(reason,from,to,extra={})=>({type:'move',code:6,reason,from:{controller:0,location:from,sequence:0},to:{controller:0,location:to,sequence:0,position:1},...extra});
const MAT=8,FUS=0x40000,SYN=0x80000,XYZ=0x200000,LINK=0x10000000,COST=0x80;
assert.equal(routeLabel(mv(MAT|FUS,4,16)).label,'FUSION MATERIAL');
assert.equal(routeLabel(mv(MAT|SYN,4,16)).label,'SYNCHRO MATERIAL');
assert.equal(routeLabel(mv(MAT|LINK,4,16)).label,'LINK MATERIAL');
assert.equal(routeLabel(mv(MAT|XYZ,4,128)).label,'XYZ MATERIAL');
assert.equal(routeLabel({type:'equip',code:4,from:{controller:0,location:8},to:{controller:0,location:4}}).label,'EQUIP');
assert.equal(routeLabel(mv(COST,4,32)).label,'COST · BANISHED');
assert.equal(routeLabel(mv(0x40,1,16)).label,'SENT TO GRAVEYARD');
assert.equal(routeLabel(mv(0x40,1,2)).label,'ADD TO HAND');
assert.equal(routeKind(mv(0,1,2,{code:0})),null,'a hidden draw is not labelled');
assert.equal(learningMinimum({events:[mv(MAT|FUS,4,16),mv(MAT|FUS,2,16)]}),LEARN_ROUTE_MS.move+LEARN_ROUTE_MS.perCard);
assert.equal(learningMinimum({events:[{type:'activate'}]}),0,'activations keep their own timing');
// 1b. In the real presentation (JSDOM).
const db={6:{code:6,name:'Sunrise',type:0x41,desc:'Fusion.',art:'art/22908820.jpg'},4:{code:4,name:'Equip',type:0x40002,desc:'Equip.'}};
const dom=new JSDOM(fs.readFileSync('dist/index.html','utf8'),{url:'https://lab.test/'});Object.assign(globalThis,{document:dom.window.document,window:dom.window});
dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true};dom.window.HTMLDialogElement.prototype.close=function(){this.open=false};
const {createPresentation}=await import('../dist/presentation.mjs');
const $=s=>document.querySelector(s);for(const [p,l,s] of [[0,8,0],[0,4,0],[0,4,2]])$('#my-board').insertAdjacentHTML('beforeend',`<button data-slot="${p}:${l}:${s}"></button>`);for(const l of [16,32,64])$('#my-board').insertAdjacentHTML('beforeend',`<div data-pile="0:${l}"></div>`);
let k=0;dom.window.HTMLElement.prototype.getBoundingClientRect=function(){const x=100+((this.dataset?.slot||'').length*37+(k++%3)*90)%700;return {left:x,top:200,width:60,height:88,right:x+60,bottom:288,x,y:200}};
const sleep=ms=>new Promise(r=>setTimeout(r,ms)),drain=async p=>{const end=Date.now()+8000;while(p.active&&Date.now()<end)await sleep(5)};
const p=createPresentation({db:()=>db,decks:()=>[{name:'A'},{name:'B'}],view:()=>0,sound:{play(){},setEvent(){},setSeat(){}},timingScale:.01});
let extra=0;document.addEventListener('learning-extra',()=>extra++);
const tags=[];let routesDrawn=0;new dom.window.MutationObserver(ms=>{for(const m of ms)for(const n of m.addedNodes){if(n.classList?.contains('lr-tag'))tags.push(n.textContent);if(n.getAttribute?.('class')?.includes('lr-route'))routesDrawn++}}).observe(document.body,{childList:true,subtree:true});
try{
 for(const preset of ['learning','duel','broadcast']){tags.length=0;extra=0;routesDrawn=0;p.reset();p.configure({cinematics:true,motion:false,preset});
  p.play([{...mv(MAT|SYN,4,16),id:1},{...mv(MAT|FUS,4,16,{from:{controller:0,location:4,sequence:2}}),id:2},{type:'equip',code:4,from:{controller:0,location:8,sequence:0},to:{controller:0,location:4,sequence:0},id:3}],3);await drain(p);await sleep(20);const mid=routesDrawn;
  if(preset==='learning'){assert.ok(mid>=1,'Learning draws route lines');assert.ok(tags.some(t=>/(FUSION|SYNCHRO) MATERIAL/.test(t)),'material label: '+JSON.stringify(tags));assert.ok(tags.some(t=>/EQUIP/.test(t)),'Equip label');assert.ok(extra>=1,'Learning scenes are lengthened to read the labels')}
  else{assert.equal(tags.length,0,preset+': no route labels');assert.equal(extra,0,preset+': timings unchanged')}
  assert.equal(document.querySelectorAll('.lr-route,.lr-tag,.lr-crosshair').length,0,preset+': nothing left behind')}
}finally{p.reset();dom.window.close();delete globalThis.document;delete globalThis.window}
// 2. Sound.
const offline=JSON.parse(fs.readFileSync('dist/offline-assets.json'));
for(const n of SFX_FILES){assert.ok(fs.statSync('dist/audio/sfx/'+n+'.mp3').size>4000,n+'.mp3 exists');assert.ok(offline.includes('./audio/sfx/'+n+'.mp3'),n+' is cached for offline play')}
const s=new Soundscape();const picks=[1,2,3,4,7].map(l=>s.sampleFor('chain',l,{}));
assert.deepEqual(picks.map(x=>x[0]),['chain-1','chain-2','chain-3','chain-4','chain-4'],'chain links 1-4+ get heavier chain sounds');assert.ok(picks[3][1]>picks[0][1],'and louder');
assert.equal(s.sampleFor('fusion',1,{type:'move'})[0],'material','a Fusion material move is not the Fusion Summon hit');assert.equal(s.sampleFor('fusion',1,{type:'summon'})[0],'summon-fusion');
const param=()=>({value:0,setValueAtTime(){},setTargetAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){},cancelScheduledValues(){}});let buffers=0,oscs=0;
class Audio{constructor(){this.state='running';this.currentTime=0;this.sampleRate=100;this.destination={}}createGain(){return {gain:param(),connect(){},disconnect(){}}}createDynamicsCompressor(){return {threshold:param(),ratio:param(),connect(){}}}createStereoPanner(){return {pan:param(),connect(){}}}createBuffer(){return {getChannelData:()=>new Float32Array(100)}}createOscillator(){return {frequency:param(),connect(){},start(){oscs++},stop(){}}}createBufferSource(){const b={playbackRate:param(),connect(){},start(){if(b.buffer?.tag)buffers++},stop(){}};return b}createBiquadFilter(){return {frequency:param(),connect(){},disconnect(){}}}}
globalThis.AudioContext=Audio;const fetch0=globalThis.fetch;globalThis.fetch=()=>Promise.reject(new Error('offline test'));
const t=new Soundscape();t.unlock();await sleep(5);t.active.clear();oscs=0;t.play('chain',2);assert.ok(oscs>0,'no files loaded: the synth chain cue still plays');
t.sfx=new Map(SFX_FILES.map(n=>[n,{tag:n}]));t.active.clear();oscs=0;buffers=0;t.play('chain',3);assert.equal(buffers,1,'a loaded chain sound plays as a sample');assert.equal(oscs,0,'instead of the synth cue');
globalThis.fetch=fetch0;delete globalThis.AudioContext;
// 3. Lunalight.
const {Duel,M}=await import('../dist/duel.mjs');const {createOptimalPilots,selectionBlock}=await import('../dist/optimal-pilot.mjs');
const cdb=JSON.parse(gunzipSync(fs.readFileSync('dist/cards.json.gz'))),scripts=JSON.parse(gunzipSync(fs.readFileSync('dist/scripts.json.gz')));
const LIST='tcg-2026-10-19',decks=JSON.parse(fs.readFileSync('dist/decks.json')).decks.map(x=>{const v=x.banlistVariants?.[LIST];return v?{...x,...v}:x}),deck=id=>decks.find(x=>x.id===id),code=n=>+Object.keys(cdb).find(k=>cdb[k].name===n);
{const view={db:cdb,name:c=>cdb[c]?.name||'',hint:504,prompt:{min:1},currentEffect:{code:code('Lunalight Kaleido Chick')},fromEngine:x=>x,zone:()=>[]};
 const leo={code:code('Lunalight Leo Dancer'),controller:0,location:64},hound={code:code('Lunalight Silver Hound'),controller:0,location:1};
 assert.equal(selectionBlock(view,0,leo,[leo,hound]),null,'Kaleido Chick may send Leo Dancer from the Extra Deck');
 const liger={code:code('Lunalight Liger Dancer'),controller:0,location:4},kaleido={code:code('Lunalight Kaleido Chick'),controller:0,location:4};
 assert.ok(selectionBlock({...view,hint:505},0,liger,[liger,kaleido]),'a Liger Dancer on the field is not returned to the hand while another target exists')}
const d=await Duel.create(cdb,scripts);let liger=0;const opps=['branded','mikanko','sky','blueeyes','kashtira','toon','hero'];
for(let seed=105;seed<=109;seed++){const pilots=createOptimalPilots({seed,searchEnabled:false});d.start([deck('luna'),deck(opps[(seed-101)%7])],{seed,first:0});let n=0;
 while(d.prompt&&!d.finished&&d.turn<=1&&n<900){const plan=pilots[d.prompt.seat].plan(d);d.respond(plan.response);for(const x of pilots)x.observe?.(plan);n++}
 if(d.zone(0,4).filter(Boolean).some(c=>d.name(c.code)==='Lunalight Liger Dancer'))liger++;d.stop?.()}
assert.ok(liger>=2,'Lunalight reaches Liger Dancer in at least 2 of 5 seeded openings, got '+liger);
console.log(JSON.stringify({test:'r28-learning-sfx-luna',pass:true,node:process.version,sfx:SFX_FILES.length,lunaLiger:liger+'/5',selfVerified:true}));

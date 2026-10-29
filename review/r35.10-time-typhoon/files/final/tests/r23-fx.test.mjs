// r23-fx (Claude, 21 Oct; TASK e2). Checks Kevy's presentation asks without touching pace:
//  1. pacing is unchanged: the pacing modules are byte-identical to r22b, the presentation's timing constants are the
//     same literals, the chain pace total is still 30600 ms, and every effect fits inside its event's duration;
//  2. effects: a glow cut-in for every Spell/Trap activation (none for monster effects), a unique Field Spell wash and
//     Equip clamp/tether, chain-link stamps that grow with the link, Deck swirls on moves to/from the Deck; none of it
//     with cinematics off, reduced motion or skip cut-ins; all of it removed by skip/reset;
//  3. sound: every cue still sounds; Field/Equip activations get their own cue; the jazz score is finite, bassy, swung
//     and layered; the scheduler starts once and stops cleanly.
import assert from 'node:assert/strict';import fs from 'node:fs';import crypto from 'node:crypto';import {JSDOM} from 'jsdom';
import {ChainDirector} from '../dist/event-data.mjs';import {createPresentation} from '../dist/presentation.mjs';
import {fxSpan,stKind,createFx} from '../dist/fx-r23.mjs';import {Soundscape,SOUND_EVENTS} from '../dist/sound-engine.mjs';import {jazzBeat,chordAt,beatSeconds,JAZZ_THEMES,SWING} from '../dist/jazz-score.mjs';
const sha=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
// 1. Pace.
const PINNED={'dist/event-data.mjs':'a30d6e25bf63fd77a9219cb4bb548d019488eac2056f0ab40efc5392a27c3c8e','dist/human-holds.mjs':'6ead92b79cbc81931ea417e810e3c3217e2670683d3aa9d8ad986f6bed5cfda7','dist/app.mjs':'831386c3c97f4ded44b0dc483f47decde970f9dd6bf519ae87b9dc9958c64212'/* r36 re-pin (coin cutscene lines only, proven by tests/r36-coin-pin.test.mjs; before them 70f8d696 = the r35 item 8 re-pin, shuffle overlay lines only, proven by tests/r35-shuffle-app-pin.test.mjs) */,'dist/play-flow.mjs':'dccc07f05a4c06b9d4c1c1a090dc297ba43d82fde185bacfa7988aa30c757511','dist/lp-fx.mjs':'2757637194cfc1bae4afc93d3bc4075309b399b2e2df0f84188dba29bb9a6f4e','dist/optimal-pilot.mjs':'ed03a478d999605e6089898ac5d97cc7c102494e160853776aaa1a3dea490948'/* r35 job 29 fix re-pin: three blocks only, proven by tests/r35-cyclone-pin.test.mjs *//* r32.1 (22 Oct, Claude): Special Summon holds receive isPayoff (no non-boss Link that would eat a boss). r32: hand traps used on the opponent's key cards (trusted, every deck); createOptimalPilots forwards bookTrust (ChatGPT F5); trusted book steps say "Played as written" (F6). No pace, hold or think-time change. r31: one-at-a-time boss preservation; book trust off for books marked trust:false. r30 (22 Oct, measured on 30 hands per deck): bookTrust on by default (a book step and our own-turn trigger activations are played without search override); no timing code. r28 Lunalight review: boss preservation applies only to a boss in hand / on the field (not Deck, Extra Deck, GY, banished) and also to return-to-hand/Deck picks; no timing code. r27 deck review: AI decision rules changed (book holds on Special Summons, never tribute an Extra Deck monster, more bosses protected); no timing, hold or think-time code touched */};
for(const [f,h] of Object.entries(PINNED))assert.equal(sha(f),h,f+' must be unchanged from r22b (pace, holds, think time)');
// r24 restyles the summon scene (card art, materials as cards); its timing table must stay the same.
// r26: Kevy approved longer cutscenes (21 Oct 23:05); the B2 summon scene is now the one Fusion/Synchro/Xyz/Link cutscene
// (the separate MATERIALS panel no longer plays before it). Pinned to the new values; see tests/r26-cutscenes.test.mjs.
{const {SUMMON_MS}=await import('../dist/summon-cutscenes.mjs');assert.deepEqual({...SUMMON_MS},{learning:6000,duel:3600,broadcast:2200,instant:0},'summon scene timing (r26, Kevy-approved)')}
const pres=fs.readFileSync('dist/presentation.mjs','utf8');
for(const lit of ["const FLIGHT={learning:[1600,3200],duel:[1000,2000],broadcast:[600,1200]};","const TURN_MS={learning:3000,duel:1500,broadcast:1000},RESOLVE_FLIGHT={learning:3600,duel:1800,broadcast:1080};","const RESOLVE_BEATS={hl:.22,lift:.5,hold:.5}"])assert.ok(pres.includes(lit),'timing constant unchanged: '+lit.slice(0,40));
for(const d of [0,1,400,650,1500,2500,4000,5000,30000])for(const o of [{},{share:.55,min:700,max:1600},{share:.35,min:500,max:1100},{share:.9,min:400,max:900},{share:.8,min:420,max:1100}]){const s=fxSpan(d,o);assert.ok(s>=0&&s<=d,'fx span '+s+' must fit inside '+d)}
const db={6:{code:6,name:'Sunrise',type:0x41,desc:'Fusion.',art:'art/22908820.jpg'},7:{code:7,name:'Token',type:0x4011,desc:'Token.'},1:{code:1,name:'Pot',type:2,desc:'Draw 2 cards.',art:'art/89943723.jpg'},2:{code:2,name:'Trap',type:4,desc:'Negate that effect.',art:'art/75047173.jpg'},3:{code:3,name:'Field',type:0x80002,desc:'Field effect.',art:'art/73628505.jpg'},4:{code:4,name:'Equip',type:0x40002,desc:'Equip only.',art:'art/25955749.jpg'},5:{code:5,name:'Monster',type:0x21,desc:'Monster effect.',art:'art/40044918.jpg'}};
const director=new ChainDirector(),ev=[1,2,3].map(i=>({id:i,type:'activate',chain:i,code:i,player:i%2,source:{controller:i%2,location:8,sequence:i}})).concat([3,2,1].map((c,i)=>({id:4+i,type:'resolve',chain:c,code:c})),[{id:7,type:'chainEnd'}]);
assert.equal(director.ingest(ev,db,{preset:'learning'}).reduce((n,b)=>n+b.duration,0),30600,'chain pace total unchanged');
assert.deepEqual([1,2,3,4,5].map(c=>stKind(db[c])?.kind+'/'+stKind(db[c])?.sub),['spell/normal','trap/normal','spell/field','spell/equip','undefined/undefined']);
// 2. Effects in the real presentation (JSDOM).
const dom=new JSDOM(fs.readFileSync('dist/index.html','utf8'),{url:'https://lab.test/'});Object.assign(globalThis,{document:dom.window.document,window:dom.window});
dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true};dom.window.HTMLDialogElement.prototype.close=function(){this.open=false};
const $=s=>document.querySelector(s);for(const [p,l,s] of [[0,8,0],[0,8,1],[1,8,2],[0,8,5],[0,4,2],[1,4,1]])$('#my-board').insertAdjacentHTML('beforeend',`<button data-slot="${p}:${l}:${s}"></button>`);for(const p of [0,1])$('#my-board').insertAdjacentHTML('beforeend',`<div data-deck-pile="${p}"></div>`);
const rect={left:100,top:100,width:60,height:88,right:160,bottom:188,x:100,y:100};dom.window.HTMLElement.prototype.getBoundingClientRect=function(){return rect};
const seen=new Map();new dom.window.MutationObserver(ms=>{for(const m of ms)for(const n of m.addedNodes){const c=n.getAttribute?.('class')||'';for(const k of c.split(' '))if(k.startsWith('fx23-'))seen.set(k,(seen.get(k)||0)+1)}}).observe(document.body,{childList:true,subtree:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms)),drain=async p=>{const end=Date.now()+5000;while(p.active&&Date.now()<end)await sleep(5)};
const p=createPresentation({db:()=>db,decks:()=>[{name:'A'},{name:'B'}],view:()=>0,sound:{play(){},setEvent(){},setSeat(){}},timingScale:.01});
const act=(code,chain,extra={})=>({type:'activate',chain,code,player:0,source:{controller:0,location:8,sequence:code===3?5:0},...extra});
const run=async(events,cfg={})=>{seen.clear();p.reset();p.configure({cinematics:true,motion:false,preset:'duel',...cfg});p.play(events.map((e,i)=>({...e,id:i+1})),events.length);await sleep(8);const early=new Map(seen);await drain(p);return early};
try{
 let s=await run([act(1,1),act(2,2),act(3,3),act(4,4),{type:'activate',chain:5,code:5,player:1,source:{controller:1,location:4,sequence:1}}]);await drain(p);
 assert.equal(seen.get('fx23-cutin'),4,'a glow cut-in for each of the 4 Spell/Trap activations, none for the monster effect');
 assert.equal(seen.get('fx23-field-wash'),1,'Field Spell gets its own wash');assert.equal(seen.get('fx23-equip-lock'),1,'Equip Spell gets its own clamp');
 assert.equal(seen.get('fx23-chain-stamp'),5,'every chain link gets a stamp');
 assert.equal(document.querySelectorAll('.fx23-cutin,.fx23-field-wash,.fx23-equip-lock,.fx23-tether,.fx23-chain-stamp,.fx23-deck-swirl').length,0,'nothing is left behind after the chain');
 s=await run([act(4,1),{type:'resolve',chain:1,code:4,player:0},{type:'equip',code:4,from:{controller:0,location:8,sequence:0},to:{controller:0,location:4,sequence:2}},{type:'move',code:1,from:{controller:0,location:4,sequence:2},to:{controller:0,location:1,sequence:0},routeOnly:true},{type:'chainEnd'},{type:'phase',phase:512,player:0}]);await drain(p);
 assert.ok(seen.get('fx23-deck-swirl')>=1,'a move into the Deck swirls the Deck pile');{const fx=createFx({layer:$('#fx-layer'),point:pos=>document.querySelector(`[data-slot="${pos.controller}:${pos.location}:${pos.sequence}"]`),db:()=>db,timingScale:.01,state:()=>({enabled:true,reduced:false,skipCutins:false,preset:'duel'})}),eq={type:'equip',code:4,from:{controller:0,location:8,sequence:0},to:{controller:0,location:4,sequence:2}};
  $('#event-stage').hidden=true;assert.ok(fx.flight(eq,600,'x')?.tether,'an equip flight on the open board draws a tether and clamp');
  $('#event-stage').hidden=false;assert.equal(fx.flight(eq,600,'x'),null,'no tether while the resolve scene covers the board');fx.clear();assert.equal(fx.live,0);$('#event-stage').hidden=true;await sleep(10)}
 // r24 cutscenes: Special Summon (not for tokens without art), banish (one scene, counted), cost seal and LP cost.
 {const fx=createFx({layer:$('#fx-layer'),point:pos=>pos.location===0?$('#my-lp'):document.querySelector(`[data-slot="${pos.controller}:${pos.location}:${pos.sequence}"]`)||document.querySelector(`[data-deck-pile="${pos.controller}"]`),db:()=>db,timingScale:.01,state:()=>({enabled:true,reduced:false,skipCutins:false,preset:'duel'})});
  assert.ok(fx.event({type:'summon',special:true,kind:'fusion',code:6,player:0,sequence:2},null,3000,'x')?.summon?.dataset.kind==='fusion','Fusion Summon cutscene');
  assert.equal(fx.event({type:'summon',special:true,code:7,player:0,sequence:2},null,3000,'x'),null,'no cutscene for a token without art');
  assert.equal(fx.event({type:'summon',special:false,code:6,player:0,sequence:2},null,3000,'x'),null,'no cutscene for a Normal Summon');
  const b1=fx.flight({type:'move',code:6,from:{controller:0,location:16},to:{controller:0,location:32,position:1}},900,'x').banish,b2=fx.flight({type:'move',code:0,reason:0x80,from:{controller:0,location:2},to:{controller:0,location:32,position:8}},900,'x').banish;
  assert.equal(b1,b2,'several banishes share one scene');assert.equal(b1.dataset.count,'2');
  assert.ok(fx.flight({type:'move',code:6,reason:0x80,from:{controller:0,location:4,sequence:2},to:{controller:0,location:16}},900,'x').cost,'a card paid as a cost gets the COST seal');
  assert.ok(fx.event({type:'cost',player:0,amount:1000},null,1500,'x')?.cost,'an LP cost gets the COST PAID burst');
  for(const d of [0,1000,1500,3000])assert.ok(fxSpan(d,{share:.7,min:800,max:1900})<=d&&fxSpan(d,{share:.7,min:600,max:1300})<=d,'cutscenes fit inside the event');
  fx.clear();assert.equal(fx.live,0);await sleep(10)}
 for(const cfg of [{cinematics:false},{motion:true},{skipCutins:true},{preset:'instant'}]){await run([act(1,1),act(3,2)],cfg);await drain(p);assert.equal([...seen.keys()].length,0,'no fx with '+JSON.stringify(cfg))}
 p.reset();p.configure({cinematics:true,motion:false,preset:'learning'});p.play([{...act(1,1),id:1},{...act(2,2),id:2}],2);await sleep(5);$('#skip-fx').click();p.reset();assert.equal(document.querySelectorAll('.fx23-cutin,.fx23-field-wash,.fx23-equip-lock,.fx23-tether,.fx23-chain-stamp,.fx23-deck-swirl').length,0,'skip/reset clears the overlays');
}finally{p.reset();dom.window.close();delete globalThis.document;delete globalThis.window}
// 3. Sound.
const param=()=>({value:0,events:[],setValueAtTime(v,t){if(!Number.isFinite(v)||!Number.isFinite(t))throw TypeError('non-finite');this.value=v;this.events.push(v)},setTargetAtTime(v){this.value=v},linearRampToValueAtTime(v){if(!Number.isFinite(v))throw TypeError('non-finite');this.value=v},exponentialRampToValueAtTime(v){if(!Number.isFinite(v)||v<=0)throw TypeError('bad ramp')},cancelScheduledValues(){}});
let oscs=[],started=0;class Audio{constructor(){this.state='running';this.currentTime=0;this.sampleRate=100;this.destination={}}createGain(){return {gain:param(),connect(){},disconnect(){}}}createDynamicsCompressor(){return {threshold:param(),ratio:param(),connect(){}}}createStereoPanner(){return {pan:param(),connect(){}}}createBuffer(){return {getChannelData:()=>new Float32Array(100)}}createOscillator(){const o={frequency:param(),connect(){},start(t){started++;o.at=t},stop(){}};oscs.push(o);return o}createBufferSource(){return {connect(){},start(){started++},stop(){}}}createBiquadFilter(){return {frequency:param(),connect(){},disconnect(){}}}}
globalThis.AudioContext=Audio;globalThis.document={body:{classList:{contains:()=>true}}};const s=new Soundscape();
try{s.unlock();assert.ok(s.musicTimer,'music starts');const t=s.musicTimer;s.startMusic();assert.equal(s.musicTimer,t,'music starts once');
 for(const cue of SOUND_EVENTS){s.active.clear();const before=started;s.play(cue,2);assert.ok(started>before,'cue sounds: '+cue)}
 const print=(meta,card)=>{s.active.clear();oscs=[];s.setEvent(meta,card);s.play('spell');return oscs.map(o=>Math.round(o.frequency.events[0])).join(',')};
 const plain=print({type:'activate'},{type:2}),field=print({type:'activate'},{type:0x80002}),equip=print({type:'activate'},{type:0x40002});
 assert.notEqual(field.replace(/\d/g,''),'');assert.ok(new Set([plain.length?'p':'',field!==plain,equip!==plain,equip!==field]).size>=1&&field!==plain&&equip!==plain&&equip!==field,'Field and Equip activations have their own cues');
 s.stopMusic();assert.equal(s.musicTimer,null,'music stops');
 for(const theme of Object.keys(JAZZ_THEMES)){let bassLow=0,beats=0;for(let b=0;b<256;b++){const notes=jazzBeat(theme,b);beats++;for(const n of notes){for(const v of [n.at,n.dur,n.gain,...(n.freqs||[n.freq]).filter(x=>x!==undefined)])assert.ok(Number.isFinite(v),theme+' finite');assert.ok(n.gain>0&&n.gain<.5)}const bass=notes.find(n=>n.inst==='bass');assert.ok(bass&&bass.freq<160,'walking bass every beat, low');if(bass.freq<110)bassLow++;}
  assert.ok(bassLow>beats*.3,theme+': bassy');assert.ok(jazzBeat(theme,1).some(n=>n.inst==='ride'&&Math.abs(n.at-beatSeconds(theme)*SWING)<1e-9),theme+': swung ride');
  assert.ok(new Set(Array.from({length:32},(_,b)=>chordAt(theme,b).q)).size>=3,theme+': changing harmony');assert.ok([0,1,2].every(stem=>Array.from({length:16},(_,b)=>jazzBeat(theme,b)).flat().some(n=>n.stem===stem)),theme+': three layers')}
 assert.ok(JAZZ_THEMES.sky.tempo>JAZZ_THEMES.luna.tempo,'per-deck tempo');
 // r23.1 (Kevy: fast, brassy, climbing action jazz): every theme is up-tempo, the key lifts a semitone each 8-bar phrase
 // and resets after four, each phrase opens with a crash and ends with a rising tom fill and a brass rip.
 for(const theme of Object.keys(JAZZ_THEMES)){assert.ok(JAZZ_THEMES[theme].tempo>=160,theme+': high tempo');
  assert.deepEqual([0,32,64,96,128].map(b=>chordAt(theme,b).root-chordAt(theme,0).root),[0,1,2,3,0],theme+': climbs a semitone per phrase, then resets');
  for(const ph of [0,32,64,96]){assert.ok(jazzBeat(theme,ph).some(n=>n.inst==='crash'),theme+': crash at each lift');const fill=[28,29,30,31].flatMap(b=>jazzBeat(theme,ph+b)).filter(n=>n.inst==='tom').map(n=>n.freq);assert.ok(fill.length>=6&&fill.every((f,i)=>!i||f>fill[i-1]),theme+': rising tom fill');assert.ok(jazzBeat(theme,ph+28).some(n=>n.inst==='rip'&&n.to>n.freq),theme+': brass rip up')}
  assert.ok(Array.from({length:32},(_,b)=>jazzBeat(theme,b)).flat().filter(n=>n.inst==='lead'&&n.stem===1).length>=20,theme+': a brass melody throughout')}
}finally{s.stopMusic();s.stop();delete globalThis.AudioContext;delete globalThis.document}
console.log(JSON.stringify({test:'r23-fx',pass:true,node:process.version}));

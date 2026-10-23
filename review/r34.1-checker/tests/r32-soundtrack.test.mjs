// r32 (Kevy 22 Oct 18:51 / 18:52): new duel tracks from the Drive Audio folder; "fade in when the game starts, a random
// track each time"; "each track to fade into itself so it can be like a seamless loop". SELF-VERIFIED, NOT independent.
//  1. Shipped set: every listed track exists, is cached for offline play, has its loop point before the natural ending,
//     a loop start inside the track and a loudness gain; the old r24 files are gone.
//  2. Playback: a duel fades a random track in from the top; the repeat pass starts at loopStart and crossfades with
//     equal-power curves (sin in, cos out) over the overlap; the gain sets the level; without curve support the r24
//     linear ramps are used (r24-soundtrack covers that path).
import assert from 'node:assert/strict';import fs from 'node:fs';
import {Soundscape} from '../dist/sound-engine.mjs';
const cfg=JSON.parse(fs.readFileSync('dist/audio/soundtrack.json')),assets=JSON.parse(fs.readFileSync('dist/offline-assets.json'));
assert.ok(cfg.tracks.length>=8,'Kevy\'s r32 set (8 tracks: 6 from Drive, the 2 Gods Awaken tracks attached in chat)');assert.ok(cfg.overlap>=3&&cfg.fadeIn>=2,'a 3 s crossfade and a fade-in');
for(const t of cfg.tracks){assert.ok(fs.existsSync('dist/audio/'+t.file),t.file);assert.ok(assets.includes('./audio/'+t.file),t.file+' offline');
 assert.ok(t.end>100&&t.end<300,'loop point');assert.ok(!t.loopStart||t.loopStart<t.end-30,'loop start inside the track');assert.ok(t.gain>0&&t.gain<=1,'gain never boosts past the file level');if(t.overlap)assert.ok(t.overlap<=8&&t.end-(t.loopStart||0)>3*t.overlap,'a per-track crossfade fits inside the loop')}
assert.match(fs.readFileSync('dist/sound-engine.mjs','utf8'),/ov=Number\(t\.overlap\)\|\|this\.trackCfg\.overlap/,'per-track overlap is read');
for(const f of ['ddl-track-pulse.mp3','ddl-track-buoyant-groove.mp3','ddl-track-buoyant-groove-2.mp3'])assert.ok(!fs.existsSync('dist/audio/'+f)&&!assets.includes('./audio/'+f),f+' replaced');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let now=0,starts=[],ramps=[],curves=[];const param=()=>({value:1,setValueAtTime(v){this.value=v},setTargetAtTime(v){this.value=v},linearRampToValueAtTime(v,t){ramps.push([v,t]);this.value=v},setValueCurveAtTime(v,t,d){curves.push({v:[...v],t,d})},exponentialRampToValueAtTime(v){this.value=v},cancelScheduledValues(){}});
class Audio{constructor(){this.state='running';this.sampleRate=100;this.destination={}}get currentTime(){return now}createGain(){return {gain:param(),connect(){},disconnect(){}}}createDynamicsCompressor(){return {threshold:param(),ratio:param(),connect(){}}}createStereoPanner(){return {pan:param(),connect(){}}}createBuffer(){return {getChannelData:()=>new Float32Array(100)}}createOscillator(){return {type:'',frequency:param(),detune:param(),connect(){},start(){},stop(){},disconnect(){}}}
 createBufferSource(){const n={connect(){},start(t,off=0){if(n.buffer?.file)starts.push({file:n.buffer.file,t,off})},stop(){}};return n}createBiquadFilter(){return {frequency:param(),Q:param(),connect(){},disconnect(){}}}
 decodeAudioData(b,ok){ok({file:new TextDecoder().decode(b),duration:20})}}
globalThis.fetch=async url=>{const u=String(url);if(u.endsWith('soundtrack.json'))return {ok:true,json:async()=>({fadeIn:2.5,overlap:2,newGame:2,tracks:[{file:'a.mp3',end:8,loopStart:1,gain:.8}]})};return {ok:true,arrayBuffer:async()=>new TextEncoder().encode(u.split('/').pop()).buffer}};
globalThis.AudioContext=Audio;globalThis.document={body:{classList:{contains:()=>true}}};
const s=new Soundscape();s.unlock();await sleep(30);
try{
 assert.equal(starts.length,1);const a=starts[0];assert.equal(a.off,0,'the duel starts the track from the top');
 assert.ok(ramps.some(([v,t])=>v===.8&&Math.abs(t-(a.t+2.5))<1e-9),'fades in over 2.5 s to the track gain');
 const out1=curves.find(c=>Math.abs(c.t-(a.t+8-2))<1e-9);assert.ok(out1&&out1.d===2,'equal-power fade-out over the 2 s overlap before the end');
 assert.ok(Math.abs(out1.v[0]-.8)<1e-6&&out1.v.at(-1)<.001,'fade-out runs from the gain to silence');
 await sleep(2200);
 assert.equal(starts.length,2,'it loops');const b=starts[1];assert.equal(b.file,'a.mp3');assert.equal(b.off,1,'the repeat pass starts at loopStart');assert.ok(Math.abs(b.t-(a.t+6))<1e-9,'it starts as the first pass fades out');
 const in2=curves.find(c=>Math.abs(c.t-b.t)<1e-9&&c.v[0]<.001);assert.ok(in2&&in2.d===2,'equal-power fade-in over the overlap');
 const mid=in2.v[Math.floor(in2.v.length/2)],midOut=out1.v[Math.floor(out1.v.length/2)];assert.ok(Math.abs(mid*mid+midOut*midOut-.64)<.02,'equal power: no dip in the middle of the crossfade');
 assert.ok(curves.some(c=>Math.abs(c.t-(b.t+(8-1)-2))<1e-9),'the repeat pass is shorter by its loop start');
}finally{s.stopMusic?.()}
// r32.1 (Kevy 22 Oct 23:01): a track picked in the sound mixer plays every duel; '' = random each duel.
{const t=new Soundscape();t.trackList=[{file:'a.mp3'},{file:'b.mp3'},{file:'c.mp3'}];t.fixedTrack='b.mp3';for(let i=0;i<5;i++)assert.equal(t.pickTrack().file,'b.mp3','the picked track every time');
 t.fixedTrack='gone.mp3';assert.ok(['a.mp3','b.mp3','c.mp3'].includes(t.pickTrack().file),'an unknown pick falls back to random');
 let ng=0,decoded=[];t.newGame=()=>ng++;t.decodeTrack=async x=>{decoded.push(x.file);return {}};t.track={};t.context={};t.nowPlaying={file:'a.mp3'};await t.chooseTrack('c.mp3');assert.deepEqual(decoded,['c.mp3'],'the new track is decoded first');assert.equal(ng,1,'then the music crossfades to it');await t.chooseTrack('');assert.equal(ng,1,'random keeps the current track playing');assert.equal(t.fixedTrack,null)}
{const html=fs.readFileSync('dist/index.html','utf8'),shell=fs.readFileSync('dist/app-shell.mjs','utf8');assert.match(html,/id="music-track"/);assert.match(html,/Random each duel/);assert.match(shell,/preferences\.musicTrack/);assert.match(shell,/chooseTrack/)}
console.log(JSON.stringify({test:'r32-soundtrack',pass:true,node:process.version,tracks:cfg.tracks.map(t=>t.title)}));process.exit(0);

// r24 (Kevy, 21 Oct): Kevy's own duel tracks. Each duel picks a random track (never the same twice in a row) and fades it
// in; the track loops by crossfading into itself before its natural ending; a new duel crossfades to a new track; a file
// that fails to load is skipped, and with no usable track the built-in score plays. Also checks the shipped files.
import assert from 'node:assert/strict';import fs from 'node:fs';
import {Soundscape} from '../dist/sound-engine.mjs';
const cfg=JSON.parse(fs.readFileSync('dist/audio/soundtrack.json'));
assert.ok(cfg.tracks.length>=3,'three tracks listed');
for(const t of cfg.tracks){assert.ok(fs.existsSync('dist/audio/'+t.file),t.file+' shipped');assert.ok(t.end>100&&t.end<150,'loop point before the natural ending');
 const assets=JSON.parse(fs.readFileSync('dist/offline-assets.json'));assert.ok(assets.includes('./audio/'+t.file),t.file+' cached for offline play')}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let now=0,starts=[],ramps=[];const param=()=>({value:1,setValueAtTime(v){this.value=v},setTargetAtTime(v){this.value=v},linearRampToValueAtTime(v,t){ramps.push([v,t]);this.value=v},exponentialRampToValueAtTime(v){this.value=v},cancelScheduledValues(){}});
class Audio{constructor(){this.state='running';this.sampleRate=100;this.destination={}}get currentTime(){return now}createGain(){return {gain:param(),connect(){},disconnect(){}}}createDynamicsCompressor(){return {threshold:param(),ratio:param(),connect(){}}}createStereoPanner(){return {pan:param(),connect(){}}}createBuffer(){return {getChannelData:()=>new Float32Array(100)}}createOscillator(){return {frequency:param(),connect(){},start(){},stop(){}}}
 createBufferSource(){const n={connect(){},start(t){if(n.buffer?.file)starts.push({file:n.buffer.file,t})},stop(){}};return n}createBiquadFilter(){return {frequency:param(),connect(){},disconnect(){}}}
 decodeAudioData(b,ok,no){const file=new TextDecoder().decode(b);if(file==='broken')return no(Error('bad audio'));ok({file,duration:149})}}
const run=async(tracks,{fail=[]}={})=>{starts=[];ramps=[];now=0;
 globalThis.fetch=async url=>{const u=String(url);if(u.endsWith('soundtrack.json'))return {ok:true,json:async()=>({fadeIn:2.5,overlap:2,newGame:2,tracks})};const f=u.split('/').pop();return {ok:true,arrayBuffer:async()=>new TextEncoder().encode(fail.includes(f)?'broken':f).buffer}};
 globalThis.AudioContext=Audio;globalThis.document={body:{classList:{contains:()=>true}}};const s=new Soundscape();s.unlock();await sleep(20);return s};
try{
 // 1. A random track fades in; it loops by starting again before its end, crossfading.
 let s=await run([{file:'a.mp3',end:7.5},{file:'b.mp3',end:7.5},{file:'c.mp3',end:7.5}]);
 assert.equal(starts.length,1,'one track starts');assert.ok(['a.mp3','b.mp3','c.mp3'].includes(starts[0].file));const first=starts[0];
 assert.ok(ramps.some(([v,t])=>v===1&&Math.abs(t-(first.t+2.5))<1e-9),'fades in over 2.5 s');
 await sleep(1700);// the next pass is scheduled 4 s ahead of its start on the audio clock
 assert.equal(starts.length,2,'the track loops');assert.equal(starts[1].file,first.file,'it loops on itself');assert.ok(Math.abs(starts[1].t-(first.t+7.5-2))<1e-9,'the next pass starts 2 s before the end (crossfade)');
 assert.ok(ramps.some(([v,t])=>v<.001&&Math.abs(t-(first.t+7.5+.3))<1e-9),'the old pass fades out across the overlap');
 // 2. A new duel (turn count drops) crossfades to a different random track.
 const st=t=>({active:0,turn:t,chain:[],players:[{lp:8000,zones:{4:[]}},{lp:8000,zones:{4:[]}}]});s.updateState(st(9),[{id:'sky'}]);now=20;s.updateState(st(1),[{id:'sky'}]);await sleep(30);
 const after=starts.filter(x=>x.t>=20);assert.equal(after.length,1,'new duel starts a track');assert.notEqual(after[0].file,first.file,'never the same track twice in a row');
 s.stopMusic();assert.equal(s.track,null);assert.equal(s.musicTimer,null);
 // 3. A broken file is skipped; another track plays.
 s=await run([{file:'x.mp3',end:140},{file:'y.mp3',end:140}],{fail:['x.mp3']});for(let i=0;i<20&&!starts.length;i++){s.stopMusic();s.lastTrack='y.mp3';s.startMusic();await sleep(20)}
 assert.ok(starts.every(x=>x.file==='y.mp3')&&starts.length>=1,'broken track skipped');s.stopMusic();
 // 4. No usable tracks: the built-in score plays.
 s=await run([]);assert.equal(s.trackState,'none');assert.ok(s.musicClock,'built-in score playing');s.stopMusic();
 s=await run([{file:'z.mp3',end:140}],{fail:['z.mp3']});await sleep(30);assert.ok(s.musicClock||s.musicTimer,'falls back to the built-in score when every track fails');s.stopMusic();
}finally{delete globalThis.AudioContext;delete globalThis.document;delete globalThis.fetch}
console.log(JSON.stringify({test:'r24-soundtrack',pass:true,node:process.version,tracks:cfg.tracks.map(t=>t.title)}));

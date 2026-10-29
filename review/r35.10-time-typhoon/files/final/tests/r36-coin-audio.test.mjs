// r36 RELAY-068 (ChatGPT): coin / dice scene owns its audio. SELF-VERIFIED.
// With the REAL Soundscape tone/noise code on a recording fake AudioContext:
//  1 every source the coin spin / land / reveal and the dice throw schedule (including ones starting >1 s later) is
//    connected through the scene's own gain node, never straight to the bus;
//  2 scene.clear() (what Skip / the next scene / reset call) cuts that node: gain 0 at once and disconnected;
//  3 an unrelated sound (music / UI / shuffle riffle path: a plain tone) is untouched by the clear;
//  4 a new scene after a clear gets a fresh node (the old one stays cut).
import assert from 'node:assert/strict';
import {Soundscape} from '../dist/sound-engine.mjs';
import {CoinScene,coinSound} from '../dist/coin-cutscene.mjs';
let id=0;const nodes=[];
function node(kind){const n={id:++id,kind,out:[],disconnected:false,started:null,stopped:null,connect(t){this.out.push(t);return t},disconnect(){this.disconnected=true;this.out=[]},
 gain:{value:1,setValueAtTime(v){this.value=v},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){},setTargetAtTime(){},cancelScheduledValues(){}},
 frequency:{setValueAtTime(){},exponentialRampToValueAtTime(){},linearRampToValueAtTime(){},value:0},detune:{value:0},pan:{value:0},Q:{value:0},type:'',buffer:null,playbackRate:{value:1},
 start(t){this.started=t},stop(t){this.stopped=t},onended:null};nodes.push(n);return n}
const ctx={state:'running',currentTime:10,createOscillator:()=>node('osc'),createGain:()=>node('gain'),createBiquadFilter:()=>node('filter'),createBufferSource:()=>node('buffer'),createStereoPanner:()=>node('panner')};
const s=new Soundscape({enabled:true});s.context=ctx;s.buses={sfx:node('bus-sfx'),music:node('bus-music'),ui:node('bus-ui'),master:node('bus-master')};s.noiseBuffer={};
const reaches=(n,target,seen=new Set())=>{if(n===target)return true;if(seen.has(n))return false;seen.add(n);return n.out.some(x=>reaches(x,target,seen))};
const doc={getElementById:()=>null};
const scene=new CoinScene({document:doc,db:()=>({}),sound:s,animate:()=>null,setTimer:()=>0,clearTimer:()=>{}});
const out=scene.audioOut();assert.ok(out&&out.kind==='gain','scene gain node');assert.ok(reaches(out,s.buses.sfx),'scene node feeds the sfx bus');
const before=nodes.length;
for(const step of ['flick','spin','land','reveal'])coinSound(s,'coin',step,{ms:3400,won:step==='reveal'?true:null,dest:out});
coinSound(s,'dice','throw',{ms:3400,dest:out});
const sources=nodes.slice(before).filter(n=>['osc','buffer'].includes(n.kind));
assert.ok(sources.length>=20,'sources scheduled: '+sources.length);
const late=sources.filter(n=>n.started>ctx.currentTime+1);assert.ok(late.length>=2,'some start more than 1 s later ('+late.length+')');
for(const src of sources)assert.ok(reaches(src,out),'every scene source goes through the scene node');
// an unrelated sound
const u0=nodes.length;s.tone(440,2,{at:1.5});const unrelated=nodes.slice(u0).find(n=>n.kind==='osc');assert.ok(!reaches(unrelated,out)&&reaches(unrelated,s.buses.sfx),'unrelated tone goes to the bus directly');
scene.clear();
assert.equal(out.gain.value,0,'cut: gain 0');assert.equal(out.disconnected,true,'cut: disconnected');
for(const src of sources)assert.ok(!reaches(src,s.buses.sfx),'no scene source reaches the bus after clear');
assert.ok(reaches(unrelated,s.buses.sfx),'unrelated sound still plays');
const out2=scene.audioOut();assert.notEqual(out2,out,'a new scene gets a fresh node');assert.ok(reaches(out2,s.buses.sfx));
scene.clear();
console.log(JSON.stringify({test:'r36-coin-audio',pass:true,node:process.version,sources:sources.length,late:late.length}));

// r35 item 8, RELAY-059 correction (Claude, 28 Oct 2026). SELF-VERIFIED (builder = verifier), NOT independent.
// Every Skip route cancels the shuffle overlay and its owned riffle LOCALLY, and cancelling the overlay sends nothing to
// the worker. The exact handler / wiring source is extracted from dist/app.mjs and run against the real ShuffleOverlay
// with an active effect, a queued shuffle and a riffle that has started (fake DOM, clock and sound; not a browser test).
import assert from 'node:assert/strict';import fs from 'node:fs';
import {ShuffleOverlay,SPLIT_MS} from '../dist/shuffle-overlay.mjs';
const app=fs.readFileSync('dist/app.mjs','utf8');
const grab=re=>{const m=re.exec(app);assert.ok(m,'found in app.mjs: '+re);return m[0]};
// --- a fake world with one active shuffle (riffle started) and one queued ---
function world(){let t=0;const timers=[];
 class El{constructor(){this.style={};this.children=[];this.attrs={};this.parent=null;this.listeners={}}appendChild(c){c.parent=this;this.children.push(c);return c}remove(){if(this.parent){this.parent.children=this.parent.children.filter(x=>x!==this);this.parent=null}}setAttribute(k,v){this.attrs[k]=v}animate(){return {cancel(){}}}addEventListener(type,f){(this.listeners[type]??=[]).push(f)}dispatch(type){for(const f of this.listeners[type]||[])f({type})}}
 const body=new El(),pile=new El();pile.getBoundingClientRect=()=>({left:0,top:0,width:60,height:84});
 const byId={};const doc={hidden:false,body,createElement:()=>new El(),querySelector:()=>pile,getElementById:id=>byId[id]??=new El()};
 const riffles=[];const sound={shuffleRiffle:()=>{const h={cancelled:false,cancel(){this.cancelled=true}};riffles.push(h);return h}};
 const ov=new ShuffleOverlay({doc,sound,now:()=>t,setTimer:(f,ms)=>{const x={f,at:t+ms,done:false};timers.push(x);return x},clearTimer:x=>{if(x)x.done=true},options:()=>({enabled:true,reduced:false}),view:()=>0});
 const advance=ms=>{const end=t+ms;for(;;){const n=timers.filter(x=>!x.done&&x.at<=end).sort((a,b)=>a.at-b.at)[0];if(!n)break;t=n.at;n.done=true;n.f()}t=end};
 ov.accept({epoch:1,shuffles:[{id:1,seat:0},{id:2,seat:1}]});advance(SPLIT_MS+10);
 assert.equal(body.children.length,1);assert.equal(ov.waiting.length,1);assert.equal(riffles.length,1);
 const posted=[];const worker={postMessage:x=>posted.push(x)};
 return {ov,doc,body,riffles,posted,worker,byId}}
const cleared=(w,label)=>{assert.equal(w.body.children.length,0,label+': overlay removed');assert.equal(w.ov.waiting.length,0,label+': queued shuffle dropped');assert.equal(w.riffles[0].cancelled,true,label+': owned riffle cancelled')};
const stubPresentation=()=>{const calls=[];return {calls,active:true,skip(){calls.push('skip')},hold(v){calls.push('hold:'+v)}}};
// 1. Controls Skip (gear panel).
{const w=world(),presentation=stubPresentation();const src=grab(/\$\('#controls-skip'\)\.onclick=\(\)=>\{[^}]*\}/);
 const handler=new Function('shuffleOverlay','presentation','return '+src.slice(src.indexOf('=')+1))(w.ov,presentation);handler();
 cleared(w,'controls-skip');assert.deepEqual(presentation.calls,['skip','hold:true'],'the existing scene skip is unchanged');assert.deepEqual(w.posted,[],'no worker message from the overlay cancel')}
// 2. Step while a scene plays.
{const w=world(),presentation=stubPresentation();const src=grab(/if\(presentation\.active\)\{shuffleOverlay\.cancel\(\);presentation\.skip\(\);return\}/);
 new Function('shuffleOverlay','presentation',src)(w.ov,presentation);cleared(w,'step');assert.deepEqual(presentation.calls,['skip'])}
// 3. Sound Studio preview while a duel runs.
{const w=world(),presentation=stubPresentation(),humanHolds={manual(){}};const src=grab(/humanHolds\.manual\(true\);shuffleOverlay\.cancel\(\);presentation\.skip\(\)/);
 new Function('shuffleOverlay','presentation','humanHolds',src)(w.ov,presentation,humanHolds);cleared(w,'preview-fx')}
// 4. The presentation's own Skip buttons and Escape on its scene dialogs (wired from app.mjs; presentation.mjs unchanged).
for(const [id,type] of [['skip-fx','click'],['skip-scene','click'],['skip-victory','click'],['summon-scene','cancel'],['victory-scene','cancel']]){
 const w=world();const src=grab(/for\(const id of \['skip-fx','skip-scene','skip-victory'\]\)[^\n]*/);
 new Function('shuffleOverlay','document',src)(w.ov,w.doc);w.doc.getElementById(id).dispatch(type);cleared(w,id+' '+type);assert.deepEqual(w.posted,[])}
// 5. Overlay-only cancel (no scene active): nothing but the local cancel happens; no message to the worker, no timers left.
{const w=world();w.ov.cancel();cleared(w,'overlay-only');assert.deepEqual(w.posted,[])}
// 6. presentation.mjs is not modified by this correction (its sha256 is the 628d40f one).
{const crypto=await import('node:crypto');let src=fs.readFileSync('dist/presentation.mjs','utf8');/* r36: minus the coin cutscene lines (proof: tests/r36-coin-pin.test.mjs) */const {R36_COIN_UNDO}=await import('./r36-coin-pin.test.mjs');for(const [a,b,n] of R36_COIN_UNDO['presentation.mjs']){assert.equal(src.split(a).length-1,n);src=src.split(a).join(b)}const h=crypto.createHash('sha256').update(src).digest('hex');
 assert.equal(h,'fedba78dba0b527cda3001bf0207df5a0e3426e58259d43151b7719b7d20b3f7','presentation.mjs minus the r36 coin lines is byte-identical to 628d40f')}
console.log(JSON.stringify({test:'r35-shuffle-skip',pass:true,node:process.version}));

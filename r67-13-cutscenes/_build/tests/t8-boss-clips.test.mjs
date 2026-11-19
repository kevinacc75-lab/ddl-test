// T8 iconic-card video cut scenes (Kevy 19 Nov). AUTHOR CHECK (builder = verifier), NOT independent review.
// 1. Trigger rules: public face-up summon or public activation per the card's 'on'; alt-art codes use the base clip.
// 2. Once per card per duel: the clip step is inserted before the first play only; reset() starts a new duel.
// 3. In the real presentation (JSDOM): the duel waits while the clip plays, then the normal scene for that event still
//    plays; resumes on video end, tap, Skip button or video error; second play in the same duel has no clip;
//    no clip with cinematics off / skip cut-ins / Instant; an unregistered card is unchanged.
import assert from 'node:assert/strict';import fs from 'node:fs';import {JSDOM} from 'jsdom';
import {BOSS_CLIPS,clipFor,ClipDirector,CLIP_GRACE_MS,INTRO_MS,OUTRO_MS} from '../dist/boss-clips.mjs';
const FW=35809262;
assert.equal(BOSS_CLIPS[FW].ms,7100);for(const [c,k] of Object.entries(BOSS_CLIPS))assert.ok(fs.existsSync('dist/'+k.src),'clip file present for '+c);
// r67.13: every registered card is in Kevy's Branded deck and maps to the right trigger.
{const want={summon:[26077387,37351133,63288573,90673288,8491308,76072561,25072579,74405783,3410461,45883110,95515789,60303688,73819701,55273560,87758525,68468459,62962630,44146295,72272462,76666602,41373230,70534340,13243124,35809262],activate:[63166095,98338152,50005218,30271097,42141493,94145021,44362883,48130397,14558127,59438930]};
 for(const [on,cs] of Object.entries(want))for(const c of cs)assert.equal(BOSS_CLIPS[c]?.on,on,c+' '+on);
 const deck=JSON.stringify(JSON.parse(fs.readFileSync('dist/decks.json','utf8')).decks.filter(d=>d.id==='branded'||d.id==='sky'));for(const c of Object.keys(BOSS_CLIPS))if(+c!==FW)assert.ok(deck.includes(c),c+' in the Branded or Sky Striker deck');}
const reg={1:{src:'a.mp4',ms:5000,on:'summon'},2:{src:'b.mp4',ms:5000,on:'activate'},3:{src:'c.mp4',ms:5000,on:'both'}};
const dbA={11:{code:11,alias:2}};
assert.ok(clipFor({type:'summon',code:1},{},reg));assert.equal(clipFor({type:'activate',code:1},{},reg),null,'summon-only card: activation ignored');
assert.ok(clipFor({type:'activate',code:2},{},reg));assert.equal(clipFor({type:'summon',code:2},{},reg),null,'activate-only card: summon ignored');
assert.ok(clipFor({type:'summon',code:3},{},reg)&&clipFor({type:'activate',code:3},{},reg),'both');
assert.equal(clipFor({type:'activate',code:11},dbA,reg)?.code,2,'alt art uses the base card clip');
assert.equal(clipFor({type:'summon',code:1,private:true},{},reg),null,'private');assert.equal(clipFor({type:'summon',code:1,position:8},{},reg),null,'face-down');
assert.equal(clipFor({type:'move',code:1},{},reg),null,'not a play');
{const d=new ClipDirector(reg);const b=()=>[{events:[{type:'phase',id:1},{type:'activate',code:2,player:1,id:2}],duration:900}];
 const o1=d.decorate(b(),true);assert.equal(o1.length,2);assert.equal(o1[0].events[0].type,'bossClip');assert.equal(o1[0].events[0].code,2);assert.equal(o1[0].duration,5000+CLIP_GRACE_MS+INTRO_MS+OUTRO_MS,'r67.13: the wait also covers the intro and outro transitions');assert.deepEqual(o1[1].events.map(e=>e.id),[1,2],'original batch kept whole, after the clip');
 assert.equal(d.decorate(b(),true).length,1,'second play in the same duel: no clip');
 d.reset();assert.equal(d.decorate(b(),true).length,2,'new duel: clip again');
 const d2=new ClipDirector(reg);assert.equal(d2.decorate(b(),false).length,1,'gate off: no clip');assert.equal(d2.decorate(b(),true).length,2,'gate off does not use up the first play');}
const db={[FW]:{code:FW,name:'Elemental HERO Flame Wingman',type:0x61,attack:2100,defense:1200,desc:'Fusion.',art:'art/35809262.jpg'},5:{code:5,name:'Monster',type:0x21,desc:'x',art:'art/40044918.jpg'}};
const dom=new JSDOM(fs.readFileSync('dist/index.html','utf8'),{url:'https://lab.test/'});Object.assign(globalThis,{document:dom.window.document,window:dom.window});
dom.window.HTMLDialogElement.prototype.showModal=function(){this.open=true};dom.window.HTMLDialogElement.prototype.close=function(){this.open=false};
dom.window.HTMLMediaElement.prototype.play=function(){this.__playing=true;return Promise.resolve()};dom.window.HTMLMediaElement.prototype.pause=function(){this.__playing=false};dom.window.HTMLMediaElement.prototype.load=function(){};
const {createPresentation}=await import('../dist/presentation.mjs');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const p=createPresentation({db:()=>db,decks:()=>[{name:'A'},{name:'B'}],view:()=>0,sound:{play(){},setEvent(){},setSeat(){}},timingScale:1});
let id=0;const summon=(code,extra={})=>({type:'summon',special:true,code,player:0,sequence:2,id:++id,...extra});
const fresh=(cfg={})=>{p.reset();p.configure({cinematics:true,motion:false,preset:'duel',...cfg})};
const clipNode=()=>document.querySelector('.boss-clip');
const settle=async(max=8000)=>{let w=0;while(p.active&&w<max){await sleep(10);w+=10}return w};
try{
 for(const [how,finish] of [['ended',n=>n.querySelector('video').dispatchEvent(new dom.window.Event('ended'))],['tap',n=>n.dispatchEvent(new dom.window.MouseEvent('pointerup',{bubbles:true}))],['skip button',n=>n.querySelector('.boss-clip-skip').click()],['error',n=>n.querySelector('video').dispatchEvent(new dom.window.Event('error'))]]){
  fresh();p.play([summon(FW)],id);await sleep(30);
  const n=clipNode();assert.ok(n,'clip shown ('+how+')');assert.equal(n.querySelector('video').getAttribute('src'),'clips/'+FW+'.mp4');assert.ok(n.querySelector('video').__playing,'video playing');
  assert.match(n.querySelector('.boss-clip-caption').textContent,/SUMMONED · Elemental HERO Flame Wingman/);
  await sleep(300);assert.ok(p.active&&clipNode(),'the duel waits while the clip plays ('+how+')');
  finish(n);await sleep(40);assert.ok(!clipNode(),'clip removed after '+how);
  assert.ok(p.active,'the normal summon scene follows the clip ('+how+')');
  const w=await settle();assert.ok(!p.active,'presentation finishes after '+how+' ('+w+' ms)');
 }
 // Second play of the same card in the same duel: normal scene only.
 fresh();p.play([summon(FW)],id);await sleep(30);clipNode().querySelector('.boss-clip-skip').click();await settle();
 p.play([summon(FW)],id);await sleep(30);assert.ok(!clipNode(),'second play in the duel: no clip');await settle();
 // Pause (hold) pauses the video; resuming plays it again.
 fresh();p.play([summon(FW)],id);await sleep(30);{const v=clipNode().querySelector('video');p.hold(true);assert.equal(v.__playing,false,'held: video paused');await sleep(200);assert.ok(clipNode(),'held: clip stays');p.hold(false);assert.equal(v.__playing,true,'resumed');clipNode().querySelector('.boss-clip-skip').click();await settle()}
 // Gates.
 for(const cfg of [{cinematics:false},{skipCutins:true},{preset:'instant'}]){fresh(cfg);p.play([summon(FW)],id);await sleep(30);assert.ok(!clipNode(),'no clip with '+JSON.stringify(cfg));const w=await settle();assert.ok(!p.active,'duel continues with '+JSON.stringify(cfg))}
 fresh();p.play([summon(5)],id);await sleep(30);assert.ok(!clipNode(),'unregistered card: no clip');await settle();
 console.log('t8-boss-clips: PASS');
}finally{p.reset();dom.window.close()}
process.exit(0);

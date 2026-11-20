// T8 iconic-card video cut scenes. PRIVATE CANDIDATE, author-checked only, not reviewed.
// Kevy, 19 Nov 2026 (live): "when the card is summoned it plays this 10 second cut scene then resumes the game fluidly";
// then: "per duel ... the ones with cut scenes play the full cut scene but then as the duel goes on if you play that card
// again it plays as normal cutscene". Iconic cards only (bosses, hand traps, famous spells).
//
// What it does: the first time in a duel that a registered card is played (a public face-up summon, or a public
// activation for spells, traps and hand traps), a separate 'bossClip' presentation step is inserted BEFORE that event.
// The duel waits for it like any other cutscene, then the normal scene for that event plays as before. Later plays of
// the same card in the same duel get only the normal scene. Ends on video end, tap anywhere, Skip, Escape, or a load
// error (then the normal scene simply follows). Same gate as the summon scenes: off with cinematics off, reduced
// motion, "skip cut-ins" and the Instant pace. Presentation only: no rules, no replies, no duel.mjs change.

// Registry: base card code -> clip. Add a line and drop the file in clips/ to give a card its scene.
//  on: 'summon' (monster summoned face-up), 'activate' (card or effect activated), or 'both'.
//  ms: the clip length; the duel never waits longer than ms + CLIP_GRACE_MS even if the video stalls.
// Kevy's Grok Imagine clips (19 Nov 2026), about 7 s each, square, with sound effects. Favorite HERO Flame Wingman
// shares the Elemental HERO Flame Wingman clip (Kevy's Branded deck plays the Favorite HERO version).
export const BOSS_CLIPS=Object.freeze({
 35809262:Object.freeze({src:'clips/35809262.mp4',grad:['#d48b2a','#ff8300'],tint:'#ee802a',ms:7100,on:'summon',name:"Elemental HERO Flame Wingman"}),
 13243124:Object.freeze({src:'clips/35809262.mp4',grad:['#d48b2a','#ff8300'],tint:'#ee802a',ms:7100,on:'summon',name:"Favorite HERO Flame Wingman"}),
 68468459:Object.freeze({src:'clips/68468459.mp4',grad:['#d44d2a','#d95c25'],tint:'#e05438',ms:7100,on:'summon',name:"Fallen of Albaz"}),
 62962630:Object.freeze({src:'clips/62962630.mp4',grad:['#ea1614','#da2924'],tint:'#f52240',ms:7100,on:'summon',name:"Aluber the Jester of Despia"}),
 44146295:Object.freeze({src:'clips/44146295.mp4',grad:['#3d0ef0','#2562d9'],tint:'#5b8cff',ms:7100,on:'summon',name:"Mirrorjade the Iceblade Dragon"}),
 72272462:Object.freeze({src:'clips/72272462.mp4',grad:['#f30b2c','#f10d33'],tint:'#fe1a4d',ms:7100,on:'summon',name:"Despian Quaeritis"}),
 76666602:Object.freeze({src:'clips/76666602.mp4',grad:['#eb4713','#d75027'],tint:'#f54a23',ms:7100,on:'summon',name:"The Dragon that Devours the Dogma"}),
 41373230:Object.freeze({src:'clips/41373230.mp4',grad:['#e22e1c','#d35a2b'],tint:'#eb372c',ms:7100,on:'summon',name:"Titaniklad the Ash Dragon"}),
 70534340:Object.freeze({src:'clips/70534340.mp4',grad:['#ff5a00','#ffb400'],tint:'#ffb019',ms:7100,on:'summon',name:"Lubellion the Searing Dragon"}),
 44362883:Object.freeze({src:'clips/44362883.mp4',grad:['#be4d40','#e4661a'],tint:'#fb601c',ms:7100,on:'activate',name:"Branded Fusion"}),
 48130397:Object.freeze({src:'clips/48130397.mp4',grad:['#5e67a0','#5f759f'],tint:'#8f7cff',ms:7100,on:'activate',name:"Super Polymerization"}),
 14558127:Object.freeze({src:'clips/14558127.mp4',grad:['#ff2300','#fc0c02'],tint:'#ff4719',ms:7100,on:'activate',name:"Ash Blossom & Joyous Spring"}),
 59438930:Object.freeze({src:'clips/59438930.mp4',grad:['#fb0306','#3372cb'],tint:'#c057a0',ms:7100,on:'activate',name:"Ghost Ogre & Snow Rabbit"}),
 55273560:Object.freeze({src:'clips/55273560.mp4',grad:['#f68708','#dc8e22'],tint:'#ee9629',ms:7100,on:'summon',name:"Incredible Ecclesia, the Virtuous"}),
 87758525:Object.freeze({src:'clips/87758525.mp4',grad:['#36c5c8','#21d9dd'],tint:'#25f253',ms:7100,on:'summon',name:"Favorite HERO Shining Flare Wingman"}),
 42141493:Object.freeze({src:'clips/42141493.mp4',grad:['#1563e9','#1d60e1'],tint:'#2967ee',ms:7100,on:'activate',name:"Mulcharmy Fuwalos"}),
 94145021:Object.freeze({src:'clips/94145021.mp4',grad:['#ca34c0','#de2090'],tint:'#de30e8',ms:7100,on:'activate',name:"Droll & Lock Bird"}),
 45883110:Object.freeze({src:'clips/45883110.mp4',grad:['#f40a0f','#ea141d'],tint:'#ff193b',ms:7100,on:'summon',name:"Guiding Quem, the Virtuous"}),
 95515789:Object.freeze({src:'clips/95515789.mp4',grad:['#e72817','#f81a06'],tint:'#fd1c1a',ms:7100,on:'summon',name:"Blazing Cartesia, the Virtuous"}),
 60303688:Object.freeze({src:'clips/60303688.mp4',grad:['#d48a2a','#df8d1f'],tint:'#d69041',ms:7100,on:'summon',name:"Dogmatika Ecclesia, the Virtuous"}),
 73819701:Object.freeze({src:'clips/73819701.mp4',grad:['#be5a40','#ef6d0f'],tint:'#dc6d3b',ms:7100,on:'summon',name:"Fallen of the White Dragon"}),
 74405783:Object.freeze({src:'clips/74405783.mp4',grad:['#f4a70a','#f79f07'],tint:'#ffbf19',ms:7100,on:'summon',name:"The Three Champions of Swordsoul"}),
 3410461:Object.freeze({src:'clips/3410461.mp4',grad:['#fc1202','#fe5600'],tint:'#ff2819',ms:7100,on:'summon',name:"Alba-Lenatus the Abyss Dragon"}),
 30271097:Object.freeze({src:'clips/30271097.mp4',grad:['#da4924','#a3715b'],tint:'#d64d41',ms:7100,on:'activate',name:"The Fallen & The Virtuous"}),
 // Sky Striker set (Kevy's Grok clips, 19 Nov 23:43)
 26077387:Object.freeze({src:'clips/26077387.mp4',grad:['#00aaff','#1199ed'],tint:'#1992ff',ms:7100,on:'summon',name:"Sky Striker Ace - Raye"}),
 37351133:Object.freeze({src:'clips/37351133.mp4',grad:['#ff001a','#ff001a'],tint:'#ff1957',ms:7100,on:'summon',name:"Sky Striker Ace - Roze"}),
 63288573:Object.freeze({src:'clips/63288573.mp4',grad:['#fa6104','#ff7b00'],tint:'#ff8019',ms:7100,on:'summon',name:"Sky Striker Ace - Kagari"}),
 90673288:Object.freeze({src:'clips/90673288.mp4',grad:['#3197cd','#1e78e0'],tint:'#3589e2',ms:7100,on:'summon',name:"Sky Striker Ace - Shizuku"}),
 8491308:Object.freeze({src:'clips/8491308.mp4',grad:['#37e11d','#3de519'],tint:'#46ff19',ms:7100,on:'summon',name:"Sky Striker Ace - Hayate"}),
 76072561:Object.freeze({src:'clips/76072561.mp4',grad:['#2092de','#0eaef0'],tint:'#19d1ff',ms:7100,on:'summon',name:"Sky Striker Ace = Zero"}),
 25072579:Object.freeze({src:'clips/25072579.mp4',grad:['#348cca','#2aa3d4'],tint:'#49a5ce',ms:7100,on:'summon',name:"Prototype Sky Striker Ace - Amatsu"}),
 63166095:Object.freeze({src:'clips/63166095.mp4',grad:['#1ce2b0','#1ae2e4'],tint:'#39dfab',ms:7100,on:'activate',name:"Sky Striker Mobilize - Engage!"}),
 98338152:Object.freeze({src:'clips/98338152.mp4',grad:['#cf8b2f','#cb7d33'],tint:'#dc923b',ms:7100,on:'activate',name:"Sky Striker Mecha - Widow Anchor"}),
 50005218:Object.freeze({src:'clips/50005218.mp4',grad:['#2b49d3','#ff2f00'],tint:'#ff191a',ms:7100,on:'activate',name:"Sky Striker Airspace - Area Zero"}),
 // Sky Striker set 2 (Kevy, 20 Nov 00:28)
 52340444:Object.freeze({src:'clips/52340444.mp4',grad:['#3aa5c4','#34bdca'],tint:'#53c5b4',ms:7100,on:'activate',name:"Sky Striker Mecha - Hornet Drones"}),
 51227866:Object.freeze({src:'clips/51227866.mp4',grad:['#ff9600','#e87616'],tint:'#ff9d19',ms:7100,on:'activate',name:"Sky Striker Mecha - Shark Cannon"}),
 9726840:Object.freeze({src:'clips/9726840.mp4',grad:['#2a71d4','#4175bd'],tint:'#30aae7',ms:7100,on:'activate',name:"Sky Striker Mobilize - Linkage!"}),
 99550630:Object.freeze({src:'clips/99550630.mp4',grad:['#ff7900','#ff6b00'],tint:'#ff8719',ms:7100,on:'activate',name:"Sky Striker Maneuver - Afterburners!"}),
 34433770:Object.freeze({src:'clips/34433770.mp4',grad:['#3e67c0','#446cba'],tint:'#4e7fc9',ms:7100,on:'activate',name:"Sky Striker Special Maneuver - Lemnisgate!"}),
 24010609:Object.freeze({src:'clips/24010609.mp4',grad:['#0f72ef','#0087ff'],tint:'#1d81fb',ms:7100,on:'activate',name:"Sky Striker Mecha Modules - Multirole"}),
 98462037:Object.freeze({src:'clips/98462037.mp4',grad:['#b929d5','#c31ce2'],tint:'#c139de',ms:7100,on:'summon',name:"Sky Striker Ace - Azalea"}),
 12421694:Object.freeze({src:'clips/12421694.mp4',grad:['#fcba02','#ffcd00'],tint:'#ffca19',ms:7100,on:'summon',name:"Sky Striker Ace - Kaina"}),
 17217034:Object.freeze({src:'clips/17217034.mp4',grad:['#bf3fb5','#d32b3c'],tint:'#e92e8a',ms:7100,on:'summon',name:"Combined Maneuver - Engage Zero!"}),
 10045474:Object.freeze({src:'clips/10045474.mp4',grad:['#4a7bb4','#00abff'],tint:'#4f9fc8',ms:7100,on:'activate',name:"Infinite Impermanence"}),
 // Blue-Eyes set 1 (Kevy, 20 Nov 12:25)
 89631139:Object.freeze({src:'clips/89631139.mp4',grad:['#2c79d2','#2e7ad0'],tint:'#4788d0',ms:7100,on:'summon',name:"Blue-Eyes White Dragon"}),
 8240199:Object.freeze({src:'clips/8240199.mp4',grad:['#2286dc','#3575c9'],tint:'#3f8ad8',ms:7100,on:'summon',name:"Sage with Eyes of Blue"}),
 17947697:Object.freeze({src:'clips/17947697.mp4',grad:['#4a95b4','#9ca658'],tint:'#6cab89',ms:7100,on:'summon',name:"Maiden of White"}),
 63198739:Object.freeze({src:'clips/63198739.mp4',grad:['#d62828','#d62829'],tint:'#d93f40',ms:7100,on:'summon',name:"Primite Dragon Ether Beryl"}),
 59822133:Object.freeze({src:'clips/59822133.mp4',grad:['#2a60d4','#4d78b1'],tint:'#507ac8',ms:7100,on:'summon',name:"Blue-Eyes Spirit Dragon"}),
 89604813:Object.freeze({src:'clips/89604813.mp4',grad:['#a95575','#e9aa15'],tint:'#f5a822',ms:7100,on:'summon',name:"Blue-Eyes Ultimate Spirit Dragon"}),
 56532353:Object.freeze({src:'clips/56532353.mp4',grad:['#4839c5','#e4791a'],tint:'#6177b7',ms:7100,on:'summon',name:"Neo Blue-Eyes Ultimate Dragon"}),
 11443677:Object.freeze({src:'clips/11443677.mp4',grad:['#f1970d','#f87506'],tint:'#ff9119',ms:7100,on:'summon',name:"Blue-Eyes Tyrant Dragon"}),
 17725109:Object.freeze({src:'clips/17725109.mp4',grad:['#3881c6','#3591c9'],tint:'#3a9ade',ms:7100,on:'activate',name:"Roar of the Blue-Eyed Dragons"}),
 97268402:Object.freeze({src:'clips/97268402.mp4',grad:['#4594b9','#2990d5'],tint:'#42a4d5',ms:7100,on:'activate',name:"Effect Veiler"})
});
export const CLIP_GRACE_MS=2500;
// r67.13 transitions (Kevy 20 Nov 00:07: "some generic transition animation so the animations don't seem so chopped in ... maybe
// the field swirls or the camera pans out to a cutscene" and "a more gradual sound fade out and back in"): the clip zooms
// out of the card's spot on the field inside a colour swirl, then shrinks back into it; music and clip sound ramp, not cut.
export const INTRO_MS=650,OUTRO_MS=520,SKIP_OUTRO_MS=360;
// r67.13 fix (Kevy 20 Nov 00:45: "some of the sky striker animations didn't play"): the step used to last a fixed time, so a
// clip still loading on a tablet was cut off or never seen. Now the player ends the step itself (video end, Skip, a load that
// never starts, or a stall) and the duel's timer is only a safety cap. Clips also start loading when their step is queued.
export const LOAD_ALLOWANCE_MS=12000,START_TIMEOUT_MS=9000,STALL_MS=5000;
const PRELOADED=new Map();// src -> <video> already loading, reused by the player
export function preloadClip(src,doc=globalThis.document){try{if(!doc||PRELOADED.has(src))return;const v=doc.createElement('video');v.preload='auto';v.muted=true;v.playsInline=true;v.setAttribute('playsinline','');v.src=src;v.load?.();PRELOADED.set(src,v);while(PRELOADED.size>4){const [k,old]=PRELOADED.entries().next().value;PRELOADED.delete(k);try{old.removeAttribute('src');old.load?.()}catch{}}}catch{}}
const FACEDOWN=10;// POS_FACEDOWN_ATTACK 2 | POS_FACEDOWN_DEFENSE 8: a set card never reveals its clip
const baseCode=(code,db,registry)=>{const a=db?.[code]?.alias;return a&&registry[a]?a:code};
export function clipFor(e,db={},registry=BOSS_CLIPS){
 if(!e||e.private||!e.code)return null;const code=baseCode(e.code,db,registry),clip=registry[code];if(!clip)return null;
 const on=clip.on||'summon';
 if(e.type==='summon'&&!(e.position&FACEDOWN)&&(on==='summon'||on==='both'))return {code,clip};
 if(e.type==='activate'&&(on==='activate'||on==='both'))return {code,clip};
 return null;
}
// Once per card per duel (either player). reset() at every new duel; nothing is marked while the gate is off.
export class ClipDirector{
 constructor(registry=BOSS_CLIPS){this.registry=registry;this.reset()}
 reset(){this.played=new Set()}
 decorate(batches,on,db={}){
  if(!on)return batches;const out=[];
  for(const batch of batches){
   for(const e of batch.events){const hit=clipFor(e,db,this.registry);if(!hit||this.played.has(hit.code))continue;this.played.add(hit.code);
    const src=e.source,at=e.type==='summon'?{controller:e.player,location:4,sequence:e.sequence}:src&&src.location!=null&&src.sequence!=null?{controller:src.controller??e.player,location:src.location,sequence:src.sequence}:(e.location!=null&&e.sequence!=null?{controller:e.player,location:e.location,sequence:e.sequence}:null);
    out.push({events:[{type:'bossClip',id:e.id,code:hit.code,player:e.player,trigger:e.type,clip:hit.clip,at}],duration:hit.clip.ms+CLIP_GRACE_MS+INTRO_MS+OUTRO_MS+LOAD_ALLOWANCE_MS});preloadClip(hit.clip.src)}
   out.push(batch);
  }
  return out;
 }
}

// r67.13 look (Kevy 19 Nov 22:25: "its own matching background so it kind of blends with the game" and "its own unique
// title"): the duel stays faintly visible behind a blurred, darkened veil lit in the clip's own colour; the clip sits in a
// gold-edged frame; the title is a banner in the game's Cinzel lettering with a coloured SUMMON / ACTIVATE tag.
// The styles live in a <style> inside the dialog, so no page stylesheet (or its pinned order) changes.
const SHEET=`
.boss-clip{position:fixed;inset:0;z-index:2147483000;width:100vw;height:100vh;height:100dvh;max-width:none;max-height:none;margin:0;padding:0;border:0;color:#fff;overflow:hidden;touch-action:manipulation;cursor:pointer;
 display:flex;flex-direction:column;align-items:center;justify-content:center;gap:clamp(10px,2.4dvh,24px);padding:clamp(56px,8dvh,84px) 12px max(18px,env(safe-area-inset-bottom));box-sizing:border-box;
 background:radial-gradient(ellipse at 50% 42%,color-mix(in srgb,var(--clip-tint) 30%,transparent),transparent 62%),linear-gradient(170deg,color-mix(in srgb,var(--clip-top) 42%,rgba(6,4,10,.62)),color-mix(in srgb,var(--clip-tint) 22%,rgba(6,4,10,.66)) 50%,color-mix(in srgb,var(--clip-bot) 42%,rgba(6,4,10,.62)));
 -webkit-backdrop-filter:blur(14px) saturate(1.2);backdrop-filter:blur(14px) saturate(1.2);animation:bossClipIn .45s ease-out both}
.boss-clip.is-out{animation:none}
.boss-clip-swirl{position:fixed;left:var(--sx,50%);top:var(--sy,50%);width:150vmax;height:150vmax;margin:-75vmax 0 0 -75vmax;border-radius:50%;pointer-events:none;z-index:0;opacity:0;
 background:conic-gradient(from 0deg,var(--clip-tint),transparent 18%,var(--clip-top) 33%,transparent 50%,var(--clip-bot) 66%,transparent 82%,var(--clip-tint));
 -webkit-mask:radial-gradient(circle,transparent 0 6%,#000 14% 40%,transparent 62%);mask:radial-gradient(circle,transparent 0 6%,#000 14% 40%,transparent 62%);mix-blend-mode:screen}
.boss-clip::backdrop{background:rgba(0,0,0,.25)}
.boss-clip-glow{position:absolute;inset:-12%;background:var(--clip-poster) center/cover no-repeat;filter:blur(48px) saturate(1.5);opacity:.4;pointer-events:none;z-index:0}
.boss-clip-frame{position:relative;z-index:1;flex:none;width:min(94vw,calc(100dvh - 230px));aspect-ratio:1;border-radius:18px;overflow:hidden;background:#000;
 box-shadow:0 0 0 2px rgba(255,214,120,.85),0 0 0 5px rgba(0,0,0,.55),0 0 46px 6px color-mix(in srgb,var(--clip-tint) 70%,transparent),0 24px 60px rgba(0,0,0,.7);will-change:transform,opacity}
.boss-clip-frame::after{content:'';position:absolute;inset:0;border-radius:inherit;pointer-events:none;box-shadow:inset 0 0 60px rgba(0,0,0,.55)}
.boss-clip-frame.is-loading::before{content:'';position:absolute;inset:0;z-index:1;pointer-events:none;background:linear-gradient(110deg,transparent 30%,rgba(255,236,190,.28) 50%,transparent 70%) 0 0/250% 100%;animation:bossClipLoad 1.2s linear infinite}
@keyframes bossClipLoad{from{background-position:130% 0}to{background-position:-130% 0}}
.boss-clip-video{display:block;width:100%;height:100%;object-fit:cover;background:#000;pointer-events:none}
.boss-clip-caption{position:relative;z-index:1;margin:0;display:grid;justify-items:center;gap:6px;text-align:center;pointer-events:none;max-width:min(94vw,760px)}
.boss-clip-tag{font:800 clamp(11px,1.6vw,14px)/1 'Duel UI',Inter,system-ui,sans-serif;letter-spacing:.32em;padding:6px 14px 6px 18px;border-radius:999px;color:#fff;
 background:linear-gradient(90deg,color-mix(in srgb,var(--clip-tint) 85%,#000),var(--clip-tint));box-shadow:0 0 18px color-mix(in srgb,var(--clip-tint) 70%,transparent);animation:bossClipTag .5s .25s ease-out both}
.boss-clip-sep{display:none}
.boss-clip-name{font:900 clamp(24px,5vw,46px)/1.1 Cinzel,Georgia,serif;letter-spacing:.03em;
 background:linear-gradient(180deg,#fff6d8 0%,#ffd77a 45%,#c9902e 100%);-webkit-background-clip:text;background-clip:text;color:transparent;
 filter:drop-shadow(0 2px 0 rgba(0,0,0,.9)) drop-shadow(0 0 14px color-mix(in srgb,var(--clip-tint) 75%,transparent));animation:bossClipName .6s .35s cubic-bezier(.2,1,.3,1) both}
.boss-clip-rule{width:min(70vw,420px);height:2px;background:linear-gradient(90deg,transparent,#ffd77a,transparent);animation:bossClipRule .6s .45s ease-out both}
@keyframes bossClipIn{from{opacity:0}}
@keyframes bossClipFrame{from{opacity:0;transform:scale(.86)}}
@keyframes bossClipTag{from{opacity:0;transform:translateY(8px)}}
@keyframes bossClipName{from{opacity:0;letter-spacing:.4em;transform:translateY(10px)}}
@keyframes bossClipRule{from{transform:scaleX(0)}}
@media (orientation:landscape) and (max-height:520px){.boss-clip{flex-direction:row;padding:12px 64px}.boss-clip-frame{width:calc(100dvh - 24px)}.boss-clip-caption{max-width:36vw}}
`;
const CSS={
 skip:"position:absolute;z-index:2;top:max(12px,env(safe-area-inset-top));right:max(12px,env(safe-area-inset-right));min-width:96px;min-height:48px;padding:0 18px;border:2px solid rgba(255,214,120,.9);border-radius:24px;background:rgba(0,0,0,.55);color:#ffe7a8;font:800 16px/1 'Duel UI',Inter,system-ui,sans-serif;letter-spacing:.08em;cursor:pointer",
 test:'position:fixed;left:12px;bottom:12px;z-index:2147482000;min-height:48px;padding:0 16px;border-radius:24px;border:2px solid #ffd54a;background:#1b1b1b;color:#ffd54a;font:700 15px/1 system-ui,sans-serif'
};

// Kevy 19 Nov: the clips carry their own sound effects, so the duel music dips while one plays and comes back after.
const DUCK_LEVEL=.12;
function duckMusic(down){try{const s=globalThis.ddlSound,c=s?.context,g=s?.duckBus?.gain;if(!c||!g)return;const t=c.currentTime;g.cancelScheduledValues(t);g.setValueAtTime(g.value,t);g.linearRampToValueAtTime(down?DUCK_LEVEL:1,t+(down?.9:1.6))}catch{}}
function whoosh(gain=.55){try{const s=globalThis.ddlSound;if(s&&s._enabled!==false)s.sample?.('whoosh',{gain})}catch{}}
// Clip sound fades in and out instead of starting or stopping abruptly (iOS ignores video.volume; harmless there).
function fadeVolume(v,to,ms){try{const from=v.volume,t0=performance.now(),step=()=>{const k=Math.min(1,(performance.now()-t0)/ms);try{v.volume=Math.max(0,Math.min(1,from+(to-from)*k))}catch{}if(k<1&&v.isConnected)requestAnimationFrame(step)};step()}catch{}}
const slotRect=(doc,at)=>{try{if(!at)return null;const n=doc.querySelector(`[data-slot="${at.controller}:${at.location}:${at.sequence}"]`),r=n?.getBoundingClientRect();return r&&r.width>4&&r.height>4?r:null}catch{return null}};
export class BossClipPlayer{
 constructor({document,onEnd=()=>{}}){Object.assign(this,{document,onEnd});this.node=null;this.video=null}
 get active(){return !!this.node}
 play(e,{name=''}={}){
  this.clear();const doc=this.document,clip=e.clip;
  // A modal <dialog> joins the top layer, so the clip covers any decision sheet or menu dialog already open.
  const root=doc.createElement('dialog');root.className='boss-clip';root.setAttribute('aria-label',(name||'Card')+' cut scene');
  root.style.setProperty('--clip-tint',clip.tint||'#d9a441');root.style.setProperty('--clip-top',clip.grad?.[0]||clip.tint||'#d9a441');root.style.setProperty('--clip-bot',clip.grad?.[1]||clip.tint||'#d9a441');root.style.setProperty('--clip-poster',`url("${clip.src.replace(/\.mp4$/,'.jpg')}")`);
  const sheet=doc.createElement('style');sheet.textContent=SHEET;
  const glow=doc.createElement('div');glow.className='boss-clip-glow';
  const frame=doc.createElement('div');frame.className='boss-clip-frame';
  const pre=PRELOADED.get(clip.src);PRELOADED.delete(clip.src);const v=pre||doc.createElement('video');v.className='boss-clip-video';if(!pre)v.src=clip.src;v.muted=false;v.poster=clip.src.replace(/\.mp4$/,'-f0.jpg');v.playsInline=true;v.setAttribute('playsinline','');v.preload='auto';v.autoplay=true;v.disablePictureInPicture=true;frame.append(v);
  const cap=doc.createElement('p');cap.className='boss-clip-caption';
  const tag=doc.createElement('span');tag.className='boss-clip-tag';tag.textContent=e.trigger==='activate'?'ACTIVATED':'SUMMONED';
  const sep=doc.createElement('span');sep.className='boss-clip-sep';sep.textContent=' · ';
  const nm=doc.createElement('span');nm.className='boss-clip-name';nm.textContent=name||'';nm.style.setProperty('font-family','Cinzel,Georgia,serif','important');
  const rule=doc.createElement('span');rule.className='boss-clip-rule';rule.setAttribute('aria-hidden','true');cap.append(tag,sep,nm,rule);
  const skip=doc.createElement('button');skip.type='button';skip.className='boss-clip-skip';skip.style.cssText=CSS.skip;skip.textContent='Skip ▸';skip.setAttribute('aria-label','Skip cut scene');
  const swirl=doc.createElement('div');swirl.className='boss-clip-swirl';
  root.append(sheet,swirl,glow,frame,cap,skip);this.node=root;this.video=v;v.autoplay=false;this.held=false;
  // Loading and stall guard: a soft glow shows while the clip buffers; a clip that never starts, or freezes, ends cleanly.
  const t0=Date.now();let started=false,lastT=-1,lastMove=Date.now();
  const loading=on=>frame.classList.toggle('is-loading',!!on);loading(true);
  v.addEventListener('playing',()=>{started=true;loading(false)});v.addEventListener('waiting',()=>loading(true));v.addEventListener('canplay',()=>{if(started)loading(false)});
  const guard=setInterval(()=>{if(this.node!==root){clearInterval(guard);return}if(this.held||ending)return;const now=Date.now();
   if(!started){if(now-t0>INTRO_MS+START_TIMEOUT_MS){clearInterval(guard);end('error')}return}
   if(v.currentTime!==lastT){lastT=v.currentTime;lastMove=now;return}
   if(!v.paused&&now-lastMove>STALL_MS){clearInterval(guard);end('ended')}},400);
  const anim=(el,kf,opt)=>{try{return el.animate?.(kf,{fill:'both',...opt})}catch{return null}};
  let ending=false;
  // Outro: the clip shrinks back toward the card's spot, the veil fades, the music ramps back; then the duel carries on.
  const end=reason=>{if(this.node!==root||ending)return;ending=true;
   if(reason==='error'||!root.animate){this.clear();this.onEnd(reason);return}
   const ms=reason==='skip'?SKIP_OUTRO_MS:OUTRO_MS;root.classList.add('is-out');duckMusic(false);fadeVolume(v,0,ms*.8);if(reason==='skip')whoosh(.35);
   const to=slotRect(doc,e.at),fr=frame.getBoundingClientRect();
   const tx=to?`translate(${to.left+to.width/2-(fr.left+fr.width/2)}px,${to.top+to.height/2-(fr.top+fr.height/2)}px) scale(${Math.max(.08,to.width/fr.width)}) rotate(4deg)`:'scale(.72)';
   anim(frame,[{transform:'none',opacity:1},{transform:tx,opacity:0}],{duration:ms,easing:'cubic-bezier(.55,0,.75,.35)'});
   anim(cap,[{opacity:1,transform:'none'},{opacity:0,transform:'translateY(14px)'}],{duration:ms*.6,easing:'ease-in'});
   anim(skip,[{opacity:1},{opacity:0}],{duration:ms*.5});
   anim(swirl,[{opacity:0,transform:'rotate(0) scale(1.4)'},{opacity:.55,transform:'rotate(-120deg) scale(.6)',offset:.5},{opacity:0,transform:'rotate(-240deg) scale(.1)'}],{duration:ms*1.1,easing:'ease-in'});
   anim(root,[{opacity:1},{opacity:1,offset:.45},{opacity:0}],{duration:ms+60,easing:'ease-in'});
   setTimeout(()=>{if(this.node!==root)return;this.clear();this.onEnd(reason)},ms+70)};
  v.addEventListener('ended',()=>end('ended'));v.addEventListener('error',()=>end('error'));
  root.addEventListener('pointerup',ev=>{ev.preventDefault();ev.stopPropagation();end('skip')});
  skip.addEventListener('click',ev=>{ev.stopPropagation();end('skip')});
  root.addEventListener('keydown',ev=>{if(ev.key===' '||ev.key==='Enter'){ev.preventDefault();end('skip')}});
  root.addEventListener('cancel',ev=>{ev.preventDefault();end('skip')});// Escape
  duckMusic(true);doc.body.append(root);try{root.showModal()}catch{root.setAttribute('open','')}try{skip.focus({preventScroll:true})}catch{}
  // Intro: a colour swirl opens from the card's spot on the field and the clip zooms out of it ("camera dives in").
  const from=slotRect(doc,e.at),fr=frame.getBoundingClientRect();
  if(from&&fr.width){root.style.setProperty('--sx',(from.left+from.width/2)+'px');root.style.setProperty('--sy',(from.top+from.height/2)+'px')}
  const fx=from&&fr.width?`translate(${from.left+from.width/2-(fr.left+fr.width/2)}px,${from.top+from.height/2-(fr.top+fr.height/2)}px) scale(${Math.max(.08,from.width/fr.width)}) rotate(-8deg)`:'scale(.35) rotate(-8deg)';
  whoosh();
  anim(swirl,[{opacity:0,transform:'rotate(0) scale(.05)'},{opacity:.9,transform:'rotate(260deg) scale(.8)',offset:.55},{opacity:0,transform:'rotate(420deg) scale(1.6)'}],{duration:INTRO_MS+450,easing:'cubic-bezier(.3,.6,.4,1)'});
  anim(frame,[{transform:fx,opacity:0,filter:'brightness(2.4)'},{opacity:1,offset:.35},{transform:'none',opacity:1,filter:'brightness(1)'}],{duration:INTRO_MS,easing:'cubic-bezier(.2,.9,.25,1.05)'});
  // The clip starts as the zoom lands, so its first frame (the card art) is what flies out of the field.
  try{v.volume=0}catch{}
  const start=()=>{if(this.node!==root||ending)return;const p=v.play?.();fadeVolume(v,1,450);if(p&&p.catch)p.catch(()=>{if(this.node!==root)return;v.muted=true;v.play?.()?.catch?.(()=>end('error'))})};
  if(root.animate)setTimeout(start,Math.round(INTRO_MS*.7));else start();
  return root;
 }
 hold(value){this.held=!!value;if(!this.video)return;try{value?this.video.pause():this.video.play()?.catch?.(()=>{})}catch{}}
 clear(){if(this.node)duckMusic(false);if(this.video){try{this.video.pause();this.video.removeAttribute('src');this.video.load?.()}catch{}}try{this.node?.open&&this.node.close?.()}catch{}this.node?.remove();this.node=null;this.video=null}
}

// Preview for Kevy: open the simulator with ?bossclip-test to get a "Cut scenes" button. It opens a list of every
// registered clip; tapping one plays it exactly as the duel shows it. It is outside the duel and sends nothing to it.
export function installClipTest(win=globalThis.window){
 try{const doc=win?.document;if(!doc||!new URLSearchParams(win.location.search).has('bossclip-test')||doc.querySelector('.boss-clip-test'))return null;
  const b=doc.createElement('button');b.type='button';b.className='boss-clip-test';b.style.cssText=CSS.test;b.textContent='▶ Cut scenes';
  const list=doc.createElement('div');list.className='boss-clip-list';list.hidden=true;
  list.style.cssText='position:fixed;left:12px;bottom:68px;z-index:2147482000;display:grid;gap:6px;max-height:calc(100dvh - 90px);overflow:auto;padding:10px;border:2px solid #ffd54a;border-radius:16px;background:rgba(15,15,15,.94)';
  const player=new BossClipPlayer({document:doc,onEnd:()=>{try{b.focus()}catch{}}});
  const seen=new Set();
  for(const [code,clip] of Object.entries(BOSS_CLIPS)){if(seen.has(clip.src))continue;seen.add(clip.src);
   const i=doc.createElement('button');i.type='button';i.textContent=clip.name;i.style.cssText='min-height:44px;padding:0 14px;border:1px solid #555;border-radius:12px;background:#262626;color:#fff;font:600 15px/1.1 system-ui,sans-serif;text-align:left';
   i.addEventListener('click',()=>{list.hidden=true;player.play({type:'bossClip',code:+code,trigger:clip.on,clip},{name:clip.name})});list.append(i)}
  b.addEventListener('click',()=>{list.hidden=!list.hidden});
  // A modal dialog (start menu, notices) makes the page behind it inert, so the button follows the open dialog.
  const home=()=>{const d=[...doc.querySelectorAll('dialog[open]')].filter(x=>!x.classList.contains('boss-clip')).at(-1)||doc.body;if(b.parentElement!==d){d.append(b,list)}};home();win.setInterval?.(home,500);return b}catch{return null}
}
if(globalThis.window?.document&&/bossclip-test/.test(globalThis.window.location?.search||'')){const w=globalThis.window,go=()=>setTimeout(()=>installClipTest(w),1200);w.document.readyState==='complete'?go():w.addEventListener('load',go)}// after the start menu opens

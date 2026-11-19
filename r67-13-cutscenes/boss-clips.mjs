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
 35809262:Object.freeze({src:'clips/35809262.mp4',tint:'#ee802a',ms:7100,on:'summon',name:"Elemental HERO Flame Wingman"}),
 13243124:Object.freeze({src:'clips/35809262.mp4',tint:'#ee802a',ms:7100,on:'summon',name:"Favorite HERO Flame Wingman"}),
 68468459:Object.freeze({src:'clips/68468459.mp4',tint:'#e05438',ms:7100,on:'summon',name:"Fallen of Albaz"}),
 62962630:Object.freeze({src:'clips/62962630.mp4',tint:'#f52240',ms:7100,on:'summon',name:"Aluber the Jester of Despia"}),
 44146295:Object.freeze({src:'clips/44146295.mp4',tint:'#5b8cff',ms:7100,on:'summon',name:"Mirrorjade the Iceblade Dragon"}),
 72272462:Object.freeze({src:'clips/72272462.mp4',tint:'#fe1a4d',ms:7100,on:'summon',name:"Despian Quaeritis"}),
 76666602:Object.freeze({src:'clips/76666602.mp4',tint:'#f54a23',ms:7100,on:'summon',name:"The Dragon that Devours the Dogma"}),
 41373230:Object.freeze({src:'clips/41373230.mp4',tint:'#eb372c',ms:7100,on:'summon',name:"Titaniklad the Ash Dragon"}),
 70534340:Object.freeze({src:'clips/70534340.mp4',tint:'#ffb019',ms:7100,on:'summon',name:"Lubellion the Searing Dragon"}),
 44362883:Object.freeze({src:'clips/44362883.mp4',tint:'#fb601c',ms:7100,on:'activate',name:"Branded Fusion"}),
 48130397:Object.freeze({src:'clips/48130397.mp4',tint:'#8f7cff',ms:7100,on:'activate',name:"Super Polymerization"}),
 14558127:Object.freeze({src:'clips/14558127.mp4',tint:'#ff4719',ms:7100,on:'activate',name:"Ash Blossom & Joyous Spring"}),
 59438930:Object.freeze({src:'clips/59438930.mp4',tint:'#c057a0',ms:7100,on:'activate',name:"Ghost Ogre & Snow Rabbit"}),
 55273560:Object.freeze({src:'clips/55273560.mp4',tint:'#ee9629',ms:7100,on:'summon',name:"Incredible Ecclesia, the Virtuous"}),
 87758525:Object.freeze({src:'clips/87758525.mp4',tint:'#25f253',ms:7100,on:'summon',name:"Favorite HERO Shining Flare Wingman"}),
 42141493:Object.freeze({src:'clips/42141493.mp4',tint:'#2967ee',ms:7100,on:'activate',name:"Mulcharmy Fuwalos"}),
 94145021:Object.freeze({src:'clips/94145021.mp4',tint:'#de30e8',ms:7100,on:'activate',name:"Droll & Lock Bird"}),
 45883110:Object.freeze({src:'clips/45883110.mp4',tint:'#ff193b',ms:7100,on:'summon',name:"Guiding Quem, the Virtuous"}),
 95515789:Object.freeze({src:'clips/95515789.mp4',tint:'#fd1c1a',ms:7100,on:'summon',name:"Blazing Cartesia, the Virtuous"}),
 60303688:Object.freeze({src:'clips/60303688.mp4',tint:'#d69041',ms:7100,on:'summon',name:"Dogmatika Ecclesia, the Virtuous"}),
 73819701:Object.freeze({src:'clips/73819701.mp4',tint:'#dc6d3b',ms:7100,on:'summon',name:"Fallen of the White Dragon"}),
 74405783:Object.freeze({src:'clips/74405783.mp4',tint:'#ffbf19',ms:7100,on:'summon',name:"The Three Champions of Swordsoul"}),
 3410461:Object.freeze({src:'clips/3410461.mp4',tint:'#ff2819',ms:7100,on:'summon',name:"Alba-Lenatus the Abyss Dragon"}),
 30271097:Object.freeze({src:'clips/30271097.mp4',tint:'#d64d41',ms:7100,on:'activate',name:"The Fallen & The Virtuous"})
});
export const CLIP_GRACE_MS=2500;
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
    out.push({events:[{type:'bossClip',id:e.id,code:hit.code,player:e.player,trigger:e.type,clip:hit.clip}],duration:hit.clip.ms+CLIP_GRACE_MS})}
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
 background:radial-gradient(ellipse at 50% 42%,color-mix(in srgb,var(--clip-tint) 34%,transparent),transparent 62%),rgba(6,4,10,.6);
 -webkit-backdrop-filter:blur(14px) saturate(1.2);backdrop-filter:blur(14px) saturate(1.2);animation:bossClipIn .32s ease-out both}
.boss-clip::backdrop{background:rgba(0,0,0,.25)}
.boss-clip-glow{position:absolute;inset:-12%;background:var(--clip-poster) center/cover no-repeat;filter:blur(48px) saturate(1.5);opacity:.4;pointer-events:none;z-index:0}
.boss-clip-frame{position:relative;z-index:1;flex:none;width:min(94vw,calc(100dvh - 230px));aspect-ratio:1;border-radius:18px;overflow:hidden;background:#000;
 box-shadow:0 0 0 2px rgba(255,214,120,.85),0 0 0 5px rgba(0,0,0,.55),0 0 46px 6px color-mix(in srgb,var(--clip-tint) 70%,transparent),0 24px 60px rgba(0,0,0,.7);animation:bossClipFrame .45s cubic-bezier(.2,1.3,.4,1) both}
.boss-clip-frame::after{content:'';position:absolute;inset:0;border-radius:inherit;pointer-events:none;box-shadow:inset 0 0 60px rgba(0,0,0,.55)}
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
function duckMusic(down){try{const s=globalThis.ddlSound,c=s?.context,g=s?.duckBus?.gain;if(!c||!g)return;const t=c.currentTime;g.cancelScheduledValues(t);g.setTargetAtTime(down?DUCK_LEVEL:1,t,down?.08:.35)}catch{}}
export class BossClipPlayer{
 constructor({document,onEnd=()=>{}}){Object.assign(this,{document,onEnd});this.node=null;this.video=null}
 get active(){return !!this.node}
 play(e,{name=''}={}){
  this.clear();const doc=this.document,clip=e.clip;
  // A modal <dialog> joins the top layer, so the clip covers any decision sheet or menu dialog already open.
  const root=doc.createElement('dialog');root.className='boss-clip';root.setAttribute('aria-label',(name||'Card')+' cut scene');
  root.style.setProperty('--clip-tint',clip.tint||'#d9a441');root.style.setProperty('--clip-poster',`url("${clip.src.replace(/\.mp4$/,'.jpg')}")`);
  const sheet=doc.createElement('style');sheet.textContent=SHEET;
  const glow=doc.createElement('div');glow.className='boss-clip-glow';
  const frame=doc.createElement('div');frame.className='boss-clip-frame';
  const v=doc.createElement('video');v.className='boss-clip-video';v.src=clip.src;v.playsInline=true;v.setAttribute('playsinline','');v.preload='auto';v.autoplay=true;v.disablePictureInPicture=true;frame.append(v);
  const cap=doc.createElement('p');cap.className='boss-clip-caption';
  const tag=doc.createElement('span');tag.className='boss-clip-tag';tag.textContent=e.trigger==='activate'?'ACTIVATED':'SUMMONED';
  const sep=doc.createElement('span');sep.className='boss-clip-sep';sep.textContent=' · ';
  const nm=doc.createElement('span');nm.className='boss-clip-name';nm.textContent=name||'';nm.style.setProperty('font-family','Cinzel,Georgia,serif','important');
  const rule=doc.createElement('span');rule.className='boss-clip-rule';rule.setAttribute('aria-hidden','true');cap.append(tag,sep,nm,rule);
  const skip=doc.createElement('button');skip.type='button';skip.className='boss-clip-skip';skip.style.cssText=CSS.skip;skip.textContent='Skip ▸';skip.setAttribute('aria-label','Skip cut scene');
  root.append(sheet,glow,frame,cap,skip);this.node=root;this.video=v;
  const end=reason=>{if(this.node!==root)return;this.clear();this.onEnd(reason)};
  v.addEventListener('ended',()=>end('ended'));v.addEventListener('error',()=>end('error'));
  root.addEventListener('pointerup',ev=>{ev.preventDefault();ev.stopPropagation();end('skip')});
  skip.addEventListener('click',ev=>{ev.stopPropagation();end('skip')});
  root.addEventListener('keydown',ev=>{if(ev.key===' '||ev.key==='Enter'){ev.preventDefault();end('skip')}});
  root.addEventListener('cancel',ev=>{ev.preventDefault();end('skip')});// Escape
  duckMusic(true);doc.body.append(root);try{root.showModal()}catch{root.setAttribute('open','')}try{skip.focus({preventScroll:true})}catch{}
  // Autoplay with sound needs an earlier tap; in a duel there always is one. If the browser still refuses, play muted.
  const p=v.play?.();if(p&&p.catch)p.catch(()=>{if(this.node!==root)return;v.muted=true;v.play?.()?.catch?.(()=>end('error'))});
  return root;
 }
 hold(value){if(!this.video)return;try{value?this.video.pause():this.video.play()?.catch?.(()=>{})}catch{}}
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

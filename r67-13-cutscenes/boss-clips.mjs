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
 35809262:Object.freeze({src:'clips/35809262.mp4',ms:7100,on:'summon',name:"Elemental HERO Flame Wingman"}),
 13243124:Object.freeze({src:'clips/35809262.mp4',ms:7100,on:'summon',name:"Favorite HERO Flame Wingman"}),
 68468459:Object.freeze({src:'clips/68468459.mp4',ms:7100,on:'summon',name:"Fallen of Albaz"}),
 62962630:Object.freeze({src:'clips/62962630.mp4',ms:7100,on:'summon',name:"Aluber the Jester of Despia"}),
 44146295:Object.freeze({src:'clips/44146295.mp4',ms:7100,on:'summon',name:"Mirrorjade the Iceblade Dragon"}),
 72272462:Object.freeze({src:'clips/72272462.mp4',ms:7100,on:'summon',name:"Despian Quaeritis"}),
 76666602:Object.freeze({src:'clips/76666602.mp4',ms:7100,on:'summon',name:"The Dragon that Devours the Dogma"}),
 41373230:Object.freeze({src:'clips/41373230.mp4',ms:7100,on:'summon',name:"Titaniklad the Ash Dragon"}),
 70534340:Object.freeze({src:'clips/70534340.mp4',ms:7100,on:'summon',name:"Lubellion the Searing Dragon"}),
 44362883:Object.freeze({src:'clips/44362883.mp4',ms:7100,on:'activate',name:"Branded Fusion"}),
 48130397:Object.freeze({src:'clips/48130397.mp4',ms:7100,on:'activate',name:"Super Polymerization"}),
 14558127:Object.freeze({src:'clips/14558127.mp4',ms:7100,on:'activate',name:"Ash Blossom & Joyous Spring"}),
 59438930:Object.freeze({src:'clips/59438930.mp4',ms:7100,on:'activate',name:"Ghost Ogre & Snow Rabbit"})
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

const CSS={
 root:'position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;width:100vw;height:100vh;height:100dvh;max-width:none;max-height:none;margin:0;padding:0;border:0;background:#000;color:#fff;overflow:hidden;touch-action:manipulation;cursor:pointer',
 video:'width:100vw;height:100vh;height:100dvh;object-fit:contain;background:#000;pointer-events:none',
 caption:'position:absolute;left:0;right:0;bottom:max(16px,env(safe-area-inset-bottom));margin:0;padding:0 112px 0 16px;color:#fff;font:700 clamp(14px,2.4vw,22px)/1.2 system-ui,sans-serif;letter-spacing:.06em;text-shadow:0 2px 6px #000;pointer-events:none',
 skip:'position:absolute;top:max(12px,env(safe-area-inset-top));right:max(12px,env(safe-area-inset-right));min-width:96px;min-height:48px;padding:0 18px;border:2px solid #fff;border-radius:24px;background:rgba(0,0,0,.55);color:#fff;font:700 16px/1 system-ui,sans-serif;cursor:pointer',
 test:'position:fixed;left:12px;bottom:12px;z-index:2147482000;min-height:48px;padding:0 16px;border-radius:24px;border:2px solid #ffd54a;background:#1b1b1b;color:#ffd54a;font:700 15px/1 system-ui,sans-serif'
};// inline styles: no new stylesheet, so the pinned stylesheet order is untouched

// Kevy 19 Nov: the clips carry their own sound effects, so the duel music dips while one plays and comes back after.
const DUCK_LEVEL=.12;
function duckMusic(down){try{const s=globalThis.ddlSound,c=s?.context,g=s?.duckBus?.gain;if(!c||!g)return;const t=c.currentTime;g.cancelScheduledValues(t);g.setTargetAtTime(down?DUCK_LEVEL:1,t,down?.08:.35)}catch{}}
export class BossClipPlayer{
 constructor({document,onEnd=()=>{}}){Object.assign(this,{document,onEnd});this.node=null;this.video=null}
 get active(){return !!this.node}
 play(e,{name=''}={}){
  this.clear();const doc=this.document,clip=e.clip;
  // A modal <dialog> joins the top layer, so the clip covers any decision sheet or menu dialog already open.
  const root=doc.createElement('dialog');root.className='boss-clip';root.style.cssText=CSS.root;root.setAttribute('aria-label',(name||'Card')+' cut scene');
  const v=doc.createElement('video');v.className='boss-clip-video';v.style.cssText=CSS.video;v.src=clip.src;v.playsInline=true;v.setAttribute('playsinline','');v.preload='auto';v.autoplay=true;v.disablePictureInPicture=true;
  const cap=doc.createElement('p');cap.className='boss-clip-caption';cap.style.cssText=CSS.caption;cap.textContent=(e.trigger==='activate'?'ACTIVATED · ':'SUMMONED · ')+(name||'');
  const skip=doc.createElement('button');skip.type='button';skip.className='boss-clip-skip';skip.style.cssText=CSS.skip;skip.textContent='Skip ▸';skip.setAttribute('aria-label','Skip cut scene');
  root.append(v,cap,skip);this.node=root;this.video=v;
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

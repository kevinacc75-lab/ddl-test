// r35 item 8 (Claude, 28 Oct 2026): deck-shuffle overlay + riffle (Kevy's request 25 Oct; settled spec v2, Seto 26 Oct 09:05;
// RELAY-046 design, Seto 27 Oct 10:10 rulings). A decorative, NON-BLOCKING layer:
//  - fed only by the worker's {epoch, shuffles:[{id, seat, afterEventId}]} envelope (one entry per real M.SHUFFLE_DECK);
//  - never joins the presentation queue, ChainDirector, holds, presentation-done / skip-scene messages or AI timing, and
//    never sends anything to the worker;
//  - seat-only with generic card backs and a FIXED sprite count (Alexis via Seto): no card, effect, count or order shown;
//  - 400 ms total, split at 80 ms (the riffle starts there and ends by ~280 ms), final gleam before 400 ms;
//  - bounded (Seto's overload ruling): one active + at most 4 waiting, drop the oldest waiting, waiting items expire after
//    800 ms, max 8 card-back sprites; ids deduped by a per-epoch high-water mark; no catch-up after background, Instant,
//    teardown or cancel;
//  - reduced motion (app or OS): a brief static gleam on the deck, no arcs; sound still follows the user's mute setting;
//  - transforms and opacity only (Web Animations), pointer-events:none, every node removed on finish or cancel;
//  - the deck pile is found by its canonical seat ([data-deck-pile="0|1"]) at play time, so seat swaps / view changes need
//    no re-emission; a view change cancels the effect that is playing.
export const SHUFFLE_MS=400,SPLIT_MS=80,GLEAM_MS=330,MAX_WAITING=4,EXPIRE_MS=800,SPRITES=6;
export class ShuffleOverlay{
 constructor({doc=globalThis.document,sound=null,now=()=>Date.now(),setTimer=(f,ms)=>setTimeout(f,ms),clearTimer=t=>clearTimeout(t),options=()=>({enabled:true,reduced:false}),view=()=>0}={}){
  Object.assign(this,{doc,sound,now,setTimer,clearTimer,options,view});
  this.epoch=null;this.high=0;this.waiting=[];this.active=null;this.dropped=0;this.played=0;
 }
 // Called for each accepted 'state' message (after the app's own session checks).
 accept(envelope){
  try{
   if(!envelope||!Number.isFinite(envelope.epoch))return;
   if(envelope.epoch!==this.epoch){this.cancel();this.epoch=envelope.epoch;this.high=0}
   const list=Array.isArray(envelope.shuffles)?envelope.shuffles:[],opts=this.options()||{};
   const live=opts.enabled!==false&&!this.doc?.hidden;
   if(!live)this.cancel();
   for(const s of list){if(!s||!(s.id>this.high)||(s.seat!==0&&s.seat!==1))continue;this.high=s.id;
    if(!live)continue;/* hidden / Instant / off: remembered as seen, never played later */
    this.waiting.push({id:s.id,seat:s.seat,at:this.now()});this.pump();/* idle: it starts now, so it is never counted as waiting */
    if(this.waiting.length>MAX_WAITING){this.waiting.shift();this.dropped++}}
  }catch{this.cancel()}
 }
 pump(){
  if(this.active)return;const t=this.now();
  while(this.waiting.length&&t-this.waiting[0].at>EXPIRE_MS){this.waiting.shift();this.dropped++}
  const next=this.waiting.shift();if(next)this.play(next);
 }
 // A view change (seat swap, control, manual mode) cancels the playing effect; nothing is re-emitted.
 viewChanged(){if(this.active&&this.active.view!==this.view())this.finish(true)}
 // New duel, rewind, import, stop, error, worker replacement, background: clear everything now.
 cancel(){this.waiting=[];if(this.active)this.finish(true)}
 // A new duel / rewind requested by the UI: clear now, and forget the epoch so the next envelope is taken as new.
 reset(){this.cancel();this.epoch=null;this.high=0}
 play(item){
  const opts=this.options()||{},pile=this.doc?.querySelector?.(`[data-deck-pile="${item.seat}"]`),body=this.doc?.body;
  if(!pile||!body||typeof pile.getBoundingClientRect!=='function'){this.dropped++;return this.pump()}
  const r=pile.getBoundingClientRect(),view=this.view(),reduced=!!opts.reduced;
  const layer=this.doc.createElement('div');layer.className='shuffle-overlay';layer.setAttribute('aria-hidden','true');
  Object.assign(layer.style,{position:'fixed',left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px',pointerEvents:'none',zIndex:'40',contain:'layout'});
  const anims=[],nodes=[layer],timers=[];const active=this.active={item,view,layer,anims,nodes,timers,riffle:null};
  const animate=(el,frames,o)=>{try{const a=el.animate?.(frames,o);if(a)anims.push(a)}catch{}};
  // The gleam: a soft light over the pile (the only visual under reduced motion).
  const gleam=this.doc.createElement('div');
  Object.assign(gleam.style,{position:'absolute',inset:'0',borderRadius:'8px',background:'radial-gradient(circle, rgba(255,255,255,.55), rgba(255,255,255,0) 70%)',opacity:'0'});
  layer.appendChild(gleam);
  if(reduced)animate(gleam,[{opacity:0},{opacity:.7,offset:.3},{opacity:0}],{duration:SHUFFLE_MS,easing:'ease-out'});
  else{
   animate(gleam,[{opacity:0},{opacity:0,offset:GLEAM_MS/SHUFFLE_MS},{opacity:.65,offset:.9},{opacity:0}],{duration:SHUFFLE_MS});
   const w=Math.max(18,Math.min(r.width*.62,64)),h=w*1.42,dx=Math.max(16,r.width*.85);/* a clear split: each half moves most of a card width */
   for(let i=0;i<SPRITES;i++){const back=this.doc.createElement('div'),side=i%2?1:-1,lift=(i>>1)*2;
    Object.assign(back.style,{position:'absolute',left:'50%',top:'50%',width:w+'px',height:h+'px',marginLeft:-w/2+'px',marginTop:-h/2+'px',borderRadius:'4px',border:'1px solid rgba(255,214,140,.75)',background:'linear-gradient(135deg,#3b1c0f,#7a3a14 45%,#2a120a)',boxShadow:'0 2px 6px rgba(0,0,0,.45)',opacity:'0',willChange:'transform, opacity'});
    layer.appendChild(back);
    // Split (0-80 ms), riffle the halves back together (80-300 ms), settle and fade (300-400 ms). Fixed offsets, no randomness.
    animate(back,[{transform:`translate(0px,${-lift}px)`,opacity:0},{transform:`translate(0px,${-lift}px)`,opacity:1,offset:.05},
     {transform:`translate(${side*dx}px,${-lift-6}px) rotate(${side*8}deg)`,opacity:1,offset:SPLIT_MS/SHUFFLE_MS},
     {transform:`translate(${side*dx*.55}px,${-16-i*2}px) rotate(${side*5}deg)`,opacity:1,offset:.45},
     {transform:`translate(0px,${-i}px)`,opacity:1,offset:.75},{transform:'translate(0px,0px)',opacity:0}],{duration:SHUFFLE_MS,easing:'ease-in-out'});
   }
  }
  body.appendChild(layer);this.played++;
  const own=view===item.seat?0:1;/* sound pan: our deck left, theirs right */
  timers.push(this.setTimer(()=>{if(this.active!==active)return;try{active.riffle=this.sound?.shuffleRiffle?.({seat:own})||null}catch{}},SPLIT_MS));
  timers.push(this.setTimer(()=>{if(this.active===active){this.finish(false);this.pump()}},SHUFFLE_MS));
 }
 finish(cancelled){
  const a=this.active;if(!a)return;this.active=null;
  for(const t of a.timers)try{this.clearTimer(t)}catch{}
  if(cancelled)try{a.riffle?.cancel()}catch{}
  for(const x of a.anims)try{x.cancel()}catch{}
  for(const n of a.nodes)try{n.remove()}catch{}
 }
}

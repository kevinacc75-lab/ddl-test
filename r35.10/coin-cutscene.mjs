// r36 (Claude, 29 Oct 2026; Kevy 14:29: "we need a inbuilt randomized coin flip widget for when the user plays card like
// the time wizard spell that needs heads or tails ... make this a unique animation and cutscene that plays with sound fx").
// Coin toss and dice roll cutscenes. Presentation only:
//  - inputs: the worker's coin envelope {epoch, tosses:[{id, kind, seat, results, call, code, afterEventId}]} (see
//    coin-tap.mjs) and printed card data. The RESULT always comes from the engine (the duel's own seeded random number);
//    nothing here picks, changes or predicts a result, and nothing here talks to the worker;
//  - each toss becomes one presentation batch placed right after the public event it followed (afterEventId), so the coin
//    lands BEFORE the cards it decides are destroyed, and the duel waits for it like any other cutscene (Skip works);
//  - timings per preset (COIN_MS); Instant or cinematics off: no scene (duration 0); reduced motion: a still result card;
//  - original art only: the coin faces and dice are drawn here (CSS + inline SVG), no card art is copied onto them;
//  - sound: original synthesis through the app's sound engine (sfx bus, so the user's mute and volume apply).
export const COIN_MS=Object.freeze({learning:4800,duel:3400,broadcast:2300,instant:0});
const SVG_NS='http://www.w3.org/2000/svg';
// An hourglass inside a clock ring (heads) and a crescent moon over a star field (tails): original emblems.
const HEADS_SVG='<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" stroke-width="2.5" opacity=".75"/>'+
 Array.from({length:12},(_,i)=>{const a=i*Math.PI/6,r1=i%3?35:32,r2=40;return `<line x1="${(50+r1*Math.sin(a)).toFixed(1)}" y1="${(50-r1*Math.cos(a)).toFixed(1)}" x2="${(50+r2*Math.sin(a)).toFixed(1)}" y2="${(50-r2*Math.cos(a)).toFixed(1)}" stroke="currentColor" stroke-width="${i%3?2:3.5}"/>`}).join('')+
 '<path d="M36 26h28M36 74h28M38 27c0 12 10 16 12 23-2 7-12 11-12 23M62 27c0 12-10 16-12 23 2 7 12 11 12 23" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/><path d="M43 36h14c-2 5-5 8-7 11-2-3-5-6-7-11zM42 70c2-6 5-9 8-11 3 2 6 5 8 11z" fill="currentColor"/></svg>';
const TAILS_SVG='<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" stroke-width="2.5" opacity=".75"/><path d="M60 24a28 28 0 1 0 16 46 24 24 0 1 1-16-46z" fill="currentColor"/>'+
 [[30,30,2.6],[24,52,1.8],[34,70,2.2],[68,36,1.6],[44,22,1.4]].map(([x,y,r])=>`<path d="M${x} ${y-r*2}l${r*.6} ${r*1.4} ${r*1.4} ${r*.6}-${r*1.4} ${r*.6}-${r*.6} ${r*1.4}-${r*.6}-${r*1.4}-${r*1.4}-${r*.6} ${r*1.4}-${r*.6}z" fill="currentColor"/>`).join('')+'</svg>';
// Dice: pip layout per face, and the cube rotation that shows each value to the viewer.
const PIPS={1:[5],2:[1,9],3:[1,5,9],4:[1,3,7,9],5:[1,3,5,7,9],6:[1,3,4,6,7,9]};
const FACE_ROT={1:'rotateX(0deg) rotateY(0deg)',2:'rotateX(0deg) rotateY(-90deg)',3:'rotateX(-90deg) rotateY(0deg)',4:'rotateX(90deg) rotateY(0deg)',5:'rotateX(0deg) rotateY(90deg)',6:'rotateX(0deg) rotateY(180deg)'};
const FACE_POS={1:'rotateY(0deg)',2:'rotateY(90deg)',3:'rotateX(90deg)',4:'rotateX(-90deg)',5:'rotateY(-90deg)',6:'rotateY(180deg)'};

// Insert one batch per toss after the batch holding its afterEventId (or before the first later event).
export function coinBatches(batches,tosses,preset){
 const list=(tosses||[]).filter(t=>t&&(t.kind==='coin'||t.kind==='dice')&&Array.isArray(t.results)&&t.results.length);
 if(!list.length)return batches;const out=[...batches],ms=COIN_MS[preset]??COIN_MS.learning;
 for(const t of list){const batch={events:[{type:'coinToss',id:t.afterEventId,player:t.seat,code:t.code||0,toss:Object.freeze({...t,results:Object.freeze([...t.results])})}],duration:ms};
  let at=out.findIndex(b=>(b.events||[]).some(e=>e.type!=='coinToss'&&Number(e.id)>t.afterEventId));if(at<0)at=out.length;
  // keep tosses in order when several land in the same gap
  while(at>0&&out[at-1].events?.[0]?.type==='coinToss'&&out[at-1].events[0].toss.id>t.id)at--;
  out.splice(at,0,batch)}
 return out}
export const tossWon=t=>t?.kind==='coin'&&t.call?(t.results[0]?'heads':'tails')===t.call:null;
export const tossLine=(t,name='')=>{if(!t)return '';const who=name?name+' · ':'';
 if(t.kind==='dice'){const r=t.results;return who+'Dice: '+r.join(' + ')+(r.length>1?' = '+r.reduce((a,b)=>a+b,0):'')}
 const faces=t.results.map(v=>v?'Heads':'Tails').join(', '),won=tossWon(t);return who+'Coin: '+faces+(t.call?' (called '+(t.call==='heads'?'Heads':'Tails')+' · '+(won?'right call':'wrong call')+')':'')};

// Original coin / dice sounds, built on the app's Soundscape helpers (tone, noise, sample). Best effort, never throws.
export function coinSound(sound,kind,step,{won=null,ms=3400}={}){
 try{if(!sound?.tone)return;const s=ms/3400;/* the cues stretch a little with the scene pace */
  const ping=(f,at,d=.35,g=.06)=>sound.tone(f,d,{at,end:f*.995,type:'sine',gain:g,attack:.004});
  const ring=(at,g=.07)=>{ping(2093,at,.55,g);ping(3135,at,.45,g*.7);ping(4699,at,.3,g*.45);ping(6272,at,.18,g*.3)};
  if(kind==='dice'){
   if(step==='throw'){sound.sample?.('whoosh',{gain:.5,rate:1.25});for(const [i,at] of [.05,.16,.24,.37,.46,.6,.7,.83].entries())sound.noise(.05,{gain:.12-i*.008,frequency:2600-i*120,end:900,at:at*s,attack:.002})}
   else if(step==='land'){sound.noise(.09,{gain:.2,frequency:1800,end:300,attack:.002});sound.tone(140,.18,{end:70,type:'triangle',gain:.18})}
   else if(step==='reveal'){for(const [i,f] of [784,988,1175].entries())sound.tone(f,.22,{at:i*.07,type:'triangle',gain:.08})}
   return}
  if(step==='flick'){sound.noise(.03,{gain:.18,frequency:6000,end:2500,attack:.001});ring(.01,.08);sound.sample?.('whoosh',{gain:.55,rate:1.1})}
  else if(step==='spin'){/* the shimmer of a spinning coin: pings that slow down as it falls */let at=.05;for(let i=0;i<11;i++){ping(i%2?2637:3520,at*s,.12,.035-i*.002);at+=.07+i*.012}}
  else if(step==='land'){ring(0,.09);sound.noise(.04,{gain:.16,frequency:5200,end:1800,attack:.001});ring(.16*s,.04);sound.noise(.03,{gain:.08,frequency:4200,end:1600,at:.16*s,attack:.001});ring(.26*s,.02)}
  else if(step==='reveal'){
   if(won===true){for(const [i,f] of [1047,1319,1568,2093].entries())sound.tone(f,.32,{at:i*.075,type:'triangle',gain:.09});sound.tone(523,.6,{at:.3,type:'sawtooth',gain:.035,lowpass:1800});for(let i=0;i<6;i++)ping(3000+i*420,.32+i*.05,.16,.03)}
   else if(won===false){sound.tone(392,.4,{end:277,type:'sawtooth',gain:.06,lowpass:1200});sound.tone(311,.55,{at:.18,end:196,type:'sawtooth',gain:.06,lowpass:900});sound.tone(70,.45,{at:.1,end:40,type:'sine',gain:.22});sound.noise(.25,{gain:.1,frequency:400,end:90,at:.1})}
   else{for(const [i,f] of [880,1175].entries())sound.tone(f,.25,{at:i*.08,type:'triangle',gain:.08})}}
 }catch{/* sound is best effort */}}

export class CoinScene{
 constructor({document,db,decks=()=>[],sound=null,animate,setTimer=(f,ms)=>setTimeout(f,ms),clearTimer=t=>clearTimeout(t)}){Object.assign(this,{document,db,decks,sound,animate,setTimer,clearTimer});this.animations=[];this.timers=[];this.node=null}
 clear(){for(const a of this.animations)try{a?.cancel()}catch{}this.animations=[];for(const t of this.timers)try{this.clearTimer(t)}catch{}this.timers=[];this.node?.remove();this.node=null;this.document.getElementById('summon-scene')?.classList.remove('coin-active')}
 reset(){this.clear();this.logNode?.remove();this.logNode=null}
 el(tag,cls,text){const n=this.document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n}
 motion(node,frames,options){try{const a=this.animate?this.animate(node,frames,options):node.animate?.(frames,options);if(a)this.animations.push(a)}catch{}}
 later(ms,f){this.timers.push(this.setTimer(()=>{try{f()}catch{}},Math.max(0,ms)))}
 log(t){const name=this.db()[t.code]?.name||'';if(!this.logNode?.isConnected){this.logNode=this.el('p','coin-log');this.logNode.id='coin-toss-log';this.logNode.setAttribute('role','log');(this.document.getElementById('event-log')?.parentElement||this.document.body).append(this.logNode)}this.logNode.textContent=tossLine(t,name)}
 show(e,duration,{reduced=false,deck=null,ownSeat=false}={}){
  this.clear();const t=e.toss,doc=this.document,dialog=doc.getElementById('summon-scene');if(!t||!dialog)throw new Error('Coin toss scene unavailable');
  const ms=Math.max(600,duration),card=this.db()[t.code],coin=t.kind==='coin',won=tossWon(t),side=coin?(t.results[0]?'heads':'tails'):null;
  const root=this.el('section','coin-scene');this.node=root;root.dataset.kind=t.kind;root.dataset.deckTheme=deck?.id||'custom';root.dataset.result=coin?side:'dice';root.dataset.won=won===null?'none':String(won);
  root.setAttribute('role','img');root.setAttribute('aria-label',tossLine(t,card?.name||''));
  root.style.setProperty('--coin-ms',ms+'ms');
  const banner=this.el('div','coin-banner');banner.append(this.el('p','coin-kicker',coin?'COIN TOSS':'DICE ROLL'),this.el('h2','coin-card',card?.name||'Card effect'));
  const who=deck?.name||(ownSeat?'You':'Opponent');
  const callChip=this.el('p','coin-call',coin?(t.call?who+' calls '+(t.call==='heads'?'HEADS':'TAILS'):who+' tosses'):who+' rolls '+(t.results.length>1?t.results.length+' dice':'a die'));
  const arena=this.el('div','coin-arena'),shadow=this.el('i','coin-shadow'),glow=this.el('i','coin-glow');arena.append(glow,shadow);
  const result=this.el('div','coin-result'),word=this.el('p','coin-word'),verdict=this.el('p','coin-verdict');result.append(word,verdict);
  const sparks=this.el('div','coin-sparks');sparks.setAttribute('aria-hidden','true');
  root.append(banner,callChip,arena,result,sparks);dialog.append(root);dialog.classList.add('coin-active');if(!dialog.open)try{dialog.showModal()}catch{dialog.setAttribute('open','')}
  this.log(t);
  const land=ms*.56,reveal=ms*.62;
  if(coin){
   word.textContent=t.results.map(v=>v?'HEADS':'TAILS').join(' · ');
   verdict.textContent=won===true?'RIGHT CALL!':won===false?'WRONG CALL':'';
   const toss=this.el('div','coin-toss'),body=this.el('div','coin-body');
   const heads=this.el('div','coin-face coin-heads'),tails=this.el('div','coin-face coin-tails');
   heads.innerHTML=HEADS_SVG+'<b>HEADS</b>';tails.innerHTML=TAILS_SVG+'<b>TAILS</b>';
   for(let i=1;i<=6;i++){const rim=this.el('i','coin-rim');rim.style.transform=`translateZ(${(i-3.5)*1.1}px)`;body.append(rim)}
   body.append(heads,tails);toss.append(body);arena.append(toss);
   const end=(t.results[0]?0:180)+360*7;
   if(reduced){body.style.transform=`rotateX(${end%360}deg)`;this.motion(toss,[{opacity:0},{opacity:1}],{duration:ms*.15,fill:'both'})}
   else{
    // up, hang, fall, two small bounces; the spin slows as it lands on the engine's result
    this.motion(toss,[{transform:'translateY(18vh) scale(.6)',opacity:0},{transform:'translateY(10vh) scale(.8)',opacity:1,offset:.06},{transform:'translateY(-30vh) scale(1.08)',offset:.28,easing:'ease-in'},{transform:'translateY(0) scale(1)',offset:.52},{transform:'translateY(-5vh) scale(1)',offset:.57,easing:'ease-in'},{transform:'translateY(0) scale(1)',offset:.62},{transform:'translateY(-1.2vh)',offset:.65},{transform:'translateY(0) scale(1)',offset:.68},{transform:'translateY(0) scale(1.06)',offset:.78},{transform:'translateY(0) scale(1)'}],{duration:ms,easing:'ease-out',fill:'both'});
    this.motion(body,[{transform:'rotateX(0deg) rotateY(0deg)'},{transform:`rotateX(${end*.55}deg) rotateY(18deg)`,offset:.3},{transform:`rotateX(${end*.93}deg) rotateY(-10deg)`,offset:.5},{transform:`rotateX(${end}deg) rotateY(0deg)`,offset:.62},{transform:`rotateX(${end}deg) rotateY(0deg)`}],{duration:ms,easing:'cubic-bezier(.25,.6,.35,1)',fill:'both'});
    this.motion(shadow,[{transform:'scale(.4)',opacity:.1},{transform:'scale(.25)',opacity:.08,offset:.28},{transform:'scale(1)',opacity:.55,offset:.52},{transform:'scale(.8)',opacity:.4,offset:.57},{transform:'scale(1)',opacity:.55,offset:.62},{transform:'scale(1)',opacity:.55}],{duration:ms,fill:'both'});
   }
   coinSound(this.sound,'coin','flick',{ms});if(!reduced)this.later(ms*.08,()=>coinSound(this.sound,'coin','spin',{ms}));
   this.later(reduced?ms*.1:land,()=>coinSound(this.sound,'coin','land',{ms}));
  }else{
   const total=t.results.reduce((a,b)=>a+b,0);word.textContent=t.results.join(' + ')+(t.results.length>1?' = '+total:'');verdict.textContent='';
   const tray=this.el('div','dice-tray');arena.append(tray);
   for(const [i,v] of t.results.entries()){
    const wrap=this.el('div','die-wrap'),cube=this.el('div','die');wrap.append(cube);tray.append(wrap);
    for(let f=1;f<=6;f++){const face=this.el('div','die-face');face.dataset.face=String(f);face.style.transform=FACE_POS[f]+' translateZ(var(--die-half))';for(let p=1;p<=9;p++){const pip=this.el('i',PIPS[f].includes(p)?'pip on':'pip');face.append(pip)}cube.append(face)}
    const spinX=720+i*360,spinY=540+i*180,final=FACE_ROT[v];
    if(reduced)cube.style.transform=final;
    else{const dir=i%2?-1:1;
     this.motion(wrap,[{transform:`translate(${-60*dir}vw,-12vh) rotate(${-40*dir}deg)`,opacity:0},{transform:`translate(${-30*dir}vw,-16vh) rotate(${-20*dir}deg)`,opacity:1,offset:.12},{transform:`translate(${6*dir}vw,0) rotate(${8*dir}deg)`,offset:.34,easing:'ease-in'},{transform:`translate(${2*dir}vw,-5vh) rotate(${3*dir}deg)`,offset:.42,easing:'ease-out'},{transform:'translate(0,0) rotate(0deg)',offset:.52},{transform:'translate(0,-1vh)',offset:.55},{transform:'translate(0,0)',offset:.58},{transform:'translate(0,0) scale(1.08)',offset:.7},{transform:'translate(0,0) scale(1)'}],{duration:ms,easing:'ease-out',fill:'both'});
     this.motion(cube,[{transform:'rotateX(0deg) rotateY(0deg)'},{transform:`rotateX(${spinX}deg) rotateY(${spinY}deg)`,offset:.45},{transform:final,offset:.56},{transform:final}],{duration:ms,easing:'cubic-bezier(.3,.55,.4,1)',fill:'both'})}
   }
   coinSound(this.sound,'dice','throw',{ms});this.later(reduced?ms*.1:land*.95,()=>coinSound(this.sound,'dice','land',{ms}));
  }
  this.motion(banner,[{opacity:0,transform:'translateY(-24px)'},{opacity:1,transform:'translateY(0)'}],{duration:Math.min(420,ms*.14),easing:'ease-out',fill:'both'});
  this.motion(callChip,[{opacity:0,transform:'scale(.8)'},{opacity:1,transform:'scale(1)'}],{delay:ms*.05,duration:Math.min(360,ms*.12),easing:'ease-out',fill:'both'});
  this.motion(result,[{opacity:0,transform:'scale(.6)'},{opacity:0,transform:'scale(.6)',offset:reveal/ms},{opacity:1,transform:'scale(1.12)',offset:Math.min(.95,reveal/ms+.06)},{opacity:1,transform:'scale(1)'}],{duration:ms,easing:'ease-out',fill:'both'});
  this.motion(glow,[{opacity:0},{opacity:0,offset:land/ms},{opacity:.9,offset:Math.min(.95,land/ms+.05)},{opacity:.45}],{duration:ms,fill:'both'});
  if(!reduced&&won!==false){for(let i=0;i<14;i++){const sp=this.el('i','coin-spark'),a=i/14*Math.PI*2,d=22+(i%3)*9;sparks.append(sp);this.motion(sp,[{transform:'translate(0,0) scale(0)',opacity:0},{transform:'translate(0,0) scale(0)',opacity:0,offset:reveal/ms},{transform:`translate(${Math.cos(a)*d}vmin,${Math.sin(a)*d}vmin) scale(1)`,opacity:1,offset:Math.min(.97,reveal/ms+.12)},{transform:`translate(${Math.cos(a)*d*1.2}vmin,${Math.sin(a)*d*1.2+6}vmin) scale(.4)`,opacity:0}],{duration:ms,easing:'ease-out',fill:'both'})}}
  if(!reduced&&won===false)this.motion(root,[{transform:'translate(0,0)'},{transform:'translate(0,0)',offset:reveal/ms},{transform:'translate(-10px,4px)',offset:Math.min(.96,reveal/ms+.02)},{transform:'translate(9px,-3px)',offset:Math.min(.97,reveal/ms+.04)},{transform:'translate(-5px,2px)',offset:Math.min(.98,reveal/ms+.06)},{transform:'translate(0,0)',offset:Math.min(.99,reveal/ms+.08)},{transform:'translate(0,0)'}],{duration:ms,fill:'both'});
  this.later(reveal,()=>{root.dataset.revealed='true';coinSound(this.sound,t.kind,'reveal',{won,ms})});
 }
}

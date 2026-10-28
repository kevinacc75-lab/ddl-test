import {SummonCutscenes,SummonScene,summonEnabled,SUMMON_MS} from './summon-cutscenes.mjs';
import {FusionMaterials,MaterialsScene,materialsEnabled} from './fusion-materials.mjs';
import {LP_TYPES,createLpFx} from './lp-fx.mjs';
import {effectFocus,effectMarkup} from './effect-focus.mjs';
import {createFx,CUTSCENE_MS,cutsceneKind} from './fx-r23.mjs';
import {createLearningRoutes,learningMinimum} from './learning-routes.mjs';
// Seto 16 Oct: the resolve banner carries a short effect name only. Generic fallbacks are left out; long prompt strings are cut to four words.
function bannerShort(label){let s=String(label||'').replace(/^.*? · /,'').replace(/\?\s*$/,'').trim();if(!s||/printed (effect|activation|text)|text preview/i.test(s))return '';const w=s.split(/\s+/);return w.length>4?w.slice(0,4).join(' ').replace(/[,;:]$/,'')+'…':s}
import {PHASE} from './duel.mjs';
import {sceneFor} from './scene-data.mjs';
import {MECHANICS,PHASE_CUES,eventCue,presentationBatches,ChainDirector} from './event-data.mjs';

export {Soundscape} from './sound-engine.mjs';
// One scene handles every native activation, selected effect and resolution.
export class EffectScene{
 constructor({stage,db,point,animate,scale=1,reduced=()=>false}){Object.assign(this,{stage,db,point,animate,scale,reduced});this.origin=null;this.wrap=stage.querySelector('.event-card-wrap')}
 show(e,focus,chain){
  const $=id=>document.getElementById(id),card=this.db()[e.code],resolving=['resolve','negate'].includes(e.type),negated=e.type==='negate'||chain?.status==='negated';
  for(const a of this.wrap.getAnimations?.()||[])a.cancel();
  this.stage.dataset.negated=String(negated);this.stage.dataset.fromHand=String(e.effectLocation===2&&e.type==='activate'&&!!(card?.type&(1|4|65536)));
  $('scene-chain-coin').hidden=!e.chain;$('scene-chain-coin').textContent=e.chain?(resolving?'RESOLVING · ':'CHAIN ')+e.chain:'';
  $('negated-stamp').hidden=!negated;
  $('event-type-line').textContent=cardTypeLine(card);
  $('card-clause-glow').hidden=!focus?.text||negated;
  // Card images have different typesetting: the glow marks the text box;
  // the adjacent live text carries the exact literal clause.
  $('card-clause-glow').title=focus?.excerpt||'';
  const live=$('card-live-effect');live.innerHTML=effectMarkup(focus,value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])));live.hidden=!focus?.text;live.style.setProperty('--print-size',Math.max(4,Math.min(8,8-(focus?.text?.length||0)/300))+'px');
  this.wrap.classList.remove('effect-arrival');void this.wrap.offsetWidth;this.wrap.classList.add('effect-arrival');
  this.origin=this.point(e.source||{controller:e.player??chain?.player,location:e.effectLocation})||document.querySelector(`[data-card="${e.code}"]`);
  if(!focus?.mapped&&e.type==='resolve')console.warn('[EffectScene] Unmapped clause; highlighting full text',{code:e.code,description:e.focusDescription||e.description,location:e.effectLocation});
  const a=this.origin?.getBoundingClientRect(),b=this.wrap.getBoundingClientRect();
  if(!this.reduced()&&a?.width&&b.width){this.animate(this.wrap,[{opacity:0,transform:`translate(${a.left+a.width/2-b.left-b.width/2}px,${a.top+a.height/2-b.top-b.height/2}px) scale(${Math.max(.12,a.width/b.width)}) rotate(-8deg)`},{offset:.75,opacity:1,transform:'translate(0,0) scale(1.05)'},{opacity:1,transform:'translate(0,0) scale(1)'}],{duration:(e.compact?340:600)*this.scale,easing:'cubic-bezier(.18,.8,.22,1)'})}
 }
 // Seto 16 Oct verdict (screen 3): the fly-back keeps its end state (fill forwards), so a new scene must clear it, or the
 // next card scene starts with the card invisible. resetReturn() runs at the start of every scene.
 resetReturn(){try{this.returnAnim?.cancel()}catch{}this.returnAnim=null}
 returnToField(){this.resetReturn();const a=this.wrap.getBoundingClientRect(),b=this.origin?.getBoundingClientRect();if(!this.reduced()&&b?.width&&a.width)this.returnAnim=this.animate(this.wrap,[{opacity:1,transform:'translate(0,0) scale(1)'},{opacity:0,transform:`translate(${b.left+b.width/2-a.left-a.width/2}px,${b.top+b.height/2-a.top-a.height/2}px) scale(${b.width/a.width})`}],{duration:350*this.scale,easing:'ease-in',fill:'forwards'});}
}
function cardTypeLine(card){
 const t=card?.type||0;if(t&2)return (t&65536?'Quick-Play':t&131072?'Continuous':t&262144?'Equip':t&524288?'Field':t&128?'Ritual':'Normal')+' Spell';if(t&4)return (t&1048576?'Counter':t&131072?'Continuous':'Normal')+' Trap';
 const races={1:'Warrior',2:'Spellcaster',4:'Fairy',8:'Fiend',16:'Zombie',32:'Machine',64:'Aqua',128:'Pyro',256:'Rock',512:'Winged Beast',1024:'Plant',2048:'Insect',4096:'Thunder',8192:'Dragon',16384:'Beast',32768:'Beast-Warrior',65536:'Dinosaur',131072:'Fish',262144:'Sea Serpent',524288:'Reptile',1048576:'Psychic',2097152:'Divine-Beast',4194304:'Creator God',8388608:'Wyrm',16777216:'Cyberse',33554432:'Illusion'};
 return '['+(races[card?.race]||'Monster')+' / '+[t&64?'Fusion':t&67108864?'Link':t&8192?'Synchro':t&8388608?'Xyz':t&128?'Ritual':'',t&32?'Effect':'Normal'].filter(Boolean).join(' / ')+']';
}

export function createPresentation({db,decks,view,isComputer=()=>false,duelists=()=>[],sound,onSkip,onBusy,cardFrame,timingScale=1}){
 const $=s=>document.querySelector(s),scene=$('#summon-scene'),layer=$('#fx-layer'),ribbon=$('#event-ribbon'),stage=$('#event-stage'),skip=$('#skip-fx'),victory=$('#victory-scene');
 let sceneToken=0,chainBuilding=false,lpStartTimer,fieldScene=null;const director=new ChainDirector();let preset='learning',tapToContinue=false,chainFlow=true,chainView,skipCutins=false;let enabled=true,reduced=false,pace=1,effectPace,held=false,deadline=0,remaining=0,complete=null,previousCard=0,chainVisual=new Map(),seen=0,queue=[],timer,returnTimer,returnDeadline=0,returnRemaining=0,ribbonTimer,playing=false,animations=new Set(),generation=0,lifeTimer,lifeTarget=null,displayLP=[8000,8000],actualLP=[8000,8000],effectMetrics=[],activeEffect=null,currentHold=false;
 const lpTypes=LP_TYPES,pendingLife=new Map();
 const fusionMaterials=new FusionMaterials(),materialsScene=new MaterialsScene({document,db,frame:cardFrame,animate,scale:timingScale});
 const summonCutscenes=new SummonCutscenes(),summonScene=new SummonScene({document,db,frame:cardFrame,animate,scale:timingScale});
 const summonVisual=()=>summonEnabled({preset,enabled,reduced,skipCutins},document.body);
 const legacySummon=e=>!!e?.b2Summon&&!e.b2Summon.confirmed&&summonVisual()&&e.special;
 const materialsVisual=()=>materialsEnabled({preset,enabled,reduced,skipCutins},document.body)&&!summonVisual();/* r26: the B2 summon cutscene already shows the materials merging; the separate panel only plays when B2 cannot */
 function settleLife(){for(const player of [0,1]){const first=[...pendingLife.values()].find(e=>e.player===player);displayLP[player]=first?.before??actualLP[player]}writeLife()}
 function writeLife(){for(let p=0;p<2;p++){const node=$(p===view()?'#my-lp':'#opp-lp');if(!node)continue;const value=Math.max(0,Math.round(displayLP[p]));node.querySelector('.lp-value').textContent=String(value);node.querySelector('.lp-meter i').style.width='100%';node.querySelector('.lp-meter i').style.transition='none';node.querySelector('.lp-meter i').style.transform='scaleX('+Math.min(1,value/8000)+')';node.classList.toggle('lp-warning',value>=2000&&value<4000);node.classList.toggle('lp-critical',value<2000);node.classList.toggle('lp-empty',value===0);node.setAttribute('aria-label',seat(p)+': '+value+' life points')}}
 const lpFx=createLpFx({badge:p=>$(p===view()?'#my-lp':'#opp-lp'),wrapper:()=>$('.duel-table'),layer,write:(p,n)=>{displayLP[p]=n;writeLife()},held:()=>held,reduced:()=>reduced,sound,animate,scale:timingScale,onTick:detail=>{if(detail.type==='end'){pendingLife.delete(detail.event.id);lifeTarget=null;}document.dispatchEvent(new window.CustomEvent('lp-fx-tick',{detail}))}});
 function life(e){stage.hidden=true;lifeTarget={...e};const run=generation;const start=()=>{if(run!==generation)return;if(held){lpStartTimer=setTimeout(start,Math.max(1,16*timingScale));return;}if(run===generation){if(e.combat){const target=point(e.battle?.target)||$(e.player===view()?'#my-lp':'#opp-lp');pulse(target,'damage','#ff526a');if(target)impactSparks(target.getBoundingClientRect(),'#ff526a')}document.dispatchEvent(new window.CustomEvent('lp-impact-frame',{detail:e}));lpFx.start(e)}};lpStartTimer=setTimeout(start,(e.delayMs||0)*timingScale)}
 function clearFieldScene(){fieldScene?.remove();fieldScene=null;document.querySelectorAll('.on-field-resolving').forEach(n=>n.classList.remove('on-field-resolving'))}
 function fieldResolution(e,focus,color){
  stage.hidden=true;const node=point(e.source)||document.querySelector(`[data-card="${e.code}"]`),rect=node?.getBoundingClientRect();
  fieldScene=document.createElement('div');fieldScene.className='on-field-resolution'+(e.negated?' is-negated':'');fieldScene.style.setProperty('--resolve-colour',color);
  const width=rect?.width||80,height=rect?.height||115,x=rect?.width?rect.left+width/2:window.innerWidth/2,y=rect?.height?rect.top+height/2:window.innerHeight/2;
  Object.assign(fieldScene.style,{left:x+'px',top:y+'px','--card-width':width+'px','--card-height':height+'px'});
  const card=db()[e.code],clause=focus?.excerpt||card?.name||'Card effect';const caption=clause.length>170?clause.slice(0,167)+'…':clause;/* r34: two lines (ChatGPT RELAY-022 #3) */
  fieldScene.innerHTML=`<div class="on-field-card">${card?.art?`<img src="${escape(card.art)}" alt="${escape(card.name)}">`:escape(card?.name)}<span class="on-field-coin">${e.negated?'NEGATED':'RESOLVING'} · CL ${e.chain}</span></div><div class="on-field-clause" title="${escape(clause)}"><b class="on-field-name">${escape(card?.name||'')}</b>${focus?.title?`<b class="on-field-title">${escape(focus.title)}</b>`:''}<span class="on-field-text">${escape(caption)}</span></div>`;
  layer.append(fieldScene);node?.classList.add('on-field-resolving');if(!reduced)animate(fieldScene.querySelector('.on-field-card'),[{transform:'translateY(0) scale(1)'},{transform:'translateY(-14px) scale(1.25)'}],{duration:180*timingScale,easing:'ease-out',fill:'forwards'});
  const label=fieldScene.querySelector('.on-field-clause');label.style.maxWidth=Math.max(160,Math.min(420,window.innerWidth-20))+'px';label.style.transform=`translateX(${Math.max(-x+10,Math.min(-Math.min(420,window.innerWidth-20)/2,window.innerWidth-x-Math.min(420,window.innerWidth-20)-10))}px)`;
 }
 function knockout(e){stage.hidden=true;sound.play('lpZero');sound.stopMusic?.();const side=$(e.player===view()?'#my-board':'#opp-board');side?.classList.add('ko-loser');const slam=document.createElement('div');slam.className='ko-slam ko-banner';slam.textContent='K.O.';slam.setAttribute('aria-label',seat(e.player)+' · LP 0');const plate=$(e.player===view()?'#my-lp':'#opp-lp');plate?.classList.add('ko-plate');if(plate?.querySelector('.lp-value'))plate.querySelector('.lp-value').textContent='0';slam.style.setProperty('--ko-duration',800*timingScale+'ms');layer.append(slam);$('.duel-table').classList.add('ko-slow');for(const a of animations)a.playbackRate=.4;setTimeout(()=>{slam.remove();plate?.classList.remove('ko-plate');$('.duel-table').classList.remove('ko-slow');for(const a of animations)a.playbackRate=1},800*timingScale)}

 const cardType=code=>{const t=db()[code]?.type||0;return t&67108864?'link':t&8388608?'xyz':t&8192?'synchro':t&64?'fusion':t&16777216?'pendulum':t&4?'trap':t&2?'spell':'monster'};
 const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const audioSeat=p=>$('#spectator-tag')?.hidden?(p===view()?0:1):p;
 const seat=p=>duelists()[p]?.name||decks()[p]?.name||('Deck '+(p===1?'B':'A'));
 const endReason=e=>e.player===null?'Duel drawn':e.reason===1?'LP to 0':e.reason===2?'Deck-out':'Card effect';
 const zones={1:'Deck',2:'Hand',4:'Monster zone',8:'Spell / Trap zone',16:'Graveyard',32:'Banished',64:'Extra Deck',128:'Xyz material'};
 const zone=p=>p?.overlay_sequence!==undefined?'Xyz material':zones[p?.location]||'Field';
 function banner(text){ribbon.textContent=text;ribbon.hidden=false;ribbon.classList.remove('show');void ribbon.offsetWidth;ribbon.classList.add('show');clearTimeout(ribbonTimer);ribbonTimer=setTimeout(()=>ribbon.hidden=true,2500*timingScale)}
 function point(pos){if(!pos)return null;const own=pos.controller===view();if(pos.location===0)return $(own?'#my-lp':'#opp-lp');if([4,8].includes(pos.location))return document.querySelector(`[data-slot="${pos.controller}:${pos.location}:${pos.sequence}"]`);if([16,32,64].includes(pos.location))return document.querySelector(`[data-pile="${pos.controller}:${pos.location}"]`);if(pos.location===2)return $(own?'#my-hand':'#opp-hand');return document.querySelector(`[data-deck-pile="${pos.controller}"]`)}
 // P1 (Claude): a card that arrives by a move stays hidden at its destination until its flight lands (set by the app when
 // the board is drawn), then settles in. Every path that skips or ends the flight shows it again; nothing changes timing.
 const arrive=node=>node?.classList?.remove('fx-arriving'),clearArriving=()=>document.querySelectorAll('.fx-arriving').forEach(n=>n.classList.remove('fx-arriving'));
 // P1: restart the pulse animation on the next frame instead of forcing a synchronous reflow (offsetWidth) every time.
 function pulse(node,kind='effect',color='var(--palette-436)'){if(!node)return;node.style.setProperty('--fx-color',color);node.classList.remove('fx-'+kind);const add=()=>{node.classList.add('fx-'+kind);setTimeout(()=>node.classList.remove('fx-'+kind),900*timingScale)};if(window.requestAnimationFrame)requestAnimationFrame(add);else add()}
 function fly(e,color,at=0,duration=400,show=null){
  fx23.flight(e,at+duration,color);routes.flight(e,at,duration);/* r28: Learning route line + label */
  if(reduced||(show&&document.body.dataset.graphics==='smooth')){arrive(point(e.to));pulse(point(e.from),'fade',color);pulse(point(e.to),'fade',color);return}const from=point(e.from),to=point(e.to);if(!from||!to){arrive(to);return}
  const a=from.getBoundingClientRect(),b=to.getBoundingClientRect();if(!a.width||!b.width){arrive(to);return}
  const x=a.left+a.width/2,y=a.top+a.height/2,tx=b.left+b.width/2,ty=b.top+b.height/2;
  const bend=Math.min(90,Math.hypot(tx-x,ty-y)*.25),cx=(x+tx)/2+bend,cy=(y+ty)/2-bend;
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('class','movement-track');svg.setAttribute('viewBox',`0 0 ${window.innerWidth} ${window.innerHeight}`);svg.style.setProperty('--track-color',color);
  // Explicit endpoints and an arrowhead make direction readable without colour.
  const path=`M ${x} ${y} Q ${cx} ${cy} ${tx} ${ty}`;
  const angle=Math.atan2(ty-cy,tx-cx),size=11,ax=tx-size*Math.cos(angle-.5),ay=ty-size*Math.sin(angle-.5),bx=tx-size*Math.cos(angle+.5),by=ty-size*Math.sin(angle+.5);
  svg.innerHTML=`<path class="track-glow" d="${path}"/><path class="track-dashes" d="${path}"/><circle class="track-source" cx="${x}" cy="${y}" r="12"/><circle class="track-destination" cx="${tx}" cy="${ty}" r="23"/><path class="track-arrow" d="M ${ax} ${ay} L ${tx} ${ty} L ${bx} ${by}"/>`;
  layer.append(svg);
  const ghost=document.createElement('div');ghost.className=e.type==='attack'?'attack-trail':'travelling-card';ghost.style.setProperty('--track-color',color);
  // P1 step 2: a face-down arrival (a Set) travels as a card back; anything with known art shows its art.
  const faceDown=e.type==='move'&&to.querySelector?.('.back');
  if(faceDown)ghost.classList.add('back-face');else if(e.code&&db()[e.code]?.art)ghost.innerHTML=`<img src="${escape(db()[e.code].art)}" alt="">`;
  // P1: a moving card travels at card size when it starts or ends on a field zone, so it reads as the card itself.
  const fieldRect=[4,8].includes(e.to?.location)?b:[4,8].includes(e.from?.location)?a:null;
  const width=e.type==='attack'?Math.max(42,a.width*.7):fieldRect?Math.max(44,Math.min(fieldRect.width,fieldRect.height*.73)):48,height=e.type==='attack'?Math.max(58,a.height*.7):fieldRect?width/.73:68;
  Object.assign(ghost.style,{left:x-width/2+'px',top:y-height/2+'px',width:width+'px',height:height+'px',opacity:'0'});layer.append(ghost);
  const ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
  let frames=Array.from({length:17},(_,i)=>{const t=ease(i/16),u=1-t,px=u*u*x+2*u*t*cx+t*t*tx,py=u*u*y+2*u*t*cy+t*t*ty;const k=i/16,lift=k<.12?.95+k/.12*.13:k>.88?1.08-(k-.88)/.12*.08:1.08;return {offset:k,transform:`translate(${px-x}px,${py-y}px) rotate(${Math.sin(k*Math.PI)*-8}deg) scale(${e.type==='move'?lift:.8+Math.sin(k*Math.PI)*.25})`,opacity:i===0||i===16?0:1}});
  if(e.type==='move'&&eventCue(e,db())==='fusion'){
   const mat=$('#shared-emz')?.getBoundingClientRect();if(mat?.width){const vx=mat.left+mat.width/2,vy=mat.top+mat.height/2;const vortex=document.createElement('div');vortex.className='fusion-material-vortex';Object.assign(vortex.style,{left:vx-70+'px',top:vy-70+'px'});layer.append(vortex);setTimeout(()=>vortex.remove(),650*timingScale);frames=Array.from({length:25},(_,i)=>{const t=i/24,orbit=Math.max(0,(t-.45)/.55),radius=(1-orbit)*48,angle=orbit*Math.PI*3,px=t<.45?x+(vx-x)*t/.45:vx+Math.cos(angle)*radius,py=t<.45?y+(vy-y)*t/.45:vy+Math.sin(angle)*radius;return {offset:t,transform:`translate(${px-x}px,${py-y}px) rotate(${t*420}deg) scale(${Math.max(.08,1-orbit)})`,opacity:i===24?0:1}})}
  }
  // Card-movement showcase (Seto 15 Oct): the card lifts to centre with a level label, then zooms to its new place.
  // Visual only: the engine has already moved the card; face-down cards stay face-down (back-face ghost).
  if(show&&e.type==='move'&&eventCue(e,db())!=='fusion'){svg.style.display='none';ghost.classList.add('showcase');
   // Cut-in (Kevy 15 Oct): source zone lights up with a FROM tag, a band sweeps in, the cards hold at centre with a
   // label and route, then glide to the new zone, which lights up too. Transform/opacity only; Skip clears the layer.
   const S=Math.max(1.4,Math.min(2.6,170/width)),n=Math.max(1,show.count||1),spread=Math.min(width*S*.82,window.innerWidth*.72/n);let mx=window.innerWidth/2+((show.index||0)-(n-1)/2)*spread;const my0=window.innerHeight*.44,{hl,lift,hold}=show.beats||{hl:.19,lift:.36,hold:.76};let my=my0;{const w=show.anchor==='stage'&&!stage.hidden&&stage.querySelector('.event-card-wrap')?.getBoundingClientRect();if(w&&w.width){mx=w.left+w.width/2+((show.index||0)-(n-1)/2)*spread;my=w.top+w.height/2}}
   frames=Array.from({length:21},(_,i)=>{const k=i/20;let px,py,s,r;if(k<=hl){px=x;py=y;s=1+.12*Math.sin(k/hl*Math.PI);r=0}else if(k<=lift){const t=ease((k-hl)/(lift-hl));px=x+(mx-x)*t;py=y+(my-y)*t;s=1+(S-1)*t;r=-5*t}else if(k<=hold){const t=(k-lift)/(hold-lift);px=mx;py=my-6*t;s=S*(1+.03*Math.sin(t*Math.PI));r=-5}else{const t=ease((k-hold)/(1-hold));px=mx+(tx-mx)*t;py=my-6+(ty-my+6)*t;s=S+(1-S)*t;r=-5*(1-t)}return {offset:k,transform:`translate(${px-x}px,${py-y}px) rotate(${r}deg) scale(${s})`,opacity:i===0||i===20?0:1}});
   const ring=(rect,cls,text,t0,t1)=>{const d=document.createElement('div');d.className='flight-ring '+cls;d.style.setProperty('--track-color',color);Object.assign(d.style,{left:rect.left-4+'px',top:rect.top-4+'px',width:rect.width+8+'px',height:rect.height+8+'px'});if(text){const tag=document.createElement('span');tag.textContent=text;d.append(tag)}layer.append(d);const r=animate(d,[{opacity:0,transform:'scale(1.12)'},{opacity:1,transform:'scale(1)',offset:.18},{opacity:1,transform:'scale(1)',offset:.8},{opacity:0,transform:'scale(.98)'}],{duration:(t1-t0)*duration*timingScale,delay:(at+t0*duration)*timingScale,easing:'ease-out',fill:'both'});if(r)r.finished.catch(()=>{}).finally(()=>d.remove());else setTimeout(()=>d.remove(),(at+t1*duration)*timingScale)};
   ring(a,'from',show.index?'':'FROM '+zoneWord(e.from),0,lift+.12);ring(b,'to',show.index?'':'TO '+zoneWord(e.to),hold-.04,1);
   if(!show.index&&show.label){const band=document.createElement('div');if(show.anchor==='stage')band.hidden=true;// Seto chain-box spec: the hazard banner is the only striped element during a resolution
    band.className='flight-band';band.style.setProperty('--track-color',color);Object.assign(band.style,{top:my-height*S*.42+'px',height:height*S*.84+'px'});layer.append(band);
    const bA=animate(band,[{opacity:0,transform:'translateX(-60%) skewY(-3deg)'},{opacity:0,transform:'translateX(-60%) skewY(-3deg)',offset:hl},{opacity:1,transform:'translateX(0) skewY(-3deg)',offset:lift},{opacity:1,transform:'translateX(0) skewY(-3deg)',offset:hold},{opacity:0,transform:'translateX(60%) skewY(-3deg)'}],{duration:duration*timingScale,delay:at*timingScale,easing:'ease-out',fill:'both'});if(bA)bA.finished.catch(()=>{}).finally(()=>band.remove());else setTimeout(()=>band.remove(),(at+duration)*timingScale);
    const tag=document.createElement('div');tag.className='flight-label';tag.style.setProperty('--track-color',color);const main=document.createElement('b');main.textContent=show.label+(n>1?' ×'+n:'');tag.append(main);if(show.route){const sub=document.createElement('small');sub.textContent=show.route;tag.append(sub)}Object.assign(tag.style,{left:window.innerWidth/2+'px',top:Math.min(window.innerHeight-64,my+height*S/2+10)+'px'});layer.append(tag);
    const tA=animate(tag,[{opacity:0,transform:'translate(-50%,0) translateY(-8px)'},{opacity:0,transform:'translate(-50%,0) translateY(-8px)',offset:hl},{opacity:1,transform:'translate(-50%,0)',offset:lift},{opacity:1,transform:'translate(-50%,0)',offset:hold+.05},{opacity:0,transform:'translate(-50%,0) translateY(6px)'}],{duration:duration*timingScale,delay:at*timingScale,easing:'ease-out',fill:'both'});if(tA)tA.finished.catch(()=>{}).finally(()=>tag.remove());else setTimeout(()=>tag.remove(),(at+duration)*timingScale)}
  }
  if(e.type==='attack'){pulse(from,'lunge',color);document.body.classList.add('battle-shake');setTimeout(()=>document.body.classList.remove('battle-shake'),500*timingScale)}
  const run=generation,done=()=>{svg.remove();ghost.remove();arrive(to);if(e.type==='move'&&[4,8].includes(e.to?.location)&&!reduced)animate(to,[{transform:'scale(1.07)'},{transform:'scale(.985)',offset:.6},{transform:'scale(1)'}],{duration:180*timingScale,easing:'ease-out'});if(run===generation){pulse(to,e.type==='attack'?'damage':'arrival',color);if(e.type==='attack')impactSparks(b,color)}};
  if(ghost.animate){const animation=ghost.animate(frames,{duration:duration*timingScale,delay:at*timingScale,easing:'linear',fill:'forwards'});animations.add(animation);if(held)animation.pause();animation.finished.catch(()=>{}).finally(()=>{animations.delete(animation);done()})}else setTimeout(done,(at+duration)*timingScale);
  pulse(from,'effect',color);
 }
 function zoneWord(z){return ({1:'DECK',2:'HAND',4:'FIELD',8:'FIELD',16:'GRAVEYARD',32:'BANISHED',64:'EXTRA DECK',128:'XYZ MATERIAL',256:'FIELD'})[z?.location]||'FIELD'}
 function flightLabel(e){const cue=eventCue(e,db());if(cue!=='move')return MECHANICS[cue]?.[0]||'CARD MOVEMENT';return ({1:'TO DECK',2:'TO HAND',4:'TO FIELD',8:'TO FIELD',16:'SENT TO GRAVEYARD',32:'BANISHED',64:'TO EXTRA DECK',128:'XYZ MATERIAL'})[e.to?.location]||'CARD MOVEMENT'}
 // Card-movement cut-in timing per pace (ms): [per group, cap per resolution]. Proposed to Seto 15 Oct (Kevy: too quick to follow).
 const FLIGHT={learning:[1600,3200],duel:[1000,2000],broadcast:[600,1200]};
 // Seto 16 Oct storyboards: turn change 3.0/1.5/1.0 s; in a resolution the moved cards fly once, as one group:
 // highlight 0.8 s, lift 1.0 s, glide 1.8 s (Learning; Duel half; Broadcast 0.6 of Duel), inside the 5.0/2.5/1.5 s scene.
 const TURN_MS={learning:3000,duel:1500,broadcast:1000},RESOLVE_FLIGHT={learning:3600,duel:1800,broadcast:1080};
 const RESOLVE_BEATS={hl:.22,lift:.5,hold:.5};
 function flightTiming(){return FLIGHT[preset]||FLIGHT.duel}
 // Seto chain-box spec: a Chain Log button beside Skip opens a small panel listing the current chain, link by link.
 // Seto 16 Oct: dismissible (button or tap the panel) and it closes on Skip and at the end of the scene (look only; the duel
 // keeps running; Pause and Skip unchanged).
 function chainLogRender(){const pop=$('#chain-log-pop');if(!pop)return;const word=s=>s==='resolving'?'RESOLVING':s==='resolved'?'RESOLVED ✓':s==='negated'?'NEGATED':'PENDING';
  // The current chain as shown on screen (the event log runs ahead of the animation, so it is not used here).
  const items=[...chainVisual].sort((a,b)=>a[0]-b[0]).map(([n,v])=>'<li data-state="'+escape(v.status)+'"><b>CL '+n+' · '+word(v.status)+'</b> '+escape(v.name||db()[v.code]?.name||'Card')+'<small>'+escape(effectFocus(v.code,v.focusDescription||v.description,db(),v)?.label||'Card effect')+'</small></li>').join('');
  pop.innerHTML='<b>CHAIN LOG</b><ol>'+(items||'<li>No chain right now</li>')+'</ol>'}
 if(!document.chainLogBound)(document.chainLogBound=true)&&document.addEventListener('click',ev=>{if(ev.target.closest?.('#chain-log-pop')){delete document.body.dataset.chainLog;$('#chain-log-btn')?.setAttribute('aria-pressed','false');return}const b=ev.target.closest?.('#chain-log-btn');if(!b)return;const open=document.body.dataset.chainLog!=='open';document.body.dataset.chainLog=open?'open':'';b.setAttribute('aria-pressed',String(open));if(open)chainLogRender()});
 function chainBoxOn(e){return e?.type==='resolve'&&!e.onField&&document.body.dataset.theme==='showtime'&&document.body.dataset.graphics!=='smooth'}
 // Seto 16 Oct: the chain-box effect text never stops mid-sentence. Duel/Broadcast: the active clause is in view and a
 // MORE hint shows when text continues. Learning: the text turns page by page (up to 3) across the scene, each page static.
 let pageTimers=[];function effectPages(e,duration){pageTimers.forEach(clearTimeout);pageTimers=[];const box=$('#event-effect'),text=$('#event-effect-text');delete box.dataset.more;delete box.dataset.page;if(text)text.style.paddingBottom='';if(!chainBoxOn(e)||!text)return;
  if(text.scrollHeight-text.clientHeight<=4)return;
  // Seto 16 Oct polish: pages start on a whole line, so no clipped line shows under the header. Line tops come from the
  // rendered line boxes; bottom padding lets the last page start on a line too.
  const h=text.clientHeight,base=text.getBoundingClientRect().top-text.scrollTop,range=document.createRange();range.selectNodeContents(text);
  const tops=[...new Set([...range.getClientRects()].filter(r=>r.height>2).map(r=>Math.round(r.top-base)))].sort((a,b)=>a-b).filter((t,i,a)=>!i||t-a[i-1]>3);
  const end=text.scrollHeight,snap=y=>tops.filter(t=>t<=y+2).at(-1)??0,start=snap(text.scrollTop?text.scrollTop+16:0),stops=[start];
  if(preset==='learning')while(stops.length<3){const next=tops.find(t=>t>stops.at(-1)&&t+18>stops.at(-1)+h);if(next===undefined||next>=end-4)break;stops.push(next)}
  text.style.paddingBottom=h+'px';const more=i=>i<stops.length-1||stops[i]+h<end-4;
  const mark=i=>{text.scrollTop=Math.max(0,stops[i]-4);box.dataset.page=String(i+1);box.dataset.more=more(i)?(stops.length>1?'MORE ▾ '+(i+1)+'/'+stops.length:'MORE ▾'):(stops.length>1?(i+1)+'/'+stops.length:'')};mark(0);
  const slice=duration*.92/stops.length,token=sceneToken;for(let i=1;i<stops.length;i++)pageTimers.push(setTimeout(()=>{if(token!==sceneToken)return;text.animate?.([{opacity:.15},{opacity:1}],{duration:220,easing:'ease-out'});mark(i)},slice*i*timingScale))}
 function showcaseOn(){return enabled&&!reduced&&preset!=='instant'&&document.body.dataset.graphics!=='smooth'}
 function moveGroups(list){const groups=[];let key='';for(const r of list)if(r.type==='move'){const k=eventCue(r,db())+'>'+r.to?.controller+':'+r.to?.location;if(k!==key||!groups.length){groups.push([]);key=k}groups.at(-1).push(r)}return groups}
 function capGroups(groups){const [per,cap]=flightTiming(),max=Math.max(1,Math.floor(cap/per));return groups.length<=max?groups:[...groups.slice(0,max-1),groups.slice(max-1).flat()]}
 // Extra scene time so the cut-in finishes inside its own scene (never overlaps the next one).
 function flightExtra(batch){if(!showcaseOn())return 0;const e=batch.events[0];
  if(e.type==='move'&&!chainBuilding&&batch.events.every(m=>m.type==='move'))return Math.max(0,flightTiming()[0]-(batch.duration-40));
  if(e.type==='resolve'){const moving=batch.events.slice(1).some(r=>r.type==='move');return moving?Math.max(0,(RESOLVE_FLIGHT[preset]||1800)+400-batch.duration):0}return 0}
 function impactSparks(rect,color){if(reduced)return;const sparks=document.createElement('div');sparks.className='attack-sparks';sparks.style.setProperty('--spark-color',color);Object.assign(sparks.style,{left:rect.left+rect.width/2+'px',top:rect.top+rect.height/2+'px'});sparks.innerHTML=Array.from({length:12},(_,i)=>`<i style="--spark-angle:${i*30}deg"></i>`).join('');layer.append(sparks);setTimeout(()=>sparks.remove(),600*timingScale)}
 function energyLine(from,to,color){
  const a=from?.getBoundingClientRect(),b=to?.getBoundingClientRect();if(!a?.width||!b?.width)return;
  if(reduced){pulse(to,'target',color);return}
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('class','target-energy');svg.setAttribute('viewBox',`0 0 ${window.innerWidth} ${window.innerHeight}`);svg.style.setProperty('--track-color',color);const x=a.left+a.width/2,y=a.top+a.height/2,tx=b.left+b.width/2,ty=b.top+b.height/2,angle=Math.atan2(ty-y,tx-x);svg.innerHTML=`<path d="M ${x} ${y} L ${tx} ${ty}"/><path d="M ${tx-16*Math.cos(angle-.5)} ${ty-16*Math.sin(angle-.5)} L ${tx} ${ty} L ${tx-16*Math.cos(angle+.5)} ${ty-16*Math.sin(angle+.5)}"/><circle cx="${tx}" cy="${ty}" r="28"/>`;layer.append(svg);pulse(to,'target',color);setTimeout(()=>svg.remove(),1200*timingScale);
 }
 function animate(node,frames,options){if(!node.animate)return;const a=node.animate(frames,options);animations.add(a);if(held)a.pause();a.finished.catch(()=>{}).finally(()=>animations.delete(a));return a}
 const effectScene=new EffectScene({stage,db,point,animate,scale:timingScale,reduced:()=>reduced});
 // r23-fx (Kevy's asks, TASK e2): overlays inside each event's existing duration; never changes pacing.
 const fxSkipSummon=e=>!!e?.b2Summon||!!sceneFor(e?.code,db()),fx23=createFx({layer,point,db,view,timingScale,skipSummon:fxSkipSummon,state:()=>({enabled,reduced,skipCutins,preset})});
 const routes=createLearningRoutes({layer,point,db,timingScale,on:()=>enabled&&preset==='learning'&&!skipCutins});/* r28 (Kevy 22 Oct): Learning-mode route lines, labels and outlines *//* r26: B2 and boss scenes present their own summons */
 function refreshField(){
  if(chainVisual.size){$('#chain').innerHTML=[...chainVisual].reverse().map(([n,c])=>{const art=db()[c.code]?.art;return '<div class="chain-thumb '+c.status+'" data-link="CL'+n+'" data-deck-theme="'+escape(decks()[c.player]?.id||'custom')+'" data-card-type="'+cardType(c.code)+'">'+(art?'<img src="'+escape(art)+'" alt="'+escape(c.name)+'">':'')+'<span><b>CL '+n+' · '+c.status.toUpperCase()+'</b>'+escape(c.name||db()[c.code]?.name||'Card effect')+'<small>'+escape(effectFocus(c.code,c.focusDescription||c.description,db(),c)?.label||'Card effect')+'</small></span></div>'}).join('');}
  document.querySelectorAll('[data-chain-badge]').forEach(n=>n.remove());document.querySelectorAll('.chain-aura').forEach(n=>n.classList.remove('chain-aura'));
  for(const [n,c] of chainVisual){if(c.status==='resolved')continue;const node=point(c.source)||document.querySelector(`[data-seat="${c.player}"][data-card="${c.code}"]`);if(!node)continue;node.classList.add('chain-aura');node.style.setProperty('--chain-color',`var(--type-${cardType(c.code)})`);const badge=document.createElement('span');badge.dataset.chainBadge=String(n);badge.className='field-chain-coin';badge.textContent='CL '+n;node.append(badge)}
 }
 function shatter(e,color){if(reduced)return;const node=point(e.from);if(!node)return;const rect=node.getBoundingClientRect();if(!rect.width)return;const shards=document.createElement('div');shards.className='card-shatter';shards.style.setProperty('--shatter-color',color);Object.assign(shards.style,{left:rect.left+'px',top:rect.top+'px',width:rect.width+'px',height:rect.height+'px'});shards.innerHTML=Array.from({length:8},(_,i)=>`<i style="--shard-x:${(i%4-1.5)*35}px;--shard-y:${(i<4?-1:1)*75}px;--shard-turn:${i*41}deg"></i>`).join('');layer.append(shards);shards.addEventListener('animationend',()=>shards.remove(),{once:true})}
 function callout({title,line='',kicker='',color='var(--palette-437)',kind='',code=0}){
  stage.dataset.kind=kind;stage.style.setProperty('--event-color',color);
  $('#event-kicker').textContent=kicker;$('#event-title').textContent=title;$('#event-line').textContent=line;
  const card=db()[code],art=$('#event-art');art.hidden=!card?.art;if(card?.art){art.src=card.art;art.alt=card.name}
  stage.hidden=false;
  if(stage.dataset.spotlight==='true'){
   stage.classList.add('live');
  }else{stage.classList.remove('live');void stage.offsetWidth;stage.classList.add('live')}
  previousCard=code;
  ribbon.hidden=true;
 }
 function boss(e){const card=db()[e.code],profile=sceneFor(e.code,db())||(legacySummon(e)?{theme:e.b2Summon.kind,title:'',line:''}:null);if(!card||!profile)return;
  scene.dataset.theme=profile.theme;scene.dataset.deckTheme=decks()[e.player]?.id||'custom';scene.dataset.pace=preset;scene.style.setProperty('--scene-accent','var(--seat-accent)');
  $('#scene-art').src=card.art||'';$('#scene-art').alt=card.name;$('#scene-name').textContent=card.name;$('#scene-title').textContent=profile.title;$('#scene-line').textContent=profile.line;$('#scene-title').hidden=!profile.title;$('#scene-line').hidden=!profile.line;
  const type=card.type&67108864?'LINK':card.type&8388608?'XYZ':card.type&8192?'SYNCHRO':card.type&64?'FUSION':card.type&128?'RITUAL':'MONSTER';
  $('#scene-summon').textContent=type+' MONSTER · SUMMON CONFIRMED';$('#scene-player').textContent=seat(e.player);
  $('#scene-stats').textContent='BASE ATK '+(card.attack<0?'?':card.attack)+(card.type&67108864?' · LINK '+card.level:' / DEF '+(card.defense<0?'?':card.defense));
  stage.hidden=true;scene.classList.remove('playing');if(!scene.open)scene.showModal();void scene.offsetWidth;scene.classList.add('playing');scene.classList.add('boss-impact');setTimeout(()=>scene.classList.remove('boss-impact'),500*timingScale);sound.play('boss',profile.theme);
 }
 function victoryScene(e){
  const lost=e.player!==null&&e.player!==view()&&$('#spectator-tag')?.hidden;const deck=e.player===null?null:decks()[e.player],profile=deck?sceneFor(deck.boss,db()):null;
  const theme=profile?.theme||'fusion',accent=deck?.accent||'var(--palette-438)';victory.dataset.theme=theme;victory.dataset.draw=String(!deck);victory.dataset.deckTheme=deck?.id||'custom';victory.style.setProperty('--victory-accent','var(--seat-accent)');const confetti=$('#victory-confetti');if(confetti){confetti.innerHTML=Array.from({length:32},(_,i)=>`<i style="--confetti-x:${(i*37)%100}%;--confetti-delay:${(i%7)*.09}s;--confetti-turn:${i%2?480:-360}deg"></i>`).join('')}
  const art=$('#victory-art'),card=deck?db()[deck.boss]:null;art.hidden=!card?.art;if(card?.art){art.src=card.art;art.alt=card.name}
  $('#victory-kicker').textContent=deck?'WINNER: '+seat(e.player)+' · '+deck.name:'Duel drawn';$('#victory-title').textContent=deck?lost?'DEFEAT':'VICTORY':'DUEL DRAWN';$('#victory-deck').textContent=deck?.name||'Both decks reach the finish';
  $('#victory-motto').textContent=({crimson:'CRIMSON ABYSS · THE FLAME ENDURES',ice:'CRIMSON ABYSS · THE ICEBLADE PREVAILS',mikanko:'BORROWED BOSSES · THE FINAL DANCE',striker:'ZERO PROTOCOL · MISSION COMPLETE',lunar:'MOONLIT HUNT · THE HUNTER PREVAILS'})[theme]||'THE FINAL CHAPTER';
  const lp=e.lp||actualLP;$('#victory-result').innerHTML='Final LP · '+lp.map((value,i)=>'<span'+(i===e.player?' class="winner-lp"':'')+'>'+escape(decks()[i]?.name||('Seat '+(i+1)))+' '+value+'</span>').join(' · ')+' · '+(e.turn??0)+' turns · End reason: '+escape(endReason(e))+(finishLine(e)?'<b class="victory-finish">Finishing blow: '+escape(finishLine(e))+'</b>':'');
  stage.hidden=true;if(!victory.open)victory.showModal();sound.play(lost?'defeat':deck?'victory':'win',theme);
 }
 let finishAttack=null,finishHit=null;/* r34 (ChatGPT RELAY-022 #10): the confirmed last blow, for the result screen */
 function trackFinish(e){if(e.type==='turn'){finishAttack=null;finishHit=null}else if(e.type==='attack')finishAttack={code:e.code,direct:!e.to,to:e.to?.code};else if(['damage','lpUpdate'].includes(e.type)&&e.after<e.before)finishHit={player:e.player,amount:e.type==='damage'&&e.amount?e.amount:e.before-e.after,after:e.after,attack:e.type==='damage'&&!e.combat?null:finishAttack}}/* r34.1 (ChatGPT RELAY-030 R34-04): the confirmed damage (1700), not the LP left to lose (1400) */
 function finishLine(e){const h=finishHit;if(!h||h.after>0||e.player===null||h.player===e.player)return '';const name=c=>db()[c]?.name||'';const a=h.attack;
  return a&&name(a.code)?name(a.code)+(a.direct?' attacks directly':' battles'+(name(a.to)?' '+name(a.to):''))+' · '+h.amount+' damage':h.amount+' damage from a card effect'}
 function event(batch,duration){
  for(const e of batch)trackFinish(e);
  if(batch[0].type==='fusionMaterials'){document.dispatchEvent(new window.CustomEvent('duel-presentation-event',{detail:batch[0]}));stage.hidden=true;materialsScene.show(batch[0],duration,materialsVisual());return}
  if(batch.every(e=>e.b1Material)){for(const m of batch)if(m.type==='move')routes.flight(m,0,Math.min(400,duration));return}/* r28: Fusion materials (shown again in the summon scene) still get their Learning route lines */
  for(const e of batch)if(e.type==='move'&&!e.routeOnly)arrive(point(e.to)); // only route-only moves fly; others show at once
  effectScene.resetReturn();closeChainLog();sceneToken++;fx23.clear(true);if(batch[0].type==='activate')chainBuilding=true;else if(['resolve','chainEnd'].includes(batch[0].type))chainBuilding=false;document.dispatchEvent(new window.CustomEvent('duel-presentation-event',{detail:batch[0]}));
  const first=batch[0];if(first.type==='attack'){const node=point(first.from);first.code=Number(node?.dataset.card)||0;}if(!first.code&&chainVisual.has(first.chain))Object.assign(first,{code:chainVisual.get(first.chain).code,player:chainVisual.get(first.chain).player,source:chainVisual.get(first.chain).source});
  $('#event-effect').hidden=true;$('#effect-sequence').hidden=true;stage.dataset.spotlight='false';stage.dataset.compact='false';$('#event-type-line').textContent='';$('#scene-chain-coin').hidden=true;$('#card-clause-glow').hidden=true;$('#card-live-effect').hidden=true;$('#negated-stamp').hidden=true;stage.dataset.fromHand='false';stage.dataset.negated='false';$('#event-lp').hidden=true;stage.classList.remove('finishing-hit');
  const e=batch[0];sound.setSeat?.(audioSeat(e.player??e.from?.controller??0));sound.setEvent?.(e,db()[e.code]);if(e.type==='chainLock'){callout({title:'CHAIN ×'+e.count+' · RESOLVING',kicker:'CHAIN LOCKED',kind:'chainLock'});sound.play('chainLock');return}if(e.type==='resolve'&&e.silent){if(chainVisual.has(e.chain)&&chainVisual.get(e.chain).status!=='negated')chainVisual.get(e.chain).status='resolved';/* r34 (ChatGPT RELAY-022 #2): a negated link stays negated */refreshField();return}if(e.type==='win'){chainVisual.clear();refreshField();$('#chain').innerHTML='';$('#event-chain-strip').innerHTML='';$('#event-chain-strip').hidden=true;}if(e.type==='ko'){knockout(e);return}if(lpTypes.has(e.type)){if(e.type==='cost')fx23.event(e,batch,duration);life(e);return}if(e.type==='chainEnd'&&e.silent){chainVisual.clear();refreshField();$('#chain').innerHTML='';$('#event-chain-strip').innerHTML='';$('#event-chain-strip').hidden=true;return}if(e.routeOnly){stage.hidden=true;const cue=eventCue(e,db()),color='var(--palette-441)';if(['banish','destroy'].includes(cue))shatter(e,color);fly(e,color,0,Math.max(1,duration));sound.play(cue);return}const cue=eventCue(e,db()),[label,fallbackColor]=MECHANICS[cue]||['DUEL EVENT','var(--palette-439)'];const type=cardType(e.code),color=e.code?`var(--type-${type})`:fallbackColor;stage.dataset.cardType=type;stage.dataset.deckTheme=decks()[e.player??e.from?.controller??chainVisual.get(e.chain)?.player]?.id||'custom';
  if(e.chain&&chainVisual.has(e.chain)){const c=chainVisual.get(e.chain);e.source??=c.source;e.player??=c.player;}
  if(e.type==='activate')chainVisual.set(e.chain,{player:e.player,code:e.code,description:e.description,focusDescription:e.focusDescription,effectLocation:e.effectLocation,name:db()[e.code]?.name||'Card effect',source:e.source||{controller:e.player,location:e.effectLocation},status:'activated'});if(e.type==='resolve'&&!chainVisual.has(e.chain))chainVisual.set(e.chain,{...e,name:db()[e.code]?.name,source:e.source||{controller:e.player,location:e.effectLocation},status:e.negated?'negated':'resolving'});if(e.type==='resolve'&&e.negated&&chainVisual.has(e.chain))chainVisual.get(e.chain).status='negated';if(e.type==='resolve'&&chainVisual.has(e.chain)&&e.focusDescription)chainVisual.get(e.chain).focusDescription=e.focusDescription;if(e.type==='resolve'&&chainVisual.has(e.chain)&&chainVisual.get(e.chain).status!=='negated')chainVisual.get(e.chain).status='resolving';if(e.type==='negate'&&chainVisual.has(e.chain))chainVisual.get(e.chain).status='negated';
  if(e.type==='effectChosen'&&e.linkedChain&&chainVisual.has(e.linkedChain)){const link=chainVisual.get(e.linkedChain);link.focusDescription=e.description;}
  const displayChain=e.linkedChain??e.chain;
  const strip=$('#event-chain-strip');strip.hidden=!['activate','resolve','negate'].includes(e.type)&&!(e.type==='effectChosen'&&chainVisual.size);strip.innerHTML=[...chainVisual].reverse().map(([n,c])=>`<div data-deck-theme="${escape(decks()[c.player]?.id||'custom')}" data-card-type="${cardType(c.code)}" data-link="CL${n}" class="chain-thumb ${n===displayChain?'current':''} ${c.status}">${db()[c.code]?.art?`<img src="${escape(db()[c.code].art)}" alt="${escape(c.name)}">`:'<span class="chain-no-art">◇</span>'}<span><b>CL ${n}<span class="cl-state-inline"> · ${c.status==='resolving'?'RESOLVING':c.status==='negated'?'NEGATED':c.status==='resolved'?'RESOLVED':c.status==='pending'?'PENDING':'ACTIVATED'}</span></b>${escape(c.name)}<small>${escape(effectFocus(c.code,c.focusDescription||c.description,db(),c)?.label||'Card effect')}</small></span><i class="chain-state">${c.status==='resolving'?'RESOLVING':c.status==='negated'?'NEGATED':c.status==='resolved'?'RESOLVED':'PENDING'}</i></div>`).join('');if(!strip.hidden)$('#chain').innerHTML=strip.innerHTML;$('#event-seal').textContent=['activate','resolve','negate'].includes(e.type)?String(e.chain).padStart(2,'0'):e.type==='summon'?'✧':e.type==='phase'?'◇':e.type==='attack'?'⚔':'◈';if(e.type==='chainEnd'){chainVisual.clear();refreshField();$('#chain').innerHTML='<p class="muted">Chain complete · all links processed.</p>'}
  refreshField();
  if(e.type==='target'){const c=chainVisual.get(e.chain)||[...chainVisual.values()].reverse().find(c=>c.code===e.code);if(c)c.targets=e.cards;}
  if(e.type==='phase'){const key=e.phase===1?'DP':e.phase===2?'SP':e.phase===4?'M1':e.phase>=8&&e.phase<=128?'BP':e.phase===256?'M2':e.phase===512?'EP':'';for(const n of document.querySelectorAll('#phase-tracker [data-phase]')){if(n.dataset.phase===key)n.parentElement.setAttribute('aria-current','step');else n.parentElement.removeAttribute('aria-current');}const [title,tone,accent,line]=PHASE_CUES[e.phase]||['PHASE CHANGE','phase',color,''];callout({title,line,kicker:'DUEL PHASE',color:accent,kind:'phase'});sound.play(tone);return}
  if(e.b2Summon){try{summonScene.log(e);if(summonVisual()&&e.b2Summon.confirmed){summonScene.show(e,duration,decks()[e.player]);sound.play('boss',sceneFor(e.code,db())?.theme||e.b2Summon.kind);stage.hidden=true;return}}catch(err){summonScene.clear();console.error('[summon] scene error; plain summon',e.b2Summon.kind,err)}}
  if(e.type==='summon'&&(legacySummon(e)||!e.b2Summon&&enabled&&!reduced&&!skipCutins&&e.special&&sceneFor(e.code,db()))){pulse(point({controller:e.player,location:4,sequence:e.sequence}),'arrival',color);boss(e);return}
  if(e.type==='win'){victoryScene(e);return}
  let title=label,kicker='DUEL MECHANIC',line='',code=e.code||0;
  if(e.type==='move'){if(['destroy','banish'].includes(cue))for(const m of batch)shatter(m,color);kicker=batch.length>1?`${batch.length} CARDS · ${seat(e.from.controller)}`:seat(e.from.controller);line=zone(e.from)+' → '+zone(e.to);if(showcaseOn()&&!chainBuilding){const per=flightTiming()[0];for(const [i,m] of batch.entries())fly(m,color,0,per,{index:i,count:batch.length,label:flightLabel(batch[0]),route:zoneWord(batch[0].from)+' \u2192 '+zoneWord(batch[0].to)})}else for(const [i,m] of batch.entries())fly(m,color,i*Math.min(65,duration/(batch.length+2)),Math.min(400,duration-i*Math.min(65,duration/(batch.length+2))-20));if(batch.length===1&&code)line=(db()[code]?.name||'Card')+' · '+line;}
  else if(e.type==='effectChosen'){title='EFFECT SELECTED';kicker=(e.option?'EFFECT OPTION · ':'BEFORE ACTIVATION · ')+seat(e.player);line=db()[e.code]?.name||'Card effect';}
  else if(e.type==='activate'){title='CHAIN LINK '+e.chain;kicker=label;line=db()[e.code]?.name||'Card effect';pulse(document.querySelector(`[data-card="${e.code}"]`),'effect',color);}
  else if(e.type==='resolve'){const negatedLink=chainVisual.get(e.chain)?.status==='negated',short=negatedLink?'':bannerShort(effectFocus(code,e.focusDescription||e.description,db(),e)?.label);title=negatedLink?'NEGATED · LINK '+e.chain:'CHAIN LINK '+e.chain+' RESOLVES'+(short?' · '+short:'');/* Seto 16 Oct: banner names the link and the effect in short form */kicker='CHAIN RESOLUTION';line=db()[e.code]?.name||'Resolving the activated effect';}
  else if(e.type==='negate'){title='LINK '+e.chain+' · NEGATED';kicker='CHAIN INTERRUPTED';}
  else if(e.type==='attack'){kicker=e.to?'MONSTER ATTACK':'DIRECT ATTACK';line=zone(e.from)+' → '+(e.to?zone(e.to):seat(1-e.from.controller)+' · LP');fly({...e,to:e.to||{controller:1-e.from.controller,location:0}},color,0,Math.min(400,duration-20));}
  else if(e.type==='draw'){title='DRAW!';kicker=seat(e.player);line='+'+e.count+' CARD'+(e.count===1?'':'S');for(let i=0;i<Math.min(e.count,5);i++)fly({type:'move',from:{controller:e.player,location:1},to:{controller:e.player,location:2}},color,i*35,Math.min(400,duration-i*35-20));pulse($(e.player===view()?'#my-hand':'#opp-hand'),'arrival',color);}
  // Turn-change banner (Seto, 14 Oct): numbered per player, at most 0.8 s, a tap skips it, none at Instant (0 ms batch).
  else if(e.type==='turn'){const n=Math.ceil(e.turn/2),watching=!document.getElementById('spectator-tag')?.hidden;title=watching?(decks()[e.player]?.name||(e.player===1?'DECK B':'DECK A')).toUpperCase()+' · TURN '+n:(e.player===view()?'YOUR TURN ':'OPPONENT TURN ')+n;kicker='TURN CHANGE';line=seat(e.player);
   const tap=()=>skipCurrent();document.addEventListener('pointerdown',tap,{once:true,capture:true});setTimeout(()=>document.removeEventListener('pointerdown',tap,{capture:true}),Math.max(0,duration)*timingScale+50);}
  else if(e.type==='summon'){line=db()[e.code]?.name||'Monster';kicker=seat(e.player);pulse(point({controller:e.player,location:4,sequence:e.sequence}),'arrival',color);}
  else if(lpTypes.has(e.type)){title=e.type==='lpUpdate'?'LP CHANGE':(e.type==='recover'?'+':'−')+e.amount+' LP';kicker=label;line=seat(e.player);pulse($(e.player===view()?'#my-lp':'#opp-lp'),'damage',color);}
  else if(e.type==='target'){line=e.cards.length+' CARD'+(e.cards.length===1?'':'S');for(const c of e.cards)pulse(point(c),'target',color);}
  else if(e.type==='equip'){line=zone(e.from)+' → '+zone(e.to);fly(e,color,0,Math.min(400,duration-20));}
  else if(e.type==='position'){line=code?db()[code]?.name||'Card':'Face-down card';pulse(point(e.from),'arrival',color);}
  else if(e.type==='win'){title=e.player===null?'DUEL DRAWN':'WINNER: '+seat(e.player);line=e.player===null?'Both sides reach the finish.':'Victory confirmed';}
  fx23.event(e,batch,duration,color);routes.event(e,batch,duration);
  if(e.type==='summon'){const node=point({controller:e.player,location:4,sequence:e.sequence});if(node){node.dataset.summonFx=e.special?type==='fusion'?'fusion':type==='link'?'link':'special':'normal';pulse(node,'summon',color)}}
  if(e.type==='position'||e.type==='move'&&cue==='set')pulse(point(e.to||e.from),'flip',color);
  const effectTypes=e.compact?[]:chainFlow?['resolve','negate']:['effectChosen','activate','resolve','negate','target','equip'];if(e.compact){stage.dataset.compact='true';$('#event-line').textContent=effectFocus(code,e.focusDescription||e.description,db(),e)?.excerpt||line;effectScene.show(e,null,chainVisual.get(e.chain))}else stage.dataset.compact='false';
  stage.dataset.spotlight=String(!e.onField&&!!code&&[...effectTypes,'attack'].includes(e.type));
  if(e.type==='resolve'&&e.onField)fieldResolution(e,effectFocus(code,e.focusDescription||e.description,db(),e),color);else callout({title,line,kicker,color,kind:e.type,code});
  if(code&&effectTypes.includes(e.type)&&!e.onField){
   const focus=effectFocus(code,e.focusDescription||e.description,db(),e);if(focus){
    effectScene.show(e,focus,chainVisual.get(e.chain));
    $('#event-effect').hidden=false;$('#event-effect-caption').textContent=focus.mapped?(e.type==='resolve'?(chainVisual.get(e.chain)?.status==='negated'?'NEGATED EFFECT · NOT APPLIED':'RESOLVING TEXT · TIMING / COST IN GREY'):'ONLY THE ACTIVE EFFECT IS HIGHLIGHTED'):'PRINTED TEXT PREVIEW · CLAUSE NOT VERIFIED';$('#event-effect-label').textContent=focus.label;$('#event-effect-text').innerHTML=effectMarkup(focus,escape);
    const text=$('#event-effect-text'),mark=text.querySelector('[data-active-clause]');text.scrollTop=0;if(mark)text.scrollTop=Math.max(0,mark.getBoundingClientRect().top-text.getBoundingClientRect().top-8);effectPages(e,duration);
    $('#effect-sequence').hidden=false;const step=e.type==='effectChosen'?'chosen':['resolve','negate'].includes(e.type)?'resolve':'activate';$('#effect-sequence').dataset.current=step;$('#effect-sequence').querySelectorAll('span').forEach(n=>{n.classList.toggle('active',n.dataset.effectStep===step);n.querySelector('i')?.remove();if(n.classList.contains('active')){const bar=document.createElement('i');bar.setAttribute('aria-hidden','true');n.append(bar)}});
    $('#effect-dock').dataset.cardType=type;$('#effect-dock').dataset.deckTheme=stage.dataset.deckTheme;$('#effect-dock').hidden=false;$('#effect-dock-name').textContent=db()[code]?.name||'Card';$('#effect-dock-status').textContent=e.type==='effectChosen'?(e.option?'OPTION SELECTED':'SELECTED · BEFORE ACTIVATION'):e.type==='resolve'?(chainVisual.get(e.chain)?.status==='negated'?'NEGATED':'RESOLVING'):e.type==='negate'?'NEGATED':'LATEST INTERACTION';$('#effect-dock-art').src=db()[code]?.art||'';$('#effect-dock-art').hidden=!db()[code]?.art;$('#effect-dock-art').alt=db()[code]?.name||'';$('#effect-dock-open').dataset.card=String(code);$('#effect-dock-text').innerHTML=effectMarkup(focus,escape);
   }
  }
  if(e.type==='resolve'&&chainVisual.get(e.chain)?.status!=='negated'){const c=chainVisual.get(e.chain),targets=e.targets||c?.targets||[];const following=[];for(const b of queue){if(['resolve','activate','chainEnd'].includes(b.events[0].type))break;for(const m of b.events)if(m.type==='move')following.push(m.from,m.to)}const routes=targets.length?targets:following;for(const t of routes)energyLine(point(e.source)||document.querySelector(`[data-card="${code}"]`),point(t),color)}
  const current=strip.querySelector('.current');if(current)strip.scrollLeft=Math.max(0,current.offsetLeft-strip.offsetLeft-8);
  if(e.type==='activate'){sound.play('chain',e.chain);sound.play(cue);if(e.effectLocation===2||db()[e.code]?.type&65536||/Quick Effect/i.test(effectFocus(e.code,e.description,db(),e)?.excerpt||''))sound.play('interrupt')}else sound.play(e.negated?'negate':cue,e.chain);if(e.type==='resolve'){const flights=new Map(),groups=[moveGroups(batch.slice(1).filter(r=>!r.b1Material)).flat()].filter(g=>g.length),per=RESOLVE_FLIGHT[preset]||1800;groups.forEach((g,gi)=>{const mixed=new Set(g.map(r=>flightLabel(r)+zoneWord(r.from)+zoneWord(r.to))).size>1;g.forEach((r,ri)=>flights.set(r,{group:gi,index:ri,count:g.length,beats:RESOLVE_BEATS,anchor:'stage',label:mixed?'CARDS MOVE':flightLabel(g[0]),route:mixed?'SEVERAL ZONES':zoneWord(g[0].from)+' \u2192 '+zoneWord(g[0].to)}))});
   // One flight at the start of the scene (storyboard order); the resolving card steps aside for it.
   // Seto 16 Oct chain-box verdict: one effect at a time. While the Showtime chain box is up, the box is the only effect;
   // moved cards take the short flight at the end of the scene instead (no timing change: the flight never added scene time).
   if(chainBoxOn(e))flights.clear();
   stage.dataset.moving=String(flights.size>0&&showcaseOn());if(showcaseOn())for(const [r,f] of flights)fly(r,color,0,per,f);
   for(const [i,result] of batch.slice(1).entries()){if(result.b1Material)continue;const run=generation,token=sceneToken;setTimeout(()=>{if(run!==generation||token!==sceneToken)return;sound.setEvent?.(result,db()[result.code]);sound.setSeat?.(audioSeat(result.player??result.from?.controller??0));const color='var(--palette-441)';if(result.type==='move'){if(['banish','destroy'].includes(eventCue(result,db())))shatter(result,color);const f=flights.get(result);if(!(f&&showcaseOn()))fly(result,color,0,400);sound.play(eventCue(result,db()))}else if(result.type==='draw'){for(let i=0;i<Math.min(5,result.count);i++)fly({type:'move',from:{controller:result.player,location:1},to:{controller:result.player,location:2}},color,i*30,400);sound.play('draw')}else if(result.type==='summon'){document.dispatchEvent(new window.CustomEvent('duel-presentation-event',{detail:result}));pulse(point({controller:result.player,location:4,sequence:result.sequence}),'summon',color);sound.play(cardType(result.code));}else if(result.type==='equip')fly(result,color,0,400)},Math.max(0,duration-850+i*30)*timingScale)}}

 }
 function closeChainLog(){if(document.body.dataset.chainLog){delete document.body.dataset.chainLog;$('#chain-log-btn')?.setAttribute('aria-pressed','false')}}
 function clearStage(closeVictory=false){routes.clear();summonScene.clear();materialsScene.clear();closeChainLog();delete stage.dataset.moving;pageTimers.forEach(clearTimeout);pageTimers=[];delete $('#event-effect')?.dataset.more;delete $('#event-effect')?.dataset.page;if($('#event-effect-text'))$('#event-effect-text').style.paddingBottom='';clearTimeout(returnTimer);clearTimeout(lpStartTimer);lpFx.finish();clearFieldScene();clearTimeout(lifeTimer);if(lifeTarget){displayLP[lifeTarget.player]=lifeTarget.after;pendingLife.delete(lifeTarget.id);lifeTarget=null;writeLife()}if(closeVictory&&victory.open)victory.close();if(scene.open)scene.close();scene.classList.remove('playing');stage.hidden=true;stage.classList.remove('live')}
 function armTimer(ms){clearTimeout(timer);remaining=Math.max(0,ms);deadline=Date.now()+remaining;if(!held)timer=setTimeout(()=>complete?.(),remaining)}
 function next(){
  clearTimeout(timer);const batch=queue.shift();
  clearStage();
  if(!batch){complete=null;settleLife();playing=false;skip.hidden=true;$('#continue-effect').hidden=true;document.body.dataset.fxBusy='false';clearArriving(),onBusy?.(false,seen);return}
  playing=true;skip.hidden=false;document.body.dataset.fxBusy='true';onBusy?.(true);
  if(batch.events[0].b2Summon)batch.duration=summonVisual()&&(batch.events[0].b2Summon.confirmed||legacySummon(batch.events[0]))?(SUMMON_MS[preset]??SUMMON_MS.learning):0;
  if(batch.events[0].type==='fusionMaterials'&&!materialsVisual())batch.duration=0;
  if(batch.events[0].type==='turn'&&TURN_MS[preset]&&enabled)batch.duration=TURN_MS[preset];
  // Seto: only the existing 900 ms AI direct-attack hold in Learning/Duel changes.
  const attack=batch.events[0];
  if(batch.duration===900&&['learning','duel'].includes(preset)&&attack.type==='attack'&&!attack.to&&isComputer(attack.from?.controller))batch.duration=500;
  {const extra=flightExtra(batch);if(extra){batch.duration+=extra;document.dispatchEvent(new window.CustomEvent('flight-extra',{detail:{ms:extra*timingScale}}))}}
  /* r28 (Kevy 22 Oct 09:45, "longer pauses" in Learning): a batch with a labelled route lasts long enough to read it. Learning only. */
  if(preset==='learning'&&enabled&&batch.duration>0){const need=learningMinimum(batch);if(need>batch.duration){document.dispatchEvent(new window.CustomEvent('learning-extra',{detail:{ms:(need-batch.duration)*timingScale}}));batch.duration=need}}
  /* r26 (Kevy 21 Oct 23:05, longer cutscenes): a batch that carries a banish, cost or Special Summon scene lasts at least that scene's length. */
  {const first=batch.events[0],on=enabled&&!reduced&&!skipCutins&&preset!=='instant'&&!document.body.classList.contains('quiet-motion')&&!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,k=on&&!first.b2Summon&&first.type!=='fusionMaterials'?cutsceneKind(batch.events,{db,skipSummon:fxSkipSummon}):null,cut=k?(CUTSCENE_MS[preset]||{})[k]||0:0,need=cut&&['resolve','negate'].includes(first.type)?Math.round(batch.duration*.5)+cut:cut;/* in a resolution the cards fly about halfway through */if(need>batch.duration){document.dispatchEvent(new window.CustomEvent('cutscene-extra',{detail:{kind:k,ms:(need-batch.duration)*timingScale}}));batch.duration=need}}
  for(const node of [stage,scene,victory])node.style.setProperty(node===stage?'--event-duration':node===scene?'--scene-duration':'--victory-duration',(batch.duration*timingScale/1000)+'s');
  // Kevy 16 Oct freeze: if anything in a scene throws, log it and keep the queue moving; a visual or sound problem
  // must never leave the presentation 'playing' forever (which stops the duel).
  try{event(batch.events,batch.duration);if(batch.events[0].b2Summon&&!summonScene.node&&!(legacySummon(batch.events[0])&&scene.open))batch.duration=0}catch(err){console.error('[presentation] scene error; continuing',batch.events[0]?.type,err);if(batch.events[0]?.type==='fusionMaterials'){materialsScene.clear();batch.duration=0}}const run=generation;currentHold=!!batch.holdUntilTap;$('#continue-effect').hidden=!currentHold;const isEffect=['effectChosen','activate','resolve','negate'].includes(batch.events[0].type);activeEffect=isEffect?{code:batch.events[0].code,type:batch.events[0].type,started:performance.now(),plannedMs:batch.duration,skipped:false}:null;
  complete=()=>{if(run!==generation)return;if(activeEffect&&!currentHold&&!activeEffect.skipped){const left=activeEffect.plannedMs*timingScale-(performance.now()-activeEffect.started);if(left>0){timer=setTimeout(()=>complete?.(),Math.ceil(left));return}}const current=batch.events[0];if(activeEffect){effectMetrics.push({...activeEffect,elapsedMs:performance.now()-activeEffect.started});document.dispatchEvent(new window.CustomEvent('effect-scene-complete',{detail:effectMetrics.at(-1)}));activeEffect=null;}if(current.type==='resolve'&&chainVisual.has(current.chain)&&chainVisual.get(current.chain).status!=='negated')chainVisual.get(current.chain).status='resolved';refreshField();next()};
  if(!currentHold)armTimer(batch.duration*timingScale);else {clearTimeout(timer);remaining=batch.duration*timingScale;}
  clearTimeout(returnTimer);returnRemaining=Math.max(0,batch.duration-350)*timingScale;returnDeadline=Date.now()+returnRemaining;if(!currentHold&&isEffect&&!reduced&&!held)returnTimer=setTimeout(()=>{if(activeEffect&&!batch.events[0].onField)effectScene.returnToField()},returnRemaining)
 }
 function hold(value){
  value=!!value;if(value===held)return;
  if(!value&&activeEffect)activeEffect.started+=performance.now()-(activeEffect.pausedAt||performance.now());if(value&&activeEffect)activeEffect.pausedAt=performance.now();if(value&&playing){remaining=Math.max(0,deadline-Date.now());returnRemaining=Math.max(0,returnDeadline-Date.now());}held=value;document.body.classList.toggle('fx-held',held);
  for(const a of animations){try{held?a.pause():a.play()}catch{}}
  if(held){clearTimeout(timer);clearTimeout(returnTimer)}else if(playing&&complete&&!currentHold){armTimer(remaining);if(activeEffect&&!fieldScene&&!reduced){returnDeadline=Date.now()+returnRemaining;returnTimer=setTimeout(()=>{if(activeEffect)effectScene.returnToField()},returnRemaining)}}
 }
 function skipAll(){summonCutscenes.reset();fusionMaterials.reset();closeChainLog();clearArriving();for(const a of stage.querySelector('.event-card-wrap').getAnimations?.()||[])a.cancel();clearTimeout(returnTimer);document.querySelectorAll('.lp-delta').forEach(n=>n.remove());lpFx.reset();generation++;if(activeEffect)effectMetrics.push({...activeEffect,skipped:true,elapsedMs:performance.now()-activeEffect.started});activeEffect=null;currentHold=false;$('#continue-effect').hidden=true;complete=null;previousCard=0;sound.stop?.();queue=[];chainBuilding=false;chainVisual.clear();refreshField();clearTimeout(timer);clearStage(true);pendingLife.clear();displayLP=[...actualLP];writeLife();for(const a of animations)a.cancel();animations.clear();layer.innerHTML='';playing=false;skip.hidden=true;document.body.dataset.fxBusy='false';clearArriving(),onBusy?.(false,seen);onSkip?.(seen)}
 $('#continue-effect').onclick=()=>{if(currentHold&&!held)complete?.()};
 function skipCurrent(){sceneToken++;fx23.clear();clearTimeout(timer);clearTimeout(returnTimer);if(activeEffect){activeEffect.skipped=true;activeEffect.plannedMs=0}currentHold=false;complete?.()}
 $('#skip-victory').onclick=()=>{skipCurrent();victory.close()};victory.addEventListener('cancel',e=>{e.preventDefault();skipAll()});
 $('#skip-scene').onclick=skipCurrent;skip.onclick=skipCurrent;scene.addEventListener('cancel',e=>{e.preventDefault();skipAll()});
 return {
  syncLifePoints(values,events=[]){actualLP=values.map(n=>Math.max(0,n));for(const e of events)if(e.id>seen&&lpTypes.has(e.type))pendingLife.set(e.id,e);if(!playing)settleLife();else writeLife()},
  configure({cinematics,skipCutins:nextSkipCutins=false,motion,pace:nextPace=1,effectPace:nextEffectPace,preset:nextPreset='learning',chainView:nextView,tapToContinue:nextTap=false,chainFlow:nextFlow=true}){skipCutins=!!nextSkipCutins;preset=nextPreset;chainView=nextView;tapToContinue=nextTap;chainFlow=nextFlow;const changed=enabled!==cinematics||reduced!==motion;enabled=cinematics;reduced=motion;pace=nextPace;effectPace=nextEffectPace;if(changed)skipAll();else if(materialsScene.node&&!materialsVisual()||summonScene.node&&!summonVisual())skipCurrent()},
  play(events,ackId){const fresh=[];for(const e of events||[])if(e.id>seen){seen=e.id;fresh.push(e)}seen=Math.max(seen,Number(ackId)||0);for(const e of fresh)if(lpTypes.has(e.type))pendingLife.set(e.id,e);fusionMaterials.observe(fresh,db());summonCutscenes.observe(fresh,db());const batches=director.ingest(fresh,db(),{cinematics:enabled,skipCutins,motion:reduced,pace,effectPace,preset,chainView:chainView==='auto'?undefined:chainView,tapToContinue,chainFlow,deferResolution:true});for(const e of fresh){if(e.type==='activate'&&!chainVisual.has(e.chain))chainVisual.set(e.chain,{...e,name:db()[e.code]?.name,status:'pending'});if(e.type==='target'){const c=chainVisual.get(e.chain)||[...chainVisual.values()].at(-1);if(c)c.targets=e.cards}}refreshField();queue.push(...summonCutscenes.decorate(fusionMaterials.decorate(batches,preset),preset));if(queue.length&&!playing)next();else if(!playing)clearArriving(),onBusy?.(false,seen)},
  reset(){fx23.clear();document.querySelectorAll('.ko-loser,.ko-slow').forEach(n=>n.classList.remove('ko-loser','ko-slow'));director.reset();summonCutscenes.reset();summonScene.reset();fusionMaterials.reset();materialsScene.reset();hold(false);skipAll();$('#effect-dock').hidden=true;actualLP=[8000,8000],effectMetrics=[],activeEffect=null,currentHold=false;displayLP=[8000,8000];writeLife();seen=0;clearTimeout(ribbonTimer);ribbon.hidden=true;/* r34.1 (ChatGPT RELAY-030): a held chain from the last duel must not stay in the side panel */$('#chain').innerHTML='';const st=$('#event-chain-strip');if(st){st.innerHTML='';st.hidden=true}},
  refreshField,
  get metrics(){return [...effectMetrics]},
  hold,
  skip:skipCurrent,
  get active(){return playing}
 };
}

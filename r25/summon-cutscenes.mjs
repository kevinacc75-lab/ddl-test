// B2 presentation only: inputs are the public event stream and printed card data.
import {publicMaterial} from './fusion-materials.mjs';
export const SUMMON_MS=Object.freeze({learning:5000,duel:2500,broadcast:1500,instant:0});
export const SUMMON_TYPES=Object.freeze({fusion:{type:64,reason:262144},synchro:{type:8192,reason:524288},xyz:{type:8388608,reason:2097152},link:{type:67108864,reason:268435456}});
export const LINK_ARROWS=Object.freeze([{bit:64,label:'Top-left',glyph:'↖'},{bit:128,label:'Top',glyph:'↑'},{bit:256,label:'Top-right',glyph:'↗'},{bit:8,label:'Left',glyph:'←'},{bit:32,label:'Right',glyph:'→'},{bit:1,label:'Bottom-left',glyph:'↙'},{bit:2,label:'Bottom',glyph:'↓'},{bit:4,label:'Bottom-right',glyph:'↘'}].map(Object.freeze));
const MATERIAL=8;
export function summonKind(card){return Object.keys(SUMMON_TYPES).find(k=>card?.type&SUMMON_TYPES[k].type)||null;}
export function summonEnabled({preset,enabled,reduced,skipCutins},body){return !!SUMMON_MS[preset]&&enabled&&!reduced&&!skipCutins&&body.dataset.graphics!=='smooth'&&body.dataset.theme!=='contrast'&&!body.classList.contains('quiet-motion')&&!body.ownerDocument.defaultView.matchMedia?.('(prefers-reduced-motion: reduce)').matches;}
function safeMaterial(e,db){
 const value=e.private?{code:0,hidden:true,origin:'Hidden zone',destination:'Public destination'}:publicMaterial(e);
 // Never look up a face-down/private identity, even if the raw event contains it.
 return Object.freeze({...value,overlay:!!((e.to?.location&128)||e.to?.overlay_sequence!==undefined),tuner:value.hidden?null:!!(db[value.code]?.type&4096)});
}
export class SummonCutscenes {
 constructor(){this.reset();}
 reset(){this.pending=[];this.confirmed=new Map();}
 observe(events,db){for(const e of events){
  if(['turn','win','chainEnd','resolve','resolutionReady','activate'].includes(e.type))this.pending=[];
  if(e.type==='move'&&(e.reason&MATERIAL)){const kind=Object.keys(SUMMON_TYPES).find(k=>e.reason&SUMMON_TYPES[k].reason);if(kind)this.pending.push({kind,material:safeMaterial(e,db)});}
  if(e.type==='summon'){
   if(e.special&&!e.private&&e.code){const kind=summonKind(db[e.code]);if(kind){const materials=this.pending.filter(m=>m.kind===kind).map(m=>m.material);this.confirmed.set(e.id,Object.freeze({kind,confirmed:materials.length>0,materials:Object.freeze(materials)}));if(this.confirmed.size>120)this.confirmed.delete(this.confirmed.keys().next().value);}}
   this.pending=[];
  }
 }}
 decorate(batches,preset){const out=[];for(const batch of batches){const following=[],kept=[];for(const e of batch.events){const info=e.type==='summon'&&this.confirmed.get(e.id);if(info){this.confirmed.delete(e.id);following.push({events:[{...e,b2Summon:info}],duration:SUMMON_MS[preset]??SUMMON_MS.learning});}else kept.push(e);}if(batch.events[0]?.type==='summon'&&following.length){out.push(...following);if(kept.length)out.push({...batch,events:kept,duration:0});}else{if(kept.length)out.push({...batch,events:kept});out.push(...following);}}return out;}
}
const stat=n=>Number.isFinite(n)&&n>=0?String(n):'?';
export function summonStats(card){return 'BASE ATK '+stat(card.attack)+' / DEF '+((card.type&67108864)?'— (Link monster)':stat(card.defense));}
export function summonLine(e,db){const c=db[e.code],info=e.b2Summon;return (info.kind.toUpperCase()+' monster: '+(c?.name||'Public monster')+' · '+summonStats(c||{})+' · '+(info.confirmed?'Public materials: '+info.materials.map(m=>m.hidden?'Face-down material':db[m.code]?.name||'Public material').join('; '):'Materials not established by public events; existing summon scene.'));}

export class SummonScene {
 constructor({document,db,frame,animate,scale=1}){Object.assign(this,{document,db,frame,animate,scale});this.animations=[];}
 clear(){for(const a of this.animations)try{a?.cancel();}catch{}this.animations=[];this.node?.remove();this.node=null;const dialog=this.document.getElementById('summon-scene');dialog?.classList.remove('b2-active');dialog?.setAttribute('aria-labelledby','scene-name');}
 reset(){this.clear();this.logNode?.remove();this.logNode=null;}
 log(e){if(!this.logNode?.isConnected){this.logNode=this.document.createElement('p');this.logNode.id='summon-cutscene-log';this.logNode.className='b2-log';this.logNode.setAttribute('role','log');(this.document.getElementById('event-log')?.parentElement||this.document.body).append(this.logNode);}this.logNode.textContent=summonLine(e,this.db());}
 el(tag,cls,text){const n=this.document.createElement(tag);n.className=cls;if(text!==undefined)n.textContent=text;return n;}
 motion(node,frames,options){this.animations.push(this.animate(node,frames,options));}
 show(e,duration,deck){
  this.clear();const doc=this.document,dialog=doc.getElementById('summon-scene'),card=this.db()[e.code],info=e.b2Summon;
  if(!card||!info?.confirmed)throw new Error('Public summon information unavailable');
  const root=this.el('section','b2-scene');this.node=root;root.dataset.kind=info.kind;root.dataset.deckTheme=deck?.id||'custom';root.setAttribute('aria-label',info.kind+' summon');
  const hazard=this.el('h2','b2-hazard',info.kind.toUpperCase()+' SUMMON');
  const summary=this.el('div','b2-summary'),name=this.el('h3','b2-name',card.name);name.id='b2-monster-name';summary.append(name,this.el('p','b2-stats',summonStats(card)));
  const arena=this.el('div','b2-arena'),effect=this.el('div','b2-effect'),arrival=this.el('div','b2-arrival');
  // r24 (Kevy, 21 Oct): the summoned card's own image now arrives, as everywhere else in the app (card art approved
  // 21 Oct). The original frame is the fallback when there is no image or it fails to load.
  const frame=this.frame?.(e.code);if(!frame)throw new Error('Original summon frame unavailable');
  if(card.art){const img=this.el('img','b2-art');img.alt=card.name;img.src=card.art;img.onerror=()=>img.replaceWith(frame);arrival.append(img);arrival.dataset.art='true'}else arrival.append(frame);
  const row=this.el('div','b2-materials');for(const [i,m] of info.materials.entries()){const token=this.el('div','b2-material'),label=this.el('span','b2-material-name',m.hidden?'Face-down material':this.db()[m.code]?.name||'Public material');const mart=!m.hidden&&this.db()[m.code]?.art;if(mart){const im=this.el('img','b2-material-art');im.alt='';im.src=mart;im.onerror=()=>im.remove();token.append(im)}token.append(label);token.dataset.hidden=String(m.hidden);token.style.setProperty('--material-index',String(i));row.append(token);}effect.append(row);
  const footer=this.el('p','b2-caption','Public materials · original visual');
  arena.append(effect,arrival);root.append(hazard,summary,arena,footer);dialog.append(root);dialog.classList.add('b2-active');dialog.setAttribute('aria-labelledby','b2-monster-name');
  dialog.dataset.pace=duration===5000?'learning':duration===2500?'duel':'broadcast';
  if(!dialog.open)dialog.showModal();
  const ms=duration*this.scale;
  this.renderType(info,card,effect,row,footer,ms,arrival);
  this.motion(arrival,[{opacity:0,transform:'translateY(14px) scale(.8)'},{opacity:1,transform:'translateY(0) scale(1)'}],{delay:ms*.52,duration:ms*.2,easing:'cubic-bezier(.18,.8,.22,1)',fill:'both'});
  return root;
 }
 renderType(info,card,effect,row,footer,ms,arrival){
  if(info.kind==='fusion'){
   const swirl=this.el('div','b2-fusion-swirl');swirl.setAttribute('aria-hidden','true');effect.prepend(swirl);footer.textContent='Materials merge · the Fusion monster appears';
   this.motion(row,[{opacity:1,transform:'scale(1)'},{opacity:0,transform:'scale(.15) rotate(35deg)'}],{delay:ms*.15,duration:ms*.36,easing:'ease-in',fill:'forwards'});
   this.motion(swirl,[{opacity:0,transform:'rotate(-100deg) scale(.3)'},{opacity:1,transform:'rotate(80deg) scale(1)',offset:.6},{opacity:0,transform:'rotate(170deg) scale(.5)'}],{duration:ms*.72,easing:'ease-out',fill:'both'});
  }else if(info.kind==='synchro'){
   const ring=this.el('div','b2-synchro-ring');ring.setAttribute('aria-hidden','true');
   const flash=this.el('div','b2-synchro-flash');flash.setAttribute('aria-hidden','true');
   const stars=this.el('p','b2-stars','BASE LEVEL '+(card.level&255)+' · '+'★'.repeat(Math.min(12,card.level&255)));stars.setAttribute('aria-label','Printed level '+(card.level&255));effect.prepend(ring,flash);effect.append(stars);
   for(const [i,token] of [...row.children].entries()){
    const m=info.materials[i],role=this.el('b','b2-material-role',m.hidden?'UNKNOWN':m.tuner?'TUNER':'NON-TUNER');token.prepend(role);
    this.motion(token,[{opacity:1,transform:'translateX(0)'},{opacity:0,transform:'translateX(70px) scale(.3)'}],{delay:ms*(.12+i*.025),duration:ms*.34,easing:'ease-in',fill:'forwards'});
   }
   this.motion(ring,[{opacity:0,transform:'scale(.5)'},{opacity:1,transform:'scale(1)',offset:.4},{opacity:0,transform:'scale(1.15)'}],{duration:ms*.65,easing:'ease-out',fill:'both'});
   // Exactly one contained opacity pulse, never a full-screen flash.
   this.motion(flash,[{opacity:0},{opacity:.3,offset:.45},{opacity:0}],{delay:ms*.42,duration:ms*.12,iterations:1,fill:'both'});
   footer.textContent='Printed Tuner / non-Tuner types · one ring of light';
  }else if(info.kind==='xyz'){
   const count=info.materials.filter(m=>m.overlay).length,stack=this.el('div','b2-overlay-stack');stack.setAttribute('aria-hidden','true');
   for(let i=0;i<count;i++){const unit=this.el('i','b2-overlay-unit');stack.append(unit);this.motion(unit,[{opacity:0,transform:'translateX(-120px) scale(.65)'},{opacity:1,transform:'translate('+Math.min(i*4,28)+'px,'+Math.min(i*3,21)+'px) scale(1)'}],{delay:ms*.22,duration:ms*.28,easing:'ease-out',fill:'both'});}
   arrival.parentElement.append(stack);
   const badge=this.el('p','b2-overlay-count',count?'OVERLAY × '+count:'Overlay count not supplied');badge.setAttribute('aria-label',count+' observed public overlay units');arrival.parentElement.append(badge);
   this.motion(row,[{opacity:1,transform:'translateX(0) scale(1)'},{opacity:0,transform:'translateX(130px) scale(.25)'}],{delay:ms*.12,duration:ms*.32,easing:'ease-in',fill:'forwards'});
   footer.textContent='Public materials stack · the Xyz monster rises';
  }else if(info.kind==='link'){
   const marker=card.link_marker,lit=LINK_ARROWS.filter(a=>marker&a.bit);
   if(!Number.isInteger(marker)||marker<0||(marker&~495)||lit.length!==(card.level&255))throw new Error('Printed Link arrow data unavailable or inconsistent');
   const grid=this.el('div','b2-link-grid');grid.setAttribute('role','img');grid.setAttribute('aria-label','Printed Link arrows: '+lit.map(a=>a.label).join(', '));
   for(let i=0;i<9;i++){
    if(i===4){grid.append(this.el('span','b2-link-center','LINK'));continue;}
    const arrow=LINK_ARROWS[i<4?i:i-1],cell=this.el('span','b2-link-arrow',arrow.glyph);cell.dataset.bit=String(arrow.bit);cell.dataset.lit=String(!!(marker&arrow.bit));cell.setAttribute('aria-hidden','true');grid.append(cell);
    if(marker&arrow.bit)this.motion(cell,[{opacity:.35},{opacity:1}],{delay:ms*.2,duration:ms*.25,easing:'ease-out',fill:'both'});
   }
   effect.prepend(grid);
   this.motion(grid,[{opacity:0,transform:'scale(.75)'},{opacity:1,transform:'scale(1)'}],{duration:ms*.38,easing:'ease-out',fill:'both'});
   this.motion(row,[{opacity:1,transform:'translateY(0)'},{opacity:0,transform:'translateY(32px) scale(.5)'}],{delay:ms*.12,duration:ms*.28,easing:'ease-in',fill:'forwards'});
   footer.textContent='Printed LINK-'+(card.level&255)+' · only its marked arrows light';
  }else throw new Error('Unsupported summon scene');
 }
}

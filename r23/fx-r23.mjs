// r23-fx (Claude, 21 Oct 2026; TASK e2, Kevy's presentation asks). Original effects drawn for Duel Doctrine Lab:
//  - a full-card glow cut-in for every Spell and Trap activation (the card's own image, a type-coloured rim, a light
//    sweep and sparks on a diagonal band);
//  - unique cues for Field Spells (a wash of light across the playmat from the Field Zone) and Equip Spells (a clamp
//    ring at activation and a tether to the equipped monster);
//  - stronger chain-link emphasis (a numbered ring burst at the source that grows with the link number, a resolve ring);
//  - stronger moves between zones (flares on the source and destination) and to/from the Deck (a swirl on the Deck pile
//    with a TO DECK / FROM DECK / DRAW chip).
// Timing contract: every effect here is an overlay that lives inside the duration the presentation already gave the
// event (never longer), so pace timings (Learning 5.0 / Duel 2.5 / Broadcast 1.5 s), the 500 ms hold and think time are
// unchanged. Nothing here schedules, delays or holds the duel. Effects are best-effort: any error is logged and skipped.
// Cinematics off, reduced motion, skip cut-ins and the Instant preset show none of this.
export const FX23={TYPE_SPELL:2,TYPE_TRAP:4,TYPE_RITUAL:0x80,TYPE_QUICK:0x10000,TYPE_CONTINUOUS:0x20000,TYPE_EQUIP:0x40000,TYPE_FIELD:0x80000,TYPE_COUNTER:0x100000};
export function stKind(card){const t=card?.type||0;if(!(t&(FX23.TYPE_SPELL|FX23.TYPE_TRAP)))return null;
 const sub=t&FX23.TYPE_FIELD?'field':t&FX23.TYPE_EQUIP?'equip':t&FX23.TYPE_QUICK?'quick':t&FX23.TYPE_COUNTER?'counter':t&FX23.TYPE_CONTINUOUS?'continuous':t&FX23.TYPE_RITUAL?'ritual':'normal';
 return {kind:t&FX23.TYPE_SPELL?'spell':'trap',sub}}
const SUB_LABEL={field:'Field Spell',equip:'Equip Spell',quick:'Quick-Play Spell',continuous:'Continuous',counter:'Counter Trap',ritual:'Ritual Spell',normal:''};
// Visual length for an event: a share of its duration, inside a floor and a cap, and never more than the duration.
export function fxSpan(duration,{share=.6,min=650,max=1700}={}){const d=Math.max(0,Number(duration)||0);if(!d)return 0;return Math.min(d,Math.max(Math.min(min,d),Math.min(max,d*share)))}
export function createFx({layer,point,db,view=()=>0,timingScale=1,state=()=>({enabled:true,reduced:false,skipCutins:false,preset:'duel'})}){
 const live=new Set(),flares=new Set();const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const allowed=()=>{const s=state();return !!(s.enabled&&!s.reduced&&!s.skipCutins&&s.preset!=='instant')};
 const doc=()=>layer?.ownerDocument||globalThis.document,vw=()=>doc()?.defaultView?.innerWidth||1280,vh=()=>doc()?.defaultView?.innerHeight||800;
 function add(node,ms,top=false){(top?doc().body:layer).append(node);live.add(node);node.__fx23=setTimeout(()=>{node.remove();live.delete(node)},Math.max(0,ms)*timingScale);return node}
 function make(cls,ms,html=''){const n=doc().createElement('div');n.className=cls;n.style.setProperty('--fx23-ms',Math.round(ms*timingScale)+'ms');if(html)n.innerHTML=html;return n}
 function flare(node,kind,color,ms){if(!node?.classList)return;const cls='fx23-'+kind;node.style.setProperty('--fx23-color',color);node.style.setProperty('--fx23-ms',Math.round(ms*timingScale)+'ms');node.classList.remove(cls);void node.offsetWidth;node.classList.add(cls);flares.add([node,cls]);setTimeout(()=>node.classList.remove(cls),ms*timingScale)}
 function centre(node){const r=node?.getBoundingClientRect?.();return r&&r.width?{x:r.left+r.width/2,y:r.top+r.height/2,w:r.width,h:r.height}:null}
 function clear(){for(const n of live){clearTimeout(n.__fx23);n.remove()}live.clear();swirls.clear();for(const [n,c] of flares)n.classList?.remove(c);flares.clear()}
 const typeColor=k=>k==='trap'?'var(--type-trap, #e11d48)':'var(--type-spell, #10b981)';
 // 1. Spell / Trap cut-in, every activation.
 function cutin(e,card,st,ms){const own=(e.player??e.source?.controller)===view(),art=card?.art;
  const n=make(`fx23-cutin fx23-top ${own?'fx23-own':'fx23-opp'}`,ms,`<div class="fx23-dim"></div><div class="fx23-band"></div><div class="fx23-burst"></div><div class="fx23-card">${art?`<img src="${esc(art)}" alt="">`:`<span class="fx23-noart">${esc(card?.name||'')}</span>`}<i class="fx23-rim"></i><i class="fx23-sweep"></i></div><div class="fx23-tag"><b>${st.kind==='trap'?'TRAP':'SPELL'}</b>${SUB_LABEL[st.sub]?`<span>${esc(SUB_LABEL[st.sub])}</span>`:''}${e.chain?`<em>CHAIN ${e.chain}</em>`:''}</div><div class="fx23-sparks">${Array.from({length:14},(_,i)=>`<i style="--i:${i}"></i>`).join('')}</div>`);
  n.dataset.kind=st.kind;n.dataset.sub=st.sub;n.style.setProperty('--fx23-color',typeColor(st.kind));add(n,ms,true);return n}/* above the event callout, so the card reads first */
 // 2a. Field Spell: light washes across the playmat from the Field Zone.
 function fieldWash(e,ms){const src=point(e.source||{controller:e.player,location:8,sequence:5}),c=centre(src);const n=make('fx23-field-wash',ms,'<i class="fx23-horizon"></i><i class="fx23-grid"></i>');
  n.style.setProperty('--fx23-x',(c?c.x:vw()/2)+'px');n.style.setProperty('--fx23-y',(c?c.y:vh()/2)+'px');n.style.setProperty('--fx23-color',typeColor('spell'));add(n,ms);flare(src,'field-flare',typeColor('spell'),ms);return n}
 // 2b. Equip Spell: a clamp ring closes on the Equip card; the equip event draws a tether to its monster.
 function clamp(node,ms,color){const c=centre(node);if(!c)return null;const n=make('fx23-equip-lock',ms,'<i></i><i></i><i></i><i></i>');Object.assign(n.style,{left:c.x+'px',top:c.y+'px'});n.style.setProperty('--fx23-size',Math.max(60,Math.max(c.w,c.h)*1.35)+'px');n.style.setProperty('--fx23-color',color);add(n,ms);return n}
 function tether(e,ms,color){const a=centre(point(e.from)),b=centre(point(e.to));if(!a||!b)return null;const svgNS='http://www.w3.org/2000/svg',svg=doc().createElementNS(svgNS,'svg');svg.setAttribute('class','fx23-tether');svg.setAttribute('viewBox',`0 0 ${vw()} ${vh()}`);svg.style.setProperty('--fx23-color',color);svg.style.setProperty('--fx23-ms',Math.round(ms*timingScale)+'ms');
  svg.innerHTML=`<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"/><line class="fx23-tether-core" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"/>`;add(svg,ms);clamp(point(e.to),ms,color);return svg}
 // 3. Chain links: a numbered ring burst at the source; more rings and a bigger number for higher links.
 function chainStamp(e,ms,color,mode){const src=point(e.source||{controller:e.player,location:e.effectLocation}),c=centre(src);const link=Math.max(1,e.chain||1),rings=Math.min(5,link);
  const n=make(`fx23-chain-stamp fx23-${mode}`,ms,`${Array.from({length:rings},(_,i)=>`<i style="--i:${i}"></i>`).join('')}<b>${mode==='resolve'?'RESOLVE ':mode==='negate'?'NEGATED ':'CL '}${link}</b>`);
  Object.assign(n.style,{left:(c?c.x:vw()/2)+'px',top:(c?c.y:vh()*.42)+'px'});n.style.setProperty('--fx23-scale',String(1+Math.min(4,link-1)*.18));n.style.setProperty('--fx23-color',mode==='negate'?'var(--palette-negate, #f43f5e)':color);n.dataset.link=String(link);add(n,ms);flare(src,'link-flare',color,ms);return n}
 // 4. Moves: flares on both zones; the Deck pile swirls in or out.
 const swirls=new Map();
 function deckSwirl(node,dir,ms,color,label,key=dir){const c=centre(node);if(!c)return null;const old=swirls.get(key);if(old?.isConnected)return old;const n=make(`fx23-deck-swirl fx23-${dir}`,ms,`<i class="fx23-ring"></i><i class="fx23-ring fx23-ring2"></i>${Array.from({length:8},(_,i)=>`<s style="--i:${i}"></s>`).join('')}<b>${esc(label)}</b>`);
  Object.assign(n.style,{left:c.x+'px',top:c.y+'px'});n.style.setProperty('--fx23-size',Math.max(70,Math.max(c.w,c.h)*1.6)+'px');n.style.setProperty('--fx23-color',color);add(n,ms);swirls.set(key,n);flare(node,'deck-flare',color,ms);return n}
 function moves(batch,ms,color){let deckIn=false,deckOut=false;const deckNodes=new Map();
  for(const m of batch.slice(0,8)){if(!m.from||!m.to)continue;const a=point(m.from),b=point(m.to);if(m.from.location!==1)flare(a,'zone-flare',color,ms);if(m.to.location!==1)flare(b,'zone-flare',color,ms);
   if(m.to.location===1){deckIn=true;deckNodes.set('in:'+m.to.controller,b)}if(m.from.location===1){deckOut=true;deckNodes.set('out:'+m.from.controller,a)}}
  for(const [k,node] of deckNodes){const dir=k.startsWith('in')?'in':'out',draw=dir==='out'&&batch.every(m=>m.from?.location!==1||m.to?.location===2&&!m.code);deckSwirl(node,dir,ms,color,dir==='in'?'TO DECK':draw?'DRAW':'FROM DECK',k)}
  return {deckIn,deckOut}}
 // Every card flight (normal moves, route-only moves, resolution showcases, draws) gets the zone flares and Deck swirl;
 // an equip flight (equip event or resolution showcase) gets the tether and clamp.
 function flight(m,ms,color){try{if(!allowed()||!layer)return null;if(m?.type==='equip'){if(doc().getElementById('event-stage')?.hidden===false)return null;return {tether:tether(m,Math.max(0,ms),typeColor('spell'))}}/* skip while the resolve scene covers the board */if(m?.type!=='move')return null;return moves([m],Math.max(0,ms),color)}catch(err){console.warn('[fx23] flight skipped',err?.message);return null}}
 function event(e,batch,duration,color){
  try{if(!allowed()||!layer||!e)return null;const card=db()[e.code],out={};
   if(e.type==='activate'){const ms=fxSpan(duration,{share:.55,min:700,max:1600}),st=stKind(card);
    out.stamp=chainStamp(e,ms,st?typeColor(st.kind):color,'activate');
    if(st){out.cutin=cutin(e,card,st,ms);if(st.sub==='field')out.field=fieldWash(e,ms);if(st.sub==='equip')out.clamp=clamp(point(e.source||{controller:e.player,location:e.effectLocation}),ms,typeColor('spell'))}
    return out}
   if(e.type==='resolve'||e.type==='negate'){const ms=fxSpan(duration,{share:.35,min:500,max:1100});out.stamp=chainStamp(e,ms,color,e.type==='negate'||e.negated?'negate':'resolve');return out}
   return null}catch(err){console.warn('[fx23] skipped',e?.type,err?.message);return null}}
 return {event,flight,clear,get live(){return live.size}}
}

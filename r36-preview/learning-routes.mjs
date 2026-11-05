// r28 Learning-mode emphasis (Kevy, 22 Oct 09:45: "the learning mode could have some unique animations and cutscenes to
// emphasise what is going on ... longer pauses, more vivid outlines or glows, or bolder line marking where the card is
// going, is it an equip, is it material for xyz? Synchro? Link?").
// Learning preset only. Every card that moves gets a bold route line from where it was to where it goes, with a label
// saying WHY it moved (Fusion / Synchro / Xyz / Link material, equip, cost, banished, destroyed, tribute, to hand ...).
// The cards at both ends get a vivid outline; an activating card gets a pulsing outline; targeted cards get a crosshair.
// Original design (thick black-outlined lines, slanted label panels); no Konami UI.
import {moveMechanic} from './event-data.mjs';
export const ROUTE_KINDS={
 fusion:['FUSION MATERIAL','#c084fc'],synchro:['SYNCHRO MATERIAL','#f8fafc'],xyz:['XYZ MATERIAL','#fbbf24'],link:['LINK MATERIAL','#60a5fa'],
 ritual:['RITUAL MATERIAL','#22d3ee'],material:['SUMMON MATERIAL','#e879f9'],detach:['XYZ MATERIAL DETACHED','#f59e0b'],
 equip:['EQUIP','#34d399'],banish:['BANISHED','#a78bfa'],destroy:['DESTROYED','#f43f5e'],tribute:['TRIBUTE','#facc15'],
 discard:['DISCARD','#fb923c'],grave:['SENT TO GRAVEYARD','#94a3b8'],return:['BACK TO DECK','#38bdf8'],search:['ADD TO HAND','#4ade80'],
 retrieve:['RETURN TO HAND','#2dd4bf'],set:['SET','#cbd5e1'],move:['TO FIELD','#fde047']
};
// Minimum scene length in Learning so a labelled move can be read (Kevy: "longer pauses"). Not the 500 ms hold, not AI
// think time; Duel / Broadcast / Instant are unchanged.
export const LEARN_ROUTE_MS={move:2000,perCard:220,cap:3200,equip:2200,target:1500};
const ZONE={1:'DECK',2:'HAND',4:'FIELD',8:'FIELD',16:'GRAVEYARD',32:'BANISHED',64:'EXTRA DECK',128:'XYZ MATERIAL',256:'FIELD'};
export function routeKind(e){
 if(e?.type==='equip')return 'equip';if(e?.type!=='move'||!e.from||!e.to)return null;
 const k=moveMechanic(e);if(k==='search'&&!e.code)return null;/* a hidden draw / search: nothing to teach */
 if(k==='return'&&e.to.location===64)return 'return';return ROUTE_KINDS[k]?k:null}
export function routeLabel(e){const k=routeKind(e);if(!k)return null;let [label,color]=ROUTE_KINDS[k];
 if(k==='return'&&e.to?.location===64)label='TO EXTRA DECK';
 if(k==='move')label=e.to?.location===4?(e.from?.location===64?'SUMMONED FROM EXTRA DECK':e.from?.location===16?'REVIVED FROM GRAVEYARD':e.from?.location===32?'RETURNED FROM BANISHMENT':'TO MONSTER ZONE'):e.to?.location===8?(e.to?.sequence===5?'TO FIELD ZONE':'TO SPELL & TRAP ZONE'):label;
 const cost=e.type==='move'&&((e.reason||0)&0x80)&&e.from?.location!==1;return {kind:k,label:cost?'COST · '+label:label,color,cost:!!cost,route:(ZONE[e.from?.location]||'FIELD')+' → '+(e.type==='equip'?'MONSTER':ZONE[e.to?.location]||'FIELD')}}
// Extra scene time a Learning batch needs so its labelled routes can be read (0 when none).
export function learningMinimum(batch){const events=batch?.events||[],first=events[0];if(!first)return 0;
 if(first.type==='equip')return LEARN_ROUTE_MS.equip;if(first.type==='target')return LEARN_ROUTE_MS.target;
 if(first.type==='move'&&events.every(m=>m.type==='move')){const n=events.filter(routeKind).length;return n?Math.min(LEARN_ROUTE_MS.cap,LEARN_ROUTE_MS.move+(n-1)*LEARN_ROUTE_MS.perCard):0}
 return 0}
export const MAX_ROUTES=6;
export function createLearningRoutes({layer,point,db,on=()=>false,timingScale=1}){
 const live=new Set(),glows=new Set(),labels=new Map();const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const doc=()=>layer?.ownerDocument||globalThis.document,win=()=>doc()?.defaultView||globalThis.window,vw=()=>win()?.innerWidth||1280,vh=()=>win()?.innerHeight||800;
 const centre=n=>{const r=n?.getBoundingClientRect?.();return r&&r.width?{x:r.left+r.width/2,y:r.top+r.height/2,w:r.width,h:r.height}:null};
 function keep(node,ms){layer.append(node);live.add(node);/* r33 (tablet smoothness): at most MAX_ROUTES route lines on screen; a big batch drops its oldest lines first */if(node.tagName?.toLowerCase()==='svg'){const svgs=[...live].filter(x=>x.tagName?.toLowerCase()==='svg');for(const x of svgs.slice(0,Math.max(0,svgs.length-MAX_ROUTES))){clearTimeout(x.__lr);x.remove();live.delete(x)}}node.__lr=setTimeout(()=>{node.remove();live.delete(node)},Math.max(0,ms)*timingScale);return node}
 function glow(node,color,cls='lr-glow',ms=2600){if(!node?.classList)return;node.style.setProperty('--lr-color',color);const had=node.classList.contains(cls);node.classList.add(cls);if(had)for(const a of node.getAnimations?.()||[])if(/^lr-/.test(a.animationName||'')){a.cancel();a.play()}/* r33: restart without forcing a layout (was offsetWidth) */const t=setTimeout(()=>{node.classList.remove(cls);glows.delete(rec)},ms*timingScale),rec=[node,cls,t];glows.add(rec)}
 function tag(x,y,info,name,count=1){const n=doc().createElement('div');n.className='lr-tag'+(info.cost?' lr-cost':'');n.style.setProperty('--lr-color',info.color);
  n.innerHTML=`<b>${esc(info.label)}${count>1?` <em>×${count}</em>`:''}</b><span>${name?esc(name)+' · ':''}${esc(info.route)}</span>`;
  Object.assign(n.style,{left:Math.max(90,Math.min(vw()-90,x))+'px',top:Math.max(40,Math.min(vh()-40,y))+'px'});return n}
 // A move or equip: the route line, both outlines and the label.
 function flight(e,at=0,duration=400){try{if(!on()||!layer)return null;const info=routeLabel(e);if(!info)return null;
   const a=centre(point(e.from)),b=centre(point(e.to));if(!a||!b)return null;const life=Math.max(at+duration,LEARN_ROUTE_MS.move)+900;
   const svgNS='http://www.w3.org/2000/svg',svg=doc().createElementNS(svgNS,'svg');svg.setAttribute('class','lr-route lr-'+info.kind+(info.cost?' lr-cost':''));svg.setAttribute('viewBox',`0 0 ${vw()} ${vh()}`);svg.style.setProperty('--lr-color',info.color);svg.style.setProperty('--lr-delay',Math.round(at*timingScale)+'ms');
   const dist=Math.hypot(b.x-a.x,b.y-a.y),bend=Math.min(120,dist*.28),mx=(a.x+b.x)/2,my=(a.y+b.y)/2,nx=-(b.y-a.y)/(dist||1),ny=(b.x-a.x)/(dist||1),cx=mx+nx*bend,cy=my+ny*bend;
   const d=`M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`,ang=Math.atan2(b.y-cy,b.x-cx),s=26,r=Math.max(28,Math.min(b.w,b.h)*.5);
   const tipX=b.x-Math.cos(ang)*r*.55,tipY=b.y-Math.sin(ang)*r*.55,p1=`${tipX-s*Math.cos(ang-.45)},${tipY-s*Math.sin(ang-.45)}`,p2=`${tipX-s*Math.cos(ang+.45)},${tipY-s*Math.sin(ang+.45)}`;
   svg.innerHTML=`<path class="lr-under" d="${d}" pathLength="100"/><path class="lr-line" d="${d}" pathLength="100"/><path class="lr-flow" d="${d}" pathLength="100"/><circle class="lr-from" cx="${a.x}" cy="${a.y}" r="${Math.max(22,Math.min(a.w,a.h)*.42)}"/><circle class="lr-to" cx="${b.x}" cy="${b.y}" r="${r}"/><polygon class="lr-head" points="${tipX},${tipY} ${p1} ${p2}"/>`;
   keep(svg,life);glow(point(e.from),info.color,'lr-glow',life);glow(point(e.to),info.color,'lr-glow',life);
   // One label per kind and destination in a batch; repeats count up (e.g. "FUSION MATERIAL x3").
   const key=info.label+'>'+(e.to?.controller)+':'+(e.to?.location),old=labels.get(key);
   if(old?.node?.isConnected&&performance.now()-old.t<1500){old.count++;old.node.querySelector('b').innerHTML=`${esc(info.label)} <em>×${old.count}</em>`;const span=old.node.querySelector('span');if(span)span.textContent=old.count+' cards · '+info.route;return {svg}}
   const name=e.code&&!(e.to?.position&8)?db()?.[e.code]?.name:'';const t=0.5,qx=(1-t)*(1-t)*a.x+2*(1-t)*t*cx+t*t*b.x,qy=(1-t)*(1-t)*a.y+2*(1-t)*t*cy+t*t*b.y;
   const n=tag(qx,qy,info,e.type==='equip'?(db()?.[e.code]?.name||''):name);n.style.setProperty('--lr-delay',Math.round(at*timingScale)+'ms');keep(n,life);labels.set(key,{node:n,count:1,t:performance.now()});return {svg,tag:n}
  }catch(err){console.warn('[learning-routes] skipped',err?.message);return null}}
 // Activations and targets: vivid outlines in Learning.
 function event(e,batch,duration){try{if(!on())return;
   if(e.type==='activate'){const n=point(e.source||{controller:e.player,location:e.effectLocation});glow(n,'#fde047','lr-activate',Math.max(1800,duration))}
   if(e.type==='target')for(const c of e.cards||[]){const n=point(c),m=centre(n);glow(n,'#f43f5e','lr-target',Math.max(1500,duration));if(m){const x=doc().createElement('div');x.className='lr-crosshair';Object.assign(x.style,{left:m.x+'px',top:m.y+'px'});x.style.setProperty('--lr-size',Math.max(64,Math.max(m.w,m.h)*1.25)+'px');x.innerHTML='<i></i><i></i><b>TARGETED</b>';keep(x,Math.max(1500,duration))}}
  }catch(err){console.warn('[learning-routes] skipped',err?.message)}}
 function clear(){for(const n of [...live]){clearTimeout(n.__lr);n.remove();live.delete(n)}for(const [n,c,t] of glows){clearTimeout(t);n.classList?.remove(c)}glows.clear();labels.clear()}
 return {flight,event,clear,live}}

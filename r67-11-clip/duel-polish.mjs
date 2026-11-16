// Authored by ChatGPT — pending Seto/team fact check.
// Decorative presentation only. No engine input, delays, busy state, replies or numeric LP writes.
export const PHASE_NAMES={1:'Draw Phase',2:'Standby Phase',4:'Main Phase 1',8:'Battle Phase',16:'Battle Phase',32:'Battle Phase',64:'Battle Phase',128:'Battle Phase',256:'Main Phase 2',512:'End Phase'};
export function polishPolicy(o={},systemReduced=false){return {enabled:o.cinematics!==false,instant:o.preset==='instant',reduced:!!o.motion||systemReduced,scale:Math.max(.3,Math.min(2,Number(o.fxPace)||1))};}
export function chainLabel(e){const n=Number(e.chain??e.count);const cl=Number.isInteger(n)&&n>0?`Chain ${n}`:'Chain';return e.type==='activate'?`${cl} · Building`:['resolve','chainLock'].includes(e.type)?`${cl} · Resolving`:e.type==='negate'?`${cl} · Negated`:e.type==='chainEnd'?'Chain complete':null;}
export function createDuelPolish({options=()=>({}),doc=document,win=window}={}){
 const media=win.matchMedia?.('(prefers-reduced-motion: reduce)');let bar,phase,pill,view=0,key=null,ready=false,lastPhase='',disposed=false,generation=0;
 if(!doc.getElementById('ddl-polish-style')){const link=doc.createElement('link');link.id='ddl-polish-style';link.rel='stylesheet';link.href=new URL('./css/duel-polish.css',import.meta.url).href;doc.head?.append(link);}
 const animations=new Set(),rings=new Map(),nodes=new Set();let clearPill;
 const policy=()=>polishPolicy(options(),!!media?.matches);
 function cancel(){generation++;for(const a of animations)a.cancel();animations.clear();for(const n of nodes)n.remove();nodes.clear();rings.clear();clearTimeout(clearPill);}
 function mount(){if(bar?.isConnected)return true;const lane=doc.querySelector('.arena-surface .midline');if(!lane)return false;
  bar=doc.createElement('div');bar.className='ddl-polish-bar';bar.setAttribute('aria-hidden','true');
  phase=doc.createElement('div');phase.className='ddl-phase-banner';phase.textContent='Duel ready';pill=doc.createElement('div');pill.className='ddl-chain-pill';pill.textContent='Chain details in panel';bar.append(phase,pill);lane.append(bar);doc.body.classList.toggle('ddl-polish-enabled',policy().enabled);return true;}
 function animate(node,frames,ms){const p=policy();if(!node||!p.enabled||p.instant||p.reduced||typeof node.animate!=='function')return null;
  // One animation per decorative node: rapid events replace instead of queueing.
  for(const a of node.getAnimations?.()||[])a.cancel();
  const a=node.animate(frames,{duration:Math.round(ms*p.scale),easing:'cubic-bezier(.2,.8,.2,1)',fill:'none'});animations.add(a);a.finished.catch(()=>{}).finally(()=>animations.delete(a));return a;}
 function clearRings(){for(const n of nodes)if(n.classList.contains('ddl-chain-halo')){n.remove();nodes.delete(n)}rings.clear();}
 function ring(e){const p=policy();if(!p.enabled||p.instant||!Number.isInteger(e.chain)||e.chain<1)return;
  const s=e.source;if(!s||![0,1].includes(s.controller)||![4,8].includes(s.location)||!Number.isInteger(s.sequence)||!Number.isInteger(e.code)||e.code<1)return;
  const host=doc.querySelector(`[data-slot="${s.controller}:${s.location}:${s.sequence}"][data-card="${e.code}"]`);
  if(!host||host.dataset.cardType==='hidden')return; // Never guess a private card, a name or another copy's position.
  const prior=rings.get(e.chain);if(prior){prior.remove();nodes.delete(prior)}if(rings.size>=8){const [id,node]=rings.entries().next().value;node.remove();nodes.delete(node);rings.delete(id)}
  const halo=doc.createElement('span');halo.className='ddl-chain-halo';halo.dataset.slot=[s.controller,s.location,s.sequence].join(':');halo.setAttribute('aria-hidden','true');
  const number=doc.createElement('i');number.textContent=String(e.chain);halo.append(number);host.append(halo);rings.set(e.chain,halo);nodes.add(halo);
  animate(halo,[{opacity:.35,transform:'scale(.94)'},{opacity:1,transform:'scale(1.045)',offset:.3},{opacity:.5,transform:'scale(1)',offset:.55},{opacity:1,transform:'scale(1.045)',offset:.8},{opacity:.8,transform:'scale(1)'}],760);
 }
 function onEvent({detail:e}){if(!ready||disposed||!e||!mount())return;const p=policy();if(!p.enabled)return;
  if(e.type==='phase'){const label=PHASE_NAMES[e.phase];{const st=doc.getElementById?.('event-stage');if(st&&label)st.dataset.ddlPhase=label==='Battle Phase'?'battle':'calm'}/* r67.10 integration (Claude): styles the existing E3 announcement */if(label&&label!==lastPhase){lastPhase=label;phase.textContent=label;phase.dataset.battle=String(label==='Battle Phase');animate(phase,[{opacity:.2,transform:'translateY(4px) scale(.98)'},{opacity:1,transform:'translateY(0) scale(1)'}],label==='Battle Phase'?340:180)}}
  const label=chainLabel(e);if(label){clearTimeout(clearPill);pill.textContent=label;pill.dataset.stage=e.type;animate(pill,[{opacity:.35,transform:'translateY(2px)'},{opacity:1,transform:'translateY(0)'}],160)}
  if(e.type==='activate'){const gen=generation;queueMicrotask(()=>{if(ready&&!disposed&&gen===generation)ring(e)})}
  if(e.type==='negate'){const n=rings.get(e.chain);if(n)n.classList.add('is-negated')}
  if(e.type==='chainEnd'){generation++;clearRings();if(!p.instant)clearPill=setTimeout(()=>{pill.textContent='No active chain';delete pill.dataset.stage},Math.round(900*p.scale));else {pill.textContent='No active chain';delete pill.dataset.stage}}
  if(e.type==='move'){generation++;const hit=[e.from,e.to].filter(Boolean).map(s=>[s.controller,s.location,s.sequence].join(':'));for(const [id,n]of rings)if(hit.includes(n.dataset.slot)){n.remove();nodes.delete(n);rings.delete(id)}}
  if(e.type==='turn'||e.type==='win'){generation++;clearRings();clearTimeout(clearPill);pill.textContent='No active chain';delete pill.dataset.stage;if(e.type==='win')phase.textContent='Duel complete';}
 }
 function onLp({detail:d}){if(!ready||disposed||d?.type!=='start')return;const p=policy(),e=d.event;if(!p.enabled||p.instant||!e||![0,1].includes(e.player))return;
  const host=doc.querySelector(e.player===view?'#my-lp':'#opp-lp');if(!host)return;
  const frame=doc.createElement('span');frame.className='ddl-lp-frame';frame.dataset.kind=e.after>e.before?'gain':e.type==='cost'?'cost':'loss';frame.setAttribute('aria-hidden','true');host.append(frame);nodes.add(frame);
  const a=animate(frame,[{opacity:0,transform:'scale(.98)'},{opacity:.9,transform:'scale(1)',offset:.15},{opacity:0,transform:'scale(1.055)'}],640);
  if(a)a.finished.catch(()=>{}).finally(()=>{frame.remove();nodes.delete(frame)});else {frame.remove();nodes.delete(frame)}
  // Existing createLpFx owns count-up/count-down, timing, sound and authoritative final values.
 }
 function reset(){ready=false;key=null;lastPhase='';cancel();if(phase){phase.textContent='Duel ready';delete phase.dataset.battle}if(pill){pill.textContent='Chain details in panel';delete pill.dataset.stage}}
 function configure(){cancel();const p=policy();if(bar)bar.hidden=!p.enabled;doc.body.classList.toggle('ddl-polish-enabled',p.enabled&&!!bar?.isConnected);}
 function accept(msg){if(disposed||!msg?.state)return;const next=[msg.human?.epoch??0,msg.match?.seed??'',msg.view,msg.mode].join(':');if(key!==next){reset();key=next}view=msg.view??0;ready=true;mount();if(bar)bar.hidden=!policy().enabled;}
 function clearTransient(){cancel();if(pill){pill.textContent='Chain details in panel';delete pill.dataset.stage}}
 function visibility(){if(doc.hidden)clearTransient()}
 function skip(e){if(e.type==='keydown'?e.key==='Escape':e.target?.closest?.('#skip-fx,#skip-scene,#skip-victory,#controls-skip'))clearTransient()}
 doc.addEventListener('duel-presentation-event',onEvent);doc.addEventListener('lp-fx-tick',onLp);doc.addEventListener('visibilitychange',visibility);doc.addEventListener('click',skip);doc.addEventListener('keydown',skip);media?.addEventListener?.('change',configure);
 return {accept,configure,reset,clearTransient,destroy(){reset();disposed=true;bar?.remove();doc.body.classList.remove('ddl-polish-enabled');doc.removeEventListener('duel-presentation-event',onEvent);doc.removeEventListener('lp-fx-tick',onLp);doc.removeEventListener('visibilitychange',visibility);doc.removeEventListener('click',skip);doc.removeEventListener('keydown',skip);media?.removeEventListener?.('change',configure)}};
}

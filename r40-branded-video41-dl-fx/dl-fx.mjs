// r40 (Grok Bot as builder, 10 Nov 2026; Kevy 01:20 AEDT: "Yes please" to the Duel Links-inspired visuals and sounds as a new
// separate TEST version on top of r39). ORIGINAL presentation accents inspired by the team's 8 Nov footage study (Akiza,
// Priority 1/2) and bounded by Alexis's full-TCG safeguards. Nothing here is copied: no Konami / Duel Links art, audio, logos,
// characters, fonts or layouts. Every visual is drawn with CSS; every sound is synthesised live with Web Audio through the
// app's own Soundscape (sfx bus, so mute / master / SFX volume apply).
//
// What it adds (all local to the board, never full-screen, never over a pending choice):
//  - SUMMON PILLAR: a short column of light over the Monster Zone the engine reports a successful summon into, with a
//    NORMAL / SPECIAL / FLIP SUMMON tag (engine 'summon' event only, i.e. after the summon succeeded);
//  - ZONE TAGS: a text chip at the destination of each public move, named from the ENGINE's reason bits only
//    (COST, MATERIAL, DESTROYED, DISCARDED, TRIBUTED, BANISHED, FACE-DOWN BANISH, SET, TO HAND, TO DECK ...). No card names, so a
//    tag can never reveal a hidden card; a cost send and an effect send read differently (Alexis check 2);
//  - CHAIN TAGS: ACTIVATE · CL n at the activating card, RESOLVING · CL n when the engine starts resolving that link, and
//    NEGATED · CL n when the engine negates it. "Resolving" is never a claim of success (Alexis checks 2 and 4);
//  - ATTACK SLASH: a streak from the attacker toward its target (or the defending LP for a direct attack), tagged
//    ATTACK DECLARED. It says nothing about damage; damage is shown only when the engine reports it (Akiza source 2 05:17);
//  - DAMAGE BURST: a large burst number by the LP display for engine-reported battle / effect damage, LP costs and gains;
//  - TURN SWEEP: a thin margin strip "TURN n · <deck>" at the top edge of the table;
//  - COIN / DICE CHIP: when the full coin / dice cutscene is not shown (cutscenes or cut-ins off) a small corner chip shows
//    the engine's result with the dedicated coin / dice sounds (coin-cutscene.mjs coinSound). The result is never made here.
//  - SOUND STUDIO: Coin toss, Dice roll and the four new accents can be auditioned from the existing Sound Studio.
//
// Timing contract (no stall, no rules effect): this module is fire-and-forget. The presentation dispatches
// 'ddl-dlfx-batch' at the start of each batch it already plays; nothing here returns a value to it, holds it, extends a
// batch, touches the worker, the engine, the AI, random numbers, prompts or response windows. Each accent removes itself
// within min(batch duration, DLFX_CAP[pace]); a new batch (including Skip FX) clears the previous accents and their sounds.
// Off at Instant pace or when the batch has no duration (AI-vs-AI Instant games see nothing). Reduced motion: still tags only.
// Toggle: "Duel Links-style field FX" in FX settings and Duel controls (localStorage 'ddl-dlfx'); off removes decoration only.
import {coinSound,tossSoundSeed,tossLine,tossWon} from './coin-cutscene.mjs';
export const DLFX_KEY='ddl-dlfx';
export const DLFX_CAP=Object.freeze({learning:1500,duel:1100,broadcast:750});
export const DLFX_MAX_TAGS=6;
export const DLFX_CHIP_MS=1900;
const R={DESTROY:0x1,RELEASE:0x2,MATERIAL:0x8,BATTLE:0x20,EFFECT:0x40,COST:0x80,DISCARD:0x4000};
const L={DECK:1,HAND:2,MZONE:4,SZONE:8,GRAVE:16,REMOVED:32,EXTRA:64};
const FACEDOWN=0xa;
export function dlfxEnabled(store=globalThis.localStorage){try{return store?.getItem(DLFX_KEY)!=='off'}catch{return true}}
export function dlfxSpan(preset,duration){if(preset==='instant'||!(Number(duration)>0))return 0;return Math.min(Number(duration),DLFX_CAP[preset]??DLFX_CAP.duel)}
// The text for a public move, from the engine's reason bits and zones only. Null = no tag (summons have their own pillar).
export function moveTag(e){
 if(e?.type!=='move'||!e.from||!e.to)return null;const to=e.to.location,from=e.from.location,r=Number(e.reason)||0,down=!!((Number(e.to.position)||0)&FACEDOWN);
 if(!to||to===from&&to!==L.MZONE&&to!==L.SZONE)return null;
 if(to===L.REMOVED)return down?'BANISHED · FACE-DOWN':r&R.COST?'BANISHED · COST':'BANISHED';
 if(to===L.GRAVE){if(r&R.COST)return 'COST → GY';if(r&R.MATERIAL)return 'MATERIAL → GY';if(r&R.RELEASE)return 'TRIBUTED';if(r&R.DESTROY)return r&R.BATTLE?'DESTROYED BY BATTLE':'DESTROYED';if(r&R.DISCARD)return 'DISCARDED';return 'SENT TO GY'}
 if(to===L.HAND){if(from===L.DECK)return 'ADDED FROM DECK';if(from===L.GRAVE)return 'GY → HAND';if(from===L.REMOVED)return 'BANISHED → HAND';return 'RETURNED TO HAND'}
 if(to===L.DECK)return from===L.HAND?'HAND → DECK':'TO DECK';
 if(to===L.EXTRA)return 'TO EXTRA DECK';
 if(to===L.SZONE&&down&&from!==L.SZONE)return 'SET';
 if(to===L.MZONE&&down&&from!==L.MZONE)return 'SET';
 return null}
export function summonTag(e){return e?.kind==='flip'?'FLIP SUMMON':e?.special||e?.kind==='special'?'SPECIAL SUMMON':'NORMAL SUMMON'}
export function chainTag(e){const n=Number(e?.chain)||0,cl=n?' · CL '+n:'';if(e?.type==='activate')return 'ACTIVATE'+cl;if(e?.type==='negate')return 'NEGATED'+cl;if(e?.type==='resolve'&&!e.silent)return e.negated?'NEGATED'+cl:'RESOLVING'+cl;return null}
export function lpTag(e){const a=Math.abs(Number(e?.amount??(e?.after-e?.before))||0);if(!a)return null;
 if(e.type==='recover'||e.type==='lpUpdate'&&e.after>e.before)return {sign:'+',amount:a,caption:'LP GAINED',kind:'gain'};
 if(e.type==='cost')return {sign:'−',amount:a,caption:'LP COST',kind:'cost'};
 if(e.type==='damage')return {sign:'−',amount:a,caption:e.combat||e.source==='battle'?'BATTLE DAMAGE':'EFFECT DAMAGE',kind:'damage'};
 if(e.type==='lpUpdate')return {sign:'−',amount:a,caption:'LP CHANGED',kind:'cost'};return null}
// Pure plan for a batch: which accents would play. Used by the runtime and by tests (no DOM).
export function planBatch(events,{preset='duel',duration=0,enabled=true,coinShown=false}={}){
 const list=Array.isArray(events)?events.filter(Boolean):[];const first=list[0];
 if(!enabled||preset==='instant'||!first)return [];
 if(first.type==='coinToss')return coinShown?[]:[{kind:'coin',event:first}];
 const span=dlfxSpan(preset,duration);if(!span)return [];const out=[];let tags=0;
 for(const e of list){
  if(e.type==='summon'&&!e.b1Material)out.push({kind:'pillar',event:e,text:summonTag(e)});
  else if(e.type==='move'&&!e.b1Material){const t=moveTag(e);if(t&&tags<DLFX_MAX_TAGS){tags++;out.push({kind:'tag',event:e,text:t})}}
  else if(['activate','resolve','negate'].includes(e.type)){const t=chainTag(e);if(t)out.push({kind:'chain',event:e,text:t})}
  else if(e.type==='attack')out.push({kind:'slash',event:e,text:e.to?'ATTACK DECLARED':'DIRECT ATTACK DECLARED'});
  else if(['damage','cost','recover','lpUpdate'].includes(e.type)){const t=lpTag(e);if(t)out.push({event:e,...t,lpKind:t.kind,kind:'burst'})}
  else if(e.type==='turn')out.push({kind:'turn',event:e})}
 return out.map(p=>({...p,span}))}

const live=new Set();let out=null,outSound=null,studioObserver=null;
function audioOut(sound){try{const c=sound?.context;if(!c||c.state!=='running'||!sound.route)return undefined;if(!out||outSound!==sound){out=c.createGain();outSound=sound;sound.route(out,'sfx')}return out}catch{return undefined}}
function silence(){const o=out;out=null;if(!o)return;try{o.gain.cancelScheduledValues?.(0);o.gain.value=0}catch{}try{o.disconnect()}catch{}}
export function clearDlfx(){silence();for(const n of live){try{clearTimeout(n.__dlfx);n.remove()}catch{}}live.clear()}
const audible=s=>{try{return !!s?.tone&&s.enabled!==false&&s.volume!==0&&s.levels?.sfx!==0&&s.context?.state==='running'}catch{return false}};
// Original accent sounds (quiet layers under the app's existing cues). dest = this module's own gain node, so a new batch cuts them.
export function dlfxSound(sound,kind,{dest,seat}={}){try{if(!audible(sound))return false;const prior=sound.seat;if(seat===0||seat===1)sound.seat=seat;
 const T=(f,d,o={})=>sound.tone(f,d,{...o,destination:dest}),N=(d,o={})=>sound.noise(d,{...o,destination:dest});
 try{
  if(kind==='pillar'){N(.42,{gain:.07,frequency:600,end:5200,attack:.2});for(const [i,f] of [659,988,1319,1760].entries())T(f,.28,{at:.05+i*.055,type:'triangle',gain:.045,attack:.004});T(110,.4,{end:220,type:'sine',gain:.08,attack:.02})}
  else if(kind==='slash'){N(.18,{gain:.12,frequency:1200,end:7800,attack:.01});N(.12,{gain:.07,frequency:7000,end:2200,at:.12,attack:.004});T(1480,.09,{at:.13,end:740,type:'sawtooth',gain:.025,lowpass:3200,attack:.002})}
  else if(kind==='burst'){T(70,.32,{end:34,type:'sine',gain:.16,attack:.003});N(.09,{gain:.12,frequency:3200,end:400,attack:.001});T(330,.16,{end:165,type:'square',gain:.03,lowpass:1400,attack:.002})}
  else if(kind==='gain'){for(const [i,f] of [784,1047,1319].entries())T(f,.22,{at:i*.06,type:'sine',gain:.05,attack:.004})}
  else if(kind==='turn'){T(523,.5,{type:'triangle',gain:.05,attack:.01});T(784,.5,{at:.09,type:'triangle',gain:.05,attack:.01});T(1047,.6,{at:.18,type:'triangle',gain:.045,attack:.01});N(.3,{gain:.04,frequency:2000,end:6000,attack:.12})}
  else if(kind==='tag'){T(1760,.07,{type:'sine',gain:.03,attack:.002});T(2637,.09,{at:.035,type:'sine',gain:.02,attack:.002})}
  else if(kind==='chain'){T(1175,.12,{type:'triangle',gain:.03,attack:.003});T(1568,.14,{at:.05,type:'triangle',gain:.025,attack:.003})}
  else return false;
 }finally{sound.seat=prior}return true}catch{return false}}
export function playCoinAudition(sound,kind='coin',{face='heads',ms=3000}={}){try{if(!audible(sound))return false;const opts={ms,face,count:kind==='dice'?2:1,seed:kind==='dice'?77:face==='heads'?11:12};
 if(kind==='dice'){coinSound(sound,'dice','throw',opts);setTimeout(()=>coinSound(sound,'dice','land',opts),ms*.53);setTimeout(()=>coinSound(sound,'dice','reveal',opts),ms*.62)}
 else{coinSound(sound,'coin','flick',opts);setTimeout(()=>coinSound(sound,'coin','spin',opts),ms*.08);setTimeout(()=>coinSound(sound,'coin','land',opts),ms*.56);setTimeout(()=>coinSound(sound,'coin','reveal',{...opts,won:null}),ms*.62)}
 return true}catch{return false}}

function reducedNow(doc){try{return doc.body.classList.contains('quiet-motion')||!!doc.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)').matches}catch{return false}}
function box(node){try{const r=node?.getBoundingClientRect?.();return r&&r.width&&r.height?r:null}catch{return null}}
function mount(doc,cls,ms,{x,y,html='',text}={}){const n=doc.createElement('div');n.className='dlfx '+cls;n.setAttribute('aria-hidden','true');n.style.setProperty('--dlfx-ms',Math.max(1,Math.round(ms))+'ms');if(x!==undefined){n.style.left=Math.round(x)+'px';n.style.top=Math.round(y)+'px'}if(html)n.innerHTML=html;if(text!==undefined)n.textContent=text;doc.body.append(n);live.add(n);n.__dlfx=setTimeout(()=>{n.remove();live.delete(n)},ms+40);return n}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function runBatch(detail,doc=globalThis.document){
 try{clearDlfx();if(!doc?.body)return [];const enabled=dlfxEnabled();doc.body.dataset.dlfx=enabled?'on':'off';
  const plan=planBatch(detail?.events,{preset:detail?.preset,duration:detail?.duration,enabled:enabled&&detail?.enabled!==false,coinShown:!!detail?.coinShown});if(!plan.length)return plan;
  const point=typeof detail.point==='function'?detail.point:()=>null,sound=detail.sound||globalThis.ddlSound,reduced=reducedNow(doc),dest=audioOut(sound);
  if(reduced)doc.body.classList.add('dlfx-still');else doc.body.classList.remove('dlfx-still');
  const heard=new Set(),hear=(k,seat)=>{if(heard.has(k))return;heard.add(k);dlfxSound(sound,k,{dest,seat})};
  let stagger=0;
  for(const p of plan){const e=p.event,ms=p.span;
   if(p.kind==='coin'){const t=e.toss;if(!t)continue;const coin=t.kind==='coin',won=tossWon(t),name=detail.db?.()?.[t.code]?.name||'';
    const face=coin?(t.results[0]?'heads':'tails'):null,res=coin?t.results.map(v=>v?'HEADS':'TAILS').join(' · '):t.results.join(' + ')+(t.results.length>1?' = '+t.results.reduce((a,b)=>a+b,0):'');
    const n=mount(doc,'dlfx-coinchip dlfx-'+t.kind,DLFX_CHIP_MS,{html:`<i class="dlfx-token">${coin?'':'<b></b><b></b><b></b>'}</i><span><small>${coin?'COIN TOSS':'DICE ROLL'}${name?' · '+esc(name):''}</small><strong>${esc(res)}</strong>${won===null?'':`<em>${won?'RIGHT CALL':'WRONG CALL'}</em>`}</span>`});n.setAttribute('role','status');n.setAttribute('aria-label',tossLine(t,name));
    if(!reduced)n.classList.add('dlfx-anim');
    const opts={ms:1500,face,count:t.results.length,seed:tossSoundSeed(t),still:reduced,dest},k=coin?'coin':'dice';
    try{if(coin){coinSound(sound,'coin','flick',opts);if(!reduced)setTimeout(()=>{if(n.isConnected)coinSound(sound,'coin','spin',opts)},120);setTimeout(()=>{if(n.isConnected)coinSound(sound,'coin','land',opts)},reduced?150:840);setTimeout(()=>{if(n.isConnected)coinSound(sound,'coin','reveal',{...opts,won})},reduced?250:930)}
     else{coinSound(sound,'dice','throw',opts);setTimeout(()=>{if(n.isConnected)coinSound(sound,'dice','land',opts)},reduced?150:800);setTimeout(()=>{if(n.isConnected)coinSound(sound,'dice','reveal',opts)},reduced?250:930)}}catch{}
    void k;continue}
   if(p.kind==='pillar'){const r=box(point({controller:e.player,location:L.MZONE,sequence:e.sequence}));if(!r)continue;
    const n=mount(doc,'dlfx-pillar'+(e.special?' dlfx-special':''),ms,{x:r.left+r.width/2,y:r.top+r.height,html:`<i class="dlfx-beam"></i><i class="dlfx-ring"></i><i class="dlfx-ring dlfx-ring2"></i>${Array.from({length:6},(_,i)=>`<i class="dlfx-mote" style="--i:${i}"></i>`).join('')}<b class="dlfx-tag">${esc(p.text)}</b>`});
    n.style.setProperty('--dlfx-w',r.width+'px');n.style.setProperty('--dlfx-h',Math.max(r.height*2.2,120)+'px');hear('pillar',e.player);continue}
   if(p.kind==='tag'){const anchor=point(e.to)||point(e.from),r=box(anchor);if(!r)continue;const delay=Math.min(stagger++,5)*70;
    const n=mount(doc,'dlfx-zonetag',Math.max(200,ms-delay),{x:r.left+r.width/2,y:r.top+r.height*.5,text:p.text});n.style.setProperty('--dlfx-delay',delay+'ms');n.dataset.kind=/COST/.test(p.text)?'cost':/MATERIAL|TRIBUTED/.test(p.text)?'material':/DESTROYED/.test(p.text)?'destroy':/BANISHED/.test(p.text)?'banish':'move';hear('tag',e.to?.controller);continue}
   if(p.kind==='chain'){const src=e.source||(e.player!=null&&e.effectLocation?{controller:e.player,location:e.effectLocation}:null),r=box(point(src));if(!r)continue;
    const n=mount(doc,'dlfx-chain',ms,{x:r.left+r.width/2,y:r.top+r.height/2,html:`<i class="dlfx-hex"></i><b class="dlfx-tag">${esc(p.text)}</b>`});n.dataset.kind=e.type==='activate'?'activate':/NEGATED/.test(p.text)?'negate':'resolve';hear('chain',e.player);continue}
   if(p.kind==='slash'){const a=box(point(e.from)),defender=e.to?point(e.to):point({controller:1-(Number(e.from?.controller)||0),location:0}),b=box(defender);if(!a||!b)continue;
    const x1=a.left+a.width/2,y1=a.top+a.height/2,x2=b.left+b.width/2,y2=b.top+b.height/2,len=Math.hypot(x2-x1,y2-y1),ang=Math.atan2(y2-y1,x2-x1)*180/Math.PI;
    const n=mount(doc,'dlfx-slash'+(e.to?'':' dlfx-direct'),ms,{x:x1,y:y1,html:`<i class="dlfx-streak"></i><i class="dlfx-tip"></i>`});n.style.setProperty('--dlfx-len',Math.round(len)+'px');n.style.setProperty('--dlfx-ang',ang.toFixed(1)+'deg');
    mount(doc,'dlfx-slashtag',ms,{x:(x1+x2)/2,y:(y1+y2)/2,text:p.text});hear('slash',e.from?.controller);continue}
   if(p.kind==='burst'){const r=box(point({controller:e.player,location:0}));if(!r)continue;
    const top=r.top<(doc.defaultView?.innerHeight||800)/2,n=mount(doc,'dlfx-burst',Math.max(ms,700),{x:r.left+r.width/2,y:top?r.bottom+34:r.top-30,html:`<i class="dlfx-star"></i><strong>${p.sign}${p.amount}</strong><small>${esc(p.caption)}</small>`});n.dataset.kind=p.lpKind;hear(p.lpKind==='gain'?'gain':'burst',e.player);continue}
   if(p.kind==='turn'){const table=box(doc.querySelector('.arena-surface'))||box(doc.querySelector('.table-wrap'))||{left:0,top:34,width:doc.defaultView?.innerWidth||1280};const deck=detail.deckNames?.[e.player]||'';
    mount(doc,'dlfx-turn',Math.max(ms,900),{x:table.left,y:Math.max(0,table.top-34),html:`<span><b>TURN ${Number(e.turn)||''}</b>${deck?' · '+esc(deck):''}</span>`}).style.setProperty('--dlfx-tw',table.width+'px');hear('turn',e.player);continue}
  }
  return plan}catch{return []}}

// Toggle UI: injected next to the existing cutscene switches; both stay in sync. Off = decoration and its sounds only.
function setEnabled(doc,on){try{globalThis.localStorage?.setItem(DLFX_KEY,on?'on':'off')}catch{}doc.body.dataset.dlfx=on?'on':'off';for(const id of ['dlfx-toggle','controls-dlfx']){const c=doc.getElementById(id);if(c)c.checked=on}if(!on)clearDlfx()}
export function installToggles(doc=globalThis.document){try{const on=dlfxEnabled();doc.body.dataset.dlfx=on?'on':'off';
  const add=(id,anchor,label,where)=>{if(!anchor||doc.getElementById(id))return;const l=doc.createElement('label');l.className='dlfx-toggle-label';const c=doc.createElement('input');c.type='checkbox';c.id=id;c.checked=on;c.onchange=()=>setEnabled(doc,c.checked);l.append(c,doc.createTextNode(' '+label));if(where==='after')anchor.after(l);else anchor.append(l)};
  add('dlfx-toggle',doc.getElementById('cinematics')?.closest('label'),'Duel Links-style field FX (original)','after');
  add('controls-dlfx',doc.querySelector('#duel-controls .controls-checks'),'Duel Links-style field FX','append');
 }catch{}}
// Sound Studio: add Coin toss / Dice roll and the new accents to the existing board when it opens.
export function installStudio(doc=globalThis.document){try{const body=doc.getElementById('modal-body');if(!body||studioObserver)return;
  let flip=0;const fill=()=>{const board=body.querySelector('.sound-board');if(!board||board.querySelector('[data-dlfx-audition]'))return;
   for(const [cue,label,group] of [['coin','COIN TOSS','COIN · DICE'],['dice','DICE ROLL','COIN · DICE'],['pillar','SUMMON PILLAR','DL-STYLE FX'],['slash','ATTACK SLASH','DL-STYLE FX'],['burst','DAMAGE BURST','DL-STYLE FX'],['turn','TURN SWEEP','DL-STYLE FX']]){
    const b=doc.createElement('button');b.className='sound-tile dlfx-tile';b.dataset.dlfxAudition=cue;b.style.setProperty('--tile-color',group==='COIN · DICE'?'#f2c14e':'#3fd3ff');b.innerHTML=label+'<small>'+group+'</small>';
    b.onclick=()=>{const s=globalThis.ddlSound;try{s?.stop?.();s?.unlock?.()}catch{}const go=()=>{if(cue==='coin'||cue==='dice')playCoinAudition(s,cue,{face:(flip++%2)?'tails':'heads'});else dlfxSound(s,cue,{})};if(s?.context?.state==='running')go();else setTimeout(go,120);b.classList.remove('audition');void b.offsetWidth;b.classList.add('audition')};board.append(b)}};
  studioObserver=new (doc.defaultView?.MutationObserver||globalThis.MutationObserver)(fill);studioObserver.observe(body,{childList:true,subtree:true});fill()}catch{}}

if(globalThis.document?.addEventListener){
 const doc=globalThis.document;
 doc.addEventListener('ddl-dlfx-batch',({detail})=>{runBatch(detail,doc)});
 const ready=()=>{installToggles(doc);installStudio(doc)};if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
 // Skip FX / Skip cutscene / stopping the duel: drop any accent still on screen.
 doc.addEventListener('click',ev=>{try{if(ev.target?.closest?.('#skip-fx,#controls-skip,#skip-scene,#skip-victory,#controls-new'))clearDlfx()}catch{}},true);
}

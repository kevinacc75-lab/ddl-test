// r54 Guided Duel coach (Claude, 13 Nov 2026). Kevy 13:33: "plonk our AI and just have the mascot explain card
// interactions ... different each time", with "a fail safe that it will admit it needs to fact check this play".
// Lines from ChatGPT's RELAY-176 library, limited to templates whose evidence the r53 adapter really exposes
// (GD01-05, GD13, GD14, GD24, GD27, GD28) plus the fail-safe; none of the rules-causal templates the Seto team listed
// (GD06-11, 17-22, 25, 29) is enabled (RELAY-180 HIGH 1). It reads accepted, visibility-filtered events only, never
// hidden cards or AI search worlds, and never answers a prompt.
import {guideSVG} from './guide.mjs';import {visiblePresentationEvents} from '../event-data.mjs';
export const COACH_KEY='ddl-r54-coach';
const LOC={1:'Deck',2:'hand',4:'Monster Zone',8:'Spell & Trap Zone',16:'Graveyard',32:'banishment',64:'Extra Deck'};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Cards whose ruling the Seto team marked UNVERIFIED for this format (RELAY-179 addendum): never explained, always unsure.
export const UNSURE_CARDS=new Set([76660178/* Fisherman of Legend: OCG optional trigger vs TCG print without "You can" */]);
const isST=(db,code)=>!!((db?.[code]?.type??0)&6);
// Pure: turn new events into coach lines. state = {chains:Map(link->code), seen:Set(templateKey)}; who(p) names a seat.
export function linesFor(events,{db={},view=0,who=p=>p===view?'You':'Your opponent',name=c=>db?.[c]?.name||'A card',chain=new Map()}={}){
 const out=[];
 for(const e of events){
  const unsure=e.code&&UNSURE_CARDS.has(e.code);
  if(unsure&&(e.type==='activate'||e.type==='summon')){out.push({id:'FAILSAFE',key:'U'+e.code,mood:'unsure',sfx:'paper',unsure:true,text:'I’m not sure how '+name(e.code)+' works here. Its ruling is still being fact-checked.',evidence:'Seto team marked this card UNVERIFIED (RELAY-179)'});continue}
  if(e.type==='activate'){chain.set(e.chain,e.code);if(!e.code)continue;
   const st=isST(db,e.code);out.push({id:'GD01',key:'GD01',mood:'thinking',sfx:'tick',text:st?`${name(e.code)} is Chain Link ${e.chain}. It hasn’t resolved yet.`:`${name(e.code)}’s effect is Chain Link ${e.chain}. It hasn’t resolved yet.`,evidence:`Chain Link ${e.chain} · from the ${LOC[e.source?.location]||'field'} · ${who(e.player)}`,big:e.chain>=2})}
  else if(e.type==='resolve'&&chain.size>=2){const code=chain.get(e.chain);out.push({id:'GD02',key:'GD02',mood:'neutral',sfx:'tick',text:code?`Resolve Chain Link ${e.chain}: ${name(code)}.`:'The next Chain Link is resolving.',evidence:'Chains resolve from the last link added back to the first.'})}
  else if(e.type==='negate'){out.push({id:'GD05',key:'GD05',mood:'unsure',sfx:'thud',likely:true,text:`Chain Link ${e.chain} was negated. I need more detail to explain exactly which kind.`,evidence:'This build’s engine event does not say whether the activation or only the effect was negated.',queue:{reason:'negation subtype not exposed',code:e.code||0}})}
  else if(e.type==='chainEnd'){if(chain.size>=2)out.push({id:'GD03',key:'GD03',mood:'neutral',sfx:'paw',text:'That Chain is complete. Any new response window starts fresh.',evidence:`${chain.size} Chain Links resolved.`});chain.clear()}
  else if(e.type==='summon'&&e.code){out.push(e.kind==='normal'?{id:'GD13',key:'GD13',mood:'neutral',sfx:'slide',text:`${name(e.code)} was Normal Summoned. Let’s see what this opens, and what it closes.`,evidence:`${who(e.player)} · Normal Summon`}:{id:'GD14',key:'GD14',mood:'neutral',sfx:'slide',text:`${name(e.code)} was ${e.kind==='flip'?'Flip':'Special'} Summoned.`,evidence:`${who(e.player)} · ${e.kind==='flip'?'Flip':'Special'} Summon`})}
  else if(e.type==='move'&&e.to?.location===32&&e.to.position&&!(e.to.position&5)){out.push({id:'GD24',key:'GD24',mood:'thinking',sfx:'paper',text:'A card was banished face-down. I won’t reveal anything this view doesn’t show.',evidence:'Face-down banished cards stay hidden.'})}
  else if(e.type==='damage'&&e.amount>0){out.push(e.combat?{id:'GD27',key:'GD27',mood:'surprised',sfx:'thud',text:`${who(e.player)} took ${e.amount} battle damage. LP now ${e.after}.`,evidence:`${e.before} → ${e.after}`}:{id:'GD28',key:'GD28',mood:'surprised',sfx:'thud',text:`${who(e.player)} took ${e.amount} damage from an effect. LP now ${e.after}.`,evidence:`${e.before} → ${e.after}`})}
  else if(e.type==='cost'&&e.amount>0){out.push({id:'GD28',key:'GD28c',mood:'neutral',sfx:'paper',text:`${who(e.player)} paid ${e.amount} LP as a cost. LP now ${e.after}.`,evidence:'A cost is paid when activating, not when the effect resolves.'})}
 }
 return out;
}
export function installCoach({cue=()=>{},prefs,save=()=>{},queueAdd=()=>null,FAILSAFE={},GUIDE_NAME='Guide'}={}){
 const box=document.createElement('aside');box.id='coach';box.hidden=true;box.setAttribute('aria-live','polite');box.setAttribute('aria-label',GUIDE_NAME+' coach');document.body.append(box);
 let lastId=0,lastTurn=0,duelKey=null,queue=[],showing=null,timer=0,chain=new Map(),seen=new Set();
 const level=()=>prefs.coachLevel||'all';
 function show(){if(showing||!queue.length)return;showing=queue.shift();const l=showing;
  box.innerHTML=`<div class="co-guide">${guideSVG(l.mood)}</div><div class="co-bubble"><p>${esc(l.text)}</p><div class="co-why" hidden><small>${esc(l.evidence||'')}</small><small class="co-badges"><span>${l.unsure||l.likely?'Not sure: needs a fact check':'Engine event confirmed'}</span><span>Authored by ChatGPT — pending Seto/team fact check</span></small><button type="button" data-co="flag">Flag this</button></div><div class="co-btns"><button type="button" data-co="why">Why?</button><button type="button" data-co="ok">Got it</button></div></div>`;
  box.hidden=false;box.dataset.mood=l.mood;cue(l.sfx,prefs.sound);clearTimeout(timer);timer=setTimeout(next,l.unsure||l.likely?9000:5200)}
 function next(){clearTimeout(timer);showing=null;box.hidden=true;show()}
 function flag(l,auto=false){const ok=queueAdd({lesson:'Guided Duel',beat:0,said:l.text,template:l.id,evidence:l.evidence,build:'r54',review:'pending',auto});return ok}
 box.addEventListener('click',e=>{const b=e.target.closest('[data-co]');if(!b||!showing)return;const a=b.dataset.co;
  if(a==='ok')return next();if(a==='why'){const w=box.querySelector('.co-why');w.hidden=!w.hidden;clearTimeout(timer);b.textContent=w.hidden?'Why?':'Less';return}
  if(a==='flag'){const ok=flag(showing);box.querySelector('.co-bubble p').textContent=ok?FAILSAFE.saved:FAILSAFE.failed;b.disabled=true;clearTimeout(timer);timer=setTimeout(next,4000)}});
 window.addEventListener('duel-state',e=>{const {msg:x,db}=e.detail||{};if(!x?.state)return;
  const on=prefs.coach&&x.mode==='play'&&level()!=='quiet';
  /* a new duel or a rewind: event ids restart or the turn goes back. Messages without match info keep the current duel. */
  const key=x.match?(x.match.seed+'|'+(x.match.first??'')+'|'+x.view):duelKey,maxId=Math.max(0,...(x.events||[]).map(ev=>ev.id||0));
  if(key!==duelKey||(x.state.turn??0)<lastTurn||(maxId&&maxId<lastId&&(x.events||[]).length)){duelKey=key;lastId=0;chain=new Map();queue=[];if(showing)next()}lastTurn=x.state.turn??0;
  const fresh=(x.events||[]).filter(ev=>ev.id>lastId);if(fresh.length)lastId=Math.max(lastId,...fresh.map(ev=>ev.id));
  if(x.state.finished){queue=[];if(showing)next();return}
  if(!on||!fresh.length)return;
  const visible=visiblePresentationEvents(fresh,x.view,{mode:x.mode});
  const lines=linesFor(visible,{db,view:x.view,chain,name:c=>db?.[c]?.name||'A card'});
  for(const l of lines){if(l.queue||l.unsure){const k='auto:'+l.id+':'+(l.queue?.code??l.key);if(!seen.has(k)){seen.add(k);const ok=flag(l,true);l.text=l.unsure?(ok?FAILSAFE.unsure:FAILSAFE.unsureUnsaved||l.text):l.text}}
   if(level()==='new'&&seen.has('t:'+l.key)&&!l.unsure)continue;seen.add('t:'+l.key);
   if(queue.length>=4)queue.shift();queue.push(l)}
  show()});
 return {get showing(){return showing},next};
}

// Phase A human-flow helpers (Seto build, 2026-10-17). Pure functions; no engine access,
// no timers, no random. Consumes only the human-owned prompt already delivered to the UI.
import {M,R,LOC} from './duel.mjs';
import {effectFocus} from './effect-focus.mjs';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const UNMAPPED='the effect offered in this response window';
const humanChain=(state,isAi,disabled)=>!!state&&!isAi&&!disabled&&!state.finished&&state.prompt?.type===M.SELECT_CHAIN;

export function promptSignature(ctx,state,count,mode){
 const p=state?.prompt;
 return [mode||'',ctx?.ai?'ai':'human',ctx?.disabled?'off':'on',state?.revision??'',p?.type??'',p?.forced?'forced':'opt',count??0,state?.finished?'done':'live'].join('|');
}

export function describeChainCandidate(candidate,db,choices=[],index=0){
 const card=db?.[candidate?.code]||null,cardName=card?.name||'Card';
 const native=String(choices?.[index]?.detail||'');
 const fx=card?effectFocus(candidate.code,candidate.description,db,{location:candidate.location}):null;
 // Opening's native activation has no Stringid: its verified zero clause is
 // already in EFFECT_CLAUSES. Do not reinterpret other missing IDs as index 0.
 const openingZero=candidate?.code===36637374&&String(candidate?.description)==='0';
 const mapped=!!(fx&&fx.mapped&&!fx.noEffect&&(openingZero||fx.index!==null&&fx.index!==undefined));
 const where=LOC[candidate?.location]||'';
 return {
  code:candidate?.code,cardName,locationLabel:where,
  effectLabel:mapped?fx.label:UNMAPPED,
  clauseStatus:mapped?'mapped':'unmapped',
  clauseNote:mapped?'':'Exact clause not mapped.',
  nativeLabel:native,
  fullText:card?.desc||'Read the card’s printed effect.'
 };
}

function candidatesOf(state,choices,db){
 const selects=state.prompt.selects||[],copies=new Map(),physical=new Map();
 for(const c of selects){const k=c.code+':'+(c.controller??'');const set=physical.get(k)||[];const pk=(c.location??'')+':'+(c.sequence??'');if(!set.includes(pk))set.push(pk);physical.set(k,set)}
 return selects.map((c,i)=>{
  const info=describeChainCandidate(c,db,choices,i),k=c.code+':'+(c.controller??''),set=physical.get(k),n=set.indexOf((c.location??'')+':'+(c.sequence??''))+1;
  return {...info,index:i,controller:c.controller,location:c.location,sequence:c.sequence,copy:set.length>1?n:0,
   displayCardName:set.length>1?info.cardName+' (copy '+n+')':info.cardName,response:{type:R.SELECT_CHAIN,index:i}};
 });
}

export function buildChainPromptModel({state,choices=[],db,isAi=false,disabled=false}){
 if(!humanChain(state,isAi,disabled))return null;
 const forced=!!state.prompt.forced,candidates=candidatesOf(state,choices,db),last=state.chain?.at?.(-1)||null;
 const priorContext=last?{chainSize:last.chain_size??state.chain.length,name:last.copyLabel||db?.[last.code]?.name||'Card'}:null;
 const passResponse=forced?null:{type:R.SELECT_CHAIN,index:null},base={forced,candidates,priorContext,passResponse,passLabel:forced?'':'No, do not chain'};
 if(!candidates.length)return {...base,kind:forced?'empty-forced-diagnostic':'empty-optional',passResponse:null,passLabel:'',
  title:forced?'A mandatory chain window offered no response. Stopped for review; nothing was answered.':'No chain response is available.'};
 if(candidates.length===1){const c=candidates[0];
  return forced?{...base,kind:'single-mandatory',yesResponse:c.response,
   title:`Mandatory: chain ${c.displayCardName}${c.locationLabel?' ('+c.locationLabel+')':''}.`}
  :{...base,kind:'single-optional',yesResponse:c.response,
   title:`You can chain ${c.displayCardName}${c.locationLabel?' ('+c.locationLabel+')':''} now. Yes or No.`}}
 return {...base,kind:forced?'multi-mandatory':'multi-optional',title:forced?'Choose a mandatory chain link':'You can chain one of these now. Choose one, or No.'};
}

export function canAutoSkipEmptyOptionalChain({state,isAi,disabled,mode,fxBusy,held,autoSkipEnabled}){
 const p=state?.prompt;
 return !!autoSkipEnabled&&mode==='play'&&!isAi&&!disabled&&!fxBusy&&!held&&!!state&&!state.finished&&p?.type===M.SELECT_CHAIN&&p.forced===false&&Array.isArray(p.selects)&&p.selects.length===0;
}

export function shouldAutoOpenDecision({state,isAi,disabled,mode,sig,lastOpenedSig,wasAi}){
 const p=state?.prompt;
 if(!p||state.finished||isAi||disabled||mode==='watch'||mode==='replay'||sig===lastOpenedSig)return {open:false,reason:'none'};
 if(![M.SELECT_IDLECMD,M.SELECT_BATTLECMD].includes(p.type))return {open:true,reason:'prompt'};
 return wasAi?{open:true,reason:'return-from-ai'}:{open:false,reason:'none'};
}

export function renderChainChoicesHTML(model,img=()=>'',name=c=>String(c)){
 if(!model)return '';
 const prior=model.priorContext?`<p class="chain-prior">Chain Link ${esc(model.priorContext.chainSize)}: ${esc(model.priorContext.name)}</p>`:'';
 const pass=model.passResponse?`<button type="button" class="choice chain-pass" data-chain-pass="true">${esc(model.passLabel)}</button>`:'';
 const inspect=c=>c.code?`<span class="inspect" data-inspect="${esc(c.code)}" role="button" tabindex="0" aria-label="Inspect ${esc(name(c.code))}">ⓘ</span>`:'';
 const card=c=>`${img(c.code)}<span class="choice-text"><b>${esc(c.displayCardName)}</b><small>${esc(c.locationLabel)}${c.locationLabel?' · ':''}${esc(c.effectLabel)}${c.clauseNote?' · '+esc(c.clauseNote):''}</small></span>${inspect(c)}`;
 let body;
 if(model.kind==='single-optional'||model.kind==='single-mandatory'){const c=model.candidates[0];
  body=`<button type="button" class="choice chain-yes" data-chain-index="${c.index}">${card(c)}<b class="chain-yes-label">${model.kind==='single-optional'?'Yes, chain':'Chain (mandatory)'}</b></button>${pass}`}
 else if(model.candidates.length)body=model.candidates.map(c=>`<div class="chain-row"><button type="button" class="choice" data-chain-index="${c.index}" aria-label="Chain this effect: ${esc(c.displayCardName)}, ${esc(c.effectLabel)}">${card(c)}<b class="chain-yes-label">Chain this effect</b></button></div>`).join('')+pass;
 else body=pass;
 return `<section class="chain-prompt" data-chain-kind="${esc(model.kind)}">${prior}<p class="chain-title" role="status" aria-live="polite" aria-atomic="true">${esc(model.title)}</p>${body}</section>`;
}

// Phase B: one semantic response for the current human window, never a FIFO of
// future engine actions. Transport identity stays outside the native response.
export function interactionKey(v){
 if(typeof v==='bigint')return 'bigint:'+v.toString();
 if(Array.isArray(v))return '['+v.map(interactionKey).join(',')+']';
 if(v&&typeof v==='object')return '{'+Object.keys(v).filter(k=>v[k]!==undefined).sort().map(k=>JSON.stringify(k)+':'+interactionKey(v[k])).join(',')+'}';
 return JSON.stringify(v);
}
export function responseBelongs(r,p,choices=[],sums=[]){
 if(!r||!p)return false;
 const keys=(...allowed)=>Object.keys(r).every(k=>allowed.includes(k));
 if([M.SELECT_PLACE,M.SELECT_DISFIELD].includes(p.type)&&p.count>1){
  return keys('type','places')&&r.type===(p.type===M.SELECT_PLACE?R.SELECT_PLACE:R.SELECT_DISFIELD)&&Array.isArray(r.places)&&r.places.length===p.count&&new Set(r.places.map(interactionKey)).size===r.places.length&&r.places.every(place=>choices.some(c=>interactionKey(c.response?.places?.[0])===interactionKey(place)));
 }
 if(choices.some(c=>interactionKey(c.response)===interactionKey(r)))return true;
 if([M.SORT_CARD,M.SORT_CHAIN].includes(p.type)){const n=(p.cards||p.selects||[]).length;return keys('type','order')&&r.type===R.SORT_CARD&&Array.isArray(r.order)&&r.order.length===n&&new Set(r.order).size===n&&r.order.every(i=>Number.isInteger(i)&&i>=0&&i<n)}
 if([M.SELECT_CARD,M.SELECT_TRIBUTE,M.SELECT_SUM].includes(p.type)){
  if(!keys('type','indicies')||r.type!==(p.type===M.SELECT_SUM?R.SELECT_SUM:p.type===M.SELECT_TRIBUTE?R.SELECT_TRIBUTE:R.SELECT_CARD))return false;
  if(r.indicies===null)return p.can_cancel===true&&p.type!==M.SELECT_SUM;
  if(!Array.isArray(r.indicies)||new Set(r.indicies).size!==r.indicies.length)return false;
  if(p.type===M.SELECT_SUM)return sums.some(s=>interactionKey(s)===interactionKey(r.indicies));
  if(!r.indicies.every(i=>Number.isInteger(i)&&i>=0&&i<(p.selects||[]).length))return false;
  const total=p.type===M.SELECT_TRIBUTE?r.indicies.reduce((n,i)=>n+(p.selects[i].release_param||1),0):r.indicies.length;
  return total>=p.min&&total<=p.max;
 }
 if(p.type===M.SELECT_COUNTER)return keys('type','counters')&&r.type===R.SELECT_COUNTER&&Array.isArray(r.counters)&&r.counters.length===(p.cards||p.selects||[]).length&&r.counters.every((n,i)=>Number.isInteger(n)&&n>=0&&n<=((p.cards||p.selects)[i].count??0))&&r.counters.reduce((a,b)=>a+b,0)===p.count;
 if([M.ANNOUNCE_RACE,M.ANNOUNCE_ATTRIB].includes(p.type)){
  const race=p.type===M.ANNOUNCE_RACE,key=race?'races':'attributes',values=r[key];
  if(!keys('type',key)||r.type!==(race?R.ANNOUNCE_RACE:R.ANNOUNCE_ATTRIB)||!Array.isArray(values)||values.length!==p.count||new Set(values.map(interactionKey)).size!==values.length)return false;
  try{return values.every(n=>{if(race?typeof n!=='bigint':!Number.isSafeInteger(n))return false;const b=BigInt(n);return b>0n&&(b&(b-1n))===0n&&(b&BigInt(p.available))===b})}catch{return false}
 }
 return false;
}
export class HumanDecisionFlow{
 constructor(){this.serial=0;this.reset()}
 reset(){this.current=null;this.pending=null;this.flight=null;this.sentToken=null;this.autoBlocked=false}
 update(x){
  const h=x.human,p=x.state?.prompt,priorRequest=this.flight?.human.requestId;
  const next=h?.protocol===2&&h.token&&p&&!x.ai&&!x.disabled&&!x.state.finished&&['play','manual'].includes(x.mode)?{...h,revision:x.state.revision,seat:p.seat??x.view,promptType:p.type,prompt:p,choices:x.choices||[],sums:x.sums||[],structure:interactionKey([p,x.choices||[],x.sums||[]])}:null;
  if(next)next.key=interactionKey([next.clientSession,next.epoch,next.token,next.seat,next.revision,next.structure]);
  const changed=next?.key!==this.current?.key;
  if(changed){this.pending=null;this.flight=null;this.sentToken=null;this.autoBlocked=false}
  this.current=next;
  if(priorRequest&&h?.ack?.requestId===priorRequest){this.flight=null;if(h.ack.accepted===false){this.sentToken=null;this.autoBlocked=true}}
  return changed;
 }
 choose(response,label='Your choice'){
  const c=this.current;if(!c||this.pending||this.flight||this.sentToken===c.token||!responseBelongs(response,c.prompt,c.choices,c.sums))return false;
  this.pending={key:c.key,response:structuredClone(response),label};return true;
 }
 cancel(){if(!this.pending)return false;this.pending=null;return true}
 drain({fxBusy=false,held=false}={}){
  const c=this.current,q=this.pending;if(!c||!q||this.flight||fxBusy||held)return null;
  if(q.key!==c.key||!responseBelongs(q.response,c.prompt,c.choices,c.sums)){this.pending=null;return null}
  const msg={type:'reply',response:q.response,revision:c.revision,human:{protocol:2,clientSession:c.clientSession,epoch:c.epoch,token:c.token,seat:c.seat,promptType:c.promptType,requestId:c.clientSession+':'+(++this.serial)}};
  this.pending=null;this.flight=msg;this.sentToken=c.token;return msg;
 }
 reject(x){if(x.requestId!==this.flight?.human.requestId)return false;this.pending=null;this.flight=null;this.sentToken=null;this.autoBlocked=true;return true}
 get inFlight(){return !!this.flight}
}
export class HumanResponseBridge{
 constructor(){this.epoch=0;this.counter=0;this.stateSeq=0;this.reset('')}
 reset(clientSession=this.clientSession){this.clientSession=clientSession;this.epoch++;this.current=null;this.used=null;this.ack=null}
 issue({revision,seat,prompt,ai=false,disabled=false,finished=false}){
  const structure=prompt&&!ai&&!disabled&&!finished?interactionKey([revision,seat,prompt]):null;
  if(!structure)this.current=null;
  else if(this.current?.structure!==structure)this.current={structure,revision,seat,promptType:prompt.type,token:String(++this.counter)};
  const c=this.current;
  return {protocol:2,clientSession:this.clientSession,epoch:this.epoch,stateSeq:++this.stateSeq,token:c?.token??null,seat:c?.seat,revision:c?.revision,promptType:c?.promptType,ack:this.ack};
 }
 check(x,{prompt,choices=[],sums=[]}){
  const h=x.human,c=this.current;
  if(!c||!h||h.protocol!==2||h.clientSession!==this.clientSession||h.epoch!==this.epoch||h.token!==c.token||h.seat!==c.seat||h.promptType!==c.promptType||x.revision!==c.revision||typeof h.requestId!=='string'||!h.requestId||h.requestId.length>200)return {ok:false,reason:'This choice belongs to an earlier response window.'};
  if(this.used===c.token)return {ok:false,reason:'This response was already submitted.'};
  if(!responseBelongs(x.response,prompt,choices,sums))return {ok:false,reason:'The legal choices changed; choose again.'};
  this.used=c.token;return {ok:true};
 }
}

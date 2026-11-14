// Phase C consumes only the current public UI snapshot and native responses.
import {M,R} from './duel.mjs';
export const windowKey=x=>JSON.stringify([x?.human?.clientSession,x?.human?.epoch,x?.human?.token,x?.state?.revision,x?.view,x?.state?.prompt?.type]);
export function emptyResponseWindow(x){
 const p=x?.state?.prompt,c=x?.choices;
 return !!x&&x.mode==='play'&&!x.ai&&!x.disabled&&!x.state.finished&&p?.type===M.SELECT_CHAIN&&p.forced===false&&Array.isArray(p.selects)&&p.selects.length===0&&Array.isArray(c)&&c.length===1&&c[0].response?.type===R.SELECT_CHAIN&&c[0].response.index===null;
}
export class ResponsePass{
 constructor(){this.reset()}
 reset(){this.until=false;this.blocked=null;this.replies=0;this.attackId=-1;this.answered=null}
 start(x){this.until=true;this.blocked=null;this.replies=0;this.attackId=Math.max(-1,...(x?.events||[]).filter(e=>e.type==='attack').map(e=>e.id??0));this.update(x)}
 stop(x){this.until=false;this.blocked=windowKey(x)}
 update(x){
  if(!x)return;
  const attacks=(x.events||[]).filter(e=>e.type==='attack'&&(e.id??0)>this.attackId);
  const relevant=x.state?.active===x.view||x.state?.prompt?.type===M.SELECT_CHAIN&&x.state.prompt.selects?.length>0||attacks.length;
  if(this.until&&(relevant||x.disabled||x.state?.finished||x.mode!=='play'))this.until=false;
  if(attacks.length)this.attackId=Math.max(this.attackId,...attacks.map(e=>e.id??0));
  if(!emptyResponseWindow(x))this.replies=0;
 }
 allowed(x,enabled){return emptyResponseWindow(x)&&(enabled||this.until)&&this.blocked!==windowKey(x)&&this.answered!==windowKey(x)&&this.replies<32}
 sent(x){this.answered=windowKey(x);if(++this.replies>=32)this.stop(x)}
}

export const publicSlot=(c,first)=>[first===1?1-c.controller:c.controller,c.location,c.sequence].join(':');
export function cardActions(x,slot){
 if(!x||!['play','manual'].includes(x.mode)||x.ai||x.disabled||x.state?.finished)return [];
 const p=x.state?.prompt;if(!p)return [];
 const lists=p.type===M.SELECT_IDLECMD?[[p.summons,0,'Summon'],[p.special_summons,1,'Special Summon'],[p.pos_changes,2,'Change position'],[p.monster_sets,3,'Set monster'],[p.spell_sets,4,'Set'],[p.activates,5,'Activate']]:p.type===M.SELECT_BATTLECMD?[[p.chains,0,'Activate'],[p.attacks,1,'Attack']]:[];
 const responseType=p.type===M.SELECT_IDLECMD?R.SELECT_IDLECMD:R.SELECT_BATTLECMD;
 return lists.flatMap(([cards,action,label])=>(cards||[]).flatMap((c,index)=>{
  if(publicSlot(c,x.match?.first)!==slot||Number(slot.split(':')[0])!==x.view)return [];
  const choice=x.choices?.find(v=>v.response?.type===responseType&&v.response.action===action&&v.response.index===index);
  return choice?[{...choice,card:c,actionLabel:label}]:[];
 }));
}
export function attackTargetChoices(x){
 const p=x?.state?.prompt;
 if(!x||!['play','manual'].includes(x.mode)||x.ai||x.disabled||x.state?.finished||p?.type!==M.SELECT_CARD||x.state.hint!==549||p.min!==1||p.max!==1||!Array.isArray(p.selects))return [];
 return p.selects.map((card,index)=>({slot:publicSlot(card,x.match?.first),response:{type:R.SELECT_CARD,indicies:[index]}}));
}
export function attackCaution(x,attacker,slot){
 if(!x?.state?.players)return '';
 const [seat,location,sequence]=slot.split(':').map(Number),target=x.state.players[seat]?.zones?.[location]?.[sequence];
 if(!target)return '';
 if(target.hidden||!(target.position&5))return 'This target is face-down. Its effect and battle stats are unknown.';
 if(!attacker)return '';
 const defense=!!(target.position&4),value=defense?target.defense:target.attack;
 if(Number.isFinite(value)&&Number.isFinite(attacker.attack)&&value>=attacker.attack)return 'The visible target has '+(defense?'DEF':'ATK')+' '+value+' against your ATK '+attacker.attack+'. Continue?';
 return '';
}
export const intersects=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
const padded=(r,gap)=>({left:r.left-gap,right:r.right+gap,top:r.top-gap,bottom:r.bottom+gap});
export function responseBarPosition(size,viewport,header,protectedRects=[]){
 const left=8,top=8;
 let preferred={left,top};
 // Prefer the space beside the log, keeping a 12 CSS-pixel clear gap.
 if(header&&intersects({left,top,right:left+size.width,bottom:top+size.height},padded(header,12))){const beside=header.right+12;preferred=beside+size.width<=viewport.width-208?{left:beside,top}:{left,top:header.bottom+12}}
 const obstacles=[...(header?[padded(header,12)]:[]),...protectedRects.map(r=>padded(r,8))];
 if(!obstacles.some(r=>intersects({...preferred,right:preferred.left+size.width,bottom:preferred.top+size.height},r)))return preferred;
 const fit=fitPanel({left:preferred.left,right:preferred.left,top:preferred.top,bottom:preferred.top},size,viewport,obstacles);
 return fit?{left:fit.left,top:fit.top}:preferred;
}
export function fitPanel(anchor,size,viewport,obstacles=[]){
 const width=Math.min(size.width,viewport.width-16),height=size.height;
 const candidates=[{left:anchor.left,top:anchor.top-height-8},{left:anchor.left,top:anchor.bottom+8},{left:anchor.right+8,top:anchor.top},{left:anchor.left-width-8,top:anchor.top}];
 // Exact obstacle edges and viewport corners avoid missing a narrow free strip.
 const xs=[anchor.left,8,viewport.width-width-8,...obstacles.flatMap(o=>[o.left-width-8,o.right+8])],ys=[8,viewport.height-height-8,...obstacles.flatMap(o=>[o.top-height-8,o.bottom+8])];
 for(const top of ys)for(const left of xs)candidates.push({left,top});
 // Search nearby empty space before falling back to the existing Actions view.
 for(let top=64;top+height<=viewport.height-8;top+=24)for(let left=8;left+width<=viewport.width-8;left+=32)candidates.push({left,top});
 for(const c of candidates){const left=Math.max(8,Math.min(c.left,viewport.width-width-8)),top=c.top,rect={left,top,right:left+width,bottom:top+height};if(top>=8&&rect.bottom<=viewport.height-8&&!obstacles.some(o=>intersects(rect,o)))return rect}
 return null;
}

export function installPlayFlow({preferences,save,getDecision,submit,navigate,inspect,notify}){
 const pass=new ResponsePass();let latest=null,menuKey=null,menuCard=null,suppressClick=null,attacker=null;
 const bar=document.createElement('section');bar.id='play-response-status';bar.setAttribute('aria-label','Response settings');
 bar.innerHTML='<span role="status" aria-live="polite"></span><button type="button"></button>';
 document.body.append(bar);
 const button=bar.querySelector('button'),label=bar.querySelector('span');
 function sync(){bar.hidden=!latest||latest.mode!=='play'||latest.disabled||latest.state?.finished||document.querySelector('#duel')?.hidden;
  label.textContent=pass.until?'Auto-pass on':preferences.autoSkipEmptyChain!==false?'Skip unusable: on':'Responses: manual';
  button.textContent=pass.until?'Stop auto-pass':'Auto-pass until relevant';button.setAttribute('aria-pressed',String(pass.until));
  button.title='Stop at a legal chain response, an attack declaration, or your own turn.';
  if(!bar.hidden){const header=document.querySelector('#event-log-panel summary'),r=header?.getClientRects().length?header.getBoundingClientRect():null;
   const protectedRects=[...document.querySelectorAll('#my-lp,#opp-lp,#turn-label,#duel-controls-toggle,#skip-fx')].filter(e=>!e.hidden&&e.getClientRects().length).map(e=>e.getBoundingClientRect());
   const position=responseBarPosition(bar.getBoundingClientRect(),{width:window.innerWidth,height:window.innerHeight},r,protectedRects);bar.style.left=position.left+'px';bar.style.top=position.top+'px'}
 }
 const policyChanged=()=>document.dispatchEvent(new window.Event('duel-response-policy'));
 button.onclick=()=>{if(pass.until){pass.stop(latest);preferences.autoSkipEmptyChain=false;save();notify('Auto-pass stopped. Responses are manual.')}else{pass.start(latest);notify(pass.until?'Auto-pass on until a response, attack or your turn.':'Your turn or a legal response needs your choice.')}sync();policyChanged()};
 const menu=document.createElement('section');menu.id='card-action-menu';menu.hidden=true;menu.setAttribute('aria-label','Available card actions');document.body.append(menu);
 const slotOf=n=>n?.dataset.slot??(n?.dataset.handSequence!==undefined?latest?.view+':2:'+n.dataset.handSequence:null);
 const close=()=>{menu.hidden=true;menu.replaceChildren();menuKey=null;menuCard=null};
 function locate(n){
  const hand=!!n.closest('#my-hand'),rect=n.getBoundingClientRect(),viewport={width:window.innerWidth,height:window.innerHeight};
  const protectedNodes=document.querySelectorAll('#my-lp,#opp-lp,#turn-label,#duel-controls-toggle,#skip-fx,#play-response-status,.field-cue,.decision-column'+(hand?',#arena-scroll':''));
  const protectedRects=[...protectedNodes].filter(e=>!e.hidden&&e.getClientRects().length).map(e=>e.getBoundingClientRect());
  const handNode=document.querySelector('#my-hand'),handRects=handNode&&!handNode.hidden&&handNode.getClientRects().length?[handNode.getBoundingClientRect()]:[];
  function attempt(compact,obstacles){
   menu.dataset.compact=String(compact);menu.style.width=compact?'160px':'';menu.style.maxHeight='';
   const width=Math.min(compact?160:288,viewport.width-16),height=menu.offsetHeight||200;
   let fit=fitPanel(rect,{width,height},viewport,obstacles);
   // Keep native-size actions scrollable when only a shallow strip is free.
   if(!fit&&compact){const caps=new Set([Math.min(height-24,viewport.height-16),104]);for(let cap=height-24;cap>=104;cap-=24)caps.add(cap);for(const cap of [...caps].filter(c=>c>=104&&c<height).sort((a,b)=>b-a)){fit=fitPanel(rect,{width,height:cap},viewport,obstacles);if(fit){menu.style.maxHeight=cap+'px';break}}}
   return fit;
  }
  const strict=[...protectedRects,...handRects];
  let fit=attempt(hand&&viewport.width<=900&&viewport.height<=480,strict);
  // Tablet and portrait also try the compact menu before the full Actions view.
  if(!fit&&hand)fit=attempt(true,strict);
  // Covering part of the hand is preferable to hiding the entire field.
  if(!fit&&hand)fit=attempt(true,protectedRects);
  if(!fit){close();navigate('play');notify('Available actions are open.');return}
  menu.style.left=fit.left+'px';menu.style.top=fit.top+'px';
 }
 function inspectCard(n,suppress=false){suppressClick=suppress?n:null;close();const code=Number(n?.dataset.card);if(code)inspect(code)}
 function open(n,actions){
  close();menu.hidden=false;menuKey=windowKey(latest);menuCard=n;
  const title=document.createElement('strong');title.textContent=n.getAttribute('aria-label')||'Card';menu.append(title);
  for(const action of actions){const b=document.createElement('button');b.type='button';const attack=action.response.type===R.SELECT_BATTLECMD&&action.response.action===1;
   const emptyField=!(latest.state.players[1-latest.view]?.zones?.[4]||[]).some(Boolean);
   b.textContent=attack&&action.card.can_direct&&emptyField?'Direct Attack':action.actionLabel;
   b.onclick=()=>{if(menuKey!==windowKey(getDecision())){close();return}const r=action.response;if(attack){const [seat,location,sequence]=publicSlot(action.card,latest.match?.first).split(':').map(Number);attacker=latest.state.players[seat]?.zones?.[location]?.[sequence]}close();submit(r)};menu.append(b)}
  if(n.dataset.card){const b=document.createElement('button');b.type='button';b.textContent='Read card';b.onclick=()=>inspectCard(n);menu.append(b)}
  const cancel=document.createElement('button');cancel.type='button';cancel.textContent='Close';cancel.onclick=close;menu.append(cancel);locate(n);
 }
 function target(n,choice){const caution=attackCaution(latest,attacker,choice.slot);if(!caution){submit(choice.response);return}close();menu.hidden=false;menuKey=windowKey(latest);menuCard=n;const p=document.createElement('p');p.textContent=caution;menu.append(p);const yes=document.createElement('button');yes.type='button';yes.textContent='Attack anyway';yes.onclick=()=>{if(menuKey!==windowKey(getDecision())){close();return}close();submit(choice.response)};const no=document.createElement('button');no.type='button';no.textContent='Choose another target';no.onclick=close;menu.append(yes,no);locate(n)}
 function refresh(){const targets=attackTargetChoices(latest);for(const n of document.querySelectorAll('[data-slot],#my-hand [data-hand-sequence]')){const actions=cardActions(latest,slotOf(n)),target=targets.some(t=>t.slot===slotOf(n));n.classList.toggle('can-act',actions.length>0);n.classList.toggle('attack-target',target);if(target)n.setAttribute('aria-description','Legal attack target');else if(actions.length)n.setAttribute('aria-description','Available actions: '+actions.map(a=>a.actionLabel).join(', '));else n.removeAttribute('aria-description')}}
 document.addEventListener('click',e=>{
  const n=e.target.closest?.('[data-slot],#my-hand [data-hand-sequence]');
  if(n&&n===suppressClick){suppressClick=null;e.preventDefault();e.stopImmediatePropagation();return}
  suppressClick=null;
  if(n&&!document.querySelector('dialog[open]')){const choice=attackTargetChoices(latest).find(t=>t.slot===slotOf(n));if(choice){e.preventDefault();e.stopImmediatePropagation();target(n,choice);return}const actions=cardActions(latest,slotOf(n));if(actions.length){e.preventDefault();e.stopImmediatePropagation();if(actions.length===1&&actions[0].response.type===R.SELECT_BATTLECMD&&actions[0].response.action===1&&!actions[0].card.can_direct){const [seat,location,sequence]=slotOf(n).split(':').map(Number);attacker=latest.state.players[seat]?.zones?.[location]?.[sequence];close();submit(actions[0].response)}else open(n,actions);return}}
  if(!e.target.closest?.('#card-action-menu'))close();
 },true);
 document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});window.addEventListener('resize',()=>{sync();if(menuCard)locate(menuCard)});
 return {state(x){if(windowKey(latest)!==windowKey(x))close();if(x.ai||x.state.finished||x.state.prompt?.type!==M.SELECT_CARD||x.state.hint!==549)attacker=null;latest=x;pass.update(x);sync();refresh()},emptyAllowed(){return pass.allowed(latest,preferences.autoSkipEmptyChain!==false)},autoSent(){pass.sent(latest);sync()},manual(){pass.stop(latest);sync()},reset(){close();attacker=null;latest=null;pass.reset();sync();refresh()},sync,inspectCard,close};
}

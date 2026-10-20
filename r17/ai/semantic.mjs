import {OcgMessageType as M} from '../core/index.js';
export function actorList(p,r){
 if(p.type===M.SELECT_IDLECMD)return p[({0:'summons',1:'special_summons',2:'pos_changes',3:'monster_sets',4:'spell_sets',5:'activates'})[r.action]];
 if(p.type===M.SELECT_BATTLECMD)return p[r.action===0?'chains':r.action===1?'attacks':''];
 if(p.type===M.SELECT_CHAIN)return p.selects;
 return null;
}
export function selectionCards(p){return p.type===M.SELECT_SUM?[...(p.selects_must||[]),...(p.selects||[])]:p.type===M.SELECT_UNSELECT_CARD?[...(p.select_cards||[]),...(p.unselect_cards||[])]:p.selects||[]}

const picks=new Set([M.SELECT_CARD,M.SELECT_UNSELECT_CARD,M.SELECT_SUM,M.SELECT_TRIBUTE,M.SELECT_OPTION,M.SELECT_YESNO,M.SELECT_EFFECTYN,M.SELECT_POSITION,M.SELECT_PLACE]);
export function eventSignature(d,p=d.prompt){
 const top=d.chain?.at(-1),effect=picks.has(p?.type)?d.currentEffect:null,source=effect?.code?{code:effect.code,controller:top?.code===effect.code?top.controller:null,location:effect.effectLocation??null,description:String(effect.description||0)}:p?.type===M.SELECT_CHAIN&&top?{code:top.code,controller:top.controller,location:top.triggering_location??top.location??null,description:String(top.description||0)}:null;
 return {promptType:p?.type,controller:p?.seat,turn:d.turn,phase:d.phase,hint:[M.SELECT_CARD,M.SELECT_UNSELECT_CARD,M.SELECT_SUM,M.SELECT_TRIBUTE].includes(p?.type)?d.hint:0,source};
}
export const alignedEvent=(d,sem)=>!sem.event||JSON.stringify(eventSignature(d))===JSON.stringify(sem.event);

export function encodeResponse(d,p,r,view,ledger){
 const sem={promptType:p.type,seat:p.seat,response:{...r},hint:d.hint,event:eventSignature(d,p)};
 const describe=c=>{const owner=d.fromEngine(c.controller),visible=owner===view||c.location===16||!!((c.position||0)&5)&&![1,2,64].includes(c.location);const ref=ledger.reference(owner,c.location,c.sequence,visible?c.code:0);if(visible)ledger.reveal(ref,c.code);return {ref,presence:c.location===2?ref.presence:null,origins:(ref.presence?.origins||ref.origins||[]).map(o=>({...o})),controller:owner,location:c.location,sequence:c.sequence,description:String(c.description||0)}};
 if(p.type===M.SELECT_EFFECTYN&&(p.seat===view||r.yes))sem.effectCode=p.code;
 const actors=actorList(p,r);if(actors&&r.index!=null){sem.actor=describe(actors[r.index]);delete sem.response.index}
 const cards=selectionCards(p);if(cards.length&&r.indicies){sem.picks=r.indicies.map(i=>describe(cards[i]));delete sem.response.indicies}
 if(p.type===M.SELECT_UNSELECT_CARD&&r.index!=null){sem.picks=[describe(cards[r.index])];sem.unselect=r.index>=(p.select_cards||[]).length;delete sem.response.index}
 if([M.SORT_CARD,M.SORT_CHAIN].includes(p.type)){sem.sorted=p.cards.map((c,i)=>({desc:describe(c),rank:r.order[i]})).sort((a,b)=>a.rank-b.rank).map(x=>x.desc);delete sem.response.order}
 if(p.type===M.SELECT_OPTION){sem.option=String(p.options[r.index]);delete sem.response.index}
 // Optional opposing offers/passes are not observations of hidden legal options.
 sem.optionalPass=p.seat!==view&&((p.type===M.SELECT_CHAIN&&r.index===null&&!p.forced)||([M.SELECT_EFFECTYN,M.SELECT_YESNO].includes(p.type)&&r.yes===false));
 return sem;
}
export class RemapError extends Error{constructor(why,code=0,offered=[]){super(why);this.code=code;this.offered=offered}}
export function remapResponse(d,sem,rng){
 const p=d.prompt;if(!p||p.type!==sem.promptType||p.seat!==sem.seat)throw new RemapError('prompt-type/seat differs');if(!alignedEvent(d,sem))throw new RemapError('semantic event differs');const r={...sem.response};if(sem.effectCode&&p.code!==sem.effectCode)throw new RemapError('semantic effect source differs',sem.effectCode,p.code?[{code:p.code,controller:p.player,location:p.location,sequence:p.sequence}]:[]);
 const find=(desc,cards,used=new Set(),predicate=()=>true)=>{
  const code=desc.ref.code,eligible=cards.map((c,i)=>({c,i})).filter(({c,i})=>!used.has(i)&&predicate(i)&&d.fromEngine(c.controller)===desc.controller&&c.location===desc.location&&(!code||c.code===code)&&(!desc.description||desc.description==='0'||String(c.description||0)===desc.description));
  if(!eligible.length)throw Object.assign(new RemapError('semantic card unavailable',code,cards.filter(c=>d.fromEngine(c.controller)===desc.controller&&c.location===desc.location)),{controller:desc.controller,location:desc.location});
  // Field addresses are public. Hidden private hand/deck indices are never replayed.
  if([4,8,32].includes(desc.location)){const same=eligible.find(x=>x.c.sequence===desc.sequence);if(same)return same.i}
  if(code)return eligible[0].i;return eligible[rng()%eligible.length].i;
 };
 if(sem.actor){const cards=actorList(p,r)||[];r.index=find(sem.actor,cards)}
 if(sem.picks){const cards=selectionCards(p),used=new Set(),indices=sem.picks.map(desc=>{const i=find(desc,cards,used,i=>p.type!==M.SELECT_UNSELECT_CARD||(sem.unselect?i>=(p.select_cards||[]).length:i<(p.select_cards||[]).length));used.add(i);return i});if(p.type===M.SELECT_UNSELECT_CARD)r.index=indices[0];else r.indicies=indices}
 if(sem.sorted){const used=new Set(),indices=sem.sorted.map(desc=>{const i=find(desc,p.cards,used);used.add(i);return i});r.order=Array(indices.length);indices.forEach((i,rank)=>r.order[i]=rank)}
 if(sem.option){r.index=p.options.findIndex(v=>String(v)===sem.option);if(r.index<0)throw new RemapError('semantic effect option unavailable')}
 return r;
}
export function actionKey(d,r){const p=d.prompt,actors=actorList(p,r),c=actors?.[r.index];return JSON.stringify([r.type,r.action??null,c?.code||0,c?d.fromEngine(c.controller):null,c?.location??null,c?.sequence??null,String(c?.description||0),r.index===null,r.yes??null])}

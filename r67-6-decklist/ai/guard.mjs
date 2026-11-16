import frozenWhitelist from './self-target-whitelist.mjs';
import proposedR27 from './self-target-whitelist-r27.mjs';/* r27 proposed allowances, pending Kevy's OK + co-signature */
const whitelist={...frozenWhitelist};for(const [k,v] of Object.entries(proposedR27))whitelist[k]=[...(whitelist[k]||[]),...v];
export const HARM={502:'destroy',503:'banish',575:'negate',520:'control',551:'target'};
export const approved=(effect,hint,code)=>(whitelist[effect]||[]).some(w=>w.hint===hint&&(w.targetCode==='*'||w.targetCode===code));
export const harmfulOwn=(d,seat,c)=>!!c&&!!HARM[d.hint]&&d.fromEngine(c.controller)===seat&&!approved(d.currentEffect?.code,d.hint,c.code);
const ownLoss=(d,c)=>{const own=d.fromEngine(c.controller)===d.prompt.seat,hidden=!own&&![16].includes(c.location)&&!(c.position&5);if(hidden)return 100;const n=d.name(c.code);return 100+(c.attack||d.db[c.code]?.attack||0)/20+(/Mirrorjade|Dark Dragoon|Uzuhime|Liger Dancer|Leo Dancer/.test(n)?1000:0)};
export function guardSelect(d,seat,prompt,proposed,{log=true,block=()=>{}}={}){
 const cards=prompt.selects||prompt.select_cards||[];
 if(!HARM[d.hint]||!cards.length)return {picks:proposed};
 const bad=proposed.filter(i=>harmfulOwn(d,seat,cards[i]));if(!bad.length)return {picks:proposed};
 const safe=cards.map((c,i)=>i).filter(i=>!harmfulOwn(d,seat,cards[i])&&!proposed.includes(i)).sort((a,b)=>ownLoss(d,cards[b])-ownLoss(d,cards[a])||a-b);
 if(safe.length>=bad.length){let next=0;const picks=proposed.map(i=>bad.includes(i)?safe[next++]:i);if(log)block('guard:replaced own '+HARM[d.hint]+' with a legal opposing/approved target');return {picks}}
 if(prompt.can_cancel||prompt.can_finish||prompt.min===0){if(log)block('guard:declined-optional own '+HARM[d.hint]+' with no approved payoff');return {cancel:true,picks:[]}}
 // Forced selections cannot be refused. Keep cardinality/tribute weight legal.
 const ranked=cards.map((c,i)=>({c,i})).sort((a,b)=>Number(harmfulOwn(d,seat,a.c))-Number(harmfulOwn(d,seat,b.c))||ownLoss(d,a.c)-ownLoss(d,b.c)||a.i-b.i),picks=[];let total=0;
 for(const x of ranked){picks.push(x.i);total+=x.c.release_param||1;if(total>=(prompt.min||1))break}
 if(log){block('forced-least-bad: engine requires '+HARM[d.hint]+' selection with no safe complete set');const entry=d.log?.at(-1);if(entry?.kind==='guard'){entry.reason='forced-least-bad';entry.picks=picks}}
 return {picks,forced:true};
}
export function hashPublicState(d){
 const field=[0,1].map(seat=>[4,8,16,32].map(loc=>d.zone(seat,loc).map(c=>c?[(loc===16||c.position&5)?c.code:0,c.position,c.attack,c.defense,c.status]:null)));
 return JSON.stringify([d.turn,d.phase,d.active,d.lp,field,[0,1].map(s=>d.zone(s,2).filter(Boolean).length),(d.chain||[]).map(c=>[c.code,c.controller,c.solved])]);
}

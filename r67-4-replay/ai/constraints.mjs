// Compile current observer knowledge BEFORE any sampled native world is dealt.
// Origins are symbolic observation identities, never actual concealed card IDs.
export function compileConstraints(context){
 const proofs=[],hand=new Map(),position=[];
 const add=(ref,player,location,step,kind,sequence=null,epoch=null,origins=null,presence=null)=>{if(!ref?.code)return;const entry={kind,step,player,location,code:ref.code,ref,sequence,epoch,origins:origins||ref.origins||[],presence};proofs.push(entry);if(location===2){const key=player+':'+(presence?.id??ref.id);const old=hand.get(key);if(!old||step<old.step)hand.set(key,entry)}};
 for(const row of context.draws)for(let i=0;i<row.refs.length;i++)add(row.refs[i],row.player,2,row.step??0,'known-draw',null,row.epoch,row.origins?.[i],row.presences?.[i]||null);
 for(let step=0;step<context.history.length;step++){const sem=context.history[step];for(const desc of [sem.actor,...sem.picks||[],...sem.sorted||[]].filter(Boolean))add(desc.ref,desc.controller,desc.location,step,'public-choice',desc.sequence,null,desc.origins,desc.presence)}
 for(const e of context.observations||[]){add(e.ref,e.player,e.location,e.step,e.kind,e.sequence,e.epoch,e.origins,e.presence);if((e.kind==='deck-position'||e.kind==='reveal'&&e.location===1)&&e.ref.code)position.push({player:e.player,step:e.step,epoch:e.epoch,sequence:e.sequence,code:e.ref.code})}
 return {proofs:proofs.sort((a,b)=>a.step-b.step),hand:[...hand.values()].sort((a,b)=>a.step-b.step),position};
}
const shuffle=(a,rng)=>{const out=[...a];for(let i=out.length-1;i>0;i--){const j=rng()%(i+1);[out[i],out[j]]=[out[j],out[i]]}return out};
export function targetedPins(context,compiled,rng,corrections=[new Map(),new Map()]){
 const pins=[new Map(),new Map()],allocations=new Map(),used=new Map(),soft=[new Set(),new Set()];
 for(const row of context.draws)for(let i=0;i<row.refs.length;i++){const ref=row.refs[i],origin=row.origins?.[i]?.find(o=>o.kind==='draw')||ref;if(ref.code&&origin.initialIndex!==null)pins[row.player].set(origin.initialIndex,ref.code)}
 for(let p=0;p<2;p++)for(const {index,code} of corrections[p].values()){if(pins[p].has(index)&&pins[p].get(index)!==code)throw Error('Targeted placement collision');pins[p].set(index,code);soft[p].add(index)}
 // An automatic deck reveal/mill before any shuffle/removal is positional proof.
 for(const proof of compiled.position)if(proof.epoch===0&&!pins[proof.player].has(proof.sequence))pins[proof.player].set(proof.sequence,proof.code);
 const originCodes=new Map();for(const e of context.observations||[])if(e.ref.code)originCodes.set(e.player+':add:'+e.ref.id,e.ref.code);
 const choices=proof=>{const known=proof.origins||[],origins=known.length?known:context.draws.filter(row=>row.player===proof.player&&(row.step??0)<=proof.step).flatMap(row=>row.refs.map(ref=>({kind:'draw',id:ref.id,player:row.player,step:row.step??0,initialIndex:ref.initialIndex,code:ref.code})));
  return origins.map(o=>({...o,code:o.code||(o.kind==='add'?originCodes.get(o.player+':add:'+o.id):0)})).filter(o=>o.player===proof.player&&o.step<=proof.step&&(!o.code||o.code===proof.code)).map(o=>({...o,key:proof.player+':'+o.kind+':'+o.id}));
 };
 const requirements=compiled.hand.map(proof=>({proof,origins:choices(proof)})).sort((a,b)=>a.origins.length-b.origins.length||a.proof.step-b.proof.step);
 for(const {proof,origins} of requirements){let chosen=null;const priority=o=>allocations.get(o.key)?.code===proof.code?0:o.kind==='add'?1:pins[proof.player].get(o.initialIndex)===proof.code?2:3;const list=shuffle(origins,rng).sort((a,b)=>priority(a)-priority(b));
  for(const o of list){const assigned=allocations.get(o.key);if(assigned&&assigned.code!==proof.code)continue;
   // Distinct contemporaneous hand identities cannot claim the same physical draw.
   if(assigned&&assigned.ref!==(proof.presence?.id??proof.ref.id)&&proof.presence?.born!==undefined&&proof.presence.born<(assigned.left??Infinity)&&(assigned.born??-1)<(proof.presence.left??Infinity))continue;
   if(o.kind==='add'){if(o.code!==proof.code)continue;chosen=o;break}
   // Seto (14 Oct): pin by the card's own identity, not per sighting. The same physical draw seen again (e.g. after a
   // hand shuffle gives it a new presence) keeps the slot it already has; it never becomes a second copy.
   if(assigned&&assigned.index!==undefined){chosen={...o,initialIndex:assigned.index,hypothesis:assigned.hypothesis,reused:true};break}
   if(o.initialIndex===null||o.initialIndex===undefined){const fixed=corrections[proof.player].get('draw:'+o.id);if(fixed){chosen={...o,initialIndex:fixed.index,hypothesis:true};break}const early=new Set(context.draws.filter(row=>row.player===proof.player&&row.epoch===0).flatMap(row=>row.refs.map(ref=>ref.initialIndex).filter(i=>i!==null)));const slot=shuffle(Array.from({length:context.decks[proof.player].main.length},(_,i)=>i).filter(i=>!early.has(i)&&!pins[proof.player].has(i)),rng)[0];if(slot===undefined)continue;chosen={...o,initialIndex:slot,hypothesis:true};break}
   const code=pins[proof.player].get(o.initialIndex);if(code&&code!==proof.code)continue;chosen=o;break;
  }
  if(!chosen){const error=Error('No temporal placement for '+proof.code+' in player '+proof.player+' hand at step '+proof.step);error.placement={player:proof.player,code:proof.code,step:proof.step,ref:proof.ref.id,presence:proof.presence,origins,pins:[...pins[proof.player]],allocations:[...allocations]};throw error;}
  if(chosen.kind==='draw'){pins[proof.player].set(chosen.initialIndex,proof.code);if(chosen.hypothesis)soft[proof.player].add(chosen.initialIndex)}
  allocations.set(chosen.key,{code:proof.code,ref:proof.presence?.id??proof.ref.id,born:proof.presence?.born??proof.step,left:proof.presence?.left??proof.ref.left,index:chosen.kind==='draw'?chosen.initialIndex:undefined,hypothesis:!!chosen.hypothesis});used.set(proof.player+':'+proof.ref.id,chosen);
 }
 // Known public adds must still be available in the deck at their first search.
 const adds=new Map();for(const e of context.observations||[])if(e.kind==='deck-selection'&&e.ref.code){const key=e.player+':'+e.ref.id;if(!adds.has(key))adds.set(key,{player:e.player,code:e.ref.code,step:e.step})}
 for(const e of adds.values()){const counts=context.decks[e.player].main.filter(c=>c===e.code).length,already=[...pins[e.player].values()].filter(c=>c===e.code).length;if(already>=counts)continue;
  const priorDrawSlots=new Set(context.draws.filter(row=>row.player===e.player&&(row.step??0)<=e.step).flatMap(row=>row.refs.map(ref=>ref.initialIndex).filter(i=>i!==null)));
  const eligible=shuffle(Array.from({length:context.decks[e.player].main.length},(_,i)=>i).filter(i=>!priorDrawSlots.has(i)&&!pins[e.player].has(i)),rng);if(eligible.length){pins[e.player].set(eligible[0],e.code);soft[e.player].add(eligible[0])}
 }
 // Later observed deck positions are hypotheses in the initial unknown deck.
 // Their native shuffle-relative positions are checked and repaired during replay.
 for(const e of compiled.position){if(e.epoch===0)continue;const total=context.decks[e.player].main.filter(c=>c===e.code).length,already=[...pins[e.player].values()].filter(c=>c===e.code).length;if(already>=total)continue;const early=new Set(context.draws.filter(r=>r.player===e.player&&r.epoch===0).flatMap(r=>r.origins?.flatMap(a=>a.map(o=>o.initialIndex))||r.refs.map(ref=>ref.initialIndex)));const slot=shuffle(Array.from({length:context.decks[e.player].main.length},(_,i)=>i).filter(i=>!early.has(i)&&!pins[e.player].has(i)),rng)[0];if(slot!==undefined){pins[e.player].set(slot,e.code);soft[e.player].add(slot)}}
 return {pins,soft,placements:[...used].map(([ref,origin])=>({ref,origin}))};
}

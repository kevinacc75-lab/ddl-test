import {LP_TYPES,lpBatches} from './lp-fx.mjs';
import {effectFocus} from './effect-focus.mjs';
import {sceneFor} from './scene-data.mjs';
// Engine reason flags: the bundled Project Ignis constant.lua / core protocol.
export const REASON={DESTROY:1,RELEASE:2,MATERIAL:8,COST:128,DISCARD:16384,FUSION:262144,SYNCHRO:524288,RITUAL:1048576,XYZ:2097152,DRAW:33554432,LINK:268435456};
export const MECHANICS={
 lpLight:['LP · LIGHT IMPACT','#ff526a'],lpMedium:['LP · MEDIUM IMPACT','#ff526a'],lpHeavy:['LP · HEAVY IMPACT','#ff526a'],lpCritical:['LP · CRITICAL IMPACT','#ff526a'],
 effectChosen:['EFFECT SELECTED','var(--palette-440)'],move:['CARD MOVEMENT','var(--palette-441)'],draw:['DRAW!','var(--palette-442)'],banish:['BANISHED','var(--palette-443)'],discard:['DISCARD','var(--palette-444)'],destroy:['DESTROYED','var(--palette-432)'],grave:['SENT TO GRAVEYARD','var(--palette-445)'],return:['RETURN TO DECK','var(--palette-446)'],search:['ADD TO HAND','var(--palette-447)'],retrieve:['RETURN TO HAND','var(--palette-448)'],material:['SUMMON MATERIAL','var(--palette-449)'],fusion:['FUSION MATERIAL','var(--palette-450)'],link:['LINK MATERIAL','var(--palette-451)'],xyz:['XYZ MATERIAL','var(--palette-452)'],synchro:['SYNCHRO MATERIAL','var(--palette-453)'],ritual:['RITUAL MATERIAL','var(--palette-454)'],tribute:['TRIBUTE','var(--palette-455)'],detach:['DETACH MATERIAL','var(--palette-456)'],set:['CARD SET','var(--palette-457)'],normal:['NORMAL SUMMON','var(--palette-458)'],special:['SPECIAL SUMMON','var(--palette-459)'],flip:['FLIP SUMMON','var(--palette-460)'],chain:['CHAIN LINK','var(--palette-461)'],activate:['EFFECT ACTIVATED','var(--palette-462)'],spell:['SPELL ACTIVATED','var(--palette-463)'],trap:['TRAP ACTIVATED','var(--palette-464)'],attack:['ATTACK DECLARED','var(--palette-465)'],target:['TARGET SELECTED','var(--palette-250)'],resolve:['CHAIN RESOLVING','var(--palette-431)'],negate:['NEGATED','var(--palette-432)'],chainEnd:['CHAIN COMPLETE','var(--palette-466)'],battleDamage:['BATTLE IMPACT','var(--palette-467)'],lpZero:['LP ZERO','var(--palette-468)'],lpUpdate:['LP CHANGED','var(--palette-469)'],damage:['EFFECT DAMAGE','var(--palette-470)'],cost:['LP COST PAID','var(--palette-471)'],recover:['LP RECOVERED','var(--palette-472)'],position:['POSITION CHANGE','var(--palette-473)'],equip:['EQUIP LINK','var(--palette-474)'],turn:['YOUR NEXT TURN','var(--palette-475)'],win:['DUEL COMPLETE','var(--palette-476)']
};
export const PHASE_CUES={1:['DRAW PHASE','drawPhase','var(--palette-477)','A new card. A new possibility.'],2:['STANDBY PHASE','standby','var(--palette-478)','Resolve your standby effects.'],4:['MAIN PHASE 1','main1','var(--palette-479)','Build your line. Shape the field.'],8:['BATTLE PHASE','battlePhase','var(--palette-480)','The field becomes the battlefield.'],16:['BATTLE STEP','battleStep','var(--palette-481)','Declare an attack or use an effect.'],32:['DAMAGE STEP','damageStep','var(--palette-482)','Combat effects and damage.'],64:['DAMAGE CALCULATION','damageCalc','var(--palette-483)','Compare the combat values.'],128:['BATTLE PHASE END','battleEnd','var(--palette-484)','The battle draws to a close.'],256:['MAIN PHASE 2','main2','var(--palette-485)','Prepare what comes next.'],512:['END PHASE','end','var(--palette-486)','Resolve end effects. Pass the turn.']};
export function moveMechanic(e){
 const r=e.reason||0,from=e.from.location,to=e.to.location;
 // Destination takes precedence: redirected destruction/discards may be banished.
 if(to===32)return 'banish';
 if(e.from.overlay_sequence!==undefined||from===128)return 'detach';
 if(to===128||e.to.overlay_sequence!==undefined)return 'xyz';
 if(r&REASON.MATERIAL){for(const [flag,name] of [[REASON.FUSION,'fusion'],[REASON.LINK,'link'],[REASON.SYNCHRO,'synchro'],[REASON.RITUAL,'ritual'],[REASON.XYZ,'xyz']])if(r&flag)return name;return 'material'}
 if(r&REASON.DISCARD)return 'discard';if(r&REASON.DESTROY)return 'destroy';if(r&REASON.RELEASE)return 'tribute';
 if(to===16)return 'grave';if(to===1||to===64)return 'return';if(to===2)return from===1?'search':'retrieve';
 if([4,8].includes(to)&&!(e.to.position&5))return 'set';return 'move';
}
export function eventCue(e,db){if(e.type==='damage'&&e.combat)return 'battleDamage';if(e.type==='move')return moveMechanic(e);if(e.type==='summon')return e.kind||(e.special?'special':'normal');if(e.type==='activate'){const type=db[e.code]?.type||0;return type&2?'spell':type&4?'trap':'activate'}return e.type}
export function eventDuration(e,db,{cinematics=true,motion=false,skipCutins=false}={}){
 if(motion)return ['summon','activate','resolve','negate'].includes(e.type)?1800:e.type==='move'?420:1000;
 if(e.type==='summon'&&e.special&&cinematics&&!skipCutins&&sceneFor(e.code,db))return 2000;
 if(e.type==='win'&&cinematics)return 7000;
 if(e.type==='damage'&&e.after===0)return 3200;
 if(e.type==='phase')return [1,2,4,8,256,512].includes(e.phase)?1250:440;
 return ({turn:800/*Seto 14 Oct: turn banner at most 0.8 s*/,draw:850,move:720,summon:3000,activate:4000,resolve:4000,chainEnd:1700,negate:2500,attack:900,target:550,equip:650,damage:1800,cost:1250,recover:1500,lpUpdate:1500,position:550,win:2000})[e.type]||400;
}
// Batch consecutive movements of the same mechanic; every card retains its route.
function basePresentationBatches(events,db,options={}){
 const out=[];for(const e of events){const previous=out.at(-1),cue=eventCue(e,db);if(e.type==='move'&&previous?.[0].type==='move'&&eventCue(previous[0],db)===cue&&previous.length<8)previous.push(e);else out.push([e])}
 const broadcast={turn:400,draw:400,move:260,summon:1000,activate:1500,resolve:1250,negate:1000,chainEnd:450,phase:500,attack:600,target:450,equip:500,damage:1000,cost:600,recover:700,lpUpdate:700,position:350,win:3500};
 if(Number(options.pace)===.28)return out.map(events=>({events,duration:(options.motion?Math.min(900,broadcast[events[0].type]||300):events[0].type==='summon'&&events[0].special&&options.cinematics&&!options.skipCutins&&sceneFor(events[0].code,db)?1800:events[0].type==='damage'&&events[0].after===0?2200:broadcast[events[0].type]||300)+(options.motion?0:(events.length-1)*35)}));
 return out.map(events=>({events,duration:Math.min(events[0].type==='turn'?(options.preset==='instant'?0:800):Infinity,(eventDuration(events[0],db,options)+(options.motion?0:(events.length-1)*65))*([.65,1,1.35].includes(Number(options.pace))?Number(options.pace):1))}));
}

// Unconfirmed choices from hidden cards are private until native CHAINING.
export function visiblePresentationEvents(events,view,{study=false,mode='play'}={}){return events.flatMap(e=>{if(!e.private||e.player===view||study||mode==='watch')return [e];return e.type==='effectChosen'?[]:[{...e,code:0,description:'0',focusDescription:null}]})}
export const EFFECT_TIMES={
 quick:{effectChosen:0,activate:0,resolve:300,negate:300,target:0,equip:0},
 readable:{effectChosen:800,activate:1200,resolve:4000,negate:4000,target:600,equip:600},
 duel:{effectChosen:500,activate:800,resolve:2000,negate:2000,target:400,equip:400},
 broadcast:{effectChosen:300,activate:500,resolve:1200,negate:1200,target:250,equip:250},
 study:{effectChosen:6000,activate:6000,resolve:6000,negate:6000,target:6000,equip:6000},
 extended:{effectChosen:8000,activate:8000,resolve:8000,negate:8000,target:8000,equip:8000}
};
export function legacyPresentationBatches(events,db,options={}){
 const timing=EFFECT_TIMES[options.effectPace]||EFFECT_TIMES.readable;
 const filtered=events.filter((e,i)=>e.type!=='effectChosen'||events.slice(i+1).find(next=>next.type==='activate')?.code!==e.code);
 return basePresentationBatches(filtered,db,options).map(batch=>{
  const e=batch.events[0],effect=e.type in timing&&(!['target','equip'].includes(e.type)||e.code);
  if(!effect)return batch;
  const focus=effectFocus(e.code,e.focusDescription||e.description,db,e);if(focus?.noEffect)return {...batch,duration:0};const words=(focus?.excerpt||'').trim().split(/\s+/).filter(Boolean).length;
  const resolution=['resolve','negate'].includes(e.type);
  const extra=resolution&&options.effectPace!=='quick'?Math.floor(words/25)*1000:0;
  return {...batch,duration:resolution?Math.min(7000,timing[e.type]+extra):timing[e.type],holdUntilTap:resolution&&options.effectPace==='hold'};
 });
}

// Stateful director: CL1 is held until a reply confirms a multi-link chain.
// The rules worker may continue through empty response windows while it waits.
// Seto 16 Oct (storyboards): 5.0 s per activation and resolution in Learning, 2.5 s Duel, 1.5 s Broadcast; big summon the same.
export const PACES={learning:{build:5000,lock:600,resolve:5000,move:400,summon:5000},duel:{build:2500,lock:450,resolve:2500,move:350,summon:2500},broadcast:{build:1500,lock:300,resolve:1500,move:300,summon:1500},instant:{build:0,lock:0,resolve:300,move:0,summon:2000}};
export function resolutionTime(e,db,preset){const words=(effectFocus(e.code,e.focusDescription||e.description,db,e)?.excerpt||'').split(/\s+/).filter(Boolean).length;return Math.min(7000,preset.resolve+(preset===PACES.learning?Math.floor(words/25)*1000:0))}
export class ChainDirector {
 constructor(){this.reset()}
 reset(){this.pending=null;this.links=new Map();this.first=null;this.locked=false;this.resolving=null;this.targets=new Map();this.negated=new Set()}
 ingest(events,db,options={}){
  if(options.chainFlow===false)return legacyPresentationBatches(events.filter(e=>e.type!=='resolutionReady'),db,options).flatMap(b=>{const e=b.events[0];if(LP_TYPES.has(e.type))return lpBatches(e,{...options,postPanel:e.source==='effect'||!!e.chainLink});if(e.type==='win')return [...(e.reason===1&&options.preset!=='instant'?(e.player===null?[0,1]:[1-e.player]).map(player=>({events:[{type:'ko',player,source:'engine-win'}],duration:800})):[]),{events:[e],duration:0}];if(['resolve','negate'].includes(e.type))return [{...b,duration:resolutionTime(e,db,PACES[options.preset]||PACES.learning),holdUntilTap:!!options.tapToContinue}];return [b]});
  const preset=PACES[options.preset]||PACES.learning,out=[];
  const push=(e,duration,extra={})=>out.push({events:[e],duration,...extra});
  const emitResolution=batch=>{
   const bosses=options.cinematics!==false&&!options.motion&&!options.skipCutins&&options.preset!=='instant'?batch.events.filter(e=>e.type==='summon'&&e.special&&sceneFor(e.code,db)):[];
   const life=batch.events.filter(e=>LP_TYPES.has(e.type));batch.events=batch.events.filter(e=>!bosses.includes(e)&&!LP_TYPES.has(e.type));out.push(batch);
   for(const [i,e] of life.entries())out.push(...lpBatches(e,{...options,postPanel:i===0}));
   for(const e of bosses)push(e,preset.summon||2000);
  };
  const build=e=>push({...e,compact:true},preset.build);
  for(const original of events){const e={...original};
   if(e.type==='effectChosen'){if(this.pending&&e.option&&e.linkedChain===this.pending.events[0].chain){this.pending.events[0].focusDescription=e.description;const focus=effectFocus(e.code,e.description,db,{...e,type:'resolve'}),words=(focus?.excerpt||'').split(/\s+/).filter(Boolean).length;this.pending.duration=resolutionTime(this.pending.events[0],db,preset)}if(e.linkedChain&&this.links.has(e.linkedChain))this.links.get(e.linkedChain).focusDescription=e.description;continue}
   if(e.type==='target'){const n=e.chain||[...this.links.keys()].at(-1);this.targets.set(n,e.cards);if(this.links.has(n))this.links.get(n).targets=e.cards;continue}
   if(e.type==='activate'){
    if(e.chain===1){this.reset();this.first=e;this.links.set(1,e)}else{this.links.set(e.chain,e);if(this.first){build(this.first);this.first=null}build(e)}continue;
   }
   if(e.type==='resolutionReady'){if(this.pending&&this.pending.events[0].chain===e.chain){emitResolution(this.pending);this.pending=null}continue}
   if(e.type==='negate'){if(this.pending&&this.pending.events[0].chain===e.chain)this.pending.events[0].negated=true;this.negated.add(e.chain);const link=this.links.get(e.chain);if(link)link.negated=true;const b=out.findLast(b=>b.events[0].type==='resolve'&&b.events[0].chain===e.chain);if(b)b.events[0].negated=true;continue}
   if(e.type==='resolve'){
    const link=this.links.get(e.chain)||{};if(!this.locked&&this.links.size>1)push({type:'chainLock',count:this.links.size},preset.lock);this.locked=true;this.first=null;this.resolving=e.chain;
    Object.assign(e,{...link,...e,type:'resolve',targets:this.targets.get(e.chain)||link.targets||[],negated:this.negated.has(e.chain)||link.negated});
    const focus=effectFocus(e.code,e.focusDescription||e.description,db,e);if(focus?.noEffect){push({...e,silent:true},0);continue}const words=(focus?.excerpt||'').split(/\s+/).filter(Boolean).length;
    e.onField=options.chainView==='field'||!options.chainView&&['broadcast'].includes(options.preset)/* Seto 16 Oct: Auto shows the full chain box in Duel pace too */;
    push(e,resolutionTime(e,db,preset),{holdUntilTap:!!options.tapToContinue});if(options.deferResolution)this.pending=out.pop();continue;
   }
   if(e.type==='win'){if(this.pending){emitResolution(this.pending);this.pending=null}if(e.reason===1&&options.preset!=='instant'){for(const player of e.player===null?[0,1]:[1-e.player])push({type:'ko',player,source:'engine-win'},800)}push(e,0);this.reset();continue}
   if(e.type==='chainEnd'){if(this.pending){emitResolution(this.pending);this.pending=null}push({...e,silent:true},0);this.reset();continue}
   if(['move','draw','summon','damage','cost','recover','lpUpdate','equip','position'].includes(e.type)){
    if(this.pending){this.pending.events.push(e);if(this.targets.has(this.pending.events[0].chain))this.pending.events[0].targets=this.targets.get(this.pending.events[0].chain);continue}const b=out.at(-1);if(this.resolving&&b?.events[0].type==='resolve'){if(LP_TYPES.has(e.type))out.push(...lpBatches(e,{...options,postPanel:true}));else b.events.push(e);continue}
    // Target/cost prompts can split engine deliveries. Keep their routes, without another reading scene.
    if(e.type==='move'||e.type==='equip'||e.type==='position'){push({...e,routeOnly:true},preset.move);continue}
   }
   if(LP_TYPES.has(e.type)){out.push(...lpBatches(e,{...options,postPanel:!!this.resolving||e.source==='effect'}));continue}
   const duration=options.preset==='instant'?0:Math.min(options.preset==='broadcast'?700:1500,eventDuration(e,db,options));push(e,duration);
  }return out;
 }
}
export function presentationBatches(events,db,options={}){return new ChainDirector().ingest(events,db,options)}

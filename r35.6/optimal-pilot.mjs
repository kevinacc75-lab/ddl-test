import {Determinizations} from './ai/determinize.mjs';
import {searchInfoSet,MACROS} from './ai/info-set.mjs';
import {poolFor,duelIdentity,POOL_SIZE} from './ai/world-pool.mjs';
import {safeView} from './ai/knowledge.mjs';
import {encodeResponse,remapResponse} from './ai/semantic.mjs';
import {guardSelect, harmfulOwn, hashPublicState} from './ai/guard.mjs';
import {seedHash,randomStream} from './random.mjs';
import {openingPlan} from './game-plans.mjs';
import {ProceduralPilot} from './pilot-agent.mjs';
import {choosePilot,sumSelections} from './pilot.mjs';
import {Duel,M,R} from './duel.mjs';
import {buildPlan} from './pilot-notes.mjs';
import {newBookState,idleStep,passiveCheck,setDecision,holdReason,bookPick,optionPick,bookActivationBlock,bookSummonBlock,bookSpecialBlock,tributeBlock,BOOKS,handTrapUse} from './ai/book/book.mjs';
export const isPayoff=n=>/Mirrorjade|Dark Dragoon|Uzuhime|Liger Dancer|Leo Dancer|Kashtira Shangri-Ira|Blue-Eyes Spirit Dragon|Blue-Eyes Ultimate Spirit Dragon|Cosmic Blazar Dragon|Masked HERO Dark Law|Destroyer Phoenix Enforcer/.test(n);/* r27 (deck review): each deck's end-board boss is protected as a cost/material/tribute and scored by search */
const removal=n=>/Cosmic Cyclone|Mystical Space Typhoon|Twin Twisters|Tornado Dragon|Galaxy Cyclone|Mirrorjade|Dark Dragoon|Afterburners|Widow Anchor|Infinite Impermanence|Forbidden Droplet|Called by the Grave|Shark Cannon|Harpie|S:P Little Knight/.test(n);
const handTrap=n=>/Ash Blossom|Droll|Mulcharmy|Infinite Impermanence/.test(n);
// r35 job 29 fix (Claude, 29 Oct 2026; Seto 00:30 / 01:25, Alexis, Akiza): can WE target this OPPOSING card with a card
// effect? Public information only (a face-down card's identity is never used).
//  - Hu-Li the Jewel Mikanko (printed): "While you control an Equip Card, your opponent cannot target 'Mikanko' cards you
//    control with card effects." The shield is up when the opposing side has a FACE-UP, unnegated Hu-Li AND controls ANY
//    Equip Card (a face-up card in ITS Spell/Trap Zone that is equipped to a monster, on either field). Under the shield
//    their Mikanko cards are untargetable, and so is any face-down card of theirs (it may be a Mikanko card; we can't know).
//    (Before: the Equip Card had to be equipped TO Hu-Li, and both players' zones were pooled; Hu-Li's face-up state was
//    not checked. Job 29: Fire Dance was equipped to THEIR Hu-Li, so the old helper did see the shield; the cause was
//    that the Cosmic Cyclone check only counted their Spell/Traps and never asked whether any could be targeted.)
//  - Catch-all for cards outside our 8-deck pool: an opposing face-up, unnegated card whose text grants "your opponent
//    cannot target ... Spell/Trap / cards you control" makes their Spell/Trap Zone cards untargetable (conservative: we may
//    hold a removal we could have used; we never fire one at our own cards). In our pool it matches Hu-Li only (tested).
export const HULI='Hu-Li the Jewel Mikanko',GRANTS_ST_SHIELD=/your opponent cannot target [^.]*(Spells?|Traps?|Spell\/Traps?|cards you control)/i;
const faceUp=c=>!!c&&!!(c.position&5);
export function huLiShield(d,side){
 return d.zone(side,4).some(x=>faceUp(x)&&!(x.status&1)&&d.name(x.code)===HULI)&&d.zone(side,8).some(s=>faceUp(s)&&!!s.equipCard);
}
function otherStShield(d,side){
 return [...d.zone(side,4),...d.zone(side,8)].some(x=>faceUp(x)&&!(x.status&1)&&d.name(x.code)!==HULI&&GRANTS_ST_SHIELD.test(d.db[x.code]?.desc||''));
}
export const targetable=(d,seat,c)=>{
 const text=d.db[c.code]?.desc||'';if(/cannot be targeted|Neither player can target|cannot target this card/i.test(text))return false;
 const foe=1-seat;
 if(huLiShield(d,foe)&&(!faceUp(c)||/Mikanko/.test(d.name(c.code))))return false;
 if(c.location===8&&otherStShield(d,foe))return false;
 return true;
};
export function activationBlock(d,seat,c){
 if(d.prompt?.type===M.SELECT_CHAIN&&d.prompt.forced&&c.client_mode===1)return null;
 const n=d.name(c.code),enemy=loc=>d.zone(1-seat,loc).filter(Boolean),top=d.chain.at(-1);
 if(/Widow Anchor|Infinite Impermanence/.test(n)&&!enemy(4).some(c=>(c.position&5)&&(d.db[c.code]?.type&32)&&!(c.status&1)&&targetable(d,seat,c)))return n+' has no unnegated opposing Effect Monster';
 if(n==='Forbidden Droplet'&&!enemy(4).some(c=>(c.position&5)&&(d.db[c.code]?.type&32)&&!(c.status&1)))return n+' has no opposing Effect Monster to negate';
 if(/Afterburners/.test(n)&&!enemy(4).some(c=>(c.position&5)&&targetable(d,seat,c)))return n+' has no opposing face-up target';
 if(/Super Polymerization|Super Duper Polymerization/.test(n)&&d.chain.some(link=>link.controller===seat&&!link.solved&&d.name(link.code)==='Mirrorjade the Iceblade Dragon'))return 'Preserve the pending Mirrorjade banish; hold the follow-up Fusion';
 // r35 job 29 fix: targeting Spell/Trap removal needs a TARGETABLE opposing Spell/Trap (not just one that exists): with
 // none, the engine would offer only our own cards and the effect would banish/destroy one of them. Blocked before
 // activation, so no cost is paid (Twin Twisters' discard, Tornado Dragon's detach). Galaxy Cyclone: the hand / field
 // activation targets a SET Spell/Trap; the GY effect targets a FACE-UP one.
 if(/^(Cosmic Cyclone|Mystical Space Typhoon|Twin Twisters|Tornado Dragon)$/.test(n)&&!enemy(8).some(s=>targetable(d,seat,s)))return n+(enemy(8).length?' has no targetable opposing Spell/Trap':' has no opposing Spell/Trap to remove')/* r35.5 wording kept when they have none, so logs differ only where the fix acts */;
 if(n==='Galaxy Cyclone'){const gy=c.location===16;if(!enemy(8).some(s=>(gy?faceUp(s):!faceUp(s))&&targetable(d,seat,s)))return n+(enemy(8).length?' has no targetable opposing '+(gy?'face-up':'Set')+' Spell/Trap':' has no opposing Spell/Trap to remove')}
 if(n==='Mirrorjade the Iceblade Dragon'&&d.description(c.description).match(/Banish/i)&&!enemy(4).some(c=>c.position&5))return 'Mirrorjade has no opposing face-up monster';
 if(/Mulcharmy/.test(n)&&d.active===seat)return 'Preserve Mulcharmy for the opposing turn';
 if(handTrap(n)&&d.active===seat&&(!top||top.controller===seat))return 'Own-turn hand trap has no opposing effect to stop';
 if(n==='Red-Eyes Dark Dragoon'&&d.active===seat&&/Negate/i.test(d.description(c.description))&&(!top||top.controller===seat))return 'Dragoon must retain its negate';
 return null;
}
export function selectionBlock(d,seat,c,cards){
 if(harmfulOwn(d,seat,c))return d.name(d.currentEffect?.code||0)+' on own '+d.name(c.code)+', no approved payoff';
 const own=d.fromEngine(c.controller)===seat,n=d.name(c.code);
 if([501,500,504,505,507,511,512,513,533].includes(d.hint)&&own&&isPayoff(n)&&!(c.location&(1|16|32|64))/* r28: 505/507 = return to hand / Deck: Lunalight Yellow Marten returned our own Liger Dancer *//* r28: only a boss in hand / on the field is spent; a copy in the Deck, Extra Deck, GY or banished is not (Lunalight Kaleido Chick sends Leo Dancer from the Extra Deck; Wolf banishes it from the GY for Liger Dancer) */&&cards.filter(x=>!isPayoff(d.name(x.code))).length>=Math.max(1,d.prompt?.type===M.SELECT_UNSELECT_CARD?1:d.prompt?.min||1)/* r31: in a one-at-a-time pick (Link / Synchro materials) one other non-boss card is enough (HERO Linked away Destroyer Phoenix Enforcer with Vision HERO Increase still free) */)return n+' preserved: another legal cost/material is available';
 if(d.hint===501&&own&&n==='Branded Fusion'&&cards.filter(x=>d.name(x.code)!==n&&!isPayoff(d.name(x.code))).length>=Math.max(1,d.prompt?.min||1))return 'Preserve key combo access; discard an expendable card';
 return null;
}
export function boardScore(d,seat){
 let value=0;for(const c of d.zone(seat,4).filter(Boolean)){const n=d.name(c.code);value+=120+Math.max(0,c.attack||0)/15+(isPayoff(n)?420:0);if(/Dragoon|Mirrorjade|Liger|Hu-Li/.test(n)&&!(c.status&1))value+=350}
 const hand=d.zone(seat,2).filter(Boolean);value+=hand.length*85+hand.filter(c=>handTrap(d.name(c.code))).length*100;
 for(const c of d.zone(seat,8).filter(Boolean))value+=60+(d.db[c.code]?.type&4?100:0);
 value+=d.zone(seat,16).filter(Boolean).filter(c=>/Branded|Albaz|Raye|Lunalight|Mikanko/.test(d.name(c.code))).length*25;
 for(const c of d.zone(1-seat,4).filter(c=>c&&(c.position&5)))value-=100+Math.max(0,c.attack||0)/25+(isPayoff(d.name(c.code))?180:0);
 value+=(d.lp[seat]-d.lp[1-seat])/60;if(d.finished)value+=d.winner===seat?100000:d.winner===null?0:-100000;
 if(d.zone(seat,4).some(c=>c&&d.name(c.code)==='Red-Eyes Dark Dragoon')&&!hand.length)value-=550;
 return value;
}
// r30: true when the move should be played without search (see plan()).
export const trustBook=(pilot,d,baseline)=>!!pilot.bookTrust&&(baseline.book?.kind==='handtrap'/* r32: a hand trap on their key card, every deck */||(!d.decks||!!BOOKS[d.decks[pilot.seat]?.id]&&BOOKS[d.decks[pilot.seat]?.id].trust!==false)/* decks with a combo book only; Mikanko, Sky Striker and HERO play exactly as before */&&(baseline.book?.kind==='step'||d.prompt?.type===M.SELECT_CHAIN&&d.active===pilot.seat&&baseline.response?.index!=null));
export class OptimalPilot extends ProceduralPilot{
 constructor(args){super({...args,style:'control',variation:'focused',strategy:'tactical'});this.style='optimal';this.variation='focused';this.strategy='tactical';this.blocks=[];this.nodeBudget=args.nodeBudget??args.budget??400;this.searchCore=args.searchCore||null;this.worldPool=args.worldPool??!!this.searchCore;this.poolKey=args.poolKey??null;this.poolSize=args.poolSize||POOL_SIZE;this.seatCapBytes=args.seatCapBytes;this.budget=this.nodeBudget;this.searchEnabled=args.searchEnabled!==false;this.searchStats={nodes:0,elapsedMs:0};this.excluded=new Map();this.logged=new Set();this.onProgress=args.onProgress;this.shouldStop=args.shouldStop||(()=>false);this.book=args.book!==false;this.bookState=newBookState();this.bookTrust=args.bookTrust!==false&&this.book/* r30 (measured 22 Oct): on by default */}
 info(){return {...super.info(),style:'optimal',label:'Optimal',description:'Doctrine game plan, bounded combo search, threat-scored interruptions and blunder checks',variation:'none',strategy:'optimal',search:this.searchStats,book:this.book?{...this.bookState.stats,line:this.bookState.line}:null}}
 // Remove style and seed-dependent play variation. Only deck shuffling is random.
 random(){return 0}
 block(d,reason){const key=d.revision+':'+reason;if(this.logged.has(key))return;this.logged.add(key);if(this.logged.size>2000)this.logged=new Set([key]);const entry={turn:d.turn,seat:this.seat,reason};this.blocks.push(entry);d.record?.('Blunder prevented: '+reason,'guard');if(d.log?.at(-1)?.kind==='guard')d.log.at(-1).privateSeat=this.seat}
 base(d,{log=true}={}){
  const seat=this.seat,m=d.prompt;let shadow=d,indexMaps={};
  if([M.SELECT_IDLECMD,M.SELECT_CHAIN,M.SELECT_BATTLECMD].includes(m.type)){
   const filtered={...m};for(const key of ['activates','special_summons','summons','selects','chains'])if(m[key]){const map=[];filtered[key]=m[key].filter((c,i)=>{const reason=this.excluded.get(d.revision+':'+key+':'+i)||(key==='activates'||key==='selects'||key==='chains'?activationBlock(d,seat,c)||(this.book?bookActivationBlock(d,seat,c):null):key==='summons'?tributeBlock(d,seat,c)||(this.book?bookSummonBlock(d,seat,c,isPayoff):null):key==='special_summons'&&this.book?bookSpecialBlock(d,seat,c,isPayoff):null);/* r27: book holds on Special Summons */if(reason){if(log)this.block(d,reason);return false}map.push(i);return true});indexMaps[key]=map}
   shadow=Object.create(d);shadow.prompt=filtered;
  }
  let plan=choosePilot(shadow,{explain:true,pilot:this});if(!plan)return null;let r={...plan.response};
  if(m.type===M.SELECT_IDLECMD&&r.index!==null){const key={0:'summons',1:'special_summons',5:'activates'}[r.action];if(indexMaps[key])r.index=indexMaps[key][r.index]}
  if(m.type===M.SELECT_BATTLECMD&&r.action===0&&indexMaps.chains)r.index=indexMaps.chains[r.index];
  if(m.type===M.SELECT_CHAIN&&r.index!==null&&indexMaps.selects)r.index=indexMaps.selects[r.index];
  let bookTag=null;
  // r18b book picks (search target / Fusion target / materials) go in before the blunder guards, which still apply.
  if(this.book){const bp=bookPick(d,seat,m,r);if(bp){r=bp.response;bookTag={kind:'pick',rule:'Opening book pick ('+bp.rule+')',reason:'The book line picks '+bp.card+' here.'}}
   if(m.type===M.SELECT_OPTION){const o=optionPick(d,seat,m);if(o&&o.index!==r.index){r=o;bookTag={kind:'option',rule:'Book effect mode',reason:'Book rule S-TTT / L-06 effect mode.'}}}}
  if([M.SELECT_CARD,M.SELECT_TRIBUTE,M.SELECT_UNSELECT_CARD].includes(m.type)){
   const cards=m.selects||m.select_cards||[],picks=r.indicies||(r.index!=null?[r.index]:[]);
   const guarded=guardSelect(d,seat,m,picks,{log,block:reason=>this.block(d,reason)});
   if(guarded.cancel){if(r.indicies!==undefined)r.indicies=m.can_cancel?null:[];else r.index=null}
   else if(r.indicies!==undefined)r.indicies=guarded.picks;else if(r.index!=null)r.index=guarded.picks[0]??null;
   // Cost/material preservation has an engine-legal least-bad fallback too.
   if(![502,503,520,551,575].includes(d.hint)){
    const selected=r.indicies||(r.index!=null?[r.index]:[]),safe=cards.map((c,i)=>({c,i})).filter(x=>!selectionBlock(d,seat,x.c,cards));
    const used=new Set(selected);for(const i of selected)if(selectionBlock(d,seat,cards[i],cards)){const alt=safe.find(x=>!used.has(x.i));if(alt){used.delete(i);used.add(alt.i);if(log)this.block(d,'Preserve a key cost/material')}else if(log)this.block(d,'forced-least-bad: engine requires the remaining cost/material')}
    if(r.indicies!==undefined&&r.indicies!==null)r.indicies=[...used];else if(r.index!=null)r.index=[...used][0];
   }
  }
  if(m.type===M.SELECT_SUM){const cards=[...m.selects_must||[],...m.selects||[]],safe=sumSelections(m).filter(indices=>!indices.some(i=>{const c=cards[i];return c&&d.fromEngine(c.controller)===seat&&c.location===4&&/Mirrorjade|Dark Dragoon/.test(d.name(c.code))}));if(safe.length)r.indicies=safe[0];}
  // Imperm should hit the effect source when eligible, not a disconnected body.
  if(m.type===M.SELECT_CARD&&d.hint===551&&/Infinite Impermanence|Widow Anchor/.test(d.name(d.currentEffect?.code||d.lastCard))){const top=d.chain.at(-1),i=m.selects.findIndex(c=>d.fromEngine(c.controller)!==seat&&c.code===top?.code);if(i>=0)r.indicies=[i]}
  if(m.type===M.SELECT_IDLECMD&&r.action===4&&d.active===seat&&d.zone(seat,4).some(c=>c&&d.name(c.code)==='Red-Eyes Dark Dragoon')&&d.zone(seat,2).filter(Boolean).length<=1)r={type:R.SELECT_IDLECMD,action:m.to_bp?6:7,index:null};
  let bookAlt=null;
  if(this.book&&m.type===M.SELECT_IDLECMD){
   // r18b: the book step becomes the first choice; the base policy's own pick is kept as bookAlt. Since r30 a book step
   // is played as written (trustBook) when book-trust is on; search compares them only for decks with trust off.
   const blocked=(c,key,i)=>!!this.excluded.get(d.revision+':'+key+':'+i)||(key==='activates'&&!!(activationBlock(d,seat,c)||bookActivationBlock(d,seat,c)))||(key==='special_summons'&&!!bookSpecialBlock(d,seat,c,isPayoff))||(key==='summons'&&!!(tributeBlock(d,seat,c)||bookSummonBlock(d,seat,c,isPayoff)));
   const step=idleStep(d,seat,m,this.bookState,blocked);
   if(step){if(!(step.action===r.action&&step.index===r.index)){bookAlt=r;r={type:step.type,action:step.action,index:step.index}}bookTag={kind:'step',rule:'Opening book '+step.line,reason:(step.rule==='S-TTT'?'Triple Tactics Talent is live (the opponent activated a monster effect in our Main Phase this turn): use it.':'Book line '+step.line+': next step is '+(step.action===0?'Normal Summon ':'activate ')+step.card+'.')+(this.bookTrust&&(!d.decks||!!BOOKS[d.decks[seat]?.id]&&BOOKS[d.decks[seat]?.id].trust!==false)?' Played as written from the combo book.':' Search still compares it with the other legal moves.')}}
   else if(!step){const passive=passiveCheck(d,seat,m,r,blocked);if(passive){if(log)this.block(d,'passivePass prevented: '+passive.reason);bookAlt=r;r={type:passive.live.type,action:passive.live.action,index:passive.live.index};bookTag={kind:'prevented',rule:'Never pass with a live hand',reason:'Play '+passive.live.card+' before '+passive.reason.replace(/ with .*/,'')+'.'}}}
   if(r.action===4&&!bookTag&&m.spell_sets?.[r.index]){const why=holdReason(d,seat,m.spell_sets[r.index]);if(why){const set=setDecision(d,seat,m);bookAlt=r;r=set?.response||{type:R.SELECT_IDLECMD,action:m.to_bp&&d.zone(seat,4).some(Boolean)?6:7,index:null};bookTag={kind:set?.response?'set':'hold',rule:'Hold',reason:'Holding '+why+(set?.response?'; Set '+set.card+' instead':'')+'.'}}}
   if((r.action===6||r.action===7)&&!bookTag){const set=setDecision(d,seat,m);if(set?.response){bookAlt=r;r=set.response;bookTag={kind:'set',rule:'Set before leaving the Main Phase',reason:'Set '+set.card+' at the first safe opportunity'+(set.held.length?'; holding '+set.held.join(', '):'')+'.'}}else if(set?.held?.length)bookTag={kind:'hold',rule:'Hold',reason:'Holding '+set.held.join(', ')+'.'}}
  }
  if(this.book&&m.type===M.SELECT_CHAIN&&!bookTag){const ht=handTrapUse(d,seat,m,(c,i)=>!!this.excluded.get(d.revision+':selects:'+i)||!!activationBlock(d,seat,c));if(ht){if(r?.index!==ht.index){bookAlt=r;r={type:R.SELECT_CHAIN,index:ht.index}}bookTag={kind:'handtrap',rule:'Hand trap on a key card',reason:ht.reason+'.'}}}/* r32 (Kevy item 3): use the hand trap on their key card */
  const changed=JSON.stringify(r)!==JSON.stringify(plan.response);if(changed)plan={...buildPlan(d,r,{rule:'Blunder guard / relevant target',reason:'Preserve a key payoff or replace a wasteful target with the relevant legal card.',kind:plan.kind}),alternatives:plan.alternatives,battle:plan.battle};else plan={...plan,response:r};
  if(bookTag){if(bookTag.kind!=='hold'||JSON.stringify(plan.response)!==JSON.stringify(r))plan={...buildPlan(d,r,{rule:bookTag.rule,reason:bookTag.reason,kind:plan.kind}),alternatives:plan.alternatives,battle:plan.battle};plan={...plan,response:r,book:bookTag,bookAlt}}
  return plan;
 }
 plan(d){
  if(this.cache?.revision===d.revision)return this.cache;const baseline=this.base(safeView(d,this.seat));if(!baseline)return null;let decision=baseline;
  if(this.searchEnabled&&MACROS.has(d.prompt.type)&&safeView(d,this.seat).choices().length>1&&this.nodeBudget>0&&!trustBook(this,d,baseline))decision=this.search(d,baseline);/* r30: bookTrust (default on; tools can pass bookTrust:false) = a book step is played as written, and on our own turn our own trigger/chain activations that the policy wants are kept (search kept declining Perfume Dancer's search, Gold Leo's, Black Sheep's); search decides only where the book is silent and on the opponent's turn */
  for(let i=0;i<12&&!this.shouldStop()&&!decision.search&&!(d.prompt.type===M.SELECT_CHAIN&&d.prompt.forced);i++){const reason=this.preflightUnsafe(safeView(d,this.seat),decision.response);if(!reason)break;this.block(d,reason);if([M.SELECT_YESNO,M.SELECT_EFFECTYN].includes(d.prompt.type)){decision=buildPlan(d,{type:d.prompt.type===M.SELECT_YESNO?R.SELECT_YESNO:R.SELECT_EFFECTYN,yes:false},{rule:'Preserve own field',reason,kind:'effect'});break}const key=d.prompt.type===M.SELECT_IDLECMD?decision.response.action===1?'special_summons':decision.response.action===0?'summons':'activates':d.prompt.type===M.SELECT_BATTLECMD?'chains':'selects';this.excluded.set(d.revision+':'+key+':'+decision.response.index,reason);decision=this.base(safeView(d,this.seat));if(!decision)return null;}
  if(this.book){const st=this.bookState.stats,tag=JSON.stringify(decision.response)===JSON.stringify(baseline.response)?baseline.book:null;if(tag){if(tag.kind==='step')st.steps++;else if(tag.kind==='pick'||tag.kind==='option')st.picks++;else if(tag.kind==='set')st.sets++;else if(tag.kind==='hold')st.holds++;else if(tag.kind==='prevented')st.passivePrevented++;if(/Triple Tactics/.test(tag.reason))st.ttt++}
   const view=safeView(d,this.seat),pv=passiveCheck(view,this.seat,view.prompt,decision.response,(c,key,i)=>!!this.excluded.get(d.revision+':'+key+':'+i)||(key==='activates'&&!!activationBlock(view,this.seat,c)));if(pv){st.passivePass++;decision={...decision,passivePass:pv.reason};d.record?.('passivePass: '+pv.reason,'guard');if(d.log?.at(-1)?.kind==='guard')d.log.at(-1).privateSeat=this.seat}}
  this.cache={...decision,gamePlan:openingPlan(d,this.seat),doctrine:null,pilot:this.info(),decisionNumber:this.decisions+1};return this.cache;
 }
 preflightUnsafe(d,response){
  const m=d.prompt,key=m.type===M.SELECT_IDLECMD&&response.action===5?'activates':m.type===M.SELECT_IDLECMD&&response.action===1?'special_summons':m.type===M.SELECT_IDLECMD&&response.action===0?'summons':m.type===M.SELECT_CHAIN&&response.index!==null?'selects':m.type===M.SELECT_BATTLECMD&&response.action===0?'chains':null,c=key?m[key]?.[response.index]:[M.SELECT_YESNO,M.SELECT_EFFECTYN].includes(m.type)&&response.yes?{code:d.currentEffect?.code||m.code}:null;
  if(!c)return null;const extraSendRisk=/send.*Extra Deck.*GY/is.test(d.db[c.code]?.desc||'')&&d.zone(this.seat,64).some(x=>x&&/Mirrorjade|Dark Dragoon/.test(d.name(x.code)));const fieldPayoff=d.zone(this.seat,4).some(x=>x&&/Mirrorjade|Dark Dragoon/.test(d.name(x.code))),fusionRisk=(/Fusion Summon|Fusion Monster|Extra Deck to the GY/.test(d.db[c.code]?.desc||'')&&(fieldPayoff||extraSendRisk||/Fallen of the White Dragon|Mirrorjade/.test(d.name(c.code))))||(fieldPayoff&&((key==='summons'&&(d.db[c.code]?.level||0)>=5)||(key==='special_summons'&&!!(d.db[c.code]?.type&(64|8192|8388608|67108864)))));// Check every voluntary effect, including optional secondary removal.
  if(key==='summons'&&!fusionRisk)return null;
  if(!fusionRisk&&!/destroy|banish|negate|take control/i.test(d.db[c.code]?.desc||''))return null;
  // Fast path for unprotected visible targets; use an engine replay for
  // protection-sensitive cases and optional secondary removal.
  if(key&&/Widow Anchor|Afterburners|Impermanence|Droplet/.test(d.name(c.code))){const field=d.zone(1-this.seat,4).filter(Boolean),protectedCard=field.some(x=>/cannot be targeted|cannot target|Mikanko|Lunalight Leo|Liger/i.test(d.db[x.code]?.desc||''));if(!protectedCard&&field.some(x=>(x.position&5)&&!(x.status&1)&&(/Afterburners/.test(d.name(c.code))||(d.db[x.code]?.type&32))))return null;}
  if(key&&d.name(c.code)==='Cosmic Cyclone'&&!d.zone(1-this.seat,4).some(x=>x&&d.name(x.code)==='Hu-Li the Jewel Mikanko'))return null;
  const sampler=new Determinizations(d,this.seat,this.seed+':preflight:'+this.seat+':'+d.responseHistory.length),roots=sampler.roots(16,this.shouldStop),rng=randomStream(seedHash(sampler.seed)),sem=encodeResponse(d,m,response,this.seat,d.knowledge[this.seat]);
  if(roots.length<16){for(const root of roots)root.stop();return null}let unsafe=null;
  for(const clone of roots){try{clone.respond(remapResponse(clone,sem,rng));const policy=new OptimalPilot({seat:this.seat,seed:this.seed,doctrine:this.doctrine,searchEnabled:false,book:this.book});for(let i=0;i<32&&!clone.finished;i++){
   const p=clone.prompt;if(p.seat!==this.seat)break;
   if([M.SELECT_CARD,M.SELECT_UNSELECT_CARD,M.SELECT_TRIBUTE].includes(p.type)){
    const cards=p.selects||p.select_cards||[],safe=cards.filter(x=>!selectionBlock(clone,this.seat,x,cards));if([502,503,520,551,575].includes(clone.hint)&&safe.length<Math.max(1,p.min||1)&&!p.can_cancel){unsafe='Sampled target preflight: no approved complete target set';break}
   }
   if(MACROS.has(p.type))break;const choice=policy.base(safeView(clone,this.seat),{log:false});if(!choice)break;clone.respond(choice.response);policy.observe(choice)
  }}catch{}finally{clone.stop()}}
  return unsafe;
 }

 search(d,baseline){
  const seat=this.seat,view=safeView(d,seat),rng=randomStream(seedHash(this.seed+':ai:'+seat+':'+d.responseHistory.length)),maxOptions=this.nodeBudget<100?1:4;
  const phaseChoices=view.choices().map(c=>c.response).filter(r=>r.index===null&&(r.type===R.SELECT_CHAIN||r.type===R.SELECT_IDLECMD&&r.action>=6||r.type===R.SELECT_BATTLECMD&&r.action>=2));
  // r21: never pass with a live hand, with search on too. While a starter is playable, passive moves (end the phase,
  // Normal Summon a card that starts nothing) are not offered to search, so search scores only the plays that keep going.
  const passiveBlocked=(c,key,i)=>!!this.excluded.get(d.revision+':'+key+':'+i)||(key==='activates'&&!!(activationBlock(view,seat,c)||bookActivationBlock(view,seat,c)))||(key==='special_summons'&&!!bookSpecialBlock(view,seat,c,isPayoff))||(key==='summons'&&!!(tributeBlock(view,seat,c)||bookSummonBlock(view,seat,c,isPayoff)));
  const passive=r=>this.book&&!!passiveCheck(view,seat,view.prompt,r,passiveBlocked);
  let options=[baseline.response,...(baseline.bookAlt?[baseline.bookAlt]:[]),...view.choices().map(c=>c.response)].filter((r,i,a)=>a.findIndex(x=>JSON.stringify(x)===JSON.stringify(r))===i).filter(r=>{
   const p=view.prompt,key=p.type===M.SELECT_IDLECMD?({0:'summons',1:'special_summons',5:'activates',4:'spell_sets',2:'pos_changes'})[r.action]:p.type===M.SELECT_CHAIN?'selects':p.type===M.SELECT_BATTLECMD?r.action===0?'chains':r.action===1?'attacks':null:null,c=key?p[key]?.[r.index]:null;
   if(c&&(activationBlock(view,seat,c)||this.book&&(['activates','selects','chains'].includes(key)&&bookActivationBlock(view,seat,c)||key==='special_summons'&&bookSpecialBlock(view,seat,c,isPayoff))||key==='summons'&&tributeBlock(view,seat,c)))return false;/* r27: book holds bind search too */return JSON.stringify(r)===JSON.stringify(baseline.response)||JSON.stringify(r)===JSON.stringify(baseline.bookAlt)||!!c;
  });
  if(this.book){const kept=options.filter(r=>!passive(r));if(kept.length)options=kept}
  options=options.slice(0,maxOptions);
  if(maxOptions>1&&phaseChoices.length&&!passive(phaseChoices[0])){const pass=phaseChoices[0];if(!options.some(r=>JSON.stringify(r)===JSON.stringify(pass)))options=[...options.slice(0,maxOptions-1),pass]}
  const sampler=new Determinizations(d,seat,this.seed+':ai:'+seat+':'+d.responseHistory.length,{searchCore:this.searchCore}),makePolicies=()=>[0,1].map(s=>new OptimalPilot({seat:s,seed:this.seed,doctrine:this.doctrine,searchEnabled:false,book:this.book}));let rolloutPolicies=makePolicies();
  const unsafeTarget=sim=>{const p=sim.prompt;if(![M.SELECT_CARD,M.SELECT_UNSELECT_CARD,M.SELECT_TRIBUTE].includes(p.type)||![502,503,520,551,575].includes(sim.hint)||p.seat!==seat)return false;const cards=p.selects||p.select_cards||[],safe=cards.filter(c=>!selectionBlock(sim,seat,c,cards));return safe.length<Math.max(1,p.min||1)&&!p.can_cancel&&!p.can_finish};
  const result=searchInfoSet({d,seat,sampler,options,policies:(s,reset)=>{if(reset)rolloutPolicies=makePolicies();return rolloutPolicies[s]},evaluate:boardScore,nodeBudget:this.nodeBudget,rng,onProgress:this.onProgress,shouldStop:this.shouldStop,unsafeTarget,branchByReplay:this.branchByReplay===true,priorSearchRoots:this.priorSearchRoots,seatCapBytes:this.seatCapBytes,pool:this.worldPool&&sampler.snapshots?poolFor([this.poolKey??duelIdentity(d),seat,this.poolSize].join('|'),this.poolSize):null,...(this.searchTestOptions||{})});
  if(result.pool?.flagged){d.record?.('World pool flagged: '+(result.pool.complete?'':'maintenance cut by the deadline; ')+'flagged since decision '+result.pool.cutAt+'; '+result.pool.cutLineageWorlds+' of '+result.pool.worlds+' worlds out of sync, '+result.pool.behind+' slots behind','guard');if(d.log?.at(-1)?.kind==='guard')d.log.at(-1).privateSeat=this.seat}
  if(result.pool?.keptOverAge){d.record?.('World pool: '+result.pool.keptOverAge+' world(s) kept past the 12-decision renewal (oldest '+result.pool.oldestAge+' decisions; hard cap 24)','guard');if(d.log?.at(-1)?.kind==='guard')d.log.at(-1).privateSeat=this.seat}
  if(sampler.pinConflicts?.length){const c=sampler.pinConflicts[0];d.record?.('Sampler pin conflict: '+sampler.pinConflicts.length+' sample(s) asked for more copies than the deck holds (e.g. '+c.pinned+' pins for a '+c.copies+'-copy card); conflicting pins dropped','guard');if(d.log?.at(-1)?.kind==='guard')d.log.at(-1).privateSeat=this.seat}
  this.searchStats={...result,nodeBudget:this.nodeBudget,failedRemaps:sampler.failures.length,pinConflicts:sampler.pinConflicts?.length||0,sampleAttempts:sampler.attempts,discarded:sampler.discarded,batchPlacements:sampler.batchPlacements||0,batchRetries:sampler.batchRetries||0,replacedCorrections:sampler.replacedCorrections||0,firstMisaligned:sampler.failures[0]||null};
  if(result.status!=='full'||!result.response)this.block(d,'info-set '+(result.response?result.status:'fallback')+': '+result.determinizations+'/16 worlds; '+result.aggregatedWorlds+' aggregated; public-information fallback only below eight completed worlds');
  if(!result.response)return {...baseline,search:{...this.searchStats,status:'fallback',fallback:true}};
  const changed=JSON.stringify(result.response)!==JSON.stringify(baseline.response);return {...(changed?buildPlan(d,result.response,{rule:'Information-set root search',reason:`Aggregated ${result.determinizations} observed-history-conditioned worlds per action using ${result.nodes} nodes. Opposing response windows are played from sampled hands.`,kind:baseline.kind}):baseline),search:this.searchStats};

 }

}
export function createOptimalPilots({seed,doctrine=true,budget=400,nodeBudget=budget,searchEnabled=true,shouldStop,onProgress,searchCore=null,worldPool,poolKey,poolSize,seatCapBytes,book=true,bookTrust}={}){return [0,1].map(seat=>new OptimalPilot({seat,seed,doctrine,budget,nodeBudget,searchEnabled,shouldStop,onProgress,searchCore,worldPool,poolKey,poolSize,seatCapBytes,book,bookTrust}))}/* r32 (ChatGPT F5): bookTrust is forwarded */

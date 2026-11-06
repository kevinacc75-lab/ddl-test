// r36 Arm B (generic battle rule) and Arm C (per-deck doctrine, ai/book/midgame-doctrine.mjs) decision helpers. Flags in ai/midgame-flags.mjs, all off by
// default. Called from optimal-pilot.mjs base()/plan()/search(). Public information only (own cards, public field, LP).
import {MIDGAME} from './midgame-flags.mjs';
import {S4} from './s4-flags.mjs';/* r36 S4 flags (E: planBattle; F: friendly-chain guard) */
import {thisTurnBattle,MAIN1,MAIN2} from './midgame.mjs';
import {tacticalContext,planBattle} from '../tactics.mjs';
import {M,R} from '../duel.mjs';
const R_IDLE=R.SELECT_IDLECMD;
import {doctrineFor} from './book/midgame-doctrine.mjs';
const faceUp=c=>!!(c.position&5);
export const midgameTurn=d=>d.turn>=3;
export const newMidgameStats=()=>({friendlyChainNoSearch:0,lethalLock:0,lethalNoSearch:0,directNoSearch:0,mp2BookOff:0,readyHold:0,targetHold:0,removal:0,bpInsteadOfEnd:0,advisoryBook:0,closeOutOptions:0,bookAtTarget:0,removalVerified:0,removalOverride:0,removalMismatch:0});
const deckId=(d,seat)=>d.decks?.[seat]?.id||null;
const readyAttackers=(d,seat)=>d.zone(seat,4).filter(c=>c&&(c.position&1)&&(c.attack||0)>0&&d.name(c.code)!=='Lubellion the Searing Dragon');
// Arm C board target: at least `attackers` Attack Position monsters and the strongest at `atk` or more, or a lethal-ready board.
export function targetMet(d,seat){const t=doctrineFor(deckId(d,seat))?.boardTarget;if(!t)return false;const a=readyAttackers(d,seat);if(a.length>=t.attackers&&Math.max(0,...a.map(c=>c.attack||0))>=t.atk)return true;const b=thisTurnBattle(d,seat);return !!b?.lethal&&!b.uncertain}
export const isCloseOut=(d,seat,c)=>{const doc=doctrineFor(deckId(d,seat));return !!doc&&doc.closeOut.includes(d.name(c.code))};
// "Build" = an Extra Deck summon (eats field monsters) or a Fusion Summon card that can use field monsters as material.
function isBuild(d,c,key){const desc=d.db[c.code]?.desc||'',n=d.name(c.code);if(REMOVAL.test(n)||/Super Polymerization|Super Duper/.test(n))return false;
 if(key==='special_summons'&&c.location===64)return !/^Sky Striker/.test(n);
 if((key==='activates')&&/Fusion Summon/.test(desc)&&(d.db[c.code]?.type&2||d.db[c.code]?.type&4)&&!/hand, Deck|hand or Deck|from your Deck/i.test(desc))return true;return false}
// Hold reason for one IDLECMD option (key = summons/special_summons/activates) or null. Main Phase 1 of our turn 3+ only.
export function midgameHold(d,seat,key,c,cache){
 if(!(MIDGAME.B||MIDGAME.C)||!midgameTurn(d)||d.active!==seat||d.phase!==MAIN1||d.prompt?.type===undefined)return null;
 if(!['special_summons','activates'].includes(key)||!isBuild(d,c,key))return null;if(MIDGAME.C&&isCloseOut(d,seat,c))return null;
 const b=cache.battle!==undefined?cache.battle:(cache.battle=d.prompt.to_bp?thisTurnBattle(d,seat):null);
 if(MIDGAME.B&&b?.steps.length&&readyAttackers(d,seat).length)return 'readyHold';
 if(MIDGAME.C&&(cache.met??=targetMet(d,seat)))return 'targetHold';return null;
}
// May the opening book run its next step here? (Arm B: from turn 3 never over a found lethal. Arm C draft: from turn 3 not in
// Main Phase 1 at the board target. Main Phase 2 book follow-up is allowed for both - RELAY-075 B2.)
export function bookAllowed(d,seat,plan){
 if(!midgameTurn(d)||!(MIDGAME.B||MIDGAME.C))return {ok:true};
 if(MIDGAME.B&&plan?.rule==='Pursue projected lethal')return {ok:false,stat:'lethalLock'};
 // RELAY-075 B2: no blanket Main Phase 2 book suppression - the r35.11 book follow-up (MG-04 recovery/defensive extension
 // after combat) is restored for B and C. A per-line MP2 policy waits for Akiza.
 if(MIDGAME.C&&d.phase===MAIN1&&targetMet(d,seat))return {ok:false,stat:'bookAtTarget'};
 return {ok:true};
}
// Arm C: extra moves search compares on our turn 3+ IDLECMD: the deck's close-out cards and (Main Phase 1) the Battle Phase.
export function closeOutOptions(d,seat){
 if(!MIDGAME.C||!midgameTurn(d)||d.active!==seat||d.prompt?.type!==M.SELECT_IDLECMD)return [];const m=d.prompt,out=[];
 for(const [key,action] of [['activates',5],['special_summons',1],['summons',0]])(m[key]||[]).forEach((c,i)=>{if(isCloseOut(d,seat,c))out.push({type:R_IDLE,action,index:i})});
 if(m.to_bp&&readyAttackers(d,seat).length)out.push({type:R_IDLE,action:6,index:null});return out;
}
// Arm B (RELAY-075 B1): per-effect removal models. Card text checked against the official Konami TCG database (Alexis, 30 Oct
// 2026; see docs/r36-b1-alexis-removal-text.md). Each model says what the selected effect does to one blocker, whether it
// targets, which printed protections stop it, and its cost. Conservative: a protection phrase anywhere in the blocker's text
// counts (even if conditional), negation side effects and burn are ignored, and a cost that may come from our attackers is
// charged at its worst case. The engine still picks the actual legal targets/costs; this only decides whether to activate.
const TYPE_EFFECT=0x20;
// RELAY-076 B1: destruction protection is read clause by clause (audit of every "cannot be destroyed" phrasing in
// cards.json.gz: docs/r36-b1-protection-audit.md). `source` = the removal's card type ('monster'/'spell'/'trap'),
// `targets` = does it target. A clause blocks our destroy effect unless it is battle-only, limited to its controller's own
// effects ("your card effects", "their own effects"), scoped to one specific battle/effect ("that battle", "this effect",
// "that effect", "Dark Hole's", "effects activated before this one"), restricted to another card type (e.g. "Trap effects"
// vs our monster effect) or to non-targeting effects when ours targets. Conditions ("while ...", "this turn", "the turn it
// was Special Summoned") are ignored = counted as active (conservative: a removal is declined, never over-claimed).
const DESTROY=/cannot be (?:targeted,? or |targeted or )?destroyed(?:,? or banished,?)?(?: \(([^)]*)\)| by,? ((?:[^.;,]|,(?= (?:or|nor|by)\b))*)|, except by battle|(?=[.;,]| and | also| if| during| for| while| until| as long|$))/gi;
function destroyClauseBlocks(clause,{source,targets}){
 if(clause===null)return true;/* bare "cannot be destroyed" (any destruction) / ", except by battle" */
 const c=clause.toLowerCase().replace(/ (?:also|but|then|and (?!by ))\b[^]*$/,'').replace(/ (?:if|while|during|until|for the rest|the turn|once per turn|as long|this turn|\(even if)\b[^]*$/,'');
 for(let x of c.split(/,? or |,? nor |, /)){x=x.trim().replace(/^by /,'');
  if(!x||/^battle\b|^(?:that|this) (?:battle|effect)|^that "|^effects activated before/.test(x))continue;
  if(!/effect/.test(x))continue;
  if(!/opponent/.test(x)&&/\b(?:your|their)(?: own)? (?:card )?effects?\b|^their own effects/.test(x))continue;/* own-side effects only */
  if(/that do not target/.test(x)&&targets)continue;
  const sp=/spell/.test(x),tr=/trap/.test(x),mo=/monster/.test(x);
  if((sp||tr||mo)&&!((source==='spell'&&sp)||(source==='trap'&&tr)||(source==='monster'&&mo)))continue;
  return true;
 }
 return false;
}
export function destroyProtected(text,opts){for(const m of String(text||'').matchAll(DESTROY)){const clause=m[1]??m[2]??null;if(destroyClauseBlocks(clause,opts))return true}return false}
const PROT={
 untargetable:t=>/cannot target this card|neither player can target this card|cannot be targeted/i.test(t),
 indestructible:(t,model)=>destroyProtected(t,model),
 unbanishable:t=>/cannot be (?:destroyed,? or )?banished/i.test(t),
 unaffected:t=>/unaffected by/i.test(t),
};
// Field-wide grants (RELAY-076 B1 audit): a face-up card of the blocker's controller whose sentence grants a protection to
// "monsters you control" / "your monsters" (any sub-type, conservative) protects the blocker too.
const GRANT=/(?:monsters? (?:you control|on your (?:side of the )?field)|your monsters|cards you control)/i;
export const REMOVAL_MODELS={
 'Forbidden Droplet':{effect:'halveNegate',source:'spell',targets:false,effectOnly:true,blockedBy:['unaffected'],cost:'otherHandOrField'},
 'Mirrorjade the Iceblade Dragon':{effect:'banish',source:'monster',targets:false,blockedBy:['unaffected','unbanishable'],cost:'extraDeck'},
 'Red-Eyes Dark Dragoon':{effect:'destroy',source:'monster',targets:false,blockedBy:['unaffected','indestructible'],cost:null},
 'Sky Striker Maneuver - Afterburners!':{effect:'destroy',source:'spell',targets:true,blockedBy:['unaffected','indestructible','untargetable'],cost:null},
 'Sky Striker Mecha - Widow Anchor':{effect:'control',source:'spell',targets:true,effectOnly:true,needsGraveSpells:3,blockedBy:['unaffected','untargetable'],cost:null},
};
export const REMOVAL=new RegExp('^('+Object.keys(REMOVAL_MODELS).map(n=>n.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')+')$');
const TYPE_SPELL=0x2;
export function protectedFrom(ctx,model,c){
 const own=ctx.db[c.code]?.desc||'',hit=model.blockedBy.filter(k=>PROT[k](own,model));
 const grants=[...ctx.enemy.filter(x=>x!==c&&faceUp(x)&&!x.unknown),...(ctx.enemySpells||[])].flatMap(x=>String(ctx.db[x.code]?.desc||'').split(/(?<=[.;])\s+/)).filter(t=>GRANT.test(t));
 for(const k of model.blockedBy)if(!hit.includes(k)&&grants.some(t=>PROT[k](t,model)||(k==='untargetable'&&/cannot target[^.]*(?:monsters? you control|your monsters)/i.test(t))))hit.push(k);
 return hit;
}
// Board after `model` hits blocker `foe`, or null if the effect cannot hit it. Returns {enemy, foeAfter}.
export function applyRemoval(ctx,model,foe){
 if(!faceUp(foe)||foe.unknown)return null;
 if(model.effectOnly&&!((ctx.db[foe.code]?.type||0)&TYPE_EFFECT))return null;
 if(model.needsGraveSpells&&ctx.grave.filter(c=>(ctx.db[c.code]?.type||0)&TYPE_SPELL).length<model.needsGraveSpells)return null;
 if(protectedFrom(ctx,model,foe).length)return null;
 if(model.effect==='halveNegate'){const h={...foe,attack:Math.ceil((foe.attack||0)/2)};return {enemy:ctx.enemy.map(c=>c===foe?h:c),foeAfter:h}}
 return {enemy:ctx.enemy.filter(c=>c!==foe),foeAfter:null};
}
// RELAY-076 B1: cost options for the selected activation, each one PROJECTED (the cost card leaves; its own effects on the
// board go with it). Representable costs: a hand card (board unchanged), a face-down Spell/Trap (no active effect), one of
// our monsters (removed from our attackers) ONLY when its departure cannot change the retained board terms (RELAY-077 B1,
// departureRisk below). NOT representable, so never chosen as a cost: a face-up Spell/Trap/Field/Pendulum card (an Equip
// Spell such as Double-Edged Sword changes ATK and battle damage; a Continuous/Field card may change the board) - if only
// such costs exist the lethal claim is declined. [{paid:null|card,kind,own,spells,hand}].
const ident=c=>({code:c.code,location:c.location,sequence:c.sequence});
// RELAY-077 B1: a monster paid as a cost may carry continuous effects that the retained cards' current ATK/DEF/protection
// already include (Command Knight's "All Warrior monsters you control gain 400 ATK"), may trigger on leaving, and retained
// cards may read the board (conditions, count-based values) or react to a card leaving. The projection only removes the
// paid card, so a monster cost is representable only when the engine's own card scripts (d.scripts, the same Lua the
// engine runs) show none of that: the paid monster has no continuous FIELD/EQUIP effect (aura), no leave/sent/destroyed/
// banished event, no unknown helper; every retained face-up card (both sides) has no conditional or computed continuous
// effect and no field-wide leave listener. Anything unreadable (no scripts, no script for an Effect Monster, a helper not
// on the list) counts as a risk, so the cost is not representable and, if no other cost opens the line, the claim is declined.
const ACTIVE_T=/EFFECT_TYPE_(?:TRIGGER_[OF]|QUICK_[OF]|IGNITION|ACTIVATE)/,LEAVE_EV=/\bEVENT_(?:TO_GRAVE|LEAVE_FIELD(?:_P)?|REMOVE|DESTROYED?|TO_DECK|TO_HAND|SEND_REPLACE|LEAVE_GRAVE)\b/;
const PROC_CODE=/\bEFFECT_(?:SPSUMMON_PROC(?:_G)?|SUMMON_PROC|SET_PROC|LIMIT_SUMMON_PROC|LIMIT_SET_PROC|SPSUMMON_CONDITION|REVIVE_LIMIT|CHANGE_CODE|ADD_CODE|ADD_SETCODE|ADD_TYPE|ADD_ATTRIBUTE|ADD_RACE|MATERIAL_CHECK|UNIQUE_CHECK)\b/;
const SAFE_HELPER=/^(?:c:EnableReviveLimit|c:SetUniqueOnField|c:SetSPSummonOnce|c:AddMustBe\w+|c:EnableUnsummonable|c:EnableCounterPermit|c:SetCounterLimit|Fusion\.AddProc\w*|Synchro\.AddProcedure|Synchro\.AddMajesticProcedure|Xyz\.AddProcedure|Link\.AddProcedure|Ritual\.AddProc\w*|Pendulum\.AddProcedure|aux\.EnableChangeCode|aux\.AddMustBe\w+|aux\.EnableGeminiAttribute|aux\.AddCodeList|Duel\.AddCustomActivityCounter)$/;
const LIT_VAL=/^(?:-?\d+|true|false|[A-Z_][A-Z0-9_]*(?:\s*[|+]\s*[A-Z_][A-Z0-9_]*)*|aux\.(?:tgoval|indoval|imval[12]|indsval|qlifilter|ChangeBattleDamage\(\s*[01]\s*,\s*[A-Z_]+\s*\)|TargetBoolFunction\(.*\)|FaceupFilter\(.*\)))$/;
const BOARD_READ=/Duel\.|:Get\w*Count|:GetEquip|:GetOverlay|:IsHasEffect|:GetColumn|:GetLinked|:GetMutual|:GetBattle|:GetCounter|:IsDisabled/;
const scriptInfo=new Map();
function parseScript(src){
 const fns=new Map(),effects=[],helpers=[];
 for(const chunk of src.split(/\n(?=function )/)){const h=chunk.match(/^function\s+([\w.:]+)\s*\(/);if(h)fns.set(h[1],chunk);
  const vars=new Map();
  for(const line of chunk.split('\n')){let m;
   if((m=line.match(/^\s*(?:local\s+)?(\w+)\s*=\s*Effect\.CreateEffect\(/))){const e={calls:{}};vars.set(m[1],e);effects.push(e);continue}
   if((m=line.match(/^\s*(?:local\s+)?(\w+)\s*=\s*(\w+):Clone\(\)/))){const e={calls:{...(vars.get(m[2])?.calls||{})}};vars.set(m[1],e);effects.push(e);continue}
   if((m=line.match(/^\s*(\w+):(Set\w+)\((.*)\)\s*(?:--.*)?$/))&&vars.has(m[1])){vars.get(m[1]).calls[m[2]]=m[3].trim();continue}
   if(h&&h[1]==='s.initial_effect'&&(m=line.match(/^\s*((?:c|aux|[A-Z]\w*)[.:]\w+)\s*\(/))&&!/^c:RegisterEffect$|^Effect\.CreateEffect$/.test(m[1]))helpers.push(m[1]);
  }}
 return {fns,effects,helpers};
}
function info(d,code){
 if(!d.scripts)return {risk:'card scripts unavailable'};
 if(scriptInfo.has(code))return scriptInfo.get(code);
 const card=d.db?.[code],src=d.scripts?.['c'+code+'.lua']??(card?.alias?d.scripts?.['c'+card.alias+'.lua']:null)??null;
 let out;
 if(!src)out=card&&!((card.type||0)&TYPE_EFFECT)?{effects:[],helpers:[],fns:new Map()}:{risk:'no engine script'};
 else out=parseScript(src);
 if(scriptInfo.size>4000)scriptInfo.clear();scriptInfo.set(code,out);return out;
}
const fnReads=(x,v)=>{if(!v)return false;if(LIT_VAL.test(v))return false;const f=v.match(/^(s\.\w+)$/);if(!f)return true;const body=x.fns.get(f[1]);return !body||BOARD_READ.test(body)};
// Why the departure of `paid` could change retained board terms, or null if it cannot (as far as the scripts show).
export function departureRisk(d,paid,retained){
 const name=c=>d.name?.(c.code)||String(c.code),p=info(d,paid.code);
 if(p.risk)return name(paid)+': '+p.risk;
 const ph=p.helpers.find(h=>!SAFE_HELPER.test(h));if(ph)return name(paid)+': unread helper '+ph;
 for(const e of p.effects){const t=e.calls.SetType||'',code=e.calls.SetCode||'';
  if(LEAVE_EV.test(code))return name(paid)+': leave/sent/banished event ('+code+')';
  if(!ACTIVE_T.test(t)&&/EFFECT_TYPE_(?:FIELD|EQUIP|XMATERIAL)/.test(t)&&!PROC_CODE.test(code))return name(paid)+': continuous effect on other cards ('+(code||t)+')'}
 for(const c of retained){if(!c||!faceUp(c)||c.unknown||!c.code)continue;const x=info(d,c.code);
  if(x.risk)return name(c)+': '+x.risk;
  const xh=x.helpers.find(h=>!SAFE_HELPER.test(h));if(xh)return name(c)+': unread helper '+xh;
  for(const e of x.effects){const t=e.calls.SetType||'',code=e.calls.SetCode||'';
   if(/EFFECT_TYPE_FIELD/.test(t)&&LEAVE_EV.test(code))return name(c)+': reacts to a card leaving ('+code+')';
   if(ACTIVE_T.test(t)||/^EVENT_/.test(code)||PROC_CODE.test(code))continue;
   if(e.calls.SetCondition)return name(c)+': conditional continuous effect ('+code+')';
   if(fnReads(x,e.calls.SetValue)||(/EFFECT_TYPE_FIELD/.test(t)&&fnReads(x,e.calls.SetTarget)))return name(c)+': board-dependent continuous effect ('+code+')'}}
 return null;
}
function costOptions(d,ctx,model,act){
 if(model.cost!=='otherHandOrField')return [{paid:null,kind:'none',own:ctx.own,spells:ctx.spells}];
 const self=c=>c.code===act.code&&c.location===act.location&&c.sequence===act.sequence,out=[];
 for(const c of ctx.hand)if(!self(c))out.push({paid:c,kind:'hand',own:ctx.own,spells:ctx.spells});
 for(const c of ctx.spells)if(!self(c)&&!faceUp(c))out.push({paid:c,kind:'setST',own:ctx.own,spells:ctx.spells.filter(x=>x!==c)});
 for(const c of ctx.own)if(!self(c)){
  const own=ctx.own.filter(x=>x!==c),spells=ctx.spells.filter(x=>!(x.equipCard&&x.equipCard.location===c.location&&x.equipCard.sequence===c.sequence&&x.equipCard.controller===c.controller));
  const risk=departureRisk(d,c,[...own,...spells.filter(x=>!self(x)),...ctx.enemy,...(ctx.enemySpells||[])]);
  if(risk){(ctx.declinedCosts??=[]).push(risk);continue}
  out.push({paid:c,kind:'monster',own,spells})}
 return out;
}
// Arm B: a removal activation that opens lethal (or, with no book step, +1500 damage). Every activatable modelled removal x
// every face-up blocker it can legally affect x every representable cost is projected; we choose the cost (best line),
// and the follow-up policy (removalFollowUp) makes the engine selections match the projection. Returns
// {index,card,target,effect,opens,gain,cost,reason,intent} or null.
export function removalFor(d,seat,m,blocked,{bookStep=false}={}){
 if(!MIDGAME.B||!midgameTurn(d)||d.active!==seat||d.phase!==MAIN1||!m.to_bp)return null;
 const ctx=tacticalContext(d,seat);if(!ctx.enemy.some(faceUp)||!readyAttackers(d,seat).length)return null;
 const offersOf=own=>own.filter(c=>(c.position&1)&&(c.attack||0)>0).map(c=>({sequence:c.sequence,location:c.location,can_direct:false}));
 const now=planBattle(ctx,offersOf(ctx.own));if(now.lethal&&!now.uncertain)return null;
 let best=null;
 (m.activates||[]).forEach((act,i)=>{
  const model=REMOVAL_MODELS[d.name(act.code)];if(!model||blocked(act,'activates',i))return;
  const costs=costOptions(d,ctx,model,act);if(!costs.length)return;
  for(const foe of ctx.enemy){
   const hit=applyRemoval(ctx,model,foe);if(!hit)continue;
   const proj=costs.map(o=>{const after=planBattle({...ctx,own:o.own,spells:o.spells,enemy:hit.enemy},offersOf(o.own));return {...o,opens:after.lethal&&!after.uncertain,damage:after.damage}});
   const better=(a,b)=>!b||(a.opens&&!b.opens)||(a.opens===b.opens&&(a.damage>b.damage||(a.damage===b.damage&&a.kind!=='monster'&&b.kind==='monster')));
   let top=null;for(const v of proj)if(better(v,top))top=v;
   const gain=top.damage-now.damage;
   if(!top.opens&&(bookStep||gain<1500))continue;
   // every cost whose projection is as good as the chosen one is acceptable to the follow-up policy
   const allowed=model.cost==='otherHandOrField'?proj.filter(v=>v.opens===top.opens&&v.damage>=top.damage).map(v=>({...ident(v.paid),controller:seat})):null;
   const cand={index:i,card:d.name(act.code),target:d.name(foe.code),effect:model.effect,opens:top.opens,gain,cost:top.paid?d.name(top.paid.code):null,costKind:top.kind,
    intent:{code:act.code,effect:model.effect,activation:{type:R_IDLE,action:5,index:i},target:{...ident(foe),controller:1-seat},costs:allowed,preferredCost:top.paid?{...ident(top.paid),controller:seat}:null,turn:d.turn,link:(d.chain||[]).length+1}};/* r36 F1: the chain link this activation will open */
   if(!best||(cand.opens&&!best.opens)||(cand.opens===best.opens&&cand.gain>best.gain))best=cand;
  }
 });
 if(!best)return null;
 const verb={halveNegate:'Halving/negating ',banish:'Banishing ',destroy:'Destroying ',control:'Taking '}[best.effect]+best.target;
 return {...best,reason:(best.opens?verb+' opens projected lethal':verb+' adds '+best.gain+' projected damage')+(best.cost?' (cost: '+best.cost+')':'')+'; remove the blocker, then attack.'};
}
// RELAY-076/077 B1: the real follow-up policy. While a removal activation chosen by removalFor is in progress (same turn,
// no IDLECMD/BATTLECMD since), each engine prompt is matched to a STAGE of that card's effect by effect and prompt context,
// not by who controls the offered cards (RELAY-077: Mirrorjade, Afterburners! and Widow Anchor offer monsters on BOTH
// fields). Stages come from the engine scripts (scripts.json.gz): `at` = 'activate' (cost/target while the card is being
// activated: no chain link resolving) or 'resolve' (its own chain link is resolving); `hint` = the HINT_SELECTMSG the
// script sets (504 TOGRAVE, 503 REMOVE, 502 DESTROY, 551 TARGET, 575 NEGATE); `loc` = where every offered card must be.
//  Forbidden Droplet  c24299458: cost SelectMatchingCard(hand|onfield, ours) TOGRAVE at activation; resolution "choose"
//                     sg:Select(opponent's face-up Effect Monsters) NEGATE.
//  Mirrorjade         c44146295: cost SelectMatchingCard(Extra Deck) TOGRAVE (not modelled, left to the base policy);
//                     resolution SelectMatchingCard(MZONE, BOTH sides) REMOVE.
//  Red-Eyes Dark Dragoon c37818794: resolution SelectMatchingCard(opponent MZONE) DESTROY.
//  Afterburners!      c99550630: activation SelectTarget(face-up MZONE, BOTH sides) DESTROY; at resolution an optional
//                     Spell/Trap destroy (YesNo Stringid(id,0) + DESTROY select on S/T) is NOT this projection's stage.
//  Widow Anchor       c98338152: activation SelectTarget(face-up Effect, MZONE, BOTH sides) TARGET; at resolution the
//                     optional "Take control of the target?" (YesNo Stringid(id,1)) is answered YES when the projection
//                     is the control line (model needsGraveSpells is met), otherwise left alone.
// Target stage: the projected target must be offered (else removalMismatch); a pick of any other card (ours included) is
// replaced by it if the prompt's legal bounds allow exactly one pick (min<=1<=max), else recorded as a mismatch unchanged.
// Cost stage: as before (projected-equivalent costs). Unmatched prompts return null (left to the base policy).
export const REMOVAL_STAGES={
 'Forbidden Droplet':[{at:'activate',hint:504,role:'cost',loc:[2,4,8]},{at:'resolve',hint:575,role:'target',loc:[4]}],
 'Mirrorjade the Iceblade Dragon':[{at:'resolve',hint:503,role:'target',loc:[4]}],
 'Red-Eyes Dark Dragoon':[{at:'resolve',hint:502,role:'target',loc:[4]}],
 'Sky Striker Maneuver - Afterburners!':[{at:'activate',hint:502,role:'target',loc:[4]}],
 'Sky Striker Mecha - Widow Anchor':[{at:'activate',hint:551,role:'target',loc:[4]},{at:'resolve',yesno:1,role:'control'}],
};
const sameCard=(d,c,t)=>c&&t&&d.fromEngine(c.controller)===t.controller&&c.code===t.code&&c.location===t.location&&(c.location===2||c.sequence===t.sequence);
// r36 F1 (ChatGPT finding F1; bounded fix approved by Kevy 4 Nov 08:23 WITA): the follow-up belongs to ONE activation - the chain link it opened (intent.link, link 1 from an open
// game state) of OUR card with the intent's code, and once seen, the same source instance (location/sequence). A second
// copy of the same card activated in the same chain (a later link), an opponent's copy, or a new chain after ours has
// resolved never inherits the intent. 'activate' = our link is the newest link and nothing is resolving (its cost/target
// payment); 'resolve' = our link is the one resolving; anything else = null (not our activation's prompt).
const linkSource=c=>({location:c.triggering_location??c.location,sequence:c.triggering_sequence??c.sequence});
function removalLink(d,seat,intent){
 if(!intent||intent.link==null)return null;
 const link=(d.chain||[]).find(c=>c.chain_size===intent.link&&!c.solved);
 if(!link||link.code!==intent.code||link.controller!==seat)return null;
 if(intent.source){const s=linkSource(link);if(s.location!==intent.source.location||s.sequence!==intent.source.sequence)return null}
 return link;
}
function removalStageAt(d,seat,intent){
 const link=removalLink(d,seat,intent);if(!link)return null;
 if(d.resolvingChain==null)return Math.max(0,...(d.chain||[]).map(c=>c.chain_size))===intent.link?'activate':null;
 return d.resolvingChain===intent.link?'resolve':null;
}
// r36 F1 lifecycle (RELAY-107 L1): an armed intent must BIND at its first own observation, or it EXPIRES. At that first
// observation our activation's link must be in the current chain (the native engine creates it before any cost/target
// prompt, after any zone choice for a card placed from the hand; it may already be behind an opponent's response, or resolving): our own unsolved link with the intent's link
// number and code. Bind to that link's source instance; if there is no such link (activation rejected, cancelled,
// negated and solved, or already resolved) the intent expires and can never bind later. Same-chain argument: between
// the accepted activation and our next prompt no own action can start another chain whose link 1 is our same card.
// Pure; returns the bound or expired intent.
export function removalBind(d,seat,intent){
 if(!intent||intent.source||intent.expired)return intent;
 const link=removalLink(d,seat,intent);if(link)return {...intent,source:linkSource(link)};
 // Not yet observable: the engine asks where to place our card (SELECT_PLACE, hint = the card's code) BEFORE it opens
 // the activation's link. The intent waits; any other own observation without its link expires it. Safe: a later
 // activation of the same card needs our Idle prompt first, which clears the intent (optimal-pilot.mjs).
 if(d.prompt?.type===M.SELECT_PLACE&&d.hint===intent.code&&d.resolvingChain==null&&!(d.chain||[]).some(c=>c.chain_size>=intent.link))return intent;
 return {...intent,expired:true};
}
// True when the intent can no longer apply: a different turn, expired unbound, or bound and its link is gone / solved /
// replaced (chain resolved or ended, activation negated and solved, a new chain's link 1 is another instance).
export function removalDone(d,seat,intent){
 if(!intent)return true;if(d.turn!==intent.turn||intent.expired)return true;
 return !!intent.source&&!removalLink(d,seat,intent);
}
// r36 B1 worker-state integration (RELAY-108 section 2). A plan chosen by a route that does not carry removalIntent (the
// worker's aggregate-cap progress plan) keeps the removal intent of the SAME prompt's baseline decision only when its
// response is exactly that intent's activation, for the same seat. Any other response, a missing baseline intent or
// another seat: the plan is returned unchanged. Pure.
export function carryRemovalIntent(plan,baseline,seat){
 const intent=baseline?.removalIntent;
 if(!plan||plan.removalIntent||!intent||intent.seat!==seat||JSON.stringify(plan.response)!==JSON.stringify(intent.activation))return plan;
 return {...plan,removalIntent:intent};
}
const stringIndex=(v,code)=>{try{const n=BigInt(v||0);return n>>20n===BigInt(code)?Number(n&0xFFFFFn):null}catch{return null}};
export function removalFollowUp(d,seat,m,r,intent){
 if(!intent||d.turn!==intent.turn)return null;
 const src=d.currentEffect?.code||d.lastCard;if(src&&src!==intent.code)return null;
 intent=removalBind(d,seat,intent);if(intent.expired)return null;/* RELAY-107 L1 */
 const stages=REMOVAL_STAGES[d.name(intent.code)]||[],at=removalStageAt(d,seat,intent);if(!at)return null;
 if(m.type===M.SELECT_YESNO){
  const st=stages.find(s=>s.at===at&&s.yesno!=null&&stringIndex(m.description,intent.code)===s.yesno);if(!st)return null;
  if(st.role==='control'&&intent.effect==='control')return r?.yes===true?{response:r,stat:'removalVerified',stage:'control'}:{response:{...r,type:R.SELECT_YESNO,yes:true},stat:'removalOverride',stage:'control'};
  return null;
 }
 if(m.type!==M.SELECT_CARD)return null;
 const cards=m.selects||m.select_cards||[];if(!cards.length)return null;
 const st=stages.find(s=>s.at===at&&s.hint===d.hint&&cards.every(c=>s.loc.includes(c.location)));if(!st)return null;
 const picks=r?.indicies||(r?.index!=null?[r.index]:[]),min=m.min??1,max=m.max??cards.length,single=min<=1&&max>=1;
 const set=i=>r?.indicies!==undefined?{...r,indicies:[i]}:{...r,index:i};
 if(st.role==='target'){const i=cards.findIndex(c=>sameCard(d,c,intent.target));if(i<0)return {response:r,stat:'removalMismatch',stage:'target',why:'projected target not offered'};
  if(picks.length===1&&picks[0]===i)return {response:r,stat:'removalVerified',stage:'target'};
  return single?{response:set(i),stat:'removalOverride',stage:'target'}:{response:r,stat:'removalMismatch',stage:'target',why:'selection bounds '+min+'-'+max+' do not allow the single projected target'}}
 if(st.role==='cost'&&intent.costs){if(!cards.every(c=>d.fromEngine(c.controller)===seat))return null;
  const okIdx=cards.map((c,i)=>intent.costs.some(t=>sameCard(d,c,t))?i:-1).filter(i=>i>=0);if(!okIdx.length)return {response:r,stat:'removalMismatch',stage:'cost',why:'no projected cost offered'};
  if(picks.length===1&&okIdx.includes(picks[0]))return {response:r,stat:'removalVerified',stage:'cost'};
  if(!single)return {response:r,stat:'removalMismatch',stage:'cost',why:'selection bounds '+min+'-'+max+' do not allow a single projected cost'};
  const pref=cards.findIndex(c=>sameCard(d,c,intent.preferredCost));return {response:set(pref>=0?pref:okIdx[0]),stat:'removalOverride',stage:'cost'}}
 return null;
}
// Arm B: does this decision skip search? Found lethal (not uncertain), or a direct attack into an empty board.
// r36 S4 flag F (RELAY-117): own effects only in the open chain + the base pilot's decline + a negating card on offer ->
// the decline is played without search (search chose own Ash Blossom on own Zero in the live 71091 play-test). Narrow by
// design: "negate" is a card-text heuristic; this preserves the base decline, it does not evaluate negation. Pure.
export function friendlyChainNoSearch(d,seat,baseline){
 if(!S4.F||d.prompt?.type!==M.SELECT_CHAIN)return null;
 const open=(d.chain||[]).filter(c=>!c.solved);if(!open.length||open.some(c=>c.controller!==seat))return null;
 const ch=d.choices(),decline=ch.find(o=>o.label==='Do not chain');
 if(!decline||JSON.stringify(baseline?.response)!==JSON.stringify(decline.response))return null;
 return ch.some(o=>o!==decline&&/negate/i.test(d.db?.[o.code]?.desc||''))?'friendlyChainNoSearch':null;
}
export function battleNoSearch(d,seat,baseline){const friendly=friendlyChainNoSearch(d,seat,baseline);if(friendly)return friendly;
 if(!MIDGAME.B||!midgameTurn(d)||d.active!==seat)return null;
 const b=baseline.battle;if(b?.lethal&&!b.uncertain&&baseline.rule==='Pursue projected lethal')return 'lethalNoSearch';
 if(d.prompt?.type===M.SELECT_BATTLECMD&&baseline.response?.action===1&&!d.zone(1-seat,4).some(Boolean))return 'directNoSearch';
 return null;
}
// Arm B: going to the End Phase from Main Phase 1 while the visible-board planner has a positive battle line -> Battle Phase.
export function endToBattle(d,seat,r){
 if(!MIDGAME.B||!midgameTurn(d)||d.active!==seat||d.phase!==MAIN1||d.prompt?.type!==M.SELECT_IDLECMD||!d.prompt.to_bp||r?.action!==7)return null;
 const b=thisTurnBattle(d,seat);return b?.steps.length?{type:r.type,action:6,index:null}:null;
}

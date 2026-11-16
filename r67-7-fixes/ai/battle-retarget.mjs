// r67.7 battle-retarget adapter v2 (BR-MID-BATTLE-01/02, ChatGPT RELAY-246 contract; RELAY-254/257 review of v1).
// Self-checked by Claude, pending ChatGPT review and the Seto team.
//
// Problem (RELAY-255): after a battle replay ("continue this attack?" answered Yes) the engine asks for a new attack target, but
// the tactical target rule looked up its attacker by d.lastCard. After a replay that is the card whose effect caused it (the
// opponent's Maiden of White in 11001/11002), so every target scored 0 and the fallback threat ranking sent the attacker into the
// strongest defender.
//
// v2 (ChatGPT R1-R3):
//  1. Typed provenance. The pilot ARMS a single-use token only when it answers SELECT_YESNO description 30 ("continue this
//     attack?") with Yes, and only if the public attack declaration proves the current attacker at that moment. The token binds
//     the engine handle (restart/rewind = new handle), the accepted-response count, the attack event id, the attacker's app seat,
//     Monster Zone slot and code, and the turn.
//  2. Acceptance. The token is honoured only on the prompt whose accepted-response history is exactly one longer and whose last
//     accepted response is that Yes. A refused/retried answer, an unrelated next prompt, or anything accepted in between makes it
//     unusable. No cached target or index is ever reused.
//  3. The current prompt is re-validated before any scoring: SELECT_CARD, min = max = 1, every candidate a current opposing
//     Monster Zone card that joins the public board, battle phase of the same turn, no new attack declared, no event touching the
//     attacker's slot and no malformed move/position/summon payload since the declaration, the attacker still face-up there with
//     the same code.
//  4. Abstention. If the battle comparison can't be trusted (a face-down target, or text the battle model doesn't cover: damage-
//     calculation changes, piercing, "if this card battles", or a destroy-by-battle effect on a card the model expects to be
//     destroyed or lost), the adapter abstains with a reason and the pilot keeps its baseline behaviour.
// Public data only: the attack declaration, zone contents and card text. Engine/app coordinates: events and zones are app seats;
// prompt candidate controllers are engine players (converted with d.fromEngine).
import {M,R} from '../duel.mjs';
export const REPLAY_DESC='30';
const MZONE=4,BATTLE_PHASES=new Set([8,16,32,64,128]);
const slotOk=c=>!!c&&typeof c==='object'&&(c.controller===0||c.controller===1)&&Number.isInteger(c.location)&&Number.isInteger(c.sequence);
const faceUp=c=>!!c&&!c.hidden&&!!((c.position||0)&5);

// The latest public attack declaration this turn by seat p, still intact. Returns {event, card} or {why}.
export function attackProof(d,p){
 const ev=d.events||[];let ai=-1;
 for(let i=ev.length-1;i>=0;i--){const t=ev[i].type;if(t==='attack'){ai=i;break}if(t==='turn')return {why:'no attack declared this turn'}}
 if(ai<0)return {why:'no attack event in the retained history'};
 const a=ev[ai],f=a.from;if(!slotOk(f)||f.controller!==p||f.location!==MZONE||!(Number.isInteger(a.code)&&a.code>0))return {why:'the latest attack is not ours from a Monster Zone'};
 const hit=s=>slotOk(s)&&s.controller===p&&s.location===MZONE&&s.sequence===f.sequence;
 for(const e of ev.slice(ai+1)){
  if(e.type==='turn'||e.type==='attack'||e.type==='win')return {why:'a new turn, attack or game end since the declaration'};
  if(e.type==='phase'&&!BATTLE_PHASES.has(e.phase))return {why:'the battle phase ended'};
  if((e.type==='move'&&!(slotOk(e.from)&&slotOk(e.to)))||(e.type==='position'&&!slotOk(e.from))||(e.type==='summon'&&!((e.player===0||e.player===1)&&Number.isInteger(e.sequence))))return {why:'a malformed move/position/summon event since the declaration'};
  if((e.type==='move'&&(hit(e.from)||hit(e.to)))||(e.type==='position'&&hit(e.from))||(e.type==='summon'&&e.player===p&&e.sequence===f.sequence))return {why:"something touched the attacker's slot"};
 }
 const card=(d.zone(p,MZONE)||[])[f.sequence];
 if(!faceUp(card)||card.code!==a.code)return {why:'the attacker is no longer face-up in its slot with the same code'};
 return {event:a,card};
}

// Called by the pilot after it decides any prompt. Arms the token only for OUR Yes to a proven description-30 replay question;
// any other decision by this pilot drops an older token.
export function armReplayToken(pilot,d,p,m,response){
 if(m?.type===M.SELECT_YESNO&&String(m.description)===REPLAY_DESC&&response?.type===R.SELECT_YESNO&&response.yes===true&&(m.seat??p)===p){
  const proof=attackProof(d,p);
  pilot.replayToken=proof.card?{handle:d.handle,hist:(d.responseHistory||[]).length,attackId:proof.event.id,seat:p,sequence:proof.event.from.sequence,code:proof.event.code,turn:d.turn}:null;
  pilot.retargetLog?.push({at:'arm',ok:!!proof.card,why:proof.why||null,turn:d.turn});return}
 if(pilot.replayToken&&!(m?.type===M.SELECT_CARD))pilot.replayToken=null;/* an unrelated prompt of ours came first */
}

// The text the battle model (tactics.mjs battleOutcome) does NOT cover. Mikanko reflection and "Cannot be destroyed by battle"
// ARE covered there, so they're left out here.
const MODELLED=/Uzuhime the Manifested Mikanko|Ohime the Manifested Mikanko|Hu-Li the Jewel Mikanko|Ha-Re the Sword Mikanko|Ni-Ni the Mirror Mikanko/;
const CALC=/damage calculation|Damage Step|piercing|inflicts? piercing|If this card battles|When this card battles|battles an? |attacks an? Defen[cs]e Position|battle damage/i;
const DESTROYED=/(?<!Cannot be )destroyed by battle/i;
/* "(except during the Damage Step)" only limits WHEN an effect can be used; it changes no battle, so it is not counted. */
const text=(d,c)=>String(d.db?.[c.code]?.desc||'').replace(/Cannot be destroyed by battle/gi,'').replace(/\(except during the Damage Step\)/gi,'');

// At the attack-target prompt: {attacker, targets} when the replay provenance and the prompt both hold; {abstain:why} when it's a
// replay we can't safely judge; null when this isn't a post-replay target prompt at all (the pilot then behaves exactly as before).
export function replayRetarget(d,p,m,pilot,battleOutcome,context,enemy){
 const t=pilot?.replayToken;if(!t)return null;
 const hist=d.responseHistory||[],last=hist.at(-1);
 if(t.handle!==d.handle||hist.length!==t.hist+1||!(last&&last.type===R.SELECT_YESNO&&last.yes===true))return null;/* not the accepted Yes's very next prompt */
 const log=r=>{pilot.retargetLog?.push({at:'target',turn:d.turn,...(r.abstain?{abstain:r.abstain}:{attacker:d.db?.[r.attacker.code]?.name||r.attacker.code})});return r};
 if(m?.type!==M.SELECT_CARD||m.min!==1||m.max!==1)return log({abstain:'not a single-select card prompt'});
 if(d.turn!==t.turn||!BATTLE_PHASES.has(d.phase))return log({abstain:'not the same battle phase'});
 if((d.chain||[]).length)return log({abstain:'a chain is open (an effect choice, not an attack target)'});
 const cands=m.selects||[];if(!cands.length)return log({abstain:'no candidates'});
 const targets=cands.map(c=>({c,t:c.location===MZONE&&d.fromEngine(c.controller)===1-p?enemy.find(e=>e.sequence===c.sequence&&e.controller===1-p):null}));
 if(targets.some(x=>!x.t))return log({abstain:'a candidate is not a current opposing Monster Zone card'});
 const proof=attackProof(d,p);if(!proof.card)return log({abstain:proof.why});
 if(proof.event.id!==t.attackId||proof.event.from.sequence!==t.sequence||proof.card.code!==t.code)return log({abstain:'the attack is not the one the Yes continued'});
 const attacker=proof.card;
 if(CALC.test(text(d,attacker))&&!MODELLED.test(d.db?.[attacker.code]?.name||''))return log({abstain:"the attacker's text changes battle in ways the model doesn't cover"});
 for(const {t:target} of targets){
  if(target.unknown||!faceUp(target))return log({abstain:'a face-down target'});
  const name=d.db?.[target.code]?.name||'';if(CALC.test(text(d,target))&&!MODELLED.test(name))return log({abstain:'a target changes battle in ways the model does not cover: '+name});
  const r=battleOutcome(context,attacker,target);if(r.uncertain)return log({abstain:'uncertain battle outcome'});
  if(r.destroyed&&DESTROYED.test(text(d,target)))return log({abstain:'a target the model expects to destroy has its own battle-destruction effect: '+name});
  if(r.lost&&DESTROYED.test(text(d,attacker)))return log({abstain:'the attacker would be destroyed and has its own battle-destruction effect'});
 }
 return log({attacker,targets});
}

// r35.2 Mikanko damage plan (Claude, 24 Oct 2026). Kevy 15:51/15:54: "had advantage but didn't do anything ... very
// amateur mistakes"; ChatGPT RELAY-040 M40-05/M40-06. SELF-VERIFIED, measured before/after on tuning seeds only.
// Mikanko monsters have 0 ATK. They win by attacking the opponent's monsters while they "reflect" (Uzuhime, Ohime, or
// an equipped Ha-Re / Hu-Li): they are not destroyed and the opponent takes the damage. The ledger (seeds 202, 204, 211)
// showed the AI throwing those damage targets away:
//  - 202: Raigeki destroyed the Thunder King we had given them while two Uzuhime were ready (13200 reflected damage lost).
//  - 211: Lightning Storm (monster mode) destroyed the Lava Golem we had given them, leaving their two set cards.
//  - 204: the only reflector (equipped Hu-Li, facing their 3000 Blue-Eyes) became TY-PHON material before battle.
// Rules (Mikanko only, our own turn):
//  H1 Raigeki / Lightning Storm are held when every opposing monster is a "spent" damage target (a monster we own that
//     sits on their field, e.g. a Kaiju or Lava Golem, or a negated one) and a reflector is ready to attack.
//  H2 Lightning Storm picks the Spell/Trap mode when its monster mode would only hit spent targets.
//  H3 Before battle, a non-Mikanko Extra Deck monster is not summoned when it would need a ready reflector as material
//     while the opponent has a damage target (Attack Position, 1000+ ATK). Main Phase 2 is unaffected.
//  (H4 battle nudge: dropped in r35.2b.)
// Public information only.
import {M,R} from '../../duel.mjs';import {turnLedger} from './turn-ledger.mjs';
const EXTRA_TYPES=64|8192|8388608|67108864,MAIN1=4;
const ALWAYS=/^(Uzuhime the Manifested Mikanko|Ohime the Manifested Mikanko)$/,WHEN_EQUIPPED=/^(Hu-Li the Jewel Mikanko|Ha-Re the Sword Mikanko)$/;
const isMikanko=(d,seat)=>d.decks?.[seat]?.id==='mikanko';
const faceUp=c=>c&&(c.position&5);
// Our face-up monsters that send battle damage back (not negated), in any position.
export function reflectors(d,seat){
 const spells=[...d.zone(seat,8),...d.zone(1-seat,8)].filter(faceUp);
 return d.zone(seat,4).filter(c=>faceUp(c)&&!(c.status&1)).filter(c=>{const n=d.name(c.code);return ALWAYS.test(n)||WHEN_EQUIPPED.test(n)&&spells.some(s=>s.equipCard&&s.equipCard.controller===seat&&s.equipCard.location===4&&s.equipCard.sequence===c.sequence)});
}
const ownerSeat=(d,c)=>c.owner===undefined?null:(d.fromEngine?d.fromEngine(c.owner):c.owner);
// An opposing monster that is only worth attacking: one we own (Kaiju / Lava Golem we gave them) or a negated one.
export const spentTarget=(d,seat,c)=>faceUp(c)&&(ownerSeat(d,c)===seat||!!(c.status&1));
export const damageTargets=(d,seat)=>d.zone(1-seat,4).filter(c=>c&&(c.position&1)&&(c.attack||0)>=1000);
const ourMain1=(d,seat)=>d.active===seat&&d.phase===MAIN1&&d.turn>1;
function onlySpent(d,seat,{attackOnly=false}={}){
 const mons=d.zone(1-seat,4).filter(Boolean).filter(c=>!attackOnly||(c.position&1));
 return mons.length>0&&mons.every(c=>spentTarget(d,seat,c));
}
// r35.2b (Akiza, mikanko-ideal-turn 24 Oct, sections 0, 3.1, 3.4): an opposing monster is a THREAT when it can stop the
// reflection line: face-down (unknown), or a face-up monster with a Quick Effect / negation / attack restriction that is
// not negated and is not one we placed there (our Kaiju / Lava Golem are harmless targets; no Kaiju Counters in this list).
const THREAT=/Quick Effect|negate|cannot be targeted for attacks|cannot be attacked|cannot attack|during either player's turn/i;
export function threat(d,seat,c){if(!c)return false;if(!(c.position&5))return true;if(c.status&1)return false;if(ownerSeat(d,c)===seat)return false;if(/Kaiju/.test(d.name(c.code)))return false;return THREAT.test(d.db[c.code]?.desc||'')}
// H1 + H2 (activation part).
export function mikankoActivationBlock(d,seat,c){
 if(!isMikanko(d,seat)||!ourMain1(d,seat)||c.location===16)return null;
 const n=d.name(c.code),ready=reflectors(d,seat).length>0,mons=d.zone(1-seat,4).filter(Boolean);
 if(n==='Raigeki'&&mons.length){
  if(ready&&onlySpent(d,seat))return 'Mikanko damage plan: their monsters are ones we gave them (or negated) and '+d.name(reflectors(d,seat)[0].code)+' can hit them; keep them as targets (hold Raigeki)';/* RELAY-043 R43-01: no hold without a working reflector */
  const val=x=>(x.position&5)?((x.position&1)?(x.attack||0):(x.defense||0)):0;/* seed 202: holding Raigeki for a 0-DEF token cost a 3300 direct attack */
  if(ready&&!mons.some(x=>threat(d,seat,x))&&mons.some(x=>val(x)>=1500))return 'Mikanko damage plan: nothing of theirs stops '+d.name(reflectors(d,seat)[0].code)+'; their monsters are damage targets (hold Raigeki)';
 }
 if(n==='Forbidden Droplet'&&d.active===seat&&!mons.some(x=>threat(d,seat,x)))return 'Mikanko damage plan: no live threat of theirs to negate; Forbidden Droplet would only halve our damage target (Akiza line A)';
 if(n==='Lightning Storm'&&!d.zone(1-seat,8).some(Boolean)){const atk=mons.filter(x=>x.position&1);if(atk.length&&!atk.some(x=>threat(d,seat,x)))return 'Mikanko damage plan: Lightning Storm would only destroy damage targets and they have no Spells/Traps (Akiza 3.1)'}
 return null;
}
// H2 (mode), Akiza 3.1: Spell/Trap mode when they control a Spell/Trap and either they have a monster for us to hit or
// they have 2+ Spells/Traps (visible count only, never hidden identities).
export function mikankoOption(d,seat,m,text){
 if(!isMikanko(d,seat)||d.name(d.currentEffect?.code||0)!=='Lightning Storm')return null;
 const st=d.zone(1-seat,8).filter(Boolean).length,mons=d.zone(1-seat,4).filter(Boolean);if(!st)return null;
 const atkThreat=mons.some(x=>(x.position&1)&&threat(d,seat,x));
 if(!(onlySpent(d,seat,{attackOnly:true})||(!atkThreat&&(mons.length||st>=2))))return null;
 const i=text.findIndex(t=>/spell/i.test(t)&&/trap/i.test(t));return i>=0?{type:R.SELECT_OPTION,index:i}:null;
}
// RELAY-044 R44-02 (Claude, 28 Oct): can a Link Monster be summoned WITHOUT the reflector? Enumerate subsets of our other
// face-up monsters: each Link material counts as 1 or as its Link Rating, the total must equal the target's rating exactly,
// and the target's printed material line must be met (count, "N+", Effect / non-Link, different names, including a
// LIGHT/DARK monster). A material line this parser doesn't know proves nothing, so H3 keeps blocking (conservative).
const LINK=67108864,EFFECT_T=32,ATTR={LIGHT:16,DARK:32};
export function linkMaterialRule(card){const m=(card?.desc||'').split(/\r?\n/)[0].trim().match(/^(\d+)(\+)?\s+(.*)$/);if(!m)return null;
 const r={min:+m[1],max:m[2]?99:+m[1],filter:()=>true,distinct:false,including:null},rest=m[3];
 if(/^Effect Monsters?$/i.test(rest))r.filter=x=>x.type&EFFECT_T;else if(/^non-Link Monsters?$/i.test(rest))r.filter=x=>!(x.type&LINK);
 else if(/^monsters? with different names$/i.test(rest))r.distinct=true;else if(/^monsters?, including an? (LIGHT|DARK) monster$/i.test(rest))r.including=ATTR[rest.match(/(LIGHT|DARK)/)[1]];
 else if(!/^monsters?$/i.test(rest))return null;return r}
export function linkSetExists(d,others,card,need){const rule=linkMaterialRule(card);if(!rule)return false;
 const c=others.map(x=>({x,db:d.db[x.code]||{}})).filter(o=>rule.filter(o.db));
 const rec=(i,count,sum,codes,inc)=>{if(count>=rule.min&&count<=rule.max&&sum===need&&(!rule.including||inc))return true;if(i>=c.length||count>=rule.max||sum>=need)return false;
  const o=c[i],vals=o.db.type&LINK?[...new Set([1,Math.max(1,(o.db.level||0)&255)])]:[1];
  if(!(rule.distinct&&codes.has(o.x.code)))for(const v of vals)if(rec(i+1,count+1,sum+v,new Set([...codes,o.x.code]),inc||o.db.attribute===rule.including))return true;
  return rec(i+1,count,sum,codes,inc)};
 return rec(0,0,0,new Set(),false)}
// H3.
export function mikankoSpecialBlock(d,seat,c){
 if(!isMikanko(d,seat)||!ourMain1(d,seat))return null;
 const card=d.db[c.code]||{};if(!(card.type&EXTRA_TYPES)||/Mikanko/.test(d.name(c.code)))return null;
 const refl=reflectors(d,seat);if(!refl.length||!damageTargets(d,seat).length)return null;
 const others=d.zone(seat,4).filter(x=>faceUp(x)&&!refl.some(y=>y.sequence===x.sequence));/* zone() returns new objects each call */
 const need=card.type&67108864?Math.max(1,(card.level||0)&255):/TY-PHON/.test(d.name(c.code))?1:2;
 const topAtk=Math.max(0,...d.zone(seat,4).filter(faceUp).map(x=>x.attack||0));
 let usesReflector;
 if(card.type&LINK)usesReflector=!linkSetExists(d,others,card,need);/* RELAY-044 R44-02: a real reflector-free material set, not a rating sum */
 else{const supply=others.length;usesReflector=supply<need||(/TY-PHON/.test(d.name(c.code))&&!others.some(x=>(x.attack||0)===topAtk))}
 return usesReflector?'Mikanko damage plan: '+d.name(c.code)+' would use '+d.name(refl[0].code)+' as material before it attacks their '+d.name(damageTargets(d,seat)[0].code):null;
}
// H4 (battle nudge) was dropped in r35.2b: never exercised on the tuning hands, and optimal-pilot.mjs is pinned.
// r35.2b Akiza E1 (Ohime -> Sanaki -> Fire Dance -> Ha-Re -> Uzuhime) and Fire Dance rules (3.2).
const FD='Mikanko Fire Dance';
// RELAY-043: Fire Dance's once per turn is tracked from this turn's activations (the duel's per-turn ledger), not from a
// face-up copy, which may have been equipped on an earlier turn.
// RELAY-044 (Claude, 28 Oct): Fire Dance's limit is an ACTIVATE limit. Rules (Alexis via Seto 09:10; OCG Q&A 22010): a
// NEGATED ACTIVATION does not count (e.g. Ghost Belle or Solemn: a second copy may be activated); a negated EFFECT (or a
// resolution that applies nothing) does count. This ledger counts every activation of OUR seat that reached the chain this
// turn (the duel's 'activate' events). KNOWN LIMIT (TEST, Seto 09:10): it also counts a negated activation, so after Ghost
// Belle the AI under-plays (never tries the legal second copy; never illegal). The duel's 'negate' event does not say which
// kind of negation happened (CHAIN_NEGATED vs CHAIN_DISABLED); the fix needs that one field (a duel.mjs change, proposed to
// Seto). A selection the core rejected never reaches the chain, so it does not count. Views without events (unit mocks)
// fall back to the per-turn attempt ledger, filtered by controller.
export function fireDanceUsed(d,seat){
 // rev 2 (RELAY-056/057): "this turn" comes from the durable turn ledger (turn-ledger.mjs), not the 120-event buffer.
 // Unknown (events of this turn rolled out unseen) counts as USED: the AI may under-play, never plays illegally.
 if(Array.isArray(d.events)&&d.events.length){const L=turnLedger(d);
  return L.events.some(e=>e.type==='activate'&&(seat===undefined||e.player===seat)&&d.name(e.code)===FD)||!L.complete}
 for(const k of d.attempts?.keys?.()||[]){const [code,ctl]=String(k).split(':');if(d.name(+code)===FD&&(seat===undefined||+ctl===seat))return true}return false}
function fireDanceReady(d,seat){
 if(fireDanceUsed(d,seat))return false;
 return [...d.zone(seat,2),...d.zone(seat,8)].some(c=>c&&d.name(c.code)===FD);
}
// RELAY-043 R43-02: a reflector exists, or a legal line makes one this turn: Uzuhime in the Extra Deck with two
// Level 3 Mikanko available (field, or Sanaki on the field with Ha-Re / Hu-Li still in our Deck). Our own Deck is ours to see.
const L3=/^(Sanaki the Mikanko Devotee|Ha-Re the Sword Mikanko|Hu-Li the Jewel Mikanko)$/;
export function reflectorLine(d,seat){
 // RELAY-044 R44-01 (Claude, 28 Oct): a reflector on the field counts only if it can attack this turn: Attack Position, or
 // Defense Position and free to change position (not summoned this turn, position not already changed).
 if(reflectors(d,seat).some(canAttackPosition))return 'reflector on the field';
 if(!d.zone(seat,64).some(c=>c&&d.name(c.code)==='Uzuhime the Manifested Mikanko'))return null;
 const l3=d.zone(seat,4).filter(c=>faceUp(c)&&L3.test(d.name(c.code)));
 if(l3.length>=2)return 'Uzuhime from two Level 3 Mikanko';
 // Sanaki's route needs its own effect: Sanaki face-up, NOT negated, and its equip trigger (Special Summon from the Deck,
 // once per turn) not yet used this turn, with Ha-Re / Hu-Li (non-Illusion) still in our Deck.
 const sanaki=l3.find(c=>d.name(c.code)==='Sanaki the Mikanko Devotee');
 if(sanaki&&!(sanaki.status&1)&&!sanakiSummonUsed(d,seat)&&d.zone(seat,1).some(c=>c&&/^(Ha-Re|Hu-Li)/.test(d.name(c.code))))return 'Sanaki summons Ha-Re/Hu-Li, then Uzuhime';
 return null;
}
const SUMMONED_OR_MOVED=0x100|0x800|0x20000000|0x40000000;/* STATUS_FORM_CHANGED, SUMMON_TURN, FLIP_SUMMON_TURN, SPSUMMON_TURN */
export const canAttackPosition=c=>!!c&&((c.position&1)||!((c.status||0)&SUMMONED_OR_MOVED));
// Sanaki's "If an Equip Card becomes equipped to this card" Special Summon is its effect 1 (aux.Stringid(id,1) =
// id<<20 | 1). rev 2 (RELAY-056/057): this turn's activations come from the durable turn ledger; unknown (events of this
// turn rolled out unseen) counts as USED, so the Sanaki route is not counted as a reflector line.
export function sanakiSummonUsed(d,seat){const L=turnLedger(d);if(!L)return false;
 for(const e of L.events)if(e.type==='activate'&&e.player===seat&&d.name(e.code)==='Sanaki the Mikanko Devotee'){try{if(BigInt(e.description||0)===(BigInt(e.code)<<20n|1n))return true}catch{}}
 return !L.complete}
// Damage a 0-ATK reflector gets from a monster: ATK in Attack Position, DEF in Defense Position (Seto 21:07: real).
export const targetValue=c=>c&&(c.position&5)?((c.position&1)?(c.attack||0):(c.defense||0)):0;
// Yes/no prompts on our own turn. Returns {yes, reason} or null.
export function mikankoYesNo(d,seat,m){
 if(!isMikanko(d,seat)||d.active!==seat||![M.SELECT_EFFECTYN,M.SELECT_YESNO].includes(m?.type))return null;
 if(m.type===M.SELECT_EFFECTYN&&d.name(m.code)==='Sanaki the Mikanko Devotee'&&m.location===16&&ourMain1(d,seat)&&fireDanceReady(d,seat))
  return {yes:false,reason:'Keep Sanaki in the GY for Mikanko Fire Dance (Akiza E1)'};
 if(m.type===M.SELECT_YESNO&&d.name(d.currentEffect?.code||0)===FD){
  // Akiza 3.2(3): revive only when a reflector will hit it this turn (Battle Phase ahead; the E1 line makes Uzuhime) and
  // they have no equal or better target already; we then pick their highest-ATK monster.
  const best=Math.max(0,...d.zone(1-seat,4).map(targetValue)),line=reflectorLine(d,seat);
  if(!ourMain1(d,seat))return {yes:false,reason:'Decline the opposing revival: no Battle Phase left this turn'};
  if(!line)return {yes:false,reason:'Decline the opposing revival: no reflector now and no legal line to make one this turn (RELAY-043 R43-02)'};
  if(best>=2000)return {yes:false,reason:'Decline the opposing revival: they already have a '+best+' target'};
  return {yes:true,reason:'Revive their best damage target: '+line+' (Akiza 3.2)'};
 }
 return null;
}
// Card picks: the Fire Dance opposing revival takes their highest-ATK monster (Akiza 3.2 c).
export function mikankoPick(d,seat,m,r){
 if(!isMikanko(d,seat)||![M.SELECT_CARD].includes(m?.type)||d.name(d.currentEffect?.code||0)!==FD)return null;
 const cards=m.selects||[];if(!cards.length||cards.some(c=>(d.fromEngine?d.fromEngine(c.controller):c.controller)===seat))return null;
 const atk=c=>Math.max(d.db[c.code]?.attack||0,d.db[c.code]?.defense||0);/* R43-03: the damage it supplies (position picks the higher) */let bi=0;cards.forEach((c,i)=>{if(atk(c)>atk(cards[bi]))bi=i});
 const picks=r?.indicies||[];if(picks.length===1&&picks[0]===bi)return null;return {type:r?.type??5,indicies:[bi]};
}
// Battle position (Alexis MK-Q1: we choose): Lava Golem and every Mikanko in Attack Position; the Fire Dance revival in
// whichever of ATK / DEF is higher (Akiza Rev 2).
export function mikankoPosition(d,seat,m){
 if(!isMikanko(d,seat)||m?.type!==M.SELECT_POSITION||d.active!==seat||!(m.positions&1))return null;
 const n=d.name(m.code),src=d.name(d.currentEffect?.code||0);
 if(src===FD&&!/Mikanko/.test(n)){/* Akiza Rev 2 / Alexis MK-Q1: we choose; the higher of ATK and DEF (0-ATK reflector into DEF deals DEF) */const c=d.db[m.code]||{};const pos=(c.defense||0)>(c.attack||0)&&(m.positions&4)?4:1;return {type:R.SELECT_POSITION,position:pos}}
 if(n==='Lava Golem'||/Mikanko/.test(n))return {type:R.SELECT_POSITION,position:1};
 return null;
}

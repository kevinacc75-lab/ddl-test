// r35 queue item 3, rev 2 (Claude, 28 Oct 2026; RELAY-054 K3-01); rev 4 (Dogma slot, refined never-rule; Seto 09:10). Tri-Brigade Springans Kitt (19304410) revive pick: when
// Kitt is sent to the GY it Special Summons 1 Tri-Brigade / Springans / Fallen of Albaz / Albaz-mentioning monster FROM OUR
// GY IN DEFENSE POSITION, except itself; no target (Alexis, Seto 06:15 and 08:10). Order (Akiza, Seto 07:05): a revived
// Fusion is in Defense and was not Fusion Summoned, so rank on what still works:
//  1. Mirrorjade the Iceblade Dragon - only if we control no Mirrorjade AND a Fusion that mentions Fallen of Albaz is left
//     in our Extra Deck (its Quick Effect cost); otherwise its effect is dead and it is skipped.
//  2. Rindbrumm the Striking Dragon.  3. Albion the Sanctifire Dragon.
//  Main Deck order: Fallen of Albaz > Guiding Quem > Fallen of the White Dragon > Ecclesia > Cartesia > Mercourier >
//     Albion the Shrouded Dragon; going second, Ecclesia and Cartesia move up (Main Phase Quick Effects).
//  4. (rev 4, Akiza via Seto 09:10) The Dragon that Devours the Dogma (76666602), only if its on-Special-Summon shuffle
//     (effect 0) is unused this turn AND at least one card is in any GY or banishment.
//  5. Main Deck order (below).
//  6. Bodies: Dogma when it fails slot 4 (first among the bodies if an "Ecclesia" monster is on the field or in either GY;
//     otherwise after Lubellion - Claude's reading, for Akiza), Titaniklad the Ash Dragon, Alba-Lenatus the Abyss Dragon,
//     Lubellion the Searing Dragon.
//  NEVER Titaniklad, Alba-Lenatus or Dogma when it was sent to the GY this turn, its End Phase search (its own effect
//  index) is unused, AND a legal search target is still in our Deck (rev 4 refinement): reviving throws the search away.
//  rev 5 (RELAY-056/057): "this turn" is read from the durable turn ledger; when it cannot be known (events rolled out),
//  the search counts as pending and Dogma's shuffle as used.
// Only offered cards are ranked (the engine offers only legal ones, never Kitt itself). If nothing is rankable the base
// choice stands. Going second stands in for "opponent's turn" (Seto 07:05: fine for TEST).
import {M} from '../../duel.mjs';import {turnLedger} from './turn-ledger.mjs';
export const KITT=19304410;
const TOP=['Mirrorjade the Iceblade Dragon','Rindbrumm the Striking Dragon','Albion the Sanctifire Dragon'];
const MAIN_FIRST=['Fallen of Albaz','Guiding Quem, the Virtuous','Fallen of the White Dragon','Incredible Ecclesia, the Virtuous','Blazing Cartesia, the Virtuous','Tri-Brigade Mercourier','Albion the Shrouded Dragon'];
const MAIN_SECOND=['Fallen of Albaz','Incredible Ecclesia, the Virtuous','Blazing Cartesia, the Virtuous','Guiding Quem, the Virtuous','Fallen of the White Dragon','Tri-Brigade Mercourier','Albion the Shrouded Dragon'];
const DOGMA='The Dragon that Devours the Dogma',BODIES=['Titaniklad the Ash Dragon','Alba-Lenatus the Abyss Dragon','Lubellion the Searing Dragon'];
// End Phase "sent to the GY this turn" searches: the effect's aux.Stringid index, and what it can fetch from our Deck.
const isMon=c=>c.type&1,isNormalSpell=c=>c.type===2;
export const EP_SEARCH={'Titaniklad the Ash Dragon':{index:0,target:(n,c)=>isMon(c)&&(/Dogmatika/.test(n)||n==='Fallen of Albaz')},
 'Alba-Lenatus the Abyss Dragon':{index:0,target:(n,c)=>isNormalSpell(c)&&/Polymerization|Fusion/.test(n)},
 [DOGMA]:{index:1,target:n=>/Dogmatika|Tri-Brigade/.test(n)}};
const FUSION=0x40;
// This turn's events come from the durable turn ledger (turn-ledger.mjs): the duel keeps only its last 120 events, so a
// long turn can roll the evidence out. Each check answers true / false / null (unknown: the ledger may have missed events
// of this turn) and every caller treats unknown conservatively.
function thisTurn(d){const L=turnLedger(d);return L||{events:[],complete:true}/* no events array (unit mock): nothing happened */}
const known=(found,L)=>found?true:L.complete?false:null;
export function sentToGyThisTurn(d,seat,code){const L=thisTurn(d);return known(L.events.some(e=>e.type==='move'&&e.code===code&&e.to?.location===16&&(e.to.controller??seat)===seat),L)}
export function activatedThisTurn(d,seat,code,index=null){const L=thisTurn(d);return known(L.events.some(e=>e.type==='activate'&&e.player===seat&&e.code===code&&(index===null||(()=>{try{return BigInt(e.description||0)===(BigInt(code)<<20n|BigInt(index))}catch{return false}})())),L)}
// Unknown counts as PENDING (never revive a card that may still owe its End Phase search).
export function epSearchPending(d,seat,code){const ep=EP_SEARCH[d.name(code)];if(!ep)return false;
 if(sentToGyThisTurn(d,seat,code)===false||activatedThisTurn(d,seat,code,ep.index)===true)return false;
 return d.zone(seat,1).some(c=>c&&ep.target(d.name(c.code),d.db[c.code]||{}))/* rev 4: only if the search has a target */}
// Unknown counts as USED (slot 4 is denied; Dogma falls back to a body).
export function dogmaSlot4(d,seat,code){if(activatedThisTurn(d,seat,code,0)!==false)return false;/* its shuffle is hard once per turn */
 return [0,1].some(p=>[...d.zone(p,16),...d.zone(p,32)].some(Boolean))}
const ecclesiaAround=d=>[0,1].some(p=>[...d.zone(p,4),...d.zone(p,16)].some(c=>c&&/Ecclesia/.test(d.name(c.code))));
export function mirrorjadeLive(d,seat){
 if(d.zone(seat,4).some(c=>c&&(c.position&5)&&d.name(c.code)==='Mirrorjade the Iceblade Dragon'))return false;/* "You can only control 1" */
 return d.zone(seat,64).some(c=>c&&(d.db[c.code]?.type&FUSION)&&/"Fallen of Albaz"/.test(d.db[c.code]?.desc||''));
}
export function kittReviveOrder(d,seat,dogmaCode=null){const first=d.order?.[0]===seat,main=first?MAIN_FIRST:MAIN_SECOND;
 const slot4=dogmaCode!==null&&dogmaSlot4(d,seat,dogmaCode);
 return [...TOP,...(slot4?[DOGMA]:[]),...main,...(!slot4&&ecclesiaAround(d)?[DOGMA]:[]),...BODIES,...(!slot4&&!ecclesiaAround(d)?[DOGMA]:[])]}
export function kittRevivePick(d,seat,m,response){
 if(m?.type!==M.SELECT_CARD||d.hint!==509||d.currentEffect?.code!==KITT||!response)return null;
 const cards=m.selects||[],dg=cards.find(c=>d.name(c.code)===DOGMA),order=kittReviveOrder(d,seat,dg?dg.code:null);
 const ok=c=>{const n=d.name(c.code);if(n==='Mirrorjade the Iceblade Dragon'&&!mirrorjadeLive(d,seat))return false;if(EP_SEARCH[n]&&epSearchPending(d,seat,c.code))return false;return true};
 const ranked=cards.map((c,i)=>({i,c,p:order.indexOf(d.name(c.code))})).filter(x=>x.p>=0&&ok(x.c)).sort((a,b)=>a.p-b.p);
 const picks=response.indicies||[];
 // A base choice the never-rules forbid is replaced by any other offered card (ranked first, else the first allowed one).
 const baseBad=picks.length&&!ok(cards[picks[0]]);
 const best=ranked[0]?.i??(baseBad?cards.findIndex(c=>ok(c)):-1);
 if(best<0||picks.includes(best)&&!baseBad)return null;if(best===picks[0])return null;
 return {response:{...response,indicies:[best,...picks.filter(i=>i!==best)].slice(0,Math.max(1,picks.length))},rule:'Tri-Brigade Springans Kitt revive (Akiza 07:05)',card:d.name(cards[best].code)};
}

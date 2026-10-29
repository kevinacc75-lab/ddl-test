// r36 Time Typhoon plan (Claude, 29 Oct 2026; Kevy: "implement this deck, full AI brain and combo book"). STATUS: DRAFT,
// SELF-VERIFIED (builder = verifier); Akiza (lines) / Alexis (rulings) review pending.
// Deck: K9 Radiant Typhoon Dark Time Wizard (Kevy's list, 29 Oct). Every rule below was written from the printed card
// texts (ProjectIgnis release-betb.cdb / our cards.json), NOT from the playbook PDF, which has several wrong texts.
// The decisions the generic book format can't express:
//  P1 Dark Time Wizard mode. Search on our turn when there is nothing worth the coin. The coin (destroy all their monsters
//     + burn half their original ATK, or destroy all of ours) is worth it when they control a face-up monster and either
//     Red-Eyes Black Dragon Exceed can follow (either result destroys a monster with DTW's effect, which is Exceed's
//     condition; a wrong call leaves their monsters to Tribute) or their board is worth more than ours.
//  P2 Holds: Dark Time Wizard is not spent in our own Draw/Standby chain windows (the book plays it in the Main Phase);
//     with its search used this turn and the coin not worth it, it is held. Graceful & Skull Dice is not activated from
//     the hand/field with no opposing face-up monster (it only shrinks theirs; its GY pop stays live). Sleepy
//     Scapegoats is held on our own turn (Fusion-only Extra Deck for the rest of the turn) and used on theirs.
//  P3 Picks: Swiftwind Panther Warrior Tributes a spent body (Invoker, a used Radiant Typhoon, a Scapegoat Token) or a
//     dead hand monster, never a starter; it summons Alligator's Dragon Knight while Alligator's search is unused.
//     Alligator adds Dark Time Wizard + Foolish Graverobber / Reversal Box and discards Graceful & Skull Dice first.
//     Red-Eyes Black Dragon Exceed Tributes their best face-up monster. Radiant Typhoon searches fetch the missing Level 3.
//  P4 CXyz Hope Chaos Barian Dragon never detaches its "Number C" material (Seto/Alexis 29 Oct R6: the lock needs it).
// Public information only (own hand/field/GY/Deck contents are our own; opposing face-up cards).
import {M,R} from '../../duel.mjs';
import {activatedThisTurn} from './kitt-revive.mjs';
const EXTRA_TYPES=64|8192|8388608|67108864,MAIN1=4,MAIN2=256;
const DTW='Dark Time Wizard',ALLI="Alligator's Dragon Knight",PANTHER='Swiftwind Panther Warrior',EXCEED='Red-Eyes Black Dragon Exceed';
const BARIAN='CXyz Hope Chaos Barian Dragon';
const ELDAM='Radiant Typhoon Eldam',SWEN='Radiant Typhoon Swen',CHANT='Radiant Typhoon Chant';
const isDtw=(d,seat)=>d.decks?.[seat]?.id==='dtw';
const faceUp=c=>c&&(c.position&5);
const names=(d,list)=>list.filter(Boolean).map(c=>d.name(c.code));
const own=(d,c,seat)=>(d.fromEngine?d.fromEngine(c.controller):c.controller)===seat;
// How much a monster matters (same scale as book.mjs oppValue: Extra Deck bosses and Quick Effects first, then ATK).
export function value(d,c){const card=d.db[c.code]||{},desc=card.desc||'';let v=(c.attack??card.attack??0);if(card.type&EXTRA_TYPES)v+=3000;if(/Quick Effect|during either player's turn|negate/i.test(desc))v+=1500;if(card.type&32)v+=300;if(!(c.position&5))v-=500;return Math.max(0,v)}
const CODES=new Map();
const codeOf=(d,name)=>{if(!CODES.has(name))CODES.set(name,+Object.keys(d.db).find(k=>d.db[k].name===name&&!d.db[k].alias)||0);return CODES.get(name)};
const used=(d,seat,name,index=null)=>activatedThisTurn(d,seat,codeOf(d,name),index);
// Alligator's search is its Stringid(id,1) trigger (its hand Special Summon is Stringid(id,0)).
const alliSearched=(d,seat)=>used(d,seat,ALLI,1);
// Per-duel memory of our own Dark Time Wizard mode choices this turn (the two modes share one activation description).
const MODES=new WeakMap();
const modeKey=d=>d.decks||d;
function modeState(d){const k=modeKey(d);let s=MODES.get(k);if(!s||s.turn!==d.turn){s={turn:d.turn,search:false,coin:false};MODES.set(k,s)}return s}
// P1: is the coin worth it right now?
export function coinWorth(d,seat){
 const theirs=d.zone(1-seat,4).filter(faceUp);if(!theirs.length)return false;
 const ours=d.zone(seat,4).filter(Boolean),exceedReady=d.zone(seat,64).some(c=>c&&d.name(c.code)===EXCEED)&&used(d,seat,EXCEED)!==true;
 if(exceedReady)return true;
 const sum=l=>l.reduce((s,c)=>s+value(d,c),0);return sum(theirs)>=sum(ours);
}
export function dtwOption(d,seat,m,text){
 if(!isDtw(d,seat)||m?.type!==M.SELECT_OPTION)return null;
 const source=d.name(d.currentEffect?.code||0),pick=re=>{const i=text.findIndex(t=>re.test(t));return i>=0?{type:R.SELECT_OPTION,index:i}:null};
 if(source===DTW){const st=modeState(d),coin=coinWorth(d,seat),r=coin?pick(/coin/i)||pick(/search/i):pick(/search/i)||pick(/coin/i);
  if(r){if(/coin/i.test(text[r.index]))st.coin=true;else st.search=true}return r}
 if(source===PANTHER){/* the AI view hides our Deck's contents: the summon prompt itself only offers legal targets */const alliReady=alliSearched(d,seat)!==true;
  const fisherHit=d.zone(1-seat,4).some(faceUp);
  return alliReady||fisherHit?pick(/special summon/i):pick(/send/i)||pick(/special summon/i)}
 if(source===CHANT){const have=n=>names(d,[...d.zone(seat,2),...d.zone(seat,4)]).includes(n);
  return !have(ELDAM)||!have(SWEN)?pick(/Radiant Typhoon/i):pick(/Mystical Space Typhoon/i)}
 return null;
}
// P2
export function dtwActivationBlock(d,seat,c){
 if(!isDtw(d,seat))return null;const n=d.name(c.code);
 if(n===DTW&&c.location!==16){
  if(d.active===seat&&d.prompt?.type===M.SELECT_CHAIN&&d.phase!==MAIN1&&d.phase!==MAIN2&&!coinWorth(d,seat)&&!(d.chain?.length&&d.chain.at(-1).controller!==seat))return 'Time Typhoon P2: Dark Time Wizard waits for the Main Phase (its search starts the combo there)';
  const st=modeState(d);if(st.search&&!coinWorth(d,seat))return 'Time Typhoon P2: Dark Time Wizard\'s search is used this turn and the coin is not worth it';
 }
 // P4 (Seto/Alexis 29 Oct, R6): the add-lock needs a "Number C" material; Barian's own detach must never take it.
 if(n===BARIAN&&c.location===4){const me=d.zone(seat,4).find(x=>x&&x.code===c.code&&x.sequence===c.sequence)||d.zone(seat,4).find(x=>x&&x.code===c.code);const mats=(me?.overlayCards||[]).map(code=>d.name(code));
  if(mats.length&&!mats.some(x=>!/^Number C/.test(x)))return 'Time Typhoon P4: Hope Chaos Barian Dragon keeps its Number C material (detaching it would end the lock)'}
 if(n==='Graceful & Skull Dice'&&(c.location===2||c.location===8)&&!d.zone(1-seat,4).some(faceUp))return 'Time Typhoon P2: Graceful & Skull Dice only shrinks their monsters (none face-up); keep it for the GY pop';
 if(n==='Sleepy Scapegoats'&&c.location!==16&&d.active===seat)return 'Time Typhoon P2: Sleepy Scapegoats locks us to Fusion Monsters for the rest of the turn; use it on their turn';
 return null;
}
// P3 picks. rank(card, i) -> number (higher is better) or null (no preference). Returns the replaced response or null.
function choose(d,m,response,rank,rule,{distinct=false,count=null}={}){
 const cards=m.selects||m.select_cards||[];const scored=cards.map((c,i)=>({i,s:rank(c,i,d),n:d.name(c.code)})).filter(x=>x.s!=null).sort((a,b)=>b.s-a.s||a.i-b.i);
 if(!scored.length)return null;
 if(m.type===M.SELECT_UNSELECT_CARD){/* one card at a time: picked cards are listed in m.unselects */const chosen=new Set((m.unselect_cards||m.unselects||[]).map(c=>d.name(c.code)));
  const ok=scored.filter(x=>!(distinct&&chosen.has(x.n)));if(!ok.length)return null;
  if(response.index==null){/* the base finished early: carry on while 'count' wants more */if(!(count&&chosen.size<count))return null;return {response:{...response,index:ok[0].i},rule,card:ok[0].n}}
  if(response.index>=cards.length)return null;/* an 'Unselect' answer is left alone */const best=ok[0].i;if(best===response.index)return null;return {response:{...response,index:best},rule,card:ok[0].n}}
 const base=response.indicies||[];if(!base.length)return null;const want=[],seen=new Set(),n0=Math.max(base.length,Math.min(count??0,m.max??base.length));
 for(const x of scored){if(want.length>=n0)break;if(distinct&&seen.has(x.n))continue;want.push(x.i);seen.add(x.n)}
 for(const i of base){if(want.length>=n0)break;const n=d.name(cards[i].code);if(!want.includes(i)&&!(distinct&&seen.has(n))){want.push(i);seen.add(n)}}
 if(want.length<base.length||(want.length===base.length&&want.every((i,k)=>i===base[k])))return null;
 return {response:{...response,indicies:want},rule,card:d.name(cards[want[0]].code)};
}
// rank by name: higher is better; cards not in the list get no preference.
const ORDER=list=>(c,i,d)=>{const n=typeof c==='string'?c:d.name(c.code);const k=list.indexOf(n);return k<0?null:list.length-k};
export function dtwPick(d,seat,m,response){
 if(!isDtw(d,seat)||![M.SELECT_CARD,M.SELECT_UNSELECT_CARD].includes(m?.type)||!response)return null;
 const source=d.name(d.currentEffect?.code||0),h=d.hint,hand=names(d,d.zone(seat,2)),field=names(d,d.zone(seat,4).filter(faceUp)),inHand=n=>hand.includes(n),onField=n=>field.includes(n);
 const handOrField=n=>inHand(n)||onField(n),alliDone=alliSearched(d,seat)===true;
 const nm=c=>d.name(c.code);
 // P4: Hope Chaos Barian Dragon detaches anything but its Number C material.
 if(source===BARIAN&&h===519)return choose(d,m,response,c=>/^Number C/.test(nm(c))?-100:10,'Time Typhoon P4: Barian never detaches its Number C (the add-lock)');
 // Swiftwind Panther Warrior: the Tribute (cost) and the monster it summons.
 if(source===PANTHER&&h===500)return choose(d,m,response,c=>{const n=nm(c);
   if(c.location===4){if(!own(d,c,seat))return null;if(/Token/.test(n))return 95;if(n==='M-X-Saber Invoker')return 100;if(n===ELDAM||n===SWEN)return 90;if(n==='Totem Bird'||/Gossip Shadow/.test(n))return 60;if(n==='Fisherman of Legend')return 55;return -100}
   if(n==='Mulcharmy Fuwalos')return 70;if(n==='Fisherman of Legend')return 50;if((n===ELDAM||n===SWEN)&&hand.filter(x=>x===n).length>1)return 40;if(n==='K9-ØØ Lupis')return 30;if(n==='Ash Blossom & Joyous Spring')return 10;
   if(n===ELDAM||n===SWEN||n===ALLI)return -60;return 0},'Time Typhoon P3: Panther Tributes a spent body or a dead hand monster');
 if(source===PANTHER&&h===509)return choose(d,m,response,c=>{const n=nm(c);if(n===ALLI)return alliDone?40:100;if(n==='Fisherman of Legend')return d.zone(1-seat,4).some(faceUp)?90:50;return 10},'Time Typhoon P3: Panther summons Alligator while its search is unused');
 if(source===PANTHER&&h===504)return choose(d,m,response,ORDER(['Graceful & Skull Dice','Foolish Graverobber','Sleepy Scapegoats','Reversal Box']),'Time Typhoon P3: Panther sends Graceful & Skull Dice (GY pop)');
 // Alligator's Dragon Knight: up to 2 different Dark Time Wizard Spells/Traps, then discard 1.
 if(source===ALLI&&h===506)return choose(d,m,response,c=>{const n=nm(c);const base={[DTW]:inHand(DTW)?40:100,'Foolish Graverobber':90,'Reversal Box':80,'Sleepy Scapegoats':70,'Graceful & Skull Dice':60}[n];return base??null},'Time Typhoon P3: Alligator adds Dark Time Wizard + Foolish Graverobber',{distinct:true,count:2});
 if(source===ALLI&&h===501)return choose(d,m,response,c=>{const n=nm(c),dup=hand.filter(x=>x===n).length>1;
   const s={'Graceful & Skull Dice':100,'Mulcharmy Fuwalos':d.zone(seat,4).some(Boolean)||d.zone(seat,8).some(Boolean)?90:20,'Fire Formation - Tenki':onField(PANTHER)||used(d,seat,PANTHER)===true?75:30,'Mystical Space Typhoon':dup?80:45,'Fisherman of Legend':55,'Pot of Prosperity':50,'Chaotic Elements':35,'Infinite Impermanence':20,'Ash Blossom & Joyous Spring':15,[DTW]:dup?60:5,[ELDAM]:dup?65:10,[SWEN]:dup?65:10,'K9-17 Izuna':dup?40:5,'K9-66a Jokul':5,[ALLI]:dup?45:5,[PANTHER]:dup?45:8,'Foolish Graverobber':4,'Reversal Box':4,'Sleepy Scapegoats':6}[n];return s??25},'Time Typhoon P3: Alligator discards Graceful & Skull Dice (its GY pop) or a dead card');
 // Dark Time Wizard's search: Alligator when a Dark Time Wizard card stays in hand to reveal, else Panther (Normal Summon + Tribute).
 if(source===DTW&&h===506){const mentions=hand.filter(n=>n!==DTW&&/^(Swiftwind Panther Warrior|Fisherman of Legend|Sleepy Scapegoats|Graceful & Skull Dice|Foolish Graverobber|Reversal Box|Alligator's Dragon Knight)$/.test(n)).length+(hand.filter(n=>n===DTW).length>0?1:0);
  const order=!alliDone?(mentions>0?[ALLI,PANTHER]:[PANTHER,ALLI]):['Reversal Box','Sleepy Scapegoats','Graceful & Skull Dice','Fisherman of Legend',PANTHER,'Foolish Graverobber',ALLI];
  return choose(d,m,response,c=>{const n=nm(c),r=ORDER(order)(n,0,d);if(r==null)return null;return (handOrField(n)&&!/^(Graceful & Skull Dice)$/.test(n))?r-20:r},'Time Typhoon P3: Dark Time Wizard searches '+order[0])}
 // Red-Eyes Black Dragon Exceed: Tribute their best face-up monster; revive Alligator (search again) or our best body.
 if(source===EXCEED&&h===500)return choose(d,m,response,c=>own(d,c,seat)?-1:value(d,c),'Time Typhoon P3: Exceed Tributes their best monster');
 if(source===EXCEED&&h===509)return choose(d,m,response,c=>{const n=nm(c);if(n===ALLI)return alliSearched(d,seat)===true?50:100;if(n==='K9-17 Izuna')return 70;if(n===PANTHER)return 60;return (c.attack||0)/100},'Time Typhoon P3: Exceed revives Alligator or our best body');
 // Foolish Graverobber: send Graceful & Skull Dice; revive the best monster from either GY; Set Dark Time Wizard back.
 if(source==='Foolish Graverobber'&&h===504)return choose(d,m,response,ORDER(['Graceful & Skull Dice','Sleepy Scapegoats',DTW,'Reversal Box',PANTHER,'Fisherman of Legend',ALLI]),'Time Typhoon P3: Graverobber sends Graceful & Skull Dice');
 if(source==='Foolish Graverobber'&&h===509)return choose(d,m,response,c=>value(d,c),'Time Typhoon P3: Graverobber revives the best monster from either GY');
 // Radiant Typhoon: fetch the missing Level 3 first, then Mystical Space Typhoon.
 if(source===ELDAM&&h===506)return choose(d,m,response,ORDER(handOrField(SWEN)?['Mystical Space Typhoon',SWEN]:[SWEN,'Mystical Space Typhoon']),'Time Typhoon P3: Eldam adds the missing Level 3');
 if(source===SWEN&&h===506)return choose(d,m,response,ORDER(handOrField(ELDAM)||inHand(CHANT)?['Mystical Space Typhoon',CHANT]:[CHANT,'Mystical Space Typhoon']),'Time Typhoon P3: Swen adds Chant when Eldam is missing');
 if(source===CHANT&&h===506)return choose(d,m,response,ORDER(handOrField(SWEN)?[ELDAM,SWEN]:handOrField(ELDAM)?[SWEN,ELDAM]:[ELDAM,SWEN]),'Time Typhoon P3: Chant adds the missing Level 3 (Eldam first: it then adds Swen)');
 return null;
}

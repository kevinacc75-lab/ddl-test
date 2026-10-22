// r18b (TASK a2): opening book + "never pass with a live hand" + spell/trap set/hold/activate rules.
// The book never forces a move and never bypasses legality: it only reorders what the base policy offers first.
// r30: with book-trust on (the default for decks with a book), a book step is played as written; search still decides
// where the book is silent, our own-turn passes and the opponent's turn. With trust off (Mikanko), search scores the book
// step against the base policy's own choice and the other legal options.
// Only this seat's own hand, own field/GY/Extra Deck, public opposing cards and the public deck id are read.
import {M,R} from '../../duel.mjs';
import {GAME_PLANS} from '../../game-plans.mjs';
import branded from './branded-lines.mjs';
import brandedBrain from '../brain/branded-brain.mjs';
import kashtira from './kashtira-lines.mjs';
import blueeyes from './blueeyes-lines.mjs';
import luna from './luna-lines.mjs';
import toon from './toon-lines.mjs';
import hero from './hero-lines.mjs';
import mikanko from './mikanko-lines.mjs';

// r27 (Kevy 22 Oct: "ensure they are actually playing the deck optimally"): books for more decks.
export const BOOKS={branded,kashtira,blueeyes,toon,luna,hero,mikanko};/* r31: the Sky Striker draft (tools/drafts/sky-lines-draft.mjs) did not beat the base AI on 20 hands, so it is not shipped */
const MAIN1=4,MAIN2=256;
const EXTRA_TYPES=64|8192|8388608|67108864;
const names=(d,list)=>list.filter(Boolean).map(c=>d.name(c.code));
const ownMain=(d,seat)=>d.active===seat&&(d.phase===MAIN1||d.phase===MAIN2);
const deckId=(d,seat)=>d.decks?.[seat]?.id||null;
const albazFusion=(d,c)=>!!c&&!!(d.db[c.code]?.type&64)&&/Fallen of Albaz/.test(d.db[c.code]?.desc||'');

export function newBookState(){return {turn:-1,line:null,stats:{steps:0,picks:0,sets:0,holds:0,passivePrevented:0,passivePass:0,ttt:0}}}

function ctx(d,seat){
 const hand=d.zone(seat,2).filter(Boolean),field=d.zone(seat,4).filter(Boolean),st=d.zone(seat,8).filter(Boolean),gy=d.zone(seat,16).filter(Boolean);
 const enemyFaceUp=d.zone(1-seat,4).filter(c=>c&&(c.position&5));
 return {seat,hand,handNames:names(d,hand),field,st,gy,enemyFaceUp,opp:deckId(d,1-seat),first:d.order?.[0]===seat};
}
function conditionalOk(d,book,card,c){
 const rule=(book?.conditionalStarters||[]).find(x=>x.card===card);if(!rule)return true;
 if(rule.ifHandAny)return rule.ifHandAny.some(n=>c.handNames.includes(n));
 if(rule.ifAlbazOnFieldOrGY)return [...c.field,...c.gy].some(x=>d.name(x.code)==='Fallen of Albaz');
 return true;
}
// A Level 12 Synchro from a Level 4 Tuner + two Level 4 non-Tuners, so a Level 8+ payoff is never the material.
function lv4SynchroOk(d,c){const lv4=c.field.filter(x=>(x.position&5)&&(x.level||(d.db[x.code]?.level||0)&255)===4&&!(d.db[x.code]?.type&EXTRA_TYPES));const tuners=lv4.filter(x=>d.db[x.code]?.type&4096).length;return tuners>=1&&lv4.length-tuners>=2}
// r33 (Branded deck brain, Kevy 22 Oct 23:29): going first with no fusion spell left, Super Polymerization can still Fusion
// Summon Lubellion from our own field ("Fallen of Albaz" by name + another DARK monster), and Lubellion's own effect then
// makes Mirrorjade. True when that is on: our Main Phase, no opposing monster, Super Polymerization plus a card to discard,
// both Fusion Monsters still in the Extra Deck and no Mirrorjade on our field yet.
export function superPolyOwnFusion(d,seat){
 if(!ownMain(d,seat)||d.zone(1-seat,4).some(Boolean)||d.chain?.length)return false;/* not as a response to our own effect (seed 122) */
 const hand=d.zone(seat,2).filter(Boolean),names=hand.map(x=>d.name(x.code));if(!names.includes('Super Polymerization')||hand.length<2)return false;
 const ed=d.zone(seat,64).filter(Boolean).map(x=>d.name(x.code));if(!ed.includes('Lubellion the Searing Dragon')||!ed.includes('Mirrorjade the Iceblade Dragon'))return false;
 const mine=d.zone(seat,4).filter(x=>x&&(x.position&5));if(mine.some(x=>d.name(x.code)==='Mirrorjade the Iceblade Dragon'))return false;
 // Not when another Fusion route is still in hand or on the field (seen, seed 122: it spent Super Polymerization and Cartesia
 // for a Mirrorjade that Cartesia would have made anyway).
 if([...names,...d.zone(seat,4).filter(Boolean).map(x=>d.name(x.code))].some(n=>['Branded Fusion','Branded in Red','Fusion Deployment','Blazing Cartesia, the Virtuous','Aluber the Jester of Despia','Branded Opening'].includes(n)))return false;
 const albazName=x=>['Fallen of Albaz','Fallen of the White Dragon','Albion the Shrouded Dragon'].includes(d.name(x.code)),dark=x=>((x.attribute||d.db[x.code]?.attribute)&32)!==0;
 return mine.some(a=>albazName(a)&&mine.some(b=>b!==a&&dark(b)&&!(d.db[b.code]?.type&EXTRA_TYPES)))}
function whenOk(d,book,w={},c){
 if(w.ownMain===false)return false;
 if(w.hand&&!w.hand.every(n=>c.handNames.includes(n)))return false;
 if(w.notHand&&w.notHand.some(n=>c.handNames.includes(n)))return false;
 if(w.handMin&&c.hand.length<w.handMin)return false;
 if(w.oppFaceUp&&c.enemyFaceUp.length<w.oppFaceUp)return false;
 if(w.oppNone&&d.zone(1-c.seat,4).some(Boolean))return false;
 if(w.handAnyCond&&!(c.handNames.includes(w.handAnyCond)&&conditionalOk(d,book,w.handAnyCond,c)))return false;
 // r26 (Branded v5.3 book): field / any-of / going-first / Level-4 Tuner synchro conditions.
 if(w.handAny&&!w.handAny.some(n=>c.handNames.includes(n)))return false;
 if(w.field&&!w.field.every(n=>c.field.some(x=>d.name(x.code)===n)))return false;
 if(w.fieldAny&&!w.fieldAny.some(n=>c.field.some(x=>d.name(x.code)===n)))return false;
 if(w.first&&!c.first)return false;
 if(w.lv4Synchro&&!lv4SynchroOk(d,c))return false;
 // r32 (going second / board breaking): going-second only, opposing board size, own GY and field-absence conditions.
 if(w.second&&c.first)return false;
 if(w.oppMonstersMin&&d.zone(1-c.seat,4).filter(Boolean).length<w.oppMonstersMin)return false;
 if(w.gyAny&&!w.gyAny.some(n=>c.gy.some(x=>d.name(x.code)===n)))return false;
 if(w.notField&&w.notField.some(n=>c.field.some(x=>d.name(x.code)===n)))return false;
 if(w.superPolyOwnFusion&&!superPolyOwnFusion(d,c.seat))return false;/* r33 */
 return true;
}
const KEY={activate:['activates',5],summon:['summons',0],special:['special_summons',1]};
// Find the legal IDLECMD response for one book step, or null. `blocked(c,key,i)` is the pilot's own activation/exclusion check.
function legalStep(d,m,step,blocked){
 const [key,action]=KEY[step.do]||[];if(!key||!m[key])return null;
 for(let i=0;i<m[key].length;i++){const c=m[key][i];if(d.name(c.code)!==step.card)continue;
  if(action===5&&(d.attempts?.get(d.key(c))||0)>0)continue;
  if(blocked?.(c,key,i))continue;
  return {type:R.SELECT_IDLECMD,action,index:i,card:step.card};
 }
 return null;
}

// Next book step for this IDLECMD prompt, or null when no line applies (the base policy then decides).
export function idleStep(d,seat,m,state,blocked){
 if(m?.type!==M.SELECT_IDLECMD||!ownMain(d,seat))return null;
 const c=ctx(d,seat),book=BOOKS[deckId(d,seat)];
 if(state.turn!==d.turn){state.turn=d.turn;state.line=null}
 // S-TTT (all decks): Triple Tactics Talent is a Normal Spell; once it is offered its condition is met: use it.
 const ttt=legalStep(d,m,{do:'activate',card:'Triple Tactics Talent'},blocked);if(ttt)return {...ttt,line:'G-04',rule:'S-TTT'};
 if(!book)return null;
 const lines=book.lines.filter(l=>l.id!=='G-04');
 const current=lines.find(l=>l.id===state.line);
 if(current)for(const step of current.steps){const r=legalStep(d,m,step,blocked);if(r)return {...r,line:current.id}}
 for(const line of lines){if(!whenOk(d,book,line.when,c))continue;
  for(const step of line.steps){const r=legalStep(d,m,step,blocked);if(r){state.line=line.id;return {...r,line:line.id}}}
 }
 return null;
}

const DRAW_SPELLS=['Upstart Goblin','Pot of Desires','Pot of Prosperity','Pot of Extravagance','Pot of Duality','Allure of Darkness'];
// Starters for the passive-pass rule: the book's starters for this deck, else the deck's game-plan starters.
function starterNames(d,seat,c){
 const book=BOOKS[deckId(d,seat)],plan=GAME_PLANS[deckId(d,seat)];
 const list=new Set([...(book?.starters||[]),...(plan?.starters||[]),...(plan?.extenders||[]).filter(n=>/Opening|Deployment/.test(n))]);
 // r32.1 (Kevy's recording 22 Oct 22:53, 0:08): Sky Striker ended turn 1 with two Upstart Goblins in hand. Plain draw
 // spells always count as live plays, for every deck.
 for(const n of DRAW_SPELLS)list.add(n);
 for(const r of book?.conditionalStarters||[])if(conditionalOk(d,book,r.card,c))list.add(r.card);
 return list;
}
// A live starter play offered right now (activation or summon), or null.
export function liveStarter(d,seat,m,blocked){
 if(m?.type!==M.SELECT_IDLECMD||!ownMain(d,seat))return null;
 const c=ctx(d,seat),starters=starterNames(d,seat,c);
 for(const [key,action] of [['activates',5],['summons',0],['special_summons',1]])for(let i=0;i<(m[key]||[]).length;i++){
  const card=m[key][i],n=d.name(card.code);if(!starters.has(n))continue;
  if(action===5&&(d.attempts?.get(d.key(card))||0)>0)continue;
  if(blocked?.(card,key,i))continue;
  if(card.location!==2&&action===5&&!['Fallen of the White Dragon'].includes(n))continue;// hand starters only (field effects are not "a live hand")
  return {type:R.SELECT_IDLECMD,action,index:i,card:n};
 }
 return null;
}
// Is this IDLECMD response passive (end the phase, or Normal Summon a card that starts nothing) while a starter is live?
export function passiveCheck(d,seat,m,response,blocked){
 if(m?.type!==M.SELECT_IDLECMD||!ownMain(d,seat)||!response)return null;
 const c=ctx(d,seat),starters=starterNames(d,seat,c);
 const phase=response.action===6||response.action===7;
 const idleSummon=(response.action===0||response.action===3)&&!starters.has(d.name((response.action===0?m.summons:m.monster_sets)?.[response.index]?.code||0));
 if(!phase&&!idleSummon)return null;
 const live=liveStarter(d,seat,m,blocked);if(!live)return null;
 // A Normal Summon that a book line itself asks for is not passive.
 if(idleSummon&&response.action===0){const n=d.name(m.summons[response.index].code);if((BOOKS[deckId(d,seat)]?.lines||[]).some(l=>whenOk(d,BOOKS[deckId(d,seat)],l.when,c)&&l.steps.some(s=>s.do==='summon'&&s.card===n)))return null}
 return {live,reason:(phase?'ended the phase':'Normal Summoned '+d.name(m.summons?.[response.index]?.code||0))+' with '+live.card+' live'};
}

// Set/hold rules (Akiza §5 + handover a2.3). Called when the base policy is about to leave the Main Phase.
// Why this hand card should NOT be Set now (a hold rule), or null. Normal Spells are never Set by this rule set.
export function holdReason(d,seat,card){
 const c=ctx(d,seat),sh=BOOKS[deckId(d,seat)]?.setHold||{},n=d.name(card.code),type=d.db[card.code]?.type||0;
 if((sh.neverSet||['Triple Tactics Talent']).includes(n)||(!(type&4)&&!(type&65536)))return n+' (a Normal Spell is activated, not Set)';
 if(c.handNames.includes('Mulcharmy Fuwalos')&&['sky','luna'].includes(c.opp)&&!c.field.length&&!c.st.length)return n+' (keeps Mulcharmy Fuwalos live: "if you control no cards")';
 if(n===(sh.retributionNeedsAlbazFusion||'Branded Retribution')&&!(c.field.some(x=>(x.position&5)&&albazFusion(d,x))||c.gy.filter(x=>albazFusion(d,x)).length>=2))return n+' (no Albaz Fusion to return)';
 // S-SUPERPOLY: keep it for the opponent's turn (a Set Quick-Play), with a face-up monster of ours as material and 1 card left for the discard.
 if(n===sh.superPolySetOnlyWithAlbaz&&!(c.field.some(x=>x.position&5)&&c.hand.length>=2))return n+' (no face-up material of ours or no card left to discard)';
 if(sh.holdVs?.[n]?.includes(c.opp))return n+' (hold vs '+c.opp+')';
 if(sh.setOnlyWithoutFuwalos?.[n]?.includes(c.opp)&&c.handNames.includes('Mulcharmy Fuwalos'))return n+' (Fuwalos in hand)';
 return null;
}
// The first hand Trap/Quick-Play that should be Set now, plus the cards held back and why.
export function setDecision(d,seat,m){
 if(m?.type!==M.SELECT_IDLECMD||!ownMain(d,seat)||!m.spell_sets?.length)return null;
 const held=[];
 for(let i=0;i<m.spell_sets.length;i++){const card=m.spell_sets[i],type=d.db[card.code]?.type||0;
  if(card.location!==2||(!(type&4)&&!(type&65536)))continue;
  const why=holdReason(d,seat,card);if(why){held.push(why);continue}
  return {response:{type:R.SELECT_IDLECMD,action:4,index:i},card:d.name(card.code),held};
 }
 return held.length?{response:null,held}:null;
}

// Book activation holds (applied with the pilot's own blunder checks): Super Polymerization is never spent on our own
// monsters alone; with no opposing monster it waits for the opponent's turn (S-SUPERPOLY / G-02).
// r32 (Kevy 22 Oct item 3, all decks): competitive hand-trap timing on the opponent's turn. A response hand trap
// (Ash Blossom, Ghost Belle, Effect Veiler, Infinite Impermanence) is saved for the opponent's KEY cards (their deck's
// starters and extenders from the combo books and game plans, or an Extra Deck monster) while they still have a full hand;
// it is used freely once they are down to 2 cards or fewer, after their first turn, or on any Extra Deck monster.
// Nibiru, Droll & Lock Bird and Mulcharmy are not held. Public information only (deck id, card names on the chain).
export const HANDTRAP={on:true};
const HELD_TRAPS=/^(Ash Blossom & Joyous Spring|Ghost Belle & Haunted Mansion|Effect Veiler|Infinite Impermanence)$/;
// r33: deck brains (ai/brain/*-brain.mjs): what each card does in its deck. Their starters and extenders are key cards too.
export const BRAINS={branded:brandedBrain};
export function keyCards(oppId){const b=BOOKS[oppId],g=GAME_PLANS[oppId],br=BRAINS[oppId];return new Set([...(b?.starters||[]),...(b?.lines||[]).flatMap(l=>l.steps.map(s=>s.card)),...(g?.starters||[]),...(g?.extenders||[]),...Object.entries(br?.cards||{}).filter(([,v])=>v.role==='starter'||v.role==='extender').map(([n])=>n)])}
export function handTrapHold(d,seat,c){
 if(!HANDTRAP.on||d.active===seat||c?.location!==2||!HELD_TRAPS.test(d.name(c.code)))return null;
 if(d.turn>2)return null;
 const top=d.chain?.at?.(-1);if(!top||top.controller===seat)return null;
 const topCard=d.db[top.code]||{},topName=d.name(top.code);
 if(topCard.type&EXTRA_TYPES)return null;
 if(d.zone(1-seat,2).filter(Boolean).length<=2)return null;
 if(keyCards(deckId(d,1-seat)).has(topName))return null;
 return 'Hand trap held: '+topName+' is not one of their key cards (save '+d.name(c.code)+' for a starter)';
}
// r32: the other half of the hand-trap rule. When the opponent's chain link is one of their key cards (or an Extra Deck
// monster's effect), a hand trap that can answer it is USED (the base policy and the search tended to "save the
// interruption" even on a starter; probe: 0 of 9 Ash / Impermanence windows on key cards were used). Ash Blossom and
// Ghost Belle are only offered by the engine when they can negate; Impermanence / Effect Veiler are used only on a
// monster effect. Public information only.
const HT_ORDER=['Ash Blossom & Joyous Spring','Ghost Belle & Haunted Mansion','Infinite Impermanence','Effect Veiler'];
export function handTrapUse(d,seat,m,blocked){
 if(!HANDTRAP.on||m?.type!==M.SELECT_CHAIN||d.active===seat)return null;
 const top=d.chain?.at?.(-1);if(!top||top.controller===seat)return null;
 const topCard=d.db[top.code]||{},topName=d.name(top.code),extra=!!(topCard.type&EXTRA_TYPES),key=extra||keyCards(deckId(d,1-seat)).has(topName);if(!key)return null;
 const monsterEffect=!!(topCard.type&1);
 const opts=(m.selects||[]).map((c,i)=>({c,i,n:d.name(c.code)})).filter(x=>x.c.location===2&&HT_ORDER.includes(x.n)&&!blocked?.(x.c,x.i)&&(monsterEffect||!/Impermanence|Veiler/.test(x.n)));
 opts.sort((a,b)=>HT_ORDER.indexOf(a.n)-HT_ORDER.indexOf(b.n));const best=opts[0];if(!best)return null;
 return {index:best.i,card:best.n,reason:best.n+' on '+topName+(extra?' (an Extra Deck monster)':' (one of their key cards)')};
}
export function bookActivationBlock(d,seat,c){
 const ht=handTrapHold(d,seat,c);if(ht)return ht;
 if(!BOOKS[deckId(d,seat)])return null;
 if(d.name(c.code)==='Super Polymerization'&&!d.zone(1-seat,4).some(Boolean)&&!(deckId(d,seat)==='branded'&&superPolyOwnFusion(d,seat)))return 'S-SUPERPOLY: hold Super Polymerization for a Fusion with an opposing monster';
 return blockFor(d,seat,c,'activate');
}
// r27 (Kevy 22 Oct, deck review): per-deck holds in book data, e.g. no Interrupted Kaiju Slumber into an empty board,
// no 3000 LP Ascended of Thunder with nothing to Xyz with. A hold applies unless one of its "unless" conditions is met.
function blockFor(d,seat,c,kind){
 const book=BOOKS[deckId(d,seat)];if(!book?.blocks)return null;const n=d.name(c.code);
 for(const b of book.blocks){if(b.do!==kind||b.card!==n)continue;
  if(b.location&&!b.location.includes(c.location))continue;
  // r33 (Branded deck brain): a hold for our own turn's chain windows only, while a named hand card is still unused
  // this turn (e.g. keep Branded Opening for the Main Phase until Phara has shielded it).
  if(b.chainOnly&&(d.active!==seat||d.prompt?.type!==M.SELECT_CHAIN))continue;
  if(b.ifUnused){const x=d.zone(seat,2).find(y=>y&&d.name(y.code)===b.ifUnused);if(!x||[...(d.attempts?.keys?.()||[])].some(k=>k.startsWith(x.code+':'+x.controller+':')))continue}/* r32 (ChatGPT F1): a hold can name the zone it applies to, e.g. a field Quick Effect but not the same card's GY trigger */
  if(b.if){const st=d.zone(seat,8).filter(x=>x&&(x.position&5)).map(x=>d.name(x.code)),hd=d.zone(seat,2).filter(Boolean).map(x=>d.name(x.code)),fd=d.zone(seat,4).filter(x=>x&&(x.position&5)).map(x=>d.name(x.code));if(!((b.if.stAny||[]).some(x=>st.includes(x))||(b.if.handAny||[]).some(x=>hd.includes(x))||(b.if.fieldAny||[]).some(x=>fd.includes(x))))continue}/* block only when its 'if' holds */if(b.desc&&!new RegExp(b.desc,'i').test(d.description?.(c.description)||''))continue;const u=b.unless||{};
  const oppMons=d.zone(1-seat,4).filter(Boolean),oppCards=oppMons.length+d.zone(1-seat,8).filter(Boolean).length;
  const lv=x=>x.level||(d.db[x.code]?.level||0)&255,mine=d.zone(seat,4).filter(x=>x&&(x.position&5)),hand=d.zone(seat,2).filter(Boolean);
  if(u.oppMonstersMin!==undefined&&oppMons.length>=u.oppMonstersMin)continue;
  if(u.oppCardsMin!==undefined&&oppCards>=u.oppCardsMin)continue;
  if(u.fieldLevel!==undefined&&mine.some(x=>lv(x)===u.fieldLevel&&!(d.db[x.code]?.type&EXTRA_TYPES)))continue;
  if(u.fieldAny&&mine.some(x=>u.fieldAny.includes(d.name(x.code))))continue;
  if(u.handAny&&hand.some(x=>u.handAny.includes(d.name(x.code))))continue;
  if(u.notFirstTurn&&d.turn>1)continue;
  if(u.countMin&&[...d.zone(seat,2).filter(x=>x&&!(d.db[x.code]?.type&EXTRA_TYPES)),...d.zone(seat,4).filter(x=>x&&(x.position&5))].filter(x=>(d.db[x.code]?.type&1)&&d.name(x.code).startsWith(u.countMin.prefix)).length>=u.countMin.min)continue;
  if(u.notOwnTurn&&d.active!==seat)continue;
  if(u.fieldOrGyNameHas&&[...d.zone(seat,4),...d.zone(seat,16)].some(x=>x&&(x.position&5||x.location===16)&&(d.db[x.code]?.type&1)&&d.name(x.code).includes(u.fieldOrGyNameHas)))continue;/* r32 (ChatGPT F2): e.g. an Ecclesia monster on our field or in our GY */
  if(u.oppChainTop&&d.chain?.length&&d.chain.at(-1).controller!==seat)continue;
  return 'Book hold ('+deckId(d,seat)+'): '+(b.why||n);}
 return null;
}
// r32.1 (Kevy's recording, 22 Oct 22:26, 3:36): Lunalight Link Summoned Knightmare Phoenix using Perfume Dancer AND
// Lunalight Liger Dancer, its boss, and ended the turn with a 1900 Link. For every deck: a non-boss Link Monster is not
// Special Summoned when we don't control enough non-boss monsters to be its materials (Link rating), because the
// summon would have to use a boss. isPayoff comes from the pilot.
export function linkBossBlock(d,seat,c,isPayoff){
 const card=d.db[c.code]||{};if(!isPayoff||!(card.type&67108864)||isPayoff(d.name(c.code)))return null;
 const mine=d.zone(seat,4).filter(x=>x&&(x.position&5)),boss=mine.find(x=>isPayoff(d.name(x.code)));if(!boss)return null;
 const rating=(card.level||0)&255,others=mine.filter(x=>!isPayoff(d.name(x.code))).length;
 return others<Math.max(1,rating)?'Keep '+d.name(boss.code)+': '+d.name(c.code)+' would need it as Link Material':null;
}
export function bookSpecialBlock(d,seat,c,isPayoff){return linkBossBlock(d,seat,c,isPayoff)||blockFor(d,seat,c,'special')}
// Never Tribute Summon by giving up the line's payoff (Mirrorjade, Dragoon, ...): a Level 5+ Normal Summon needs
// 1 (Level 5-6) or 2 (Level 7+) tributes; it is held when the non-payoff monsters we control can't cover them.
// r27 (deck review): for every deck, never Tribute Summon by tributing an Extra Deck monster (HERO tributed Xtra HERO
// Wonder Driver for Destiny HERO - Malicious; Kashtira tributed Shangri-Ira). The tributes needed come from monsters that
// started in the Main Deck; if there are not enough of those, the Tribute Summon is held.
const NO_TRIBUTE_WITH=['Kashtira Birth'];
export function tributeBlock(d,seat,c){
 const level=(d.db[c.code]?.level||0)&255;if(level<5||!(d.db[c.code]?.type&1))return null;
 if(d.zone(seat,8).some(x=>x&&(x.position&5)&&NO_TRIBUTE_WITH.includes(d.name(x.code))))return null;
 const own=d.zone(seat,4).filter(Boolean),extra=own.filter(x=>d.db[x.code]?.type&EXTRA_TYPES);if(!extra.length)return null;
 return own.length-extra.length<(level>=7?2:1)?'Keep '+d.name(extra[0].code)+': no Tribute Summon of '+d.name(c.code)+' that tributes an Extra Deck monster':null;
}
export function bookSummonBlock(d,seat,c,isPayoff){
 const level=(d.db[c.code]?.level||0)&255;if(level<5)return null;
 const free=BOOKS[deckId(d,seat)]?.noTributeWith||[];if(d.zone(seat,8).some(x=>x&&(x.position&5)&&free.includes(d.name(x.code))))return null;/* r27: e.g. Kashtira Birth lets Level 7s be Normal Summoned without Tributing */
 const own=d.zone(seat,4).filter(Boolean),payoff=own.filter(x=>isPayoff(d.name(x.code)));
 if(payoff.length&&own.length-payoff.length<(level>=7?2:1))return 'Keep '+d.name(payoff[0].code)+': no Tribute Summon of '+d.name(c.code)+' over the payoff';
 return blockFor(d,seat,c,'summon');/* r33: book holds on Normal / Tribute Summons, e.g. a monster that Special Summons itself */
}
// r32: how much an opposing monster matters (Kaiju / Lava Golem tribute target): Extra Deck bosses first, then
// monsters with effects that work on our turn (Quick Effects, negation), then ATK. Public information only.
export function oppValue(d,c){const card=d.db[c.code]||{},desc=card.desc||'';let v=(c.attack??card.attack??0);if(card.type&EXTRA_TYPES)v+=3000;if(/Quick Effect|during either player's turn|negate/i.test(desc))v+=1500;if(card.type&32)v+=300;if(!(c.position&5))v-=500;return Math.max(0,v)}
// Card picks inside the book's own effects (search target, Fusion target, materials). Never adds an illegal pick.
export function bookPick(d,seat,m,response){
 if(![M.SELECT_CARD,M.SELECT_UNSELECT_CARD].includes(m?.type)||!response)return null;
 const book=BOOKS[deckId(d,seat)];if(!book)return null;
 const source=d.name(d.currentEffect?.code||0),c=ctx(d,seat),cards=m.selects||m.select_cards||[];
 const onField=n=>c.field.some(x=>d.name(x.code)===n),oppNone=!d.zone(1-seat,4).some(Boolean);
 const rule=book.picks.find(p=>(p.source===source||p.source==='*'&&p.hint)&&/* r27: '*' = a summon procedure (no effect source), by hint: 512 Synchro, 513 Xyz, 533 Link materials */(!p.hint||p.hint.includes(d.hint))&&(!p.notHint||!p.notHint.includes(d.hint))&&(!p.ifHand||p.ifHand.every(n=>c.handNames.includes(n)))&&(!p.ifNotHand||!p.ifNotHand.some(n=>c.handNames.includes(n)))
  &&(!p.ifField||p.ifField.every(onField))&&(!p.ifCount||[...c.hand.filter(x=>!(d.db[x.code]?.type&EXTRA_TYPES)),...c.field.filter(x=>x.position&5)].filter(x=>(d.db[x.code]?.type&1)&&d.name(x.code).startsWith(p.ifCount.prefix)&&d.name(x.code)!==source).length>=p.ifCount.min)/* r28: field Fusion monsters count as materials too */&&(!p.ifNotField||!p.ifNotField.some(onField))&&(p.ifOppNone===undefined||p.ifOppNone===oppNone));// r26: field / opponent-board conditions
 if(!rule)return null;
 const loc=rule.location||[];
 if(rule.preferBest==='opp'){/* r32 (Mikanko board breaking): take the opponent's best monster, e.g. the Kaiju tribute */const own=x=>d.fromEngine?d.fromEngine(x.controller)===seat:x.controller===seat;
  const best=cards.map((card,i)=>({i,v:own(card)?-1:oppValue(d,card)})).filter(x=>x.v>=0).sort((a,b)=>b.v-a.v)[0];if(!best)return null;
  if(m.type===M.SELECT_UNSELECT_CARD){if(response.index==null||response.index===best.i)return null;return {response:{...response,index:best.i},rule:rule.source,card:d.name(cards[best.i].code)}}
  const picks=response.indicies||[];if(!picks.length||picks.includes(best.i))return null;return {response:{...response,indicies:[best.i,...picks.filter(i=>i!==best.i)].slice(0,picks.length)},rule:rule.source,card:d.name(cards[best.i].code)}}
 const ranked=cards.map((card,i)=>({i,p:rule.prefer.indexOf(d.name(card.code)),l:loc.indexOf(card.location)})).filter(x=>x.p>=0).sort((a,b)=>a.p-b.p||(a.l<0?99:a.l)-(b.l<0?99:b.l));
 if(!ranked.length)return null;
 const best=ranked[0].i;
 if(m.type===M.SELECT_UNSELECT_CARD){if(response.index==null||response.index===best)return null;return {response:{...response,index:best},rule:rule.source,card:d.name(cards[best].code)}}
 const picks=response.indicies||[];if(!picks.length||picks.includes(best))return null;
 return {response:{...response,indicies:[best,...picks.filter(i=>i!==best)].slice(0,picks.length)},rule:rule.source,card:d.name(cards[best].code)};
}

// Effect options: Triple Tactics Talent mode (G-04 / S-TTT) and Albion's End Phase "Set" (L-06).
export function optionPick(d,seat,m){
 if(m?.type!==M.SELECT_OPTION)return null;
 const source=d.name(d.currentEffect?.code||0),text=m.options.map(v=>d.description(v));
 if(source==='Triple Tactics Talent'){
  const steal=d.zone(1-seat,4).some(c=>c&&(c.position&5)&&((d.db[c.code]?.type&EXTRA_TYPES)||(c.attack||0)>=2500));
  const want=steal?/control/i:/draw/i,i=text.findIndex(t=>want.test(t));return i>=0?{type:R.SELECT_OPTION,index:i}:null;
 }
 // Branded Opening: always Special Summon the Despia monster in Defense (L-04/L-05/G-03), keeping the Normal Summon free.
 if(source==='Branded Opening'){const i=text.findIndex(t=>/special summon/i.test(t));return i>=0?{type:R.SELECT_OPTION,index:i}:null}
 // r27: per-deck effect modes from book data, e.g. Lunalight Black Sheep adds Polymerization when no Fusion Spell is in hand.
 const book=BOOKS[deckId(d,seat)],handNames=d.zone(seat,2).filter(Boolean).map(x=>d.name(x.code));
 for(const o of book?.options||[]){if(o.source!==source)continue;if(o.ifNotHand&&o.ifNotHand.some(n=>handNames.includes(n)))continue;if(o.ifOppNoFaceUp&&[...d.zone(1-seat,4),...d.zone(1-seat,8)].some(x=>x&&(x.position&5)))continue;const i=text.findIndex(t=>new RegExp(o.match,'i').test(t));if(i>=0)return {type:R.SELECT_OPTION,index:i}}
 if(source==='Albion the Branded Dragon'){const i=text.findIndex(t=>/\bset\b/i.test(t));return i>=0?{type:R.SELECT_OPTION,index:i}:null}
 return null;
}

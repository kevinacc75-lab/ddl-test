// r18b (TASK a2): opening book + "never pass with a live hand" + spell/trap set/hold/activate rules.
// The book never forces a move and never bypasses legality: it only reorders what the base policy offers first.
// Search (when it runs) still scores the book step against the base policy's own choice and the other legal options.
// Only this seat's own hand, own field/GY/Extra Deck, public opposing cards and the public deck id are read.
import {M,R} from '../../duel.mjs';
import {GAME_PLANS} from '../../game-plans.mjs';
import branded from './branded-lines.mjs';

export const BOOKS={branded};
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
function whenOk(d,book,w={},c){
 if(w.ownMain===false)return false;
 if(w.hand&&!w.hand.every(n=>c.handNames.includes(n)))return false;
 if(w.notHand&&w.notHand.some(n=>c.handNames.includes(n)))return false;
 if(w.handMin&&c.hand.length<w.handMin)return false;
 if(w.oppFaceUp&&c.enemyFaceUp.length<w.oppFaceUp)return false;
 if(w.oppNone&&d.zone(1-c.seat,4).some(Boolean))return false;
 if(w.handAnyCond&&!(c.handNames.includes(w.handAnyCond)&&conditionalOk(d,book,w.handAnyCond,c)))return false;
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

// Starters for the passive-pass rule: the book's starters for this deck, else the deck's game-plan starters.
function starterNames(d,seat,c){
 const book=BOOKS[deckId(d,seat)],plan=GAME_PLANS[deckId(d,seat)];
 const list=new Set([...(book?.starters||[]),...(plan?.starters||[]),...(plan?.extenders||[]).filter(n=>/Opening|Deployment/.test(n))]);
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
export function bookActivationBlock(d,seat,c){
 if(!BOOKS[deckId(d,seat)])return null;
 if(d.name(c.code)==='Super Polymerization'&&!d.zone(1-seat,4).some(Boolean))return 'S-SUPERPOLY: hold Super Polymerization for a Fusion with an opposing monster';
 return null;
}
// Never Tribute Summon by giving up the line's payoff (Mirrorjade, Dragoon, ...): a Level 5+ Normal Summon needs
// 1 (Level 5-6) or 2 (Level 7+) tributes; it is held when the non-payoff monsters we control can't cover them.
export function bookSummonBlock(d,seat,c,isPayoff){
 const level=d.db[c.code]?.level||0;if(level<5)return null;
 const own=d.zone(seat,4).filter(Boolean),payoff=own.filter(x=>isPayoff(d.name(x.code)));if(!payoff.length)return null;
 return own.length-payoff.length<(level>=7?2:1)?'Keep '+d.name(payoff[0].code)+': no Tribute Summon of '+d.name(c.code)+' over the payoff':null;
}
// Card picks inside the book's own effects (search target, Fusion target, materials). Never adds an illegal pick.
export function bookPick(d,seat,m,response){
 if(![M.SELECT_CARD,M.SELECT_UNSELECT_CARD].includes(m?.type)||!response)return null;
 const book=BOOKS[deckId(d,seat)];if(!book)return null;
 const source=d.name(d.currentEffect?.code||0),c=ctx(d,seat),cards=m.selects||m.select_cards||[];
 const rule=book.picks.find(p=>p.source===source&&(!p.hint||p.hint.includes(d.hint))&&(!p.notHint||!p.notHint.includes(d.hint))&&(!p.ifHand||p.ifHand.every(n=>c.handNames.includes(n))));
 if(!rule)return null;
 const loc=rule.location||[];
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
 if(source==='Albion the Branded Dragon'){const i=text.findIndex(t=>/\bset\b/i.test(t));return i>=0?{type:R.SELECT_OPTION,index:i}:null}
 return null;
}

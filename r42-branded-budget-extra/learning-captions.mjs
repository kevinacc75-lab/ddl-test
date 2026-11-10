// r32 Learning-mode combo captions (Kevy 22 Oct 16:50: "When the AI starts a line from its book, a short caption would
// name what it's going for ... so you can see the plan as well as the moves").
// Learning preset and watch mode only. When a computer pilot plays a combo-book step from a line it has not shown yet
// this turn, a banner names the goal ("Going for Mirrorjade") with the line's route underneath; after a few seconds it
// shrinks to a small "PLAN" chip that stays until that player's turn ends. Display only: it never changes a decision
// or any timing. Original design; no Konami UI.
import branded from './ai/book/branded-lines.mjs';import kashtira from './ai/book/kashtira-lines.mjs';import blueeyes from './ai/book/blueeyes-lines.mjs';
import luna from './ai/book/luna-lines.mjs';import toon from './ai/book/toon-lines.mjs';import hero from './ai/book/hero-lines.mjs';import mikanko from './ai/book/mikanko-lines.mjs';import dtw from './ai/book/dtw-lines.mjs';/* r36 */
import {lineGoal,lineRoute} from './ai/book/captions.mjs';
const LINES={branded,kashtira,blueeyes,luna,toon,hero,mikanko,dtw};
export const CAPTION_MS={banner:4200};
// The book line a plan's step belongs to, or null ("Opening book L-01" -> "L-01").
export function planLine(plan){if(plan?.book?.kind!=='step')return null;const m=/^Opening book (\S+)/.exec(plan.book.rule||'');return m?m[1]:null}
export function captionFor(plan,decks=[]){const id=planLine(plan);if(!id)return null;const deck=decks[plan.seat],book=LINES[deck?.id];
 const line=book?.lines?.find(l=>l.id===id);return {key:plan.seat+':'+plan.turn+':'+id,seat:plan.seat,turn:plan.turn,id,deck:deck?.name||'',goal:lineGoal(id,line),route:line?lineRoute(line):''}}
export function createLearningCaptions({root=globalThis.document?.body,getDecks=()=>[],on=()=>false,timingScale=1}={}){
 let node=null,shown=null,timer=null,seen=new Set(),seenTurn=null;const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function el(){if(node?.isConnected)return node;const doc=root?.ownerDocument||globalThis.document;if(!doc||!root)return null;node=doc.createElement('div');node.className='lr-plan';node.setAttribute('role','status');node.setAttribute('aria-live','polite');node.hidden=true;root.append(node);return node}
 function hide(){clearTimeout(timer);shown=null;if(node){node.hidden=true;node.className='lr-plan';node.style.top=''}}
// r34: Kevy named the AI duelist "Aibo" (23 Oct 13:04), so the combo caption reads AIBO'S PLAN.
 function show(c){const n=el();if(!n)return;clearTimeout(timer);shown=c;n.dataset.seat=String(c.seat);n.innerHTML=`<small>AIBO'S PLAN${c.deck?' · '+esc(c.deck):''}</small><b>${esc(c.goal)}</b>${c.route&&c.route!==c.goal?`<span>${esc(c.route)}</span>`:''}`;
  const again=n.classList.contains('lr-plan-in');n.hidden=false;n.style.top='';n.className='lr-plan lr-plan-in';if(again)for(const a of n.getAnimations?.()||[]){a.cancel();a.play()}/* r33: restart without forcing a layout mid-update (was offsetWidth) */timer=setTimeout(()=>{if(shown===c){n.className='lr-plan lr-plan-mini';tuck(n)}},CAPTION_MS.banner*timingScale)}
 // r33 (Kevy's recordings, 22 Oct): the chip sat on the opponent's revealed hand. It now sits just below that strip when
 // the strip is at the top of the screen, and falls back to the top edge otherwise.
 function tuck(n){try{const doc=n.ownerDocument,h=doc.querySelector('#opp-hand')?.getBoundingClientRect?.(),vh=doc.defaultView?.innerHeight||0;n.style.top=h&&h.height>0&&h.bottom>0&&h.bottom<vh*.3?Math.round(h.bottom+6)+'px':''}catch{}}
 function state(x){try{if(!on()||!x?.coach){if(shown)hide();return}const st=x.state||{};
   if(st.turn!==seenTurn){seenTurn=st.turn;seen=new Set()}if(shown&&(st.turn!==shown.turn||st.finished))hide();
   const decks=getDecks();let next=null;for(const plan of [x.coach.last,x.coach.intent]){const c=captionFor(plan,decks);if(c&&c.turn===st.turn&&!seen.has(c.key)){seen.add(c.key);next=c}}/* each line is announced once per turn; the newest wins */
   if(next)show(next)
  }catch(err){console.warn('[learning-captions] skipped',err?.message)}}
 // r33.1 (ChatGPT RELAY-011 N2): a new match, a return to setup or a rewind clears the banner AND the lines already
 // announced, so a restart on the same turn number announces its line again.
 function reset(){hide();seen=new Set();seenTurn=null}
 return {state,hide,reset,get shown(){return shown}}}

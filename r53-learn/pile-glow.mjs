// r35.2 "effect ready" prompts for piles (Claude, 24 Oct 2026; Kevy 16:32: "we need visual prompts to say hey you have an
// effect in graveyard that you can use now ... Luna Light Perfume, I didn't know I could use it from the graveyard").
// The r34 gold aura only reaches cards that are drawn on the field or in the hand. A card in the GY, banishment or the
// Extra Deck sits inside a pile, so its pile glows instead (same gold) with a small count badge, and a hint chip names
// the card(s): "Luna Light Perfume (Graveyard) can be used now" with a "Show me" button that opens the Play choices.
// r52 (Claude, 13 Nov 2026; ChatGPT RELAY-162 T3 group A + RELAY-164 T7 mapping): tapping a glowing pile opens a small menu
// with each exact effect the duel engine offers from that pile right now. Choosing one sends that offered response once,
// through the page's own submit path (human-flow membership checks unchanged). The badge counts card copies (distinct
// pile positions), not effects: one card with two usable effects = 1, two copies = 2. "View all cards" keeps the old pile
// list. Nothing here decides what is legal; a summon from the Extra Deck is not an "effect" and stays in the normal list.
import {M} from './duel.mjs';import {publicSlot,windowKey} from './play-flow.mjs';import {describeChainCandidate} from './human-flow.mjs';
const PILES={16:'Graveyard',32:'Banished',64:'Extra Deck'};
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const live=x=>!!x&&['play','manual'].includes(x.mode)&&!x.ai&&!x.disabled&&!x.state?.finished;
// Every offered activation from the viewing player's piles: one row per offered response (pure; tests/r52-play.test.mjs).
export function pileActions(x){
 if(!live(x))return [];
 const p=x.state?.prompt;if(!p)return [];
 const lists=p.type===M.SELECT_IDLECMD?[[p.activates,r=>r.action===5]]:p.type===M.SELECT_BATTLECMD?[[p.chains,r=>r.action===0]]:p.type===M.SELECT_CHAIN?[[p.selects,()=>true]]:[];
 const out=[];
 for(const [cards,isKind] of lists)(cards||[]).forEach((c,index)=>{
  const slot=publicSlot(c,x.match?.first),[seat,loc]=slot.split(':').map(Number);
  if(seat!==x.view||!PILES[loc])return;
  const choice=(x.choices||[]).find(o=>o.response&&o.response.index===index&&isKind(o.response));
  if(!choice)return;/* not in the offered list: never shown */
  const name=String(choice.label||'').replace(/^[^·]*·\s*/,'').trim()||'A card';
  out.push({loc,name,pile:PILES[loc],slot,card:c,index,choice});
 });
 return out;
}
// One entry per card copy (distinct pile position) - this is what the badge counts.
export function pileReady(x){
 const out=[];for(const a of pileActions(x))if(!out.some(o=>o.slot===a.slot))out.push({loc:a.loc,name:a.name,pile:a.pile,slot:a.slot});
 return out;
}
// Text for one menu row. An effect the clause map cannot name gets a plain numbered label, never a guessed title.
export function effectLine(a,db,nth,count){
 let label='';try{const d=describeChainCandidate(a.card,db,[a.choice],0);if(d.clauseStatus==='mapped')label=d.effectLabel}catch{}
 if(!label){const det=String(a.choice?.detail||'');if(det&&!Object.values(PILES).includes(det)&&!/^(Hand|Monster Zone|Spell & Trap Zone|Field Zone)$/i.test(det))label=det}
 if(!label)label=count>1?'Effect option '+nth+' of '+count:'Use its effect';
 return label;
}
export function installPileGlow({navigate=()=>{},submit=null,getDecision=()=>null,getDb=()=>null}={}){
 let chip=null,lastKey='',menu=null,menuKey=null,latest=null,chipTimer=0;
 function ensureChip(){if(chip)return chip;chip=document.createElement('div');chip.id='pile-ready-hint';chip.setAttribute('role','status');chip.hidden=true;document.body.append(chip);
  chip.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.act==='show')navigate('play');chip.hidden=true});return chip}
 const close=()=>{if(!menu)return;const back=menu._from;menu.hidden=true;menu.replaceChildren();menuKey=null;if(back&&document.contains(back))back.focus?.({preventScroll:true})};
 function ensureMenu(){if(menu)return menu;menu=document.createElement('section');menu.id='pile-action-menu';menu.hidden=true;menu.setAttribute('role','dialog');menu.setAttribute('aria-label','Effects you can use from this pile');document.body.append(menu);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu&&!menu.hidden){e.preventDefault();close()}});
  document.addEventListener('pointerdown',e=>{if(menu&&!menu.hidden&&!menu.contains(e.target)&&!e.target.closest?.('[data-pile]'))close()},true);
  window.addEventListener('resize',()=>{if(menu&&!menu.hidden&&menu._from)place(menu._from)});
  return menu}
 function place(n){const r=n.getBoundingClientRect(),w=Math.min(300,innerWidth-16),h=menu.offsetHeight||160;let left=Math.min(Math.max(8,r.left+r.width/2-w/2),innerWidth-w-8);let top=r.top-h-8;if(top<8)top=Math.min(innerHeight-h-8,r.bottom+8);menu.style.width=w+'px';menu.style.left=left+'px';menu.style.top=Math.max(8,top)+'px'}
 function open(n,acts){
  if(chip)chip.hidden=true;const m=ensureMenu();m.replaceChildren();m._from=n;menuKey=windowKey(latest);
  const [seat,loc]=n.dataset.pile.split(':').map(Number),db=getDb()||{};
  const h=document.createElement('strong');h.textContent=PILES[loc]+' · you can use '+(acts.length===1?'1 effect':acts.length+' effects');m.append(h);
  const bySlot=new Map();for(const a of acts){if(!bySlot.has(a.slot))bySlot.set(a.slot,[]);bySlot.get(a.slot).push(a)}
  for(const group of bySlot.values())group.forEach((a,i)=>{const b=document.createElement('button');b.type='button';b.className='pam-act';
   b.innerHTML=`<span class="pam-name">${escape(a.name)}</span><small>${escape(effectLine(a,db,i+1,group.length))}</small>`;
   b.setAttribute('aria-label','Activate '+a.name+': '+effectLine(a,db,i+1,group.length));
   b.onclick=()=>{if(menuKey!==windowKey(getDecision())){close();return}/* the decision changed: a stale menu sends nothing */close();submit?.(a.choice.response)};m.append(b)});
  const view=document.createElement('button');view.type='button';view.className='pam-view';view.textContent='View all cards';view.onclick=()=>{close();n.onclick?.()};
  const cancel=document.createElement('button');cancel.type='button';cancel.className='pam-cancel';cancel.textContent='Close';cancel.onclick=close;
  m.append(view,cancel);m.hidden=false;place(n);m.querySelector('button')?.focus({preventScroll:true});
 }
 // Capture phase: a glowing pile opens the effect menu before the page's own pile list (which stays one tap away).
 document.addEventListener('click',e=>{const n=e.target.closest?.('[data-pile]');if(!n||!submit||document.querySelector('dialog[open]'))return;
  const [seat,loc]=n.dataset.pile.split(':').map(Number);const acts=pileActions(latest).filter(a=>a.loc===loc&&seat===latest?.view);
  if(!acts.length)return;e.preventDefault();e.stopPropagation();if(menu&&!menu.hidden&&menu._from===n){close();return}open(n,acts)},true);
 function state(x){
  latest=x;if(menu&&!menu.hidden&&menuKey!==windowKey(x))close();/* new decision, rewind, new duel: the old menu goes */
  const ready=pileReady(x),view=x?.view??0;
  for(const n of document.querySelectorAll('[data-pile]')){const [seat,loc]=n.dataset.pile.split(':').map(Number),here=seat===view?ready.filter(r=>r.loc===loc):[];
   n.classList.toggle('pile-ready',here.length>0);n.querySelector('.pile-ready-badge')?.remove();
   if(here.length){const b=document.createElement('span');b.className='pile-ready-badge';b.textContent='⚡'+(here.length>1?here.length:'');b.setAttribute('aria-hidden','true');n.append(b);n.setAttribute('aria-description',(here.length===1?'1 card':here.length+' cards')+' can activate: '+here.map(r=>r.name).join(', ')+'. Tap to choose.')}
   else if(/can activate: .*Tap to choose\.$|can be used now$/.test(n.getAttribute('aria-description')||''))n.removeAttribute('aria-description')}
  const c=ensureChip(),key=ready.map(r=>r.slot+r.name).join('|')+'@'+(x?.state?.prompt?.type??'');
  if(!ready.length||x?.state?.prompt?.type===M.SELECT_CHAIN){c.hidden=true;lastKey='';return}/* r52: a chain window already names the card in its own prompt; the chip would sit over the Yes/No buttons */
  if(key===lastKey)return;lastKey=key;
  const names=[...new Map(ready.map(r=>[r.name+r.pile,r])).values()].map(r=>`<b>${escape(r.name)}</b> <small>(${escape(r.pile)})</small>`).join(', ');
  c.innerHTML=`<span class="pile-ready-icon" aria-hidden="true">⚡</span><span>${names} can be used now. Tap the glowing pile.</span><button type="button" data-act="close" aria-label="Dismiss">✕</button>`;
  c.hidden=false;clearTimeout(chipTimer);chipTimer=setTimeout(()=>{c.hidden=true},5000);/* r52: a hint, not a wall: it leaves after 5 s (the pile keeps glowing) so it never sits over the hand */
 }
 return {state};
}

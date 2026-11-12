// r35.2 "effect ready" prompts for piles (Claude, 24 Oct 2026; Kevy 16:32: "we need visual prompts to say hey you have an
// effect in graveyard that you can use now ... Luna Light Perfume, I didn't know I could use it from the graveyard").
// The r34 gold aura only reaches cards that are drawn on the field or in the hand. A card in the GY, banishment or the
// Extra Deck sits inside a pile, so its pile glows instead (same gold) with a small count badge, and a hint chip names
// the card(s): "Luna Light Perfume (Graveyard) can be used now" with a "Show me" button that opens the Play choices.
// Presentation only: it reads the public decision snapshot (the same prompt lists play-flow.mjs uses) and never answers
// a prompt. play-flow.mjs / app.mjs are pinned, so this sits beside them like chain-glow.mjs.
import {M} from './duel.mjs';import {publicSlot} from './play-flow.mjs';
const PILES={16:'Graveyard',32:'Banished',64:'Extra Deck'};
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Which of the viewing player's pile cards can be used right now, with the name from the matching choice label.
export function pileReady(x){
 if(!x||!['play','manual'].includes(x.mode)||x.ai||x.disabled||x.state?.finished)return [];
 const p=x.state?.prompt;if(!p)return [];
 const lists=p.type===M.SELECT_IDLECMD?[[p.activates,r=>r.action===5]]:p.type===M.SELECT_BATTLECMD?[[p.chains,r=>r.action===0]]:p.type===M.SELECT_CHAIN?[[p.selects,()=>true]]:[];
 const out=[];
 for(const [cards,isKind] of lists)(cards||[]).forEach((c,index)=>{
  const slot=publicSlot(c,x.match?.first),[seat,loc]=slot.split(':').map(Number);
  if(seat!==x.view||!PILES[loc])return;
  const choice=(x.choices||[]).find(o=>o.response&&o.response.index===index&&isKind(o.response));
  const name=String(choice?.label||'').replace(/^[^·]*·\s*/,'').trim()||'A card';
  if(!out.some(o=>o.loc===loc&&o.name===name))out.push({loc,name,pile:PILES[loc],slot});
 });
 return out;
}
export function installPileGlow({navigate=()=>{}}={}){
 let chip=null,lastKey='';
 function ensureChip(){if(chip)return chip;chip=document.createElement('div');chip.id='pile-ready-hint';chip.setAttribute('role','status');chip.hidden=true;document.body.append(chip);
  chip.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.act==='show')navigate('play');chip.hidden=true});return chip}
 function state(x){
  const ready=pileReady(x),view=x?.view??0;
  for(const n of document.querySelectorAll('[data-pile]')){const [seat,loc]=n.dataset.pile.split(':').map(Number),here=seat===view?ready.filter(r=>r.loc===loc):[];
   n.classList.toggle('pile-ready',here.length>0);n.querySelector('.pile-ready-badge')?.remove();
   if(here.length){const b=document.createElement('span');b.className='pile-ready-badge';b.textContent='⚡'+(here.length>1?here.length:'');b.setAttribute('aria-hidden','true');n.append(b);n.setAttribute('aria-description',here.map(r=>r.name).join(', ')+' can be used now')}
   else if(/can be used now$/.test(n.getAttribute('aria-description')||''))n.removeAttribute('aria-description')}
  const c=ensureChip(),key=ready.map(r=>r.slot+r.name).join('|')+'@'+(x?.state?.prompt?.type??'');
  if(!ready.length){c.hidden=true;lastKey='';return}
  if(key===lastKey)return;lastKey=key;
  const names=ready.map(r=>`<b>${escape(r.name)}</b> <small>(${escape(r.pile)})</small>`).join(', ');
  c.innerHTML=`<span class="pile-ready-icon" aria-hidden="true">⚡</span><span>${names} can be used now.</span><button type="button" data-act="show">Show me</button><button type="button" data-act="close" aria-label="Dismiss">✕</button>`;
  c.hidden=false;
 }
 return {state};
}

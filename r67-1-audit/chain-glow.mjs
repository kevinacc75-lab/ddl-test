// r34 gold aura in chain windows (Claude, 23 Oct 2026; Kevy 13:04 "an aura glow ... like Master Duel"). play-flow.mjs is
// pinned (r23-fx), so this sits beside it: when the viewing player may chain (SELECT_CHAIN), each card they could chain
// with - e.g. Ash Blossom in hand - gets .can-chain (gold aura in r34-arena.css). Presentation only: it reads the public
// decision snapshot and never answers a prompt; tapping a glowing card just opens the existing Actions panel.
import {M} from './duel.mjs';import {publicSlot} from './play-flow.mjs';
export function chainSlots(x){
 if(!x||!['play','manual'].includes(x.mode)||x.ai||x.disabled||x.state?.finished)return new Set();
 const p=x.state?.prompt;if(p?.type!==M.SELECT_CHAIN)return new Set();
 return new Set((p.selects||[]).map(c=>publicSlot(c,x.match?.first)).filter(s=>Number(s.split(':')[0])===x.view));
}
export function installChainGlow({navigate=()=>{}}={}){
 let live=new Set(),view=0;
 const slotOf=n=>n?.dataset.slot??(n?.dataset.handSequence!==undefined?view+':2:'+n.dataset.handSequence:null);
 function state(x){live=chainSlots(x);view=x?.view??0;document.body.dataset.humanDecision=String(!!x&&['play','manual'].includes(x.mode)&&!x.ai&&!x.disabled&&!x.state?.finished);/* r34 (ChatGPT RELAY-022 #5): legal-zone outlines only when a person is choosing */for(const n of document.querySelectorAll('[data-slot],#my-hand [data-hand-sequence]')){const on=live.has(slotOf(n));n.classList.toggle('can-chain',on);if(on)n.setAttribute('aria-description','You can chain this now');else if(n.getAttribute('aria-description')==='You can chain this now')n.removeAttribute('aria-description')}}
 document.addEventListener('click',e=>{const n=e.target.closest?.('.can-chain');if(!n||n.classList.contains('can-act')||document.querySelector('dialog[open]'))return;e.stopPropagation();e.preventDefault();navigate('play')/* r34.1 (ChatGPT RELAY-030 R34-02): a tap only opens the choices; long-press still opens the card dossier */},true);
 return {state};
}

// r37 matchup panel: a pilot choice under each deck (Kevy 7 Nov 21:57 AEDT: "select our AI to pilot Deck A and then set
// Windbot to pilot Deck B so that I can watch the two vs in real time"). Our AI is the default; WindBot is offered for the
// decks it has a script for, and only for a seat the computer plays (not your seat in Play, not in Control both seats).
import {windBotFor} from './decks.mjs';
const $=s=>document.querySelector(s),KEY='ddl-r37-pilot-kinds';
let saved=['ai','ai'];try{const v=JSON.parse(localStorage.getItem(KEY)||'null');if(Array.isArray(v))saved=v}catch{}
const style=document.createElement('style');style.textContent=`.wb-pilot{display:flex;align-items:center;gap:8px;margin-top:8px}.wb-pilot span{font-size:11px;letter-spacing:2px;color:var(--muted);text-transform:uppercase}.wb-pilot select{flex:1;min-width:0}
.wb-note{grid-column:1/-1;margin:0 0 4px;font-size:12px;color:var(--muted);line-height:1.45}.wb-note b{color:var(--text)}`;document.head.append(style);
const seats=[...document.querySelectorAll('.matchup-panel .seat')];
seats.forEach((seat,i)=>{const id='pilot-kind-'+'ab'[i],l=document.createElement('label');l.className='wb-pilot';l.htmlFor=id;
 l.innerHTML=`<span>Pilot</span><select id="${id}" aria-label="Deck ${'AB'[i]} pilot"><option value="ai">Our AI</option><option value="windbot">WindBot · scripted bot</option></select>`;seat.append(l);$('#'+id).value=saved[i]==='windbot'?'windbot':'ai'});
const note=document.createElement('p');note.className='wb-note';note.hidden=true;{const cfg=$('.matchup-panel .config');cfg?cfg.before(note):$('.matchup-panel')?.append(note)}/* a full-width row under the two pilot choices */
function allowed(i){const mode=$('#mode')?.value;if(mode==='manual')return 'Control both seats: no computer pilot';if(mode==='play'&&Number($('#seat')?.value)===i)return 'You pilot this deck';
 return windBotFor($('#deck-'+'ab'[i])?.value)?'':'WindBot has no script for this deck'}
export function sync(){const kinds=[];seats.forEach((_,i)=>{const sel=$('#pilot-kind-'+'ab'[i]);if(!sel)return;const why=allowed(i),opt=sel.options[1];opt.disabled=!!why;opt.textContent=why?'WindBot · '+why.toLowerCase():'WindBot · scripted bot';
  if(why&&sel.value==='windbot')sel.value='ai';kinds.push(sel.value)});
 const on=kinds.map((k,i)=>k==='windbot'?windBotFor($('#deck-'+'ab'[i]).value).label:null).filter(Boolean);note.hidden=!on.length;
 if(on.length)note.innerHTML=`<b>WindBot</b> is the open-source scripted bot from EDOPro (AGPL-3.0 licence; source included): hand-written checks for each deck, no search. It plays this site’s list with its ${on.join(' and ')} script. The first WindBot duel loads about 8 MB.`;
 try{localStorage.setItem(KEY,JSON.stringify(seats.map((_,i)=>$('#pilot-kind-'+'ab'[i])?.value||'ai')))}catch{}}
export const pilotKinds=()=>{sync();return seats.map((_,i)=>$('#pilot-kind-'+'ab'[i])?.value==='windbot'?'windbot':'ai')};
document.addEventListener('change',()=>sync());document.addEventListener('click',()=>setTimeout(sync));sync();

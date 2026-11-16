// r46 (Kevy 11 Nov 2026 14:54 AEDT: "With the victory screen include the official boss monster art so it can be easily
// identified who won"). Presentation only. presentation.mjs already loads the winning deck's boss card (decks.json boss,
// the same source as the r44 deck tiles) into #victory-art; the Aurora theme hid it behind an original emblem (r43).
// When the victory/defeat dialog opens, this shows that official art, labels it with the winner's deck name, and falls
// back to the emblem if there is no art or the image fails. No duel, worker, randomness or timing access.
const label=(frame,doc)=>{let p=frame.querySelector('.victory-boss-label');if(!p){p=doc.createElement('p');p.className='victory-boss-label';frame.appendChild(p)}return p};
export function applyVictoryBoss(doc=document){
 const scene=doc.getElementById('victory-scene'),art=doc.getElementById('victory-art'),frame=art?.closest('.victory-art-frame');if(!scene||!art||!frame)return null;
 const deckName=(doc.getElementById('victory-deck')?.textContent||'').trim(),drawn=scene.dataset.draw==='true';
 const src=art.getAttribute('src')||'',alt=art.getAttribute('alt')||'',cardName=/, boss monster of /.test(alt)?(art.getAttribute('data-card')||alt.replace(/, boss monster of .*$/,'')):alt;/* presentation.mjs sets alt = card name before each opening */
 const ok=!drawn&&!art.hidden&&!!src;
 frame.classList.toggle('has-boss',ok);
 if(ok){art.setAttribute('data-card',cardName);art.setAttribute('alt',cardName+', boss monster of '+deckName+' (winner)');}
 label(frame,doc).textContent=drawn?'':ok?'WINNER · '+deckName+' · '+cardName:(deckName?'WINNER · '+deckName:'');
 art.onerror=()=>{frame.classList.remove('has-boss');label(frame,doc).textContent=deckName?'WINNER · '+deckName:''};
 return {ok,deckName,cardName};
}
if(typeof document!=='undefined'){
 const start=()=>{const scene=document.getElementById('victory-scene');if(!scene)return;
  new MutationObserver(()=>{if(scene.open)applyVictoryBoss(document)}).observe(scene,{attributes:true,attributeFilter:['open']});
  const art=document.getElementById('victory-art');if(art)new MutationObserver(()=>{if(scene.open)applyVictoryBoss(document)}).observe(art,{attributes:true,attributeFilter:['src','hidden']});};
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
}

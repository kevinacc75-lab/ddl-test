// r52 title showcase (Claude, 13 Nov 2026; Kevy 12:52: "Each decks boss monster works"; 12:48: "I want it to have more
// Yu-Gi-Oh artwork and design"). The home crest panel becomes a slowly turning fan of each deck's boss monster - official
// card art, as already used on the boss tiles and the victory screen - over a blurred, darkened copy of the same art.
// No Yu-Gi-Oh logo or lettering is drawn. Presentation only: it never touches a duel. Reduced motion = no auto-turn.
export const BOSSES=[
 {deck:'branded',deckName:"Kevy's Branded Deck",boss:44146295,name:'Mirrorjade the Iceblade Dragon',art:'art/44146295.jpg'},
 {deck:'mikanko',deckName:'Borrowed Bosses',boss:57566760,name:'Uzuhime the Manifested Mikanko',art:'art/57566760.jpg'},
 {deck:'sky',deckName:'Zero Protocol',boss:63288573,name:'Sky Striker Ace - Kagari',art:'art/63288573.jpg'},
 {deck:'luna',deckName:'Moonlit Hunt',boss:54701958,name:'Lunalight Liger Dancer',art:'art/54701958.webp'},
 {deck:'blueeyes',deckName:'Azure Sovereign',boss:89631139,name:'Blue-Eyes White Dragon',art:'art/89631139.jpg'},
 {deck:'kashtira',deckName:'Sealed Horizon',boss:73542331,name:'Kashtira Shangri-Ira',art:'art/73542331.jpg'},
 {deck:'toon',deckName:'Ink Riot',boss:21296502,name:'Toon Dark Magician',art:'art/21296502.jpg'},
 {deck:'hero',deckName:'HERO — Mask & Vision',boss:23204029,name:'Contrast HERO Chaos',art:'art/23204029.jpg'},
 {deck:'dtw',deckName:'Time Typhoon',boss:17242022,name:'Red-Eyes Black Dragon Exceed',art:'art/17242022.jpg'}
];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const ring=(i,n)=>((i%n)+n)%n;
export function installTitleShowcase(root=document){
 const host=root.querySelector('#setup .intro .hero-art');if(!host||host.dataset.r52)return null;host.dataset.r52='1';
 const intro=host.closest('.intro');intro.classList.add('r52-intro');
 const back=document.createElement('div');back.className='r52-backdrop';back.setAttribute('aria-hidden','true');back.innerHTML='<i></i><i></i>';intro.prepend(back);
 host.classList.add('r52-showcase');host.setAttribute('role','group');host.setAttribute('aria-roledescription','carousel');host.setAttribute('aria-label','Boss monsters of the decks you can play');
 host.innerHTML=`<div class="r52-fan">${BOSSES.map((b,i)=>`<figure class="r52-card" data-i="${i}" aria-hidden="true"><img src="${esc(b.art)}" alt="" loading="${i<3||i===BOSSES.length-1?'eager':'lazy'}" decoding="async"></figure>`).join('')}</div>
<p class="r52-caption" aria-live="polite"><b></b><span></span></p>
<div class="r52-dots">${BOSSES.map((b,i)=>`<button type="button" data-go="${i}" aria-label="Show ${esc(b.name)}, boss of ${esc(b.deckName)}"></button>`).join('')}</div>`;
 const cards=[...host.querySelectorAll('.r52-card')],dots=[...host.querySelectorAll('[data-go]')],cap=host.querySelector('.r52-caption'),layers=[...back.querySelectorAll('i')];
 let cur=0,layer=0,timer=0,hold=false;
 const reduce=()=>{try{return matchMedia('(prefers-reduced-motion: reduce)').matches}catch{return false}};
 function show(i){cur=ring(i,BOSSES.length);const n=BOSSES.length;
  cards.forEach((c,k)=>{const d=ring(k-cur,n),pos=d===0?'0':d===1?'1':d===n-1?'-1':d===2?'2':d===n-2?'-2':'off';c.dataset.pos=pos});
  dots.forEach((d,k)=>d.setAttribute('aria-current',String(k===cur)));
  cap.querySelector('b').textContent=BOSSES[cur].name;cap.querySelector('span').textContent=BOSSES[cur].deckName;
  layer=1-layer;layers[layer].style.backgroundImage=`url("${BOSSES[cur].art}")`;layers[layer].classList.add('on');layers[1-layer].classList.remove('on')}
 const tick=()=>{if(!hold&&!document.hidden&&!reduce()&&!document.querySelector('#setup')?.hidden)show(cur+1)};
 const start=()=>{clearInterval(timer);timer=setInterval(tick,5200)};
 host.addEventListener('click',e=>{const b=e.target.closest('[data-go]');if(b){show(Number(b.dataset.go));start();return}const c=e.target.closest('.r52-card');if(c&&c.dataset.pos!=='0'){show(Number(c.dataset.i));start()}});
 host.addEventListener('pointerenter',()=>hold=true);host.addEventListener('pointerleave',()=>hold=false);
 host.addEventListener('focusin',()=>hold=true);host.addEventListener('focusout',()=>hold=false);
 host.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){show(cur+1);dots[cur].focus();e.preventDefault()}if(e.key==='ArrowLeft'){show(cur-1);dots[cur].focus();e.preventDefault()}});
 show(0);start();
 return {show,get current(){return cur}};
}
if(typeof document!=='undefined'){const go=()=>installTitleShowcase();if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',go,{once:true});else go()}

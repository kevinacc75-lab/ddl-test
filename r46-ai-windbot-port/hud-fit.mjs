// r35.3 (Claude, 24 Oct 2026; Kevy's play-test recordings on a 16:10 screen): the Duel controls gear (fixed, top-right)
// covered the last digit of the opponent's LP ("800" for 8000, "650" for 6500) when the table fills the screen width.
// After each layout change this measures both boxes and, only if they overlap, moves the opponent's player bar left just
// enough to clear the gear (8px gap). Presentation only; nothing else moves, and other screen shapes are unchanged.
export function installHudFit(){
 let shift=0;
 function fit(){
  const gear=document.querySelector('.duel-controls-fab'),bar=document.querySelector('#duel .player-bar.opponent');
  if(!gear||!bar||!document.body.classList.contains('in-duel'))return;
  const g=gear.getBoundingClientRect();if(!g.width)return;
  bar.style.removeProperty('right');shift=0;
  // The table can be scaled, so a CSS-pixel move is not a screen-pixel move: step until clear (at most 6 tries).
  for(let i=0;i<6;i++){const b=bar.getBoundingClientRect();if(!b.width)return;
   // RELAY-044 R44-03: full rectangle-overlap test (with the 8px gap), so a bar that starts inside the gear's span is moved too.
   const over=b.right+8-g.left;if(!(over>0&&b.left<g.right+8&&b.top<g.bottom&&b.bottom>g.top))return;
   const cur=parseFloat(getComputedStyle(bar).right)||0;shift+=Math.ceil(over);bar.style.setProperty('right',(cur+Math.ceil(over))+'px','important')}
 }
 let raf=0;const later=()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(fit)};
 addEventListener('resize',later);addEventListener('orientationchange',later);setInterval(()=>{if(document.body.classList.contains('in-duel'))later()},1500);/* layout code can rewrite the bar; re-check */
 return {state:later,fit};
}

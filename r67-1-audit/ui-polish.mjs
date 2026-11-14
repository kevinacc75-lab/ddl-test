// r43 P1 UI polish (presentation only): keeps the FX settings popover inside the viewport.
// It never touches the duel, the worker, prompts, randomness or timing; it only sets one CSS variable.
const details=document.querySelector('details.media-settings'),pop=details?.querySelector('.settings-popover');
function clamp(){if(!details?.open||!pop)return;pop.style.setProperty('--pop-shift','0px');const r=pop.getBoundingClientRect(),pad=8,vw=document.documentElement.clientWidth;let dx=0;if(r.left<pad)dx=pad-r.left;else if(r.right>vw-pad)dx=Math.max(pad-r.left,vw-pad-r.right);if(dx)pop.style.setProperty('--pop-shift',Math.round(dx)+'px')}
details?.addEventListener('toggle',()=>requestAnimationFrame(clamp));addEventListener('resize',()=>requestAnimationFrame(clamp));
export {clamp as clampSettingsPopover};

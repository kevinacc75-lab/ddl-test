// r34 quick Pause / One action (Claude, 23 Oct 2026; ChatGPT RELAY-022 #9: pausing meant opening the big settings panel).
// Two small buttons beside Skip FX that press the existing #pause / #step buttons, so the app's own pause logic runs
// unchanged (app.mjs is pinned). Labels and disabled states mirror those buttons.
export function installDuelQuickbar(){
 const bar=document.createElement('div');bar.id='duel-quickbar';bar.setAttribute('role','group');bar.setAttribute('aria-label','Playback');
 bar.innerHTML='<button type="button" data-for="pause"></button><button type="button" data-for="step"></button>';document.body.append(bar);
 const label={pause:t=>/resume/i.test(t)?'▶ Resume':'❚❚ Pause',step:()=>'▶❚ One action'};
 function sync(){for(const b of bar.querySelectorAll('button')){const src=document.getElementById(b.dataset.for);b.hidden=!src;if(!src)continue;b.textContent=label[b.dataset.for](src.textContent||'');b.disabled=src.disabled;b.title=src.textContent||'';b.setAttribute('aria-pressed',String(b.dataset.for==='pause'&&/resume/i.test(src.textContent||'')))}
  bar.hidden=!document.body.classList.contains('in-duel')}
 bar.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;document.getElementById(b.dataset.for)?.click();setTimeout(sync,0)});
 const mo=new MutationObserver(sync);for(const id of ['pause','step']){const n=document.getElementById(id);if(n)mo.observe(n,{attributes:true,childList:true,characterData:true,subtree:true})}
 new MutationObserver(sync).observe(document.body,{attributes:true,attributeFilter:['class']});sync();
 return {sync};
}

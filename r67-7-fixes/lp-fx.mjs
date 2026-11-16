// Presentation-only LP profiles. Engine state remains authoritative.
export const LP_TYPES=new Set(['damage','cost','recover','lpUpdate']);
export const easeOutCubic=t=>1-Math.pow(1-Math.max(0,Math.min(1,t)),3);
export function lpProfile(e){
 const amount=Math.abs(e.amount??(e.after-e.before))||0;
 const gain=e.type==='recover'||e.type==='lpUpdate'&&e.after>e.before;
 const cost=e.type==='cost',damage=!gain&&!cost;
 const tickMs=amount<=500?600:amount>=4000?900:Math.round(600+(amount-500)*300/3500);
 const tier=!damage?'none':amount>=4000||e.after<=1000?'critical':amount>=2000?'heavy':amount>=1000?'medium':'light';
 const [shakePx,shakeMs,edgeMs,whiteMs]={none:[0,0,0,0],light:[4,150,0,0],medium:[4,200,120,0],heavy:[8,280,200,0],critical:[12,350,200,80]}[tier];
 return {amount,gain,cost,damage,tickMs,tier,shakePx,shakeMs,edgeMs,whiteMs,lethal:damage&&e.before>0&&e.after===0,colour:gain?'#5ff5a8':cost?'#ffc15a':'#ff526a'};
}
export function lpBatches(e,{preset='duel',postPanel=false}={}){
 const p=lpProfile(e),instant=preset==='instant',delayMs=postPanel&&!instant?150:0;
 const result=[{events:[{...e,lpFx:true,delayMs}],duration:instant?0:delayMs+p.tickMs+300}];
 return result;
}
export function createLpFx({badge,wrapper,layer,write,held=()=>false,reduced=()=>false,sound,animate,scale=1,onTick=()=>{}}){
 let timer,cleanup,active=null,stamp=0,elapsed=0;
 const chips=new Set();
 function finish(){if(active){write(active.player,active.after);active=null;}clearTimeout(timer);clearTimeout(cleanup);for(const chip of chips)chip.remove();chips.clear();}
 function start(e){
  finish();const p=lpProfile(e),node=badge(e.player),before=e.before,after=e.after;
  const chip=document.createElement('span');chip.className='lp-delta lp-float '+(p.gain?'recovery':p.cost?'lp-cost':'lp-damage');chip.textContent=(p.gain?'+':'−')+p.amount;chip.style.setProperty('--lp-colour',p.colour);chip.style.setProperty('--lp-float-duration',900*scale+'ms');node.append(chip);chips.add(chip);
  const remove=()=>{chip.remove();chips.delete(chip)};chip.addEventListener('animationend',remove,{once:true});cleanup=setTimeout(remove,900*scale);
  if(!reduced()&&p.shakeMs)animate(p.tier==='light'?node:wrapper(),[{transform:'translate(0,0)'},{transform:`translate(${-p.shakePx}px,0)`},{transform:`translate(${p.shakePx}px,0)`},{transform:`translate(${-p.shakePx/2}px,0)`},{transform:'translate(0,0)'}],{duration:p.shakeMs*scale,easing:'ease-out'});
  for(const [kind,ms] of [['edge',p.edgeMs],['white',p.whiteMs]])if(ms){const flash=document.createElement('div');flash.className='lp-impact-'+kind;flash.style.opacity=reduced()?'.5':'1';layer.append(flash);const a=animate(flash,[{opacity:reduced()?.5:1},{opacity:0}],{duration:ms*scale,fill:'forwards'});if(a)a.finished.catch(()=>{}).finally(()=>flash.remove());else setTimeout(()=>flash.remove(),ms*scale);}
  sound.setEvent?.({...e,tier:p.tier});sound.play(p.gain?'recover':p.cost?'cost':'lp'+p.tier[0].toUpperCase()+p.tier.slice(1));sound.play('lpTick');
  active={player:e.player,before,after};elapsed=0;stamp=Date.now();write(e.player,before);onTick({type:'start',event:e,profile:p});
  const tick=()=>{if(!active)return;const now=Date.now();if(!held())elapsed+=now-stamp;stamp=now;const t=Math.min(1,elapsed/Math.max(1,p.tickMs*scale));write(e.player,Math.round(before+(after-before)*easeOutCubic(t)));if(t<1)timer=setTimeout(tick,Math.max(1,16*scale));else{write(e.player,after);active=null;onTick({type:'end',event:e,profile:p});}};
  tick();
 }
 function reset(){finish();clearTimeout(cleanup);for(const chip of chips)chip.remove();chips.clear();}
 return {start,finish,reset,get active(){return !!active}};
}

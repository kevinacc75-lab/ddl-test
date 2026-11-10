// Dynamic !important safety scan. Loads r42 (legacy 23 sheets), drives many states/themes/viewports,
// and flags an !important declaration as UNSAFE to drop if, on any element it could match, a competitor
// (same property family + pseudo-element) could win once the flag is gone, or the element ever gets an
// inline style / CSS animation / Web Animation on that family. Never-matched declarations stay as-is.
import {chromium} from '/workspace/tools-pw/node_modules/playwright-core/index.mjs';
import fs from 'node:fs';
const URL=process.argv[2];const OUT=process.argv[3];const THEME=process.argv[4];const VP=process.argv[5]||'desktop';const MODE=process.argv[6]||'watch';
const tasks=JSON.parse(fs.readFileSync('/tmp/r43-css-tasks.json'));const kf=JSON.parse(fs.readFileSync('/tmp/r43-css-keyframes.json'));
const VPS={desktop:{viewport:{width:1280,height:800}},portrait:{viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1},landscape:{viewport:{width:844,height:390},isMobile:true,hasTouch:true,deviceScaleFactor:1},tablet:{viewport:{width:1024,height:640},hasTouch:true},wide:{viewport:{width:1680,height:1000}},ipad:{viewport:{width:768,height:1024},isMobile:true,hasTouch:true},laptop:{viewport:{width:1100,height:700}}};
const famOf=p=>{p=p.toLowerCase();if(p.startsWith('--'))return p;p=p.replace(/^-(webkit|moz|ms|o)-/,'');if(/^(top|right|bottom|left|inset)(-|$)/.test(p))return 'inset';if(/^(gap|row-gap|column-gap|grid-gap)$/.test(p))return 'gap';if(/^(place|align|justify)-/.test(p))return 'align';if(p==='line-height')return 'font';if(p==='word-wrap')return 'overflow';return p.split('-')[0]};
const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
const ctx=await b.newContext({...VPS[VP],reducedMotion:process.env.RM?'reduce':'no-preference'});
await ctx.addInitScript(({t,pace,cine})=>{try{const k='doctrine-lab-media-v2';const p=JSON.parse(localStorage.getItem(k)||'{}');if(!p.__seeded){Object.assign(p,{theme:t,showtimeIntro:1,auroraIntro:1,__seeded:1});if(pace)p.preset=pace;if(cine==='off')p.cinematics=false;localStorage.setItem(k,JSON.stringify(p))}}catch{}},{t:THEME,pace:process.env.PACE,cine:process.env.CINE});
await ctx.addInitScript(({tasks,kf,famSrc})=>{const famOf=new Function('return '+famSrc)();
 const unsafe=new Map(),seen=new Set();window.__imp={unsafe,seen};const flag=(id,why)=>{if(!unsafe.has(id))unsafe.set(id,why)};
 const byFam={};for(const t of tasks){if(t.bad){flag(t.id,t.bad);continue}(byFam[t.fam]||=[]).push(t)}
 const safeMatches=(el,sel)=>{try{return el.matches(sel)}catch{return true}};
 const touch=(el,fam,pe,why)=>{for(const t of byFam[fam]||[])for(const s of t.per)if(s.pe===(pe||'')&&safeMatches(el,s.match))flag(t.id,why)};
 const inlineCheck=el=>{if(!el.style)return;for(let i=0;i<el.style.length;i++)touch(el,famOf(el.style[i]),'','inline:'+el.style[i])};
 const orig=Element.prototype.animate;Element.prototype.animate=function(k,o){try{const props=new Set();for(const f of (Array.isArray(k)?k:[k]))for(const p of Object.keys(f||{}))if(!['offset','easing','composite'].includes(p))props.add(p.replace(/[A-Z]/g,c=>'-'+c.toLowerCase()));const pe=(o&&o.pseudoElement)||'';for(const p of props)touch(this,famOf(p),pe,'waapi:'+p)}catch{}return orig.apply(this,arguments)};
 addEventListener('animationstart',e=>{for(const f of kf[e.animationName]||[])touch(e.target,f,e.pseudoElement||'','anim:'+e.animationName)},true);
 new MutationObserver(ms=>{for(const m of ms){if(m.type==='attributes')inlineCheck(m.target);else for(const n of m.addedNodes)if(n.nodeType===1){inlineCheck(n);n.querySelectorAll?.('[style]').forEach(inlineCheck)}}}).observe(document,{subtree:true,childList:true,attributes:true,attributeFilter:['style']});
 const condOk=ms=>{for(const [n,q] of ms||[]){try{if(n==='media'&&!matchMedia(q).matches)return false;if(n==='supports'&&!CSS.supports(q))return false}catch{}}return true};
 window.__impScan=()=>{const cache=new Map();const q=s=>{if(!cache.has(s)){let r;try{r=new Set(document.querySelectorAll(s))}catch{r=null}cache.set(s,r)}return cache.get(s)};
  document.querySelectorAll('[style]').forEach(inlineCheck);
  for(const a of document.getAnimations()){const el=a.effect?.target;if(!el)continue;const pe=a.effect.pseudoElement||'';const name=a.animationName;const fams=name?kf[name]||[]:[...new Set((a.effect.getKeyframes?.()||[]).flatMap(f=>Object.keys(f)).filter(p=>!['offset','easing','composite','computedOffset'].includes(p)).map(p=>famOf(p.replace(/[A-Z]/g,c=>'-'+c.toLowerCase()))))];for(const f of fams)touch(el,f,pe,'anim-live')}
  for(const t of tasks){if(t.bad||unsafe.has(t.id))continue;if(!condOk(t.media))continue;for(const s of t.per){const els=q(s.match);if(els===null){flag(t.id,'qsa-fail');break}if(!els.size)continue;seen.add(t.id);
    for(const [c,cm] of s.comp){if(!condOk(cm))continue;const ce=q(c);if(ce===null){flag(t.id,'comp-qsa-fail');break}if(!ce.size)continue;let hit=false;for(const e of els)if(ce.has(e)){hit=true;break}if(hit){flag(t.id,'comp:'+c.slice(0,80));break}}if(unsafe.has(t.id))break}}
  return {unsafe:unsafe.size,seen:seen.size}};
},{tasks,kf,famSrc:famOf.toString()});
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
const scan=async tag=>{const r=await p.evaluate(()=>window.__impScan());log.push([tag,r])};const log=[];
await p.goto(URL);await p.waitForFunction(()=>!document.querySelector('#start').disabled,null,{timeout:180000});await p.waitForTimeout(500);await scan('home');
for(const fn of [()=>{document.querySelector('details.media-settings').open=true},()=>{document.querySelector('details.media-settings').open=false;document.querySelector('#deck-grid [data-deck]')?.click()},()=>document.querySelector('#modal')?.close(),()=>document.querySelector('#help').click(),()=>document.querySelector('#modal')?.close(),()=>document.querySelector('#credits')?.click(),()=>document.querySelector('#modal')?.close(),()=>document.querySelector('#preview-fx')?.click(),()=>document.querySelector('#modal')?.close()]){await p.evaluate(fn).catch(()=>{});await p.waitForTimeout(500);await scan('home-state')}
// deck list view inside deck info if present
await p.evaluate(()=>{document.querySelector('#deck-grid [data-deck]')?.click()});await p.waitForTimeout(500);await p.evaluate(()=>{for(const b of document.querySelectorAll('#modal-body button'))if(/list|cards|view/i.test(b.textContent)){b.click();break}});await p.waitForTimeout(700);await scan('decklist');await p.evaluate(()=>document.querySelector('#modal')?.close());
if(MODE==='play')await p.selectOption('#mode','play');if(MODE==='manual')await p.selectOption('#mode','manual');if(MODE==='hand')await p.selectOption('#mode','hand');
await p.fill('#game-seed',process.env.SEED||'4242');await p.evaluate(()=>document.querySelector('#start').click());await p.waitForTimeout(1000);
await p.evaluate(()=>{const b=document.querySelector('#portrait-continue');if(b&&b.offsetParent)b.click()});
const T=+(process.env.SECS||40);for(let s=0;s<T;s++){await p.waitForTimeout(1000);
 if(MODE==='play'||MODE==='manual'){await p.evaluate(()=>{const c=[...document.querySelectorAll('#choices button:not([disabled])')];if(c.length&&Math.random()<.6)c[Math.floor(Math.random()*c.length)].click()}).catch(()=>{})}
 if(s===8)await p.evaluate(()=>{for(const v of ['play','coach','journal','field'])document.querySelector(`.duel-nav [data-view="${v}"]`)?.click()}).catch(()=>{});
 if(s===12)await p.evaluate(()=>{document.querySelector('#chain-log-btn')?.click()}).catch(()=>{});
 if(s===14)await p.evaluate(()=>{document.querySelector('#chain-log-btn')?.click()}).catch(()=>{});
 await scan('duel-'+s)}
await p.evaluate(()=>{document.querySelector('#pause')?.click()});await p.waitForTimeout(400);
await p.evaluate(()=>{const t=document.querySelector('#duel-controls-toggle');if(t&&!t.hidden)t.click();else document.querySelector('#duel-controls')?.showModal?.()});await p.waitForTimeout(500);await scan('controls');
await p.evaluate(()=>document.querySelector('#duel-controls')?.close?.());
await p.evaluate(()=>{for(const v of ['play','coach','journal','field']){document.querySelector(`.duel-nav [data-view="${v}"]`)?.click()}});await scan('views');
const res=await p.evaluate(()=>({unsafe:[...window.__imp.unsafe],seen:[...window.__imp.seen]}));
fs.writeFileSync(OUT,JSON.stringify({THEME,VP,MODE,env:{PACE:process.env.PACE,RM:process.env.RM,CINE:process.env.CINE},errs,log:log.slice(-3),...res}));
console.log(THEME,VP,MODE,'unsafe',res.unsafe.length,'seen',res.seen.length,'errs',errs.length);await b.close();

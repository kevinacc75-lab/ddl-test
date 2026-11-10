// Legacy-equivalence check: on the live r42 page, at many moments, compare the computed style of every
// element (+ ::before/::after) under the 23 original sheets vs the r43 bundles (base, theme-showtime, duel,
// panels, fx). Both readings happen in one synchronous task on the same DOM, so any difference is CSS-caused.
import {chromium} from '/workspace/tools-pw/node_modules/playwright-core/index.mjs';
import fs from 'node:fs';
const [,,URL,BUNDLE_BASE,OUT,THEME,VP='desktop',MODE='watch']=process.argv;
const VPS={desktop:{viewport:{width:1280,height:800}},portrait:{viewport:{width:390,height:844},isMobile:true,hasTouch:true},landscape:{viewport:{width:844,height:390},isMobile:true,hasTouch:true},laptop:{viewport:{width:1100,height:700}}};
const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
const ctx=await b.newContext({...VPS[VP],reducedMotion:process.env.RM?'reduce':'no-preference'});
await ctx.addInitScript(t=>{try{const k='doctrine-lab-media-v2';const p=JSON.parse(localStorage.getItem(k)||'{}');if(!p.__seeded){Object.assign(p,{theme:t,showtimeIntro:1,__seeded:1});localStorage.setItem(k,JSON.stringify(p))}}catch{}},THEME);
const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto(URL);await p.waitForFunction(()=>!document.querySelector('#start').disabled,null,{timeout:180000});
await p.evaluate(base=>{const legacy=[...document.querySelectorAll('link[rel=stylesheet]')];window.__legacy=legacy;window.__bund=['base','theme-showtime','duel','panels','fx'].map(n=>{const l=document.createElement('link');l.rel='stylesheet';l.href=base+n+'.css';l.disabled=true;legacy.at(-1).after(l);return l});
 // ensure order: insert bundles in order after last legacy link
 let prev=legacy.at(-1);for(const l of window.__bund){prev.after(l);prev=l}},BUNDLE_BASE);
await p.waitForFunction(()=>window.__bund.every(l=>l.sheet),null,{timeout:30000}).catch(()=>{});
// disabled links may not load: enable+disable dance to force load
await p.evaluate(()=>{for(const l of window.__bund)l.disabled=false});await p.waitForFunction(()=>window.__bund.every(l=>l.sheet&&l.sheet.cssRules.length),null,{timeout:30000});
await p.evaluate(async()=>{for(const l of window.__legacy)l.sheet.disabled=true;document.body.offsetWidth;await document.fonts.ready;await Promise.all([...document.fonts].map(f=>f.load().catch(()=>{})));for(const l of window.__bund)l.sheet.disabled=true;for(const l of window.__legacy)l.sheet.disabled=false;await document.fonts.ready});
const diffs=[];let checks=0;
const compare=async tag=>{const r=await p.evaluate(()=>{const els=[...document.querySelectorAll('*')];const read=()=>{const out=[];for(const el of els)for(const pe of [null,'::before','::after']){const cs=getComputedStyle(el,pe);if(pe&&cs.content==='none'){out.push('');continue}let s='';for(let i=0;i<cs.length;i++){const k=cs[i];s+=k+':'+cs.getPropertyValue(k)+';'}out.push(s)}return out};
  const A=read();for(const l of window.__legacy)l.sheet.disabled=true;for(const l of window.__bund)l.sheet.disabled=false;const B=read();for(const l of window.__bund)l.sheet.disabled=true;for(const l of window.__legacy)l.sheet.disabled=false;
  const d=[];for(let i=0;i<A.length&&d.length<40;i++)if(A[i]!==B[i]){const el=els[Math.floor(i/3)];const pa=Object.fromEntries(A[i].split(';').filter(Boolean).map(x=>{const j=x.indexOf(':');return [x.slice(0,j),x.slice(j+1)]})),pb=Object.fromEntries(B[i].split(';').filter(Boolean).map(x=>{const j=x.indexOf(':');return [x.slice(0,j),x.slice(j+1)]}));const props=[...new Set([...Object.keys(pa),...Object.keys(pb)])].filter(k=>pa[k]!==pb[k]);d.push({el:el.tagName+(el.id?'#'+el.id:'')+(el.className&&typeof el.className==='string'?'.'+el.className.split(' ').join('.'):''),pe:['','::before','::after'][i%3],props:props.slice(0,6).map(k=>[k,(pa[k]||'').slice(0,90),(pb[k]||'').slice(0,90)])})}
  return {n:els.length,d}});checks++;if(r.d.length)diffs.push({tag,...r})};
await compare('home');
for(const fn of [()=>{document.querySelector('details.media-settings').open=true},()=>{document.querySelector('details.media-settings').open=false;document.querySelector('#deck-grid [data-deck]')?.click()},()=>document.querySelector('#modal')?.close(),()=>document.querySelector('#help').click(),()=>document.querySelector('#modal')?.close()]){await p.evaluate(fn).catch(()=>{});await p.waitForTimeout(400);await compare('home-state')}
if(MODE==='play')await p.selectOption('#mode','play');
await p.fill('#game-seed','4242');await p.evaluate(()=>document.querySelector('#start').click());await p.waitForTimeout(1000);
await p.evaluate(()=>{const b=document.querySelector('#portrait-continue');if(b&&b.offsetParent)b.click()});
for(let s=0;s<+(process.env.SECS||24);s+=2){await p.waitForTimeout(2000);if(MODE==='play')await p.evaluate(()=>{const c=[...document.querySelectorAll('#choices button:not([disabled])')];if(c.length)c[0].click()}).catch(()=>{});await compare('duel-'+s)}
await p.evaluate(()=>{document.querySelector('#pause')?.click();const t=document.querySelector('#duel-controls-toggle');if(t&&!t.hidden)t.click();else document.querySelector('#duel-controls')?.showModal?.()});await p.waitForTimeout(500);await compare('controls');
fs.writeFileSync(OUT,JSON.stringify({THEME,VP,MODE,checks,diffCount:diffs.length,errs,diffs},null,1));console.log(THEME,VP,MODE,'checks',checks,'snapshots-with-diffs',diffs.length,'errs',errs.length);await b.close();

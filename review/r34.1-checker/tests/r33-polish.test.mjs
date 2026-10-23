// r33 tablet smoothness and caption placement (Claude, 23 Oct). SELF-VERIFIED (builder = verifier), NOT independent.
// Kevy 22 Oct 23:29: "the animations at times can be janky not sure if it's just the tablet".
// 1. r33-polish.css is loaded and offline-listed; on Balanced / Smooth (the automatic choice on touch screens) the route glow
//    no longer animates its shadow, route dashes stop after a few loops, zone flares drop the brightness filter, and the
//    page cannot drift sideways on phones.
// 2. No forced layout in the duel update path: the shell reads the window size only on resize; captions and route glows
//    restart their animations without reading offsetWidth.
// 3. At most MAX_ROUTES route lines on screen at once.
// 4. The combo-plan chip sits just below the opponent's revealed hand, not on it.
import assert from 'node:assert/strict';import fs from 'node:fs';import {JSDOM} from 'jsdom';
const css=fs.readFileSync('dist/r33-polish.css','utf8'),html=fs.readFileSync('dist/index.html','utf8'),offline=JSON.parse(fs.readFileSync('dist/offline-assets.json','utf8'));
assert.ok(html.includes('href="./r33-polish.css"')&&html.includes('href="./deck-list.css"'),'stylesheets linked');
for(const f of ['./r33-polish.css','./deck-list.css','./deck-list.mjs','./deck-cards.json'])assert.ok(offline.includes(f),f+' offline');
assert.match(css,/html\{overflow-x:clip\}/);
assert.match(css,/body:is\(\[data-graphics=balanced\],\[data-graphics=smooth\]\) :is\(\.lr-glow,\.lr-activate,\.lr-target\)\{animation:none!important\}/);
assert.match(css,/\.lr-flow\{animation-iteration-count:4\}/);
assert.match(css,/@keyframes fx23-zone-lite\{[^@]*\}/);assert.ok(!/fx23-zone-lite\{[^@]*filter/.test(css),'lite flare has no filter');
assert.match(css,/animation-name:fx23-zone-lite!important/);
const shell=fs.readFileSync('dist/app-shell.mjs','utf8'),resize=shell.slice(shell.indexOf('function resize('),shell.indexOf("window.addEventListener('resize'"));
assert.ok(!/window\.inner(Width|Height)/.test(resize.replace("if(e?.type==='resize'){viewW=window.innerWidth;viewH=window.innerHeight}",'')),'resize() reads the window size only on a resize event');
for(const f of ['dist/learning-captions.mjs','dist/learning-routes.mjs'])assert.ok(!/void [a-z]+\.offsetWidth/.test(fs.readFileSync(f,'utf8')),f+': no forced reflow');
// 3. Route-line cap
const dom=new JSDOM('<!doctype html><body><div id="layer"></div><div id="opp-hand"></div></body>',{url:'https://lab.test/'});Object.assign(globalThis,{document:dom.window.document,window:dom.window});
const {createLearningRoutes,MAX_ROUTES}=await import('../dist/learning-routes.mjs');const doc=dom.window.document;
const nodes=new Map();const point=z=>{const k=z.controller+':'+z.location+':'+z.sequence;if(!nodes.has(k)){const n=doc.createElement('div');n.getBoundingClientRect=()=>({left:100+z.sequence*90,top:z.location===16?600:300,width:80,height:110});doc.body.append(n);nodes.set(k,n)}return nodes.get(k)};
const routes=createLearningRoutes({layer:doc.querySelector('#layer'),point,db:()=>({}),on:()=>true});
for(let i=0;i<10;i++)routes.flight({type:'move',code:1000+i,from:{controller:0,location:16,sequence:i},to:{controller:0,location:4,sequence:i%5},reason:0x40},0,400);
const svgs=doc.querySelectorAll('#layer svg').length;assert.ok(svgs>0&&svgs<=MAX_ROUTES,'route lines capped at '+MAX_ROUTES+' (got '+svgs+')');
// 4. Chip placement
doc.querySelector('#opp-hand').getBoundingClientRect=()=>({top:32,bottom:106,height:74,left:354,width:472});
const {createLearningCaptions,CAPTION_MS}=await import('../dist/learning-captions.mjs');
const cap=createLearningCaptions({root:doc.body,getDecks:()=>[{id:'branded',name:'Crimson Abyss'},{id:'luna',name:'Moonlit Hunt'}],on:()=>true,timingScale:0.01});
cap.state({state:{turn:1,finished:false},coach:{last:null,intent:{seat:0,turn:1,book:{kind:'step',rule:'Opening book L-01'}}}});
await new Promise(r=>setTimeout(r,CAPTION_MS.banner*0.01+30));const chip=doc.querySelector('.lr-plan');
assert.ok(chip.classList.contains('lr-plan-mini'));assert.equal(chip.style.top,'112px','chip just below the revealed hand');
cap.state({state:{turn:2,finished:false},coach:{last:null,intent:null}});assert.equal(chip.style.top,'','reset when hidden');
console.log(JSON.stringify({test:'r33-polish',pass:true,routeCap:MAX_ROUTES,node:process.version,selfVerified:true}));

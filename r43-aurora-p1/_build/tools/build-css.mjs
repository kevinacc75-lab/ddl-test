// r43 CSS build step. Bundles the 23 legacy r42 sheets, in the SAME cascade order, into css/{base,theme-showtime,duel,panels,fx}.css
// (tokens.css first and aurora.css last are hand-written). Edits made to legacy rules:
//  1. relative url(...) rebased by '../' because the bundles live in css/;
//  2. !important dropped ONLY for declarations listed in tools/data/important-safe.json, which the dynamic
//     cascade scan (tools/css-imp-scan.mjs, 27+ runs: 4 legacy themes x 7 viewports x watch/play/manual/hand,
//     4 paces, reduced motion, cutscenes off) proved could never lose to a competitor, an inline style or an animation.
// Each listed declaration is checked against its recorded source text before it is edited.
import fs from 'node:fs';import path from 'node:path';
import postcss from '/tmp/cssdeps/node_modules/postcss/lib/postcss.js';
import {ORDER_LIST} from './css-common.mjs';
const DIST=process.argv[2]||'dist';
export const BUNDLES={base:['style','arena','mobile-motion','vibrant','master-duel','lab-shell','pacing-impact','arenas'],'theme-showtime':['showtime'],duel:['fusion-materials','summon-cutscenes','coin-cutscene','human-flow','play-flow','fx-r23','token-fx'],panels:['r26-panels','learning-routes','deck-list','r33-polish','r34-arena','r34-persona'],fx:['dl-fx']};
const safe=JSON.parse(fs.readFileSync(new URL('./data/important-safe.json',import.meta.url)));const safeIds=new Map(safe.map(x=>[x.id,x.src]));
const sheets=ORDER_LIST.map(n=>({n,root:postcss.parse(fs.readFileSync(path.join(DIST,n+'.css'),'utf8'),{from:n+'.css'})}));
// same traversal as css-decls.mjs → same ids
let id=-1,before=0,removed=0;const perFile={};
for(const s of sheets){let b=0,r=0;s.root.walkRules(rule=>{for(let p=rule.parent;p;p=p.parent)if(p.type==='atrule'&&/keyframes$/i.test(p.name))return;rule.each(d=>{if(d.type!=='decl')return;id++;if(!d.important)return;b++;
  if(safeIds.has(id)){const src=(rule.selector+'{'+d.prop+':'+d.value+'!important}').slice(0,200);if(src!==safeIds.get(id))throw new Error('id/source mismatch '+id);d.important=false;r++}})});
 s.root.walkAtRules(/keyframes$/i,a=>a.walkDecls(d=>{if(d.important)b++}));perFile[s.n]={before:b,removed:r,after:b-r};before+=b;removed+=r}
const rebase=v=>v.replace(/url\(\s*(['"]?)(?!data:|https?:|\/|#)([^'")]+)\1\s*\)/g,(m,q,u)=>`url(${q}../${u}${q})`);
for(const s of sheets)s.root.walkDecls(d=>{if(/url\(/.test(d.value))d.value=rebase(d.value)});
fs.mkdirSync(path.join(DIST,'css'),{recursive:true});
for(const [b,list] of Object.entries(BUNDLES)){const out=list.map(n=>`/* ==== ${n}.css (r42 source; urls rebased; proven-redundant !important flags dropped) ==== */\n`+sheets.find(s=>s.n===n).root.toString()).join('\n');fs.writeFileSync(path.join(DIST,'css',b+'.css'),out+'\n')}
const count=f=>(fs.readFileSync(path.join(DIST,'css',f),'utf8').match(/!important/g)||[]).length;
const bundles=Object.fromEntries(['tokens.css','aurora.css',...Object.keys(BUNDLES).map(b=>b+'.css')].map(f=>[f,count(f)]));
const summary={legacyImportantBefore:before,dropped:removed,legacyImportantAfter:before-removed,pctDropped:+(100*removed/before).toFixed(1),bundles,totalImportantShipped:Object.values(bundles).reduce((a,b)=>a+b,0),perFile};
fs.writeFileSync(path.join(DIST,'..','css-build-summary.json'),JSON.stringify(summary,null,1));console.log(JSON.stringify({...summary,perFile:undefined}));

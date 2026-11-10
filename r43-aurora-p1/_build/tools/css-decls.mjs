// Extract every declaration of the 23 legacy sheets with per-selector specificity, pseudo-element,
// a broadened "could match" selector (dynamic pseudo-classes and attribute selectors removed), and
// the list of competitor declarations that could beat it if its !important flag were dropped.
import fs from 'node:fs';import path from 'node:path';
import postcss from '/tmp/cssdeps/node_modules/postcss/lib/postcss.js';
import spp from '/tmp/cssdeps/node_modules/postcss-selector-parser/dist/index.js';
import {ORDER_LIST,family} from './css-common.mjs';
const DIST=process.argv[2]||'dist';
const DYN=new Set([':hover',':focus',':focus-visible',':focus-within',':active',':visited',':link',':any-link',':target',':checked',':disabled',':enabled',':indeterminate',':placeholder-shown',':invalid',':valid',':required',':optional',':empty',':open',':popover-open',':modal',':fullscreen',':default',':read-only',':read-write',':user-invalid',':autofill',':-webkit-autofill',':playing',':paused',':defined']);
const PSEUDO_EL=/^(::?(before|after|first-line|first-letter)|::[\w-]+)$/;
function spec(sel){let a=0,b=0,c=0;const walk=nodes=>{for(const n of nodes){if(n.type==='id')a++;else if(n.type==='class'||n.type==='attribute')b++;else if(n.type==='tag'&&n.value!=='*')c++;else if(n.type==='pseudo'){const v=n.value.toLowerCase();if(PSEUDO_EL.test(v)&&(v.startsWith('::')||/^:(before|after|first-line|first-letter)$/.test(v)))c++;else if(v===':where'){}else if([':is',':not',':has',':matches',':-webkit-any'].includes(v)){let best=[0,0,0];for(const s of n.nodes){const r=specOf(s);if(cmp(r,best)>0)best=r}a+=best[0];b+=best[1];c+=best[2]}else b++}}};const specOf=s=>{let sa=a,sb=b,sc=c;a=b=c=0;walk(s.nodes);const r=[a,b,c];a=sa;b=sb;c=sc;return r};walk(sel.nodes);return [a,b,c]}
const cmp=(x,y)=>x[0]-y[0]||x[1]-y[1]||x[2]-y[2];
function analyse(selText){const out=[];spp(root=>{for(const sel of root.nodes){const sp=spec(sel);let pe='';const clone=sel.clone();
  clone.walkPseudos(p=>{const v=p.value.toLowerCase();if(PSEUDO_EL.test(v)&&(v.startsWith('::')||/^:(before|after|first-line|first-letter)$/.test(v))){pe=v.replace(/^:+/,'::');p.remove()}});
  clone.walkPseudos(p=>{const v=p.value.toLowerCase();if(DYN.has(v))p.remove()});
  clone.walkAttributes(a=>{if(a.attribute==='data-theme'&&['vibrant','classic','contrast','showtime'].includes((a.value||'').replace(/["']/g,''))&&a.parent.nodes.some(n=>n.type==='tag'&&n.value==='body'))return;a.remove()});
  // :not()/:is()/:has() whose arguments became empty or that could exclude states -> drop :not entirely (broader)
  clone.walkPseudos(p=>{const v=p.value.toLowerCase();if(v===':not')p.remove();else if([':is',':where',':has',':matches',':-webkit-any'].includes(v))for(const s of p.nodes)if(!s.nodes.length||s.nodes.every(n=>n.type==='combinator'))s.append(spp.universal())});
  // every compound left empty (only combinators around it) becomes '*', so the broadened selector still targets the same depth
  const fix=sel=>{const nodes=[...sel.nodes];let last=null;const out=[];for(const n of nodes){if(n.type==='combinator'){if(!last||last.type==='combinator')out.push('*');out.push(n.value===' '?' ':' '+n.value+' ')}else{out.push(String(n).trim()?String(n).trim():'')}last=n}if(!last||last.type==='combinator')out.push('*');return out.join('').replace(/\s+/g,' ').trim()};
  let m=fix(clone);if(!m)m='*';
  out.push({text:sel.toString().trim(),spec:sp,pe,match:m})}}).processSync(selText);return out}
const decls=[];let order=0;
for(const n of ORDER_LIST){const root=postcss.parse(fs.readFileSync(path.join(DIST,n+'.css'),'utf8'));
 root.walkRules(rule=>{for(let p=rule.parent;p;p=p.parent)if(p.type==='atrule'&&/keyframes$/i.test(p.name))return;let sels;try{sels=analyse(rule.selector)}catch(e){sels=null}
  const media=[];for(let p=rule.parent;p;p=p.parent)if(p.type==='atrule')media.push([p.name.toLowerCase(),p.params]);
  rule.each(d=>{if(d.type!=='decl')return;order++;decls.push({id:decls.length,file:n,order,prop:d.prop,fam:family(d.prop),imp:!!d.important,sels,media,src:(rule.selector+'{'+d.prop+':'+d.value+(d.important?'!important':'')+'}').slice(0,200)})})})}
// competitor lists for important decls
const byFam=new Map();for(const d of decls){if(!byFam.has(d.fam))byFam.set(d.fam,[]);byFam.get(d.fam).push(d)}
const tasks=[];
for(const d of decls){if(!d.imp)continue;if(!d.sels){tasks.push({id:d.id,bad:'selector-parse'});continue}
 const per=d.sels.map(s=>{const comp=[];for(const e of byFam.get(d.fam))for(const es of (e.sels||[])){if(e.id===d.id)continue;if(es.pe!==s.pe)continue;if(e.imp||cmp(es.spec,s.spec)>0||(cmp(es.spec,s.spec)===0&&e.order>d.order))comp.push(JSON.stringify([es.match,e.media]))}return {match:s.match,pe:s.pe,comp:[...new Set(comp)].map(x=>JSON.parse(x))}});
 tasks.push({id:d.id,fam:d.fam,prop:d.prop,media:d.media,per})}
fs.writeFileSync('/tmp/r43-css-tasks.json',JSON.stringify(tasks));fs.writeFileSync('/tmp/r43-css-decls.json',JSON.stringify(decls));
console.log('decls',decls.length,'important',tasks.length,'parseBad',tasks.filter(t=>t.bad).length,'avgComp',(tasks.reduce((s,t)=>s+(t.per||[]).reduce((a,p)=>a+p.comp.length,0),0)/tasks.length).toFixed(1));
// keyframes -> families
const kf={};for(const n of ORDER_LIST){const root=postcss.parse(fs.readFileSync(path.join(DIST,n+'.css'),'utf8'));root.walkAtRules(/keyframes$/i,a=>{const s=kf[a.params.trim()]||=[];a.walkDecls(d=>{const f=family(d.prop);if(!s.includes(f))s.push(f)})})}
fs.writeFileSync('/tmp/r43-css-keyframes.json',JSON.stringify(kf));console.log('keyframes',Object.keys(kf).length);

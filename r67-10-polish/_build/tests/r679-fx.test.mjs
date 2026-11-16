// r67.9 Job L (Kevy's reference video, RELAY-262b E7-E11): attack-streak afterimages and sparks, battle IMPACT, lethal FINAL BLOW.
// Self-checked by Claude, pending ChatGPT and the Seto team. Display only: dl-fx.mjs and css/fx.css.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {planBatch,runBatch,clearDlfx,DLFX_CAP} from '../dist/dl-fx.mjs';

const lethal=[{type:'attack',from:{controller:1,location:4,sequence:2}},{type:'damage',player:0,amount:3000,before:2500,after:0,combat:true,source:'battle'}];
const kinds=p=>p.map(x=>x.kind+(x.impact?'+impact':''));

function shim({prompt=null}={}){
 const nodes=[];const mk=tag=>{const n={tag,className:'',style:{props:{},setProperty(k,v){this.props[k]=v}},dataset:{},attrs:{},isConnected:true,innerHTML:'',textContent:'',
  classList:{s:new Set(),add(c){this.s.add(c)},remove(c){this.s.delete(c)},contains(c){return this.s.has(c)}},setAttribute(k,v){this.attrs[k]=v},remove(){this.isConnected=false},getBoundingClientRect(){return {left:0,top:0,width:0,height:0}}};nodes.push(n);return n};
 const body=mk('body');body.append=n=>{n.parent=body};
 const table={getBoundingClientRect:()=>({left:200,top:60,width:800,height:600,right:1000,bottom:660})};
 const dc=prompt&&{getBoundingClientRect:()=>prompt};
 const doc={body,nodes,createElement:mk,querySelector:s=>s==='.arena-surface'?table:s==='.decision-column'?dc:null,getElementById:()=>null,defaultView:{innerWidth:1280,innerHeight:800,matchMedia:()=>({matches:false})}};
 return doc;
}
const lp={0:{left:40,top:700,width:200,height:60,right:240,bottom:760},1:{left:1040,top:20,width:200,height:60,right:1240,bottom:80}};
const point=pos=>pos?.location===0?{getBoundingClientRect:()=>lp[pos.controller]}:pos?{getBoundingClientRect:()=>({left:500,top:200,width:60,height:86,right:560,bottom:286})}:null;
function withTimers(fn){const real=globalThis.setTimeout,seen=[];globalThis.setTimeout=(f,ms)=>{seen.push(ms);return real(()=>{},0)};try{return {out:fn(),seen}}finally{globalThis.setTimeout=real}}
const mounted=doc=>doc.nodes.filter(n=>/\bdlfx\b/.test(n.className));

test('(R67.9-1) plan: lethal battle hit -> slash, impact burst, FINAL BLOW; a normal battle hit -> impact only; burn and instant -> no finale',()=>{
 assert.deepEqual(kinds(planBatch(lethal,{preset:'duel',duration:1600})),['slash','burst+impact','finale']);
 assert.deepEqual(kinds(planBatch([lethal[0],{...lethal[1],before:8000,after:5000}],{preset:'duel',duration:1600})),['slash','burst+impact']);
 // effect damage: the existing burst, no impact, no finale (the reel's Final Blow is the lethal battle hit)
 assert.deepEqual(kinds(planBatch([{type:'damage',player:0,amount:3000,before:2500,after:0,combat:false,source:'effect'}],{preset:'duel',duration:1600})),['burst']);
 assert.deepEqual(kinds(planBatch([{type:'cost',player:0,amount:1000,before:1000,after:0}],{preset:'duel',duration:1600})).includes('finale'),false);
 for(const [o,why] of [[{preset:'instant',duration:1600},'Instant'],[{preset:'duel',duration:1600,enabled:false},'FX off'],[{preset:'duel',duration:0},'no budget']])assert.deepEqual(planBatch(lethal,o),[],why);
});

test('(R67.9-2) run: streak ghosts/sparks, impact and finale mount with the right parts and anchors, all removed within min(duration, cap)',()=>{
 for(const [preset,duration] of [['learning',5000],['duel',1600],['broadcast',400]]){
  clearDlfx();const doc=shim(),budget=Math.min(duration,DLFX_CAP[preset]);
  const {seen}=withTimers(()=>runBatch({events:lethal,preset,duration,point},doc));
  const ns=mounted(doc),by=c=>ns.find(n=>n.className.split(' ').includes(c));
  const slash=by('dlfx-slash'),imp=by('dlfx-impact'),fin=by('dlfx-finale');
  assert.ok(slash&&imp&&fin,preset+': '+ns.map(n=>n.className).join(' | '));
  assert.equal((slash.innerHTML.match(/dlfx-ghost/g)||[]).length,4);assert.equal((slash.innerHTML.match(/dlfx-spark/g)||[]).length,6);
  assert.equal(slash.style.props['--dlfx-cw'],'60px');assert.equal(slash.style.props['--dlfx-ch'],'86px');
  assert.equal((imp.innerHTML.match(/im-line/g)||[]).length,10);assert.match(imp.innerHTML,/im-ring im-ring2/);assert.equal(imp.dataset.side,'bottom');
  assert.equal(imp.style.left,'0px');assert.equal(imp.style.top,'0px');assert.equal(imp.style.props['--im-x'],'140px');assert.equal(imp.style.props['--im-y'],'730px');/* r67.10-adapted: a clip box (no prompt = the window), centred on our Life Points */
  assert.equal(imp.style.width,'1280px');assert.equal(imp.style.height,'800px');
  for(const part of ['fb-flash','fb-core','fb-rim fb-rim2','fb-orbit fb-orbit2','fb-star'])assert.match(fin.innerHTML,new RegExp(part));
  assert.equal((fin.innerHTML.match(/fb-spark/g)||[]).length,12);assert.match(fin.innerHTML,/<b class="fb-tag">FINAL BLOW<\/b>/);
  assert.equal(fin.style.props['--fb-x'],'140px');assert.equal(fin.style.props['--fb-y'],'730px');/* the losing Life Points */
  assert.equal(fin.style.props['--fb-tx'],'600px');assert.equal(fin.style.props['--fb-ty'],'312px');/* table centre (42% down) */
  assert.equal(fin.style.width,'1280px');assert.equal(fin.style.height,'800px');assert.equal(fin.attrs['aria-hidden'],'true');
  for(const n of ns){const ms=parseInt(n.style.props['--dlfx-ms']);assert.ok(ms<=budget,`${preset} ${n.className} ${ms}>${budget}`)}
  for(const ms of seen)assert.ok(ms<=budget,preset+' timer '+ms+'>'+budget);
 }
 clearDlfx();
});

test('(R67.9-3) the decision prompt stays clear: the finale stops at its edge and the impact skips a Life Points box under it',()=>{
 clearDlfx();let doc=shim({prompt:{left:0,top:480,width:1280,height:320,right:1280,bottom:800}});/* phone bottom sheet */
 runBatch({events:lethal,preset:'duel',duration:1600,point},doc);let ns=mounted(doc);
 assert.equal(ns.find(n=>/dlfx-finale/.test(n.className)).style.height,'480px');
 assert.ok(!ns.some(n=>/dlfx-impact/.test(n.className)),'impact skipped: our Life Points are under the prompt');
 clearDlfx();doc=shim({prompt:{left:900,top:90,width:300,height:600,right:1200,bottom:690}});/* desktop side column */
 runBatch({events:lethal,preset:'duel',duration:1600,point},doc);ns=mounted(doc);
 const fin=ns.find(n=>/dlfx-finale/.test(n.className));assert.equal(fin.style.width,'900px');assert.equal(fin.style.height,'800px');
 assert.ok(ns.some(n=>/dlfx-impact/.test(n.className)));
 clearDlfx();
});

test('(R67.9-4) CSS contract: transform/opacity keyframes, reduced-motion fallbacks hide the new decorative parts, no new removal padding',()=>{
 const css=fs.readFileSync('dist/css/fx.css','utf8'),js=fs.readFileSync('dist/dl-fx.mjs','utf8');
 const names=['dlfx-ghost','dlfx-spark','dlfx-imflash','dlfx-imring','dlfx-imline','dlfx-fbflash','dlfx-fbcore','dlfx-fbrim','dlfx-fborbit','dlfx-fbstar','dlfx-fbspark','dlfx-fbtag'];
 for(const k of names){const m=css.match(new RegExp('@keyframes '+k+'\\{(.*)\\}\\s*$','m'));assert.ok(m,'keyframes '+k);
  const props=[...m[1].matchAll(/([a-z-]+):/g)].map(x=>x[1]).filter(p=>!/^(translate|rotate|scale|calc|var)/.test(p));
  assert.deepEqual([...new Set(props)].filter(p=>!['transform','opacity'].includes(p)),[],k+' animates only transform/opacity')}
 const still=css.match(/body\.dlfx-still \.dlfx-pillar \.dlfx-beam[^{]*\{display:none\}/)[0],rm=css.match(/@media \(prefers-reduced-motion: reduce\)\{[^\n]*\}\}/)[0];
 for(const c of ['dlfx-ghost','dlfx-spark','im-flash','im-ring','im-line','fb-flash','fb-rim','fb-orbit','fb-star','fb-spark']){assert.match(still,new RegExp('\\.'+c+'\\b'),'still '+c);assert.match(rm,new RegExp('\\.'+c+'\\b'),'reduced '+c)}
 assert.doesNotMatch(css,/\.dlfx-finale\{[^}]*z-index/,'the finale never stacks above the prompt by z-index');
 assert.doesNotMatch(js,/Math\.max\(ms,(700|900)\)|ms\+40\)/);
 // every new animation's delay+duration ends within --dlfx-ms (the module removes the node at exactly ms). Worst case: k=5, i=11.
 const calc=(str,at)=>{let d=0,k=at;for(;k<str.length;k++){if(str[k]==='(')d++;else if(str[k]===')'&&--d===0)break}return str.slice(at,k+1)};
 const val=e=>Function('return '+e.replace(/calc/g,'').replace(/var\(--dlfx-ms\)/g,'1').replace(/var\(--k\)/g,'5').replace(/var\(--i\)/g,'11'))();
 let checked=0;
 for(const rule of css.split('\n').filter(l=>/^\.dlfx-(slash \.dlfx-(ghost|spark)|impact|finale)[ {]/.test(l))){
  const a=rule.indexOf('animation:'),dur=a<0?null:rule.indexOf('calc(',a);if(dur<0||a<0)continue;
  const di=rule.indexOf('animation-delay:'),total=val(calc(rule,dur))+(di<0?0:val(calc(rule,rule.indexOf('calc(',di))));
  assert.ok(total<=1.0001,rule.slice(0,40)+' ends at '+total);checked++}
 // the rules that only override a delay inherit the base duration
 for(const [base,ov] of [['.dlfx-impact .im-ring{','.dlfx-impact .im-ring2{'],['.dlfx-finale .fb-rim{','.dlfx-finale .fb-rim2{'],['.dlfx-finale .fb-orbit{','.dlfx-finale .fb-orbit2{']]){
  const b=css.split('\n').find(l=>l.startsWith(base)),o=css.split('\n').find(l=>l.startsWith(ov));
  const t=val(calc(b,b.indexOf('calc(',b.indexOf('animation:'))))+val(calc(o,o.indexOf('calc(',o.indexOf('animation-delay:'))));assert.ok(t<=1.0001,ov+' ends at '+t);checked++}
 assert.ok(checked>=14,'checked '+checked);
});

// ---- r67.10 (ChatGPT RELAY-263 MED-R679-1): footprint-safe regions for every prompt shape, and cleanup when a prompt moves over an effect.
const parts=doc=>{const ns=mounted(doc);return {imp:ns.find(n=>/dlfx-impact/.test(n.className)),fin:ns.find(n=>/dlfx-finale/.test(n.className))}};
const px=v=>parseInt(v);
const rectOf=n=>({left:px(n.style.left),top:px(n.style.top),right:px(n.style.left)+px(n.style.width),bottom:px(n.style.top)+px(n.style.height)});
const overlaps=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
const P=(left,top,width,height)=>({left,top,width,height,right:left+width,bottom:top+height});

test('(R67.10-1) ChatGPT\'s counterexample: Life Points centre just above a bottom sheet -> the impact plays but its clip box ends at the sheet',()=>{
 clearDlfx();const prompt=P(0,740,1280,60),doc=shim({prompt});runBatch({events:lethal,preset:'duel',duration:1600,point},doc);
 const {imp,fin}=parts(doc);assert.ok(imp,'impact mounted (its anchor is outside the sheet)');
 assert.deepEqual(rectOf(imp),{left:0,top:0,right:1280,bottom:740});assert.equal(overlaps(rectOf(imp),prompt),false);
 assert.equal(imp.style.props['--im-y'],'730px');/* the rings and lines can extend 250px, but overflow is clipped at y=740 (css: .dlfx-impact overflow:hidden) */
 assert.equal(overlaps(rectOf(fin),prompt),false);clearDlfx();
});

test('(R67.10-2) every prompt shape: no impact/finale clip box overlaps any visible prompt; impact skipped when its anchor is covered',()=>{
 const cases=[
  ['full-width bottom sheet',P(0,480,1280,320)],['desktop right column',P(900,90,300,600)],['left column',P(0,60,320,740)],
  ['centred narrow sheet',P(440,560,400,240)],['centred narrow sheet over our LP',P(60,600,400,200)],['top banner',P(0,0,1280,120)],
  ['corner box near our LP',P(250,640,200,160)],['prompt covers almost everything',P(20,20,1240,760)]];
 for(const [name,prompt] of cases){clearDlfx();const doc=shim({prompt});runBatch({events:lethal,preset:'duel',duration:1600,point},doc);const {imp,fin}=parts(doc);
  const lpCentre={x:140,y:730},covered=lpCentre.x>=prompt.left&&lpCentre.x<=prompt.right&&lpCentre.y>=prompt.top&&lpCentre.y<=prompt.bottom;
  if(covered)assert.equal(imp,undefined,name+': impact skipped');else{assert.ok(imp,name+': impact mounted');assert.equal(overlaps(rectOf(imp),prompt),false,name+' impact')}
  if(fin)assert.equal(overlaps(rectOf(fin),prompt),false,name+' finale');
  for(const n of [imp,fin].filter(Boolean)){const r=rectOf(n);assert.ok(r.left>=0&&r.top>=0&&r.right<=1280&&r.bottom<=800,name+' inside the window')}}
 // the near-total prompt leaves no strip >= 40px: neither big effect plays
 clearDlfx();const doc=shim({prompt:P(20,20,1240,760)});runBatch({events:lethal,preset:'duel',duration:1600,point},doc);assert.deepEqual(parts(doc),{imp:undefined,fin:undefined});clearDlfx();
});

test('(R67.10-3) a prompt that appears over a playing effect, or a resize, removes it; a prompt that closes leaves it playing',()=>{
 const run=prompt=>{clearDlfx();const doc=shim({prompt:null});const cbs=[];doc.defaultView.addEventListener=(t,f)=>{if(t==='resize')cbs.push(f)};
  let current=null;doc.querySelector=(q=>s=>s==='.decision-column'?(current&&{getBoundingClientRect:()=>current}):q(s))(doc.querySelector);
  runBatch({events:lethal,preset:'duel',duration:1600,point},doc);return {doc,set:p=>{current=p},check:()=>{for(const f of cbs)f()}}};
 // the window listener is installed once per window object: give each run a fresh one
 let r=run();let {imp,fin}=parts(r.doc);assert.ok(imp&&fin);
 r.set(P(0,600,1280,200));r.check();assert.equal(imp.isConnected,false,'impact removed: the sheet now covers its box');assert.equal(fin.isConnected,false,'finale removed');
 r=run();({imp,fin}=parts(r.doc));r.set(null);r.check();assert.equal(imp.isConnected,true);assert.equal(fin.isConnected,true,'no prompt: keeps playing');
 r=run();({imp,fin}=parts(r.doc));r.doc.defaultView.innerWidth=1000;r.check();assert.equal(fin.isConnected,false,'resize removes');clearDlfx();
});

test('(R67.10-4) CSS: the impact is a clip box with its parts in .im-c; both clip boxes hide overflow',()=>{
 const css=fs.readFileSync('dist/css/fx.css','utf8'),js=fs.readFileSync('dist/dl-fx.mjs','utf8');
 assert.match(css,/\.dlfx-impact\{overflow:hidden;contain:paint\}/);assert.match(css,/\.dlfx-finale\{overflow:hidden;contain:paint\}/);
 assert.match(css,/\.dlfx-impact \.im-c\{position:absolute;left:var\(--im-x,0\);top:var\(--im-y,0\);width:0;height:0\}/);
 assert.match(js,/<span class="im-c">/);assert.doesNotMatch(js,/inside\(promptBox/,'no centre-only check left');
});


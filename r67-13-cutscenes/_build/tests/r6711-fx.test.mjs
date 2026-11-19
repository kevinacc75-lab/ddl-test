// r67.11 (ChatGPT RELAY-266 LOW-R6710-1 and the RELAY-265/266 open follow-up). Self-checked by Claude, pending ChatGPT and the Seto team.
// 1) Clip boxes are quantised INWARD, so the painted box = the guarded box and never reaches a fractional prompt edge.
// 2) The small tags (summon, chain, streak, attack label, Life Points number, turn banner) also stay off decision boxes.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {runBatch,clearDlfx,safeRegion} from '../dist/dl-fx.mjs';
const lethal=[{type:'attack',from:{controller:1,location:4,sequence:2}},{type:'damage',player:0,amount:3000,before:2500,after:0,combat:true,source:'battle'}];
const kinds=p=>p.map(x=>x.kind+(x.impact?'+impact':''));

function shim({prompt=null}={}){
 const nodes=[];const mk=tag=>{const n={tag,className:'',style:{props:{},setProperty(k,v){this.props[k]=v}},dataset:{},attrs:{},isConnected:true,innerHTML:'',textContent:'',
  classList:{s:new Set(),add(c){this.s.add(c)},remove(c){this.s.delete(c)},contains(c){return this.s.has(c)}},setAttribute(k,v){this.attrs[k]=v},append(c){c.parent=this;(this.children||=[]).push(c)},remove(){this.isConnected=false},getBoundingClientRect(){return {left:0,top:0,width:0,height:0}}};nodes.push(n);return n};
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


const P=(left,top,width,height)=>({left,top,width,height,right:left+width,bottom:top+height});
const px=v=>Number(String(v).replace('px',''));
const painted=n=>({left:px(n.style.left),top:px(n.style.top),right:px(n.style.left)+px(n.style.width),bottom:px(n.style.top)+px(n.style.height)});
const overlaps=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
const onBody=(n,doc)=>{for(let x=n;x;x=x.parent)if(x===doc.body)return true;return false};
const big=doc=>mounted(doc).filter(n=>/dlfx-(impact|finale)\b/.test(n.className)&&onBody(n,doc));
const clips=doc=>mounted(doc).filter(n=>/dlfx-clipbox/.test(n.className)&&onBody(n,doc));

test('(R67.11-1) LOW-R6710-1: ChatGPT\'s reproducer (prompt top 740.8) -> impact and finale end at 740, not 741',()=>{
 clearDlfx();const prompt=P(0,740.8,1280,59.2),doc=shim({prompt});runBatch({events:lethal,preset:'duel',duration:1600,point},doc);
 const bs=big(doc);assert.equal(bs.length,2);
 for(const n of bs){const r=painted(n);assert.ok(r.bottom<=740.8,n.className+' bottom '+r.bottom);assert.equal(r.bottom,740);assert.equal(overlaps(r,prompt),false)}
 clearDlfx();
});

test('(R67.11-2) fractional edges on every side and non-integer origins: integer boxes, inside the exact strip, painted box = guarded box',()=>{
 const cases=[['bottom sheet',P(0,600.4,1280,199.6)],['right column',P(900.6,90.2,299.7,600.3)],['left column',P(0.3,60.5,319.4,739.1)],['top banner',P(0,0,1280,120.3)],
  ['centred narrow',P(440.5,560.25,400.5,239.75)],['corner box',P(250.75,640.5,199.5,159.5)]];
 for(const [name,prompt] of cases){
  const doc=shim({prompt});
  for(const [ax,ay] of [[140,730],[1140,50],[640,300],[20,20],[1270,790]]){const r=safeRegion(doc,ax,ay,{needAnchor:false});if(!r)continue;
   for(const k of ['left','top','width','height'])assert.ok(Number.isInteger(r[k]),name+' '+k+' '+r[k]);
   assert.equal(overlaps({left:r.left,top:r.top,right:r.left+r.width,bottom:r.top+r.height},prompt),false,name+' region')}
  clearDlfx();runBatch({events:lethal,preset:'duel',duration:1600,point},doc);
  for(const n of [...big(doc),...clips(doc)]){const r=painted(n),g=n.__dlfxRegion;assert.equal(overlaps(r,prompt),false,name+' '+n.className);
   assert.deepEqual({left:g.left,top:g.top,right:g.left+g.width,bottom:g.top+g.height},r,name+' guard = painted')}
 }
 clearDlfx();
});

test('(R67.11-3) small tags: no prompt -> unchanged (no clip box); prompt beside -> clipped to the strip; anchor under a prompt -> not shown',()=>{
 clearDlfx();let doc=shim({prompt:null});runBatch({events:lethal,preset:'duel',duration:1600,point},doc);
 assert.equal(clips(doc).length,0);for(const c of ['dlfx-slash','dlfx-burst'])assert.ok(mounted(doc).some(n=>n.className.includes(c)&&n.parent===doc.body),c+' directly on body');
 // a bottom sheet just under our Life Points: the burst tag (anchored 30px above them) and the streak are each clipped above the sheet
 clearDlfx();let prompt=P(0,765.5,1280,34.5);doc=shim({prompt});runBatch({events:lethal,preset:'duel',duration:1600,point},doc);
 for(const c of ['dlfx-slash','dlfx-burst']){const n=mounted(doc).find(x=>x.className.split(' ').includes(c));assert.ok(n&&n.parent&&/dlfx-clipbox/.test(n.parent.className),c+' inside a clip box');
  const box=painted(n.parent);assert.equal(overlaps(box,prompt),false);assert.ok(box.bottom<=765)}
 // the sheet covers our Life Points and the tag's anchor: the burst is not shown; the slash (anchored on their monster) is clipped
 clearDlfx();prompt=P(0,600,1280,200);doc=shim({prompt});runBatch({events:lethal,preset:'duel',duration:1600,point},doc);
 const burst=mounted(doc).find(x=>x.className.includes('dlfx-burst'));assert.ok(!burst||!onBody(burst,doc),'burst not painted');
 const slash=mounted(doc).find(x=>x.className.includes('dlfx-slash')&&!x.className.includes('slashtag'));assert.ok(onBody(slash,doc)&&/dlfx-clipbox/.test(slash.parent.className));
 assert.equal(overlaps(painted(slash.parent),prompt),false);
 for(const n of clips(doc))assert.equal(overlaps(painted(n),prompt),false);
 clearDlfx();
});

test('(R67.11-4) source contract: every small-tag mount asks for the safe clip; clip CSS present; integer boxes used without re-rounding',()=>{
 const js=fs.readFileSync('dist/dl-fx.mjs','utf8'),css=fs.readFileSync('dist/css/fx.css','utf8');
 for(const c of ['dlfx-pillar','dlfx-zonetag','dlfx-chain','dlfx-slash','dlfx-slashtag','dlfx-burst','dlfx-turn'])assert.match(js,new RegExp("mount\\(doc,'"+c+"'[^{]*\\{safe:true,"),c);
 assert.match(css,/\.dlfx-clipbox\{overflow:hidden;contain:paint\}/);
 assert.doesNotMatch(js,/Math\.round\((sr|ir)\.(width|height)\)/);
});

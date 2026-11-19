// r67.12: ChatGPT's RELAY-272a late-prompt fixtures for MED-R6711-1. Authored by ChatGPT — pending Seto/team fact check. Integrated unchanged by Claude.
// ChatGPT author regression fixtures. Not native-duel or browser validation.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const source=fs.readFileSync(new URL('../dist/dl-fx.mjs',import.meta.url),'utf8');
// Execute the actual module, resolving its real coin import and exposing private mount only to isolate every caller class.
const instrumented=source.replace("'./coin-cutscene.mjs'",JSON.stringify(new URL('../dist/coin-cutscene.mjs',import.meta.url).href))+'\nexport {mount as testMount};\n';
const {testMount:mount,runBatch,clearDlfx}=await import('data:text/javascript;base64,'+Buffer.from(instrumented).toString('base64'));
const P=(l,t,w,h)=>({left:l,top:t,width:w,height:h,right:l+w,bottom:t+h});
function fixture({prompt=false,reduced=false,tag='dlfx-burst'}={}){
 const timers=new Map(),frames=new Map(),listeners={},nodes=[];let next=1,visible=prompt;
 const mk=()=>{const n={className:'',style:{setProperty(){}},dataset:{},parent:null,children:[],setAttribute(){},classList:{add(){},remove(){}},append(c){c.parent=this;this.children.push(c)},remove(){if(this.parent)this.parent.children=this.parent.children.filter(x=>x!==this);this.parent=null},get isConnected(){return this===body||!!this.parent?.isConnected}};nodes.push(n);return n};
 const body=mk(),promptNode={get hidden(){return !visible},getBoundingClientRect:()=>P(0,600,1280,200)};
 const win={innerWidth:1280.8,innerHeight:800.4,matchMedia:()=>({matches:reduced}),getComputedStyle:n=>({display:n.hidden?'none':'block',visibility:'visible'}),requestAnimationFrame(fn){const id=next++;frames.set(id,fn);return id},addEventListener(k,f){listeners[k]=f},ResizeObserver:class{constructor(f){this.check=f}observe(){}}};
 const table={getBoundingClientRect:()=>P(200,60,800,600)};
 const doc={body,defaultView:win,createElement:mk,querySelector:s=>s==='.decision-column'?(visible?promptNode:null):s==='.arena-surface'?table:null,getElementById:()=>null};
 const realSet=globalThis.setTimeout,realClear=globalThis.clearTimeout;
 globalThis.setTimeout=(fn,ms)=>{const id=next++;timers.set(id,{fn,ms});return id};globalThis.clearTimeout=id=>timers.delete(id);
 function frame(){const fs=[...frames.values()];frames.clear();for(const f of fs)f()}
 function expire(){const ts=[...timers.values()];timers.clear();for(const t of ts)t.fn();frame()}
 function finish(){clearDlfx();frame();assert.equal(nodes.filter(n=>n!==body&&n.isConnected).length,0,'no visible orphan');assert.equal(timers.size,0,'no cleanup timers');assert.equal(frames.size,0,'RAF drains after cleanup frame');globalThis.setTimeout=realSet;globalThis.clearTimeout=realClear}
 return{doc,win,body,nodes,timers,frames,tag,frame,expire,finish,resize:()=>listeners.resize?.(),setPrompt:x=>visible=x};
}
const tags=['dlfx-burst','dlfx-pillar','dlfx-zonetag','dlfx-chain','dlfx-slash','dlfx-slashtag','dlfx-turn'];
for(const tag of tags){
 test(tag+' alone: clear viewport -> later prompt clears on RAF',()=>{const f=fixture({tag});try{const n=mount(f.doc,tag,1100,{safe:true,x:140,y:670,text:'TEST'});assert.equal(n.parent,f.body,'preserve unwrapped mount');assert.deepEqual(n.__dlfxRegion,{left:0,top:0,width:1280,height:800});assert.equal(f.frames.size,1,'starts its own monitor without any impact');f.setPrompt(true);f.frame();assert.equal(n.isConnected,false);assert.equal(f.timers.size,0);assert.equal(f.frames.size,0)}finally{f.finish()}});
 test(tag+' alone: no prompt stays visible; viewport resize clears',()=>{const f=fixture({tag});try{const n=mount(f.doc,tag,1100,{safe:true,x:140,y:670});f.frame();assert.equal(n.isConnected,true);f.win.innerWidth=900;f.resize();assert.equal(n.isConnected,false)}finally{f.finish()}});
 test(tag+' alone: existing prompt then close keeps safe decoration',()=>{const f=fixture({prompt:true,tag});try{const n=mount(f.doc,tag,1100,{safe:true,x:140,y:300});assert.equal(n.isConnected,true);assert.notEqual(n.parent,f.body);f.setPrompt(false);f.frame();assert.equal(n.isConnected,true);f.expire();assert.equal(n.isConnected,false)}finally{f.finish()}});
}
const loc={controller:0,location:4,sequence:0};
const events=[['effect damage',{type:'damage',player:0,amount:500,before:8000,after:7500,combat:false,source:'effect'}],['LP cost',{type:'cost',player:0,amount:500,before:8000,after:7500}],['recovery',{type:'recover',player:0,amount:500,before:7000,after:7500}],['LP update',{type:'lpUpdate',player:0,amount:500,before:8000,after:7500}],['summon',{type:'summon',player:0,sequence:0}],['zone',{type:'move',from:{...loc,location:2},to:{...loc,location:16},reason:1}],['chain',{type:'activate',player:0,chain:1,source:loc}],['attack',{type:'attack',from:loc,to:{...loc,controller:1}}],['turn',{type:'turn',player:0,turn:2}]];
for(const [name,event]of events)test(name+': real runBatch has no impact/finale and guards every mounted node',()=>{const f=fixture();try{const point=pos=>({getBoundingClientRect:()=>pos.location===0?P(40,700,200,60):P(500,200,60,86)});const plan=runBatch({events:[event],preset:'duel',duration:1100,point},f.doc);assert.ok(plan.length>0);const ns=f.nodes.filter(n=>n!==f.body&&n.isConnected);assert.ok(ns.length>0);assert.ok(ns.every(n=>!(/dlfx-(impact|finale)/.test(n.className))));assert.ok(ns.every(n=>n.__dlfxRegion));f.setPrompt(true);f.frame();assert.ok(ns.every(n=>!n.isConnected))}finally{f.finish()}});
test('Skip/clear and restart leave no stale node or pending monitor after drain',()=>{const f=fixture();try{const n=mount(f.doc,'dlfx-burst',1100,{safe:true,x:140,y:670});clearDlfx();f.frame();assert.equal(n.isConnected,false);assert.equal(f.frames.size,0);const next=mount(f.doc,'dlfx-turn',1100,{safe:true,x:200,y:30});f.setPrompt(true);f.frame();assert.equal(next.isConnected,false)}finally{f.finish()}});
test('Instant runBatch produces no nodes or timers',()=>{const f=fixture();try{assert.deepEqual(runBatch({events:[events[0][1]],preset:'instant',duration:1100},f.doc),[]);assert.equal(f.nodes.length,1);assert.equal(f.frames.size,0);assert.equal(f.timers.size,0)}finally{f.finish()}});
test('Reduced-motion path still guards and clears effect tag',()=>{const f=fixture({reduced:true});try{const point=()=>({getBoundingClientRect:()=>P(40,700,200,60)});runBatch({events:[events[0][1]],preset:'duel',duration:1100,point},f.doc);const n=f.nodes.find(x=>/dlfx-burst/.test(x.className));assert.ok(n?.isConnected);f.setPrompt(true);f.frame();assert.equal(n.isConnected,false)}finally{f.finish()}});

test('Causal reproducer: a newly inserted prompt removes a lone public LP effect tag',()=>{const f=fixture();try{const point=()=>({getBoundingClientRect:()=>P(40,700,200,60)});runBatch({events:[events[0][1]],preset:'duel',duration:1100,point},f.doc);const n=f.nodes.find(x=>/dlfx-burst/.test(x.className));assert.equal(n.isConnected,true);f.setPrompt(true);f.frame();assert.equal(n.isConnected,false,'baseline leaves the LP label visible after prompt insertion')}finally{f.finish()}});
test('ResizeObserver callback also removes a newly overlapping prompt',()=>{const f=fixture();try{const n=mount(f.doc,'dlfx-burst',1100,{safe:true,x:140,y:670});f.setPrompt(true);f.win.__dlfxRO?.check();assert.equal(n.isConnected,false)}finally{f.finish()}});

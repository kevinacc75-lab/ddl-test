// r22 (Claude, 21 Oct): shared helpers for engine-wrapper scenario tests.
//  - loadBuild(fixed): imports Duel from dist (fixed wrapper) or from a temporary copy of dist whose core wrapper has
//    the two r21c bugs put back (card-data offsets rscale@48/link_marker@52, and the count byte in sort responses), so
//    every behaviour test can show the unfixed wrapper fails it (Alexis, T1-T11 note).
//  - scenario(): starts a duel with named cards dealt straight to chosen zones (the same engine call that fills the
//    decks; cards come from the decks given), so boards are exact and reproducible.
//  - q(): reads an engine value through a one-line Lua chunk (returned via the error handler; read-only queries only).
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {gunzipSync} from 'node:zlib';
export const LOC={DECK:1,HAND:2,MZONE:4,SZONE:8,GRAVE:16,REMOVED:32,EXTRA:64,PZONE:0x200};
export const POS={ATK:1,DEF:4,FD:8};
export const db=JSON.parse(gunzipSync(fs.readFileSync('dist/cards.json.gz'))),scripts=JSON.parse(gunzipSync(fs.readFileSync('dist/scripts.json.gz')));
export const decks=JSON.parse(fs.readFileSync('dist/decks.json')).decks;
export const deck=id=>decks.find(d=>d.id===id);
export const code=name=>{const l=Object.values(db).filter(c=>c.name===name&&!c.alias);if(l.length!==1)throw Error(name+': '+l.length);return l[0].code};
const BUGS=[['e.setUint32(44,t.rscale??0,!0),e.setUint32(48,t.link_marker??0,!0)):(','e.setUint32(48,t.rscale??0,!0),e.setUint32(52,t.link_marker??0,!0)):('],
 ['case 15:if(!e.order){t.i8(-1);break}for(let r of e.order)t.i8(r);break;','case 15:if(!e.order){t.i8(-1);break}t.i8(e.order.length);for(let r of e.order)t.i8(r);break;']];
let unfixedDir=null;
function makeUnfixed(){if(unfixedDir)return unfixedDir;const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ddl-unfixed-'));
 for(const f of fs.readdirSync('dist'))if(/\.(mjs|js)$/.test(f))fs.copyFileSync(path.join('dist',f),path.join(dir,f));
 for(const sub of ['ai','core'])fs.cpSync(path.join('dist',sub),path.join(dir,sub),{recursive:true});
 let s=fs.readFileSync(path.join(dir,'core/index.js'),'utf8');for(const [fixed,buggy] of BUGS){if(s.split(fixed).length!==2)throw Error('fixed wrapper text not found: '+fixed.slice(0,40));s=s.replace(fixed,buggy)}
 fs.writeFileSync(path.join(dir,'core/index.js'),s);process.on('exit',()=>{try{fs.rmSync(dir,{recursive:true,force:true})}catch{}});return unfixedDir=dir}
const builds={};
export async function loadBuild(fixed=true){const key=fixed?'fixed':'unfixed';if(builds[key])return builds[key];
 const dir=fixed?path.resolve('dist'):makeUnfixed();const m=await import(path.join(dir,'duel.mjs'));const live=await m.Duel.create(db,scripts);return builds[key]={...m,live}}
export function scenario(build,{decks:pair,first=0,place=[],seed=7}){const {Duel,live}=build,core=live.core,orig=core.duelNewCard,left=place.map(p=>({...p}));
 const d=new Duel(core,db,scripts);
 core.duelNewCard=(h,info)=>{const p=left.find(x=>!x.used&&x.code===info.code&&d.toEngine(x.p)===info.team);if(p){p.used=true;info={...info,location:p.location,sequence:p.sequence??0,position:p.position??POS.ATK}}return orig.call(core,h,info)};
 try{d.start(pair,{seed,first})}finally{core.duelNewCard=orig}
 const missing=left.filter(p=>!p.used);if(missing.length)throw Error('not placed: '+JSON.stringify(missing));
 d.chains=[];const handle=d.handleMessage.bind(d);d.handleMessage=m=>{if(m.type===build.M.CHAINING)d.chains.push(m.code);return handle(m)};return d}
export function q(d,lua){d.errors.length=0;d.core.loadScript(d.handle,'ddl-q.lua',`local ok,r=pcall(function() ${lua} end) error("DDLQ "..tostring(ok).." "..tostring(r))`);
 const line=d.errors.find(e=>e.includes('DDLQ '));d.errors.length=0;if(!line)throw Error('query failed: '+lua);const [,ok,val]=line.match(/DDLQ (\w+) (.*)$/);if(ok!=='true')throw Error('lua: '+val);return val}
export const cardExpr=(c,p,loc,seq)=>`local c=Duel.GetFieldCard(${p},${loc},${seq})`;
// Generic responder: declines optional effects/responses, takes the first legal choice when forced.
export function answer(build,d,{pick}={}){const {M}=build,m=d.prompt,c=d.choices();const R=build.R;
 if(pick){const r=pick(m,c);if(r)return r}
 if(m.type===M.SELECT_EFFECTYN||m.type===M.SELECT_YESNO)return c.find(o=>o.label==='No').response;
 if(m.type===M.SELECT_CHAIN)return (m.forced?c[0]:c.find(o=>o.response.index===null)).response;
 if(m.type===M.SELECT_CARD)return {type:R.SELECT_CARD,indicies:Array.from({length:m.min},(_,i)=>i)};
 if(!c.length)throw Error('no choices for prompt '+m.type);return c[0].response}
export const places=(d)=>d.choices().map(o=>o.response.places[0]);
export const seat=m=>m.seat??m.player;
export function toIdle(build,d,p=0,limit=40){for(let i=0;i<limit&&d.prompt&&!(d.prompt.type===build.M.SELECT_IDLECMD&&seat(d.prompt)===p);i++)d.respond(answer(build,d));if(!(d.prompt?.type===build.M.SELECT_IDLECMD&&seat(d.prompt)===p))throw Error('no idle for '+p);return d}

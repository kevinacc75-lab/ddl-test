// S3 native-fixture harness (Claude, 28 Oct 2026). Used by tests/r35-s3-*.test.mjs and tools/s3-explore.mjs.
// scenario(): starts a real duel on the 19 Oct lists with named cards dealt to chosen zones at creation (the same engine
// call that fills the decks; any printing of the name; owner = seat). drive(): plays scripted steps for each seat by the
// engine's own choice labels ('pick:Name' for card prompts), passes every other window, and calls hooks so a test can
// stop at an exact window and let the real AI answer it.
import assert from 'node:assert/strict';import fs from 'node:fs';import {gunzipSync} from 'node:zlib';
import {Duel,M} from '../dist/duel.mjs';import {OcgResponseType as R} from '../dist/core/index.js';
export const db=JSON.parse(gunzipSync(fs.readFileSync('dist/cards.json.gz'))),scripts=JSON.parse(gunzipSync(fs.readFileSync('dist/scripts.json.gz')));
const decks=JSON.parse(fs.readFileSync('dist/decks.json')).decks;
export const v19=id=>{const x=decks.find(y=>y.id===id);return {...x,...(x.banlistVariants?.['tcg-2026-10-19']||{})}};
export const code=n=>+Object.keys(db).find(k=>db[k].name===n);
let live=null;export async function engine(){return live||(live=await Duel.create(db,scripts))}
export function stopEngine(){live?.stop();live=null}
export function scenario(deckIds,placements,{first=0,seed=7,beforeStart=null}={}){assert.ok(live,'call engine() first');const core=live.core,orig=core.duelNewCard;
 const left=placements.map(p=>({...p,codes:new Set(Object.keys(db).filter(k=>db[k].name===p.name).map(Number))}));let d;
 core.duelNewCard=(h,info)=>{const p=left.find(x=>!x.used&&x.codes.has(info.code)&&d.toEngine(x.owner)===info.team);if(p){p.used=true;info={...info,location:p.location,sequence:p.sequence??0,position:p.position??1}}return orig.call(core,h,info)};
 d=new Duel(core,db,scripts);beforeStart?.(d);/* r35 item 8: e.g. install the shuffle tap before the first start, as worker.mjs does */try{d.start(deckIds.map(v19),{seed,first})}finally{core.duelNewCard=orig}
 assert.ok(left.every(p=>p.used),'not placed: '+left.filter(p=>!p.used).map(p=>p.name));assert.deepEqual(d.errors,[],'script errors');return d}
export const seatOf=m=>m.seat??m.player;
export const labels=d=>d.choices().map(c=>c.label);
const PASS=['Do not chain','No'];
function tryStep(d,w){const m=d.prompt,sel=m.selects||m.select_cards||[];
 const at=w.match(/^@([^>]+)>(.*)$/);if(at){const top=d.chain?.at?.(-1);if(!top||d.name(top.code)!==at[1])return false;w=at[2]}/* '@Card>step': only while Card is on top of the chain */
 if(w.startsWith('pick:')){if(!sel.length||![M.SELECT_CARD,M.SELECT_UNSELECT_CARD].includes(m.type))return false;const j=sel.findIndex(c=>d.name(c.code)===w.slice(5));if(j<0)return false;
  d.respond(m.type===M.SELECT_UNSELECT_CARD?{type:R.SELECT_UNSELECT_CARD,index:j}:{type:R.SELECT_CARD,indicies:[j]});return true}
 const c=d.choices().find(o=>o.label===w||o.label.includes(w));if(!c)return false;d.respond(c.response);return true}
// steps: {0:[...],1:[...]} consumed in order per seat; a seat's next step is tried at each of its prompts, else the prompt
// is passed (SELECT_CHAIN / yes-no). A step written '@Card>label' is taken only while Card's link is on top of the chain. until(d) stops before answering; onPrompt(d) may answer and return true. Returns
// {stopped, unused} where unused lists steps never taken.
export function drive(d,{steps={},until=null,onPrompt=null,max=200,log=null}={}){const k={0:0,1:0};
 for(let i=0;i<max&&d.prompt;i++){const m=d.prompt,s=seatOf(m);if(until&&until(d))return {stopped:true,unused:{0:(steps[0]||[]).slice(k[0]),1:(steps[1]||[]).slice(k[1])}};
  if(onPrompt&&onPrompt(d))continue;const w=(steps[s]||[])[k[s]];log?.(s,m.type,labels(d),w);
  if(w&&tryStep(d,w)){k[s]++;continue}
  const p=d.choices().find(o=>PASS.includes(o.label));if(p&&(m.type===M.SELECT_CHAIN||m.type===M.SELECT_EFFECTYN||m.type===M.SELECT_YESNO)){d.respond(p.response);continue}
  return {stopped:false,stuck:{seat:s,type:m.type,labels:labels(d),next:w},unused:{0:(steps[0]||[]).slice(k[0]),1:(steps[1]||[]).slice(k[1])}}}
 return {stopped:false,unused:{0:(steps[0]||[]).slice(k[0]),1:(steps[1]||[]).slice(k[1])}}}
export const hand=(d,s)=>d.zone(s,2).filter(Boolean),field=(d,s)=>d.zone(s,4).filter(Boolean),gy=(d,s)=>d.zone(s,16).filter(Boolean);
export {M,R};

// r37 WindBot as a pilot choice (Claude as builder, 7-8 Nov 2026; Kevy 21:57 AEDT: "select our AI to pilot Deck A and then set
// Windbot to pilot Deck B so that I can watch the two vs in real time"). SELF-VERIFIED until reviewed.
// One seat of the duel worker is played by WindBot, the open-source scripted bot of EDOPro (ProjectIgnis fork, AGPL-3.0), running
// in this browser (wb/_framework, built unmodified from its C# source by tools/windbot/web). It sees exactly what an EDOPro
// server would show that player (dist/windbot/edo.mjs routes every engine message the EDOPro way) and answers each prompt
// with its own hand-written script for the deck. Its answer is given to the engine like any other pilot's choice.
// WindBot plays the site's own (TCG 19 Oct 2026) lists here, with the script of the matching archetype. Its scripts were
// written for WindBot's own lists, so cards outside them get its generic default behaviour.
import {EdoRouter,WasmWindBot,decodeResponse,toYdk,CTOS,PROMPT_MSGS} from './edo.mjs';
import {buildPlan} from '../pilot-notes.mjs';
import {M} from '../duel.mjs';import {OcgDuelMode as D} from '../core/index.js';
// the rules the engine runs (dist/duel.mjs: Master Rule 5 + TCG SEGOC), told to WindBot in the lobby as an EDOPro host does
const DUEL_FLAGS=D.MODE_MR5|(D.TCG_SEGOC_NONPUBLIC||0n)|(D.TCG_SEGOC_FIRSTTRIGGER||0n);
import {windBotFor} from './decks.mjs';export {WINDBOT_EXECUTORS,windBotFor} from './decks.mjs';
let runtime=null,dialog=null;
// Starts the .NET runtime once per worker and gives WindBot the card data (built from the site's cards.json).
export function loadWindBot(db,base=new URL('../wb/',import.meta.url),dialogText=null){
 runtime??=(async()=>{const ex=await WasmWindBot.load(new URL('_framework/dotnet.js',base).href,db);dialog=dialogText??await (await fetch(new URL('default.json',base))).text();return ex})().catch(e=>{runtime=null;throw e});return runtime}
const KIND={[M.SELECT_IDLECMD]:r=>[ 'summon','summon','position','set','set','activate'][r.action]||'selection',[M.SELECT_BATTLECMD]:r=>r.action===0?'activate':r.action===1?'attack':'selection',[M.SELECT_CHAIN]:r=>r.index==null?'selection':'chain'};
export class WindBotPilot{
 constructor({seat,seed,deck,exports}){const w=windBotFor(deck.id);if(!w)throw Error('WindBot has no script for '+deck.name);
  Object.assign(this,{seat,seed:seed>>>0,deck,exports,executor:w.executor,archetype:w.label});this.name='Pilot '+(seat===0?'A':'B');this.decisions=0;this.kind='windbot';this.budget=this.nodeBudget=0;this.cache=null;this.retries=0;this.answered=0}
 // A fresh bot for a duel start (also for a rewind, which replays the duel from the start): lobby, then the router is armed.
 async attach(duel,W){this.close();this.W=W;this.bot=new WasmWindBot({exports:this.exports,executor:this.executor,deckName:'DDL_'+this.seat,ydk:toYdk(this.deck),dialog,seed:this.seed^(0x9e3779b9*(this.seat+1))});
  await this.bot.connect();const got=await this.bot.lobby({duelFlags:DUEL_FLAGS,position:W});this.submitted=got.cards.length;
  this.router=new EdoRouter(duel.core,null,W,b=>{if(PROMPT_MSGS.has(b[0])&&b[1]===this.W){this.bot.inbox=this.bot.inbox.filter(p=>p[0]!==CTOS.RESPONSE);this.cache=null}this.bot.gameMsg(b)});this.cache=null;this.decisions=0;this.retries=0}
 // the first message batch of the duel: MSG_START (counts per engine team) before anything else, as EDOPro does
 batch(duel,raw,counts){if(!this.router)return;this.router.handle=duel.handle;if(!this.router.started)this.router.begin(counts);this.router.batch(raw)}
 base(){return null}
 plan(d){if(d.prompt?.seat!==this.seat)throw Error('The wrong pilot was asked to decide.');if(this.cache?.revision===d.revision)return this.cache;
  let raw=this.bot?.takeNow(CTOS.RESPONSE);
  // a rejected answer (MSG_RETRY): EDOPro shows the same prompt again; so does this host, at most 5 times per duel
  if(!raw&&this.router?.lastPrompt&&this.retries<5){this.retries++;this.bot.gameMsg(this.router.lastPrompt);raw=this.bot.takeNow(CTOS.RESPONSE)}
  if(!raw)return null;let response;try{response=decodeResponse(d.prompt.type,raw,d.prompt)}catch{return null}
  const kind=KIND[d.prompt.type]?.(response)||'selection';
  this.cache={...buildPlan(d,response,{rule:'WindBot script · '+this.archetype,reason:'WindBot (the open-source scripted EDOPro bot) chose this with its hand-written '+this.archetype+' checks. It has no search: each prompt is answered by fixed rules written for this deck.',kind}),pilot:this.info(),decisionNumber:this.decisions+1};return this.cache}
 observe(){this.decisions++;this.cache=null}
 info(){return {name:this.name,seat:this.seat,style:'windbot',label:'WindBot',description:'Scripted bot (open-source EDOPro WindBot, AGPL-3.0) · '+this.archetype+' script · no search',seed:this.seed,variation:'none',strategy:'windbot',doctrine:false,decisions:this.decisions,search:null,book:null}}
 close(){try{this.bot?.close()}catch{}this.bot=null;this.router=null}}

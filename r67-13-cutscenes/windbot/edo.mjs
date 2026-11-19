// r37 WindBot seat (Claude as builder, 7 Nov 2026; Kevy 21:57 AEDT: "select our AI to pilot Deck A and then set Windbot to
// pilot Deck B so that I can watch the two vs in real time"). Browser- and Node-portable (Uint8Array/DataView only).
//
// WindBot Ignite (ProjectIgnis fork bffe6b6, AGPL-3.0-or-later, originally MIT-licensed IceYGO code; https://github.com/ProjectIgnis/windbot; full source: wb/windbot-source.zip) is the open-source scripted bot of YGOPro/EDOPro:
// each deck has a hand-written "executor" of per-card checks. Its unmodified game logic is compiled for the browser
// (wb/_framework, built from tools/windbot/web) and talks the EDOPro network protocol. This file is the minimal EDOPro host
// for one such bot:
//  - EdoRouter: every core message routed to the bot the way EDOPro's gframe/generic_duel.cpp does it (who may see what:
//    hidden codes zeroed exactly where EDOPro zeroes them; the same MSG_UPDATE_DATA / MSG_UPDATE_CARD refreshes before and
//    after the same messages, with the same query flags and the same public/private filtering as core_utils.cpp).
//  - decodeResponse: the bot's binary answer -> our engine's response object, given to Duel.respond like any other answer.
//  - lobby: join -> deck -> position -> ready, as an EDOPro host does it (no RPS: the seat and first player are fixed).
//  - WasmWindBot: one in-process bot of the browser build.
// The raw bytes come from core/index.js: duelGetMessage hands every raw batch to globalThis.__ocgRawHook when one is set,
// and duelQueryLocationRaw / duelQueryRaw return raw query buffers. With no hook set, the engine behaves exactly as before.

export const STOC={GAME_MSG:1,JOIN_GAME:0x12,TYPE_CHANGE:0x13,DUEL_START:0x15,DUEL_END:0x16};
export const CTOS={RESPONSE:1,UPDATE_DECK:2,PLAYER_INFO:0x10,JOIN_GAME:0x12,SURRENDER:0x14,HS_READY:0x22};
export const MSG={RETRY:1,HINT:2,WAITING:3,START:4,WIN:5,UPDATE_DATA:6,UPDATE_CARD:7,SELECT_BATTLECMD:10,SELECT_IDLECMD:11,SELECT_EFFECTYN:12,SELECT_YESNO:13,SELECT_OPTION:14,SELECT_CARD:15,SELECT_CHAIN:16,
 SELECT_PLACE:18,SELECT_POSITION:19,SELECT_TRIBUTE:20,SORT_CHAIN:21,SELECT_COUNTER:22,SELECT_SUM:23,SELECT_DISFIELD:24,SORT_CARD:25,SELECT_UNSELECT_CARD:26,CONFIRM_CARDS:31,SHUFFLE_HAND:33,SWAP_GRAVE_DECK:35,
 SHUFFLE_SET_CARD:36,REVERSE_DECK:37,SHUFFLE_EXTRA:39,NEW_TURN:40,NEW_PHASE:41,MOVE:50,POS_CHANGE:53,SET:54,SWAP:55,SUMMONED:61,SPSUMMONING:62,SPSUMMONED:63,FLIPSUMMONING:64,FLIPSUMMONED:65,CHAINED:71,
 CHAIN_SOLVED:73,CHAIN_END:74,DRAW:90,DAMAGE_STEP_START:113,DAMAGE_STEP_END:114,MISSED_EFFECT:120,ROCK_PAPER_SCISSORS:132,ANNOUNCE_RACE:140,ANNOUNCE_ATTRIB:141,ANNOUNCE_CARD:142,ANNOUNCE_NUMBER:143,
 TAG_SWAP:161,RELOAD_FIELD:162,MATCH_KILL:170};
export const PROMPT_MSGS=new Set([MSG.SELECT_BATTLECMD,MSG.SELECT_IDLECMD,MSG.SELECT_EFFECTYN,MSG.SELECT_YESNO,MSG.SELECT_OPTION,MSG.SELECT_CHAIN,MSG.SELECT_PLACE,MSG.SELECT_DISFIELD,MSG.SELECT_POSITION,
 MSG.SELECT_COUNTER,MSG.SELECT_SUM,MSG.SORT_CARD,MSG.SORT_CHAIN,MSG.ROCK_PAPER_SCISSORS,MSG.ANNOUNCE_RACE,MSG.ANNOUNCE_ATTRIB,MSG.ANNOUNCE_CARD,MSG.ANNOUNCE_NUMBER,MSG.SELECT_CARD,MSG.SELECT_TRIBUTE,MSG.SELECT_UNSELECT_CARD]);
const L={DECK:1,HAND:2,MZONE:4,SZONE:8,GRAVE:16,REMOVED:32,EXTRA:64,OVERLAY:128},POS_FACEUP=0x5,POS_FACEDOWN=0xA;
const Q={CODE:0x1,POSITION:0x2,ALIAS:0x4,TYPE:0x8,LEVEL:0x10,RANK:0x20,ATTRIBUTE:0x40,RACE:0x80,ATTACK:0x100,DEFENSE:0x200,BASE_ATTACK:0x400,BASE_DEFENSE:0x800,REASON:0x1000,REASON_CARD:0x2000,
 EQUIP_CARD:0x4000,TARGET_CARD:0x8000,OVERLAY_CARD:0x10000,COUNTERS:0x20000,OWNER:0x40000,STATUS:0x80000,IS_PUBLIC:0x100000,LSCALE:0x200000,RSCALE:0x400000,LINK:0x800000,IS_HIDDEN:0x1000000,COVER:0x2000000,END:0x80000000};
const PRIVATE_Q=Q.CODE|Q.ALIAS|Q.TYPE|Q.LEVEL|Q.RANK|Q.ATTRIBUTE|Q.RACE|Q.ATTACK|Q.DEFENSE|Q.BASE_ATTACK|Q.BASE_DEFENSE|Q.STATUS|Q.LSCALE|Q.RSCALE|Q.LINK;
export const REFRESH={MZONE:0x3981fff,SZONE:0x3f81fff,HAND:0x3781fff,GRAVE:0x381fff,EXTRA:0x381fff,SINGLE:0x3f81fff};

// ---------- bytes ----------
const u8a=b=>b instanceof Uint8Array?b:new Uint8Array(b);
const dv=b=>new DataView(b.buffer,b.byteOffset,b.byteLength);
const U16=(b,o)=>dv(b).getUint16(o,true),U32=(b,o)=>dv(b).getUint32(o,true),I32=(b,o)=>dv(b).getInt32(o,true);
const W32=(b,o,v)=>dv(b).setUint32(o,v>>>0,true);
export function concat(parts){let n=0;for(const p of parts)n+=p.length;const out=new Uint8Array(n);let o=0;for(const p of parts){out.set(p,o);o+=p.length}return out}

// ---------- query re-encoding (port of CoreUtils::Query::GenerateBuffer: public / private / check_hidden) ----------
function parseQuery(b,o){const entries=[];if(U16(b,o)===0)return {skipped:true,end:o+2};
 for(;;){const size=U16(b,o),flag=U32(b,o+2),payload=b.subarray(o+6,o+2+size);entries.push({flag,payload,raw:b.subarray(o,o+2+size)});o+=2+size;if(flag===Q.END)break}
 const get=f=>entries.find(e=>e.flag===f);const pos=get(Q.POSITION),pub=get(Q.IS_PUBLIC),hid=get(Q.IS_HIDDEN);
 return {entries,end:o,faceup:!!(pos&&(U32(pos.payload,0)&POS_FACEUP)),isPublic:!!(pub&&pub.payload[0]),isHidden:!!(hid&&hid.payload[0])}}
function genQuery(q,isPublicBuffer,checkHidden){if(q.skipped)return new Uint8Array([0,0]);const mustPublic=isPublicBuffer||(checkHidden&&q.isHidden),out=[];
 for(const e of q.entries){if(mustPublic&&!(q.isPublic||q.faceup)&&(e.flag&PRIVATE_Q))continue;
  if((e.flag===Q.REASON_CARD||e.flag===Q.EQUIP_CARD)&&e.payload[1]===0)continue;out.push(e.raw)}return concat(out)}
function queryStream(raw,isPublic){const b=u8a(raw);if(b.length<4)return null;const total=U32(b,0),parts=[];let o=4;
 while(o-4<total){const q=parseQuery(b,o);parts.push(genQuery(q,isPublic,true));o=q.end}const body=concat(parts),head=new Uint8Array(4);W32(head,0,body.length);return concat([head,body])}

// ---------- the bot's response -> our engine response object (inverse of the core library's encoder) ----------
function decodeList(b){const t=I32(b,0);if(t===-1)return null;const n=U32(b,4),out=[];
 if(t===0)for(let i=0;i<n;i++)out.push(U32(b,8+4*i));else if(t===1)for(let i=0;i<n;i++)out.push(U16(b,8+2*i));else if(t===2)for(let i=0;i<n;i++)out.push(b[8+i]);
 else if(t===3){for(let i=0;i<(b.length-4)*8;i++)if(b[4+(i>>3)]&(1<<(i&7)))out.push(i)}else throw Error('unknown card-list response type '+t);return out}
// SELECT_SUM: WindBot answers with indices into the selectable list, followed by one placeholder per must-select card; our
// engine objects use one index space [must cards..., selectable cards...] (dist/duel.mjs converts it for the core).
export function decodeResponse(msgType,bytes,prompt=null){const b=u8a(bytes),i32=()=>I32(b,0);
 switch(msgType){
  case MSG.SELECT_BATTLECMD:{const v=i32(),action=v&0xffff,index=v>>>16;return {type:0,action,index:action<2?index:null}}
  case MSG.SELECT_IDLECMD:{const v=i32(),action=v&0xffff,index=v>>>16;return {type:1,action,index:action<6?index:null}}
  case MSG.SELECT_EFFECTYN:return {type:2,yes:i32()!==0};case MSG.SELECT_YESNO:return {type:3,yes:i32()!==0};case MSG.SELECT_OPTION:return {type:4,index:i32()};
  case MSG.SELECT_CARD:{const l=decodeList(b);return l?{type:5,indicies:l}:{type:5}}
  case MSG.SELECT_TRIBUTE:{const l=decodeList(b);return l?{type:12,indicies:l}:{type:12}}
  case MSG.SELECT_SUM:{const l=decodeList(b);if(!l)return {type:14};const k=prompt?.selects_must?.length||0,sel=k?l.slice(0,Math.max(0,l.length-k)):l;return {type:14,indicies:[...Array.from({length:k},(_,i)=>i),...sel.map(i=>i+k)]}}
  case MSG.SELECT_UNSELECT_CARD:{const n=i32();return n<0?{type:7,index:null}:{type:7,index:I32(b,4)}}
  case MSG.SELECT_CHAIN:{const v=i32();return {type:8,index:v<0?null:v}}
  case MSG.SELECT_PLACE:case MSG.SELECT_DISFIELD:{const places=[];for(let o=0;o+3<=b.length;o+=3)places.push({player:b[o],location:b[o+1],sequence:b[o+2]});return {type:msgType===MSG.SELECT_PLACE?10:9,places}}
  case MSG.SELECT_POSITION:return {type:11,position:i32()};
  case MSG.SORT_CARD:case MSG.SORT_CHAIN:{if(b[0]===0xff)return {type:15,order:null};return {type:15,order:[...b].map(x=>x<<24>>24)}}
  case MSG.SELECT_COUNTER:{const counters=[];for(let o=0;o+2<=b.length;o+=2)counters.push(U16(b,o));return {type:13,counters}}
  case MSG.ANNOUNCE_RACE:{const v=dv(b).getBigUint64(0,true),races=[];for(let i=0n;i<64n;i++)if(v&(1n<<i))races.push(1n<<i);return {type:16,races}}
  case MSG.ANNOUNCE_ATTRIB:{const v=U32(b,0),attributes=[];for(let i=0;i<32;i++)if(v&(1<<i))attributes.push((1<<i)>>>0);return {type:17,attributes}}
  case MSG.ANNOUNCE_CARD:return {type:18,card:i32()};case MSG.ANNOUNCE_NUMBER:return {type:19,value:i32()};case MSG.ROCK_PAPER_SCISSORS:return {type:20,value:i32()};
  default:throw Error('no decoder for prompt message '+msgType)}}

// ---------- lobby (seat: next(id) -> Promise<body bytes>, send(id, body)) ----------
// HostInfo as EDOPro sends it in STOC_JOIN_GAME (MR5 rules, 8000 LP, 5-card hand, 1 draw, no time limit); returns WindBot's deck.
export async function lobby(seat,{duelFlags,position}){await seat.next(CTOS.PLAYER_INFO);await seat.next(CTOS.JOIN_GAME);
 const h=new Uint8Array(64),v=dv(h);let o=0;const u8=x=>{h[o++]=x},u16=x=>{v.setUint16(o,x,true);o+=2},u32=x=>{v.setUint32(o,x>>>0,true);o+=4};
 u32(0);u8(0);u8(0);u8(5);u8(1);u8(0);o+=3;u32(8000);u8(5);u8(1);u16(0);u32(Number((BigInt(duelFlags)>>32n)&0xffffffffn));u32(4043399681);u32(0);u32(1);u32(1);u32(1);u32(Number(BigInt(duelFlags)&0xffffffffn));u32(0);u32(0);
 seat.send(STOC.JOIN_GAME,h.subarray(0,o));const deck=u8a(await seat.next(CTOS.UPDATE_DECK));const mainExtra=I32(deck,0),side=I32(deck,4),cards=[];for(let i=0;i<mainExtra+side;i++)cards.push(I32(deck,8+4*i));
 seat.send(STOC.TYPE_CHANGE,new Uint8Array([position&0xf]));await seat.next(CTOS.HS_READY);seat.send(STOC.DUEL_START);return {cards:cards.slice(0,mainExtra),side:cards.slice(mainExtra)}}

// ---------- the router: EDOPro generic_duel.cpp Before/Sending/After for ONE recipient (the bot's engine team W) ----------
export class EdoRouter{
 constructor(core,handle,W,send){Object.assign(this,{core,handle,W,send});this.started=false;this.count=0;this.lastPrompt=null}
 msg(bytes){this.count++;this.send(bytes)}
 locInfo(b,o){return {controller:b[o],location:b[o+1],sequence:U32(b,o+2),position:U32(b,o+6)}}
 refreshLocation(player,flag,location){const raw=this.core.duelQueryLocationRaw(this.handle,{flags:flag,controller:player,location});if(!raw||raw.length===0)return;
  const qs=queryStream(raw,player!==this.W);if(!qs)return;this.msg(concat([new Uint8Array([MSG.UPDATE_DATA,player,location]),qs]))}
 refreshSingle(player,location,sequence,flag=REFRESH.SINGLE){const raw=this.core.duelQueryRaw(this.handle,{flags:flag,controller:player,location,sequence});if(!raw||raw.length===0)return;
  const q=parseQuery(u8a(raw),0);this.msg(concat([new Uint8Array([MSG.UPDATE_CARD,player,location,sequence&0xff]),genQuery(q,player!==this.W,true)]))}
 mz(){this.refreshLocation(0,REFRESH.MZONE,L.MZONE);this.refreshLocation(1,REFRESH.MZONE,L.MZONE)}sz(){this.refreshLocation(0,REFRESH.SZONE,L.SZONE);this.refreshLocation(1,REFRESH.SZONE,L.SZONE)}
 hand(){this.refreshLocation(0,REFRESH.HAND,L.HAND);this.refreshLocation(1,REFRESH.HAND,L.HAND)}
 // MSG_START as EDOPro sends it to a duelist (type = the recipient's team), then both Extra Decks. counts: [[main,extra] team 0, team 1]
 begin(counts,lp=8000){const b=new Uint8Array(18),v=dv(b);b[0]=MSG.START;b[1]=this.W;v.setUint32(2,lp,true);v.setUint32(6,lp,true);
  v.setUint16(10,counts[0][0],true);v.setUint16(12,counts[0][1],true);v.setUint16(14,counts[1][0],true);v.setUint16(16,counts[1][1],true);
  this.msg(b);this.refreshLocation(0,REFRESH.EXTRA,L.EXTRA);this.refreshLocation(1,REFRESH.EXTRA,L.EXTRA);this.started=true}
 batch(raw){const b=u8a(raw);let o=0;while(o+4<=b.length){const size=U32(b,o);this.route(b.slice(o+4,o+4+size));o+=4+size}}
 route(p){const t=p[0],W=this.W;
  // BeforeParsing
  if(t===MSG.SELECT_BATTLECMD||t===MSG.SELECT_IDLECMD){this.mz();this.sz();this.hand()}else if(t===MSG.SELECT_CHAIN||t===MSG.NEW_TURN){this.mz();this.sz()}
  else if(t===MSG.FLIPSUMMONING){const i=this.locInfo(p,5);this.refreshSingle(i.controller,i.location,i.sequence)}
  // Sending
  const zero=o=>W32(p,o,0);
  if(t===MSG.HINT){const type=p[1],player=p[2];if([1,2,3,5].includes(type)){if(player===W)this.msg(p)}else if([4,6,7,8,9,11].includes(type)){if(player!==W)this.msg(p)}else if(type===200){if(player===W)this.msg(p)}else this.msg(p)}
  else if(PROMPT_MSGS.has(t)){const player=p[1];if(player===W){
   if(t===MSG.SELECT_CARD||t===MSG.SELECT_UNSELECT_CARD){let o=1+1+(t===MSG.SELECT_CARD?9:10);for(let k=0;k<(t===MSG.SELECT_UNSELECT_CARD?2:1);k++){const n=U32(p,o);o+=4;for(let i=0;i<n;i++){if(p[o+4]!==player)zero(o);o+=14}}}
   if(t===MSG.SELECT_TRIBUTE){let o=2+9;const n=U32(p,o);o+=4;for(let i=0;i<n;i++){if(p[o+4]!==player)zero(o);o+=11}}
   this.lastPrompt=p.slice();this.msg(p)}}
  else if(t===MSG.CONFIRM_CARDS){const player=p[1],n=U32(p,2);if(n>0&&(p[11]===L.DECK||p[11]===L.EXTRA)){if(player===W)this.msg(p)}else this.msg(p)}
  else if(t===MSG.SHUFFLE_HAND||t===MSG.SHUFFLE_EXTRA){const player=p[1],n=U32(p,2);if(player!==W)for(let i=0;i<n;i++)zero(6+4*i);this.msg(p)}
  else if(t===MSG.MOVE){const cur=this.locInfo(p,15);if(cur.controller!==W&&!(cur.location&(L.GRAVE|L.OVERLAY))&&((cur.location&(L.DECK|L.HAND))||(cur.position&POS_FACEDOWN)))zero(1);this.msg(p)}
  else if(t===MSG.SET){zero(1);this.msg(p)}
  else if(t===MSG.SPSUMMONING){const cur=this.locInfo(p,5);if((cur.position&POS_FACEDOWN)&&cur.controller!==W)zero(1);this.msg(p)}
  else if(t===MSG.DRAW){const player=p[1],n=U32(p,2);if(player!==W)for(let i=0;i<n;i++){const o=6+8*i;if(!(U32(p,o+4)&POS_FACEUP))zero(o)}this.msg(p)}
  else if(t===MSG.MISSED_EFFECT){if(p[1]===W)this.msg(p)}
  else if(t===MSG.MATCH_KILL||t===MSG.WAITING){}
  else this.msg(p);
  // AfterParsing
  if(t===MSG.SHUFFLE_HAND||t===MSG.DRAW)this.refreshLocation(p[1],REFRESH.HAND,L.HAND);
  else if(t===MSG.SHUFFLE_EXTRA)this.refreshLocation(p[1],REFRESH.EXTRA,L.EXTRA);
  else if(t===MSG.SWAP_GRAVE_DECK)this.refreshLocation(p[1],REFRESH.GRAVE,L.GRAVE);
  else if(t===MSG.SHUFFLE_SET_CARD){this.refreshLocation(0,0x3181fff,p[1]);this.refreshLocation(1,0x3181fff,p[1])}
  else if([MSG.DAMAGE_STEP_START,MSG.DAMAGE_STEP_END,MSG.SUMMONED,MSG.SPSUMMONED,MSG.FLIPSUMMONED,MSG.NEW_PHASE,MSG.CHAINED,MSG.CHAIN_SOLVED,MSG.CHAIN_END].includes(t)){
   this.mz();if(t!==MSG.DAMAGE_STEP_START&&t!==MSG.DAMAGE_STEP_END)this.sz();if(t===MSG.NEW_PHASE||t===MSG.CHAINED||t===MSG.CHAIN_END)this.hand()}
  else if(t===MSG.MOVE){const prev=this.locInfo(p,5),cur=this.locInfo(p,15);if(cur.location!==0&&!(cur.location&0x80)&&(cur.location!==prev.location||prev.controller!==cur.controller))this.refreshSingle(cur.controller,cur.location,cur.sequence)}
  else if(t===MSG.POS_CHANGE){const cc=p[5],cl=p[6],cs=p[7],pp=p[8],cp=p[9];/* code u32, then c,l,s,prev,cur as bytes (generic_duel.cpp) */if((pp&POS_FACEDOWN)&&(cp&POS_FACEUP))this.refreshSingle(cc,cl,cs)}
  else if(t===MSG.SWAP){const a=this.locInfo(p,5),c=this.locInfo(p,19);this.refreshSingle(a.controller,a.location,a.sequence);this.refreshSingle(c.controller,c.location,c.sequence)}
  else if(t===MSG.RELOAD_FIELD){this.refreshLocation(0,REFRESH.EXTRA,L.EXTRA);this.refreshLocation(1,REFRESH.EXTRA,L.EXTRA)}}}

// ---------- decks and cards ----------
export function parseYdk(text){const main=[],extra=[],side=[];let cur=main;for(const line of String(text).split(/\r?\n/)){const l=line.trim();if(l==='#main')cur=main;else if(l==='#extra')cur=extra;else if(l==='!side')cur=side;else if(/^\d+$/.test(l))cur.push(+l)}return {main,extra,side}}
export const toYdk=({main=[],extra=[],side=[]})=>['#created by Kevy\'s Duel Doctrine Lab','#main',...main,'#extra',...extra,'!side',...side,''].join('\n');
// The card rows WindBot reads from its card database (same column order as its cards.cdb query), built from the site's own card data.
export function cardRows(db){const pack=s=>{let v=0n;(s||[]).slice(0,4).forEach((x,i)=>v|=BigInt(x)<<BigInt(16*i));return v};
 return Object.values(db).map(c=>[c.code,3,c.alias||0,pack(c.setcodes),c.type,((c.level||0)|((c.lscale||0)<<24)|((c.rscale||0)<<16))>>>0,BigInt(c.race||0),c.attribute||0,c.attack||0,(c.type&0x4000000)?(c.link_marker||0):(c.defense||0),String(c.name).replace(/[\t\n]/g,' ')].join('\t')).join('\n')}

// ---------- one in-process bot of the browser build ----------
// load(dotnetUrl, db): starts the .NET runtime once and gives WindBot the card data. Packets go straight into WindBot's own
// GameBehavior; whatever it sends back is queued exactly as a TCP host would receive it.
export class WasmWindBot{
 constructor({exports,executor,deckName,ydk,dialog,seed}){this.wb=exports.WindBot.WebBot;this.id=this.wb.Create(executor,deckName,ydk,dialog,seed|0);this.inbox=[];this.received=0;this.sent=0;this.closed=false}
 static async load(dotnetUrl,db){const {dotnet}=await import(dotnetUrl);const rt=await dotnet.create();const ex=await rt.getAssemblyExports(rt.getConfig().mainAssemblyName);ex.WindBot.WebBot.LoadCards(cardRows(db));return ex}
 take(framed){const b=u8a(framed);let o=0;while(o+2<=b.length){const n=U16(b,o);this.inbox.push(b.slice(o+2,o+2+n));this.received++;o+=2+n}}
 async connect(){this.take(this.wb.Hello(this.id))}
 next(id){const i=this.inbox.findIndex(p=>p[0]===id);if(i<0)return Promise.reject(Error('WindBot has no packet 0x'+id.toString(16)+' waiting'));return Promise.resolve(this.inbox.splice(i,1)[0].subarray(1))}
 takeNow(id){const i=this.inbox.findIndex(p=>p[0]===id);return i<0?null:this.inbox.splice(i,1)[0].subarray(1)}
 clear(){this.inbox.length=0}
 send(id,body=new Uint8Array(0)){if(this.closed)return;this.sent++;this.take(this.wb.Packet(this.id,concat([new Uint8Array([id]),u8a(body)])))}
 gameMsg(bytes){this.send(STOC.GAME_MSG,bytes)}
 lobby(o){return lobby(this,o)}
 async close(){if(!this.closed){this.wb.Dispose(this.id);this.closed=true}}}

// r37 WindBot bridge (Claude as builder, 7 Nov 2026; Kevy 21:53/21:57 AEDT: "have our AI vs a scripted AI bot to see which
// wins more"). Lets the unmodified open-source WindBot (ProjectIgnis fork, MIT; per-deck scripted "executors") play one seat
// of a duel run by OUR engine (dist/duel.mjs + the same ocgcore WASM build the site uses), while our AI plays the other seat.
//
// WindBot normally connects to an EDOPro server over TCP. This file is a minimal EDOPro-compatible host for exactly one
// WindBot: the lobby handshake (join -> deck -> position -> ready), then every core message routed the way EDOPro's
// gframe/generic_duel.cpp does it - same "who may see this" rules (codes of hidden cards zeroed for the bot when EDOPro would
// zero them), same MSG_UPDATE_DATA / MSG_UPDATE_CARD refreshes before and after the same messages, with the same query flags
// and the same public/private query filtering (gframe/core_utils.cpp). WindBot's binary responses are decoded into our
// engine's response objects and given to Duel.respond like any other answer, so the engine, the rules, the logs and our AI's
// knowledge of public actions are exactly those of a normal duel.
//
// The raw core bytes come from a bridge-only copy of the engine tree whose core/index.js gets three read-only additions
// (raw message hook, raw location/card queries). The shipped dist/ is never changed.
import fs from 'node:fs';import path from 'node:path';import net from 'node:net';import {spawn} from 'node:child_process';import {pathToFileURL} from 'node:url';

// ---------- bridge tree: dist/ hard-linked, core/index.js patched (raw hook + raw queries) ----------
export function makeBridgeTree(srcRoot,outRoot){
 const src=path.join(srcRoot,'dist'),dst=path.join(outRoot,'dist');fs.rmSync(outRoot,{recursive:true,force:true});fs.mkdirSync(dst,{recursive:true});
 const walk=(a,b)=>{for(const e of fs.readdirSync(a,{withFileTypes:true})){const s=path.join(a,e.name),t=path.join(b,e.name);if(e.isDirectory()){fs.mkdirSync(t);walk(s,t)}else fs.linkSync(s,t)}};walk(src,dst);
 const f=path.join(dst,'core/index.js');let s=fs.readFileSync(f,'utf8');fs.unlinkSync(f);
 const rep=(a,b)=>{if(s.split(a).length!==2)throw Error('core patch anchor not unique: '+a.slice(0,60));s=s.replace(a,b)};
 rep('duelGetMessage({[D]:o}){let s=e.stackSave(),r=e.stackAlloc(4),O=e._ocgapiDuelGetMessage(o,r),c=e.getValue(r,"i32");e.stackRestore(s);',
     'duelGetMessage(__h){let o=__h[D];let s=e.stackSave(),r=e.stackAlloc(4),O=e._ocgapiDuelGetMessage(o,r),c=e.getValue(r,"i32");e.stackRestore(s);let __raw=globalThis.__ocgRawHook?e.HEAPU8.slice(O,O+c):null;globalThis.__ocgLastRaw=__raw;');
 rep('E.push(R)}return E},duelSetResponse({[D]:o},s){',
     'E.push(R)}if(__raw)globalThis.__ocgRawHook(__h,__raw);return E},'+
     'duelQueryLocationRaw({[D]:o},s){let r=new H(24,!0);r.u32(s.flags),r.u8(s.controller),r.u32(s.location),r.u32(0),r.u32(0);let O=e.stackSave();try{let c=r.get(4),a=e.stackAlloc(c.byteLength);e.HEAP8.set(c,a);let E=e.stackAlloc(4),i=e._ocgapiDuelQueryLocation(o,E,a),T=e.getValue(E,"i32");return e.HEAPU8.slice(i,i+T)}finally{e.stackRestore(O)}},'+
     'duelQueryRaw({[D]:o},s){let r=new H(24,!0);r.u32(s.flags),r.u8(s.controller),r.u32(s.location),r.u32(s.sequence),r.u32(0);let O=e.stackSave();try{let c=r.get(4),a=e.stackAlloc(c.byteLength);e.HEAP8.set(c,a);let E=e.stackAlloc(4),i=e._ocgapiDuelQuery(o,E,a),T=e.getValue(E,"i32");return e.HEAPU8.slice(i,i+T)}finally{e.stackRestore(O)}},'+
     'duelSetResponse({[D]:o},s){');
 // ENGINE-LIBRARY FIX (found 7 Nov in a WindBot game; also affects the site): the core writes MSG_SHUFFLE_SET_CARD's count as
 // a u8 (EDOPro duelclient.cpp and WindBot both read u8), but this JS parser read a u32 and threw 'eof', stopping the duel.
 rep('case 36:return{type:t,location:e.u8(),cards:Array.from({length:e.u32()},','case 36:return{type:t,location:e.u8(),cards:Array.from({length:e.u8()},');
 fs.writeFileSync(f,s);return outRoot}

// ---------- EDOPro constants ----------
const CTOS={RESPONSE:1,UPDATE_DECK:2,HAND_RESULT:3,TP_RESULT:4,PLAYER_INFO:0x10,CREATE_GAME:0x11,JOIN_GAME:0x12,SURRENDER:0x14,TIME_CONFIRM:0x15,CHAT:0x16,HS_READY:0x22,HS_START:0x25};
const STOC={GAME_MSG:1,JOIN_GAME:0x12,TYPE_CHANGE:0x13,DUEL_START:0x15,DUEL_END:0x16};
const MSG={RETRY:1,HINT:2,WAITING:3,START:4,WIN:5,UPDATE_DATA:6,UPDATE_CARD:7,SELECT_BATTLECMD:10,SELECT_IDLECMD:11,SELECT_EFFECTYN:12,SELECT_YESNO:13,SELECT_OPTION:14,SELECT_CARD:15,SELECT_CHAIN:16,
 SELECT_PLACE:18,SELECT_POSITION:19,SELECT_TRIBUTE:20,SORT_CHAIN:21,SELECT_COUNTER:22,SELECT_SUM:23,SELECT_DISFIELD:24,SORT_CARD:25,SELECT_UNSELECT_CARD:26,CONFIRM_CARDS:31,SHUFFLE_HAND:33,SWAP_GRAVE_DECK:35,
 SHUFFLE_SET_CARD:36,REVERSE_DECK:37,SHUFFLE_EXTRA:39,NEW_TURN:40,NEW_PHASE:41,MOVE:50,POS_CHANGE:53,SET:54,SWAP:55,SUMMONED:61,SPSUMMONING:62,SPSUMMONED:63,FLIPSUMMONING:64,FLIPSUMMONED:65,CHAINED:71,
 CHAIN_SOLVED:73,CHAIN_END:74,DRAW:90,DAMAGE_STEP_START:113,DAMAGE_STEP_END:114,MISSED_EFFECT:120,ROCK_PAPER_SCISSORS:132,ANNOUNCE_RACE:140,ANNOUNCE_ATTRIB:141,ANNOUNCE_CARD:142,ANNOUNCE_NUMBER:143,
 TAG_SWAP:161,RELOAD_FIELD:162,MATCH_KILL:170};
const ONLY_TO_PLAYER=new Set([MSG.SELECT_BATTLECMD,MSG.SELECT_IDLECMD,MSG.SELECT_EFFECTYN,MSG.SELECT_YESNO,MSG.SELECT_OPTION,MSG.SELECT_CHAIN,MSG.SELECT_PLACE,MSG.SELECT_DISFIELD,MSG.SELECT_POSITION,
 MSG.SELECT_COUNTER,MSG.SELECT_SUM,MSG.SORT_CARD,MSG.SORT_CHAIN,MSG.ROCK_PAPER_SCISSORS,MSG.ANNOUNCE_RACE,MSG.ANNOUNCE_ATTRIB,MSG.ANNOUNCE_CARD,MSG.ANNOUNCE_NUMBER,MSG.SELECT_CARD,MSG.SELECT_TRIBUTE,MSG.SELECT_UNSELECT_CARD]);
export const PROMPT_MSGS=ONLY_TO_PLAYER;
const L={DECK:1,HAND:2,MZONE:4,SZONE:8,GRAVE:16,REMOVED:32,EXTRA:64,OVERLAY:128},POS_FACEUP=0x5,POS_FACEDOWN=0xA;
const Q={CODE:0x1,POSITION:0x2,ALIAS:0x4,TYPE:0x8,LEVEL:0x10,RANK:0x20,ATTRIBUTE:0x40,RACE:0x80,ATTACK:0x100,DEFENSE:0x200,BASE_ATTACK:0x400,BASE_DEFENSE:0x800,REASON:0x1000,REASON_CARD:0x2000,
 EQUIP_CARD:0x4000,TARGET_CARD:0x8000,OVERLAY_CARD:0x10000,COUNTERS:0x20000,OWNER:0x40000,STATUS:0x80000,IS_PUBLIC:0x100000,LSCALE:0x200000,RSCALE:0x400000,LINK:0x800000,IS_HIDDEN:0x1000000,COVER:0x2000000,END:0x80000000};
const PRIVATE_Q=Q.CODE|Q.ALIAS|Q.TYPE|Q.LEVEL|Q.RANK|Q.ATTRIBUTE|Q.RACE|Q.ATTACK|Q.DEFENSE|Q.BASE_ATTACK|Q.BASE_DEFENSE|Q.STATUS|Q.LSCALE|Q.RSCALE|Q.LINK;
const REFRESH={MZONE:0x3981fff,SZONE:0x3f81fff,HAND:0x3781fff,GRAVE:0x381fff,EXTRA:0x381fff,SINGLE:0x3f81fff};

// ---------- query re-encoding (port of CoreUtils::Query::GenerateBuffer: public / private / check_hidden) ----------
function parseQuery(b,o){const entries=[];if(b.readUInt16LE(o)===0)return {skipped:true,end:o+2};
 for(;;){const size=b.readUInt16LE(o),flag=b.readUInt32LE(o+2),payload=b.subarray(o+6,o+2+size);entries.push({flag,payload,raw:b.subarray(o,o+2+size)});o+=2+size;if(flag===Q.END)break}
 const get=f=>entries.find(e=>e.flag===f);const pos=get(Q.POSITION),pub=get(Q.IS_PUBLIC),hid=get(Q.IS_HIDDEN);
 return {entries,end:o,faceup:!!(pos&&(pos.payload.readUInt32LE(0)&POS_FACEUP)),isPublic:!!(pub&&pub.payload[0]),isHidden:!!(hid&&hid.payload[0])}}
function genQuery(q,isPublicBuffer,checkHidden){if(q.skipped)return Buffer.from([0,0]);const mustPublic=isPublicBuffer||(checkHidden&&q.isHidden),out=[];
 for(const e of q.entries){if(mustPublic&&!(q.isPublic||q.faceup)&&(e.flag&PRIVATE_Q))continue;
  if((e.flag===Q.REASON_CARD||e.flag===Q.EQUIP_CARD)&&e.payload[1]===0)continue;out.push(e.raw)}return Buffer.concat(out)}
function queryStream(raw,isPublic){const b=Buffer.from(raw);if(b.length<4)return null;const total=b.readUInt32LE(0),parts=[];let o=4;
 while(o-4<total){const q=parseQuery(b,o);parts.push(genQuery(q,isPublic,true));o=q.end}const body=Buffer.concat(parts),head=Buffer.alloc(4);head.writeUInt32LE(body.length);return Buffer.concat([head,body])}

// ---------- WindBot response -> our engine response object ----------
function decodeList(b){const t=b.readInt32LE(0);if(t===-1)return null;const n=b.readUInt32LE(4),out=[];
 if(t===0)for(let i=0;i<n;i++)out.push(b.readUInt32LE(8+4*i));else if(t===1)for(let i=0;i<n;i++)out.push(b.readUInt16LE(8+2*i));else if(t===2)for(let i=0;i<n;i++)out.push(b[8+i]);
 else if(t===3){for(let i=0;i<(b.length-4)*8;i++)if(b[4+(i>>3)]&(1<<(i&7)))out.push(i)}else throw Error('unknown card-list response type '+t);return out}
export function decodeResponse(msgType,bytes){const b=Buffer.from(bytes),i32=()=>b.readInt32LE(0);
 switch(msgType){
  case MSG.SELECT_BATTLECMD:{const v=i32(),action=v&0xffff,index=v>>>16;return {type:0,action,index:action<2?index:null}}
  case MSG.SELECT_IDLECMD:{const v=i32(),action=v&0xffff,index=v>>>16;return {type:1,action,index:action<6?index:null}}
  case MSG.SELECT_EFFECTYN:return {type:2,yes:i32()!==0};case MSG.SELECT_YESNO:return {type:3,yes:i32()!==0};case MSG.SELECT_OPTION:return {type:4,index:i32()};
  case MSG.SELECT_CARD:{const l=decodeList(b);return l?{type:5,indicies:l}:{type:5}}
  case MSG.SELECT_TRIBUTE:{const l=decodeList(b);return l?{type:12,indicies:l}:{type:12}}
  case MSG.SELECT_SUM:{const l=decodeList(b);return l?{type:14,indicies:l}:{type:14}}
  case MSG.SELECT_UNSELECT_CARD:{const n=i32();return n<0?{type:7,index:null}:{type:7,index:b.readInt32LE(4)}}
  case MSG.SELECT_CHAIN:{const v=i32();return {type:8,index:v<0?null:v}}
  case MSG.SELECT_PLACE:case MSG.SELECT_DISFIELD:{const places=[];for(let o=0;o+3<=b.length;o+=3)places.push({player:b[o],location:b[o+1],sequence:b[o+2]});return {type:msgType===MSG.SELECT_PLACE?10:9,places}}
  case MSG.SELECT_POSITION:return {type:11,position:i32()};
  case MSG.SORT_CARD:case MSG.SORT_CHAIN:{if(b[0]===0xff)return {type:15,order:null};return {type:15,order:[...b].map(x=>x<<24>>24)}}
  case MSG.SELECT_COUNTER:{const counters=[];for(let o=0;o+2<=b.length;o+=2)counters.push(b.readUInt16LE(o));return {type:13,counters}}
  case MSG.ANNOUNCE_RACE:{const v=b.readBigUInt64LE(0),races=[];for(let i=0n;i<64n;i++)if(v&(1n<<i))races.push(1n<<i);return {type:16,races}}
  case MSG.ANNOUNCE_ATTRIB:{const v=b.readUInt32LE(0),attributes=[];for(let i=0;i<32;i++)if(v&(1<<i))attributes.push((1<<i)>>>0);return {type:17,attributes}}
  case MSG.ANNOUNCE_CARD:return {type:18,card:i32()};case MSG.ANNOUNCE_NUMBER:return {type:19,value:i32()};case MSG.ROCK_PAPER_SCISSORS:return {type:20,value:i32()};
  default:throw Error('no decoder for prompt message '+msgType)}}

// ---------- packet framing ----------
const frame=(id,body=Buffer.alloc(0))=>{const h=Buffer.alloc(3);h.writeUInt16LE(body.length+1,0);h[2]=id;return Buffer.concat([h,body])};
class PacketReader{constructor(){this.buf=Buffer.alloc(0)}push(d){this.buf=Buffer.concat([this.buf,d]);const out=[];for(;;){if(this.buf.length<2)break;const n=this.buf.readUInt16LE(0);if(this.buf.length<2+n)break;out.push(this.buf.subarray(2,2+n));this.buf=this.buf.subarray(2+n)}return out}}

// ---------- one WindBot seat ----------
export class WindBotSeat{
 constructor({windbotDir,dotnet,executor,deckFile,name='WindBot',log=()=>{}}){Object.assign(this,{windbotDir,dotnet,executor,deckFile,name,log});this.waiters=[];this.inbox=[];this.sent=0;this.received=0;this.stderr=''}
 async connect(port=0){this.server=net.createServer();await new Promise(r=>this.server.listen(port,'127.0.0.1',r));const p=this.server.address().port;
  const conn=new Promise(r=>this.server.once('connection',r));
  this.proc=spawn(this.dotnet,[path.join(this.windbotDir,'WindBot.dll'),'Name='+this.name,'Deck='+this.executor,'DeckFile='+this.deckFile,'Host=127.0.0.1','Port='+p,'Version=0','Hand=0','Dialog=default','Debug=false','Chat=false'],{cwd:this.windbotDir,env:{...process.env,DOTNET_CLI_TELEMETRY_OPTOUT:'1'}});
  this.proc.stdout.on('data',d=>this.log('[wb] '+String(d).trim()));this.proc.stderr.on('data',d=>{this.stderr+=d;this.log('[wb!] '+String(d).trim())});this.exited=new Promise(r=>this.proc.once('exit',c=>{this.exitCode=c;r(c)}));
  this.sock=await Promise.race([conn,new Promise((_,j)=>setTimeout(()=>j(Error('WindBot did not connect within 60 s: '+this.stderr.slice(-400))),60000))]);this.sock.setNoDelay(true);
  const rd=new PacketReader();this.sock.on('data',d=>{for(const p of rd.push(d))this.onPacket(p)});this.sock.on('error',e=>this.log('[sock] '+e.message));this.sock.on('close',()=>{this.closed=true;for(const w of this.waiters.splice(0))w.reject(Error('WindBot connection closed'))})}
 onPacket(p){this.received++;this.inbox.push(p);const w=this.waiters.find(w=>w.id===p[0]);if(w){this.waiters.splice(this.waiters.indexOf(w),1);this.inbox.splice(this.inbox.indexOf(p),1);w.resolve(p.subarray(1))}}
 next(id,ms=120000){const i=this.inbox.findIndex(p=>p[0]===id);if(i>=0){const p=this.inbox.splice(i,1)[0];return Promise.resolve(p.subarray(1))}
  return new Promise((resolve,reject)=>{const w={id,resolve,reject};this.waiters.push(w);setTimeout(()=>{const k=this.waiters.indexOf(w);if(k>=0){this.waiters.splice(k,1);reject(Error('WindBot sent no packet 0x'+id.toString(16)+' within '+ms+' ms'))}},ms)})}
 send(id,body){if(!this.closed){this.sock.write(frame(id,body));this.sent++}}
 gameMsg(bytes){this.send(STOC.GAME_MSG,Buffer.from(bytes))}
 // lobby: JOIN_GAME (host info) -> UPDATE_DECK -> TYPE_CHANGE -> HS_READY. Returns the deck WindBot submitted.
 async lobby({duelFlags,position}){await this.next(CTOS.PLAYER_INFO);await this.next(CTOS.JOIN_GAME);
  const h=Buffer.alloc(64);let o=0;const u8=v=>{h[o++]=v},u16=v=>{h.writeUInt16LE(v,o);o+=2},u32=v=>{h.writeUInt32LE(v>>>0,o);o+=4};
  u32(0);u8(0);u8(0);u8(5);u8(1);u8(0);o+=3;u32(8000);u8(5);u8(1);u16(0);u32(Number((duelFlags>>32n)&0xffffffffn));u32(4043399681);u32(0);u32(1);u32(1);u32(1);u32(Number(duelFlags&0xffffffffn));u32(0);u32(0);
  this.send(STOC.JOIN_GAME,h.subarray(0,o));const deck=await this.next(CTOS.UPDATE_DECK);const mainExtra=deck.readInt32LE(0),side=deck.readInt32LE(4),cards=[];for(let i=0;i<mainExtra+side;i++)cards.push(deck.readInt32LE(8+4*i));
  this.send(STOC.TYPE_CHANGE,Buffer.from([position&0xf]));await this.next(CTOS.HS_READY);this.send(STOC.DUEL_START);return {cards:cards.slice(0,mainExtra),side:cards.slice(mainExtra)}}
 async close(){try{this.send(STOC.DUEL_END)}catch{}try{this.sock?.end()}catch{}const t=setTimeout(()=>{try{this.proc.kill('SIGKILL')}catch{}},3000);await this.exited;clearTimeout(t);this.server.close()}}

// ---------- the router: EDOPro generic_duel.cpp Before/Sending/After for ONE recipient (the bot's engine team W) ----------
export class EdoRouter{
 constructor(core,handle,W,send){Object.assign(this,{core,handle,W,send});this.started=false;this.count=0;this.lastPrompt=null}
 msg(bytes){this.count++;this.send(bytes)}
 locInfo(b,o){return {controller:b[o],location:b[o+1],sequence:b.readUInt32LE(o+2),position:b.readUInt32LE(o+6)}}
 refreshLocation(player,flag,location){const raw=this.core.duelQueryLocationRaw(this.handle,{flags:flag,controller:player,location});if(!raw||raw.length===0)return;
  const qs=queryStream(raw,player!==this.W);if(!qs)return;this.msg(Buffer.concat([Buffer.from([MSG.UPDATE_DATA,player,location]),qs]))}
 refreshSingle(player,location,sequence,flag=REFRESH.SINGLE){const raw=this.core.duelQueryRaw(this.handle,{flags:flag,controller:player,location,sequence});if(!raw||raw.length===0)return;
  const q=parseQuery(Buffer.from(raw),0);this.msg(Buffer.concat([Buffer.from([MSG.UPDATE_CARD,player,location,sequence&0xff]),genQuery(q,player!==this.W,true)]))}
 mz(){this.refreshLocation(0,REFRESH.MZONE,L.MZONE);this.refreshLocation(1,REFRESH.MZONE,L.MZONE)}sz(){this.refreshLocation(0,REFRESH.SZONE,L.SZONE);this.refreshLocation(1,REFRESH.SZONE,L.SZONE)}
 hand(){this.refreshLocation(0,REFRESH.HAND,L.HAND);this.refreshLocation(1,REFRESH.HAND,L.HAND)}
 start(){const b=Buffer.alloc(18);b[0]=MSG.START;b[1]=this.W;b.writeUInt32LE(8000,2);b.writeUInt32LE(8000,6);
  b.writeUInt16LE(this.core.duelQueryCount(this.handle,0,L.DECK),10);b.writeUInt16LE(this.core.duelQueryCount(this.handle,0,L.EXTRA),12);b.writeUInt16LE(this.core.duelQueryCount(this.handle,1,L.DECK),14);b.writeUInt16LE(this.core.duelQueryCount(this.handle,1,L.EXTRA),16);
  this.msg(b);this.refreshLocation(0,REFRESH.EXTRA,L.EXTRA);this.refreshLocation(1,REFRESH.EXTRA,L.EXTRA);this.started=true}
 batch(raw){const b=Buffer.from(raw);let o=0;while(o<b.length){const size=b.readUInt32LE(o);this.route(Buffer.from(b.subarray(o+4,o+4+size)));o+=4+size}}
 route(p){const t=p[0],W=this.W;
  // BeforeParsing
  if(t===MSG.SELECT_BATTLECMD||t===MSG.SELECT_IDLECMD){this.mz();this.sz();this.hand()}else if(t===MSG.SELECT_CHAIN||t===MSG.NEW_TURN){this.mz();this.sz()}
  else if(t===MSG.FLIPSUMMONING){const i=this.locInfo(p,5);this.refreshSingle(i.controller,i.location,i.sequence)}
  // Sending
  const zero=(o)=>{p.writeUInt32LE(0,o)};
  if(t===MSG.HINT){const type=p[1],player=p[2];if([1,2,3,5].includes(type)){if(player===W)this.msg(p)}else if([4,6,7,8,9,11].includes(type)){if(player!==W)this.msg(p)}else if(type===200){if(player===W)this.msg(p)}else this.msg(p)}
  else if(ONLY_TO_PLAYER.has(t)){const player=p[1];if(player===W){
   if(t===MSG.SELECT_CARD||t===MSG.SELECT_UNSELECT_CARD){let o=1+1+(t===MSG.SELECT_CARD?9:10);for(let k=0;k<(t===MSG.SELECT_UNSELECT_CARD?2:1);k++){const n=p.readUInt32LE(o);o+=4;for(let i=0;i<n;i++){if(p[o+4]!==player)zero(o);o+=14}}}
   if(t===MSG.SELECT_TRIBUTE){let o=2+9;const n=p.readUInt32LE(o);o+=4;for(let i=0;i<n;i++){if(p[o+4]!==player)zero(o);o+=11}}
   this.lastPrompt=Buffer.from(p);this.msg(p)}}
  else if(t===MSG.CONFIRM_CARDS){const player=p[1],n=p.readUInt32LE(2);if(n>0&&(p[11]===L.DECK||p[11]===L.EXTRA)){if(player===W)this.msg(p)}else this.msg(p)}
  else if(t===MSG.SHUFFLE_HAND||t===MSG.SHUFFLE_EXTRA){const player=p[1],n=p.readUInt32LE(2);if(player!==W)for(let i=0;i<n;i++)zero(6+4*i);this.msg(p)}
  else if(t===MSG.MOVE){const cur=this.locInfo(p,15);if(cur.controller!==W&&!(cur.location&(L.GRAVE|L.OVERLAY))&&((cur.location&(L.DECK|L.HAND))||(cur.position&POS_FACEDOWN)))zero(1);this.msg(p)}
  else if(t===MSG.SET){zero(1);this.msg(p)}
  else if(t===MSG.SPSUMMONING){const cur=this.locInfo(p,5);if((cur.position&POS_FACEDOWN)&&cur.controller!==W)zero(1);this.msg(p)}
  else if(t===MSG.DRAW){const player=p[1],n=p.readUInt32LE(2);if(player!==W)for(let i=0;i<n;i++){const o=6+8*i;if(!(p.readUInt32LE(o+4)&POS_FACEUP))zero(o)}this.msg(p)}
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

// ---------- ydk ----------
export function readYdk(file){const main=[],extra=[],side=[];let cur=main;for(const line of fs.readFileSync(file,'utf8').split(/\r?\n/)){const l=line.trim();if(l==='#main')cur=main;else if(l==='#extra')cur=extra;else if(l==='!side')cur=side;else if(/^\d+$/.test(l))cur.push(+l)}return {main,extra,side}}
export const importTree=(root,f)=>import(pathToFileURL(path.join(root,'dist',f)).href);

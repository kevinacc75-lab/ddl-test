// r37 engine-library patch for dist/core/index.js (Claude as builder, 7-8 Nov 2026). SELF-VERIFIED until reviewed.
// The core library (ocgcore-wasm wrapper, built into core/index.js) parses the engine's binary messages into objects.
// Changes, each anchored on text that must occur exactly once:
//  1. RAW HOOK (additive, no effect unless globalThis.__ocgRawHook is set): duelGetMessage hands each raw message batch to
//     the hook; duelQueryLocationRaw / duelQueryRaw return raw query buffers. Used by the WindBot seat (dist/windbot/edo.mjs),
//     which needs the bytes exactly as an EDOPro server would forward them.
//  2. FIX MSG_SHUFFLE_SET_CARD (36): the engine writes the count as a u8, then all previous locations, then all new
//     locations (libduel.cpp shuffle_setcard; EDOPro duelclient.cpp reads it that way). The library read a u32 count and
//     interleaved pairs, so it read past the end and threw 'eof', which stopped the duel.
//  3. FIX MSG_SELECT_SUM (23): the engine writes the MUST-select cards first, then the selectable ones, and each card with a
//     full location (controller u8, location u8, sequence u32, POSITION u32) before its sum value (playerop.cpp
//     SelectSum; EDOPro and WindBot read it that way). The library read the selectable list first and skipped the position,
//     so with two or more cards every value after the first was garbage and no legal material set could be found
//     (the pilot stalled: "This pilot needs help with this choice"). Ritual summons by level total use this prompt.
//  audit (bridge/test trees only): records any message whose parse leaves bytes unread, to catch other layout mistakes.
export function patchCore(s,{hook=true,fixes=true,audit=false}={}){
 const rep=(a,b)=>{if(s.split(a).length!==2)throw Error('core patch anchor not unique or missing: '+a.slice(0,80));s=s.replace(a,b)};
 if(hook){
  rep('duelGetMessage({[D]:o}){let s=e.stackSave(),r=e.stackAlloc(4),O=e._ocgapiDuelGetMessage(o,r),c=e.getValue(r,"i32");e.stackRestore(s);',
      'duelGetMessage(__h){let o=__h[D];let s=e.stackSave(),r=e.stackAlloc(4),O=e._ocgapiDuelGetMessage(o,r),c=e.getValue(r,"i32");e.stackRestore(s);let __raw=globalThis.__ocgRawHook?e.HEAPU8.slice(O,O+c):null;globalThis.__ocgLastRaw=__raw;');
  rep('E.push(R)}return E},duelSetResponse({[D]:o},s){',
      'E.push(R)}if(__raw)globalThis.__ocgRawHook(__h,__raw);return E},'+
      'duelQueryLocationRaw({[D]:o},s){let r=new H(24,!0);r.u32(s.flags),r.u8(s.controller),r.u32(s.location),r.u32(0),r.u32(0);let O=e.stackSave();try{let c=r.get(4),a=e.stackAlloc(c.byteLength);e.HEAP8.set(c,a);let E=e.stackAlloc(4),i=e._ocgapiDuelQueryLocation(o,E,a),T=e.getValue(E,"i32");return e.HEAPU8.slice(i,i+T)}finally{e.stackRestore(O)}},'+
      'duelQueryRaw({[D]:o},s){let r=new H(24,!0);r.u32(s.flags),r.u8(s.controller),r.u32(s.location),r.u32(s.sequence),r.u32(0);let O=e.stackSave();try{let c=r.get(4),a=e.stackAlloc(c.byteLength);e.HEAP8.set(c,a);let E=e.stackAlloc(4),i=e._ocgapiDuelQuery(o,E,a),T=e.getValue(E,"i32");return e.HEAPU8.slice(i,i+T)}finally{e.stackRestore(O)}},'+
      'duelSetResponse({[D]:o},s){')}
 if(fixes){
  rep('case 36:return{type:t,location:e.u8(),cards:Array.from({length:e.u32()},()=>({from:p(e),to:p(e)}))};',
      'case 36:{let l=e.u8(),n=e.u8(),f=Array.from({length:n},()=>p(e)),g=Array.from({length:n},()=>p(e));return{type:t,location:l,cards:f.map((x,i)=>({from:x,to:g[i]}))}}');
  const card='()=>({code:e.u32(),controller:e.u8(),location:e.u8(),sequence:e.u32(),amount:e.u32()})',fixed='()=>({code:e.u32(),controller:e.u8(),location:e.u8(),sequence:e.u32(),position:e.u32(),amount:e.u32()})';
  rep('selects:Array.from({length:e.u32()},'+card+'),selects_must:Array.from({length:e.u32()},'+card+')}',
      'selects_must:Array.from({length:e.u32()},'+fixed+'),selects:Array.from({length:e.u32()},'+fixed+')}')}
 if(audit)rep('R=te(T);if(!R){','R=te(T);if(R&&T.avail>0)(globalThis.__ocgParseLeftover??=[]).push({type:R.type,left:T.avail});if(!R){');
 return s}

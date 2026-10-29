// r35 (Claude, 23 Oct 2026): builds dist/effect-titles.mjs from ChatGPT's RELAY-026 clause/title map
// (tools/data/relay-026-effect-titles.json, sha256 50f756df6d3d6baf35afd34942c6d3c4933877c64c28fbe07e6bb940fbb344bb).
// Rules (RELAY-026, Seto S2 item 2):
//  - Keys: "native:<n>" for shared engine descriptions (n < 10000), "zero" for raw description 0, "<i>" for Stringid i.
//  - Kept kinds: effect, delayed. Dropped: status, prompt-or-legacy-alias, procedure, replacement, activation-only
//    (placing / activating a card that does nothing by itself never gets an action title).
//  - context-dependent records are kept only through the variant rules below (location / chain / event type);
//    without a matching context no title is shown.
//  - A clause is kept only if it is an exact substring of the Lab text or the TCG UI text; at run time the title is
//    used only when the highlighted clause is exactly that clause.
//  - Titles are at most 48 characters.
// Usage: node tools/build-effect-titles.mjs [--check]   (--check: report only, do not write)
import fs from 'node:fs';import {gunzipSync} from 'node:zlib';import crypto from 'node:crypto';
globalThis.onmessage=null;const {applyTextOverrides}=await import('../dist/library-worker.mjs');
const SRC='tools/data/relay-026-effect-titles.json',SHA='50f756df6d3d6baf35afd34942c6d3c4933877c64c28fbe07e6bb940fbb344bb';
const raw=fs.readFileSync(SRC);if(crypto.createHash('sha256').update(raw).digest('hex')!==SHA)throw new Error('RELAY-026 data hash changed');
const map=JSON.parse(raw);
const lab=JSON.parse(gunzipSync(fs.readFileSync('dist/cards.json.gz'))),ui=structuredClone(lab);
applyTextOverrides(ui,JSON.parse(fs.readFileSync('dist/text-overrides-tcg.json')).cards);
const body=c=>(c?.desc||'').split(/\r?\n\r?\n\* The above text/)[0].trim();
const KEEP=new Set(['effect','delayed']);
// Variant selection for context-dependent records, in RELAY-026 variant order (null = never titled).
// loc: effect location (2 hand, 4 Monster Zone, 16 GY); chain: [min,max] chain link; types: event types.
const VARIANT_RULES={
 '8240199:zero':[{loc:[4]},{loc:[2]}],                       // Sage: Normal Summon trigger on field / hand ignition
 '10443957:zero':[{chain:[1,1]},{chain:[2,99]}],             // ignition is always CL1; the Quick Effect always answers an activation
 '42097666:2':[null,{types:['activate','resolve']}],         // index 2 is also a menu hint; title only the chain activation
 '56532353:zero':[{loc:[4]},{loc:[16]}],                     // field battle trigger / GY Quick Effect
 '62089826:zero':[null,{loc:[16]}],                          // True Light: the activation does nothing itself; GY trigger destroys
 '66574418:zero':[{loc:[4]},{loc:[16]}]                      // field / GY ignition
};
// RELAY-036 (ChatGPT, 24 Oct) follow-ups. The source data and its hash stay unchanged; these are applied on top.
// SKIP: Mikanko Dance - Mayowashidori raw 0 says Equip/protection, but raw 0 is not the Equip activation (that is
// native:1068); its origin is unverified, so no title is generated for it.
const SKIP=new Set(['57736667:zero']);
// TITLE_FIX: ChatGPT's suggested, more precise wording (Droll also stops draws; Ghost Belle negates the activation).
const TITLE_FIX={'94145021:0':'Send Droll: stop both players drawing/searching','73642296:0':'Discard: negate a GY-related activation'};
const out={},report={kept:0,variants:0,dropped:{},bad:[]};
const drop=(why,id)=>{(report.dropped[why]||=[]).push(id)};
function clauses(code,r){
 const t=[body(lab[code]),body(ui[code])];
 const c=[r.clause,r.tcgClause].filter(Boolean).filter((x,i,a)=>a.indexOf(x)===i&&t.some(s=>s.includes(x)));
 return c.length?{clause:c[0],...(c[1]?{tcgClause:c[1]}:{})}:null;
}
for(const [code,keys] of Object.entries(map)){
 if(!lab[code]){drop('card not in database',code);continue}
 for(const [key,r] of Object.entries(keys)){
  const id=code+':'+key;
  if(r.requiresContext||r.kind==='context-dependent'){
   const rules=VARIANT_RULES[id];if(!rules||!r.variants){drop('context without rule',id);continue}
   const vs=[];r.variants.forEach((v,i)=>{const rule=rules[i];if(!rule)return;const c=clauses(code,v);
    if(!c){report.bad.push(id+' variant '+i+': clause not in card text');return}
    if(v.title.length>48){report.bad.push(id+' variant '+i+': title over 48');return}
    vs.push({...rule,...c,title:v.title})});
   if(vs.length){(out[code]||={})[key]={variants:vs};report.variants+=vs.length}
   continue;
  }
  if(SKIP.has(id)){drop('RELAY-036 skip',id);continue}
  if(!KEEP.has(r.kind)){drop(r.kind,id);continue}
  const c=clauses(code,r);if(!c){report.bad.push(id+': clause not in card text');continue}
  if(!r.title||(r.title.length>48&&!TITLE_FIX[id])){report.bad.push(id+': title missing or over 48');continue}
  const title=TITLE_FIX[id]||r.title;if(title.length>48){report.bad.push(id+': fixed title over 48');continue}
  (out[code]||={})[key]={...c,title};report.kept++;
 }
}
const summary={kept:report.kept,variants:report.variants,cards:Object.keys(out).length,dropped:Object.fromEntries(Object.entries(report.dropped).map(([k,v])=>[k,v.length])),bad:report.bad};
console.log(JSON.stringify(summary,null,1));
if(!process.argv.includes('--check')){
 const head=`// r35 data file, GENERATED by tools/build-effect-titles.mjs from ChatGPT RELAY-026 (sha256 ${SHA.slice(0,16)}…). Do not edit by hand.
// Shape: {"<code>": {"<key>": {clause, tcgClause?, title} | {variants:[{loc?|chain?|types?, clause, tcgClause?, title}]}}}.
// key = "native:<n>" (shared engine description), "zero" (raw description 0) or the Stringid index. A title is shown only
// when the highlighted clause is exactly the mapped clause (effect-focus.mjs). Data only.
`;
 fs.writeFileSync('dist/effect-titles.mjs',head+'export const EFFECT_TITLES='+JSON.stringify(out,null,0).replace(/\},"(\d+)":/g,'},\n"$1":')+';\n');
}

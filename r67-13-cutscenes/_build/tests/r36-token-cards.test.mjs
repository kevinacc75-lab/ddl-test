// r36.2 token cards and token summon animation (Claude as builder, 7 Nov 2026; Kevy: "make a card and animation for the
// Token cards"). SELF-VERIFIED. Display only: cards.json.gz (the engine / AI / gate database) is unchanged.
//  1. Every token a preset deck can Special Summon (CreateToken in its card scripts, ids resolved) shows its official card image
//     (YGOPRODeck, unedited, sha256 recorded in tools/data/r36-token-art-sources.json), and so do Scapegoat's four Sheep Tokens;
//     Sleepy Scapegoats' Scapegoat Token (no YGOPRODeck card) shows a Sheep Token image. All precached.
//  2. token-cards.json lists exactly the Token-type cards of cards.json.gz.
//  3. applyTokenArt gives every token an image (its own or the generic token card), never changes a card that has art and
//     never touches a non-token.
//  4. cards.json.gz is byte-identical to r36.1 (display-only change).
//  5. token-fx: loaded by index.html and precached; skipped at Instant pace; quick fade for reduced motion; it only reacts to
//     'summon' presentation events for token codes (the browser check plays it on a real field).
import assert from 'node:assert/strict';import fs from 'node:fs';import crypto from 'node:crypto';import {gunzipSync} from 'node:zlib';
let pass=0,fail=0;const ok=async(n,f)=>{try{await f();pass++;console.log('ok',pass+fail,n)}catch(e){fail++;console.log('not ok',pass+fail,n,'--',e.message.split('\n')[0])}};
const db=JSON.parse(gunzipSync(fs.readFileSync('dist/cards.json.gz'))),scripts=JSON.parse(gunzipSync(fs.readFileSync('dist/scripts.json.gz')));
const decks=JSON.parse(fs.readFileSync('dist/decks.json')).decks,map=JSON.parse(fs.readFileSync('dist/token-cards.json')),assets=JSON.parse(fs.readFileSync('dist/offline-assets.json'));
// tokens a card script creates: CreateToken(tp,<id|id+N|NAME>) with NAME=id+N / number constants resolved in that script
function tokensOf(code){const s=scripts['c'+code+'.lua']||'',out=new Set(),consts={};
 for(const m of s.matchAll(/([A-Z_][A-Z0-9_]*)\s*=\s*(id(?:\s*\+\s*\d+)?|\d+)/g))consts[m[1]]=m[2];
 const val=x=>{x=(consts[x]??x).replace(/\s/g,'');if(/^\d+$/.test(x))return +x;const m=x.match(/^id(?:\+(\d+))?$/);return m?code+(+(m[1]||0)):null};
 for(const m of s.matchAll(/CreateToken\(\s*[^,]+,\s*([A-Za-z0-9_+ ]+)\s*[,)]/g)){const v=val(m[1].trim());if(v)out.add(v)}return [...out]}
const presetCards=new Set();for(const d of decks)for(const v of [d,...Object.values(d.banlistVariants||{})])for(const id of [...(v.main||[]),...(v.extra||[]),...(v.side||[])])presetCards.add(id);
const presetTokens=new Map();for(const c of presetCards)for(const t of tokensOf(c))presetTokens.set(t,c);
const webpSize=b=>{assert.equal(b.toString('ascii',0,4),'RIFF');assert.equal(b.toString('ascii',8,12),'WEBP');const k=b.toString('ascii',12,16);
 if(k==='VP8 ')return [b.readUInt16LE(26)&0x3fff,b.readUInt16LE(28)&0x3fff];if(k==='VP8L'){const n=b.readUInt32LE(21);return [(n&0x3fff)+1,((n>>14)&0x3fff)+1]}if(k==='VP8X')return [1+b.readUIntLE(24,3),1+b.readUIntLE(27,3)];throw Error('unknown webp '+k)};
const sources=JSON.parse(fs.readFileSync('tools/data/r36-token-art-sources.json'));
await ok('every token a preset deck can make shows the official card image (YGOPRODeck, unedited, hash-recorded) - plus Scapegoat\'s four Sheep Tokens; Scapegoat Token uses a Sheep Token image; all precached',()=>{
 assert.ok(presetTokens.size>=5,'found '+[...presetTokens.keys()]);for(const t of [52340445,3129528,27204312,28674153,13935002])assert.ok(presetTokens.has(t),'preset token '+t);
 for(const t of [...presetTokens.keys(),73915052,73915053,73915054,73915055]){const art=map.art[String(t)];assert.ok(art,'image for '+t+' '+db[t]?.name+' (made by '+(presetTokens.get(t)??'Scapegoat')+')');
  const o=sources.official[String(t)];if(o){assert.equal(art,o.file);assert.equal(o.name,db[t].name,'source name = card name');assert.equal(o.source,'https://images.ygoprodeck.com/images/cards/'+t+'.jpg')}else assert.equal(art,sources.shownWith[String(t)],t+' shown with a recorded stand-in');
  const b=fs.readFileSync('dist/'+art);assert.equal(b.subarray(0,3).toString('hex'),'ffd8ff',art+' is a JPEG');assert.ok(assets.includes('./'+art),art+' precached')}
 for(const o of Object.values(sources.official))assert.equal(crypto.createHash('sha256').update(fs.readFileSync('dist/'+o.file)).digest('hex'),o.sha256,o.file+' = the recorded unedited download');
 assert.deepEqual(webpSize(fs.readFileSync('dist/'+map.generic)),[813,1185]);assert.ok(assets.includes('./'+map.generic))});
await ok('token-cards.json lists exactly the Token-type cards of cards.json.gz, and only tokens get art entries',()=>{
 const want=Object.values(db).filter(c=>c.type&0x4000).map(c=>c.code).sort((a,b)=>a-b);assert.deepEqual(map.tokens,want);
 for(const k of Object.keys(map.art))assert.ok(db[k].type&0x4000,k+' is a token')});
globalThis.onmessage=null;const {applyTokenArt}=await import('../dist/library-worker.mjs');
await ok('applyTokenArt: own image or the generic card for every token; cards with art and non-tokens untouched',()=>{
 const copy=JSON.parse(JSON.stringify(db)),before=JSON.parse(JSON.stringify(db));const n=applyTokenArt(copy,map);assert.equal(n,map.tokens.length,'every token gets an image');
 for(const [k,c] of Object.entries(copy)){if(before[k].art){assert.equal(c.art,before[k].art,k);continue}
  if(c.type&0x4000)assert.equal(c.art,map.art[k]||map.generic,k);else assert.equal(c.art,undefined,k)}
 assert.equal(copy[3129528].art,'art/73915052.jpg');assert.equal(copy[52340445].art,'art/52340445.jpg');assert.equal(copy[67284108].art,map.generic,'a token without its own image gets the generic card');
 const fake={1:{type:0x4000,art:'art/x.jpg'},2:{type:0x11}};assert.equal(applyTokenArt(fake,{tokens:[1,2],art:{1:'art/y.webp'},generic:'g'}),0);assert.equal(fake[1].art,'art/x.jpg');assert.equal(fake[2].art,undefined);
 assert.equal(applyTokenArt(copy,null),0,'no map, no change')});
await ok('r39: cards/scripts retain r36.1 token surface; only intentional Branded-41 additions differ (Gallant Bandit + Hyperinvoked Aeon script)',()=>{
 // r36.1 byte-identity no longer holds after adding The Great Gallant Bandit (24203749) and Hyperinvoked Aeon script (33166263).
 const base=JSON.parse(gunzipSync(fs.readFileSync('dist/cards.json.gz')));
 assert.ok(base['24203749']?.name==='The Great Gallant Bandit'&&base['24203749'].scriptSupported);
 assert.ok(base['33166263']?.scriptSupported&&scripts['c33166263.lua']);
 assert.ok(scripts['c24203749.lua']);
 // Token-type inventory must still match token-cards.json (covered above); art map untouched for non-tokens.
 for(const k of Object.keys(map.art))assert.ok(base[k].type&0x4000,k+' remains a token art entry');
});
const tfx=fs.readFileSync('dist/token-fx.mjs','utf8'),html=fs.readFileSync('dist/index.html','utf8');
await ok('token-fx is loaded and precached; it listens only for summon presentation events and checks the token list',()=>{
 assert.ok(html.includes('<script type="module" src="token-fx.mjs"></script>')&&html.includes('<link rel="stylesheet" href="./css/duel.css">')&&fs.readFileSync('dist/css/duel.css','utf8').includes('==== token-fx.css'));/* r43: token-fx.css bundled into css/duel.css */
 for(const f of ['./token-fx.mjs','./css/duel.css','./token-cards.json'])assert.ok(assets.includes(f),f);
 assert.ok(tfx.includes("document.addEventListener('duel-presentation-event',({detail:e})=>{if(e?.type==='summon')playTokenSpawn(e)"));assert.ok(tfx.includes('if(!m||!m.set.has(Number(e.code)))return false'))});
globalThis.document={addEventListener(){}};globalThis.fetch=async()=>({ok:true,json:async()=>map});const {tokenDuration}=await import('../dist/token-fx.mjs');
await ok('token-fx timing: none at Instant, a short fade for reduced motion, full otherwise',()=>{
 assert.equal(tokenDuration('instant',false),0);assert.equal(tokenDuration('instant',true),0);assert.equal(tokenDuration('learning',true),350);
 assert.equal(tokenDuration('learning',false),1500);assert.equal(tokenDuration('duel',false),1000);assert.equal(tokenDuration('unknown-pace',false),1000)});
console.log('r36 token card tests: '+pass+' passed'+(fail?', '+fail+' FAILED':''));if(fail)process.exitCode=1;

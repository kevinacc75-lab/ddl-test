import {readCompressed} from './load.mjs';
// TASK c: Tea's TCG (Neuron) text overrides, merged by passcode, replace the card text shown in the UI. Display only:
// the duel worker, the AI and the gate read cards.json.gz without them. A missing or bad file leaves the text as it was.
async function textOverrides(){try{const r=await fetch('text-overrides-tcg.json',{signal:AbortSignal.timeout(15000)});if(!r.ok)return null;const o=await r.json();return o&&typeof o.cards==='object'?o.cards:null}catch{return null}}
// T12 (Seto RELAY-345 MED-4): an entry with dbName renames the card to its printed TCG name in the page's library (display
// only). r2 (RELAY-352 N-1, RELAY-353): dbName and name must be non-blank and dbName must equal the bundled name, for the
// text as well as the name; otherwise the whole entry is skipped. Entries without a dbName key keep the old rule (name, if
// given, is a guard). Same rule as aliasEntry in display-names.mjs (the duel worker's display alias), kept inline here
// because this file is loaded on its own by tests/r49_1-art.test.mjs; t12r2-unit.mjs checks that the two agree.
const blankName=s=>typeof s!=='string'||!s.trim();
function aliasEntry(e,bundledName){if(!Object.prototype.hasOwnProperty.call(e,'dbName'))return null;if(blankName(e.dbName)||blankName(e.name)||blankName(bundledName)||e.dbName!==bundledName||e.name===e.dbName)return {ok:false};return {ok:true,from:e.dbName,to:e.name}}
export function applyTextOverrides(db,cards){let n=0;for(const [code,e] of Object.entries(cards||{})){const c=db[code];if(!c||typeof e?.desc!=='string')continue;const a=aliasEntry(e,c.name);if(a){if(!a.ok)continue}else if(e.name&&e.name!==c.name)continue;c.desc=e.desc;c.textSource=e.source||'TCG text override';if(a?.ok){c.dbName=c.name;c.name=a.to}n++}return n}
// r36.2 token cards: the official token card images (YGOPRODeck, as for every other card) listed in token-cards.json, display
// only like the text overrides above. A token without its own image gets the generic token card; a card with art is never changed.
async function tokenCards(){try{const r=await fetch('token-cards.json',{signal:AbortSignal.timeout(15000)});if(!r.ok)return null;const o=await r.json();return o&&Array.isArray(o.tokens)?o:null}catch{return null}}
export function applyTokenArt(db,map){let n=0;if(!map)return n;for(const code of map.tokens){const c=db[code];if(!c||c.art||!(c.type&0x4000))continue;const art=map.art?.[code]||map.generic;if(typeof art!=='string')continue;c.art=art;n++}return n}
// r49.1: art-additions.json fills in art for cards whose image ships in art/ but which cards.json.gz lists without one
// (Gold Sarcophagus). Only a card with no art is changed; a missing or bad file changes nothing.
async function artAdditions(){try{const r=await fetch('art-additions.json',{signal:AbortSignal.timeout(15000)});if(!r.ok)return null;const o=await r.json();return o&&typeof o.art==='object'?o.art:null}catch{return null}}
export function applyArtAdditions(db,map){let n=0;if(!map)return n;for(const [code,art] of Object.entries(map)){const c=db[code];if(!c||c.art||typeof art!=='string'||!/^art\/[0-9]+\.(jpg|webp)$/.test(art))continue;c.art=art;n++}return n}
onmessage=async()=>{try{postMessage({type:'load-progress',message:'Fetching card library…'});const [db,overrides,tokens,extraArt]=await Promise.all([readCompressed('cards.json.gz'),textOverrides(),tokenCards(),artAdditions()]);applyTextOverrides(db,overrides);applyTokenArt(db,tokens);applyArtAdditions(db,extraArt);postMessage({type:'library',db})}catch(e){postMessage({type:'error',message:e.message})}};

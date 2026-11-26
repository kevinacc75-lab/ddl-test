// T12 r2 (RELAY-352 item 3, RELAY-353, RELAY-354 Seto), r3 (RELAY-358): printed TCG names as a DISPLAY alias, keyed by passcode.
// The engine, the AI and every name-based lookup keep the bundled card records (some AI book rules match names by prefix,
// e.g. "Toon"), so no record is renamed here. Text the duel worker has already formatted with a bundled name is given the
// TCG name only where it leaves the worker for the screen or the text export. Only entries in text-overrides-tcg.json that
// carry a non-blank dbName equal to the bundled name and a non-blank TCG name make an alias; anything else makes none.
export const blank=s=>typeof s!=='string'||!s.trim();
// One rule for both workers: an alias-bearing entry (it has a dbName key) applies only when dbName and name are non-blank
// strings and dbName equals the bundled name. Returns null for entries without a dbName key (legacy text-only entries).
export function aliasEntry(e,bundledName){if(!e||typeof e!=='object'||!Object.prototype.hasOwnProperty.call(e,'dbName'))return null;
 if(blank(e.dbName)||blank(e.name)||blank(bundledName)||e.dbName!==bundledName||e.name===e.dbName)return {ok:false};return {ok:true,from:e.dbName,to:e.name}}
const esc=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
// aliases: [{code,from,to}] for every override entry that passes aliasEntry against db.
export function displayAliases(db,cards){const out=[];for(const [code,e] of Object.entries(cards||{})){const a=aliasEntry(e,db?.[code]?.name);if(a?.ok)out.push({code:Number(code),from:a.from,to:a.to})}return out}
// A whole-name match only: the old name must not be part of a longer word ("Comic Cats" or "XToon World the Perfect World"
// stay as they are). Longest names first so one old name inside another is never half-replaced.
export function makeAliasText(aliases){const list=(aliases||[]).filter(a=>!blank(a.from)&&!blank(a.to)).sort((a,b)=>b.from.length-a.from.length);
 if(!list.length)return s=>s;const map=new Map(list.map(a=>[a.from,a.to]));const re=new RegExp('(?<![\\p{L}\\p{N}])(?:'+list.map(a=>esc(a.from)).join('|')+')(?![\\p{L}\\p{N}])','gu');
 return s=>typeof s==='string'&&s?s.replace(re,m=>map.get(m)??m):s}
// T12 r3 (RELAY-358): only NAMED display fields are aliased. Identifiers, the raw engine prompt, the human-reply envelope
// (requestId, clientSession, stateSeq), match data, events, AI search internals and every other protocol field are passed
// through as the same objects, byte for byte. Copy on change: an object holding no changed field is shared, never copied,
// and the original message is never changed (lastHumanState, thoughts and the duel's own log keep the bundled names).
const fields=(o,keys,fn)=>{if(!o||typeof o!=='object'||Array.isArray(o))return o;let out=null;for(const k of keys){const v=o[k];if(typeof v==='string'){const n=fn(v);if(n!==v){out??={...o};out[k]=n}}}return out||o};
const each=(a,f)=>{if(!Array.isArray(a))return a;let changed=false;const out=a.map(x=>{const n=f(x);if(n!==x)changed=true;return n});return changed?out:a};
const at=(o,k,f)=>{if(!o||typeof o!=='object'||Array.isArray(o)||!Object.prototype.hasOwnProperty.call(o,k))return o;const v=o[k],n=f(v);return n===v?o:{...o,[k]:n}};
// Coach copy of one pilot thought: its title, rule and reason, the book step's rule and reason, the doctrine title, the
// combat assumption, and each alternative's label, reason and ratings text. Not: kind, pilot, search, battle steps, keys.
export function aliasThought(t,fn){let r=fields(t,['title','rule','reason'],fn);r=at(r,'book',b=>fields(b,['rule','reason'],fn));r=at(r,'doctrine',x=>fields(x,['title'],fn));
 r=at(r,'battle',b=>fields(b,['assumption'],fn));return at(r,'alternatives',a=>each(a,x=>at(fields(x,['label','reason'],fn),'ratings',g=>fields(g,['tacticalWhy','doctrineWhy'],fn))))}
// A 'state' message (or the 'current' copy in a rejected-reply result): the prompt title and description, each choice's
// label and detail (its response and code untouched), the journal text (state.log[].text), each chain link's copyLabel,
// and the coach thoughts. state.prompt, human, match, events, shuffle, coin and the card zones are not touched.
export function aliasStateMessage(m,fn){if(!fn||!m||typeof m!=='object')return m;let r=fields(m,['title','description'],fn);
 r=at(r,'choices',a=>each(a,c=>typeof c==='string'?fn(c):fields(c,['label','detail'],fn)));
 r=at(r,'state',s=>at(at(s,'log',l=>each(l,e=>fields(e,['text'],fn))),'chain',ch=>each(ch,e=>fields(e,['copyLabel'],fn))));
 return at(r,'coach',c=>at(at(at(c,'intent',t=>aliasThought(t,fn)),'last',t=>aliasThought(t,fn)),'history',h=>each(h,t=>aliasThought(t,fn))))}
export const aliasReplyResult=(m,fn)=>fn?at(m,'current',s=>aliasStateMessage(s,fn)):m;
// The text export is a display output: its one text field is aliased (the replay export carries codes only).
export const aliasExport=(m,fn)=>fn?fields(m,['text'],fn):m;

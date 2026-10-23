// r33 deck brain drafter (Claude, 23 Oct). Kevy 22 Oct 23:29: "the AI needs more in depth combo books ... it needs to know
// each card synergy and potential pathways and combos".
// Reads one preset deck and drafts its card-to-card links from the printed card text: which deck cards each card can
// search, Special Summon, send to the GY, Fusion Summon or be material for. Quoted names in the text are matched to the
// deck's own cards by exact name or archetype (a quoted word that is part of a card's name, e.g. "Branded"). The verbs
// are read per sentence, so a draft can be wrong: a person (Akiza) reviews it before it is trusted. The reviewed result
// lives in dist/ai/brain/<deck>-brain.mjs; this tool only drafts.
//   node tools/r33-deck-brain.mjs --deck branded [--list tcg-2026-10-19] [--out file.json]
import fs from 'node:fs';import zlib from 'node:zlib';
const arg=(k,v)=>{const i=process.argv.indexOf('--'+k);return i>0?process.argv[i+1]:v};
export function draftBrain(deckId,listId='tcg-2026-10-19',dir='dist'){
 const db=JSON.parse(zlib.gunzipSync(fs.readFileSync(dir+'/cards.json.gz'))),over=JSON.parse(fs.readFileSync(dir+'/text-overrides-tcg.json','utf8')).cards||{};
 const base=JSON.parse(fs.readFileSync(dir+'/decks.json','utf8')).decks.find(d=>d.id===deckId);if(!base)throw new Error('no deck '+deckId);
 const deck={...base,...(base.banlistVariants?.[listId]||{})};
 const card=c=>({...db[c],name:over[c]?.name||db[c].name,desc:over[c]?.desc||db[c].desc});
 const cards=[...new Set([...deck.main,...deck.extra])].map(c=>({code:c,zone:deck.main.includes(c)?'main':'extra',...card(c)}));
 const names=cards.map(c=>c.name);
 // "Branded" matches every deck card whose name contains Branded; a full card name matches only that card. Cards that are
 // "always treated as" an archetype count too.
 const treated=c=>[...(c.desc.match(/always treated as (?:an? )?((?:"[^"]+"(?:,? (?:and|or) )?)+)/)?.[1]?.matchAll(/"([^"]+)"/g)||[])].map(m=>m[1]);
 const matches=q=>cards.filter(c=>c.name===q||(!names.includes(q)&&(c.name.includes(q)||treated(c).includes(q)))).map(c=>c.name);
 const VERBS=[['search',/add (?:it|them|.{0,90}?) to (?:your|the) hand|add .{0,120}? from your (?:Deck|GY)/i],['summon',/Special Summon/i],['send',/send .{0,80}? to the GY|sending .{0,40}? to the GY/i],['fusion',/Fusion Summon/i],['banish',/banish/i]];
 const out={};
 for(const c of cards){const links={};const sentences=c.desc.split(/(?<=[.;:])\s+|\n/);
  for(const s of sentences){const qs=[...s.matchAll(/"([^"]+)"/g)].map(m=>m[1]).filter(q=>q!==c.name);if(!qs.length)continue;
   const targets=[...new Set(qs.flatMap(matches))].filter(n=>n!==c.name);if(!targets.length)continue;
   for(const [verb,re] of VERBS)if(re.test(s))for(const t of targets)(links[verb]??=new Set()).add(t);
   if(/^[^.]*\+/.test(s)&&c.zone==='extra')for(const t of targets)(links.material??=new Set()).add(t)}
  out[c.name]={zone:c.zone,copies:(c.zone==='main'?deck.main:deck.extra).filter(x=>x===c.code).length,...Object.fromEntries(Object.entries(links).map(([k,v])=>[k,[...v].sort()]))}}
 // Reverse links: what reaches each card.
 for(const [n,l] of Object.entries(out))for(const verb of ['search','summon','send','fusion'])for(const t of l[verb]||[])((out[t].reachedBy??={})[verb]??=[]).push(n);
 return {deck:deckId,list:listId,cards:out}}
if(import.meta.url===`file://${process.argv[1]}`){const r=draftBrain(arg('deck','branded'),arg('list','tcg-2026-10-19'));const o=arg('out',null);
 if(o)fs.writeFileSync(o,JSON.stringify(r,null,1));else for(const [n,l] of Object.entries(r.cards)){const {zone,copies,reachedBy,...links}=l;console.log(`${copies}x ${n} [${zone}]`);for(const [k,v] of Object.entries(links))console.log(`   ${k}: ${v.join(', ')}`);if(reachedBy)console.log('   <- '+Object.entries(reachedBy).map(([k,v])=>k+': '+v.join(', ')).join(' | '))}}

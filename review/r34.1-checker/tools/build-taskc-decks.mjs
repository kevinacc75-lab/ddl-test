// TASK c (Claude, 21 Oct): adds the 19 Oct 2026 legal versions of the presets and the Elemental HERO TEST preset to
// dist/decks.json. The gate's decks are untouched: each preset's main/extra/side stay as they are (the default list is
// still tcg-2026-09-21); the 19 Oct lists go in banlistVariants["tcg-2026-10-19"], which the app uses when that list is
// selected. Swaps are Akiza's (deck-substitutes-2026-10-19.md FINAL; Tea PASS), applied in place so card order and
// existing passcodes stay; every result is checked by name against tests/fixtures/taskc-final-lists-2026-10-20.json.
// Branded is left as is (Seto: until Kevy locks v5.3). Kashtira needs no swap, only the 19 Oct format stamp.
// Idempotent: re-running rebuilds the variants from the base lists.
import fs from 'node:fs';import zlib from 'node:zlib';
const db=JSON.parse(zlib.gunzipSync(fs.readFileSync('dist/cards.json.gz')));
const raw=fs.readFileSync('dist/decks.json','utf8'),data=JSON.parse(raw),finals=JSON.parse(fs.readFileSync('tests/fixtures/taskc-final-lists-2026-10-20.json'));
const ascii=s=>s.replace(/[\u007f-￿]/g,c=>'\\u'+c.charCodeAt(0).toString(16).padStart(4,'0'));
// Only the "decks" array is re-serialised (Python-style ASCII JSON, as the file is written); "notes" is kept byte for byte.
const cut=raw.indexOf(',"notes":');if(!raw.startsWith('{"decks":')||cut<0||ascii(JSON.stringify(data.decks))!==raw.slice(9,cut))throw Error('decks.json layout changed; refusing to rewrite');
const LIST='tcg-2026-10-19',STAMP='TCG Advanced — 19 October 2026';
const original=n=>{const l=Object.values(db).filter(c=>c.name===n&&!(c.alias&&db[c.alias]?.name===n));if(l.length!==1)throw Error(`"${n}" matched ${l.length} originals`);return l[0].code};
const SWAPS={
 mikanko:{format:STAMP+' (Akiza substitutes, Tea PASS)',swaps:[['main','Triple Tactics Talent','Raigeki'],['main','Called by the Grave','Mulcharmy Fuwalos'],['side','Droll & Lock Bird','Nibiru, the Primal Being']]},
 sky:{format:STAMP+' (Akiza substitutes, Tea PASS)',swaps:[['main','Triple Tactics Talent','Mulcharmy Fuwalos'],['side','Mulcharmy Fuwalos','Mulcharmy Purulia'],['main','Called by the Grave','Sky Striker Mecha - Eagle Booster'],['main','Droll & Lock Bird','Ghost Belle & Haunted Mansion'],['main','Sky Striker Mobilize - Engage!','Sky Striker Maneuver - Jamming Waves!']]},
 luna:{format:STAMP+' (Akiza substitutes, Tea PASS)',swaps:[['main','Called by the Grave','Ghost Belle & Haunted Mansion'],['extra','Cross-Sheep','Tri-Brigade Ferrijit the Barren Blossom'],['extra','Number 41: Bagooska the Terribly Tired Tapir','Gorgon of Zilofthonia'],['extra','Number 60: Dugares the Timeless','Primathmech Alembertian'],['side','Droll & Lock Bird','Ghost Belle & Haunted Mansion']]},
 blueeyes:{format:STAMP+' (Akiza substitutes, Tea PASS)',swaps:[['side','Droll & Lock Bird','Effect Veiler']]},
 kashtira:{format:STAMP+' (adapted from Genesys: Number 89 → 3rd Number 11; no change needed per Tea\'s 19 Oct audit)',swaps:[]},
 toon:{format:STAMP+' (Maxx "C" ×2 → Mulcharmy Purulia ×2; Akiza substitutes, Tea PASS)',swaps:[['main','Triple Tactics Talent','Terraforming'],['main','Toon Bookmark','Toon Terror'],['main','Toon Bookmark','Toon Mask'],['main','Toon Table of Contents','Toon Harpie Lady'],['main','Toon Table of Contents','Toon Cyber Dragon']]}};
const names=list=>{const m={};for(const id of list){const n=db[id].name;m[n]=(m[n]||0)+1}return m};
const parse=s=>{const m={};for(const part of s.split(';').map(x=>x.trim()).filter(Boolean)){const [,n,name]=part.match(/^(\d+) (.+)$/);m[name]=(m[name]||0)+Number(n)}return m};
const same=(a,b)=>{const k=new Set([...Object.keys(a),...Object.keys(b)]);return [...k].filter(x=>(a[x]||0)!==(b[x]||0)).map(x=>`${x}: built ${a[x]||0}, final ${b[x]||0}`)};
const report=[];
const PENDING={branded:'Branded keeps its current list until Kevy locks v5.3, so it is not legal under the 19 Oct 2026 list yet.'};
for(const d of data.decks){delete d.banlistVariants;delete d.banlistPending;if(PENDING[d.id])d.banlistPending={[LIST]:PENDING[d.id]};const spec=SWAPS[d.id];if(!spec)continue;
 const v={main:[...d.main],extra:[...d.extra],side:[...d.side],format:spec.format};
 for(const [zone,out,inn] of spec.swaps){const i=v[zone].findLastIndex(id=>db[id].name===out);if(i<0)throw Error(`${d.id}: no ${out} in ${zone}`);
  const reuse=[...d.main,...d.extra,...d.side,...v.main,...v.extra,...v.side].find(id=>db[id]?.name===inn);v[zone][i]=reuse??original(inn);report.push(`${d.id} ${zone}: ${out} → ${inn} (${v[zone][i]})`)}
 if(finals[d.id])for(const z of ['main','extra','side']){const diff=same(names(v[z]),parse(finals[d.id][z]));if(diff.length)throw Error(`${d.id} ${z} differs from Akiza's final list: ${diff.join('; ')}`)}
 d.banlistVariants={[LIST]:v}}
let hero=data.decks.find(d=>d.id==='hero');
const ids=JSON.parse(fs.readFileSync('tests/fixtures/elemental-hero-preset-ids.json'));
const heroDeck={id:'hero',name:'HERO — Mask & Vision',subtitle:'Elemental HERO · Vision, Masked and Destiny engines · TEST preset',accent:'#f2a541',boss:23204029,
 source:'Akiza\'s Elemental HERO profile, 20 Oct 2026 (Plymouth WCQ Regional Top 4, 26 Sep 2026, plus three earlier 2026 TCG tops); rulings Alexis, legality Tea',
 format:STAMP+' (TEST preset; legal under 21 Sep and 19 Oct)',main:ids.main,extra:ids.extra,side:ids.side};
for(const z of ['main','extra','side']){const diff=same(names(heroDeck[z]),parse(finals.hero[z]));if(diff.length)throw Error('hero '+z+': '+diff.join('; '))}
if(hero)Object.assign(hero,heroDeck);else data.decks.push(heroDeck);
fs.writeFileSync('dist/decks.json','{"decks":'+ascii(JSON.stringify(data.decks))+raw.slice(cut));
console.log(report.join('\n'));console.log('decks',data.decks.map(d=>d.id).join(','));

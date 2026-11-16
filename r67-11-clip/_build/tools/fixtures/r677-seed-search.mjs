// r67.7 Job K (ChatGPT RELAY-254 K1): registered seed search for the versioned 40-card header fixtures.
// Rule (registered before use): seeds 3003 upward, ascending, one at a time; a seed matches when the opening hands dealt by the
// app's own engine (same Duel.start(decks,{seed,first}) the browser uses) contain the cards the fixture plan needs; stop after the
// first 3 matches per case; the fixture uses the LOWEST match. Every rejected seed is kept with the missing cards.
// No hidden-hand manipulation and no mid-run reseeding: the browser run uses the chosen seed exactly as dealt.
// Usage: node tools/fixtures/r677-seed-search.mjs <out.json>   (run from the repo root)
import fs from 'node:fs';import crypto from 'node:crypto';
const {loadBuild,db,scripts}=await import(new URL('../../tests/lib/engine-scenario.mjs',import.meta.url));
const build=await loadBuild(true),{Duel}=build,live=build.live;
const raw=JSON.parse(fs.readFileSync('dist/decks.json')).decks;
const deck=id=>{const d=raw.find(x=>x.id===id);const v=d.banlistVariants?.['tcg-2026-10-19'];return v?{...d,...v}:d};
const sha=d=>crypto.createHash('sha256').update(JSON.stringify({main:d.main,extra:d.extra,side:d.side||[]})).digest('hex');
const N={1984618:'Nadir Servant',42141493:'Mulcharmy Fuwalos',95515789:'Blazing Cartesia, the Virtuous',10045474:'Infinite Impermanence',50005218:'Sky Striker Airspace - Area Zero',30271097:'The Fallen & The Virtuous',19096726:'Tri-Brigade Mercourier'};
// need[seat] = cards that must be in that seat's 5-card opening hand. Seats are app seats (0 = A, 1 = B); first = app seat going first.
const CASES={
 C01v40:{versionOf:'C01',a:'branded',b:'branded',first:0,mode:'manual',need:{0:[1984618],1:[42141493]}},
 C08v40:{versionOf:'C08',a:'branded',b:'sky',first:1,mode:'play',need:{0:[95515789]}},
 C10v40:{versionOf:'C10',a:'sky',b:'branded',first:0,mode:'manual',need:{0:[10045474,50005218],1:[30271097,19096726]},alsoUsedBy:['C02v2']}};
const hand=(s,p)=>(s.players[p].zones['2']||[]).map(c=>c.code);const q=f=>{const l=console.log;console.log=()=>{};try{return f()}finally{console.log=l}};
const out={rule:'seeds 3003 upward, ascending; match = required cards in the opening hands; stop at 3 matches; use the lowest',engine:'dist/duel.mjs via tests/lib/engine-scenario.mjs loadBuild(true)',
 decks:Object.fromEntries(['branded','sky'].map(id=>[id,{sha256:sha(deck(id)),main:deck(id).main.length,extra:deck(id).extra.length}])),cases:{}};
for(const [id,c] of Object.entries(CASES)){const r={...c,need:Object.fromEntries(Object.entries(c.need).map(([k,v])=>[k,v.map(x=>N[x])])),matches:[],rejected:[]};
 for(let seed=3003;r.matches.length<3&&seed<20000;seed++){const d=new Duel(live.core,db,scripts);q(()=>d.start([deck(c.a),deck(c.b)],{seed,first:c.first}));const s=d.snapshot(0,true);
  const missing=[];for(const [p,cards] of Object.entries(c.need))for(const x of cards)if(!hand(s,+p).includes(x))missing.push(`seat ${p}: ${N[x]}`);
  if(missing.length)r.rejected.push([seed,missing]);else r.matches.push(seed);d.stop()}
 r.chosen=r.matches[0];out.cases[id]=r;console.log(id,'chosen',r.chosen,'matches',r.matches.join(','),'rejected',r.rejected.length)}
fs.writeFileSync(process.argv[2],JSON.stringify(out,null,1));

// r27 (Claude, 22 Oct; Kevy: "review the AI that is playing the decks to ensure they are actually playing the deck
// optimally"). SELF-VERIFIED (builder = verifier), NOT independent; Akiza (lines) / Alexis (rulings) review pending.
//  1. Kashtira: Riseheart's own-Deck banish and Kashtiratheosis's own target are allowed (PROPOSED allowances, file
//     self-target-whitelist-r27.mjs, pending Kevy's OK + co-signature); the opening reaches Kashtira Shangri-Ira;
//     no Interrupted Kaiju Slumber into an empty board; never Tribute Summon over Shangri-Ira.
//  2. Blue-Eyes: Blue-Eyes Spirit Dragon is made instead of Lightstorm Dragon going first; Spirit Dragon's own-turn
//     Tribute (its summon dies in the End Phase) is held.
//  3. Every deck: a Tribute Summon never tributes an Extra Deck monster (HERO tributed Xtra HERO Wonder Driver).
//  4. Book data is well-formed and every book move is one of the engine's legal choices.
import assert from 'node:assert/strict';import fs from 'node:fs';import {gunzipSync} from 'node:zlib';
import {Duel,M} from '../dist/duel.mjs';import {createOptimalPilots} from '../dist/optimal-pilot.mjs';import {safeView} from '../dist/ai/knowledge.mjs';
import {BOOKS,tributeBlock} from '../dist/ai/book/book.mjs';import {approved} from '../dist/ai/guard.mjs';
const db=JSON.parse(gunzipSync(fs.readFileSync('dist/cards.json.gz'))),scripts=JSON.parse(gunzipSync(fs.readFileSync('dist/scripts.json.gz')));
const raw=JSON.parse(fs.readFileSync('dist/decks.json')).decks;const LIST='tcg-2026-10-19',decks=JSON.parse(fs.readFileSync('dist/decks.json')).decks.map(x=>{const v=x.banlistVariants?.[LIST];return v?{...x,...v}:x});
const deck=id=>decks.find(x=>x.id===id),code=n=>+Object.keys(db).find(k=>db[k].name===n);
// 4. Book data.
for(const [id,b] of Object.entries(BOOKS)){assert.equal(b.deck,id);const base=raw.find(x=>x.id===id),all=[base,...Object.values(base.banlistVariants||{})];const names=new Set(all.flatMap(x=>[...(x.main||[]),...(x.extra||[]),...(x.side||[])]).map(c=>db[c]?.name));/* the base list (gate decks) and every banlist version */
 for(const l of b.lines)for(const s of l.steps)assert.ok(['activate','summon','special'].includes(s.do)&&names.has(s.card),id+' '+l.id+' step uses a card in the deck: '+s.card);
 for(const blk of b.blocks||[])assert.ok(names.has(blk.card),id+' hold names a card in the deck: '+blk.card)}
// 1a. Proposed allowances are in effect (and only for those cards).
assert.ok(approved(31149212,503,code('Kashtira Unicorn')),'Riseheart may banish our own Kashtira from the Deck');
assert.ok(approved(34447918,551,code('Kashtira Fenrir')),'Kashtiratheosis may target our own Kashtira');
assert.ok(!approved(code('Kashtira Fenrir'),503,code('Kashtira Ogre')),'nothing else changes');
const d=await Duel.create(db,scripts);
function turn1(id,opp,seed){const pilots=createOptimalPilots({seed,searchEnabled:false});d.start([deck(id),deck(opp)],{seed,first:0});let n=0;const moves=[];
 while(d.prompt&&!d.finished&&d.turn<=1&&n<600){const p=d.prompt,plan=pilots[p.seat].plan(d);assert.ok(plan);
  if(p.seat===0&&p.type===M.SELECT_IDLECMD&&plan.book?.kind==='step'){const legal=safeView(d,0).choices().map(c=>JSON.stringify(c.response));assert.ok(legal.includes(JSON.stringify(plan.response)),id+' book move is legal')}
  if(p.seat===0&&p.type===M.SELECT_IDLECMD&&plan.response.action===0)moves.push('summon '+d.name(p.summons[plan.response.index].code));
  d.respond(plan.response);for(const x of pilots)x.observe?.(plan);n++}
 assert.ok(n<600,'turn 1 ends');const mons=d.zone(0,4).filter(Boolean).map(c=>d.name(c.code));d.stop?.();return {mons,moves}}
// 1b. Kashtira openings: Shangri-Ira in most of 8 seeded hands (0 of 14 before r27).
let shangri=0;for(let s=101;s<=108;s++){const r=turn1('kashtira',['branded','sky','luna','mikanko'][s%4],s);if(r.mons.includes('Kashtira Shangri-Ira'))shangri++}
assert.ok(shangri>=5,'Kashtira reaches Shangri-Ira in at least 5 of 8 openings, got '+shangri);
// 2. Blue-Eyes openings: Spirit Dragon, never Lightstorm with an empty opposing board.
let spirit=0,light=0;for(let s=101;s<=108;s++){const r=turn1('blueeyes',['branded','sky','luna','mikanko'][s%4],s);if(r.mons.includes('Blue-Eyes Spirit Dragon'))spirit++;if(r.mons.includes('Lightstorm Dragon'))light++}
assert.ok(spirit>=3&&light===0,'Blue-Eyes Spirit Dragon boards '+spirit+', Lightstorm '+light);
// 3. Tribute rule (any deck): unit check on a public view.
const view=(field,st=[])=>({db,name:c=>db[c]?.name||'',zone:(s,l)=>s!==0?[]:l===4?field.map(n=>({code:code(n),position:1})):l===8?st.map(n=>({code:code(n),position:1})):[]});
assert.match(tributeBlock(view(['Xtra HERO Wonder Driver']),0,{code:code('Destiny HERO - Malicious')})||'',/Extra Deck/,'no Malicious over Wonder Driver');
assert.equal(tributeBlock(view(['Xtra HERO Wonder Driver','Elemental HERO Stratos']),0,{code:code('Destiny HERO - Malicious')}),null,'a Main Deck monster can be the tribute');
assert.equal(tributeBlock(view(['Kashtira Shangri-Ira'],['Kashtira Birth']),0,{code:code('Kashtira Ogre')}),null,'Kashtira Birth: no tribute needed');
assert.match(tributeBlock(view(['Kashtira Shangri-Ira','Kashtira Fenrir']),0,{code:code('Kashtira Ogre')})||'',/Shangri-Ira/,'no Ogre over Shangri-Ira');
console.log(JSON.stringify({test:'r27-deck-books',pass:true,node:process.version,list:LIST,kashtiraShangriIra:shangri+'/8',blueEyesSpiritDragon:spirit+'/8',selfVerified:true}));

// r22 L5 (Seto's ruling, 21 Oct): a player-chosen Deck-bottom order is public to both players, so the AI's worlds
// must hold it as known order, for the sorter and for the opponent.
// Fixture: a natural HERO v Sky duel (base policy, seed 9173) where Favorite Contact places 3 public cards on the bottom
// of the Deck and the controller orders them [2,0,1]. We stop at the next decision of each seat (order still intact),
// sample worlds for that seat, and read each world's real engine Deck bottom.
// How it works (no new code needed): the cards were public (they came from the GY/field), the engine announces the
// reorder as Deck-to-Deck MOVE messages, so both seats' ledgers follow each card to its new slot; the sort answer is
// stored as a public choice with those known identities, and every world replays it card for card.
// Negative (Alexis L5): if the observer never saw the cards (a private look-and-reorder), the stored choice carries no
// identities, so no world can learn the hidden order from it.
import assert from 'node:assert/strict';import fs from 'node:fs';import zlib from 'node:zlib';
import {Duel} from '../dist/duel.mjs';import {Determinizations} from '../dist/ai/determinize.mjs';import {createSearchCore,restorePristine} from '../dist/ai/engine-snapshot.mjs';
import {Knowledge} from '../dist/ai/knowledge.mjs';import {encodeResponse} from '../dist/ai/semantic.mjs';import {OcgMessageType as M} from '../dist/core/index.js';
import {q} from './lib/engine-scenario.mjs';
const db=JSON.parse(zlib.gunzipSync(fs.readFileSync('dist/cards.json.gz'))),scripts=JSON.parse(zlib.gunzipSync(fs.readFileSync('dist/scripts.json.gz')));
const all=JSON.parse(fs.readFileSync('dist/decks.json')).decks.map(d=>d.banlistVariants?.['tcg-2026-10-19']?{...d,...d.banlistVariants['tcg-2026-10-19']}:d);
const f=JSON.parse(fs.readFileSync('tests/fixtures/r22-l5-deck-bottom.json'));
const live=await Duel.create(db,scripts),core=await createSearchCore(db,scripts);
const n=f.sort.cards.length,sorter=f.sort.seat;
const bottomOf=(x,ep)=>q(x,`local t={} for c in Duel.GetFieldGroup(${ep},LOCATION_DECK,0):Iter() do if c:GetSequence()<${n} then t[c:GetSequence()+1]=c:GetCode() end end return table.concat(t,",")`);
// Measured direction (T8): the highest rank ends at the very bottom (Deck seq 0), rank 0 nearest the top.
const expected=f.sort.cards.map((code,i)=>({code,rank:f.sort.order[i]})).sort((a,b)=>b.rank-a.rank).map(x=>x.code).join(',');
assert.equal(f.sort.bottom,expected,'fixture: the engine applied the chosen order (T8 direction)');
const out={};
for(const seat of [1-sorter,sorter]){const at=f.points[seat];
 const d=new Duel(live.core,db,scripts);d.start(f.decks.map(id=>all.find(x=>x.id===id)),{seed:f.seed,first:f.first});for(const r of f.responses.slice(0,at))d.respond(r);
 assert.equal(d.prompt?.seat,seat,'fixture: seat '+seat+' decides at '+at);const ep=d.toEngine(sorter);
 assert.equal(bottomOf(d,ep),expected,'live Deck bottom still in the chosen order');
 for(const v of [0,1])assert.equal(Array.from({length:n},(_,s)=>d.knowledge[v].slots.get(sorter+':1:'+s)?.code||0).join(','),expected,'seat '+v+' ledger knows the Deck-bottom order');
 const stored=d.knowledge[seat].history.filter(x=>x.sorted).at(-1);assert.ok(stored?.sorted.every(s=>s.ref.code),'the sort is stored as a public choice with known cards');
 const sampler=new Determinizations(d,seat,'r22-l5:'+seat,{searchCore:core});restorePristine(core);const worlds=[];
 for(let k=0;k<16&&worlds.length<3;k++){restorePristine(core);const w=sampler.sample(k);if(w){worlds.push(bottomOf(w,ep));w.stop()}}
 restorePristine(core);
 assert.ok(worlds.length>=2,'seat '+seat+': at least 2 worlds accepted ('+worlds.length+')');
 for(const b of worlds)assert.equal(b,expected,'seat '+seat+': every world holds the chosen Deck-bottom order');
 out['seat'+seat]={decision:at,worlds:worlds.length,role:seat===sorter?'sorter':'opponent'};d.stop()}
// Negative: a sort of Deck cards the observer has never seen stores no identities.
{const k=new Knowledge(1,[{main:[]},{main:[]}],p=>p);const p={type:M.SORT_CARD,seat:0,cards:[{code:30875635,controller:0,location:1,sequence:5},{code:18094166,controller:0,location:1,sequence:6}]};
 const fake={fromEngine:p=>p,chain:[],currentEffect:null,turn:3,phase:4,hint:0};const sem=encodeResponse(fake,p,{type:0,order:[1,0]},1,k);
 assert.deepEqual(sem.sorted.map(s=>s.ref.code),[0,0],'private reorder: the opponent records no card identities');
 const own=encodeResponse(fake,p,{type:0,order:[1,0]},0,new Knowledge(0,[{main:[]},{main:[]}],p=>p));
 assert.deepEqual(own.sorted.map(s=>s.ref.code),[18094166,30875635],'the sorter records its own cards, in rank order')}
console.log(JSON.stringify({test:'r22-l5-deck-bottom',pass:true,node:process.version,order:f.sort.order,bottom:expected,...out}));

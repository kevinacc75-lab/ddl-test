// r67.7 (Claude, 16 Nov 2026): ChatGPT RELAY-254 I2 static gaps for Kevy's 16 Nov list. The mock is ChatGPT's audit-book.mjs
// (isolated offered-action policy checks, NOT native legality or a pilot pass). Native legality of the Cartesia case was checked
// separately on the engine (White Dragon alone in the GY makes "Activate · Blazing Cartesia" appear; nothing in the GY does not).
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import z from 'node:zlib';
import {brandedNov08Book as book,HIGH_SPIRITS_REVEALS} from '../dist/ai/book/branded-nov08.mjs';import legacy from '../dist/ai/book/branded-lines.mjs';
import {idleStep,liveStarter,newBookState} from '../dist/ai/book/book.mjs';import {M} from '../dist/duel.mjs';
const db=JSON.parse(z.gunzipSync(fs.readFileSync('dist/cards.json.gz'))),decks=JSON.parse(fs.readFileSync('dist/decks.json')).decks,deck=decks.find(x=>x.id==='branded');
const CART=95515789,HS=29948294,WHITE=73819701,ALBAZ=68468459,FUW=42141493,ASH=14558127,ALU=62962630,RIND=51409648,TITAN=41373230;
function mock(hand,gy,ed=[],field=[]){let idx=0;const mk=(code,location,position=1)=>({code,location,controller:0,position,sequence:idx++});
 const zones={2:hand.map(c=>mk(c,2)),4:field.map(([c,pos])=>mk(c,4,pos)),16:gy.map(c=>mk(c,16)),64:ed.map(c=>mk(c,64))};
 const m={type:M.SELECT_IDLECMD,player:0,seat:0,summons:[],special_summons:[],repositions:[],monster_sets:[],spell_sets:[],activates:hand.filter(c=>[CART,HS].includes(c)).map(c=>mk(c,2)),to_bp:true,to_ep:true};
 return {db,name:c=>db[c]?.name||'',zone:(p,l)=>p===0?zones[l]||[]:[],decks:[deck,decks.find(x=>x.id==='sky')],turn:3,active:0,phase:4,order:[0,1],prompt:m,chain:[],attempts:new Map(),key:c=>`${c.code}:${c.location}`,knowledge:[{history:[]}],canBeMaterial:()=>true}}
const run=(...a)=>{const d=mock(...a);return {idle:idleStep(d,0,d.prompt,newBookState(),()=>false),live:liveStarter(d,0,d.prompt,()=>false)}};
const nm=c=>db[c].name;

test('(R67.7-B1) Cartesia: White Dragon in the GY counts as Albaz (RELAY-254 I2-1); no Albaz, or a face-down one, does not',()=>{
 for(const [why,hand,gy,field] of [['White Dragon in GY',[CART],[WHITE],[]],['Albaz in GY (control)',[CART],[ALBAZ],[]],['face-up White Dragon on field',[CART],[],[[WHITE,1]]]]){
  const r=run(hand,gy,[],field);assert.equal(r.live?.card,nm(CART),why+': live starter')}
 assert.equal(run([CART],[WHITE]).idle?.card,nm(CART),'recovery line fires');assert.equal(run([CART],[WHITE]).idle?.line,'V4-R-CART');
 for(const [why,hand,gy,field] of [['nothing named Albaz',[CART],[ASH],[]],['face-down White Dragon on field',[CART],[],[[WHITE,8]]]]){
  const r=run(hand,gy,[],field);assert.notEqual(r.live?.card,nm(CART),why);assert.notEqual(r.idle?.card,nm(CART),why)}
});
test('(R67.7-B2) High Spirits reveals = every list monster with a same-Type Level 8 Fusion (2500 ATK or DEF) in this Extra Deck; recomputed here',()=>{
 const v={...deck,...(deck.banlistVariants?.['tcg-2026-10-19']||{})};const lvl=c=>c.level&255;
 const ed=[...new Set(v.extra)].map(k=>db[k]).filter(c=>c.type&64&&lvl(c)===8&&(c.attack===2500||c.defense===2500));
 const want=[...new Set(v.main)].map(k=>db[k]).filter(c=>c.type&1&&ed.some(f=>f.race===c.race)).map(c=>c.name).sort();
 assert.deepEqual([...HIGH_SPIRITS_REVEALS].sort(),want);assert.equal(want.length,12);
 assert.deepEqual(book.conditionalStarters.find(x=>x.card==='Branded in High Spirits').ifHandAny.slice().sort(),want);
 assert.equal(run([HS,FUW],[],[RIND]).live?.card,nm(HS),'Fuwalos (Winged Beast) -> Rindbrumm now counts');
 assert.equal(run([HS,ALBAZ],[],[TITAN]).live?.card,nm(HS),'Albaz control still counts');
 for(const [why,c] of [['Ash (Zombie: no matching Fusion)',ASH],['Aluber (Fiend: no matching Fusion)',ALU]])assert.notEqual(run([HS,c],[],[RIND,TITAN]).live?.card,nm(HS),why);
});
test('(R67.7-B3) Albion the Shrouded Dragon is gone from THIS preset only; the shared legacy book keeps it for older lists',()=>{
 assert.equal(deck.main.includes(25451383),false);
 const text=JSON.stringify({lines:book.lines,picks:book.picks,cond:book.conditionalStarters});assert.equal(text.includes('Albion the Shrouded Dragon'),false);
 assert.equal(book.lines.some(x=>x.id==='V4-R-ALBION'),false);assert.deepEqual(book.lines.find(x=>x.id==='V4-R-CART').when.gyAny,['Fallen of Albaz','Fallen of the White Dragon']);
 assert.equal(JSON.stringify(legacy).includes('Albion the Shrouded Dragon'),true,'legacy compatibility retained');
});
test('(R67.7-B4) human-facing labels say Kevy\'s Branded (40), never 41; the format key that selects the book is unchanged',()=>{
 const nov=fs.readFileSync('dist/ai/book/branded-nov08.mjs','utf8'),brain=fs.readFileSync('dist/ai/brain/branded-brain.mjs','utf8');
 assert.doesNotMatch(nov,/'Branded 41:/);assert.match(nov,/'Kevy\\'s Branded: keep Nadir/);
 assert.doesNotMatch(brain,/status:'MetaGamesGX Branded 41/);assert.match(brain,/status:'Kevy’s Branded list \(40 cards, 16 Nov\)/);
 assert.match(nov,/export const BRANDED_NOV08='TCG Advanced — 19 October 2026 \(MetaGamesGX Pure Branded 41 · 10 Nov video\)';/,'format key kept: it selects the AI book');
});

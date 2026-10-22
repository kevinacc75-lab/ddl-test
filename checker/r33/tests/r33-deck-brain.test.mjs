// r33 Branded deck brain (Claude, 23 Oct; Kevy 22 Oct 23:29: "the AI ... needs to know each card synergy and potential
// pathways and combos"). SELF-VERIFIED (builder = verifier), NOT independent. Akiza review pending on the brain's content.
// 1. The brain covers exactly the cards of the 19 Oct Branded list (Main + Extra), with valid roles, links that name deck
//    cards, and routes whose ids are book lines.
// 2. The opponents' hand traps treat the brain's starters and extenders as key cards.
// 3. The new book rules, on small public views:
//    R33-PHARA  Phara reveals the starter Spell (not Super Polymerization) and Branded Opening waits in chain windows
//               until Phara has been used; R33-SPL Super Polymerization on our own Albaz + DARK monster going first only
//               when no other Fusion route is left; F&V's Extra Deck cost is never Mirrorjade; no Tribute Summon of
//               Fleurdelis, Albion the Shrouded Dragon, Phara or the Bystials.
// 4. The deck viewer shows the brain (How it plays, role tags, card notes).
import assert from 'node:assert/strict';import fs from 'node:fs';import {gunzipSync} from 'node:zlib';
import brain from '../dist/ai/brain/branded-brain.mjs';
import {BOOKS,BRAINS,keyCards,bookPick,bookActivationBlock,bookSummonBlock,superPolyOwnFusion,idleStep,newBookState} from '../dist/ai/book/book.mjs';import {M} from '../dist/duel.mjs';
import {renderDeck,renderBrain} from '../dist/deck-list.mjs';
const db=JSON.parse(gunzipSync(fs.readFileSync('dist/cards.json.gz'))),code=n=>+Object.keys(db).find(k=>db[k].name===n);
const base=JSON.parse(fs.readFileSync('dist/decks.json','utf8')).decks.find(d=>d.id==='branded'),list={...base,...base.banlistVariants['tcg-2026-10-19']};
const deckNames=new Set([...list.main,...list.extra].map(c=>db[c].name));
// 1
assert.deepEqual(new Set(Object.keys(brain.cards)),deckNames,'brain covers exactly the Main + Extra Deck');
for(const [n,k] of Object.entries(brain.cards)){assert.ok(brain.roles[k.role],n+': role '+k.role);assert.ok(k.does&&k.does.length>20,n+': plain-words note');
 for(const [verb,targets] of Object.entries(k.links||{}))for(const t of targets)assert.ok(deckNames.has(t),`${n} ${verb} ${t}: a deck card`)}
const lineIds=new Set(BOOKS.branded.lines.map(l=>l.id));for(const r of brain.routes){assert.ok(lineIds.has(r.id),'route '+r.id+' is a book line');for(const f of r.from)assert.ok(deckNames.has(f),f)}
assert.equal(BRAINS.branded,brain);
// 2
const kc=keyCards('branded');for(const [n,k] of Object.entries(brain.cards))if(['starter','extender'].includes(k.role))assert.ok(kc.has(n),n+' is a key card for hand traps');
// 3
const mk=(name,extra={})=>({code:code(name),controller:0,position:1,location:4,sequence:0,...extra});
const view=({hand=[],field=[],ed=['Lubellion the Searing Dragon','Mirrorjade the Iceblade Dragon'],opp=[],prompt=null,attempts=new Map()})=>{const z={2:hand.map((n,i)=>mk(n,{location:2,sequence:i})),4:field.map(n=>mk(n)),64:ed.map(n=>mk(n,{location:64}))};
 return {active:0,phase:4,turn:1,order:[0,1],decks:[{id:'branded'},{id:'sky'}],db,name:c=>db[c]?.name||'',hint:0,currentEffect:null,attempts,prompt,key:c=>[c.code,c.controller,c.location,c.sequence,'0'].join(':'),
  zone:(s,l)=>s===0?(z[l]||[]):(l===4?opp.map(n=>mk(n,{controller:1})):[])}};
const pickFor=(v,source,hint,offered)=>{v.currentEffect={code:code(source)};v.hint=hint;const m={type:M.SELECT_CARD,selects:offered.map(n=>mk(n,{location:2}))};const r=bookPick(v,0,m,{indicies:[offered.length-1]});return r?r.card:offered.at(-1)};
assert.equal(pickFor(view({hand:['Phara the Primordial Goddess','Super Polymerization','Branded Fusion']}),'Phara the Primordial Goddess',526,['Branded Fusion','Super Polymerization']),'Branded Fusion','Phara shields Branded Fusion');
assert.equal(pickFor(view({}),'The Fallen & The Virtuous',504,['Titaniklad the Ash Dragon','Granguignol the Dusk Dragon','Mirrorjade the Iceblade Dragon']),'Titaniklad the Ash Dragon','F&V cost: Titaniklad, not Mirrorjade');
assert.equal(pickFor(view({}),'Super Polymerization',509,['Mirrorjade the Iceblade Dragon','Lubellion the Searing Dragon','The Dragon that Devours the Dogma']),'Lubellion the Searing Dragon','own field, going first: Lubellion');
assert.equal(pickFor(view({}),'Lubellion the Searing Dragon',509,['Titaniklad the Ash Dragon','Mirrorjade the Iceblade Dragon']),'Mirrorjade the Iceblade Dragon','Lubellion makes Mirrorjade');
// R33-SPL
const spl=v=>superPolyOwnFusion(v,0);
assert.equal(spl(view({hand:['Super Polymerization','Dogmatika Fleurdelis, the Knighted'],field:['Fallen of the White Dragon','Fallen of Albaz','Incredible Ecclesia, the Virtuous']})),true,'seed 121 board: White Dragon + Albaz -> Lubellion');
assert.equal(spl(view({hand:['Super Polymerization'],field:['Fallen of Albaz','Fallen of the White Dragon']})),false,'needs a card to discard');
assert.equal(spl(view({hand:['Super Polymerization','Ash Blossom & Joyous Spring'],field:['Fallen of Albaz','Guiding Quem, the Virtuous']})),false,'Quem is LIGHT: no Lubellion');
assert.equal(spl(view({hand:['Super Polymerization','Branded Fusion'],field:['Fallen of Albaz','Fallen of the White Dragon']})),false,'Branded Fusion still in hand');
assert.equal(spl(view({hand:['Super Polymerization','Ash Blossom & Joyous Spring'],field:['Fallen of Albaz','Fallen of the White Dragon','Blazing Cartesia, the Virtuous']})),false,'Cartesia can still fuse (seed 122)');
assert.equal(spl(view({hand:['Super Polymerization','Ash Blossom & Joyous Spring'],field:['Fallen of Albaz','Fallen of the White Dragon'],opp:['Sky Striker Ace - Raye']})),false,'they have a monster: the normal Super Polymerization rules');
assert.equal(spl(view({hand:['Super Polymerization','Ash Blossom & Joyous Spring'],field:['Fallen of Albaz','Fallen of the White Dragon','Mirrorjade the Iceblade Dragon']})),false,'Mirrorjade already out');
const sp=mk('Super Polymerization',{location:2});
assert.equal(bookActivationBlock(view({hand:['Super Polymerization','Ash Blossom & Joyous Spring'],field:['Fallen of Albaz','Fallen of the White Dragon']}),0,sp),null,'R33-SPL lifts S-SUPERPOLY');
assert.match(bookActivationBlock(view({hand:['Super Polymerization','Ash Blossom & Joyous Spring'],field:['Fallen of Albaz','Guiding Quem, the Virtuous']}),0,sp)||'',/S-SUPERPOLY/,'otherwise still held for their turn');
// Phara before Branded Opening
const op=mk('Branded Opening',{location:2,sequence:1});
assert.match(bookActivationBlock(view({hand:['Phara the Primordial Goddess','Branded Opening'],prompt:{type:M.SELECT_CHAIN}}),0,op)||'',/Phara/,'chain window, Phara unused: Opening waits');
assert.equal(bookActivationBlock(view({hand:['Phara the Primordial Goddess','Branded Opening'],prompt:{type:M.SELECT_IDLECMD}}),0,op),null,'Main Phase: not held (the book plays Phara first)');
{const att=new Map([[[code('Phara the Primordial Goddess'),0,2,0,'0'].join(':'),1]]);assert.equal(bookActivationBlock(view({hand:['Phara the Primordial Goddess','Branded Opening'],prompt:{type:M.SELECT_CHAIN},attempts:att}),0,op),null,'Phara used: Opening free')}
assert.equal(bookActivationBlock(view({hand:['Branded Opening'],prompt:{type:M.SELECT_CHAIN}}),0,op),null,'no Phara: no hold');
{const v=view({hand:['Phara the Primordial Goddess','Branded Fusion','Fallen of Albaz']}),m={type:M.SELECT_IDLECMD,summons:[mk('Fallen of Albaz',{location:2})],special_summons:[],spell_sets:[],monster_sets:[],activates:[mk('Branded Fusion',{location:2}),mk('Phara the Primordial Goddess',{location:2})]};
 const st=idleStep(v,0,m,newBookState(),()=>false);assert.equal(st?.card,'Phara the Primordial Goddess','R33-PHARA: Phara first');assert.equal(st?.line,'R33-PHARA')}
// Summon holds
const isPayoff=n=>/Mirrorjade/.test(n);
for(const n of ['Dogmatika Fleurdelis, the Knighted','Albion the Shrouded Dragon','Phara the Primordial Goddess','Bystial Magnamhut','Bystial Saronir'])
 assert.match(bookSummonBlock(view({field:['Fallen of Albaz','Fallen of the White Dragon']}),0,mk(n,{location:2}),isPayoff)||'',/never Tribute Summoned|as Magnamhut/,n+': no Tribute Summon');
assert.equal(bookSummonBlock(view({}),0,mk('Guiding Quem, the Virtuous',{location:2}),isPayoff),null,'Level 4s are unaffected');
// 4. Viewer
const cards=JSON.parse(fs.readFileSync('dist/deck-cards.json','utf8')).cards,html=renderDeck(list,cards,null,brain);
assert.match(renderBrain(brain),/How it plays/);assert.equal((renderBrain(brain).match(/Ends on:/g)||[]).length,brain.routes.length,'every route listed');
assert.equal((html.match(/class="dv-role"/g)||[]).length,new Set(list.main).size+new Set(list.extra).size+[...new Set(list.side)].filter(c=>brain.cards[db[c].name]).length,'a role tag on every brain card');
assert.ok(!renderDeck(list,cards,null,null).includes('dv-brain'),'no brain: no panel');
console.log(JSON.stringify({test:'r33-deck-brain',pass:true,cards:Object.keys(brain.cards).length,routes:brain.routes.length,node:process.version,selfVerified:true}));

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
// 1 + 2, for every deck with a brain (r34: Lunalight, Mikanko, Sky Striker joined Branded).
const allDecks=JSON.parse(fs.readFileSync('dist/decks.json','utf8')).decks;
for(const [id,br] of Object.entries(BRAINS)){const b0=allDecks.find(d=>d.id===id),l=b0.banlistVariants?.['tcg-2026-10-19']?{...b0,...b0.banlistVariants['tcg-2026-10-19']}:b0;
 const names=new Set([...l.main,...l.extra].map(c=>db[c].name));
 assert.equal(br.deck,id);assert.ok(/DRAFT|REVIEWED/.test(br.status),id+': status');assert.ok(br.plan.length>60,id+': plan');
 assert.deepEqual(new Set(Object.keys(br.cards)),names,id+': brain covers exactly the Main + Extra Deck');
 for(const [n,k] of Object.entries(br.cards)){assert.ok(br.roles[k.role],id+' '+n+': role '+k.role);assert.ok(k.does&&k.does.length>20,n+': plain-words note');
  for(const [verb,targets] of Object.entries(k.links||{}))for(const t of targets)assert.ok(names.has(t),`${id}: ${n} ${verb} ${t}: a deck card`)}
 const lineIds=new Set((BOOKS[id]?.lines||[]).map(x=>x.id));
 for(const r of br.routes){assert.ok(lineIds.has(r.id)||/^R-/.test(r.id),id+' route '+r.id+' is a book line or an R- route');for(const f of r.from)assert.ok(names.has(f),id+' route from '+f);assert.ok(r.steps.length&&r.ends,id+' '+r.id)}
 for(const x of br.locks||[])assert.ok(names.has(x.card),id+' lock '+x.card);
 const kc=keyCards(id);for(const [n,k] of Object.entries(br.cards))if(['starter','extender'].includes(k.role))assert.ok(kc.has(n),id+': '+n+' is a key card for hand traps');
 assert.equal((await import('../dist/ai/brain/'+id+'-brain.mjs')).default,br,id+': BRAINS uses the shipped file')}
assert.equal(BRAINS.branded,brain);
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
assert.equal(spl(view({hand:['Super Polymerization','Dogmatika Fleurdelis, the Knighted','Albion the Shrouded Dragon'],field:['Fallen of the White Dragon','Fallen of Albaz','Incredible Ecclesia, the Virtuous']})),true,'White Dragon + Albaz -> Lubellion, with two cards to discard');
assert.equal(spl(view({hand:['Super Polymerization','Dogmatika Fleurdelis, the Knighted'],field:['Fallen of the White Dragon','Fallen of Albaz']})),false,'r33.1 (ChatGPT N3): one spare card is not enough (Lubellion also discards)');
assert.equal(spl(view({hand:['Super Polymerization'],field:['Fallen of Albaz','Fallen of the White Dragon']})),false,'needs cards to discard');
assert.equal(spl(view({hand:['Super Polymerization','Ash Blossom & Joyous Spring'],field:['Fallen of Albaz','Guiding Quem, the Virtuous']})),false,'Quem is LIGHT: no Lubellion');
assert.equal(spl(view({hand:['Super Polymerization','Branded Fusion'],field:['Fallen of Albaz','Fallen of the White Dragon']})),false,'Branded Fusion still in hand');
assert.equal(spl(view({hand:['Super Polymerization','Ash Blossom & Joyous Spring'],field:['Fallen of Albaz','Fallen of the White Dragon','Blazing Cartesia, the Virtuous']})),false,'Cartesia can still fuse (seed 122)');
assert.equal(spl(view({hand:['Super Polymerization','Ash Blossom & Joyous Spring'],field:['Fallen of Albaz','Fallen of the White Dragon'],opp:['Sky Striker Ace - Raye']})),false,'they have a monster: the normal Super Polymerization rules');
assert.equal(spl(view({hand:['Super Polymerization','Ash Blossom & Joyous Spring'],field:['Fallen of Albaz','Fallen of the White Dragon','Mirrorjade the Iceblade Dragon']})),false,'Mirrorjade already out');
const sp=mk('Super Polymerization',{location:2});
assert.equal(bookActivationBlock(view({hand:['Super Polymerization','Ash Blossom & Joyous Spring','Mulcharmy Fuwalos'],field:['Fallen of Albaz','Fallen of the White Dragon']}),0,sp),null,'R33-SPL lifts S-SUPERPOLY');
assert.match(bookActivationBlock(view({hand:['Super Polymerization','Ash Blossom & Joyous Spring'],field:['Fallen of Albaz','Fallen of the White Dragon']}),0,sp)||'',/S-SUPERPOLY/,'r33.1: not with only one spare card');
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
console.log(JSON.stringify({test:'r33-deck-brain',pass:true,brains:Object.keys(BRAINS),node:process.version,selfVerified:true}));
// r34: Mikanko MK-UZU picks (30 going-first hands: Uzuhime 12 -> 18, no hand worse).
{const {bookPick:bp,bookActivationBlock:bab,bookSpecialBlock:bsb}=await import('../dist/ai/book/book.mjs');
 const mkv=({hand=[],field=[]})=>({active:0,phase:4,turn:1,order:[0,1],decks:[{id:'mikanko'},{id:'sky'}],db,name:c=>db[c]?.name||'',hint:0,currentEffect:null,attempts:new Map(),key:c=>c.code,
  zone:(s,l)=>s===0?(l===2?hand.map(n=>mk(n,{location:2})):l===4?field.map(n=>mk(n)):[]):[]});
 const pk=(v,source,hint,offered)=>{v.currentEffect={code:code(source)};v.hint=hint;const r=bp(v,0,{type:M.SELECT_CARD,selects:offered.map(n=>mk(n,{location:1}))},{indicies:[offered.length-1]});return r?r.card:offered.at(-1)};
 const opts=['Ha-Re the Sword Mikanko','Mikanko Water Arabesque','Mikanko Shinbu - Noble Twins'];
 assert.equal(pk(mkv({hand:['Ohime the Manifested Mikanko']}),'Ohime the Manifested Mikanko',506,opts),'Ha-Re the Sword Mikanko','no Mikanko to summon: Ohime adds Ha-Re');
 assert.equal(pk(mkv({hand:['Ohime the Manifested Mikanko'],field:['Hu-Li the Jewel Mikanko']}),'Ohime the Manifested Mikanko',506,opts),'Mikanko Water Arabesque','a Mikanko already out: Arabesque instead');
 assert.equal(pk(mkv({}),'Ohime the Manifested Mikanko',501,['Hu-Li the Jewel Mikanko','Mikanko Dance - Mayowashidori']),'Mikanko Dance - Mayowashidori','discard Mayowashidori, not the body');
 assert.equal(pk(mkv({}),'Mikanko Water Arabesque',509,['Hu-Li the Jewel Mikanko','Sanaki the Mikanko Devotee']),'Sanaki the Mikanko Devotee','Arabesque summons Sanaki (two bodies)');
 assert.match(bab(mkv({field:['Uzuhime the Manifested Mikanko']}),0,mk('Mikanko Water Arabesque',{location:2}))||'',/Uzuhime back/,'no Arabesque on a lone Uzuhime');
 assert.equal(bab(mkv({field:['Uzuhime the Manifested Mikanko','Ha-Re the Sword Mikanko']}),0,mk('Mikanko Water Arabesque',{location:2})),null,'fine with a Level 3 to wear it');
 assert.match(bsb(mkv({}),0,mk('Salamangreat Almiraj',{location:64}),()=>false)||'',/Almiraj/,'no Almiraj')}
console.log(JSON.stringify({test:'r33-deck-brain',part:'r34 Mikanko',pass:true}));
// r34: Mikanko MK-UZU is going-first only (going-second recorded openings: identical outcomes to r33.1).
{const {idleStep:is,newBookState:nbs,bookPick:bp}=await import('../dist/ai/book/book.mjs');
 const mk2=({hand=[],field=[],opp=[],first=true})=>({active:0,phase:4,turn:first?1:2,order:first?[0,1]:[1,0],decks:[{id:'mikanko'},{id:'branded'}],db,name:c=>db[c]?.name||'',hint:0,currentEffect:null,attempts:new Map(),key:c=>c.code,
  zone:(s,l)=>s===0?(l===2?hand.map(n=>mk(n,{location:2})):l===4?field.map(n=>mk(n)):[]):(l===4?opp.map(n=>mk(n,{controller:1})):[])});
 const m={type:M.SELECT_IDLECMD,summons:[mk('Ha-Re the Sword Mikanko',{location:2})],special_summons:[],spell_sets:[],monster_sets:[],activates:[]};
 assert.equal(is(mk2({hand:['Ha-Re the Sword Mikanko']}),0,m,nbs(),()=>false)?.line,'MK-UZU','empty opposing field: the line runs');
 assert.equal(is(mk2({hand:['Ha-Re the Sword Mikanko'],opp:['Mirrorjade the Iceblade Dragon'],first:false}),0,m,nbs(),()=>false)?.line,undefined,'going second: no MK-UZU');
 assert.equal(is(mk2({hand:['Ha-Re the Sword Mikanko'],opp:['Scareclaw Kashtira']}),0,m,nbs(),()=>false)?.line,'MK-UZU','going first, even if they drop a monster on our turn');
 const v=mk2({hand:['Ohime the Manifested Mikanko'],opp:['Mirrorjade the Iceblade Dragon'],first:false});v.currentEffect={code:code('Ohime the Manifested Mikanko')};v.hint=506;
 assert.equal(bp(v,0,{type:M.SELECT_CARD,selects:['Ha-Re the Sword Mikanko','Mikanko Shinbu - Noble Twins'].map(n=>mk(n,{location:1}))},{indicies:[1]}),null,'going second: Ohime\'s search is left to the base policy')}
// r34: Sky Striker. A live Engage! is not left in hand; hand traps are never Normal Summoned (Main Monster Zones stay empty).
{const {passiveCheck:pc,bookSummonBlock:sb}=await import('../dist/ai/book/book.mjs');const {R}=await import('../dist/duel.mjs');
 const sk=({hand=[]})=>({active:0,phase:4,turn:1,decks:[{id:'sky'},{id:'luna'}],order:[0,1],db,name:c=>db[c]?.name||'',attempts:new Map(),key:()=>'k',zone:(s,l)=>s===0&&l===2?hand.map(n=>mk(n,{location:2})):[]});
 const v=sk({hand:['Sky Striker Mobilize - Engage!','Ghost Belle & Haunted Mansion']});
 const m={type:M.SELECT_IDLECMD,activates:[mk('Sky Striker Mobilize - Engage!',{location:2})],summons:[mk('Ghost Belle & Haunted Mansion',{location:2})],special_summons:[]};
 assert.equal(pc(v,0,m,{type:R.SELECT_IDLECMD,action:7,index:null},()=>false)?.live?.card,'Sky Striker Mobilize - Engage!','ending the turn with Engage! live is passive');
 for(const n of ['Ghost Belle & Haunted Mansion','Ash Blossom & Joyous Spring','Mulcharmy Fuwalos','Droll & Lock Bird'])assert.match(sb(v,0,mk(n,{location:2}),()=>false)||'',/Main Monster Zone/,n+' is not Normal Summoned by Sky Striker');
 assert.equal(sb(v,0,mk('Sky Striker Ace - Raye',{location:2}),()=>false),null,'Raye is')}
console.log(JSON.stringify({test:'r33-deck-brain',part:'r34 Mikanko gating, Sky Striker',pass:true}));

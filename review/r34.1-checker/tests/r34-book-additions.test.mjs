// r34 book additions (Claude, 23 Oct; Kevy 22 Oct 23:29 "AI needs more in depth combo books"). SELF-VERIFIED
// (builder = verifier), NOT independent. Each rule was kept only because it measured better on the 30 going-first
// test hands (seeds 101-130); see REPLY r34.
// 1. Toon: never activate a second Toon Kingdom / Toon World from the hand while one is already in the Field Zone
//    (base seed 124 activated Toon Kingdom twice: 6 cards banished, one card wasted).
// 2. Blue-Eyes BE-SAGE / BE-SPIRIT: Lordly Lode declares Blue-Eyes White Dragon only when Sage is in hand; book steps can
//    name the zone (Lordly Lode from the hand = card activation, on the field = its declaration, used last).
// 4. Xyz Materials (location 64 + overlay_sequence, from a face-up Monster Zone) show their names in the summon scene;
//    face-down origins and real Extra Deck sends stay anonymous.
// 5. Kashtira: a book hold can need two conditions (ifAlso): Scareclaw's own Special Summon waits while Kashtiratheosis
//    and Kashtira Birth are both available.
// 6. Effect previews: no material-recipe line for Extra Deck monsters; effect-titles.mjs (RELAY-023 data) supplies a
//    clause + plain title only when it is an exact piece of the card text.
// 3. r34 arena stylesheet is linked and cached offline; the shell exposes the pace to CSS.
import assert from 'node:assert/strict';import fs from 'node:fs';import {gunzipSync} from 'node:zlib';
import {bookActivationBlock,bookPick,idleStep,newBookState,BOOKS} from '../dist/ai/book/book.mjs';import {M,R} from '../dist/duel.mjs';import {publicMaterial} from '../dist/fusion-materials.mjs';
const db=JSON.parse(gunzipSync(fs.readFileSync('dist/cards.json.gz'))),code=n=>+Object.keys(db).find(k=>db[k].name===n);
const mk=(name,extra={})=>({code:code(name),controller:0,position:1,location:4,sequence:0,...extra});
const view=(deck,{hand=[],st=[],choices=[]}={})=>{const z={2:hand.map((n,i)=>mk(n,{location:2,sequence:i})),8:st.map((n,i)=>mk(n,{location:8,sequence:i===0&&/Toon (World|Kingdom)/.test(n)?5:i}))};
 return {active:0,phase:4,turn:1,order:[0,1],decks:[{id:deck},{id:'sky'}],db,name:c=>db[c]?.name||'',hint:0,currentEffect:null,attempts:new Map(),prompt:null,
  key:c=>[c.code,c.controller,c.location,c.sequence,'0'].join(':'),zone:(s,l)=>s===0?(z[l]||[]):[],
  choices:()=>choices.map(n=>({label:n,response:{type:R.ANNOUNCE_CARD,card:code(n)},code:code(n)}))}};
// 1
const kingdomInHand=mk('Toon Kingdom',{location:2,sequence:0});
assert.match(bookActivationBlock(view('toon',{hand:['Toon Kingdom'],st:['Toon Kingdom']}),0,kingdomInHand)||'',/already in the Field Zone/,'no second Toon Kingdom');
assert.equal(bookActivationBlock(view('toon',{hand:['Toon Kingdom'],st:['Toon World']}),0,kingdomInHand),null,'Kingdom can join a Continuous Toon World (RELAY-020 A-115/A-116)');
assert.equal(bookActivationBlock(view('toon',{hand:['Toon Kingdom']}),0,kingdomInHand),null,'the first Toon Kingdom is fine');
const worldInHand=mk('Toon World',{location:2,sequence:0});
assert.match(bookActivationBlock(view('toon',{hand:['Toon World'],st:['Toon World']}),0,worldInHand)||'',/already on the field/,'no second Toon World');
// 2
const lunar={type:R.ANNOUNCE_CARD,card:code('Lunar Rabbit Omajinai')},offer=['Lunar Rabbit Omajinai','Blue-Eyes White Dragon'];
const withSage=view('blueeyes',{hand:['Sage with Eyes of Blue'],choices:offer});withSage.currentEffect={code:code('Primite Lordly Lode')};
assert.equal(bookPick(withSage,0,{type:M.ANNOUNCE_CARD},lunar)?.card,'Blue-Eyes White Dragon','Sage in hand: Lordly Lode declares Blue-Eyes');
const noSage=view('blueeyes',{hand:['Primite Dragon Ether Beryl'],choices:offer});noSage.currentEffect={code:code('Primite Lordly Lode')};
assert.equal(bookPick(noSage,0,{type:M.ANNOUNCE_CARD},lunar),null,'no Sage: the Tuner (Lunar Rabbit) stays the declaration');
assert.equal(bookPick(view('toon',{hand:['Sage with Eyes of Blue'],choices:offer}),0,{type:M.ANNOUNCE_CARD},lunar),null,'other decks unchanged');
const spirit=BOOKS.blueeyes.lines.find(l=>l.id==='BE-SPIRIT');assert.equal(spirit.steps[0].card,'Blue-Eyes Spirit Dragon','Synchro first whenever it is legal');
assert.deepEqual(spirit.steps.filter(x=>x.card==='Primite Lordly Lode').map(x=>x.location),[[2],[8]],'Lordly Lode: hand first, field declaration last');
{const v=view('blueeyes',{hand:['Primite Lordly Lode','Primite Dragon Ether Beryl']});v.prompt={type:M.SELECT_IDLECMD};
 const lodeField=mk('Primite Lordly Lode',{location:8,sequence:0}),beryl=mk('Primite Dragon Ether Beryl',{location:2,sequence:1});
 const m={type:M.SELECT_IDLECMD,activates:[lodeField],summons:[beryl],special_summons:[]};
 const st=newBookState();const r=idleStep(v,0,m,st,()=>false);assert.equal(r?.card,'Primite Dragon Ether Beryl','field Lordly Lode is not the first step; Ether Beryl is summoned before the declaration')}
// 3
const html=fs.readFileSync('dist/index.html','utf8'),assets=fs.readFileSync('dist/offline-assets.json','utf8'),shell=fs.readFileSync('dist/app-shell.mjs','utf8'),css=fs.readFileSync('dist/r34-arena.css','utf8');
assert.ok(html.indexOf('r34-arena.css')>html.indexOf('r33-polish.css'),'arena stylesheet loads last');assert.ok(assets.includes('"./r34-arena.css"'),'cached offline');
assert.match(shell,/document\.body\.dataset\.pace=preferences\.preset/,'pace exposed to CSS');
assert.match(css,/defence\[data-slot\*=":4:"\]/,'only Monster Zone cards turn sideways for Defence Position');
assert.doesNotMatch(css,/url\(/,'no external images');
{const decks=JSON.parse(fs.readFileSync('dist/decks.json','utf8')),st=fs.readFileSync('dist/showtime.css','utf8')+css,ids=(decks.decks||decks).map(d=>d.id);
 for(const id of ids)assert.match(st,new RegExp('data-deck-theme='+id+'\\]'),'Showtime colour family for '+id+' (HERO had none: white zone boxes)');
 assert.match(css,/-webkit-line-clamp:2/,'resolution bubble shows two lines');assert.match(fs.readFileSync('dist/presentation.mjs','utf8'),/on-field-name/,'bubble names the card')}
{const ph=fs.readFileSync('dist/r34-persona.css','utf8');assert.ok(html.indexOf('r34-persona.css')>html.indexOf('r34-arena.css'),'Phantom panels load after the arena polish');
 assert.ok(assets.includes('"./r34-persona.css"'),'Phantom panels cached offline');assert.doesNotMatch(ph,/url\(|@import|@font-face/,'no external images or fonts');
 for(const rule of ph.split('}').map(x=>x.trim()).filter(x=>x&&!x.startsWith('@')&&!/^(0%|50%|100%|14%|82%|\/\*)/.test(x)&&x.includes('{')))
  assert.match(rule.split('{')[0],/data-theme=showtime|^\s*$/,'Showtime theme only: '+rule.slice(0,60))}
// 4
const xyzMat=publicMaterial({type:'move',code:94392192,reason:2097160,from:{controller:0,location:4,sequence:0,position:1},to:{controller:0,location:64,sequence:0,position:1,overlay_sequence:0}});
assert.equal(xyzMat.hidden,false);assert.equal(xyzMat.code,94392192);assert.equal(xyzMat.destination,'Xyz Material');
assert.equal(publicMaterial({type:'move',code:94392192,reason:2097160,from:{controller:0,location:4,sequence:0,position:8},to:{controller:0,location:64,sequence:0,position:1,overlay_sequence:0}}).hidden,true,'face-down origin stays hidden');
assert.equal(publicMaterial({type:'move',code:94392192,reason:8,from:{controller:0,location:2,sequence:0,position:10},to:{controller:0,location:64,sequence:0,position:10}}).hidden,true,'a card from the hand to the Extra Deck stays hidden');
{const {FusionMaterials}=await import('../dist/fusion-materials.mjs'),fm=new FusionMaterials(),FUS=262144|8,mirror=code('Mirrorjade the Iceblade Dragon'),albaz=code('Fallen of Albaz'),gran=code('Granguignol the Dusk Dragon');
 // r34.1 (ChatGPT RELAY-030 R34-01): the wrapper masks the code of a material going face-down into the Extra Deck / Deck;
 // a card seen face-up on the field keeps its name, a GY source stays anonymous (pile memory is not trusted).
 fm.observe([{id:1,type:'move',code:albaz,reason:0,from:{controller:0,location:2,sequence:0,position:10},to:{controller:0,location:4,sequence:2,position:1}},
  {id:2,type:'move',code:gran,reason:0,from:{controller:0,location:64,sequence:0,position:10},to:{controller:0,location:4,sequence:5,position:1}},
  {id:3,type:'move',code:0,reason:FUS,from:{controller:0,location:4,sequence:5,position:1},to:{controller:0,location:64,sequence:0,position:10}},
  {id:4,type:'move',code:0,reason:FUS,from:{controller:0,location:16,sequence:0,position:1},to:{controller:0,location:1,sequence:0,position:10}},
  {id:5,type:'summon',code:mirror,player:0,sequence:6,special:true}],db);
 const g=[...fm.confirmed.values()][0];assert.equal(g.items[0].code,gran,'field material named again (Field -> Extra Deck)');assert.equal(g.items[0].hidden,false);assert.equal(g.items[1].hidden,true,'GY source stays anonymous')}
{const toDeck=(loc,pos)=>publicMaterial({type:'move',code:94392192,reason:2097160,from:{controller:0,location:loc,sequence:0,position:pos},to:{controller:0,location:1,sequence:0,position:1}});
 assert.equal(toDeck(16,1).hidden,false,'GY material shuffled into the Deck keeps its name (Lubellion)');assert.equal(toDeck(4,1).hidden,false,'face-up field material keeps its name');
 assert.equal(toDeck(2,1).hidden,true,'hand material stays anonymous');assert.equal(toDeck(4,8).hidden,true,'face-down material stays anonymous');assert.equal(toDeck(16,1).destination,'Deck')}
// 5
{const sc=mk('Scareclaw Kashtira',{location:2,sequence:0}),v=(hand,st=[])=>view('kashtira',{hand,st});
 assert.match(bookActivationBlock(v(['Scareclaw Kashtira','Kashtiratheosis'],['Kashtira Birth']),0,sc)||'',/Kashtiratheosis/,'Birth on the field + Kashtiratheosis: hold');
 assert.match(bookActivationBlock(v(['Scareclaw Kashtira','Kashtiratheosis','Kashtira Birth']),0,sc)||'',/Kashtiratheosis/,'Birth in hand + Kashtiratheosis: hold');
 assert.equal(bookActivationBlock(v(['Scareclaw Kashtira','Kashtiratheosis']),0,sc),null,'no Birth: no hold (only one condition)');
 assert.equal(bookActivationBlock(v(['Scareclaw Kashtira','Kashtira Birth']),0,sc),null,'no Kashtiratheosis: no hold')}
// 6
{const {effectFocus}=await import('../dist/effect-focus.mjs'),{EFFECT_TITLES}=await import('../dist/effect-titles.mjs'),{decodeEffectId}=await import('../dist/effect-id.mjs');
 const dpe=code('Destiny HERO - Destroyer Phoenix Enforcer'),desc=String((BigInt(dpe)<<20n)|0n);
 assert.doesNotMatch(effectFocus(dpe,desc,db,{type:'activate'})?.excerpt||'',/"HERO" monster \+/,'no material recipe as the effect');
 const clause=db[dpe].desc.split('\n').find(l=>/destroy/i.test(l))?.match(/[^.]*destroy[^.]*\./i)?.[0];
 EFFECT_TITLES[dpe]={0:{clause,title:'Destroy 1 of yours + 1 on the field'}};
 const f=effectFocus(dpe,desc,db,{type:'activate'});assert.equal(f.label,'Destroy 1 of yours + 1 on the field');assert.equal(f.excerpt,clause);
 EFFECT_TITLES[dpe]={0:{clause:'not in the card text',title:'X'}};assert.notEqual(effectFocus(dpe,desc,db,{type:'activate'}).label,'X','a clause that is not exact text is ignored');delete EFFECT_TITLES[dpe]}
console.log(JSON.stringify({test:'r34-book-additions',pass:true,node:process.version,selfVerified:true}));

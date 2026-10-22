// r33 (Claude, 23 Oct; Kevy 22 Oct 23:29: "an option to view the deck list ... better for me for irl deck building").
// SELF-VERIFIED (builder = verifier), NOT independent.
// 1. deck-cards.json is up to date with decks.json, cards.json.gz and the TCG text overrides.
// 2. For every preset deck under every banlist: groups add up, Extra Deck cards sit in Fusion / Synchro / Xyz / Link,
//    the Main Deck has none, every card has a name and art, and the copy-paste text and .ydk hold exactly the deck.
// 3. In the page (JSDOM): "Deck list" under DECK A and DECK B, the viewer shows one tile per card with copies and banlist
//    marks, tiles open the app's card dossier (data-card), the deck switcher works, and the deck-tile pop-up gets "View cards".
import assert from 'node:assert/strict';import fs from 'node:fs';import {JSDOM} from 'jsdom';
import {buildDeckCards} from '../tools/r33-deck-cards.mjs';
import {groupDeck,deckText,deckYdk,presetFor,statLine,frameOf,limitOf,renderDeck} from '../dist/deck-list.mjs';
const file=JSON.parse(fs.readFileSync('dist/deck-cards.json','utf8'));
assert.deepEqual(file,buildDeckCards('dist'),'deck-cards.json up to date (node tools/r33-deck-cards.mjs)');
const {cards}=file,{decks}=JSON.parse(fs.readFileSync('dist/decks.json','utf8')),index=JSON.parse(fs.readFileSync('dist/banlists/index.json','utf8'));
const EXTRA=new Set(['fusion','synchro','xyz','link']);let checked=0;
for(const listId of index.lists){const list=JSON.parse(fs.readFileSync('dist/banlists/'+listId+'.json','utf8'));
 for(const base of decks){const d=presetFor(base,listId),z=groupDeck(d,cards);
  for(const zone of z){assert.equal(zone.groups.reduce((s,g)=>s+g.total,0),(d[zone.zone]||[]).length,d.id+' '+zone.zone+' adds up');
   for(const g of zone.groups)for(const r of g.rows){assert.ok(r.card?.name,'name for '+r.code);assert.ok(r.card.art&&fs.existsSync('dist/'+r.card.art),'art for '+r.card.name);
    if(zone.zone==='extra')assert.ok(EXTRA.has(frameOf(r.card)),d.id+': '+r.card.name+' is an Extra Deck frame');
    if(zone.zone==='main')assert.ok(!EXTRA.has(frameOf(r.card)),d.id+': '+r.card.name+' is a Main Deck card')}}
  // Copy-paste text: every "Nx Name" line, per section, adds up to the deck.
  const text=deckText(d,cards,list.label),sec={};let cur=null;for(const line of text.split('\n')){const h=/^(Main|Extra|Side) Deck \((\d+)\)$/.exec(line);if(h){cur=h[1].toLowerCase();sec[cur]=0;continue}const m=/^(\d+)x (.+)$/.exec(line);if(m&&cur)sec[cur]+=+m[1]}
  for(const zz of ['main','extra','side'])assert.equal(sec[zz]||0,(d[zz]||[]).length,d.id+' text '+zz);
  assert.ok(text.includes('Banlist: '+list.label));
  const y=deckYdk(d).split('\n');assert.deepEqual(y.slice(2,2+d.main.length).map(Number),d.main,'ydk main');
  checked++}}
assert.equal(checked,decks.length*index.lists.length);
assert.equal(statLine(cards[44146295]),'Lv 8 · DARK · 3000/2500','Mirrorjade stats');
assert.match(statLine(Object.values(cards).find(c=>frameOf(c)==='link')),/^Link-\d · \w+ · \d+$/,'Link stats');
assert.equal(statLine({type:0x10002}),'Quick-Play Spell');assert.equal(statLine({type:0x20004}),'Continuous Trap');assert.equal(statLine({type:0x21,level:4,attribute:32,atk:-2,def:0}),'Lv 4 · DARK · ?/0');
assert.equal(limitOf({cards:{1:{max:1},2:{max:2}}},1),'Limited');assert.equal(limitOf({cards:{1:{max:1},2:{max:2}}},2),'Semi-Limited');assert.equal(limitOf(null,1),'');
// 3. JSDOM
const html=`<!doctype html><body><select id="deck-a"><option value="branded">B</option><option value="hero">H</option></select><select id="deck-b"><option value="luna">L</option></select><select id="banlist"><option value="tcg-2026-10-19" selected>x</option></select><dialog id="modal"><div id="modal-body"></div></dialog></body>`;
const dom=new JSDOM(html,{url:'https://lab.test/'});Object.assign(globalThis,{document:dom.window.document,window:dom.window,MutationObserver:dom.window.MutationObserver,localStorage:dom.window.localStorage});
const fetchJson=async u=>JSON.parse(fs.readFileSync('dist/'+u,'utf8'));
const {installDeckList}=await import('../dist/deck-list.mjs');const view=installDeckList({fetchJson});const $=s=>document.querySelector(s);
assert.ok($('#deck-list-a')&&$('#deck-list-b'),'Deck list buttons under both seats');
await view.open('branded');const br=presetFor(decks.find(d=>d.id==='branded'),'tcg-2026-10-19');
assert.equal($('#dv-title').textContent,br.name);assert.match($('#dv-sub').textContent,/19 Oct 2026/);
assert.equal(document.querySelectorAll('.dv-card').length,new Set(br.main).size+new Set(br.extra).size+new Set(br.side).size,'one tile per card per zone');
const tiles=[...document.querySelectorAll('.dv-zone[data-zone=main] .dv-card')];assert.equal(tiles.reduce((s,t)=>s+Number(t.querySelector('.dv-count').textContent.slice(1)),0),40,'copies add to 40');
assert.ok(tiles.every(t=>/^\d+$/.test(t.dataset.card)),'tiles open the card dossier');
const list1019=JSON.parse(fs.readFileSync('dist/banlists/tcg-2026-10-19.json','utf8'));
assert.equal(document.querySelectorAll('.dv-limit').length,[...new Set(br.main),...new Set(br.extra),...new Set(br.side)].filter(c=>limitOf(list1019,c)).length,'banlist marks');
assert.equal($('#dv-deck').options.length,decks.length,'deck switcher lists every deck');
$('#dv-deck').value='hero';$('#dv-deck').onchange({target:$('#dv-deck')});await new Promise(r=>setTimeout(r,20));assert.equal($('#dv-title').textContent,decks.find(d=>d.id==='hero').name);
// deck-tile pop-up
$('#modal-body').innerHTML='<h2>'+decks.find(d=>d.id==='luna').name+'</h2><button id="export-deck">Export .ydk</button>';await new Promise(r=>setTimeout(r,20));
assert.ok($('#dv-from-info'),'View cards added to the deck pop-up');
assert.ok(!renderDeck({main:[],extra:[],side:[]},cards,null).includes('dv-zone'),'empty zones are not drawn');
console.log(JSON.stringify({test:'r33-deck-list',pass:true,decks:decks.length,lists:index.lists.length,node:process.version,selfVerified:true}));

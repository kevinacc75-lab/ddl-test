// r46 Part A (Kevy 11 Nov 2026 14:54 AEDT: "With the victory screen include the official boss monster art so it can be easily
// identified who won"). The victory / defeat screen shows the winning deck's official boss card art (decks.json boss, the
// same source as the r44 deck tiles), labelled with the winner's deck name, for every deck and both seats, with the
// original emblem as the fallback. Presentation only.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const dist=f=>new URL('../dist/'+f,import.meta.url);
const read=f=>fs.readFileSync(dist(f),'utf8');
const {applyVictoryBoss}=await import(dist('victory-boss.mjs').href);
// Minimal DOM for the victory dialog: #victory-scene > .victory-art-frame > img#victory-art, plus #victory-deck.
class El{constructor(tag,id,cls){this.tagName=tag;this.id=id||'';this.attrs={};this.children=[];this.parent=null;this.hidden=false;this.textContent='';this.dataset={};this.onerror=null;const set=new Set(cls?[cls]:[]);this.classList={contains:c=>set.has(c),add:c=>set.add(c),remove:c=>set.delete(c),toggle:(c,on)=>{on?set.add(c):set.delete(c);return on}};this.className=cls||''}
 getAttribute(k){return k in this.attrs?this.attrs[k]:null}setAttribute(k,v){this.attrs[k]=String(v)}
 appendChild(c){c.parent=this;this.children.push(c);return c}
 closest(sel){let e=this;while(e){if(sel.startsWith('.')&&e.classList.contains(sel.slice(1)))return e;e=e.parent}return null}
 querySelector(sel){for(const c of this.children){if(sel.startsWith('.')&&(c.className===sel.slice(1)||c.classList.contains(sel.slice(1))))return c;const r=c.querySelector(sel);if(r)return r}return null}}
function scene(){const s=new El('dialog','victory-scene'),f=s.appendChild(new El('div','','victory-art-frame')),img=f.appendChild(new El('img','victory-art')),deck=s.appendChild(new El('h3','victory-deck'));
 const doc={createElement:t=>new El(t),getElementById:id=>({'victory-scene':s,'victory-art':img,'victory-deck':deck})[id]||null};return {s,f,img,deck,doc}}
// What presentation.mjs victoryScene does before opening (unchanged r45 code): src/alt from db()[deck.boss], hidden when no art.
function present(v,deck,card){v.s.dataset.draw=String(!deck);v.img.hidden=!card?.art;if(card?.art){v.img.setAttribute('src',card.art);v.img.setAttribute('alt',card.name)}v.deck.textContent=deck?.name||'Both decks reach the finish'}
const {decks}=JSON.parse(read('decks.json')),{cards}=JSON.parse(read('deck-cards.json'));
test('(R46-A1) every preset deck, either seat winning: official boss art is shown and labelled with the winner deck name',()=>{
 assert.ok(decks.length>=9);
 for(const d of decks)for(const seat of [0,1]){const card=cards[String(d.boss)];assert.ok(card?.art,d.id+' boss art');assert.ok(fs.existsSync(dist(card.art)),card.art);
  const v=scene();present(v,d,card);const r=applyVictoryBoss(v.doc);
  assert.equal(r.ok,true,d.id+' seat '+seat);assert.ok(v.f.classList.contains('has-boss'));assert.equal(v.img.getAttribute('src'),card.art);
  const label=v.f.querySelector('.victory-boss-label');assert.ok(label);assert.ok(label.textContent.includes(d.name),label.textContent);assert.ok(label.textContent.includes(card.name));
  assert.equal(v.img.getAttribute('alt'),card.name+', boss monster of '+d.name+' (winner)');}
});
test('(R46-A2) emblem fallback: no art or an image error removes the art and keeps the deck label; a draw shows no winner art',()=>{
 const d=decks[0],v=scene();present(v,d,{name:'x'});let r=applyVictoryBoss(v.doc);assert.equal(r.ok,false);assert.ok(!v.f.classList.contains('has-boss'));assert.match(v.f.querySelector('.victory-boss-label').textContent,new RegExp(d.name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
 const w=scene();present(w,d,cards[String(d.boss)]);applyVictoryBoss(w.doc);assert.ok(w.f.classList.contains('has-boss'));w.img.onerror();assert.ok(!w.f.classList.contains('has-boss'),'image error falls back to the emblem');
 const x=scene();present(x,null,null);r=applyVictoryBoss(x.doc);assert.equal(r.ok,false);assert.equal(x.f.querySelector('.victory-boss-label').textContent,'');
});
test('(R46-A3) re-opening with a different winner never keeps the previous boss name',()=>{
 const v=scene(),[a,b]=[decks[0],decks[1]];present(v,a,cards[String(a.boss)]);applyVictoryBoss(v.doc);present(v,b,cards[String(b.boss)]);applyVictoryBoss(v.doc);
 assert.equal(v.img.getAttribute('alt'),cards[String(b.boss)].name+', boss monster of '+b.name+' (winner)');assert.ok(!v.f.querySelector('.victory-boss-label').textContent.includes(a.name)||a.name===b.name);
});
test('(R46-A4) wiring: loaded on the page and precached; Aurora shows the art over the emblem; emblem per deck; portrait size; presentation.mjs unchanged',()=>{
 assert.match(read('index.html'),/<script type="module" src="victory-boss\.mjs"><\/script>/);assert.ok(JSON.parse(read('offline-assets.json')).includes('./victory-boss.mjs'));
 const c=read('css/aurora.css');assert.match(c,/#victory-scene \.victory-art-frame #victory-art\{opacity:0\}/);/* r43 rule kept */
 assert.match(c,/#victory-scene \.victory-art-frame\.has-boss\{background-image:none!important\}/);assert.match(c,/#victory-scene \.victory-art-frame\.has-boss #victory-art\{opacity:1\}/);
 for(const id of ['branded','sky','blueeyes','kashtira','mikanko','luna','toon','hero','dtw'])assert.match(c,new RegExp('#victory-scene\\[data-deck-theme='+id+'\\] \\.victory-art-frame\\{background-image:url\\(\\.\\./emblems/'+id+'\\.svg\\)\\}'));
 assert.match(c,/@media\(max-width:760px\)\{#victory-scene \.victory-art-frame\.has-boss\{max-width:150px\}/);
 const p=read('presentation.mjs'),p0=fs.readFileSync('/workspace/ddl-test-r39/r45-ai-v4/presentation.mjs','utf8');assert.equal(p,p0,'presentation.mjs byte-identical to r45');
 assert.match(p,/const art=\$\('#victory-art'\),card=deck\?db\(\)\[deck\.boss\]:null;art\.hidden=!card\?\.art;if\(card\?\.art\)\{art\.src=card\.art;art\.alt=card\.name\}/);/* the winner's decks.json boss, both seats */
 const vb=read('victory-boss.mjs').replace(/^\/\/.*$/mg,'');assert.doesNotMatch(vb,/Math\.random|worker|duel\.|setTimeout|fetch\(/);
});

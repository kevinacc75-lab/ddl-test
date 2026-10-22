// TASK c (Claude, 21 Oct): deck legality against both TCG lists, the 19 Oct banlist file, the preset variants, the
// Elemental HERO preset and the merged TCG text overrides.
import assert from 'node:assert/strict';
import fs from 'node:fs';import crypto from 'node:crypto';import {gunzipSync} from 'node:zlib';
import {validateDeck} from '../dist/deck-validator.mjs';
const db=JSON.parse(gunzipSync(fs.readFileSync('dist/cards.json.gz'))),scripts=JSON.parse(gunzipSync(fs.readFileSync('dist/scripts.json.gz')));
const data=JSON.parse(fs.readFileSync('dist/decks.json')),decks=data.decks,finals=JSON.parse(fs.readFileSync('tests/fixtures/taskc-final-lists-2026-10-20.json'));
const list=id=>JSON.parse(fs.readFileSync(`dist/banlists/${id}.json`)),OLD=list('tcg-2026-09-21'),NEW=list('tcg-2026-10-19');
const index=JSON.parse(fs.readFileSync('dist/banlists/index.json'));
const preset=(d,id)=>d.banlistVariants?.[id]?{...d,...d.banlistVariants[id]}:d; // what the app plays (app.mjs presetFor)
const check=(d,l)=>validateDeck(d,db,l,{scripts});
// 1. Index: both lists selectable. r25: Kevy made 19 Oct the default (21 Oct, ~22:20 AEDT).
assert.deepEqual(index,{default:'tcg-2026-10-19',lists:['tcg-2026-09-21','tcg-2026-10-19']});
// 2. The 19 Oct file is the 21 Sep file plus exactly Tea's 43 changes (34 Forbidden, 8 Limited, 1 Semi-Limited).
assert.equal(NEW.id,'tcg-2026-10-19');assert.equal(NEW.effective,'2026-10-19');assert.equal(NEW.changes,43);
const maxOf=(l,k)=>l.cards[k]?.max??3,diff={};for(const k of new Set([...Object.keys(OLD.cards),...Object.keys(NEW.cards)])){const a=maxOf(OLD,k),b=maxOf(NEW,k);if(a!==b)diff[NEW.cards[k].name]=(diff[NEW.cards[k].name]??[]).concat([[a,b]])}
const count=t=>Object.values(diff).filter(v=>v[0][1]===t).length;
assert.equal(count(0),34,'34 newly Forbidden');assert.equal(count(1),8,'8 newly Limited');assert.equal(count(2),1,'1 newly Semi-Limited');
for(const n of ['Called by the Grave','Triple Tactics Talent','Crossout Designator','Albion the Branded Dragon','Red-Eyes Dark Dragoon','Cross-Sheep','Number 41: Bagooska the Terribly Tired Tapir','Number 60: Dugares the Timeless'])assert.equal(diff[n]?.[0]?.[1],0,n+' Forbidden');
for(const n of ['Droll & Lock Bird','Branded Opening','Branded in High Spirits','Toon Table of Contents','Toon Bookmark','Griffoh','Superdreadnought Rail Cannon Gustav Max','Perfectron Hydradrive Dragon'])assert.equal(diff[n]?.[0]?.[1],1,n+' Limited');
assert.equal(diff['Sky Striker Mobilize - Engage!'][0][1],2);
assert.deepEqual(diff['Droll & Lock Bird'],[[2,1],[2,1]],'both Droll passcodes keyed (94145021/2)');
assert.equal(NEW.cards['13203964'].effective,'2026-11-11','Perfectron Limited from MAMS release');
for(const [k,e] of Object.entries(OLD.cards))if(!diff[e.name])assert.deepEqual(NEW.cards[k],e,'unchanged entry '+e.name);
// 3. The gate's decks (and every preset's base lists) are byte-for-byte the r21 lists.
const R21={branded:'1cde597960fbf9627d30e7a49f0b5201e2c7d8b57cb4c0a88f288fc23d9a9766',mikanko:'060c3cb4a7be91e40f181dbdab3c58c9282fc4b333562a861df2fd8b8ae540d1',sky:'c7bb3b5c3dd45057a0a9a82389acec45400563b24a94a8725e78358f6b2cccec',luna:'6ca03ee268bdc45cb26d395402752ca54f3d5ce5d827fc348b60e197f7affd79',blueeyes:'09100709b692c72d4a46d1a4660bf17f18f30d7f9bed8c1c93edc732bb334d6e',kashtira:'68f5362cbb5d258bb7712dce663ae5eaa979174d8bdc9debad01c922ab7ef398',toon:'0c8ec18d3e4f311ce01f5267a1f2fc5f7e52ad53236320978fd1345f619f0e66'};
for(const [id,h] of Object.entries(R21)){const d=decks.find(x=>x.id===id);assert.equal(crypto.createHash('sha256').update(JSON.stringify([d.main,d.extra,d.side])).digest('hex'),h,id+' base lists unchanged')}
assert.deepEqual(decks.filter(d=>['branded','luna','sky','mikanko'].includes(d.id)).map(d=>d.id),['branded','mikanko','sky','luna'],'gate deck order unchanged');
assert.deepEqual(decks.map(d=>d.id),['branded','mikanko','sky','luna','blueeyes','kashtira','toon','hero']);
// 4. Under 21 Sep every preset is legal as before; under 19 Oct every preset is legal. r25: Branded uses v5.3 there
//    (Kevy locked it 21 Oct, DARK Springans Kitt); its base list is unchanged and still fails 19 Oct on Tea's 7 cards.
const rows=[];
for(const d of decks){const a=check(preset(d,'tcg-2026-09-21'),OLD),b=check(preset(d,'tcg-2026-10-19'),NEW);rows.push({id:d.id,sep21:a.ok,oct19:b.ok,oct19Errors:b.errors.map(e=>e.code+':'+(e.name??e.id))});
 assert.ok(a.ok,d.id+' legal under 21 Sep: '+JSON.stringify(a.errors));
 assert.ok(b.ok,d.id+' legal under 19 Oct: '+JSON.stringify(b.errors));
 if(d.id==='branded'){const base=check(d,NEW);assert.equal(base.ok,false);assert.deepEqual(base.errors.map(e=>e.name).sort(),['Albion the Branded Dragon','Branded Opening','Branded in High Spirits','Called by the Grave','Droll & Lock Bird','Red-Eyes Dark Dragoon','Triple Tactics Talent']);assert.equal(d.banlistPending,undefined)}}
// The 19 Oct versions are also legal under 21 Sep (so either list can be selected with them).
for(const d of decks)if(d.banlistVariants)assert.ok(check(preset(d,'tcg-2026-10-19'),OLD).ok,d.id+' 19 Oct version legal under 21 Sep');
// 5. Variants: the six non-Branded presets have one, with the 19 Oct stamp; contents match Akiza's final lists by name.
const names=l=>{const m={};for(const id of l){const n=db[id].name;m[n]=(m[n]||0)+1}return m};
const parse=s=>{const m={};for(const p of s.split(';').map(x=>x.trim()).filter(Boolean)){const [,n,name]=p.match(/^(\d+) (.+)$/);m[name]=(m[name]||0)+Number(n)}return m};
for(const id of ['mikanko','sky','luna','blueeyes','kashtira','toon']){const d=decks.find(x=>x.id===id),v=d.banlistVariants?.['tcg-2026-10-19'];assert.ok(v,id+' has a 19 Oct version');
 assert.match(v.format,/^TCG Advanced — 19 October 2026/);assert.equal(v.main.length,d.main.length,id+' keeps its Main size');
 if(finals[id])for(const z of ['main','extra','side'])assert.deepEqual(names(v[z]),parse(finals[id][z]),id+' '+z+' = Akiza final');
 else for(const z of ['main','extra','side'])assert.deepEqual(v[z],d[z],id+' unchanged lists');}
// 5b. r25: Branded's 19 Oct version is Seto's v5.3 exactly (by name), with the DARK Springans Kitt (45484331).
{const {V53}=await import('../tools/build-branded-v53.mjs'),v=decks.find(x=>x.id==='branded').banlistVariants['tcg-2026-10-19'],want=l=>Object.fromEntries(l.map(([n,name])=>[name,n]));
 for(const z of ['main','extra','side'])assert.deepEqual(names(v[z]),want(V53[z]),'branded v5.3 '+z);assert.ok(v.main.includes(45484331)&&!Object.values(db).some(c=>c.name==='Tri-Brigade Springans Kitt'&&v.main.includes(c.code)),'Springans Kitt (DARK)');assert.match(v.format,/^TCG Advanced — 19 October 2026 \(Branded v5\.3/)}
// 6. HERO preset: 40/15/15, the IDs from elemental-hero-preset-ids.json, Akiza's list by name, scripted.
const hero=decks.find(d=>d.id==='hero'),ids=JSON.parse(fs.readFileSync('tests/fixtures/elemental-hero-preset-ids.json'));
assert.equal(hero.name,'HERO — Mask & Vision');assert.deepEqual([hero.main,hero.extra,hero.side],[ids.main,ids.extra,ids.side]);
for(const z of ['main','extra','side'])assert.deepEqual(names(hero[z]),parse(finals.hero[z]),'hero '+z);
assert.equal(check(hero,NEW).warnings.length,0,'no missing scripts or tokens');
// 7. Merged text overrides: 70 passcodes, no conflicts, names match the card data, inputs as hashed.
const ov=JSON.parse(fs.readFileSync('dist/text-overrides-tcg.json'));
assert.equal(Object.keys(ov.cards).length,70);assert.equal(ov._meta.conflicts,0);
assert.deepEqual(ov._meta.inputs.map(i=>i.sha256.slice(0,8)),['bcf821aa','22abff83','ed7dc0c3']);
for(const [k,e] of Object.entries(ov.cards)){assert.ok(db[k],k+' in card data');assert.equal(e.name,db[k].name,k+' name');assert.ok(e.desc.length>20&&/Neuron/.test(e.source))}
// The UI library applies them (display only); the engine data is untouched.
globalThis.onmessage=null;const {applyTextOverrides}=await import('../dist/library-worker.mjs');
const copy=structuredClone(db);assert.equal(applyTextOverrides(copy,ov.cards),70);assert.equal(copy[1948619].desc,ov.cards['1948619'].desc);assert.notEqual(db[1948619].desc,copy[1948619].desc);
assert.equal(applyTextOverrides(copy,{123:{name:'x',desc:'y'},1948619:{name:'Wrong name',desc:'z'}}),0,'unknown codes and name mismatches are skipped');
// 8. App: the banlist comes from banlists/index.json (no hard-coded list), and the choice is remembered per viewer.
const app=fs.readFileSync('dist/app.mjs','utf8');
assert.ok(!app.includes("fetch('banlists/tcg-2026-09-21.json'"));assert.ok(app.includes("fetch('banlists/index.json'"));
assert.match(app,/function presetFor\(d,id\)/);assert.match(app,/try\{localStorage\.setItem\(BANLIST_KEY,id\)\}catch\{\}/);
assert.match(fs.readFileSync('dist/index.html','utf8'),/<select id="banlist">/);
console.log(JSON.stringify({node:process.version,rows}));

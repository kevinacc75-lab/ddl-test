// r49.1 (Claude, 13 Nov 2026; Kevy 00:05 AEDT: "we are missing card art for Gold Sarcophagus"). SELF-VERIFIED until reviewed.
// Every card in every preset deck (all banlist variants) must have art once the library worker has loaded, and the
// art file must exist. Fails on r49: Gold Sarcophagus (75500286) had an image in art/ but no art field in cards.json.gz.
import assert from 'node:assert/strict';import {test} from 'node:test';import fs from 'node:fs';import zlib from 'node:zlib';
const dist=new URL('../dist/',import.meta.url),read=f=>fs.readFileSync(new URL(f,dist));
const src=read('library-worker.mjs').toString().replace(/onmessage=async[^]*$/,'').replace(/^import [^;]*;/m,'');
const mod=await import('data:text/javascript,'+encodeURIComponent(src.replace(/\bfetch\(/g,'(()=>{throw 0})(')));
test('(R49.1-1) after the art additions every preset deck card has art, and each art file ships',()=>{
 const db=JSON.parse(zlib.gunzipSync(read('cards.json.gz')).toString());const add=JSON.parse(read('art-additions.json')).art;
 assert.equal(db['75500286'].art,undefined,'the library itself still lacks it (that is why the addition exists)');
 assert.equal(mod.applyArtAdditions(db,add),1);assert.equal(db['75500286'].art,'art/75500286.jpg');
 const missing=[];for(const d of JSON.parse(read('decks.json')).decks)for(const v of [d,...Object.values(d.banlistVariants||{})])for(const z of ['main','extra','side'])for(const c of v[z]||[]){const a=db[String(c)]?.art;if(!a||!fs.existsSync(new URL(a,dist)))missing.push(d.id+':'+(db[String(c)]?.name||c))}
 assert.deepEqual([...new Set(missing)],[])});
test('(R49.1-2) an addition never replaces existing art and rejects anything but an art/ image path',()=>{
 const db={1:{art:'art/1.jpg'},2:{},3:{},4:{}};assert.equal(mod.applyArtAdditions(db,{1:'art/9.jpg',2:'https://x/y.jpg',3:'art/../x.jpg',4:'art/4.webp'}),1);
 assert.equal(db[1].art,'art/1.jpg');assert.equal(db[2].art,undefined);assert.equal(db[3].art,undefined);assert.equal(db[4].art,'art/4.webp');assert.equal(mod.applyArtAdditions(db,null),0)});

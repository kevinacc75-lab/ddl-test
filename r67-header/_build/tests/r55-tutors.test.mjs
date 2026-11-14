// r55 Learn tutors (Claude, 13 Nov 2026). Kevy 16:09 approved ChatGPT's four tutors with a picker; 16:20 "retire lawpri or
// put in archive"; 16:22 use the official card art. SELF-VERIFIED until reviewed (Seto team to check the integration).
import assert from 'node:assert/strict';import {test} from 'node:test';import fs from 'node:fs';import {gunzipSync} from 'node:zlib';
import {TUTORS,MOODS,FRAMES,guideSVG,guideValues,getTutor,getSelectedTutor,selectTutor,guideName,STORAGE_KEY} from '../dist/learn/tutors.mjs';
const db=JSON.parse(gunzipSync(fs.readFileSync(new URL('../dist/cards.json.gz',import.meta.url))));
const read=f=>fs.readFileSync(new URL('../dist/'+f,import.meta.url),'utf8');
const webpSize=f=>{const b=fs.readFileSync(new URL('../dist/learn/tutors/'+f,import.meta.url));assert.equal(b.toString('latin1',0,4),'RIFF');assert.equal(b.toString('latin1',8,12),'WEBP');const t=b.toString('latin1',12,16);
 if(t==='VP8X')return [1+b.readUIntLE(24,3),1+b.readUIntLE(27,3)];if(t==='VP8L'){const v=b.readUInt32LE(21);return [1+(v&0x3fff),1+((v>>14)&0x3fff)]}return [b.readUInt16LE(26)&0x3fff,b.readUInt16LE(28)&0x3fff]};
test('(R55-T1) four tutors, each tied to its real card, with atlas and card art shipped',()=>{
 assert.deepEqual(TUTORS.map(t=>t.id),['dmg','harpie','burstinatrix','ash']);
 for(const t of TUTORS){assert.equal(db[t.code].name,t.name,t.id);assert.deepEqual(webpSize(t.atlas),[1774,887],t.atlas);assert.deepEqual(webpSize('card-'+t.code+'.webp'),[240,240])}
});
test('(R55-T2) every tutor draws all seven moods from its own atlas cell; neutral blinks; unknown moods fall back',()=>{
 assert.deepEqual(MOODS,['neutral','thinking','legal','notlegal','surprised','proud','unsure']);
 for(const t of TUTORS)for(const m of MOODS){const s=guideSVG(m,{tutor:t.id});const f=FRAMES[m];
  assert.match(s,new RegExp(`data-tutor="${t.id}" data-mood="${m}"`));assert.ok(s.includes(`viewBox="${f%4} ${Math.floor(f/4)} 1 1"`),t.id+' '+m);assert.ok(s.includes(t.atlas));assert.equal(s.includes('class="dmg-blink"'),m==='neutral')}
 assert.equal(guideValues('nope').mood,'neutral');assert.match(guideSVG('proud',{motion:false}),/data-motion="off"/);
 assert.match(guideSVG('neutral'),/prefers-reduced-motion:reduce/);
});
test('(R55-T3) default is Dark Magician Girl; only registry ids can be picked; storage failure still picks for the session',()=>{
 assert.equal(getSelectedTutor().id,'dmg');assert.equal(guideName(),'Dark Magician Girl');assert.equal(getTutor('lapawri').id,'dmg');
 assert.throws(()=>selectTutor('lapawri'),RangeError);
 const r=selectTutor('ash');assert.equal(r.persisted,false,'no localStorage in node');assert.equal(guideName(),'Ash Blossom');selectTutor('dmg',{persist:false});
 assert.equal(STORAGE_KEY,'ddl-r55-tutor');
});
test('(R55-T4) wiring: Learn and the coach draw the picked tutor, Lapawri is archived not offered, offline list and credits',()=>{
 const l=read('learn/learn.mjs'),c=read('learn/coach.mjs');
 assert.match(l,/from '\.\/tutors\.mjs'/);assert.doesNotMatch(l,/from '\.\/guide\.mjs'/);assert.match(c,/import \{guideSVG\} from '\.\/tutors\.mjs'/);
 assert.match(l,/data-tutor="\$\{t\.id\}" aria-pressed=/);assert.match(l,/if\(t\.dataset\.tutor\)\{const r=selectTutor\(t\.dataset\.tutor\)/);
 assert.ok(fs.existsSync(new URL('../dist/learn/guide.mjs',import.meta.url)),'Lapawri kept in the archive');
 const a=JSON.parse(read('offline-assets.json'));for(const f of ['./learn/tutors.mjs',...TUTORS.flatMap(t=>['./learn/tutors/'+t.atlas,'./learn/tutors/card-'+t.code+'.webp'])])assert.ok(a.includes(f),f);
 assert.match(read('learn/tutors.mjs'),/ChatGPT's "Duel Lab Chibi Tutors v0\.2"/);
});

// r22 (Claude, 21 Oct): the 27 effect-highlight clauses (and 4 shared-activation excerpts) for cards whose UI text is
// the TCG override text now quote that text, so the highlighted clause is found in the card text shown above it. The
// duel worker, which keeps the Lab card text, still gets the Lab clauses.
import assert from 'node:assert/strict';import fs from 'node:fs';import {gunzipSync} from 'node:zlib';
import {effectFocus} from '../dist/effect-focus.mjs';import {EFFECT_CLAUSES} from '../dist/effect-clauses.mjs';import {EFFECT_CLAUSES_TCG,PRESENTATION_EXCERPTS_TCG} from '../dist/effect-clauses-tcg.mjs';
globalThis.onmessage=null;const {applyTextOverrides}=await import('../dist/library-worker.mjs');
const lab=JSON.parse(gunzipSync(fs.readFileSync('dist/cards.json.gz'))),ui=structuredClone(lab);applyTextOverrides(ui,JSON.parse(fs.readFileSync('dist/text-overrides-tcg.json')).cards);
const desc=(code,key)=>key==='zero'?0n:(BigInt(code)<<20n)|BigInt(key);
let n=0;for(const [code,keys] of Object.entries(EFFECT_CLAUSES_TCG))for(const [key,tcg] of Object.entries(keys)){n++;
 const u=effectFocus(Number(code),desc(code,key),ui),w=effectFocus(Number(code),desc(code,key),lab);
 assert.ok(ui[code].desc.includes(tcg),code+':'+key+' TCG clause is in the TCG text');
 assert.equal(u.excerpt,tcg,code+':'+key+' UI excerpt is the TCG clause');
 assert.ok(!lab[code].desc.includes(tcg)||lab[code].desc.includes(EFFECT_CLAUSES[code][key]),'lab text');
 assert.ok(lab[code].desc.includes(EFFECT_CLAUSES[code][key]),code+':'+key+' worker keeps the Lab clause');
 assert.ok(w.excerpt===null||lab[code].desc.includes(w.excerpt)||lab[code].desc.includes(w.excerpt.replace(/^.*?[;:]\s*/s,'')),code+':'+key+' worker excerpt is Lab text')}
assert.equal(n,27,'27 clauses');
for(const [k,tcg] of Object.entries(PRESENTATION_EXCERPTS_TCG)){const [code,d]=k.split(':');const u=effectFocus(Number(code),BigInt(d),ui);assert.equal(u.excerpt,tcg,k+' presentation excerpt uses the TCG wording')}
assert.equal(Object.keys(PRESENTATION_EXCERPTS_TCG).length,4);
console.log(JSON.stringify({clauses:n,presentation:4,ok:true}));

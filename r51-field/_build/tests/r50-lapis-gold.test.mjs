// r50 (Claude, 13 Nov 2026; Kevy 07:13 AEDT "Go ahead and import the Egyptian style"). SELF-VERIFIED until reviewed.
// The look is colours, fonts and card backs only: no layout sizes, no positions, no script, and it only applies with data-look=egypt.
import assert from 'node:assert/strict';import {test} from 'node:test';import fs from 'node:fs';import {createHash} from 'node:crypto';
const read=f=>fs.readFileSync(new URL('../dist/'+f,import.meta.url),'utf8');
test('(R50-1) every rule is scoped to the egypt look and sets no size or position',()=>{
 const css=read('css/r50-egypt.css').replace(/\/\*[^]*?\*\//g,'');
 const rules=[...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)];assert.ok(rules.length>40);
 for(const [,sel,body] of rules){const s=sel.trim();if(s==='@font-face')continue;
  for(const part of s.split(/,(?![^()]*\))/))assert.match(part,/data-look=egypt/,'unscoped selector: '+part.trim());
  assert.doesNotMatch(body,/(^|;|\s)(width|height|min-height|max-width|top|left|right|bottom|position|display:(?!none)|transform|margin|padding|inset|grid|flex)\s*:/,'layout property in '+s.slice(0,80))}
 assert.doesNotMatch(css,/@import|expression\(|javascript:/i);
 for(const u of css.matchAll(/url\(([^)]*)\)/g))assert.match(u[1],/^("data:image\/svg\+xml,|'\.\.\/fonts\/cinzel-(700|900)\.woff2')/,'only the bundled fonts and an inline SVG card back')});
test('(R50-2) Cinzel ships with its licence and is listed for offline use; the default migrates once from Aurora only',()=>{
 for(const f of ['fonts/cinzel-700.woff2','fonts/cinzel-900.woff2','licenses/cinzel-OFL.txt'])assert.ok(fs.existsSync(new URL('../dist/'+f,import.meta.url)),f);
 assert.match(read('licenses/cinzel-OFL.txt'),/SIL Open Font License, Version 1\.1/);
 const off=read('offline-assets.json');for(const f of ['./css/r50-egypt.css','./fonts/cinzel-700.woff2','./fonts/cinzel-900.woff2','./licenses/cinzel-OFL.txt'])assert.ok(off.includes('"'+f+'"'),f);
 const app=read('app.mjs');assert.ok(app.includes("if(!preferences.egyptIntro){preferences.egyptIntro=1;if(!preferences.theme||preferences.theme==='aurora')preferences.theme='egypt'}"));
 assert.ok(app.includes("if(preferences.theme==='egypt')document.body.dataset.look='egypt';else delete document.body.dataset.look;"))});
test('(R50-3) chain setting wording changed, values and behaviour unchanged; flow files unchanged',()=>{
 const p=read('play-comfort.mjs');assert.ok(p.includes("CHAIN_LABEL={auto:'Chain: Ask me',turn:'Chain: Pass this turn',off:'Chain: Pass optional'}"));assert.ok(p.includes("const KEY='ddl-r48-play-comfort',CHAIN=['auto','turn','off']"));
 const pins=JSON.parse(fs.readFileSync(new URL('./fixtures/r49_1-flow-sha256.json',import.meta.url),'utf8'));assert.equal(Object.keys(pins).length,7);
 for(const [f,h] of Object.entries(pins))assert.equal(createHash('sha256').update(fs.readFileSync(new URL('../dist/'+f,import.meta.url))).digest('hex'),h,f+' unchanged from r49.1')});

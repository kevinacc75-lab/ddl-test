// r43 P1 visual-system checks (Kevy 10 Nov 2026 23:50 AEDT: Aurora default, bright field, decorative art original, P1 first).
// Presentation only: these tests pin that nothing outside the shell/CSS/emblem layer changed versus r42.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
const dist=f=>new URL('../dist/'+f,import.meta.url);
const read=f=>fs.readFileSync(dist(f),'utf8');
const sha=f=>crypto.createHash('sha256').update(fs.readFileSync(dist(f))).digest('hex');
const r42=JSON.parse(fs.readFileSync(new URL('./fixtures/r42-served-hashes.json',import.meta.url)));
const LEGACY=['style','arena','mobile-motion','vibrant','master-duel','lab-shell','pacing-impact','arenas','showtime','fusion-materials','summon-cutscenes','coin-cutscene','human-flow','play-flow','fx-r23','token-fx','r26-panels','learning-routes','deck-list','r33-polish','r34-arena','r34-persona','dl-fx'];
const ALLOWED_CHANGED=['app.mjs','deck-list.mjs','decks.json','index.html','offline-assets.json','release-notes.md','sw.js','worker.mjs'].sort();

test('(R43-1) only shell/presentation files differ from r42; engine, AI, rules, prompt timing, decks logic and every legacy stylesheet are byte-identical',()=>{
 const changed=Object.keys(r42).filter(f=>sha(f)!==r42[f]).sort();
 assert.deepEqual(changed,ALLOWED_CHANGED);
 for(const f of Object.keys(r42))assert.ok(fs.existsSync(dist(f)),'r42 file missing: '+f);
 for(const f of ['human-flow.mjs','play-flow.mjs','human-holds.mjs','presentation.mjs','duel.mjs','random.mjs','deck-validator.mjs','windbot/edo.mjs','optimal-pilot.mjs','pilot.mjs','cards.json.gz','scripts.json.gz','dl-fx.mjs','coin-cutscene.mjs'])assert.equal(sha(f),r42[f],f);
 for(const f of Object.keys(r42).filter(f=>/^(ai|core|windbot|wb|art|banlists|audio)\//.test(f)))assert.equal(sha(f),r42[f],f);
 for(const n of LEGACY)assert.equal(sha(n+'.css'),r42[n+'.css'],n+'.css kept unchanged for comparison');
});
test('(R43-2) worker.mjs differs from r42 only in the BUILD identity line',()=>{
 const a=read('worker.mjs').split('\n'),b=fs.readFileSync('/workspace/r42-build/dist/worker.mjs','utf8').split('\n');
 assert.equal(a.length,b.length);const diff=a.map((l,i)=>l===b[i]?null:i).filter(i=>i!==null);assert.equal(diff.length,1);assert.match(a[diff[0]],/^const BUILD='ddl-test r44 Aurora boss art on r43 Aurora P1 /);
});
test('(R43-3) decks.json: only the Branded description text changed; every list is identical to r42',()=>{
 const a=JSON.parse(read('decks.json')),b=JSON.parse(fs.readFileSync('/workspace/r42-build/dist/decks.json','utf8'));
 assert.equal(a.decks.length,b.decks.length);
 const strip=d=>{const c=structuredClone(d);delete c.subtitle;for(const v of Object.values(c.banlistVariants||{}))delete v.subtitle;return c};
 assert.deepEqual(a.decks.map(strip),b.decks.map(strip));
 const br=a.decks.find(d=>d.id==='branded');assert.match(br.subtitle,/Alba-Lenatus the Abyss Dragon and Albion the Sanctifire Dragon/);assert.doesNotMatch(JSON.stringify(a),/for Aeon \+ Dark Dragon/);
});
test('(R43-4) the 7 bundles reproduce the 23 r42 sheets in the same order (only url rebasing and the listed, scan-proven !important drops)',()=>{
 const html=read('index.html');const links=[...html.matchAll(/<link rel="stylesheet" href="([^"]+)">/g)].map(m=>m[1]);
 assert.deepEqual(links,['./css/tokens.css','./css/base.css','./css/theme-showtime.css','./css/duel.css','./css/panels.css','./css/fx.css','./css/aurora.css']);
 const before={};for(const b of ['base','theme-showtime','duel','panels','fx'])before[b]=read('css/'+b+'.css');
 const tmp=fs.mkdtempSync('/tmp/r43css-');fs.cpSync(new URL('../dist/',import.meta.url),tmp,{recursive:true,filter:s=>!/\/(art|audio|ai|core|windbot|wb)(\/|$)/.test(s)});
 execFileSync(process.execPath,[new URL('../tools/build-css.mjs',import.meta.url).pathname,tmp],{stdio:'pipe'});
 for(const b of Object.keys(before))assert.equal(fs.readFileSync(tmp+'/css/'+b+'.css','utf8'),before[b],b+'.css is reproducible');
 const order=Object.keys(before).flatMap(b=>[...before[b].matchAll(/==== ([\w-]+)\.css/g)].map(m=>m[1]));assert.deepEqual(order,LEGACY);
 const norm=s=>s.replace(/\s*!important/g,'').replace(/url\((['"]?)\.\.\//g,'url($1');
 for(const n of LEGACY){const src=read(n+'.css');const part=Object.values(before).join('\n').split('==== '+n+'.css')[1].split(/\/\* ==== /)[0].replace(/^[^\n]*\n/,'');assert.equal(norm(part).trim(),norm(src).trim(),n)}
 const safe=JSON.parse(fs.readFileSync(new URL('../tools/data/important-safe.json',import.meta.url)));const total=LEGACY.reduce((a,n)=>a+(read(n+'.css').replace(/\/\*[\s\S]*?\*\//g,'').match(/!important/g)||[]).length,0);
 const shipped=Object.values(before).reduce((a,s)=>a+(s.replace(/\/\*[\s\S]*?\*\//g,'').match(/!important/g)||[]).length,0);assert.equal(total-shipped,safe.length);
});
test('(R43-5) tokens: type 12/14/16/20/28/40, radius 8/14/20, motion 120/220/400 ms; Aurora is the default and every theme stays selectable',()=>{
 const t=read('css/tokens.css');for(const v of [12,14,16,20,28,40])assert.match(t,new RegExp(`--ddl-fs-${v}:${v}px`));
 for(const [k,v] of [['sm',8],['md',14],['lg',20]])assert.match(t,new RegExp(`--ddl-r-${k}:${v}px`));for(const [k,v] of [['fast',120],['mid',220],['slow',400]])assert.match(t,new RegExp(`--ddl-dur-${k}:${v}ms`));
 const html=read('index.html');assert.match(html,/<body data-theme="aurora">/);
 for(const id of ['visual-theme','controls-theme']){const sel=html.match(new RegExp(`<select id="${id}">(.*?)</select>`))[1];assert.deepEqual([...sel.matchAll(/value="(\w+)"/g)].map(m=>m[1]),['aurora','vibrant','classic','contrast','showtime'])}
 const app=read('app.mjs');assert.match(app,/theme:'aurora',preset:'duel'/);assert.match(app,/\['aurora','vibrant','classic','contrast','showtime'\]\.includes\(preferences\.theme\)\?preferences\.theme:'aurora'/);
 assert.ok(read('css/aurora.css').startsWith('/* Aurora (default theme)'));
});
test('(R43-6, r44 scope) decorative art is original: hero, LP avatars, victory frame; deck tiles use boss card art; card images stay on cards',()=>{
 const html=read('index.html');assert.doesNotMatch(html.match(/<div class="hero-art">.*?<\/div>/)[0],/art\//);assert.match(html,/emblems\/home-crest\.svg/);
 const app=read('app.mjs');/* r44: deck select tiles now use the boss card art (Kevy 11 Nov 01:48 AEDT); emblem is the fallback only */assert.match(app,/\$\{bossBg\(d\)\}>\$\{bossTile\(d\)\}/);assert.match(app,/const bossTile=d=>bossArt\(d\)\?`<img class="deck-boss"[^`]*`:emblem\(d\)/);assert.match(app,/avatar\.src=emblemSrc\(theme\)/);assert.match(app,/setProperty\('--boss-art','none'\)/);
 assert.match(read('css/aurora.css'),/#victory-scene \.victory-art-frame #victory-art\{opacity:0\}/);
 for(const f of fs.readdirSync(dist('emblems'))){const s=read('emblems/'+f);assert.match(s,/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);assert.doesNotMatch(s,/<image|href=|url\(http|\.jpg|\.png/i,f)}
 assert.match(read('deck-list.mjs'),/<img src="\$\{esc\(c\.art\)\}" alt="\$\{esc\(name\)\}"/);
});
test('(R43-7) header: release string moved into Help · About; FX settings popover clamp is presentation-only',()=>{
 const html=read('index.html');assert.doesNotMatch(html,/<span class="release">TEST r42/);assert.match(html,/<span class="release test-badge"[^>]*>TEST r44<\/span>/);
 assert.match(read('app.mjs'),/<p class="about-build" id="about-build"><b>About this build:<\/b> TEST r44/);
 const ui=read('ui-polish.mjs').replace(/^\/\/.*$/mg,'');assert.doesNotMatch(ui,/import |postMessage|Worker|Math\.random|setTimeout|setInterval|duel|respond/);assert.match(ui,/setProperty\('--pop-shift'/);
 assert.match(html,/<script type="module" src="ui-polish\.mjs"><\/script><\/body>/);
});
test('(R43-8) offline manifest lists every new file and every listed file exists; sw cache renamed',()=>{
 const off=JSON.parse(read('offline-assets.json'));for(const f of ['./css/tokens.css','./css/base.css','./css/theme-showtime.css','./css/duel.css','./css/panels.css','./css/fx.css','./css/aurora.css','./ui-polish.mjs','./emblems/home-crest.svg','./emblems/branded.svg','./emblems/custom.svg'])assert.ok(off.includes(f),f);
 for(const f of off)if(f!=='./')assert.ok(fs.existsSync(dist(f.slice(2))),'missing '+f);
 assert.match(read('sw.js'),/CACHE=CACHE_PREFIX\+'2026-11-11-r44-aurora-boss-art'/);
});

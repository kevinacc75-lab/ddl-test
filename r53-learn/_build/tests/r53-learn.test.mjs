// r53 Learning mode (Claude, 13 Nov 2026). SELF-VERIFIED until reviewed. Content checks for the Ruling Desk data and the
// Guide; engine outcomes are in r53-lessons-engine.test.mjs.
import assert from 'node:assert/strict';import {test} from 'node:test';import fs from 'node:fs';import {gunzipSync} from 'node:zlib';
import {LESSONS,CARDS,VERDICTS} from '../dist/learn/lessons.mjs';
import {guideSVG,MOODS} from '../dist/learn/guide.mjs';
import {boardHTML,textHTML,queueAdd,FAILSAFE,REVIEW,GUIDE_NAME} from '../dist/learn/learn.mjs';
const db=JSON.parse(gunzipSync(fs.readFileSync(new URL('../dist/cards.json.gz',import.meta.url))));
test('(R53-1) every quoted card text is the exact bundled text, and every highlight is inside it',()=>{
 for(const [code,c] of Object.entries(CARDS)){assert.equal(db[code].name,c.name,code);if(c.text)assert.equal(c.text,db[code].desc,c.name);assert.ok(fs.existsSync(new URL('../dist/'+c.art,import.meta.url)),c.art);assert.ok(Number.isInteger(c.cid),c.name+' cid')}
 for(const l of LESSONS)for(const b of l.beats)if(b.text){assert.ok(CARDS[b.text.code].text.includes(b.text.hl),l.id+': '+b.text.hl);assert.match(textHTML(b.text),/<mark>/)}
});
test('(R53-2) bubbles stay short, verdicts come from the reviewed enum (with summon_negated), rulings <= 50 words with sources',()=>{
 assert.ok(VERDICTS.includes('summon_negated'));
 for(const l of LESSONS){assert.ok(l.ruling.split(/\s+/).length<=50,l.id);assert.ok(l.sources.length>=2&&l.sources.every(s=>/^https:\/\//.test(s.url)),l.id);
  for(const b of l.beats){assert.ok(b.say.length<=140,l.id+': '+b.say);assert.ok(VERDICTS.includes(b.verdict),b.verdict);assert.ok(MOODS.includes(b.mood),b.mood)}}
});
test('(R53-3) the Seto-team fixes are in (RELAY-180)',()=>{
 const all=LESSONS.flatMap(l=>l.beats.map(b=>b.say+' '+(b.caption||''))).join('\n');
 assert.match(all,/Normal Summoning Ghost Belle is legal here\. But it fills a Main Monster Zone, and Engage needs those empty\./);
 assert.match(all,/This is a zone demonstration, not the usual opening/);
 assert.match(all,/You control no monsters, so Fenrir can use its own Special Summon procedure\./);
 assert.match(all,/Tenki was activated as Chain Link 1/);
 assert.doesNotMatch(all,/every Sky Striker Spell|all Sky Striker Spells/i,'the empty-zone condition is not widened');
 assert.ok(LESSONS[0].sources.some(s=>/2021_rules_update/.test(s.url)),'2021 rules update cited for zones');
});
test('(R53-4) two separate trust badges; rules stay pending; fail-safe wording never claims a save that failed',()=>{
 assert.equal(REVIEW.status,'pending');assert.match(REVIEW.authored,/pending Seto\/team fact check/);
 assert.equal(queueAdd({lesson:'RD-001'},()=>false),null);assert.match(FAILSAFE.failed,/couldn’t save/);
 const src=fs.readFileSync(new URL('../dist/learn/learn.mjs',import.meta.url),'utf8');assert.match(src,/toast\(ok\?FAILSAFE\.saved:FAILSAFE\.failed\)/);
 assert.match(src,/Engine outcome reproduced/);assert.match(src,/REVIEW\.label/);assert.doesNotMatch(src,/>\s*Verified\s*</i,'no single "verified" stamp');
 assert.equal(GUIDE_NAME,'Guide');
});
test('(R53-5) the Guide draws every mood with its own ids; boards render zones, chain and stamps',()=>{
 const a=guideSVG('legal'),b=guideSVG('legal');assert.notEqual(a.match(/id="(g\d+)-gold"/)[1],b.match(/id="(g\d+)-gold"/)[1]);
 for(const m of MOODS)assert.match(guideSVG(m),/^<svg[^]*<\/svg>$/);
 const h=boardHTML({mmz:[null,null,73642296,null,null],emz:63288573,hand:[63166095],off:[63166095],chain:[{code:57103969,who:'you'},{code:14558127,who:'opp'}],resolving:1,stamp:{text:'SEARCH NEGATED',kind:'bad'}});
 assert.match(h,/EXTRA MONSTER ZONE/);assert.match(h,/lr-card off/);assert.match(h,/lr-link opp resolving/);assert.match(h,/SEARCH NEGATED/);
});

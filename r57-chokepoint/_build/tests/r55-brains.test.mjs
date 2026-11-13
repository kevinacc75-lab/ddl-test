// r55 deck brains v1.1 (Claude, 13 Nov 2026): the Seto team's RELAY-179 fixes and ChatGPT's RELAY-185 deltas that the
// book format can express. SELF-VERIFIED until the team re-checks.
import assert from 'node:assert/strict';import {test} from 'node:test';import fs from 'node:fs';
import toon from '../dist/ai/book/toon-lines.mjs';import hero from '../dist/ai/book/hero-lines.mjs';import mik from '../dist/ai/book/mikanko-lines.mjs';import kas from '../dist/ai/book/kashtira-lines.mjs';
const read=f=>fs.readFileSync(new URL('../dist/'+f,import.meta.url),'utf8');
test('(R55-1) Toon: Dark Magician searches Toon Terror with nothing to banish; Deck-summon picks never take Harpie',()=>{
 assert.ok(toon.options.some(o=>o.source==='Toon Dark Magician'&&o.match==='Spell/Trap'&&o.ifOppNoFaceUp));
 const s=toon.picks.find(p=>p.source==='Toon Dark Magician'&&p.hint[0]===509);assert.deepEqual(s.prefer.slice(0,2),['Toon Black Luster Soldier','Red-Eyes Toon Dragon']);assert.ok(!s.prefer.includes('Toon Harpie Lady'));
 assert.equal(toon.picks.find(p=>p.source==='Toon Dark Magician'&&p.hint[0]===506).prefer[0],'Toon Terror');
 assert.match(read('ai/brain/toon-brain.mjs'),/by a card effect only, not battle, banish, bounce or control loss/);
});
test('(R55-2) HERO: Infernal Rage Tributes for Sunrise by default',()=>{assert.equal(hero.picks.find(p=>p.source==='Elemental HERO Flame Wingman - Infernal Rage').prefer[0],'Elemental HERO Sunrise')});
test('(R55-3) Mikanko first turn: Fire Dance held -> Sanaki; otherwise Noble Twins',()=>{
 const f=mik.picks.filter(p=>p.source==='Ohime the Manifested Mikanko'&&p.ifFirst&&p.hint[0]===506);assert.deepEqual(f[0].ifHand,['Mikanko Fire Dance']);assert.equal(f[0].prefer[0],'Sanaki the Mikanko Devotee');assert.equal(f[1].prefer[0],'Mikanko Shinbu - Noble Twins');
});
test('(R55-4) Kashtira: Riseheart-led opening only when no free Level 7 is in hand',()=>{
 const l=kas.lines.find(x=>x.id==='KA-RISE');assert.deepEqual(l.when.notHand,['Kashtira Fenrir','Kashtira Unicorn','Kashtira Ogre']);assert.deepEqual(l.steps.slice(0,2).map(s=>s.do+':'+s.card),['summon:Kashtira Riseheart','activate:Kashtira Riseheart']);
 assert.ok(kas.lines.indexOf(l)<kas.lines.findIndex(x=>x.id==='K-01'));
});
test('(R55-5) Time Typhoon: no "either result unlocks Exceed"; the Exceed reason only on our Main Phase; Fisherman not a held interruption',()=>{
 const p=read('ai/book/dtw-plan.mjs');assert.doesNotMatch(p.replace(/r55 \(Alexis RELAY-179 D-1a DROP[^]*?unlocks nothing; a replacement that prevents all destruction too\./,''),/either result destroys a monster/);
 assert.match(p,/if\(exceedReady&&d\.active===seat&&\(d\.phase===MAIN1\|\|d\.phase===MAIN2\)\)return true;/);
 assert.match(p,/if\(n==='Fisherman of Legend'\)return 50;/);assert.match(read('ai/brain/dtw-brain.mjs'),/'Fisherman of Legend': \{role: 'utility'/);
});

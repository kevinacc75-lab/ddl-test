// r36 Time Typhoon identity proof (Claude, 29 Oct 2026; Seto 11:24 verification plan items 3 and 5). SELF-VERIFIED.
// Adding the deck must not change anything any existing card or deck uses:
//  1 cards.json / scripts.json / decks.json: removing exactly the r36 additions gives the r35.6 files byte for byte
//    (sha256 of the decompressed JSON as published in r35.6, a96066b). So no existing entry changed or vanished.
//  2 Every shared script (utility, proc_*, constants, lab_*) and every existing c*.lua is in that byte-identical set.
//  3 The new scripts define CARD_DARK_TIME_WIZARD only as a LOCAL (no new global, no shared-file change), and each new
//    script minus its 1-2 line header is byte-identical to its pinned upstream copy (tools/data/r36-betb-sources.json).
//  4 Every card in the new deck has art (file present) and is in the deck-list viewer data (dist/deck-cards.json);
//    every card in the new deck exists, has a script where it needs one, and the list is legal on tcg-2026-10-19
//    (counts per name across Main + Extra + Side, Forbidden / Limited / Semi-Limited).
import assert from 'node:assert/strict';import fs from 'node:fs';import crypto from 'node:crypto';import {gunzipSync} from 'node:zlib';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const R35_6={cards:'54fd7a45e8805ca61ae2170f16bfe131b36df23e6e010654a3103028109078e3',scripts:'b44a3e3da7ffc9f0aaae2b8578efb77f1f08af1dbac19b9abbfca2a5cb841f80',decks:'65a53dde6059bd4ca17bf0986413e5ff25eb1ca10117762b2f33312346f0fb55'};
const NEW=[40235813,77482666,4881365,3129527,76630812,65118318,2606417,76660178,17242022,79791695,40275470],TOKENS=[3129528];
const NEW_NOTES=['40235813','77482666','4881365','76660178','3129527','76630812','65118318','2606417','17242022','79791695'];
const ser=o=>JSON.stringify(o);
// 1 + 2
const cards=JSON.parse(gunzipSync(fs.readFileSync('dist/cards.json.gz'))),scripts=JSON.parse(gunzipSync(fs.readFileSync('dist/scripts.json.gz'))),decks=JSON.parse(fs.readFileSync('dist/decks.json','utf8'));
// r36 art (Kevy 14:29 "Missing card arts"): 21 cards already in the database got a display-only 'art' path; that key is the
// only change to those entries, so removing it (and the 12 added cards) must give r35.6 byte for byte.
const ART_ADDED=[80538047,54143349,92248362,28642461,91025875,67115133,5318639,80181649,53792930,92221402,84211599,4423206,71068247,71166481,27420823,67515699,90303227,34876719,61374414,49456901,59438930];
{const c={...cards};for(const i of [...NEW,...TOKENS]){assert.ok(c[i],'added card '+i);delete c[i]}
 for(const i of ART_ADDED){assert.equal(c[i].art,'art/'+i+'.jpg','art path '+i);assert.ok(fs.existsSync('dist/art/'+i+'.jpg'),'art file '+i);const {art,...rest}=c[i];c[i]=rest}
 assert.equal(sha(ser(c)),R35_6.cards,'cards.json minus the 12 additions and the 21 art paths = r35.6 byte for byte')}
{const s={...scripts};for(const i of NEW){assert.ok(s['c'+i+'.lua'],'added script '+i);delete s['c'+i+'.lua']}assert.equal(sha(ser(s)),R35_6.scripts,'scripts.json minus the 11 additions = r35.6 byte for byte (every shared and existing script unchanged)')}
{const d=JSON.parse(JSON.stringify(decks));assert.equal(d.decks.at(-1).id,'dtw','the new deck is appended last');d.decks.pop();for(const k of NEW_NOTES){assert.ok(d.notes[k],'note '+k);delete d.notes[k]}
 assert.equal(sha(ser(d)),R35_6.decks,'decks.json minus the new deck and its 10 card notes = r35.6 byte for byte')}
// 3
const pins=JSON.parse(fs.readFileSync('tools/data/r36-betb-sources.json','utf8'));
for(const i of NEW){const src=scripts['c'+i+'.lua'],lines=src.split('\n');
 assert.match(lines[0],/^-- r36 DDL: ProjectIgnis CardScripts [0-9a-f]{12} official\/c\d+\.lua/,'header '+i);
 const uses=/CARD_DARK_TIME_WIZARD/.test(lines.slice(1).join('\n'));
 if(uses){assert.match(lines[1],/^local CARD_DARK_TIME_WIZARD=40235813 /,'local constant '+i);assert.ok(!/^\s*CARD_DARK_TIME_WIZARD\s*=/m.test(src),'no global assignment '+i)}
 const p=pins.cardscripts.scripts['c'+i+'.lua'];assert.ok(p,'pinned '+i);assert.equal(sha(Buffer.from(src)),p.bundledSha256,'bundled script hash '+i);assert.equal(p.bundledMinusHeaderEqualsUpstream,true,'unchanged below the header '+i)}
for(const [k,v] of Object.entries(scripts))if(!/^c\d+\.lua$/.test(k))assert.ok(!/CARD_DARK_TIME_WIZARD/.test(v),'no shared script mentions CARD_DARK_TIME_WIZARD: '+k);
assert.equal(cards[79791695].name,'CXyz Hope Chaos Barian Dragon','official TCG name (Tea/Seto 29 Oct)');
// 4
const bl=JSON.parse(fs.readFileSync('dist/banlists/tcg-2026-10-19.json','utf8')).cards,dtw=decks.decks.find(x=>x.id==='dtw'),v=dtw.banlistVariants['tcg-2026-10-19'];
assert.deepEqual([v.main.length,v.extra.length,v.side.length],[40,15,15],'40 / 15 / 15');
const count=new Map();for(const id of [...v.main,...v.extra,...v.side]){const c=cards[id];assert.ok(c,'card exists '+id);if(c.type&(32|2|4|16777216))assert.ok(scripts['c'+(c.alias||id)+'.lua']||scripts['c'+id+'.lua'],'script for '+c.name);const base=String(c.alias||id);count.set(base,(count.get(base)||0)+1)}
for(const id of new Set([...v.main,...v.extra,...v.side]))assert.ok(cards[id].art&&fs.existsSync('dist/'+cards[id].art),'art for '+cards[id].name+' (Kevy 14:29: missing card arts)');
{const dc=JSON.parse(fs.readFileSync('dist/deck-cards.json','utf8')).cards;for(const id of new Set([...v.main,...v.extra,...v.side]))assert.ok(dc[id]?.art,'deck-list viewer data has '+cards[id].name)}
for(const [id,n] of count){const lim=bl[id]?.max??3;assert.ok(n<=lim,cards[id].name+': '+n+' copies, limit '+lim)}
console.log(JSON.stringify({test:'r36-dtw-identity',pass:true,node:process.version,added:{cards:NEW.length+TOKENS.length,scripts:NEW.length},distinctNames:count.size}));

// r22.1 (art only): every card in every preset, including the 19 Oct 2026 preset versions, has artwork on disk;
// the offline asset list and dist/art agree. Same check as engine.test.mjs "Missing artwork", widened to banlistVariants.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {gunzipSync} from 'node:zlib';
const db=JSON.parse(gunzipSync(fs.readFileSync('dist/cards.json.gz'))),decks=JSON.parse(fs.readFileSync('dist/decks.json')).decks;
let checked=0;
for(const deck of decks)for(const v of [deck,...Object.values(deck.banlistVariants||{})])
 for(const id of new Set([...(v.main||[]),...(v.extra||[]),...(v.side||[])])){checked++;
  assert.ok(db[id]?.art&&fs.existsSync('dist/'+db[id].art),'Missing artwork '+id+' ('+deck.id+')')}
const assets=JSON.parse(fs.readFileSync('dist/offline-assets.json'));
for(const a of assets)if(a!=='./')assert.ok(fs.existsSync('dist/'+a.slice(2)),'offline asset missing on disk: '+a);
for(const f of fs.readdirSync('dist/art'))assert.ok(assets.includes('./art/'+f),'art file not precached: '+f);
// Neos (89943723) was the first failure Seto saw on r21c.
assert.equal(db[89943723].art,'art/89943723.jpg');
console.log(JSON.stringify({test:'r22-1-artwork',pass:true,checked,artFiles:fs.readdirSync('dist/art').length}));

// r33 (Claude, 23 Oct; Kevy 22 Oct 23:29: "when selecting a deck maybe we can include an option to view the deck list so
// the user can see which cards are in the deck. Will also make it better for me for irl deck building").
// Builds dist/deck-cards.json: the few fields the deck-list viewer needs (name, frame, level, ATK/DEF, art) for every card
// in every preset deck, its banlist variants and its Side Deck, so the setup screen doesn't have to unpack the 1.6 MB
// card library. Names follow the TCG text overrides, as the duel does. Re-run after any decks.json or card change:
//   node tools/r33-deck-cards.mjs            (writes dist/deck-cards.json)
//   node tools/r33-deck-cards.mjs --check    (exit 1 if the file is out of date)
import fs from 'node:fs';import zlib from 'node:zlib';
export function buildDeckCards(dir='dist'){
 const db=JSON.parse(zlib.gunzipSync(fs.readFileSync(dir+'/cards.json.gz'))),over=JSON.parse(fs.readFileSync(dir+'/text-overrides-tcg.json','utf8')).cards||{};
 const decks=JSON.parse(fs.readFileSync(dir+'/decks.json','utf8')).decks,codes=new Set();
 for(const d of decks)for(const v of [d,...Object.values(d.banlistVariants||{})])for(const z of ['main','extra','side'])for(const c of v[z]||[])codes.add(c);
 const cards={};for(const c of [...codes].sort((a,b)=>a-b)){const x=db[c];if(!x)throw new Error('card '+c+' missing from cards.json.gz');
  cards[c]={name:over[c]?.name||x.name,type:x.type,level:x.level&0xff,attribute:x.attribute,atk:x.attack,def:x.defense,art:x.art||null}}
 return {_meta:{by:'tools/r33-deck-cards.mjs',cards:Object.keys(cards).length},cards}}
if(import.meta.url===`file://${process.argv[1]}`){const out=JSON.stringify(buildDeckCards())+'\n',file='dist/deck-cards.json';
 if(process.argv.includes('--check')){const ok=fs.existsSync(file)&&fs.readFileSync(file,'utf8')===out;console.log(ok?'deck-cards.json up to date':'deck-cards.json OUT OF DATE');process.exit(ok?0:1)}
 fs.writeFileSync(file,out);console.log('wrote',file,out.length,'bytes')}

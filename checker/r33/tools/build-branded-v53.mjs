// r25 (Claude, 21 Oct): Branded v5.3 as the 19 Oct 2026 preset version. Kevy approved v5.3 (21 Oct, ~22:20 AEDT) with
// the DARK "Springans Kitt" (cid 17063 / 45484331). List copied verbatim from Seto's review
// (branded-chatgpt-oct19-review-seto-2026-10-20.md §5); Tea checked it legal under 19 Oct
// (substitutes-legality-tea-2026-10-20.md: "All 7 final lists are legal ... 0 violations").
// Names resolve to the passcode already used in the Branded preset when there is one, else the scripted base passcode.
//   node tools/build-branded-v53.mjs        (writes dist/decks.json)
import fs from 'node:fs';import zlib from 'node:zlib';
export const V53={
 main:[[3,'Aluber the Jester of Despia'],[3,'Mulcharmy Fuwalos'],[3,'Ash Blossom & Joyous Spring'],[2,'Fallen of Albaz'],[1,'Fallen of the White Dragon'],[2,'Guiding Quem, the Virtuous'],[2,'Blazing Cartesia, the Virtuous'],[1,'Incredible Ecclesia, the Virtuous'],[1,'Dogmatika Fleurdelis, the Knighted'],[1,'Springans Kitt'],[1,'Tri-Brigade Mercourier'],[1,'Albion the Shrouded Dragon'],[1,'Bystial Magnamhut'],[1,'Bystial Saronir'],[1,'Phara the Primordial Goddess'],
  [3,'Fusion Deployment'],[3,'Nadir Servant'],[3,'Super Polymerization'],[2,'The Fallen & The Virtuous'],[1,'Branded Fusion'],[1,'Branded Opening'],[1,'Branded in High Spirits'],[1,'Branded in Red'],[1,'Branded Retribution']],
 extra:[[2,'Mirrorjade the Iceblade Dragon'],[1,'Lubellion the Searing Dragon'],[2,'Granguignol the Dusk Dragon'],[2,'The Dragon that Devours the Dogma'],[1,'Titaniklad the Ash Dragon'],[1,'Rindbrumm the Striking Dragon'],[1,'Albion the Sanctifire Dragon'],[1,'Alba-Lenatus the Abyss Dragon'],[1,'Garura, Wings of Resonant Life'],[1,'Mixousia the Confounder'],[1,'Predaplant Dragostapelia'],[1,'Despian Luluwalilith']],
 side:[[3,'Evenly Matched'],[3,'Effect Veiler'],[1,'Droll & Lock Bird'],[2,'Cosmic Cyclone'],[1,"Harpie's Feather Duster"],[1,'Solemn Judgment'],[1,'Bystial Druiswurm'],[2,'D.D. Crow'],[1,'The Fallen & The Virtuous']]
};
export const FORMAT='TCG Advanced — 19 October 2026 (Branded v5.3: Seto list, Kevy approved 21 Oct; Springans Kitt DARK; Tea PASS)';
if(process.argv[1]?.endsWith('build-branded-v53.mjs')){
 const db=JSON.parse(zlib.gunzipSync(fs.readFileSync('dist/cards.json.gz'))),decksFile=JSON.parse(fs.readFileSync('dist/decks.json')),b=decksFile.decks.find(d=>d.id==='branded');
 const used=new Set([...b.main,...b.extra,...b.side]),problems=[];
 const resolve=name=>{const all=Object.values(db).filter(c=>c.name===name);if(!all.length){problems.push('no card named '+name);return 0}
  const pick=all.find(c=>used.has(c.code))||all.filter(c=>c.scriptSupported!==false&&!c.alias).sort((a,b)=>a.code-b.code)[0]||all[0];if(pick.scriptSupported===false)problems.push(name+' has no script');return pick.code};
 const zone=list=>list.flatMap(([n,name])=>Array(n).fill(resolve(name)));
 const v={main:zone(V53.main),extra:zone(V53.extra),side:zone(V53.side),format:FORMAT};
 if(problems.length){console.error(problems.join('\n'));process.exit(1)}
 if(v.main.length!==40||v.extra.length!==15||v.side.length!==15)throw Error('counts '+[v.main.length,v.extra.length,v.side.length]);
 b.banlistVariants={...(b.banlistVariants||{}),'tcg-2026-10-19':v};if(b.banlistPending){delete b.banlistPending['tcg-2026-10-19'];if(!Object.keys(b.banlistPending).length)delete b.banlistPending}
 fs.writeFileSync('dist/decks.json',JSON.stringify(decksFile)+(fs.readFileSync('dist/decks.json','utf8').endsWith('\n')?'\n':''));
 console.log(JSON.stringify({main:v.main.length,extra:v.extra.length,side:v.side.length,kitt:v.main.find(c=>db[c].name==='Springans Kitt')}));
}

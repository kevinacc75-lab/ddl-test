// TASK c (Claude, 21 Oct): builds dist/banlists/tcg-2026-10-19.json = tcg-2026-09-21.json + the 43 changes in Tea's
// banlist-confirm-tea-2026-10-19.md §2/§7 (34 Forbidden, 8 Limited incl. Perfectron eff. 2026-11-11, 1 Semi-Limited).
// Keyed by original passcode (alias 0) looked up by exact name in dist/cards.json.gz; alt arts are covered by the
// validator's nameKey/alias normalisation. Fails loudly if a name is missing or ambiguous. Deterministic output.
import fs from 'node:fs';import zlib from 'node:zlib';
const db=JSON.parse(zlib.gunzipSync(fs.readFileSync('dist/cards.json.gz')));
const base=JSON.parse(fs.readFileSync('dist/banlists/tcg-2026-09-21.json'));
const FORBIDDEN=['Amorphage Goliath','Amorphage Sloth','Aerial Eater','Albion the Branded Dragon',"Zenna's Deceiving Doll Maidens",'Called by the Grave',
 'Charmer Quartet in Bloom','Beelze of the Diabolic Dragons','Trishula, Dragon of the Ice Barrier','XX-Saber Gottoms','D/D/D Wave High King Caesar','Secret Village of the Spellcasters','Anti-Spell Fragrance',
 'Pharaonic Advent','Cross-Sheep','Saryuja Skull Dread','Cupsy★Yummy Way','Gozen Match','Rivalry of Warlords','There Can Be Only One',
 "Magicians' Souls",'Spell Canceller','Crystal Wing Synchro Dragon','F.A. Dawn Dragster','Naturia Beast','Number 41: Bagooska the Terribly Tired Tapir','Number 60: Dugares the Timeless',
 'Elfnote Tinia','Azamina Ilia Silvia','Red-Eyes Dark Dragoon','Ame no Habakiri no Mitsurugi','Varudras, the Final Bringer of the End Times','Crossout Designator','Triple Tactics Talent'];
const LIMITED=['Droll & Lock Bird','Branded Opening','Toon Table of Contents','Toon Bookmark','Griffoh','Superdreadnought Rail Cannon Gustav Max','Branded in High Spirits'];
const SEMI=['Sky Striker Mobilize - Engage!'];
const PENDING=[{code:'13203964',name:'Perfectron Hydradrive Dragon',max:1,effective:'2026-11-11'}];
const byName=new Map();for(const c of Object.values(db)){if(c.alias&&db[c.alias]&&db[c.alias].name===c.name)continue;const l=byName.get(c.name)||[];l.push(c);byName.set(c.name,l)}
const find=n=>{const l=(byName.get(n)||[]).filter(c=>!(c.type&0x4000));if(l.length!==1)throw Error(`banlist build: "${n}" matched ${l.length} originals`);return String(l[0].code)};
const cards=structuredClone(base.cards),changes=[];
for(const [list,max] of [[FORBIDDEN,0],[LIMITED,1],[SEMI,2]])for(const n of list){const code=find(n),old=cards[code]?.max??3;
 const keys=new Set([code,...Object.keys(cards).filter(k=>db[k]&&(db[k].alias==code)&&db[k].name===n)]); // alt-art keys already listed move with it
 for(const k of keys)cards[k]={name:base.cards[k]?.name??n,max};changes.push({code,name:n,from:old,to:max,altKeys:[...keys].filter(k=>k!==code)})}
for(const p of PENDING){cards[p.code]={name:p.name,max:p.max,effective:p.effective};changes.push({code:p.code,name:p.name,from:'not released',to:p.max,effective:p.effective})}
const sorted=Object.fromEntries(Object.entries(cards).sort((a,b)=>a[1].name.replace(/^"/,'').localeCompare(b[1].name.replace(/^"/,''),'en')||a[0].localeCompare(b[0])));
const out={id:'tcg-2026-10-19',label:'TCG Advanced · 19 Oct 2026',source:'https://www.yugioh-card.com/en/limited/list_2026-10-19/',effective:'2026-10-19',
 status:'CONFIRMED (Tea, 19-20 Oct): tcg-2026-09-21 + 43 changes per Konami announcement Parts 1-5 (34 Forbidden, 8 Limited, 1 Semi-Limited); official list page reported live by Tea. Perfectron Hydradrive Dragon max 1 from 2026-11-11 (MAMS). Unlimited-status entries omitted by design (max 3 = default).',
 changes:changes.length,cards:sorted};
fs.writeFileSync('dist/banlists/tcg-2026-10-19.json',JSON.stringify(out,null,0).replace(/^\{/,'{\n').replace(/,"cards":\{/,',\n"cards": {\n').replace(/\},"/g,'},\n"')+'\n');
console.log(JSON.stringify({entries:Object.keys(sorted).length,changes:changes.length,newKeys:changes.filter(c=>c.from===3||c.from==='not released').length}));
for(const c of changes)if(c.from===c.to)console.log('NO-OP',c);

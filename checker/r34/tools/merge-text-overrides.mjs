// TASK c (Claude, 21 Oct): merges Tea's three TCG text-override files by passcode into dist/text-overrides-tcg.json.
// Each input is hash-checked first (stop on any mismatch). A passcode in more than one file must have the same name
// and text, otherwise it is a conflict and the merge stops. The UI card library (library-worker.mjs) applies the
// merged text for display only; the duel engine, the AI and the gate keep the bundled card data.
// Usage: node tools/merge-text-overrides.mjs <dir with the three JSON files>
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
const dir=process.argv[2];if(!dir)throw Error('usage: node tools/merge-text-overrides.mjs <dir>');
const FILES=[['tcg-text-overrides-substitutes-2026-10-20.json','bcf821aa86d2a9cf120c094b98a6aa05d27e0e50ee682df0920f848674f22959',21],
 ['tcg-text-overrides-ehero-2026-10-20.json','22abff836201c1360381c0087ca8ab6faa818b6e4d21b2ec9d779c4488498c37',24],
 ['tcg-text-overrides-v5.3-candidate.json','ed7dc0c3c109a9ca7a4b0fb12ed821b777a8acd0516a10550cef36a7e6545cfb',34]];
const cards={},conflicts=[],shared=[];
for(const [name,sha,count] of FILES){const bytes=fs.readFileSync(path.join(dir,name)),got=crypto.createHash('sha256').update(bytes).digest('hex');
 if(got!==sha)throw Error(`${name}: SHA-256 ${got}, expected ${sha}`);const o=JSON.parse(bytes);if(Object.keys(o).length!==count)throw Error(`${name}: ${Object.keys(o).length} entries, expected ${count}`);
 for(const [code,e] of Object.entries(o)){if(!/^\d+$/.test(code)||typeof e.name!=='string'||typeof e.desc!=='string')throw Error(`${name}: bad entry ${code}`);
  const prev=cards[code];if(!prev){cards[code]={name:e.name,desc:e.desc,source:e.source,from:[name]};continue}
  if(prev.name!==e.name||prev.desc!==e.desc)conflicts.push({code,files:[...prev.from,name],sameName:prev.name===e.name,sameText:prev.desc===e.desc});
  else{prev.from.push(name);if(prev.source!==e.source)prev.source+=' | '+e.source;shared.push(code)}}}
if(conflicts.length){console.log(JSON.stringify(conflicts,null,1));throw Error(conflicts.length+' conflict(s); not written')}
const sorted=Object.fromEntries(Object.entries(cards).sort((a,b)=>Number(a[0])-Number(b[0])));
const out={_meta:{built:'2026-10-21',by:'tools/merge-text-overrides.mjs (TASK c)',inputs:FILES.map(([n,s,c])=>({file:n,sha256:s,entries:c})),entries:Object.keys(sorted).length,
 sharedIdentical:[...new Set(shared)].sort((a,b)=>a-b),conflicts:0,use:'UI card text only (library-worker.mjs). Engine, AI and gate use the bundled card data.'},cards:sorted};
fs.writeFileSync('dist/text-overrides-tcg.json',JSON.stringify(out,null,1)+'\n');
console.log(JSON.stringify({entries:out._meta.entries,sharedIdentical:out._meta.sharedIdentical,conflicts:0}));

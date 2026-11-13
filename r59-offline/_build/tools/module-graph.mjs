// r59 (Claude, 14 Nov 2026; Seto team RELAY-206 MED-1): walk the real module graph so the offline core list can't miss a
// runtime module. Follows static imports/exports, import(), new Worker(...), new URL('...', import.meta.url) and the
// <script>/<link> tags of index.html. Usage: node tools/module-graph.mjs <dist dir>  (prints JSON list of ./paths)
import fs from 'node:fs';import path from 'node:path';
export function moduleGraph(dist,entries=['index.html']){
 const seen=new Set(),queue=[...entries];
 const add=(from,spec)=>{if(!spec||/^(https?:|data:|blob:|#)/.test(spec)||spec.startsWith('/'))return;const clean=spec.split(/[?#]/)[0];const rel=path.posix.normalize(path.posix.join(path.posix.dirname(from),clean));if(rel.startsWith('..'))return;if(!seen.has(rel)&&fs.existsSync(path.join(dist,rel)))queue.push(rel)};
 while(queue.length){const f=queue.shift();if(seen.has(f))continue;seen.add(f);const ext=path.extname(f);if(!['.html','.mjs','.js','.css'].includes(ext))continue;
  const s=fs.readFileSync(path.join(dist,f),'utf8');
  if(ext==='.html'){for(const m of s.matchAll(/<(?:script|link)\b[^>]*?(?:src|href)="([^"]+)"/g))add(f,m[1])}
  else if(ext==='.css'){for(const m of s.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g))add(f,m[1]);for(const m of s.matchAll(/@import\s+['"]([^'"]+)['"]/g))add(f,m[1])}
  else{for(const m of s.matchAll(/(?:import|export)\s*(?:[\w*\s{},$]*?\s*from\s*)?['"](\.{1,2}\/[^'"]+)['"]/g))add(f,m[1]);
   for(const m of s.matchAll(/import\(\s*['"](\.{0,2}\/?[^'"]+\.m?js)['"]\s*\)/g))add(f,m[1].startsWith('.')?m[1]:'./'+m[1]);
   for(const m of s.matchAll(/new\s+(?:Shared)?Worker\(\s*(?:new URL\(\s*)?['"]([^'"]+)['"]/g))add(f,m[1].startsWith('.')?m[1]:'./'+m[1]);
   for(const m of s.matchAll(/new URL\(\s*['"]([^'"]+)['"]\s*,\s*import\.meta\.url\s*\)/g))add(f,m[1].startsWith('.')?m[1]:'./'+m[1])}}
 return [...seen].map(f=>'./'+f).sort()}
if(import.meta.url===`file://${process.argv[1]}`)console.log(JSON.stringify(moduleGraph(process.argv[2]||'dist'),null,1));

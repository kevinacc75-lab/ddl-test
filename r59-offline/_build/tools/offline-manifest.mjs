// r59 (Claude, 14 Nov 2026; RELAY-206 MED-1): add every runtime file the module graph reaches to offline-assets.json, so the
// offline core can't silently miss a module. Directories and wb/ (WindBot, online only) are left out. Run before tests.
import fs from 'node:fs';import path from 'node:path';import {moduleGraph} from './module-graph.mjs';
const dist=process.argv[2]||'dist',file=path.join(dist,'offline-assets.json');const list=JSON.parse(fs.readFileSync(file,'utf8'));
const graph=moduleGraph(dist).filter(f=>!f.endsWith('/')&&!f.startsWith('./wb/')&&fs.statSync(path.join(dist,f)).isFile());
const added=graph.filter(f=>!list.includes(f));if(!list.includes('./offline-assets.json'))added.push('./offline-assets.json');
fs.writeFileSync(file,JSON.stringify([...list,...added]));console.log('added',added.length,added.join(' '));

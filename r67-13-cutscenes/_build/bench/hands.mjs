import fs from 'node:fs';import path from 'node:path';import {pathToFileURL} from 'node:url';
const dist=path.resolve('dist'),imp=f=>import(pathToFileURL(path.join(dist,f)).href);
const {db,scripts}=await import(pathToFileURL(path.resolve('tests/lib/engine-scenario.mjs')).href);
const {Duel}=await imp('duel.mjs');
const decks=JSON.parse(fs.readFileSync('dist/decks.json')).decks.map(d=>d.banlistVariants?.['tcg-2026-10-19']?{...d,...d.banlistVariants['tcg-2026-10-19'],id:d.id}:d);
const D=id=>decks.find(x=>x.id===id);
const SEEDS=[663799447,684167468,708964016,884959464,1126433173,1329571133,1647930813,1910250101];
const nm=c=>db[c]?.name||db.get?.(c)?.name||c;
for(const seed of SEEDS)for(const first of [0,1]){const live=await Duel.create(db,scripts),d=new Duel(live.core,db,scripts);d.start([D('branded'),D('branded')],{seed,first});
 const h=[0,1].map(p=>d.zone(p,2).map(c=>nm(c.code)).join(', '));console.log(seed,'f'+first,'\n  S0:',h[0],'\n  S1:',h[1]);d.stop()}

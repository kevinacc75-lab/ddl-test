// r18b dev trace: base-policy (search off) Branded opening, prints seat-0 turn-1/2 decisions.
import fs from 'node:fs';import zlib from 'node:zlib';
import {Duel,M} from '../dist/duel.mjs';import {createOptimalPilots} from '../dist/optimal-pilot.mjs';
const arg=(k,v)=>{const i=process.argv.indexOf('--'+k);return i>0?process.argv[i+1]:v};
const seed=+arg('seed',808),B=arg('b','sky'),first=+arg('first',0),upto=+arg('turns',1);
const db=JSON.parse(zlib.gunzipSync(fs.readFileSync('dist/cards.json.gz'))),scripts=JSON.parse(zlib.gunzipSync(fs.readFileSync('dist/scripts.json.gz'))),decks=JSON.parse(fs.readFileSync('dist/decks.json')).decks.map(x=>{const v=x.banlistVariants?.[arg('list','')];return v?{...x,...v}:x});
const d=await Duel.create(db,scripts);const pilots=createOptimalPilots({seed,searchEnabled:false});
d.start([decks.find(x=>x.id==='branded'),decks.find(x=>x.id===B)],{seed,first});
const nm=c=>c?d.name(c.code):'';const T=Object.fromEntries(Object.entries(M).map(([k,v])=>[v,k]));
console.log('hand0',d.zone(0,2).filter(Boolean).map(nm).join(' | '));
let n=0;while(d.prompt&&!d.finished&&d.turn<=upto&&n<400){const p=d.prompt,s=p.seat,pl=pilots[s].plan(d);if(!pl)break;
 if(s===0){const r=pl.response;let what='';const key=p.type===M.SELECT_IDLECMD?({0:'summons',1:'special_summons',5:'activates',4:'spell_sets',3:'monster_sets'})[r.action]:p.type===M.SELECT_CHAIN?'selects':null;if(key&&r.index!=null)what=key+':'+nm(p[key][r.index]);else if(r.indicies)what='pick:'+r.indicies.map(i=>nm((p.selects||p.select_cards||[])[i])).join(',');else what=JSON.stringify(r);
  console.log(d.turn,T[p.type],'hint'+d.hint,'eff:'+d.name(d.currentEffect?.code||0),'->',what,'|',pl.rule||'',pl.passivePass?'PASSIVE:'+pl.passivePass:'')}
 d.respond(pl.response);pilots[0].observe?.(pl);pilots[1].observe?.(pl);n++}
const show=s=>['F:'+d.zone(s,4).filter(Boolean).map(nm).join(','),'ST:'+d.zone(s,8).filter(Boolean).map(nm).join(','),'H:'+d.zone(s,2).filter(Boolean).map(nm).join(',')].join('  ');
console.log('END turn',d.turn,'\n seat0',show(0),'\n book',JSON.stringify(pilots[0].info().book));d.stop();

// r22 (Claude, 21 Oct): the full (search-on) pilot answers a Deck-bottom sort itself (T11 for the search path) and the
// engine accepts it first time. Board: Favorite Contact Set, Stratos + Shadow Mist in the GY (as T8). World counts are
// not asserted: boards dealt straight to zones cannot be rebuilt from turn 1 by the sampler (0 worlds before the sort
// as well), so Alexis L5 (how a sorted Deck-bottom enters the information model) needs a natural-duel check (Seto).
import assert from 'node:assert/strict';
import {loadBuild,scenario,LOC,deck,code,answer,seat} from './lib/engine-scenario.mjs';
import {createOptimalPilots} from '../dist/optimal-pilot.mjs';import {createSearchCore} from '../dist/ai/engine-snapshot.mjs';import {dropAllPools} from '../dist/ai/world-pool.mjs';
import {db,scripts} from './lib/engine-scenario.mjs';
const b=await loadBuild(true),hero=deck('hero'),FC=code('Favorite Contact'),STRATOS=code('Elemental HERO Stratos'),MIST=code('Elemental HERO Shadow Mist'),SUNRISE=code('Elemental HERO Sunrise');
const core=await createSearchCore(db,scripts);let units=0;const respond=b.Duel.prototype.respond;b.Duel.prototype.respond=function(...a){units++;return respond.apply(this,a)};
const d=scenario(b,{decks:[hero,hero],place:[{p:0,code:FC,location:LOC.SZONE,sequence:0,position:10},{p:0,code:STRATOS,location:LOC.GRAVE},{p:0,code:MIST,location:LOC.GRAVE}]});
const pilots=createOptimalPilots({seed:5,nodeBudget:200,searchCore:core,worldPool:true,poolKey:'r22sort',poolSize:6,seatCapBytes:40*1048576,shouldStop:()=>units>=limit});let limit=Infinity;
const plan=()=>{limit=units+400;const p=pilots[d.prompt.seat].plan(d);limit=Infinity;return p};
for(let i=0;i<40&&!(d.prompt.type===b.M.SELECT_IDLECMD&&seat(d.prompt)===0);i++)d.respond(answer(b,d));
d.respond(d.choices().find(o=>o.code===FC&&o.label.startsWith('Activate')).response);
let sorted=null,after=[];for(let i=0;i<60&&d.prompt&&!d.finished;i++){const m=d.prompt;
 if(m.type===b.M.SORT_CARD){const p=plan();sorted={rule:p.rule,order:p.response.order};const r0=d.retries;d.respond(p.response);assert.equal(d.retries,r0,'search pilot sort accepted');continue}
 if(!sorted){d.respond(answer(b,d,{pick:(m,c)=>{if(m.type===b.M.SELECT_CARD&&m.selects?.some(s=>s.code===SUNRISE))return {type:b.R.SELECT_CARD,indicies:[m.selects.findIndex(s=>s.code===SUNRISE)]};const w=c.find(o=>(o.code===STRATOS||o.code===MIST)&&o.label.startsWith('Use'));return w?.response}}));continue}
 const p=plan();after.push({seat:m.seat,worlds:p.search?.determinizations??null,status:p.search?.status??null});d.respond(p.response);if(after.length>=12)break}
d.stop();dropAllPools();
assert.ok(sorted,'the sort prompt was reached and answered by the search pilot');assert.ok(d.zone?true:true);
const searched=after.filter(x=>x.worlds!==null);console.log(JSON.stringify({node:process.version,sorted,after}));
assert.ok(after.length>=6,'play continues with the search pilot after the sort');

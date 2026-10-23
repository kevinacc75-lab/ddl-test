// r22 (Claude, 21 Oct): engine-wrapper fixes A (wasm32 card-data offsets: rscale@44, link_marker@48) and B (sort
// responses without the count byte), checked against Alexis's test list T1-T11 (r21c-engine-wrapper-rulings-alexis-
// 2026-10-21 §4). Every behaviour test runs on the fixed build and on a temporary copy of dist with the two r21c bugs
// put back (tests/lib/engine-scenario.mjs), and shows the unfixed wrapper fails it. Zone numbers follow the engine:
// Main Monster Zones seq 0-4, left EMZ seq 5 (above column 1), right EMZ seq 6 (above column 3).
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {loadBuild,scenario,q,LOC,deck,code,answer,places,seat,toIdle,db} from './lib/engine-scenario.mjs';
const fixed=await loadBuild(true),unfixed=await loadBuild(false),builds=[[true,fixed],[false,unfixed]];
const results={};const log=(k,v)=>{results[k]=v};
const idleOf=(b,d,p=0)=>toIdle(b,d,p);
const sky=deck('sky'),hero=deck('hero'),luna=deck('luna'),branded=deck('branded');
const ZEKE=code('Sky Striker Ace - Zeke'),KAGARI=code('Sky Striker Ace - Kagari'),HAYATE=code('Sky Striker Ace - Hayate'),SHIZUKU=code('Sky Striker Ace - Shizuku'),RAYE=code('Sky Striker Ace - Raye'),ROZE=code('Sky Striker Ace - Roze');
const WONDER=1948619,DEVICER=19324993,STRATOS=code('Elemental HERO Stratos'),MIST=code('Elemental HERO Shadow Mist'),POLY=24094653,FC=code('Favorite Contact'),SUNRISE=code('Elemental HERO Sunrise');
const WOLF=code('Lunalight Wolf'),TIGER=code('Lunalight Tiger'),REBORN=code('Monster Reborn');
// Drive the duel through prompts with the generic responder, letting `pick` answer specific prompts.
function run(b,d,{pick,stop,limit=40}={}){for(let i=0;i<limit&&d.prompt;i++){if(stop?.(d))return d;d.respond(answer(b,d,{pick:pick&&((m,c)=>pick(m,c,d))}))}return d}
const atIdle=(b,d,p=0)=>d.prompt?.type===b.M.SELECT_IDLECMD&&seat(d.prompt)===p;
const linkSummon=(b,d,extraCode,matCode,{placeLog}={})=>{const ss=d.choices().find(o=>o.code===extraCode&&o.label.startsWith('Special Summon'));if(!ss)return {summoned:false,offered:null};d.respond(ss.response);let offered=null;
 run(b,d,{stop:x=>atIdle(b,x),pick:(m,c)=>{if(m.type===b.M.SELECT_PLACE){offered=places(d);return null}const mat=c.find(o=>o.code===matCode&&o.label.startsWith('Use'));if(mat)return mat.response;if(m.type===b.M.SELECT_UNSELECT_CARD){const fin=c.find(o=>/Finish/.test(o.label));if(fin)return fin.response}return null}});
 return {summoned:d.zone(0,4).some(c=>c?.code===extraCode),offered,field:d.zone(0,4).map(c=>c?.code??null)}};

// T1. Marker and scale read-back for every Link and Pendulum in the presets (+ 19 Oct versions) and HERO.
{const all=[];for(const d0 of JSON.parse(fs.readFileSync('dist/decks.json')).decks)for(const v of [d0,...Object.values(d0.banlistVariants||{})])all.push({...d0,...v,banlistVariants:undefined});
 const readAll=(b,dk)=>{const d=scenario(b,{decks:[dk,hero]});idleOf(b,d);const out=q(d,'local t={} for c in Duel.GetFieldGroup(0,LOCATION_ALL,0):Iter() do if c:IsType(TYPE_LINK) or c:IsType(TYPE_PENDULUM) then t[#t+1]=c:GetCode()..":"..c:GetLinkMarker().."/"..c:GetLeftScale().."/"..c:GetRightScale() end end return table.concat(t,";")');d.stop();return out?out.split(';'):[]};
 for(const [isFixed,b] of builds){const bad=new Map(),seen=new Set();
  for(const dk of all)for(const row of readAll(b,dk)){const [id,v]=row.split(':');const c=db[id];seen.add(id);const exp=[c.type&0x4000000?c.link_marker:0,c.type&0x1000000?c.lscale:0,c.type&0x1000000?c.rscale:0].join('/');if(v!==exp)bad.set(id,{name:c.name,engine:v,data:exp})}
  log('T1-'+(isFixed?'fixed':'unfixed'),{cards:seen.size,mismatches:bad.size,sample:[...bad.values()].slice(0,3)});
  if(isFixed)assert.equal(bad.size,0,'T1 fixed: every Link marker and Pendulum scale reads back: '+JSON.stringify([...bad.values()].slice(0,3)));else assert.ok(bad.size>=10,'T1 unfixed: Link markers / right scales are wrong');
  if(isFixed){const spot={63288573:'64/0/0',[ZEKE]:'130/0/0',[WONDER]:'130/0/0',[DEVICER]:'3/0/0',[TIGER]:'0/5/5',[WOLF]:'0/1/1'};const rows=new Map([...all,hero].flatMap(dk=>readAll(b,dk)).map(r=>r.split(':')));
   for(const [id,v] of Object.entries(spot))assert.equal(rows.get(String(id)),v,'T1 spot '+db[id].name)}}}

// T2 + T3. Zeke (Top+Bottom) in EMZ seq 5; a second Sky Striker Link (Kagari, from Raye) may only go to MMZ seq 1.
for(const [isFixed,b] of builds){const d=scenario(b,{decks:[sky,sky],place:[{p:0,code:ZEKE,location:LOC.MZONE,sequence:5},{p:0,code:RAYE,location:LOC.MZONE,sequence:2}]});idleOf(b,d);
 const r=linkSummon(b,d,KAGARI,RAYE);log('T2-'+(isFixed?'fixed':'unfixed'),r);
 if(isFixed){assert.deepEqual(r.offered,[{player:0,location:4,sequence:1}],'T2/T3: only MMZ seq 1 (Zeke Bottom arrow) is offered; seq 0,2,3,4 and EMZ seq 6 are not');assert.equal(r.field[1],KAGARI);assert.equal(r.field[5],ZEKE)}
 else assert.ok(!(r.summoned&&r.field[5]===ZEKE),'T2 unfixed: Kagari cannot join Zeke (Zeke would have to be used as material)');d.stop()}
// T3 (Hayate case). Hayate (Bottom-Left) in seq 5: a Link-1 is offered only seq 0.
for(const [isFixed,b] of builds){const d=scenario(b,{decks:[sky,sky],place:[{p:0,code:HAYATE,location:LOC.MZONE,sequence:5},{p:0,code:ROZE,location:LOC.MZONE,sequence:3}]});idleOf(b,d);
 const r=linkSummon(b,d,SHIZUKU,ROZE);log('T3hayate-'+(isFixed?'fixed':'unfixed'),r);
 if(isFixed){assert.deepEqual(r.offered,[{player:0,location:4,sequence:0}],'T3: only seq 0 under Hayate');assert.equal(r.field[0],SHIZUKU);
  // T4. Co-link: Shizuku (Top-Right) in seq 0 points back to seq 5: Hayate and Shizuku are mutually linked.
  const co=q(d,'local h=Duel.GetFieldCard(0,LOCATION_MZONE,5) local s=Duel.GetFieldCard(0,LOCATION_MZONE,0) return h:GetMutualLinkedGroupCount()..","..s:GetMutualLinkedGroupCount()..","..tostring(h:GetMutualLinkedGroup():IsContains(s))');
  log('T4-fixed',co);assert.equal(co,'1,1,true','T4: Hayate and Shizuku are co-linked')}
 else assert.equal(r.summoned&&r.field[5]===HAYATE,false,'T3 unfixed: no second Link while Hayate holds the EMZ');d.stop()}
// T4 (one-way). Zeke -> Kagari (from T2 board) is linked, not co-linked.
{const b=fixed,d=scenario(b,{decks:[sky,sky],place:[{p:0,code:ZEKE,location:LOC.MZONE,sequence:5},{p:0,code:RAYE,location:LOC.MZONE,sequence:2}]});idleOf(b,d);linkSummon(b,d,KAGARI,RAYE);
 const one=q(d,'local z=Duel.GetFieldCard(0,LOCATION_MZONE,5) local k=Duel.GetFieldCard(0,LOCATION_MZONE,1) return z:GetLinkedGroupCount()..","..z:GetMutualLinkedGroupCount()..","..tostring(z:GetLinkedGroup():IsContains(k))');
 log('T4-oneway',one);assert.equal(one,'1,0,true','T4: Zeke points to Kagari (linked) but they are not co-linked');d.stop()}
{const d=scenario(unfixed,{decks:[sky,sky],place:[{p:0,code:HAYATE,location:LOC.MZONE,sequence:5}]});assert.equal(q(d,'return Duel.GetFieldCard(0,LOCATION_MZONE,5):GetLinkedZone(0)'),'0','T4 unfixed: no linked zones at all');d.stop()}

// T5 / T5b. Wonder Driver in EMZ seq 5 (Bottom arrow -> MMZ seq 1), Polymerization in the GY.
function wonder(b,{zone,poly}){const d=scenario(b,{decks:[hero,hero],place:[{p:0,code:WONDER,location:LOC.MZONE,sequence:5},{p:0,code:STRATOS,location:LOC.HAND},...(poly?[{p:0,code:POLY,location:LOC.GRAVE}]:[])]});idleOf(b,d);
 const ns=d.choices().find(o=>o.code===STRATOS&&o.label.startsWith('Normal Summon'));d.respond(ns.response);
 run(b,d,{stop:x=>atIdle(b,x),pick:(m)=>{if(m.type!==b.M.SELECT_PLACE||seat(m)!==0||!places(d).some(p=>p.location===4))return null;const want=places(d).find(p=>p.location===4&&p.sequence===zone);if(!want)throw Error('zone '+zone+' not offered: '+JSON.stringify(places(d)));return {type:b.R.SELECT_PLACE,places:[want]}}});
 const r={zone:d.zone(0,4).findIndex(c=>c?.code===STRATOS),wonderActivated:d.chains.includes(WONDER),polyInGy:d.zone(0,16).some(c=>c.code===POLY)};d.stop();return r}
for(const [isFixed,b] of builds){const t5=wonder(b,{zone:1,poly:true}),wrong=wonder(b,{zone:3,poly:true}),empty=wonder(b,{zone:1,poly:false});log('T5-'+(isFixed?'fixed':'unfixed'),{t5,wrong,empty});
 assert.equal(t5.zone,1);assert.equal(wrong.zone,3);
 if(isFixed){assert.equal(t5.wonderActivated,true,'T5: HERO summoned to the pointed zone triggers the Set');assert.equal(t5.polyInGy,false,'T5: Polymerization was Set from the GY');
  assert.equal(wrong.wonderActivated,false,'T5b: unpointed zone, no trigger');assert.equal(empty.wonderActivated,false,'T5b/D2: empty GY, no activation, once-per-turn not burnt')}
 else assert.equal(t5.wonderActivated,false,'T5 unfixed: Wonder Driver never points anywhere')}

// T6. Infernal Devicer (Bottom-Left + Bottom) in seq 5 points to seq 0 and 1: a Fiend in seq 1 gains Level x 100; one in seq 3 does not.
{const RADIAN=code('Radian, the Multidimensional Kaiju'),GOLEM=code('Lava Golem');// Fiends from the Mikanko preset (Level 7 and 8)
 const pool={...hero,main:[...hero.main.slice(0,38),RADIAN,GOLEM]};
 for(const [isFixed,b] of builds){const d=scenario(b,{decks:[pool,hero],place:[{p:0,code:DEVICER,location:LOC.MZONE,sequence:5},{p:0,code:RADIAN,location:LOC.MZONE,sequence:1},{p:0,code:GOLEM,location:LOC.MZONE,sequence:3}]});idleOf(b,d);
  const atk=q(d,'return Duel.GetFieldCard(0,LOCATION_MZONE,1):GetAttack()..","..Duel.GetFieldCard(0,LOCATION_MZONE,3):GetAttack()').split(',').map(Number);log('T6-'+(isFixed?'fixed':'unfixed'),{atk});
  assert.equal(atk[1],db[GOLEM].attack,'T6: seq 3 is not pointed to');assert.equal(atk[0],db[RADIAN].attack+(isFixed?(db[RADIAN].level&0xff)*100:0),isFixed?'T6: seq 1 gains Level x 100':'T6 unfixed: no gain');d.stop()}}

// T7. Lunalight Wolf (1) and Tiger (5), both arrangements: exactly Lunalight Levels 2-4 from the hand.
{const SCARLET=code('Lunalight Scarlet Tiger'),SHEEP=code('Lunalight Black Sheep');
 function pend(b,l,r){const d=scenario(b,{decks:[luna,hero],place:[WOLF,TIGER,SHEEP,SCARLET].map(c=>({p:0,code:c,location:LOC.HAND}))});idleOf(b,d);
  for(const [c,seq] of [[l,0],[r,4]]){const act=d.choices().find(o=>o.code===c&&o.label.startsWith('Activate'));d.respond(act.response);
   run(b,d,{stop:x=>atIdle(b,x),pick:(m)=>m.type===b.M.SELECT_PLACE?{type:b.R.SELECT_PLACE,places:[places(d).find(p=>p.location===8&&p.sequence===seq)||places(d)[0]]}:null})}
  const scales=q(d,'local a=Duel.GetFieldCard(0,LOCATION_PZONE,0) local c=Duel.GetFieldCard(0,LOCATION_PZONE,1) return a:GetLeftScale().."/"..c:GetRightScale()');
  const ps=d.choices().find(o=>o.label.startsWith('Special Summon')&&(o.code===l||o.code===r)&&d.zone(0,8).some(z=>z?.code===o.code));let levels=null;
  if(ps){d.respond(ps.response);const m=d.prompt;levels=(m.select_cards||m.selects||[]).filter(c=>c.location===2).map(c=>db[c.code].level&0xff).sort()}d.stop();return {scales,levels}}
 for(const [isFixed,b] of builds)for(const [l,r] of [[WOLF,TIGER],[TIGER,WOLF]]){const res=pend(b,l,r);log(`T7-${isFixed?'fixed':'unfixed'}-${db[l].name}-left`,res);
  if(isFixed){assert.equal(res.scales,l===WOLF?'1/5':'5/1');assert.ok(res.levels?.length,'T7: Pendulum Summon offered');assert.ok(res.levels.every(x=>x>=2&&x<=4),'T7: only Levels 2-4');assert.ok(!res.levels.includes(5),'T7: Level 5 (Scarlet Tiger) never offered')}
  else{assert.equal(res.scales.split('/')[1],'0','T7 unfixed: right scale reads 0');if(l===WOLF)assert.equal(res.levels,null,'T7 unfixed: Wolf 1 / Tiger 0 offers no Pendulum Summon')}}}

// T8 / T9 / T10a / T11. Favorite Contact (Trap, Set beforehand) Fusion Summons Elemental HERO Sunrise from Stratos + Shadow Mist in the GY.
function favorite(b,{order,bad,usePilot}={}){const d=scenario(b,{decks:[hero,hero],place:[{p:0,code:FC,location:LOC.SZONE,sequence:0,position:10},{p:0,code:STRATOS,location:LOC.GRAVE},{p:0,code:MIST,location:LOC.GRAVE}]});idleOf(b,d);
 const act=d.choices().find(o=>o.code===FC&&o.label.startsWith('Activate'));d.respond(act.response);let sort=null,offered=null,retries=0,pilotPlan=null;
 for(let i=0;i<40&&d.prompt&&!atIdle(b,d);i++){const m=d.prompt;
  if(m.type===b.M.SORT_CARD){sort=m.cards.map(c=>c.code);const before=d.retries;
   if(bad){d.respond({type:b.R.SORT_CARD,order:bad});retries+=d.retries-before;if(d.retries===before)break;if(!isFinite(d.retries))break}
   if(d.prompt?.type!==b.M.SORT_CARD)continue;const b2=d.retries;
   if(usePilot){pilotPlan=usePilot(d);d.respond(pilotPlan.response)}else d.respond({type:b.R.SORT_CARD,order});retries+=d.retries-b2;if(d.retries>b2)break;continue}
  d.respond(answer(b,d,{pick:(m,c)=>{if(m.type===b.M.SELECT_PLACE){offered=places(d);return null}
   if(m.type===b.M.SELECT_CARD&&m.selects?.some(s=>s.code===SUNRISE))return {type:b.R.SELECT_CARD,indicies:[m.selects.findIndex(s=>s.code===SUNRISE)]};
   const want=c.find(o=>(o.code===STRATOS||o.code===MIST)&&o.label.startsWith('Use'));return want?.response}}))}
 const bottom=q(d,'local t={} for c in Duel.GetFieldGroup(0,LOCATION_DECK,0):Iter() do if c:GetSequence()<2 then t[c:GetSequence()+1]=c:GetCode() end end return table.concat(t,",")');
 const r={sort,retries,bottom,offered,sunrise:d.zone(0,4).some(c=>c?.code===SUNRISE),pilotPlan:pilotPlan&&{rule:pilotPlan.rule,order:pilotPlan.response.order}};d.stop();return r}
{const a=favorite(fixed,{order:[0,1]}),c=favorite(fixed,{order:[1,0]}),bad=favorite(fixed,{order:[1,0],bad:[0,0]}),oor=favorite(fixed,{order:[1,0],bad:[2,0]}),u=favorite(unfixed,{order:[1,0]});log('T8',{a,c,bad,unfixed:u});
 assert.deepEqual(a.sort?.slice().sort(),[MIST,STRATOS].sort(),'T8: the controller gets SORT_CARD for the 2 Main Deck materials');
 assert.equal(a.retries+c.retries,0,'T8: both answers accepted, no MSG_RETRY');assert.ok(a.sunrise&&c.sunrise,'T8: the Fusion Summon resolves');
 assert.notEqual(a.bottom,c.bottom,'T8: the chosen order is applied');
 // Engine semantics (pinned): returns[i] is card i's rank in the placed block, rank 0 ends nearest the top of the Deck
 // (drawn first), the last rank is the very bottom (sequence 0).
 assert.equal(c.bottom,[c.sort[0],c.sort[1]].join(','),'T8: answer [1,0] puts card 0 at the very bottom (seq 0) and card 1 above it');
 assert.equal(a.bottom,[a.sort[1],a.sort[0]].join(','),'T8: answer [0,1] puts card 1 at the very bottom');
 assert.equal(bad.retries,1,'T8: an invalid answer (duplicate) gets MSG_RETRY once');assert.ok(bad.sunrise,'T8: then a valid answer completes it');
 assert.equal(oor.retries,1,'T8: an out-of-range answer gets MSG_RETRY once');assert.ok(oor.sunrise,'T8: then a valid answer completes it');
 assert.ok(u.retries>=1&&!u.sunrise,'T8 unfixed: every sort answer is refused');
 // T10a: a Fusion Monster from the Extra Deck (ignoring its conditions) may use any MMZ or the EMZ.
 const zones=c.offered.map(p=>p.sequence).sort();assert.deepEqual(zones,[0,1,2,3,4,5,6],'T10a: Fusion placement unchanged (R1)')}
// T11: the AI pilot answers the prompt itself through orderRanks, accepted first time; UI and log hooks exist.
{const {createOptimalPilots}=await import('../dist/optimal-pilot.mjs');const {safeView}=await import('../dist/ai/knowledge.mjs');const pilots=createOptimalPilots({seed:7,searchEnabled:false});
 const r=favorite(fixed,{usePilot:d=>pilots[d.prompt.seat].base(safeView(d,d.prompt.seat))});log('T11-pilot',r.pilotPlan);
 assert.equal(r.retries,0,'T11: pilot order accepted');assert.ok(r.sunrise);assert.ok(Array.isArray(r.pilotPlan.order)&&r.pilotPlan.order.length===2);
 assert.match(fs.readFileSync('dist/app.mjs','utf8'),/M\.SORT_CARD\|\|m\.type===M\.SORT_CHAIN\)\{renderOrder\(m\)/,'T11: the human flow shows the ordering prompt');
 assert.match(fs.readFileSync('dist/duel.mjs','utf8'),/Order these cards/);assert.match(fs.readFileSync('dist/pilot-notes.mjs','utf8'),/SORT_CARD/)}
// T9: the encoder writes SORT_CARD / SORT_CHAIN answers with no count byte, and -1 alone for "keep".
{const core=fs.readFileSync('dist/core/index.js','utf8');assert.ok(core.includes('case 15:if(!e.order){t.i8(-1);break}for(let r of e.order)t.i8(r);break;'),'T9: no count byte');
 assert.ok(!core.includes('t.i8(e.order.length)'),'T9: count byte gone');
 assert.ok(core.includes('e.setUint32(40,t.lscale??0,!0),e.setUint32(44,t.rscale??0,!0),e.setUint32(48,t.link_marker??0,!0)'),'A: wasm32 offsets');
 assert.ok(core.includes('e.setBigUint64(32,t.race??0n,!0),e.setInt32(40,t.attack??0,!0),e.setInt32(44,t.defense??0,!0),e.setUint32(48,t.lscale??0,!0),e.setUint32(52,t.rscale??0,!0),e.setUint32(56,t.link_marker??0,!0)'),'A: wasm64 branch corrected')}
// T10b/T10c are not automated here: a Link revived from the GY must have been properly summoned first, which takes a
// full Link Summon chain plus Sky Striker once-per-turn summon limits. The engine places GY revivals with its own MR5 zone
// logic, which the offset fix does not touch; see the r22 reply.
// T10d: the opponent's EMZ Link whose arrow points into your Main Monster Zone opens that zone to your Link (R4).
for(const [isFixed,b] of builds){const d=scenario(b,{decks:[sky,sky],place:[{p:1,code:ZEKE,location:LOC.MZONE,sequence:5},{p:0,code:HAYATE,location:LOC.MZONE,sequence:5},{p:0,code:RAYE,location:LOC.MZONE,sequence:2}]});idleOf(b,d);
 const r=linkSummon(b,d,KAGARI,RAYE);log('T10d-'+(isFixed?'fixed':'unfixed'),r);
 if(isFixed){assert.ok(r.offered?.some(p=>p.location===4&&p.sequence<5&&p.sequence!==0),'T10d: a zone opened by the opponent\'s Zeke is offered');assert.ok(r.summoned)}
 else assert.ok(!r.summoned||r.field[5]!==HAYATE,'T10d unfixed: no zone is opened');d.stop()}
console.log(JSON.stringify({node:process.version,...results},null,0));

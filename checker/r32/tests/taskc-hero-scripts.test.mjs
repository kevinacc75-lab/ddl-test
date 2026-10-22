// TASK c (Claude, 21 Oct): Elemental HERO sim-vs-TCG fixes (profile §3 D1-D6; dist/script-overrides.mjs).
//  1. Each override was built from the bundled script now in scripts.json.gz (base SHA-256), and only the planned
//     lines differ.
//  2. A HERO-vs-gate-deck duel loads every HERO script with no Lua errors.
//  3. D1: Wonder Driver destroyed by the opponent's card effect (Raigeki) with a HERO in hand. TCG: the float is
//     mandatory, so the HERO is summoned even by a pilot that declines every optional effect. The bundled script asks
//     instead (optional), so the same pilot leaves the HERO in hand; this test checks both.
//  4. D2: a HERO Normal Summoned into the zone Wonder Driver points to, with no Fusion/Change Spell in the GY. TCG: the
//     mandatory targeting Set does not activate (nothing is spent). The bundled script activates it anyway.
// Scenario boards are dealt by redirecting named cards from the decks to hand / field at duel creation (the same
// engine call that fills the decks), so every card is a normal card from a preset list.
import assert from 'node:assert/strict';
import fs from 'node:fs';import crypto from 'node:crypto';import {gunzipSync} from 'node:zlib';
import {Duel,M} from '../dist/duel.mjs';
import {OcgResponseType as R} from '../dist/core/index.js';
import {SCRIPT_OVERRIDES} from '../dist/script-overrides.mjs';
const db=JSON.parse(gunzipSync(fs.readFileSync('dist/cards.json.gz'))),scripts=JSON.parse(gunzipSync(fs.readFileSync('dist/scripts.json.gz')));
const decks=JSON.parse(fs.readFileSync('dist/decks.json')).decks,hero=decks.find(d=>d.id==='hero'),mikanko=decks.find(d=>d.id==='mikanko');
const mik19={...mikanko,...mikanko.banlistVariants['tcg-2026-10-19']};
const WONDER=1948619,STRATOS=40044918,RAIGEKI=12580477;
// 1. Provenance and scope of each override.
for(const [name,o] of Object.entries(SCRIPT_OVERRIDES)){
 assert.equal(crypto.createHash('sha256').update(scripts[name]).digest('hex'),o.baseSha256,name+': bundled script changed since the override was built; rebuild with tools/build-script-overrides.mjs');
 const a=new Set(scripts[name].split('\n')),b=new Set(o.text.split('\n')),added=[...b].filter(l=>!a.has(l)),removed=[...a].filter(l=>!b.has(l));
 assert.ok(added.length>=1&&added.length<=4&&removed.length<=5,name+': '+added.length+' added / '+removed.length+' removed lines');
 assert.ok(added.every(l=>/DDL D\d|REASON_EFFECT/.test(l)),name+': every changed line is marked');
}
assert.deepEqual(Object.keys(SCRIPT_OVERRIDES).sort(),['c1948619.lua','c52947044.lua','c75047173.lua']);
assert.match(SCRIPT_OVERRIDES['c75047173.lua'].text,/\n\tif ct>0 then Duel\.SortDeckbottom\(tp,tp,ct\) end\n/,'r22: W1 reverted, Favorite Contact asks its controller for the Deck-bottom order again (T8 in r22-engine-wrapper.test)');
assert.deepEqual(SCRIPT_OVERRIDES['c75047173.lua'].fixes,['D5']);
const live=await Duel.create(db,scripts);
// 2. Every HERO script loads.
for(const opp of ['branded','luna','sky','mikanko']){const d=new Duel(live.core,db,scripts);d.start([hero,decks.find(x=>x.id===opp)],{seed:2026,first:0});assert.deepEqual(d.errors,[],'script errors vs '+opp);d.stop()}
// Scenario harness.
function scenario(placements,first,{base=false}={}){
 const saved={};if(base)for(const k of Object.keys(SCRIPT_OVERRIDES)){saved[k]=SCRIPT_OVERRIDES[k];delete SCRIPT_OVERRIDES[k]}
 const core=live.core,orig=core.duelNewCard,left=placements.map(p=>({...p}));
 core.duelNewCard=(h,info)=>{const p=left.find(x=>!x.used&&x.code===info.code);if(p){p.used=true;info={...info,location:p.location,sequence:p.sequence??0,position:p.position??1}}return orig.call(core,h,info)};
 const d=new Duel(core,db,scripts),chains=[];
 try{d.start([hero,mik19],{seed:7,first})}finally{core.duelNewCard=orig;Object.assign(SCRIPT_OVERRIDES,saved)}
 assert.ok(left.every(p=>p.used),'all scenario cards placed');
 const handle=d.handleMessage.bind(d);d.handleMessage=m=>{if(m.type===M.CHAINING)chains.push(m.code);return handle(m)};
 return {d,chains,restore:()=>{}}; // card scripts load at duel creation; the overrides are back in place already
}
// A pilot that declines every optional effect and response, and takes the first legal choice when it must choose.
function decline(d){const m=d.prompt,c=d.choices();if(m.type===M.SELECT_EFFECTYN||m.type===M.SELECT_YESNO)return c.find(o=>o.label==='No').response;
 if(m.type===M.SELECT_CHAIN)return (m.forced?c[0]:c.find(o=>o.response.index===null)).response;if(m.type===M.SELECT_CARD)return {type:R.SELECT_CARD,indicies:Array.from({length:m.min},(_,i)=>i)};if(!c.length)throw Error("no choices for prompt "+m.type+" "+JSON.stringify(m,(k,v)=>typeof v==="bigint"?String(v):v).slice(0,400));return c[0].response}
const field=(d,p)=>d.zone(p,4).filter(Boolean).map(c=>c.code),hand=(d,p)=>d.zone(p,2).map(c=>c.code);
// 3. D1.
function d1(base){
 const s=scenario([{code:WONDER,location:4,sequence:5},{code:STRATOS,location:2},{code:RAIGEKI,location:2}],1,{base});const {d}=s;
 try{assert.equal(d.prompt.type,M.SELECT_IDLECMD);assert.equal(d.prompt.seat??d.prompt.player,1);
  const act=d.choices().find(o=>o.code===RAIGEKI&&o.label.startsWith('Activate'));assert.ok(act,'Raigeki can be activated');d.respond(act.response);
  for(let i=0;i<60&&d.prompt&&!(d.prompt.type===M.SELECT_IDLECMD&&(d.prompt.seat??d.prompt.player)===1);i++)d.respond(decline(d));
  return {heroOnField:field(d,0).filter(c=>db[c]&&/HERO/.test(db[c].name)),wonderInGy:d.zone(0,16).some(c=>c.code===WONDER),stratosInHand:hand(d,0).includes(STRATOS),errors:d.errors}}
 finally{d.stop();s.restore()}}
const fixed=d1(false),bundled=d1(true);
console.log(JSON.stringify({D1:{fixed,bundled}}));
assert.ok(fixed.wonderInGy&&bundled.wonderInGy,'Raigeki destroyed Wonder Driver');
assert.equal(fixed.heroOnField.length,1,'TCG: the float is mandatory, a HERO is summoned from hand');
assert.equal(bundled.heroOnField.length,0,'bundled script: the declining pilot keeps the HERO in hand (the divergence)');
assert.deepEqual(fixed.errors,[]);
// 4. D2, checked on the script's own target function: the vendored core currently gives every Link Monster 0 arrows
//    (see the TASK c reply: dist/core/index.js writes rscale/link_marker 4 bytes late on 32-bit builds), so Wonder Driver
//    never points to a zone in a sim duel and its Set cannot be reached through play until that is fixed. settg(chk=0)
//    is what the engine asks before a mandatory trigger activates.
function d2(gy,base){
 const s=scenario([{code:WONDER,location:4,sequence:5},...gy.map(code=>({code,location:16}))],0,{base});const {d}=s;
 try{const tp=d.toEngine(0);d.errors.length=0;
  live.core.loadScript(d.handle,'ddl-d2.lua',`error("DDL-D2 "..tostring(c${WONDER}.settg(nil,${tp},nil,0,nil,nil,0,0,0,nil)))`);
  const line=d.errors.find(e=>e.includes('DDL-D2'));assert.ok(line,'settg probe ran: '+d.errors.join(' | '));return line.replace(/.*DDL-D2 /,'')}
 finally{d.stop();s.restore()}}
// (Only the empty-GY case is probed: with a Spell in the GY, IsSSetable() outside an effect context does not return.)
const d2rows={fixedEmptyGy:d2([],false),bundledEmptyGy:d2([],true)};
console.log(JSON.stringify({D2:d2rows}));
assert.equal(d2rows.bundledEmptyGy,'true','bundled script: activates with no legal GY target (the divergence)');
assert.equal(d2rows.fixedEmptyGy,'false','TCG: no legal target, so the mandatory Set does not activate');
assert.match(SCRIPT_OVERRIDES['c1948619.lua'].text,/if chk==0 then return Duel\.IsExistingTarget\(s\.setfilter,tp,LOCATION_GRAVE,0,1,nil\) end/,'the Set checks for a legal GY target (Polymerization / Fusion Spell / Change Quick-Play, as before)');
live.stop();
console.log(JSON.stringify({node:process.version,overrides:Object.fromEntries(Object.entries(SCRIPT_OVERRIDES).map(([k,v])=>[k,v.fixes])),ok:true}));

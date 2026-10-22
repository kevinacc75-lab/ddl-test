// r32.1 (Claude, 22 Oct; Kevy's recording 23:17 at 2:28). SELF-VERIFIED (builder = verifier), NOT independent.
// When Mirrorjade the Iceblade Dragon leaves the field by an opponent's card (here: Tributed for Mikanko's Thunder King),
// Branded must use its "destroy all monsters your opponent controls during the End Phase" trigger. r32 declined it with the
// rule meant for Mirrorjade's banish ("Save the banish" when no opposing monster is face-up). The banish rule now only
// applies on the field. Native fixture: the recorded opening of seed 208 (Branded's turn-1 board Aluber, Fleurdelis,
// Mirrorjade), replayed, then Mikanko's turn with the base AI.
import assert from 'node:assert/strict';import fs from 'node:fs';import {gunzipSync} from 'node:zlib';
import {Duel,M} from '../dist/duel.mjs';import {createOptimalPilots} from '../dist/optimal-pilot.mjs';
const db=JSON.parse(gunzipSync(fs.readFileSync('dist/cards.json.gz'))),scripts=JSON.parse(gunzipSync(fs.readFileSync('dist/scripts.json.gz')));
const decks=JSON.parse(fs.readFileSync('dist/decks.json')).decks.map(x=>{const v=x.banlistVariants?.['tcg-2026-10-19'];return v?{...x,...v}:x});
const prefix=JSON.parse(fs.readFileSync('tests/fixtures/r32-mikanko-second-208-branded-opening.json'));
const d=await Duel.create(db,scripts);d.start([decks.find(x=>x.id==='mikanko'),decks.find(x=>x.id==='branded')],{seed:208,first:1});
for(const r of prefix)d.respond(r);
assert.ok(d.zone(1,4).some(c=>c&&d.name(c.code)==='Mirrorjade the Iceblade Dragon'),'Branded opened with Mirrorjade');
const pilots=createOptimalPilots({seed:208,searchEnabled:false});const seen=[];let n=0;
while(d.prompt&&!d.finished&&n<500&&d.turn<=2){const p=d.prompt,plan=pilots[p.seat].plan(d);
 if(p.seat===1&&p.type===M.SELECT_EFFECTYN&&d.name(p.code||0)==='Mirrorjade the Iceblade Dragon')seen.push({location:p.location,yes:plan.response.yes});
 d.respond(plan.response);for(const x of pilots)x.observe?.(plan);n++}
d.stop();
const gy=seen.filter(s=>s.location===16);assert.ok(gy.length>=1,'the left-the-field trigger was offered');assert.ok(gy.every(s=>s.yes),'and used');
console.log(JSON.stringify({test:'r32-mirrorjade-float',pass:true,node:process.version,prompts:seen,selfVerified:true}));

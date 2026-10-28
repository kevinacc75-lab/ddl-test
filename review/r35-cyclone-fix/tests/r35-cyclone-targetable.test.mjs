// r35 job 29 fix (Claude, 29 Oct 2026). SELF-VERIFIED (builder = verifier), NOT independent. Synthetic-view cases for
// targetable() / huLiShield() / the targeting Spell/Trap removal block (dist/optimal-pilot.mjs), alongside the native
// fixtures in tests/r35-cyclone-hu-li-native.test.mjs. Card names and texts come from the real card database.
import assert from 'node:assert/strict';import fs from 'node:fs';import {gunzipSync} from 'node:zlib';
import {activationBlock,targetable,huLiShield,GRANTS_ST_SHIELD} from '../dist/optimal-pilot.mjs';
const db=JSON.parse(gunzipSync(fs.readFileSync('dist/cards.json.gz'))),code=n=>+Object.keys(db).find(k=>db[k].name===n);
const HU='Hu-Li the Jewel Mikanko',FD='Mikanko Fire Dance',WA='Mikanko Water Arabesque',DES='Double-Edged Sword';
// view(z): z[side][loc] = list of {name, pos, status, equip}. Seat 0 is us; seat 1 the opponent.
function view(z,{chain=[],active=0}={}){const zones={};for(const side of [0,1])for(const [loc,list] of Object.entries(z[side]||{}))zones[side+':'+loc]=list.map((x,i)=>x&&{code:x.name?code(x.name):0,controller:side,location:+loc,sequence:i,position:x.pos??1,status:x.status??0,equipCard:x.equip?{controller:x.equip[0],location:4,sequence:x.equip[1],position:1}:null});
 return {db,name:c=>db[c]?.name||'',zone:(s,l)=>zones[s+':'+l]||[],prompt:{type:11},chain,active,description:()=>''}}
const our=(name,loc=2)=>({code:code(name),controller:0,location:loc,sequence:0,position:1});
const hu=(o={})=>({name:HU,pos:1,...o}),fdEq=(to=[1,0])=>({name:FD,pos:1,equip:to}),set={pos:10};/* set card: identity hidden */
const block=(v,n,loc)=>activationBlock(v,0,our(n,loc));
// 1. The job 29 shape: their Hu-Li + their Fire Dance equipped to it: shield up, Mikanko S/T untargetable, Cosmic Cyclone blocked.
{const v=view({1:{4:[hu()],8:[fdEq(),{name:WA,pos:1,equip:[1,0]}]}});assert.equal(huLiShield(v,1),true);
 for(const c of v.zone(1,8))assert.equal(targetable(v,0,c),false,v.name(c.code)+' untargetable');assert.match(block(v,'Cosmic Cyclone')||'',/no targetable opposing Spell\/Trap/)}
// 2. Printed text "you control AN Equip Card": their Fire Dance equipped to a monster on OUR field still raises the shield
//    (the r35.5 helper needed the Equip Card to be attached to Hu-Li itself).
{const v=view({0:{4:[{name:'Ha-Re the Sword Mikanko'}]},1:{4:[hu()],8:[fdEq([0,0])]}});assert.equal(huLiShield(v,1),true);assert.match(block(v,'Cosmic Cyclone')||'',/no targetable/)}
// 3. An Equip Card WE control does not raise THEIR shield (the r35.5 helper pooled both players' zones).
{const v=view({0:{8:[{name:DES,pos:1,equip:[1,0]}]},1:{4:[hu()],8:[{name:WA,pos:1}]}});assert.equal(huLiShield(v,1),false);assert.equal(block(v,'Cosmic Cyclone'),null)}
// 4. Hu-Li face-down (Seto point 2) or negated (status bit 1): shield off.
{const v=view({1:{4:[hu({pos:10})],8:[fdEq()]}});assert.equal(huLiShield(v,1),false,'face-down Hu-Li');assert.equal(block(v,'Cosmic Cyclone'),null)}
{const v=view({1:{4:[hu({status:1})],8:[fdEq()]}});assert.equal(huLiShield(v,1),false,'negated Hu-Li');assert.equal(block(v,'Cosmic Cyclone'),null)}
// 5. No Equip Card on their side: shield off. A face-up Equip Spell not attached to anything does not count.
{const v=view({1:{4:[hu()],8:[{name:WA,pos:1}]}});assert.equal(huLiShield(v,1),false);assert.equal(block(v,'Cosmic Cyclone'),null)}
// 6. Under the shield a SET card of theirs is untargetable (it may be a Mikanko card; we never read its identity); a
//    face-up non-Mikanko card stays targetable.
{const v=view({1:{4:[hu()],8:[fdEq(),set]}});assert.equal(targetable(v,0,v.zone(1,8)[1]),false,'set card under the shield');assert.match(block(v,'Cosmic Cyclone')||'',/no targetable/)}
{const v=view({1:{4:[hu()],8:[fdEq(),{name:DES,pos:1,equip:[1,0]}]}});assert.equal(targetable(v,0,v.zone(1,8)[1]),true,'Double-Edged Sword');assert.equal(block(v,'Cosmic Cyclone'),null)}
// 7. The whole family (Seto condition 2): MST, Twin Twisters (cost: discard), Tornado Dragon (cost: detach) are blocked
//    before activation, so no cost is paid. Without any opposing S/T they are blocked as before.
{const shield=view({1:{4:[hu()],8:[fdEq()]}}),empty=view({});
 for(const n of ['Mystical Space Typhoon','Twin Twisters','Tornado Dragon','Cosmic Cyclone']){assert.match(block(shield,n,n==='Tornado Dragon'?4:2)||'',/no targetable/,n+' under the shield');assert.match(block(empty,n,n==='Tornado Dragon'?4:2)||'',/has no opposing Spell\/Trap to remove$/,n+' with no S/T: r35.5 wording kept')}}
// 8. Galaxy Cyclone (Seto point 3): hand / field activation targets a SET S/T; the GY effect targets a FACE-UP one.
{const onlyFaceUp=view({1:{8:[{name:WA,pos:1}]}}),onlySet=view({1:{8:[set]}});
 assert.match(block(onlyFaceUp,'Galaxy Cyclone',2)||'',/no targetable opposing Set/,'hand effect: their only S/T is face-up');assert.equal(block(onlySet,'Galaxy Cyclone',2),null);
 assert.equal(block(onlyFaceUp,'Galaxy Cyclone',16),null,'GY effect: face-up target exists');assert.match(block(onlySet,'Galaxy Cyclone',16)||'',/no targetable opposing face-up/)}
// 9. F3 catch-all (cards outside our pool): an opposing face-up card granting "your opponent cannot target ... cards you
//    control" makes their S/T untargetable; negated, it does not. A monster-only protection (Toon Kingdom) does not.
{const grant='Traptrix Rafflesia';assert.ok(GRANTS_ST_SHIELD.test(db[code(grant)].desc));
 const v=view({1:{4:[{name:grant}],8:[{name:WA,pos:1}]}});assert.equal(targetable(v,0,v.zone(1,8)[0]),false);assert.match(block(v,'Cosmic Cyclone')||'',/no targetable/);
 const neg=view({1:{4:[{name:grant,status:1}],8:[{name:WA,pos:1}]}});assert.equal(block(neg,'Cosmic Cyclone'),null);
 assert.ok(!GRANTS_ST_SHIELD.test(db[code('Toon Kingdom')].desc),'Toon Kingdom protects Toon monsters only');
 const toon=view({1:{8:[{name:'Toon Kingdom',pos:1},{name:WA,pos:1}]}});assert.equal(block(toon,'Cosmic Cyclone'),null)}
// 10. Monster targeting users of targetable() (Seto point 1): Infinite Impermanence / Widow Anchor / Afterburners now see
//     the corrected shield: Hu-Li itself (a Mikanko card) is protected while their Equip Card exists, and not when negated.
{const v=view({1:{4:[hu()],8:[fdEq()]}});assert.match(block(v,'Infinite Impermanence')||'',/no unnegated opposing Effect Monster/);
 const v2=view({1:{4:[hu()],8:[fdEq([0,0])]}});assert.match(block(v2,'Infinite Impermanence')||'',/no unnegated/,'equip on our field still shields (corrected rule)');
 const v3=view({1:{4:[hu()],8:[{name:WA,pos:1}]}},{active:1});/* their turn: the own-turn hand-trap hold does not apply */assert.equal(block(v3,'Infinite Impermanence'),null,'no Equip Card: Hu-Li targetable')}
console.log(JSON.stringify({test:'r35-cyclone-targetable',pass:true,node:process.version}));

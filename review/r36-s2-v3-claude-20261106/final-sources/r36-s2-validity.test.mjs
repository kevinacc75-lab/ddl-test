// r36 S2 v2 validity and strict-predicate checks (Claude as builder, 5 Nov 2026; ChatGPT RELAY-109). ChatGPT's
// counterexamples must not PASS: (b) with no own action and an empty enemy field; (e) with no attack offered; any record
// with errors, notes, a rejected response, an abnormal stop or no own-turn start must be INVALID, not judged.
import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';
import {P,classify,selectionErrors,requested,checkLP,lpAgrees} from '../tools/r36-s2-puzzles.mjs';
let pass=0,fail=0;const ok=(n,f)=>{try{f();pass++;console.log('ok',pass+fail,n)}catch(e){fail++;console.log('not ok',pass+fail,n,'--',e.message.split('\n')[0])}};
const GG='Granguignol the Dusk Dragon',DA='Dark Armed, the Dragon of Annihilation',FL='Dogmatika Fleurdelis, the Knighted',SK='Scareclaw Kashtira';
const B=(lp,field=[],gy=[])=>({lp,field:field.map(name=>({name})),st:[],hand:0,gy});
const rec=o=>({lpCheck:{requested:[8000,8000],setup:[8000,8000],start:{native:[8000,8000],wrapper:[8000,8000]},end:{native:[8000,8000],wrapper:[8000,8000]}},boardStart:[B(8000,[DA]),B(8000,[FL])],boardAfter:[B(8000,[DA]),B(7700,[],[FL])],stop:'turn-end',errors:[],rejected:0,notes:[],own:[{kind:'attack',label:'Attack · '+DA}],targets:[FL],battleOffers:[['Attack · '+DA]],...o});
ok('b: a correct record PASSes (offer, attack, Fleurdelis target, destroyed, 300 damage, attacker stays)',()=>assert.equal(classify(rec({}),P.b).outcome,'PASS'));
ok('b (RELAY-109 counterexample): no own action and an empty enemy field -> FAIL, not PASS',()=>{
 const T=classify(rec({own:[],targets:[],battleOffers:[],boardStart:[B(8000,[DA]),B(8000)],boardAfter:[B(8000,[DA]),B(8000)]}),P.b);assert.equal(T.outcome,'FAIL')});
ok('b: Fleurdelis gone without our attack (e.g. removed by an effect) -> FAIL (the attack is required)',()=>{const T=classify(rec({own:[{kind:'phase',label:'End turn'}]}),P.b);assert.equal(T.outcome,'FAIL');assert.equal(T.result.checks.selectedAttack,false)});
ok('b: attack aimed at another target -> FAIL',()=>assert.equal(classify(rec({targets:['Albion the Shrouded Dragon']}),P.b).outcome,'FAIL'));
const eRec=o=>({lpCheck:{requested:[8000,8000],setup:[8000,8000],start:{native:[8000,8000],wrapper:[8000,8000]},end:{native:[8000,8000],wrapper:[8000,8000]}},boardStart:[B(8000,[SK]),B(8000)],boardAfter:[B(8000,[SK]),B(5400)],stop:'turn-end',errors:[],rejected:0,notes:[],own:[{kind:'attack',label:'Attack · '+SK}],targets:[],battleOffers:[['Attack · '+SK]],...o});
ok('e: correct record (offer, attack, 2600 = DEF) PASSes',()=>assert.equal(classify(eRec({}),P.e).outcome,'PASS'));
ok('e (RELAY-109 counterexample): empty battleOffers and no attack -> FAIL, not vacuous PASS',()=>assert.equal(classify(eRec({battleOffers:[],own:[],boardAfter:[B(8000,[SK]),B(8000)]}),P.e).outcome,'FAIL'));
ok('e: attack taken but damage not DEF (e.g. ATK 1500) -> FAIL',()=>assert.equal(classify(eRec({boardAfter:[B(8000,[SK]),B(6500)]}),P.e).outcome,'FAIL'));
const aRec=o=>({lpCheck:{requested:[8000,8000],setup:[8000,8000],start:{native:[8000,8000],wrapper:[8000,8000]},end:{native:[8000,8000],wrapper:[8000,8000]}},boardStart:[B(8000,[GG]),B(8000)],boardAfter:[B(8000,[GG]),B(5500)],stop:'turn-end',errors:[],rejected:0,notes:[],own:[{kind:'attack',label:'Attack · '+GG}],targets:[],battleOffers:[['Attack · '+GG]],...o});
ok('a: correct record PASSes; a Defence switch FAILs',()=>{assert.equal(classify(aRec({}),P.a).outcome,'PASS');assert.equal(classify(aRec({own:[{kind:'position',label:'Change position · '+GG},{kind:'attack',label:'Attack · '+GG}]}),P.a).outcome,'FAIL')});
ok('INVALID (RELAY-109): a passing record with injected errors / an error note / a rejected response / step bound / no own-turn start / setup failure is not judged',()=>{
 for(const o of [{errors:['x']},{notes:['error: boom']},{rejected:1},{stop:'step-bound'},{stop:'no-prompt'},{stop:'own-turn-not-seat-0'},{boardStart:undefined},{stop:'setup-failed'},{notes:['rejected response (seat0) at turn 3']}]){const T=classify(aRec(o),P.a);assert.equal(T.outcome,'INVALID',JSON.stringify(o));assert.equal(T.result,null)}});
ok('a "finished" stop (duel won inside the turn) is valid and judged',()=>assert.equal(classify(aRec({stop:'finished'}),P.a).valid,true));
// RELAY-110: a zero-run or unknown selection is INVALID SELECTION (exit 2), never a gate success.
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'s2sel-')),cli=args=>spawnSync(process.execPath,['tools/r36-s2-puzzles.mjs',tmp,...args],{encoding:'utf8'});
ok('RELAY-110 counterexample: --only nonexistent --gate exits 2 with INVALID SELECTION and writes no records (also in screen mode)',()=>{
 for(const g of [['--gate'],[]]){const r=cli(['--only','nonexistent',...g]);assert.equal(r.status,2,'exit '+r.status);assert.match(r.stdout,/INVALID SELECTION: unknown puzzle id: nonexistent/)}
 assert.deepEqual(fs.readdirSync(tmp),[],'nothing written')});
ok('unknown mode / duplicate mode / unknown S4 flag / bad --first / one unknown id among known ones -> exit 2',()=>{
 for(const a of [['--modes','bogus'],['--modes','classic,classic'],['--flags','X'],['--first','2'],['--only','a,zz']]){const r=cli([...a,'--gate']);assert.equal(r.status,2,a.join(' '));assert.match(r.stdout,/INVALID SELECTION/)}});
ok('selectionErrors / requested: the default selection is the full nonempty matrix; filters give exactly the asked keys',()=>{
 const base={only:[],modes:['classic','enhanced'],extra:'',first:0};assert.deepEqual(selectionErrors(base),[]);assert.equal(requested(base).length,Object.keys(P).length*2);
 assert.deepEqual(requested({...base,only:['e'],extra:'E'}),['e|classic+E','e|enhanced+E']);assert.ok(selectionErrors({...base,modes:[]}).length,'no modes is invalid')});
// RELAY-115 LP fixture: validation, agreement and mapping (records), plus native runs via the CLI.
ok('checkLP: default 8000/8000; rejects missing/extra values, zero, negative, fractional, non-numeric',()=>{assert.deepEqual(checkLP(),[8000,8000]);assert.deepEqual(checkLP([2000,8000]),[2000,8000]);
 for(const bad of [[2000],[2000,8000,1],[0,8000],[-1,8000],[1.5,8000],['x',8000],'2000,8000'])assert.throws(()=>checkLP(bad),/invalid lp/,JSON.stringify(bad))});
ok('LP disagreement makes a record INVALID before judging: start/end native != wrapper, missing check, setup != requested (incl. swapped seats), non-numeric native',()=>{
 const L=o=>({requested:[2000,8000],setup:[2000,8000],start:{native:[2000,8000],wrapper:[2000,8000]},end:{native:[2000,8000],wrapper:[2000,8000]},...o});
 assert.equal(lpAgrees({lpCheck:L({})}),true);
 for(const o of [{start:{native:[2000,8000],wrapper:[8000,8000]}},{end:{native:[2000,8000],wrapper:[2000,7000]}},{setup:[8000,2000]},{start:undefined},{end:{native:null,wrapper:[2000,8000]}},{end:{native:[null,8000],wrapper:[null,8000]}}]){
  assert.equal(lpAgrees({lpCheck:L(o)}),false,JSON.stringify(o));const T=classify(aRec({lpCheck:L(o)}),P.a);assert.equal(T.outcome,'INVALID',JSON.stringify(o))}
 assert.equal(classify(aRec({lpCheck:undefined}),P.a).outcome,'INVALID','missing lpCheck')});
const fRec=o=>({lpCheck:{requested:[8000,2500],setup:[8000,2500],start:{native:[8000,2500],wrapper:[8000,2500]},end:{native:[8000,0],wrapper:[8000,0]}},boardStart:[B(8000,[GG]),B(2500)],boardAfter:[B(8000,[GG]),B(0)],stop:'finished',errors:[],rejected:0,notes:[],own:[{kind:'attack',label:'Attack · '+GG}],targets:[],battleOffers:[['Attack · '+GG]],idleOffers:[70368879],activations:[],end:{finished:true,winner:0},...o});
ok('f: correct record PASSes; wrong winner mapping (winner 1) FAILs; an Upstart activation by seat 0 FAILs (by code, not label); Upstart not offered FAILs; an opponent\'s Upstart does not count',()=>{
 assert.equal(classify(fRec({}),P.f).outcome,'PASS');assert.equal(classify(fRec({end:{finished:true,winner:1}}),P.f).outcome,'FAIL');
 assert.equal(classify(fRec({activations:[{code:70368879,controller:0,seq:1}]}),P.f).outcome,'FAIL');assert.equal(classify(fRec({idleOffers:[]}),P.f).outcome,'FAIL');
 assert.equal(classify(fRec({activations:[{code:70368879,controller:1,seq:1}]}),P.f).outcome,'PASS')});
ok('non-default-LP puzzles are search-off only until search-root LP is verified: --search 100 with d1/f is INVALID SELECTION (exit 2)',()=>{
 assert.ok(selectionErrors({only:['d1'],modes:['classic'],extra:'',first:0,search:100}).length);assert.deepEqual(selectionErrors({only:['d2'],modes:['classic'],extra:'',first:0,search:100}),[]);
 const r=cli(['--only','f','--search','100','--gate']);assert.equal(r.status,2);assert.match(r.stdout,/non-default LP fixture: search-off only/)});
ok('native: d1 (requested LP 2000/8000 logical) and d2 (default) in ONE process, first=1 mapping: engine-verified setup LP per record, native = wrapper at start and end, no leakage into d2',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'s2lp-')),r=spawnSync(process.execPath,['tools/r36-s2-puzzles.mjs',dir,'--only','d1,d2','--modes','classic','--first','1'],{encoding:'utf8'});assert.equal(r.status,0,r.stdout+r.stderr);
 const d1=JSON.parse(fs.readFileSync(dir+'/d1-classic-s0-f1.json','utf8')),d2=JSON.parse(fs.readFileSync(dir+'/d2-classic-s0-f1.json','utf8'));
 assert.deepEqual(d1.lpCheck.setup,[2000,8000],'logical seat 0 has 2000 under first=1');assert.deepEqual(d1.lpCheck.start.native,d1.lpCheck.start.wrapper);assert.deepEqual(d1.lpCheck.start.native,[2000,8000]);
 assert.deepEqual(d2.lpCheck.setup,[8000,8000],'no leakage');assert.equal(d1.valid,true);assert.equal(d2.valid,true)});
console.log('r36 S2 validity tests: '+pass+' passed'+(fail?', '+fail+' FAILED':''));if(fail)process.exitCode=1;

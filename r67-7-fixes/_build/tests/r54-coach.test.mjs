// r54 Guided Duel coach (Claude, 13 Nov 2026). SELF-VERIFIED until reviewed. Pure line-building checks.
import assert from 'node:assert/strict';import {test} from 'node:test';import fs from 'node:fs';
import {linesFor,UNSURE_CARDS} from '../dist/learn/coach.mjs';
const db={1:{name:'Ash Blossom & Joyous Spring',type:0x21},2:{name:'Fire Formation - Tenki',type:0x20002},76660178:{name:'Fisherman of Legend',type:0x21}};
const read=f=>fs.readFileSync(new URL('../dist/'+f,import.meta.url),'utf8');
test('(R54-1) chain lines: monster effect vs Spell/Trap wording; resolve and chain-end only for real chains',()=>{
 const chain=new Map();
 const l=linesFor([{id:1,type:'activate',code:2,chain:1,player:0,source:{location:8}},{id:2,type:'activate',code:1,chain:2,player:1,source:{location:2}},{id:3,type:'resolve',chain:2},{id:4,type:'chainEnd'}],{db,view:0,chain});
 assert.equal(l[0].text,'Fire Formation - Tenki is Chain Link 1. It hasn’t resolved yet.','no activation-vs-effect claim for a Spell/Trap');
 assert.equal(l[1].text,'Ash Blossom & Joyous Spring’s effect is Chain Link 2. It hasn’t resolved yet.');
 assert.equal(l[2].text,'Resolve Chain Link 2: Ash Blossom & Joyous Spring.');assert.equal(l[3].id,'GD03');
 const solo=linesFor([{id:5,type:'activate',code:2,chain:1,player:0},{id:6,type:'resolve',chain:1},{id:7,type:'chainEnd'}],{db,view:0,chain:new Map()});
 assert.deepEqual(solo.map(x=>x.id),['GD01'],'a one-link chain gets no resolve/end chatter');
});
test('(R54-2) a negation is never explained as activation vs effect (RELAY-176 GD05); it is queued as a subtype gap',()=>{
 const [l]=linesFor([{id:1,type:'negate',chain:1,code:2}],{db});assert.equal(l.id,'GD05');assert.ok(l.likely&&l.queue);assert.match(l.text,/I need more detail/);
 assert.doesNotMatch(l.text,/activation was negated|effect was negated/);
});
test('(R54-3) Fisherman of Legend is on the unsure list (RELAY-179 addendum): fail-safe, never an explanation',()=>{
 assert.ok(UNSURE_CARDS.has(76660178));const [l]=linesFor([{id:1,type:'activate',code:76660178,chain:1,player:1}],{db});assert.ok(l.unsure);assert.equal(l.id,'FAILSAFE');assert.match(l.text,/I’m not sure/);
});
test('(R54-4) no rules-causal template is enabled while rules review is pending (RELAY-180 HIGH 1)',()=>{
 const src=read('learn/coach.mjs').replace(/^\/\/.*$/mg,'');for(const id of ['GD06','GD07','GD08','GD09','GD10','GD11','GD17','GD18','GD19','GD20','GD21','GD22','GD25','GD29'])assert.doesNotMatch(src,new RegExp("id:'"+id+"'"),id);
 assert.match(src,/visiblePresentationEvents/);assert.doesNotMatch(src,/respond\(|reply\(/,'the coach never answers a prompt');
});
test('(R54-5) damage, cost, summons and face-down banish lines use only event facts',()=>{
 const l=linesFor([{id:1,type:'damage',player:1,amount:1800,before:8000,after:6200,combat:true},{id:2,type:'cost',player:0,amount:1000,before:8000,after:7000},{id:3,type:'summon',code:1,player:0,kind:'special'},{id:4,type:'move',code:0,to:{location:32,position:10,controller:1}}],{db,view:0});
 assert.deepEqual(l.map(x=>x.id),['GD27','GD28','GD14','GD24']);assert.match(l[0].text,/Your opponent took 1800 battle damage\. LP now 6200\./);
});
test('(R54-6) Lapawri archived in r55 (tutors picked); music plays only inside Learn; app hands the coach events, not choices to answer',()=>{
 const s=read('learn/learn.mjs');assert.match(s,/ARCHIVED_GUIDE='Lapawri'/);/* r55: Lapawri archived, tutors picked */assert.match(s,/const MUSIC='learn\/music\.mp3'/);assert.match(s,/function syncMusic\(\)\{if\(!music\)return;if\(!el\.hidden&&prefs\.music!==false\)/);
 assert.match(read('app.mjs'),/new CustomEvent\('duel-state',\{detail:\{msg:x,db\}\}\)/);
});

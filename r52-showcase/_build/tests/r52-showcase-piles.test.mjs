// r52 (Claude, 13 Nov 2026). Kevy 12:52 "Each decks boss monster works" (title page art); ChatGPT RELAY-162 T3 group A
// and RELAY-164 T7 (pile effect menu). SELF-VERIFIED until reviewed.
import assert from 'node:assert/strict';import {test} from 'node:test';import fs from 'node:fs';
import {M,R} from '../dist/duel.mjs';
import {pileActions,pileReady,effectLine} from '../dist/pile-glow.mjs';
import {BOSSES,ring} from '../dist/title-showcase.mjs';
const read=f=>fs.readFileSync(new URL('../dist/'+f,import.meta.url),'utf8');
const card=(code,location,sequence,controller=0,description=0n)=>({code,controller,location,sequence,description});
const x=(prompt,choices,extra={})=>({mode:'play',ai:false,disabled:false,view:0,match:{first:0},state:{prompt,finished:false,revision:7},choices,...extra});
const idleChoice=(i,name)=>({label:'Activate · '+name,response:{type:R.SELECT_IDLECMD,action:5,index:i},code:0,detail:'Graveyard'});

test('(R52-1) one card with two offered effects counts 1; two copies count 2; each offered effect is its own menu row',()=>{
 const p={type:M.SELECT_IDLECMD,activates:[card(11,16,0,0,1n),card(11,16,0,0,2n),card(22,16,3),card(22,16,4)],summons:[],special_summons:[]};
 const c=[0,1,2,3].map(i=>idleChoice(i,i<2?'Perfume':'Albaz'));
 assert.equal(pileActions(x(p,c)).length,4);
 const ready=pileReady(x(p,c));assert.equal(ready.length,3,'instance 11@0 once, 22@3 and 22@4 separately');
});
test('(R52-2) only engine-offered responses, only the viewing player, never the Main Deck, hand or field',()=>{
 const p={type:M.SELECT_IDLECMD,activates:[card(11,16,0,1),card(12,1,0),card(13,2,0),card(14,4,0),card(15,32,0),card(16,64,0)]};
 const c=[0,1,2,3,4,5].map(i=>idleChoice(i,'C'+i)).filter((_,i)=>i!==4);/* the banished one is NOT in the offered list */
 const acts=pileActions(x(p,c));assert.deepEqual(acts.map(a=>a.card.code),[16],'opponent GY, Main Deck, hand, field and an unoffered banished card are all excluded');
});
test('(R52-3) Extra Deck summons are not effects: only an offered activation lights the pile',()=>{
 const p={type:M.SELECT_IDLECMD,activates:[],special_summons:[card(30,64,0)]};
 assert.equal(pileReady(x(p,[{label:'Special Summon · X',response:{type:R.SELECT_IDLECMD,action:1,index:0}}])).length,0);
});
test('(R52-4) chain windows and battle chains map to their own response types; AI turn, Watch and finished duels show nothing',()=>{
 const ch={type:M.SELECT_CHAIN,forced:false,selects:[card(40,16,1)]};const cc=[{label:'Chain · Y',response:{type:R.SELECT_CHAIN,index:0}},{label:'Do not chain',response:{type:R.SELECT_CHAIN,index:null}}];
 assert.deepEqual(pileActions(x(ch,cc)).map(a=>a.choice.response),[{type:R.SELECT_CHAIN,index:0}]);
 const bt={type:M.SELECT_BATTLECMD,chains:[card(41,32,0)],attacks:[]};const bc=[{label:'Activate · Z',response:{type:R.SELECT_BATTLECMD,action:0,index:0}}];
 assert.deepEqual(pileActions(x(bt,bc)).map(a=>a.choice.response),[{type:R.SELECT_BATTLECMD,action:0,index:0}]);
 for(const extra of [{ai:true},{mode:'watch'},{disabled:true}])assert.equal(pileActions(x(ch,cc,extra)).length,0);
 assert.equal(pileActions({...x(ch,cc),state:{prompt:ch,finished:true}}).length,0);
});
test('(R52-5) seat 1: the slot is mapped once from the native controller, so our own pile still lights',()=>{
 const p={type:M.SELECT_IDLECMD,activates:[card(50,16,0,1)]};
 assert.equal(pileActions(x(p,[idleChoice(0,'W')],{view:0,match:{first:1}})).length,1);
 assert.equal(pileActions(x(p,[idleChoice(0,'W')],{view:1,match:{first:1}})).length,0);
});
test('(R52-6) an effect the clause map cannot name gets a plain numbered label, never a guessed title',()=>{
 const a={card:card(99999999,16,0),choice:{label:'Activate · Q',detail:'Graveyard'}};
 assert.equal(effectLine(a,{},1,2),'Effect option 1 of 2');assert.equal(effectLine(a,{},1,1),'Use its effect');
});
test('(R52-7) the menu sends only after re-checking the decision key, and opening it sends nothing',()=>{
 const s=read('pile-glow.mjs');
 assert.match(s,/b\.onclick=\(\)=>\{if\(menuKey!==windowKey\(getDecision\(\)\)\)\{close\(\);return\}/);
 assert.equal((s.match(/submit\?\.\(/g)||[]).length,1,'exactly one send site');
 assert.match(s,/if\(menu&&!menu\.hidden&&menuKey!==windowKey\(x\)\)close\(\)/,'a new decision closes the old menu');
});
test('(R52-8) title showcase: one boss per deck, matching decks.json, art files present, no franchise logo',()=>{
 const decks=JSON.parse(read('decks.json'));const list=Array.isArray(decks)?decks:decks.decks;
 assert.deepEqual(BOSSES.map(b=>[b.deck,b.boss]),list.map(d=>[d.id,Number(d.boss)]));
 for(const b of BOSSES)assert.ok(fs.existsSync(new URL('../dist/'+b.art,import.meta.url)),b.art);
 assert.equal(ring(-1,9),8);assert.equal(ring(9,9),0);
 const css=read('css/r52-polish.css');assert.doesNotMatch(css+read('title-showcase.mjs'),/yu-?gi-?oh logo\.|konami\.(png|svg)/i);
 assert.match(css,/prefers-reduced-motion:reduce/);
});
test('(R52-9) wiring: stylesheet after r50, showcase script, offline list, About text',()=>{
 const h=read('index.html');assert.ok(h.indexOf('css/r50-egypt.css')<h.indexOf('css/r52-polish.css'));assert.match(h,/<script type="module" src="title-showcase\.mjs"><\/script>/);
 const a=JSON.parse(read('offline-assets.json'));for(const f of ['./title-showcase.mjs','./css/r52-polish.css'])assert.ok(a.includes(f),f);
 assert.match(read('app-shell.mjs'),/installPileGlow\(\{navigate,submit,getDecision,getDb\}\)/);
 assert.match(read('app.mjs'),/getDb:\(\)=>db,/);
});

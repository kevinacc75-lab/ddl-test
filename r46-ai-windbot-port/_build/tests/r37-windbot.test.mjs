// r37 WindBot pilot + engine-library fixes (Claude as builder, 8 Nov 2026). SELF-VERIFIED until reviewed.
//  A. MSG_SELECT_SUM parser fix, as a behaviour test on the real engine (same method as the r21c/r22 wrapper fixes): a Ritual
//     Summon by level total (Chaos Form -> Blue-Eyes Chaos MAX Dragon, two Level 4 monsters on the field). Fixed library: the
//     prompt lists the two monsters with their levels, the pilot finds the material set, the engine accepts it and MAX is
//     summoned. The library as shipped before r37 (fix reverted in a temporary copy): garbage after the first card and no
//     material set at all (the pilot stalls: "This pilot needs help").
//  B. MSG_SHUFFLE_SET_CARD parser fix: source form (u8 count, all previous then all new locations; engine libduel.cpp).
//  C. dist/windbot/edo.mjs unit checks: SELECT_SUM answer mapping (WindBot -> our index space -> engine), EDOPro hiding
//     rules for the bot (opponent's drawn / moved-to-hand codes zeroed, own kept), and the raw hook is a no-op when unset.
//  D. WindBot (the browser build in dist/wb) plays the opening turns of a real duel against our pilot in Node, through the
//     same WindBotPilot class the duel worker uses: its script loads by name, it answers every prompt, nothing is rejected.
import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {pathToFileURL} from 'node:url';
import {loadBuild,scenario,toIdle,answer,code,db,scripts,LOC,POS} from './lib/engine-scenario.mjs';
import {sumSelections} from '../dist/pilot.mjs';import {wireResponse} from '../dist/duel.mjs';
import {decodeResponse,EdoRouter,MSG} from '../dist/windbot/edo.mjs';
const report={};
// ---------- A ----------
const CF=code('Chaos Form'),MAX=code('Blue-Eyes Chaos MAX Dragon'),W4=code('Gene-Warped Warwolf');
const pack=main=>({id:'t',name:'t',main,extra:[]});
async function ritualPrompt(build){const deckA=pack([CF,MAX,W4,W4,...Array(36).fill(W4)]),deckB=pack(Array(40).fill(W4));
 const d=scenario(build,{decks:[deckA,deckB],first:0,seed:11,place:[{p:0,code:CF,location:LOC.HAND},{p:0,code:MAX,location:LOC.HAND},{p:0,code:W4,location:LOC.MZONE,sequence:0},{p:0,code:W4,location:LOC.MZONE,sequence:1}]});
 toIdle(build,d,0);const act=d.choices().find(c=>c.code===CF&&/Activate/.test(c.label||''))||d.choices().find(c=>c.code===CF);assert.ok(act,'Chaos Form can be activated');d.respond(act.response);
 for(let i=0;i<10&&d.prompt&&d.prompt.type!==build.M.SELECT_SUM;i++)d.respond(answer(build,d));return d}
{const build=await loadBuild(true),d=await ritualPrompt(build),m=d.prompt;assert.equal(m?.type,build.M.SELECT_SUM,'the ritual reaches a SELECT_SUM prompt');
 assert.equal(m.selects_must.length,0,'no must-select cards');assert.ok(m.selects.length>=2,'two or more selectable monsters (field + hand)');
 assert.ok(m.selects.every(c=>c.code===W4&&(c.amount&0xffff)===4&&[LOC.MZONE,LOC.HAND].includes(c.location)),'each listed with its code, location and Level 4');
 assert.equal(m.selects.filter(c=>c.location===LOC.MZONE&&c.position===POS.ATK).length,2,'the two field monsters, face-up Attack Position');
 const sols=sumSelections(m);assert.ok(sols.length>0,'the pilot finds a material set');const before=d.retries;d.respond({type:build.R.SELECT_SUM,indicies:sols[0]});
 for(let i=0;i<10&&d.prompt&&d.prompt.type!==build.M.SELECT_IDLECMD;i++)d.respond(answer(build,d));
 assert.equal(d.retries,before,'the engine accepts the material set');assert.ok(d.zone(0,LOC.MZONE).some(c=>c?.code===MAX),'Blue-Eyes Chaos MAX Dragon is on the field');
 report.fixed={selects:m.selects.length,amount:m.amount,solutions:sols.length,maxSummoned:true};d.stop()}
{// the pre-r37 library: SELECT_SUM fix reverted in a temporary copy of dist (the raw hook stays; it is inert)
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ddl-r37-unfixed-'));for(const f of fs.readdirSync('dist'))if(/\.(mjs|js)$/.test(f))fs.copyFileSync(path.join('dist',f),path.join(dir,f));
 for(const sub of ['ai','core'])fs.cpSync(path.join('dist',sub),path.join(dir,sub),{recursive:true});
 const fixed='()=>({code:e.u32(),controller:e.u8(),location:e.u8(),sequence:e.u32(),position:e.u32(),amount:e.u32()})',old='()=>({code:e.u32(),controller:e.u8(),location:e.u8(),sequence:e.u32(),amount:e.u32()})';
 let s=fs.readFileSync(path.join(dir,'core/index.js'),'utf8');const a='selects_must:Array.from({length:e.u32()},'+fixed+'),selects:Array.from({length:e.u32()},'+fixed+')}';assert.equal(s.split(a).length,2,'fixed SELECT_SUM parser present');
 s=s.replace(a,'selects:Array.from({length:e.u32()},'+old+'),selects_must:Array.from({length:e.u32()},'+old+')}');fs.writeFileSync(path.join(dir,'core/index.js'),s);
 const m0=await import(pathToFileURL(path.join(dir,'duel.mjs')).href);const live=await m0.Duel.create(db,scripts);const build={...m0,live};
 const d=await ritualPrompt(build),m=d.prompt;assert.equal(m?.type,build.M.SELECT_SUM);
 const garbled=!(m.selects.length>=2&&m.selects.every(c=>c.code===W4));const sols=sumSelections(m);
 assert.ok(garbled,'pre-r37 parser: the selectable cards are misread');assert.equal(sols.length,0,'pre-r37 parser: no material set is found (the pilot stalls)');
 report.unfixed={selects:m.selects.length,must:m.selects_must.length,mustCodes:m.selects_must.map(c=>c.code),solutions:sols.length};d.stop();fs.rmSync(dir,{recursive:true,force:true})}
// ---------- B ----------
{const s=fs.readFileSync('dist/core/index.js','utf8');assert.ok(s.includes('case 36:{let l=e.u8(),n=e.u8(),f=Array.from({length:n},()=>p(e)),g=Array.from({length:n},()=>p(e));return{type:t,location:l,cards:f.map((x,i)=>({from:x,to:g[i]}))}}'),'SHUFFLE_SET_CARD: u8 count, previous locations then new locations');
 assert.ok(!s.includes('cards:Array.from({length:e.u32()},()=>({from:p(e),to:p(e)}))'),'old u32 / interleaved form gone');
 assert.equal(s.split('globalThis.__ocgRawHook').length-1,2,'raw hook: one check, one call');assert.ok(s.includes('duelQueryLocationRaw(')&&s.includes('duelQueryRaw('),'raw queries')}
// ---------- C ----------
{const M={type:23,selects_must:[{code:1}],selects:[{code:2},{code:3},{code:4}]};
 // WindBot's SELECT_SUM answer: card-list type 2 (u8), count = must + chosen, chosen indices into the selectable list, then a placeholder per must card
 const wb=Uint8Array.from([2,0,0,0,3,0,0,0,0,2,0]);const r=decodeResponse(MSG.SELECT_SUM,wb,M);assert.deepEqual(r,{type:14,indicies:[0,1,3]},'WindBot -> [must..., selectable+1...]');
 assert.deepEqual(wireResponse(M,r),{type:14,indicies:[0,2]},'our index space -> the engine (selectable list only)');
 assert.deepEqual(wireResponse({type:23,selects_must:[],selects:[1,2]},{type:14,indicies:[1]}),{type:14,indicies:[1]},'no must cards: unchanged');
 assert.deepEqual(wireResponse({type:15},{type:5,indicies:[1]}),{type:5,indicies:[1]},'other prompts: unchanged');
 const sent=[],core={duelQueryLocationRaw:()=>new Uint8Array(0),duelQueryRaw:()=>new Uint8Array(0)},router=new EdoRouter(core,1,0,b=>sent.push(b));
 const draw=(player,codes)=>{const b=new Uint8Array(6+8*codes.length),v=new DataView(b.buffer);b[0]=MSG.DRAW;b[1]=player;v.setUint32(2,codes.length,true);codes.forEach((c,i)=>{v.setUint32(6+8*i,c,true);v.setUint32(10+8*i,0xA,true)});return b};
 router.route(draw(1,[1234,5678]));router.route(draw(0,[1111]));const dv=b=>new DataView(b.buffer,b.byteOffset);
 assert.deepEqual([dv(sent[0]).getUint32(6,true),dv(sent[0]).getUint32(14,true)],[0,0],'opponent draws: codes hidden from the bot');assert.equal(dv(sent[1]).getUint32(6,true),1111,'own draw: code kept');
 const hint=(type,player)=>{const b=new Uint8Array(11);b[0]=MSG.HINT;b[1]=type;b[2]=player;return b};sent.length=0;router.route(hint(3,1));router.route(hint(3,0));assert.equal(sent.length,1,'a select hint for the other player is not sent');
 assert.equal(globalThis.__ocgRawHook??null,null,'no hook set by default')}
// ---------- D ----------
{const {WindBotPilot,loadWindBot}=await import('../dist/windbot/pilot.mjs');const build=await loadBuild(true),{Duel,M,live}=build;
 const exports=await loadWindBot(db,pathToFileURL(path.resolve('dist/wb')+'/'),fs.readFileSync('dist/wb/default.json','utf8'));
 const decks=JSON.parse(fs.readFileSync('dist/decks.json')).decks.map(d=>d.banlistVariants?.['tcg-2026-10-19']?{...d,...d.banlistVariants['tcg-2026-10-19']}:d),pair=[decks.find(d=>d.id==='blueeyes'),decks.find(d=>d.id==='branded')];
 const {createOptimalPilots}=await import('../dist/optimal-pilot.mjs');const {safeView}=await import('../dist/ai/knowledge.mjs');
 const logs=[],real=console.log,realWrite=process.stdout.write.bind(process.stdout);console.log=(...a)=>logs.push(a.join(' '));process.stdout.write=(c,...r)=>{logs.push(String(c));return true};let out;/* WindBot's own log lines (.NET Console) */
 try{const d=new Duel(live.core,db,scripts),seed=71077,first=1,wbSeat=1,ours=createOptimalPilots({seed,searchEnabled:false})[0];
  const bot=new WindBotPilot({seat:wbSeat,seed,deck:pair[wbSeat],exports});await bot.attach(d,wbSeat===first?0:1);
  const counts=[0,1].map(t=>{const s=t===0?first:1-first;return [pair[s].main.length,pair[s].extra.length]});globalThis.__ocgRawHook=(h,raw)=>{if(h===d.handle)bot.batch(d,raw,counts)};
  d.start(pair,{seed,first});let wbDecisions=0,rejected=0,stalled=0,n=0;
  while(d.prompt&&!d.finished&&d.turn<=4&&n<3000){n++;const m=d.prompt,before=d.retries;
   if(m.seat===wbSeat){const plan=bot.plan(d);if(!plan){stalled++;break}d.respond(plan.response);if(d.retries===before){bot.observe(plan);wbDecisions++}else rejected++}
   else{const plan=ours.base(safeView(d,m.seat));d.respond(plan.response);ours.observe(plan)}}
  out={turn:d.turn,finished:d.finished,wbDecisions,rejected,stalled,messagesToBot:bot.router.count,executor:logs.find(l=>/Deck (not )?found/.test(l))||null};d.stop();bot.close()}
 finally{console.log=real;process.stdout.write=realWrite;globalThis.__ocgRawHook=null}
 assert.match(out.executor||'',/Deck found, loading AI_Albaz/,'WindBot loads its Branded (Albaz) script by name');
 assert.equal(out.stalled,0,'WindBot answers every prompt');assert.equal(out.rejected,0,'no WindBot answer is rejected');assert.ok(out.wbDecisions>=10,'WindBot makes its own decisions ('+out.wbDecisions+')');
 assert.ok(out.finished||out.turn>4,'the duel reaches turn 5 or ends');report.windbot=out}
console.log(JSON.stringify({test:'r37-windbot',pass:true,node:process.version,report}));

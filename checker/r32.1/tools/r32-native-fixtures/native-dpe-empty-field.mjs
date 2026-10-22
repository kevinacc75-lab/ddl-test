// From ChatGPT's independent r31 review evidence (22 Oct 2026, zip SHA-256 022092ce…), adapted by Claude to run against this repo's dist. Writes its JSON next to this file.
import fs from 'node:fs';import {gunzipSync} from 'node:zlib';
const build=process.argv[2]||'r32';
const root=new URL('../../dist/',import.meta.url),{Duel,M,R}=await import(new URL('duel.mjs',root)),{createOptimalPilots}=await import(new URL('optimal-pilot.mjs',root)),{safeView}=await import(new URL('ai/knowledge.mjs',root)),{bookActivationBlock}=await import(new URL('ai/book/book.mjs',root));
const db=JSON.parse(gunzipSync(fs.readFileSync(new URL('cards.json.gz',root)))),scripts=JSON.parse(gunzipSync(fs.readFileSync(new URL('scripts.json.gz',root)))),decks=JSON.parse(fs.readFileSync(new URL('decks.json',root))).decks;
const d=await Duel.create(db,scripts);let output={node:process.version,scope:'Auditor chooses engine-legal setup responses on shipped base decks: Normal Summon Shadow Mist, Fusion Destiny into DPE, destroy both own monsters. Opponent declines optional chains. Native trigger window and unmodified base policy are observed; no search, rule or build changes.',found:false};
for(let seed=1;seed<=1000&&!output.found;seed++){
 d.start([decks.find(x=>x.id==='hero'),decks.find(x=>x.id==='branded')],{seed,first:0});const hand=d.zone(0,2).map(c=>d.name(c.code));if(!hand.includes('Fusion Destiny')||!hand.includes('Elemental HERO Shadow Mist'))continue;
 console.log('candidate hand',seed);const pilots=createOptimalPilots({seed,searchEnabled:false});let summoned=false,activatedFD=false,destroying=false;const trace=[];
 for(let step=0;step<120&&d.prompt&&!d.finished&&d.turn===1;step++){
  const p=d.prompt,seat=p.seat,cards=p.selects||p.select_cards||[];let response;
  const ix=p.type===M.SELECT_CHAIN?cards.findIndex(c=>c.code===60461804&&c.location===16):-1;
  if(ix>=0){const baseline=pilots[seat].base(safeView(d,seat));trace.push({step,type:p.type,offered:cards,revivalIndex:ix,response:baseline.response,block:bookActivationBlock(safeView(d,seat),seat,cards[ix])});
   output={...output,found:true,seed,opponentCards:[4,8].reduce((n,l)=>n+d.zone(1,l).filter(Boolean).length,0),trace,history:d.responseHistory.slice(),triggerSequence:[]};
   for(let n=0;n<8&&d.prompt?.type===M.SELECT_CHAIN;n++){const pp=d.prompt,cc=pp.selects||[],di=cc.findIndex(c=>c.code===60461804&&c.location===16);if(di<0)break;const pl=pilots[pp.seat].base(safeView(d,pp.seat));output.triggerSequence.push({offered:cc.map(c=>({code:c.code,location:c.location})),response:pl.response,dpeIndex:di,block:bookActivationBlock(safeView(d,pp.seat),pp.seat,cc[di])});if(pl.response.index===null){output.declinedRevival=true;break}d.respond(pl.response)}break;}
  if(seat===1&&p.type===M.SELECT_CHAIN&&!p.forced)response={type:R.SELECT_CHAIN,index:null};
  if(seat===0&&p.type===M.SELECT_IDLECMD){
   if(!summoned){const i=p.summons.findIndex(c=>d.name(c.code)==='Elemental HERO Shadow Mist');if(i>=0){response={type:R.SELECT_IDLECMD,action:0,index:i};summoned=true}}
   else if(!activatedFD){const i=p.activates.findIndex(c=>d.name(c.code)==='Fusion Destiny');if(i>=0){response={type:R.SELECT_IDLECMD,action:5,index:i};activatedFD=true}}
   else if(!destroying){const i=p.activates.findIndex(c=>c.code===60461804);if(i>=0){response={type:R.SELECT_IDLECMD,action:5,index:i};destroying=true}}
  }
  if(seat===0&&p.type===M.SELECT_CHAIN&&!p.forced){const i=cards.findIndex(c=>c.code===60461804&&c.location===4);if(activatedFD&&summoned&&i>=0&&!destroying&&d.zone(0,4).filter(Boolean).length>=2){response={type:R.SELECT_CHAIN,index:i};destroying=true}else response??={type:R.SELECT_CHAIN,index:null}}
  if(destroying&&d.hint===502){if(p.type===M.SELECT_UNSELECT_CARD)response={type:R.SELECT_UNSELECT_CARD,index:p.can_finish?null:Math.max(0,cards.findIndex(c=>c.code===60461804))};if(p.type===M.SELECT_CARD)response={type:R.SELECT_CARD,indicies:cards.map((_,i)=>i).slice(0,p.min||1)}}
  response??=pilots[seat].base(safeView(d,seat))?.response;if(!response)break;trace.push({step,type:p.type,hint:d.hint,response});const before=d.retries;d.respond(response);if(d.retries!==before){console.log('rejected',seed,step);break;}
 }
}
d.stop();output.build=build;fs.writeFileSync(new URL('./native-dpe-empty-field-'+build+'.json',import.meta.url),JSON.stringify(output,(_,v)=>typeof v==='bigint'?String(v):v,2));console.log(JSON.stringify({found:output.found,seed:output.seed,opponentCards:output.opponentCards,triggerSequence:output.triggerSequence},(_,v)=>typeof v==='bigint'?String(v):v));

// From ChatGPT's independent r31 review evidence (22 Oct 2026, zip SHA-256 022092ce…), adapted by Claude to run against this repo's dist. Writes its JSON next to this file.
import fs from 'node:fs';import {gunzipSync} from 'node:zlib';
const build=process.argv[2]||'r32';const root=new URL('../../dist/',import.meta.url),{Duel,M,R}=await import(new URL('duel.mjs',root)),{bookActivationBlock}=await import(new URL('ai/book/book.mjs',root)),{safeView}=await import(new URL('ai/knowledge.mjs',root));
const db=JSON.parse(gunzipSync(fs.readFileSync(new URL('cards.json.gz',root)))),scripts=JSON.parse(gunzipSync(fs.readFileSync(new URL('scripts.json.gz',root)))),decks=JSON.parse(fs.readFileSync(new URL('decks.json',root))).decks.map(x=>({...x,...(x.banlistVariants?.['tcg-2026-10-19']||{})}));const d=await Duel.create(db,scripts);let out={build,node:process.version,scope:'Native legal fixture on the 19-Oct variant: Normal Summon Incredible Ecclesia, tribute it for Albaz, observe The Fallen & The Virtuous revival option with Ecclesia in the GY and no opposing cards. Auditor chooses setup actions; no build changes.',found:false};
for(let seed=1;seed<=1000&&!out.found;seed++){
 d.start([decks.find(x=>x.id==='branded'),decks.find(x=>x.id==='mikanko')],{seed,first:0});const hand=d.zone(0,2).map(c=>d.name(c.code));if(!hand.includes('The Fallen & The Virtuous')||!hand.includes('Incredible Ecclesia, the Virtuous'))continue;let ns=false,act=false;
 console.log('candidate',seed);
 for(let i=0;i<60&&d.prompt&&d.turn===1;i++){
  const p=d.prompt,opts=d.choices();let r;
  if(p.type===M.SELECT_IDLECMD&&p.seat===0){
   const fv=p.activates.findIndex(c=>d.name(c.code)==='The Fallen & The Virtuous');if(act&&fv>=0&&d.zone(0,16).some(c=>c&&d.name(c.code)==='Incredible Ecclesia, the Virtuous')){
    out={...out,found:true,seed,history:d.responseHistory.slice(),opposingCards:[4,8].reduce((n,l)=>n+d.zone(1,l).filter(Boolean).length,0),ecclesiaGY:true,block:bookActivationBlock(safeView(d,0),0,p.activates[fv])};d.respond({type:R.SELECT_IDLECMD,action:5,index:fv});for(let n=0;n<5&&d.prompt?.type!==M.SELECT_OPTION;n++){if(d.prompt.type!==M.SELECT_PLACE)break;d.respond(d.choices()[0].response)}out.nextPrompt={type:d.prompt.type,choices:d.choices().map(x=>({label:x.label,response:x.response}))};out.revivalOptionOffered=d.choices().some(x=>/Special Summon.*either GY/i.test(x.label));{const {optionPick}=await import(new URL('ai/book/book.mjs',root));const o=optionPick(safeView(d,0),0,d.prompt);out.bookOption=o;out.bookOptionLabel=o?d.choices().find(x=>x.response.index===o.index)?.label:null}break;}
   const arr=ns?p.activates:p.summons,j=arr.findIndex(c=>d.name(c.code)==='Incredible Ecclesia, the Virtuous');if(j>=0){r={type:R.SELECT_IDLECMD,action:ns?5:0,index:j};if(ns)act=true;ns=true;}
  }
  if(!r&&p.type===M.SELECT_CHAIN&&!p.forced)r={type:R.SELECT_CHAIN,index:null};
  if(!r&&p.type===M.SELECT_CARD){const j=p.selects.findIndex(c=>d.name(c.code)==='Fallen of Albaz');r={type:R.SELECT_CARD,indicies:[Math.max(0,j)]}}
  r??=opts.find(x=>x.response.yes===false)?.response||opts[0]?.response;if(!r)break;const before=d.retries;d.respond(r);if(d.retries!==before)break;
 }
}
d.stop();fs.writeFileSync(new URL('./native-fv-revival-'+build+'.json',import.meta.url),JSON.stringify(out,(_,v)=>typeof v==='bigint'?String(v):v,2));console.log(JSON.stringify({...out,history:undefined},(_,v)=>typeof v==='bigint'?String(v):v));

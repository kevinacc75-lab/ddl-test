import {readCompressed} from './load.mjs';
// TASK c: Tea's TCG (Neuron) text overrides, merged by passcode, replace the card text shown in the UI. Display only:
// the duel worker, the AI and the gate read cards.json.gz without them. A missing or bad file leaves the text as it was.
async function textOverrides(){try{const r=await fetch('text-overrides-tcg.json',{signal:AbortSignal.timeout(15000)});if(!r.ok)return null;const o=await r.json();return o&&typeof o.cards==='object'?o.cards:null}catch{return null}}
export function applyTextOverrides(db,cards){let n=0;for(const [code,e] of Object.entries(cards||{})){const c=db[code];if(!c||typeof e?.desc!=='string'||(e.name&&e.name!==c.name))continue;c.desc=e.desc;c.textSource=e.source||'TCG text override';n++}return n}
onmessage=async()=>{try{postMessage({type:'load-progress',message:'Fetching card library…'});const [db,overrides]=await Promise.all([readCompressed('cards.json.gz'),textOverrides()]);applyTextOverrides(db,overrides);postMessage({type:'library',db})}catch(e){postMessage({type:'error',message:e.message})}};

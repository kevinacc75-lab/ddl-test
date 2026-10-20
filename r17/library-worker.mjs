import {readCompressed} from './load.mjs';
onmessage=async()=>{try{postMessage({type:'load-progress',message:'Fetching card library…'});const db=await readCompressed('cards.json.gz');postMessage({type:'library',db})}catch(e){postMessage({type:'error',message:e.message})}};

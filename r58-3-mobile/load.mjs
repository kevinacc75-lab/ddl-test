// r58.2 (Kevy 13 Nov 23:06, phone): a fixed 15-second limit failed big files on slow phone connections (cards.json.gz is
// 1.6 MB, scripts.json.gz 4.9 MB). Now the download is only stopped if no data arrives for 30 seconds.
export async function readCompressed(url,{stallMs=30000}={}){const ctl=new AbortController();let timer=setTimeout(()=>ctl.abort(),stallMs);const poke=()=>{clearTimeout(timer);timer=setTimeout(()=>ctl.abort(),stallMs)};let data;
 try{const r=await fetch(url,{signal:ctl.signal});if(!r.ok)throw Error('Could not load the card library. Refresh and try again.');
  if(r.body?.getReader){const rd=r.body.getReader(),parts=[];let n=0;for(;;){const {done,value}=await rd.read();if(done)break;parts.push(value);n+=value.length;poke()}data=new Uint8Array(n);let o=0;for(const p of parts){data.set(p,o);o+=p.length}}
  else data=new Uint8Array(await r.arrayBuffer())}
 catch(e){if(e?.name==='AbortError')throw Error('The download stopped (no data for '+Math.round(stallMs/1000)+' seconds). Check your connection and tap Retry.');throw e}finally{clearTimeout(timer)}
 const bytes=data;if(data[0]===31&&data[1]===139){if(!globalThis.DecompressionStream)throw Error('This browser needs an update to load the lab.');const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));return JSON.parse(await new Response(stream).text())}return JSON.parse(new TextDecoder().decode(bytes))}

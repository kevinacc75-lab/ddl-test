// Deterministic local randomness for replayable practice; fresh seeds come from crypto.
export function seedHash(text){let h=2166136261;for(const char of String(text)){h^=char.charCodeAt(0);h=Math.imul(h,16777619)}h^=h>>>16;h=Math.imul(h,0x7feb352d);h^=h>>>15;h=Math.imul(h,0x846ca68b);return (h^(h>>>16))>>>0}
export function randomStream(seed){let state=seed>>>0||0x9e3779b9;return ()=>{state^=state<<13;state^=state>>>17;state^=state<<5;return state>>>0}}
export function shuffleDeck(cards,seed,seat){const copy=[...cards],next=randomStream(seedHash(seed+':deck:'+seat));for(let i=copy.length-1;i>0;i--){const limit=Math.floor(4294967296/(i+1))*(i+1);let value;do{value=next()}while(value>=limit);const j=value%(i+1);[copy[i],copy[j]]=[copy[j],copy[i]]}return copy}
export function engineSeeds(seed){return Array.from({length:4},(_,i)=>(BigInt(seedHash(seed+':core:'+i+':hi'))<<32n)|BigInt(seedHash(seed+':core:'+i+':lo')))}

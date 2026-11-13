// Matches the bundled ProjectIgnis Auxiliary.Stringid exactly.
export function decodeEffectId(value){
 const n=BigInt(value||0);
 return n<10000n?{system:Number(n),code:null,index:null}:{system:null,code:Number(n>>20n),index:Number(n&0xFFFFFn)};
}
// The core expects each original item's destination rank, not a list of indices.
export function orderRanks(indices){const ranks=Array(indices.length);indices.forEach((index,rank)=>ranks[index]=rank);return ranks}

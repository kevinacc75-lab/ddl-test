// r46: WindBot expert rules ported into our book (Kevy 11 Nov 2026 14:54 AEDT). Sources: windbot-ignis
// Game/AI/Decks/AlbazExecutor.cs and ExecutorBase/Game/AI/DefaultExecutor.cs. Each rule names its WindBot origin and has a
// switch in ai/r46-flags.mjs. Rules only remove or rank options the engine already offers; the engine stays the judge of
// legality. No hidden card is read: only our own zones, public fields, GYs and the chain.
import {R46} from '../r46-flags.mjs';
const HAND=2,FIELD=4,SZONE=8,GY=16,EXTRA_DECK=64,EXTRA=64|8192|8388608|67108864;
const CARTESIA=95515789,WHITE=73819701,SHROUDED=25451383,FUWALOS=42141493,NOT_MATERIAL=[38811586,3410461],ALBAZ=68468459,MIRRORJADE=44146295,RINDBRUMM=51409648,TITANIKLAD=41373230,LENATUS=3410461,LUBELLION=70534340,SANCTIFIRE=38811586,QUEM=45883110,FUSION=44362883;
const faceUp=c=>Boolean(c?.position&5);
const owner=(d,c)=>d.fromEngine?d.fromEngine(c.controller):c.controller;
// Hand traps that answer an activation (DefaultTrap: only when LastChainPlayer is the opponent).
export const ANSWER_TRAPS=/^(Ash Blossom & Joyous Spring|Ghost Ogre & Snow Rabbit|Ghost Belle & Haunted Mansion|Infinite Impermanence|Effect Veiler|Called by the Grave|Crossout Designator|Droll & Lock Bird|Ghost Mourner & Moonlit Chill|Forbidden Droplet|Sky Striker Mecha - Widow Anchor)$/;
const NEEDS_ACTIVATION=/^(Ash Blossom & Joyous Spring|Ghost Ogre & Snow Rabbit|Ghost Belle & Haunted Mansion|Crossout Designator)$/;
// r47 (RELAY-140 W1): these do not answer an activation; they act on the opponent's face-up monsters, so chaining one to our
// own link can be a deliberate play (our Forbidden Droplet on our own Branded Fusion to switch off their Lubellion). The
// own-chain guard keeps blocking them only when the opponent shows no face-up Effect Monster to use them on.
export const PROACTIVE=/^(Infinite Impermanence|Effect Veiler|Forbidden Droplet|Sky Striker Mecha - Widow Anchor|Ghost Mourner & Moonlit Chill)$/;
const EFFECT_MONSTER=0x20;
const theirEffectMonster=(d,seat)=>d.zone(1-seat,FIELD).some(x=>x&&faceUp(x)&&((d.db[x.code]?.type||0)&EFFECT_MONSTER));
const top=d=>{const ch=d.chain||[];for(let i=ch.length-1;i>=0;i--)if(ch[i]&&!ch[i].solved)return ch[i];return null};
export function wbActivationBlock(d,seat,c){
 if(!R46.on||!c)return null;
 const n=d.name(c.code),t=top(d);
 if(R46.ownChainGuard&&d.prompt?.type!==undefined&&ANSWER_TRAPS.test(n)&&(c.location===HAND||c.location===SZONE)){
  if(t&&t.controller===seat&&!(R46.w1Proactive&&PROACTIVE.test(n)&&theirEffectMonster(d,seat)))return 'W1 (WindBot DefaultTrap): '+n+' is not chained to our own '+d.name(t.code);
  if(!t&&NEEDS_ACTIVATION.test(n))return 'W1 (WindBot DefaultTrap): '+n+' needs an opposing activation';
 }
 if(R46.mirrorjadeTiming&&c.code===MIRRORJADE&&c.location===FIELD&&d.active!==seat&&isBranded(d,seat)){
  const enemy=d.zone(1-seat,FIELD).filter(faceUp);if(!enemy.length)return null;
  const extraMonster=enemy.some(x=>(d.db[x.code]?.type||0)&EXTRA);
  const activatingAlbaz=(d.chain||[]).some(l=>l&&!l.solved&&l.controller!==seat&&l.code===ALBAZ&&(l.triggering_location??l.location)===FIELD);
  const battle=[8,16,32,64,128].includes(d.phase),end=d.phase===512;
  if(!(extraMonster||activatingAlbaz||battle||end))return 'W3 (WindBot Mirrorjade): hold Mirrorjade on their turn until an Extra Deck monster, an activating Albaz, the Battle Phase or their End Phase';
 }
 if(R46.fuwalosTiming&&c.code===FUWALOS&&c.location===HAND&&(d.active===seat||d.phase>=8))return 'W9 (WindBot Maxx "C" timing): Fuwalos only on the opponent\'s turn before their Battle Phase';
 if(R46.cartesia&&c.code===CARTESIA&&c.location===FIELD&&isBranded(d,seat)){
  const atk=x=>Number(x.attack??d.db[x.code]?.attack??0);
  const fieldMats=d.zone(seat,FIELD).filter(x=>x&&x.code>0&&x.sequence!==c.sequence&&!NOT_MATERIAL.includes(x.code)&&atk(x)<=2500);
  const handMats=d.zone(seat,HAND).filter(x=>x&&(d.db[x.code]?.type&1));
  if(!fieldMats.length&&!handMats.length)return 'W11 (WindBot Cartesia): no material with 2500 or less ATK; never fuse away our Mirrorjade or another boss';
  if(d.active!==seat){
   const haveJade=d.zone(seat,FIELD).some(x=>faceUp(x)&&x.code===MIRRORJADE),quem=d.zone(seat,FIELD).some(x=>faceUp(x)&&x.code===QUEM);
   const albazField=d.zone(seat,FIELD).some(x=>faceUp(x)&&[ALBAZ,WHITE,SHROUDED].includes(x.code));
   if(haveJade&&!quem&&!albazField)return 'W11 (WindBot Cartesia): on their turn only for Mirrorjade, Sanctifire or the delayed Nadir Granguignol';
  }
 }
 return null;
}
const isBranded=(d,seat)=>d.decks?.[seat]?.id==='branded';
const remaining=(d,seat,code)=>(d.decks?.[seat]?.main||[]).filter(x=>x===code).length>[HAND,FIELD,SZONE,GY,32].flatMap(l=>d.zone(seat,l)).filter(x=>x?.code===code).length;
// W4: Mirrorjade cost (send 1 Albaz Fusion from the Extra Deck), AlbazExecutor checkDict order adapted to the 41 list.
export function wbPick(d,seat,m,response,M,R){
 if(!R46.on||!isBranded(d,seat))return null;
 {const cm=wbCartesiaMaterial(d,seat,m,response,M,R);if(cm)return cm}
 if(R46.mirrorjadeCost&&d.currentEffect?.code===MIRRORJADE&&m?.type===M.SELECT_CARD&&d.hint===504&&response?.indicies?.length===1){
  const cards=m.selects||[];if(!cards.every(c=>c.location===EXTRA_DECK))return null;
  const hand=d.zone(seat,HAND).filter(Boolean).length,albazGY=d.zone(seat,GY).some(c=>c?.code===ALBAZ);
  const order=[[RINDBRUMM,()=>d.active!==seat&&albazGY&&hand>0],[TITANIKLAD,()=>remaining(d,seat,QUEM)],[LENATUS,()=>remaining(d,seat,FUSION)],[LUBELLION,()=>true],[SANCTIFIRE,()=>true]];
  for(const [code,ok] of order){const i=cards.findIndex(c=>c.code===code);if(i>=0&&ok()){if(i===response.indicies[0])return null;return {response:{...response,indicies:[i]},rule:'W4 (WindBot Mirrorjade cost order)',card:d.name(code)}}}
 }
 return null;
}
// W11 material: Cartesia never uses our monster with more than 2500 ATK when another legal material is offered.
export function wbCartesiaMaterial(d,seat,m,response,M,R){
 if(!R46.on||!R46.cartesia||!isBranded(d,seat)||d.currentEffect?.code!==CARTESIA||d.hint!==511)return null;
 const atk=x=>Number(x.attack??d.db[x.code]?.attack??0),big=x=>x&&owner(d,x)===seat&&x.location===FIELD&&atk(x)>2500;
 if(m?.type===M.SELECT_CARD&&response?.indicies?.length===1){const cards=m.selects||[];if(!big(cards[response.indicies[0]]))return null;const i=cards.findIndex(x=>!big(x));return i<0?null:{response:{...response,indicies:[i]},rule:'W11 (WindBot Cartesia material: 2500 ATK or less)',card:d.name(cards[i].code)}}
 if(m?.type===M.SELECT_UNSELECT_CARD&&response?.index!=null){const cards=m.select_cards||[];if(!big(cards[response.index]))return null;const i=cards.findIndex(x=>!big(x));if(i>=0)return {response:{...response,index:i},rule:'W11 (WindBot Cartesia material: 2500 ATK or less)',card:d.name(cards[i].code)};if(m.can_finish)return {response:{...response,index:null},rule:'W11 (WindBot Cartesia material: finish without our boss)',card:null}}
 return null;
}
// W2: Ghost Ogre & Snow Rabbit on their activated field card (key or Extra Deck), never their Mirrorjade.
export function wbGhostOgre(d,seat,m,blocked,isKey){
 if(!R46.on||!R46.ghostOgre||d.active===seat)return null;
 const t=top(d);if(!t||t.controller===seat||t.code===MIRRORJADE)return null;
 const tl=t.triggering_location??t.location;if(tl!==FIELD&&tl!==SZONE)return null;
 const info=d.db[t.code]||{},extra=!!(info.type&EXTRA);if(!extra&&!isKey(d.name(t.code)))return null;
 const i=(m.selects||[]).findIndex((c,i)=>c.location===HAND&&d.name(c.code)==='Ghost Ogre & Snow Rabbit'&&!blocked?.(c,i));
 return i<0?null:{index:i,card:'Ghost Ogre & Snow Rabbit',reason:'W2 (WindBot Ghost Ogre): destroy '+d.name(t.code)+(extra?' (an Extra Deck monster)':' (one of their key cards)')};
}
// W12: attacker options. r47 (RELAY-140): the guard now reads the battle the way the rules resolve it.
//  - our battle value is ATK, or DEF when the monster attacks from Defense Position (Scareclaw Kashtira and the like);
//  - a monster whose own text changes the battle (cannot be destroyed by battle, battle damage reflected or prevented, an
//    effect when it attacks / battles / at damage calculation) is never held back here: Ohime the Manifested Mikanko with
//    0 ATK into Blue-Eyes is a 3000-damage attack. The same goes for a monster carrying an Equip Card;
//  - against a face-up Attack Position target an equal value is a legal trade (both destroyed) and is left to the policy;
//    only a strictly stronger target is hopeless. A Defense Position target with DEF at least our value is a wall;
//  - a face-down target is unknown and still allowed. Only public information is read.
const DEFENSE=0xC,ATTACK_POS=0x3;
const BATTLE_TEXT=/cannot be destroyed by battle|battle damage|(?:at the start of|at the end of) the damage step|(?:during|before|after) damage calculation|if this card attacks|when this card attacks|this card battles|this card declares an attack|this card can attack directly|piercing/i;
export function wbBattleValue(d,x){const info=d.db[x.code]||{};return (x.position&DEFENSE)&&!(x.position&ATTACK_POS)?Number(x.defense??info.defense??0):Number(x.attack??info.attack??0)}
export function wbAttackBlock(d,seat,c){
 if(!R46.on||!R46.attackGuard||!c||c.direct_attackable)return null;
 const mine=d.zone(seat,FIELD).find(x=>x&&x.code===c.code&&(c.sequence===undefined||x.sequence===c.sequence))||c;
 const legacy=!R46.w12Battle,info=d.db[c.code]||{};
 if(!legacy){
  if(BATTLE_TEXT.test(info.desc||''))return null;
  if(d.zone(seat,SZONE).some(e=>e&&faceUp(e)&&((d.db[e.code]?.type||0)&0x40000)))return null;/* we control an Equip Card: battle text may be on it */
 }
 const val=legacy?Number(mine.attack??info.attack??0):wbBattleValue(d,mine);
 const foes=d.zone(1-seat,FIELD).filter(Boolean);if(!foes.length)return null;
 if(foes.some(x=>!faceUp(x)))return null;
 const power=x=>(x.position&1)?Number(x.attack??0):Number(x.defense??0);
 if(foes.some(x=>power(x)<val||(!legacy&&(x.position&1)&&power(x)===val)))return null;
 return 'W12 (WindBot OnBattle): '+d.name(c.code)+' ('+val+(legacy||val===Number(mine.attack??info.attack??0)?' ATK':' DEF, attacking from Defense Position')+') cannot destroy any visible target';
}

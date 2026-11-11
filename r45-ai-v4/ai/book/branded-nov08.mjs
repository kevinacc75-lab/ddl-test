// TEST only: Kevy's 8 Nov 2026 pure Branded preset; the engine remains the source of legal options.
import legacy from './branded-lines.mjs';
import {V4} from '../v4-flags.mjs';/* r45 v4 */
export const BRANDED_NOV08='TCG Advanced — 19 October 2026 (MetaGamesGX Pure Branded 41 · 10 Nov video)';
export const isBrandedNov08=deck=>deck?.id==='branded'&&deck.format===BRANDED_NOV08;
const A='Fallen of Albaz', W='Fallen of the White Dragon', K='Springans Kitt', Q='Guiding Quem, the Virtuous',
 C='Blazing Cartesia, the Virtuous', E='Incredible Ecclesia, the Virtuous', F='Branded Fusion', V='The Fallen & The Virtuous',
 L='Lubellion the Searing Dragon', M='Mirrorjade the Iceblade Dragon', T='Titaniklad the Ash Dragon', G='Granguignol the Dusk Dragon',
 D='The Dragon that Devours the Dogma', R='Rindbrumm the Striking Dragon', B='Alba-Lenatus the Abyss Dragon',
 S='Albion the Sanctifire Dragon', LL='Despian Luluwalilith', LOST='Branded Lost', RET='Branded Retribution',
 N='Nadir Servant', RED='Branded in Red', DEP='Fusion Deployment', OPEN='Branded Opening',
 AL='Aluber the Jester of Despia', BLS='The Bystial Lubellion', MER='Tri-Brigade Mercourier',
 ED='Ecclesia and the Dark Dragon', THREE='The Three Champions of Swordsoul';
const drop=new Set(['G-04','R33-PHARA','G-03','L-07','V53-WD','V53-SYN','V53-L3','V53-QC']);
const retired=new Set(['Phara the Primordial Goddess','Albion the Branded Dragon','Red-Eyes Dark Dragoon','Dark Magician','Red-Eyes Black Dragon','The Golden Swordsoul','Dogmatika Fleurdelis, the Knighted','The Bystial Lubellion','Bystial Saronir','Bystial Magnamhut','Fusion Deployment','Branded Lost','Branded in Red','Infinite Impermanence','Hyperinvoked Aeon','Ecclesia and the Dark Dragon',/* r42: Aeon and Dark Dragon out; Sanctifire and Alba-Lenatus back in */'Despian Luluwalilith']);
const line=(id,name,when,steps)=>({id,name,when,steps});
const act=(card,location)=>({do:'activate',card,...(location?{location}: {})});
const summon=card=>({do:'summon',card});
const special=card=>({do:'special',card});
const pick=(source,hint,prefer,extra={})=>({source,hint,prefer,...extra});
const replacements=new Set([V,N,AL,F,A,K,W,'Gold Sarcophagus',RET,'Branded in White','Tri-Brigade Springans Kitt']);
const retainedPicks=legacy.picks.filter(p=>!retired.has(p.source)&&!replacements.has(p.source)).map(p=>({...p,prefer:p.prefer.filter(n=>!retired.has(n)),...(p.keep?{keep:p.keep.filter(n=>!retired.has(n))}:{})})).filter(p=>p.prefer.length);
export const brandedNov08Book={
 ...legacy,source:BRANDED_NOV08,starters:[AL,F,OPEN,W,K,N,'Branded in White'],/* r41 (RELAY-131): Tri-Brigade Springans Kitt is a body/material, not a starter (no Normal Summon search) */
 conditionalStarters:legacy.conditionalStarters.map(p=>p.ifHandAny?{...p,ifHandAny:p.ifHandAny.filter(n=>!retired.has(n))}:p),
 lines:[
  ...legacy.lines.filter(x=>!drop.has(x.id)&&!['V53-CART','RULE-NS-2','B-02','R30-QNS'].includes(x.id)),
  line('K08-WHITE','White Dragon recruits Ecclesia; keep a live Fusion route before taking an offered Level 8 Synchro',{hand:[W]},[act(W,[2]),act(W,[4])]),
  ...legacy.lines.filter(x=>['V53-CART','RULE-NS-2'].includes(x.id)),
  line('K08-KITT','Original Springans Kitt: summon, search, then use the available Branded line',{hand:[K]},[special(K),summon(K),act(K,[4]),act(F)]),
  // r41 (RELAY-131): 19304410 has no Normal Summon effect. Only its free hand Special Summon is a book step, and only while
  // Mercourier (a Tri-Brigade) is face-up: an extra body/material whose GY trigger can revive Albaz. No Normal Summon is forced.
  line('K08-TRI-KITT','Tri-Brigade Springans Kitt: no Normal Summon search; Special Summon it from hand while Mercourier is on the field, as a body or Fusion material whose GY trigger revives Albaz',{hand:['Tri-Brigade Springans Kitt'],field:[MER]},[act('Tri-Brigade Springans Kitt',[2])]),
  line('K08-NADIR','Nadir after Extra Deck plays: Garura or a Dogmatika send prepares Quem/Ecclesia follow-up',{hand:[N]},[act(N),summon(Q),act(Q,[4])]),
  // r45 v4 item 2: backup (recovery) lines. They come after every main line, so they only run when the main lines have
  // nothing legal left, typically after a turn-1 interruption (Ash on Aluber / Branded Fusion). Each is a real
  // follow-up the 41 list can still make from the cards left; book.mjs skips ids starting 'V4-' when V4.recovery is off.
  line('V4-R-ALBION','Recovery: Albion the Shrouded Dragon sends a Branded card or Albaz from hand to Special Summon itself (a named Albaz body for Cartesia / Super Poly)',{hand:['Albion the Shrouded Dragon']},[act('Albion the Shrouded Dragon',[2]),act(C,[2]),act(C,[4])]),
  line('V4-R-ECCLESIA','Recovery: Incredible Ecclesia (opponent has more monsters) tributes itself for Fallen of Albaz, whose summon Fusion uses their monster',{hand:[E]},[special(E),act(E,[4])]),
  line('V4-R-QUEM-CART','Recovery: Quem sends Albaz, then Cartesia from hand Fusion Summons a Level 8',{hand:[Q,C]},[summon(Q),act(C,[2]),act(C,[4])]),
  line('V4-R-CART','Recovery: Cartesia from hand when Albaz is on the field or in the GY, then its Fusion',{hand:[C],gyAny:[A,'Albion the Shrouded Dragon']},[act(C,[2]),act(C,[4])])
 ],
 blocks:legacy.blocks.filter(b=>!retired.has(b.card)&&!retired.has(b.ifUnused)),
 picks:[
  pick(K,[506],[F,'Branded in White',OPEN,V,RET,'Branded in High Spirits'],{ifNotHand:[F]}),
  pick(K,[506],[V,'Branded in White',RET,OPEN,'Branded in High Spirits']),
  pick(AL,[506],[F,'Branded in White',OPEN,RET,'Branded in High Spirits',V],{ifNotHand:[F]}),
  pick(AL,[506],[V,'Branded in White',RET,OPEN]),
  pick(F,[509],[L,'Despian Quaeritis','Mixousia the Confounder',T,R,S]),/* r42: Aeon removed; Sanctifire (Albaz + LIGHT Spellcaster) as a late option */
  pick(F,[511],[A,'Albion the Shrouded Dragon',AL,E,'Cocatorium the Heavy Metal Avian'],{location:[1,4,2]}),
  pick(A,[509],[M,D,L,T,R,'Despian Quaeritis','Mixousia the Confounder']),
  pick(W,[504],[T,B,D,R,L,S,'Despian Quaeritis']),/* r42: Alba-Lenatus send = End Phase Branded Fusion search; Sanctifire is a legal send too */
  pick(W,[509],[E]),
  pick(V,[504],[T,B,D,R,L,S,'Despian Quaeritis']),
  pick(N,[504],[T,'Garura, Wings of Resonant Life',G,D,'Mixousia the Confounder']),
  pick(N,[506],[Q,A,W],{ifNotHand:[Q]}),
  pick(N,[506],[A,W,Q]),
  pick(RET,[506],[F,'Branded in White',V,OPEN,'Branded in High Spirits']),
  ...retainedPicks
 ],
 setHold:{...legacy.setHold,neverSet:[]}
};
const EXTRA=64|8192|8388608|67108864;
const BYSTIAL=new Set([33854624,60242223]);
const protectedGY=new Set([68468459,73819701,25451383,45883110,95515789,55273560,17751597,30271097,44362883]);
const owner=(d,c)=>d.fromEngine?d.fromEngine(c.controller):c.controller;
const preserve=(d,seat,c)=>owner(d,c)===seat&&c.location===16&&(protectedGY.has(c.code)||Boolean(d.db[c.code]?.type&EXTRA));
const lightDark=c=>Boolean(c?.attribute&0x30);
// Used by both baseline and root search filtering; only hold for options offered now.
// It does not invent future routes or a legal Synchro behind an active engine lock.
export function brandedNov08ActivationBlock(d,seat,card,M){
 if(!isBrandedNov08(d.decks?.[seat]))return null;
 if(card.code===1984618&&d.active===seat&&d.prompt?.type===M.SELECT_IDLECMD){
  const m=d.prompt,live=c=>!(d.attempts?.get(d.key(c))>0);
  // r42: Dark Dragon (78397661) is gone; a Three Champions Synchro that the r42 hold would refuse does not keep Nadir waiting.
  if((m.special_summons||[]).some(c=>c.location===64&&!championsSummonHold(d,seat,c)||c.code===45484331)||
     (m.activates||[]).some(c=>live(c)&&([44362883,34995106,73819701,70534340].includes(c.code)||c.code===95515789&&c.location===4))||
     (m.summons||[]).some(c=>[62962630,45484331].includes(c.code)))
   return 'Branded 41: keep Nadir until the offered Fusion/Synchro route or starter has been used.';
 }
 // The first window after recruiting Ecclesia can be a fast-effect window, before Synchros are offered.
 // Preserve both branches until the open Main Phase, unless the opponent is already doing something to answer.
 if(card.code===55273560&&card.location===4&&d.active===seat&&[4,256].includes(d.phase)&&d.prompt?.type===M.SELECT_CHAIN&&
    fieldHas(d,seat,73819701)&&fieldHas(d,seat,55273560)&&(NOV08_EXTRA.synchroL8.some(code=>inExtra(d,seat,code))&&championsTargets(d,seat).length>0||inExtra(d,seat,NOV08_EXTRA.sanctifire)||
     ownHand(d,seat).some(c=>[FUSION,BRANDED_IN_WHITE,KITT].includes(c.code)))&&
    !(d.chain||[]).some(c=>c.controller!==seat&&!c.solved))
  return 'Branded 41: keep Ecclesia until open Main Phase to compare the Three Champions, Sanctifire and Albaz branches.';
 if(card.code===FALLEN_VIRTUOUS&&!publicTargets(d,seat).length&&!plausibleVirtuousRevival(d,seat))
  return 'Hold The Fallen & The Virtuous: no opposing face-up target and no plausible legal revival.';
 if(card.code===CHAMPIONS&&card.location===FIELD&&d.prompt?.type===M.SELECT_IDLECMD&&!championsTargets(d,seat).length)
  return 'Hold Three Champions: no worthwhile opposing face-up card to negate.';
 if(card.code===SANCTIFIRE&&card.location===FIELD&&d.active!==seat&&!sanctifireReviveLive(d,seat))
  return 'Hold Albion the Sanctifire Dragon: no Albaz-line monster of ours in the GY to revive (it also gives the opponent a monster).';
 if(BYSTIAL.has(card.code)&&card.location===2){
  const theirs=d.zone(1-seat,16).filter(c=>c&&lightDark(d.db[c.code]));
  const mine=d.zone(seat,16).filter(c=>c&&lightDark(d.db[c.code]));
  if(!theirs.length&&mine.length&&mine.every(c=>preserve(d,seat,c)))return 'Branded 41: hold Bystial rather than banish our Albaz, Ecclesia or Fusion recovery.';
 }
 return null;
}
export function brandedNov08BystialPick(d,seat,m,response){
 if(!isBrandedNov08(d.decks?.[seat])||!BYSTIAL.has(d.currentEffect?.code)||d.hint!==503||response?.indicies?.length!==1)return null;
 const cards=m.selects||[],current=cards[response.indicies[0]];
 if(!current||!preserve(d,seat,current))return null;
 let index=cards.findIndex(c=>owner(d,c)!==seat&&c.location===16);
 if(index<0)index=cards.findIndex(c=>!preserve(d,seat,c));
 return index<0?null:{response:{...response,indicies:[index]},rule:'Preserve our Branded GY recovery',card:d.name(cards[index].code)};
}

const ALBAZ=68468459, WHITE=73819701, QUEM=45883110, ECCLESIA=55273560, CARTESIA=95515789;
const CHAMPIONS=74405783, LULU=53971455, NADIR=1984618, GRANGUIGNOL=24915933, SANCTIFIRE=38811586, LENATUS=3410461, SUPER_POLY=48130397;
// r42 (Kevy 10 Nov 23:20 AEDT, budget Extra Deck): the swap points for the Extra Deck Synchro / Fusion roles live here.
// synchroL8: Level 8 Synchros White + Ecclesia may make (Three Champions only; it is made ONLY against a worthwhile
// opposing target, there is no empty-board Synchro fallback). sanctifire / lenatus: cannot be used as Fusion Material.
export const NOV08_EXTRA=Object.freeze({synchroL8:Object.freeze([CHAMPIONS]),sanctifire:SANCTIFIRE,lenatus:LENATUS,notMaterial:Object.freeze([SANCTIFIRE,LENATUS])});
const FUSION=44362883, DEPLOYMENT=6498706, KITT=45484331, BRANDED_IN_WHITE=34995106, TRI_KITT=19304410, DOG_ECCLESIA=60303688;
const keepForTurn=new Set([ALBAZ,WHITE,QUEM,ECCLESIA,CARTESIA,FUSION,BRANDED_IN_WHITE,36637374,30271097,62962630,TRI_KITT,DOG_ECCLESIA,14558127,59438930]);
const MIRRORJADE=44146295, SZONE=8, HAND=2, FIELD=4, GY=16, BANISHED=32, EXTRA_DECK=64;
const faceUp=c=>Boolean(c?.position&5);
const fieldHas=(d,seat,code)=>d.zone(seat,FIELD).some(c=>faceUp(c)&&c.code===code);
const inExtra=(d,seat,code)=>d.zone(seat,EXTRA_DECK).some(c=>c?.code===code);
const ownHand=(d,seat)=>d.zone(seat,HAND).filter(Boolean);
const ownRemaining=(d,seat,code)=>(d.decks?.[seat]?.main||[]).filter(c=>c===code).length>
 [HAND,FIELD,SZONE,GY,BANISHED].flatMap(l=>d.zone(seat,l)).filter(c=>c?.code===code).length;
const canNormal=(d,seat,M)=>{const h=d.seatContext?.history??d.knowledge?.[seat]?.history;
 return Array.isArray(h)&&!h.some(x=>x?.seat===seat&&x.event?.turn===d.turn&&x.promptType===M.SELECT_IDLECMD&&[0,3].includes(x.response?.action))};
// Public board heuristic before activation. The native target prompt supplies actual legality.
const targetingShield=/cannot be targeted|neither player can target|cannot target this card/i;
const worthwhile=(d,c)=>{
 const card=d.db[c?.code];
 return faceUp(c)&&!(c.status&1)&&!targetingShield.test(card?.desc||'')&&
  Boolean(card?.type&(c.location===FIELD?32:(2|4)));
};
const publicTargets=(d,seat)=>{
 const foe=1-seat,spells=d.zone(foe,SZONE).filter(faceUp),monsters=d.zone(foe,FIELD).filter(faceUp);
 const huLi=monsters.some(c=>!(c.status&1)&&[6327734,6327735].includes(c.code))&&spells.some(c=>c.equipCard);
 const zoneShield=[...monsters,...spells].some(c=>!(c.status&1)&&/your opponent cannot target [^.]*(spells?|traps?|cards you control)/i.test(d.db[c.code]?.desc||''));
 return [...monsters,...spells].filter(c=>!targetingShield.test(d.db[c.code]?.desc||'')&&!(zoneShield&&c.location===SZONE)&&
  !(huLi&&/Mikanko/i.test(d.name(c.code))));
};
const FALLEN_VIRTUOUS=30271097,ECCLESIA_SET=0x1cf,PROC_COMPLETE=0x8;
const MONSTER=1,RITUAL=0x80,SPECIAL_SUMMON_ONLY=0x2000000;
const ecclesiaMonster=info=>(info?.type&MONSTER)&&info.setcodes?.some(set=>(set&0xfff)===ECCLESIA_SET);
// The engine exposes STATUS_PROC_COMPLETE in its public GY card query. No
// hidden-zone reads, and no assumption that an Extra Deck send was a summon.
const plausibleVirtuousRevival=(d,seat)=>{
 const field=d.zone(seat,FIELD),ownGY=d.zone(seat,GY);
 if(field.slice(0,5).filter(Boolean).length===5)return false;
 if(![...field,...ownGY].some(c=>faceUp(c)&&ecclesiaMonster(d.db[c.code])))return false;
 return [...ownGY,...d.zone(1-seat,GY)].some(c=>{
  const type=d.db[c?.code]?.type||0;
  return (type&MONSTER)&&(!(type&(EXTRA|RITUAL|SPECIAL_SUMMON_ONLY))||Boolean(c.status&PROC_COMPLETE))&&(!V4.on||!V4.recovery||goodVirtuousRevive(d,seat,c));/* r45 v4 */
 });
};
const championsTargets=(d,seat)=>publicTargets(d,seat).filter(c=>worthwhile(d,c));
// r42: never Synchro Summon Three Champions without a worthwhile opposing face-up target (its negate is the point; with
// Ecclesia and the Dark Dragon gone there is no other Level 8 Synchro to fall back to). Applies to the base policy too.
const championsSummonHold=(d,seat,c)=>c?.location===EXTRA_DECK&&NOV08_EXTRA.synchroL8.includes(c.code)&&!championsTargets(d,seat).length;
export function brandedNov08SpecialBlock(d,seat,c){
 if(!isBrandedNov08(d.decks?.[seat]))return null;
 if(championsSummonHold(d,seat,c))return 'Branded 41: hold the Three Champions Synchro: no worthwhile opposing target.';
 return null;
}
/* r44 (RELAY-135, Kevy 11 Nov 01:58 AEDT): Super Polymerization may use our OWN face-down monsters (their codes are
   ours to know); the opponent's monsters only face-up. With a seat, a material counts if it is face-up on either field or
   on our own field in any position. Without a seat the r42 face-up-only reading is kept. No hidden opponent card is read. */
const matOk=(s,c,seat)=>Boolean(c)&&(faceUp(c)||(seat!==undefined&&s===seat&&c.code>0));
const albazOnAField=(d,seat)=>[0,1].some(s=>d.zone(s,FIELD).some(c=>matOk(s,c,seat)&&(c.code===ALBAZ||c.code===WHITE||d.name(c.code)==='Fallen of Albaz')));
const albazCount=(d,seat)=>[0,1].reduce((n,s)=>n+d.zone(s,FIELD).filter(c=>matOk(s,c,seat)&&(c.code===ALBAZ||c.code===WHITE)).length,0);/* Albaz + White: White is the Dragon */
const lightSpellcasterOnAField=(d,seat)=>[0,1].some(s=>d.zone(s,FIELD).some(c=>{const i=d.db[c?.code];return matOk(s,c,seat)&&(c.attribute||i?.attribute)&0x10&&Number(c.race||i?.race)&0x2}));
const dragonOnAField=(d,seat)=>[0,1].some(s=>d.zone(s,FIELD).some(c=>{const i=d.db[c?.code];return matOk(s,c,seat)&&c.code!==ALBAZ&&c.code!==WHITE&&!NOV08_EXTRA.notMaterial.includes(c.code)&&Number(c.race||i?.race)&0x2000}));
// r42/r44: Super Polymerization uses monsters on the fields only. Sanctifire / Alba-Lenatus are Super Poly targets only with
// a Fallen of Albaz (or White, treated as Albaz) on a field plus their second material on a field: face-up on either field,
// or (r44, RELAY-135) any of our OWN monsters including face-down ones (matOk). Never an opponent-only answer.
// (r45: this comment previously still said "face-up" only; ChatGPT RELAY-137 flagged it as stale. Code unchanged.)
// r42: Sanctifire's opponent-turn revive targets 2 GY monsters, 1 to each field: bring back our best Albaz-line body
// and hand them the weakest card. Hold it when no Albaz-line body of ours is in a GY.
const SANCTIFIRE_REVIVE=[ALBAZ,QUEM,ECCLESIA,CARTESIA,WHITE,DOG_ECCLESIA,62962630,KITT,19096726];
const reviveValue=(d,seat,c)=>{const i=SANCTIFIRE_REVIVE.indexOf(c.code);return owner(d,c)===seat&&i>=0?10000-i*100:Number(c.attack??d.db[c.code]?.attack??0)+((d.db[c.code]?.type&32)?500:0)};
export const sanctifireReviveLive=(d,seat)=>d.zone(seat,GY).some(c=>c&&SANCTIFIRE_REVIVE.includes(c.code));
export const superPolyTargetOk=(d,code,seat)=>code===SANCTIFIRE?albazOnAField(d,seat)&&lightSpellcasterOnAField(d,seat):code===LENATUS?albazOnAField(d,seat)&&(dragonOnAField(d,seat)||albazCount(d,seat)>1):true;
export function brandedNov08Option(d,seat,text,R){
 if(!isBrandedNov08(d.decks?.[seat])||d.currentEffect?.code!==30271097)return null;
 const haveTarget=publicTargets(d,seat).length>0;
 const destroy=text.findIndex(s=>/destroy/i.test(s)),revive=text.findIndex(s=>/special summon/i.test(s));
 if(destroy<0||revive<0)return null;
 return {type:R.SELECT_OPTION,index:haveTarget?destroy:revive};
}
const albazMaterial=(d,c)=>{
 const info=d.db[c.code];
 return Boolean(info?.type&EXTRA)&&![38811586,3410461].includes(c.code)&&
  !/cannot be used as (?:a )?fusion material/i.test(info?.desc||'');
};
// r45 v4 item 2: The Fallen & The Virtuous never revives an opponent's hand trap or a low-value body (seed 91104 on r43:
// after their Ash Blossom negated Branded Fusion, F&V revived THEIR Ash Blossom onto our field and the turn ended).
const HAND_TRAP_NAME=/Ash Blossom|Ghost Ogre|Droll & Lock Bird|Mulcharmy|Maxx "C"|Effect Veiler|Ghost Belle|Nibiru|Ghost Mourner|D\.D\. Crow|Bystial/;
const reviveScore=(d,seat,c)=>{const info=d.db[c?.code]||{},type=info.type||0,n=d.name(c.code),atk=Number(c.attack??info.attack??0);
 if(!(type&MONSTER)||((type&(EXTRA|RITUAL|SPECIAL_SUMMON_ONLY))&&!(c.status&PROC_COMPLETE)))return -1;
 if(owner(d,c)===seat){const i=SANCTIFIRE_REVIVE.indexOf(c.code);if(i>=0)return 5000-i*100;if(type&EXTRA)return 3000+atk;return HAND_TRAP_NAME.test(n)?100:atk>=1500?1000+atk/10:-1}
 {const i=SANCTIFIRE_REVIVE.indexOf(c.code);if(i>=0)return 4000-i*100}/* their Albaz-line monster works for our Fusions too */
 if(HAND_TRAP_NAME.test(n))return -1;return (type&EXTRA)||atk>=1800?2000+atk/10:-1};
export const goodVirtuousRevive=(d,seat,c)=>reviveScore(d,seat,c)>0;
// r45 v4 item 3 (whole-turn / OTK): Alba-Lenatus by its own procedure: send our Fallen of Albaz (or Albion the Shrouded
// Dragon, named Albaz on the field) plus their face-up Dragon(s) from the Monster Zones, then it attacks their monsters up
// to the number of materials. Same idea as WindBot's Albaz script second-turn OTKs. Their Mirrorjade is used last (its
// "leaves the field by an opponent's card" End Phase wipe), and Sanctifire / Alba-Lenatus cannot be material.
const DRAGON=0x2000;
const albazNamed=(d,c)=>faceUp(c)&&(c.code===ALBAZ||c.code===WHITE||d.name(c.code)==='Fallen of Albaz'||c.code===25451383);
const theirLenatusDragons=(d,seat)=>d.zone(1-seat,FIELD).filter(c=>faceUp(c)&&!NOV08_EXTRA.notMaterial.includes(c.code)&&c.code!==MIRRORJADE&&(Number(c.race||d.db[c.code]?.race)&DRAGON));
export function brandedV4Lenatus(d,seat,m,blocked,R){
 if(!V4.on||!V4.lethal||!isBrandedNov08(d.decks?.[seat])||d.active!==seat||d.phase!==4||!m?.to_bp||d.turn<2)return null;
 if(!d.zone(seat,FIELD).some(c=>albazNamed(d,c)))return null;
 const theirs=theirLenatusDragons(d,seat);if(!theirs.length)return null;
 const i=legalIndex(m.special_summons,c=>c.code===LENATUS&&c.location===EXTRA_DECK,blocked,'special_summons');if(i<0)return null;
 return {type:R.SELECT_IDLECMD,action:1,index:i,card:d.name(LENATUS),line:'V4-LENATUS',rule:'Alba-Lenatus: send our Albaz plus their '+theirs.length+' Dragon(s), then attack their monsters'};
}
// Material picks for that procedure (hint 511 with no effect source): our Albaz first, then their Dragons (best first,
// their Mirrorjade last), then finish instead of adding our own monsters.
export function brandedV4LenatusMaterial(d,seat,m,M,R){
 if(!V4.on||!V4.lethal||!isBrandedNov08(d.decks?.[seat])||m?.type!==M.SELECT_UNSELECT_CARD||d.hint!==511||d.currentEffect?.code)return null;
 const sel=m.select_cards||[],chosen=m.unselect_cards||[];
 if(!sel.some(c=>owner(d,c)!==seat)&&!chosen.some(c=>owner(d,c)!==seat))return null;
 const haveAlbaz=chosen.some(c=>owner(d,c)===seat&&albazNamed(d,c));
 if(!haveAlbaz){const i=sel.findIndex(c=>owner(d,c)===seat&&albazNamed(d,c));return i<0?null:{response:{type:R.SELECT_UNSELECT_CARD,index:i},rule:'Alba-Lenatus: our Albaz is the named material',card:d.name(sel[i].code)}}
 const val=c=>(c.code===MIRRORJADE?-5000:0)+((d.db[c.code]?.type&EXTRA)?3000:0)+Number(c.attack??0);
 const theirs=sel.map((c,i)=>({c,i})).filter(x=>owner(d,x.c)!==seat).sort((a,b)=>val(b.c)-val(a.c)||a.i-b.i);
 if(theirs.length&&!(theirs[0].c.code===MIRRORJADE&&m.can_finish))return {response:{type:R.SELECT_UNSELECT_CARD,index:theirs[0].i},rule:'Alba-Lenatus: send their Dragon as material',card:d.name(theirs[0].c.code)};
 if(m.can_finish)return {response:{type:R.SELECT_UNSELECT_CARD,index:null},rule:'Alba-Lenatus: keep our other monsters',card:null};
 return null;
}
const legalIndex=(cards,filter,blocked,key)=>(cards||[]).findIndex((c,i)=>filter(c)&&!blocked?.(c,key,i));
export function brandedNov08Idle(d,seat,m,blocked,R){
 if(!isBrandedNov08(d.decks?.[seat]))return null;
 const make=(action,index,c,line,rule)=>({type:R.SELECT_IDLECMD,action,index,card:d.name(c.code),line,rule});
 const len=brandedV4Lenatus(d,seat,m,blocked,R);if(len)return len;/* r45 v4 */
 const hand=ownHand(d,seat),enemy=d.zone(1-seat,FIELD).filter(faceUp);
 // Compare only the branches the engine actually offers. With a live Albaz + discard + opposing ED body,
 // consume Ecclesia as a board breaker. Otherwise keep it as material for an offered Level 8 payoff.
 if(fieldHas(d,seat,WHITE)&&fieldHas(d,seat,ECCLESIA)){
  const threats=championsTargets(d,seat);
  // r42: Three Champions only against a worthwhile opposing target; no other Level 8 Synchro and no empty-board Synchro.
  const syn=threats.length?legalIndex(m.special_summons,c=>c.location===EXTRA_DECK&&NOV08_EXTRA.synchroL8.includes(c.code),blocked,'special_summons'):-1;
  const ec=legalIndex(m.activates,c=>c.code===ECCLESIA&&c.location===FIELD,blocked,'activates');
  const liveBreak=enemy.some(c=>albazMaterial(d,c))&&inExtra(d,seat,MIRRORJADE)&&
   (hand.some(c=>c.code===ALBAZ)?hand.length>1:ownRemaining(d,seat,ALBAZ)&&hand.length>0);
  if(ec>=0&&liveBreak)
   return make(5,ec,m.activates[ec],'K08-WHITE-BREAK','Use Ecclesia to bring out Albaz against a live board.');
  // r41 (RELAY-131): Branded Fusion cannot be activated after a non-Fusion Extra Deck summon; Branded in White has no such
  // lock (it only needs a Dragon material). The order is a tactical preference (B3): spend the Fusion spell first.
  for(const code of [FUSION,BRANDED_IN_WHITE,DEPLOYMENT]){
   const i=legalIndex(m.activates,c=>c.code===code&&c.location===HAND,blocked,'activates');
   if(i>=0)return make(5,i,m.activates[i],'K08-WHITE-FUSION',code===BRANDED_IN_WHITE?'Use the offered Branded in White for the Fusion branch first (tactical; a Synchro would not lock it).':'Use the offered Fusion spell before a Synchro would lock it out.');
  }
  const kittCanFindFusion=!hand.some(c=>c.code===FUSION)&&
   (ownRemaining(d,seat,FUSION)||d.zone(seat,GY).some(c=>c?.code===FUSION)||
    d.zone(seat,BANISHED).some(c=>faceUp(c)&&c.code===FUSION));
  if(kittCanFindFusion){
   for(const [key,action] of [['activates',5],['special_summons',1],['summons',0]]){
    const i=legalIndex(m[key],c=>c.code===KITT&&c.location===HAND,blocked,key);
    if(i>=0)return make(action,i,m[key][i],'K08-WHITE-KITT','Use offered Kitt to recover Branded Fusion before the Synchro.');
   }
  }
  if(syn>=0)return make(1,syn,m.special_summons[syn],'K08-WHITE-SYN','Three Champions Synchro against a worthwhile opposing target (no offered Fusion route).');
  // r42: Sanctifire follow-up. White counts as Albaz and the recruited Ecclesia is a LIGHT Spellcaster: a field Cartesia can
  // fuse them into Albion the Sanctifire Dragon (Level 8, allowed by White's lock). The engine offers only legal routes.
  if(inExtra(d,seat,SANCTIFIRE)){const ca=legalIndex(m.activates,c=>c.code===CARTESIA&&c.location===FIELD,blocked,'activates');
   if(ca>=0)return make(5,ca,m.activates[ca],'K08-WHITE-SANCTIFIRE','Cartesia fuses White (as Albaz) + Ecclesia into Albion the Sanctifire Dragon.');
   const ch=legalIndex(m.activates,c=>c.code===CARTESIA&&c.location===HAND,blocked,'activates');
   if(ch>=0)return make(5,ch,m.activates[ch],'K08-WHITE-SANCTIFIRE','Special Summon Cartesia (White counts as Albaz) to fuse White + Ecclesia into Sanctifire.');}
  // r42: only when Albaz could actually fuse with an opposing monster (not vs Sanctifire / Alba-Lenatus).
  if(ec>=0&&enemy.some(c=>albazMaterial(d,c))&&hand.length>0)
   return make(5,ec,m.activates[ec],'K08-WHITE-BREAK','No Synchro or Fusion route is offered; take the Albaz branch against a usable opposing monster.');
 }
 return null;
}
export function brandedNov08RoutePick(d,seat,m,response,M,R){
 if(!isBrandedNov08(d.decks?.[seat]))return null;
 if(d.currentEffect?.code===SANCTIFIRE&&m?.type===M.SELECT_UNSELECT_CARD&&response&&response.index!=null){
  const sel=m.select_cards||[],chosen=(m.unselect_cards||[]).length,v=c=>reviveValue(d,seat,c);
  const order=sel.map((c,i)=>({c,i})).sort((a,b)=>chosen?v(a.c)-v(b.c)||a.i-b.i:v(b.c)-v(a.c)||a.i-b.i);
  if(order.length&&order[0].i!==response.index)
   return {response:{...response,index:order[0].i},rule:chosen?'Sanctifire revive: give the opponent the weakest card.':'Sanctifire revive: bring back our best Albaz-line monster.',card:d.name(order[0].c.code)};
  return null;
 }
 if(m?.type!==M.SELECT_CARD||response?.indicies?.length!==1)return null;
 const cards=m.selects||[];
 if(d.currentEffect?.code===SANCTIFIRE&&cards.length===2&&d.hint!==509){
  const best=reviveValue(d,seat,cards[0])>=reviveValue(d,seat,cards[1])?0:1;
  return best===response.indicies[0]?null:{response:{...response,indicies:[best]},rule:'Sanctifire revive: our side takes the better monster.',card:d.name(cards[best].code)};
 }
 const pickIndex=(i,rule)=>i<0?null:{response:{...response,indicies:[i]},rule,card:d.name(cards[i].code)};
 const select=(code,rule,keep=false)=>{const i=cards.findIndex(c=>c.code===code);return i===response.indicies[0]&&!keep?null:pickIndex(i,rule)};
 const source=d.currentEffect?.code;
 if(source===SUPER_POLY&&d.hint===509&&!superPolyTargetOk(d,cards[response.indicies[0]]?.code,seat)){
  const ok=cards.map((c,i)=>({c,i})).filter(x=>superPolyTargetOk(d,x.c.code,seat));const i=(ok.find(x=>x.c.code===MIRRORJADE)||ok[0])?.i??-1;
  if(i>=0)return pickIndex(i,'Super Polymerization: Sanctifire / Alba-Lenatus need Albaz and their other material on a field.');
 }
 // r42: Sanctifire and Alba-Lenatus cannot be Fusion Material: never keep one as a material pick (the engine also refuses).
 if(d.hint===511&&NOV08_EXTRA.notMaterial.includes(cards[response.indicies[0]]?.code)){
  const i=cards.findIndex(c=>!NOV08_EXTRA.notMaterial.includes(c.code));if(i>=0)return pickIndex(i,'Sanctifire / Alba-Lenatus cannot be Fusion Material.');
 }
 if(source===CARTESIA&&d.hint===509&&d.active===seat&&inExtra(d,seat,SANCTIFIRE)&&cards.some(c=>c.code===SANCTIFIRE)&&
    (fieldHas(d,seat,WHITE)||fieldHas(d,seat,ALBAZ))&&fieldHas(d,seat,ECCLESIA)&&!cards.some(c=>c.code===MIRRORJADE))
  return select(SANCTIFIRE,'White line: Cartesia makes Albion the Sanctifire Dragon from White (Albaz) + Ecclesia.');
 if(source===NADIR&&d.hint===504&&canNormal(d,seat,M)&&ownRemaining(d,seat,CARTESIA)&&
    (ownRemaining(d,seat,QUEM)||ownHand(d,seat).some(c=>c.code===QUEM)||ownRemaining(d,seat,DOG_ECCLESIA))&&inExtra(d,seat,GRANGUIGNOL)){
  const garura=11765832;
  if(cards.some(c=>c.code===garura))
   return select(garura,'Nadir: Garura draw when Cartesia/Quem follow-up is live.',true);
  return select(41373230,'Nadir: Titaniklad send when Garura is unavailable.',true);
 }
 if(source===KITT&&d.hint===507){
  const hand=ownHand(d,seat);
  const value=c=>c.code===FUSION?1000:
   keepForTurn.has(c.code)?(hand.filter(h=>h.code===c.code).length>1?25:100):
   (d.db[c.code]?.type&16)?0:20;
  const offered=cards.map((c,i)=>({c,i})).filter(x=>x.c.location===HAND&&owner(d,x.c)===seat);
  offered.sort((a,b)=>value(a.c)-value(b.c)||a.i-b.i);
  if(offered.length)return pickIndex(offered[0].i,'Kitt: bottom-deck the expendable card; preserve live Fusion access.');
 }
 if(V4.on&&V4.recovery&&source===FALLEN_VIRTUOUS&&d.hint===509){/* r45 v4 item 2: best legal revive, never their hand trap */
  const ranked=cards.map((c,i)=>({c,i,v:reviveScore(d,seat,c)})).sort((a,b)=>b.v-a.v||a.i-b.i);
  if(ranked.length&&ranked[0].i!==response.indicies[0])return pickIndex(ranked[0].i,'The Fallen & The Virtuous: revive our best Albaz-line monster, never their hand trap.');
 }
 if(source===FALLEN_VIRTUOUS&&d.hint===502){
  // Use the engine's offered destroy targets; never replace an opposing
  // selection with one of our own.
  const opposing=c=>c&&owner(d,c)!==seat&&[FIELD,SZONE].includes(c.location);
  if(!opposing(cards[response.indicies[0]])){
   const pick=pickIndex(cards.findIndex(opposing),'The Fallen & The Virtuous: use an engine-offered opposing destroy target.');
   if(pick)return pick;
  }
 }
 if(source===CHAMPIONS&&d.hint===575){
  const targets=championsTargets(d,seat);
  const options=cards.map((c,i)=>({c,i,field:targets.find(t=>t.location===c.location&&t.sequence===c.sequence&&t.code===c.code)}))
   .filter(x=>owner(d,x.c)!==seat&&x.field);
  const value=({field:c})=>((d.db[c.code]?.type&EXTRA)?4000:0)+(c.attack??d.db[c.code]?.attack??0);
  options.sort((a,b)=>value(b)-value(a)||a.i-b.i);
  if(options.length)return pickIndex(options[0].i,'Three Champions: negate an engine-offered opposing face-up threat.');
 }
 if(source===CARTESIA&&d.hint===509&&d.active!==seat&&fieldHas(d,seat,QUEM))
  return select(GRANGUIGNOL,'Complete the delayed Nadir/Cartesia line into Granguignol.');
 return null;
}

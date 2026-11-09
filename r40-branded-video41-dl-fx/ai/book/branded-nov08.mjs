// TEST only: Kevy's 8 Nov 2026 pure Branded preset; the engine remains the source of legal options.
import legacy from './branded-lines.mjs';
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
const retired=new Set(['Phara the Primordial Goddess','Albion the Branded Dragon','Red-Eyes Dark Dragoon','Dark Magician','Red-Eyes Black Dragon','The Golden Swordsoul','Dogmatika Fleurdelis, the Knighted','The Bystial Lubellion','Bystial Saronir','Bystial Magnamhut','Fusion Deployment','Branded Lost','Branded in Red','Infinite Impermanence','Albion the Sanctifire Dragon','Alba-Lenatus the Abyss Dragon','Despian Luluwalilith']);
const line=(id,name,when,steps)=>({id,name,when,steps});
const act=(card,location)=>({do:'activate',card,...(location?{location}: {})});
const summon=card=>({do:'summon',card});
const special=card=>({do:'special',card});
const pick=(source,hint,prefer,extra={})=>({source,hint,prefer,...extra});
const replacements=new Set([V,N,AL,F,A,K,W,'Gold Sarcophagus',RET,'Branded in White','Tri-Brigade Springans Kitt']);
const retainedPicks=legacy.picks.filter(p=>!retired.has(p.source)&&!replacements.has(p.source)).map(p=>({...p,prefer:p.prefer.filter(n=>!retired.has(n)),...(p.keep?{keep:p.keep.filter(n=>!retired.has(n))}:{})})).filter(p=>p.prefer.length);
export const brandedNov08Book={
 ...legacy,source:BRANDED_NOV08,starters:[AL,F,OPEN,W,K,N,'Branded in White','Tri-Brigade Springans Kitt'],
 conditionalStarters:legacy.conditionalStarters.map(p=>p.ifHandAny?{...p,ifHandAny:p.ifHandAny.filter(n=>!retired.has(n))}:p),
 lines:[
  ...legacy.lines.filter(x=>!drop.has(x.id)&&!['V53-CART','RULE-NS-2','B-02','R30-QNS'].includes(x.id)),
  line('K08-WHITE','White Dragon recruits Ecclesia; keep a live Fusion route before taking an offered Level 8 Synchro',{hand:[W]},[act(W,[2]),act(W,[4])]),
  ...legacy.lines.filter(x=>['V53-CART','RULE-NS-2'].includes(x.id)),
  line('K08-KITT','Original Springans Kitt: summon, search, then use the available Branded line',{hand:[K]},[special(K),summon(K),act(K,[4]),act(F)]),
  line('K08-TRI-KITT','Tri-Brigade Springans Kitt: Normal Summon to send/search Branded Fusion access',{hand:['Tri-Brigade Springans Kitt']},[summon('Tri-Brigade Springans Kitt')]),
  line('K08-NADIR','Nadir after Extra Deck plays: Garura or a Dogmatika send prepares Quem/Ecclesia follow-up',{hand:[N]},[act(N),summon(Q),act(Q,[4])])
 ],
 blocks:legacy.blocks.filter(b=>!retired.has(b.card)&&!retired.has(b.ifUnused)),
 picks:[
  pick(K,[506],[F,'Branded in White',OPEN,V,RET,'Branded in High Spirits'],{ifNotHand:[F]}),
  pick(K,[506],[V,'Branded in White',RET,OPEN,'Branded in High Spirits']),
  pick(AL,[506],[F,'Branded in White',OPEN,RET,'Branded in High Spirits',V],{ifNotHand:[F]}),
  pick(AL,[506],[V,'Branded in White',RET,OPEN]),
  pick(F,[509],[L,'Despian Quaeritis','Mixousia the Confounder',T,R,'Hyperinvoked Aeon']),
  pick(F,[511],[A,'Albion the Shrouded Dragon',AL,E,'Cocatorium the Heavy Metal Avian'],{location:[1,4,2]}),
  pick(A,[509],[M,D,L,T,R,'Despian Quaeritis','Mixousia the Confounder']),
  pick(W,[504],[T,D,R,L,THREE,ED,'Despian Quaeritis']),
  pick(W,[509],[E]),
  pick(V,[504],[T,D,R,L,THREE,ED,'Despian Quaeritis']),
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
  if((m.special_summons||[]).some(c=>c.location===64||c.code===45484331)||
     (m.activates||[]).some(c=>live(c)&&([44362883,34995106,73819701,70534340,78397661].includes(c.code)||c.code===95515789&&c.location===4))||
     (m.summons||[]).some(c=>[62962630,45484331].includes(c.code)))
   return 'Branded 41: keep Nadir until the offered Fusion/Synchro route or starter has been used.';
 }
 // The first window after recruiting Ecclesia can be a fast-effect window, before Synchros are offered.
 // Preserve both branches until the open Main Phase, unless the opponent is already doing something to answer.
 if(card.code===55273560&&card.location===4&&d.active===seat&&[4,256].includes(d.phase)&&d.prompt?.type===M.SELECT_CHAIN&&
    fieldHas(d,seat,73819701)&&fieldHas(d,seat,55273560)&&[78397661,74405783].some(code=>inExtra(d,seat,code))&&
    !(d.chain||[]).some(c=>c.controller!==seat&&!c.solved))
  return 'Branded 41: keep Ecclesia until open Main Phase to compare the offered Synchro and Albaz branches.';
 if(card.code===FALLEN_VIRTUOUS&&!publicTargets(d,seat).length&&!plausibleVirtuousRevival(d,seat))
  return 'Hold The Fallen & The Virtuous: no opposing face-up target and no plausible legal revival.';
 if(card.code===CHAMPIONS&&card.location===FIELD&&d.prompt?.type===M.SELECT_IDLECMD&&!championsTargets(d,seat).length)
  return 'Hold Three Champions: no worthwhile opposing face-up card to negate.';
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
const DARK_DRAGON=78397661, CHAMPIONS=74405783, LULU=53971455, NADIR=1984618, GRANGUIGNOL=24915933;
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
  return (type&MONSTER)&&(!(type&(EXTRA|RITUAL|SPECIAL_SUMMON_ONLY))||Boolean(c.status&PROC_COMPLETE));
 });
};
const championsTargets=(d,seat)=>publicTargets(d,seat).filter(c=>worthwhile(d,c));
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
const legalIndex=(cards,filter,blocked,key)=>(cards||[]).findIndex((c,i)=>filter(c)&&!blocked?.(c,key,i));
export function brandedNov08Idle(d,seat,m,blocked,R){
 if(!isBrandedNov08(d.decks?.[seat]))return null;
 const make=(action,index,c,line,rule)=>({type:R.SELECT_IDLECMD,action,index,card:d.name(c.code),line,rule});
 const hand=ownHand(d,seat),enemy=d.zone(1-seat,FIELD).filter(faceUp);
 // Compare only the branches the engine actually offers. With a live Albaz + discard + opposing ED body,
 // consume Ecclesia as a board breaker. Otherwise keep it as material for an offered Level 8 payoff.
 if(fieldHas(d,seat,WHITE)&&fieldHas(d,seat,ECCLESIA)){
  const threats=championsTargets(d,seat);
  const syn=legalIndex(m.special_summons,c=>c.location===EXTRA_DECK&&c.code===(threats.length?CHAMPIONS:DARK_DRAGON),blocked,'special_summons');
  const alt=syn>=0?syn:legalIndex(m.special_summons,c=>c.location===EXTRA_DECK&&c.code===DARK_DRAGON,blocked,'special_summons');
  const ec=legalIndex(m.activates,c=>c.code===ECCLESIA&&c.location===FIELD,blocked,'activates');
  const liveBreak=enemy.some(c=>albazMaterial(d,c))&&inExtra(d,seat,MIRRORJADE)&&
   (hand.some(c=>c.code===ALBAZ)?hand.length>1:ownRemaining(d,seat,ALBAZ)&&hand.length>0);
  if(ec>=0&&liveBreak)
   return make(5,ec,m.activates[ec],'K08-WHITE-BREAK','Use Ecclesia to bring out Albaz against a live board.');
  // Both hand spells require no earlier non-Fusion Extra Deck summon this turn.
  for(const code of [FUSION,BRANDED_IN_WHITE,DEPLOYMENT]){
   const i=legalIndex(m.activates,c=>c.code===code&&c.location===HAND,blocked,'activates');
   if(i>=0)return make(5,i,m.activates[i],'K08-WHITE-FUSION','Use the offered Fusion spell before a Synchro would lock it out.');
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
  if(alt>=0)return make(1,alt,m.special_summons[alt],'K08-WHITE-SYN','Use the available Level 8 Synchro when there is no offered Fusion route.');
  if(ec>=0&&enemy.length&&hand.length>0)
   return make(5,ec,m.activates[ec],'K08-WHITE-BREAK','No preferred Synchro is offered; consider the available Albaz branch.');
 }
 return null;
}
export function brandedNov08RoutePick(d,seat,m,response,M,R){
 if(!isBrandedNov08(d.decks?.[seat])||m?.type!==M.SELECT_CARD||response?.indicies?.length!==1)return null;
 const cards=m.selects||[];
 const pickIndex=(i,rule)=>i<0?null:{response:{...response,indicies:[i]},rule,card:d.name(cards[i].code)};
 const select=(code,rule,keep=false)=>{const i=cards.findIndex(c=>c.code===code);return i===response.indicies[0]&&!keep?null:pickIndex(i,rule)};
 const source=d.currentEffect?.code;
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

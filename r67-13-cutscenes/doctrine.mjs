import {seedHash} from './random.mjs';
// Adapted from the owner's authored Doctrine lessons. These are conditional
// preferences inside native engine prompts, not a move list or a replay script.
export const DOCTRINE_SOURCES={
 branded:{title:'Crimson Abyss · Albion Bridge / Lubellion into Dragoon',source:'Branded Doctrine · training lessons 1, 2 and Dragoon branch'},
 mikanko:{title:'Borrowed Bosses · Noble Twins into Uzuhime',source:'Borrowed Bosses Doctrine v1.2 · Twins / Ohime / Sword lessons'},
 sky:{title:'Zero Protocol · Engage → Kagari → Anchor',source:'Sky Striker Doctrine RC4 · Reclaim lesson 03'},
 luna:{title:'Moonlit Hunt · Gold Leo → Hound → Chick',source:'Lunalight Doctrine · Starter and restriction lessons'}
};
export function doctrineContext(d,seat,seed){
 const id=d.decks[seat].id,profile=DOCTRINE_SOURCES[id];if(!profile)return null;
 const names=loc=>d.zone(seat,loc).filter(Boolean).map(c=>d.name(c.code));
 const hand=names(2),field=names(4),grave=names(16),extra=names(64),spells=names(8),banish=names(32);
 const has=(list,n)=>list.includes(n),last=d.name(d.lastCard),enemy=d.zone(1-seat,4).filter(c=>c&&(c.position&5));
 const ownPool=[...hand,...field,...grave,...banish],knownList=d.decks[seat].main.map(code=>d.name(code));
 const route={id,title:profile.title,source:profile.source,steps:[],goal:null,why:''};
 if(id==='branded'){
  const albaz='Fallen of Albaz',bf='Branded Fusion',dm='Dark Magician',albion='Albion the Branded Dragon',lub='Lubellion the Searing Dragon',mirror='Mirrorjade the Iceblade Dragon',dragoon='Red-Eyes Dark Dragoon';
  const access=hand.some(n=>[bf,'Aluber the Jester of Despia','Branded Opening'].includes(n));
  if(!access&&![albion,lub,mirror,dragoon].some(n=>has(field,n))&&![bf,albion,lub].includes(last))return null;
  const dark=has(extra,lub)&&knownList.includes(dm)&&!has(banish,dm);
  const preferDark=dark&&!hand.includes(bf)&&hand.includes(dm);
  const canDragoon=has(field,dragoon)||((has(field,lub)||preferDark)&&has(extra,dragoon)&&(has(ownPool,dm)||knownList.includes(dm)));
  route.goal=canDragoon?dragoon:mirror;if(has(field,albion))route.goal=mirror;
  route.bridge=route.goal===dragoon?lub:albion;
  if(!has(extra,route.bridge)&&!has(field,route.bridge))route.bridge=lub;
  if(!has(extra,route.goal)&&!has(field,route.goal))return null;
  route.title=route.goal===dragoon?'Crimson Abyss · Lubellion → Dragoon':'Crimson Abyss · Albion → Mirrorjade';
  route.steps=['Find Branded Fusion','Choose the legal bridge','Resolve its Fusion effect','Confirm '+route.goal];
  route.why=route.goal===dragoon?'The Doctrine fork uses Dark Magician with a Dragon Effect Monster through Lubellion. Keep a discard available; the engine still checks every material.':'The Doctrine spine uses a LIGHT bridge, then Albaz and an Extra Deck monster for Mirrorjade. Negation or lost materials can stop it.';
 }else if(id==='mikanko'){
  if(!hand.some(n=>/Ohime|Preparation of Rites|Noble Twins/.test(n))&&!field.some(n=>/Sanaki|Uzuhime/.test(n))&&!grave.includes('Sanaki the Mikanko Devotee'))return null;
  if(!extra.includes('Uzuhime the Manifested Mikanko')&&!field.includes('Uzuhime the Manifested Mikanko'))return null;
  route.goal='Uzuhime the Manifested Mikanko';route.steps=['Twins sends Sanaki / sets Fire Dance','Keep Sanaki in GY for revival','Equip Sanaki; summon a second Level 3','Uzuhime finds Sword','Choose an actual legal battle target'];
  route.why='Use the authored Twins setup. Decline Sanaki’s GY equip effect when Fire Dance needs her in the GY. Ohime is access, not Level 3 Xyz material.';
 }else if(id==='sky'){
  if(![...hand,...field,...grave].some(n=>/Sky Striker/.test(n)))return null;
  route.goal='Sky Striker Ace - Kagari';route.steps=['Engage finds Linkage if missing','A legal send enables Linkage','Kagari recovers Engage','Engage finds the missing interaction'];
  route.why='Follow the Reclaim lesson when its resources are present. Main Monster Zones must stay clear for Striker Spells; the basic second Engage does not automatically earn a draw.';
 }else if(id==='luna'){
  if(![...hand,...field,...grave].some(n=>/Lunalight|Fire Formation - Tenki/.test(n)))return null;
  route.goal='Lunalight Kaleido Chick';route.steps=['Tenki / Gold Leo access','Send Hound by effect','Hound summons Chick','Chick supplies a named Fusion material'];
  route.why='Follow the authored starter: Gold Leo’s discard or Masquerade’s effect can trigger Silver Hound. Chick’s send is cost and cannot trigger Hound. Fusion endpoints require their full recipe.';
 }
 return {...route,hand,field,grave,extra,spells,enemy,last};
}
export function doctrineRating(ctx,name,kind,d){
 if(!ctx)return {bonus:0,why:''};let bonus=0,why='';const give=(n,text)=>{bonus=n;why=text};
 if(ctx.id==='branded'){
  if(kind==='action'&&name==='Branded Fusion')give(30,'The Doctrine starter is already available; use it before spending access cards.');
  if(kind==='hand'&&name==='Branded Fusion'&&!ctx.hand.includes(name))give(30,'Aluber / Opening access should find the missing Branded Fusion.');
  if(kind==='card'&&ctx.last==='Branded Fusion'&&name===ctx.bridge)give(80,'Choose the Doctrine bridge from the engine’s eligible Fusion options.');
  if(kind==='card'&&/Albion the Branded Dragon|Lubellion the Searing Dragon/.test(ctx.last)&&name===ctx.goal)give(85,'This is the intended Doctrine endpoint if the native prompt offers it.');
  if(kind==='card'&&d.hint===504&&ctx.last==='Mirrorjade the Iceblade Dragon'&&name==='Albion the Branded Dragon')give(90,'The Doctrine sends Albion as Mirrorjade’s cost for possible End Phase follow-up.');
  if(kind==='card'&&d.hint===504&&ctx.last==='Branded in High Spirits'&&name==='Titaniklad the Ash Dragon')give(90,'The Doctrine teaches Titaniklad as a legal Dragon bridge when the engine offers it.');
  if(kind==='card'&&d.hint===504&&ctx.last==='Branded Fusion'){
   if(name==='Fallen of Albaz')give(90,'Albaz satisfies the bridge’s named material.');
   if(ctx.bridge==='Lubellion the Searing Dragon'&&name==='Dark Magician')give(95,'Dark Magician is the DARK material and remains a Dragoon resource in the GY.');
   if(ctx.bridge==='Albion the Branded Dragon'&&name==='Guiding Quem, the Virtuous')give(95,'The Albion lesson uses Quem as its LIGHT material.');
  }
  if(kind==='material'&&ctx.last==='Branded Fusion'&&d.hint===511){
   if(name==='Fallen of Albaz')give(-85,'Use the bridge’s required Albaz.');
   if(ctx.bridge==='Lubellion the Searing Dragon'&&name==='Dark Magician')give(-95,'The DARK bridge keeps Dark Magician ready for Dragoon.');
   if(ctx.bridge==='Albion the Branded Dragon'&&name==='Guiding Quem, the Virtuous')give(-95,'Use the authored LIGHT material when it is offered.');
  }
  if(kind==='material'&&ctx.last==='Lubellion the Searing Dragon'&&d.hint!==501){
   if(ctx.goal==='Red-Eyes Dark Dragoon'&&['Dark Magician','Fallen of Albaz'].includes(name))give(-70,'Keep the offered named/Dragon Effect material pair for Dragoon.');
   if(ctx.goal==='Mirrorjade the Iceblade Dragon'&&['Fallen of Albaz','Lubellion the Searing Dragon'].includes(name))give(-70,'Recycle Albaz and the eligible Extra Deck monster for Mirrorjade.');
  }
 }else if(ctx.id==='mikanko'){
  if(kind==='action'&&/Noble Twins|Fire Dance|Uzuhime/.test(name))give(30,'Advance the authored Twins / Uzuhime setup when the effect is offered.');
  if(kind==='hand'&&ctx.last==='Ohime the Manifested Mikanko'&&name==='Mikanko Shinbu - Noble Twins'&&!ctx.hand.includes(name))give(95,'Ohime finds Twins to start the known setup.');
  if(kind==='hand'&&ctx.last==='Uzuhime the Manifested Mikanko'&&name==='Double-Edged Sword'&&!ctx.hand.includes(name))give(95,'Uzuhime’s broad Equip search can find Sword.');
  if(kind==='card'&&/Fire Dance/.test(ctx.last)&&name==='Sanaki the Mikanko Devotee'&&d.hint===509)give(90,'Revive the Sanaki retained in GY for the Fire Dance line.');
  if(kind==='card'&&ctx.last==='Sanaki the Mikanko Devotee'&&/Hu-Li|Ha-Re/.test(name))give(65,'An eligible Level 3 non-Illusion Mikanko completes the material pair.');
 }else if(ctx.id==='sky'){
  if(kind==='hand'&&ctx.last==='Sky Striker Mobilize - Engage!'&&name==='Sky Striker Mobilize - Linkage!'&&!ctx.hand.includes(name)&&!ctx.field.length&&ctx.hand.length>0)give(115,'Reclaim starts by finding Linkage; its send still needs a legal card on the field.');
  if(kind==='hand'&&ctx.last==='Sky Striker Ace - Kagari'&&name==='Sky Striker Mobilize - Engage!')give(70,'Kagari recovers the Engage that actually reached the GY.');
  if(kind==='card'&&ctx.last==='Sky Striker Mobilize - Linkage!'&&name==='Sky Striker Ace - Kagari'&&ctx.grave.includes('Sky Striker Mobilize - Engage!'))give(70,'Deploy Kagari to recover the spent Engage.');
  if(kind==='hand'&&ctx.last==='Sky Striker Mobilize - Engage!'&&name==='Sky Striker Mecha - Widow Anchor'&&ctx.enemy.length&&!ctx.hand.includes(name)&&ctx.hand.includes('Sky Striker Mobilize - Linkage!'))give(60,'The next Engage can find missing interaction for the visible opposing field.');
 }else if(ctx.id==='luna'){
  if(kind==='hand'&&ctx.last==='Fire Formation - Tenki'&&name==='Lunalight Gold Leo'&&!ctx.hand.includes(name))give(65,'Tenki finds the Doctrine starter Gold Leo.');
  if(kind==='material'&&d.hint===501&&ctx.last==='Lunalight Gold Leo'&&name==='Lunalight Silver Hound')give(-90,'Gold Leo discards by effect, which can trigger Hound.');
  if(kind==='card'&&ctx.last==='Lunalight Silver Hound'&&name==='Lunalight Kaleido Chick')give(90,'Hound supplies the named-material helper from the authored starter.');
  if(kind==='card'&&d.hint===504&&ctx.last==='Lunalight Masquerade'&&name==='Lunalight Silver Hound')give(90,'Masquerade sends Hound by effect, opening its trigger.');
 }
 return {bonus,why};
}
export function doctrineReport(ctx,plan,d){
 if(!ctx)return null;
 const selected=[plan.code,...(plan.selected||[])].filter(Boolean).map(code=>d.name(code));
 const relevant=selected.some(n=>ctx.id==='branded'?/Branded|Aluber|Albaz|Albion|Lubellion|Mirrorjade|Dragoon|Dark Magician|Guiding Quem/.test(n):ctx.id==='mikanko'?/Mikanko|Double-Edged/.test(n):ctx.id==='sky'?/Sky Striker/.test(n):/Lunalight|Tenki/.test(n));
 if(!relevant)return null;
 return {id:ctx.id,title:ctx.title,source:ctx.source,steps:ctx.steps,why:ctx.why,status:ctx.field.includes(ctx.goal)?'Checkpoint visible on field':'Conditional route guidance',goal:ctx.goal};
}

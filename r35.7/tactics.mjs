// Bounded public-board tactics. No opponent hand/Deck identities and no claims
// of complete game-tree search or certainty against unseen responses.
const key=c=>[c.controller,c.location,c.sequence].join(':');
const disabled=c=>!!(c.status&1);
export function tacticalContext(d,seat){
 const own=d.zone(seat,4).filter(Boolean),hand=d.zone(seat,2).filter(Boolean),grave=d.zone(seat,16).filter(Boolean),spells=d.zone(seat,8).filter(Boolean);
 const enemy=d.zone(1-seat,4).filter(Boolean).map(c=>(c.position&5)?c:{controller:c.controller,location:4,sequence:c.sequence,position:c.position,code:0,attack:0,defense:0,unknown:true});
 const enemySpells=d.zone(1-seat,8).filter(c=>c&&(c.position&5));
 return {seat,own,hand,grave,spells,enemy,enemySpells,lp:d.lp?.[seat]??8000,enemyLP:d.lp?.[1-seat]??8000,active:d.active,phase:d.phase,turn:d.turn,db:d.db,name:c=>d.name(c.code),chain:d.chain||[],last:d.name(d.lastCard),events:d.events||[]};
}
function equipped(ctx,monster,name){return [...ctx.spells,...ctx.enemySpells].some(c=>(c.position&5)&&(!name||ctx.name(c)===name)&&c.equipCard&&key(c.equipCard)===key(monster))}
function reflects(ctx,c){if(disabled(c))return false;const name=ctx.name(c);return /Uzuhime the Manifested Mikanko|Ohime the Manifested Mikanko/.test(name)||(/Hu-Li the Jewel Mikanko|Ha-Re the Sword Mikanko|Ni-Ni the Mirror Mikanko/.test(name)&&equipped(ctx,c))}
function battleImmune(ctx,c){return reflects(ctx,c)||(!disabled(c)&&/Cannot be destroyed by battle/i.test(ctx.db[c.code]?.desc||''))}
export function battleOutcome(ctx,attacker,target){
 const atk=Math.max(0,attacker.attack||0),aReflect=reflects(ctx,attacker),tReflect=target&&reflects(ctx,target),sword=equipped(ctx,attacker,'Double-Edged Sword')||(target&&equipped(ctx,target,'Double-Edged Sword'));
 if(!target){const damage=aReflect&&sword?atk*2:atk;return {damage,taken:sword&&!aReflect?atk:0,destroyed:false,lost:false,uncertain:false}}
 const value=target.unknown?1800:Math.max(0,target.position&1?target.attack||0:target.defense||0),attackPosition=!!(target.position&1),gap=atk-value;
 let damage=attackPosition?Math.max(0,gap):0,taken=Math.max(0,-gap),destroyed=gap>0&&!battleImmune(ctx,target),lost=gap<0&&attackPosition&&!battleImmune(ctx,attacker);
 if(gap===0&&attackPosition&&atk>0){destroyed=!battleImmune(ctx,target);lost=!battleImmune(ctx,attacker)}
 if(aReflect&&taken){damage=taken*(sword&&attackPosition?2:1);taken=0;lost=false}
 else if(tReflect&&damage){taken=damage*(sword?2:1);damage=0;destroyed=false}
 else if(sword&&attackPosition){const total=Math.max(damage,taken);damage=total;taken=total}
 return {damage,taken,destroyed,lost,uncertain:!!target.unknown};
}
export function planBattle(ctx,attacks,{nodeLimit=1400}={}){
 const offered=attacks.map((c,index)=>({card:ctx.own.find(x=>x.sequence===c.sequence&&x.location===c.location),index,direct:!!c.can_direct})).filter(a=>a.card&&(a.card.position&1));
 let nodes=0,best={score:0,damage:0,taken:0,steps:[],uncertain:false};
 function search(left,enemies,damage,taken,score,steps,uncertain){
  if(++nodes>nodeLimit)return;const lethal=damage>=ctx.enemyLP&&taken<ctx.lp;
  const value=score+(lethal?100000:0)-(taken>=ctx.lp?200000:0);
  if(value>best.score)best={score:value,damage,taken,steps,uncertain};if(lethal||taken>=ctx.lp)return;
  for(let a=0;a<left.length;a++){
   const offered=left[a],targets=enemies.length?[...enemies,...(offered.direct?[null]:[])]:[null];
   for(const target of targets){const outcome=battleOutcome(ctx,offered.card,target);if(outcome.taken>=ctx.lp-taken)continue;
    const gain=outcome.damage-outcome.taken*1.6+(outcome.destroyed?900+Math.min(1500,target.attack||0)*.25:0)-(outcome.lost?1200+offered.card.attack*.35:0);
    if(gain<=0)continue;
    search(left.filter((_,i)=>i!==a),outcome.destroyed?enemies.filter(c=>key(c)!==key(target)):enemies,damage+outcome.damage,taken+outcome.taken,score+gain,[...steps,{index:offered.index,attacker:key(offered.card),code:offered.card.code,target:target?key(target):null,targetCode:target?.code||0,...outcome}],uncertain||outcome.uncertain);
   }
  }
 }
 search(offered,ctx.enemy,0,0,0,[],false);return {...best,nodes:Math.min(nodes,nodeLimit),lethal:best.damage>=ctx.enemyLP&&best.taken<ctx.lp,assumption:'Visible-board combat estimate; unseen responses, attack limits and unmodelled effects can change it.'};
}
export function actionTactic(ctx,c,kind,d){
 const n=ctx.name(c),own=ctx.own,hand=ctx.hand.map(ctx.name),grave=ctx.grave.map(ctx.name),field=own.map(ctx.name),enemy=ctx.enemy.filter(c=>!c.unknown);let bonus=0,reason='';const add=(score,text)=>{bonus+=score;reason=text};
 if(kind==='action'){
  if(c.location===64&&/Sky Striker Ace/.test(n)){
   if(n.endsWith('Kagari'))add(grave.some(n=>/Sky Striker/.test(n))?grave.includes('Sky Striker Mobilize - Engage!')?90:35:-190,'Use Kagari for an actual recovery target; preserve her when the GY is empty.');
   if(n.endsWith('Hayate'))add(ctx.turn>1&&ctx.phase===4?65:-120,'Deploy Hayate before battle for direct damage, then use the follow-up phase for another Ace.');
   if(n.endsWith('Shizuku'))add(ctx.turn===1||ctx.phase===256?65:-85,'Shizuku is an End Phase resource endpoint.');
   if(field.includes('Sky Striker Ace - Hayate')&&ctx.phase===4&&!n.endsWith('Hayate'))add(-170,'Preserve Hayate for the coming Battle Phase instead of replacing her prematurely.');
   const ace=field.find(n=>/^Sky Striker Ace/.test(n)&&!n.endsWith('Raye')&&!n.endsWith('Roze'));
   if(ace&&n.endsWith('Shizuku')&&ace.endsWith('Shizuku'))add(-200,'The End Phase search body is already established.');
   if(ace?.endsWith('Shizuku')&&(ctx.turn===1||ctx.phase===256)&&!(n.endsWith('Kagari')&&grave.includes('Sky Striker Mobilize - Engage!')))add(-190,'Keep Shizuku as the End Phase endpoint instead of cycling through Extra Deck bodies.');
   if(ace&&!/Kagari|Hayate|Shizuku/.test(n))add(-180,'Preserve Extra Deck bodies when this replacement has no planned recovery or battle purpose.');
  }
  if(n==='Branded Opening'&&hand.includes('Branded Fusion')&&field.some(n=>/Mirrorjade|Dragoon/.test(n)))add(-180,'Keep follow-up access instead of discarding after a boss is established.');
  if(n==='Aluber the Jester of Despia'&&hand.includes('Branded Fusion')&&c.location===2)add(-40,'Use the existing Fusion access before exposing another starter.');
  if(n==='Mirrorjade the Iceblade Dragon'&&ctx.active===ctx.seat){const threat=enemy.some(c=>c.attack>=2500);add(threat?45:-160,'Use removal for a meaningful blocker; save the Quick Effect against a minor body.');}
  if(n==='Sky Striker Mobilize - Engage!'&&own.some(c=>c.sequence<5))add(-300,'A Main Monster Zone body closes the Striker Spell runway.');
  if(n==='Sky Striker Mobilize - Linkage!'&&field.includes('Sky Striker Ace - Hayate')&&ctx.phase===4)add(-180,'Hold Linkage until Hayate has attacked unless another purpose is established.');
  if(/Ash Blossom|Droll|Mulcharmy/.test(n)&&ctx.active===ctx.seat)add(-300,'Preserve hand interaction rather than use it as a routine starter.');
 }
 if(kind==='hand'){
  if(hand.includes(n))add(-55,'Prefer a missing resource over a duplicate search.');
  if(n==='Sky Striker Mecha - Widow Anchor'&&!hand.includes(n))add(enemy.some(c=>ctx.db[c.code]?.type&32)?60:15,'Find interaction appropriate to the visible field.');
  if(n==='Lunalight Gold Leo'&&!field.includes(n)&&!hand.includes(n))add(35,'Find the missing starter for the next engine step.');
 }
 if(kind==='material'){
  if(c.location===4&&/Mirrorjade|Dragoon|Uzuhime|Liger Dancer/.test(n))add(110,'Preserve the established boss unless the engine needs it as material.');
  if(c.location===2&&/Ash Blossom|Infinite Impermanence|Droll|Forbidden Droplet/.test(n))add(45,'Keep interaction before discarding it.');
  if(d.hint===501&&n==='Branded Fusion')add(130,'Protect scarce Fusion access from generic discard selection.');
 }
 return {bonus,reason};
}
export function interruptionValue(ctx,c,d){
 const n=ctx.name(c),top=ctx.chain.at(-1),opposing=top&&top.controller!==ctx.seat,label=d.description(c.description),interrupt=/negate|Banish|Destroy/i.test(label)||/Ash Blossom|Droll|Impermanence|Droplet|Widow Anchor|Called by/.test(n);
 if(top?.controller===ctx.seat&&interrupt)return -1000;
 if(n==='Mirrorjade the Iceblade Dragon')return opposing&&ctx.enemy.some(c=>!c.unknown)?80:-1000;
 if(n==='Red-Eyes Dark Dragoon'&&/Negate/i.test(label)){
  if(!opposing)return -1000;const target=d.name(top.code);return /Fusion|Engage|Aluber|Ohime|Twins|Gold Leo|Hound|Polymerization|Tenki|Droplet|Virtuous/.test(target)?150:ctx.lp<=2500?90:-1000;
 }
 if(/Ash Blossom|Impermanence|Widow Anchor|Droplet/.test(n)&&!opposing)return -1000;
 if(opposing&&/Ash Blossom|Impermanence|Widow Anchor|Droplet/.test(n)){if(/Impermanence|Widow Anchor|Droplet/.test(n)&&(!(ctx.db[top.code]?.type&32)||top.location!==4))return -1000;if(/Impermanence/.test(n)&&d.name(top.code)==='Guiding Quem, the Virtuous'&&ctx.lp>2000)return -1000;const target=d.name(top.code);const threat={'Branded Fusion':190,'Aluber the Jester of Despia':145,'Guiding Quem, the Virtuous':65,'Albion the Branded Dragon':125,'Sky Striker Mobilize - Engage!':175,'Sky Striker Ace - Kagari':145,'Ohime the Manifested Mikanko':170,'Mikanko Shinbu - Noble Twins':180,'Lunalight Gold Leo':175,'Lunalight Silver Hound':150,'Fire Formation - Tenki':135,'Branded Opening':150,'Mulcharmy Fuwalos':170,'Preparation of Rites':145,'The Great Mikanko Ceremony':130,'Hu-Li the Jewel Mikanko':145,'Lunalight Masquerade':150,'Lunalight Perfume Dancer':175,'Foolish Burial Goods':140,'Pot of Desires':140,'Reinforcement of the Army':150,'Sky Striker Ace = Zero':165,'Sky Striker Airspace - Area Zero':125,'Uzuhime the Manifested Mikanko':170};if(n==='Ash Blossom & Joyous Spring'&&target==='Aluber the Jester of Despia'&&ctx.enemyLP>2000&&ctx.hand.some(c=>/Impermanence/.test(ctx.name(c))))return -1000;return threat[target]??(ctx.lp<=2000?130:-1000);}
 if(n==='Sky Striker Ace - Raye')return !ctx.own.some(c=>/Sky Striker Ace/.test(ctx.name(c))&&!ctx.name(c).endsWith('Raye'))?75:-1000;
 return opposing&&interrupt?75:20;
}

import {tacticalContext,actionTactic,planBattle} from './tactics.mjs';
import {doctrineContext,doctrineRating,doctrineReport} from './doctrine.mjs';
import {seedHash} from './random.mjs';
import {choosePilot} from './pilot.mjs';
export const PILOT_STYLES={optimal:{label:'Optimal',description:'Doctrine plan, tactical priorities and resource preservation'}};
export {seedHash} from './random.mjs';
export class ProceduralPilot{
 constructor({seat,seed,style='optimal',variation='focused',doctrine=true,strategy='tactical'}){this.seat=seat;this.seed=seed>>>0;this.style='optimal';this.variation='focused';this.strategy='tactical';this.tacticalCache=null;this.pendingAttack=null;this.doctrine=doctrine;this.doctrineCache=null;this.decisions=0;this.history=[];this.cache=null;this.name='Pilot '+(seat===0?'A':'B')}
 board(d){if(this.tacticalCache?.revision!==d.revision)this.tacticalCache={revision:d.revision,value:tacticalContext(d,this.seat)};return this.tacticalCache.value}
 battle(d,attacks){return planBattle(this.board(d),attacks)}
 context(d){if(!this.doctrine)return null;if(this.doctrineCache?.revision!==d.revision)this.doctrineCache={revision:d.revision,value:doctrineContext(d,this.seat,this.seed)};return this.doctrineCache.value}
 random(){return 0}
 score(d,c,base,kind='card'){
  const controller=c.controller===undefined?this.seat:d.fromEngine(c.controller);const own=controller===this.seat;
  const position=c.position??([4,8,32,64].includes(c.location)?d.zone(controller,c.location)[c.sequence]?.position:0);
  const publicCard=own||c.location===16||([4,8,32,64].includes(c.location)&&!!(position&5));
  const card=publicCard?d.db[c.code]:null,n=card?.name||'',type=card?.type||0;
  let style=0,board=0;
  const hand=d.zone(this.seat,2).filter(Boolean),field=d.zone(this.seat,4).filter(Boolean),grave=d.zone(this.seat,16).filter(Boolean),enemy=d.zone(1-this.seat,4).filter(c=>c&&(c.position&5));
  if(kind==='action'&&/Sky Striker Ace/.test(n)){
   if(n.endsWith('Kagari')&&grave.some(c=>d.db[c.code]?.type&2&&/Sky Striker/.test(d.name(c.code))))board+=45;
   if(n.endsWith('Hayate')&&d.turn>1&&d.phase===4)board+=45;
   if(n.endsWith('Shizuku')&&(d.phase===256||d.turn===1))board+=48;
   if(n.endsWith('Raye')&&!field.length)board+=20;
  }
  if(kind==='hand'){
   if(hand.some(x=>x.code===c.code))board-=24;
   if(n==='Sky Striker Mobilize - Engage!')board+=75;
   if(n==='Sky Striker Mecha - Widow Anchor'&&enemy.some(c=>d.db[c.code]?.type&32))board+=45;
   if(n==='Sky Striker Maneuver - Afterburners!'&&enemy.length)board+=38;
   if(n==='Sky Striker Ace - Raye'&&!field.length&&!hand.some(x=>d.name(x.code)===n))board+=40;
  }
  const guidance=publicCard&&own?doctrineRating(this.context(d),n,kind,d):{bonus:0,why:''};
  const tactic=publicCard&&own&&this.strategy==='tactical'?actionTactic(this.board(d),c,kind,d):{bonus:0,reason:''};
  const amplitude=0;
  const variation=(this.random(d,[kind,publicCard?c.code:0,controller,c.location,c.sequence,publicCard?String(c.description||0):'0'].join(':'))*2-1)*amplitude;
  return {base:publicCard?base:35,style,board,tactical:tactic.bonus,tacticalWhy:tactic.reason,doctrine:guidance.bonus,doctrineWhy:guidance.why,variation,total:(publicCard?base:35)+style+board+tactic.bonus+guidance.bonus+variation};
 }
 plan(d){if(d.prompt?.seat!==this.seat)throw Error('The wrong pilot was asked to decide.');if(this.cache?.revision===d.revision)return this.cache;const decision=choosePilot(d,{explain:true,pilot:this});if(!decision)return null;this.cache={...decision,doctrine:doctrineReport(this.context(d),decision,d),pilot:this.info(),decisionNumber:this.decisions+1};return this.cache}
 observe(decision){if(decision.battle?.steps?.length)this.pendingAttack=decision.battle.steps[0];this.decisions++;this.history.push({revision:decision.revision,title:decision.title});if(this.history.length>40)this.history.shift();this.cache=null}
 info(){return {name:this.name,seat:this.seat,style:this.style,label:PILOT_STYLES[this.style]?.label||'Optimal',description:PILOT_STYLES[this.style]?.description||'Serious pilot',seed:this.seed,variation:this.variation,strategy:this.strategy,doctrine:this.doctrine,decisions:this.decisions}}
}
export function createPilots({seed,styles=['optimal','optimal'],variation='focused',doctrine=true,strategy='tactical'}){return [0,1].map(seat=>new ProceduralPilot({seat,seed:seedHash(seed+':pilot:'+seat),style:styles[seat],variation,doctrine,strategy}))}

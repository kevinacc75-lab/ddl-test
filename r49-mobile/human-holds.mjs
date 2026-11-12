// Interaction bookkeeping only. No AI policy, timers, engine state or native responses.
export class WorkerPauseOwners{
 constructor(){this.reset(0,false)}
 reset(epoch,paused){this.epoch=epoch;this.base=!!paused;this.owners=new Set()}
 change({epoch,owner,held}){if(epoch!==this.epoch||typeof owner!=='string'||!owner||owner.length>100||typeof held!=='boolean')return false;if(held)this.owners.add(owner);else this.owners.delete(owner);return true}
 manual(value){this.base=value===undefined?!this.base:!!value}
 releaseAll(){this.owners.clear()}
 get paused(){return this.base||this.owners.size>0}
}
export class HumanHolds{
 constructor({send,onChange,getPaused}){this.send=send;this.onChange=onChange;this.getPaused=getPaused;this.reset()}
 reset(){this.context=null;this.owners=new Set();this.legacyResume=false;this.onChange?.(false)}
 contextFrom(h){if(!h||h.protocol!==2)return;if(this.context&&(this.context.clientSession!==h.clientSession||this.context.epoch!==h.epoch))this.reset();this.context={clientSession:h.clientSession,epoch:h.epoch}}
 acquire(owner){if(this.owners.has(owner))return false;if(!this.owners.size&&!this.context){this.legacyResume=!this.getPaused();if(this.legacyResume)this.send({type:'pause',value:true})}this.owners.add(owner);if(this.context)this.send({type:'human-hold',...this.context,owner,held:true});this.onChange?.(true);return true}
 release(owner){if(!this.owners.delete(owner))return false;if(this.context)this.send({type:'human-hold',...this.context,owner,held:false});if(!this.owners.size){if(!this.context&&this.legacyResume)this.send({type:'pause',value:false});this.legacyResume=false;this.onChange?.(false)}return true}
 manual(value){this.legacyResume=false;this.send({type:'pause',value,...this.context})}
 recover(){const context=this.context,resume=this.legacyResume;this.owners.clear();this.legacyResume=false;if(context)this.send({type:'human-recover',...context});else if(resume)this.send({type:'pause',value:false});this.onChange?.(false)}
 get held(){return this.owners.size>0}
}

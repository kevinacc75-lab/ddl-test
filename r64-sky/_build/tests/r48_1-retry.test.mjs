// r48.1 (Claude, 12 Nov 2026; ChatGPT RELAY-147 R48-01). SELF-VERIFIED until reviewed.
// A queued "No response" that the player cancels must not be queued again by the add-on's retry.
// Uses the real HumanDecisionFlow and the real makeSender with hand-driven ticks; the page adapter (app.mjs) is mirrored
// here and its source is asserted below. Fails on r48: its send() called reply on every tick whatever happened.
import assert from 'node:assert/strict';import {test} from 'node:test';import fs from 'node:fs';
import {HumanDecisionFlow} from '../dist/human-flow.mjs';import {makeSender} from '../dist/play-comfort.mjs';
import {M,R} from '../dist/duel.mjs';
const ticks=[];const clock={every:f=>{ticks.push(f);return ticks.length},stop:id=>{ticks[id-1]=null}};const tick=()=>{for(const f of [...ticks])f?.()};
function setup(){ticks.length=0;const flow=new HumanDecisionFlow(),pass={type:R.SELECT_CHAIN,index:null};
 const prompt={type:M.SELECT_CHAIN,seat:0,forced:false,selects:[{code:1,controller:0,location:2,sequence:0}]},choices=[{response:{type:R.SELECT_CHAIN,index:0}},{response:pass}];
 flow.update({human:{protocol:2,clientSession:'test',epoch:1,token:'test'},state:{revision:10,prompt},choices,mode:'play',view:0});
 const page={busy:false,fxBusy:false,calls:0};
 const reply=r=>{page.calls++;if(flow.current){if(flow.pending)return 'refused';flow.choose(r,'No response');return flow.pending?'queued':'wait'}if(page.busy||page.fxBusy)return 'wait';page.busy=true;return 'sent'};
 return {flow,pass,page,reply}}
test('(R48.1-1) queue during a hold -> cancel -> retry ticks -> release: the cancelled pass is not queued or sent again',()=>{
 const {flow,pass,page,reply}=setup(),s=makeSender(clock);let result=null;
 s.start(()=>reply(pass),()=>true,r=>result=r);
 assert.equal(flow.pending.response.index,null,'queued');assert.equal(result,'queued');assert.equal(s.active(),false,'the retry stopped the moment the queue accepted it');
 assert.equal(flow.drain({held:true}),null,'held: not dispatched yet');
 assert.equal(flow.cancel(),true);assert.equal(flow.pending,null);
 for(let i=0;i<50;i++)tick();
 assert.equal(flow.pending,null,'no second pass after cancellation');assert.equal(page.calls,1,'reply was offered exactly once');
 assert.equal(flow.drain({}),null,'hold released: nothing is sent')});
test('(R48.1-2) a busy page is retried until it takes the answer, then never again; a changed decision ends the retry',()=>{
 ticks.length=0;let n=0,alive=true,done=null;const s=makeSender(clock);
 s.start(()=>++n<4?'wait':'sent',()=>alive,r=>done=r);assert.equal(s.active(),true);tick();tick();assert.equal(done,null);tick();assert.equal(done,'sent');assert.equal(n,4);assert.equal(s.active(),false);for(let i=0;i<9;i++)tick();assert.equal(n,4);
 n=0;done=null;s.start(()=>{n++;return 'wait'},()=>alive,r=>done=r);tick();alive=false;tick();tick();assert.equal(s.active(),false);assert.equal(n,2,'stops when the decision is no longer current');assert.equal(done,null);
 n=0;const t=makeSender({...clock,limit:3});t.start(()=>{n++;return 'wait'},()=>true);for(let i=0;i<9;i++)tick();assert.equal(n,3,'bounded');
 n=0;s.start(()=>{n++;return 'refused'},()=>true,r=>done=r);assert.equal(done,'refused');assert.equal(s.active(),false);tick();assert.equal(n,1)});
test('(R48.1-3) the page adapter reports queued / sent / wait / refused and the add-on uses only makeSender',()=>{
 const a=fs.readFileSync('dist/app.mjs','utf8'),p=fs.readFileSync('dist/play-comfort.mjs','utf8');
 assert.ok(a.includes("if(humanFlow.current){if(humanFlow.pending)return 'refused';reply(r,'addon');return humanFlow.pending?'queued':'wait'}if(busy||fxBusy)return 'wait';reply(r,'addon');return busy?'sent':'wait'}"));/* r63: the add-on's answers are labelled 'addon' (still automatic=truthy, so the same path) for the reply audit */
 assert.ok(a.includes("flow:humanFlow.current?.key||''"),'the decision key carries session, epoch and token');
 assert.equal(/setInterval\(go/.test(p.replace(/export function makeSender[^]*?\n export function|export function makeSender[^]*?\nexport function installPlayComfort/,'')),false,'no other retry loop');
 assert.ok(p.includes("const sender=makeSender();const send=(response,key)=>sender.start(()=>cur.reply(response),()=>!!cur&&cur.human&&cur.key===key,"))});

// r36 coin cutscene re-pin proof (Claude, 29 Oct 2026; Kevy 14:29). SELF-VERIFIED. Same method as tests/r35-shuffle-app-pin.test.mjs:
// taking EXACTLY the coin-cutscene additions out of each file gives back the file before them (r36-dtw 0d30c2b, the r35.8
// published build) byte for byte, so nothing else in these files changed. app.mjs is pinned by tests/r23-fx.test.mjs and
// presentation.mjs by tests/r35-shuffle-skip.test.mjs; both now pin the r36 bytes and point here for the proof.
import assert from 'node:assert/strict';import fs from 'node:fs';import crypto from 'node:crypto';
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
export const R36_COIN_UNDO={
 "app.mjs": [
  [
   "// r36 (Kevy 29 Oct 14:29, coin flip cutscene): the worker's coin envelope (coin-tap.mjs) is shown once per toss; ids are\n// deduped per epoch like the shuffle overlay, so a re-sent state never replays a toss.\nlet coinSeen={epoch:null,high:0};function coinEpochOk(c){try{if(!c||!Number.isFinite(c.epoch)||!Array.isArray(c.tosses))return false;if(c.epoch!==coinSeen.epoch)coinSeen={epoch:c.epoch,high:0};const fresh=c.tosses.filter(t=>t&&Number(t.id)>coinSeen.high);for(const t of fresh)coinSeen.high=Math.max(coinSeen.high,Number(t.id));c.tosses=fresh;return fresh.length>0}catch{return false}}\n// The engine's \"call it\" prompt (SELECT_OPTION with the system strings 60 Heads / 61 Tails): shown as a coin, not a list.\nconst COIN_CALL={60:'heads',61:'tails'};function isCoinCall(m){const o=(m?.options||[]).map(Number);return o.length===2&&o.every(v=>COIN_CALL[v])&&o[0]!==o[1]}\n",
   "",
   1
  ],
  [
   ",coinEpochOk(x.coin)?x.coin.tosses:[]);",
   ");",
   1
  ],
  [
   " if(m.type===M.SELECT_OPTION&&isCoinCall(m)&&choices.length===2){renderCoinCall(m);return}\n",
   "",
   1
  ],
  [
   "function renderCoinCall(m){const card=db?.[state.chain?.at?.(-1)?.code]?.name;$('#decision-title').textContent='Call it: heads or tails?';$('#decision-note').textContent=(card?card+' tosses a coin. ':'')+'The duel engine tosses the coin after you call it.';\n $('#choices').innerHTML='<div class=\"coin-call-row\">'+m.options.map((v,i)=>{const side=COIN_CALL[Number(v)];return `<button class=\"choice coin-call-btn\" data-choice=\"${i}\" data-side=\"${side}\" aria-label=\"Call ${side}\"><i class=\"coin-call-face\" aria-hidden=\"true\"></i><span class=\"choice-text\">${side==='heads'?'HEADS':'TAILS'}</span></button>`}).join('')+'</div>';\n $('#choices').onclick=e=>{const n=e.target.closest('[data-choice]');if(n){sound.play?.('confirm');reply(choices[Number(n.dataset.choice)].response)}}}\n",
   "",
   1
  ]
 ],
 "presentation.mjs": [
  [
   "\nimport {CoinScene,coinBatches,COIN_MS} from './coin-cutscene.mjs';// r36 (Kevy 29 Oct 14:29): coin toss / dice roll cutscenes",
   "",
   1
  ],
  [
   " const coinScene=new CoinScene({document,db,decks,sound,animate});/* r36: results come from the engine via the worker's coin envelope; this only shows them */\n const coinVisual=()=>enabled&&!skipCutins&&!!COIN_MS[preset],coinStill=()=>reduced||document.body.classList.contains('quiet-motion')||!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;\n",
   "",
   1
  ],
  [
   "  if(batch[0].type==='coinToss'){const e=batch[0];coinScene.log(e.toss);if(duration>0&&coinVisual()){coinScene.show(e,duration*timingScale,{reduced:coinStill(),deck:decks()[e.player],ownSeat:e.player===view()});stage.hidden=true}return}/* r36: coin / dice cutscene */\n",
   "",
   1
  ],
  [
   "\n  if(batch.events[0].type==='coinToss')batch.duration=coinVisual()?(COIN_MS[preset]??COIN_MS.learning):0;",
   "",
   1
  ],
  [
   "routes.clear();summonScene.clear();coinScene.clear();",
   "routes.clear();summonScene.clear();",
   1
  ],
  [
   "summonScene.reset();coinScene.reset();",
   "summonScene.reset();",
   1
  ],
  [
   "play(events,ackId,tosses){",
   "play(events,ackId){",
   1
  ],
  [
   "queue.push(...coinBatches(summonCutscenes.decorate(fusionMaterials.decorate(batches,preset),preset),tosses,preset))",
   "queue.push(...summonCutscenes.decorate(fusionMaterials.decorate(batches,preset),preset))",
   1
  ]
 ],
 "worker.mjs": [
  [
   "\n// r36 (Kevy 29 Oct 14:29, coin flip cutscene): coin-toss / dice-roll capture on the same one real duel, same conditions (see coin-tap.mjs).\nimport {CoinTap} from './coin-tap.mjs';const coinTap=new CoinTap({coinType:M.TOSS_COIN,diceType:M.TOSS_DICE,optionType:M.SELECT_OPTION});",
   "",
   1
  ],
  [
   "shuffleTap.arm();coinTap.arm()",
   "shuffleTap.arm()",
   3
  ],
  [
   "shuffleTap.disarm();coinTap.disarm()",
   "shuffleTap.disarm()",
   3
  ],
  [
   "shuffleTap.reset();coinTap.reset()",
   "shuffleTap.reset()",
   3
  ],
  [
   "shuffleTap.install(duel);coinTap.install(duel)",
   "shuffleTap.install(duel)",
   1
  ],
  [
   "shuffle:shuffleTap.drain(),coin:coinTap.drain()",
   "shuffle:shuffleTap.drain()",
   1
  ],
  [
   ",coin:lastHumanState.coin&&{...lastHumanState.coin,tosses:[]}",
   "",
   1
  ]
 ]
};
export const BEFORE={
 "app.mjs": "70f8d6965cf8cb2817d98b3f816814fd19de7bfe370d55775e5f7064f5aa8225",
 "presentation.mjs": "fedba78dba0b527cda3001bf0207df5a0e3426e58259d43151b7719b7d20b3f7",
 "worker.mjs": "e56d14113b9117c23648763fc8dbb471d22e3ed8f8f194e658031f32358c01b4"
};
if(import.meta.url===`file://${process.argv[1]}`){
 for(const [f,undo] of Object.entries(R36_COIN_UNDO)){let s=fs.readFileSync('dist/'+f,'utf8');
  for(const [a,b,n] of undo){assert.equal(s.split(a).length-1,n,f+': expected '+n+'x: '+a.slice(0,60));s=s.split(a).join(b)}
  assert.ok(!/coinTap|CoinTap|coinScene|CoinScene|coinBatches|isCoinCall|renderCoinCall|coinEpochOk/.test(s),f+': no other coin change');
  assert.equal(sha(s),BEFORE[f],f+' minus the coin additions = r35.8 (0d30c2b) byte for byte')}
 console.log(JSON.stringify({test:'r36-coin-pin',pass:true,node:process.version,files:Object.keys(R36_COIN_UNDO)}))}

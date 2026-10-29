// r35 item 8 (Claude, 28 Oct 2026). SELF-VERIFIED. app.mjs is a PINNED file (tests/r23-fx.test.mjs: pace, holds, think time).
// The deck-shuffle overlay adds only these lines to it. Taking exactly them out must give back the previously pinned
// app.mjs byte for byte (sha256 c7ff1ee0..., r32.1), so nothing else in app.mjs changed.
import assert from 'node:assert/strict';import fs from 'node:fs';import crypto from 'node:crypto';
let s=fs.readFileSync('dist/app.mjs','utf8');
// r36: first take out the coin cutscene lines (their own proof: tests/r36-coin-pin.test.mjs), then the shuffle lines as before.
{const {R36_COIN_UNDO}=await import('./r36-coin-pin.test.mjs');for(const [a,b,n] of R36_COIN_UNDO['app.mjs']){assert.equal(s.split(a).length-1,n,'r36 coin line: '+a.slice(0,60));s=s.split(a).join(b)}}
const UNDO=[
 ["\nimport {ShuffleOverlay} from './shuffle-overlay.mjs';// r35 item 8: deck-shuffle overlay (RELAY-046; decorative, never blocks or talks to the worker)",''],
 ["\nconst shuffleOverlay=new ShuffleOverlay({sound,view:()=>view,options:()=>({enabled:preferences.shuffleFx!==false&&preferences.preset!=='instant',reduced:!!preferences.motion||!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches})});document.addEventListener('visibilitychange',()=>{if(document.hidden)shuffleOverlay.cancel()});",''],
 ["beforeRewind:()=>{shuffleOverlay.reset();return invalidateHumanContext()}}","beforeRewind:invalidateHumanContext}"],
 ["presentation.reset();shuffleOverlay.reset();","presentation.reset();",3],
 ["{shuffleOverlay.cancel();resetHumanInteraction();","{resetHumanInteraction();"],
 ["worker.onerror=e=>{shuffleOverlay.reset();","worker.onerror=e=>{"],
 ["shuffleOverlay.viewChanged();shuffleOverlay.accept(x.shuffle);",""],
 // RELAY-059 Skip routes:
 ["\n// RELAY-059: every Skip route also cancels the shuffle overlay locally (no worker message). The presentation's own Skip buttons and Escape on its scene dialogs get an extra listener here; presentation.mjs is unchanged.\nfor(const id of ['skip-fx','skip-scene','skip-victory'])document.getElementById(id)?.addEventListener('click',()=>shuffleOverlay.cancel());for(const id of ['summon-scene','victory-scene'])document.getElementById(id)?.addEventListener('cancel',()=>shuffleOverlay.cancel());",""],
 ["{shuffleOverlay.cancel();presentation.skip();presentation.hold(true)}","{presentation.skip();presentation.hold(true)}"],
 ["{if(presentation.active){shuffleOverlay.cancel();presentation.skip();return}","{if(presentation.active){presentation.skip();return}"],
 ["humanHolds.manual(true);shuffleOverlay.cancel();presentation.skip()","humanHolds.manual(true);presentation.skip()"]];
for(const [a,b,n=1] of UNDO){assert.equal(s.split(a).length-1,n,'expected '+n+'x: '+a.slice(0,60));s=s.split(a).join(b)}
assert.ok(!s.includes('shuffleOverlay')&&!s.includes('ShuffleOverlay'),'no other shuffle change');
assert.equal(crypto.createHash('sha256').update(s).digest('hex'),'c7ff1ee0b618ee6522dc8cee756af1a572d22ee66e91091dcbe11ae9bcc08fda','app.mjs minus the shuffle lines = the r32.1 pinned app.mjs');
console.log(JSON.stringify({test:'r35-shuffle-app-pin',pass:true,node:process.version}));

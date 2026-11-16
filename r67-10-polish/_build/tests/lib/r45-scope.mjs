// r45 AI v4 scope (Kevy 11 Nov 2026 11:53 AEDT "Yes, build the v4 AI after r44"; display rename 11:55 AEDT).
// The ONLY files r45 changes versus r44, besides the build identity files (index.html, app.mjs About, worker.mjs BUILD,
// sw.js cache, release-notes.md, offline-assets.json for the two new files). Older scope tests allow these explicitly.
export const R45_AI_CHANGED=['ai/book/book.mjs','ai/book/branded-nov08.mjs','ai/book/sky-lines.mjs','ai/info-set.mjs','ai/world-pool.mjs','optimal-pilot.mjs'];
export const R45_NEW=['ai/v4-flags.mjs','ai/book/v4-plan.mjs',...['ai/r46-flags.mjs','ai/book/windbot-port.mjs','victory-boss.mjs']/* r46-adapted: r46 new files */];
export const R52_CHANGED=['app-shell.mjs','pilot.mjs'/* r67.7-adapted: battle-retarget adapter v2 hook (ChatGPT RELAY-246/254); undone exactly by pinnedFlow for the r45 pin */,'ai/brain/branded-brain.mjs'/* r67.5-adapted: Flame Wingman role note */,'deck-cards.json'/* r67.5-adapted: Favorite HERO Flame Wingman card entry (Kevy-approved deck change) */,'play-flow.mjs'/* r67.2-adapted: card-menu readiness guard only; byte pins use pinnedFlow() */,'effect-focus.mjs'/* r67.1-adapted: COST badge text only (ChatGPT text audit B-29) */,'pile-glow.mjs',/* r55 deck brains v1.1 (Seto team RELAY-179 fixes, ChatGPT RELAY-185 deltas): */'ai/book/dtw-plan.mjs','ai/book/hero-lines.mjs','ai/book/kashtira-lines.mjs','ai/book/mikanko-lines.mjs','ai/book/toon-lines.mjs','ai/brain/blueeyes-brain.mjs'/* r56 text only */,'ai/book/branded-lines.mjs'/* r58 comment only */,'load.mjs'/* r58.2 slow-connection download */,'ai/brain/dtw-brain.mjs','ai/brain/toon-brain.mjs'];/* r52: pile effect menu (pile-glow.mjs) wired with submit/getDecision/getDb (app-shell.mjs) */
export const R45_DISPLAY=['decks.json'];/* Branded display name only: "Kevy's Branded Deck" (ids, keys, lists, format unchanged) */
export const R45_BUILD=/^const BUILD='ddl-test r47 /;/* r46-adapted: the current build identity */
export const R45_CACHE=/CACHE=CACHE_PREFIX\+'2026-11-17-r67-10-polish'/;/* r46-adapted */
export const R45_NAME="Kevy's Branded Deck";
// r46 (Kevy 11 Nov 2026 14:54 AEDT): WindBot port (ai/book/book.mjs, optimal-pilot.mjs hooks; new ai/r46-flags.mjs, ai/book/windbot-port.mjs)
// and victory boss art (new victory-boss.mjs, css/aurora.css append, index.html script tag). Identity is now r46.
export const R46_TITLE='<title>TEST r67.10 — Duel Doctrine Lab · Kevy’s Branded list · Duel polish</title>';
export const R46_SCRIPT='<script type="module" src="victory-boss.mjs"></script>';

// r47 (Claude, 11 Nov 2026): the Concede button is the only r47 change outside the AI rule files, app.mjs and css/aurora.css.
// r47Undo removes exactly those insertions (each must be present once) so the older scope pins keep comparing what they compared.
export const R47_CONCEDE_HTML='<button id="concede" class="quiet" hidden>Concede</button>';
export const R47_CONCEDE_WORKER="\n else if(x.type==='concede'){/* r47: Play mode only. The human seat concedes: the duel ends at once and the other seat wins. No engine call; recorded and announced like any other win (reason 16 = conceded). */if(duel&&!duel.finished&&mode==='play'&&(view===0||view===1)){cancelThink();clearTimeout(timer);resetHumanTransport();const w=1-view;duel.winProcessed=true;duel.finished=true;duel.prompt=null;duel.winner=w;duel.winReason=16;duel.record(duel.decks[view].name+' conceded · '+duel.decks[w].name+' wins','win');duel.event('win',{player:w,reason:16,lp:[...duel.lp],turn:duel.turn,conceded:view});send()}}";
// r48: worker.mjs gained the concession record (concede-record.mjs import, state, restore on the replay paths). The exact
// character edits r48 -> r47 are in tests/fixtures/r48-worker-undo.json and only apply to the exact r48 worker text (sha256).
import fs48 from 'node:fs';import {createHash as h48} from 'node:crypto';
const R48_UNDO=JSON.parse(fs48.readFileSync(new URL('../fixtures/r48-worker-undo.json',import.meta.url),'utf8'));
export const R49_LINK='<link rel="stylesheet" href="./css/r49-mobile.css">';
// r49.1: library-worker.mjs gained art-additions.json loading. The exact r49.1 text maps back to the r49 text (fixture).
const R491_LW=JSON.parse(fs48.readFileSync(new URL('../fixtures/r49_1-library-worker-undo.json',import.meta.url),'utf8'));
/* r67.1-adapted: ChatGPT text audit B-11..B-15 (setup note, pace and graphics labels) are undone first, each exactly once */
export const R671_HTML=[["Seeded hands; computer choices can vary with the search time available.", "Random hands, deterministic decisions."], ["Learning · slower effect scenes", "Learning · 4-second resolution"], ["Duel · shorter effect scenes", "Duel · 2-second resolution"], ["Broadcast · faster effect scenes", "Broadcast · 1.2-second resolution"], ["Smooth · flat effects, lower visual detail", "Smooth · flat effects, fastest"]];
export function r48Undo(file,text){if(file==='library-worker.mjs'){if(text!==R491_LW.from)throw Error('library-worker.mjs is not the r49.1 text');return R491_LW.to}if(file==='index.html'){let t=text;for(const [now,was] of R671_HTML){if(t.split(now).length!==2)throw Error('r67.1 text not found exactly once: '+now);t=t.replace(now,was)}/* r52: the polish sheet link and the title-showcase script come out first, each exactly once */for(const R52 of ['\n<link rel="stylesheet" href="./css/r62-events.css">'/* r62 */,'\n<link rel="stylesheet" href="./css/r61-decide.css">'/* r61 */,'\n<link rel="stylesheet" href="./css/r60-focus.css">'/* r60 */,'<link rel="stylesheet" href="./css/r58-learn-temple.css">'/* r58 */,'<link rel="stylesheet" href="./css/r53-learn.css">','<script type="module" src="learn/learn.mjs"></script>'/* r53 */,'<link rel="stylesheet" href="./css/r52-polish.css">','<script type="module" src="title-showcase.mjs"></script>']){if(t.split(R52).length!==2)throw Error('r52 insertion not found exactly once: '+R52);t=t.replace(R52,'')}/* r50: the look sheet link and the new default theme option come out first, each exactly once */
  const R50_LINK='<link rel="stylesheet" href="./css/r50-egypt.css">',EG='<option value="egypt">Lapis &amp; Gold (Egyptian, default)</option><option value="aurora">Aurora</option>';
  if(t.split(R50_LINK).length!==2)throw Error('r50 stylesheet link not found exactly once');t=t.replace(R50_LINK,'');
  if(t.split(EG).length!==3)throw Error('r50 theme options not found exactly twice');t=t.split(EG).join('<option value="aurora">Aurora (default)</option>');
  if(t.split(R49_LINK).length!==2)throw Error('r49 stylesheet link not found exactly once');return t.replace(R49_LINK,'')}if(file!=='worker.mjs')return text;if(h48('sha256').update(text).digest('hex')!==R48_UNDO.sha256)throw Error('worker.mjs is not the r48 text the undo fixture was made for');let out=text;for(const [a,b,r] of [...R48_UNDO.ops].reverse())out=out.slice(0,a)+r+out.slice(b);return out}
export function r47Undo(file,text0){const text=r48Undo(file,text0);const cut=file==='worker.mjs'?R47_CONCEDE_WORKER:file==='index.html'?R47_CONCEDE_HTML:null;if(!cut)return text;if(text.split(cut).length!==2)throw Error('r47 concede insertion not found exactly once in '+file);return text.replace(cut,'')}

/* r67.2-adapted: tests that pin play-flow.mjs byte-for-byte compare the r67.2 file minus exactly the card-menu readiness guard.
   The fixture's sha256 must match the current file, so any further play-flow change makes these tests fail until re-adapted. */
import {readFileSync as _rf} from 'node:fs';import {createHash as _ch} from 'node:crypto';
const _PF=JSON.parse(_rf(new URL('../fixtures/r672-playflow-undo.json',import.meta.url),'utf8'));
/* r67.7-adapted: pilot.mjs gains exactly the BR-MID-BATTLE-01 v2 hook (an import and the attacker/pending lookup in the tactical
   attack-target rule). Undo exactly those two edits for tests that pin older builds; any other change throws. */
export const R677_PILOT=[["import {M,R} from './duel.mjs';import {replayRetarget} from './ai/battle-retarget.mjs';","import {M,R} from './duel.mjs';"],
 ["if(tactical&&d.hint===549){const context=pilot.board(d),rt=replayRetarget(d,p,m,pilot,battleOutcome,context,enemy)/* r67.7 BR-MID-BATTLE-01 v2: a proven attacker after an accepted replay Yes, else null/abstain = unchanged */,attacker=rt?.attacker||own.find(c=>c.code===d.lastCard);const score=x=>{const pending=rt?.attacker?null/* never reuse a pre-replay target */:pilot.pendingAttack;","if(tactical&&d.hint===549){const attacker=own.find(c=>c.code===d.lastCard),context=pilot.board(d);const score=x=>{const pending=pilot.pendingAttack;"]];
export function undoR677Pilot(t){let o=t;for(const [now,was] of R677_PILOT){if(o.split(now).length!==2)throw Error('r67.7 pilot.mjs edit not found exactly once');o=o.replace(now,was)}return o}
export function pinnedFlow(file,buf){if(file==='pilot.mjs'){const t=Buffer.isBuffer(buf)?buf.toString('utf8'):String(buf);const o=undoR677Pilot(t);return Buffer.isBuffer(buf)?Buffer.from(o,'utf8'):o}if(file!=='play-flow.mjs')return buf;const t=Buffer.isBuffer(buf)?buf.toString('utf8'):String(buf);
 if(_ch('sha256').update(t).digest('hex')!==_PF.sha256)throw Error('play-flow.mjs changed after r67.2: re-adapt r672-playflow-undo.json');
 let o=t;for(const [a,b,r] of [..._PF.ops].reverse())o=o.slice(0,a)+r+o.slice(b);return Buffer.isBuffer(buf)?Buffer.from(o,'utf8'):o}

/* r67.5-adapted: Kevy, 15 Nov 2026 22:25 AEDT: "Minus 1 dusk dragon / Add Favorite Elemental hero Flame wingman". The Branded Extra Deck
   now runs 1 Granguignol the Dusk Dragon (24915933) and 1 Favorite HERO Flame Wingman (13243124). Tests that pin OLDER builds' lists
   compare the current list with exactly this one approved swap undone; approved.json itself now records the new list. */
export const R675_SWAP={out:24915933,in:13243124};
export function undoR675(extra){const e=undoR676Extra(extra)/* r67.6-adapted */,i=e.lastIndexOf(R675_SWAP.in);if(i<0||e.indexOf(R675_SWAP.in)!==i)throw Error('r67.5 swap not found exactly once');e[i]=R675_SWAP.out;return e}
export function undoR675Decks(d){const c=undoR676Data(d)/* r67.6-adapted */;for(const deck of c.decks)if(deck.id==='branded'){deck.main=undoR676Main(deck.main);deck.extra=undoR675(deck.extra);for(const v of Object.values(deck.banlistVariants||{})){if(v.main)v.main=undoR676Main(v.main);v.extra=undoR675(v.extra)}}return c}

/* r67.6-adapted: Kevy, 16 Nov 2026 12:45 AEDT: "The deck I sent you last night is my Branded deck currently. Update and save that profile."
   Kevy's Branded Deck now runs his posted 40/15 list (2 Albaz, 1 White Dragon, no Albion the Shrouded Dragon; Extra -1 Dogma, +1 Shining
   Flare Wingman). Tests that pin OLDER builds' lists compare with this change undone first (exact r67.5 lists below); approved.json records
   the new list. */
export const R676={oldMain:[62962630, 62962630, 62962630, 68468459, 73819701, 73819701, 45484331, 19304410, 95515789, 95515789, 60303688, 45883110, 55273560, 55273560, 94395649, 19096726, 42141493, 42141493, 42141493, 14558127, 14558127, 14558127, 59438930, 59438930, 59438930, 94145021, 44362883, 34995106, 75500286, 1984618, 1984618, 1984618, 29948294, 36637374, 48130397, 48130397, 48130397, 30271097, 30271097, 30271097, 25451383],oldExtra:[44146295, 76666602, 76666602, 76666602, 80843006, 72272462, 24915933, 13243124, 70534340, 51409648, 41373230, 11765832, 74405783, 3410461, 38811586],newMain:[62962630, 62962630, 62962630, 68468459, 68468459, 73819701, 45484331, 19304410, 95515789, 95515789, 60303688, 45883110, 55273560, 55273560, 94395649, 19096726, 42141493, 42141493, 42141493, 14558127, 14558127, 14558127, 59438930, 59438930, 59438930, 94145021, 44362883, 34995106, 75500286, 1984618, 1984618, 1984618, 29948294, 36637374, 48130397, 48130397, 48130397, 30271097, 30271097, 30271097],newExtra:[44146295, 76666602, 76666602, 80843006, 72272462, 24915933, 13243124, 87758525, 70534340, 51409648, 41373230, 11765832, 74405783, 3410461, 38811586]};
const _same=(a,b)=>a.length===b.length&&a.every((x,i)=>x===b[i]);
export function undoR676Main(main){if(_same(main,R676.oldMain))return [...main];if(!_same(main,R676.newMain))throw Error('r67.6 main list not found exactly');return [...R676.oldMain]}
export function undoR676Extra(extra){if(_same(extra,R676.oldExtra))return [...extra];if(!_same(extra,R676.newExtra))throw Error('r67.6 extra list not found exactly');return [...R676.oldExtra]}
export const R676_OLD_META={"subtitle": "Pure Branded \u00b7 MetaGamesGX video list \u00b7 41/15/15 \u00b7 15:40 Extra, budget: Alba-Lenatus + Sanctifire (Alba-Lenatus the Abyss Dragon and Albion the Sanctifire Dragon) \u00b7 TEST", "source": "MetaGamesGX Extra Undefeated Pure Branded \u00b7 video j-9t122Jpag (15:40 frame) \u00b7 Kevy 10 Nov 22:48 AEDT; budget swap Kevy 10 Nov 23:20 AEDT", "format": "TCG Advanced \u2014 19 October 2026 (MetaGamesGX Pure Branded 41 \u00b7 10 Nov video)"};
export function undoR676Data(d){const c=structuredClone(d);for(const deck of c.decks)if(deck.id==='branded'){deck.main=undoR676Main(deck.main);deck.extra=undoR676Extra(deck.extra);Object.assign(deck,R676_OLD_META);for(const v of Object.values(deck.banlistVariants||{})){if(v.main)v.main=undoR676Main(v.main);if(v.extra)v.extra=undoR676Extra(v.extra);Object.assign(v,R676_OLD_VARIANT_META)}}return c}
export function undoR676Approved(a){return {...a,main:undoR676Main(a.main),extra:undoR676Extra(a.extra)}}
export const R676_OLD_VARIANT_META={"subtitle":"Pure Branded \u00b7 MetaGamesGX video list \u00b7 41/15/15 \u00b7 15:40 Extra, budget: Alba-Lenatus + Sanctifire (Alba-Lenatus the Abyss Dragon and Albion the Sanctifire Dragon) \u00b7 TEST","format":"TCG Advanced \u2014 19 October 2026 (MetaGamesGX Pure Branded 41 \u00b7 10 Nov video)"};
// r67.9-adapted (Job L, RELAY-262b E7-E11): dl-fx.mjs and css/fx.css gain the battle effects. undoR679 turns the served file back
// into the r67.8 (= r42/r43) bytes exactly, so the older identity pins still hold for everything else in those files.
export const R679_FX=['dl-fx.mjs','css/fx.css'];
import {readFileSync as __r679read} from 'node:fs';
const __r679=JSON.parse(__r679read(new URL('../fixtures/r679-fx-undo.json',import.meta.url)));
export function undoR679(f,text){const u=__r679[f];if(!u)return text;let o=text;for(const [a,b,r] of [...u.ops].reverse())o=o.slice(0,a)+r+o.slice(b);return o}

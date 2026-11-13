// r45 AI v4 scope (Kevy 11 Nov 2026 11:53 AEDT "Yes, build the v4 AI after r44"; display rename 11:55 AEDT).
// The ONLY files r45 changes versus r44, besides the build identity files (index.html, app.mjs About, worker.mjs BUILD,
// sw.js cache, release-notes.md, offline-assets.json for the two new files). Older scope tests allow these explicitly.
export const R45_AI_CHANGED=['ai/book/book.mjs','ai/book/branded-nov08.mjs','ai/book/sky-lines.mjs','ai/info-set.mjs','ai/world-pool.mjs','optimal-pilot.mjs'];
export const R45_NEW=['ai/v4-flags.mjs','ai/book/v4-plan.mjs',...['ai/r46-flags.mjs','ai/book/windbot-port.mjs','victory-boss.mjs']/* r46-adapted: r46 new files */];
export const R52_CHANGED=['app-shell.mjs','pile-glow.mjs'];/* r52: pile effect menu (pile-glow.mjs) wired with submit/getDecision/getDb (app-shell.mjs) */
export const R45_DISPLAY=['decks.json'];/* Branded display name only: "Kevy's Branded Deck" (ids, keys, lists, format unchanged) */
export const R45_BUILD=/^const BUILD='ddl-test r47 /;/* r46-adapted: the current build identity */
export const R45_CACHE=/CACHE=CACHE_PREFIX\+'2026-11-13-r54-guided'/;/* r46-adapted */
export const R45_NAME="Kevy's Branded Deck";
// r46 (Kevy 11 Nov 2026 14:54 AEDT): WindBot port (ai/book/book.mjs, optimal-pilot.mjs hooks; new ai/r46-flags.mjs, ai/book/windbot-port.mjs)
// and victory boss art (new victory-boss.mjs, css/aurora.css append, index.html script tag). Identity is now r46.
export const R46_TITLE='<title>TEST r54 — Duel Doctrine Lab · Guided Duel</title>';
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
export function r48Undo(file,text){if(file==='library-worker.mjs'){if(text!==R491_LW.from)throw Error('library-worker.mjs is not the r49.1 text');return R491_LW.to}if(file==='index.html'){let t=text;/* r52: the polish sheet link and the title-showcase script come out first, each exactly once */for(const R52 of ['<link rel="stylesheet" href="./css/r53-learn.css">','<script type="module" src="learn/learn.mjs"></script>'/* r53 */,'<link rel="stylesheet" href="./css/r52-polish.css">','<script type="module" src="title-showcase.mjs"></script>']){if(t.split(R52).length!==2)throw Error('r52 insertion not found exactly once: '+R52);t=t.replace(R52,'')}/* r50: the look sheet link and the new default theme option come out first, each exactly once */
  const R50_LINK='<link rel="stylesheet" href="./css/r50-egypt.css">',EG='<option value="egypt">Lapis &amp; Gold (Egyptian, default)</option><option value="aurora">Aurora</option>';
  if(t.split(R50_LINK).length!==2)throw Error('r50 stylesheet link not found exactly once');t=t.replace(R50_LINK,'');
  if(t.split(EG).length!==3)throw Error('r50 theme options not found exactly twice');t=t.split(EG).join('<option value="aurora">Aurora (default)</option>');
  if(t.split(R49_LINK).length!==2)throw Error('r49 stylesheet link not found exactly once');return t.replace(R49_LINK,'')}if(file!=='worker.mjs')return text;if(h48('sha256').update(text).digest('hex')!==R48_UNDO.sha256)throw Error('worker.mjs is not the r48 text the undo fixture was made for');let out=text;for(const [a,b,r] of [...R48_UNDO.ops].reverse())out=out.slice(0,a)+r+out.slice(b);return out}
export function r47Undo(file,text0){const text=r48Undo(file,text0);const cut=file==='worker.mjs'?R47_CONCEDE_WORKER:file==='index.html'?R47_CONCEDE_HTML:null;if(!cut)return text;if(text.split(cut).length!==2)throw Error('r47 concede insertion not found exactly once in '+file);return text.replace(cut,'')}

// r45 AI v4 scope (Kevy 11 Nov 2026 11:53 AEDT "Yes, build the v4 AI after r44"; display rename 11:55 AEDT).
// The ONLY files r45 changes versus r44, besides the build identity files (index.html, app.mjs About, worker.mjs BUILD,
// sw.js cache, release-notes.md, offline-assets.json for the two new files). Older scope tests allow these explicitly.
export const R45_AI_CHANGED=['ai/book/book.mjs','ai/book/branded-nov08.mjs','ai/book/sky-lines.mjs','ai/info-set.mjs','ai/world-pool.mjs','optimal-pilot.mjs'];
export const R45_NEW=['ai/v4-flags.mjs','ai/book/v4-plan.mjs',...['ai/r46-flags.mjs','ai/book/windbot-port.mjs','victory-boss.mjs']/* r46-adapted: r46 new files */];
export const R45_DISPLAY=['decks.json'];/* Branded display name only: "Kevy's Branded Deck" (ids, keys, lists, format unchanged) */
export const R45_BUILD=/^const BUILD='ddl-test r47 /;/* r46-adapted: the current build identity */
export const R45_CACHE=/CACHE=CACHE_PREFIX\+'2026-11-11-r47-ai-battle-chain-fix'/;/* r46-adapted */
export const R45_NAME="Kevy's Branded Deck";
// r46 (Kevy 11 Nov 2026 14:54 AEDT): WindBot port (ai/book/book.mjs, optimal-pilot.mjs hooks; new ai/r46-flags.mjs, ai/book/windbot-port.mjs)
// and victory boss art (new victory-boss.mjs, css/aurora.css append, index.html script tag). Identity is now r46.
export const R46_TITLE='<title>TEST r47 — Duel Doctrine Lab · Aurora · AI battle + chain fix</title>';
export const R46_SCRIPT='<script type="module" src="victory-boss.mjs"></script>';

// r47 (Claude, 11 Nov 2026): the Concede button is the only r47 change outside the AI rule files, app.mjs and css/aurora.css.
// r47Undo removes exactly those insertions (each must be present once) so the older scope pins keep comparing what they compared.
export const R47_CONCEDE_HTML='<button id="concede" class="quiet" hidden>Concede</button>';
export const R47_CONCEDE_WORKER="\n else if(x.type==='concede'){/* r47: Play mode only. The human seat concedes: the duel ends at once and the other seat wins. No engine call; recorded and announced like any other win (reason 16 = conceded). */if(duel&&!duel.finished&&mode==='play'&&(view===0||view===1)){cancelThink();clearTimeout(timer);resetHumanTransport();const w=1-view;duel.winProcessed=true;duel.finished=true;duel.prompt=null;duel.winner=w;duel.winReason=16;duel.record(duel.decks[view].name+' conceded · '+duel.decks[w].name+' wins','win');duel.event('win',{player:w,reason:16,lp:[...duel.lp],turn:duel.turn,conceded:view});send()}}";
export function r47Undo(file,text){const cut=file==='worker.mjs'?R47_CONCEDE_WORKER:file==='index.html'?R47_CONCEDE_HTML:null;if(!cut)return text;if(text.split(cut).length!==2)throw Error('r47 concede insertion not found exactly once in '+file);return text.replace(cut,'')}

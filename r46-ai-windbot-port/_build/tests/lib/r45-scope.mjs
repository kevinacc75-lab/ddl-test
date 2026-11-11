// r45 AI v4 scope (Kevy 11 Nov 2026 11:53 AEDT "Yes, build the v4 AI after r44"; display rename 11:55 AEDT).
// The ONLY files r45 changes versus r44, besides the build identity files (index.html, app.mjs About, worker.mjs BUILD,
// sw.js cache, release-notes.md, offline-assets.json for the two new files). Older scope tests allow these explicitly.
export const R45_AI_CHANGED=['ai/book/book.mjs','ai/book/branded-nov08.mjs','ai/book/sky-lines.mjs','ai/info-set.mjs','ai/world-pool.mjs','optimal-pilot.mjs'];
export const R45_NEW=['ai/v4-flags.mjs','ai/book/v4-plan.mjs',...['ai/r46-flags.mjs','ai/book/windbot-port.mjs','victory-boss.mjs']/* r46-adapted: r46 new files */];
export const R45_DISPLAY=['decks.json'];/* Branded display name only: "Kevy's Branded Deck" (ids, keys, lists, format unchanged) */
export const R45_BUILD=/^const BUILD='ddl-test r46 /;/* r46-adapted: the current build identity */
export const R45_CACHE=/CACHE=CACHE_PREFIX\+'2026-11-11-r46-ai-windbot-port'/;/* r46-adapted */
export const R45_NAME="Kevy's Branded Deck";
// r46 (Kevy 11 Nov 2026 14:54 AEDT): WindBot port (ai/book/book.mjs, optimal-pilot.mjs hooks; new ai/r46-flags.mjs, ai/book/windbot-port.mjs)
// and victory boss art (new victory-boss.mjs, css/aurora.css append, index.html script tag). Identity is now r46.
export const R46_TITLE='<title>TEST r46 — Duel Doctrine Lab · Aurora · AI WindBot port</title>';
export const R46_SCRIPT='<script type="module" src="victory-boss.mjs"></script>';

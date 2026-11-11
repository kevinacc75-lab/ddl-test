// r45 AI v4 scope (Kevy 11 Nov 2026 11:53 AEDT "Yes, build the v4 AI after r44"; display rename 11:55 AEDT).
// The ONLY files r45 changes versus r44, besides the build identity files (index.html, app.mjs About, worker.mjs BUILD,
// sw.js cache, release-notes.md, offline-assets.json for the two new files). Older scope tests allow these explicitly.
export const R45_AI_CHANGED=['ai/book/book.mjs','ai/book/branded-nov08.mjs','ai/book/sky-lines.mjs','ai/info-set.mjs','ai/world-pool.mjs','optimal-pilot.mjs'];
export const R45_NEW=['ai/v4-flags.mjs','ai/book/v4-plan.mjs'];
export const R45_DISPLAY=['decks.json'];/* Branded display name only: "Kevy's Branded Deck" (ids, keys, lists, format unchanged) */
export const R45_BUILD=/^const BUILD='ddl-test r45 /;
export const R45_CACHE=/CACHE=CACHE_PREFIX\+'2026-11-11-r45-ai-v4'/;
export const R45_NAME="Kevy's Branded Deck";

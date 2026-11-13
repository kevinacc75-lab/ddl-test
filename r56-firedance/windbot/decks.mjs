// r37: which site decks WindBot can pilot, and with which of its scripts (WindBot "executors", ProjectIgnis fork bffe6b6).
// Chosen by card overlap with WindBot's own list for that archetype; the site's TCG 19 Oct 2026 lists are what it plays.
export const WINDBOT_EXECUTORS={sky:{executor:'SkyStriker',label:'Sky Striker'},branded:{executor:'Albaz',label:'Branded (Albaz)'},blueeyes:{executor:'BE2025',label:'Blue-Eyes (2025)'},kashtira:{executor:'Kashtira',label:'Kashtira'}};
export const windBotFor=deckId=>WINDBOT_EXECUTORS[String(deckId||'').replace(/@.*/,'')]||null;

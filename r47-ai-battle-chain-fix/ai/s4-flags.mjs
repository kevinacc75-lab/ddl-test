// r36 S4 battle-planner flags (Claude as builder, 5 Nov 2026; plan item S4, found by S2 puzzle e). Kept out of
// midgame-flags.mjs so the reviewed A/B/C/T/Z shape and the Classic/Enhanced recipes do not change. Default OFF and in no
// recipe until reviewed:
//   E = planBattle uses every attacker the ENGINE offers, including face-up Defence Position ones (e.g. Scareclaw
//       Kashtira: "This card can attack while in face-up Defense Position. If it does, apply its DEF for damage
//       calculation."), scored with DEF when its text says so.
//   F = friendly-chain guard (RELAY-117, ChatGPT live play-test 71091): when every open chain link is ours, the base
//       pilot declined ("Do not chain") and an offered response is a card that negates, search may not override that
//       decline (a baseline-preservation rule with a text heuristic, not a full negation evaluator; it stopped own Ash
//       Blossom on own Sky Striker Ace = Zero). Mixed/enemy chains and a base pilot that itself chains are untouched.
const env=String(globalThis.process?.env?.DDL_S4??globalThis.DDL_S4??'').toUpperCase();
export const S4=Object.fromEntries(['E','F'].map(k=>[k,env.includes(k)]));
export function setS4(flags={}){for(const k of Object.keys(S4))if(k in flags)S4[k]=!!flags[k];return {...S4}}

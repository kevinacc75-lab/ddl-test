STATUS: OPEN
ANSWER BY: Alexis (confirm each expected play; rulings for c and d), Akiza (strategy check of the expected plays; c/d lines), ChatGPT (review the puzzle method and flag E)

# r36 S2 midgame puzzle suite v1 + S4a flag E - Claude (builder while Seto is out) - Thu 5 Nov 2026 WITA

SELF-VERIFIED by the builder only. The expected plays are Claude's proposals and stay PENDING until Alexis confirms them. Nothing is published. RC1, the gate, the whitelist and the pin are untouched. Classic and Enhanced recipes are unchanged.

## Identity
- Tree r36-enh-claude **02ce728**: one commit on the selector package's bf5fa1f; the patch file is in this folder.
- dist in-folder hash 20e36b9f7180cd01ce46e8dbb546f10f7b00db46b81e6d48071c230cf0dd3843 (498 files).
- dist changes vs bf5fa1f:
  - new dist/ai/s4-flags.mjs (5167373c…);
  - dist/tactics.mjs 245915e4… -> d21ae4b3… (one import, plus two lines behind flag E).
- Node v22.22.2.

## Method (tools/r36-s2-puzzles.mjs)
- **Engine-native.** Named cards are dealt to chosen zones at duel creation (as in the s3-harness).
- **CONTROLLED decks.** Each side's deck is only its placed cards plus filler copies of Black Luster Soldier, a Ritual Monster with no Ritual Spell in the deck, so it can never be played.
  - So hands and draws are dead, and the position alone decides the turn.
  - Decks keep their real ids, so books and doctrine still load.
- **Turns.** Turns 1-2 are passed (End Turn). On turn 3, seat 0's real OptimalPilot plays the whole turn. Seat 1 declines every chain.
- **Runs.** Each puzzle runs in Classic and in Enhanced, with search off or with a node budget (no clock, world pool on). So the results are deterministic on any host.
- **Why controlled decks:** a first try with the real 40-card decks just turned into a turn-3 combo-into-lethal, which tests nothing about the midgame.

## Results (a FAIL is a lead, not a verdict)
| puzzle | expected play (PENDING Alexis) | Classic | Enhanced | with flag E |
|---|---|---|---|---|
| a: Granguignol (ATK) vs an empty board + 1 set card | attack, never switch to Defence | PASS (s0, s100) | PASS (s0, s100) | PASS |
| a2: as a, the opponent holds Ash Blossom, Jamming Waves!, Forbidden Droplet + 2 set | the same | PASS (s0, s400) | PASS (s0, s400) | PASS |
| b: Dark Armed 2800 vs Fleurdelis 2500 (ATK) | attack Fleurdelis | PASS (s0, s100) | PASS (s0, s100) | PASS |
| b2: as b, the opponent holds Ash, Branded in Red, Albaz + Branded Retribution set | the same | PASS (s0, s400) | PASS (s0, s400) | PASS |
| **e: Scareclaw Kashtira in face-up DEF vs an empty board** | attack (the card says it can; DEF used) | **FAIL** (s0/s100/s400) | **FAIL** (s0/s100/s400) | **PASS: 2600 damage** |

**Honest limits:**
- a/a2/b/b2 do NOT reproduce the 4 Nov turtling (F-A); Classic passes them too. They are regression guards, not proof that F-A is fixed.
- The 4 Nov cases came from fuller states: more own resources, face-up opponent threats, and a time-based search. Those traces are not natively replayable (T-D limit).
- v2 needs richer positions built from those traces by hand.

## Finding confirmed: F-E (planBattle drops engine-offered Defence Position attackers)
- dist/tactics.mjs planBattle keeps an offered attacker only if `position&1` (Attack Position).
- Scareclaw Kashtira's own text: "This card can attack while in face-up Defense Position. If it does, apply its DEF for damage calculation."
- The engine offers the attack; the AI never takes it, in both Classic and Enhanced.

**S4a fix: flag E**
- Location: dist/ai/s4-flags.mjs, deliberately outside midgame-flags.mjs, so the reviewed A/B/C/T/Z shape and both recipes stay byte-identical.
- Default OFF, and in no recipe.
- With E on:
  - planBattle keeps every attacker the engine offers;
  - a Defence Position attacker whose text says "apply its DEF for damage calculation" is scored with its DEF.
- Proposal: add E to the Enhanced recipe after ChatGPT's review and Alexis's ruling.

## Checks at 02ce728
- tests/r36-s4-e.test.mjs (new):
  - E defaults off and is in neither recipe;
  - puzzle e FAILs in Classic and Enhanced with E off;
  - it PASSes with E on, with damage = DEF 2600.
- All tests that touch tactics or the midgame flags pass: r36-ai-mode, r36-f1, r36-midgame, -a1-late, -b1, -b1-r2, -b1-r3, -c (tests/).
- Classic parity spot check: Luna v Kashtira 71003/0, search off, stream f51dcf3393dbbc18…, the same as r35.12.

## Questions
- **Alexis:**
  1. Confirm each expected play (a, b, e).
  2. Scareclaw Kashtira from Defence Position: is battle damage the attacker's DEF against a direct attack, and against a monster in ATK or DEF?
  3. For puzzle c: does an opponent's Kaiju that we control (e.g. Radian, in our Main Monster Zone) switch off Sky Striker spells whose condition is "no monsters in your Main Monster Zones"? And may we tribute/Link it away?
  4. For puzzle d: Mikanko Water Arabesque, what exactly is reflected, and when?
- **Akiza:** are a/b/e the right plays strategically? What is the expected line for c (own Kaiju lock) and d (low LP vs reflection)?
- **ChatGPT:**
  1. Is the controlled-deck method sound as the S2 base?
  2. Is flag E acceptable as built?
  3. Should E join the Enhanced recipe once Alexis confirms?

## Next
- v2 positions: richer states from the 4 Nov traces, (f) churn, and c/d once ruled.
- Then S3, the purpose gate.

Claude. Nothing published.

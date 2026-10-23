# r35 public-identity fix (R34-01): review package

Claude, Sat 24 Oct 2026, 01:05 AEDT. **SELF-VERIFIED (builder). Needs an independent check (Seto L4 / item 6).** This is not a build; nothing is published.

Built to Alexis's ruling ("r35-public-identity-rulings-alexis-2026-10-23") and Seto's limits L1–L4 (23 Oct 21:40 and 21:45, 24 Oct 00:10).

## Rule (one helper: `dist/public-identity.mjs`)
Name a moving card if its **source** was public at the moment of the move, **or** its **destination** is public. Otherwise the code is 0.
- **Public:** face-up field (incl. Pendulum Zones and Field Zone), the GY, face-up banished, face-up Extra Deck. An Xyz Material source is reported by the core as a face-up Monster Zone card, so it is public with no special case.
- **Private:** Deck, hand, face-down field, face-down banished, face-down Extra Deck.
- **L1:** `duel.mjs` uses the same `publicMove()` for the move event's `code` and for the log's concealed flag (`A card`).
- **P6:** `fusion-materials.mjs` `publicMaterial()` uses the same `publicMove()`. That feeds both the Fusion panel and the summon summary (`summon-cutscenes.mjs`). A code-0 event always stays anonymous, and no name is restored from memory.
- **L2:** (c) "active reveal" is **DEFERRED**. A revealed hand card moving to a private place stays hidden (under-names, which is legal).
- **L3 (Seto):** a face-up card bounced from the field to the hand is named; a face-down one stays hidden.
- **L4:** the r34.1 `PublicTracker` field-memory path is **retired** (deleted). The snapshot (opponent's view of hand / face-down cards) is unchanged.

## Identity (L4)
- r18 commit `8e0317b0dcedf770f64ea6da092bf7b022a6c150`, on top of `f017211` (effect titles candidate), which sits on top of `c9f71b5` (r34.1).
- `dist/duel.mjs` sha256 `f0a0718445dc4a8b47cc1349e0f6283fc1fc9d7a25f3b35f107cd68665fa1cb9`.
- `dist/public-identity.mjs` `5c441a0871aafd3ff536c9881a25583dcbaa0ff7a80ecf256c6aa20a103bd011`.
- `dist/fusion-materials.mjs` `3c0a801d412d76629064a78c360672e0d29dccbb74ca52cec0daf06b7d56d646`.
- dist tree hash (`cd dist && find . -type f | LC_ALL=C sort | xargs sha256sum | sha256sum`): `5f78efd4659b2a01e366d60ddbc0ef1438849ad091158a7c2eed1ddd8d6ef457`. This tree includes the effect-titles candidate.
- Patch `r35-public-identity.patch` = `git diff f017211 8e0317b` (6 files, +185 −51).

## AI unchanged (R4), measured with `r35-identity-hash.mjs`, before = f017211, after = 8e0317b
- **Base AI**, the 8 S2b acceptance seeds (pairings exactly as the gate's S2b) plus the smoke set (8 decks × 7 opponents, seeds 9100+): **64/64 duels, every response hash identical**. Combined hash `890ae37c97011276fe8a2e2db88fb79711419093` both before and after. Move events changed in 50 of 64 duels, as expected (1351 → 1459 named moves in the last 120 events of each duel).
- **Search AI** (optimal pilot, nodeBudget 400), the 8 S2b seeds, first 40 decisions: **8/8 identical**. A 150-decision run is in progress; its result follows in the next handover.
- Why: the AI's knowledge (`dist/ai/knowledge.mjs`) reads raw engine messages with its own rule. It never reads move-event codes or the log; `hashPublicState` and the snapshot are unchanged.
- **Not** the frozen gate's responsesHash: the gate wasn't run (frozen, Seto's machine).

## Tests (`tests/r35-public-identity.test.mjs`, real event stream)
Every engine MOVE in the duels it plays is paired with the event and log line the wrapper made. Each is checked against a spec written separately from Alexis's table: 853 moves, 667 logged lines (L1), 47 move categories.
- **P1:** Super Polymerization reproducer. The board is dealt exactly; every step is the real engine and wrapper. SP fuses Albaz + their Ohime into Albion, then Albion's Fusion makes Lubellion, then Lubellion's makes Mirrorjade. Lubellion Field → Extra Deck is named.
  - **Note:** this is my own reproducer, not ChatGPT's original RELAY-030 one. Please re-run yours.
- **P2, P3, P6:** Branded v Mikanko, seed 121, Mikanko first, base AI. The Mirrorjade panel reads `Lubellion the Searing Dragon (Field → Extra Deck); Fallen of Albaz (GY → Deck)`. The summon summary reads `Public materials: Lubellion the Searing Dragon; Fallen of Albaz`. Before this change both said "Face-down material", which reproduces RELAY-035 exactly.
- **P4:** Lunalight Tiger moves face-up from the Pendulum Zone to the Extra Deck and is named; the opponent's snapshot shows it.
- **P5:** face-up banished → Deck is named (natural branded-hero duel, and in the SP reproducer).
- **C1:** hand → Deck stays 0.
- **C2:** Set card → hand stays 0.
- **C3:** face-down Extra Deck → face-down banished, and Deck → face-down banished, stay 0. Face-down banished → Deck never happens with the 8 preset decks, so it is covered by rule cases in the test.
- **C4:** the opponent's snapshot hides face-down Extra Deck cards; the owner sees them.
- **R1:** Set card → GY is named.
- **R2:** an Xyz Material detached to the GY is named, with no error.
- **R3:** a Token leaving the field makes no move event and causes no error.
- **R5 (L3):** a face-up card bounced to the hand is named; a face-down one stays 0.
- **Negative control:** the same test run with the old `duel.mjs` FAILS at the first face-up bounce (Ha-Re the Sword Mikanko M-up → Hand).
- **`r34-book-additions.test.mjs`, two assertions changed:**
  - "face-down origin attached as an Xyz Material" is now named, because an attached material is face-up and public.
  - The FusionMaterials stream block now expects the wrapper's codes (Field → Extra named, GY → Deck named) and that a code-0 event stays anonymous.
  - The hidden controls (hand → Extra, hand → Deck, face-down → Deck) are kept.
- **All quick tests: 34/34 PASS** (Node v22.22.0; r27-deck-books not re-run).
- **Browser** (Chromium, 1180×820, Branded v Mikanko, Broadcast): 0 page errors.

## Files here
- `r35-public-identity.patch`, `public-identity.mjs`, `duel.mjs`, `fusion-materials.mjs`, both tests, `r35-identity-hash.mjs`.
- Identity outputs: `identity-base-before/after.json`, `identity-search40-before/after.json`.
- `move-categories-56-duels.txt`: every move category over 56 natural base-AI duels (8 decks × 7 opponents, seed 500), run on the **fixed** build, with named counts and `wrong 0` (a named code always equals the real card).

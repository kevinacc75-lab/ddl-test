# Kitt swap + queue item 3: TEST branch, not a build, not published

**Rev 2 (28 Oct, 07:15 AEDT):** queue item 3 (Tri-Brigade Kitt revive picks) and the RELAY-053 notes are added. Head is now `ab4cc3e` (item 3 on top of `8c8f523`). New files: `item3.diff` (8c8f523..ab4cc3e), `kitt-swap-full.diff` (812cfca..ab4cc3e), `test-results-rev2.txt`.

- **Branch:** `r35-kitt-swap`, r18 commit `8c8f523`, based on r35.2 (`812cfca`, the live play-test build).
- **Approval:** Kevy, 24 Oct 19:01: "Kitt swap in 19 Oct list: yes" (one card only).
- **Status:** SELF-VERIFIED (Claude). Needs Tea (only-change check), Akiza (brain entry) and ChatGPT (code). Publishing needs Kevy's direct OK and a new TEST path.

## Deck data change: exactly one card plus the label
`decks-json-diff.json` lists every difference in `dist/decks.json`. There are two:
- `banlistVariants.tcg-2026-10-19.main[18]`: 45484331 (Springans Kitt) → 19304410 (Tri-Brigade Springans Kitt). The copy count stays 1.
- The format label text.

The base Branded list (used by the gate decks) already had 19304410, so it is unchanged.

## Knock-on changes (each found by the test suite)
1. **`branded-lines.mjs`: V53-KITT line commented out (disabled).** Its card is now in no Branded list, so the line could never fire. Seto's queue item 3 rebuilds it as a Tri-Brigade Kitt revive line, with Akiza and Alexis reviewing.
2. **`captions.mjs`:** V53-KITT caption commented out with the line (the r32 captions test needs a line for every caption).
3. **`branded-brain.mjs`:** brain entry for Tri-Brigade Springans Kitt, written from the printed text (DRAFT, Akiza review). It's an "extender", and **this changes play slightly:** opponents' hand-trap key cards against Branded now include it (`book.mjs keyCards`). The old Kitt's entry is removed.
4. **`deck-cards.json`:** regenerated with `tools/r33-deck-cards.mjs`.
5. **`tests/r32-mirrorjade-float`:** its recorded seed-208 opening was made with the pre-swap list, so the fixture is pinned to that list (old Kitt in slot 18). The test is about Mirrorjade.
6. **`tests/taskc-deck-legality`:** asserts the Tri-Brigade Kitt ×1 and no DARK Kitt. The deck is legal on the 19 Oct banlist.
7. **`tools/build-branded-v53.mjs`** (RELAY-053 note 1): the V53 Main entry now names Tri-Brigade Springans Kitt, the FORMAT label is updated, and the printed Kitt lookup is updated. It regenerated the 19 Oct variant in decks.json.

`offline-assets.json` is untouched. Both Kitt artworks were already cached.

## Tests
`test-results.txt` shows all 37 tests pass (exit 0 each), run at low priority on the build machine. Full diff against r35.2: `kitt-swap.diff`.

## Rev 2: queue item 3 (`item3.diff`)
- **`branded-lines.mjs`:** two picks with source Tri-Brigade Springans Kitt and hint 509 (the revive), in Akiza's order (Seto handover 06:15).
  - Going second, Ecclesia and Cartesia move up.
  - An offered Albaz Fusion comes first (the engine offers only properly summoned ones; Alexis point 4).
  - Kitt never picks itself.
  - The old DARK Kitt search pick (hint 506) is removed.
  - **Not encoded:** unused-once-per-turn first, Mercourier only with an Albaz Fusion on the field, and the opponent's-turn order. No book condition exists for these yet.
- **`branded-brain.mjs`** (RELAY-053 note 3): both effects now say "except Tri-Brigade Springans Kitt". It also says the revive doesn't target and works from the Deck (Alexis).
- **`tests/r35-kitt-revive.test.mjs`:** a synthetic-view unit fixture of the book rule. A mutation check (going-second rule switched off) was caught.
  - **Historical fixture still labelled:** the Mirrorjade fixture's pass says nothing about the new Kitt.
  - **Still to do:** a native Branded Fusion → Kitt-from-Deck fixture, and the opponent-side key-card measurement Akiza asked for.

## Test provenance (RELAY-053 note 2)
`test-results-rev2.txt` records:
- Node v22.22.0;
- the exact command;
- base 812cfca and head ab4cc3e;
- the dist tree manifest sha256 `f74477f3…be2fa2f` (sha256 of the sorted `sha256sum` of every file under dist/);
- 38/38 exit 0.

The rev 1 results file (`test-results.txt`) is kept as it was.

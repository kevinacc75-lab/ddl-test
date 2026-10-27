# Kitt swap: TEST branch, not a build, not published

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

`offline-assets.json` is untouched. Both Kitt artworks were already cached.

## Tests
`test-results.txt` shows all 37 tests pass (exit 0 each), run at low priority on the build machine. Full diff against r35.2: `kitt-swap.diff`.

# Kitt swap + queue item 3: TEST branch, not a build, not published

**Package rev 4 (28 Oct, ~13:00 AEDT), for RELAY-054 (close-out), RELAY-056 and RELAY-057.** Head is `07a1ad4`. It carries two code revisions on top of `09bf121`: code rev 4 `c37a68e` (Akiza via Seto 09:10) and code rev 5 `07a1ad4` (the rollover fix). New files:
- `item3-rev4-5.diff` (09bf121..07a1ad4)
- `kitt-swap-full.diff` (812cfca..07a1ad4, replaced)
- `test-results-rev4.txt` (full suite: 39 of 39 pass, node v22.22.0, nice 19, run sequentially while S2a shards ran)

**Code rev 4 (`c37a68e`):**
- **Dogma (76666602) slot 4:** it ranks after Sanctifire, before the Main Deck picks, only if its on-Special-Summon shuffle (effect 0) is unused this turn AND any GY or banishment (either player's) has a card. Otherwise it is a body: first among the bodies if an "Ecclesia" monster is on the field or in either GY, else after Lubellion (Seto confirmed).
- **Never-rule refined:** it uses the card's OWN End Phase effect index (Titaniklad 0, Alba-Lenatus 0, Dogma 1), and it applies only while a legal search target is still in our Deck (Titaniklad: a Dogmatika monster or Fallen of Albaz; Alba-Lenatus: a Polymerization / Fusion Normal Spell, not Super Polymerization; Dogma: a Dogmatika / Tri-Brigade card).
- **K3-02 mirror:** a new pick-rule field `keep`, so a base pick of Tri-Brigade Springans Kitt is never replaced by the two Branded Fusion material rules.

**Code rev 5 (`07a1ad4`), RELAY-056/057 rollover:** the duel keeps only its last 120 events (`duel.mjs` line 37 shifts the oldest), so in a long turn "sent to the GY this turn" / "activated this turn" could read a partial record.
- `dist/ai/book/turn-ledger.mjs` (sha256 `bf5f96c0…33cf884`, byte-identical on r35-r44): a per-duel ledger that absorbs events by id each time it is read and never changes the duel.
  - **Keyed on the object that owns `events`.** Every AI view (`safeView`, the pilot shadow) is `Object.create(duel)`, so the prototype walk finds the duel from any view.
  - **Array swaps:** a retry filters the rejected `effectChosen` into a NEW array (duel.mjs respond), and the ledger carries its history across (dropping any absorbed event that vanished). `start()` / rewind reset the ids (`eventSeq` goes back), and the ledger restarts.
  - **complete = false** only when the window now starts past the next id the ledger expected (events rolled off the FRONT unseen). A removed retry event in the middle is not a missed event. A later `'turn'` event in view makes the record complete again.
- `kitt-revive.mjs`: `sentToGyThisTurn` / `activatedThisTurn` answer true / false / null (unknown).
  - Unknown = the End Phase search is **pending** (never revive that card).
  - Unknown = Dogma's shuffle is **used** (no slot 4).
- **Tests:** `tests/r35-turn-ledger.test.mjs` runs on the REAL `Duel.prototype.event`. It covers:
  - rollover after being seen (remembered);
  - rollover never seen (unknown, conservative), then the next turn (complete again);
  - rollover of an observed activation;
  - two effects of one card (Dogma 0 vs 1);
  - retry (no false gap; a removed absorbed event is dropped);
  - rewind / new duel (no leak; new low ids absorbed);
  - views of views;
  - mocks without events;
  - an empty or from-1 window is complete.
- `r35-kitt-revive` test rev 5: views now give events ids.
- **Mutation checks**, each caught by its intended assertion:
  1. no prototype walk (key = view)
  2. old per-event gap check
  3. no reset on ids going back
  4. no retry prune
  5. fresh ledger incomplete
  6. unknown treated as false
  7. Dogma unknown allowed
  8. End Phase unknown treated as not pending
  9. the old 120-event buffer scan
- **Known limit:** a search clone replayed from the start has its early events rolled out, so its ledger is incomplete until the next turn, and the book answers conservatively there. Unchanged from rev 3 otherwise.

SELF-VERIFIED (Claude, builder = verifier), NOT independent. Needs ChatGPT (code) to close RELAY-054/056/057. Nothing published; RC1 untouched; any gate on this branch is a NEW gate (Branded is a gate deck).

-----

**Rev 3 (28 Oct, 09:35 AEDT), for RELAY-054.** Head is `09bf121` (item 3 rev 2 on top of `ab4cc3e`). New files: `item3-rev2.diff` (ab4cc3e..09bf121), `kitt-swap-full.diff` (812cfca..09bf121, replaced), `test-results-rev3.txt` (38/38), `identities-rev3.txt` (sha256 of the changed book modules), `native-outputs-rev3/` (per-test output).
- **K3-01:** the revive pick is now code (`dist/ai/book/kitt-revive.mjs`, called from `bookPick`) and follows Akiza's 07:05 order with its conditions:
  1. Mirrorjade, only if we control none and an Albaz-mentioning Fusion is left in our Extra Deck.
  2. Rindbrumm.
  3. Sanctifire.
  4. The Main Deck order (Ecclesia and Cartesia move up when going second).
  5. Titaniklad, Alba-Lenatus and Lubellion, as bodies.
- **Never-rule:** never Titaniklad, Alba-Lenatus or The Dragon that Devours the Dogma (76666602) when it was sent to the GY this turn and its End Phase search is unused. This reads the duel's move and activate events since this turn's turn event. A base choice that breaks this rule is replaced by any other offered card.
- **Dogma** is unranked, pending Akiza. The two JSON hint-509 picks are removed from branded-lines.mjs.
- **K3-02:** Tri-Brigade Springans Kitt is removed from both Branded Fusion material (hint 511) preferences. It wasn't a tie-break, and the book hook has no main-policy scores to make one; Akiza is asked to confirm. A fixture shows a base Ecclesia is kept over Kitt with Albaz in hand. The dead old-Kitt name is removed from the Synchro list.
- **Fixture:** `tests/r35-kitt-revive.test.mjs` is rewritten. It covers:
  - the full order going first and second;
  - both of RELAY-054's counterexamples;
  - the Mirrorjade conditions;
  - the never-rules (this turn / used / earlier turn / a forbidden base replaced);
  - Dogma unranked;
  - another source untouched;
  - material preservation.

  Mutation checks were caught: the old order, the never-rule removed, the Mirrorjade conditions removed, and the Kitt preference restored (caught by the list check and by the behavioural check on its own).
- **Wording:** Kitt's revive is **from our GY, in Defense Position**, never itself, and doesn't target. The **trigger** activates when Kitt is sent to the GY from anywhere, Deck included. (Rev 2's README said "works from the Deck"; that meant the trigger, as the brain entry says.)
- **Native:** the source zone (GY) and Defense Position are asserted in the S3 branch's KT-3 (`review/r35-s3-fixtures`, rev 2), which carries the TEST-only script override K1.


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

# S2a job 29 fix: targeting Spell/Trap removal needs a TARGETABLE opposing Spell/Trap (TEST branch, not merged)

**Branch** `r35-cyclone-fix` (r18), head `cebebf6` (code commit `25d93da`; `cebebf6` adds the pin proof and re-pin). Base: r35.5 `83c5f04`.
**Design:** fix plan rev 2 (Claude, 29 Oct 01:00), accepted by Seto (01:25) with build points 1-7. Diagnosis: Seto 00:30; Alexis and Akiza rulings.
**Status:** SELF-VERIFIED (Claude, builder = verifier), NOT independent. Next: ChatGPT code review, then Seto's verification. A gate candidate needs a new full gate, and Kevy decides. Nothing is merged or published.

## The defect (S2a job 29: seed 466300, mikanko-mikanko f1, turn 14)
- At decision 886 our pilot chained Cosmic Cyclone. Rule: "Disrupt or advance the line"; search was in fallback, 7 worlds.
- The opponent had a face-up Hu-Li the Jewel Mikanko, and its Equip Card: Mikanko Fire Dance, equipped to Hu-Li.
- Hu-Li reads: "While you control an Equip Card, your opponent cannot target 'Mikanko' cards you control". So both of their Spell/Traps (Fire Dance, Water Arabesque) were untargetable.
- `optimal-pilot.mjs` line 30 checked only `enemy(8).length`. At decision 888 the engine offered only our own Spell/Traps, and Reflection Rondo was banished.

**Correction of my 00:05 diagnosis and my rev 2 plan.**
- Fire Dance equips itself to the monster it summons, and in job 29 that was Hu-Li, on THEIR field. It was not "a monster on our field". The native fixture shows the engine records `equipCard = {controller: their seat, location 4, sequence: Hu-Li}`.
- So the r35.5 helper would have found the shield in job 29. The ONLY cause was line 30 not calling it.
- The helper's other deviations from the printed text are real and fixed here, but they did not cause job 29:
  - it required the Equip Card to be on Hu-Li ("an Equip Card" in the text);
  - it pooled both players' zones;
  - it had no face-up check.
- Rev 2 also said `optimal-pilot.mjs` is not in `r23-fx`'s PINNED list. **It is.** The full suite caught this, and the re-pin with proof is below.

## The change (dist/optimal-pilot.mjs only; sha256 `8b8c03c3...` -> `e2d9d01d7a191e72f0feba50d79508cf5254cb1c5b997b01b4b609e68cb540fa`)
- **F1.** Cosmic Cyclone, MST, Twin Twisters and Tornado Dragon need at least one opposing Spell/Trap that `targetable()` accepts.
  - Galaxy Cyclone: the hand/field activation needs a targetable SET Spell/Trap; the GY effect needs a targetable FACE-UP one.
  - The block comes before activation, so no cost is paid (Twin Twisters' discard, Tornado Dragon's detach).
- **F2.** `huLiShield(d, side)` follows the printed text: their FACE-UP, unnegated Hu-Li AND any Equip Card in THEIR Spell/Trap Zone (face-up, `equipCard` set, equipped to a monster on either field). Under the shield:
  - their "Mikanko" cards are untargetable;
  - their face-down cards are untargetable too, because they may be Mikanko cards. Public information only: a set card's identity is never read.
- **F3.** Catch-all `GRANTS_ST_SHIELD` (`/your opponent cannot target [^.]*(Spells?|Traps?|Spell\/Traps?|cards you control)/i`), on opposing face-up, unnegated cards other than Hu-Li, for imported decks. Effect: their Spell/Trap Zone cards are untargetable (conservative).
  - Across the 267-card, 8-deck pool it matches **Hu-Li only** (`catch-all-regex-hits.txt`).
  - Across the whole database it matches 26 cards, listed in the same file.
- **Search** is bound by the existing root-option filter, which calls `activationBlock`. The job 29 replay below shows the fallback path now passes.
- **Also changed (Seto point 1):** Infinite Impermanence, Widow Anchor and Afterburners already used `targetable()`, so they now see the corrected Hu-Li shield. Unit section 10 covers this. No S2b seed hit such a position (below).

## Evidence
1. **Unit** (`tests/r35-cyclone-targetable.test.mjs`, synthetic views, real card texts). Each case is a section:
   - (1) the job 29 shape;
   - (2) their Equip on a monster on our field still shields;
   - (3) our Equip does not raise their shield;
   - (4) face-down Hu-Li and negated Hu-Li: no shield;
   - (5) no Equip: no shield;
   - (6) a set card under the shield is untargetable, Double-Edged Sword is targetable;
   - (7) MST, Twin Twisters, Tornado Dragon, Cosmic Cyclone, with and without the shield;
   - (8) both Galaxy Cyclone effects;
   - (9) catch-all on and negated; Toon Kingdom does not match;
   - (10) Impermanence under the corrected shield.
   - **8 mutations, each caught by its intended assertion:** the old line 30; equip-on-Hu-Li; both zones pooled; no face-up check; set cards targetable; Galaxy Cyclone with any target; no catch-all; negated Hu-Li counts.
2. **Native, real engine** (`tests/r35-cyclone-hu-li-native.test.mjs`; output in `targeted-results.txt`). The engine is the referee: in every board, its offer at Cosmic Cyclone's target prompt matches `targetable()`.
   - (a) Job 29 shape. The new rule blocks; the r35.5 rule allowed it (control, loaded from the r35.5 file). The engine offers only our set Mikanko Spiritwalk. The pilot does not activate.
   - (b) Plus their Double-Edged Sword (non-Mikanko Equip). Allowed. The engine offers Double-Edged Sword and our card. The pilot targets Double-Edged Sword.
   - (c) Hu-Li with no Equip Card on their side. Allowed. The engine offers their set card.
   - (d) Hu-Li negated by our Forbidden Droplet. Blocked before the negation, allowed after. The engine offers Fire Dance.
3. **Job 29 replayed with the fixed pilot** (`job29-replay-fixed-d870-895.json`, `job29-replay-compare.txt`).
   - Setup: `tools/s2a-diagnose-job.mjs` on a copy of the frozen gate tree that differs ONLY in `dist/optimal-pilot.mjs` (dist tree `57ef88e0...`). Same frozen prefix eed7e402, Node v22.22.2.
   - Decisions up to 885 are identical to the original replay.
   - At 886 the pilot now PASSES (Cosmic Cyclone held), and keeps holding it at every later window that turn (888-894).
   - In Main Phase (895) it activates Mikanko Dance - Mayowashidori instead.
4. **Paired S2b seeds** (`paired-s2b-seeds.txt`; your condition 1).
   - Setup: gate code through the split runner `--s2b-repro --non-counting`, frozen 1c380d58 / 9f1fb5f5 / 807133d3. The base tree vs the fix tree, where only `optimal-pilot.mjs` differs.
   - **All 8 seeds byte-identical:** hash, decisions and all blunder counts. That includes 4242's existing own=1 (Bystial Saronir, unchanged).
   - **Diffs to explain: none.** No S2b game reached a Hu-Li + Equip position, so the fix never fired there. This shows no side effects; items 2 and 3 show the fix working.
   - Note: seeds 808, 4242, 31337 and 99 on the fix side ran one seed per process, after a 2 h background limit cut the first attempt. With the world-pool fix, per-seed results don't depend on process order, and the base hashes match the 27 Oct repro (2026 `a291fb15`, 12345 `1b7a3afa`).
5. **Full suite** (`test-results-first-full-run.txt`, head `25d93da`): 52 pass, 1 fail: `r23-fx`, the `optimal-pilot.mjs` pin.
   - Fixed in `cebebf6`: `tests/r35-cyclone-pin.test.mjs` swaps back exactly the fix's three blocks and gets `8b8c03c3...` byte for byte; `r23-fx` is re-pinned with a comment.
   - Only test files changed after the full run, so the suite stands at 54/54 (`targeted-results.txt` holds the re-run of the changed tests).
6. **Node worker paired run** (Mikanko mirror, 8 seeds x both first seats, 200-state cap; r35.5 vs this branch): in progress. Added when done.

## Hashes
| Item | sha256 |
|---|---|
| `optimal-pilot.mjs` before (r35.5 / frozen gate tree) | `8b8c03c360961cca10b2f265c399d12dadeac589d00ba031d2620ad73f0960c7` |
| `optimal-pilot.mjs` after | `e2d9d01d7a191e72f0feba50d79508cf5254cb1c5b997b01b4b609e68cb540fa` |
| Fix-tree dist (gate-cyclone, `find dist -type f \| sort \| xargs sha256sum \| sha256sum`) | `57ef88e0cdce106a548f3648758e5ccf6d3c2e9881a8b414f3505c5ffd42f0fc` |
| Frozen gate tree dist (same method, 28 Oct) | `33c8d1bdb204adb2fa6a77f7c6a103b741ca63654603adcacdcdb1bc489b3e26` |

## Process
- TEST branch only: ChatGPT code review, then Seto's verification. The r35.5 known-issue label changes only after the fix has passed review, in a new play-test build.
- A gate candidate means a new full gate (S2b + S2a, frozen 1c380d58 / 9f1fb5f5), which is Kevy's call. Nothing goes near RC1.

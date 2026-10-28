# S2a job 29 fix: targeting Spell/Trap removal needs a TARGETABLE opposing Spell/Trap (TEST branch, not merged)

**Branch** `r35-cyclone-fix` (r18), head **`41f3efe`**. Commits: `25d93da` (code), `cebebf6` (pin proof and re-pin), `50b7191` (guard wording only), `41f3efe` (comment only). Base: r35.5 `83c5f04`.
**Design:** fix plan rev 2 (Claude, 29 Oct 01:00), accepted by Seto (01:25) with build points 1-7. Diagnosis: Seto 00:30; Alexis and Akiza rulings.
**Status:** code at `e2d9d01d` reviewed by ChatGPT (RELAY-063, PASS WITH NOTES) and verified by Seto (05:25, VERIFIED WITH NOTES). This update answers those notes. The final identity, `ed03a478`, is SELF-VERIFIED and needs Seto's apply-and-hash re-check. A gate candidate needs a new full gate, and Kevy decides. Nothing is merged or published.

## Update 29 Oct 06:30: answers to RELAY-063 and Seto's 05:25 notes
**Final `dist/optimal-pilot.mjs`: sha256 `ed03a478d999605e6089898ac5d97cc7c102494e160853776aaa1a3dea490948`** (git blob `e9d66ca2...`). The decision logic is unchanged from the reviewed `e2d9d01d`. Two changes since then:
- **`50b7191`, guard wording** (`wording-change.diff`). When the opponent has NO Spell/Trap at all, the guard text is the r35.5 text again ("has no opposing Spell/Trap to remove"). The new text ("has no targetable opposing Spell/Trap") appears only when their Spell/Traps exist but none can be targeted. The block fires in exactly the same cases as before. The Node paired run (evidence 6) found the text difference. Unit section 7 now checks both wordings.
- **`41f3efe`, stale comment** (`comment-fix.diff`; RELAY-063 note 1, Seto note 1). Line 24 now reads: Fire Dance was equipped to THEIR Hu-Li, so the old helper did see the shield; the cause was that the Cosmic Cyclone check only counted their Spell/Traps and never asked whether any could be targeted. The same text is in the pin test's embedded block (regenerated), and `r23-fx` is re-pinned to `ed03a478`.

| Note | Answer |
|---|---|
| Seto 1 / ChatGPT 1: stale comment | Fixed in `41f3efe`. New hashes are in `git/IDS.txt`. New combined patch `cyclone-fix.diff` (83c5f04 → 41f3efe), sha256 `d3ee8aa3...`. I checked that it applies cleanly to the published r35.5 `optimal-pilot.mjs` (8b8c03c3) and gives `ed03a478`. The final file is also included here as `optimal-pilot.mjs`. |
| Seto 2: commits not on GitHub | `git/`: a bundle `83c5f04..41f3efe` (`git bundle verify` OK; it needs base commit `83c5f0446f21...`), a `git format-patch` series 0001-0004 that `git am` applies onto any r35.5 copy, and `IDS.txt` with commit, tree and blob ids. A full bundle with history is 116 MB, over GitHub's 100 MB file limit. I can split it if you need it. |
| Seto 3 / ChatGPT 2: Node paired run | Done. See evidence 6 and `paired-node-mikanko.txt`. All 16 pairs re-run at the final identity: 16/16 identical to r35.5 (see "Final-identity runs" below). |
| Seto 4: s3-harness, Node version | `tools/s3-harness.mjs` (sha256 `0c8d2108...`) is included. It imports only `../dist/core/index.js` and `../dist/duel.mjs`. The three new tests are in `tests/`. Run them from a tree root containing `dist/`. The native test takes an optional `R35_OLD_PILOT=<path to r35.5 optimal-pilot.mjs>` for the before/after control. The full suite now runs on **Node v22.22.2**, as you prefer. |
| Seto 5: catch-all count, dist method | `catch-all-regex-hits.txt` corrected: the whole database has 27 hits and 26 unique names (Hu-Li has two codes), and Drytron Meteonis Quadrantids is now listed. The 8-deck pool still matches Hu-Li only. Dist hashes: the frozen tree is `698bc2da...` by my method and `33c8d1bd...` by `cd dist && find .`. You are right, and the hash table below now says which is which. |
| ChatGPT: "54/54" is composite | Agreed. The final-identity run below is one full suite log on a single head. |

**Final-identity runs (`41f3efe` / `ed03a478`), DONE 29 Oct 07:50.** SELF-VERIFIED. Everything is in `final-runs/`.
- **Full suite, ONE run at head `41f3efe`, Node v22.22.2: 54/54 pass** (`suite-41f3efe-node-v22.22.2.txt`, plus one log per test in `suite-logs/`). This replaces the composite "54/54".
- **Job 29 replay** (`job29-replay-final-d870-895.json`, `job29-replay-final-compare.txt`).
  - Setup: gate copy (dist `fe7e58c6...`), frozen prefix, Node v22.22.2.
  - All 26 decisions 870-895 are identical to the first fixed replay on every recorded field.
  - 886 passes, 888 passes, 895 plays Mayowashidori.
- **Node paired run, all 16 pairs** (`paired-node-mikanko-final-fix.jsonl`, `paired-final-compare.txt`).
  - **16/16 identical to r35.5** on responses, log, decisions, states, outcome and errors.
  - Outcome mix, the same on both sides: 5 finished, 1 at the cap, 10 stopped by the known info-set error. This is not strength proof.
- **Raw logs for the guard-text claim** (RELAY-064). The first version `e2d9d01d` was regenerated from `25d93da`, and its rows reproduce the first-run digests exactly.
  - For 555/0, 99/0 and 99/1, every differing log line (4, 12 and 20) is only "has no opposing Spell/Trap to remove" -> "has no targetable opposing Spell/Trap". Responses are equal.
  - The final version's logs are identical to r35.5.
  - Raw dumps for all three versions are in `final-runs/raw-dumps/`. The probe script is `tools/probe-dump.mjs`.

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

## The change (dist/optimal-pilot.mjs only; sha256 `8b8c03c3...` -> final `703f42c18fa5b9be22eddbb732f5a6286e9b6e5498ef398d667c828b84a065d7`; first version `e2d9d01d...`, see evidence 6)
- **F1.** Cosmic Cyclone, MST, Twin Twisters and Tornado Dragon need at least one opposing Spell/Trap that `targetable()` accepts.
  - Galaxy Cyclone: the hand/field activation needs a targetable SET Spell/Trap; the GY effect needs a targetable FACE-UP one.
  - The block comes before activation, so no cost is paid (Twin Twisters' discard, Tornado Dragon's detach).
- **F2.** `huLiShield(d, side)` follows the printed text: their FACE-UP, unnegated Hu-Li AND any Equip Card in THEIR Spell/Trap Zone (face-up, `equipCard` set, equipped to a monster on either field). Under the shield:
  - their "Mikanko" cards are untargetable;
  - their face-down cards are untargetable too, because they may be Mikanko cards. Public information only: a set card's identity is never read.
- **F3.** Catch-all `GRANTS_ST_SHIELD` (`/your opponent cannot target [^.]*(Spells?|Traps?|Spell\/Traps?|cards you control)/i`), on opposing face-up, unnegated cards other than Hu-Li, for imported decks. Effect: their Spell/Trap Zone cards are untargetable (conservative).
  - Across the 267-card, 8-deck pool it matches **Hu-Li only** (`catch-all-regex-hits.txt`).
  - Across the whole database it has 27 hits, 26 unique names (corrected 06:30; Hu-Li has two codes), all listed in the same file.
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
6. **Node worker paired run** (`paired-node-mikanko-first-run.jsonl`, `paired-node-mikanko.txt`).
   - Setup: `dist/worker.mjs` run in-process in Node (synchronous AI path, no live deadlines), CPU vs CPU, Mikanko mirror, 8 seeds x both first seats, 200-state cap. r35.5 vs this branch. Rows are in base, fix order.
   - **First run (pilot `e2d9d01d`):** all 16 pairs have identical responses. 13 of 16 also have identical logs. The 3 that differ (555/0, 99/0, 99/1) differ ONLY in guard text: when the opponent had no Spell/Trap at all, the new code said "has no targetable opposing Spell/Trap" where r35.5 said "has no opposing Spell/Trap to remove".
   - **Fix (`50b7191`):** keep the r35.5 wording when the opponent has no Spell/Trap. The new wording appears only when their Spell/Traps exist but none can be targeted. The decision is unchanged: the block fires in exactly the same cases.
   - **Re-run of the 3 pairs (pilot `703f42c1`):** responses AND logs are now byte-identical to r35.5 (full dumps compared, 0 differing log lines).
   - The `reading 'rejected'` error in 10 of 16 games happens on BOTH sides identically. It is the known info-set bug (guard on branch `r35-infoset-guard`, queued for Seto separately). It is not caused by this fix.

## Hashes
| Item | sha256 |
|---|---|
| `optimal-pilot.mjs` before (r35.5 / frozen gate tree) | `8b8c03c360961cca10b2f265c399d12dadeac589d00ba031d2620ad73f0960c7` |
| `optimal-pilot.mjs` FINAL (`41f3efe`) | `ed03a478d999605e6089898ac5d97cc7c102494e160853776aaa1a3dea490948` |
| `optimal-pilot.mjs` at `50b7191` (wording; used for the 3-pair Node re-run) | `703f42c18fa5b9be22eddbb732f5a6286e9b6e5498ef398d667c828b84a065d7` |
| `optimal-pilot.mjs` first version (`25d93da`, reviewed; used for evidence items 3, 4 and the first Node run) | `e2d9d01d7a191e72f0feba50d79508cf5254cb1c5b997b01b4b609e68cb540fa` |
| Fix-tree dist FINAL (gate-cyclone; method A = run in the tree root: `find dist -type f \| sort \| xargs sha256sum \| sha256sum`) | `fe7e58c6f54272eded46e804b745229747832142ca970d6a0e4883ce83e0aa38` |
| Fix-tree dist, first version (method A) | `57ef88e0cdce106a548f3648758e5ccf6d3c2e9881a8b414f3505c5ffd42f0fc` |
| Frozen gate tree dist, method A | `698bc2da32ae3d09f00449a679ff8e9ca1a2aade393752c1e0fe5c98a057d493` |
| Frozen gate tree dist, method B = `cd dist && find . -type f \| sort \| xargs sha256sum \| sha256sum` (the 28 Oct figure; earlier wrongly called "same method") | `33c8d1bdb204adb2fa6a77f7c6a103b741ca63654603adcacdcdb1bc489b3e26` |

## Process
- TEST branch only: ChatGPT code review, then Seto's verification. The r35.5 known-issue label changes only after the fix has passed review, in a new play-test build.
- A gate candidate means a new full gate (S2b + S2a, frozen 1c380d58 / 9f1fb5f5), which is Kevy's call. Nothing goes near RC1.

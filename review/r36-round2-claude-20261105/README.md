STATUS: OPEN - for ChatGPT's independent review
ANSWER BY: ChatGPT (RELAY-107 L1, RELAY-108 sections 2 and 5, RELAY-109 conditions). Alexis/Akiza expected plays are still pending (RELAY-109).

# r36 round 2 - Claude (builder while Seto is out) - Thu 5 Nov 2026 WITA

SELF-VERIFIED by the builder only. Nothing is published. RC1, the frozen gate (1c380d58), the whitelist (9f1fb5f5) and the info-set pin (9337e197) are untouched. Both recipes are unchanged (Classic = all off; Enhanced = A+B). Flag E is in neither recipe.

## Identities
| | value |
|---|---|
| base | S2 v1 package tree 02ce728 (ddl-test ff7b266) |
| round-2 commits | 78d98d4 (L1), c75a2c1 (B1 worker-state + S4 reset), 7d82616 (S2 v2), 695dff5 (bounded pins), 1a24613 (browser tool only). Patches in patches/. |
| final dist in-folder hash at 695dff5 / 1a24613 | **1bb5e00aaa3598b6aacf0f7bade0efdb82351fbec033590fd5796bd86929b0e2** (498 files) |
| dist changes vs 02ce728 | midgame-rules.mjs, worker.mjs, ai/ai-worker.mjs, ai/midgame-flags.mjs (ROUND2-dist.diff) |
| runtime | Node v22.22.2; Chromium via the pre-installed Playwright; Claude's container |

File SHA-256 at 695dff5:
- midgame-rules e86143fb905c7e8406885e6a1245ca417784c7ca8438b7587d9dfc78478c28d5
- worker ceaaeb6310b4ced5ee93660ebb44d18c60c5fbc231529bf5c5af066e90e714c4
- ai-worker 23caae46f8d5792250c4493e4f9a29448736e7ff607505e9478ba88d20735fb0
- midgame-flags 558c53489982c4ca1401aabe791e9bf112dc208f2b33487e799b9596aff1d012
- optimal-pilot e1e90a90… (unchanged)
- tactics d21ae4b3… (unchanged)
- s4-flags 5167373c… (unchanged)
- app 7ca55805… (unchanged)

## 1. RELAY-107 L1: unbound-intent lifecycle (78d98d4)
**Rule.** An armed removal intent must BIND at its first own observation, or it EXPIRES. At that observation, our own unsolved chain link with the intent's link number and code must be in the current chain (newest, behind an opponent response, or resolving). We then bind its source instance. Otherwise `expired`: removalDone is true, removalBind keeps it expired, and removalFollowUp returns null.

**One wait state.** For a card placed from the hand, the engine asks SELECT_PLACE (hint = that card's code) BEFORE it opens the link. The intent waits there only (no link yet, nothing resolving). This was found natively: a first version without it expired the intent at Widow Anchor's zone choice, and the follow-up was lost in 4 of the 5 B1 controls. That version was not committed.

**Lifecycle argument (and its limits).**
- removalFor runs only at an open Idle prompt. optimal-pilot clears pendingRemoval at every own Idle/Battle prompt.
- Between our accepted activation and our next own prompt, we take no action. So the chain we observe first is the activation's own chain, unless an engine-only mandatory trigger of the same code opens a new chain with no prompt of ours. That edge is not covered by a native case.
- All 5 modelled B1 cards produce an activation-stage cost/target prompt where the link is newest, so they bind there (the native traces below).

**Controls (tests/r36-f1.test.mjs, now 19 checks, all pass):**
- your helper sequence: an unbound intent plus an empty chain at its first observation expires, and a later same-code link 1 is never bound or overridden;
- zone-choice wait, then binding at the target prompt;
- a zone choice for another card expires the intent;
- first observation behind an opponent's link 2 binds link 1;
- first observation at resolution binds, then control No -> Yes;
- negated activation (link solved) expires;
- rejected/cancelled activation (empty chain) expires;
- an opponent's same-code link 1 expires.

**Native evidence.** native/: tools/r36-f1-native.mjs secondCopy and tools/r36-b1-native-trace.mjs (5 scenarios). All six JSONs are **byte-identical to the reviewed F1 'after' records** (package 4bd3a1f).

## 2. RELAY-108 section 2: B1 worker-state integration, cap route (c75a2c1)
- New pure helper `carryRemovalIntent(plan, baseline, seat)` (midgame-rules.mjs). It keeps the SAME prompt's baseline intent only when the plan's response is exactly that intent's activation, for the same seat. Otherwise the plan is unchanged.
- worker.mjs fallback, only when an aggregated (capped) plan was chosen and the duel is Enhanced: `plan=carryRemovalIntent(plan,publicDecision,seat)`.
  - publicDecision is the local persistent pilot's base() for this prompt (same duel, seat, turn and revision).
  - pendingAttack is unchanged. Classic never carries (guarded; Classic baselines arm no intent).
- **tests/r36-b1-worker.test.mjs (8/8)** on the native Widow Anchor / Kagari / Albion position, **first=0 (turn 3) and first=1 (turn 4)**:
  - a capped plan built exactly as ai-worker builds it (buildPlan, no intent) with the SAME response:
    - WITHOUT carry: not armed, 0 follow-ups (reproduces your defect);
    - WITH carry: armed, the follow-up runs, and the follow-up count and board equal the public-fallback route;
  - a capped plan with a DIFFERENT response: no intent;
  - helper edge cases: other seat, no baseline intent, plan already carrying one;
  - worker.mjs source wiring: exactly one call; stale fallback / stale-id / stale-revision guards; observe only after an accepted response;
  - Classic: no intent at the same position.
- **Limit.** The played-plan route is reproduced in Node with the real modules and the persistent pilot. It is not a browser run with a naturally timed cap.

## 3. RELAY-109: S4 lifecycle (c75a2c1)
- `setAiMode` now also resets the complete S4 map (AI_S4: E=false in both recipes).
- ai-worker now calls `setAiMode(x.aiMode)` every think (it previously called setMidgame directly).
- tests/r36-ai-mode (11/11) adds:
  - setS4({E:true}) then setAiMode(enhanced / classic / missing) gives E=false;
  - a real ai-worker think after setS4({E:true}) runs with E off in every base(), in both modes.

## 4. RELAY-109: S2 v2 validity (7d82616)
- **Fixture.** Called a "controlled synthetic fixture" in the tool and in every record. The filler is a resource, not inert.
- **Saved with every record:**
  - exact deck/extra lists (codes and names);
  - identity: node; tool, engine, data and AI file SHA-256s;
  - seed, first, own turn, mode and S4 map.
- **Validity.**
  - Metadata: turn/phase/active at the start and end, decisions, stop reason (turn-end / finished / step-bound / no-prompt / own-turn-not-seat-0 / rejected / error / setup-failed), rejected-response count, errors and notes.
  - **INVALID** is a separate outcome. Only valid runs are judged.
- **Strict predicates.**
  - a/a2: offered + attacked + no position change + attacker stays + damage = ATK + own LP unchanged.
  - b/b2: offered + attacked + target Fleurdelis (when a target prompt occurs) + Fleurdelis in GY + attacker stays + damage = 300 + own LP unchanged.
  - e: offered + attacked + damage = DEF 2600 + attacker stays.
- `--first 0|1` (seat 0 moves second: own turn 4). `--gate` exits 1 on any FAIL/INVALID; screen mode exits 0.
- **tests/r36-s2-validity.test.mjs (10/10):**
  - your counterexamples now FAIL: b with no action and an empty field; e with no offer;
  - a correct b passes; b removed without the attack fails; b with another target fails; e with ATK damage fails;
  - injected errors / error note / rejected / step-bound / no-prompt / wrong seat / missing start / setup-failed: INVALID, not judged.
- tests/r36-s4-e (updated): also checks the --gate exit codes (E off: 1; E on: 0).

**Results (puzzles/, 52 valid runs, 0 INVALID; dev seed 7 only):**

| | f0 s0 | f1 s0 | f0 s100 | E on f0 s0 | E on f1 s0 | E on f0 s100 |
|---|---|---|---|---|---|---|
| a, a2, b, b2 (Classic and Enhanced) | PASS | PASS | PASS | PASS | PASS | e only |
| e (Classic and Enhanced) | FAIL | FAIL | FAIL | PASS | PASS | PASS |

The E-on search-100 run of e completed here in both modes (it hit your 120-second bound in RELAY-109; no timing is claimed). Opponent declines are scripted, so this is not adversarial coverage. c/d/f are not implemented (rulings pending).

## 5. RELAY-107/108: bounded pin updates (695dff5)
- **Historical pins are kept, not re-pinned.**
- **tests/lib/r36-pins.mjs `historical(file)`:**
  - asserts the file's whole candidate SHA-256 (tests/fixtures/r36-pins/CANDIDATE.json);
  - reverse-applies the reviewed unified diff tests/fixtures/r36-pins/<file>.patch (r35.12 d3177e0 -> candidate) with every context and added line checked in place, with no fuzz;
  - asserts the result equals the r35.12 bytes.
  - Covers app.mjs, worker.mjs and optimal-pilot.mjs.
  - A 1-character tamper in worker.mjs is rejected.
- **The six tests take historical() before their own historical normalisation.** All original hashes and assertions are kept:
  - r35-shuffle-app-pin, r35.12-coin-dice-sfx, r36-coin-pin (app/worker);
  - r23-fx (app + optimal-pilot in PINNED);
  - r35-cyclone-pin (optimal-pilot).
- **r30-book-trust line 27** is replaced by:
  - exact source form of the plan() rule (trustBook plus exactly one r36 guard midgameNoSearch, exactly one search call);
  - behaviour: with B off (Classic), battleNoSearch never skips search, even on a found lethal; control: with B on, it returns 'lethalNoSearch'.
- Before/after test diff: patches/0004.

## 6. Final suite and parity
- **Full suite at 695dff5: 81/81 exit 0** (suite/SUITE.txt plus 81 named logs).
  - Before: 71/78 at 707e4a6. 3 new test files since then: r36-s4-e, r36-b1-worker, r36-s2-validity.
- **Classic parity spot checks at 695dff5** (parity/):
  - Luna v Kashtira 71003/0: f51dcf3393dbbc18…, 245 decisions;
  - DTW v Mikanko 71002/1: c0fd9e1926e5e018…, 341 decisions;
  - both equal the r35.12 streams in the selector package.

## 7. Browser (RELAY-105/108 open items; tools/r36-ai-mode-browser2.mjs; desktop Chromium)
- **Learning pace** (browser/r2browser, part learning): stored modePaces.watch='learning' is read back. An Enhanced Watch duel shows "AI Enhanced (experimental)", the duel view changed in 12 of 12 samples over 2 min, and there are 0 page errors.
- **Cross-mode stale-response control** (browser/r2browser-cand-duel, Duel pace): 6 new-duel switches alternating Enhanced/Classic, **each made while "Pilot X is choosing its next play"** (an AI think in flight). The final Enhanced duel shows its mode and keeps progressing, with 0 page errors.
- **New finding (pre-existing, not the selector).** At the **Instant** pace, the same switch run logs "[presentation] scene error; continuing draw/attack TypeError: Failed to execute 'animate' on 'Element': duration must be non-negative or auto" (presentation.mjs fly()):
  - candidate: 26 errors (browser/r2browser-cand);
  - unmodified **r35.12, all Classic, no selector: 23** (browser/r2browser-r3512);
  - the scene catches it and continues.
  - Proposal: a separate small presentation item. It is not part of r36.

## Still open
- **c/d puzzles and expected-play approvals:** Alexis/Akiza.
- **E in the Enhanced recipe:** only after the rulings, plus an integrated recipe review.
- **The Instant-pace animation error:** a separate item.
- **Cache/served identity:** at publish (Kevy's call).
- **R1/X1/M3b:** as before.

## Files
patches/, ROUND2-dist.diff, native/{f1,b1}, suite/, parity/, puzzles/, browser/{r2browser, r2browser-cand-duel, r2browser-cand, r2browser-r3512}, SHA256SUMS.

Claude. Nothing published.

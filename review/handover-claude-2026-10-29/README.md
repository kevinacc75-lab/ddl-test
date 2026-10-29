STATUS: OPEN — ANSWER BY: Seto (takes full control and delegation from now)

# Claude to Seto (cc ChatGPT, Akiza, Alexis, Tea, Kevy) — Thu 29 Oct 2026 ~23:45 AEDT — FULL DEBRIEF AND HANDOVER

## 0. Why, and who is in charge
- Kevy, 23:20 tonight: Claude has used about 90% of its weekly usage. Once that runs out, Claude stops working until **Tuesday 3 Nov**. Kevy's words: "do handover and give back full control and delegation to Seto".
- Kevy goes on holiday tomorrow morning. He can still be contacted, but replies may be late or short.
- **From now, Seto owns the project.** That covers building, coordinating and verifying.
  - The no-self-approval rule still applies. When Seto builds, ChatGPT reviews, or Seto labels the work SELF-VERIFIED.
  - A new gate is still only Kevy's call.
- **Claude's hourly checks are stopped.** The scheduled check was deleted and the heartbeat says so.
  - Claude will do nothing more before Tuesday unless Kevy asks in this chat.
  - Claude's container may be reclaimed. Everything you need is in this folder and the earlier public review package, so nothing depends on Claude's machine.

## 1. Where everything is (all public, kevinacc75-lab/ddl-test)

| Thing | Where | Identity |
|---|---|---|
| Latest play-test build | /r35.11/ (ddl-test a27bcdd) | in-folder c2a9a552…5d49, served MATCH (Seto 21:20) |
| Reviewed build | /r35.6/ | unchanged |
| RC1, frozen gate, whitelist, pin 9337e197 | untouched | info-set.mjs 6efe2d4b / sha1 9337e197 in every r35.x build |
| Review package r35.7–r35.10 | review/r35.10-time-typhoon/ (12b4226, addendum 031e744) | SHA256SUMS 265 files |
| This handover | review/handover-claude-2026-10-29/ | SHA256SUMS in this folder |

- **Source of truth for the code.**
  - Start from Seto's rebuilt tree: /r35.6/ plus patches 0001–0014 (Seto's fb26f3c).
  - Add patches/0015 (f8804bd: r35.11 labels and tools/r36-h2h.mjs).
  - Add patches/0016 (69572cb: the position-test control and .pyc removal).
  - The result equals Claude's branch r36-dtw at 69572cb (head.txt, commits-r36-dtw.txt).
- dist/ is identical between f8804bd and 69572cb. So the dist/ of that tree should equal the served /r35.11/.
- In the earlier addendum folder, the file called "0015-seto-notes…" is the same patch as 0016 here.
- **Unchanged since r35.6:** optimal-pilot.mjs (ed03a478, pinned in r23-fx), duel.mjs, ai/info-set.mjs, determinize.mjs, knowledge.mjs.

## 2. Review status: everything up to r35.11 is closed
- **Seto 21:20:**
  - package VERIFIED WITH NOTES;
  - r35.10 served MATCH;
  - d645c14 coin audio VERIFIED WITH NOTES;
  - r35.11 hashes MATCH.
- **Seto 22:15:** native coin and dice check PASS.
- **ChatGPT RELAY-071:** P5, titles and coin audio PASS WITH NOTES. The notes are about scope only.
- **Seto's notes a–c** are handled (031e744, 69572cb). No build changed.
- **Not yet done, ever:**
  - a live-browser acceptance on a real device;
  - a device listening test of the coin and dice sound.

## 3. Open items, in priority order

### 3.1 Kevy, 23:18: "I didn't see any coin toss or dice animation still"
Claude checked this tonight (SELF-VERIFIED).

- **The live /r35.11/ shows the coin scene.**
  - Test setup: Playwright Chromium emulating a Galaxy Tab S4 (landscape), default settings (preset "duel", graphics "balanced", cutscenes on).
  - Duel: Watch mode, Time Typhoon vs Branded, seed 71001.
  - Result: a full "COIN TOSS · DARK TIME WIZARD" scene on turn 1. The log reads "Dark Time Wizard · Coin: Tails (called Heads · wrong call)". There were 0 page errors.
  - Screenshot: dev-data/coin/live-r35.11-galaxy-tab-coin.png. Tool: tools/r36-coin-live-tablet.mjs.
- **The scene only plays when the engine really tosses a coin or rolls dice.** That happens in three cases:
  - Dark Time Wizard's coin mode. Book rule P1 only uses it when the opponent has a face-up monster AND (Red-Eyes Black Dragon Exceed can follow OR their board is worth at least ours). Otherwise Dark Time Wizard SEARCHES, and there is no coin.
  - Reversal Box (dice, then coin).
  - Graceful & Skull Dice. The book holds it unless the opponent has a face-up monster.
- **Many duels have no coin at all.** Examples:
  - Dark Time Wizard was not drawn or searched;
  - the opponent's board was empty or face-down;
  - search mode was used.
- **Dev check, headless, seed 71001, 200 ms:** 4 tosses in 6 turns (coin, dice, Reversal Box dice + coin). The data is in dev-data/coin/. Tool: tools/r36-coin-frequency.mjs, dev seeds only.
- **Things that hide the scene by design:**
  - Settings → "skip cut-ins" on;
  - the "instant" pace;
  - cinematics off.
  - Reduced motion shows a still result instead of the animation.
- **Not yet ruled out:** an old cached build on the tablet. Kevy never told us which version label the screen showed.
- **Suggested next steps for Seto:**
  1. Ask Kevy, gently: does the top label say r35.11, and did Time Typhoon actually play Dark Time Wizard in that duel? The coin log line under the scene would show it.
  2. Optionally, run tools/r36-coin-frequency.mjs on dev seeds 71002–71020 to measure how often a toss happens per Time Typhoon duel.
  3. If tosses are rare, that is a deck and doctrine matter, not a cutscene bug. It goes to Akiza, not to code.

### 3.2 Midgame project ("play at YCS level for the whole duel"): the main open project
- **Kevy's words** (18:35, 19:09): "After turn 3 the AI plays so poorly … full board but doesn't attack … lost steam." He also said: "ask the team to analyze and watch YCS games and players. We want our AI to play on the level consistently."
- **Done so far:**
  - The Barian Defence bug is fixed (P5, deck-local, in r35.10).
  - Research note 1 is in Drive (1j0IDKvV2D8YeH6eVKRiuWXy0pOl2KhBc4DCCrJxvSkw): YCS and WCQ feature-match observations on midgame and closing.
  - ChatGPT's RELAY-069 and RELAY-070 constraints are accepted. The open-board rule must be a preference among the engine's legal attacks, not an override. The 1500/300 ms probe is dev evidence only.
  - **Seto's 20:15 measurement design** is accepted:
    - arms J (judge), P (generic position), D (doctrine) and ALL;
    - head-to-head with seats swapped;
    - proof seeds 70001–70040, dev seeds 71001–71100;
    - Stage 1: 288 duels per arm. Stage 2: 576 + 288 at 300 ms.
    - thresholds A–I.
  - Claude confirmed none of those seeds were ever used.
    - Exception: tonight's coin checks used dev seed 71001 only (dev range, no proof seed).
  - **tools/r36-h2h.mjs** is in the r36-dtw tree (patch 0015) and in tools/ here. Command:
    `node tools/r36-h2h.mjs --engine-tree T --a-tree NEW --b-tree OLD --a-label new --b-label old --a dtw --b branded --seed 71001 --first 0 --deadline-ms 1500 --out rows.jsonl`
    It writes one JSONL row per duel with your section 7 fields.
  - **Dev baseline** (906039b, the same 12 hands at 1500 ms vs 300 ms) is in dev-data/full/ (run.sh, run2.sh, metrics.py).

    | Measure | 1500 ms | 300 ms |
    |---|---|---|
    | Average turns | 4.5 | 6.0 |
    | Unfinished games | 0 | 2 |
    | Games whose winner changed | – | 5 / 12 |
    | Open-board skipped attacks | 0 | 1 |

  - Battle probes are in dev-data/battle/.
- **Not started:**
  - (1) **The pre-registration file.** It must be in Handover before the first proof duel. Seto now owns writing it.
  - (2) **Arm J**, the search-judge change. boardScore in optimal-pilot.mjs line 70 weighs the LP gap at /60 (3000 damage = +50), while one monster on the field is about 300.
    - Ideas: an LP term that grows as the opponent's LP falls; a 2-turn lethal bonus; no reward for bodies that cannot attack or protect.
    - optimal-pilot.mjs is pinned in r23-fx, so any change needs a re-pin with proof and ChatGPT review.
  - (3) **Arm P**, a generic "Attack Position when safe for ATK-gaining monsters" rule. It would cover Kerzebs the Gaoled Glutton and Gorgon of Zilofthonia, which hit the same printed-ATK rule as Barian. It changes other decks, so measure it first.
  - (4) **Arm D**, the midgame doctrine. It waits for Akiza.
- **Still waiting on others:**
  - **Akiza:** midgame doctrine per deck, Time Typhoon and Branded first. That means rebuild lines after a broken board, which resources to keep, how the deck closes games, and what to do under a lock.
  - **Alexis:** rulings on the Barian add-lock vs Branded, which stalled Branded for several turns.
  - **Kevy's pace-vs-strength choice**, still unanswered. The question: should the AI always play at full strength (a minimum search effort per move, capped at about 6–8 s on a slow tablet; Instant stays fast), or keep the current time-based pace? The browser think deadline is time-based (worker.mjs thinkDeadline: Instant 400 ms, normal 1500 ms after the presentation, study ≥ 4000 ms), so a slow tablet thinks less. The dev baseline above suggests this costs real strength. Kevy liked the idea at 19:09 but did not choose. If he stays silent, Seto decides whether to keep it a preview-only option.

### 3.3 Smaller items not done
- **Fresh-hand book measurement** on seeds 301–320, never run.
- **Xyz material log wording.** The event log says "Monster zone → Extra Deck" for Xyz materials, because the duel.mjs LOC map is wrong for material moves. Fixing it needs Alexis plus identity proof.
- **Missing effect titles.** 23 Time Typhoon cards have no effect title. This is a disclosed gap. Also, Scapegoat Token's empty map is not kept (a documentation nit).
- **Offline assets.** The offline-assets list is missing mikanko-plan, kitt-revive, turn-ledger and public-identity. This is pre-existing.
- **Identity check.** The blueeyes/kashtira seed 402 first 1 pair timed out at 3000 s on both builds, so it is inconclusive. The other 15/16 pairs are byte-identical.
- **Seto's own lane:** the S2a run 3 status is yours. Fixed-build S2a FAIL is final, and S2b PASS.

## 4. Standing rules (unchanged, now Seto's to keep)
- **TEST site only, with a new folder per build.** RC1 is never touched. Never loosen the frozen gate (ai-gate 1c380d58, whitelist 9f1fb5f5, pin sha1 9337e197).
- **Every published build gets two hash checks:** in-folder (`cd dist && find . -type f | sort | xargs sha256sum | sha256sum`) and served bytes.
  - Label builds as PREVIEW, self-verified, "not a gate candidate".
  - Kevy's standing OK covers publishing play-test sites.
- **AI changes are kept only if they measure better.** Use paired seeds and pre-register before proof duels.
- **Changes needing extra sign-off:**
  - pinned files (r23-fx: app.mjs, optimal-pilot.mjs and others) need a re-pin with proof;
  - duel.mjs changes need Alexis first and identity proof;
  - card or rules text goes through Alexis and Tea.
- **Communication:**
  - No external messages unless asked. Nothing private goes in Drive.
  - Kevy likes plain, friendly words, verification before implementation, and corrections written down.

## 5. Practical notes from Claude's side
- **Node:** suites ran on Node v22.22.2, one test at a time: `for t in tests/*.test.mjs; do timeout 1500 nice -n 19 node $t; done`. The full suite at d645c14 was 66/66.
- **Coin and dice design:**
  - CoinTap (dist/coin-tap.mjs) is an instance interposition on the worker duel, like ShuffleTap.
  - The result always comes from the engine. The call is read from the accepted response, and the card is the resolving chain link.
  - The scene is CoinScene in #summon-scene, so Skip works.
  - Timings (COIN_MS): learning 4800 ms, duel 3400, broadcast 2300, instant 0.
- **Drive:** create_file needs base64 content. The heartbeat is Drive 181SnVUvwzxf1HjAWZ2Qurt-LZIClSnVA, where the title is the report. Claude's heartbeat stops here.

Thank you, Seto, and the whole team. Claude is back on Tuesday and will read Handover first.

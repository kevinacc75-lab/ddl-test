STATUS: OPEN - for ChatGPT's independent review
ANSWER BY: ChatGPT (accept / reject the selector; rule on the 6 stale pins)

# r36 AI selector: Classic (default) / Enhanced (experimental) - Claude (builder while Seto is out) - Thu 5 Nov 2026 WITA

SELF-VERIFIED by the builder only. Not accepted until ChatGPT reviews it. Nothing is published. RC1, the gate (ai-gate.mjs 1c380d58), the whitelist (9f1fb5f5) and the pin (9337e197) are untouched. No cache or label bump has been made; those wait until publish (Kevy's call, after review).

Kevy, 4 Nov 11:09 WITA: an experimental Enhanced AI preview when it is ready, with the old AI kept as Classic.

## Identities
| | value |
|---|---|
| base | r36 F1 fix **73e2d07** (package ddl-test 4bd3a1f, still under review) + r35.12 **b065754 / eb7985c** (= cc84a5f / d3177e0, cherry-picked) |
| selector commits | **707e4a6** (selector) + **8b7f477** (comment moved off a worker.mjs import line; see Suite) + **bf5fa1f** (one test tool, no dist change) |
| dist in-folder hash at 8b7f477 / bf5fa1f | **6cb4327484177713c71c016888c25f203248f7300b134aaf0321e8968cee6546** (497 files) |
| dist vs r35.12 d3177e0 | differs only in the AI files from r36 + F1, plus the selector files below |
| runtime | Node v22.22.2; Chromium via the pre-installed Playwright; Claude's container |

Hash method: `cd dist && find . -type f | LC_ALL=C sort | xargs -d '\n' sha256sum | sha256sum`.

Selector file sha256 (r35.12 d3177e0 -> 8b7f477; midgame-flags.mjs compared with 73e2d07):
- dist/ai/midgame-flags.mjs -> e64f795f369acd92587bfdac1f0bd310ec1d30462c6a9eabce527e5b688a22aa
- dist/ai/ai-worker.mjs 1b04ca63… -> 3cae7db887e95e4400149e4ca5e95db5be98be375aef0fb7afd2b865c1174cbc
- dist/worker.mjs 12f0070b… -> 1283810a0e4372a4a50ca927e2a86d1ccfdd2cd4a1e0f36ce68338c4b9c07481
- dist/app.mjs 831386c3… -> 7ca5580569ae899037848be0e2a24ae0d39d96ed7b951870e18b6e1af6362335
- dist/index.html c003edec… -> d0e7d168c65af3230cf53ff5213d7d7359254dd39201dfa4708dd2218b70b896
- dist/sw.js unchanged (d1913119…; cache name still 2026-11-03-r35.12)

## What it does
- **Recipe** (dist/ai/midgame-flags.mjs, `AI_MODES`):
  - classic = {A:false, B:false, C:false, T:false, Z:false};
  - enhanced = {A:true, B:true, C:false, T:false, Z:false}, that is Arm A (after-battle judge) and Arm B (battle rules + removal follow-up B1 with the F1 fix).
  - Any other value means classic (`aiModeOf`).
- **UI:** a "Computer AI" select after the Doctrine toggle (Classic selected; "Enhanced (experimental)"), with the help text "Classic is the current AI. Enhanced adds new mid-game rules from turn 3; it is an experimental preview, not yet reviewed for strength. A change applies to the next new duel." The banner shows "AI Classic" or "AI Enhanced (experimental)".
- **Nothing is stored:** a reload always starts in Classic.
- **Per duel:**
  - worker.mjs sets the mode once at duel start (before the pilots are created).
  - An imported replay always runs in Classic.
  - Every think message carries the mode and its flag map. ai-worker.mjs sets the flags at the start of every think, before it creates its fresh pilot. So no state crosses between duels or modes.
- **Finding B fix (Enhanced only):** worker.mjs passes its observed local pilot's `pendingRemoval` in the think message, and ai-worker puts it on the fresh pilot. Without this, the played browser move never gets B1's follow-up. In Classic, nothing is passed and nothing is read. r35's `pendingAttack` gap is left as it is (Classic behaviour).

## RELAY-105 readiness table: where this package stands
| condition | status | evidence |
|---|---|---|
| one exact Enhanced recipe with its flag map | **met** | AI_MODES above; tests/r36-ai-mode.test.mjs |
| Classic parity pinned to r35.12, with controlled fixtures | **met (5 duels + file-level)** | parity/, and test "each changed file minus the selector lines = r35.12 bytes" |
| cold load = Classic | **met** | browser (3 devices) + test |
| a change applies only to a new duel | **met** | browser: switching mid-duel keeps "AI Classic"; the next duel shows Enhanced |
| caches recreated | **met as built:** flags are set per duel start and per think; ai-worker builds a fresh pilot each think | test: mode is per think (Classic after Enhanced reads nothing) |
| stale async responses discarded | **unchanged r35 mechanism** (id / revision / duel.revision); not separately tested across a mode switch | - |
| S2 evidence with Alexis-confirmed expected plays | **NOT met** - next item | - |
| named suite logs | **met** | suite/ |
| browser: Watch, Play, reset cycle, tablet portrait + landscape | **met** | browser/three-devices |
| browser: Learning mode | **NOT covered yet** | - |
| cache and service-worker identity | **open:** deliberately not bumped until publish | sw.js unchanged |
| Learning text never narrates estimates as guaranteed | r36 reasons say "projected lethal"; r35's "Pursue projected lethal" is pre-existing | - |

So this package asks only for review of the selector and Classic parity. It is not a publish request: S2 and Learning coverage come first.

## Evidence
### 1. Classic = r35.12, move for move (tools/r36-classic-parity.mjs)
The same duel was run on the r35.12 tree (d3177e0; flags absent) and on the candidate in Classic mode.
- The search used a node budget with no clock, so runs are repeatable.
- The streamSha256 covers every decision in order.

| duel (decks, seed, first, search nodes, turn cap) | decisions | turns | winner | r35.12 | candidate Classic | same |
|---|---:|---:|---|---|---|---|
| Blue-Eyes v Branded 71004 / 1, s0, t6 | 371 | 5 | 1 | 543be945c6b656b1… | 543be945c6b656b1… | yes |
| Branded v Sky 71001 / 0, s0, t6 | 498 | 7 | cap | 28d3212fecaadb50… | 28d3212fecaadb50… | yes |
| Branded v Sky 71005 / 0, **s100**, t4 | 343 | 5 | cap | 1a10c7d4a9983866… | 1a10c7d4a9983866… | yes |
| DTW v Mikanko 71002 / 1, s0, t6 | 341 | 3 | 1 | c0fd9e1926e5e018… | c0fd9e1926e5e018… | yes |
| Luna v Kashtira 71003 / 0, s0, t6 | 245 | 3 | 0 | f51dcf3393dbbc18… | f51dcf3393dbbc18… | yes |

- The candidate side ran at 707e4a6. 8b7f477 only moves a comment in worker.mjs.
- **Not run to the end:** a sixth duel (Sky v Kashtira 71006 / 1, s100, t4) was stopped twice by the 2-hour background limit. It is not counted, and not restarted.
- Full JSON is in parity/. Dev seeds 71001-71005 only.

### 2. tests/r36-ai-mode.test.mjs (10/10 at 8b7f477)
- Recipes.
- The real ai-worker in Node (fetch stubbed, OptimalPilot.prototype.base spied):
  - Classic ignores pendingRemoval, with all flags off;
  - Enhanced runs A+B and carries pendingRemoval;
  - the mode is per think;
  - the Classic decision equals an in-process Classic baseline, and an Enhanced control arms removalIntent.
- Each changed file minus the selector lines equals the r35.12 bytes.
- Cold load is Classic and nothing is stored.

### 3. Browser (Playwright, Chromium, local server)
**three-devices/** (desktop 1366x900, Galaxy Tab S4 portrait and landscape), at 707e4a6:
- cold Classic, and the select is visible;
- the banner says "AI Classic";
- a mid-duel switch keeps Classic;
- the new duel says "AI Enhanced (experimental)" and reached turn 3;
- a reload returns to Classic;
- Play mode in Enhanced starts;
- page errors: [] on all three.

**Long Enhanced Watch duels** (tools/r36-enhanced-long-browser.mjs, desktop) at 8b7f477. Each ran to the end of the duel with **0 page errors**:
- long-71007 Branded v Sky: Branded won on turn 2 (392 s).
- long-71008 Sky v Kashtira: Sky won on turn 3 (482 s).
- long-71009 Kashtira v Branded: **reached turn 6** (631 s; the run stops at turn 6 by design), duel still in progress.
- Two of the three seeds ended early, as the 4 Nov traces predicted for blowout matchups. Browser evidence shows the Enhanced plumbing holds through turn 6. It says nothing about playing strength; that is S2's job.

### 4. Suite
**Full suite at 707e4a6 (78 files):** suite/SUITE.txt gives the exit code and time per file. 71 pass, 7 fail:
- **3 pre-existing since the r36 patches** (stale optimal-pilot.mjs source pins; same as the F1 package): r23-fx, r35-cyclone-pin, r30-book-trust line 27.
- **3 new, all source pins of files the selector must change:** r35-shuffle-app-pin, r35.12-coin-dice-sfx, r36-coin-pin.
  - They pin app.mjs and worker.mjs bytes.
  - **Check:** with app.mjs, worker.mjs, ai/ai-worker.mjs and index.html put back to r35.12, all three pass (suite/at-8b7f477/APP-PIN-SWAP.txt).
  - So the only cause is the selector lines, which r36-ai-mode checks one by one.
- **1 real issue, fixed in 8b7f477:** r32-review-fixes loads worker.mjs in a VM and strips lines matching `^import .*;$`. The selector's import line had a trailing comment, so it was not stripped. The comment now sits on the next line. r32-review-fixes passes, and so does r36-ai-mode (10/10) (suite/at-8b7f477/RERUN.txt).

Claude did NOT re-pin any test. **Question for ChatGPT:** may the 6 stale pins be re-pinned to "file minus r36/selector lines = pinned bytes", in a separate reviewed commit?

## Files
- patches/: 0001-0005 git format-patch, 73e2d07..bf5fa1f;
- SELECTOR-dist.diff;
- parity/;
- browser/ (three-devices, long-*);
- suite/ (SUITE.txt + 78 logs at 707e4a6; at-8b7f477/);
- SHA256SUMS.

## Next from Claude (builder)
S2 midgame puzzle suite: fixed engine-native positions with expected plays. Alexis confirms each expected play, then ChatGPT reviews.

Claude. Nothing published.

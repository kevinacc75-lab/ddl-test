# r35 item 8: deck-shuffle overlay + riffle (TEST branch; shipped in TEST build r35.4)

**Branch** `r35-shuffle` (r18), head `a6557cd` (code head `f4cc335`; `a6557cd` only adds probe progress output), based on r35.3 candidate `628d40f`.

**Design:** RELAY-046 (ChatGPT) Tap B, approved with conditions by Seto (27 Oct 10:10), built to shuffle spec v2 (Seto 26 Oct 09:05).

**Status:** SELF-VERIFIED (Claude, builder = verifier), NOT independent. For ChatGPT review. It is published only as part of the play-test build `/r35.4/` (Kevy's OK 28 Oct 13:10; Seto: no objection, with conditions). r35.2 and RC1 are untouched.

## Files
- `shuffle.diff` / `diffstat.txt` / `commits.txt`: 628d40f..r35-shuffle.
- `identities.txt`: sha256 of the touched and key files on the branch. `duel.mjs` and `ai/knowledge.mjs` are unchanged from 628d40f.
- `test-results-branch.txt`: the five relevant tests on the branch head: r35-shuffle-tap, r35-shuffle-native, r35-shuffle-overlay, r35-shuffle-app-pin, r23-fx.
- `test-results-r35.4-first-run.txt`: the first full-suite run on the r35.4 merge (48 pass, 1 fail). The failure was `r23-fx`, the app.mjs pin; it was fixed by the re-pin with proof below. The suite was then 50/50.
- `paired-results.jsonl`: the tap-off / tap-on runs.
- `frames-full-and-reduced.png`: headless Chromium frames at 40 / 80 / 200 / 300 / 360 ms. Top row: full motion. Bottom row: reduced motion (gleam only).

## What changed
| File | Change |
|---|---|
| `dist/shuffle-tap.mjs` (new) | Instance-method interposition on the ONE real duel. Details below. |
| `dist/worker.mjs` (12 lines) | Install, arm/disarm, envelope on every state. No scheduling, deadline, presentation, duelSerial, pool or AI change. |
| `dist/shuffle-overlay.mjs` (new) | The decorative overlay. Details below. |
| `dist/sound-engine.mjs` | `noise()` now returns its source (existing callers ignore it). `shuffleRiffle()` is an owned riffle. |
| `dist/app.mjs` (6 insertions; pinned file) | Create the overlay; hook it into the existing lifecycle points. Details below. |
| `dist/offline-assets.json` | The two new modules. |
| tests / tools | New tests; `tools/s3-harness.mjs` (copy + `beforeStart` hook); `tools/r35-shuffle-paired.mjs`. |

**`dist/shuffle-tap.mjs`**
- Calls the original `handleMessage` first, with the same receiver and message. Returns its result and lets its errors propagate.
- Only after that, and only while armed, it captures `{id, seat, afterEventId}` for `M.SHUFFLE_DECK`. It never captures SHUFFLE_HAND or the raw message.
- Fails open.
- Holds at most 32 pending captures per send; extras are counted as dropped.
- Drains once per send.
- `reset()` starts a new overlay epoch.

**`dist/worker.mjs`**
- Installs the tap after `Duel.create`, before the first start.
- `reset()` before start, start-with-responses, rewind and import; `arm()` only after the reconstruction returns.
- `disarm()` on stop and on both error paths.
- Every `state` message carries `shuffle: tap.drain()`.
- A rejected human reply's re-sent state carries `shuffles: []`.

**`dist/shuffle-overlay.mjs`**
- Timing: 400 ms in total, split at 80 ms, riffle at the split (ends about 280 ms), gleam before 400 ms.
- Sprites: 6 card backs plus a gleam (8 or fewer). Transforms and opacity only (Web Animations). `pointer-events: none`. No imports. It never messages the worker, the presentation queue or the holds.
- Queue: 1 active + 4 waiting, drop the oldest waiting, 800 ms expiry. Deduplicated per epoch by an id high-water mark.
- Instant mode, feature off, or a hidden tab: nothing plays and nothing catches up later.
- Reduced motion (app or OS): gleam only.
- A view change cancels the playing effect.
- The anchor is `[data-deck-pile="<seat>"]`, found at play time.

**`shuffleRiffle()` in `dist/sound-engine.mjs`**
- Same generated noise and SFX bus as `riffle()`.
- Plays only if audio is already running.
- Returns a cancel handle that stops only its own sources.

**`dist/app.mjs`**
- Accepts the envelope after the existing session checks.
- `reset()` on new duel, stop, rewind request, `rewound` and worker error.
- `cancel()` on an error message and on a hidden tab.

**Pin proof.** `tests/r35-shuffle-app-pin.test.mjs` removes exactly those lines and gets the r32.1 pinned app.mjs back byte for byte (c7ff1ee0…). `tests/r23-fx.test.mjs` is re-pinned to the new hash, with a comment.

**Disclosed:** the service-worker cache name is bumped only in the r35.4 build commit (`2026-10-28-r35.4`), not on this branch.

**Untouched:** duel.mjs, ai/*, random.mjs, the frozen ai-gate.mjs, whitelist, thresholds, decks, scripts.

## Evidence
1. **Unit (`r35-shuffle-tap`).** Each check below is a test case:
   - receiver, message, result and error preservation;
   - prototype untouched;
   - disarmed captures nothing;
   - SHUFFLE_HAND and MOVE ignored;
   - `fromEngine` mapping with first = 1;
   - order and distinct ids;
   - the 32-cap with a dropped count;
   - reset epoch and disarm;
   - one duel only, and a clone receiver is not captured;
   - fail-open;
   - envelope keys.
2. **Native (`r35-shuffle-native`, real engine, both turn orders).** The real tap and an independent raw recorder wrap the same duel.
   - Start-up sends a SHUFFLE_HAND; nothing is captured.
   - Aluber's search sends SHUFFLE_HAND then SHUFFLE_DECK for seat 0. Exactly one entry is captured: seat 0 both ways, with the same afterEventId as the raw message, after the Deck-to-hand move event.
   - The opponent's draw captures nothing.
   - Replaying the same responses into a fresh duel while disarmed captures nothing, although the raw recorder sees the shuffle.
3. **Overlay and sound (`r35-shuffle-overlay`; fake DOM, clock and AudioContext).** Each check below is a test case:
   - layer, pile, sprite cap, transforms and opacity only, riffle at 80 ms, cleanup at 400 ms;
   - dedupe and epochs;
   - an epoch change cancels the effect and its riffle;
   - overload (drop oldest; expiry);
   - Instant, hidden tab and no catch-up;
   - reduced motion;
   - view change;
   - reset;
   - missing pile and garbage input;
   - no imports and no worker/presentation hooks (code only);
   - the owned riffle cancels only its own sources and is silent when muted, suspended or not unlocked.
4. **Mutation checks: 14 of 14 caught**, each by its intended assertion.
   - Tap: capture before the original, hand shuffles included, any receiver, unbounded, drain keeps, reset keeps armed.
   - Overlay: no dedupe, no expiry, plays when hidden, ignores reduced motion, riffle not cancelled, view no-op, unbounded queue, epoch change without cancel.
5. **Browser.**
   - Headless Chromium frames (`frames-full-and-reduced.png`). The first version clipped the split through `contain: paint`; that is fixed, and the split is wider.
   - r35.4 smoke run: 3 min AI vs AI, Branded v Blue-Eyes. 0 page errors, 0 console errors, 6 shuffles, each on the right pile.
6. **Paired tap-off / tap-on (`paired-results.jsonl`).**
   - Setup: base = the 628d40f worker.mjs (sha256 a7cdee3e…, the RELAY-046 identity); candidate = the branch worker.mjs (e56d1411…). Node v22.22.0, the worker run in-process as the browser would message it. CPU v CPU, Branded v Blue-Eyes, Instant (budget 40). Seeds 2026, 12345, 808, 777, 4242, 555, 31337, 99, both first seats. Each run capped at 200 states.
   - **16 of 16 pairs are byte-identical:** response bytes sha256, duel-log text sha256, LP, turn and errors.
   - The candidate captured 4–11 shuffles per run.
   - 13 pairs ran to the cap or to the end of the duel. In 3 pairs (777/1, 4242/0, 31337/0) BOTH sides stopped at the same decision with the same pre-existing AI error (next section). They are byte-identical up to it.
   - **Scope:** Node has no Worker, so worker.mjs uses its synchronous AI path: no AI worker, no live deadlines or caps. This shows the data path changes nothing. It is NOT the live browser comparison of capMs, deadlineAt, cap hits and fallbacks (Seto's proof scope), which needs a quiet machine and is pending. A full-length duel took over 40 minutes per side on this loaded box, hence the 200-state cap.

## Finding outside this change (not fixed; ai/* is not touched here)
`dist/ai/info-set.mjs` line 36: `stats[a].rejected++` throws `Cannot read properties of undefined (reading 'rejected')` when `searchInfoSet` is called with an EMPTY `options` list.
- On the replay (non-snapshot) path, line 50 calls `evaluateAction(particle, 0)`, `stats[0]` is undefined, and the exception is thrown from inside the catch.
- Stack: `evaluateAction` ← `searchInfoSet:50` ← `OptimalPilot.search` (optimal-pilot.mjs:153) ← `OptimalPilot.plan` (110) ← worker `planned()` (synchronous path).
- The same thing happens on the base 628d40f worker.
- It is seen only where search runs without a snapshot search core (here: the worker's no-Worker fallback in Node). The browser AI worker and the gate use the snapshot/pool path. It needs a separate ai/* fix through the usual process (guard against empty options, or no search when nothing is offered), and is reported to Seto.

## Pending
- ChatGPT review.
- The live browser paired comparison on a quiet machine.
- Full-length (uncapped) pairs.
- Kevy's tablet acceptance: versions, reduced motion, both deck zones, chain overlaps, responsiveness.

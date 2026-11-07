# r36.1 candidate: two pre-existing glitch fixes on top of the published r36 (Claude as builder; SELF-VERIFIED; NOT published)

These are the two separate items RELAY-120 asked to track. **No AI module changed**: Enhanced and Classic play exactly as in
r36 (ee71fba2).

- **Source:** r36-mid 9372caf (part 1) and 6378a87 (part 2).
- **Candidate dist:** 498 files (same paths as /r36/), in-folder hash **`5c645d33b39b757e040da60e8f1e925d0e22e7b37385ac91b104790aa276273a`**.
- **Versus the served r36:** exactly 4 files, 7 lines (`dist-since-r36.diff`). You can rebuild the candidate from the public /r36/ plus that diff;
  per-file hashes are in `SHA256SUMS-dist.txt`.

## 1. Instant-pace `animate()` error (presentation.mjs, 1 line)

- **Cause:** `fly()` passes `duration*timingScale` to `Element.animate`. Its callers for `draw` and `attack` pass
  `Math.min(400,duration-20)` and `duration-i*35-20`. At Instant pace `duration` is small, so these go negative. The browser
  then throws "duration must be non-negative or auto", and the rest of that event's scene is skipped. The same happens on
  r35.12, PREVIEW 3 and r36.
- **Fix:** `duration:Math.max(0,duration)*timingScale`. At every other pace the value was already positive, so nothing changes there.
- **Evidence:** the Instant finish runs on seeds 71025 and 71021 had **10 errors on r36** (and the same on PREVIEW 3). On r36.1 they have **0 errors**,
  the dock reads RESOLVED, and the chain is empty (`browser/report.json`, finish).
- presentation.mjs stays under the bounded pin method. The patch and CANDIDATE are regenerated, and the r35.12 baseline `a6088b5a…` is unchanged.

## 2. "Cannot destructure 'object null'" after Instant duel → New → Open saved replay (worker.mjs, 1 line)

- **Cause:** the stack came from a debug copy of the worker that posted `e.stack`:

  ```
  onmessage('cinematics') → schedule() → planned() → safeView → Duel.snapshot → core.duelQueryCount
  ```

  'stop' (New) destroys the engine duel (`handle=null`) but keeps the `duel` object. A settings ('cinematics') message
  then planned on the dead duel. The worker posted an error, set `disabled`, and the app showed "DUEL ENGINE · ATTENTION". This also happens in **r35.12**.
- **Fix:** `schedule()` returns early when `!duel?.handle`. A live duel always has a handle.
- **Evidence:**
  - The browser probe (`node <r36 package>/browser/imp.cjs <url> replay.json afterDuel instant`), run twice on r36.1, shows only
    "Saved responses restored (AI Enhanced)…" and no ATTENTION notice. The same probe on r36 and r35.12 shows the notice.
  - The full browser replay part (`browser/report.json`, replay) shows explicit Enhanced, legacy Classic and unknown refused, with `errors: []`. Its raw
    pass flag is false only because of the tool heuristic `bogusStartedDuel`: the old field stays drawn behind the refusal, as
    disclosed in the r36 package.
  - New `tests/r36-stopped-duel.test.mjs` runs the worker in a VM, as r32 does. It has 2 checks: a stopped duel plans nothing and posts no
    error, and a live duel still plans. **Control on the published r36 worker: check 1 FAILS.** On r36.1: 2/2.
- `tests/r32-review-fixes.test.mjs`: its fake duel now carries `handle:1`, like every real running duel. Without that it
  modelled a duel with no engine and fell into the new guard. The change is documented in the test.

## 3. Labels

| What | Value |
|---|---|
| Title | `TEST PHASE C r36.1` |
| Badge | `TEST PHASE C r36.1 · Enhanced AI default` |
| sw.js cache | `2026-11-07-r36.1` |
| Replay build string | `ddl-test r36.1 2026-11-07-r36.1`, which maps to `5c645d33…` |

The tests that pin these are updated: r36-ai-mode (selector hunks and index pin), r36-replay-mode (BUILD) and
tools/r36-default-browser (BUILD).

## Checks

- **Full suite at 6378a87:** **85/85 exit 0** (84 plus the new stopped-duel test), Node v22.22.2 (`suite/SUITE.txt`).
- **Browser** (`browser/report.json`, local server):
  - cold load on desktop and tablet: Enhanced selected, badge r36.1, 0 errors;
  - Classic: 0 errors;
  - replay as above;
  - finish (Instant): 0 errors, dock RESOLVED.
- The S2 grid and Classic parity were not re-run because no AI module changed. They are identical to r36 by bytes:
  `diff -rq` against /r36/ lists only the 4 files above.

## Proposed (needs ChatGPT review + Kevy's OK)

Publish to a new folder /r36.1/ and keep /r36/. Then run the served-byte check (`5c645d33…`) and the live checks.

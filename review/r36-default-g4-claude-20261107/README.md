# r36 default build (Enhanced = default AI): G4 package for ChatGPT's G5 review

Claude built this as builder. Everything here is SELF-VERIFIED until ChatGPT accepts it. Nothing is published.

- **Kevy's instruction (7 Nov 01:21 AEDT):** "finish the AI and … make it the default".
- **Gate:** ChatGPT RELAY-119.
  - G1-S passed: ddl-test `r36-h2h-g1-claude-20261107/`.
  - G1-C passed: ddl-test `r36-h2h-g1c-claude-20261107/`. The ledger was hashed in b54c4a4 before any summary.
- **Source:** r36-mid branch r36-enh-claude.
  - d7d2698: the build change.
  - 73f290c: the browser tool (tools only).
- **Candidate dist:** 498 files, in-folder hash **`ee71fba2c9af1fdb24b531d432b8a271cf4b0ac36f67cde0a55dc0d4232d03f7`**,
  computed as `cd dist && find . -type f | LC_ALL=C sort | xargs -d '\n' sha256sum | sha256sum`. Per-file hashes are in `SHA256SUMS-dist.txt`.

## What changed since the served PREVIEW 3 (6656dd35…)

`dist-since-PREVIEW3.diff`: exactly 5 files, 17 lines added and 15 removed. **No AI module changed.** The AI that played G1-S and G1-C
(ai/*, optimal-pilot.mjs, tactics.mjs, and the rest) is byte-identical here.

| File | Change |
|---|---|
| index.html | The selector reads `Enhanced` (selected) / `Classic (r35.12 AI)`. "experimental" is gone. The title is `TEST PHASE C r36` and the badge `TEST PHASE C r36 · Enhanced AI default`. The help text uses RELAY-119's wording ("the Classic AI plus additional mid-game rules from turn 3"), calls the test games a screen and not a proof of strength, and says replays without an AI tag replay with Classic. |
| app.mjs | A new duel uses the dropdown, which defaults to Enhanced; Classic is used only when it is chosen. "Open saved replay" uses the **file's** mode: an explicit `enhanced`/`classic` is honoured, a missing value means Classic, and any other value is refused with "This replay names an unknown AI mode." The banner no longer says "(experimental)". The notice names the replayed AI. |
| worker.mjs | The export carries `aiMode` and `build: 'ddl-test r36 2026-11-07-r36'`. A file cannot contain its own tree hash, so the build string is this publish's sw.js cache name, and this README maps it to `ee71fba2…`. The import-replay route honours an explicit mode, treats a missing mode as Classic, and refuses unknown values. |
| sw.js | Cache `2026-11-07-r36`, plus a header line. |
| presentation.mjs | In the existing `win` branch, which already clears the chain list and strip, a dock still reading `RESOLVING` becomes `RESOLVED`. This is the only change, and it runs only when the duel has been won, so no chain is live. presentation.mjs is now under the bounded pin method: its r35.12 hash `a6088b5a…` is in `tests/lib/r36-pins.mjs`, and `presentation.mjs.patch` and the CANDIDATE hash are included. |

The active-AI arena tag is unchanged from 186ad50. It shows `x.match.aiMode`, the mode the worker reports for the running
duel, never the dropdown.

## RELAY-119 G4 checklist

| Requirement | Evidence | Result |
|---|---|---|
| Cold load selects and actually runs Enhanced | `browser/candidate/cold-classic-report.json` (desktop and Galaxy Tab S4 portrait, default pace): the selector is `enhanced`, the options are `["Enhanced","Classic (r35.12 AI)"]`, and the page has no "experimental". A duel started without touching the selector shows banner `AI Enhanced` and tag `… AI ENHANCED`, progresses, and has 0 page errors. `tests/r36-replay-mode.test.mjs` 1–2: the real worker's live module state is the Enhanced recipe (A-Z and the full S4 map) | PASS |
| Classic one click away and runs the full Classic recipe | Same report, `classic`: New → Classic → banner `AI Classic`, tag `AI CLASSIC`, 0 errors. Replay test 2: Classic recipe after an Enhanced duel. Classic parity 71003: stream `f51dcf33…`, 245 decisions = r35.12 | PASS |
| Arena label reflects the worker-acknowledged mode | Unchanged 186ad50 code (`aiTag(x.match.aiMode)`); r36-ai-mode source hunks | PASS |
| Replay export has aiMode plus an exact build identity; import honours an explicit aiMode | Browser: the downloaded file has `aiMode:"enhanced"`, `build:"ddl-test r36 2026-11-07-r36"` and 393 responses. Opened with the dropdown on **Classic**, it replays **Enhanced** and the notice says "(AI Enhanced)". Replay test 3 and 5 on the real worker | PASS |
| **Legacy replay without aiMode stays Classic** | Browser: the same file without aiMode/build, opened with the dropdown on **Enhanced**, replays **Classic**. Replay test 4 (right after an Enhanced import). **Control: PREVIEW 3 replays that legacy file as "AI Enhanced (experimental)"**, which is the defect RELAY-119 anticipated, now fixed (`browser/control-preview3/replay-report.json`) | PASS |
| Unknown mode is not silently replayed | Browser: `aiMode:"bogus"` is refused with "This replay names an unknown AI mode.". Replay test 6 (`ENHANCED`, `bogus`, `''`, `null`, `1`) | PASS (see note 2) |
| Mode reset on start, import and every think; E→C and C→E | Replay tests 2, 3, 4, 5, 7 (real worker module state); r36-ai-mode S4 lifecycle (real ai-worker per think) | PASS |
| Finished-duel `RESOLVING` dock clears without hiding a live chain | `browser/candidate/finish-report.json` (Instant, duels played to the end, seeds 71025 and 71021): the dock reads `RESOLVED`, the chain list is empty, the strip is hidden. **Control: PREVIEW 3 on the same seeds ends with the dock reading `RESOLVING`**. The change sits only in the win branch | PASS (see note 1) |
| Help text factual | index.html above | PASS |
| Full suite | `suite/SUITE.txt`: **84/84 exit 0** at d7d2698 (Node v22.22.2) | PASS |
| S2 grid, both mappings | `puzzles/`: 40 runs, 0 INVALID, matrix = requested, PASS 34 / FAIL 6. The fails are the known Classic e/e3/f. Verdicts identical to the accepted PREVIEW 3 (F) package | PASS (unchanged) |

## Notes and limits (honest)

1. **The Instant-pace `animate()` error is pre-existing**, the separate item logged on 5 Nov. Every Instant browser run
   has `[presentation] scene error; continuing … animate … duration must be non-negative`. PREVIEW 3 shows the same errors
   on the same runs (control reports). That is why the raw `pass` flags of the Instant parts read false. The finish runs'
   `errors` lists contain only those lines. The default-pace runs (cold, classic) have 0 errors.
2. **A pre-existing notice after Instant duel → New → Open saved replay:** "Cannot destructure 'object null' as it is
   null". It appears in **r35.12** (`browser/control-r35.12` probe below), in PREVIEW 3 and in this build. The replay still
   restores correctly to the saved position with the right AI. It does not appear on a cold page, or at the default pace
   after a duel (`browser/imp.cjs`, four scenarios). It is likely a stale message from the abandoned Instant duel. It is not
   caused by this change, and I propose it as a separate item.
   Probe: `node browser/imp.cjs <url> replay.json afterDuel instant`. Results:
   - r35.12: notice shown;
   - candidate: notice shown;
   - candidate cold, or default pace: not shown.
3. `first-run-report.json` is the first browser run. Cold and Classic were marked false there only because it asked for
   turn 4 within 6 minutes at the default (Learning) pace. The duels were at turns 3 and 2 and still progressing, with 0
   errors. The rerun used turn ≥ 2. The replay part's `bogusStartedDuel` flag in that run is a tool heuristic: the previous
   duel's field stays drawn behind the refusal. The refusal notice itself is the evidence.
4. The build string is a name, not a hash. This README pins it to `ee71fba2…`. After publication I will add the served-byte
   check.

## Unchanged

RC1, the frozen gate ai-gate.mjs 1c380d58, whitelist 9f1fb5f5, pin 9337e197, the Classic AI (r35.12), and the AI modules
that played the gate. /r36-preview/ stays as PREVIEW 3 until a publish decision.

## Proposed publish (after ChatGPT accepts)

Publish to a new ddl-test folder **/r36/** with these exact 498 files. Keep /r36-preview/ and /r35.12/. Add an index entry.
Then:
- run the served-byte check (expected `ee71fba2…`);
- run live cold-load checks in both modes;
- send Kevy the link.

# Info-set guard: no crash when the replay-path search has no candidate moves (TEST branch, not merged)

**Branch** `r35-infoset-guard-v2` (r18), head `1f29378`, on top of `41f3efe` (the verified job 29 fix; r35.5 `83c5f04` + fix).
- `2464bf3`: the guard. It is the original `1582a19` cherry-picked unchanged from the old r35.3 base.
- `1f29378`: test only. It adds the real crash case.

**Status:** SELF-VERIFIED (Claude, builder = verifier), NOT independent. An `ai/*` change, so it needs ChatGPT's review and Seto's verification. It is NOT in r35.6, and nothing is merged or published.

## The bug
- **Where:** `searchInfoSet` in `dist/ai/info-set.mjs`, on the REPLAY path (no snapshot search core).
- **Trigger:** every candidate option has already been filtered out, so `options` is empty.
- **What happens:**
  1. The first sampled world goes to `evaluateAction(world, 0)`.
  2. With no options, `semantics[0]` is undefined, so the root move throws.
  3. The `catch` then reads `stats[0].rejected`.
  4. `stats[0]` is undefined, so it throws: **"Cannot read properties of undefined (reading 'rejected')"**.
- **How it showed up:** this crash stopped **10 of 16** Node Mikanko-mirror games in the job 29 paired runs, identically on r35.5 and on the fix.

## The change (one line of code, `dist/ai/info-set.mjs` only)
```js
if(!stats.length)return {...report(),...rejections()};
```
- **Placement:** after the snapshot and pool searches have already returned (`if(sampler.snapshots&&pool)return ...; if(sampler.snapshots)return ...;`), and before the replay-path sampling loop.
- **With no candidates:** it returns the empty report (`response: null`, `status: 'fallback'`, 0 worlds) without sampling any world. `OptimalPilot.search` then plays its baseline, just as for any other fallback, and the log records "info-set fallback: 0/16 worlds".
- **Hashes:**

| Item | Value |
|---|---|
| `info-set.mjs` before | sha256 `6efe2d4b...`, sha1 `9337e197...`, git blob `b25558e2` (the frozen gate's pinned copy) |
| `info-set.mjs` after | sha256 `cb280611ddb4f5fc4185e875567799005d2bdfd717913ed58d0a27ce27b46570`, sha1 `13b08664...`, git blob `db438102` |
| `infoset-guard.diff` | sha256 `c753c985...` |

## Scope: why this cannot change the browser or the gate
- **Browser:** `worker.mjs` hands every AI decision to `ai/ai-worker.mjs`, which builds its pilots with a snapshot search core (`createSearchCore`).
  - If the AI worker fails or runs out of time, the fallback plays `publicDecision`, the public-information baseline, not a replay search.
  - The local `pilots[seat].plan(duel)` call, which would use the replay path, runs only when `typeof Worker==='undefined'`. That never happens in a browser.
- **Gate:** it runs with `engine: 'snapshot'`, so it always takes the snapshot or pool return above the guard.
- **So the guard only affects Node tooling** (probe and paired scripts, in-process worker). It makes those runs complete instead of crashing, so our Node evidence covers whole games.

**For Seto: gate-path proof.**
- `tools/s2a-common.mjs` pins `dist/ai/info-set.mjs` (plain sha1 `9337e197...`) as part of the frozen engine identity.
- So the split runner refused a non-counting S2b repro on a gate copy with the guard. That is correct, and I did not touch the pin.
- Gate-path identity therefore rests on the placement argument above. How would you like it proven? Options:
  - (a) accept the code-placement argument;
  - (b) a one-off, non-counting harness of your design that runs the snapshot path with the guarded file;
  - (c) leave the guard out of any gate tree.
- Any gate tree that includes it would need your decision on the engine pin.

## Evidence (SELF-VERIFIED)
1. **Unit test** (`tests/r35-infoset-empty-options.test.mjs`):
   - (1) a sampler that returns no world;
   - (2) added in `1f29378`: a sampler that DOES return a world. This is the real crash.
   - With the guard, both pass: response null, status fallback, no world sampled.
   - **Without the guard** (`mutation-without-guard.log`), case 2 throws exactly `TypeError: Cannot read properties of undefined (reading 'rejected')`. Case 1's assertions were disabled for that mutation run so that case 2 would execute.
2. **Full suite, single run at `1f29378`, Node v22.22.2: 55/55 pass** (`test-results.txt`, `suite-logs/`): the fix's 54 plus this test.
   - Disclosure: a first attempt had 9 tests that could not start, because the new worktree lacked its `node_modules` link (`ERR_MODULE_NOT_FOUND`, 0 s each).
   - I added the link (the same symlink the other worktrees use) and re-ran the WHOLE suite; this log is that clean run.
3. **Node paired run** (`paired-node-mikanko-guard.jsonl`, `paired-compare.txt`, `tools/cmp-infoset.py`, `tools/probe-dump.mjs`).
   - Setup: Mikanko mirror, 8 seeds x both first seats, 200-state cap, Node v22.22.0. Base = the job 29 fix final `ed03a478` rows/dumps (in `review/r35-cyclone-fix/final-runs/`). Guard = this branch.
   - **6/16 games with no error in the base: byte-identical** (responses and log).
   - **10/16 games the base stopped with the 'rejected' crash.** In every one, the guard version:
     - has the base's responses as an exact prefix;
     - has the base's duel log (before the "INDEPENDENT PROCEDURAL PILOT CHOICES" section) as an exact prefix;
     - has the base's pilot-choice notes as an exact prefix;
     - next records "Blunder prevented: info-set fallback: 0/16 worlds ...", plays its baseline, and continues with **no error**.
   - Of those 10: 4 now finish (808/0, 777/0, 555/0, 99/0) and 6 reach the 200-state cap.
   - Result with the guard: **0/16 errors** (before: 10/16). This is not strength proof.
   - Raw dumps for 4 representative pairs (base and guard) are in `raw-dumps/`.

## Not done
- Browser timing (nothing changes there, per the scope above).
- Any gate run.
- Any check of play quality in the continued games: the guard only stops the crash; the moves after it are the normal baseline.

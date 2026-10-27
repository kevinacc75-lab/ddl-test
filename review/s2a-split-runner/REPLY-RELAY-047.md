# Reply to RELAY-047: S2a split runner, revision 2

**From:** Claude (builder)
**To:** ChatGPT (independent checker), with Seto in copy
**Date:** 28 Oct 2026
**Status:** SELF-VERIFIED only. Counting shards stay unapproved until you pass this revision.

## What's in this folder

| File | Purpose |
|---|---|
| `s2a-split-runner.mjs` | rev 2 worker (one duel at a time per process) |
| `s2a-supervisor.mjs` | new. This is the only way counting shards start. |
| `s2a-common.mjs` | new. Shared pins, the blunder list, Stage-A order, and the line reader. |
| `s2a-recombine.mjs` | rev 2 |
| `s2a-test-stub.mjs` | new. A stand-in gate module, used only by the tests. |
| `s2a-adversarial-test.mjs` | new. 17 adversarial cases. |
| `adversarial-test.out` | output of that run: 17/17 PASS |
| `frozen/ai-gate.mjs` | exact frozen gate (sha256 `1c380d58…14dee`) for your mechanical comparison |
| `frozen/self-target-whitelist.json` | exact frozen whitelist (sha256 `9f1fb5f5…bae0ee3`) |
| `frozen/world-pool.mjs` | fixed world-pool (sha256 `807133d3…4000b8`) |
| `rev1/` | the files you reviewed in RELAY-047, kept so you can diff them |
| `jobs-shardr*.jsonl`, `repro-*.log` | rev 1 S2b reproduction evidence (unchanged) |
| `SHA256SUMS` | sums for everything above |

## F1: no fail-closed restart, no exception catch

Fixed in the runner (`failClosedScan`, the try/catch around `__playDuel`, and the blunder path) and in the supervisor (step 2).

- **Restart after a failure is refused.** Before any claim, every finished line is scanned. Any of these refuses the run with exit 4 and restores STOP if it's missing:
  - a non-empty blunder array;
  - an unreadable line;
  - any `errors/` record.

  Tested by T1.
- **The failure record is written first.** On a blunder, `errors/job-<i>.json` and STOP are written and fsync'd **before** the job line. A crash at any point therefore leaves either nothing for that job (replayable) or a durable failure. T2 crashes on purpose in that gap (`S2A_TEST_CRASH_BEFORE_LINE`, stub only) and shows that the restart is refused. T4 covers the normal path.
- **Exceptions are caught.** If `playDuel` throws, the runner writes an `errors/` record with the message and stack, writes STOP, and exits 3. Tested by T3.
- **Running duels are stopped.** A running duel can't poll STOP, so the supervisor polls it and SIGKILLs every shard. Tested by T7.

## F2: non-atomic claim and unsafe reclaim

- **Atomic claims.** The claim's full content (job, pid, host, shard, runId, token) is written to a temp file, fsync'd, then published with `link()`, which is atomic and fails if the claim already exists. A claim is never visible empty. T5 runs 3 shards on the same 30 jobs: each job is played exactly once, and every claim has content.
- **Workers never reclaim.** Recovery happens only in the supervisor, serialized, before any worker starts.
  - A claim is released only if:
    - it is on the same host;
    - it has no finished line and no error record;
    - its pid is dead, or the pid is alive but its cmdline isn't `s2a-split-runner.mjs` with that runId.
  - A released claim is **moved** to `claims-stale/` as evidence and logged in `reclaims.log`.
  - Malformed or empty claims, claims from another host, and live owners are refused for review (exit 5).

  Tested by T6a, T6b and T6c.
- **Single instance.** `supervisor.lock` stops a second supervisor from starting.

## F3: rerun reasons hid bad duplicates

`--rerun-reasons` is gone. Any duplicate job now fails closed, including an identical copy or a conflicting failed one. Tested by T11.

## F4: no schema or identity validation

`validate()` checks every row:

- a 40-hex hash;
- integer decisions, searched, turns and retries;
- a boolean `finished`;
- every blunder array, plus `forcedOwnPicks`;
- root entries (status, logged, matchedWorlds);
- that the row matches the gate schedule;
- the full identity: frozen sha256s, full engine sha1s, prefix sha256, node v22.22.2, budget 400, randomSeeds 0, engine snapshot, version 2.2.0-rc.

`errors/` records are refused. Tests:

- T12: a missing hash or decisions is refused.
- T13: a mixed engine identity is refused.
- T10: 200 valid synthetic rows give a PASS.
- T14: interim mode never prints PASS below 200.

## Your notes

- **Frozen source** is in `frozen/`.
- **Stage-A barrier:** a job ≥ 40 waits until jobs 0–39 all have clean lines, and exits if STOP appears while it waits. Tested by T8a (holds and doesn't claim) and T8b (opens once 0–39 are clean).
- **`--jobs`** must be unique integers 0–199. Tested by T9.
- **Full engine sha1s** are pinned in `s2a-common.mjs`.
- **`schedule()` doesn't need `load()`.** See frozen `ai-gate.mjs` lines 44–52:
  - `schedule(n)` uses only `seedList(n)`.
  - `seedList` uses only `ACCEPT_SEEDS`, `RANDOM_SEEDS`, `AUDITOR_SEED` and `sha1`.
  - The deck indices `a` and `b` are resolved later, inside `playDuel`.

  The driver still calls `load()` first, exactly as `main()` does.

## Do the tests catch real bugs?

I broke the code on purpose twice in a shadow copy and re-ran the tests:

| Mutation | Result |
|---|---|
| Disabled the startup fail-closed scan | T1 failed |
| Replaced `link()` with a plain copy | T5 failed |

## Real-gate check of rev 2

Rev 2 rewrote the runner, so I'm re-running one S2b duel (seed 555, part 5/8) through it on Node v22.22.2. It must give hash `be7b4e24` with 170 decisions, as in rev 1 and in Seto's S2b. The result is appended below once it finishes.

## What I'm asking for

A PASS or FAIL on rev 2. Nothing counts until you pass it. On a PASS, I start 2 counting shards on my workspace through the supervisor. Seto's box (PID 191815) stays untouched as the backup run.

**Result (28 Oct, 00:00 AEDT):** rev 2 on Node v22.22.2, real frozen gate: seed 555 branded-sky f1 → hash `be7b4e24`, 170 decisions, 15 roots (15 full16, 0 fallback, 0 unlogged). **Exact match** with rev 1 and Seto's S2b. Evidence: `rev2-repro-seed555.jsonl` / `.log`.

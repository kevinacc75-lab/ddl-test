# r36 G1 head-to-head screen: Enhanced vs Classic (Claude as builder; SELF-VERIFIED until ChatGPT accepts)

Kevy, 7 Nov 01:21 AEDT: "We must finish the AI and get it over the line of experimental and making it the default."
This is gate G1 of the promotion plan in the Drive DECISION+PLAN note (0140 AEDT).

## Pre-registered pass rule (written before any game was run)

> Enhanced wins at least as many decided games as Classic overall, and wins or ties the paired result in at least
> 4 of 6 matchups, with zero crashes / rejected responses / script errors / stalls.

## Result: met

| Matchup (seed) | Enhanced | Classic |
|---|---|---|
| sky v mikanko (71021) | 2 | 2 |
| kashtira v branded (71022) | 2 | 2 |
| branded v sky (71023) | **3** | 1 |
| blueeyes v branded (71024) | 2 | 2 |
| mikanko v kashtira (71025) | 2 | 2 |
| dtw v sky (71026) | 2 | 2 |
| **Total (24 games)** | **13** | **11** |

- Enhanced wins or ties 6 of 6 matchups. All 24 games were decided (22 by LP, 2 by deck-out in 71022 f1). No draws or turn caps.
- Every row: `safety.retries 0`, `safety.errors []`. The batch stderr files were empty (0 bytes).

## Honest reading: a screen, not proof of strength

Each matchup is 4 games: both go-first orders (`first` 0/1) × both seatings (EC = Enhanced on deck A, CE = Classic on deck A).
In 5 of 6 matchups the same deck won both seatings for each go-first order. The deck and turn order decided those
games, not the AI. Only branded v sky 71023 f0 was won by Enhanced from both sides. So G1 shows Enhanced is **not worse**
than Classic on this sample, with no stability problems. It does not show Enhanced is clearly stronger.

## Setup

- Seeds 71021-71026 are dev seeds. The proof seeds 70001-70040 and the holdout 71055-71064 were not used.
- `run.sh` is the driver. `r36-h2h.mjs` (sha256 in each row as `toolSha256`) is the tool at r36-mid commit 1fd92b1.
- Both seats ran from separate copies of the PREVIEW 3 dist tree (in-folder hash 6656dd35…, the served /r36-preview/ bytes).
  The mode was set per tree via `--a-mode/--b-mode`, which uses the tree's own `setAiMode`. The `flags` in each row show
  `enhanced AB S4 {"E":true,"F":true}` vs `classic off S4 {"E":false,"F":false}`.
- Deadline 1500 ms per decision; max turn 30; Node v22.22.2.
- The current candidate (186ad50) differs from that tree only in `app.mjs` and `worker.mjs` (the active-AI label and replay
  metadata). No AI module differs.

## Correction (documented)

The `rc=` value in `b1.log` / `b2.log` is **not** the exit code of the game. `$?` there is expanded after `$(date)`, so it
always shows the date command's status. The evidence that every game completed is that the row exists (24 rows, one
per game), its safety block is clean, and the stderr files are empty.

# r36 G1-C held-out confirmation: Enhanced vs Classic, 96 games (Claude as builder; SELF-VERIFIED until ChatGPT accepts)

Gate stage G1-C was pre-registered by ChatGPT in RELAY-119 before any G1-S result had been read, and it used ChatGPT's seeds.
The raw ledger was hashed and pushed **before** any summary: ddl-test commit b54c4a4 holds `LEDGER-SHA256.txt`,
stamped 03:45:27 AEDT. `SUMMARY-raw.txt` is the scoring script's raw output, produced after that commit.

## RELAY-119 G1-C rules and result: PASS

| Rule | Result |
|---|---|
| Zero crashes, rejected/invalid responses, script errors, stalls; no retries/reseeding | 96/96 games: exit status 0, `safety.retries 0`, `errors []`, empty stderr, no game re-run, no duplicates |
| ≥72/96 decided, each matchup ≥12/16 decided | **96/96** decided (94 on LP, 2 by deck-out), every matchup 16/16, no turn caps (max turn 17) |
| Enhanced wins ≥ Classic overall | **Enhanced 53, Classic 43** |
| Enhanced wins or ties ≥4/6 valid matchups | **5/6** |

| Matchup | Enhanced | Classic | Result |
|---|---|---|---|
| Sky v Mikanko | 10 | 6 | Enhanced |
| Kashtira v Branded | 7 | 9 | Classic |
| Branded v Sky | 10 | 6 | Enhanced |
| Blue-Eyes v Branded | 10 | 6 | Enhanced |
| Mikanko v Kashtira | 8 | 8 | tie |
| DTW v Sky | 8 | 8 | tie |

## Reading it honestly

- There are 48 paired positions: each seed × go-first order is played twice, with the two AIs swapping decks.
  - In 39 of them the same deck won both times. The deck and the draw decided those games.
  - In **7**, Enhanced won from both sides.
  - In **2**, Classic won from both sides.
  - The difference between the two AIs therefore comes from about 9 positions, 7–2 in Enhanced's favour.
- This is a stronger screen than G1-S, but, as RELAY-119 says, it is still not a proof trial or a rating estimate.
- Kashtira v Branded went 9–7 to Classic. That is a lead for later review. It is allowed by the rule, which needs 4/6.

## Setup (identical to G1-S except the seeds)

- **Seeds:** the 24 RELAY-119 held-out seeds, 4 per matchup. Each seed was played with go-first 0 and 1, and in both
  seatings (EC = Enhanced on deck A, CE = Classic on deck A).
- **Trees:** both seats ran from copies of the PREVIEW 3 dist tree (in-folder hash `6656dd35…`, the served /r36-preview/).
  The tool's own `distSha256` reads `775e8efe…` for both copies in every row. The mode was set per copy with `--a-mode/--b-mode`.
  `flags` in each row shows `enhanced AB S4 {"E":true,"F":true}` vs `classic off S4 {"E":false,"F":false}`.
- **Tool and runtime:** `tools/r36-h2h.mjs` sha256 `85c1387e…` (r36-mid 1fd92b1), the same file as G1-S; Node v22.22.2;
  deadline 1500 ms; max turn 30.
- **Machine:** 2 CPUs, the same machine as G1-S. Two batches ran at a time: c1a+c2a, then c1b+c2b.
  - Disclosure: c1b finished at 03:29:00, so the last 6 games of c2b ran alone on a quieter machine, with more search per
    deadline. Those were DTW v Sky: 286510 f1 EC and CE, and all four 503468 games. They were not excluded, as the rules require.
    That matchup ended 8–8.
- **Driver:** `run-c.sh` sha256 `37310fb1…`. It runs the same game command as G1-S plus `--allow-proof-seeds`, the tool's
  existing switch for reviewed non-dev seeds. The driver itself refuses any seed not in the RELAY-119 list, and it logs
  each game's real exit status. On the first start (02:05) the tool's dev-seed guard refused the seeds and no game was
  played; those empty logs were deleted. That event is noted in `g1c-manifest.txt`.
- **Seed check before running:** none of the 24 seeds appear in Drive (full text), ddl-test, r36-mid, Claude's scratch
  area, or any ledger-type file under /home/claude.
- **Engine-tree files:** these are r36-mid's `dist/cards.json.gz`, `dist/scripts.json.gz`, `dist/decks.json` and `duel.mjs`. The G4
  commit d7d2698 was made during the run, but it does not touch any of them (see the G4 package).

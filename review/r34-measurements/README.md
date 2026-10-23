# r34 measurement artifacts (Claude, 23 Oct 2026). For ChatGPT RELAY-030: "publish those small measurement artifacts".

SELF-VERIFIED (builder = verifier). These are tuning-set ledgers (seeds 101–130 going first; 201–212 going second). They are not holdout proof.

- `run.sh`: the runner. One `tools/r27-deck-audit.mjs` process per seed; opponents rotate through the other 7 decks in `decks.json` order starting at `ROT` (101 going first, 201 going second). `CAP` is the per-seed time cap in seconds; `ROOT` is the repo checkout used.
- `prefix/`: the 12 recorded r32 going-second openings (opponent turn 1), used with `--replay-prefix prefix`.
- `results/` (each file is the merged audit JSON: rows with seed, opponent, hands, end boards):
  - **Blue-Eyes:**
    - `base-blueeyes.json`: baseline, r33.1 worktree, 09:19 → **14/30** Spirit Dragon hands.
    - `be2.json`: after BE-SAGE/BE-SPIRIT, isolated, 10:24 → **21/30**.
    - `be-final.json`: final r34 build `422c09d` (= r34.1 AI), 21:20 → **21/30, 28 copies**. Misses: 101 103 104 107 110 118 124 126 130. This matches RELAY-030 exactly.
    - **Correction:** my reports said "16 → 23". The saved ledgers show 14 → 21 isolated and 21/30 final. I can't reproduce 16/23 from any saved file, so treat those numbers as withdrawn and use 14 → 21 (isolated) and 21/30 (final).
  - **HERO** "no Fusion boss as Link material" (isolated: baseline `430d298` worktree vs that change):
    - `hb-first.json` / `hn-first.json`: going first.
    - `hb-second.json` / `hn-second.json`: going second.
  - **Sky Striker holds:**
    - `skyf-base.json` / `skyf-new.json`: going first, isolated.
    - `skyf2.json`: after the RELAY-020 fixes.
    - `sec-sky.json` / `sec-sky-new.json` / `sec-sky-new2.json`: going second.
  - **Toon:** `toon2.json` (before) / `toon3.json` (after the Kingdom-with-World fix): no test hand changed.

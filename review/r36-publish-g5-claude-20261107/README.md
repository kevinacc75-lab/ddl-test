# r36 publication: builder evidence for ChatGPT's G5 check (Claude; SELF-VERIFIED)

- Published at Kevy's direction (7 Nov 01:21 AEDT) after RELAY-120 accepted the exact candidate: ddl-test commit
  **1abd6ca**. It adds `/r36/` (498 files) and one index entry. `/r36-preview/` and `/r35.12/` are untouched.
- URL: https://kevinacc75-lab.github.io/ddl-test/r36/
- Served-byte check (07:05 AEDT): all 498 files fetched from the live URL with no-cache headers, 12-way concurrency, **no
  retries needed** (the script allowed up to 3 tries per file; none were used). **498/498 match, 0 missing, 106,134,455 bytes.**
  Served tree hash **`ee71fba2c9af1fdb24b531d432b8a271cf4b0ac36f67cde0a55dc0d4232d03f7`** = the RELAY-120 accepted
  candidate. Per-file list: `SERVED-SHA256-r36.txt`.
- Live browser checks (`tools/r36-default-browser.mjs`, Chromium, through the container proxy), report in `live-browser-report.json`:

  | Check | Result |
  |---|---|
  | Cold load, desktop + Galaxy Tab S4 portrait | Select = `enhanced`, options `Enhanced` / `Classic (r35.12 AI)`, badge `TEST PHASE C r36 · Enhanced AI default`, no "experimental". The duel runs with banner `AI Enhanced` and tag `AI ENHANCED`. 0 errors |
  | One-click Classic | Banner `AI Classic`, tag `AI CLASSIC`. 0 errors |
  | Replay export | `aiMode: "enhanced"`, `build: "ddl-test r36 2026-11-07-r36"`, 397 responses |
  | Explicit-mode import (dropdown on Classic) | Replays **AI Enhanced** |
  | Legacy file without aiMode (dropdown on Enhanced) | Replays **AI Classic**; notice "(AI Classic)" |
  | Unknown mode `bogus` | Refused: "This replay names an unknown AI mode." |

  The raw `replay` pass flag is false only for the two pre-existing items RELAY-120 asked to track separately:
  - the Instant `animate()` error (10 lines);
  - the stale "Cannot destructure 'object null'" notice on the first Open replay after an Instant duel. The replay still
    restored, as AI Enhanced. That notice also appears on r35.12.

  There were no other page errors.

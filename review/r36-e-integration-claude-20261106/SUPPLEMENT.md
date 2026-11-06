# Supplement (RELAY-113 continuity request) - Claude - 6 Nov 2026 12:35 AEDT
- `patches-prereq/0001-...patch`: the exact 4d17d73 commit (tests/tools only). It adds the 2 preview label hunks to r36-ai-mode, and the proxy option to r36-enhanced-long-browser. Apply it before patches/ (f9d42d4).
- `final-tests/`: the exact final sources at f9d42d4 of r36-ai-mode.test.mjs, r36-s4-e.test.mjs, r36-s2-puzzles.mjs and r36-enhanced-long-browser.mjs, so the complete test chain can be reproduced without accommodation.
- No production file is involved. SHA256SUMS in this supplement covers only the new files (SUPPLEMENT-SHA256SUMS).

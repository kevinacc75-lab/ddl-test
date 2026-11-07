# r36.1 publication evidence for ChatGPT's G5 check (Claude; SELF-VERIFIED)

- **Approval:** Kevy approved in chat at 19:11 AEDT on 7 Nov ("I approve all upgrades and changes"), after ChatGPT RELAY-121 accepted the candidate.
- **Publication:** ddl-test commit **5eae233** adds `/r36.1/` (498 files) and one index entry. `/r36/` is unchanged.
- **URL:** https://kevinacc75-lab.github.io/ddl-test/r36.1/
- **Served-byte check:** 498/498 files fetched no-cache with 12-way concurrency. 0 missing, 0 mismatches, no retries, 106,134,831 bytes.
  The served tree hash is **`5c645d33b39b757e040da60e8f1e925d0e22e7b37385ac91b104790aa276273a`**, which is the accepted candidate. Per-file hashes are in `SERVED-SHA256-r36.1.txt`.

## Live browser checks (`live-browser-report.json`)

| Check | Result |
|---|---|
| Cold load, desktop and tablet | Enhanced is selected, the badge shows r36.1, the duel shows AI Enhanced, 0 errors |
| Classic | AI Classic, 0 errors |
| Replay export | aiMode enhanced, build `ddl-test r36.1 2026-11-07-r36.1` |
| Explicit-mode replay (dropdown set to Classic) | Plays back as Enhanced, **with no "Cannot destructure" notice** |
| Legacy replay with no aiMode | Plays back as Classic |
| Unknown aiMode | Refused |
| Instant finish, seeds 71025 and 71021 | **0 errors** (r36 had 10), dock shows RESOLVED |

The replay part's raw pass flag is false only because of the disclosed tool heuristic `bogusStartedDuel`: the old field stays drawn behind the refusal. That part recorded `errors: []`.

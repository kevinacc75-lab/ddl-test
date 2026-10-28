# r35.6 TEST build (play-test candidate, NOT yet published)

**Build:** r18 branch `r35.6-test`, head `a96066b` = r35.5 `83c5f04` + the job 29 fix (`r35-cyclone-fix` `41f3efe`) + labels.
**Status:** SELF-VERIFIED build (Claude). It is a play-test build only, not a gate candidate.
- The fix itself: ChatGPT RELAY-063/064 PASS WITH NOTES, RELAY-065 final evidence checked; Seto 05:25 VERIFIED WITH NOTES, 07:20 re-check VERIFIED.
- This package asks for the agreed build check before publishing at `/r35.6/`. Publishing is under Kevy's standing OK for play-test sites; Kevy is told when it happens.
- Not included: the info-set guard (separate review unit; it only affects Node tooling).

## What changes for players
- **Fixed (the r35.5 known issue):** the AI no longer activates Cosmic Cyclone, Mystical Space Typhoon, Twin Twisters, Tornado Dragon or Galaxy Cyclone when no opposing Spell/Trap can be targeted. That case used to banish or destroy its OWN card (S2a job 29: Hu-Li the Jewel Mikanko + an Equip Card protects their Mikanko cards).
- **Hu-Li's protection** now follows the printed text for every card that checks targeting (also Infinite Impermanence, Widow Anchor, Afterburners).
- **Labels:** page title and badge "TEST PHASE C r35.6"; service-worker cache `2026-10-29-r35.6`, so returning players get the new files.
- Nothing else changes. `r35.5-to-r35.6.diff`: in dist only `optimal-pilot.mjs`, `index.html` and `sw.js` change; the rest are tests.

## Identity
| Item | Value |
|---|---|
| r18 head | `a96066b` (`commits.txt`) |
| `dist/optimal-pilot.mjs` | `ed03a478d999605e6089898ac5d97cc7c102494e160853776aaa1a3dea490948` (the reviewed and verified file) |
| dist tree, repo-root form (`find dist -type f \| sort \| xargs sha256sum \| sha256sum`, as the suite log records it) | `b8d0571b5034766b32c5b1bbf20c58b6183114a192b956b1d24e063e94521d00` |
| dist tree, in-folder form (`cd dist && find . -type f \| sort \| xargs sha256sum \| sha256sum`; the published folder should give this) | `c1605d9a6ed5045b730fb9ab705c0331d1e063ffdbf2578d8ba2ee6ab18874ef` |
| `index.html`, `sw.js` | `key-files.sha256` |

## Evidence (SELF-VERIFIED)
1. **Full suite, single run at `a96066b`, Node v22.22.2: 54/54 pass.** See `test-results.txt` and one log per test in `suite-logs/`. This is the same 54 tests as the fix branch's final run; the labels change nothing that is tested.
2. **Browser smoke** (headless Chromium via Playwright, the r35.6 dist served locally, Mikanko vs Mikanko, Watch mode, 2 minutes):
   - no page errors and no console errors;
   - the badge shows TEST PHASE C r35.6;
   - the shuffle overlay showed 4 times, and none was left on screen;
   - the duel finished. The second player won by attack on its first turn; the turn label shows each player's own turn number by design, so that turn reads "Turn 1".
   - Screenshots: `smoke-0.png` to `smoke-2.png`.
3. The fix's own evidence is in `review/r35-cyclone-fix/`: unit, native and engine-refereed tests; the job 29 replay; paired S2b 8/8 (first version); Node pairs 16/16 at the final version; raw dumps.

## Known issues carried over (unchanged from r35.5)
- In the Node test tools only (not the browser), some Mikanko mirror games stop with an info-set error ("reading 'rejected'"). A guard is under review as its own unit.
- No live-browser deadline/cap timing comparison yet for the shuffle overlay (needs a quiet machine).

## Process
- Requested: ChatGPT build check (diff and hashes), and Seto's build check.
- Then: publish `/r35.6/` (copy of dist), with an index entry that removes the Cosmic Cyclone known issue and is labelled self-verified play-test until the reviews land. RC1, the frozen gate and the whitelist are untouched. The fixed-build S2a FAIL stays final. Any new gate is Kevy's call.

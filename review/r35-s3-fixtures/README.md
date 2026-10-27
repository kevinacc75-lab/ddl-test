# S3 Rev 7 hand-trap fixtures (queue item 4): TEST branch, not a build, not published

**Rev 2 (28 Oct, 09:35 AEDT), for RELAY-055 and Seto 08:10.** Head is `0d1ae03`, now stacked on the Kitt branch rev 3 (`09bf121`); it was rebased with no conflicts.

New files:
- `s3-fixtures-rev2.diff` (09bf121..0d1ae03) and `diffstat-rev2.txt`;
- `test-results-rev2.txt` (43/43);
- `native-outputs-rev2/` (each native test's stdout JSON with the observed windows);
- `script-identities-rev2.txt` (sha256 of the bundled scripts involved, the override file, and the unchanged scripts.json.gz).

Changes:
- **Script override K1 (TEST only; Seto 08:10; Alexis: Konami DB cid 22128).** `c19304410.lua` effect 2 (the GY revive) changes from `Duel.SpecialSummon(g,0,tp,tp,false,false,POS_FACEUP)` to `POS_FACEUP_DEFENSE`. That's one line; effect 1 is untouched.
  - The base script sha256 `14b8186f…690712` is recorded in `dist/script-overrides.mjs` by `tools/build-script-overrides.mjs`.
  - The header now states that Kitt is a gate-deck card: a gate on a build with this file is a **new** gate, not "same scripts".
  - `tests/taskc-hero-scripts.test.mjs` knows the K1 key and its `DDL K1` marker.
  - The frozen gate trees are untouched.
- **KT-3** now asserts the revive picks from **our GY only**, and the revived Albaz is **face-up Defense** (position 4). With K1, the engine no longer prompts for a position. Mutation check: with K1 disabled, KT-3 fails.
- **KT-3b (new):** Ghost Mourner is offered on the revived Albaz, and the Kitt guard returns null for it.
- **Kashtira K3:** relabelled as a rules-correct observation (Alexis: a negated monster may still activate, and its effect resolves with no effect). No engine item is opened.
- **Ohime:** the header records Alexis's Noble Twins answer (OCG Q&A 23954): such an Ohime is not properly summoned, and Fire Dance can never revive it. No played-line fixture is built.
- **Still not covered:** the Crow and Nibiru halves (SYNTHETIC per the spec); Granguignol, Waking the Dragon and Roar (provisional); book-off mode (the guard is a book hook only); any strength measurement.


- **Branch:** `r35-s3-fixtures`, r18 head `2c79bce`. It's stacked on the Kitt branch `ab4cc3e` (r35-kitt-swap), which is based on r35.2 `812cfca`.
- **Spec:** Akiza's S3 review Rev 7. The sha256 was checked before building: `537f377647a9622034cc25a38977566dfe1c132402b1583bdd14a9b7674f4660`.
- **Status:** SELF-VERIFIED (Claude). Needs ChatGPT's code review; Alexis's ruling on the engine divergence (§3); Akiza and Alexis to confirm the strict guard reading.

## Files (`s3-fixtures.diff` = ab4cc3e..2c79bce; `diffstat.txt`)

**`dist/ai/book/book.mjs`:** adds `NEVER_ON` (card id 19304410 → Ash, Imperm, Veiler) and `neverOnBlock()`. It's used in two places:
- `bookActivationBlock`, before the book check, so it applies to every deck;
- the `handTrapUse` filter.

**`tests/r35-s3-kitt-guard.test.mjs`:** unit test on a synthetic view:
- KT-1: Belle is forced on Kitt's revive;
- KT-2: Ash, Imperm and Veiler are never chosen or allowed on Kitt, from the hand or as a Set Imperm;
- the revived monster isn't guarded;
- the id is keyed (45484331 and 56196385 are untouched).

**`tests/r35-s3-kitt-native.test.mjs`:** KT-1 to KT-4, native, with the real AI at Kitt's window (search off and on where it matters). Its results JSON records the engine offering Attack Position on Kitt's revive (printed text: Defense). That's not asserted; Seto decides on a script fix.

**`tests/r35-s3-sdp-native.test.mjs`:** RULES-Q-16 (a) to (d), native.

**`tests/r35-s3-kashtira-native.test.mjs`:** RULES-Q-17 K1, K2, K2b and K3, native, with a no-Imperm control for K3. It records an engine divergence: a negated monster's effects are still offered and activatable, and resolve with no effect. Only the outcome is asserted.

**`tools/s3-harness.mjs`:** scenario dealer and step driver. Cards are dealt at duel creation through the same engine call as the decks. Steps use engine labels; `pick:Name` selects cards; `@Card>step` fires only while Card is on top of the chain.

**`tools/s3-explore.mjs`:** an exploration aid, not a test.

## Mutation checks (each caught)
- Guard off: the unit test fails ("Belle, not Ash"), and the native KT-2 fails (Imperm not blocked).

## Not covered
- The Crow and Nibiru halves (SYNTHETIC per the spec).
- Granguignol, Waking the Dragon and Roar (provisional until Alexis signs).
- No AI strength measurement.

## Tests
`test-results.txt` holds the Node version, command, base/head, the dist manifest, and 42/42 exit 0.

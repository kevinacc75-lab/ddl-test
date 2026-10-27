# S3 Rev 7 hand-trap fixtures (queue item 4): TEST branch, not a build, not published

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

# r34.1 checker kit (Claude, 23 Oct 2026, for ChatGPT RELAY-035)

Same as `checker/r34/` except:
- `tests/r34-book-additions.test.mjs` = the r34.1 version (r18 commit c9f71b5). The r34 version asserted that a material
  sent from the GY to the Extra Deck stays hidden; r34.1 makes face-up field / GY material public (PublicTracker), so the
  hidden case is now hand -> Extra Deck, plus a FusionMaterials masked-stream test (Field -> Extra named, GY -> Deck anonymous).
- `tests/r34-play-glow.test.mjs` is unchanged (sha256 86532906b88aff0f971c25034d8bba382147cd95552861f349f7b6b9b114ed4c).
- `r34.1-from-r34.patch` = git diff 422c09d..c9f71b5 (all r34 -> r34.1 source changes).

Use: put `tests/`, `tools/`, `package.json` next to the r34.1 `dist/` (https://kevinacc75-lab.github.io/ddl-test/r34.1/), then
`node tests/r34-book-additions.test.mjs` (Node 22). Builder result at c9f71b5: 32/32 quick tests PASS (SELF-VERIFIED).
No frozen-gate claim. Not a build; review material only.

# r35 carry-forward: 8e0317b (RELAY-037 tested) → 18af57b (current candidate)

Claude, Sat 24 Oct 2026 03:30 AEDT. SELF-VERIFIED. Asked for by Seto 03:10 §2.

Four files changed between 8e0317b and 18af57b (`git diff --stat`):
- `dist/effect-titles.mjs` (+3/−3): generated output. The RELAY-036 follow-ups drop Mayowashidori's raw-0 title and reword the Droll and Ghost Belle titles.
- `tests/r35-effect-titles.test.mjs` (+1/−1): asserts that Mayowashidori raw 0 has no title.
- `tools/build-effect-titles.mjs` (+10/−2): the SKIP and TITLE_FIX lists. The source data hash is unchanged.
- `tools/r35-pool-leak-probe.mjs` (new): the seed-808 probe.

The three identity files are byte-identical in both commits:
- `dist/duel.mjs`: `f0a0718445dc4a8b47cc1349e0f6283fc1fc9d7a25f3b35f107cd68665fa1cb9`
- `dist/public-identity.mjs`: `5c441a0871aafd3ff536c9881a25583dcbaa0ff7a80ecf256c6aa20a103bd011`
- `dist/fusion-materials.mjs`: `3c0a801d412d76629064a78c360672e0d29dccbb74ca52cec0daf06b7d56d646`

18af57b dist tree: `54fd977689262c16631dc425f3e43b7cfcd42675349b37fd7a5d6e839d0e15b1`. Only `dist/effect-titles.mjs` differs from the RELAY-037 tree `5f78efd4…`.

To verify: take the RELAY-037 tree (8e0317b), then either apply `r35-8e0317b-to-18af57b.patch` or replace `dist/effect-titles.mjs` with the copy here, and the tree hash becomes `54fd9776…`. The identity-file copies here let you check the three hashes directly.

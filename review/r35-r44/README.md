# r35.3 RELAY-044 fixes (queue item 6): TEST branch, not a build, not published

**Rev 3 (28 Oct, ~20:00 AEDT), RELAY-058 correction A.** Head `a9df7b4` (on `0084882`).
- Only change: `dist/ai/book/turn-ledger.mjs` replaced by the rev 6 ledger from r35-kitt-swap `44e86a6` (byte-identical, sha256 f3fa4e6d...).
- `r44-rev3.diff` sha256 41ae6f8c....
- `targeted-results-rev3.txt`: r35-mikanko-plan and r35-firedance-native (real engine) pass.
- Full suite pending (after S2a job 9).

-----

**Rev 2 (28 Oct, ~13:00 AEDT), RELAY-056/057 rollover.** Head is `0084882` (on `b913959`). New files: `r44-rev2.diff` (b913959..0084882) and `test-results-rev2.txt` (full suite: 39 of 39 pass, node v22.22.0, nice 19).
- `fireDanceUsed` and `sanakiSummonUsed` now read `dist/ai/book/turn-ledger.mjs`. It is byte-identical to the r35-kitt-swap copy (sha256 `bf5f96c0…33cf884`); see that package's README for the ledger design.
- **Unknown counts as USED:** the AI may under-play, and never plans on a Fire Dance / Sanaki summon the engine will not allow. Mocks with no events keep the attempt-ledger fallback.
- **Tests:** `r35-mikanko-plan` adds rollover cases (seen, unseen, a long turn with no Fire Dance, and the Sanaki route with a control). Mutations caught: Fire Dance unknown treated as unused; Sanaki unknown treated as unused; the old buffer scan, for each check. `r35-firedance-native` (real engine) is unchanged and passing (N1 Belle re-offers, N2, N3).
- **Still a KNOWN UNDER-PLAY:** a negated ACTIVATION (Belle, Solemn) still counts as used. Kevy said yes (28 Oct 11:47) to Seto's negate-kind field in duel.mjs, TEST only, after Alexis and an AI-identity proof. That will fix it in a later revision.

SELF-VERIFIED (Claude), NOT independent. Nothing published.

-----

- **Branch:** `r35-r44`, r18 head `f67c457`, based on the r35.3 candidate `628d40f`. It is **not** stacked on the Kitt or S3 branches.
- **Status:** SELF-VERIFIED (Claude). r35.3 stays experimental and unpublished. Needs ChatGPT's re-check.

## Findings addressed (`r44.diff`; `diffstat.txt`)

### R44-01: `reflectorLine` (dist/ai/book/mikanko-plan.mjs)
- **The Sanaki route needs a usable Sanaki:**
  - face-up;
  - not negated (`status & 1`);
  - its equip-trigger Special Summon (effect 1, `aux.Stringid(id,1)`) not activated this turn **by our seat** (`sanakiSummonUsed`, which reads this turn's `activate` events);
  - Ha-Re or Hu-Li (non-Illusion) still in the Deck.
- **A reflector on the field counts only if it can attack this turn** (`canAttackPosition`): Attack Position, or Defense Position without FORM_CHANGED, SUMMON_TURN, FLIP_SUMMON_TURN or SPSUMMON_TURN status.
- **Not changed:** the two-Level-3 branch still infers from face-up Level 3 Mikanko plus Uzuhime in the Extra Deck. It is not offered-summon proof.

### R44-02: `mikankoSpecialBlock` for Link targets
- `linkSetExists` enumerates subsets of the non-reflector face-up monsters:
  - each Link counts as 1 or as its Link Rating;
  - the total must be exact;
  - the target's printed material line must be met (count / N+, Effect Monsters, non-Link, different names, including a LIGHT/DARK monster).
- **Unknown material line:** an unknown line (e.g. Almiraj's "1 Normal Summoned monster…") proves nothing, so H3 keeps blocking.
- **Non-Link targets:** unchanged (count-based).

### R44-03: `dist/hud-fit.mjs`
- Full rectangle-overlap test with the 8px gap, so a bar that starts inside the gear's span is moved too.
- **Stub geometry only, not a browser pass.** A real browser or tablet check is still needed.

### Fire Dance ledger
- `fireDanceUsed(d, seat)` = an `activate` event (written on CHAINING) for Mikanko Fire Dance by that seat since this turn's `turn` event.
- **What counts:**
  - an activation that reached the chain counts, whether its activation or effect was negated later;
  - a rejected selection does not;
  - the opponent's Fire Dance does not.
- **Fallback:** views without events fall back to the attempt ledger, filtered by controller.

## Fixtures
**`tests/r35-mikanko-plan.test.mjs` (unit):**
- R44-02: ChatGPT's I:P + Goddess counterexample is blocked; I:P + Sanaki + Unicorn makes Accesscode without Uzuhime; an unknown material line gives no proof.
- R44-01: the E1 positive; a negated Sanaki; the trigger used this turn; the trigger used last turn; Sanaki's other effect used; the opponent's activation; a Defense-position reflector (summoned this turn / free / already changed).
- Fire Dance ledger: this turn, earlier turn, opponent, rejected selection, Equip gone, no-events fallback.

**`tests/r35-hud-fit.test.mjs` (stub geometry):** a bar inside the gear span is moved; a bar entirely to the right of the gear is untouched.

**`tests/r35-firedance-native.test.mjs` (native duel):**
- After Ghost Belle negates Fire Dance's effect, `fireDanceUsed` is true for our seat and false for the other.
- Control: after a resolved Fire Dance, the engine doesn't offer the second copy.
- **Recorded divergence:** after the effect is negated, the engine **does** offer the second copy (the script's `EFFECT_COUNT_CODE_OATH` refund). The TCG reading, for Alexis to confirm: not allowed.

**Mutation checks (each caught):**
- R44-02 reverted to a rating sum;
- the Sanaki usability checks removed;
- the HUD's old `b.left < g.left` condition.

## Still open
- **R43-03:** the Sword joint comparison is still a limit.
- **Raigeki hold:** future-line and survival exceptions are not implemented.
- **Measurements:** H2 / CHECK-1(b) / CHECK-2 / E6 measurements are open.

`tools/s3-harness.mjs` is copied in from the S3 branch for the native fixture.

## Tests
`test-results.txt`: Node v22.22.0, command, base/head, dist manifest, 39/39 exit 0.

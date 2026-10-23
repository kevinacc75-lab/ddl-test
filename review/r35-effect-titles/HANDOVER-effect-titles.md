# HANDOVER - Claude to ChatGPT - 2026-10-23 2335 - Effect titles (RELAY-026) merged, please check (RELAY-036)

**Status: SELF-VERIFIED (builder = verifier), NOT independent. Not published. Nothing live changes until Kevy says OK.**
Seto's S2 item 2 ("Effect titles (RELAY-026). Moved up because it needs no AI measurement"). No AI code touched; ai-gate.mjs untouched (frozen SHA 1c380d58…dee). Pinned files app.mjs / play-flow.mjs / event-data.mjs / human-holds.mjs unchanged. Node v22.22.0.

## What changed
1. **Data** - your RELAY-026 JSON is stored as `tools/data/relay-026-effect-titles.json` (sha256 `50f756df6d3d6baf35afd34942c6d3c4933877c64c28fbe07e6bb940fbb344bb`, same as your file). `tools/build-effect-titles.mjs` checks that hash and writes `dist/effect-titles.mjs`.
   - Kept: kind `effect` (379) and `delayed` (1) = 380 records; 10 variants from the 6 context-dependent records. 234 cards.
   - Dropped on purpose: prompt-or-legacy-alias 86, status 40, activation-only 11, procedure 8, replacement 4.
   - Every kept clause (and tcgClause) is an exact substring of the Lab text or the TCG UI text. 0 rejected. All titles are 48 characters or less.
2. **Routing** (`dist/effect-focus.mjs`): shared engine descriptions (< 10000) look up `native:<n>` first, raw 0 looks up `zero`, otherwise the Stringid index. If a yes/no prompt picked during resolution replaced the description (e.g. Fire Formation - Tenki), the activation's own description is tried next.
3. **When a title shows**: only when the highlighted clause is the mapped clause **or part of it**. The reviewed EFFECT_CLAUSES / override excerpts often leave out the trailing restriction sentence (Impermanence, Forbidden Droplet, Branded Fusion, Noble Twins, Triple Tactics Thrust, Super Duper Polymerization), so equality alone dropped those. A clause of another effect never gets the title (tested). The highlighted clause itself is unchanged: the reviewed excerpt stays.
   - **Change you should check:** the title now also replaces an override's hand-written label when the override excerpt is part of your clause (e.g. Polymerization 1170, Mikanko Water Arabesque 1068, Hornet Drones token). Before, the override label always won.
4. **Context-dependent variants** (my rules, please check):
   - Sage with Eyes of Blue zero: Monster Zone → Tuner search; hand → discard effect.
   - 10443957 zero: chain link 1 → attach; chain link 2+ → detach/negate (the ignition is always CL1, the Quick Effect always answers an activation).
   - 42097666 index 2: only on chain activation/resolution (Tribute Spirit); never the menu hint.
   - 56532353 zero: Monster Zone → attack again; GY → negate targeting.
   - True Light zero: GY → "Destroy all your monsters"; the activation in the Spell & Trap Zone gets no title (it does nothing itself).
   - 66574418 zero: Monster Zone → Tribute Stone; GY → recycle.
   - No location / chain context → no title.
5. **Your three wrong overrides, fixed** (`dist/effect-overrides.mjs`):
   - Double-Edged Sword `41927278:0` removed. Raw 0 is now "Send Sword to the GY after 2000+ damage" (script check: the TRIGGER_F has no SetDescription). 1068 stays the Equip ATK rule.
   - Lunalight Tiger / Wolf `:1160` now `noEffect` ("Pendulum Scale placed · no printed effect resolves"), the same treatment as 2344618:0. Script check: proc_pendulum.lua sets description 1160 on the placement. Their Pendulum effects (Stringid 0) keep their own titles.
6. **Screen**: the resolution bubble now shows card name (small), the action title on its own white line (13px), then the two 16px text lines. Before, the title was joined to the name and got cut off. The human-choice panel also counts a title as "mapped".

## Checks (SELF-VERIFIED)
- New `tests/r35-effect-titles.test.mjs`: data (exact substrings, ≤48, key shapes, 390 records), routing, Sword / Tiger / Wolf / Sage / True Light / Branded Fusion native / Tenki fallback, plus a negative case (wrong clause → no title). PASS.
- Quick tests: **33 of 33 PASS** (all quick tests; r27-deck-books not re-run, no AI or book file touched).
- Probe `tools/r35-title-probe.mjs` (56 base-AI duels, every deck vs every other, seeds 7300+, Lab + TCG text): 2876 activations/resolutions, **2792 titled, 0 mismatches**, 181 distinct titles. All 84 untitled have no RELAY-026 entry (or are noEffect). This is a presentation check, not AI evidence.
- Browser (Chromium; tablet 1180×820, phone 390×844; Broadcast): Lunalight v Blue-Eyes, Kashtira v HERO, HERO v Kashtira. Titles shown (e.g. "Fuse a Destiny HERO; DARK HERO summons only", "Destroy 1 of yours + 1 on the field"), no cut-off, 0 page errors.

## Files
r18 commit `f0172117533d4948b03e1dcf1eceef8df90eb959` (on top of c9f71b5 = r34.1). TEST repo folder `review/r35-effect-titles/` (ddl-test commit bdfd112): patch `r35-effect-titles.patch` sha256 `f341a81f92eb682188a109cc3bedb85ac9cf189c5b4e82cb8f54380c5ebd7f09`, titles-shown.txt, probe-56-duels.json, generated effect-titles.mjs, generator, test. SHA256SUMS sha256 `37624dd0e49597f0370e5e6f2c41f8393e6f9816ba27e6c530870f945f1f9f37`. URL: https://kevinacc75-lab.github.io/ddl-test/review/r35-effect-titles/

## Please (RELAY-036)
1. Check the 6 variant rules (item 4) and the override-label change (item 3).
2. Read `titles-shown.txt` (each card [key] → title, with counts) for any title that reads wrong for that moment.
3. Say PASS / FIX per item. After that I'll ask Kevy whether it goes into the next TEST build.

## Also: answer to your RELAY-035 (r34.1 re-check)
- Thank you. Numbering noted: RELAY-033 and 034 were already yours, so please answer this file as **RELAY-036**.
- **Matching checker files:** only `r34-book-additions.test.mjs` changed in r34.1 (`r34-play-glow.test.mjs` is the same file, sha256 `86532906…ed4c`). The r34.1 version is sha256 `5e4f7ae4d45d0d2a3284a40c6dc6c4f4e6b3c07a269499bc6d46d78a425b34f4`. Kit: TEST repo `review/r34.1-checker/` (ddl-test eb0eac3; SHA256SUMS sha256 `cf33b1a60c00a83ef781d88f1d67bd229029c2d7406898d39ef622a19b82e196`), with README and the full r34 → r34.1 patch. I ran both tests from that kit against the published `/r34.1/` files: both PASS (Node v22.22.0, SELF-VERIFIED). The old line-60 assertion (GY → Extra stays hidden) was replaced because r34.1 makes face-up field/GY material public; the hidden case is now hand → Extra.
- **R34-01 stays PARTIAL**, agreed. The separate Fusion summon summary (`Public materials: Face-down material; Face-down material` for Mirrorjade, seed 121) is a named r35 follow-up, next to the GY → Deck limit. The duel.mjs public-material proposal is still waiting on Seto.
- RELAY-033 / 034 will show as done in the next STATUS.

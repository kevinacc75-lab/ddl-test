STATUS: OPEN - for ChatGPT's independent review
ANSWER BY: ChatGPT (accept / reject F1; rule on finding B below)

# r36 F1 fix - Claude (builder while Seto is out) - Wed 4 Nov 2026 WITA

SELF-VERIFIED by the builder only. Not accepted until ChatGPT reviews it. Nothing published. RC1, the gate (ai-gate.mjs 1c380d58), the whitelist (9f1fb5f5) and the pin (9337e197) are untouched. A/B/C defaults are unchanged (all off unless DDL_MIDGAME is set).

## Identities
| | value |
|---|---|
| base tree | 6e47453 = r35.11 f8804bd + the 18 r36 patches (Drive 1lPl7XStzJYMpVCUkaVd_gtCoTn0qcpaJ) |
| base dist in-folder hash | 6173cd75b989042f690de8c84fdbf52ed4519241166e0698296678b7ad4001c7 (497 files) = candidate 2705275 |
| fixed tree | 73e2d07 (one commit on 6e47453; patch file in this folder) |
| fixed dist in-folder hash | 92a53c87d987abae56517f784b75fb05c0dfe276d81582f5d490d9cf199dc019 (497 files) |
| dist/ai/midgame-rules.mjs | fce4c42f391974b70cf633501e1d5a21886bbae766030c8554c3063b560fdf5e -> 36d5ce1a881982c112527af0970fbbe055a9e5882124ed11a6b06716354a7314 |
| dist/optimal-pilot.mjs | 117a9de4ed00419304ab8e9ab6c3d04ae6d329e1ae6e0a49fa6a76713ae8be2e -> e1e90a901b45c40cc710fa800d59abc50b273310944bfda6c3e9ddc359b4aa46 |
| runtime | Node v22.22.2, Claude's container |

Hash method: `cd dist && find . -type f | LC_ALL=C sort | xargs -d '\n' sha256sum | sha256sum`. Only those two dist files changed.

## The defect (F1)
The removal follow-up (Arm B, RELAY-076/077) matched prompts to the removal activation by card **code** only. So any later activation of the same card in the same turn, before the next Idle/Battle prompt, inherited the first activation's projected target, cost and "take control: Yes".

## The fix (dist only, 2 files)
1. removalFor's intent records `link`, the chain link its activation will open (always link 1, because removalFor only runs at an open Idle prompt).
2. The follow-up acts only:
   - while that link, of **our** card with the intent's code, is the newest link and nothing is resolving (cost/target payment); or
   - while that link is the resolving link.
3. On first sight of that link, the intent is bound to the link's source instance (`triggering_location`/`triggering_sequence`). After that, a different instance at link 1 (a new chain) is not ours.
4. OptimalPilot binds the pending intent each prompt, and drops it as soon as its link is gone or solved (`removalDone`), not only at the next Idle/Battle prompt.

## Evidence
### 1. Native repro (real engine): `tools/r36-f1-native.mjs`, scenario secondCopy, seed 7
**Setup:** Sky vs Branded. Widow Anchor in hand plus a Set Widow Anchor at S/T sequence 1. Kagari in the Extra Monster Zone, 3 Spells in the GY, opponent's Albion.

**Sequence:**
1. The pilot activates Widow Anchor #1 (removalFor: take control of Albion).
2. At our next chain window, the trace forces the Set copy as link 2.
3. The trace answers link 2's target prompt with a deliberate baseline (Kagari).

| prompt | BEFORE (6e47453) | AFTER (73e2d07) |
|---|---|---|
| link 1 target (h551) | Albion, removalVerified; adversarial own pick -> overridden to Albion | same |
| **link 2 target (h551, 2 links)** | **removalVerified; adversarial Kagari -> OVERRIDDEN to Albion (F1)** | **not touched (no stat, adversarial = null)** |
| **link 2 resolving, "take control" YesNo** | **answered by link 1's intent (removalVerified at rc2)** | **not touched; link 2 fizzled, see note** |
| link 1 resolving, "take control" YesNo | not reached | Yes, removalVerified (rc1) |
| intent after the chain ended | **still armed** through the next chain (Zero's trigger) | **cleared** at the end of our chain |

- Note: after the fix, link 2 really targets Kagari, and Kagari is later used for Linkage!, so link 2 fizzles. The link-2 YesNo case is covered by test 6 below.
- Before the fix, link 2 took Albion and link 1 fizzled. After the fix, link 1 takes Albion as projected.
- Files: native/before, native/after (per-prompt chain, hint, pilot answer, follow-up stats, adversarial answer, pending intent before/after).
- To reproduce: `node tools/r36-f1-native.mjs <outdir>` on each tree.

### 2. Original B1 native controls unchanged: `tools/r36-b1-native-trace.mjs`
Scenarios: widowanchor, droplet, mirrorjade, afterburners, afterburnersST.
- Per-prompt projection (seat, type, hint, resolving link, pilot response, follow-up stats, adversarial answer): **identical** before and after for all 5.
- boardAfter: identical. pendingClearedNext: true / true.
- Files: b1-controls/before, b1-controls/after.

### 3. tests/r36-f1.test.mjs (new, 13 checks)
The same file runs on both trees, using stand-ins for the new helpers on the old tree.
- **After:** 13 passed.
- **Before:** 5 passed, 8 FAILED. The failures are all the F1 checks:
  - second copy at link 2: target, and resolving YesNo;
  - opponent's copy at link 1;
  - rejected/cancelled activation with no link of ours;
  - a new chain whose link 1 is another instance;
  - removalDone;
  - intent link.
- **Controls pass on both trees:**
  - original link 1 target override;
  - link 1 control Yes;
  - Droplet cost stage;
  - different-code link (Linkage!);
  - bind only while ours is newest.
- Logs: tests/.

### 4. Fixture context corrected in b1-r2 / b1-r3 (two lines)
Their synthetic activation-stage prompts had no chain link. The native engine always has our link 1 at that point (all 5 native traces). The fixtures now carry it.
- Both files: 18/18 and 24/24 after the fix.
- Before the correction, the fix made 3 + 7 of their checks fail, only for the missing context.

### 5. Full suite at 73e2d07 (76 files)
SUITE.txt: exit code and time per file.
- **73 pass.**
- **3 fail, and all 3 also fail at 6e47453 (pre-existing).** All three are source-text pins of optimal-pilot.mjs, which r36 changed:
  - r23-fx (pin ed03a478 for optimal-pilot.mjs);
  - r35-cyclone-pin ("optimal-pilot.mjs minus the fix = the pinned r22b..r35.5 file");
  - r30-book-trust line 27 (the plan() text now also has `&&!this.midgameNoSearch(...)`).
- They are not behaviour failures. Claude did NOT re-pin them, since a re-pin needs review.
- **Question for ChatGPT/Seto:** does Seto's tests/ directory for 2705275 differ from the 18 patches (re-pins)?

## Finding B (new, for ChatGPT to rule on; not fixed here, outside F1's approved scope)
**In the browser, the played AI response never gets B1's follow-up.**

How the browser path works today (dist/worker.mjs and dist/ai/ai-worker.mjs at 6e47453):
- For every AI prompt, worker.mjs first runs its own local pilot: `publicDecision = pilots[seat].base(safeView(...))`.
- worker.mjs then asks ai-worker.mjs to think. ai-worker creates a **fresh** OptimalPilot for each think. Only `decisionCount` and the search roots are carried over.
- The ai-worker plan becomes the played decision (`plan = x.plan`).
- After it is played, worker.mjs calls `pilots[seat].observe(decision)` on its LOCAL pilot. So the local pilot's `pendingRemoval` is armed (the plan carries `removalIntent`), and its base() binds and clears it.
- But the local base() result (publicDecision) is used only on the fallback path (think error or timeout). The ai-worker's fresh pilot never has `pendingRemoval`, so the response actually played is never followed up.

Consequences:
- Harness, trace and h2h measurements of Arm B use persistent pilots that are observed, so they include the follow-up. The browser Enhanced AI would not.
- F1 itself cannot affect the played move in the browser today. It can affect the fallback path.
- r35's `pendingAttack` has the same harness-vs-browser difference. It is base (Classic) behaviour, so Claude proposes NOT to change it. Classic must stay r35.12.

**Proposal**, as part of the Enhanced recipe (selector package):
- worker.mjs passes its local pilot's `pendingRemoval` in the think message, only when the duel's mode is Enhanced.
- ai-worker sets it on the fresh pilot before plan().
- This is small, and Classic is unaffected.

**Question for ChatGPT:** agree, or prefer a separate item?

## Files
- 0001-…patch
- F1.diff
- native/{before,after}
- b1-controls/{before,after}
- tests/ (r36-f1 before/after)
- suite/ (SUITE.txt plus 76 logs)
- SHA256SUMS

Claude. Nothing published.

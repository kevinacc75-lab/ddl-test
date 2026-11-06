STATUS: OPEN - for ChatGPT's independent review
ANSWER BY: ChatGPT (RELAY-115 tool-only acceptance requirements for S2 v3)

# r36 S2 v3: LP fixture + d1/d2/f - Claude (builder while Seto is out) - Fri 6 Nov 2026 AEDT

SELF-VERIFIED by the builder only. **Tools/tests only:** dist is unchanged. It equals the live PREVIEW 2, in-folder 2bb4a431e26f8b0e01158bf8db0cd305dabfd89b5ee4c18d31aff4bbb7464360 (498 files). Nothing is published.

## Identity
| | |
|---|---|
| patches/ | 0001 = cf8d238 (PREVIEW 2 labels / help / cache / test pin; already served and reported 17:10 AEDT); 0002 = **d9ec412** (S2 v3). Base f9d42d4 (RELAY-113 accepted). |
| final-sources/ | the exact final r36-s2-puzzles.mjs (f9802b1e…), r36-s2-validity.test.mjs (9b8bcc1b…), r36-s4-e.test.mjs and r36-ai-mode.test.mjs, so the test chain reproduces without accommodation |
| runtime | Node v22.22.2; native OCG core as bundled in dist |

## RELAY-115 requirements: how each is met
1. **`lp:[p0,p1]` is in LOGICAL seats**, validated by `checkLP()`: exactly two positive integers up to 1,000,000; default 8000/8000.
   - The engine team mapping is `order=first===0?[0,1]:[1,0]`, the same rule as Duel.start, and it is asserted equal to `d.order` after start.
   - `core.createDuel` is wrapped only for that start, with every other option preserved: team1 gets `want[order[0]]` and team2 gets `want[order[1]]`.
   - The wrapper and the placement wrapper are restored in `finally` (also on constructor/start errors), and a stale-wrapper check follows.
2. **Native verification.**
   - `nativeLP()` reads `core.duelQueryField(d.handle).players[e].lp` and maps it with `d.fromEngine(e)`. Setup LP must equal the request, or setup fails and the run is INVALID.
   - Only then is `d.lp` synced FROM that verified engine state, before any pilot, seat context or snapshot exists.
   - Native vs wrapper LP is recorded again at the own-turn start and at completion (`lpCheck`). `classify()` makes any disagreement, missing value or setup!=requested INVALID before the predicate runs.
3. **Search.**
   - Puzzles with a non-default `lp` are **search-off only**: `--search N` (N > 0) with d1 or f is an INVALID SELECTION (exit 2).
   - No claim is made about non-default-LP search roots. Default-LP puzzles (incl. d2) still run with search.
4. **Activation evidence.**
   - Activations come from the engine's chain (each new link: code, controller, link number, step), not from labels. f uses card code **70368879**.
   - Idle offers record the codes of activatable cards. Sets are not counted.
5. **Negative tests** (tests/r36-s2-validity.test.mjs, **18/18**):
   - checkLP rejects missing, extra, zero, negative, fractional and non-numeric values.
   - INVALID for: start/end native != wrapper, setup != requested (including swapped seats), missing lpCheck, null native.
   - f: wrong winner mapping (winner 1) FAILs; a seat-0 Upstart activation FAILs; Upstart not offered FAILs; an opponent's Upstart does not count.
   - Search with an LP puzzle gives exit 2.
   - **Native, one process, first=1:** d1 then d2. d1's engine-verified setup LP is [2000,8000] in logical seats, and native = wrapper. d2 is [8000,8000] (no leakage).
   - The earlier exact-matrix, invalid-selection and gate checks are unchanged.

## Results
Puzzle grid in puzzles/: **56 runs, 0 INVALID; matrix = requested each time.**
- f0 s0: 20 runs, PASS 17, FAIL 3.
- f1 s0: 20 runs, PASS 17, FAIL 3.
- s100 (default-LP puzzles only): 16 runs, PASS 14, FAIL 2.

| puzzle | Classic | Enhanced |
|---|---|---|
| d1: Ohime at our LP 2000 | PASS (offered, not taken), both mappings | PASS, both mappings |
| d2: unequipped Hu-Li | PASS (attack, Hu-Li to GY, no LP change), both mappings, s100 | PASS, both mappings, s100 |
| **f: lethal before Upstart** | **FAIL, both mappings** | **PASS, both mappings** (attack, duel finished, winner logical seat 0, opp LP 0) |
| a/a2/b/b2/e/e2/e3 | as in RELAY-113 (e/e3 FAIL by design) | PASS |

**f, Classic (the counterfactual you described), from the engine:**
- Upstart Goblin (70368879) is activated by seat 0 at step 10. The attack is declared at step 17.
- Opponent LP: native 2500 at the start -> 3500 -> 1000 at turn end (native = wrapper throughout). No lethal.
- Enhanced attacks first and wins. This is the clearest S2 evidence so far of the 4 Nov "redundant plays" problem (F-B) on a fixed state.

**Full suite at d9ec412: 81/81 exit 0** (suite/).

## Limits (as you set them)
- **d1/d2 are a pair of relevant cases. They do NOT isolate equip-reading**: monster identity and our LP both change between them. The matched equipped/unequipped Hu-Li control at the same LP, with an engine-established equip relation, is **not built yet**. No claim about reading the equip condition.
- Opponent declines are scripted (not adversarial coverage). The fixtures are controlled synthetic ones with no proper summon history.
- c (own Kaiju lock) stays ungated, pending a separate deck / out / history analysis.

## Also done
- CORRECTIONS T-D4 has your addendum (equip-satisfied Hu-Li/Ha-Re reflection vs "Water Arabesque reflects"; the 4 Nov cause stays unverified): ddl-test 3751a8e.

Claude. Nothing published.

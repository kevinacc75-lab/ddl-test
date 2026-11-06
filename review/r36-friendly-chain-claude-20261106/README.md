STATUS: OPEN - for ChatGPT's independent review
ANSWER BY: ChatGPT (RELAY-117: bounded correction + friendly-vs-enemy chain regression control)

# r36 S4 flag F: friendly-chain guard - Claude (builder while Seto is out) - Fri 6 Nov 2026 AEDT

SELF-VERIFIED by the builder only. **Not published.** The live PREVIEW 2 (2bb4a431) is unchanged. A republish needs your acceptance AND Kevy's OK.

## Identity
- **Commit:** r36-enh-claude **2654867**, on d9ec412 (S2 v3, RELAY-116). The patch is in patches/.
- **dist in-folder:** **d40ee2077496d3c136a7e33a8262f7f97ad7b86296cecd74c5ff70484f02430e** (498 files).
- **Changed dist files:** s4-flags.mjs, midgame-flags.mjs, midgame-rules.mjs (F-dist.diff). optimal-pilot.mjs, tactics.mjs and the worker files are unchanged.
- **Fixture:** tests/fixtures/r36-relay117/replay71091.json, your RELAY-117 Appendix B export parsed to JSON. sha256 461cf9b654645aa21a68f84b39e4239a2b8c783c550322754289e970fb5df44f.
- **Runtime:** Node v22.22.2.

## Reproduction (your RELAY-117 case)
- **Replay.** Your 71091 export replays exactly on this build: 518 responses accepted, winner logical seat 0, LP 6200/0, turn 8.
- **The prompt.** Response 127, turn 3, Draw phase. Seat 0 (Sky) has a SELECT_CHAIN with the open chain = [Sky Striker Ace = Zero (76072561), controller 0] only. The choices are "Chain · Ash Blossom & Joyous Spring" and "Do not chain".
- **The decision path at that prompt:**

| mode | search | base() | played (plan) |
|---|---|---|---|
| Classic | off | Do not chain ("Save the interruption": "...avoids negating its own effect...") | Do not chain |
| Enhanced | off | Do not chain | Do not chain |
| **Classic** | **100 nodes** | Do not chain | **Chain · Ash** ("Information-set root search") |
| **Enhanced (PREVIEW 2)** | **100 nodes** | Do not chain | **Chain · Ash** |

- **Root cause:** the information-set root search overrides the base pilot's own-chain decline. Controller attribution is correct: the chain link controller is seat 0 and the base pilot recognises it.
- **Not an Enhanced regression:** Classic does the same (r35 behaviour). No matched full A/B game was run; the per-prompt check above is the A/B evidence.

## The bounded correction: S4 flag F (Enhanced only)
`friendlyChainNoSearch(view, seat, baseline)` in midgame-rules.mjs returns `'friendlyChainNoSearch'` only when ALL of these hold:
- S4.F is on;
- the prompt is SELECT_CHAIN;
- every open (unsolved) chain link is ours, and there is at least one;
- the base decision is exactly the "Do not chain" response;
- at least one offered response's card text contains "negate".

It is checked first in `battleNoSearch` (the existing Enhanced no-search hook used by optimal-pilot's `midgameNoSearch`), so the base decline is played without search.

**What does not change:**
- When the base itself chooses to chain, nothing is overridden.
- With an opposing open link, nothing changes.
- With no negating card on offer, nothing changes.

**Recipe:** AI_S4 = Classic {E:false, F:false}, Enhanced {E:true, F:true}. setAiMode still resets the whole map at duel start, import-replay and every think.

## Tests
**tests/r36-friendly-chain.test.mjs (new): 7/7.**
1. The mode maps; F is Enhanced only.
2. The fixture replays exactly (518 responses, 6200-0, turn 8).
3. The RELAY-117 prompt state is as described.
4. **Friendly:** Enhanced with search 100 now plays "Do not chain"; the guard is counted once.
5. **Friendly, Classic with search 100:** still chains its own Ash. This is kept unchanged by policy (Classic = r35.12) and documented as a known Classic defect.
6. **Enemy control (response 306, turn 5):** the open chain is the opponent's Ohime. The guard returns null and is not counted with search 100, so Ash against the opponent stays available.
7. **The pure guard's conditions:** F off, an opposing link open, no negating card, not a chain prompt, and the base itself chaining each return null. It is wired into battleNoSearch.

**Updated for the new map:** r36-ai-mode (12/12) and r36-s4-e (pass).

**Full suite at 2654867: 82/82 exit 0** (suite/).

**S2 grid (puzzles/), both mappings:** 40 runs, 0 INVALID, matrix = requested, PASS 34 / FAIL 6 (only the known Classic e/e3/f). This is unchanged from RELAY-116.

**Classic parity spot check** (parity/): 71003 = f51dcf33…, 245 decisions = r35.12.

## Limits
- "negate" is detected from card text. This covers Ash, and also any negator a deck runs, for this guard's single purpose: not overriding the base pilot's own-chain decline. It is not a general model of negation.
- The other friendly-chain prompts in this replay (118 Shizuku, 263 Pot of Desires) were already declined by the played decision.
- The browser played the search with a time budget. This test uses a fixed node budget (100), so a naturally timed browser rerun is not claimed to reproduce move for move.
- The Classic own-Ash defect remains in Classic by policy. Changing Classic would need Kevy's decision.

## Also queued (not in this package)
Your RELAY-117 label request: an explicit active-AI label in the duel arena, and mode/build metadata in exported replays. This touches app.mjs/worker.mjs, which are pinned, so it comes as a separate, small package.

Claude. Nothing published.

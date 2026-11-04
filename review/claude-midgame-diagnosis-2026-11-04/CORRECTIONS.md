# Corrections - Claude, Wed 4 Nov 2026 ~14:20 WITA (after ChatGPT RELAY-105)

Raw traces in traces/ are unchanged. These corrections apply to the README summary and the tool.

1. **T-D1: duplicated terminal turn. Fixed in tools/trace.mjs (v2).**
   - The old logger pushed the last turn at the cap and then pushed it again after the loop.
   - Two capped files show the duplicate (turn 16): AB-kashtira-branded-71086-0.json and sky-mikanko-71087-1.json.
   - Unique turn-3+ observations are **54 AB / 52 base**, not 55 / 53. The flag counts don't change, because the duplicated rows carry no flags.
   - **Fixture** (cap-fixture/): luna vs toon, dev seed 71088, max-turn 2, 200 ms.
     - The old tool records turns [(1,0),(2,1),(2,1)], with the duplicate.
     - The fixed tool records [(1,0),(2,1)].
     - This is a real short duel, not synthetic. It is a bookkeeping check only.
2. **SHA256SUMS had 23 entries, not 22.** My note miscounted.
3. **T-D2: the Kaiju narrative is narrowed.** In AB Sky-Kashtira, Sky's own turns in that span are 5, 7 and 9.
   - On T5 it entered battle and attacked with Radian.
   - On T7 and T9 a summon and a Radian attack were offered.
   - "Only passed" was wrong. The records also do not prove that a legal way to clear the Kaiju existed. It stays a lead for an S2 puzzle that has a no-legal-out control.
4. **T-D3: the flags only locate candidates; they are not confirmed mistakes.**
   - DEF_SWITCH does not check the resulting position.
   - OPEN_BOARD uses end-of-turn snapshots.
   - Churn ignores resource and lock value.
   - The self-damage flags name no damage source.
5. **Replay limitation.** The traces keep top-level titles and snapshots, not complete response streams. They are not natively replayable and not an A/B verdict.
6. **Hidden information.** The snapshots show both hands. Any critique must judge a decision only on what that player could know.

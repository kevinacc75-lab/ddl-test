# World-pool contract (r34 world-pool fix)

**Branch:** `r34-worldpool-fix` (commits 1325754 and 60a152e).
**Author:** Claude, 28 Oct 2026, for Seto's queue item 1 and the RELAY-045 notes. Wording edits from RELAY-052 applied.
**Why a separate file:** this note deliberately isn't a comment in `dist/ai/world-pool.mjs`. Any edit there would change the gated bytes (sha256 `807133d3…4000b8`) that the running S2a gate and the split runner pin.

## The contract

**One active duel per world-pool module instance.** Run parallel duels in separate workers or processes, never side by side in one module instance.

Why it holds:

- `poolFor(key)` keeps at most `MAX_POOLS = 2` pools, one per seat.
- When it creates a pool for a new duel, it first drops every pool whose key has a different first part (the text before the first `|`). See world-pool.mjs lines 371–380.
- So two duels sharing one module instance would keep evicting each other's pools. That costs search quality and makes results depend on how the two duels interleave.

| Caller | Pool key | Where the key comes from | One duel per instance because… |
|---|---|---|---|
| Headless (gate, tools) | `duelN\|seat\|size` | `duelIdentity(d)`, exported by world-pool.mjs and called by optimal-pilot.mjs | the gate plays duels one after another in one process |
| Live (browser) | `live:<duelId>\|seat\|size` | ai-worker.mjs line 16, `poolKey` | each AI worker serves one on-screen duel at a time |

## What the fix covers, and what it doesn't

**Covered: headless determinism in the sequential gate.** The three pool random streams are seeded from `seedKey`, which is the key with any leading `duelN|` counter replaced by `duel|`. Those streams are:

- the identity swap, line 124;
- the sibling repair, line 168;
- the advance replay, line 205.

For the same headless gate job, fixed build/settings and deterministic execution path, changing only the process-wide duel counter no longer changes these three pool RNG streams. (A seed alone doesn't identify a duel: the pairing, first seat and other settings matter too.) Evidence:

- Seto's 32/32 check (25 Oct).
- The fix-build gate's S2b PASS (26 Oct): all 8 seeds identical over 4 passes.

**Not covered: live keys.** Live keys still carry a counter. worker.mjs bumps `duelSerial` on start and import, and the duel reaches `poolFor` as `live:<duelId>`. This was true before the fix too, so it isn't a regression. But don't describe the fix as making every mode independent of the counter. Any change to live keys is a separate candidate with its own review.

**Not proof that the memory problem is cured.** Dropping an earlier duel's pools in one go (60a152e) is memory hygiene. A 200-duel gate completed across restarted shards does not demonstrate 200-duel continuous-process memory stability. Any memory claim must state per-process lifetime, restarts and the memory measurements actually collected.

## Rules for future changes

1. **Never seed a pool random stream from `key`; always use `seedKey`.** A test is needed: the same headless gate job (same seed, pairing, first seat and settings) must give the same hash when played as duel 1 and as duel N in one process (see `tools/r35-determinism-probe.mjs`).
2. **To run several duels at once, give each its own worker or process,** each with its own module instance. Don't share pools across duels.
3. **Changing the key format** (`duelIdentity`, the live `poolKey`, or the `|` separator) changes both eviction and seeding. It needs a determinism probe and its own independent review.
4. **Any edit to `dist/ai/world-pool.mjs` changes the gated hash.** It must go through a new gate run. It can't be dropped into the build being gated.

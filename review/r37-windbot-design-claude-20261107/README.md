# r37 research: our AI vs WindBot (scripted bot). Design for review (Claude as builder; SELF-VERIFIED)

**The question (Kevy, 7 Nov 21:53 AEDT):** our AI "isn't making the optimal play". Can it beat a scripted, Nyx-style bot? If it
can't, the scripted approach that other sites use is the stronger one.

## What WindBot is

- The open-source YGOPro/EDOPro bot, ProjectIgnis fork `bffe6b6`, MIT licence. Built unmodified for .NET 8 (`WINDBOT-SOURCE.txt`).
- Each deck has a hand-written C# "executor": per-card checks and priorities.
- Executors exist for 5 decks we can run: **SkyStriker, Kashtira, BlueEyes, BE2025, Albaz (Branded)**.
- Nyx (Dueling Nexus) is not open source, so we can't confirm that it works the same way. WindBot is the public example of the scripted method.

## The bridge (`tools/bridge.mjs`, `tools/match.mjs`; r36-mid branch r37-windbot, commit 8af50e8)

- WindBot connects over TCP to a **minimal EDOPro host** written in Node. The host runs the duel on **our engine**: `dist/duel.mjs` and the
  same ocgcore WASM build as the site.
- **Lobby:** JOIN_GAME (host info, MR5 flags), then UPDATE_DECK, TYPE_CHANGE and HS_READY. RPS and the turn-player choice are skipped: the seat and the go-first player
  are fixed by the run. MSG_START type = the bot's engine team.
- **Message routing:** a line-by-line port of EDOPro `gframe/generic_duel.cpp` Before/Sending/AfterParsing, for one recipient.
  - Who receives what follows EDOPro: select prompts go to the selecting player only; hints are routed by type.
  - The same codes are zeroed as in EDOPro: MOVE to a hidden place, SET, a face-down SPSUMMONING, DRAW, SHUFFLE_HAND/EXTRA, opponents' cards in SELECT_CARD, TRIBUTE and UNSELECT, and deck/extra CONFIRM_CARDS.
  - The same MSG_UPDATE_DATA and MSG_UPDATE_CARD refreshes are sent at the same points, with the same flags (0x3981fff etc.).
  - The same public/private query filtering is applied, ported from `core_utils.cpp` `Query::GenerateBuffer`.
- **Responses:** WindBot's binary responses are decoded into our engine's response objects (inverse of the core library's
  encoder) and given to `Duel.respond`, exactly like any other answer. Logs, knowledge and our AI's view of public actions
  are therefore the same as in a normal duel.
- **Our seat:** OptimalPilot with the r36-h2h settings: search on, world pool, node budget 400, 1500 ms deadline, Enhanced recipe.
- **Bridge-only engine copy:** `dist/` is hard-linked into a scratch tree, and only `core/index.js` is changed. It gets a raw-message hook,
  raw location/card queries, and **one parser fix (see below)**. The shipped `dist/` is not changed.

## Finding 1: a parser bug in the engine library (it also affects the site)

The core writes **MSG_SHUFFLE_SET_CARD**'s count as a **u8**. EDOPro's `duelclient.cpp` and WindBot both read a u8, but our
`dist/core/index.js` parser reads `e.u32()`. When an effect shuffles Set cards, it reads past the end, throws `eof`, and **the duel stops**.

- Reproduced in a Sky Striker mirror (seed 71001, f1).
- Raw message: `24 08 03 …` (63 bytes = 1 + 1 + 1 + 3×20).
- The bridge copy patches `length:e.u32()` → `e.u8()` for this message only. The same game then completes normally.
- **Not fixed on the site yet.** Doing that needs a reviewed change to the pinned core file. I propose it as a separate item.

## Smoke results (seed 71001, Sky Striker mirror, WindBot's list; `smoke/`)

| WindBot seat | First | Result | Turns |
|---|---|---|---|
| 1 | 0 | WindBot wins | 14 |
| 0 | 0 | ours wins | 4 |
| 1 | 1 | WindBot wins | 9 |
| 0 | 1 | ours wins | 9 |

- Seat 1 won all 4 games, whichever AI held it. At this seed the deal decided the result, not the AI.
- Across these 4 full games plus an 8-turn test game: 0 rejected responses from either side and 0 script errors.
- In `smoke-1.jsonl`, the first f1 row is the parser crash. It was re-run in `smoke-2.jsonl` after the fix.

## Decklists

All five WindBot lists **break the 19 Oct TCG list**. For example, Sky Striker runs 3 Maxx "C", 3 Hornet Drones, 3 Engage! and Halqifibrax.
Kashtira runs 2 Arise-Heart, 3 Diablosis, Dimension Shifter, and more.

- **The primary comparison uses WindBot's own lists as a mirror** (both AIs play the identical 40 + 15). Its scripts were written for those lists, and using them is not a legality claim.
- A legal-list variant is optional, as a second phase.

## Proposed pre-registered confirmation (for ChatGPT's review; nothing below has been run)

- **Matchups:** 5 mirrors (SkyStriker, Kashtira, BlueEyes, BE2025, Albaz). Each AI plays each seat for both go-first orders.
- **Seeds:** 8 fresh seeds per deck, chosen by ChatGPT, so 32 games per deck and 160 in total. Settings as above. Max turn 30, with a turn cap counted as undecided. Concurrency 2, same machine.
- **Validity:**
  - Every game has 0 bridge or engine errors, or is reported and excluded as "error" with its raw evidence. No re-runs.
  - WindBot rejected responses are counted. A game with more than 5 is an error.
- **Reported outcomes** (descriptive; no promotion depends on this):
  1. WindBot wins vs our wins among decided games, overall and per deck.
  2. Paired reading per (seed, first): the same AI won from both seats ("AI-decided") vs deck-decided. AI-decided pairs are counted for each side, with a two-sided sign test.
  3. Turns to win, and the share of games each AI wins on turns ≤ 5.
- **Exploratory runs** (clearly labelled, not evidence) are running now on dev seeds 71001-71003. They check robustness across all five executors.

## Corrections (8 Nov 2026, Claude; found while building the in-browser pilot)

1. **Licence.** The ProjectIgnis fork, "WindBot Ignite", is **AGPL-3.0-or-later**. It builds on IceYGO's MIT-licensed original, but the fork itself is not MIT. Above I wrote "MIT licence", which was wrong. The site build ships WindBot's complete source, `wb/windbot-source.zip` (r37), and its licence, `licenses/windbot.txt`.
2. **Executor name.** WindBot has no executor called `BlueEyes`; the real name is `Blue-Eyes`.
   - When given an unknown name, WindBot loads a **random** script and only logs "Deck not found". So the 8 exploratory "BlueEyes" games (x1, 71001/71002) were played by a random script. **They are void.**
   - `match.mjs` now refuses to run a game unless WindBot logs "Deck found, loading <name>". The five executors are SkyStriker, Kashtira, Blue-Eyes, BE2025 and Albaz.
3. **Smoke table.** In the smoke table, the WindBot seat 0 / first 1 cell was played twice:
   - in `smoke-1`, WindBot won in 18 turns;
   - in `smoke-2`, ours won in 9 turns.

   The table above shows only the second result. Under the rule that the first valid result counts, that cell is a **WindBot** win. Seat 1 did not win all 4 games; the paired reading for first=1 is "WindBot won from both seats".

   This also shows that **native WindBot is not reproducible**. Its `Program.Rand` is unseeded, so the same deal can go either way. The browser build seeds it per duel.
4. **Second engine-library parser bug: MSG_SELECT_SUM.** It also affects the site. The engine writes the must-select cards **first**, and each card with a full location (including a u32 position) before its sum value. The JS library read the selectable list first and skipped the position.
   - With 2 or more cards, every value after the first card was garbage, so our pilot found no material set and stalled. This was the BE2025 "no response (ours)" game, which reproduced 3/3.
   - Ritual summons by level total use this prompt (proc_ritual.lua `SelectWithSumEqual/Greater`).
   - The fix and its behaviour test are in r37 (`tools/windbot/core-patch.mjs`, `tests/r37-windbot.test.mjs`).
   - Also fixed in r37: MSG_SHUFFLE_SET_CARD now reads all previous locations, then all new ones (libduel.cpp). Before, it read them interleaved, which garbled the card positions but did not crash.

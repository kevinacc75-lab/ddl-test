# r37: WindBot as a pilot choice, plus two engine-library parser fixes (Claude as builder; SELF-VERIFIED; published at Kevy's request)

**Kevy, 7 Nov 21:57 AEDT:** "we could have it that I can select our AI to pilot Deck A and then set Windbot to pilot Deck B, so that I can watch the two vs in real time". All upgrades were pre-approved at 19:11.

**Where it is:**
- Published at `/r37/`. `/r36.2/` is unchanged.
- Source: r36-mid branch `r37-windbot`, commit `e6e610a`. dist tree `12b49613`.
- Served check: 557 of 557 files match (`SERVED-SHA256-r37.txt`).

**Requested from ChatGPT:** a review of the two parser fixes (they change engine behaviour for every pilot), and a review of the pilot integration.

## What changed (dist, relative to r36.2 `5de815c`; text diff in `dist-since-r36.2-text.diff`)

### 1. `core/index.js` (via `tools/windbot/core-patch.mjs`; the same patch builds the research bridge)

- **Raw hook (inert unless set).**
  - `duelGetMessage` passes the raw batch to `globalThis.__ocgRawHook` when the hook is set. With no hook, the only addition is one property read per batch.
  - `duelQueryLocationRaw` and `duelQueryRaw` are added.
- **FIX MSG_SELECT_SUM (23).**
  - The engine (`playerop.cpp` SelectSum) writes the must-select cards **first**, then the selectable ones. Each card has a full `loc_info` (c u8, l u8, s u32, **pos u32**) before its sum value. EDOPro `duelclient.cpp` and WindBot read it this way.
  - The library read the selectable list first and had no position field. With 2 or more cards, every value after the first card was garbage, `sumSelections` found no set, and the pilot stalled ("This pilot needs help").
  - `proc_ritual.lua` uses this prompt (`SelectWithSumEqual`/`SelectWithSumGreater`) for ritual summons with free zones.
  - Raw bytes captured in a WindBot game: `17 00 00 08000000 01000000 02000000 | 00000000 | 02000000 a3a95705 00 04 00000000 01000000 08000000 …` (must = 0, then 2 selectable cards of 18 bytes each).
- **FIX MSG_SHUFFLE_SET_CARD (36).**
  - The engine (`libduel.cpp`) writes a **u8** count, then all previous locations, then all new locations.
  - The library read a u32 count, so it read past the end and threw `eof`, which **stopped the duel**. It also read the locations interleaved.

### 2. `duel.mjs`

- `wireResponse`: our SELECT_SUM response objects index `[must…, selectable…]`. This is the convention of `pilot.sumSelections`, the human picker and `semantic.mjs`.
- The engine reads indices into the selectable list only (`parse_response_cards` over `select_cards`).
- The must cards are dropped and the rest shifted. When there are no must cards, nothing changes.
- `responseHistory` keeps our objects, so replays are unchanged.

### 3. `windbot/` (new)

- **`edo.mjs`:** the EDOPro host for one bot, portable across browser and Node. `tools/windbot/bridge.mjs` now imports it, so the research harness and the site use one source. It contains:
  - EdoRouter, a port of `generic_duel.cpp` Before/Sending/AfterParsing plus `core_utils` query filtering;
  - `decodeResponse` (SELECT_SUM mapped into our index space);
  - `lobby`;
  - `cardRows`;
  - `WasmWindBot`.
- **`pilot.mjs`:** WindBotPilot, with the same interface the worker uses for our pilots (`plan`, `observe`, `info`, `base`).
  - Each duel start or rewind gets a fresh bot, lobby and router.
  - A rejected answer re-sends the prompt (at most 5 per duel).
  - Each decision object comes from `buildPlan`, so the coach and the export work unchanged.
- **`decks.mjs`:** sky → SkyStriker, branded → Albaz, blueeyes → BE2025, kashtira → Kashtira. These were chosen by card overlap with WindBot's own lists.
  - WindBot plays **the site's TCG 19 Oct list** with that archetype's script.
- **`ui.mjs`:** a Pilot select under each deck (Our AI / WindBot · scripted bot). WindBot is disabled:
  - for decks without a script;
  - for your own seat in Play;
  - in Control both seats.

  The choice is remembered (localStorage, try/catch).

### 4. `worker.mjs`

- `pilots: ['ai'|'windbot', …]` on start.
- `armWindBots` runs before `duel.start` (and before a rewind's replay). A WindBot seat answers synchronously in `planned()`; the AI think worker is not used for it.
- Import-replay switches WindBot off. A replay steps through its recorded choices.
- `stop` disarms the bots.
- The exported replay records `pilots` as information only.
- `BUILD 'ddl-test r37 2026-11-08-r37'`.

### 5. `app.mjs`, `index.html`, `sw.js`, `offline-assets.json`

- The start message carries `pilotKinds()`. A saved replay always starts with `['ai','ai']`.
- The credits name WindBot Ignite (AGPL-3.0) and link its source.
- r37 title, badge and cache.
- The windbot modules and licence are listed for offline use. `wb/_framework` is not: it is 8 MB and loaded on demand.

### 6. `wb/` and `licenses/windbot.txt`

- The browser build of **WindBot Ignite** (ProjectIgnis `bffe6b6`, **AGPL-3.0-or-later**; the original IceYGO code was MIT).
  - The game logic and all deck executors are **unmodified**.
  - Built for .NET 8 browser-wasm, trimmed: 40 files, 8.3 MB.
  - It is loaded only when a duel uses WindBot.
- `wb/windbot-source.zip` is the complete corresponding source (upstream tree plus `_browser-build/`: csproj, WebBot.cs, BUILD.txt).
  - WebBot.cs replaces only the TCP client, the SQLite card DB and the Program statics.
  - `Program.Rand` is seeded per duel.
- `wb/default.json` is WindBot's dialog file.

## Tests (suite 87/87, `suite/node-test-87.tap`)

**New: `tests/r37-windbot.test.mjs`** (`suite/r37-windbot.json`).

- **A. SELECT_SUM, as a behaviour test on the real engine.** The method is the same as for the r21c/r22 wrapper fixes. Chaos Form → Blue-Eyes Chaos MAX Dragon, with 2 Level 4 monsters on the field (plus hand).
  - **Fixed:** the prompt lists 7 cards, each with the right code, location and Level 4, and the field ones are face-up ATK. The pilot finds sets, the engine accepts the first one, and MAX is on the field.
  - **Pre-r37 parser** (the fix reverted in a temporary copy): `selects` is empty, `selects_must` holds garbage (`[69247929,4,10,2,33555488,…]`), and there are **0 material sets**, so the pilot stalls.
- **B. SHUFFLE_SET_CARD source form**, and the raw hook is present exactly once.
- **C. `edo.mjs` units.**
  - WindBot SUM answer → our space → engine, for example `[0,1,3]` → `[0,2]` with 1 must card. With no must cards or other prompts, nothing changes.
  - EDOPro hiding: the opponent's face-down draws are zeroed for the bot, its own are kept, and select hints go to the selecting player only.
  - The hook is unset by default.
- **D. WindBot plays a real duel in Node** through `WindBotPilot`: Branded seat vs our pilot (search off), seed 71077.
  - WindBot logs "Deck found, loading AI_Albaz" and makes 111 decisions.
  - 0 rejected, 0 stalled. The duel finished on turn 4.

**Bounded pins**, same method as RELAY-107/108:
- The r36 patches were regenerated (`git diff d3177e0`). `duel.mjs` was added with its r35.12 hash `f0a07184…`.
- New r37 patches against r36.2 (`tests/fixtures/r37-pins`, `git diff 5de815c`) let the r36 selector test undo exactly r37 and keep testing exactly what it tested.
- The r36.2 index pin is still checked, on the r37 file minus its reviewed patch.
- The replay build string was updated.

## Browser checks (Chromium; `browser/`)

| Where | Deck A (pilot) | Deck B (pilot) | Seed / first / pace | Result | Errors |
|---|---|---|---|---|---|
| local | Sky (Our AI) | Branded (WindBot) | 71011 / 0 / Instant | complete, Branded won T7 | 0 |
| local | Blue-Eyes (WindBot) | Kashtira (Our AI) | 71012 / 1 / Instant | complete, Kashtira won | 0 |
| local | Sky (WindBot) | Branded (WindBot) | 71013 / 0 / Instant | complete, both scripts loaded | 0 |
| local | Play: you = Kashtira | Sky (WindBot) | 71014 / 1 / Duel | WindBot played turn 1, then "YOUR MOVE" with choices | 0 |
| **live /r37/** | Sky (Our AI) | Branded (WindBot) | 71011 / 0 / Instant | complete, Sky won T5 (our AI's search is time-bounded, so results vary with load) | 0 |

- The coach panel shows "WindBot · … script · no search" for the WindBot seat.
- Panel screenshots: Watch and Play (your seat's WindBot option is disabled).

## Known limits

- WindBot's scripts were written for **its own** lists. On our lists, cards outside its script get WindBot's generic default handling.
- The research uses WindBot's own lists (mirror) as the primary comparison and our lists as a second phase.
- A rewind replays the duel from the start into a fresh bot. WindBot's internal "already used" flags may then differ slightly from the first pass; the engine state is exact.
- The coach header still says "SERIOUS PILOT" for both pilots. That line is a fixed label in `app.mjs`, left unchanged to keep the diff small.
- Classic, Enhanced and the frozen gate are unchanged. The parser fix changes engine *messages* for every pilot. It only affects games that reach SELECT_SUM with 2 or more cards (which previously stalled) or SHUFFLE_SET_CARD (which previously stopped the duel).

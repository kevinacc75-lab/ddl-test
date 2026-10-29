# r35.7 to r35.10 review package: Time Typhoon, art, coin cutscene, P5, titles (+ the RELAY-068 audio fix, unpublished)

**Builder:** Claude. **Status:** SELF-VERIFIED. Every result here is the builder's own; nothing is independently verified yet.
**Source:** r18 branch `r36-dtw`, from r35.6 `a96066b`.

| Build | Branch head | Published | In-folder dist sha256 | Served bytes |
|---|---|---|---|---|
| r35.7 | `e439da5` | ddl-test `b56084b` /r35.7/ | `030c7b05…` | MATCH |
| r35.8 | `0d30c2b` | `28ea064` /r35.8/ | `9fcfa34b…` | MATCH |
| r35.9 | `b752530` | `745045b` /r35.9/ | `4b75e7e0…` | MATCH |
| r35.10 | `906039b` | `4f061d7` /r35.10/ | `c310eb5c6076a0144ac7b4de1fa4cd1f48e7b14c316127bfece12abfd041688d` | MATCH, 491 files |
| (not published) | `d645c14` | – | dist tree `95ce8a7b…` | – |

`d645c14` is r35.10 plus the RELAY-068 fix. It will ship as r35.11 after its own suite run.

All builds are TEST-only play-test previews, labelled self-verified, under Kevy's request ("I wish to watch it", 13:48 "Can I have the new link?") and his standing play-test OK. RC1, the frozen gate, the whitelist and pin 9337e197 are untouched, and the info-set guard is not in these builds.

## Contents
- `patches/`: 14 `git format-patch` files `a96066b..d645c14`. Card art and the two compressed data libraries are left out; their hashes are in `data-hashes.txt`, and the published /r35.10/ folder holds the bytes.
- `r35.6-to-r35.10.diff` and `r35.10-to-d645c14-audio-fix.diff`.
- `commits.txt`.
- `files/final/`: exact final files at `d645c14` for every reviewed file. `files/base-r35.6/` holds the same files at `a96066b`. `files/p5-before/` holds dtw-plan.mjs before P5 (`3af9401`).
- `suite-r36-906039b.txt` + `suite-logs/`: the full suite at the r35.10 head, Node v22.22.2, one run: **65/65 exit 0**, dist manifest `b50e594c…`.
  - `suite-r36-c973566-2failures.txt` is the run before, with 2 failures, both fixed in `906039b`:
    - two Time Typhoon captions over 64 characters;
    - a brain route source that was not a card name.
  - Both failures were present from r35.7. They are presentation text / brain data only and changed no plays.
- `titles-accounting.tsv`: all 34 RELAY-067 records, each once: kept or dropped and why.
- `evidence/`: identity rows, measurements, battle probes, full-duel baselines, smoke, screenshots (details below).
- `SHA256SUMS` for every file here.

## 1. Time Typhoon (r35.7). Kevy 10:48: "implement this deck, full AI brain and combo book etc same as the other decks"
- **Cards:**
  - 11 Beyond the Brave cards plus the Scapegoat Token row come from ProjectIgnis: BabelCDB `2e6f985a5537`, release-betb.cdb sha256 `939a3335…`; CardScripts `bc5d82d66842`.
  - Each script is unchanged below a 1-2 line header. The only addition is `local CARD_DARK_TIME_WIZARD=40235813`. No shared script changed.
  - Pins are in `tools/data/r36-betb-sources.json`.
  - The official TCG name is used: CXyz Hope Chaos Barian Dragon.
- **Correction to my 11:05 handover (the Jinzo scan claim):** the static scan flagged `Chain.IsTriggeringLocation` in **c24203749 (The Great Gallant Bandit)**, not in Jinzo. The bundled Jinzo is the unchanged upstream script. Its load test passes with no shim, and a control in `tests/r36-dtw-load.test.mjs` proves that a script calling that missing function does stop the duel.
- **Shared helper signatures:** the same as upstream for every helper the new scripts call. `Cost.DetachFromSelf` has a body difference upstream (`cost_detached_materials`), but none of the 11 scripts reads it.
- **Playbook corrections used:** Kevy's list is authoritative. The real card texts override the playbook:
  - Alligator is Lv5 WIND Dragon 1700/1500;
  - Panther is 2000/1600;
  - Fisherman is not a targeting shield;
  - Panther + Alligator cannot Xyz (Lv4 + Lv5).
- **Tests:**
  - `r36-dtw-native` .. `native5`: 34 native cases A–AC.
  - `r36-dtw-load`.
  - `r36-dtw-identity`: cards / scripts / decks minus the additions equal r35.6 byte for byte, also allowing for the 21 display-only `art` keys added in r35.8.
  - `r36-dtw-position` (P5).
  - `taskc-deck-legality`: 9 decks.
- **Not covered by a fixture yet:**
  - Reversal Box once per battle;
  - Exceed's Fusion-Material check (a script detail);
  - Graceful & Skull Dice exact numbers. These are now partly covered: `r36-coin` checks that the captured dice match the ATK drop of total × 200.

## 2. Card art (r35.8). Kevy 14:29: "Missing card arts"
- 21 cards already in our database had no art: no earlier deck used them.
- `tools/r36-add-dtw-art.py` added their art the same way as all existing art: the unedited YGOPRODeck 813×1185 jpg and an `art` key placed before `scriptSupported`. The sha256 of each is recorded in r36-betb-sources.json `artExistingCards`.
- `deck-cards.json` was out of date, so Time Typhoon was missing from the deck-list viewer. It has been rebuilt.
- The identity test now also checks art and viewer data for every card in the new deck. All 9 decks have art for every card.

## 3. Coin toss / dice roll cutscene (r35.9) and the RELAY-068 fix (d645c14)
- **Design:** see NOTE 1700. `coin-tap.mjs` (same conditions as ShuffleTap) captures the engine's TOSS_COIN / TOSS_DICE after the original handler runs.
  - The call comes from the duel's accepted response to the 60/61 prompt, read at drain time.
  - The card comes from resolvingChain.
  - **The result is never made or changed by the tap.**
  - `coinBatches` places each toss after the event it followed.
- **RELAY-068 (ChatGPT: Skip did not silence the coin sounds already scheduled):** fixed in `d645c14`.
  - The scene now owns one gain node. All its tones and noise go through it; the whoosh sample was replaced by a routed noise sweep.
  - `clear()`, which Skip, the next scene and reset all call, sets that node to 0 and disconnects it.
  - `tests/r36-coin-audio.test.mjs` uses the real Soundscape tone/noise code on a recording fake AudioContext:
    - 51 sources are scheduled, 2 of them starting more than 1 s later;
    - all of them go through the scene node;
    - after clear() none reaches the bus;
    - an unrelated tone keeps playing;
    - a new scene gets a fresh node.
  - This is a source-level test, not a real-device listening test.
- **Pins:** `tests/r36-coin-pin.test.mjs`. Taking exactly the coin lines out of app.mjs, presentation.mjs and worker.mjs gives the r35.8 bytes: `70f8d696` / `fedba78d` / `e56d1411`. r23-fx re-pins app.mjs, and r35-shuffle-skip compares presentation.mjs minus those lines with 628d40f.
- **Tests:** `tests/r36-coin.test.mjs` (real engine):
  - right and wrong call, and both call sides;
  - the same duel with and without the tap is identical;
  - dice match the ATK change;
  - a disarmed tap captures nothing; reset works; the tap binds to one duel;
  - the resolving link is used, not a resolved top link;
  - ordering.
- **Browser:** Chromium Watch mode, Time Typhoon vs Blue-Eyes seed 7: coin and dice scenes appeared with 0 page or console errors. Screenshots are in `evidence/`.
  - The first run named a resolved later link (Ash Blossom). That was fixed in `b752530`.

## 4. P5 (r35.10): Barian in Attack Position. Kevy 18:35 play-test: "a full board but doesn't attack"
- **Found by** `tools/r36-battle-probe.mjs`: Watch-like pilots, logging every Main / Battle choice from turn 3.
  - Seed 15: Barian (printed ATK 0, gains 1000 per material) was put in Defence by the base pilot's "printed ATK < 1500 → Defence" rule, and sat on an empty board.
- **Fix:** `dtwPosition` in dtw-plan.mjs, through the book pick hook. optimal-pilot.mjs is unchanged.
  - Summon only: when we choose a position for one of OUR monsters whose text says "gains N ATK for each material", choose Attack.
  - It does not handle later position changes. With summon-in-Attack, Barian never starts in Defence in these lines.
  - Current ATK is not used, because the card is not on the field yet at the position prompt.
- **Test:** `tests/r36-dtw-position.test.mjs`.
  - Control: another deck's seat still gets Defence for the same card.
  - The Time Typhoon pilot gets Attack, and the book overrides a Defence answer.
  - A Scapegoat Token keeps the base choice.
- **Not done (deliberately):** the generic version (Kerzebs, Gorgon). It would change other decks, so it is Arm P of Seto's 20:15 plan.

## 5. Effect titles (r35.10): ChatGPT RELAY-067
- RELAY-067's 34 records were re-keyed into `tools/data/relay-067-effect-titles.json`.
  - Kind and title are as given.
  - Each clause is cut from our card text between the record's own first and last words, so it is an exact substring by construction.
  - The file carries the source hash `9707b41d…`.
- The builder maps activated / activation-choice → effect and delayed-operation → delayed. Everything else keeps its own kind and is dropped.
- Result: **17 kept, 17 dropped**; `titles-accounting.tsv` lists every record once.
- `tests/r36-effect-titles.test.mjs` checks:
  - every kept record is present with its exact clause and title;
  - no dropped record became a title;
  - every other card's titles are byte-identical (hash of the rest of the map = r35.9).
- **Disclosed gap:** the 23 other Time Typhoon cards that had no title map before still have none.

## 6. Identity of the other 8 decks (r35.6 vs r36)
- Method: `probe-dump` paired runs; same seed, both builds, Node worker path. Seeds 401/402, both orders, 4 pairings.
- Result: **15 of 16 byte-identical** (responses sha256, log sha256, decisions, winner, LP).
  - The 16th, blueeyes/kashtira 402 first 1, timed out at 3000 s on both builds, so it is inconclusive.
  - Several rows end early with the known Node-tooling info-set error ("reading 'rejected'"). It happens identically on both builds. It is the issue the info-set guard addresses, and the guard is not in these builds.
  - The later rows ran on a worker that already includes the coin tap, so worker hashes differ by design; responses and logs match.
- Files: `evidence/identity-*.jsonl`, `evidence/id2-*.jsonl`.

## 7. Measurements (development evidence, not proof)
- **Book vs no book, tuning seeds 101-120, going first:** boss end board 11/20 with the book vs 2/20 without. Going second, the book run hit the time limit (lost; the audit tool now writes `.partial` per seed). The fresh-seed (301-320) run was not completed.
- **Smoke:** 96 full base-policy duels, Time Typhoon vs the 8 decks: 96 finished, 0 script errors, 0 failures (`evidence/smoke96-dtw.txt`).
- **Battle probes** (`evidence/battle-probe/`): 11 duels at 1500 ms and 400 ms.
- **Full-duel baseline for the midgame project** (`evidence/full-duel/`, metrics.py): the same 12 hands across all 9 decks at 1500 ms vs 300 ms think time.

| | 1500 ms | 300 ms |
|---|---|---|
| Average turns | 4.5 | 6.0 |
| Unfinished games | 0 | 2 |
| Games whose winner changed | – | 5 / 12 |
| Open-board skipped attacks | 0 | 1 |
| Defence-stuck attackers | 0 | 0 |

  - RELAY-070's caution applies: this changes the deadline on one machine. It does not measure tablet hardware, and the attribution to Kevy's tablet is provisional.

## 8. Found, not fixed
- The event log shows Xyz materials as "Monster zone → Extra Deck" (duel.mjs `LOC`). A duel.mjs change needs Alexis and an identity proof first.
- `offline-assets.json` does not list `ai/book/mikanko-plan.mjs`, `kitt-revive.mjs`, `turn-ledger.mjs` or `public-identity.mjs`. This is pre-existing; offline mode may miss them.

## Requested
- **ChatGPT:** code review of P5 (section 4), the title integration (section 5) and the coin cutscene with the RELAY-068 fix (section 3), with the exact files in `files/` and `patches/`.
- **Seto:** verification as you see fit; the suite logs and identity rows are here.
- **Seto 20:15:** I confirm that seeds **70001-70040 and 71001-71100 have never been used** by any of my tools or runs. I'll write the pre-registration file before the first proof duel. Logging fields will be exactly your section 7 list.

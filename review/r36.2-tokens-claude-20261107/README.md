# r36.2: token cards and a token summon animation (Claude as builder; SELF-VERIFIED; PUBLISHED at Kevy's request, review after)

- **What Kevy asked for (7 Nov):** at 19:51 AEDT, "a card and animation for the Token cards". At 20:04, "pull the official card art from the
  database". At 20:25, "Can I have the site with the included tokens?". All upgrades had been pre-approved at 19:11.
- **Where it is:** published at https://kevinacc75-lab.github.io/ddl-test/r36.2/ (ddl-test 6440a7f). `/r36.1/` and `/r36/` are unchanged.
  - Source: r36-mid 5de815c on branch r37-tokens, on top of r36.1 6378a87.
  - Dist tree: 510 files, `fb42590919af8bdda3ad4b4f608dbe5d6714ce99475f79f6f9e7992bfb418920`.
  - Served check: 510 of 510 files match, 0 missing, no retries (`SERVED-SHA256-r36.2.txt`).
- **Display only.** `cards.json.gz` and `scripts.json.gz` are byte-identical to r36.1 (57ee238c / 2c55b720). No AI module or
  engine file changed.

## Changes since r36.1 (`dist-since-r36.1-text.diff` plus the image files)

| Change | Detail |
|---|---|
| Official token images | `dist/art/<id>.jpg` for 8 tokens. The source of each is `https://images.ygoprodeck.com/images/cards/<id>.jpg`, unedited, the same method as every other art file. The SHA-256 and byte size of each are in `r36-token-art-sources.json`. Covered: Sky Striker Ace (Hornet Drones), Primal Being (Nibiru), Radian, Lunalight (Serenade Dance), and Scapegoat's four Sheep Tokens. |
| Scapegoat Token | Sleepy Scapegoats' Scapegoat Token (3129528) has no YGOPRODeck card, so it shows the first Sheep Token image. |
| Generic token card | `art/token-generic.webp` is a plain silver card drawn by `tools/r37-token-art.mjs`. Any other token shows it. |
| `dist/token-cards.json` | Built by `tools/r37-token-art.mjs --map`. It lists all 242 Token-type cards and the image each one shows. `library-worker.mjs` `applyTokenArt` reads it into the display library only, in the same way as the TCG text overrides. |
| `dist/token-fx.mjs` / `.css` | On the existing `duel-presentation-event` summon broadcast for a token, a fixed overlay on the zone: ring, sparks, the card fading in like a hologram (sideways for Defence Position), and a TOKEN label. It removes itself afterwards. Several tokens summoned together are staggered. It does not run at Instant pace, and reduced motion gets a quick fade instead. |
| Labels | r36.2, cache `2026-11-07-r36.2`, replay build string `ddl-test r36.2 2026-11-07-r36.2`. |

## Checks

- **Full test suite:** 86 of 86 pass at 5de815c (`suite/SUITE.txt`), including the new `tests/r36-token-cards.test.mjs` (6 checks). Those checks
  cover: every token a preset deck can make has its official image with a matching hash; the list is complete; `applyTokenArt` changes
  only tokens without art; the engine database is unchanged; the timing rules hold.
- **Synthetic browser check** (`browser/synthetic-report.json`), using the page's own summon broadcast:
  - four Scapegoat Tokens showed 4 overlays, then 0 afterwards;
  - a non-token card showed 0;
  - Instant pace showed 0;
  - there were no errors.
- **Real duels** (`browser/real-duels-report.json`, Broadcast pace):
  - In Sky vs Mikanko (seed 71042) and Sky vs Branded (71043, Sky going second), Hornet Drones summoned the Sky Striker Ace Token, and the animation played by itself with the official art. `token-real-spawn.png` shows it sideways in Defence Position, with the field card showing the token art and DEF 0.
  - The raw pass flag is false only because the tool also looks for the token on the field about 4 s later. By then the AI had already used the token as Link material.
  - There were no page errors in any of the 5 duels.

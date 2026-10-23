# DDL r34 checker kit (Claude, 23 Oct 2026)

This kit is for ChatGPT's independent check of r34 (RELAY-014 check plan). It is published only after Kevy OKs r34.
SELF-VERIFIED (builder = verifier), NOT independent: every result Claude quotes for r34 still needs your check.

**It contains tests and tools only.** It has no game files, and nothing here changes any build.

## Contents
- `tests/` and `tools/`: Claude's r18 repo tests and tools at commit `422c09dbf069de0e809da7b109a4dda32cbae8eb`, the commit r34 was built from. `tools/drafts` is left out.
- `r34-from-r33.patch`: code diff from r33 (`9b32ed0`, published) to r34 ( 38 files changed, 1032 insertions(+), 95 deletions(-)). SHA-256 `b4461ca180efb6973e28b8161917c9ac87dea5cad6adc9d4c43a4ccb8df2d7b7`.
- `r34-from-r33.1.patch`: code diff from r33.1 (`a91ef76`, never published; folded into r34) to r34 ( 36 files changed, 970 insertions(+), 89 deletions(-)). SHA-256 `74744dceced2e70ddea26887f8e57dec4d297d5e669d9248bf97f7c3c1e57ba3`.
- `package.json`: test dependencies, jsdom 30.1.2 and css-tree 3.2.1.
- `SHA256SUMS`: a checksum for every other file in this folder.

**The frozen AI gate is not included.** Use your verified copy from the RC1 / B1 materials. Its SHA-256 is `1c380d58afc51f07ce76615d4b5cd8f185e7675de19b3fea72e1950088a14dee` (whitelist `9f1fb5f5487ea60ea7afdc3aac624c269608510e4cdab598878c2ec86bae0ee3`). Neither changed.

## Setup
```
work/
  dist/          <- copy of ../../r34/ (tree hash 6eb0672a2e33dcffd9ede581a6c3ec9e1251fa6e30d6c5adbf560431e8bc44cd)
  tests/  tools/ <- from this folder
  node_modules/  <- npm i jsdom@30.1.2 css-tree@3.2.1
cd work
for f in tests/*.test.mjs; do node "$f" > "$f.log" 2>&1 && echo "PASS $f" || echo "FAIL $f"; done
```
Tree hash: `cd dist && find . -type f | LC_ALL=C sort | xargs sha256sum | sha256sum`. Node v22.22.0.

`tests/r27-deck-books.test.mjs` takes about 9 minutes on Claude's 2-core machine (one progress line per seeded opening on stderr); run it on its own if your runner has a shorter limit.

## Pinned files (please keep in mind when reading the patch)
`app.mjs`, `play-flow.mjs`, `event-data.mjs` and `human-holds.mjs` are pinned by sha in `tests/r23-fx.test.mjs` and are **unchanged** in r34. New behaviour lives in new modules wired through `app-shell.mjs`:
- `chain-glow.mjs`: gold aura on cards usable right now, including chain windows; `document.body.dataset.humanDecision`.
- `duel-quickbar.mjs`: Pause / One action buttons that proxy the existing controls.
- `effect-titles.mjs`: `{code:{index:{clause,title}}}`; a title is used only when its clause is an exact piece of the card text.
- `ai/book/sky-lines.mjs`: Sky Striker holds-only book (trust off).
- `r34-arena.css`, `r34-persona.css`: presentation only; Phantom panels apply to the Showtime theme only.

## Deck viewer library loader (N4)
`installDeckList({fetchJson, loadBrain, loadLibrary})`. `loadLibrary: () => Promise<object>`: the parsed `cards.json.gz`, keyed by card code (string), entries `{name, type, level, attribute, attack, defense, art?}`. Default `() => readCompressed('cards.json.gz')` from `load.mjs`. In JSDOM, stub it; in a real browser the default loader is used (no stub).

## New tests in r34
- `tests/r34-book-additions.test.mjs`: Toon Field Spell holds, Blue-Eyes declaration + zone steps, Xyz / Fusion material names, Kashtira two-condition hold, effect previews (no material recipe; exact-clause titles), arena / Phantom CSS load order and Showtime scoping, a colour family for every deck, two-line resolution bubble.
- `tests/r34-play-glow.test.mjs`: chain-window glow slots, CSS, and the play-flow pin.
- `tests/r33-deck-brain.test.mjs` loops over all 8 brains.

## Smoke tool
```
node tools/taskc-smoke.mjs --deck branded --duels 6
```

## Opening audit tool
```
node tools/r27-deck-audit.mjs --deck mikanko --seeds 1 --start 101 --order first --opps toon --out out.json
```
Claude's comparisons ran one process per seed (going first: seeds 101–130; going second: the 12 recorded r32 openings, seeds 201–212, with `--replay-prefix`), opponents rotating through the other 7 decks in `decks.json` order starting at the first seed.

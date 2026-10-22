# DDL r33 checker kit (Claude, 23 Oct 2026)

This kit is for ChatGPT's independent check of r33. Kevy OK'd publishing r33 and its kit on 23 Oct 2026.

**It contains tests and tools only.** It has no game files, and nothing here changes any build.

## Contents
- `tests/` and `tools/`: Claude's r18 repo tests and tools at commit `9b32ed0`, the commit r33 was built from. `tools/drafts` is left out.
- `r33-from-r32.1.patch`: Claude's code diff from r32.1 (`b633d2a`) to r33 (`9b32ed0`). SHA-256 `c1732830efdb473fbbc9beec7907e949bb9f1c13085d5f99d2227121f81b26c6`.
- `package.json`: lists the test dependencies, jsdom 30.1.2 and css-tree 3.2.1.
- `SHA256SUMS`: a checksum for every file in this folder.

**The frozen AI gate is not included.** Use your verified copy from the RC1 / B1 materials. Its SHA-256 is `1c380d58afc51f07ce76615d4b5cd8f185e7675de19b3fea72e1950088a14dee`.

## Setup
```
work/
  dist/          <- copy of ../../r33/ (tree hash 02360e87f044c00b20f2ee245af8ee6ebf24ed5ffff15a2c7fc40c6f39f1be80)
  tests/  tools/ <- from this folder
  node_modules/  <- npm i jsdom@30.1.2 css-tree@3.2.1
cd work
for f in tests/*.test.mjs; do node "$f" > "$f.log" 2>&1 && echo "PASS $f" || echo "FAIL $f"; done
```
`tests/r27-deck-books.test.mjs` takes about 16 minutes on a 2-core machine; run it on its own if your runner has a shorter limit.

## New in r33
- `tests/r33-deck-list.test.mjs`, `tests/r33-polish.test.mjs`, `tests/r33-deck-brain.test.mjs`.
- `tools/r33-deck-cards.mjs` (`--check` confirms `dist/deck-cards.json` is up to date) and `tools/r33-deck-brain.mjs` (drafts card links from card text).

## Smoke tool
```
node tools/taskc-smoke.mjs --deck branded --duels 6
```
Claude ran 8 decks × 6 duels on the 19 Oct list: 48/48 finished, 0 failures.

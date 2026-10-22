# DDL r32 checker kit (Claude, 22 Oct 2026)

This kit is for ChatGPT's independent check of r32. Kevy OK'd publishing it here at `checker/r32/` on 22 Oct, about 20:10 AEDT.

**It contains tests and tools only.** It has no game files, and nothing here changes any build.

## Contents
- `tests/` and `tools/`: Claude's r18 repo tests and tools at commit `bcedcb0`, the commit r32 was built from. `tools/drafts` is left out.
- `r32-from-r31-code.patch`: Claude's diff from r31 to r32, without the MP3 files. Its SHA-256 is `b670a78c1e1cb17297e107c7f60d9b87db1d76cc687a420f66d8b9dba7bd8046`.
- `package.json`: lists the test dependencies, jsdom 30.1.2 and css-tree 3.2.1.
- `SHA256SUMS`: a checksum for every file in this folder.

**The frozen AI gate is not included.** Use your verified copy from the RC1 / B1 materials. Its SHA-256 is `1c380d58afc51f07ce76615d4b5cd8f185e7675de19b3fea72e1950088a14dee`.

## Setup
```
work/
  dist/          <- copy of ../../r32/ (tree hash 01fd0d10…)
  tests/  tools/ <- from this folder
  node_modules/  <- npm i jsdom@30.1.2 css-tree@3.2.1
cd work
for f in tests/*.test.mjs; do node "$f" > "$f.log" 2>&1 && echo "PASS $f" || echo "FAIL $f"; done
```

## Smoke tool
```
node tools/taskc-smoke.mjs
```
Claude ran 8 decks × 6 duels on the 19 Oct list. See the tool's header for its flags.

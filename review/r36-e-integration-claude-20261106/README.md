STATUS: OPEN - for ChatGPT's independent review
ANSWER BY: ChatGPT (RELAY-112 E integration conditions)

# r36 flag E integration into Enhanced - Claude (builder while Seto is out) - Fri 6 Nov 2026 AEDT

SELF-VERIFIED by the builder only.
- **Not published.** The live /r36-preview/ stays A+B with E off (f3a9e9e1) until you accept this AND Kevy says to republish.
- RC1, the frozen gate, the whitelist and the info-set pin are untouched.

## Identity
- **Source.** Branch r36-enh-claude **f9d42d4**, on 4d17d73 (tests/tools follow-up), which is on 15b6b88 (the served preview).
  - The patch is in patches/ (one commit). The dist change is in E-dist.diff: **one file, dist/ai/midgame-flags.mjs**.
- **Mode maps.**
  - AI_MODES is unchanged: Classic A/B/C/T/Z all false; Enhanced A+B true, C/T/Z false.
  - **AI_S4: Classic {E:false}, Enhanced {E:true}.**
- **Files.**
  - midgame-flags.mjs: 558c5348… -> **723e48ef870142792b50b136d35bf1a1e51e122335dee330b244ec9ba8c70733**.
  - dist in-folder: **2bb26b535a92f28b3754f2eb29a23159cf80be8187975c59340a44ec0d231ee4** (498 files).
  - index.html is unchanged: e4399b3b… (pinned in r36-ai-mode, as you asked).
- **Runtime:** Node v22.22.2.

## What E does (unchanged code from S4a; scope stays as you recorded in RELAY-109)
- planBattle keeps every attacker the ENGINE offers (attack indices are preserved; no hypothetical permission).
- A Defence Position attacker whose text says "apply its DEF for damage calculation" is scored with DEF.
- Not changed: Main Phase 1 thisTurnBattle / removal projections and next-turn projections (still Attack Position only). No claim that every forecast is corrected.

## Lifecycle
- `setAiMode` sets the COMPLETE S4 map from AI_S4 every time:
  - worker.mjs at each duel start;
  - Classic on import-replay;
  - ai-worker.mjs at every think.
- A missing or unknown mode means Classic (E=false).

## Tests
**tests/r36-ai-mode (12/12)** adds:
- the mode maps;
- for enhanced / classic / missing / bogus mode, after a stray setS4(true or false): E = true / false / false / false;
- Classic after Enhanced gives E=false;
- real ai-worker thinks in the order Enhanced -> Classic -> Enhanced -> missing, each after a stray opposite setS4: every base() sees the recipe value;
- worker.mjs source: duel start and import-replay both call setAiMode;
- the served index.html whole-file pin.

**tests/r36-s4-e (pass)** covers puzzles e/e2/e3 in BOTH first mappings, Classic and Enhanced:
- **e** (direct attack): Enhanced PASS (2600 = DEF; the record shows s4 {E:true}); Classic FAIL (r35 behaviour).
- **e2 (new; ATK-target control):** Scareclaw Kashtira (DEF 2600 used) vs Blue-Eyes White Dragon 3000 ATK. **Expected: the attack is offered and NOT taken** (it would lose: we take 400 and Scareclaw is destroyed, per your RELAY-109 forced native). Enhanced PASS with offered:y, noAttack:y. Classic also PASSes, trivially: it drops Defence attackers.
- **e3 (new; DEF-target control):** Scareclaw Kashtira vs Blue-Eyes in face-up DEF 2500. **Expected: attack; Blue-Eyes is destroyed; no LP change either way** (no piercing). Enhanced PASS; Classic FAIL.
- The matrix line equals requested (6 runs: PASS 4, FAIL 2, INVALID 0) for each mapping.
- A dev `--flags E` on Classic attacks.
- Gate: Classic e exits 1; Enhanced e exits 0.

**Full suite at f9d42d4: 81/81 exit 0** (suite/SUITE.txt plus named logs).

**Puzzle grid (puzzles/): 34 valid runs, 0 INVALID.**
- a/a2/b/b2: PASS in both modes and both mappings.
- e/e2/e3: as above, with search off in both mappings, and **search 100** (f0) for e/e2/e3 in both modes.

**Classic parity spot check at f9d42d4** (parity/): Luna v Kashtira 71003/0, stream **f51dcf3393dbbc18…**, 245 decisions. This equals r35.12.

## Your RELAY-112 wording, adopted
**a/a2 strategy note:** "In this controlled position, take the available direct damage; unknown backrow may change the outcome, and a known attack-specific threat can justify another line." It is not an "always attack into unknown backrow" rule.

The b/b2 conditions (no Xyz material, current ATK unchanged) and the e-family scope (this card and state; no general Defence-attack / negation / equip / reflection claim) are kept as you wrote them.

## Not done here
- c/d/f puzzles (next: concrete states plus expected lines with card text, for your review under Kevy's delegation).
- Republishing the preview with E: only after your acceptance and Kevy's OK. That will be a new label/cache identity, followed by a served-byte check.

Claude. Nothing published.

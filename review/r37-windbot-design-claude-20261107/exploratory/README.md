# Exploratory WindBot games (dev seeds 71001-71003; NOT the pre-registered confirmation)

`python3 summarise.py` (after editing its folder path) reproduces `SUMMARY.txt`. The counting rules are:
- one result per (executor, list, seed, first, WindBot seat) cell;
- the first valid result counts;
- engine-crash rows (`end: error`, the old MSG_SHUFFLE_SET_CARD parser) are dropped and re-run;
- "BlueEyes" rows are void, because that is not a WindBot executor name and WindBot loaded a random script.

The phases are:
- Phase 1: both seats play WindBot's own list (smoke, x1, x2, y1).
- Phase 2: both seats play the site's TCG 19 Oct list (y2a, y2b, y2c; `--site-deck`).

The rows come from two bridge versions:
- x1 and x2 ran on the pre-r37 bridge core, which had only the SHUFFLE_SET_CARD count fix.
- y* ran on the r37 core: the SELECT_SUM fix plus the parse audit. No message left unread bytes (`parseLeftovers` is `{}`).
- `nr.jsonl` holds 3 reproductions of the SELECT_SUM stall. `fix1.jsonl` is the same game on the fixed core.

Our AI ran at Enhanced, with search on, a 400-node budget and a 1500 ms deadline per decision. Two games ran at a time on a 2-core machine.

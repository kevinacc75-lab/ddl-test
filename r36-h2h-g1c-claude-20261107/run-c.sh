#!/bin/bash
# G1-C driver (RELAY-119): same game command as run.sh (G1-S) plus --allow-proof-seeds (the tool's existing switch for
# reviewed non-dev seeds), restricted here to exactly the 24 RELAY-119 held-out seeds; the logged rc is the game's own exit status.
# usage: run-c.sh <batch-name> <spec...>   spec = deckX:deckY:seed
cd /home/claude/r36-mid; export PATH=/tmp/claude-0/-home-claude/c6b8aa5b-fe09-5d09-a2d8-16e0b154d5ff/scratchpad/node22222/package/bin:$PATH
S=/tmp/claude-0/-home-claude/c6b8aa5b-fe09-5d09-a2d8-16e0b154d5ff/scratchpad/h2h; B=$1; shift
HELDOUT=" 916107 526608 957890 144868 636145 981973 236261 687028 438448 482097 711183 906685 443067 791146 502269 742909 381599 239198 630944 266674 697233 378053 286510 503468 "
for spec in "$@"; do IFS=: read X Y SEED <<< "$spec"
 case "$HELDOUT" in *" $SEED "*) ;; *) echo "$(date +%T) REFUSED $SEED not a RELAY-119 held-out seed" >> $S/rows/$B.log; continue;; esac
 for first in 0 1; do
  for order in EC CE; do
   if [ $order = EC ]; then AT=$S/enh; BT=$S/cls; AM=enhanced; BM=classic; else AT=$S/cls; BT=$S/enh; AM=classic; BM=enhanced; fi
   timeout 2400 node tools/r36-h2h.mjs --engine-tree . --a-tree $AT --b-tree $BT --a-label $AM --b-label $BM --a-mode $AM --b-mode $BM --a $X --b $Y --seed $SEED --first $first --deadline-ms 1500 --max-turn 30 --allow-proof-seeds --out $S/rows/$B.jsonl > /dev/null 2>> $S/rows/$B.err
   rc=$?; echo "$(date +%T) done $X-$Y $SEED f$first $order rc=$rc" >> $S/rows/$B.log
  done
 done
done
echo "$(date +%T) BATCH-END" >> $S/rows/$B.log

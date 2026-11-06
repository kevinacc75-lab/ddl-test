#!/bin/bash
# usage: run.sh <batch-name> <spec...>   spec = deckX:deckY:seed
cd /home/claude/r36-mid; export PATH=/tmp/claude-0/-home-claude/c6b8aa5b-fe09-5d09-a2d8-16e0b154d5ff/scratchpad/node22222/package/bin:$PATH
S=/tmp/claude-0/-home-claude/c6b8aa5b-fe09-5d09-a2d8-16e0b154d5ff/scratchpad/h2h; B=$1; shift
for spec in "$@"; do IFS=: read X Y SEED <<< "$spec"
 for first in 0 1; do
  for order in EC CE; do
   if [ $order = EC ]; then AT=$S/enh; BT=$S/cls; AM=enhanced; BM=classic; else AT=$S/cls; BT=$S/enh; AM=classic; BM=enhanced; fi
   timeout 2400 node tools/r36-h2h.mjs --engine-tree . --a-tree $AT --b-tree $BT --a-label $AM --b-label $BM --a-mode $AM --b-mode $BM --a $X --b $Y --seed $SEED --first $first --deadline-ms 1500 --max-turn 30 --out $S/rows/$B.jsonl > /dev/null 2>> $S/rows/$B.err
   echo "$(date +%T) done $X-$Y $SEED f$first $order rc=$?" >> $S/rows/$B.log
  done
 done
done

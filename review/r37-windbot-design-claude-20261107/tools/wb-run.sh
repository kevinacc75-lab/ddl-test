#!/bin/bash
# r37 WindBot exploratory driver: usage wb-run.sh <batch> <executor:seed ...>; each spec plays 4 games (wb seat 0/1 x first 0/1)
P=/tmp/claude-0/-home-claude/c6b8aa5b-fe09-5d09-a2d8-16e0b154d5ff/scratchpad; B=$1; shift
export PATH=$P/node22222/package/bin:$PATH WINDBOT_DIR=$P/windbot-bin DOTNET=$P/dotnet/dotnet DOTNET_ROOT=$P/dotnet BRIDGE_TREE=$P/bridge-tree
cd /home/claude/r36-mid
for spec in "$@"; do IFS=: read EX SEED <<< "$spec"
 for first in 0 1; do for ws in 1 0; do
  timeout 1800 node tools/windbot/match.mjs --executor $EX --wb-seat $ws --first $first --seed $SEED --out $P/wbrows/$B.jsonl > /dev/null 2>> $P/wbrows/$B.err
  echo "$(date +%T) $EX $SEED f$first wb$ws rc=$?" >> $P/wbrows/$B.log
 done; done
done
echo "$(date +%T) BATCH-END" >> $P/wbrows/$B.log

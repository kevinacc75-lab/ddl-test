#!/bin/bash
# Full-duel baseline for the midgame project: Watch-like pilots, 1500 ms, to the end (max turn 20).
cd /home/claude/r36-dtw
OUT=/tmp/claude-0/-home-claude/c6b8aa5b-fe09-5d09-a2d8-16e0b154d5ff/scratchpad/full/$1
mkdir -p $OUT
run(){ for job in "$@"; do set -- $job; [ -f $OUT/$1-$2-$3-$4.json ] && continue; timeout 2400 node tools/r36-battle-probe.mjs --a $1 --b $2 --seed $3 --first $4 --max-turn 20 --deadline-ms ${DL:-1500} --out $OUT/$1-$2-$3-$4.json >> $OUT/summary.txt 2>>$OUT/err.txt; done; }
run "dtw branded 501 0" "dtw branded 502 1" "dtw mikanko 503 0" "dtw mikanko 504 1" "dtw kashtira 505 0" "dtw sky 506 1" &
run "branded mikanko 511 0" "sky luna 512 1" "blueeyes kashtira 513 0" "toon hero 514 1" "kashtira branded 515 0" "luna blueeyes 516 1" &
wait; echo FULL-DONE >> $OUT/summary.txt

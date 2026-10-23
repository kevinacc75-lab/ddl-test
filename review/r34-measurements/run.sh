#!/bin/bash
# usage: run.sh deck order start n outfile [extra audit args...]  — one process per seed, CAP s each; opponents rotate as in the audit tool
deck=$1; order=$2; start=$3; n=$4; out=$5; shift 5
tmp=$(mktemp -d); case "$out" in /*) ;; *) out="$PWD/$out";; esac
cd ${ROOT:-/home/claude/r18}
opps=($(node -e "const j=require('/home/claude/r18/dist/decks.json');console.log(j.decks.map(x=>x.id).filter(x=>x!=='$deck').join(' '))"))
for ((s=start; s<start+n; s++)); do
  k=$((s-${ROT:-$start})); o=${opps[$((k % ${#opps[@]}))]}
  timeout ${CAP:-150} node tools/r27-deck-audit.mjs --deck $deck --seeds 1 --start $s --order $order --opps $o --out $tmp/$s.json "$@" 2>>$tmp/err || echo "seed $s vs $o TIMEOUT/ERR" >&2
done
node -e "const fs=require('fs');const d='$tmp';const rows=[];let head=null;for(const f of fs.readdirSync(d).filter(f=>f.endsWith('.json')).sort()){const j=JSON.parse(fs.readFileSync(d+'/'+f));head=head||j;rows.push(...j.rows)}fs.writeFileSync('$out',JSON.stringify({...head,rows},null,1));console.error('rows',rows.length)"

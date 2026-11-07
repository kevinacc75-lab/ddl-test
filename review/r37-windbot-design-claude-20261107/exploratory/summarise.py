import json,sys
from collections import Counter
P='/tmp/claude-0/-home-claude/c6b8aa5b-fe09-5d09-a2d8-16e0b154d5ff/scratchpad/wbrows/'
def load(files,skip_exec=()):
  cells={}
  for f in files:
    try:
      for l in open(P+f+'.jsonl'):
        r=json.loads(l)
        if r['executor'] in skip_exec or r['end']=='error':continue
        k=(r['executor'],r.get('siteDeck'),r['seed'],r['first'],r['wbSeat'])
        cells.setdefault(k,r)
    except FileNotFoundError:pass
  return cells
def summ(name,cells):
  c=Counter();per={};early=Counter();turns={'windbot':[],'ours':[]}
  for k,r in cells.items():
    w=r['winner'] or r['end'];c[w]+=1;per.setdefault(k[1] or k[0],Counter())[w]+=1
    if r['winner']:turns[r['winner']].append(r['turns']);early[r['winner']]+=r['turns']<=5
  pairs=Counter()
  for (e,sd,s,f,ws),r in cells.items():
    if ws!=1:continue
    o=cells.get((e,sd,s,f,0))
    if not o:continue
    a,b=r['winner'],o['winner']
    pairs[('AI-decided '+a) if a and b and a==b else 'deck-decided' if a and b else 'incomplete']+=1
  print('##',name,len(cells),'games',dict(c));[print('  ',e,dict(v)) for e,v in per.items()];print('  pairs',dict(pairs))
  for w,t in turns.items():
    if t:t=sorted(t);print('  ',w,'wins: median turn',t[len(t)//2],'| won by turn 5:',early[w])
summ('PHASE 1 WindBot own lists (exploratory)',load(['smoke','smoke2','x1','x2','y1'],skip_exec=('BlueEyes',)))
summ('PHASE 2 site TCG 19 Oct lists (exploratory)',load(['y2a','y2b','y2c']))

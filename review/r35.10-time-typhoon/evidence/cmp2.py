# r36: book vs no book, either order; reads <prefix>-book-<order>.json(.partial) and <prefix>-nobook-<order>.json(.partial); pairs by seed.
import json,sys,os
S,prefix,order=sys.argv[1],sys.argv[2],sys.argv[3]
def load(k):
  for ext in ('.json','.json.partial'):
    p=f'{S}/{prefix}-{k}-{order}{ext}'
    if os.path.exists(p): return {r['seed']:r for r in json.load(open(p))['rows']},ext
  return {},None
BOSS=('CXyz Hope Chaos Barian Dragon','Red-Eyes Black Dragon Exceed','CXyz Chaos Barian Hope Dragon')  # 3rd = the pre-rename name in the earliest tuning run
def row(r):
  t=r['turns'][0];e=t['end'];o=t['oppEnd'];s=t['oppStart'];mon=[m.split(' (')[0].replace(' DEF','') for m in e['monsters']]
  mv=' | '.join(t['moves'])
  return {'boss':any(m in BOSS or m.startswith(('K9-17 "Ripper"','K9-66X','K9-X "Werewolf"')) for m in mon),'barian':BOSS[0] in mon or BOSS[2] in mon,'exceed':BOSS[1] in mon,
   'sets':sum(b.startswith('set:') for b in e['backrow']),'dtwBack':'Dark Time Wizard' in e['hand'],'alli':"Alligator's Dragon Knight" in mv,
   'coin':'option' in mv and 'Dark Time Wizard' in mv,
   'oppMonStart':len(s['monsters']),'oppMonEnd':len(o['monsters']),'oppLP':o['lp'],'win':r.get('winner')==0 if r.get('finished') else False,'end':mon}
A={};E={}
for k in ('nobook','book'):A[k],E[k]=load(k)
seeds=sorted(set(A['nobook'])&set(A['book']))
print(f'{prefix} {order}: paired seeds n={len(seeds)} (files: nobook{E["nobook"]}, book{E["book"]})')
for k in ('nobook','book'):
  rs=[row(A[k][x]) for x in seeds];n=len(rs) or 1
  print(f" {k:6}: boss {sum(r['boss'] for r in rs)} (Barian {sum(r['barian'] for r in rs)}, Exceed {sum(r['exceed'] for r in rs)}) | Alligator {sum(r['alli'] for r in rs)} | DTW back {sum(r['dtwBack'] for r in rs)} | avg sets {sum(r['sets'] for r in rs)/n:.2f}"
        +(f" | their monsters {sum(r['oppMonStart'] for r in rs)}->{sum(r['oppMonEnd'] for r in rs)} | their LP avg {sum(r['oppLP'] or 0 for r in rs)/n:.0f} | won this turn {sum(r['win'] for r in rs)}" if order=='second' else ''))

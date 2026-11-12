import json,sys,statistics as st,collections
def load(p): return [json.loads(l) for l in open(p)]
def grp(r):
    if r['ourDeck']=='branded' and r['wbDeck']=='branded': return 'Branded mirror (ours vs WindBot Branded)'
    if r['ourDeck']=='branded': return 'Our Branded vs WindBot '+r['wbDeck']
    return 'Our '+r['ourDeck']+' vs WindBot Branded'
def med(v): return st.median(v) if v else None
def stats(rows):
    w=[r for r in rows if r['winner']=='ours'];l=[r for r in rows if r['winner']=='windbot'];o=[r for r in rows if r['winner'] not in('ours','windbot')]
    return dict(n=len(rows),ours=len(w),wb=len(l),other=len(o),pct=100*len(w)/max(1,len(rows)),medOurs=med([r['turns'] for r in w]),medWb=med([r['turns'] for r in l]))
def search(rows):
    s=collections.Counter()
    for r in rows:
        ss=r.get('searchStatus') or {}
        for k in ('full','reduced','fallback','finished','searchOver1500'):s[k]+=ss.get(k,0)
        s['searches']+=sum(ss.get(k,0) for k in ('full','reduced','fallback','?'))
        om=r.get('oursMs') or {};s['decisions']+=om.get('n',0);s['over1500']+=om.get('over1500',0)
    p95=[ (r.get('searchStatus') or {}).get('searchMsP95') for r in rows if (r.get('searchStatus') or {}).get('searchMsP95') is not None]
    s['p95med']=med(p95);return s
runs=[(a.split('=')[0],load(a.split('=')[1])) for a in sys.argv[1:]]
keys=sorted({grp(r) for _,rows in runs for r in rows})
print('| Matchup | '+' | '.join(f'{n}: ours W-L (win %) | {n}: median win turn ours / WindBot' for n,_ in runs)+' |')
print('|---|'+'---|---|'*len(runs))
for k in keys+['ALL']:
    cells=[]
    for n,rows in runs:
        s=stats([r for r in rows if k=='ALL' or grp(r)==k])
        cells.append(f"{s['ours']}-{s['wb']}{'-'+str(s['other']) if s['other'] else ''} ({s['pct']:.0f}%, n={s['n']})");cells.append(f"{s['medOurs']} / {s['medWb']}")
    print(f'| {k} | '+' | '.join(cells)+' |')
print()
print('| Search / timing | '+' | '.join(n for n,_ in runs)+' |');print('|---|'+'---|'*len(runs))
ss=[search(rows) for _,rows in runs]
for k,lab in [('searches','searches'),('full','status full'),('reduced','status reduced'),('fallback','status fallback'),('finished','finished (no cut, all candidates on all held worlds)'),('searchOver1500','searches over 1500 ms'),('decisions','our decisions'),('over1500','our decisions over 1500 ms'),('p95med','median of per-game search p95 (ms)')]:
    print(f'| {lab} | '+' | '.join(str(s[k]) for s in ss)+' |')
print()
for n,rows in runs:
    print(n,'errors',sum(1 for r in rows if r['err'] or r['engineErrors']),'rejections',sum(r['rejected']['ours']+r['rejected']['wb'] for r in rows),'rows',len(rows))

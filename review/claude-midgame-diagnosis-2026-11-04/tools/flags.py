import json,sys,glob,collections
def flags(d):
  out=[]
  for t in d['turns']:
    if t['turn']<3: continue
    a=t['active'];b=t['before'];af=t['after'];acts=[x for x in t['acts'] if x['seat']==a]
    titles=[x['title'] for x in acts]
    attacks=[x for x in titles if x.startswith('Attack')]
    bp=any(x=='Enter Battle Phase' for x in titles)
    dmg=b[1-a]['lp']-af[1-a]['lp']; selfdmg=b[a]['lp']-af[a]['lp']
    acts_n=sum(1 for x in titles if x.startswith(('Activate','Special','Normal','Chain','Use','Set')))
    oppmon_after=len(af[1-a]['mon']); ownmon_after=[m for m in af[a]['mon'] if '(def)' not in m]
    if oppmon_after==0 and ownmon_after and not attacks and af[1-a]['lp']>0: out.append(('OPEN_BOARD_NO_ATTACK',t['turn'],ownmon_after))
    if any(x.startswith('Change position') for x in titles) and len(b[1-a]['mon'])==0: out.append(('DEF_SWITCH_VS_EMPTY',t['turn'],None))
    if acts_n>=6 and dmg<=0 and len(af[a]['mon'])<=len(b[a]['mon']) and len(af[1-a]['mon'])>=len(b[1-a]['mon']): out.append(('CHURN_NO_PROGRESS',t['turn'],acts_n))
    if acts_n<=1 and not attacks and len(b[a]['hand'])>=3: out.append(('IDLE_WITH_HAND',t['turn'],len(b[a]['hand'])))
    if selfdmg>0 and af[a]['lp']>0: out.append(('SELF_DAMAGE_OWN_TURN',t['turn'],selfdmg))
    if af[a]['lp']<=0: out.append(('LOST_ON_OWN_TURN',t['turn'],selfdmg))
    if ownmon_after and not bp and af[1-a]['lp']>0 and t['turn']>=3: out.append(('NO_BATTLE_PHASE',t['turn'],len(ownmon_after)))
  return out
tot=collections.defaultdict(collections.Counter)
for f in sorted(glob.glob(sys.argv[1])):
  d=json.load(open(f));k='AB' if f.split('/')[-1].startswith('AB-') else 'base'
  fl=flags(d);
  for x in fl: tot[k][x[0]]+=1
  tot[k]['games']+=1;tot[k]['turns3+']+=sum(1 for t in d['turns'] if t['turn']>=3)
  print(f.split('/')[-1],'winner',d['winner'],'turns',d['turn'],fl)
for k,v in tot.items(): print(k,dict(v))

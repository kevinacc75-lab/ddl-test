# Full-duel metrics for the midgame project (Claude, 29 Oct 2026). Usage: python3 metrics.py <dir> [<dir2>]
import json,glob,sys,os
def game(f):
  d=json.load(open(f));T=d['turns'];rows=d['rows'];out={'file':os.path.basename(f),'winner':d['winner'],'turns':d['turn'],'finished':d['finished']}
  dmg={0:[],1:[]}
  for i,t in enumerate(T):
    if t['turn']<3:continue
    nxt=T[i+1]['lp'] if i+1<len(T) else d['lp'];a=t['active'];dmg[a].append(max(0,t['lp'][1-a]-nxt[1-a]))
  idle={0:0,1:0};skip={0:0,1:0};defStuck={0:0,1:0}
  byturn={}
  for r in rows:byturn.setdefault((r['turn'],r['seat']),[]).append(r)
  for (tn,s),rs in byturn.items():
    acted=any(any(k in r['chose'] for k in ('summon','activate','ATTACK','set ','position')) for r in rs)
    if not acted:idle[s]+=1
    for r in rs:
      if r['type']=='battle' and not r['opp'] and r['attacks'] and 'ATTACK' not in r['chose']:skip[s]+=1
      if r['type']=='main' and 'END TURN' in r['chose'] and r['canBattle'] and not r['opp'] and any(m['pos']=='ATK' and m['atk']>0 for m in r['own']):skip[s]+=1
      if r['type']=='main' and 'END TURN' in r['chose'] and not r['opp'] and any(m['pos']!='ATK' and m['atk']>=1500 for m in r['own']):defStuck[s]+=1
  out['dmg']={s:(sum(v)/len(v) if v else 0) for s,v in dmg.items()};out['idle']=idle;out['openNoAttack']=skip;out['defStuck']=defStuck;return out
def summary(dirn):
  G=[game(f) for f in sorted(glob.glob(dirn+'/*.json'))];n=len(G)
  if not n:return None
  dm=[x for g in G for x in g['dmg'].values()];idle=sum(sum(g['idle'].values()) for g in G);skip=sum(sum(g['openNoAttack'].values()) for g in G);ds=sum(sum(g['defStuck'].values()) for g in G)
  return {'games':n,'finished':sum(g['finished'] for g in G),'avgTurns':sum(g['turns'] for g in G)/n,'avgDamagePerTurnFromT3':sum(dm)/len(dm),'idleTurns':idle,'openBoardNoAttack':skip,'defStuckOnOpenBoard':ds,'games_detail':[(g['file'],g['winner'],g['turns'],{k:round(v) for k,v in g['dmg'].items()},g['idle'],g['openNoAttack'],g['defStuck']) for g in G]}
for d in sys.argv[1:]:
  s=summary(d);print('==',d);
  if s:
    for k,v in s.items():
      if k!='games_detail':print(' ',k,round(v,1) if isinstance(v,float) else v)
    for x in s['games_detail']:print('   ',x)

import json,sys
S=sys.argv[1];H='INDEPENDENT PROCEDURAL PILOT CHOICES'
def parts(t):
  L=t.split('\n')
  if H in L: i=L.index(H); return [x for x in L[:i] if x!=''] , L[i+1:]
  return [x for x in L if x!=''],[]
base={(r['seed'],r['first']):r for r in (json.loads(l) for l in open(S+'/paired-final-fix.jsonl') if l.startswith('{'))}
rows=[json.loads(l) for l in open(S+'/paired-infoset.jsonl') if l.startswith('{')]
out=[]
for g in rows:
  k=(g['seed'],g['first']);b=base[k]
  bd=json.load(open(f'{S}/dumpfinal-{k[0]}-{k[1]}.json'));gd=json.load(open(f'{S}/dumpinfoset-{k[0]}-{k[1]}.json'))
  if not b['errors']:
    same=b['responsesSha256']==g['responsesSha256'] and b['logSha256']==g['logSha256']
    out.append(f"{k[0]:>5} {k[1]} | no error in base | guard IDENTICAL (responses + log): {same} | decisions {g['decisions']}")
  else:
    br,gr=bd['responses'],gd['responses'];bl,bf=parts(bd['log']);gl,gf=parts(gd['log'])
    nxt=gl[len(bl)] if len(gl)>len(bl) else None
    out.append(f"{k[0]:>5} {k[1]} | base stopped by the 'rejected' error after {len(br)} decisions | guard: {len(gr)} decisions, errors {g['errors'] or 'none'}, finished {g['finished']}, turn {g['turn']} | base responses = prefix of guard: {gr[:len(br)]==br} | base duel log ({len(bl)} lines) = prefix of guard duel log: {gl[:len(bl)]==bl}; base pilot-choice notes ({len(bf)} lines) = prefix of guard's: {gf[:len(bf)]==bf} | next guard log line: {nxt[:80] if nxt else None}")
print('\n'.join(out))

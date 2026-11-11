# Fixed 128-game benchmark (RELAY-122 seeds x 2 first-player orders x 2 pilot assignments x 4 WindBot decks). One attempt per cell.
import subprocess,sys,os,json,concurrent.futures as cf
build,label,conc=sys.argv[1],sys.argv[2],int(sys.argv[3]);extra=sys.argv[4:]
SEEDS=[663799447,684167468,708964016,884959464,1126433173,1329571133,1647930813,1910250101]
R='/workspace/reports/r45-ai-v4-2026-11-11';out=f'{R}/runs/{label}.jsonl';os.makedirs(f'{R}/logs/{label}',exist_ok=True)
done=set()
if os.path.exists(out):
  for l in open(out):
    r=json.loads(l);done.add((r['seed'],r['first'],r['ourDeck'],r['wbDeck'],r['wbSeat']))
jobs=[]
DECKS=[x for x in os.environ.get('BENCH_DECKS','branded,sky,blueeyes,kashtira').split(',')]
ONLY_WB=os.environ.get('BENCH_WBSEAT')
for deck in DECKS:
  for seed in SEEDS:
    for first in (0,1):
      for wbseat in (1,0):
        if ONLY_WB is not None and str(wbseat)!=ONLY_WB: continue
        ours,wb=('branded',deck) if wbseat==1 else (deck,'branded')
        if (seed,first,ours,wb,wbseat) in done: continue
        jobs.append(['--ours',ours,'--wb',wb,'--wb-seat',str(wbseat),'--first',str(first),'--seed',str(seed),'--out',out,'--log',f'{R}/logs/{label}/{deck}-{seed}-f{first}-wb{wbseat}.json',*extra])
print(len(jobs),'jobs',flush=True)
def run(a):
  r=subprocess.run(['timeout','1800','node','--max-old-space-size=2048',f'{R}/tools/bench.mjs',*a],cwd=build,capture_output=True,text=True)
  return a,r.returncode,(r.stdout or '')[-400:],(r.stderr or '')[-400:]
with cf.ThreadPoolExecutor(conc) as ex:
  for a,rc,o,e in ex.map(run,jobs):
    print(rc,' '.join(a[:12]),o.strip()[-300:],e.strip()[-200:],flush=True)

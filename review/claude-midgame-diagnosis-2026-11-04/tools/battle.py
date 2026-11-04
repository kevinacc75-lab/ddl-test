import json,sys
for f in sys.argv[1:]:
  d=json.load(open(f));print('=====',f.split('/')[-1],'winner',d['winner'],'turns',d['turn'])
  for t in d['turns']:
    a=t['active'];print(f" T{t['turn']} s{a} LP {t['before'][0]['lp']}/{t['before'][1]['lp']}->{t['after'][0]['lp']}/{t['after'][1]['lp']} acts={sum(1 for x in t['acts'] if x['seat']==a)} own={t['after'][a]['mon']} opp={t['after'][1-a]['mon']}")
    for x in t['acts']:
      if x['seat']==a and x.get('opts') and 'attacks' in x['opts']:
        print(f"    BP prompt attacks={x['opts']['attacks']} -> {x['title'][:40]} [{str(x['rule'])[:40]}]")

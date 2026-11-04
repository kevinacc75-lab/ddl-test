import json,sys
for f in sys.argv[1:]:
  d=json.load(open(f));print('=====',f.split('/')[-1],'winner',d['winner'],'turns',d['turn'],'err',d['err'])
  for t in d['turns']:
    a=t['active'];b=t['before'][a];o=t['before'][1-a];af=t['after']
    print(f"-- T{t['turn']} seat{a} LP {t['before'][0]['lp']}/{t['before'][1]['lp']} -> {af[0]['lp']}/{af[1]['lp']} | hand {len(b['hand'])}->{len(af[a]['hand'])} mon {len(b['mon'])}->{len(af[a]['mon'])} oppmon {len(o['mon'])}->{len(af[1-a]['mon'])} deck {b['deck']}->{af[a]['deck']}")
    print('   own before:',b['mon'],b['st'],'hand',b['hand'])
    print('   opp before:',o['mon'],o['st'])
    for x in t['acts']:
      if x['seat']==a: print(f"   . {x['title'][:60]:60} | {str(x['rule'])[:70]} {x['ms']}ms")
      else: print(f"   (opp) {x['title'][:55]:55} | {str(x['rule'])[:60]}")
    print('   own after:',af[a]['mon'],af[a]['st'],'hand',af[a]['hand'])

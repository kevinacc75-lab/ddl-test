import json,sys
# usage: turnlog.py <log.json> <turn> [<turn>...]  -> markdown of one full turn: our decisions (rule | action) + public events
f=sys.argv[1];turns=[int(x) for x in sys.argv[2:]];j=json.load(open(f));r=j['row']
out=[f"### {f.split('/')[-1]} — ours {r['ourDeck']} (seat {r['ourSeat']}) vs WindBot {r['wbDeck']}, seed {r['seed']}, first {r['first']}; winner {r['winner']} on turn {r['turns']}"]
for t in turns:
    out.append(f"\n**Turn {t}** ({'our turn' if (t%2==1)==(r['oursFirst']) else 'opponent turn'})\n\nOur decisions (skipping 'do not chain' passes):\n")
    for x in j['trace']:
        if x['t']!=t or x['who']!='OURS':continue
        if x.get('label') in ('Do not chain',) :continue
        out.append(f"- {x.get('rule') or ''} → {x.get('label') or ''}")
    out.append("\nPublic events:\n")
    for e in j['events']:
        if e.get('turn')!=t or e.get('privateSeat') is not None:continue
        if e.get('kind') in ('chain','summon','damage','battle','negate','win','lp','recover'):out.append(f"- {e.get('text','')[:160]}")
print('\n'.join(out))

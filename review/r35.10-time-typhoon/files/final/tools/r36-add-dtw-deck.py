"""r36 (Claude, 29 Oct 2026): add Kevy's "K9 Radiant Typhoon Dark Time Wizard" list (Kevy, 29 Oct 10:52) to dist/decks.json.
Existing entries untouched (byte-identical round trip asserted). Card ids: base printings (alias 0)."""
import json,os,gzip
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MAIN=[(77482666,3),(4881365,3),(76660178,1),(80538047,3),(54143349,2),(92248362,3),(28642461,1),(91025875,1),(14558127,3),(42141493,2),
      (40235813,3),(76630812,2),(3129527,1),(67115133,1),(5318639,2),(57103969,2),(80181649,1),(53792930,1),(92221402,1),(84211599,1),
      (65118318,1),(2606417,1),(10045474,1)]
EXTRA=[(17242022,2),(4423206,1),(71068247,1),(71166481,1),(27420823,2),(67515699,1),(90303227,1),(34876719,1),(61374414,1),(79791695,1),
       (49456901,1),(29301450,1),(65741786,1)]
SIDE=[(40275470,1),(94145021,1),(84192580,3),(27204311,3),(59438930,2),(24299458,2),(14532163,2),(41420027,1)]
flat=lambda L:[i for i,n in L for _ in range(n)]
FMT='TCG Advanced — 19 October 2026 (Kevy\'s list, 29 Oct 2026)'
def main():
    p=os.path.join(ROOT,'dist/decks.json');raw=open(p,'rb').read();d=json.loads(raw)
    assert json.dumps(d,separators=(',',':'),ensure_ascii=False).encode()==raw
    assert not any(x['id']=='dtw' for x in d['decks'])
    db=json.loads(gzip.decompress(open(os.path.join(ROOT,'dist/cards.json.gz'),'rb').read()))
    m,e,s=flat(MAIN),flat(EXTRA),flat(SIDE);assert (len(m),len(e),len(s))==(40,15,15)
    for i in m+e+s: assert str(i) in db and not db[str(i)]['alias'],i
    entry={"id":"dtw","name":"Time Typhoon","subtitle":"K9 · Radiant Typhoon · Dark Time Wizard","accent":"#b48cff","boss":17242022,
           "source":"Kevy's list (29 Oct 2026); playbook k9_radiant_typhoon_dark_time_wizard_playbook.pdf","format":FMT,
           "main":m,"extra":e,"side":s,"banlistVariants":{"tcg-2026-10-19":{"main":m,"extra":e,"side":s,"format":FMT}}}
    d['decks'].append(entry)
    open(p,'wb').write(json.dumps(d,separators=(',',':'),ensure_ascii=False).encode())
    print('added dtw',len(m),len(e),len(s))
if __name__=='__main__':main()

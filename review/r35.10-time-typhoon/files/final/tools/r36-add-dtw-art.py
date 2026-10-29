"""r36 (Claude, 29 Oct 2026; Kevy 14:29 screenshots: "Missing card arts").
Time Typhoon uses 21 cards that were already in our card database but had no art, because no earlier preset deck used
them (MST, "A Case for K9", K9-66X "Jacks", the K9 and Radiant Typhoon monsters ...). This adds their art the same way
every existing art file was added: the unedited YGOPRODeck image (813x1185 jpg), an 'art' path in the card entry placed
before 'scriptSupported' (the key order every card with art already has), and the file in offline-assets.json.
The 'art' key is display-only: the engine never reads it. No other field of any entry changes (checked below).
Usage: python3 tools/r36-add-dtw-art.py <folder with the 21 downloaded <id>.jpg files>
"""
import sys,os,json,gzip,hashlib
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ART=[80538047,54143349,92248362,28642461,91025875,67115133,5318639,80181649,53792930,92221402,84211599,
     4423206,71068247,71166481,27420823,67515699,90303227,34876719,61374414,49456901,59438930]
def gz_read(p):return gzip.decompress(open(p,'rb').read())
def gz_write(p,obj):open(p,'wb').write(gzip.compress(json.dumps(obj,ensure_ascii=False,separators=(',',':')).encode(),mtime=0))
def main(dl):
    cards_p=os.path.join(ROOT,'dist/cards.json.gz');raw=gz_read(cards_p);cards=json.loads(raw)
    assert json.dumps(cards,ensure_ascii=False,separators=(',',':')).encode()==raw,'cards.json round trip'
    before={k:dict(v) for k,v in cards.items()}
    pins=json.load(open(os.path.join(ROOT,'tools/data/r36-betb-sources.json')))
    rec=pins.setdefault('artExistingCards',{})
    for i in ART:
        c=cards[str(i)];assert 'art' not in c,f'{i} already has art'
        src=os.path.join(dl,f'{i}.jpg');b=open(src,'rb').read();assert b[:3]==b'\xff\xd8\xff',f'{i} not a jpeg'
        open(os.path.join(ROOT,'dist/art',f'{i}.jpg'),'wb').write(b)
        n={}
        for k,v in c.items():
            if k=='scriptSupported':n['art']=f'art/{i}.jpg'
            n[k]=v
        assert 'art' in n;cards[str(i)]=n
        rec[str(i)]={'name':c['name'],'file':f'art/{i}.jpg','sha256':hashlib.sha256(b).hexdigest(),'bytes':len(b),
                     'source':f'https://images.ygoprodeck.com/images/cards/{i}.jpg','downloaded':'2026-10-29 (Australia/Sydney)','unedited':True}
    for k,v in cards.items():
        o=before[k]
        if int(k) in ART:assert {a:b for a,b in v.items() if a!='art'}==o and list(x for x in v if x!='art')==list(o),k
        else:assert v==o,k
    gz_write(cards_p,cards)
    a_p=os.path.join(ROOT,'dist/offline-assets.json');a=json.load(open(a_p))
    first=next(j for j,x in enumerate(a) if x.startswith('./art/'));last=max(j for j,x in enumerate(a) if x.startswith('./art/'))
    arts=sorted(a[first:last+1]+[f'./art/{i}.jpg' for i in ART]);assert len(set(arts))==len(arts)
    open(a_p,'w').write(json.dumps(a[:first]+arts+a[last+1:],indent=2)+'\n')
    open(os.path.join(ROOT,'tools/data/r36-betb-sources.json'),'w').write(json.dumps(pins,indent=1,ensure_ascii=False)+'\n')
    print(json.dumps({'art_added':len(ART),'cards_with_art':sum(1 for v in cards.values() if 'art' in v)}))
if __name__=='__main__':main(sys.argv[1])

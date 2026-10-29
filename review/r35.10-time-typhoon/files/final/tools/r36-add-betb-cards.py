"""r36 (Claude, 29 Oct 2026; Kevy: new deck "K9 Radiant Typhoon Dark Time Wizard").
Adds the Beyond the Brave cards the deck needs to dist/cards.json.gz and dist/scripts.json.gz, nothing else.

- Card data: ProjectIgnis BabelCDB release-betb.cdb, converted by tools/cdb-to-card.py (format checked against all 14759
  existing entries). Art path art/<id>.jpg (YGOPRODeck image server, same source/format as the existing art).
- Scripts: ProjectIgnis CardScripts official/c<id>.lua, unchanged except a 2-line header. The only global they need that our
  bundled shared scripts lack is CARD_DARK_TIME_WIZARD; it is defined as a LOCAL at the top of each new script, so no shared
  script (utility.lua, proc_*.lua, constants) changes and no existing card's behaviour can change.
- Existing entries are untouched (byte-identical JSON round trip checked before writing).
Usage: python3 tools/r36-add-betb-cards.py <babelcdb dir> <cardscripts dir>
"""
import sys,os,json,gzip,re,subprocess,importlib.util
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec=importlib.util.spec_from_file_location('cdb',os.path.join(ROOT,'tools/cdb-to-card.py'));cdb=importlib.util.module_from_spec(spec);spec.loader.exec_module(cdb)
NEW=[40235813,77482666,4881365,3129527,76630812,65118318,2606417,76660178,17242022,79791695,40275470]
# Tokens the new cards create: card data only (like every token in our database: no script, no art). Found by the
# native fixture (Sleepy Scapegoats: the engine could not create 'Scapegoat Token' 3129528 without its data).
TOKENS=[3129528]
# Official TCG names where the ProjectIgnis row carries another translation (Tea / Seto 29 Oct 11:24: BETB-EN044 is
# "CXyz Hope Chaos Barian Dragon"; Konami DB, YGOPRODeck, Yugipedia BETB-AE044).
TCG_NAMES={79791695:'CXyz Hope Chaos Barian Dragon'}
def gz_read(p):return gzip.decompress(open(p,'rb').read())
def gz_write(p,obj):open(p,'wb').write(gzip.compress(json.dumps(obj,ensure_ascii=False,separators=(',',':')).encode(),mtime=0))
def main(babel,scripts_dir):
    rev=lambda d:subprocess.run(['git','-C',d,'rev-parse','HEAD'],capture_output=True,text=True).stdout.strip()
    cards_p=os.path.join(ROOT,'dist/cards.json.gz');scripts_p=os.path.join(ROOT,'dist/scripts.json.gz')
    raw=gz_read(cards_p);cards=json.loads(raw)
    assert json.dumps(cards,ensure_ascii=False,separators=(',',':')).encode()==raw,'cards.json round trip'
    sraw=gz_read(scripts_p);scripts=json.loads(sraw)
    assert json.dumps(scripts,ensure_ascii=False,separators=(',',':')).encode()==sraw,'scripts.json round trip'
    up=cdb.load(os.path.join(babel,'release-betb.cdb'),set(NEW)|set(TOKENS))
    assert set(up)==set(NEW)|set(TOKENS),'missing in release-betb.cdb: '+str((set(NEW)|set(TOKENS))-set(up))
    header=f'-- r36 DDL: ProjectIgnis CardScripts {rev(scripts_dir)[:12]} official/%s, unchanged below this header.\n'
    for i in NEW:
        assert str(i) not in cards,f'{i} already present'
        e=up[i];e['art']=f'art/{i}.jpg';e['scriptSupported']=True
        if i in TCG_NAMES:e['name']=TCG_NAMES[i]
        cards[str(i)]=e
        src=open(os.path.join(scripts_dir,'official',f'c{i}.lua'),encoding='utf-8').read()
        pre=header%f'c{i}.lua'
        if 'CARD_DARK_TIME_WIZARD' in src and not re.search(r'CARD_DARK_TIME_WIZARD\s*=',src):
            pre+='local CARD_DARK_TIME_WIZARD=40235813 --upstream defines this in card_counter_constants.lua; local here so no shared script changes\n'
        assert f'c{i}.lua' not in scripts
        scripts[f'c{i}.lua']=pre+src
    for i in TOKENS:
        assert str(i) not in cards and up[i]['type']&0x4000,i
        e=up[i];e['scriptSupported']=True;cards[str(i)]=e
    gz_write(cards_p,cards);gz_write(scripts_p,scripts)
    print(json.dumps({'added':NEW,'tokens':TOKENS,'babelcdb':rev(babel)[:12],'cardscripts':rev(scripts_dir)[:12],'cards':len(cards),'scripts':len(scripts)}))
if __name__=='__main__':main(sys.argv[1],sys.argv[2])

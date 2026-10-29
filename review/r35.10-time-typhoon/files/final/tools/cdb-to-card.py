"""r36 (Claude, 29 Oct 2026): convert ProjectIgnis BabelCDB rows to the dist/cards.json.gz entry format.
Field mapping checked against every existing card that is also in the upstream cdb (see --check)."""
import sqlite3,sys,json,gzip
def setcodes(v):
    out=[];
    while v:
        s=v&0xffff
        if s: out.append(s)
        v>>=16
    return out
def entry(row,texts):
    (id_,ot,alias,setcode,type_,atk,def_,level,race,attr,cat)=row
    name,desc,*strs=texts
    lvl=level&0xff; ls=(level>>24)&0xff; rs=(level>>16)&0xff
    link=def_ if type_&0x4000000 else 0
    return {"code":id_,"alias":alias,"setcodes":setcodes(setcode),"type":type_,"level":lvl,"attribute":attr,"race":str(race),
            "attack":atk,"defense":0 if type_&0x4000000 else def_,"lscale":ls,"rscale":rs,"link_marker":link,
            "name":name,"desc":desc,"strings":[s or "" for s in strs[:16]]}
def load(cdb,ids=None):
    c=sqlite3.connect(cdb);res={}
    q='select d.id,d.ot,d.alias,d.setcode,d.type,d.atk,d.def,d.level,d.race,d.attribute,d.category from datas d'
    for row in c.execute(q):
        if ids and row[0] not in ids: continue
        t=c.execute('select name,desc,'+','.join(f'str{i}' for i in range(1,17))+' from texts where id=?',(row[0],)).fetchone()
        res[row[0]]=entry(row,t)
    return res
if __name__=='__main__':
    if sys.argv[1]=='--check':
        ours=json.loads(gzip.decompress(open(sys.argv[2],'rb').read()));up=load(sys.argv[3])
        fields=["alias","setcodes","type","level","attribute","race","attack","defense","lscale","rscale","link_marker","name","strings"]
        diff={f:0 for f in fields};n=0;ex={}
        for k,v in ours.items():
            u=up.get(int(k))
            if not u: continue
            n+=1
            for f in fields:
                if v[f]!=u[f]: diff[f]+=1;ex.setdefault(f,(k,v[f],u[f]))
        print('compared',n,'diffs',diff);[print(' e.g.',f,ex[f]) for f in ex]

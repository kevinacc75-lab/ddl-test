import hashlib,os,json,sys,urllib.request,concurrent.futures as cf
BASE='https://kevinacc75-lab.github.io/ddl-test/'
REPO='/workspace/ddl-test-r39'
def local(path):
    out={}
    root=os.path.join(REPO,path)
    for r,_,fs in os.walk(root):
        for f in fs:
            p=os.path.join(r,f);out[os.path.relpath(p,root)]=hashlib.sha256(open(p,'rb').read()).hexdigest()
    return out
def get(url):
    for i in range(3):
        try:
            req=urllib.request.Request(url+'?v=r45check',headers={'Cache-Control':'no-cache'})
            with urllib.request.urlopen(req,timeout=60) as r: return r.status,r.read()
        except Exception as e: err=e
    return None,str(err).encode()
res={}
for path in ['r45-ai-v4','r44-aurora-boss-art','r43-aurora-p1','r42-branded-budget-extra','r41-branded-video41-fixes','r40-branded-video41-dl-fx','r39-branded-video41','r38-branded-v3-1','r37']:
    loc=local(path);ok=mm=fail=0;bad=[]
    with cf.ThreadPoolExecutor(16) as ex:
        futs={ex.submit(get,BASE+path+'/'+f.replace(' ','%20')):f for f in loc}
        for fu in cf.as_completed(futs):
            f=futs[fu];st,body=fu.result()
            if st!=200: fail+=1;bad.append([f,st]);continue
            if hashlib.sha256(body).hexdigest()==loc[f]: ok+=1
            else: mm+=1;bad.append([f,'hash'])
    res[path]={'total':len(loc),'ok':ok,'hash_mismatch':mm,'fail':fail,'bad':bad[:20]}
    print(path,res[path]['total'],ok,mm,fail,flush=True)
json.dump(res,open('/workspace/reports/r45-ai-v4-2026-11-11/served-check.json','w'),indent=1)

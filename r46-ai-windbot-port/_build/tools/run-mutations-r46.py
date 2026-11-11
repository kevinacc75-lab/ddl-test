import shutil,subprocess,os,re,sys
# r46: every r45 mutation (r45 runner, unchanged patterns) plus the r46 WindBot-port and victory-boss mutations; each must be KILLED.
src=open(os.path.join(os.path.dirname(__file__),'run-mutations-r45.py'),encoding='utf-8').read()
exec(src[:src.index("os.makedirs('mutations-r45'")])  # defines muts (r44 + r45), ALL45, ...
T46=['tests/r46-windbot-port.test.mjs','tests/r46-victory-boss.test.mjs']
ALL46=ALL45+T46
for k,(F,reps,tests) in list(muts.items()):muts[k]=(F,reps,tests+T46)
WP='ai/book/windbot-port.mjs';BK='ai/book/book.mjs';P='optimal-pilot.mjs';FL='ai/r46-flags.mjs';VB='victory-boss.mjs';AC='css/aurora.css';IX='index.html'
muts.update({
'R46-off':(FL,[(' on:true,',' on:false,')],ALL46),
'R46-W1-own-chain-ok':(WP,[("if(t&&t.controller===seat)return 'W1","if(false)return 'W1")],ALL46),
'R46-W1-unwired':(BK,[("{const wb=wbActivationBlock(d,seat,c);if(wb)return wb}/* r46 W1/W3 */","")],ALL46),
'R46-W2-mirrorjade-ok':(WP,[("if(!t||t.controller===seat||t.code===MIRRORJADE)return null;","if(!t||t.controller===seat)return null;")],ALL46),
'R46-W2-unwired':(BK,[("if(!best)return wbGhostOgre(","if(!best)return null;(")],ALL46),
'R46-W3-always':(WP,[("if(!(extraMonster||activatingAlbaz||battle||end))return 'W3","if(false)return 'W3")],ALL46),
'R46-W3-no-end':(WP,[("end=d.phase===512;","end=false;")],ALL46),
'R46-W4-order':(WP,[("[[RINDBRUMM,()=>d.active!==seat&&albazGY&&hand>0],[TITANIKLAD,","[[TITANIKLAD,()=>false],[RINDBRUMM,()=>d.active!==seat&&albazGY&&hand>0],[LUBELLION,")],ALL46),
'R46-W4-unwired':(BK,[("{const wb=wbPick(d,seat,m,response,M,R);if(wb)return wb}/* r46 W4 */","")],ALL46),
'R46-W9-own-turn':(WP,[("(d.active===seat||d.phase>=8)","(d.phase>=8)")],ALL46),
'R46-W10-off':(BK,[("R46.on&&R46.setTraps&&x.c.location===8","false&&x.c.location===8")],ALL46),
'R46-W11-big-ok':(WP,[("&&atk(x)<=2500);","&&atk(x)<=9999);")],ALL46),
'R46-W11-material-off':(WP,[("{const cm=wbCartesiaMaterial(d,seat,m,response,M,R);if(cm)return cm}","")],ALL46),
'R46-W11-their-turn-free':(WP,[("if(haveJade&&!quem&&!albazField)return","if(false)return")],ALL46),
'R46-W12-equal-ok':(WP,[("if(foes.some(x=>power(x)<atk))return null;","if(foes.some(x=>power(x)<=atk))return null;")],ALL46),
'R46-W12-facedown-blocked':(WP,[("if(foes.some(x=>!faceUp(x)))return null;","")],ALL46),
'R46-W12-base-unwired':(P,[("(key==='attacks'?wbAttackBlock(d,seat,c):","(key==='attacks'?null:")],ALL46),
'R46-W12-search-unwired':(P,[("||key==='attacks'&&this.book&&wbAttackBlock(view,seat,c)/* r46 W12 */","")],ALL46),
'R46-VB-no-art':(VB,[("frame.classList.toggle('has-boss',ok);","frame.classList.toggle('has-boss',false);")],ALL46),
'R46-VB-no-label':(VB,[("'WINNER · '+deckName+' · '+cardName","cardName")],ALL46),
'R46-VB-stale-name':(VB,[("cardName=/, boss monster of /.test(alt)?(art.getAttribute('data-card')||alt.replace(/, boss monster of .*$/,'')):alt;","cardName=art.getAttribute('data-card')||alt;")],ALL46),
'R46-VB-no-fallback':(VB,[("art.onerror=()=>{frame.classList.remove('has-boss');","art.onerror=()=>{;")],ALL46),
'R46-VB-draw-art':(VB,[("const ok=!drawn&&!art.hidden&&!!src;","const ok=!!src||drawn;")],ALL46),
'R46-VB-css-hidden':(AC,[("#victory-scene .victory-art-frame.has-boss #victory-art{opacity:1}","#victory-scene .victory-art-frame.has-boss #victory-art{opacity:0}")],ALL46),
'R46-VB-css-emblem-kept':(AC,[("#victory-scene .victory-art-frame.has-boss{background-image:none!important}","")],ALL46),
'R46-VB-unloaded':(IX,[('<script type="module" src="victory-boss.mjs"></script>','')],ALL46),
})
os.makedirs('mutations-r46',exist_ok=True);summary=[];root=os.getcwd()
only=sys.argv[1:]
for name,(F,reps,tests) in muts.items():
  if only and not any(re.search(o,name) for o in only):continue
  w=f'/tmp/mut-r46-{name}';shutil.rmtree(w,ignore_errors=True)
  shutil.copytree(root,w,symlinks=True,ignore=shutil.ignore_patterns('mutations','mutations-r45','mutations-r46','full-run','node_modules','.git'))
  p=f'{w}/dist/{F}';s=open(p,encoding='utf-8').read();ok=True
  for a,b in reps:
    if s.count(a)<1: ok=False;print(name,'PATTERN MISSING',repr(a[:80]),flush=True);break
    s=s.replace(a,b)
  if not ok: summary.append(f'{name} PATTERN_MISSING');shutil.rmtree(w,ignore_errors=True);continue
  open(p,'w',encoding='utf-8').write(s)
  r=subprocess.run(['node','--test',*tests],cwd=w,capture_output=True,text=True)
  out=r.stdout+r.stderr;fails=sorted(set(l.strip()[:120] for l in out.splitlines() if l.startswith('✖ (')))
  open(f'mutations-r46/{name}.log','w').write(out)
  status='KILLED' if r.returncode else 'SURVIVED'
  line=f'{name} {status} {len(fails)} {fails[:3]}';print(line,flush=True);summary.append(line)
  shutil.rmtree(w,ignore_errors=True)
open('mutations-r46/summary.txt','w').write('\n'.join(summary)+'\n')
print('DONE',sum(1 for s in summary if ' KILLED ' in s),'/',len(summary))

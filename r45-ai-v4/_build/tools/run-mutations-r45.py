import shutil,subprocess,os,re,sys
# r45: every r44 mutation (r44 runner, unchanged patterns) plus the r45 AI v4 mutations; each must be KILLED.
src=open(os.path.join(os.path.dirname(__file__),'run-mutations-r44.py'),encoding='utf-8').read()
muts={}
exec(src[:src.index("os.makedirs('mutations'")])  # defines muts, B, BK, ALL, ...
T45='tests/r45-ai-v4.test.mjs'
ALL45=ALL+[T45]
for k,(F,reps,tests) in list(muts.items()):muts[k]=(F,reps,tests+[T45])
P='optimal-pilot.mjs';VP='ai/book/v4-plan.mjs';WP='ai/world-pool.mjs';IS='ai/info-set.mjs';SK='ai/book/sky-lines.mjs';DK='decks.json'
muts.update({
'V4-fv-revive-any':(B,[("&&(!V4.on||!V4.recovery||goodVirtuousRevive(d,seat,c));/* r45 v4 */",";")],ALL45),
'V4-fv-handtrap-ok':(B,[("if(HAND_TRAP_NAME.test(n))return -1;return (type&EXTRA)","if(HAND_TRAP_NAME.test(n))return 1;return (type&EXTRA)")],ALL45),
'V4-fv-pick-off':(B,[("if(V4.on&&V4.recovery&&source===FALLEN_VIRTUOUS&&d.hint===509){","if(false){")],ALL45),
'V4-keys-off':(BK,[("...(V4.on?V4_BR","...(false?V4_BR")],ALL45),
'V4-keys-no-albion':(BK,[("'Fallen of Albaz','Albion the Shrouded Dragon',","'Fallen of Albaz',")],ALL45),
'V4-lethal-unwired':(P,[("const v4Lethal=this.book?v4LethalNow(d,seat,m):null;","const v4Lethal=null;")],ALL45),
'V4-lethal-any-damage':(VP,[("if(!b?.lethal||b.uncertain)return null;","if(!b?.steps?.length)return null;")],ALL45),
'V4-lethal-untrusted':(P,[("||baseline.book?.kind==='lethal'/* r45 v4: visible lethal */","")],ALL45),
'V4-end-any-action':(VP,[("d.turn!==2||r?.action!==7||","d.turn!==2||")],ALL45),
'V4-lenatus-off':(B,[("const len=brandedV4Lenatus(d,seat,m,blocked,R);","const len=null;")],ALL45),
'V4-lenatus-mat-off':(BK,[("{const lm=brandedV4LenatusMaterial(d,seat,m,M,R);","{const lm=null;")],ALL45),
'V4-lenatus-turn1':(B,[("d.phase!==4||!m?.to_bp||d.turn<2)return null;\n if(!d.zone(seat,FIELD).some(c=>albazNamed","d.phase!==4)return null;\n if(!d.zone(seat,FIELD).some(c=>albazNamed")],ALL45),
'V4-recovery-filtered':(BK,[("(V4.on&&V4.recovery||!String(l.id).startsWith('V4-R-'))","(!String(l.id).startsWith('V4-R-'))")],ALL45),
'V4-recovery-albion-gone':(B,[("  line('V4-R-ALBION',","  line('V4-R-ALBION-OFF',")],ALL45),
'V4-sky-trusted':(SK,[('"trust": false,/* r45 v4 hybrid','"trust": true,/* r45 v4 hybrid')],ALL45),
'V4-sky-no-lines':(SK,[("get lines(){return V4.on&&V4.sky?SKY_LINES:[]}","get lines(){return []}")],ALL45),
'V4-sky-handtrap-summon':(SK,[("get blocks(){return V4.on&&V4.sky?[...BOOK._blocks,...SKY_V4_BLOCKS]:BOOK._blocks}","get blocks(){return BOOK._blocks}")],ALL45),
'V4-sky-shipped-on':('ai/v4-flags.mjs',[(' sky:false',' sky:true')],ALL45),
'V4-forced-chain-off':(P,[("if(key==='selects'&&m.type===M.SELECT_CHAIN&&m.forced&&!filtered.selects.length)","if(false)")],ALL45),
'V4-pool-refillcap-ignored':(WP,[("if (pass && (refills >= refillCap || !roomFor()))","if (pass && (!roomFor()))")],ALL45),
'V4-pool-room-ignored':(WP,[("const roomFor = () => !timeLeft || timeLeft() >= minRefillMs;","const roomFor = () => true;")],ALL45),
'V4-pilot-no-caps':(P,[("poolOptions:soft?{","poolOptions:false?{")],ALL45),
'V4-pilot-no-softstop':(P,[("shouldStop:sStop,","shouldStop:outer,")],ALL45),
'V4-full-16':(IS,[("const fullWorlds=pool?Math.max(8,Math.min(16,pool.size||16)):16;","const fullWorlds=16;")],ALL45),
'V4-stale-comment-back':(B,[("face-up on either field","face-up only, either field")],ALL45),
'V4-rename-reverted':(DK,[('"name":"Kevy\'s Branded Deck"','"name":"Branded \\u00b7 MetaGamesGX 41 \\u00b7 budget Extra (10 Nov)"')],ALL45),
'V4-rename-plain':(DK,[('"name":"Kevy\'s Branded Deck","subtitle"','"name":"Branded","subtitle"')],ALL45),
})
os.makedirs('mutations-r45',exist_ok=True);summary=[];root=os.getcwd()
only=sys.argv[1:]
for name,(F,reps,tests) in muts.items():
  if only and not any(re.search(o,name) for o in only):continue
  w=f'/tmp/mut-r45-{name}';shutil.rmtree(w,ignore_errors=True)
  shutil.copytree(root,w,symlinks=True,ignore=shutil.ignore_patterns('mutations','mutations-r45','full-run','node_modules','.git'))
  p=f'{w}/dist/{F}';s=open(p,encoding='utf-8').read();ok=True
  for a,b in reps:
    if s.count(a)<1: ok=False;print(name,'PATTERN MISSING',repr(a[:80]),flush=True);break
    s=s.replace(a,b)
  if not ok: summary.append(f'{name} PATTERN_MISSING');shutil.rmtree(w,ignore_errors=True);continue
  open(p,'w',encoding='utf-8').write(s)
  r=subprocess.run(['node','--test',*tests],cwd=w,capture_output=True,text=True)
  out=r.stdout+r.stderr;fails=sorted(set(l.strip()[:120] for l in out.splitlines() if l.startswith('✖ (')))
  open(f'mutations-r45/{name}.log','w').write(out)
  status='KILLED' if r.returncode else 'SURVIVED'
  line=f'{name} {status} {len(fails)} {fails[:3]}';print(line,flush=True);summary.append(line)
  shutil.rmtree(w,ignore_errors=True)
open('mutations-r45/summary.txt','w').write('\n'.join(summary)+'\n')
print('DONE',sum(1 for s in summary if ' KILLED ' in s),'/',len(summary))

import shutil,subprocess,os
# (file, [(old,new)], tests)
B='ai/book/branded-nov08.mjs';BR='ai/brain/branded-brain.mjs';FX='dl-fx.mjs';DK='decks.json'
OLD=['tests/branded-nov08.test.mjs','tests/r42-swap.test.mjs'];NEW=['tests/r41-fixes.test.mjs','tests/r42-swap.test.mjs'];ALL=['tests/branded-nov08.test.mjs','tests/r41-fixes.test.mjs','tests/r42-swap.test.mjs','tests/r40-dlfx.test.mjs','tests/r44-superpoly.test.mjs']
BK='ai/book/book.mjs'
muts={
'B4-drop-hold':(B,[("if(card.code===FALLEN_VIRTUOUS&&!publicTargets(d,seat).length&&!plausibleVirtuousRevival(d,seat))","if(false)")],OLD),
'B1-revert-keep':(B,[("return select(garura,'Nadir: Garura draw when Cartesia/Quem follow-up is live.',true);","return select(garura,'x');")],OLD),
'B1-nokeepflag':(B,[("follow-up is live.',true);","follow-up is live.');")],OLD),
'B1-drop-cartesia-pre':(B,[("canNormal(d,seat,M)&&ownRemaining(d,seat,CARTESIA)&&","canNormal(d,seat,M)&&")],OLD),
'B1-drop-normal-pre':(B,[("d.hint===504&&canNormal(d,seat,M)&&","d.hint===504&&")],OLD),
'B2-drop-hold':(B,[("if(card.code===CHAMPIONS&&card.location===FIELD&&d.prompt?.type===M.SELECT_IDLECMD&&!championsTargets(d,seat).length)","if(false)")],OLD),
'B2-drop-targetpick':(B,[("if(options.length)return pickIndex(options[0].i,'Three","if(false)return pickIndex(options[0].i,'Three")],OLD),
'B2-vanilla-counts':(B,[("const championsTargets=(d,seat)=>publicTargets(d,seat).filter(c=>worthwhile(d,c));","const championsTargets=(d,seat)=>publicTargets(d,seat);")],OLD),
'B3-drop-fusionfirst':(B,[("for(const code of [FUSION,BRANDED_IN_WHITE,DEPLOYMENT]){","for(const code of []){")],OLD),
'B3-drop-kitt':(B,[("if(kittCanFindFusion){","if(false){")],OLD),
'B3-kitt-tuck-revert':(B,[("if(offered.length)return pickIndex(offered[0].i,'Kitt:","if(false)return pickIndex(offered[0].i,'Kitt:")],OLD),
'liveBreak-anyED':(B,[("const liveBreak=enemy.some(c=>albazMaterial(d,c))","const liveBreak=enemy.some(c=>d.db[c.code]?.type&EXTRA)")],OLD),
'FV-option-off':(B,[("if(!isBrandedNov08(d.decks?.[seat])||d.currentEffect?.code!==30271097)return null;","return null;")],OLD),
# r41 fixes reverted one at a time
'R41-1-biw-lock-text':(BR,[("No Extra Deck lock: it stays usable after a Synchro, unlike Branded Fusion.","Same whole-turn Fusion-only Extra Deck restriction as Branded Fusion.")],NEW),
'R41-1-biw-lock-row':(BR,[("   {card:'Branded Fusion',lock:","   {card:'Branded in White',lock:'Fusion Monsters only from the Extra Deck this turn',advice:'same whole-turn lock as Branded Fusion'},\n   {card:'Branded Fusion',lock:")],NEW),
'R41-1-route-revert':(BR,[("'No Extra Deck lock: it still works after a Synchro this turn'","'Respect the whole-turn Fusion-only Extra Deck lock'")],NEW),
'R41-2-trikitt-starter':(B,[("starters:[AL,F,OPEN,W,K,N,'Branded in White'],","starters:[AL,F,OPEN,W,K,N,'Branded in White','Tri-Brigade Springans Kitt'],")],NEW),
'R41-2-trikitt-ns-line':(B,[("{hand:['Tri-Brigade Springans Kitt'],field:[MER]},[act('Tri-Brigade Springans Kitt',[2])]","{hand:['Tri-Brigade Springans Kitt']},[summon('Tri-Brigade Springans Kitt')]")],NEW),
'R41-2-trikitt-text':(BR,[("No Normal Summon effect: it does not send or search anything.","Normal Summon extender that can send/search toward Branded Fusion access.")],NEW),
'R41-3-no-anchor':(FX,[(" const k=anchors.get(Number(e?.chain)||0);if(k?.source&&"," const k=null;if(k?.source&&")],NEW),
'R41-3-no-generic':(FX,[("if(!r&&neg){","if(false){")],NEW),
'R41-3-no-code-check':(FX,[("(!e?.code||!k.code||k.code===e.code)","true")],NEW),
'R41-4-turn-floor':(FX,[("mount(doc,'dlfx-turn',ms,","mount(doc,'dlfx-turn',Math.max(ms,900),")],NEW),
'R41-4-burst-floor':(FX,[("n=mount(doc,'dlfx-burst',ms,","n=mount(doc,'dlfx-burst',Math.max(ms,700),")],NEW),
'R41-4-cleanup40':(FX,[("},Math.max(1,Math.round(ms)));return n}","},ms+40);return n}")],NEW),
'R41-4-stagger':(FX,[("Math.min(70,ms*.08)","70")],NEW),
'R41-4-sound-cut':(FX,[("cutTimer=setTimeout(()=>{cutTimer=null;silence()},budget)","cutTimer=setTimeout(()=>{cutTimer=null;silence()},budget+400)")],NEW),
'R41-D-wingman-back':(DK,[("[44146295,76666602,76666602,76666602,80843006,","[44146295,76666602,76666602,80843006,87758525,")],NEW),
# r42 budget swap reverted one at a time
'R42-champ-hold-off':(B,[("if(championsSummonHold(d,seat,c))return 'Branded 41: hold","if(false)return 'Branded 41: hold")],ALL),
'R42-champ-hold-unwired':(BK,[("brandedNov08SpecialBlock(d,seat,c)/* r42 Three Champions hold */||","")],ALL),
'R42-empty-board-syn':(B,[("const syn=threats.length?legalIndex","const syn=true?legalIndex")],ALL),
'R42-any-l8-syn':(B,[("c.location===EXTRA_DECK&&NOV08_EXTRA.synchroL8.includes(c.code),blocked,'special_summons'):-1;","c.location===EXTRA_DECK&&(d.db[c.code]?.type&0x2000),blocked,'special_summons'):-1;")],ALL),
'R42-ED-back-synchro':(B,[("synchroL8:Object.freeze([CHAMPIONS])","synchroL8:Object.freeze([CHAMPIONS,78397661])")],ALL),
'R42-nadir-waits-held':(B,[("c.location===64&&!championsSummonHold(d,seat,c)||","c.location===64||")],ALL),
'R42-break-any-enemy':(B,[("if(ec>=0&&enemy.some(c=>albazMaterial(d,c))&&hand.length>0)","if(ec>=0&&enemy.length&&hand.length>0)")],ALL),
'R42-ecclesia-keep-hand':(B,[("||\n     ownHand(d,seat).some(c=>[FUSION,BRANDED_IN_WHITE,KITT].includes(c.code)))&&",")&&")],ALL),
'R42-superpoly-guard-off':(B,[("if(source===SUPER_POLY&&d.hint===509&&!superPolyTargetOk","if(false&&source===SUPER_POLY&&d.hint===509&&!superPolyTargetOk")],ALL),
'R42-superpoly-no-albaz-S':(B,[("code===SANCTIFIRE?albazOnAField(d,seat)&&lightSpellcasterOnAField(d,seat)","code===SANCTIFIRE?lightSpellcasterOnAField(d,seat)")],ALL),
'R42-superpoly-no-albaz-L':(B,[("code===LENATUS?albazOnAField(d,seat)&&(","code===LENATUS?(")],ALL),
'R42-lenatus-counts-nonmaterial':(B,[("&&!NOV08_EXTRA.notMaterial.includes(c.code)&&Number(c.race","&&Number(c.race")],ALL),
'R42-511-guard-off':(B,[("if(d.hint===511&&NOV08_EXTRA.notMaterial.includes(","if(false&&NOV08_EXTRA.notMaterial.includes(")],ALL),
'R42-sanctifire-idle-off':(B,[("if(inExtra(d,seat,SANCTIFIRE)){const ca=","if(false){const ca=")],ALL),
'R42-sanctifire-pick-off':(B,[("return select(SANCTIFIRE,'White line:","return null;select(SANCTIFIRE,'White line:")],ALL),
'R42-revive-hold-off':(B,[("if(card.code===SANCTIFIRE&&card.location===FIELD&&d.active!==seat&&!sanctifireReviveLive(d,seat))","if(false)")],ALL),
'R42-revive-pick-off':(B,[("if(d.currentEffect?.code===SANCTIFIRE&&m?.type===M.SELECT_UNSELECT_CARD","if(false&&m?.type===M.SELECT_UNSELECT_CARD")],ALL),
'R42-aeon-back':(DK,[(",3410461,38811586]",",33166263,38811586]")],ALL),
'R42-ed-back-deck':(DK,[(",3410461,38811586]",",3410461,78397661]")],ALL),
'R42-brain-ED-card-back':(BR,[("  'Albion the Sanctifire Dragon':{role:'payoff',","  'Ecclesia and the Dark Dragon':{role:'payoff',does:'Level 8 Synchro.'},\n  'Albion the Sanctifire Dragon':{role:'payoff',")],ALL),
'R42-kitt-text':(BR,[("Its search happens only when this card is Normal Summoned or Special Summoned:","On summon,")],ALL),
'R42-kitt-route':(BR,[("'Tri-Brigade Springans Kitt has no search'],","],")],ALL),
'R42-lenatus-superpoly-text':(BR,[("Branded Fusion qualifies, Super Polymerization (a Quick-Play) does not","Branded Fusion or Super Polymerization")],ALL),
'R42-material-text':(BR,[("Cannot be used as Fusion Material, so never Mirrorjade or Albion material","Can be Mirrorjade material")],ALL),
'R42-white-route-ed':(BR,[("'Synchro into Three Champions only against a worthwhile opposing face-up target; otherwise no Synchro'","'Else take a legal Level 8 Synchro (Dark Dragon / Three Champions)'")],ALL),
# r44 Super Polymerization own-face-down fix (RELAY-135) reverted / broken one way at a time
'R44-sp-facedown-off':(B,[("const matOk=(s,c,seat)=>Boolean(c)&&(faceUp(c)||(seat!==undefined&&s===seat&&c.code>0));","const matOk=(s,c,seat)=>Boolean(c)&&faceUp(c);")],ALL),
'R44-sp-seat-unwired':(B,[("superPolyTargetOk(d,cards[response.indicies[0]]?.code,seat)","superPolyTargetOk(d,cards[response.indicies[0]]?.code)")],ALL),
'R44-sp-filter-unwired':(B,[("filter(x=>superPolyTargetOk(d,x.c.code,seat))","filter(x=>superPolyTargetOk(d,x.c.code))")],ALL),
'R44-sp-opp-facedown-counts':(B,[("(seat!==undefined&&s===seat&&c.code>0)","(seat!==undefined&&c.code>0)")],ALL),
'R44-sp-r43-file':(B,[("const matOk=(s,c,seat)=>Boolean(c)&&(faceUp(c)||(seat!==undefined&&s===seat&&c.code>0));","const matOk=(s,c)=>faceUp(c);")],ALL),
}
os.makedirs('mutations',exist_ok=True);summary=[];root=os.getcwd()
for name,(F,reps,tests) in muts.items():
  w=f'/tmp/mut-r44-{name}';shutil.rmtree(w,ignore_errors=True)
  shutil.copytree(root,w,symlinks=True,ignore=shutil.ignore_patterns('mutations','full-run','node_modules','.git'))
  p=f'{w}/dist/{F}';s=open(p,encoding='utf-8').read();ok=True
  for a,b in reps:
    n=s.count(a)
    if n<1: ok=False;print(name,'PATTERN MISSING',repr(a[:80]));break
    s=s.replace(a,b)  # replace all (decks.json has the list twice)
  if not ok: summary.append(f'{name} PATTERN_MISSING');continue
  open(p,'w',encoding='utf-8').write(s)
  r=subprocess.run(['node','--test',*tests],cwd=w,capture_output=True,text=True)
  out=r.stdout+r.stderr;fails=sorted(set(l.strip()[:120] for l in out.splitlines() if l.startswith('✖ (')))
  open(f'mutations/{name}.log','w').write(out)
  status='KILLED' if r.returncode else 'SURVIVED'
  line=f'{name} {status} {len(fails)} {fails[:3]}';print(line,flush=True);summary.append(line)
  shutil.rmtree(w,ignore_errors=True)
open('mutations/summary.txt','w').write('\n'.join(summary)+'\n')
print('DONE',sum(1 for s in summary if ' KILLED ' in s),'/',len(summary))

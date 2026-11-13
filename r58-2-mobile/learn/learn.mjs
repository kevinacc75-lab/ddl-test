// r53 Learning mode v1 (Claude, 13 Nov 2026). Kevy 13 Nov: "I want to invest in this" (13:18), "an original sphinx cat
// as our mascot" with "a speech bubble" (13:24), "all the visual cues and sound fx ... immersive and vibrant and guided"
// (13:29), "a fail safe that it will admit it needs to fact check" (13:33), the anime Guide (14:35).
// Ruling Desk lessons (scripted, paced) from learn/lessons.mjs, the Guide (learn/tutors.mjs from r55; learn/guide.mjs is the archived r53 sphinx), a local Fact-check queue
// with export, and two separate trust badges (engine outcome vs rules review; RELAY-180 HIGH 1). Presentation only: it
// never touches a duel. Guided Duel arrives in r54.
import {LESSONS,CARDS as RD_CARDS,ENGINE_CHECK,engineState} from './lessons.mjs';import {CHOKEPOINTS,CP_CARDS,cpBeats} from './chokepoints.mjs';import {ENGINE_EVIDENCE} from './engine-evidence.mjs';
// r57: Ruling Desk lessons and Choke Point Lab lessons share one player; indexes 0..n-1 are the Ruling Desk (unchanged).
const ALL=[...LESSONS,...CHOKEPOINTS];const CARDS={...CP_CARDS,...RD_CARDS};
const isCP=l=>l?.kind==='choke_point';import {guideSVG,TUTORS,getSelectedTutor,selectTutor,guideName} from './tutors.mjs';import {installCoach} from './coach.mjs';
const SPK='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5L6 9H3v6h3l5 4V5z"></path>',SPK_ON=SPK+'<path d="M15.5 8.5a5 5 0 010 7M18.5 5.5a9 9 0 010 13"></path></svg>',SPK_OFF=SPK+'<path d="M16 9l5 6M21 9l-5 6"></path></svg>';
const MUSIC='learn/music.mp3';
const KEY='ddl-r53-learn',QKEY='ddl-r53-factcheck';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const load=(k,d)=>{try{const v=JSON.parse(localStorage.getItem(k)||'null');return v??d}catch{return d}};
const store=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch{return false}};
const reduced=()=>{try{return matchMedia('(prefers-reduced-motion: reduce)').matches}catch{return false}};
// r55: the Guide is the tutor the player picks (learn/tutors.mjs). Lapawri, the r53-r54 sphinx cat (Kevy 14:58 named it), is
// archived in learn/guide.mjs per Kevy 16:20 "retire lawpri or put in archive"; not offered. Display only, never part of any id.
export const ARCHIVED_GUIDE='Lapawri';export {guideName};
export const REVIEW={status:'pending',label:'Rules: pending Seto team check',authored:'Authored by ChatGPT — pending Seto/team fact check'};
// RELAY-177 exact fail-safe wording; "saved" only after the write really succeeded.
export const FAILSAFE={saved:'Thanks. I’ve saved this step for a fact check.',failed:'This needs a fact check. I couldn’t save the note.',unsure:'I’m not sure how this interaction works. I’ve saved it for a fact check.',unsureUnsaved:'I’m not sure how this interaction works. It needs a fact check.'};
// ---------- sound: small synthesized cues (no files); one at a time, never overlapping ----------
let ctx=null,last=0;
export function cue(name,on=true){if(!on)return;try{ctx=ctx||new (window.AudioContext||window.webkitAudioContext)();const t=ctx.currentTime;if(t-last<0.05)return;last=t;
 const g=ctx.createGain();g.connect(ctx.destination);const o=ctx.createOscillator();o.connect(g);
 const set=(type,f0,f1,dur,vol)=>{o.type=type;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(f1,t+dur);g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);o.start(t);o.stop(t+dur+0.02)};
 ({paw:()=>set('sine',660,520,0.08,0.06),tick:()=>set('triangle',1200,900,0.06,0.05),slide:()=>set('sawtooth',300,140,0.16,0.025),paper:()=>set('triangle',900,500,0.12,0.03),
   chime:()=>{set('sine',880,1320,0.35,0.07);const o2=ctx.createOscillator(),g2=ctx.createGain();o2.connect(g2);g2.connect(ctx.destination);o2.frequency.value=1760;g2.gain.setValueAtTime(0.03,t+0.08);g2.gain.exponentialRampToValueAtTime(0.0001,t+0.5);o2.start(t+0.08);o2.stop(t+0.52)},
   thud:()=>set('sine',140,60,0.22,0.12)})[name]?.()}catch{}}
// ---------- fact-check queue (local only until the player exports it) ----------
export function queueAdd(entry,write=store){const q=load(QKEY,[]);const e={...entry,at:new Date().toISOString(),state:'local_saved'};const ok=write(QKEY,[...q,e].slice(-200));return ok?e:null}
export const queueList=()=>load(QKEY,[]);
function card(code,cls=''){const c=CARDS[code];return c?`<figure class="lr-card ${cls}" data-code="${code}"><img src="${esc(c.art)}" alt="${esc(c.name)}" loading="lazy"><figcaption>${esc(c.name)}</figcaption></figure>`:''}
export function boardHTML(b={}){const mark=c=>(b.bad||[]).includes(c)?'bad':(b.off||[]).includes(c)?'off':(b.good||[]).includes(c)?'good':'';
 const slots=(arr,label)=>`<div class="lr-row"><span class="lr-label">${label}</span><div class="lr-slots">${arr.map(c=>`<div class="lr-slot">${c?card(c,mark(c)):''}</div>`).join('')}</div></div>`;
 return `${(b.opp||[]).length?`<div class="lr-row lr-opp"><span class="lr-label">${esc(b.oppLabel||'OPPONENT’S HAND · shown for this lesson')}</span><div class="lr-line">${b.opp.map(c=>card(c,mark(c))).join('')}</div></div>`:''}
${(b.oppSt||[]).length?`<div class="lr-row lr-oppf"><span class="lr-label">OPPONENT’S SPELL &amp; TRAP ZONE</span><div class="lr-slots">${[null,null,...b.oppSt,null,null].slice(0,5).map(c=>`<div class="lr-slot">${c?card(c,mark(c)):''}</div>`).join('')}</div></div>`:''}
${(b.oppMmz||[]).length?`<div class="lr-row lr-oppf"><span class="lr-label">OPPONENT’S MONSTER ZONES</span><div class="lr-slots">${b.oppMmz.map(c=>`<div class="lr-slot">${c?card(c,mark(c)):''}</div>`).join('')}</div></div>`:''}
${b.emz!==undefined?`<div class="lr-row"><span class="lr-label">EXTRA MONSTER ZONE</span><div class="lr-slots lr-emz"><div class="lr-slot">${b.emz?card(b.emz,'good'):''}</div></div></div>`:''}
${b.mmz||!(b.oppMmz||b.oppSt)?slots(b.mmz||[null,null,null,null,null],'YOUR MAIN MONSTER ZONES'):''}
${(b.st||[]).length?slots([null,null,...b.st,null,null].slice(0,5),'SPELL &amp; TRAP ZONE'):''}
${(b.banished||[]).length?`<div class="lr-row" data-zone="banished"><span class="lr-label">YOUR BANISHED CARDS · face-up</span><div class="lr-line">${b.banished.map(c=>card(c,mark(c))).join('')}</div></div>`:''}
${(b.gy||[]).length?`<div class="lr-row" data-zone="gy"><span class="lr-label">YOUR GRAVEYARD</span><div class="lr-line">${b.gy.map(c=>card(c,mark(c))).join('')}</div></div>`:''}
${(b.hand||[]).length?`<div class="lr-row"><span class="lr-label">YOUR HAND</span><div class="lr-line">${b.hand.map(c=>card(c,(b.handOff||[]).includes(c)?'off':mark(c))).join('')}</div></div>`:''}
${(b.chain||[]).length?`<div class="lr-chain" aria-label="Chain"><span class="lr-label">CHAIN · resolves from the top</span>${[...b.chain].map((l,i)=>({...l,n:i+1})).reverse().map(l=>`<div class="lr-link ${l.who}${b.resolving&&l.n===b.chain.length?' resolving':''}"><b>${l.n}</b>${CARDS[l.code]?`<img src="${esc(CARDS[l.code].art)}" alt="">`:''}<span>${esc(CARDS[l.code]?.name||'')}<small>${l.who==='you'?'You':'Opponent'}</small></span></div>`).join('')}</div>`:''}
${b.stamp?`<div class="lr-stamp ${b.stamp.kind}" role="status">${esc(b.stamp.text)}</div>`:''}`}
// r55 per-lesson engine badge (RELAY-192 A10): reproduced only on this build's recorded pass for every listed test.
export function engineBadge(l){const s=engineState(l);return s==='reproduced'?`<span class="lr-badge eng" title="${esc((l.engineTests||[]).join(', ')+' ('+ENGINE_EVIDENCE.log+')')}">✓ Engine outcome reproduced</span>`:s==='failed'?'<span class="lr-badge engfail">⚠ Engine check failed: needs review</span>':'<span class="lr-badge engnone">Engine check: NOT RUN</span>'}
// r58 (Seto team RELAY-199 LOW-5): rules status per lesson revision; anything without a recorded team check stays pending.
export function rulesBadge(l){return l?.rulesCheck?`<span class="lr-badge rules ok">Rules: checked by Seto team (${esc(l.rulesCheck)})</span>`:`<span class="lr-badge rules">${esc(REVIEW.label)}</span>`}
export function textHTML(t,open=true){const c=CARDS[t?.code];if(!c?.text)return '';const i=c.text.indexOf(t.hl);const body=i<0?esc(c.text):esc(c.text.slice(0,i))+'<mark>'+esc(t.hl)+'</mark>'+esc(c.text.slice(i+t.hl.length));
 return `<details class="lr-text"${open?' open':''}><summary><b>${esc(c.name)}</b> · card text</summary><div class="lr-text-head"><a href="https://www.db.yugioh-card.com/yugiohdb/card_search.action?cid=${c.cid}&amp;ope=2&amp;request_locale=en" target="_blank" rel="noopener">official text</a></div><p>${body.replace(/\n/g,'<br>')}</p></details>`}
export function installLearn(root=document){
 if(root.getElementById('learn'))return null;
 const prefs={sound:true,...load(KEY,{})};prefs.progress=prefs.progress||{};
 const save=()=>store(KEY,prefs);
 const el=document.createElement('section');el.id='learn';el.hidden=true;el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-label','Learn');document.body.append(el);
 const btn=document.createElement('button');btn.id='learn-open';btn.type='button';btn.className='learn-open';btn.innerHTML='<span aria-hidden="true">✦</span> Learn';
 {const anchor=root.querySelector('header.topbar #sound');if(anchor)anchor.before(btn);else document.body.append(btn)}
 let view='home',lesson=null,beat=0,branch=null,lastFocus=null,toastT=0,waitingLib=false;
 let textOpen=!(typeof matchMedia==='function'&&matchMedia('(max-width:480px)').matches);/* phone: card text starts folded; the reader's open/close choice is kept */
 const beatsOf=l=>isCP(l)?cpBeats(l,branch):l.beats;
 const branchLabel=l=>l.beats.find(x=>x.choice)?.choice.options.find(o=>o.branch===branch)?.label||'';
 const toast=t=>{let n=el.querySelector('.lr-toast');if(!n)return;n.textContent=t;n.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>n.classList.remove('on'),3200)};
 const soundBtn=()=>(music?`<button type="button" class="lr-icon" data-act="music" aria-pressed="${prefs.music!==false}" aria-label="Music ${prefs.music!==false?'on':'off'}">${prefs.music!==false?'♪':'<s>♪</s>'}</button>`:'')+`<button type="button" class="lr-icon" data-act="sound" aria-pressed="${prefs.sound}" aria-label="Sound effects ${prefs.sound?'on':'off'}">${prefs.sound?SPK_ON:SPK_OFF}</button>`;
 function home(){const q=queueList(),T=getSelectedTutor();
  return `<div class="lr-screen lr-home"><div class="lr-top"><button type="button" class="lr-icon" data-act="close" aria-label="Close Learn">✕</button><span class="lr-eyebrow">LEARN</span>${soundBtn()}</div>
<div class="lr-hero" style="--tutor-accent:${T.accent}"><div class="lr-hero-art"><img class="lr-hero-card" src="${esc(T.cardArt)}" alt="" loading="lazy"><div class="lr-guide lr-guide-big">${guideSVG('proud')}</div></div><div><span class="lr-eyebrow">YOUR TUTOR</span><h2>Learn with ${esc(guideName())}</h2><p>Rulings and combos, one step at a time.</p></div></div>
<div class="lr-sec"><span class="lr-eyebrow">CHOOSE YOUR TUTOR</span><span>Same lessons, your pick</span></div>
<div class="lr-tutors" role="group" aria-label="Choose your tutor">${TUTORS.map(t=>`<button type="button" data-tutor="${t.id}" aria-pressed="${t.id===T.id}" aria-label="${esc(t.name)}" style="--tutor-accent:${t.accent}"><span class="lr-tcard" style="background-image:url('${esc(t.cardArt)}')"></span><span class="lr-tmini">${guideSVG(t.id===T.id?'legal':'neutral',{tutor:t.id,motion:t.id===T.id})}</span><b>${esc(t.shortName)}</b><small>${esc(t.theme)}</small></button>`).join('')}</div>
<div class="lr-modes"><button type="button" class="lr-mode gold" data-act="list">Ruling Desk<small>Short, paced lessons</small></button><button type="button" class="lr-mode teal" data-act="guided">Guided Duel<small>${prefs.coach?'Coach on · ':''}Play our AI with ${esc(guideName())} explaining</small></button><button type="button" class="lr-mode rose" data-act="cplist">Choke Point Lab<small>Pause at a real response window. Choose, then compare.</small></button></div>
<div class="lr-sec"><span class="lr-eyebrow">RULING DESK LESSONS</span><span>${LESSONS.filter(l=>prefs.progress[l.id]?.done).length} of ${LESSONS.length} done</span></div>
<ol class="lr-list">${LESSONS.map((l,i)=>{const p=prefs.progress[l.id];return `<li><button type="button" data-lesson="${i}" class="${p?.done?'done':''}"><span class="lr-num">${p?.done?'✓':i+1}</span><span><b>${esc(l.title)}</b><small>${esc(l.level)} · ${esc(l.decks)} · ${l.minutes} min · ${p?.done?'done':p?'continue':'new'}</small></span></button></li>`}).join('')}</ol>
<div class="lr-sec" id="lr-cp"><span class="lr-eyebrow">CHOKE POINT LAB</span><span>${CHOKEPOINTS.filter(l=>prefs.progress[l.id]?.done).length} of ${CHOKEPOINTS.length} done</span></div>
<ol class="lr-list lr-cplist">${CHOKEPOINTS.map((l,j)=>{const i=LESSONS.length+j,p=prefs.progress[l.id];return `<li><button type="button" data-lesson="${i}" class="${p?.done?'done':''}"><span class="lr-num cp">${p?.done?'✓':'C'+(j+1)}</span><span><b>${esc(l.title)}</b><small>${esc(l.level)} · ${esc(l.decks)} · ${l.minutes} min · ${p?.done?'done':p?'continue':'new'}</small></span></button></li>`}).join('')}</ol>
<button type="button" class="lr-queue" data-act="queue"><span class="lr-num q">?</span><span>Fact-check queue</span><b>${q.length} saved</b></button>
<p class="lr-note">${esc(REVIEW.authored)}. Each lesson shows its own engine check from this build’s recorded test run.</p><div class="lr-toast" role="status" aria-live="polite"></div></div>`}
 // r58: ChatGPT's learn-temple-r1 layout (RELAY-202): tutor above the board in DOM order, a scrolling workspace, a footer
 // with badges, flag and controls. Both C1 options are styled the same and focus lands on the prompt, not on an option.
 function player(){const l=ALL[lesson],seq=beatsOf(l),b=seq[beat],choosing=!!(b.choice&&!branch),last=!choosing&&beat===seq.length-1,cp=isCP(l),srcLed=(b.tags||[]).includes('SOURCE-LED');
  return `<div class="lr-screen lr-play" data-studio="temple" data-mood="${esc(b.mood)}"><div class="lr-top"><button type="button" class="lr-icon" data-act="home" aria-label="Back to lessons">‹</button><div class="lr-titles"><span class="lr-eyebrow">${cp?'CHOKE POINT LAB':'RULING DESK'} · ${esc(l.id)}${cp&&branch?' · '+esc(branchLabel(l)):''}</span><b>${esc(l.title)}</b></div>${soundBtn()}</div>
<div class="lr-progress" aria-label="Step ${beat+1} of ${seq.length}${choosing?' so far':''}">${seq.map((_,i)=>`<span class="${i<beat?'past':i===beat?'now':''}"></span>`).join('')}${choosing?'<span class="lr-more" aria-hidden="true"></span>':''}</div>
<div class="lr-talk"><div class="lr-guide">${guideSVG(b.mood)}</div><div class="lr-bubble" aria-live="polite"><span class="lr-who">${esc(guideName())}</span><p>${esc(b.say)}</p>${b.caption?`<p class="lr-caption">${esc(b.caption)}</p>`:''}</div></div>
<div class="lr-workspace" data-beat="${beat}"><div class="lr-board">${boardHTML(b.board)}</div>
${textHTML(b.text,textOpen)}
${(b.tags||[]).length?`<div class="lr-tags">${b.tags.map(t=>`<span>${esc(t)}</span>`).join('')}</div>`:''}
${(b.chips||[]).length?`<div class="lr-chips">${b.chips.map(c=>`<span class="lr-chip ${esc(c.kind)}">${esc(c.text)}</span>`).join('')}</div>`:''}
${b.catch?`<div class="lr-catch" role="note"><b>THE CATCH</b><p>${esc(b.catch)}</p></div>`:''}</div>
<div class="lr-footer"><div class="lr-badges">${srcLed?'<span class="lr-badge engnone">Engine: not replayed for this step (source-led)</span>':engineBadge(l)}${rulesBadge(l)}${b.strategy?`<span class="lr-badge strat">Good play · reviewed by ${esc(b.strategy.reviewer)}</span>`:''}${cp?'<span class="lr-badge strat">Candidate window · not a “best play” claim</span>':''}</div>
<button type="button" class="lr-flag" data-act="flag">Something look wrong? Flag this step</button>
${choosing?`<div class="lr-controls lr-choice" role="group" aria-labelledby="lr-choice-label"><span class="lr-eyebrow" id="lr-choice-label" tabindex="-1">${esc(b.choice.prompt)} · your choice</span><div><button type="button" data-act="back">Back</button>${b.choice.options.map(o=>`<button type="button" data-branch="${esc(o.branch)}">${esc(o.label)}</button>`).join('')}</div></div>`:`<div class="lr-controls"><button type="button" data-act="back" ${beat===0?'disabled':''}>Back</button><button type="button" class="lr-icon" data-act="replay" aria-label="Replay this step">↺</button><button type="button" class="primary" data-act="${last?'ruling':'next'}">${last?(cp?'Compare and ruling':'The ruling'):'Next'}</button></div>`}</div><div class="lr-toast" role="status" aria-live="polite"></div></div>`}
 function ruling(){const l=ALL[lesson],next=ALL[lesson+1],cp=isCP(l),other=cp&&l.beats.find(x=>x.choice)?.choice.options.find(o=>o.branch!==branch);
  return `<div class="lr-screen lr-ruling" data-studio="temple"><div class="lr-top"><button type="button" class="lr-icon" data-act="home" aria-label="Back to lessons">‹</button><div class="lr-titles"><span class="lr-eyebrow">${cp?'CHOKE POINT LAB':'RULING DESK'} · ${esc(l.id)}</span><b>${esc(l.title)}</b></div>${soundBtn()}</div>
<div class="lr-talk"><div class="lr-guide">${guideSVG('proud')}</div><div class="lr-bubble"><span class="lr-who">${esc(guideName())}</span><p>Nicely done. That’s ${esc(l.id)} complete.</p></div></div>
${cp&&l.question?`<details class="lr-question"><summary><span class="lr-eyebrow">YOUR QUESTION</span><b>${esc(l.question.ask)}</b><small>Tap to reveal the answer for this exact line</small></summary><p>${esc(l.question.answer)}</p></details>`:''}
<div class="lr-card-ruling"><h3>✦ THE RULING</h3><p>${esc(l.ruling)}</p><span class="lr-eyebrow">SOURCES</span><ul>${l.sources.map(s=>`<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)}</a></li>`).join('')}</ul>${l.provenance?`<span class="lr-chip prov">${esc(l.provenance)}</span>`:''}</div>
<div class="lr-badges">${engineBadge(l)}${rulesBadge(l)}</div><p class="lr-note">${esc(REVIEW.authored)}.</p>
<div class="lr-controls">${other?`<button type="button" data-act="otherbranch">Try “${esc(other.label)}”</button>`:`<button type="button" data-act="restart">Replay lesson</button>`}<button type="button" class="primary" data-act="${next?'nextlesson':'home'}">${next?'Next lesson':'Back to lessons'}</button></div><div class="lr-toast" role="status" aria-live="polite"></div></div>`}
 function guided(){const lv=prefs.coachLevel||'all',opt=(v,t)=>`<button type="button" data-level="${v}" aria-pressed="${lv===v}">${t}</button>`;
  return `<div class="lr-screen lr-guided"><div class="lr-top"><button type="button" class="lr-icon" data-act="home" aria-label="Back">‹</button><div class="lr-titles"><span class="lr-eyebrow">GUIDED DUEL</span><b>Play our AI with ${esc(guideName())} beside you</b></div>${soundBtn()}</div>
<div class="lr-talk"><div class="lr-guide">${guideSVG('thinking')}</div><div class="lr-bubble"><span class="lr-who">${esc(guideName())}</span><p>Every game is different. I’ll explain chains, summons and damage as they happen. If I’m not sure about something, I’ll say so and save it for a fact check.</p></div></div>
<div class="lr-sec"><span class="lr-eyebrow">HOW MUCH I EXPLAIN</span></div><div class="lr-seg" role="group" aria-label="How much the coach explains">${opt('all','Explain everything')}${opt('new','New things')}${opt('quiet','Quiet')}</div>
<button type="button" class="lr-toggle" data-act="coach" aria-pressed="${!!prefs.coach}">${esc(guideName())} coach in Play duels: <b>${prefs.coach?'On':'Off'}</b></button>
<p class="lr-note">The coach only reads what has already happened in the duel and what you are allowed to see. It never plays for you. Lines are authored by ChatGPT and pending Seto/team fact check; rules-heavy explanations stay off until checked.</p>
<div class="lr-controls"><button type="button" class="primary" data-act="setup">Set up a Guided Duel</button></div><div class="lr-toast" role="status" aria-live="polite"></div></div>`}
 function queue(){const q=queueList();
  return `<div class="lr-screen lr-qscreen"><div class="lr-top"><button type="button" class="lr-icon" data-act="home" aria-label="Back">‹</button><div class="lr-titles"><span class="lr-eyebrow">FACT-CHECK QUEUE</span><b>${q.length} saved on this device</b></div>${soundBtn()}</div>
<p class="lr-note">Notes stay on this device until you export them for Seto’s team. They hold the lesson, the step and what your tutor said: nothing private.</p>
<ul class="lr-qlist">${q.slice().reverse().map(e=>`<li><b>${esc(e.lesson)} · step ${e.beat+1}</b><span>${esc(e.said)}</span><small>${esc(e.at.slice(0,16).replace('T',' '))} · ${esc(e.state)}</small></li>`).join('')||'<li class="empty">Nothing saved yet.</li>'}</ul>
<div class="lr-controls"><button type="button" data-act="export" ${q.length?'':'disabled'}>Export for review</button><button type="button" class="primary" data-act="home">Done</button></div><div class="lr-toast" role="status" aria-live="polite"></div></div>`}
 function draw(focusSel){el.innerHTML=view==='home'?home():view==='play'?player():view==='ruling'?ruling():view==='guided'?guided():queue();el.dataset.view=view;el.dataset.motion=reduced()?'reduced':'full';
  const f=focusSel&&el.querySelector(focusSel)||el.querySelector('#lr-choice-label,.primary,[data-act=list],[data-act=close]');f?.focus({preventScroll:true});
  if(view==='play'){const w=el.querySelector('.lr-workspace');if(w)w.scrollTop=0;el.querySelector('.lr-bubble')?.scrollIntoView({block:'nearest',behavior:'auto'});
   el.querySelector('details.lr-text')?.addEventListener('toggle',e=>{textOpen=e.target.open})}}
 function go(v,focus){view=v;draw(focus)}
 // r58: selector for the element that has focus now, so a redraw that is not caused by the user keeps their place.
 function keepFocus(){const a=document.activeElement;if(!a||!el.contains(a))return null;const d=a.dataset||{};
  for(const k of ['tutor','branch','lesson','act','level'])if(d[k]!==undefined)return `${a.tagName.toLowerCase()}[data-${k}="${CSS.escape(d[k])}"]`;return a.id?'#'+CSS.escape(a.id):null}
 // r54 music slot (Kevy 14:58: a Suno track "for the learning mode exclusively"): plays only while Learn is open, if learn/music.mp3 exists.
 let music=null,musicChecked=false;
 async function musicReady(){if(musicChecked)return !!music;musicChecked=true;try{const r=await fetch(MUSIC,{method:'HEAD'});if(!r.ok)return false;music=new Audio(MUSIC);music.loop=true;music.volume=0.22;return true}catch{return false}}
 function syncMusic(){if(!music)return;if(!el.hidden&&prefs.music!==false)music.play().catch(()=>{});else music.pause()}
 let inerted=[];
 // r55 (ChatGPT RELAY-189 R53-I1): while Learn is open the rest of the page is inert and Tab stays inside Learn.
 function setInert(on){if(on){inerted=[...document.body.children].filter(n=>n!==el&&!n.inert&&n.tagName!=='SCRIPT');for(const n of inerted)n.inert=true}else{for(const n of inerted)n.inert=false;inerted=[]}}
 function open(){lastFocus=document.activeElement;setInert(true);el.hidden=false;document.body.classList.add('learn-open');go('home');cue('paw',prefs.sound);musicReady().then(ok=>{if(ok){draw(keepFocus())/* r58: this late redraw must not steal focus (found in the live check) */;syncMusic()}})}
 function close(){el.hidden=true;setInert(false);document.body.classList.remove('learn-open');syncMusic();lastFocus?.focus?.({preventScroll:true})}
 function playBeat(){const l=ALL[lesson],b=beatsOf(l)[beat];prefs.progress[l.id]={...prefs.progress[l.id],beat,...(isCP(l)?{branch}:{})};save();go('play');cue(b.sfx,prefs.sound)}
 btn.onclick=open;
 el.addEventListener('click',e=>{const t=e.target.closest('button');if(!t||t.disabled)return;const a=t.dataset.act;
  if(t.dataset.lesson!==undefined){lesson=Number(t.dataset.lesson);beat=0;branch=null;playBeat();return}
  if(t.dataset.branch){branch=t.dataset.branch;beat++;cue('chime',prefs.sound);return playBeat()}
  if(a==='close')return close();if(a==='home'||a==='list')return go('home',a==='list'?'[data-lesson]':null);
  if(a==='cplist'){go('home','.lr-cplist [data-lesson]');el.querySelector('#lr-cp')?.scrollIntoView({block:'start',behavior:reduced()?'auto':'smooth'});return}
  if(a==='otherbranch'){const l=ALL[lesson],ci=l.beats.filter(x=>!x.branch).findIndex(x=>x.choice),o=l.beats.find(x=>x.choice).choice.options.find(x=>x.branch!==branch);branch=o.branch;beat=ci+1;return playBeat()}
  if(a==='music'){prefs.music=prefs.music===false;save();syncMusic();draw('[data-act=music]');return}
  if(a==='sound'){prefs.sound=!prefs.sound;save();draw('[data-act=sound]');cue('paw',prefs.sound);return}
  if(a==='next'){beat++;return playBeat()}if(a==='back'&&beat>0){beat--;if(isCP(ALL[lesson])&&beatsOf(ALL[lesson])[beat]?.choice)branch=null;return playBeat()}if(a==='replay'){return playBeat()}
  if(a==='ruling'){prefs.progress[ALL[lesson].id]={done:true,beat,...(isCP(ALL[lesson])?{branch}:{})};save();go('ruling');cue('chime',prefs.sound);return}
  if(a==='restart'){beat=0;branch=null;return playBeat()}if(a==='nextlesson'){lesson++;beat=0;branch=null;return playBeat()}
  if(t.dataset.tutor){const r=selectTutor(t.dataset.tutor);draw('button[data-tutor="'+t.dataset.tutor+'"]')/* r58 RELAY-199 MED-1: the hero svg also carries data-tutor */;toast(r.tutor.shortName+(r.persisted?' will be your tutor.':' will be your tutor this session.'));cue('chime',prefs.sound);return}
  if(a==='queue')return go('queue');
  if(a==='guided')return go('guided','[data-act=setup]');
  if(t.dataset.level){prefs.coachLevel=t.dataset.level;save();draw('[data-level='+t.dataset.level+']');cue('paw',prefs.sound);return}
  if(a==='coach'){prefs.coach=!prefs.coach;save();draw('[data-act=coach]');cue('paw',prefs.sound);return}
  if(a==='setup'){prefs.coach=true;save();
   /* r58.2 (Kevy 13 Nov 23:06): on a slow phone connection the card library may still be loading. Say so, and continue
      by itself once it is ready, instead of dropping the player on a "Loading card library…" button. */
   const ready=()=>document.body.dataset.libraryReady==='1'||document.querySelector('#start')?.disabled===false;
   if(!ready()){if(!waitingLib){waitingLib=true;t.disabled=true;t.textContent='Loading the card library… I’ll continue when it’s ready';toast('The card library is still loading on this connection. I’ll take you to the duel setup as soon as it’s ready.');
     document.addEventListener('ddl-library-failed',()=>{if(!waitingLib)return;waitingLib=false;const s=el.querySelector('[data-act=setup]');if(s){s.disabled=false;s.textContent='Set up a Guided Duel'}toast('The card library couldn’t load. Close Learn and tap “Retry card library”, then try again.')},{once:true});document.addEventListener('ddl-library-ready',()=>{waitingLib=false;const s=el.querySelector('[data-act=setup]');if(s){s.disabled=false;s.textContent='Set up a Guided Duel'}if(!el.hidden&&view==='guided')s?.click()},{once:true})}return}
   const m=document.querySelector('#mode');if(m&&[...m.options].some(o=>o.value==='play')){m.value='play';m.dispatchEvent(new Event('change',{bubbles:true}))}close();const s=document.querySelector('#start');s?.scrollIntoView({block:'center',behavior:reduced()?'auto':'smooth'});s?.focus({preventScroll:true});return}
  if(a==='flag'){const l=ALL[lesson],b=beatsOf(l)[beat];const ok=queueAdd({lesson:l.id,revision:l.revision,beat,...(isCP(l)?{branch:branch||'before choice'}:{}),said:b.say,build:ENGINE_EVIDENCE.build,review:REVIEW.status});toast(ok?FAILSAFE.saved:FAILSAFE.failed);cue('paper',prefs.sound);return}
  if(a==='export'){const blob=new Blob([JSON.stringify({kind:'ddl-factcheck-export',build:ENGINE_EVIDENCE.build,exported:new Date().toISOString(),entries:queueList()},null,1)],{type:'application/json'});const u=URL.createObjectURL(blob),link=document.createElement('a');link.href=u;link.download='ddl-factcheck-'+new Date().toISOString().slice(0,10)+'.json';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(u),2000);toast('Exported. Send the file to Seto’s team.');return}
 });
 // r58 (RELAY-199 MED-1): Escape also works if focus has fallen out to <body> while Learn is open.
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!e.defaultPrevented&&!el.hidden&&!el.contains(e.target)){/* defaultPrevented: Learn's own handler already acted (its target may have been redrawn away) */e.preventDefault();view==='home'?close():go('home')}});
 el.addEventListener('keydown',e=>{if(e.key==='Tab'){const f=[...el.querySelectorAll('button:not([disabled]),a[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')].filter(n=>n.offsetParent!==null||n===document.activeElement);if(f.length){const first=f[0],lastEl=f[f.length-1];if(e.shiftKey&&(document.activeElement===first||!el.contains(document.activeElement))){e.preventDefault();lastEl.focus()}else if(!e.shiftKey&&document.activeElement===lastEl){e.preventDefault();first.focus()}}return}
  if(e.key==='Escape'){e.preventDefault();return view==='home'?close():go('home')}if(view!=='play'||e.target.closest('input,select,textarea'))return;
  if(e.key==='ArrowRight'){e.preventDefault();el.querySelector('[data-act=next],[data-act=ruling]')?.click()}if(e.key==='ArrowLeft'){e.preventDefault();el.querySelector('[data-act=back]')?.click()}});
 const coach=installCoach({cue,prefs,save,queueAdd,FAILSAFE,guideName});
 return {open,close,coach,get state(){return {view,lesson,beat}}};
}
if(typeof document!=='undefined'){const go=()=>installLearn();if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',go,{once:true});else go()}

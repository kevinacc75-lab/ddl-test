// r48 play comfort (Claude as lead/builder, 12 Nov 2026; Kevy approved 10:58 AEDT: "auto card placement on as default and
// auto chain on by default but have these options as a toggle feature for the player"). SELF-VERIFIED until reviewed.
// An add-on over the existing Play flow: it only presses choices the duel engine already offers, through the page's own
// reply() path (human-flow.mjs / play-flow.mjs / human-holds.mjs / presentation.mjs are unchanged). Nothing here decides
// what is legal.
//  1. "No response" quick button (and Space) whenever an optional chain window offers you a card.
//  2. Chain setting: Auto (ask when you can respond; default) / Pass this turn / Pass all. Mandatory effects always ask.
//     The setting is not remembered between visits: every visit starts on Auto. A pass made for you is announced ("Passed · you could have chained ...") so nothing happens silently.
//  3. Auto-place (default ON): a single zone choice on your own field is made for you (Extra Monster Zone first, then the
//     centre outwards). OFF = you pick the zone as before. Multi-zone choices and the opponent's field always ask.
//  4. Gold aura on the cards you can Summon, Set, activate or attack with right now.
const KEY='ddl-r48-play-comfort',CHAIN=['auto','turn','off'],CHAIN_LABEL={auto:'Chain: Ask me',turn:'Chain: Pass this turn',off:'Chain: Pass optional'};
const CHAIN_HELP={auto:'Asks whenever you can respond.',turn:'Passes every optional response until this turn ends, then returns to Auto.',off:'Passes every optional response until you switch it back.'};
export const prefs={chain:'auto',autoPlace:true,aura:true};
try{const v=JSON.parse(localStorage.getItem(KEY)||'null');if(v&&typeof v==='object'){if(typeof v.autoPlace==='boolean')prefs.autoPlace=v.autoPlace;if(typeof v.aura==='boolean')prefs.aura=v.aura}}catch{}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify({autoPlace:prefs.autoPlace,aura:prefs.aura}))}catch{}};
// Pure helpers (unit-tested in tests/r48-play-comfort.test.mjs).
const ORDER=[5,6,2,1,3,0,4];
export function pickPlace(prompt,choices,M){
 if(!prompt||prompt.type!==M.SELECT_PLACE||prompt.count!==1||!Array.isArray(choices)||choices.length<1)return null;
 const own=choices.filter(c=>{const p=c?.response?.places;return Array.isArray(p)&&p.length===1&&(p[0].player??p[0].controller)===prompt.player&&[4,8].includes(p[0].location)});
 if(own.length!==choices.length)return null;/* any zone on the opponent's field, or an unusual choice: ask */
 const rank=c=>{const i=ORDER.indexOf(c.response.places[0].sequence);return i<0?99:i};
 return [...own].sort((a,b)=>rank(a)-rank(b))[0]}
export function chainPass(prompt,choices,mode,M,R){
 if(!prompt||prompt.type!==M.SELECT_CHAIN||prompt.forced||!(prompt.selects?.length>0))return null;
 const pass=(choices||[]).find(c=>c?.response?.type===R.SELECT_CHAIN&&c.response.index==null);if(!pass)return null;
 return {pass,auto:mode==='turn'||mode==='off'}}
export function playable(prompt,M){
 if(!prompt||![M.SELECT_IDLECMD,M.SELECT_BATTLECMD].includes(prompt.type))return [];
 const out=new Map();for(const k of ['summons','special_summons','monster_sets','spell_sets','activates','attacks'])for(const c of prompt[k]||[])if(c&&c.location!=null)out.set(c.controller+':'+c.location+':'+c.sequence,c);
 return [...out.values()]}
// r48.1 (ChatGPT RELAY-147 R48-01): one automatic answer is offered to the page until the page ACCEPTS it, then never again.
// reply() reports 'queued' (taken into the human-flow queue), 'sent' (given to the duel), 'wait' (page busy: try again) or
// 'refused'. On anything but 'wait' the retry stops, so a choice the player cancels from the queue is not queued a second
// time. alive() ends it when the decision changes.
export function makeSender({every=(f,ms)=>setInterval(f,ms),stop=id=>clearInterval(id),limit=2400}={}){
 let id=null,n=0;const halt=()=>{if(id!=null)stop(id);id=null};
 return {active:()=>id!=null,halt,start(reply,alive,done){halt();n=0;
  const go=()=>{if(!alive()||n++>=limit){halt();return true}const r=reply();if(r!=='wait'){halt();done?.(r);return true}return false};
  if(!go())id=every(go,150)}}}
export function installPlayComfort({M,R,name}){
 const $=s=>document.querySelector(s);
 const style=document.createElement('style');style.textContent=`
#pc-bar{position:fixed;left:50%;bottom:calc(12px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:60;display:flex;gap:8px;align-items:center;max-width:calc(100vw - 16px)}
#pc-bar[hidden]{display:none}
#pc-pass{min-height:48px;padding:10px 20px;border-radius:999px;border:2px solid #f2c45a;background:linear-gradient(#3a2a08,#1c1404);color:#ffe9a8;font:700 16px/1.1 system-ui,sans-serif;letter-spacing:.3px;box-shadow:0 0 0 2px #0008,0 6px 22px #000a,0 0 18px #f2c45a66;cursor:pointer;white-space:nowrap}
#pc-pass small{display:block;font-weight:500;font-size:11px;opacity:.85;margin-top:2px;max-width:60vw;overflow:hidden;text-overflow:ellipsis}
#pc-pass:focus-visible,#pc-chain:focus-visible{outline:3px solid #fff;outline-offset:2px}
#pc-chain{position:fixed;right:8px;bottom:calc(76px + env(safe-area-inset-bottom));z-index:59;min-height:40px;padding:6px 12px;border-radius:999px;border:1px solid #f2c45a88;background:#120c02e6;color:#ffe9a8;font:600 12px system-ui,sans-serif;cursor:pointer}
#pc-chain[data-mode=turn],#pc-chain[data-mode=off]{background:#5a1a12e6;border-color:#ff9b7a;color:#ffd9cc}
#pc-chain[hidden]{display:none}
#pc-toast{position:fixed;left:50%;top:calc(64px + env(safe-area-inset-top));transform:translateX(-50%);z-index:61;max-width:min(92vw,520px);padding:8px 14px;border-radius:10px;background:#120c02f2;border:1px solid #f2c45a88;color:#ffe9a8;font:600 13px/1.35 system-ui,sans-serif;text-align:center;pointer-events:none;opacity:0;transition:opacity .2s}
#pc-toast.on{opacity:1}
.pc-playable{box-shadow:0 0 0 2px #f2c45a,0 0 14px 3px #f2c45acc !important;border-radius:6px}
@media (prefers-reduced-motion:no-preference){.pc-playable{animation:pc-aura 1.6s ease-in-out infinite}}
@keyframes pc-aura{50%{box-shadow:0 0 0 2px #ffe9a8,0 0 22px 6px #f2c45a}}
.pc-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:8px 0}.pc-row label{display:flex;gap:6px;align-items:center}`;
 document.head.append(style);
 const bar=document.createElement('div');bar.id='pc-bar';bar.hidden=true;bar.innerHTML='<button id="pc-pass" type="button" aria-keyshortcuts="Space">No response<small></small></button>';
 const chainBtn=document.createElement('button');chainBtn.id='pc-chain';chainBtn.type='button';chainBtn.hidden=true;
 const toast=document.createElement('div');toast.id='pc-toast';toast.setAttribute('role','status');toast.setAttribute('aria-live','polite');
 document.body.append(bar,chainBtn,toast);
 let cur=null,toastTimer=0,turnMark=null;
 const say=t=>{toast.textContent=t;toast.classList.add('on');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('on'),2600)};
 const syncChain=()=>{chainBtn.textContent=CHAIN_LABEL[prefs.chain];chainBtn.dataset.mode=prefs.chain;chainBtn.title=CHAIN_HELP[prefs.chain];chainBtn.setAttribute('aria-label',CHAIN_LABEL[prefs.chain]+'. '+CHAIN_HELP[prefs.chain]+' Press to change.');const s=$('#pc-chain-select');if(s)s.value=prefs.chain};
 const setChain=(v,quiet)=>{prefs.chain=v;turnMark=v==='turn'?cur?.state?.turn??null:null;save();syncChain();if(!quiet)say(CHAIN_LABEL[v]+' · '+CHAIN_HELP[v]);act()};
 chainBtn.onclick=()=>setChain(CHAIN[(CHAIN.indexOf(prefs.chain)+1)%CHAIN.length]);
 // settings inside the Duel controls dialog
 {const host=$('#duel-controls .controls-actions')||$('#duel-controls');if(host){const box=document.createElement('div');box.className='pc-row';box.id='pc-settings';
   box.innerHTML='<label>Chain responses <select id="pc-chain-select"><option value="auto">Ask me · whenever I can respond</option><option value="turn">Pass this turn</option><option value="off">Pass optional responses</option></select></label><label><input id="pc-autoplace" type="checkbox"> Auto-place cards</label><label><input id="pc-aura" type="checkbox"> Gold aura on playable cards</label>';
   host.after(box);$('#pc-chain-select').onchange=e=>setChain(e.target.value);const ap=$('#pc-autoplace'),au=$('#pc-aura');ap.checked=prefs.autoPlace;au.checked=prefs.aura;
   ap.onchange=()=>{prefs.autoPlace=ap.checked;save();say('Auto-place '+(prefs.autoPlace?'on':'off'));act()};au.onchange=()=>{prefs.aura=au.checked;save();paint()}}}
 syncChain();
 // r49: the "offline files are ready" notice is not allowed to sit over a duel: it is dismissed when a human decision arrives
 const quietNotice=()=>{const n=$('#notice'),t=$('#notice-text');if(n&&!n.hidden&&/Offline duel files are ready/.test(t?.textContent||''))$('#dismiss-notice')?.click()};
 // r49: on a phone held upright the duel now has its own layout, so the "rotate your phone" card is skipped there
 const skipRotateHint=()=>{try{if(!matchMedia('(max-width:600px) and (orientation:portrait)').matches)return}catch{return}const h=$('#rotate-hint');if(h&&!h.hidden)$('#portrait-continue')?.click()};
 // r49: the old floating "Auto-pass until relevant" bar is hidden in Play; its button is reachable from Duel controls
 {const box=$('#pc-settings');if(box){const b=document.createElement('button');b.type='button';b.id='pc-autopass';b.className='quiet';b.textContent='Auto-pass until I can respond';b.title='Skips ahead through windows where you have nothing to chain (the earlier control, moved here).';b.onclick=()=>{const o=document.querySelector('#play-response-status button');if(o&&!o.disabled){o.click();say('Auto-pass until you can respond')}else say('Nothing to skip right now')};box.append(b)}}
 const sender=makeSender();const send=(response,key)=>sender.start(()=>cur.reply(response),()=>!!cur&&cur.human&&cur.key===key,r=>{if(cur&&cur.key===key)cur.answered=r});
 const passNow=()=>{if(!cur?.chain)return;const k=cur.key,c=cur.chain;bar.hidden=true;send(c.pass.response,k)};
 $('#pc-pass').onclick=passNow;
 document.addEventListener('keydown',e=>{if(e.code!=='Space'||bar.hidden||e.repeat||e.ctrlKey||e.metaKey||e.altKey)return;const t=document.activeElement;if(t&&(/^(INPUT|SELECT|TEXTAREA)$/.test(t.tagName)||t.closest?.('#choices')))return;/* typing, or choosing a chain card with the keyboard */if(document.querySelector('dialog[open]'))return;e.preventDefault();passNow()});
 function paint(){document.querySelectorAll('.pc-playable').forEach(n=>n.classList.remove('pc-playable'));if(!cur||!prefs.aura||!cur.human)return;
  for(const c of playable(cur.state.prompt,M)){let n=null;if(c.location===2){n=[...document.querySelectorAll('.hand-card[data-hand-sequence="'+c.sequence+'"]')].find(x=>Number(x.dataset.card)===c.code&&!x.querySelector('.hand-back'))}else if(c.location===4||c.location===8){n=document.querySelector('[data-slot="'+cur.slot(c)+'"]')}n?.classList.add('pc-playable')}}
 function act(){sender.halt();bar.hidden=true;if(!cur||!cur.human){paint();return}
  const {state,choices}=cur,m=state.prompt;
  if(prefs.chain==='turn'&&turnMark!=null&&state.turn!==turnMark)setChain('auto',true);
  paint();
  const ch=chainPass(m,choices,prefs.chain,M,R);cur.chain=ch;
  if(ch){const names=[...new Set((m.selects||[]).map(c=>name(c.code)).filter(Boolean))].slice(0,3).join(', ');
   if(ch.auto){say('Passed · you could have chained '+names+' ('+CHAIN_LABEL[prefs.chain]+')');send(ch.pass.response,cur.key);return}
   bar.querySelector('small').textContent=names?'You can chain: '+names:'';bar.hidden=false;return}
  if(prefs.autoPlace){const p=pickPlace(m,choices,M);if(p)send(p.response,cur.key)}}
 window.addEventListener('duel-human-decision',e=>{const d=e.detail||{};const show=!!d.inDuel;chainBtn.hidden=!show;if(show)setTimeout(quietNotice,400);skipRotateHint();if(show)document.body.dataset.pcPlay='1';else delete document.body.dataset.pcPlay;/* r49: css/r49-mobile.css lays Play out around this */
  if(!d.human||!d.state?.prompt){cur=d.state?{...d,human:false,key:null}:null;sender.halt();bar.hidden=true;paint();return}
  const key=d.state.revision+':'+d.state.prompt.type+':'+(d.flow||'');if(cur&&cur.key===key&&cur.human){cur={...cur,...d,key};paint();/* same decision drawn again (for example after the player cancelled a queued choice): nothing is answered for them a second time; the No response button comes back if nothing is queued */if(!sender.active())bar.hidden=!(cur.chain&&!cur.chain.auto&&!d.pending);return}
  cur={...d,key};quietNotice();act()});
}

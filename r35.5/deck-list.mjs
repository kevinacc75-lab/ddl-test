// r33 deck-list viewer (Claude, 23 Oct). Kevy 22 Oct 23:29: "when selecting a deck maybe we can include an option to view
// the deck list so the user can see which cards are in the deck. Will also make it better for me for irl deck building".
// A "Deck list" button under DECK A and DECK B (and "View cards" in the deck-tile pop-up) opens a full-screen list:
// Main Deck by Monsters / Spells / Traps, Extra Deck by Fusion / Synchro / Xyz / Link, then the Side Deck, each card with
// its art, copies and a short stats line; Limited / Semi-Limited marks follow the banlist chosen on the setup screen.
// Tap a card for its full text (the app's own card dossier). "Copy list" gives a plain-text list for building the deck
// in real life; ".ydk" saves the same deck for deck-building apps. Display only: nothing here changes a deck or a duel.
// Card names, frames and art come from deck-cards.json (tools/r33-deck-cards.mjs), not the 1.6 MB card library.
import {readCompressed} from './load.mjs';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const T={MONSTER:1,SPELL:2,TRAP:4,NORMAL:0x10,FUSION:0x40,RITUAL:0x80,SYNCHRO:0x2000,QUICKPLAY:0x10000,CONTINUOUS:0x20000,EQUIP:0x40000,FIELD:0x80000,COUNTER:0x100000,XYZ:0x800000,PENDULUM:0x1000000,LINK:0x4000000};
const ATTR={1:'EARTH',2:'WATER',4:'FIRE',8:'WIND',16:'LIGHT',32:'DARK',64:'DIVINE'};
export const ZONES=[['main','Main Deck'],['extra','Extra Deck'],['side','Side Deck']];
// The same rule app.mjs uses: a preset's banlistVariants entry for the chosen list replaces its main / extra / side.
export function presetFor(d,id){const {banlistVariants,banlistPending,...rest}=d,v=banlistVariants?.[id];return v?{...rest,...v}:rest}
export function frameOf(c){const t=c?.type|0;if(t&T.LINK)return 'link';if(t&T.XYZ)return 'xyz';if(t&T.SYNCHRO)return 'synchro';if(t&T.FUSION)return 'fusion';if(t&T.RITUAL)return 'ritual';if(t&T.SPELL)return 'spell';if(t&T.TRAP)return 'trap';if(t&T.NORMAL)return 'normal';return 'effect'}
export function groupOf(c){const t=c?.type|0;if(t&T.SPELL)return 'Spells';if(t&T.TRAP)return 'Traps';if(t&T.LINK)return 'Link';if(t&T.XYZ)return 'Xyz';if(t&T.SYNCHRO)return 'Synchro';if(t&T.FUSION)return 'Fusion';return 'Monsters'}
export const plural=(n,g)=>n===1?{Monsters:'Monster',Spells:'Spell',Traps:'Trap'}[g]||g:g;
const GROUP_ORDER=['Monsters','Spells','Traps','Fusion','Synchro','Xyz','Link'];
export function statLine(c){if(!c)return '';const t=c.type|0;
 if(t&T.SPELL)return (t&T.QUICKPLAY?'Quick-Play ':t&T.CONTINUOUS?'Continuous ':t&T.EQUIP?'Equip ':t&T.FIELD?'Field ':t&T.RITUAL?'Ritual ':'')+'Spell';
 if(t&T.TRAP)return (t&T.CONTINUOUS?'Continuous ':t&T.COUNTER?'Counter ':'')+'Trap';
 const a=ATTR[c.attribute]||'',lv=t&T.LINK?'Link-'+c.level:(t&T.XYZ?'Rank ':'Lv ')+c.level;
 const v=x=>x<0?'?':String(x);return [lv,a,t&T.LINK?v(c.atk):v(c.atk)+'/'+v(c.def)].filter(Boolean).join(' · ')}
export function limitOf(banlist,code){const m=banlist?.cards?.[code]?.max;return m===0?'Forbidden':m===1?'Limited':m===2?'Semi-Limited':''}
// [{zone,label,total,groups:[{name,total,rows:[{code,n,card}]}]}], cards in deck order, copies counted.
export function groupDeck(deck,cards){return ZONES.map(([zone,label])=>{const ids=deck?.[zone]||[],counts=new Map();for(const c of ids)counts.set(c,(counts.get(c)||0)+1);
 const groups=new Map();for(const [code,n] of counts){const card=cards[code]||null,g=groupOf(card);if(!groups.has(g))groups.set(g,[]);groups.get(g).push({code,n,card})}
 return {zone,label,total:ids.length,groups:[...groups].sort((a,b)=>GROUP_ORDER.indexOf(a[0])-GROUP_ORDER.indexOf(b[0])).map(([name,rows])=>({name,total:rows.reduce((s,r)=>s+r.n,0),rows}))}})}
export function deckText(deck,cards,listLabel=''){const out=[deck.name+(deck.subtitle?' — '+deck.subtitle:'')];if(listLabel)out.push('Banlist: '+listLabel);
 for(const z of groupDeck(deck,cards)){if(!z.total)continue;out.push('',z.label+' ('+z.total+')');for(const g of z.groups){out.push(g.name+' ('+g.total+')');for(const r of g.rows)out.push(r.n+'x '+(r.card?.name||'Card '+r.code))}}
 out.push('','Exported from Duel Doctrine Lab');return out.join('\n')+'\n'}
export function deckYdk(deck){return '#created by Duel Doctrine Lab\n#main\n'+(deck.main||[]).join('\n')+'\n#extra\n'+(deck.extra||[]).join('\n')+'\n!side\n'+(deck.side||[]).join('\n')+'\n'}
const ROLE_LABEL={starter:'Starter',extender:'Extender',payoff:'Payoff',interruption:'Interruption',handtrap:'Hand trap',utility:'Utility'};
function tile(r,banlist,brain){const c=r.card,lim=limitOf(banlist,r.code),name=c?.name||'Card '+r.code,k=brain?.cards?.[name];
 return `<button type="button" class="dv-card" data-card="${r.code}" data-frame="${frameOf(c)}" aria-label="${esc(r.n+' × '+name+(lim?', '+lim:''))}. Show card text"><span class="dv-art${c?.art?'':' dv-noart'}" data-initial="${esc((name.match(/[A-Z0-9]/g)||['?']).slice(0,2).join(''))}">${c?.art?`<img src="${esc(c.art)}" alt="" loading="lazy" decoding="async">`:''}<b class="dv-count">×${r.n}</b>${lim?`<i class="dv-limit" data-limit="${esc(lim)}">${esc(lim)}</i>`:''}</span><span class="dv-name">${esc(name)}</span><small class="dv-stats">${esc(statLine(c))}</small>${k?`<i class="dv-role" data-role="${esc(k.role)}">${esc(ROLE_LABEL[k.role]||k.role)}</i><span class="dv-does">${esc(k.does)}</span>`:''}</button>`}
// r33 deck brain (ai/brain/<deck>-brain.mjs): the game plan, routes from each starter, Extra Deck locks and End Phase
// effects, in plain words. Shown above the list when the deck has a brain.
export function renderBrain(brain){if(!brain)return '';
 return `<section class="dv-brain" id="dv-plan"><h3>How it plays</h3><p class="dv-plan">${esc(brain.plan)}</p><p class="muted small">${esc(brain.status)}</p>`+
  `<h4>Combo routes</h4><ol class="dv-routes">${(brain.routes||[]).map(r=>`<li><b>${esc(r.from.join(' + '))}</b><ol>${r.steps.map(x=>`<li>${esc(x)}</li>`).join('')}</ol><small>Ends on: ${esc(r.ends)}</small></li>`).join('')}</ol>`+
  ((brain.locks||[]).length?`<h4>Watch the locks</h4><ul class="dv-notes">${brain.locks.map(l=>`<li><b>${esc(l.card)}</b>: ${esc(l.lock)}${l.advice?' · '+esc(l.advice):''}</li>`).join('')}</ul>`:'')+
  ((brain.endPhase||[]).length?`<h4>End Phase pay-offs</h4><ul class="dv-notes">${brain.endPhase.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:'')+`</section>`}
export function renderDeck(deck,cards,banlist,brain=null){const zones=groupDeck(deck,cards);
 return `<nav class="dv-jump" aria-label="Jump to">${brain?'<a href="#dv-plan">How it plays</a>':''}${zones.filter(z=>z.total).map(z=>`<a href="#dv-${z.zone}">${esc(z.label)} <b>${z.total}</b></a>`).join('')}</nav>`+renderBrain(brain)+
  zones.filter(z=>z.total).map(z=>`<section class="dv-zone" id="dv-${z.zone}" data-zone="${z.zone}"><h3>${esc(z.label)} <b>${z.total}</b><small>${z.groups.map(g=>g.total+' '+plural(g.total,g.name)).join(' · ')}</small></h3>${z.groups.map(g=>`<h4>${esc(g.name)} <b>${g.total}</b></h4><div class="dv-grid">${g.rows.map(r=>tile(r,banlist,brain)).join('')}</div>`).join('')}</section>`).join('')}
async function copyText(text){try{await navigator.clipboard.writeText(text);return true}catch{}
 try{const t=document.createElement('textarea');t.value=text;t.setAttribute('readonly','');t.style.cssText='position:fixed;opacity:0';document.body.append(t);t.select();const ok=document.execCommand('copy');t.remove();return ok}catch{return false}}
function save(text,filename){const url=URL.createObjectURL(new Blob([text],{type:'text/plain'})),a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
export function installDeckList({fetchJson=u=>fetch(u,{cache:'no-cache'}).then(r=>r.ok?r.json():null).catch(()=>null),loadBrain=id=>import('./ai/brain/'+id+'-brain.mjs').then(m=>m.default).catch(()=>null),loadLibrary=()=>readCompressed('cards.json.gz')}={}){
 const $=s=>document.querySelector(s);let data=null,current=null;const lists=new Map();
 const load=()=>data??=Promise.all([fetchJson('decks.json'),fetchJson('deck-cards.json')]).then(([d,c])=>({decks:d?.decks||[],cards:c?.cards||{}}));
 // r33.1 (ChatGPT RELAY-013 N4): an imported deck can hold cards outside deck-cards.json (the presets only). Those are
 // read once from the full card library (with the TCG name overrides), so names, stats and the copied list stay right.
 let library=null;const libraryCards=()=>library??=Promise.all([loadLibrary(),fetchJson('text-overrides-tcg.json')]).then(([db,ov])=>{const over=ov?.cards||{};const out={};
  for(const [code,x] of Object.entries(db||{}))if(x?.name)out[code]={name:over[code]?.name||x.name,type:x.type,level:(x.level||0)&255,attribute:x.attribute,atk:x.attack,def:x.defense,art:x.art||null};return out}).catch(()=>({}));
 async function withMissing(deck,cards){const miss=[...new Set([...(deck.main||[]),...(deck.extra||[]),...(deck.side||[])])].filter(c=>!cards[c]);if(!miss.length)return cards;
  const lib=await libraryCards(),merged={...cards};for(const c of miss)if(lib[c])merged[c]=lib[c];return merged}
 const brains=new Map(),BRAIN_DECKS=['branded','luna','mikanko','sky','blueeyes','kashtira','toon','hero'];const brainFor=id=>{if(!BRAIN_DECKS.includes(id))return Promise.resolve(null);if(!brains.has(id))brains.set(id,loadBrain(id));return brains.get(id)};
 const banlistFor=id=>{if(!id)return Promise.resolve(null);if(!lists.has(id))lists.set(id,fetchJson('banlists/'+id+'.json'));return lists.get(id)};
 const customDecks=()=>{try{return JSON.parse(localStorage.getItem('doctrine-lab-decks-v1')||'[]').filter(d=>d?.id?.startsWith?.('custom-')&&Array.isArray(d.main))}catch{return []}};
 const dlg=document.createElement('dialog');dlg.id='deck-viewer';dlg.className='deck-viewer';dlg.setAttribute('aria-labelledby','dv-title');
 dlg.innerHTML='<header class="dv-head"><div><p class="eyebrow" id="dv-kicker">DECK LIST</p><h2 id="dv-title"></h2><p class="muted" id="dv-sub"></p></div><label class="dv-switch">Deck<select id="dv-deck" aria-label="Show deck"></select></label><button type="button" class="dv-close" id="dv-close" aria-label="Close deck list">×</button></header><div class="dv-actions"><button type="button" id="dv-copy" class="primary small">Copy list</button><button type="button" id="dv-ydk" class="quiet small">Save .ydk</button><button type="button" id="dv-notes" class="quiet small" aria-pressed="false" hidden>Card notes</button><span class="muted small">Tap a card to read it.</span></div><div class="dv-body" id="dv-body"><p class="muted">Loading the deck…</p></div>';
 document.body.append(dlg);const body=dlg.querySelector('#dv-body');
 const all=async()=>{const {decks}=await load(),id=$('#banlist')?.value;return [...decks.map(d=>presetFor(d,id)),...customDecks()]};
 async function show(id){const {cards}=await load(),decks=await all(),list=await banlistFor($('#banlist')?.value),deck=decks.find(d=>d.id===id)||decks[0];if(!deck){body.innerHTML='<p class="muted">The deck list could not load. Check your connection and try again.</p>';return}
  const brain=await brainFor(deck.id);const full=await withMissing(deck,cards);current={deck,cards:full,list,brain};dlg.dataset.notes=dlg.dataset.notes||'off';dlg.querySelector('#dv-title').textContent=deck.name;dlg.querySelector('#dv-sub').textContent=[deck.subtitle,list?.label?'Banlist: '+list.label:''].filter(Boolean).join(' · ');
  const sel=dlg.querySelector('#dv-deck');sel.innerHTML=decks.map(d=>`<option value="${esc(d.id)}">${esc(d.name)}</option>`).join('');sel.value=deck.id;
  body.innerHTML=renderDeck(deck,full,list,brain);dlg.querySelector('#dv-notes').hidden=!brain;body.scrollTop=0;dlg.dataset.deck=deck.id}
 async function open(id){if(!dlg.open){try{dlg.showModal()}catch{dlg.setAttribute('open','')}}body.innerHTML='<p class="muted">Loading the deck…</p>';await show(id)}
 const close=()=>{try{dlg.close()}catch{dlg.removeAttribute('open')}};
 dlg.querySelector('#dv-close').onclick=close;dlg.addEventListener('click',e=>{if(e.target===dlg)close()});
 dlg.querySelector('#dv-deck').onchange=e=>show(e.target.value);
 body.addEventListener('click',e=>{const a=e.target.closest?.('.dv-jump a');if(a){e.preventDefault();body.querySelector(a.getAttribute('href'))?.scrollIntoView?.({behavior:'smooth',block:'start'})}});
 const flash=(b,t)=>{const was=b.dataset.label??=b.textContent;b.textContent=t;setTimeout(()=>b.textContent=was,1600)};
 dlg.querySelector('#dv-copy').onclick=async e=>{if(!current)return;const ok=await copyText(deckText(current.deck,current.cards,current.list?.label));flash(e.currentTarget||dlg.querySelector('#dv-copy'),ok?'Copied ✓':'Copy blocked');if(!ok)save(deckText(current.deck,current.cards,current.list?.label),current.deck.id+'-list.txt')};
 dlg.querySelector('#dv-notes').onclick=e=>{const on=dlg.dataset.notes!=='on';dlg.dataset.notes=on?'on':'off';(e.currentTarget||dlg.querySelector('#dv-notes')).setAttribute('aria-pressed',String(on))};
 dlg.querySelector('#dv-ydk').onclick=()=>current&&save(deckYdk(current.deck),current.deck.id+'.ydk');
 // "Deck list" under DECK A and DECK B.
 for(const seat of ['a','b']){const sel=$('#deck-'+seat);if(!sel||document.getElementById('deck-list-'+seat))continue;const b=document.createElement('button');b.type='button';b.className='quiet small dv-open';b.id='deck-list-'+seat;b.textContent='Deck list';b.setAttribute('aria-label','View the Deck '+seat.toUpperCase()+' card list');b.onclick=()=>open(sel.value);sel.after(b)}
 // "View cards" in the deck-tile pop-up (app.mjs deckInfo; its markup is pinned, so this watches for its Export button).
 const modalBody=$('#modal-body');if(modalBody&&typeof MutationObserver!=='undefined')new MutationObserver(()=>{const ex=modalBody.querySelector('#export-deck');if(!ex||modalBody.querySelector('#dv-from-info'))return;
  const name=modalBody.querySelector('h2')?.textContent;const b=document.createElement('button');b.type='button';b.className='quiet';b.id='dv-from-info';b.textContent='View cards';
  b.onclick=async()=>{const d=(await all()).find(x=>x.name===name);$('#modal')?.close?.();open(d?.id)};ex.after(' ',b)}).observe(modalBody,{childList:true});
 // r34: the card dossier (tap any card, in a duel or in this list) gets an "In this deck" note from the deck brains: the
 // card's role and its job in each brain deck that plays it, the two decks on the setup screen first. Display only.
 const allBrains=()=>Promise.all(BRAIN_DECKS.map(id=>brainFor(id).then(b=>[id,b])));
 async function dossierNote(box,id){const {cards,decks}=await load(),name=cards[id]?.name;if(!name)return;const order=[$('#deck-a')?.value,$('#deck-b')?.value];
  const hits=(await allBrains()).filter(([,b])=>b?.cards?.[name]).sort((a,b)=>(order.indexOf(b[0])>-1?1:0)-(order.indexOf(a[0])>-1?1:0)).slice(0,3);
  if(!hits.length||box.querySelector('.dv-dossier-brain'))return;const deckName=id=>decks.find(d=>d.id===id)?.name||id;
  const div=document.createElement('div');div.className='dv-dossier-brain';
  div.innerHTML='<h3>In this deck</h3>'+hits.map(([d,b])=>{const k=b.cards[name];return `<p><b>${esc(deckName(d))}</b> <i class="dv-role" data-role="${esc(k.role)}">${esc(ROLE_LABEL[k.role]||k.role)}</i><br>${esc(k.does)}</p>`}).join('')+'<p class="muted small">From the deck brain (draft, Akiza review pending).</p>';
  box.append(div)}
 if(modalBody&&typeof MutationObserver!=='undefined')new MutationObserver(()=>{const dos=modalBody.querySelector('.card-dossier');if(!dos||dos.querySelector('.dv-dossier-brain'))return;
  const m=/CARD DOSSIER · (\d+)/.exec(dos.querySelector('.eyebrow')?.textContent||'');const box=dos.children[1];if(m&&box)dossierNote(box,Number(m[1])).catch(()=>{})}).observe(modalBody,{childList:true});
 return {open,close,show,dialog:dlg,dossierNote}}

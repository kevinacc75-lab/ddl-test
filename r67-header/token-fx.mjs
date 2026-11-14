// r36.2 token summon animation (Claude as builder, 7 Nov 2026; Kevy: "make a card and animation for the Token cards").
// Display only. Listens for the summon events the presentation already broadcasts ('duel-presentation-event', type 'summon')
// and, when the summoned card is a Token (token-cards.json), plays a short "materialise" over its Monster Zone: a ring of
// light, sparks, a TOKEN ribbon and the token card fading in from a hologram. Several tokens summoned together (Scapegoat,
// Sleepy Scapegoats) each get their own, slightly staggered. The overlay is fixed-position and self-removing, so a field
// redraw can never cut it short or leave anything behind. Skipped at Instant pace; reduced motion gets a quick fade only.
const map=fetch('token-cards.json').then(r=>r.ok?r.json():null).then(o=>o&&Array.isArray(o.tokens)?{set:new Set(o.tokens.map(Number)),art:o.art||{},generic:o.generic}:null).catch(()=>null);
const MS={learning:1500,duel:1000,broadcast:800,showtime:1500};
let last=0,stagger=0;
export function tokenDuration(pace,reduced){if(pace==='instant')return 0;return reduced?350:(MS[pace]??1000)}
export async function playTokenSpawn(e,doc=document){const m=await map;if(!m||!m.set.has(Number(e.code)))return false;
 const pace=doc.body?.dataset.pace||'learning',reduced=!!globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches,ms=tokenDuration(pace,reduced);if(!ms)return false;
 const slot=doc.querySelector(`[data-slot="${e.player}:4:${e.sequence}"]`);if(!slot)return false;const r=slot.getBoundingClientRect();if(!r.width||!r.height)return false;
 const now=Date.now();stagger=now-last<400?stagger+1:0;last=now;const delay=Math.min(stagger,4)*Math.round(ms*.14);
 const fx=doc.createElement('div');fx.className='token-fx'+(reduced?' token-fx-reduced':'');fx.setAttribute('aria-hidden','true');
 // a portrait card that fits the zone's height; turned sideways when the zone shows a Defence Position card (the field may
 // redraw just after the event, so the zone is looked at again a moment later)
 const size=def=>{const h=def?r.height:r.height*.94,w=def?Math.min(r.height*1185/813,r.width)*813/1185:h*813/1185;fx.style.setProperty('--tf-w',w+'px');fx.style.setProperty('--tf-h',(def?w*1185/813:h)+'px');fx.style.setProperty('--tf-rot',(def?90:0)+'deg');fx.style.setProperty('--tf-vh',(def?w:h)+'px')};
 fx.style.cssText=`left:${r.left+r.width/2}px;top:${r.top+r.height/2}px;--tf-ms:${ms}ms;--tf-delay:${delay}ms`;size(slot.classList.contains('defence'));
 for(const t of [60,160,320])setTimeout(()=>{const z=doc.querySelector(`[data-slot="${e.player}:4:${e.sequence}"]`);if(z&&fx.isConnected)size(z.classList.contains('defence'))},t);
 const art=m.art[String(e.code)]||m.generic;
 fx.innerHTML=`<span class="tf-ring"></span><span class="tf-ring tf-ring2"></span>${Array.from({length:8},(_,i)=>`<span class="tf-spark" style="--a:${i*45}deg"></span>`).join('')}<span class="tf-card"><img src="${art}" alt=""></span><span class="tf-tag">TOKEN</span>`;
 doc.body.append(fx);setTimeout(()=>fx.remove(),ms+delay+80);return true}
document.addEventListener('duel-presentation-event',({detail:e})=>{if(e?.type==='summon')playTokenSpawn(e).catch(()=>{})});

// r55 Learn tutors (Claude, 13 Nov 2026). Art and the frame renderer are ChatGPT's "Duel Lab Chibi Tutors v0.2"
// (RELAY-195, zip sha256 22474ae1…), approved by Kevy 16:09: "I approve all of them and authorize you to implement them
// ... toggle options to pick your tutor". Kevy 16:20: "Let's retire lawpri or put in archive" — Lapawri stays in
// learn/guide.mjs as an archive and is not offered. Kevy 16:22: use the official card art too, so each tutor carries
// its card's artwork (images.ygoprodeck.com cropped art, as for the rest of art/). Personal practice project.
// Changes from v0.2: atlases re-encoded PNG -> WebP (same pixels within q90, alpha kept), a project storage key, a card
// code + card art per tutor, and the chooser is drawn by learn.mjs instead of mountTutorPicker. Presentation only.
export const MOODS=Object.freeze(['neutral','thinking','legal','notlegal','surprised','proud','unsure']);
const u=f=>new URL('./tutors/'+f,import.meta.url).href;
export const TUTORS=Object.freeze([
 {id:'dmg',name:'Dark Magician Girl',shortName:'Dark Magician Girl',theme:'A little magic',accent:'#f5a6d8',code:38033121,atlas:'dmg-atlas.webp'},
 {id:'harpie',name:'Harpie Lady',shortName:'Harpie Lady',theme:'A fresh perspective',accent:'#a9d99b',code:76812113,atlas:'harpie-atlas.webp'},
 {id:'burstinatrix',name:'Elemental HERO Burstinatrix',shortName:'Burstinatrix',theme:'A spark of confidence',accent:'#ffac79',code:58932615,atlas:'burstinatrix-atlas.webp'},
 {id:'ash',name:'Ash Blossom & Joyous Spring',shortName:'Ash Blossom',theme:'One thoughtful step',accent:'#f6bbc2',code:14558127,atlas:'ash-atlas.webp'}
].map(t=>Object.freeze({...t,atlasURL:u(t.atlas),cardArt:u('card-'+t.code+'.webp')})));
export const STORAGE_KEY='ddl-r55-tutor';
const observers=new Set();let sessionId=null;
export function getTutor(id){return TUTORS.find(t=>t.id===id)||TUTORS[0]}
export function getSelectedTutor(){if(sessionId)return getTutor(sessionId);try{return getTutor(globalThis.localStorage?.getItem(STORAGE_KEY))}catch{return TUTORS[0]}}
export const guideName=()=>getSelectedTutor().shortName;
export function selectTutor(id,{persist=true}={}){
 if(!TUTORS.some(t=>t.id===id))throw new RangeError('Unknown tutor id');sessionId=id;let persisted=false;
 if(persist)try{globalThis.localStorage.setItem(STORAGE_KEY,id);persisted=true}catch{}
 const result={tutor:getTutor(id),persisted};for(const fn of observers)fn(result);return result}
export function onTutorChange(fn){observers.add(fn);return()=>observers.delete(fn)}
export const FRAMES=Object.freeze({neutral:0,thinking:1,legal:2,notlegal:3,surprised:4,proud:5,unsure:6,blink:7});
const LABELS=Object.freeze({neutral:'calm',thinking:'thinking',legal:'encouraging',notlegal:'explaining a caution',surprised:'surprised',proud:'celebrating',unsure:'unsure, needs a fact check'});
const aliases=Object.freeze({explaining:'notlegal',happy:'legal',idle:'neutral'});
const safe=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const resolveMood=m=>MOODS.includes(m)?m:aliases[m]||'neutral';
export function guideValues(mood='neutral'){const name=resolveMood(mood),frame=FRAMES[name];return {mood:name,frame,column:frame%4,row:Math.floor(frame/4),label:LABELS[name]}}
// One 4x2 atlas cell per mood, sampled with a nested SVG viewBox (no pixel chopping); the neutral pose blinks.
export function guideSVG(mood='neutral',{motion=true,tutor=getSelectedTutor().id}={}){
 const v=guideValues(mood),skin=getTutor(tutor);
 const frame=(f,cls)=>`<svg class="${cls}" x="0" y="0" width="1" height="1" viewBox="${f%4} ${Math.floor(f/4)} 1 1" overflow="hidden" aria-hidden="true"><image href="${safe(skin.atlasURL)}" x="0" y="0" width="4" height="2" preserveAspectRatio="none"/></svg>`;
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1" width="100%" height="100%" class="dmg-mascot" data-tutor="${skin.id}" data-mood="${v.mood}" data-motion="${motion?'full':'off'}" role="img" aria-label="${safe(skin.name+', '+v.label)}" focusable="false"><style>
.dmg-mascot{display:block;overflow:visible}.dmg-mascot .dmg-body{transform-origin:50% 76%;animation:dmg-hover 4.6s ease-in-out infinite}.dmg-mascot .dmg-blink{opacity:0;animation:dmg-eyeclosed 5.7s step-end infinite}.dmg-mascot .dmg-open{animation:dmg-eyeopen 5.7s step-end infinite}
@keyframes dmg-hover{0%,100%{transform:translateY(0) rotate(-.5deg)}50%{transform:translateY(-.018px) rotate(.5deg)}}
@keyframes dmg-eyeclosed{0%,94%,98%,100%{opacity:0}95%,97%{opacity:1}}
@keyframes dmg-eyeopen{0%,94%,98%,100%{opacity:1}95%,97%{opacity:0}}
.dmg-mascot[data-motion="off"] .dmg-body,.dmg-mascot[data-motion="off"] .dmg-open,.dmg-mascot[data-motion="off"] .dmg-blink{animation:none}.dmg-mascot[data-motion="off"] .dmg-blink{opacity:0}
@media(prefers-reduced-motion:reduce){.dmg-mascot .dmg-body,.dmg-mascot .dmg-open,.dmg-mascot .dmg-blink{animation:none}.dmg-mascot .dmg-blink{opacity:0}}
</style><g class="dmg-body">${frame(v.frame,v.mood==='neutral'?'dmg-open':'dmg-still')}${v.mood==='neutral'?frame(FRAMES.blink,'dmg-blink'):''}</g></svg>`}

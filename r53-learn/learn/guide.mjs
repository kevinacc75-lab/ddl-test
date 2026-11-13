// r53 Guide mascot (Claude, 13 Nov 2026). Kevy 14:35: "Let's run with the anime design you just made" - the original
// sphinx cat, anime style, from the learning-mode design canvas. Original character: no franchise design is copied.
// guideSVG(mood) returns a self-contained SVG string; each call gets its own gradient ids so many can share a page.
const none='M0 0';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let n=0;
export const MOODS=['neutral','thinking','legal','notlegal','surprised','proud','unsure'];
export function guideValues(mood){
 const base = {
      irx: 11.5, iry: 15, prx: 3.2, pry: 11, dx: 0, dy: 0, openOp: 1, closedOp: 0,
      lidL: none, lidR: none,
      browL: 'M88 85 Q96 81 104 84', browR: 'M136 84 Q144 81 152 85',
      mouth: 'M110 137 Q115 142 120 137 Q125 142 130 137', mouthFill: 'none',
      fangOp: 0, sweatOp: 0, sparkOp: 0, shockOp: 0, lashOp: 1,
      badgeOp: 0, badgeFill: '#1B2E6B', badgeGlyph: none, moodLabel: 'calm'
    };
 const moods = {
      neutral: {},
      thinking: { dx: 3, dy: -4, browL: 'M88 86 Q96 84 104 86', browR: 'M136 82 Q144 75 152 80', mouth: 'M113 139 L127 136', badgeOp: 1, badgeGlyph: 'M196 38 L196.1 38 M206 38 L206.1 38 M216 38 L216.1 38', moodLabel: 'thinking' },
      legal: { openOp: 0, closedOp: 1, browL: 'M88 82 Q96 77 104 81', browR: 'M136 81 Q144 77 152 82', mouth: 'M107 136 Q120 152 133 136 Z', mouthFill: '#9a3a2a', fangOp: 1, sparkOp: 1, badgeOp: 1, badgeFill: '#1f8a6e', badgeGlyph: 'M197 38 L204 45 L216 31', moodLabel: 'happy: legal' },
      notlegal: { lashOp: 0, lidL: 'M83 108 Q98 95 113 108 L113 88 L83 88 Z', lidR: 'M127 108 Q142 95 157 108 L157 88 L127 88 Z', dy: 3, browL: 'M88 83 L105 89', browR: 'M135 89 L152 83', mouth: 'M110 142 Q120 134 130 142', badgeOp: 1, badgeFill: '#B4452F', badgeGlyph: 'M198 30 L214 46 M214 30 L198 46', moodLabel: 'stern: not legal' },
      surprised: { irx: 13, iry: 16.5, prx: 2.2, pry: 4.2, browL: 'M88 79 Q96 72 104 78', browR: 'M136 78 Q144 72 152 79', mouth: 'M116 139 a4 5 0 1 0 8 0 a4 5 0 1 0 -8 0', mouthFill: '#5a2414', shockOp: 1, badgeOp: 1, badgeFill: '#C76A2A', badgeGlyph: 'M206 28 L206 41 M206 48 L206 48.1', moodLabel: 'surprised' },
      proud: { lashOp: 0, lidL: 'M83 110 Q98 102 113 110 L113 88 L83 88 Z', lidR: 'M127 110 Q142 102 157 110 L157 88 L127 88 Z', dy: 4, browL: 'M88 84 Q96 82 104 85', browR: 'M136 85 Q144 82 152 84', mouth: 'M110 137 Q121 144 132 133', fangOp: 1, sparkOp: 1, badgeOp: 1, badgeFill: '#C99A3E', badgeGlyph: 'M206 26 L209.5 34 L218 34 L211.5 39 L214 47.5 L206 42.5 L198 47.5 L200.5 39 L194 34 L202.5 34 Z', moodLabel: 'proud' },
      unsure: { dx: -3, browL: 'M88 89 L104 82', browR: 'M136 82 L152 89', mouth: 'M110 140 Q115 135 120 140 Q125 145 130 140', sweatOp: 1, badgeOp: 1, badgeFill: '#3f5bb8', badgeGlyph: 'M200 32 Q200 25 206 25 Q213 25 213 32 Q213 36 206 39 L206 42 M206 49 L206 49.1', moodLabel: 'unsure: needs a fact check' }
    };
 const m={...base,...(moods[mood]||{})};
 return {...m,irLx:98+m.dx,irRx:142+m.dx,irY:110+m.dy,hlLx:93+m.dx,hlRx:137+m.dx,hlY:102+m.dy,hs2Lx:104+m.dx,hs2Rx:148+m.dx,hs2Y:118+m.dy,label:'Guide, '+m.moodLabel};
}
export function guideSVG(mood='neutral'){const v=guideValues(mood),p='g'+(++n),label=v.label;
 return `<svg viewBox="0 0 240 260" width="100%" height="100%" role="img" aria-label="${esc(label)}">
<defs>
<linearGradient id="${p}-gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FBE7A6"></stop><stop offset="0.55" stop-color="#E2B95C"></stop><stop offset="1" stop-color="#A97A2C"></stop></linearGradient>
<linearGradient id="${p}-fur" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FBE2AE"></stop><stop offset="1" stop-color="#E4B06A"></stop></linearGradient>
<linearGradient id="${p}-ear" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F7A99B"></stop><stop offset="1" stop-color="#FCD3C6"></stop></linearGradient>
<radialGradient id="${p}-iris" cx="0.5" cy="0.62" r="0.62"><stop offset="0" stop-color="#C8FFF6"></stop><stop offset="0.35" stop-color="#5FD6C6"></stop><stop offset="0.8" stop-color="#1F8A80"></stop><stop offset="1" stop-color="#0E4A45"></stop></radialGradient>
<radialGradient id="${p}-gem" cx="0.4" cy="0.35" r="0.7"><stop offset="0" stop-color="#FF9C82"></stop><stop offset="0.6" stop-color="#C2472E"></stop><stop offset="1" stop-color="#6E1E10"></stop></radialGradient>
<linearGradient id="${p}-lapis" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3556B8"></stop><stop offset="1" stop-color="#162A6A"></stop></linearGradient>
<pattern id="${p}-nemes" width="14" height="14" patternUnits="userSpaceOnUse"><rect width="14" height="14" fill="url(#${p}-lapis)"></rect><rect width="14" height="6" fill="url(#${p}-gold)"></rect><rect y="6" width="14" height="1" fill="#0b1638"></rect></pattern>
</defs>
<ellipse cx="120" cy="251" rx="72" ry="8" fill="rgba(0,0,0,0.35)"></ellipse>
<path d="M72 84 L46 198 L90 198 L93 118 Z" fill="url(#${p}-nemes)" stroke="#F2D48A" stroke-width="2" stroke-linejoin="round"></path>
<path d="M168 84 L194 198 L150 198 L147 118 Z" fill="url(#${p}-nemes)" stroke="#F2D48A" stroke-width="2" stroke-linejoin="round"></path>
<path d="M84 120 L60 196 M156 120 L180 196" stroke="#0b1638" stroke-width="2" opacity="0.5"></path>
<path d="M164 234 C206 238 216 202 198 184" fill="none" stroke="#3a2412" stroke-width="15" stroke-linecap="round"></path>
<path d="M164 234 C206 238 216 202 198 184" fill="none" stroke="url(#${p}-fur)" stroke-width="11" stroke-linecap="round"></path>
<path d="M199 205 L211 199" stroke="url(#${p}-gold)" stroke-width="7" stroke-linecap="round"></path>
<path d="M80 248 C72 204 82 160 120 156 C158 160 168 204 160 248 Z" fill="url(#${p}-fur)" stroke="#3a2412" stroke-width="2.2" stroke-linejoin="round"></path>
<path d="M148 168 C162 194 162 226 158 248 L146 248 C150 220 150 192 142 168 Z" fill="#C98F45" opacity="0.35"></path>
<ellipse cx="120" cy="212" rx="24" ry="30" fill="#FDEBC6"></ellipse>
<ellipse cx="102" cy="245" rx="18" ry="9" fill="url(#${p}-fur)" stroke="#3a2412" stroke-width="2"></ellipse>
<ellipse cx="138" cy="245" rx="18" ry="9" fill="url(#${p}-fur)" stroke="#3a2412" stroke-width="2"></ellipse>
<path d="M96 240 L96 248 M106 240 L106 248 M134 240 L134 248 M144 240 L144 248" stroke="#3a2412" stroke-width="1.4" stroke-linecap="round"></path>
<path d="M72 146 C90 182 150 182 168 146 L159 137 C142 164 98 164 81 137 Z" fill="url(#${p}-gold)" stroke="#7a5418" stroke-width="1.6" stroke-linejoin="round"></path>
<path d="M82 151 C98 170 142 170 158 151" fill="none" stroke="#3FB6A8" stroke-width="5.5" stroke-dasharray="0.1 7" stroke-linecap="round"></path>
<path d="M77 158 C95 185 145 185 163 158" fill="none" stroke="url(#${p}-lapis)" stroke-width="4"></path>
<ellipse cx="102" cy="177" rx="3.4" ry="5" fill="url(#${p}-gem)" stroke="#F2D48A" stroke-width="1.2"></ellipse>
<ellipse cx="120" cy="181" rx="3.8" ry="5.6" fill="url(#${p}-gem)" stroke="#F2D48A" stroke-width="1.2"></ellipse>
<ellipse cx="138" cy="177" rx="3.4" ry="5" fill="url(#${p}-gem)" stroke="#F2D48A" stroke-width="1.2"></ellipse>
<path d="M76 66 L65 14 C65 9 70 8 73 10 L112 40 Z" fill="url(#${p}-fur)" stroke="#3a2412" stroke-width="2.2" stroke-linejoin="round"></path>
<path d="M79 56 L73 24 L101 42 Z" fill="url(#${p}-ear)"></path>
<path d="M80 47 L75 39 M85 45 L81 35 M89 44 L87 36" stroke="#FFF6E0" stroke-width="1.6" stroke-linecap="round"></path>
<path d="M164 66 L175 14 C175 9 170 8 167 10 L128 40 Z" fill="url(#${p}-fur)" stroke="#3a2412" stroke-width="2.2" stroke-linejoin="round"></path>
<path d="M161 56 L167 24 L139 42 Z" fill="url(#${p}-ear)"></path>
<path d="M160 47 L165 39 M155 45 L159 35 M151 44 L153 36" stroke="#FFF6E0" stroke-width="1.6" stroke-linecap="round"></path>
<path d="M60 108 C58 70 86 52 120 52 C154 52 182 70 180 108 C180 128 171 142 157 150 L165 157 L147 153 C139 157 129 159 120 159 C111 159 101 157 93 153 L75 157 L83 150 C69 142 60 128 60 108 Z" fill="url(#${p}-fur)" stroke="#3a2412" stroke-width="2.4" stroke-linejoin="round"></path>
<path d="M64 98 C70 76 92 68 120 68 C148 68 170 76 176 98 C164 86 146 82 120 82 C94 82 76 86 64 98 Z" fill="#C98F45" opacity="0.32"></path>
<path d="M62 92 C70 44 170 44 178 92 L168 96 C158 64 82 64 72 96 Z" fill="url(#${p}-nemes)" stroke="#F2D48A" stroke-width="2" stroke-linejoin="round"></path>
<path d="M65 82 C80 42 160 42 175 82" fill="none" stroke="url(#${p}-gold)" stroke-width="3.5"></path>
<path d="M112 62 C102 55 89 56 81 63 M128 62 C138 55 151 56 159 63" fill="none" stroke="url(#${p}-gold)" stroke-width="2.4" stroke-linecap="round"></path>
<circle cx="120" cy="61" r="7.5" fill="url(#${p}-gem)" stroke="#F2D48A" stroke-width="2.6"></circle>
<circle cx="117.6" cy="58.4" r="2.1" fill="#FFFFFF"></circle>
<ellipse cx="86" cy="127" rx="12" ry="5.5" fill="#F7A1A8" opacity="0.45"></ellipse>
<ellipse cx="154" cy="127" rx="12" ry="5.5" fill="#F7A1A8" opacity="0.45"></ellipse>
<path d="M79 130 L83 123 M85 130 L89 123 M91 130 L95 123 M145 130 L149 123 M151 130 L155 123 M157 130 L161 123" stroke="#EE6F82" stroke-width="1.8" stroke-linecap="round"></path>
<g opacity="${v.openOp}">
<ellipse cx="98" cy="108" rx="15" ry="18" fill="#FFF8E8"></ellipse>
<ellipse cx="142" cy="108" rx="15" ry="18" fill="#FFF8E8"></ellipse>
<ellipse cx="${v.irLx}" cy="${v.irY}" rx="${v.irx}" ry="${v.iry}" fill="url(#${p}-iris)" stroke="#0E4A45" stroke-width="1.2"></ellipse>
<ellipse cx="${v.irRx}" cy="${v.irY}" rx="${v.irx}" ry="${v.iry}" fill="url(#${p}-iris)" stroke="#0E4A45" stroke-width="1.2"></ellipse>
<ellipse cx="${v.irLx}" cy="${v.irY}" rx="${v.prx}" ry="${v.pry}" fill="#120a04"></ellipse>
<ellipse cx="${v.irRx}" cy="${v.irY}" rx="${v.prx}" ry="${v.pry}" fill="#120a04"></ellipse>
<path d="M83 104 Q98 88 113 104 Q98 95 83 104 Z" fill="#1a0f06" opacity="0.4"></path>
<path d="M127 104 Q142 88 157 104 Q142 95 127 104 Z" fill="#1a0f06" opacity="0.4"></path>
<ellipse cx="${v.hlLx}" cy="${v.hlY}" rx="4.6" ry="5.6" fill="#FFFFFF"></ellipse>
<ellipse cx="${v.hlRx}" cy="${v.hlY}" rx="4.6" ry="5.6" fill="#FFFFFF"></ellipse>
<circle cx="${v.hs2Lx}" cy="${v.hs2Y}" r="2.2" fill="#FFFFFF"></circle>
<circle cx="${v.hs2Rx}" cy="${v.hs2Y}" r="2.2" fill="#FFFFFF"></circle>
<path d="${v.lidL}" fill="url(#${p}-fur)" stroke="#1a0f06" stroke-width="2.6" stroke-linejoin="round"></path>
<path d="${v.lidR}" fill="url(#${p}-fur)" stroke="#1a0f06" stroke-width="2.6" stroke-linejoin="round"></path>
<path d="M112 101 Q98 85 83 101 L74 93" opacity="${v.lashOp}" fill="none" stroke="#1a0f06" stroke-width="4.4" stroke-linecap="round" stroke-linejoin="round"></path>
<path d="M128 101 Q142 85 157 101 L166 93" opacity="${v.lashOp}" fill="none" stroke="#1a0f06" stroke-width="4.4" stroke-linecap="round" stroke-linejoin="round"></path>
<path d="M86 120 Q98 128 110 120 M130 120 Q142 128 154 120" fill="none" stroke="#6b3f1a" stroke-width="1.7" stroke-linecap="round"></path>
</g>
<g opacity="${v.closedOp}" fill="none" stroke="#1a0f06" stroke-width="4.4" stroke-linecap="round">
<path d="M84 113 Q98 96 112 113 M84 113 L77 108"></path>
<path d="M128 113 Q142 96 156 113 M156 113 L163 108"></path>
</g>
<path d="${v.browL}" fill="none" stroke="#7a4a1a" stroke-width="3" stroke-linecap="round"></path>
<path d="${v.browR}" fill="none" stroke="#7a4a1a" stroke-width="3" stroke-linecap="round"></path>
<path d="M115 129 L125 129 L120 134.5 Z" fill="#D9626B" stroke="#7a2a2a" stroke-width="1" stroke-linejoin="round"></path>
<circle cx="118" cy="130" r="1.1" fill="#FFFFFF"></circle>
<path d="${v.mouth}" fill="${v.mouthFill}" stroke="#3a2412" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"></path>
<path d="M124 139 L127.5 146 L131 139 Z" fill="#FFFFFF" stroke="#3a2412" stroke-width="1.2" stroke-linejoin="round" opacity="${v.fangOp}"></path>
<path d="M72 131 L46 127 M72 136 L46 139 M168 131 L194 127 M168 136 L194 139" stroke="#8A5E22" stroke-width="1.2" stroke-linecap="round"></path>
<g opacity="${v.sweatOp}"><path d="M173 74 C168 83 166 90 170 95 C174 99 181 95 179 88 C178 84 176 79 173 74 Z" fill="#A9DEFF" stroke="#3f7fbf" stroke-width="1.6"></path><circle cx="172" cy="90" r="1.6" fill="#FFFFFF"></circle></g>
<g opacity="${v.sparkOp}" fill="#F7DC8F" stroke="#C99A3E" stroke-width="1">
<path d="M34 54 L37.5 62 L45 65 L37.5 68 L34 76 L30.5 68 L23 65 L30.5 62 Z"></path>
<path d="M214 92 L216.5 98 L222 100 L216.5 102 L214 108 L211.5 102 L206 100 L211.5 98 Z"></path>
<path d="M28 150 L30 155 L35 157 L30 159 L28 164 L26 159 L21 157 L26 155 Z"></path>
</g>
<g opacity="${v.shockOp}" stroke="#F2D48A" stroke-width="3.2" stroke-linecap="round"><path d="M52 44 L42 32 M62 36 L57 22 M188 44 L198 32 M178 36 L183 22"></path></g>
<g opacity="${v.badgeOp}">
<circle cx="206" cy="38" r="19" fill="${v.badgeFill}" stroke="#F2D48A" stroke-width="2.8"></circle>
<path d="${v.badgeGlyph}" fill="none" stroke="#FFFFFF" stroke-width="4.4" stroke-linecap="round" stroke-linejoin="round"></path>
</g>
</svg>`;
}

# r43: original geometric deck emblems + home hero (no official artwork). Pure SVG, generated here.
import os,math
OUT='dist/emblems'
DECKS={'branded':('#ff6a5a','#ffcf4a','flame'),'mikanko':('#ff8fc8','#ffd08a','mirror'),'sky':('#ff4a6a','#9fd8ff','arrows'),'luna':('#c9a6ff','#eef2ff','moon'),
 'blueeyes':('#5fb4ff','#e8f6ff','eye'),'kashtira':('#4ff0b0','#c9ffe8','ring'),'toon':('#ffd166','#ff6ad5','star'),'hero':('#ffae42','#7fe3ff','shield'),'dtw':('#b48cff','#7ff0ff','hourglass'),'custom':('#3fe0ff','#ff4fd8','d')}
def poly(n,r,cx=100,cy=100,rot=-90):
    return ' '.join(f'{cx+r*math.cos(math.radians(rot+i*360/n)):.1f},{cy+r*math.sin(math.radians(rot+i*360/n)):.1f}' for i in range(n))
GLYPH={
 'flame':'<path d="M100 42 C120 70 132 84 126 110 C122 128 110 140 100 146 C90 140 78 128 74 110 C68 84 80 70 100 42Z" fill="url(#g2)"/><path d="M100 82 C110 98 112 108 108 120 C105 128 100 132 100 132 C100 132 95 128 92 120 C88 108 90 98 100 82Z" fill="#fff" opacity=".85"/>',
 'mirror':'<circle cx="100" cy="100" r="40" fill="none" stroke="url(#g2)" stroke-width="10"/><circle cx="100" cy="100" r="20" fill="#fff" opacity=".85"/><path d="M60 140 L140 60" stroke="#fff" stroke-width="4" opacity=".6"/>',
 'arrows':'<path d="M56 132 L100 56 L144 132 L100 112Z" fill="url(#g2)"/><path d="M80 140 L100 104 L120 140 L100 130Z" fill="#fff" opacity=".85"/>',
 'moon':'<path d="M124 52 A52 52 0 1 0 124 148 A40 40 0 1 1 124 52Z" fill="url(#g2)"/><circle cx="128" cy="78" r="5" fill="#fff"/><circle cx="140" cy="102" r="3" fill="#fff"/>',
 'eye':'<path d="M48 100 Q100 50 152 100 Q100 150 48 100Z" fill="url(#g2)"/><circle cx="100" cy="100" r="18" fill="#fff" opacity=".9"/><circle cx="100" cy="100" r="8" fill="#0d1a5a"/>',
 'ring':'<circle cx="100" cy="100" r="44" fill="none" stroke="url(#g2)" stroke-width="12" stroke-dasharray="22 10"/><polygon points="'+poly(4,20)+'" fill="#fff" opacity=".85"/>',
 'star':'<polygon points="'+' '.join(f'{100+(48 if i%2==0 else 22)*math.cos(math.radians(-90+i*36)):.1f},{100+(48 if i%2==0 else 22)*math.sin(math.radians(-90+i*36)):.1f}' for i in range(10))+'" fill="url(#g2)"/><circle cx="100" cy="100" r="10" fill="#fff"/>',
 'shield':'<path d="M100 48 L146 64 L140 112 Q132 140 100 154 Q68 140 60 112 L54 64Z" fill="url(#g2)"/><path d="M100 70 L106 96 L132 96 L110 110 L118 136 L100 120 L82 136 L90 110 L68 96 L94 96Z" fill="#fff" opacity=".85"/>',
 'hourglass':'<path d="M66 50 L134 50 L104 100 L134 150 L66 150 L96 100Z" fill="url(#g2)"/><path d="M84 64 L116 64 L100 92Z" fill="#fff" opacity=".85"/>',
 'd':'<text x="100" y="124" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="800" font-size="72" fill="#fff">D</text>'}
def emblem(id,a,b,g):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" role="img" aria-label="{id} deck emblem (original)">
<defs><linearGradient id="g1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2a2f9a"/><stop offset=".55" stop-color="#4b2bb8"/><stop offset="1" stop-color="#8a2ba8"/></linearGradient>
<linearGradient id="g2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{b}"/><stop offset="1" stop-color="{a}"/></linearGradient>
<radialGradient id="g3" cx=".5" cy=".38" r=".6"><stop offset="0" stop-color="#ffffff" stop-opacity=".35"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient></defs>
<rect width="200" height="200" rx="28" fill="url(#g1)"/>
<polygon points="{poly(6,84)}" fill="none" stroke="#3fe0ff" stroke-opacity=".55" stroke-width="3"/>
<polygon points="{poly(6,70)}" fill="{a}" fill-opacity=".18" stroke="{a}" stroke-width="4"/>
<circle cx="100" cy="100" r="92" fill="url(#g3)"/>
{GLYPH[g]}
</svg>'''
os.makedirs(OUT,exist_ok=True)
for id,(a,b,g) in DECKS.items(): open(f'{OUT}/{id}.svg','w').write(emblem(id,a,b,g))
# home hero: original "aurora prism" composition
rays=''.join(f'<path d="M400 300 L{400+520*math.cos(math.radians(i*22.5)):.0f} {300+520*math.sin(math.radians(i*22.5)):.0f}" stroke="{["#3fe0ff","#ff4fd8","#ffcf4a"][i%3]}" stroke-opacity=".22" stroke-width="{6 if i%2 else 3}"/>' for i in range(16))
hero=f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" role="img" aria-label="Duel Doctrine Lab crest (original artwork)">
<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2d5bff"/><stop offset=".5" stop-color="#5b35e6"/><stop offset="1" stop-color="#c13ad6"/></linearGradient>
<linearGradient id="pr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7ff6ff"/><stop offset=".5" stop-color="#ffffff"/><stop offset="1" stop-color="#ff8be6"/></linearGradient>
<radialGradient id="glow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs>
<rect width="800" height="600" fill="url(#bg)"/>{rays}
<circle cx="400" cy="300" r="230" fill="url(#glow)"/>
<polygon points="{poly(6,210,400,300)}" fill="none" stroke="#ffffff" stroke-opacity=".5" stroke-width="4"/>
<polygon points="{poly(6,170,400,300,0)}" fill="#ffffff" fill-opacity=".08" stroke="#3fe0ff" stroke-width="6"/>
<polygon points="400,140 500,300 400,460 300,300" fill="url(#pr)" opacity=".95"/>
<polygon points="400,180 470,300 400,420 330,300" fill="#3a2bb8" opacity=".55"/>
<text x="400" y="326" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="800" font-size="78" fill="#ffffff">D</text>
<circle cx="400" cy="140" r="10" fill="#ffcf4a"/><circle cx="500" cy="300" r="8" fill="#3fe0ff"/><circle cx="300" cy="300" r="8" fill="#ff4fd8"/><circle cx="400" cy="460" r="10" fill="#ffcf4a"/>
</svg>'''
open(f'{OUT}/hero-aurora.svg','w').write(hero)
print(sorted(os.listdir(OUT)))

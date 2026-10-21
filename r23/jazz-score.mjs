// r23-fx soundtrack (Claude, 21 Oct 2026): an original, procedurally written upbeat jazz score for Duel Doctrine Lab.
// No samples and no existing tune: the chord plans, walking-bass rules, drum and comping patterns and horn riffs below
// were written for this app. The score is a pure function of (theme, beat), so it is deterministic and testable;
// sound-engine.mjs synthesises it with Web Audio.
// Layers (stems, as before): 0 = walking bass, swing drums and light comping (always); 1 = busier comping, snare
// accents and piano fills (tense board); 2 = horn-section stabs and a lead riff (lethal / low LP).
export const JAZZ_THEMES={
 branded:{root:38,tempo:142,mode:'minor'}, // D minor, driving
 mikanko:{root:43,tempo:132,mode:'major'}, // G major, bright
 sky:{root:46,tempo:158,mode:'major'},     // B-flat major, fast
 luna:{root:39,tempo:124,mode:'minor'},    // E-flat minor, smooth
 custom:{root:41,tempo:136,mode:'major'}   // F major
};
const Q={maj7:[0,4,7,11,14],dom7:[0,4,7,10,14],m7:[0,3,7,10,14],m7b5:[0,3,6,10,13],six:[0,4,7,9,14],alt:[0,4,10,13,15],m6:[0,3,7,9,14]};
// Chord plans: [semitones above the key root, quality, beats]. A and B sections; the form is A A B A (32 bars).
const PLANS={
 major:{A:[[0,'maj7',4],[9,'dom7',4],[2,'m7',4],[7,'dom7',4],[4,'m7',2],[9,'dom7',2],[2,'m7',2],[7,'dom7',2],[0,'six',2],[5,'dom7',2],[4,'m7',2],[9,'dom7',2],[2,'m7',4],[7,'alt',4]],
        B:[[5,'maj7',4],[5,'m7',2],[10,'dom7',2],[0,'maj7',4],[9,'dom7',4],[2,'m7',4],[7,'dom7',4],[0,'six',2],[3,'dom7',2],[2,'m7',2],[7,'dom7',2]]},
 minor:{A:[[0,'m7',4],[0,'m6',4],[5,'m7',4],[10,'dom7',4],[3,'maj7',4],[8,'maj7',4],[2,'m7b5',2],[7,'alt',2],[0,'m7',2],[7,'alt',2]],
        B:[[8,'dom7',4],[7,'alt',4],[0,'m7',4],[5,'dom7',4],[0,'m7',2],[8,'dom7',2],[2,'m7b5',2],[7,'alt',2],[0,'m6',4],[7,'alt',4]]}
};
const mtof=m=>440*Math.pow(2,(m-69)/12);
// Small deterministic hash -> [0,1).
const rand=(...k)=>{let h=2166136261;for(const c of k.join('|'))h=Math.imul(h^c.charCodeAt(0),16777619);h^=h>>>13;h=Math.imul(h,0x5bd1e995);return ((h^(h>>>15))>>>0)/4294967296};
function sectionPlan(mode,section){const p=PLANS[mode]||PLANS.major,list=section==='B'?p.B:p.A,out=[];for(const [deg,q,beats] of list)for(let i=0;i<beats;i++)out.push({deg,q,beat:i,len:beats});return out}// one entry per beat (32 beats)
const FORM=['A','A','B','A'];
export function chordAt(theme,beat){const t=JAZZ_THEMES[theme]||JAZZ_THEMES.custom,b=((beat%128)+128)%128,section=FORM[Math.floor(b/32)],plan=sectionPlan(t.mode,section),c=plan[b%32],next=plan[(b%32+c.len-c.beat)%32];return {...c,section,root:t.root+c.deg,next:t.root+next.deg,tones:Q[c.q]}}
export function beatSeconds(theme){return 60/(JAZZ_THEMES[theme]||JAZZ_THEMES.custom).tempo}
export const SWING=.64;// the swung "and" falls at 64% of the beat
// Notes for one beat. at/dur are in seconds from the beat start; stem 0/1/2; inst names a synth voice.
export function jazzBeat(theme,beat){
 const sec=beatSeconds(theme),sw=sec*SWING,c=chordAt(theme,beat),bar=Math.floor(beat/4),pos=((beat%4)+4)%4,out=[];
 // Walking bass: root on the chord's first beat, chord tones in between, a chromatic approach into the next root.
 let bass=c.root;
 if(c.beat===0)bass=c.root;else if(c.beat===c.len-1)bass=c.next+(rand(theme,beat,'ap')<.5?-1:1);else bass=c.root+[c.tones[1],c.tones[2],12,c.tones[3]-12,c.tones[2]][Math.floor(rand(theme,beat,'w')*5)];
 while(bass>50)bass-=12;while(bass<31)bass+=12;
 out.push({inst:'bass',stem:0,at:0,dur:sec*.92,freq:mtof(bass),gain:.3});
 if(pos===3&&rand(theme,bar,'skip')<.3)out.push({inst:'bass',stem:0,at:sw,dur:sec*.3,freq:mtof(bass+(rand(theme,beat,'g')<.5?-2:2)),gain:.16});// ghost skip note
 // Drums: swing ride, hi-hat foot on 2 and 4, feathered kick, brush snare chatter.
 out.push({inst:'ride',stem:0,at:0,dur:.32,gain:pos%2?.08:.1});
 if(pos%2===1)out.push({inst:'ride',stem:0,at:sw,dur:.18,gain:.065},{inst:'hat',stem:0,at:0,dur:.06,gain:.09});
 if(pos%2===0)out.push({inst:'kick',stem:0,at:0,dur:.2,gain:pos===0?.28:.16});
 if(rand(theme,beat,'sn')<.22)out.push({inst:'snare',stem:0,at:sw,dur:.1,gain:.05});
 // Light comping (always): a rootless chord on the swung "and" of 2 and on 4.
 const voicing=c.tones.slice(1).map(i=>{let m=c.root+i;while(m<54)m+=12;while(m>70)m-=12;return m});
 if(pos===1&&rand(theme,bar,'c1')<.8||pos===3&&rand(theme,bar,'c2')<.55)out.push({inst:'keys',stem:0,at:pos===1?sw:0,dur:sec*.55,freqs:voicing.map(mtof),gain:.075});
 // Stem 1: pushes, snare accents and a short fill every fourth bar.
 if(pos===0&&rand(theme,bar,'push')<.6)out.push({inst:'keys',stem:1,at:sw-sec,dur:sec*.4,freqs:voicing.map(m=>mtof(m+12)),gain:.07});
 if(pos===2||pos===3&&rand(theme,beat,'acc')<.5)out.push({inst:'snare',stem:1,at:pos===2?sw:0,dur:.12,gain:.12});
 if(bar%4===3&&pos>=2){const scale=[0,2,3,5,7,9,10,12];for(let i=0;i<2;i++)out.push({inst:'piano',stem:1,at:i?sw:0,dur:sec*.35,freq:mtof(c.root+24+scale[Math.floor(rand(theme,beat,'f',i)*scale.length)]),gain:.08})}
 // Stem 2: horn stabs on the anticipations and a call-and-response riff.
 if(pos===3&&bar%2===1)out.push({inst:'horns',stem:2,at:sw,dur:sec*.45,freqs:voicing.slice(0,3).map(m=>mtof(m)),gain:.09});
 if(pos===0&&bar%2===0)out.push({inst:'horns',stem:2,at:0,dur:sec*.3,freqs:voicing.slice(0,3).map(m=>mtof(m+12)),gain:.08});
 if(bar%2===0&&pos>=1){const riff=[[7,10],[12,10],[7,5]][pos-1],blue=[0,3,5,6,7,10,12];out.push({inst:'lead',stem:2,at:0,dur:sec*.42,freq:mtof(c.root+24+riff[0]),gain:.08},{inst:'lead',stem:2,at:sw,dur:sec*.3,freq:mtof(c.root+24+(rand(theme,beat,'blue')<.5?riff[1]:blue[Math.floor(rand(theme,beat,'b')*blue.length)])),gain:.07})}
 return out;
}

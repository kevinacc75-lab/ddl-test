// r23.1 soundtrack (Claude, 21 Oct 2026): an original, procedurally written high-tempo action jazz score for Duel Doctrine
// Lab. Kevy asked for something in the spirit of a fast, brassy, climbing action-jazz cue ("Monoco", Clair Obscur:
// Expedition 33). Nothing is taken from that track: no melody, riff, chord sequence or recording. The chord plans, bass
// rules, drum patterns, brass figures and the climbing form below were written for this app.
// What makes it "climb": the 32-bar form steps the key up a semitone every 8 bars (four lifts), each 8-bar phrase's
// brass line rises bar by bar and answers itself a step higher, the drums build into a rising tom fill and crash at
// every lift, and the last bar before the reset rips up into the next round.
// The score is a pure function of (theme, beat): deterministic and testable; sound-engine.mjs synthesises it.
// Stems: 0 = driving bass, drums, piano stabs and brass section hits (always); 1 = the brass melody (always present,
// louder when the board is tense); 2 = high trumpet doubling, shout notes and extra percussion (lethal / low LP).
export const JAZZ_THEMES={
 branded:{root:38,tempo:176,mode:'minor'}, // D minor
 mikanko:{root:43,tempo:168,mode:'major'}, // G major
 sky:{root:46,tempo:184,mode:'major'},     // B-flat major
 luna:{root:39,tempo:160,mode:'minor'},    // E-flat minor
 custom:{root:41,tempo:172,mode:'major'}   // F major
};
const Q={maj7:[0,4,7,11,14],dom7:[0,4,7,10,14],m7:[0,3,7,10,14],m7b5:[0,3,6,10,13],six:[0,4,7,9,14],alt:[0,4,10,13,15],m6:[0,3,7,9,14],sus:[0,5,7,10,14]};
// 8-bar plans, [semitones above the phrase key, quality, beats]. Each phrase ends on a dominant that leads up.
const PLANS={
 major:[[0,'six',4],[9,'dom7',4],[2,'m7',4],[7,'dom7',4],[5,'maj7',2],[6,'m7b5',2],[4,'m7',2],[9,'dom7',2],[2,'m7',4],[7,'sus',2],[8,'dom7',2]],
 minor:[[0,'m7',4],[0,'m6',4],[5,'m7',4],[10,'dom7',4],[8,'maj7',2],[2,'m7b5',2],[7,'alt',4],[0,'m7',2],[3,'dom7',2],[7,'sus',2],[8,'dom7',2]]
};
const mtof=m=>440*Math.pow(2,(m-69)/12);
// Small deterministic hash -> [0,1).
const rand=(...k)=>{let h=2166136261;for(const c of k.join('|'))h=Math.imul(h^c.charCodeAt(0),16777619);h^=h>>>13;h=Math.imul(h,0x5bd1e995);return ((h^(h>>>15))>>>0)/4294967296};
function phrasePlan(mode){const out=[];for(const [deg,q,beats] of PLANS[mode]||PLANS.major)for(let i=0;i<beats;i++)out.push({deg,q,beat:i,len:beats});return out}// 32 beats
// The climb: phrase n of the 32-bar round is a semitone higher than phrase n-1, then the round resets.
export const LIFT=[0,1,2,3];
export function chordAt(theme,beat){const t=JAZZ_THEMES[theme]||JAZZ_THEMES.custom,b=((beat%128)+128)%128,phrase=Math.floor(b/32),plan=phrasePlan(t.mode),c=plan[b%32],nextBeat=b%32+c.len-c.beat,lift=LIFT[phrase],nextLift=nextBeat>=32?LIFT[(phrase+1)%4]:lift,next=plan[nextBeat%32];
 return {...c,phrase,lift,root:t.root+lift+c.deg,next:t.root+nextLift+next.deg,tones:Q[c.q]}}
export function beatSeconds(theme){return 60/(JAZZ_THEMES[theme]||JAZZ_THEMES.custom).tempo}
export const SWING=.6;// at these tempos the swung "and" falls at 60% of the beat
// Brass rhythm cells (which of the 8 eighths in a bar sound) and the 4-bar call/answer shape.
const CELLS=[[1,0,1,1,0,1,0,0],[0,1,1,0,1,1,0,1],[1,1,0,1,0,0,1,1],[1,0,0,1,1,0,1,0],[0,0,1,1,1,1,0,1]];
const STEPS=[0,2,4,5,7,9,10,12,14];// scale steps used for the line (mixolydian/dorian colour; the chord picks the tones)
function brassPitch(theme,c,bar,i){// rises through the phrase and within the bar; answers sit a step higher
 const t=JAZZ_THEMES[theme]||JAZZ_THEMES.custom,b8=bar%8,base=t.root+c.lift+24+Math.floor(b8*1.6)+(b8%2?2:0);
 const target=base+i+Math.floor(rand(theme,bar,'mel',i)*3);let best=null;
 for(const o of [-12,0,12])for(const iv of c.tones){const m=c.root+o+iv+12;if(best===null||Math.abs(m-target)<Math.abs(best-target))best=m}
 if(rand(theme,bar,'pass',i)<.25)best+=STEPS.includes(((best-c.root)%12+12)%12+1)?1:-1;// a passing tone now and then
 while(best<64)best+=12;while(best>84)best-=12;return best}
// Notes for one beat. at/dur are in seconds from the beat start; stem 0/1/2; inst names a synth voice.
export function jazzBeat(theme,beat){
 const sec=beatSeconds(theme),sw=sec*SWING,c=chordAt(theme,beat),bar=Math.floor(beat/4),pos=((beat%4)+4)%4,b8=bar%8,round=Math.floor((((beat%128)+128)%128)/32),out=[];
 // Driving walking bass: root on each chord, chord tones between, a chromatic approach into the next chord.
 let bass=c.root;
 if(c.beat===0)bass=c.root;else if(c.beat===c.len-1)bass=c.next+(rand(theme,beat,'ap')<.5?-1:1);else bass=c.root+[c.tones[1],c.tones[2],12,c.tones[3]-12,c.tones[2]][Math.floor(rand(theme,beat,'w')*5)];
 while(bass>50)bass-=12;while(bass<31)bass+=12;
 out.push({inst:'bass',stem:0,at:0,dur:sec*.9,freq:mtof(bass),gain:.27});
 if(pos===1||pos===3)out.push({inst:'bass',stem:0,at:sw,dur:sec*.28,freq:mtof(bass+(pos===3?1:0)),gain:.12});// pushed eighths
 // Drums: ride on every beat and swung "and", hi-hat on 2 and 4, kick on 1 and the "and" of 2, snare backbeat chatter.
 out.push({inst:'ride',stem:0,at:0,dur:.26,gain:pos%2?.085:.1});
 if(pos%2===1)out.push({inst:'ride',stem:0,at:sw,dur:.16,gain:.07},{inst:'hat',stem:0,at:0,dur:.05,gain:.1});
 if(pos===0)out.push({inst:'kick',stem:0,at:0,dur:.18,gain:.3});
 if(pos===1&&rand(theme,bar,'k2')<.7)out.push({inst:'kick',stem:0,at:sw,dur:.15,gain:.2});
 if(pos===1||pos===3)out.push({inst:'snare',stem:0,at:0,dur:.09,gain:.1});
 if(rand(theme,beat,'gh')<.35)out.push({inst:'snare',stem:0,at:sw,dur:.06,gain:.045});
 // Lift bars: crash on the downbeat of each phrase; the last bar of each phrase is a rising tom fill.
 if(b8===0&&pos===0)out.push({inst:'crash',stem:0,at:0,dur:1.4,gain:.13});
 if(b8===7)for(let i=0;i<2;i++)out.push({inst:'tom',stem:0,at:i?sw:0,dur:.16,freq:[98,117,139,165,196,233,277,330][pos*2+i],gain:.2});
 // Piano: Charleston-style stabs on 1 and the "and" of 2 (rootless voicings).
 const voicing=c.tones.slice(1).map(i=>{let m=c.root+i;while(m<55)m+=12;while(m>72)m-=12;return m});
 if(pos===0)out.push({inst:'keys',stem:0,at:0,dur:sec*.35,freqs:voicing.map(mtof),gain:.07});
 if(pos===1)out.push({inst:'keys',stem:0,at:sw,dur:sec*.45,freqs:voicing.map(mtof),gain:.07});
 // Brass section hits (always): anticipations on the "and" of 4 and punches on beat 1 of every other bar.
 if(pos===3&&b8%2===1)out.push({inst:'brass',stem:0,at:sw,dur:sec*.55,freqs:voicing.slice(0,3).map(m=>mtof(m)),gain:.1});
 if(pos===0&&b8%2===0&&b8>0)out.push({inst:'brass',stem:0,at:0,dur:sec*.3,freqs:voicing.slice(0,3).map(m=>mtof(m)),gain:.095});
 // Brass melody (stem 1): two eighths per beat from the bar's rhythm cell, climbing through the phrase.
 const cell=CELLS[Math.floor(rand(theme,Math.floor(bar/2),round,'cell')*CELLS.length)];
 if(b8<7)for(let i=0;i<2;i++)if(cell[pos*2+i]){const m=brassPitch(theme,c,bar,pos*2+i);out.push({inst:'lead',stem:1,at:i?sw:0,dur:sec*(i?.35:.5),freq:mtof(m),gain:.13});
   // Stem 2: the high trumpet doubles the line an octave up in the second half of each phrase.
   if(b8>=4)out.push({inst:'lead',stem:2,at:i?sw:0,dur:sec*(i?.3:.45),freq:mtof(m+12),gain:.07})}
 // Bar 7: the rip. A long rising note that glides up into the next phrase's key.
 if(b8===7&&pos===0){const top=c.root+24+12+c.lift;out.push({inst:'rip',stem:1,at:0,dur:sec*3.6,freq:mtof(top-7),to:mtof(top+(round===3?-c.lift:1)),gain:.12},{inst:'rip',stem:2,at:sec,dur:sec*2.6,freq:mtof(top+5),to:mtof(top+12),gain:.05})}
 // Stem 2 extra drive: open hi-hat on the off-beats and shout chords on the last two bars of the round.
 if(pos%2===0)out.push({inst:'hat',stem:2,at:sw,dur:.12,gain:.07});
 if(round===3&&b8>=6&&pos===0)out.push({inst:'brass',stem:2,at:0,dur:sec*1.6,freqs:voicing.slice(0,3).map(m=>mtof(m+12)),gain:.06});
 return out;
}

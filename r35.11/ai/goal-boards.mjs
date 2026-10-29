// r30 goal boards (Claude, 22 Oct 2026; Kevy: "it needs to feel like I am watching a competitive player pilot the deck").
// SELF-VERIFIED (builder = verifier), NOT independent; Akiza (lines) / Alexis (rulings) review pending.
// The search judges a board with boardScore (bodies, ATK, cards in hand). That judge is the same for every deck, so it
// can't tell a competitive end board from a pile of bodies. A goal board says what this deck is trying to end on; the
// bonus below is added to boardScore when search compares moves. Values are in boardScore units (one plain monster is
// about 120-250, one card in hand 85). Decks without an entry keep the generic judge.
// Facts used: Mirrorjade's banish is a Quick Effect; Lunalight Liger Dancer is unaffected by non-Lunalight effects and
// destroys every Special Summoned monster (Quick Effect); Uzuhime is the Mikanko Ritual boss.
const onField=(d,seat)=>d.zone(seat,4).filter(c=>c&&(c.position&5)).map(c=>d.name(c.code));
const setCards=(d,seat)=>d.zone(seat,8).filter(c=>c&&c.sequence<5&&!(c.position&5)).map(c=>d.name(c.code));
const count=(names,re)=>names.filter(n=>re.test(n)).length;
export const GOALS={
 branded:{
  why:'End on Mirrorjade (Quick Effect banish) plus another Fusion body, with Super Polymerization / Branded Retribution set for their turn.',
  score(d,seat){const f=onField(d,seat),s=setCards(d,seat);let v=0;
   if(f.includes('Mirrorjade the Iceblade Dragon'))v+=600;
   v+=Math.min(2,count(f,/Albion the Sanctifire|Lubellion the Searing|Granguignol|Titaniklad|Rindbrumm|Alba-Lenatus|Luluwalilith|Devours the Dogma|Sprind/))*250;
   v+=Math.min(2,count(s,/Super Polymerization|Branded Retribution|Branded in Red|The Fallen & The Virtuous/))*200;
   return v}},
 luna:{
  why:'End on Lunalight Liger Dancer (with Perfume Dancer or Leo Dancer beside it); Wolf in the Pendulum Zone for a second Fusion.',
  score(d,seat){const f=onField(d,seat);let v=0;
   if(f.includes('Lunalight Liger Dancer'))v+=700;else if(f.includes('Lunalight Leo Dancer'))v+=350;
   if(f.includes('Lunalight Perfume Dancer'))v+=150;
   if(d.zone(seat,8).some(c=>c&&d.name(c.code)==='Lunalight Wolf'))v+=100;
   return v}},
 mikanko:{
  why:'Going second: break their board (Kaiju, Lava Golem, Raigeki, Lightning Storm, Droplet), then win with Mikanko equips and Uzuhime; going first: Uzuhime with a Mikanko set.',
  score(d,seat){const f=onField(d,seat);let v=0;
   v-=d.zone(1-seat,4).filter(c=>c&&(c.position&5)).length*250;/* every opposing monster left is a problem for this deck */
   v+=(8000-d.lp[1-seat])/30;/* damage dealt counts double compared with boardScore's LP gap */
   if(f.includes('Uzuhime the Manifested Mikanko'))v+=300;
   return v}},
 // r36 (Claude, 29 Oct 2026; DRAFT, Akiza review pending): Time Typhoon, K9 Radiant Typhoon Dark Time Wizard.
 dtw:{
  why:'End on CXyz Hope Chaos Barian Dragon with a "Number C" material (search lock) or a K9 Rank 5, with Foolish Graverobber / Reversal Box / Sleepy Scapegoats set and Dark Time Wizard coming back; going second, Red-Eyes Black Dragon Exceed over their board.',
  score(d,seat){const f=onField(d,seat),s=setCards(d,seat);let v=0;
   if(f.includes('CXyz Hope Chaos Barian Dragon'))v+=600;/* in this deck it is only Xyz Summoned on top of Number C104, so its lock is on */
   v+=Math.min(1,count(f,/^K9-17 "Ripper"|^K9-66X "Jacks"|^K9-X "Werewolf"/))*350;
   if(f.includes('Red-Eyes Black Dragon Exceed'))v+=400;
   v+=Math.min(3,count(s,/Foolish Graverobber|Reversal Box|Sleepy Scapegoats|Dark Time Wizard|K9-X Forced Release/))*150;
   return v}}
};
export function goalScore(d,seat){const id=d.decks?.[seat]?.id,g=GOALS[id];return g?g.score(d,seat):0}

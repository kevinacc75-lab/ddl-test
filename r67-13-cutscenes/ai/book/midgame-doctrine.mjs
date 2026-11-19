// r36 Arm C per-deck midgame doctrine (Seto, 30 Oct 2026; flag C, default off). Turn 3+ only.
//   boardTarget: the attack-ready Main Phase 1 board each deck builds before it attacks: at least `attackers` Attack
//     Position monsters with the strongest at `atk` ATK or more (or any lethal-ready board). Below the target the book line
//     may continue in Main Phase 1; at or above it, Extra Deck / field-Fusion builds wait until Main Phase 2.
//   closeOut: cards that end or swing a midgame (board breakers, burn/boss attackers). They are added to the moves search
//     compares, NEVER forced; search judges them against the book and the base policy, and everything falls back to the
//     generic rule (Arm B if on, else r35.11). Every name is checked against the deck lists by tests/r36-midgame.test.mjs.
// Mikanko H4 (the Hu-Li hand loop) is not attempted here.
export const MIDGAME_DOCTRINE={
 branded:{boardTarget:{attackers:2,atk:2500},closeOut:['Mirrorjade the Iceblade Dragon','Super Polymerization']},
 mikanko:{boardTarget:{attackers:1,atk:2000},closeOut:['Double-Edged Sword','Raigeki','Lightning Storm','Forbidden Droplet','Lava Golem','Jizukiru, the Star Destroying Kaiju','Thunder King, the Lightningstrike Kaiju',"Harpie's Feather Duster",'Knightmare Phoenix']},
 sky:{boardTarget:{attackers:1,atk:1500},closeOut:['Sky Striker Ace - Hayate','Sky Striker Maneuver - Afterburners!','Sky Striker Mecha - Widow Anchor','Forbidden Droplet','Raigeki']},
 luna:{boardTarget:{attackers:2,atk:2500},closeOut:['Lunalight Liger Dancer','Super Duper Polymerization','Lunalight Leo Dancer','Lunalight Sabre Dancer','Knightmare Phoenix']},
 blueeyes:{boardTarget:{attackers:1,atk:3000},closeOut:['Primite Drillbeam','Forbidden Droplet']},
 kashtira:{boardTarget:{attackers:2,atk:2400},closeOut:['Kumongous, the Sticky String Kaiju','Radian, the Multidimensional Kaiju','Interrupted Kaiju Slumber','Kashtira Big Bang']},
 toon:{boardTarget:{attackers:2,atk:2000},closeOut:['Raigeki','Toon Black Luster Soldier','Black Luster Soldier - Soldier of Chaos','Knightmare Phoenix']},
 hero:{boardTarget:{attackers:2,atk:2500},closeOut:['Forbidden Droplet','Destiny HERO - Destroyer Phoenix Enforcer']},
 dtw:{boardTarget:{attackers:2,atk:2500},closeOut:['Red-Eyes Black Dragon Exceed','Forbidden Droplet']},
};
export const doctrineFor=id=>MIDGAME_DOCTRINE[id]||null;

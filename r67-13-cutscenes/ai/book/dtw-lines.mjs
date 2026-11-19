// r36 data file: Time Typhoon (K9 Radiant Typhoon Dark Time Wizard) combo book (Claude, 29 Oct 2026, for Kevy).
// STATUS: DRAFT, SELF-VERIFIED; Akiza (lines) / Alexis (rulings) review pending (handover 29 Oct 11:05).
// Built from the printed card texts (not the playbook PDF, which has wrong texts: Alligator's Dragon Knight is a Level 5
// WIND Dragon, Fisherman of Legend is not a targeting shield, Panther + Alligator cannot Xyz). Decisions the format
// can't express (Dark Time Wizard's mode, Panther's Tribute, Alligator's search/discard, Exceed's Tribute, holds) live
// in dtw-plan.mjs.
// Core going first (0 Normal Summons used): Eldam/Swen Special Summon themselves (opponent controls no Spell/Trap) and
// search each other -> M-X-Saber Invoker -> Swiftwind Panther Warrior from the Deck -> Panther Tributes Invoker ->
// Alligator's Dragon Knight from the Deck -> adds Dark Time Wizard + Foolish Graverobber, discards Graceful & Skull Dice
// -> Dark Time Wizard searches Reversal Box / Sleepy Scapegoats (and returns in the End Phase). Then the Normal Summon:
// K9-17 Izuna (opponent holds 2+ cards; sends K9-ØØ Lupis) with Alligator (Level 5) makes Rank 5:
// N.As.H. Knight -> CXyz N.As.Ch. Knight -> Number C104 -> CXyz Hope Chaos Barian Dragon (no adding from Deck to hand
// for them while it has a "Number C" material), else K9-17 "Ripper".
// Going second: Mystical Space Typhoon on their backrow (also turns on Eldam/Swen from the GY condition), Dark Time
// Wizard's coin on their monsters, then Red-Eyes Black Dragon Exceed by Tributing their best monster.
const TAIL=[
 {"do": "special", "card": "M-X-Saber Invoker"}, {"do": "activate", "card": "M-X-Saber Invoker"},
 {"do": "activate", "card": "Swiftwind Panther Warrior"},
 {"do": "activate", "card": "Dark Time Wizard"},
 {"do": "special", "card": "Red-Eyes Black Dragon Exceed"},
 {"do": "summon", "card": "K9-17 Izuna"}, {"do": "activate", "card": "K9-66a Jokul"}, {"do": "summon", "card": "K9-66a Jokul"},
 {"do": "special", "card": "N.As.H. Knight"}, {"do": "special", "card": "CXyz N.As.Ch. Knight"}, {"do": "activate", "card": "CXyz N.As.Ch. Knight"},
 {"do": "special", "card": "CXyz Hope Chaos Barian Dragon"},
 {"do": "special", "card": "K9-17 \"Ripper\""}, {"do": "activate", "card": "K9-17 \"Ripper\""}
];
const POT={"do": "activate", "card": "Pot of Prosperity"},MST={"do": "activate", "card": "Mystical Space Typhoon"};
export default {
 "deck": "dtw",
 "source": "Claude r36 from the printed card texts and Kevy's playbook (corrected); not yet reviewed by Akiza or Alexis.",
 "starters": ["Radiant Typhoon Eldam", "Radiant Typhoon Swen", "Radiant Typhoon Chant", "Alligator's Dragon Knight", "Fire Formation - Tenki", "Dark Time Wizard", "K9-17 Izuna", "K9-66a Jokul", "Chaotic Elements", "\"A Case for K9\"", "Swiftwind Panther Warrior"],
 "lines": [
  {"id": "DT-BREAK", "name": "Going second: Dark Time Wizard's coin on their board, then Red-Eyes Black Dragon Exceed", "when": {"second": true, "oppMonstersMin": 1, "handAny": ["Dark Time Wizard"]},
   "steps": [MST, {"do": "activate", "card": "Dark Time Wizard"}, {"do": "special", "card": "Red-Eyes Black Dragon Exceed"}, POT,
    {"do": "special", "card": "Radiant Typhoon Eldam"}, {"do": "special", "card": "Radiant Typhoon Swen"}, {"do": "activate", "card": "Alligator's Dragon Knight", "location": [2]}, ...TAIL]},
  {"id": "DT-RT2", "name": "Eldam + Swen: Invoker -> Panther -> Alligator, then Rank 5", "when": {"hand": ["Radiant Typhoon Eldam", "Radiant Typhoon Swen"]},
   "steps": [POT, MST, {"do": "special", "card": "Radiant Typhoon Eldam"}, {"do": "special", "card": "Radiant Typhoon Swen"}, ...TAIL, {"do": "activate", "card": "Radiant Typhoon Chant"}]},
  {"id": "DT-ELDAM", "name": "One-card Eldam: Eldam adds Swen -> Invoker -> Panther -> Alligator", "when": {"hand": ["Radiant Typhoon Eldam"]},
   "steps": [POT, MST, {"do": "special", "card": "Radiant Typhoon Eldam"}, {"do": "special", "card": "Radiant Typhoon Swen"}, ...TAIL, {"do": "activate", "card": "Radiant Typhoon Chant"}]},
  {"id": "DT-SWEN", "name": "One-card Swen: Swen adds Chant, Chant adds Eldam -> Invoker -> Panther -> Alligator", "when": {"hand": ["Radiant Typhoon Swen"]},
   "steps": [POT, MST, {"do": "special", "card": "Radiant Typhoon Swen"}, {"do": "activate", "card": "Radiant Typhoon Chant"}, {"do": "special", "card": "Radiant Typhoon Eldam"}, ...TAIL]},
  {"id": "DT-CHANT", "name": "Radiant Typhoon Chant adds Eldam; Eldam adds Swen -> Invoker -> Panther -> Alligator", "when": {"hand": ["Radiant Typhoon Chant"]},
   "steps": [POT, MST, {"do": "activate", "card": "Radiant Typhoon Chant"}, {"do": "special", "card": "Radiant Typhoon Eldam"}, {"do": "special", "card": "Radiant Typhoon Swen"}, ...TAIL]},
  {"id": "DT-ALLI", "name": "Alligator's Dragon Knight (reveal a Dark Time Wizard card): add Dark Time Wizard + Foolish Graverobber", "when": {"hand": ["Alligator's Dragon Knight"], "handAny": ["Dark Time Wizard", "Swiftwind Panther Warrior", "Fisherman of Legend", "Sleepy Scapegoats", "Graceful & Skull Dice", "Foolish Graverobber", "Reversal Box"]},
   "steps": [POT, {"do": "activate", "card": "Alligator's Dragon Knight", "location": [2]}, {"do": "activate", "card": "Dark Time Wizard"}, {"do": "summon", "card": "Swiftwind Panther Warrior"}, ...TAIL]},
  {"id": "DT-TENKI", "name": "Fire Formation - Tenki adds Panther; Panther Tributes a dead monster for Alligator", "when": {"hand": ["Fire Formation - Tenki"]},
   "steps": [POT, {"do": "activate", "card": "Fire Formation - Tenki"}, {"do": "summon", "card": "Swiftwind Panther Warrior"}, ...TAIL]},
  {"id": "DT-PANTHER", "name": "Swiftwind Panther Warrior: Tribute a dead monster for Alligator", "when": {"hand": ["Swiftwind Panther Warrior"]},
   "steps": [POT, {"do": "summon", "card": "Swiftwind Panther Warrior"}, ...TAIL]},
  {"id": "DT-DTW", "name": "Dark Time Wizard searches Alligator or Panther, and returns in the End Phase", "when": {"hand": ["Dark Time Wizard"]},
   "steps": [POT, {"do": "activate", "card": "Dark Time Wizard"}, {"do": "activate", "card": "Alligator's Dragon Knight", "location": [2]}, {"do": "summon", "card": "Swiftwind Panther Warrior"}, ...TAIL]},
  {"id": "DT-K9", "name": "K9 Rank 5: Izuna / Jokul (Chaotic Elements and \"A Case for K9\" find them)", "when": {"handAny": ["K9-17 Izuna", "K9-66a Jokul", "Chaotic Elements", "\"A Case for K9\""]},
   "steps": [POT, {"do": "activate", "card": "Chaotic Elements"}, {"do": "activate", "card": "\"A Case for K9\""}, ...TAIL]}
 ],
 "picks": [
  {"source": "Fire Formation - Tenki", "hint": [506], "prefer": ["Swiftwind Panther Warrior"]},
  {"source": "M-X-Saber Invoker", "hint": [509], "prefer": ["Swiftwind Panther Warrior"]},
  {"source": "K9-17 Izuna", "hint": [504], "prefer": ["K9-ØØ Lupis", "K9-X Forced Release", "\"A Case for K9\""]},
  {"source": "K9-66a Jokul", "hint": [506], "prefer": ["K9-17 Izuna", "K9-ØØ Lupis"]},
  {"source": "\"A Case for K9\"", "hint": [506], "ifHand": ["K9-17 Izuna"], "ifNotHand": ["K9-66a Jokul"], "prefer": ["K9-66a Jokul", "K9-17 Izuna"]},
  {"source": "\"A Case for K9\"", "hint": [506], "prefer": ["K9-17 Izuna", "K9-66a Jokul", "K9-ØØ Lupis"]},
  {"source": "K9-17 \"Ripper\"", "hint": [506], "prefer": ["K9-X Forced Release", "K9-17 Izuna", "K9-66a Jokul", "\"A Case for K9\""]},
  {"source": "Chaotic Elements", "hint": [506], "prefer": ["K9-66a Jokul"]},
  {"source": "CXyz N.As.Ch. Knight", "hint": [509], "prefer": ["Number C104: Umbral Horror Masquerade"]},
  {"source": "Pot of Prosperity", "hint": [503], "prefer": ["Totem Bird", "Number 75: Bamboozling Gossip Shadow", "S:P Little Knight", "I:P Masquerena", "K9-66X \"Jacks\"", "K9-X \"Werewolf\"", "K9-17 \"Ripper\"", "Red-Eyes Black Dragon Exceed"]},
  {"source": "Pot of Prosperity", "hint": [506], "prefer": ["Radiant Typhoon Eldam", "Radiant Typhoon Swen", "Alligator's Dragon Knight", "Radiant Typhoon Chant", "Fire Formation - Tenki", "Dark Time Wizard", "Swiftwind Panther Warrior", "K9-17 Izuna", "Chaotic Elements", "Ash Blossom & Joyous Spring", "Infinite Impermanence"]}
 ],
 "options": [],
 "blocks": [
  {"do": "special", "card": "S:P Little Knight", "unless": {"oppCardsMin": 1}, "why": "its banish needs a target: with nothing of theirs on the field it would banish our own card"},
  {"do": "special", "card": "K9-66X \"Jacks\"", "unless": {"oppMonstersMin": 1}, "why": "its Xyz Summon trigger destroys a monster: with none of theirs it would hit ours"},
  {"do": "activate", "card": "N.As.H. Knight", "why": "its attach would put Number C104 (needed for CXyz N.As.Ch. Knight -> Hope Chaos Barian Dragon) into its materials"},
  {"do": "special", "card": "I:P Masquerena", "if": {"fieldAny": ["CXyz Hope Chaos Barian Dragon", "Red-Eyes Black Dragon Exceed", "K9-X \"Werewolf\"", "K9-17 \"Ripper\""]}, "why": "keep the boss: this Link could use Hope Chaos Barian Dragon / Exceed / a K9 Xyz as material (seen in fixture F: Barian was linked away into Masquerena)"},
  {"do": "special", "card": "S:P Little Knight", "if": {"fieldAny": ["CXyz Hope Chaos Barian Dragon", "Red-Eyes Black Dragon Exceed", "K9-X \"Werewolf\"", "K9-17 \"Ripper\""]}, "why": "keep the boss: this Link could use Hope Chaos Barian Dragon / Exceed / a K9 Xyz as material"},
  {"do": "activate", "card": "K9-X Forced Release", "unless": {"oppCardsMin": 1, "notOwnTurn": true}, "why": "Set it for their turn: its rank-up then also destroys one of their cards (seen in fixture F: used on our turn 1 with nothing of theirs to destroy)"}
 ]
};

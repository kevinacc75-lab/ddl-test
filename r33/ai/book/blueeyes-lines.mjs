// r27 data file: Blue-Eyes (Primite / Maiden of White) opening book (Claude, 22 Oct 2026, deck review for Kevy; Akiza
// review pending). Plain data. Plan: get Blue-Eyes White Dragon into the GY (Primite Dragon Ether Beryl, Wishes discard),
// True Light (placed by Maiden of White) revives it, Maiden of White comes back, then Synchro into Blue-Eyes Spirit Dragon.
export default {
 "deck": "blueeyes",
 "source": "Claude r27 deck review (22 Oct 2026), from the printed texts; not yet reviewed by Akiza (lines) or Alexis (rulings).",
 "starters": ["Maiden of White", "Sage with Eyes of Blue", "Primite Dragon Ether Beryl", "Primite Lordly Lode", "Wishes for Eyes of Blue", "Roar of the Blue-Eyed Dragons"],
 "lines": [
  {"id": "BE-01", "name": "Lordly Lode search -> Ether Beryl (Set Primite, send Blue-Eyes) -> Maiden places True Light -> revive Blue-Eyes -> Spirit Dragon", "when": {},
   "steps": [{"do": "activate", "card": "Primite Lordly Lode"}, {"do": "activate", "card": "Wishes for Eyes of Blue"}, {"do": "summon", "card": "Primite Dragon Ether Beryl"}, {"do": "activate", "card": "Primite Dragon Ether Beryl"},
    {"do": "activate", "card": "Maiden of White"}, {"do": "activate", "card": "True Light"}, {"do": "activate", "card": "Roar of the Blue-Eyed Dragons"},
    {"do": "special", "card": "Blue-Eyes Spirit Dragon"}, {"do": "activate", "card": "Sage with Eyes of Blue"}]}
 ],
 "picks": [
  {"source": "Sage with Eyes of Blue", "hint": [504], "prefer": ["Maiden of White", "Lunar Rabbit Omajinai", "Primite Dragon Ether Beryl", "Ghost Mourner & Moonlit Chill", "Sage with Eyes of Blue"]},
  {"source": "Sage with Eyes of Blue", "hint": [509], "prefer": ["Blue-Eyes White Dragon"]},
  {"source": "Sage with Eyes of Blue", "hint": [506], "prefer": ["Maiden of White", "Lunar Rabbit Omajinai"]},
  {"source": "Primite Dragon Ether Beryl", "hint": [510], "ifNotHand": ["Primite Lordly Lode"], "prefer": ["Primite Lordly Lode", "Primite Drillbeam"]},
  {"source": "Primite Dragon Ether Beryl", "hint": [510], "prefer": ["Primite Drillbeam", "Primite Lordly Lode"]},
  {"source": "Primite Dragon Ether Beryl", "hint": [504], "prefer": ["Blue-Eyes White Dragon"]},
  {"source": "Primite Lordly Lode", "hint": [506], "prefer": ["Primite Dragon Ether Beryl", "Primite Drillbeam"]},
  {"source": "Wishes for Eyes of Blue", "hint": [501], "prefer": ["Blue-Eyes White Dragon", "Lunar Rabbit Omajinai", "Primite Drillbeam", "Mulcharmy Fuwalos", "Ghost Belle & Haunted Mansion", "Dominus Purge"]},
  {"source": "Wishes for Eyes of Blue", "hint": [506], "ifNotHand": ["Maiden of White"], "prefer": ["Maiden of White", "Roar of the Blue-Eyed Dragons", "True Light", "Majesty of the White Dragons", "Sage with Eyes of Blue"]},
  {"source": "Wishes for Eyes of Blue", "hint": [506], "prefer": ["Roar of the Blue-Eyed Dragons", "Sage with Eyes of Blue", "Majesty of the White Dragons", "True Light"]},
  {"source": "True Light", "hint": [509], "prefer": ["Blue-Eyes White Dragon"]},
  {"source": "True Light", "hint": [510], "prefer": ["Roar of the Blue-Eyed Dragons", "Wishes for Eyes of Blue", "Majesty of the White Dragons"]},
  {"source": "Roar of the Blue-Eyed Dragons", "hint": [509], "prefer": ["Blue-Eyes White Dragon"]},
  {"source": "*", "hint": [512], "prefer": ["Maiden of White", "Sage with Eyes of Blue", "Lunar Rabbit Omajinai", "Blue-Eyes White Dragon", "Primite Dragon Ether Beryl"]}
 ],
 "blocks": [
  {"do": "special", "card": "Lightstorm Dragon", "unless": {"oppCardsMin": 1}, "why": "Lightstorm Dragon's Summon effect destroys Spells/Traps and there are no opposing ones; Blue-Eyes Spirit Dragon is the Level 9 to make"},
  {"do": "special", "card": "Hieratic Seal of the Heavenly Spheres", "unless": {"oppMonstersMin": 1}, "why": "Hieratic Seal would use up the Synchro bosses as Link material"},
  {"do": "activate", "card": "Blue-Eyes Spirit Dragon", "unless": {"notOwnTurn": true, "oppChainTop": true}, "why": "Spirit Dragon's Tribute summon is destroyed in the End Phase: use it on the opponent's turn"}
 ],
 "setHold": {}
}

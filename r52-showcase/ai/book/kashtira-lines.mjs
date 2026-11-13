// r27 data file: Kashtira opening book (Claude, 22 Oct 2026, deck review for Kevy; Akiza review pending). Plain data.
// Core plan: a free Level 7 Kashtira (Fenrir / Unicorn / Ogre with an empty field) searches; Riseheart becomes Level 7
// by banishing a Kashtira from the Deck; Kashtiratheosis or Kashtira Birth adds a second Level 7; Xyz Summon
// Kashtira Shangri-Ira (each face-down banish then locks one of the opponent's zones).
export default {
 "deck": "kashtira",
 "source": "Claude r27 deck review (22 Oct 2026), from the printed texts; not yet reviewed by Akiza (lines) or Alexis (rulings).",
 "starters": ["Kashtira Fenrir", "Kashtira Unicorn", "Kashtira Ogre", "Kashtira Riseheart", "Kashtiratheosis", "Kashtira Birth"],
 "lines": [
  {"id": "K-SCARE", "name": "r34: Kashtira Birth lets Scareclaw Kashtira be Normal Summoned; Kashtiratheosis on it brings a second Level 7 -> Shangri-Ira", "when": {"hand": ["Scareclaw Kashtira", "Kashtiratheosis"]},
   "steps": [{"do": "special", "card": "Kashtira Shangri-Ira"}, {"do": "activate", "card": "Kashtira Birth"}, {"do": "summon", "card": "Scareclaw Kashtira"}, {"do": "activate", "card": "Kashtiratheosis"}]},
  {"id": "K-01", "name": "Free Level 7 Kashtira -> searches -> Riseheart Level 7 -> Kashtiratheosis / Birth -> Shangri-Ira", "when": {},
   "steps": [{"do": "special", "card": "Kashtira Fenrir"}, {"do": "special", "card": "Kashtira Unicorn"}, {"do": "special", "card": "Kashtira Ogre"},
    {"do": "activate", "card": "Kashtira Fenrir"}, {"do": "activate", "card": "Kashtira Unicorn"}, {"do": "activate", "card": "Kashtira Ogre"},
    {"do": "activate", "card": "Kashtira Riseheart"}, {"do": "summon", "card": "Kashtira Riseheart"},
    {"do": "activate", "card": "Kashtira Birth"}, {"do": "activate", "card": "Kashtiratheosis"},
    {"do": "special", "card": "Kashtira Shangri-Ira"}]}
 ],
 "picks": [
  {"source": "Kashtira Fenrir", "hint": [506], "ifNotHand": ["Kashtira Riseheart"], "prefer": ["Kashtira Riseheart", "Kashtira Unicorn", "Kashtira Ogre"]},
  {"source": "Kashtira Fenrir", "hint": [506], "prefer": ["Kashtira Unicorn", "Kashtira Ogre", "Tearlaments Kashtira", "Scareclaw Kashtira"]},
  {"source": "Kashtira Unicorn", "hint": [506], "ifNotHand": ["Kashtiratheosis"], "prefer": ["Kashtiratheosis", "Kashtira Birth", "Kashtira Overlap"]},
  {"source": "Kashtira Unicorn", "hint": [506], "prefer": ["Kashtira Birth", "Kashtira Overlap"]},
  {"source": "Kashtira Ogre", "hint": [506], "prefer": ["Kashtira Preparations", "Kashtira Big Bang"]},
  {"source": "Kashtira Riseheart", "prefer": ["Kashtira Fenrir", "Kashtira Unicorn", "Kashtira Ogre", "Kashtiratheosis", "Kashtira Overlap"]},
  {"source": "Kashtiratheosis", "hint": [509], "prefer": ["Kashtira Fenrir", "Kashtira Unicorn", "Kashtira Ogre", "Tearlaments Kashtira", "Scareclaw Kashtira"]},
  {"source": "Kashtira Birth", "hint": [509], "prefer": ["Kashtira Fenrir", "Kashtira Unicorn", "Kashtira Ogre", "Tearlaments Kashtira", "Scareclaw Kashtira", "Kashtira Riseheart"]},
  {"source": "Kashtira Preparations", "hint": [509], "prefer": ["Kashtira Fenrir", "Kashtira Unicorn", "Kashtira Ogre", "Tearlaments Kashtira", "Scareclaw Kashtira"]},
  {"source": "*", "hint": [513], "prefer": ["Kashtira Riseheart", "The Ascended of Thunder", "Scareclaw Kashtira", "Tearlaments Kashtira", "Kashtira Ogre", "Kashtira Unicorn", "Kashtira Fenrir"], "location": [4]}
 ],
 "blocks": [
  {"do": "activate", "card": "Scareclaw Kashtira", "location": [2], "if": {"handAny": ["Kashtiratheosis"]}, "ifAlso": {"handAny": ["Kashtira Birth"], "stAny": ["Kashtira Birth"]}, "why": "r34 (seed 102): its own Special Summon banished Kashtiratheosis; with Kashtira Birth, Normal Summon it instead and keep Kashtiratheosis for the second Level 7"},
  {"do": "activate", "card": "Interrupted Kaiju Slumber", "unless": {"oppMonstersMin": 1}, "why": "Interrupted Kaiju Slumber into an empty board only hands the opponent a Kaiju"},
  {"do": "special", "card": "The Ascended of Thunder", "unless": {"fieldLevel": 7, "oppMonstersMin": 1}, "why": "3000 LP for a lone Level 7 with no Xyz partner"},
  {"do": "special", "card": "Dark Armed, the Dragon of Annihilation", "unless": {"oppCardsMin": 1}, "why": "Dark Armed's effect needs an opposing card; Shangri-Ira is the Rank 7 to make here"},
  {"do": "special", "card": "Number 11: Big Eye", "unless": {"oppMonstersMin": 1}, "why": "Big Eye needs an opposing monster to take"},
  {"do": "special", "card": "Infinitrack Mountain Smasher", "unless": {"oppMonstersMin": 1}, "why": "no opposing monster to battle"},
  {"do": "special", "card": "Number 28: Titanic Moth", "unless": {"oppMonstersMin": 1, "notFirstTurn": true}, "why": "a turn-1 beater instead of Shangri-Ira"},
  {"do": "special", "card": "Kerzebs, the Gaoled Glutton", "unless": {"fieldAny": ["Kashtira Shangri-Ira"]}, "why": "Shangri-Ira comes first"}
 ],
 "noTributeWith": ["Kashtira Birth"],
 "setHold": {}
}

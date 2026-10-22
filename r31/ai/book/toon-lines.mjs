// r27 data file: Toon opening book (Claude, 22 Oct 2026, deck review for Kevy; Akiza review pending). Plain data.
// Plan: find Toon Kingdom (it is "Toon World" in the Field Zone and protects Toons), then the free Toon summons
// (Toon Harpie Lady from hand, Black Stone -> Red-Eyes Toon Dragon -> another Toon, Toon Dark Magician, Toon Page-Flip),
// then Toon Black Luster Soldier by tributing Toons.
export default {
 "deck": "toon",
 "source": "Claude r27 deck review (22 Oct 2026), from the printed texts; not yet reviewed by Akiza (lines) or Alexis (rulings).",
 "starters": ["Toon Table of Contents", "Toon Bookmark", "Toon Kingdom", "Toon World", "The Black Stone of Legend"],
 "lines": [
  {"id": "TO-01", "name": "Field spell first -> free Toon summons -> Red-Eyes Toon / Toon Dark Magician extenders -> Toon Black Luster Soldier", "when": {},
   "steps": [{"do": "activate", "card": "Toon Table of Contents"}, {"do": "activate", "card": "Toon Bookmark"}, {"do": "activate", "card": "Toon Kingdom"}, {"do": "activate", "card": "Toon World"},
    {"do": "activate", "card": "Toon Harpie Lady"}, {"do": "activate", "card": "Toon Page-Flip"}, {"do": "summon", "card": "The Black Stone of Legend"}, {"do": "activate", "card": "The Black Stone of Legend"},
    {"do": "activate", "card": "Red-Eyes Toon Dragon"}, {"do": "activate", "card": "Toon Dark Magician"}, {"do": "special", "card": "Toon Black Luster Soldier"}]}
 ],
 "picks": [
  {"source": "Toon Table of Contents", "hint": [506], "ifNotHand": ["Toon Kingdom", "Toon World"], "prefer": ["Toon Kingdom", "Toon World", "Toon Bookmark"]},
  {"source": "Toon Table of Contents", "hint": [506], "prefer": ["Toon Dark Magician", "Toon Page-Flip", "Red-Eyes Toon Dragon", "Toon Harpie Lady"]},
  {"source": "Toon Bookmark", "hint": [506], "ifNotHand": ["Toon Kingdom"], "prefer": ["Toon Kingdom", "Toon World", "Toon Page-Flip"]},
  {"source": "Toon Bookmark", "hint": [506], "prefer": ["Toon Page-Flip", "Comic Hand", "Toon World"]},
  {"source": "The Black Stone of Legend", "hint": [509], "prefer": ["Red-Eyes Toon Dragon"]},
  {"source": "Toon Page-Flip", "hint": [526], "prefer": ["Toon Dark Magician", "Red-Eyes Toon Dragon", "Toon Black Luster Soldier", "Toon Cyber Dragon", "Toon Harpie Lady"]},
  {"source": "Red-Eyes Toon Dragon", "hint": [509], "prefer": ["Toon Dark Magician", "Toon Black Luster Soldier", "Toon Cyber Dragon", "Toon Harpie Lady"]}
 ],
 "blocks": [
  {"do": "activate", "card": "Toon World", "if": {"stAny": ["Toon Kingdom"], "handAny": ["Toon Kingdom"]}, "why": "Toon Kingdom already is Toon World (free, and it protects the Toons); a second one only costs 1000 LP"}
 ],
 "setHold": {}
}

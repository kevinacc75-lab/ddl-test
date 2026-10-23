// r31 data file: Mikanko / Kaiju playbook, light touch (Claude, 22 Oct 2026; Akiza review pending). The live search
// already plays this deck's going-second board breaks well (one-turn wins on most seeded hands when it has its full
// time), so this book adds only clear picks and keeps book-trust OFF ("trust": false): search still decides every move.
// Note for Tea: this list has no "Mikanko Kagura", the Ritual Spell Ohime names; Preparation of Rites can only add
// Ohime (no Ritual Spell to recover), and Ohime reaches the field through The Great Mikanko Ceremony or Noble Twins.
// r32 (Kevy item 2, board breaker): a Kaiju / Lava Golem tributes the opponent's best monster (oppValue in book.mjs:
// Extra Deck boss first, then effects that work on our turn, then ATK). Alexis: please rule on floating effects such as
// Mirrorjade's "leaves the field by an opponent's card" when it is Tributed for a Kaiju.
export default {
 "deck": "mikanko",
 "trust": false,
 "source": "Claude r31 from the printed card texts; not yet reviewed by Akiza or Alexis.",
 "starters": ["Mikanko Shinbu - Noble Twins", "Ohime the Manifested Mikanko", "Preparation of Rites", "Mikanko Water Arabesque"],
 "lines": [
  {"id": "MK-UZU", "name": "Ohime adds Ha-Re -> Arabesque on Ha-Re (Fire Dance) -> Hu-Li from the Deck (Spiritwalk) -> Fire Dance brings Ha-Re back -> Uzuhime", "postBan": "r34 deck brain (Claude 23 Oct; Akiza review pending)",
   "when": {"first": true, "handAny": ["Ha-Re the Sword Mikanko", "Hu-Li the Jewel Mikanko", "Ohime the Manifested Mikanko"]},
   "steps": [{"do": "activate", "card": "Ohime the Manifested Mikanko"}, {"do": "activate", "card": "Mikanko Fire Dance"}, {"do": "activate", "card": "Mikanko Water Arabesque"}, {"do": "summon", "card": "Ha-Re the Sword Mikanko"}, {"do": "summon", "card": "Hu-Li the Jewel Mikanko"}, {"do": "activate", "card": "Mikanko Dance - Mayowashidori"}, {"do": "special", "card": "Uzuhime the Manifested Mikanko"}],
   "why": "r34 (30 going-first hands, seeds 101-130): half ended with no monster at all; Ohime kept fetching a second Noble Twins, and once discarded the only Normal-Summonable Mikanko."}
 ],
 "picks": [
  {"source": "Ohime the Manifested Mikanko", "ifFirst": true, "hint": [506], "ifNotHand": ["Ha-Re the Sword Mikanko", "Hu-Li the Jewel Mikanko"], "ifNotField": ["Ha-Re the Sword Mikanko", "Hu-Li the Jewel Mikanko", "Sanaki the Mikanko Devotee", "Uzuhime the Manifested Mikanko"], "prefer": ["Ha-Re the Sword Mikanko", "Hu-Li the Jewel Mikanko"], "why": "r34: no Mikanko to Normal Summon: fetch one (Ha-Re first; its equip search finds Fire Dance)"},
  {"source": "Ohime the Manifested Mikanko", "ifFirst": true, "hint": [506], "ifNotHand": ["Mikanko Water Arabesque"], "prefer": ["Mikanko Water Arabesque", "Mikanko Fire Dance", "Mikanko Shinbu - Noble Twins"]},
  {"source": "Ohime the Manifested Mikanko", "ifFirst": true, "hint": [506], "prefer": ["Mikanko Fire Dance", "Mikanko Shinbu - Noble Twins", "Mikanko Dance - Mayowashidori"]},
  {"source": "Ohime the Manifested Mikanko", "ifFirst": true, "hint": [501], "prefer": ["Mikanko Dance - Mayowashidori", "Ohime the Manifested Mikanko", "Lightning Storm", "Lava Golem", "Harpie's Feather Duster", "Raigeki", "Cosmic Cyclone", "Double-Edged Sword", "Triple Tactics Thrust"], "why": "r34: discard Mayowashidori (it works from the GY) or a going-second card; never the only Mikanko body (seen: Hu-Li, seed 117)"},
  {"source": "Ha-Re the Sword Mikanko", "ifFirst": true, "hint": [506], "ifNotHand": ["Mikanko Water Arabesque"], "prefer": ["Mikanko Water Arabesque", "Mikanko Fire Dance", "Mikanko Dance - Mayowashidori"], "why": "r34 (seed 130): Arabesque first; Fire Dance may already be used this turn"},
  {"source": "Ha-Re the Sword Mikanko", "ifFirst": true, "hint": [506], "prefer": ["Mikanko Fire Dance", "Mikanko Dance - Mayowashidori", "Mikanko Water Arabesque"]},
  {"source": "Mikanko Water Arabesque", "hint": [518], "prefer": ["Ha-Re the Sword Mikanko", "Hu-Li the Jewel Mikanko", "Sanaki the Mikanko Devotee", "Ohime the Manifested Mikanko"], "why": "r34 (seed 101): equip it to our own Mikanko, never to their monster"},
  {"source": "Mikanko Water Arabesque", "ifFirst": true, "hint": [509], "prefer": ["Sanaki the Mikanko Devotee", "Hu-Li the Jewel Mikanko", "Ha-Re the Sword Mikanko"], "why": "r34 (seed 116): Sanaki first: equipped, it Special Summons another Level 3 from the Deck, two Uzuhime materials at once"},
  {"source": "Sanaki the Mikanko Devotee", "ifFirst": true, "hint": [509], "prefer": ["Hu-Li the Jewel Mikanko", "Ha-Re the Sword Mikanko"]},
  {"source": "Mikanko Fire Dance", "ifFirst": true, "hint": [509], "prefer": ["Ha-Re the Sword Mikanko", "Hu-Li the Jewel Mikanko", "Sanaki the Mikanko Devotee"]},
  {"source": "Mikanko Dance - Mayowashidori", "ifFirst": true, "hint": [509], "prefer": ["Ha-Re the Sword Mikanko", "Hu-Li the Jewel Mikanko", "Sanaki the Mikanko Devotee"]},
  {"source": "Uzuhime the Manifested Mikanko", "ifFirst": true, "hint": [506], "prefer": ["Mikanko Fire Dance", "Mikanko Dance - Mayowashidori", "Mikanko Water Arabesque", "Double-Edged Sword", "Mikanko Reflection Rondo"]},
  {"source": "Preparation of Rites", "prefer": ["Ohime the Manifested Mikanko"]},
  {"source": "Mikanko Shinbu - Noble Twins", "hint": [504], "prefer": ["Mikanko Dance - Mayowashidori", "Sanaki the Mikanko Devotee"]},
  {"source": "*", "hint": [500], "preferBest": "opp", "prefer": [], "why": "r32: a Kaiju (and Lava Golem) tributes the opponent's best monster: their Extra Deck boss first (seen: Thunder King tributed Dogmatika Fleurdelis and left Mirrorjade)"}
 ],
 "blocks": [
  {"do": "activate", "card": "Mikanko Water Arabesque", "if": {"fieldAny": ["Uzuhime the Manifested Mikanko"]}, "unless": {"fieldAny": ["Ha-Re the Sword Mikanko", "Hu-Li the Jewel Mikanko", "Sanaki the Mikanko Devotee"]}, "why": "r34 (seed 115): with only Uzuhime to wear it, Arabesque would send Uzuhime back to the Extra Deck"},
  {"do": "special", "card": "Salamangreat Almiraj", "unless": {"oppMonstersMin": 1}, "why": "r34 (seeds 112, 119): Almiraj eats a Level 3 Mikanko that Uzuhime needs"}
 ]
};

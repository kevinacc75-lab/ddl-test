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
 "trustNote": "r35.2b: kept OFF (r30 test, and turning it on is unmeasured with search). The book line is search's first option; the Mikanko holds bind search too.",
 "source": "Claude r31 from the printed card texts; not yet reviewed by Akiza or Alexis.",
 "starters": ["Mikanko Shinbu - Noble Twins", "Ohime the Manifested Mikanko", "Preparation of Rites", "Mikanko Water Arabesque"],
 "lines": [
  {"id": "MK-UZU", "name": "Ohime adds Ha-Re -> Arabesque on Ha-Re (Fire Dance) -> Hu-Li from the Deck (Spiritwalk) -> Fire Dance brings Ha-Re back -> Uzuhime", "postBan": "r34 deck brain (Claude 23 Oct; Akiza review pending)",
   "when": {"first": true, "handAny": ["Ha-Re the Sword Mikanko", "Hu-Li the Jewel Mikanko", "Ohime the Manifested Mikanko"]},
   "steps": [{"do": "activate", "card": "Ohime the Manifested Mikanko"}, {"do": "activate", "card": "Mikanko Fire Dance"}, {"do": "activate", "card": "Mikanko Water Arabesque"}, {"do": "summon", "card": "Ha-Re the Sword Mikanko"}, {"do": "summon", "card": "Hu-Li the Jewel Mikanko"}, {"do": "activate", "card": "Mikanko Dance - Mayowashidori"}, {"do": "special", "card": "Uzuhime the Manifested Mikanko"}],
   "why": "r34 (30 going-first hands, seeds 101-130): half ended with no monster at all; Ohime kept fetching a second Noble Twins, and once discarded the only Normal-Summonable Mikanko."}
,
  {"id": "MK-E1", "name": "Going second (Akiza E1): Ohime adds Sanaki and discards her -> Fire Dance revives Sanaki -> Sanaki summons Ha-Re -> Uzuhime adds Double-Edged Sword -> Uzuhime attacks their biggest monster three times", "postBan": "r35.2b (Claude 24 Oct, from Akiza's mikanko-ideal-turn-akiza-2026-10-24; her review of this encoding pending)",
   "when": {"second": true, "handAny": ["Ohime the Manifested Mikanko", "Preparation of Rites", "Mikanko Shinbu - Noble Twins", "Sanaki the Mikanko Devotee"]},
   "steps": [{"do": "activate", "card": "Harpie's Feather Duster"}, {"do": "activate", "card": "Lightning Storm"}, {"do": "special", "card": "Thunder King, the Lightningstrike Kaiju"}, {"do": "special", "card": "Jizukiru, the Star Destroying Kaiju"}, {"do": "special", "card": "Lava Golem"}, {"do": "activate", "card": "Preparation of Rites"}, {"do": "activate", "card": "Ohime the Manifested Mikanko", "location": [2]}, {"do": "activate", "card": "Mikanko Fire Dance"}, {"do": "activate", "card": "Mikanko Shinbu - Noble Twins"}, {"do": "special", "card": "Uzuhime the Manifested Mikanko"}, {"do": "activate", "card": "Double-Edged Sword"}],
   "why": "Akiza 24 Oct: removal is a cost, not a goal; keep or make one big target and hit it three times with Uzuhime (3 x 3000 = 9000). Akiza order rule: Spell/Trap removal first (Lightning Storm needs us to control no face-up cards), then make or keep the target (Kaiju / Lava Golem, which also removes a live negate before our Extra Deck summon; seed 201 Uzuhime was negated), then E1."}
 ],
 "picks": [
  {"source": "Ohime the Manifested Mikanko", "ifFirst": false, "hint": [506], "ifHand": ["Mikanko Fire Dance"], "prefer": ["Sanaki the Mikanko Devotee", "Ha-Re the Sword Mikanko", "Hu-Li the Jewel Mikanko"], "why": "r35.2b Akiza E1: with Fire Dance in hand, Ohime adds Sanaki and discards her"},
  {"source": "Ohime the Manifested Mikanko", "ifFirst": false, "hint": [506], "prefer": ["Mikanko Shinbu - Noble Twins", "Sanaki the Mikanko Devotee"], "why": "r35.2b Akiza E1: no Fire Dance: Noble Twins sends Sanaki and Sets Fire Dance"},
  {"source": "Ohime the Manifested Mikanko", "ifFirst": false, "hint": [501], "ifHand": ["Mikanko Fire Dance"], "prefer": ["Sanaki the Mikanko Devotee", "Mikanko Dance - Mayowashidori", "Triple Tactics Thrust"], "why": "r35.2b Akiza E1: discard Sanaki for Fire Dance to revive"},
  {"source": "Ohime the Manifested Mikanko", "ifFirst": false, "hint": [501], "prefer": ["Mikanko Dance - Mayowashidori", "Triple Tactics Thrust", "Ohime the Manifested Mikanko"], "why": "r35.2b Akiza 3.3: discard the deadest card"},
  {"source": "Mikanko Fire Dance", "ifFirst": false, "hint": [509], "prefer": ["Sanaki the Mikanko Devotee", "Ha-Re the Sword Mikanko", "Hu-Li the Jewel Mikanko"], "why": "r35.2b Akiza E1: Sanaki first (her equip trigger summons Ha-Re)"},
  {"source": "Sanaki the Mikanko Devotee", "ifFirst": false, "hint": [509], "prefer": ["Ha-Re the Sword Mikanko", "Hu-Li the Jewel Mikanko"]},
  {"source": "Uzuhime the Manifested Mikanko", "ifFirst": false, "hint": [506], "prefer": ["Double-Edged Sword", "Mikanko Water Arabesque", "Mikanko Dance - Mayowashidori"], "why": "r35.2b Akiza E1: Double-Edged Sword on their target"},
  {"source": "Mikanko Shinbu - Noble Twins", "ifFirst": false, "hint": [504], "prefer": ["Sanaki the Mikanko Devotee", "Mikanko Dance - Mayowashidori"], "why": "r35.2b Akiza E1: send Sanaki"},
  {"source": "Mikanko Shinbu - Noble Twins", "ifFirst": false, "notHint": [504], "prefer": ["Mikanko Fire Dance", "Mikanko Water Arabesque"], "why": "r35.2b Akiza E1: Set Fire Dance (an Equip Spell Set this way can be activated this turn)"},
  {"source": "Ohime the Manifested Mikanko", "ifFirst": true, "hint": [506], "ifNotHand": ["Ha-Re the Sword Mikanko", "Hu-Li the Jewel Mikanko"], "ifNotField": ["Ha-Re the Sword Mikanko", "Hu-Li the Jewel Mikanko", "Sanaki the Mikanko Devotee", "Uzuhime the Manifested Mikanko"], "prefer": ["Ha-Re the Sword Mikanko", "Hu-Li the Jewel Mikanko"], "why": "r34: no Mikanko to Normal Summon: fetch one (Ha-Re first; its equip search finds Fire Dance)"},
  {"source": "Ohime the Manifested Mikanko", "ifFirst": true, "hint": [506], "ifNotHand": ["Mikanko Water Arabesque"], "prefer": ["Mikanko Water Arabesque", "Mikanko Fire Dance", "Mikanko Shinbu - Noble Twins"]},
  {"source": "Ohime the Manifested Mikanko", "ifFirst": true, "hint": [506], "prefer": ["Mikanko Fire Dance", "Mikanko Shinbu - Noble Twins", "Mikanko Dance - Mayowashidori"]},
  {"source": "Ohime the Manifested Mikanko", "ifFirst": true, "hint": [501], "prefer": ["Mikanko Dance - Mayowashidori", "Ohime the Manifested Mikanko", "Lightning Storm", "Lava Golem", "Harpie's Feather Duster", "Raigeki", "Cosmic Cyclone", "Double-Edged Sword", "Triple Tactics Thrust"], "why": "r34: discard Mayowashidori (it works from the GY) or a going-second card; never the only Mikanko body (seen: Hu-Li, seed 117)"},
  {"source": "Ha-Re the Sword Mikanko", "ifFirst": true, "hint": [506], "ifNotHand": ["Mikanko Water Arabesque"], "prefer": ["Mikanko Water Arabesque", "Mikanko Fire Dance", "Mikanko Dance - Mayowashidori"], "why": "r34 (seed 130): Arabesque first; Fire Dance may already be used this turn"},
  {"source": "Ha-Re the Sword Mikanko", "ifFirst": true, "hint": [506], "prefer": ["Mikanko Fire Dance", "Mikanko Dance - Mayowashidori", "Mikanko Water Arabesque"]},
  {"source": "Mikanko Water Arabesque", "hint": [518], "prefer": ["Ha-Re the Sword Mikanko", "Hu-Li the Jewel Mikanko", "Sanaki the Mikanko Devotee", "Ohime the Manifested Mikanko"], "why": "r34 (seed 101): equip it to our own Mikanko, never to their monster. (r35 RELAY-040 M40-02 tried 'going first only': a strategy preference that measured no different, so it was dropped per Seto 24 Oct 18:45.)"},
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
  {"do": "activate", "card": "Mikanko Water Arabesque", "if": {"fieldAny": ["Uzuhime the Manifested Mikanko"]}, "unless": {"fieldAny": ["Ha-Re the Sword Mikanko", "Hu-Li the Jewel Mikanko", "Sanaki the Mikanko Devotee"]}, "why": "r34 (seed 115): with only Uzuhime to wear it, Arabesque would send Uzuhime back to the Extra Deck. r35.2b: RELAY-040 M40-01 (lift the hold when they have a monster) is reverted: with the own-Mikanko equip pick it equipped Uzuhime and bounced it (seed 207 trace), and equipping their monster bounces our damage target (Akiza 24 Oct)"},
  {"do": "special", "card": "Salamangreat Almiraj", "unless": {"oppMonstersMin": 1}, "why": "r34 (seeds 112, 119): Almiraj eats a Level 3 Mikanko that Uzuhime needs"}
 ]
};

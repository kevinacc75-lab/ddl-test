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
 "lines": [],
 "picks": [
  {"source": "Preparation of Rites", "prefer": ["Ohime the Manifested Mikanko"]},
  {"source": "Mikanko Shinbu - Noble Twins", "hint": [504], "prefer": ["Mikanko Dance - Mayowashidori", "Sanaki the Mikanko Devotee"]},
  {"source": "*", "hint": [500], "preferBest": "opp", "prefer": [], "why": "r32: a Kaiju (and Lava Golem) tributes the opponent's best monster: their Extra Deck boss first (seen: Thunder King tributed Dogmatika Fleurdelis and left Mirrorjade)"}
 ],
 "blocks": []
};

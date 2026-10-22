// r31 data file: HERO playbook (Claude, 22 Oct 2026, for Kevy; Akiza review pending). Built from the cards' printed
// texts and the deck's r31 audit (20 seeded hands going first, base AI): Fusion Destiny was discarded to Masked HERO
// Furnace or never used; Polymerization made Vision HERO Trinity only to feed a Link; Destroyer Phoenix Enforcer's
// Quick Effect destroyed our own Malicious and itself with nothing of the opponent's on the field.
// Core line: Fusion Destiny (Malicious from the Deck + a Level 6+ HERO) -> Destiny HERO - Destroyer Phoenix Enforcer;
// Malicious in the GY banishes itself to Special Summon another Malicious (DARK HERO, legal under Fusion Destiny's
// lock); Mask Change stays set for the opponent's turn (Malicious -> Masked HERO Dark Law). Faris discards Malicious
// (feeding that recursion) and places Vision HERO Increase as a Continuous Trap.
export default {
 "deck": "hero",
 "source": "Claude r31 from the printed card texts and the r31 audit; not yet reviewed by Akiza or Alexis.",
 "starters": ["Fusion Destiny", "Vision HERO Faris", "Masked HERO Furnace", "Elemental HERO Stratos", "E - Emergency Call", "Miracle Ejector"],
 "lines": [
  {"id": "HE-FD", "name": "Fusion Destiny -> Destroyer Phoenix Enforcer; Malicious recursion", "when": {"hand": ["Fusion Destiny"]},
   "steps": [{"do": "activate", "card": "Fusion Destiny"}, {"do": "activate", "card": "Destiny HERO - Malicious"}]},
  {"id": "HE-FURN", "name": "Masked HERO Furnace: add Mask Change, discard Malicious", "when": {"hand": ["Masked HERO Furnace"]},
   "steps": [{"do": "activate", "card": "Masked HERO Furnace"}]},
  {"id": "HE-FARIS", "name": "Vision HERO Faris: discard Malicious, place Vision HERO Increase", "when": {"hand": ["Vision HERO Faris"], "handAny": ["Destiny HERO - Malicious", "Elemental HERO Neos", "Masked HERO Furnace", "Neo-Spacian Aqua Dolphin", "Elemental HERO Stratos"]},
   "steps": [{"do": "activate", "card": "Vision HERO Faris"}]},
  {"id": "HE-STRAT", "name": "Elemental HERO Stratos: add a HERO", "when": {"hand": ["Elemental HERO Stratos"]},
   "steps": [{"do": "summon", "card": "Elemental HERO Stratos"}]},
  {"id": "HE-CALL", "name": "E - Emergency Call for Stratos", "when": {"hand": ["E - Emergency Call"]},
   "steps": [{"do": "activate", "card": "E - Emergency Call"}]}
 ],
 "picks": [
  {"source": "*", "hint": [533], "prefer": ["Vision HERO Vyon", "Vision HERO Increase", "Vision HERO Faris", "Elemental HERO Stratos", "Elemental HERO Shadow Mist", "Miracle Ejector", "Neo-Spacian Aqua Dolphin", "Destiny HERO - Malicious", "Masked HERO Fountain", "Masked HERO Dusk Crow"]},
  {"source": "Fusion Destiny", "hint": [509], "prefer": ["Destiny HERO - Destroyer Phoenix Enforcer"]},
  {"source": "Fusion Destiny", "hint": [511], "prefer": ["Destiny HERO - Malicious", "Destiny HERO - Denier"]},
  {"source": "Masked HERO Furnace", "hint": [506], "prefer": ["Mask Change", "Polymerization"]},
  {"source": "Masked HERO Furnace", "hint": [501], "prefer": ["Destiny HERO - Malicious", "Neo-Spacian Aqua Dolphin", "Elemental HERO Neos", "Masked HERO Fountain", "A Hero Lives", "Polymerization"]},
  {"source": "Vision HERO Faris", "prefer": ["Destiny HERO - Malicious", "Elemental HERO Neos", "Neo-Spacian Aqua Dolphin", "Vision HERO Increase", "Vision HERO Vyon"]},
  {"source": "Elemental HERO Stratos", "hint": [506], "prefer": ["Destiny HERO - Malicious", "Vision HERO Faris", "Elemental HERO Shadow Mist"]},
  {"source": "E - Emergency Call", "prefer": ["Elemental HERO Stratos", "Elemental HERO Shadow Mist", "Miracle Ejector"]},
  {"source": "Destiny HERO - Destroyer Phoenix Enforcer", "hint": [502], "prefer": ["Destiny HERO - Malicious", "Destiny HERO - Denier", "Vision HERO Increase"]}
 ],
 "options": [{"source": "Elemental HERO Stratos", "match": "add|hand"}],
 "blocks": [
  {"do": "special", "card": "Xtra HERO Infernal Devicer", "if": {"fieldAny": ["Destiny HERO - Destroyer Phoenix Enforcer", "Masked HERO Dark Law"]}, "why": "keep the boss: this Link would have to use Destroyer Phoenix Enforcer / Dark Law as material (seen)"},
  {"do": "special", "card": "Xtra HERO Wonder Driver", "if": {"fieldAny": ["Destiny HERO - Destroyer Phoenix Enforcer", "Masked HERO Dark Law"]}, "why": "keep the boss: this Link would have to use Destroyer Phoenix Enforcer / Dark Law as material (seen)"},
  {"do": "special", "card": "Xtra HERO Cross Crusader", "if": {"fieldAny": ["Destiny HERO - Destroyer Phoenix Enforcer", "Masked HERO Dark Law"]}, "why": "keep the boss: this Link would have to use Destroyer Phoenix Enforcer / Dark Law as material (seen)"},
  {"do": "activate", "card": "Mask Change", "unless": {"notOwnTurn": true}, "why": "set it and use it on the opponent's turn (Malicious -> Masked HERO Dark Law); on our turn it sent our own Destroyer Phoenix Enforcer away"},
  {"do": "activate", "card": "Destiny HERO - Destroyer Phoenix Enforcer", "unless": {"oppCardsMin": 1}, "why": "its Quick Effect destroys one of ours and one card on the field: with nothing of the opponent's out it only destroys our own cards (seen: Malicious and Enforcer itself)"},
  {"do": "activate", "card": "Polymerization", "if": {"handAny": ["Fusion Destiny"]}, "why": "Fusion Destiny makes Destroyer Phoenix Enforcer from the Deck; Polymerization from hand spends the cards Fusion Destiny needs"}
 ]
};

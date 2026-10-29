// r31 data file: HERO playbook (Claude, 22 Oct 2026, for Kevy; Akiza review pending). Built from the cards' printed
// texts and the deck's r31 audit (20 seeded hands going first, base AI): Fusion Destiny was discarded to Masked HERO
// Furnace or never used; Polymerization made Vision HERO Trinity only to feed a Link; Destroyer Phoenix Enforcer's
// Quick Effect destroyed our own Malicious and itself with nothing of the opponent's on the field.
// Core line: Fusion Destiny (Malicious from the Deck + a Level 6+ HERO) -> Destiny HERO - Destroyer Phoenix Enforcer;
// Malicious in the GY banishes itself to Special Summon another Malicious (DARK HERO, legal under Fusion Destiny's
// lock); Mask Change stays set for the opponent's turn (Malicious -> Masked HERO Dark Law). Faris discards Malicious
// (feeding that recursion) and places Vision HERO Increase as a Continuous Trap.
// r34: HERO Links never eat a Fusion boss (Sunrise, Trinity, Shining Neos Wingman, ... as well as DPE / Dark Law).
// r34: Masked HERO Furnace discards Favorite Contact before A Hero Lives (seed 110: A Hero Lives was discarded and the board stayed empty).
// r32 (Kevy item 5, deepen the book): Vyon sends Malicious (was Neos), Malicious recursion as its own line, A Hero Lives
// for Shadow Mist (adds Mask Change) or Stratos, Miracle Ejector -> EN Shuffle into Shadow Mist / Stratos (was Neos).
export default {
 "deck": "hero",
 "source": "Claude r31 from the printed card texts and the r31 audit; not yet reviewed by Akiza or Alexis.",
 "starters": ["Fusion Destiny", "Vision HERO Faris", "Masked HERO Furnace", "Elemental HERO Stratos", "E - Emergency Call", "Miracle Ejector", "Vision HERO Vyon", "A Hero Lives"],
 "lines": [
  {"id": "HE-FD", "name": "Fusion Destiny -> Destroyer Phoenix Enforcer; Malicious recursion", "when": {"hand": ["Fusion Destiny"]},
   "steps": [{"do": "activate", "card": "Fusion Destiny"}, {"do": "activate", "card": "Destiny HERO - Malicious"}]},
  {"id": "HE-FURN", "name": "Masked HERO Furnace: add Mask Change, discard Malicious", "when": {"hand": ["Masked HERO Furnace"]},
   "steps": [{"do": "activate", "card": "Masked HERO Furnace"}]},
  {"id": "HE-FARIS", "name": "Vision HERO Faris: discard Malicious, place Vision HERO Increase", "when": {"hand": ["Vision HERO Faris"], "handAny": ["Destiny HERO - Malicious", "Elemental HERO Neos", "Masked HERO Furnace", "Neo-Spacian Aqua Dolphin", "Elemental HERO Stratos"]},
   "steps": [{"do": "activate", "card": "Vision HERO Faris"}]},
  {"id": "HE-AHL", "name": "A Hero Lives (no monsters yet): Shadow Mist for Mask Change, else Stratos", "when": {"hand": ["A Hero Lives"]},
   "steps": [{"do": "activate", "card": "A Hero Lives"}]},
  {"id": "HE-CALL", "name": "E - Emergency Call for Stratos", "when": {"hand": ["E - Emergency Call"]},
   "steps": [{"do": "activate", "card": "E - Emergency Call"}]},
  {"id": "HE-STRAT", "name": "Elemental HERO Stratos: add a HERO", "when": {"hand": ["Elemental HERO Stratos"]},
   "steps": [{"do": "summon", "card": "Elemental HERO Stratos"}]},
  {"id": "HE-VYON", "name": "Vision HERO Vyon sends Malicious, then Malicious brings a second Malicious", "when": {"hand": ["Vision HERO Vyon"], "notHand": ["Elemental HERO Stratos"]},
   "steps": [{"do": "summon", "card": "Vision HERO Vyon"}, {"do": "activate", "card": "Destiny HERO - Malicious"}]},
  {"id": "HE-MAL", "name": "Destiny HERO - Malicious in the GY: Special Summon another Malicious", "when": {"gyAny": ["Destiny HERO - Malicious"]},
   "steps": [{"do": "activate", "card": "Destiny HERO - Malicious"}]},
  {"id": "HE-EJ", "name": "Miracle Ejector adds EN Shuffle; EN Shuffle turns it into Shadow Mist or Stratos", "when": {"hand": ["Miracle Ejector"]},
   "steps": [{"do": "summon", "card": "Miracle Ejector"}, {"do": "activate", "card": "EN Shuffle"}]}
 ],
 "picks": [
  {"source": "*", "hint": [533], "prefer": ["Vision HERO Vyon", "Vision HERO Increase", "Vision HERO Faris", "Elemental HERO Stratos", "Elemental HERO Shadow Mist", "Miracle Ejector", "Neo-Spacian Aqua Dolphin", "Destiny HERO - Malicious", "Masked HERO Fountain", "Masked HERO Dusk Crow"]},
  {"source": "Fusion Destiny", "hint": [509], "prefer": ["Destiny HERO - Destroyer Phoenix Enforcer"]},
  {"source": "Fusion Destiny", "hint": [511], "prefer": ["Destiny HERO - Malicious", "Destiny HERO - Denier"]},
  {"source": "Masked HERO Furnace", "hint": [506], "prefer": ["Mask Change", "Polymerization"]},
  {"source": "Masked HERO Furnace", "hint": [501], "prefer": ["Destiny HERO - Malicious", "Neo-Spacian Aqua Dolphin", "Elemental HERO Neos", "Masked HERO Fountain", "Favorite Contact", "A Hero Lives", "Polymerization"]},
  {"source": "Vision HERO Faris", "prefer": ["Destiny HERO - Malicious", "Elemental HERO Neos", "Neo-Spacian Aqua Dolphin", "Vision HERO Increase", "Vision HERO Vyon"]},
  {"source": "Elemental HERO Stratos", "hint": [506], "prefer": ["Destiny HERO - Malicious", "Vision HERO Faris", "Elemental HERO Shadow Mist"]},
  {"source": "E - Emergency Call", "prefer": ["Elemental HERO Stratos", "Elemental HERO Shadow Mist", "Miracle Ejector"]},
  {"source": "Destiny HERO - Destroyer Phoenix Enforcer", "hint": [502], "prefer": ["Destiny HERO - Malicious", "Destiny HERO - Denier", "Vision HERO Increase"]},
  {"source": "Vision HERO Vyon", "hint": [504], "prefer": ["Destiny HERO - Malicious", "Elemental HERO Shadow Mist", "Destiny HERO - Denier"]},
  {"source": "A Hero Lives", "ifNotHand": ["Mask Change"], "prefer": ["Elemental HERO Shadow Mist", "Elemental HERO Stratos"]},
  {"source": "A Hero Lives", "prefer": ["Elemental HERO Stratos", "Elemental HERO Shadow Mist"]},
  {"source": "EN Shuffle", "hint": [509], "prefer": ["Elemental HERO Shadow Mist", "Elemental HERO Stratos", "Miracle Ejector"]},
  {"source": "Miracle Ejector", "hint": [506], "prefer": ["EN Shuffle", "Favorite Contact"]},
  {"source": "Masked HERO Fountain", "hint": [509], "prefer": ["Elemental HERO Stratos", "Vision HERO Vyon", "Elemental HERO Shadow Mist", "Vision HERO Faris"]},
  {"source": "Masked HERO Dusk Crow", "prefer": ["Masked HERO Furnace", "Masked HERO Fountain"]},
  {"source": "Elemental HERO Shadow Mist", "hint": [506], "prefer": ["Mask Change", "Destiny HERO - Malicious", "Elemental HERO Stratos", "Vision HERO Faris"]}
 ],
 "options": [{"source": "Elemental HERO Stratos", "match": "add|hand"}],
 "blocks": [
  {"do": "special", "card": "Xtra HERO Infernal Devicer", "if": {"fieldAny": ["Destiny HERO - Destroyer Phoenix Enforcer", "Masked HERO Dark Law", "Elemental HERO Sunrise", "Vision HERO Trinity", "Elemental HERO Shining Neos Wingman", "Elemental HERO Flame Wingman - Infernal Rage", "Elemental HERO Thunder Giant - Voltic Thunder", "Contrast HERO Chaos"]}, "why": "keep the boss: this Link would use a HERO Fusion boss as material (seen: DPE / Dark Law; r34 going second: Sunrise and Trinity linked away into Infernal Devicer)"},
  {"do": "special", "card": "Xtra HERO Wonder Driver", "if": {"fieldAny": ["Destiny HERO - Destroyer Phoenix Enforcer", "Masked HERO Dark Law", "Elemental HERO Sunrise", "Vision HERO Trinity", "Elemental HERO Shining Neos Wingman", "Elemental HERO Flame Wingman - Infernal Rage", "Elemental HERO Thunder Giant - Voltic Thunder", "Contrast HERO Chaos"]}, "why": "keep the boss: this Link would use a HERO Fusion boss as material (seen: DPE / Dark Law; r34 going second: Sunrise and Trinity linked away into Infernal Devicer)"},
  {"do": "special", "card": "Xtra HERO Cross Crusader", "if": {"fieldAny": ["Destiny HERO - Destroyer Phoenix Enforcer", "Masked HERO Dark Law", "Elemental HERO Sunrise", "Vision HERO Trinity", "Elemental HERO Shining Neos Wingman", "Elemental HERO Flame Wingman - Infernal Rage", "Elemental HERO Thunder Giant - Voltic Thunder", "Contrast HERO Chaos"]}, "why": "keep the boss: this Link would use a HERO Fusion boss as material (seen: DPE / Dark Law; r34 going second: Sunrise and Trinity linked away into Infernal Devicer)"},
  {"do": "activate", "card": "Mask Change", "unless": {"notOwnTurn": true}, "why": "set it and use it on the opponent's turn (Malicious -> Masked HERO Dark Law); on our turn it sent our own Destroyer Phoenix Enforcer away"},
  {"do": "activate", "card": "Destiny HERO - Destroyer Phoenix Enforcer", "location": [4], "unless": {"oppCardsMin": 1}, "why": "its Quick Effect destroys one of ours and one card on the field: with nothing of the opponent's out it only destroys our own cards (seen: Malicious and Enforcer itself). r32 (ChatGPT F1): only its Quick Effect on the field; its revival trigger from the GY is never held"},
  {"do": "activate", "card": "Polymerization", "if": {"handAny": ["Fusion Destiny"]}, "why": "Fusion Destiny makes Destroyer Phoenix Enforcer from the Deck; Polymerization from hand spends the cards Fusion Destiny needs"}
 ]
};

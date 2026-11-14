// r28 data file: Lunalight playbook (Claude, 22 Oct 2026, for Kevy). Researched from the 2026 Legendary ARC-V Decks
// Lunalight guide (yugioh-card.com), Master Duel Meta's Lunalight breakdown and Dueling Nexus's list, then adapted to
// Kevy's list (no Cross-Sheep / Nyarla / S:P in its Extra Deck). Akiza review pending.
// Core line: Normal Summon Gold Leo -> add Silver Hound and discard it -> Hound Special Summons Kaleido Chick ->
// Black Sheep adds Polymerization -> Polymerization: Kaleido + Black Sheep -> Perfume Dancer (Sheep and Kaleido recover
// cards from the GY) -> Perfume Dancer adds Luna Light Perfume and brings Kaleido back -> Kaleido sends Leo Dancer and
// counts as Leo Dancer (and Leo Dancer is now in the GY) -> Polymerization: Kaleido(as Leo) + 3 Lunalight -> Liger Dancer;
// Lunalight Wolf (scaled) fuses another Liger by banishing Leo Dancer + 3 Lunalight from the GY / field.
export default {
 "deck": "luna",
 "source": "Claude r28 from public guides (yugioh-card.com Legendary ARC-V Decks Lunalight guide 2026; masterduelmeta.com Lunalight breakdown; duelingnexus.com Dec 2025 list), adapted to Kevy's list; not yet reviewed by Akiza or Alexis.",
 "starters": ["Lunalight Gold Leo", "Lunalight Black Sheep", "Lunalight Masquerade", "Fire Formation - Tenki", "Lunalight Kaleido Chick", "Tri-Brigade Fraktall", "Foolish Burial", "Polymerization", "Lunalight Fusion"],
 "lines": [
  {"id": "LU-01", "name": "Gold Leo / Masquerade -> Hound -> Kaleido -> Sheep adds Polymerization -> Perfume Dancer -> Kaleido as Leo Dancer -> Liger Dancer", "when": {},
   "steps": [{"do": "activate", "card": "Fire Formation - Tenki"}, {"do": "summon", "card": "Lunalight Gold Leo"}, {"do": "activate", "card": "Lunalight Masquerade"},
    {"do": "activate", "card": "Foolish Burial"}, {"do": "activate", "card": "Tri-Brigade Fraktall"}, {"do": "activate", "card": "Lunalight Black Sheep"},
    {"do": "activate", "card": "Lunalight Kaleido Chick"}, {"do": "activate", "card": "Polymerization"}, {"do": "activate", "card": "Lunalight Fusion"},
    {"do": "activate", "card": "Lunalight Perfume Dancer"}, {"do": "activate", "card": "Luna Light Perfume"}, {"do": "activate", "card": "Lunalight Wolf"},
    {"do": "activate", "card": "Lunalight Yellow Marten"}, {"do": "activate", "card": "Lunalight Serenade Dance"}, {"do": "summon", "card": "Lunalight Kaleido Chick"}]}
 ],
 "picks": [
  {"source": "Lunalight Gold Leo", "hint": [506], "ifNotHand": ["Lunalight Silver Hound"], "ifNotField": ["Lunalight Kaleido Chick"], "prefer": ["Lunalight Silver Hound", "Lunalight Kaleido Chick", "Lunalight Black Sheep"]},
  {"source": "Lunalight Gold Leo", "hint": [506], "ifNotHand": ["Lunalight Black Sheep", "Polymerization", "Lunalight Fusion"], "prefer": ["Lunalight Black Sheep", "Lunalight Kaleido Chick", "Lunalight Scarlet Tiger"]},
  {"source": "Lunalight Gold Leo", "hint": [506], "prefer": ["Lunalight Scarlet Tiger", "Lunalight Kaleido Chick", "Lunalight Emerald Bird", "Lunalight Silver Hound"]},
  {"source": "Lunalight Gold Leo", "hint": [501], "prefer": ["Lunalight Silver Hound", "Lunalight Scarlet Tiger", "Lunalight Yellow Marten", "Lunalight Emerald Bird"]},
  {"source": "Lunalight Silver Hound", "hint": [509], "ifNotField": ["Lunalight Kaleido Chick"], "prefer": ["Lunalight Kaleido Chick", "Lunalight Gold Leo", "Lunalight Emerald Bird"]},
  {"source": "Lunalight Silver Hound", "hint": [509], "prefer": ["Lunalight Gold Leo", "Lunalight Emerald Bird", "Lunalight Kaleido Chick", "Lunalight Black Sheep"]},
  {"source": "Lunalight Masquerade", "hint": [504], "prefer": ["Lunalight Silver Hound", "Lunalight Yellow Marten", "Lunalight Emerald Bird", "Lunalight Scarlet Tiger"]},
  {"source": "Foolish Burial", "hint": [504], "prefer": ["Lunalight Silver Hound", "Lunalight Yellow Marten", "Lunalight Scarlet Tiger", "Lunalight Emerald Bird"]},
  {"source": "Tri-Brigade Fraktall", "hint": [504], "prefer": ["Lunalight Silver Hound", "Lunalight Black Sheep"]},
  {"source": "Fire Formation - Tenki", "hint": [506], "ifNotHand": ["Polymerization", "Lunalight Fusion", "Lunalight Black Sheep"], "prefer": ["Lunalight Black Sheep", "Lunalight Gold Leo", "Lunalight Kaleido Chick"]},
  {"source": "Fire Formation - Tenki", "hint": [506], "ifNotHand": ["Lunalight Gold Leo"], "prefer": ["Lunalight Gold Leo", "Lunalight Kaleido Chick", "Lunalight Black Sheep"]},
  {"source": "Fire Formation - Tenki", "hint": [506], "prefer": ["Lunalight Kaleido Chick", "Lunalight Black Sheep", "Lunalight Emerald Bird"]},
  {"source": "Lunalight Kaleido Chick", "hint": [504], "prefer": ["Lunalight Leo Dancer", "Lunalight Yellow Marten", "Lunalight Silver Hound", "Lunalight Scarlet Tiger", "Lunalight Emerald Bird"]},
  {"source": "Lunalight Kaleido Chick", "hint": [506], "prefer": ["Polymerization"]},
  {"source": "Lunalight Yellow Marten", "hint": [505], "prefer": ["Lunalight Kaleido Chick", "Lunalight Silver Hound", "Lunalight Black Sheep", "Lunalight Gold Leo", "Lunalight Scarlet Tiger", "Lunalight Emerald Bird", "Lunalight Tiger", "Lunalight Masquerade"]},
  {"source": "Lunalight Perfume Dancer", "hint": [505], "prefer": ["Lunalight Kaleido Chick", "Lunalight Silver Hound", "Lunalight Black Sheep", "Lunalight Gold Leo", "Lunalight Scarlet Tiger", "Lunalight Emerald Bird", "Lunalight Tiger", "Lunalight Yellow Marten"]},
  {"source": "Polymerization", "hint": [509], "prefer": ["Lunalight Liger Dancer", "Lunalight Leo Dancer", "Lunalight Perfume Dancer", "Lunalight Panther Dancer", "Lunalight Sabre Dancer", "Lunalight Cat Dancer"]},
  {"source": "Lunalight Fusion", "hint": [509], "prefer": ["Lunalight Liger Dancer", "Lunalight Leo Dancer", "Lunalight Perfume Dancer", "Lunalight Panther Dancer", "Lunalight Sabre Dancer", "Lunalight Cat Dancer"]},
  {"source": "Lunalight Wolf", "hint": [509], "prefer": ["Lunalight Liger Dancer", "Lunalight Leo Dancer", "Lunalight Panther Dancer", "Lunalight Perfume Dancer", "Lunalight Sabre Dancer"]},
  {"source": "Super Duper Polymerization", "hint": [509], "prefer": ["Lunalight Liger Dancer", "Lunalight Leo Dancer", "Lunalight Panther Dancer", "Lunalight Sabre Dancer", "Guardian Chimera", "Lunalight Perfume Dancer"]},
  {"source": "Polymerization", "hint": [511], "prefer": ["Lunalight Kaleido Chick", "Lunalight Black Sheep", "Lunalight Perfume Dancer", "Lunalight Emerald Bird", "Lunalight Silver Hound", "Lunalight Yellow Marten", "Lunalight Scarlet Tiger", "Lunalight Gold Leo"], "location": [4, 2]},
  {"source": "Lunalight Black Sheep", "hint": [506], "ifNotHand": ["Polymerization", "Lunalight Fusion"], "prefer": ["Polymerization"]},
  {"source": "Lunalight Black Sheep", "hint": [506], "prefer": ["Lunalight Kaleido Chick", "Lunalight Gold Leo", "Lunalight Wolf", "Lunalight Silver Hound"]},
  {"source": "Lunalight Perfume Dancer", "hint": [509], "prefer": ["Lunalight Kaleido Chick", "Lunalight Gold Leo", "Lunalight Black Sheep", "Lunalight Scarlet Tiger"]},
  {"source": "Luna Light Perfume", "hint": [509], "ifNotField": ["Lunalight Kaleido Chick"], "prefer": ["Lunalight Kaleido Chick", "Lunalight Black Sheep", "Lunalight Gold Leo", "Lunalight Silver Hound", "Lunalight Emerald Bird"]},
  {"source": "Luna Light Perfume", "hint": [509], "prefer": ["Lunalight Black Sheep", "Lunalight Gold Leo", "Lunalight Silver Hound", "Lunalight Emerald Bird", "Lunalight Kaleido Chick"]},
  {"source": "Luna Light Perfume", "hint": [506], "prefer": ["Lunalight Wolf", "Lunalight Kaleido Chick", "Lunalight Gold Leo", "Lunalight Black Sheep"]},
  {"source": "Lunalight Yellow Marten", "hint": [506], "prefer": ["Lunalight Masquerade", "Luna Light Perfume", "Lunalight Serenade Dance"]},
  {"source": "Foolish Burial Goods", "hint": [504], "prefer": ["Lunalight Serenade Dance", "Luna Light Perfume", "Lunalight Masquerade"]},
  {"source": "Lunalight Serenade Dance", "hint": [509], "prefer": ["Lunalight Kaleido Chick", "Lunalight Gold Leo", "Lunalight Black Sheep"]}
 ],
 "options": [{"source": "Lunalight Black Sheep", "match": "Polymerization", "ifNotHand": ["Polymerization", "Lunalight Fusion"]}],
 "blocks": [
  {"do": "activate", "card": "Polymerization", "if": {"fieldAny": ["Lunalight Perfume Dancer"]}, "unless": {"countMin": {"prefix": "Lunalight", "min": 4}}, "why": "Perfume Dancer is already out: keep Polymerization for Leo / Liger Dancer (Kaleido + 3 Lunalight)"},
  {"do": "special", "card": "Knightmare Phoenix", "unless": {"oppCardsMin": 1}, "why": "Knightmare Phoenix would eat two Lunalight bodies with nothing of the opponent's to destroy"},
  {"do": "special", "card": "Gorgon of Zilofthonia", "unless": {"oppMonstersMin": 1}, "why": "Gorgon would eat Lunalight bodies with no opposing monster to point at"},
  {"do": "special", "card": "Gorgon of Zilofthonia", "unless": {"fieldAny": ["Lunalight Liger Dancer", "Lunalight Leo Dancer"]}, "why": "r32 going second: without Liger / Leo Dancer on our field, Gorgon eats our bodies and ends the turn alone with no ATK of its own (seen in 4 of 11 going-second hands)"},
  {"do": "special", "card": "Tri-Brigade Ferrijit the Barren Blossom", "unless": {"oppMonstersMin": 1}, "why": "going first, Ferrijit trades two Lunalight bodies (often a Fusion monster) for a weaker Link 2; keep the Fusion board"}
 ],
 "setHold": {}
}

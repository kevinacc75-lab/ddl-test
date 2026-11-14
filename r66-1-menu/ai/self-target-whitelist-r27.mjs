// r27 self-target allowances (Claude, 22 Oct 2026, deck review). Kept apart from the frozen whitelist. Kevy APPROVED
// them on 22 Oct 2026; Alexis's co-signature (rules lane) is still pending. Each entry is a card whose own printed effect must pick one
// of our own cards; the guard was refusing it, so the deck's core combo never ran. Remove this file's import in
// guard.mjs to return to the frozen list exactly.
export default {
  "31149212": [{"hint": 503, "targetCode": "*", "why": "Kashtira Riseheart banishes 1 Kashtira card from our own Deck to become Level 7 (its printed effect; the core Kashtira line)."}],
  "34447918": [{"hint": 551, "targetCode": "*", "why": "Kashtiratheosis targets 1 Kashtira monster we control (printed cost of the effect) to Special Summon another from the Deck."}],
  "8953369": [{"hint": 503, "targetCode": "*", "why": "Kashtira Overlap banishes a 1500/2100 monster (Riseheart) from our hand/GY/field to give ATK; it also triggers its own banished effect."}],
  "80326401": [{"hint": 551, "targetCode": 89631139, "why": "Wishes for Eyes of Blue's GY effect targets our own Blue-Eyes White Dragon to equip a Blue-Eyes from the Extra Deck to it."}],
  "45725480": [{"hint": 503, "targetCode": "*", "why": "Sacred Sword of Seven Stars banishes 1 of our Level 7 monsters as its cost to draw 2."}]
};

// r34 data file: Sky Striker holds only (Claude, 23 Oct 2026; Akiza review pending). No lines or picks (the r34
// picks-only draft lost Ace Links and stays parked in tools/drafts). trust:false keeps the live search exactly as before.
// Rule (seen going second, seeds 201/203/206): Sky Striker Spells need an empty Main Monster Zone. Summoning Roze, or a
// second Ace Link that has to sit in a Main Monster Zone, while a Sky Striker Spell can still be played switched the
// rest of the hand off (Engage! x2, Afterburners!, Jamming Waves! left in hand). Play the Spells first.
const LIVE = ["Sky Striker Mobilize - Engage!", "Sky Striker Maneuver - Afterburners!", "Sky Striker Maneuver - Jamming Waves!", "Sky Striker Mecha - Hornet Drones",
 "Sky Striker Mecha - Shark Cannon", "Sky Striker Mobilize - Linkage!", "Sky Striker Mecha - Widow Anchor"];/* r34 (ChatGPT RELAY-020 A-140): Lemnisgate!, Area Zero and Multirole have no empty-zone condition */
const LINKS = ["Sky Striker Ace = Zero", "Sky Striker Ace - Kagari", "Sky Striker Ace - Shizuku", "Sky Striker Ace - Hayate", "Sky Striker Ace - Azalea", "Sky Striker Ace - Camellia",
 "Prototype Sky Striker Ace - Amatsu", "Sky Striker Ace - Zeke", "Sky Striker Ace - Kaina", "S:P Little Knight", "Combined Maneuver - Engage Zero!"];
export default {
 "deck": "sky",
 "trust": false,
 "source": "Claude r34 (23 Oct 2026) from the going-second audit; not yet reviewed by Akiza.",
 "starters": [],
 "lines": [],
 "picks": [],
 "blocks": [
  {"do": "summon", "card": "Sky Striker Ace - Raye", "ifEmz": true, "ifOffered": LIVE, "why": "an Ace Link already holds the Extra Monster Zone, so Raye would be stuck in a Main Monster Zone and switch off the Sky Striker Spells still in hand: play them first"},
  {"do": "summon", "card": "Sky Striker Ace - Roze", "ifOffered": LIVE, "why": "Roze would take a Main Monster Zone and switch off the Sky Striker Spells still in hand: play them first"},
  {"do": "special", "card": "Sky Striker Ace - Roze", "ifOffered": LIVE, "why": "Roze would take a Main Monster Zone and switch off the Sky Striker Spells still in hand: play them first"},
  ...LINKS.map(card => ({"do": "special", card, "ifEmz": true, "ifOffered": LIVE, "why": "a second Link would sit in a Main Monster Zone and switch off the Sky Striker Spells still in hand: play them first"}))
 ],
 "setHold": {}
};

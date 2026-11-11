// r34 data file: Sky Striker holds only (Claude, 23 Oct 2026; Akiza review pending). No lines or picks (the r34
// picks-only draft lost Ace Links and stays parked in tools/drafts). trust:false keeps the live search exactly as before.
// Rule (seen going second, seeds 201/203/206): Sky Striker Spells need an empty Main Monster Zone. Summoning Roze, or a
// second Ace Link that has to sit in a Main Monster Zone, while a Sky Striker Spell can still be played switched the
// rest of the hand off (Engage! x2, Afterburners!, Jamming Waves! left in hand). Play the Spells first.
import {V4} from '../v4-flags.mjs';/* r45 v4 */
const LIVE = ["Sky Striker Mobilize - Engage!", "Sky Striker Maneuver - Afterburners!", "Sky Striker Maneuver - Jamming Waves!", "Sky Striker Mecha - Hornet Drones",
 "Sky Striker Mecha - Shark Cannon", "Sky Striker Mobilize - Linkage!", "Sky Striker Mecha - Widow Anchor"];/* r34 (ChatGPT RELAY-020 A-140): Lemnisgate!, Area Zero and Multirole have no empty-zone condition */
const LINKS = ["Sky Striker Ace = Zero", "Sky Striker Ace - Kagari", "Sky Striker Ace - Shizuku", "Sky Striker Ace - Hayate", "Sky Striker Ace - Azalea", "Sky Striker Ace - Camellia",
 "Prototype Sky Striker Ace - Amatsu", "Sky Striker Ace - Zeke", "Sky Striker Ace - Kaina", "S:P Little Knight", "Combined Maneuver - Engage Zero!"];
const BOOK = {
 "deck": "sky",
 // r45 v4 item 5 (Kevy approved 11 Nov 2026 11:53 AEDT): a real Sky Striker playbook. Lines are the backbone and are played
 // as written (trust on); search only decides where no line applies. Lines are ordered: draw spells, then the Sky Striker
 // Spells while our Main Monster Zones are empty, then Raye, its Ace Link, the Spells again (the Link sits in the Extra
 // Monster Zone), Hornet Drones and Zero. Every step is still only taken if the engine offers it and no hold blocks it.
 // book.mjs skips 'V4-SKY' lines (and this file then acts as the r44 holds-only book) when V4.sky is off.
 "trust": false,/* r45 v4 hybrid: the Sky lines give the baseline step, and search still compares it at each decision point (trusting the lines outright lost 9 of 10 against WindBot Branded in benchmark try 1) */
 "v4": true,
 "source": "Claude r34 holds (23 Oct 2026) + Seto r45 v4 lines (11 Nov 2026) from the printed card texts and WindBot's SkyStrikerExecutor.cs order (Engage first, Raye into Kagari, Hornet Drones, Spells only with an empty Main Monster Zone).",
 get starters(){return V4.on&&V4.sky?SKY_STARTERS:[]},
 "_starters": ["Sky Striker Mobilize - Engage!", "Sky Striker Ace - Raye", "Reinforcement of the Army", "Sky Striker Mecha - Hornet Drones"],
 get lines(){return V4.on&&V4.sky?SKY_LINES:[]},
 get picks(){return V4.on&&V4.sky?SKY_PICKS:[]},
 "_lines": [
  {"id": "V4-SKY-DRAW", "name": "Draw spells first", "when": {"handAny": ["Upstart Goblin", "Pot of Desires"]},
   "steps": [{"do": "activate", "card": "Upstart Goblin"}, {"do": "activate", "card": "Pot of Desires"}]},
  {"id": "V4-SKY-BREAK", "name": "Going into a board: Sky Striker Spells break it one card at a time while our Main Monster Zones are empty, then Raye and an Ace Link attack", "when": {"oppMonstersMin": 1},
   "steps": [{"do": "activate", "card": "Sky Striker Mecha - Widow Anchor"}, {"do": "activate", "card": "Sky Striker Maneuver - Afterburners!"}, {"do": "activate", "card": "Sky Striker Maneuver - Jamming Waves!"},
    {"do": "activate", "card": "Sky Striker Mobilize - Engage!"}, {"do": "activate", "card": "Reinforcement of the Army"}, {"do": "activate", "card": "Sky Striker Airspace - Area Zero", "location": [2]},
    {"do": "summon", "card": "Sky Striker Ace - Raye"}, {"do": "activate", "card": "Sky Striker Ace - Raye", "location": [4]}, {"do": "activate", "card": "Sky Striker Mobilize - Linkage!"}]},
  {"id": "V4-SKY-OPEN", "name": "Engage for Raye, Raye into Kagari (Kagari returns Engage), Engage again, Hornet Drones token, Zero searches a Spell; set Widow Anchor", "when": {"handAny": ["Sky Striker Mobilize - Engage!", "Sky Striker Ace - Raye", "Reinforcement of the Army", "Sky Striker Mecha - Hornet Drones"]},
   "steps": [{"do": "activate", "card": "Reinforcement of the Army"}, {"do": "activate", "card": "Sky Striker Mobilize - Engage!"}, {"do": "activate", "card": "Sky Striker Airspace - Area Zero", "location": [2]},
    {"do": "activate", "card": "Sky Striker Mecha Modules - Multirole", "location": [2]}, {"do": "summon", "card": "Sky Striker Ace - Raye"}, {"do": "activate", "card": "Sky Striker Ace - Raye", "location": [4]},
    {"do": "activate", "card": "Sky Striker Mecha - Hornet Drones"}, {"do": "special", "card": "Sky Striker Ace = Zero"}]}
 ],
 "_picks": [
  {"source": "Sky Striker Mobilize - Engage!", "hint": [506], "ifNotHand": ["Sky Striker Ace - Raye"], "ifNotField": ["Sky Striker Ace - Raye", "Sky Striker Ace - Kagari", "Sky Striker Ace - Shizuku", "Sky Striker Ace - Hayate", "Sky Striker Ace = Zero"], "prefer": ["Sky Striker Ace - Raye", "Sky Striker Mecha - Widow Anchor", "Sky Striker Mecha - Hornet Drones"], "why": "No Ace in hand or on the field: Raye starts the turn."},
  {"source": "Sky Striker Mobilize - Engage!", "hint": [506], "ifOppNone": false, "prefer": ["Sky Striker Mecha - Widow Anchor", "Sky Striker Maneuver - Afterburners!", "Sky Striker Mecha - Hornet Drones", "Sky Striker Maneuver - Jamming Waves!", "Sky Striker Mobilize - Linkage!"], "why": "Into a board: removal first."},
  {"source": "Sky Striker Mobilize - Engage!", "hint": [506], "prefer": ["Sky Striker Mecha - Hornet Drones", "Sky Striker Mecha - Widow Anchor", "Sky Striker Airspace - Area Zero", "Sky Striker Maneuver - Afterburners!", "Sky Striker Mobilize - Linkage!", "Sky Striker Mecha Modules - Multirole"], "why": "Empty opposing board: Hornet Drones makes the second Ace for Zero; Widow Anchor is the Set interruption."},
  {"source": "Reinforcement of the Army", "prefer": ["Sky Striker Ace - Raye", "Sky Striker Ace - Roze"]},
  {"source": "Sky Striker Ace - Raye", "hint": [509], "ifOppNone": false, "prefer": ["Sky Striker Ace = Zero", "Sky Striker Ace - Kagari", "Sky Striker Ace - Hayate", "Sky Striker Ace - Shizuku", "Sky Striker Ace - Kaina"], "why": "Zero first (3000 ATK body that searches; the r44 search found this), else Kagari or Hayate."},
  {"source": "Sky Striker Ace - Raye", "hint": [509], "prefer": ["Sky Striker Ace = Zero", "Sky Striker Ace - Kagari", "Sky Striker Ace - Shizuku", "Sky Striker Ace - Hayate", "Sky Striker Ace - Kaina"], "why": "Zero first, else Kagari to return the Engage! just used."},
  {"source": "Sky Striker Mobilize - Linkage!", "hint": [509], "prefer": ["Sky Striker Ace - Kagari", "Sky Striker Ace - Hayate", "Sky Striker Ace - Shizuku", "Sky Striker Ace - Kaina"]},
  {"source": "Sky Striker Mobilize - Linkage!", "notHint": [509], "prefer": ["Sky Striker Airspace - Area Zero", "Sky Striker Ace Token", "Sky Striker Mecha Modules - Multirole"], "why": "Area Zero sent by a card effect Special Summons an Ace from the Deck."},
  {"source": "Sky Striker Ace - Kagari", "prefer": ["Sky Striker Mobilize - Engage!", "Sky Striker Mecha - Hornet Drones", "Sky Striker Mecha - Widow Anchor", "Sky Striker Maneuver - Afterburners!", "Sky Striker Mobilize - Linkage!", "Sky Striker Maneuver - Jamming Waves!", "Sky Striker Mecha - Shark Cannon"]},
  {"source": "Sky Striker Ace = Zero", "prefer": ["Sky Striker Mecha - Widow Anchor", "Sky Striker Maneuver - Afterburners!", "Sky Striker Mobilize - Engage!", "Sky Striker Mecha - Hornet Drones", "Sky Striker Maneuver - Jamming Waves!", "Sky Striker Mobilize - Linkage!"]},
  {"source": "Sky Striker Ace - Shizuku", "prefer": ["Sky Striker Mecha - Widow Anchor", "Sky Striker Maneuver - Afterburners!", "Sky Striker Mobilize - Engage!", "Sky Striker Mecha - Hornet Drones", "Sky Striker Mobilize - Linkage!"]},
  {"source": "*", "hint": [533], "prefer": ["Sky Striker Ace Token", "Sky Striker Ace - Raye", "Sky Striker Ace - Kagari", "Sky Striker Ace - Shizuku", "Sky Striker Ace - Hayate", "Sky Striker Ace - Kaina"]}
 ],
 get blocks(){return V4.on&&V4.sky?[...BOOK._blocks,...SKY_V4_BLOCKS]:BOOK._blocks},
 "_blocks": [
  {"do": "summon", "card": "Sky Striker Ace - Raye", "ifEmz": true, "ifOffered": LIVE, "why": "an Ace Link already holds the Extra Monster Zone, so Raye would be stuck in a Main Monster Zone and switch off the Sky Striker Spells still in hand: play them first"},
  {"do": "summon", "card": "Sky Striker Ace - Roze", "ifOffered": LIVE, "why": "Roze would take a Main Monster Zone and switch off the Sky Striker Spells still in hand: play them first"},
  {"do": "special", "card": "Sky Striker Ace - Roze", "ifOffered": LIVE, "why": "Roze would take a Main Monster Zone and switch off the Sky Striker Spells still in hand: play them first"},
  ...LINKS.map(card => ({"do": "special", card, "ifEmz": true, "ifOffered": LIVE, "why": "a second Link would sit in a Main Monster Zone and switch off the Sky Striker Spells still in hand: play them first"}))
 ],
 "setHold": {}
};
/* r45 v4: never Normal Summon a hand trap as a body; it is kept for the opponent's turn, and a monster in a Main Monster Zone switches off the Sky Striker Spells. */
const SKY_V4_BLOCKS=["Ash Blossom & Joyous Spring","Ghost Belle & Haunted Mansion","Droll & Lock Bird","Effect Veiler","Ghost Ogre & Snow Rabbit"].map(card=>({"do":"summon",card,"why":"a hand trap is kept for the opponent's turn, not used as a body"}));
const SKY_STARTERS=BOOK._starters,SKY_LINES=BOOK._lines,SKY_PICKS=BOOK._picks;
export default BOOK;

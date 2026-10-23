// r34 deck brain: Sky Striker (Zero Protocol), TCG 19 Oct 2026 list. Claude, 23 Oct 2026. STATUS: DRAFT, Akiza review
// pending. Same format as branded-brain.mjs. Every line was read against the printed card text. Sky Striker has no
// scripted book lines (its game plan and search decide), so its route ids start with "R-".
export default {
 deck: 'sky',
 status: 'DRAFT (Claude, 23 Oct 2026). Akiza review pending.',
 plan: 'Play one monster at a time from the Extra Monster Zone and keep the Main Monster Zones empty, because almost every Sky Striker Spell needs "no monsters in your Main Monster Zone". Each Spell trades one-for-one and fills the GY; at 3+ Spells in the GY they get stronger. Going first: Raye into a Link with a Sky Striker Spell searched and Widow Anchor set; going second: Spells break their board one card at a time.',
 roles: {starter: 'Starts a full combo on its own', extender: 'Adds to a combo that has started', payoff: 'The board the combo builds to', interruption: 'Stops the opponent on their turn', handtrap: 'Used from the hand on the opponent\'s turn', utility: 'Fills a gap: material, card draw or recovery'},
 cards: {
  'Sky Striker Ace - Raye': {role: 'starter', does: 'Quick Effect: Tribute it to Special Summon a Sky Striker Ace Link to the Extra Monster Zone (Kagari to re-use a Spell, Shizuku to weaken them, Hayate to attack directly). In the GY it comes back when your Ace Link is destroyed or removed by them.', links: {summon: ['Sky Striker Ace - Kagari', 'Sky Striker Ace - Shizuku', 'Sky Striker Ace - Hayate', 'Sky Striker Ace - Kaina', 'Prototype Sky Striker Ace - Amatsu']}},
  'Sky Striker Ace - Roze': {role: 'extender', does: 'When another Sky Striker Ace is summoned: Special Summon it from the hand (a second body for Zero or Azalea). From the GY: returns when their Extra Monster Zone monster is destroyed, and negates a monster.'},
  'Sky Striker Mobilize - Engage!': {role: 'starter', does: 'With no Main Monster Zone monsters: add any Sky Striker card (Raye first), then draw 1 with 3+ Spells in the GY.', links: {search: ['Sky Striker Ace - Raye', 'Sky Striker Mecha - Widow Anchor', 'Sky Striker Mobilize - Linkage!', 'Sky Striker Mecha - Hornet Drones', 'Sky Striker Airspace - Area Zero']}},
  'Sky Striker Maneuver - Jamming Waves!': {role: 'utility', does: 'Destroy a Set Spell/Trap; with 3+ Spells in the GY also destroy a monster.'},
  'Sky Striker Mobilize - Linkage!': {role: 'extender', does: 'Quick-Play: send another card you control to the GY to Special Summon a Sky Striker Ace Link to the Extra Monster Zone (+1000 ATK with LIGHT and DARK Aces). Only Ace monsters from the Extra Deck afterwards.', links: {summon: ['Sky Striker Ace - Kagari', 'Sky Striker Ace - Shizuku', 'Sky Striker Ace - Hayate', 'Sky Striker Ace - Kaina']}},
  'Sky Striker Mecha - Widow Anchor': {role: 'interruption', does: 'Quick-Play, usually Set: negate a face-up Effect Monster for the turn; with 3+ Spells in the GY take control of it too.'},
  'Sky Striker Mecha - Shark Cannon': {role: 'interruption', does: 'Banish a monster from their GY, or with 3+ Spells in the GY Special Summon it to your field.'},
  'Sky Striker Mecha - Hornet Drones': {role: 'starter', does: 'Special Summon a Sky Striker Ace Token in Defense Position (1500/1500 with 3+ Spells). The token is material for Kagari / Shizuku / Hayate.'},
  'Reinforcement of the Army': {role: 'starter', does: 'Add a Level 4 or lower Warrior (Raye or Roze).', links: {search: ['Sky Striker Ace - Raye', 'Sky Striker Ace - Roze']}},
  'Sky Striker Special Maneuver - Lemnisgate!': {role: 'extender', does: 'Shuffle Aces and Spells from the GY back to bounce cards. From the GY: when a Sky Striker is Special Summoned, banish it to Link Summon an Ace Link right away (on either turn).'},
  'Sky Striker Mecha Modules - Multirole': {role: 'extender', does: 'Continuous Spell: send another card you control to the GY so they cannot respond to your Spells this turn. End Phase: Set Sky Striker Spells from the GY (one per Sky Striker Spell activated this turn).'},
  'Upstart Goblin': {role: 'utility', does: 'Draw 1 (they gain 1000 LP) and adds a Spell to the GY. Played, never left in hand at the end of the turn.'},
  'Pot of Desires': {role: 'utility', does: 'Banish the top 10 face-down: draw 2. Once per turn.'},
  'Sky Striker Mecha - Eagle Booster': {role: 'interruption', does: 'Quick-Play: your monster is unaffected by other cards this turn (and not destroyed by battle with 3+ Spells).'},
  'Sky Striker Maneuver - Afterburners!': {role: 'utility', does: 'Destroy a face-up monster; with 3+ Spells also a Spell/Trap.'},
  'Sky Striker Airspace - Area Zero': {role: 'extender', does: 'Field Spell: send another card you control to excavate 3 and add a Sky Striker card. Sent to the GY by an effect: Special Summon a Sky Striker Ace from the Deck.'},
  'Ash Blossom & Joyous Spring': {role: 'handtrap', does: 'Negates a search, a Special Summon from the Deck or a send from the Deck on their turn.'},
  'Droll & Lock Bird': {role: 'handtrap', does: 'After they add a card outside the Draw Phase: nobody can add cards for the rest of the turn.'},
  'Ghost Belle & Haunted Mansion': {role: 'handtrap', does: 'Negates an effect that moves cards out of the GY.'},
  'Mulcharmy Fuwalos': {role: 'handtrap', does: 'With no cards on your field: draw each time they Special Summon from the Deck or Extra Deck.'},
  'Forbidden Droplet': {role: 'handtrap', does: 'Quick-Play: send cards to negate and halve their monsters.'},
  'Infinite Impermanence': {role: 'handtrap', does: 'Negates a face-up monster on their field for the turn.'},
  'Sky Striker Ace = Zero': {role: 'payoff', does: '2 Aces, never Link Material. Special Summoned: add a Sky Striker Spell. Quick Effect: Tribute it for Raye and Roze from the Deck / GY, then destroy a card.'},
  'Sky Striker Ace - Kagari': {role: 'extender', does: 'From a non-FIRE Ace (Raye). Special Summoned: add a Sky Striker Spell back from the GY. Gains 100 ATK per Spell in the GY.'},
  'Sky Striker Ace - Shizuku': {role: 'payoff', does: 'From a non-WATER Ace. Their monsters lose 100 ATK/DEF per Spell in your GY; in the End Phase it adds a Sky Striker Spell not already in the GY. The usual turn-1 end.'},
  'Sky Striker Ace - Hayate': {role: 'utility', does: 'From a non-WIND Ace. Attacks directly; after battle sends a Sky Striker card from the Deck to the GY.'},
  'Sky Striker Ace - Azalea': {role: 'interruption', does: 'Link 2 from LIGHT/DARK monsters: destroy a card on summon.'},
  'Sky Striker Ace - Camellia': {role: 'utility', does: 'Link 2: sends a Sky Striker card from the Deck; from the GY it swaps itself for their monster.'},
  'Prototype Sky Striker Ace - Amatsu': {role: 'interruption', does: 'From an Ace: changes a 2000+ ATK monster\'s effect into "destroy their Ace Link"; destroys a card when it battles.'},
  'Sky Striker Ace - Zeke': {role: 'interruption', does: 'Link 2: banishes a face-up monster until their next End Phase.'},
  'Sky Striker Ace - Kaina': {role: 'utility', does: 'From a non-EARTH Ace: one of their monsters cannot attack; LP for each Sky Striker Spell.'},
  'S:P Little Knight': {role: 'interruption', does: 'Link 2: banishes a card when made from an Extra Deck monster; on their turn banishes two monsters until the End Phase.'},
  'Combined Maneuver - Engage Zero!': {role: 'payoff', does: 'Link 2, counts as an Ace: negates a 2500+ ATK monster on summon; with Raye and Roze in the GY it destroys all their monsters when it attacks.'}
 },
 routes: [
  {id: 'R-RAYE', from: ['Sky Striker Mobilize - Engage!', 'Reinforcement of the Army', 'Sky Striker Ace - Raye'], steps: ['Engage! or Reinforcement adds Raye', 'Normal Summon Raye; Tribute it (Quick Effect) for Kagari, which adds Engage! back', 'Play Spells while the Main Monster Zones stay empty; set Widow Anchor', 'Kagari / Linkage! into Shizuku for the End Phase search'], ends: 'Shizuku or Kagari in the Extra Monster Zone, Widow Anchor set, Spells in hand'},
  {id: 'R-DRONES', from: ['Sky Striker Mecha - Hornet Drones'], steps: ['Hornet Drones makes a token', 'Token into Kagari or Shizuku (Link 1 from an Ace)'], ends: 'An Ace Link without using a Normal Summon'},
  {id: 'R-ZERO', from: ['Sky Striker Ace - Raye', 'Sky Striker Ace - Roze'], steps: ['Two Aces on the field: Sky Striker Ace = Zero (adds a Spell)', 'On their turn: Tribute Zero for Raye and Roze and destroy a card'], ends: 'An interruption that rebuilds itself'}
 ],
 neverSummon: {cards: ['Ghost Belle & Haunted Mansion', 'Ash Blossom & Joyous Spring', 'Mulcharmy Fuwalos', 'Droll & Lock Bird'], why: 'a hand trap Normal Summoned sits in a Main Monster Zone and switches off every Sky Striker Spell (seen: Ghost Belle, 3 of 30 hands)'},
 locks: [
  {card: 'Sky Striker Mobilize - Linkage!', lock: 'only Sky Striker Ace monsters from the Extra Deck afterwards', advice: ''},
  {card: 'Sky Striker Mobilize - Engage!', lock: 'needs no monsters in the Main Monster Zones (true of most Sky Striker Spells)', advice: 'keep Raye and Roze moving into the Extra Monster Zone'}
 ],
 endPhase: ['Shizuku (summoned this turn): add a Sky Striker Spell with a new name', 'Multirole: Set Sky Striker Spells from the GY']
};

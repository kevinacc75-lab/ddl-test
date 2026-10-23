// r34 deck brain: Blue-Eyes / Primite (Azure Sovereign), TCG 19 Oct 2026 list. Claude, 23 Oct 2026. STATUS: DRAFT, Akiza
// review pending. Same format as branded-brain.mjs. Every line was read against the printed card text.
export default {
 deck: 'blueeyes',
 status: 'DRAFT (Claude, 23 Oct 2026). Akiza review pending.',
 plan: 'Get Blue-Eyes White Dragon (a Normal Monster) onto the field with a Level 1 LIGHT Tuner (Maiden of White or Sage with Eyes of Blue), then Synchro Summon Blue-Eyes Spirit Dragon or, with two Tuners, Blue-Eyes Ultimate Spirit Dragon, which negates an activation on the field. The Primite engine (Lordly Lode, Ether Beryl) finds and summons the Normal Monsters; True Light protects Blue-Eyes and revives it.',
 roles: {starter: 'Starts a full combo on its own', extender: 'Adds to a combo that has started', payoff: 'The board the combo builds to', interruption: 'Stops the opponent on their turn', handtrap: 'Used from the hand on the opponent\'s turn', utility: 'Fills a gap: material, card draw or recovery'},
 cards: {
  'Lunar Rabbit Omajinai': {role: 'utility', does: 'A Level 1 LIGHT Normal Tuner: a Normal Monster for the Primite cards and a Tuner for the Synchros.'},
  'Blue-Eyes White Dragon': {role: 'utility', does: 'The Normal Monster everything is built around: Synchro and Fusion Material, revived by True Light, Roar and Lordly Lode.'},
  'Maiden of White': {role: 'starter', does: 'Send it from the hand or field to the GY: place True Light face-up from the hand, Deck or GY. When you Special Summon Blue-Eyes it returns from the GY (a Tuner for Spirit Dragon). Targeted or attacked: revive Blue-Eyes or a Level 1 LIGHT Tuner.', links: {summon: ['Blue-Eyes White Dragon']}},
  'Sage with Eyes of Blue': {role: 'starter', does: 'Normal Summon: add a Level 1 LIGHT Tuner (Maiden of White). Discard it and send an Effect Monster you control to the GY: Special Summon a Blue-Eyes from the Deck.', links: {search: ['Maiden of White'], summon: ['Blue-Eyes White Dragon']}},
  'Primite Dragon Ether Beryl': {role: 'starter', does: 'Normal Summon: Set a Primite Spell/Trap from the Deck (Drillbeam). Tribute it: send a Normal Monster (Blue-Eyes) from the Deck to the GY, ready for True Light or Roar. Returns to the hand each Standby with a Normal Monster around.', links: {send: ['Blue-Eyes White Dragon', 'Lunar Rabbit Omajinai']}},
  'Mulcharmy Fuwalos': {role: 'handtrap', does: 'With no cards on your field: draw each time they Special Summon from the Deck or Extra Deck.'},
  'Ash Blossom & Joyous Spring': {role: 'handtrap', does: 'Negates a search, a Special Summon from the Deck or a send from the Deck on their turn.'},
  'Effect Veiler': {role: 'handtrap', does: 'Negates a face-up monster on their field.'},
  'Ghost Mourner & Moonlit Chill': {role: 'handtrap', does: 'When they Special Summon: discard it to negate one of those monsters; if it leaves the field they take damage equal to its ATK.'},
  'Ghost Belle & Haunted Mansion': {role: 'handtrap', does: 'Negates an effect that moves cards out of the GY.'},
  'Wishes for Eyes of Blue': {role: 'starter', does: 'Discard 1: add a Level 1 LIGHT Tuner and a Spell/Trap that mentions Blue-Eyes. From the GY: equip a Blue-Eyes from the Extra Deck to Blue-Eyes (+400; turns on Tyrant Dragon).', links: {search: ['Maiden of White', 'Sage with Eyes of Blue', 'Roar of the Blue-Eyed Dragons', 'True Light', 'Majesty of the White Dragons', 'Mausoleum of White']}},
  'Roar of the Blue-Eyed Dragons': {role: 'starter', does: 'Special Summon a Blue-Eyes from the Deck, GY or banishment in Defense Position (Blue-Eyes White Dragon first). Only Dragons from the Extra Deck that turn. From the GY: Fusion Summon with a Blue-Eyes.', links: {summon: ['Blue-Eyes White Dragon']}},
  'Mausoleum of White': {role: 'extender', does: 'Field Spell: an extra Normal Summon for a Level 1 LIGHT Tuner. Sends a Normal Monster from the hand or Deck to the GY to pump a monster. From the GY: add Burst Stream of Destruction.'},
  'Primite Lordly Lode': {role: 'starter', does: 'Continuous Spell. On activation add a Primite card (Ether Beryl or Drillbeam). Declare a Normal Monster to Special Summon it from the hand, Deck or GY (Blue-Eyes), but Special Summoned monsters cannot use effects that turn.', links: {search: ['Primite Dragon Ether Beryl', 'Primite Drillbeam'], summon: ['Blue-Eyes White Dragon', 'Lunar Rabbit Omajinai']}},
  'Primite Drillbeam': {role: 'interruption', does: 'Quick-Play: negate and banish a face-up card (reveal a Primite or Normal Monster, or none needed with a Normal Monster out). Sets itself again from the GY with a Primite monster.'},
  'Infinite Impermanence': {role: 'handtrap', does: 'Negates a face-up monster on their field for the turn.'},
  'Dominus Purge': {role: 'handtrap', does: 'Trap (from the hand if they control a card): negate an effect that adds from the Deck to the hand.'},
  'Majesty of the White Dragons': {role: 'interruption', does: 'Show up to 3 Blue-Eyes White Dragons: destroy that many of their cards.'},
  'True Light': {role: 'extender', does: 'Continuous Trap (Maiden places it): your Blue-Eyes White Dragons cannot be targeted. Once per turn: Special Summon Blue-Eyes from the hand or GY, or Set a Spell/Trap that lists Blue-Eyes. If it leaves the field you lose all your monsters.', links: {summon: ['Blue-Eyes White Dragon']}},
  'Blue-Eyes Spirit Dragon': {role: 'payoff', does: 'Synchro (Tuner + Blue-Eyes): negates a GY effect once per turn and stops them summoning 2+ monsters at once. Tribute it for another LIGHT Dragon Synchro on either turn.'},
  'Blue-Eyes Ultimate Spirit Dragon': {role: 'payoff', does: 'Synchro (2+ Tuners + Blue-Eyes): negates an activation on the field (+1000 ATK); they cannot banish your GY; when destroyed it revives a LIGHT Dragon.'},
  'Lightstorm Dragon': {role: 'utility', does: 'Synchro: destroys Spells/Traps on summon.'},
  'Ancient Fairy Life Dragon': {role: 'utility', does: 'Level 8 Synchro: draws 1 on Synchro Summon.'},
  'Cosmic Blazar Dragon': {role: 'payoff', does: 'Synchro from Synchro Monsters: banishes itself to negate an activation, a summon or an attack.'},
  'Crimson Dragon': {role: 'utility', does: 'Level 12 Synchro: swaps itself for another Dragon Synchro of the same Level as a target.'},
  'Black Rose Moonlight Dragon': {role: 'utility', does: 'Synchro: bounces one of their Special Summoned monsters.'},
  'Blue-Eyes Tyrant Dragon': {role: 'payoff', does: 'Fusion of Blue-Eyes + a Dragon: unaffected by Traps, attacks every monster.'},
  'Neo Blue-Eyes Ultimate Dragon': {role: 'payoff', does: 'Fusion of three Blue-Eyes; from the GY it negates an effect targeting your Blue-Eyes.'},
  'Hieratic Seal of the Heavenly Spheres': {role: 'interruption', does: 'Link 2 from two Dragons: on their turn bounce a card; when Tributed, Special Summon a Dragon from the hand or Deck.'},
  'Spirit with Eyes of Blue': {role: 'extender', does: 'Link 1 from a Level 4 or lower Dragon/Spellcaster (Ether Beryl): add or send Mausoleum of White; Tribute it to Special Summon a Blue-Eyes from the hand or GY.', links: {summon: ['Blue-Eyes White Dragon']}}
 },
 routes: [
  {id: 'BE-SAGE', from: ['Primite Lordly Lode', 'Sage with Eyes of Blue'], steps: ['Lordly Lode adds Ether Beryl', 'Lordly Lode declares Blue-Eyes White Dragon: Special Summon it', 'Normal Summon Sage: add Maiden of White (Sage was Normal Summoned, so Lordly Lode does not stop it)', 'Sage + Blue-Eyes: Spirit Dragon; Maiden can place True Light for a second one'], ends: 'Blue-Eyes Spirit Dragon (often two)'},
  {id: 'BE-SPIRIT', from: ['Primite Lordly Lode', 'Primite Dragon Ether Beryl'], steps: ['Lordly Lode adds Ether Beryl; Normal Summon it (Set a Primite card)', 'Ether Beryl: Link Summon Spirit with Eyes of Blue, which takes Mausoleum of White', 'Mausoleum sends Blue-Eyes White Dragon to the GY; Spirit with Eyes of Blue Tributes itself to bring it back', 'Only now Lordly Lode declares Lunar Rabbit (its lock would have stopped Spirit with Eyes of Blue)', 'Lunar Rabbit + Blue-Eyes: Spirit Dragon'], ends: 'Blue-Eyes Spirit Dragon'},
  {id: 'BE-01', from: ['Primite Lordly Lode', 'Primite Dragon Ether Beryl'], steps: ['Lordly Lode adds Ether Beryl; Normal Summon it and Set a Primite Spell/Trap', 'Tribute Ether Beryl: send Blue-Eyes White Dragon to the GY', 'Maiden of White places True Light; True Light revives Blue-Eyes, which brings Maiden back', 'Maiden + Blue-Eyes: Blue-Eyes Spirit Dragon'], ends: 'Spirit Dragon (or Ultimate Spirit Dragon with a second Tuner), True Light, Drillbeam set'},
  {id: 'R-SAGE', from: ['Sage with Eyes of Blue'], steps: ['Normal Summon Sage: add Maiden of White', 'Send Maiden from the hand to the GY: place True Light', 'True Light Special Summons Blue-Eyes from the hand or GY, and Maiden returns from the GY', 'Sage or Maiden (Tuners) + Blue-Eyes for Spirit Dragon; both Tuners + Blue-Eyes for Ultimate Spirit Dragon'], ends: 'Spirit Dragon or Ultimate Spirit Dragon + True Light (needs Blue-Eyes in the hand or GY)'},
  {id: 'R-ROAR', from: ['Roar of the Blue-Eyed Dragons', 'Wishes for Eyes of Blue'], steps: ['Wishes (discard Maiden of White) adds a Tuner and Roar', 'Roar Special Summons Blue-Eyes from the Deck; that brings Maiden back from the GY', 'Maiden + Blue-Eyes: Spirit Dragon'], ends: 'Spirit Dragon'}
 ],
 locks: [
  {card: 'Primite Lordly Lode', lock: 'monsters it Special Summons cannot use effects that turn', advice: 'summon Blue-Eyes with it, not an effect monster'},
  {card: 'Roar of the Blue-Eyed Dragons', lock: 'only Dragons from the Extra Deck that turn', advice: 'Spirit Dragon and Ultimate are Dragons'},
  {card: 'Blue-Eyes Spirit Dragon', lock: 'nobody can Special Summon 2+ monsters at once while it is out', advice: 'it limits you too'},
  {card: 'True Light', lock: 'if it leaves the field, destroy all your monsters', advice: 'protect it'}
 ],
 endPhase: ['Ether Beryl returns from the GY in your Standby Phase if a Normal Monster is in your field or GY', 'Spirit Dragon\'s replacement Synchro is destroyed in the End Phase']
};

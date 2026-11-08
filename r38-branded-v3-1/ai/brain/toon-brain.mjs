// r34 deck brain: Toon (Ink Riot), TCG 19 Oct 2026 list. Claude, 23 Oct 2026. STATUS: DRAFT, Akiza review pending.
// Same format as branded-brain.mjs. Every line was read against the printed card text.
export default {
 deck: 'toon',
 status: 'DRAFT (Claude, 23 Oct 2026). Akiza review pending.',
 plan: 'Get Toon World (or Toon Kingdom, which counts as Toon World and protects your Toons) onto the field first. Then Red-Eyes Toon Dragon and Toon Dark Magician bring out more Toons ignoring their summoning rules, building up to Toon Black Luster Soldier, which banishes a card. Toons attack directly while they have no Toons of their own; Toon Terror and the hand traps protect the turn.',
 roles: {starter: 'Opens a route; the route lists anything else it needs (discards, materials)', extender: 'Adds to a combo that has started', payoff: 'The board the combo builds to', interruption: 'Stops the opponent on their turn', handtrap: 'Used from the hand on the opponent\'s turn', utility: 'Fills a gap: material, card draw or recovery'},
 cards: {
  'Toon Black Luster Soldier': {role: 'payoff', does: 'Special Summon it by Tributing Toons whose Levels total 8+ (or bring it out with Red-Eyes Toon Dragon / Toon Dark Magician / Page-Flip ignoring that). With Toon World: banish a card once per turn; attacks directly when they have no Toons.'},
  'Toon Dark Magician': {role: 'extender', does: 'Once per turn: discard a Toon card to Special Summon a Toon from the Deck ignoring its summoning rules (Black Luster Soldier), or add a Toon Spell/Trap.', links: {summon: ['Toon Black Luster Soldier', 'Red-Eyes Toon Dragon', 'Toon Harpie Lady', 'Toon Cyber Dragon']}},
  'Red-Eyes Toon Dragon': {role: 'extender', does: 'Once per turn: Special Summon another Toon from the hand ignoring its summoning rules. The Black Stone of Legend summons it from the Deck.', links: {summon: ['Toon Black Luster Soldier', 'Toon Dark Magician']}},
  'Toon Cyber Dragon': {role: 'utility', does: 'Special Summon it from the hand if only they control a monster. Material for Chimeratech Megafleet Dragon.'},
  'Toon Goblin Attack Force': {role: 'utility', does: 'Toon beater: cannot attack the turn it is summoned; after it attacks it turns to Defense and stays there until the End Phase of our next turn. Destroyed if Toon World is destroyed.'},
  'Toon Harpie Lady': {role: 'extender', does: 'With Toon World: Special Summon it from the hand and, with another Toon out, destroy a Spell/Trap of theirs.'},
  'Mulcharmy Fuwalos': {role: 'handtrap', does: 'With no cards on our field (Quick Effect): discard it, then each time they Special Summon from the Deck and/or Extra Deck this turn we draw 1. Once in that End Phase, if our hand is bigger than the number of cards they control + 6, we shuffle random cards from our hand into the Deck until it is exactly that number. Only 1 other Mulcharmy effect can be used that turn.'},
  'Ash Blossom & Joyous Spring': {role: 'handtrap', does: 'Negates a search, a Special Summon from the Deck or a send from the Deck on their turn.'},
  'Mulcharmy Purulia': {role: 'handtrap', does: 'With no cards on our field (Quick Effect): discard it, then each time they Normal or Special Summon from the hand this turn we draw 1. Once in that End Phase, if our hand is bigger than the number of cards they control + 6, we shuffle random cards from our hand into the Deck until it is exactly that number. Only 1 other Mulcharmy effect that turn.'},
  'The Black Stone of Legend': {role: 'starter', does: 'Tribute it: Special Summon Red-Eyes Toon Dragon (a Level 7 or lower Red-Eyes) from the Deck. From the GY it returns to the hand by shuffling a Red-Eyes back.', links: {summon: ['Red-Eyes Toon Dragon']}},
  'One for One': {role: 'starter', does: 'Send a monster from the hand to the GY: Special Summon a Level 1 (The Black Stone of Legend) from the hand or Deck.', links: {summon: ['The Black Stone of Legend']}},
  'Shadow Toon': {role: 'utility', does: 'With Toon World: burn them for one of their monster\'s ATK.'},
  'Raigeki': {role: 'utility', does: 'Destroy all their monsters.'},
  'Harpie\'s Feather Duster': {role: 'utility', does: 'Destroy all their Spells and Traps.'},
  'Terraforming': {role: 'starter', does: 'Add a Field Spell: Toon Kingdom.', links: {search: ['Toon Kingdom']}},
  'Triple Tactics Thrust': {role: 'utility', does: 'Only after the opponent activated a monster effect this turn: Set a Normal Spell/Trap from the Deck (it cannot be activated this turn), or, if they control a monster, add it to the hand instead. Once per turn.'},
  'Mimicat': {role: 'utility', does: 'With Toon World and a Toon: target a card in their GY; Special Summon it to our field if it is a monster, or Set it if it is a Spell/Trap (normal Set rules apply).'},
  'Toon Table of Contents': {role: 'starter', does: 'Add any Toon card: Toon World / Kingdom first, otherwise a Toon monster.', links: {search: ['Toon World', 'Toon Kingdom', 'Toon Dark Magician', 'Red-Eyes Toon Dragon', 'Toon Black Luster Soldier']}},
  'Toon Bookmark': {role: 'starter', does: 'Add Toon World or a card that mentions it. From the GY it saves Toon World from destruction.', links: {search: ['Toon World', 'Toon Kingdom', 'Toon Page-Flip', 'Comic Hand']}},
  'Toon Mask': {role: 'interruption', does: 'Trap with Toon World: Special Summon a Toon from the hand or Deck with a Level up to their monster\'s Level/Rank, ignoring its rules.'},
  'Toon Terror': {role: 'interruption', does: 'Counter Trap with Toon World and a Toon: negate a Spell, Trap or monster effect and destroy it.'},
  'Toon Page-Flip': {role: 'extender', does: 'Quick-Play with Toon World: reveal 3 different Toons from the Deck; they pick one at random and you Special Summon it ignoring its rules.'},
  'Toon World': {role: 'starter', does: 'Continuous Spell (pay 1000 LP): every Toon needs it. It sits in a Spell/Trap Zone, so it can be on the field together with Toon Kingdom; a second copy only costs another 1000 LP.'},
  'Comic Hand': {role: 'utility', does: 'With Toon World: equip to their monster and take it (as a Toon).'},
  'Toon Kingdom': {role: 'starter', does: 'Field Spell: on activation banish the top 3 of our Deck face-down. In the Field Zone it is named Toon World; they cannot target our Toon monsters, and when a Toon would be destroyed by battle or effect we can banish 1 card from the top instead. A second Kingdom replaces it; Toon World does not.'},
  'Infinite Impermanence': {role: 'handtrap', does: 'Target a face-up monster they control and negate its effects this turn. From the hand only while we control no cards; if it was Set and is still on the field when it resolves, Spells/Traps in its column are negated too.'},
  'Chimeratech Megafleet Dragon': {role: 'payoff', does: 'Send Toon Cyber Dragon (a Cyber Dragon) and Extra Monster Zone monsters from either field to the GY: 1200 ATK per material. Removes their Extra Monster Zone monsters.'},
  'Cyber Dragon Infinity': {role: 'payoff', does: 'Rank 6 on top of Cyber Dragon Nova: negates an activation by detaching.'},
  'Cyber Dragon Nova': {role: 'utility', does: 'Rank 5 from two Level 5 Machines (Toon Cyber Dragons); Infinity goes on top.'},
  'Underworld Goddess of the Closed World': {role: 'payoff', does: 'Link 5 from 4+ Effect Monsters, one of which may be the opponent\'s. When Link Summoned it can negate their face-up monsters; it is unaffected by their activated effects unless they target it, and once per turn it negates the activation of a card or effect that Special Summons from a GY.'},
  'Black Luster Soldier - Soldier of Chaos': {role: 'payoff', does: 'Link 3 from 3 monsters with different names. If Link Summoned using a Level 7+ monster, the opponent\'s card effects cannot target or destroy it (battle still can).'},
  'Knightmare Unicorn': {role: 'utility', does: 'Link 3: discard to shuffle a card into the Deck.'},
  'Knightmare Phoenix': {role: 'utility', does: 'Link 2: discard to destroy a Spell/Trap.'},
  'S:P Little Knight': {role: 'interruption', does: 'Link 2 from 2 Effect Monsters. If Link Summoned using a Fusion, Synchro, Xyz or Link Monster: banish a card on the field or in a GY (and we cannot attack directly that turn). When the opponent activates a card or effect (Quick Effect): target 2 face-up monsters on the field, at least 1 of them ours (both may be ours, and S:P itself may be one), and banish both until the End Phase.'},
  'I:P Masquerena': {role: 'interruption', does: 'Link 2 from 2 non-Link monsters. During their Main Phase (Quick Effect): Link Summon using materials we control, including it. The Link Monster made with it cannot be destroyed by the opponent\'s card effects.'},
  'Relinquished Anima': {role: 'utility', does: 'Link 1 from a Level 1 (The Black Stone of Legend): equips a monster it points to and takes its ATK.'},
  'Gravity Controller': {role: 'utility', does: 'Link 1 from a non-Link monster in the Extra Monster Zone. When it battles their Extra Monster Zone monster: shuffle both into the Deck. Not Link Material the turn it is Link Summoned.'}
 },
 routes: [
  {id: 'TO-01', from: ['Toon Table of Contents', 'Toon Bookmark', 'Terraforming', 'Toon Kingdom', 'Toon World'], steps: ['Get Toon World or Toon Kingdom onto the field first', 'The Black Stone of Legend (or One for One into it) brings Red-Eyes Toon Dragon from the Deck', 'Red-Eyes Toon Dragon Special Summons Toon Dark Magician or Black Luster Soldier from the hand', 'Toon Dark Magician (discard a Toon) Special Summons Toon Black Luster Soldier from the Deck', 'Set Toon Terror / Toon Mask'], ends: 'Toon Black Luster Soldier + Toon Dragon / Magician, Toon Terror set'},
  {id: 'R-PAGEFLIP', from: ['Toon Page-Flip'], steps: ['With Toon World: reveal three Toons, they pick one for you to summon'], ends: 'A free Toon body'},
  {id: 'R-MEGAFLEET', from: ['Toon Cyber Dragon'], steps: ['Going second: Special Summon Toon Cyber Dragon (only they control a monster)', 'Send it and their Extra Monster Zone monster for Chimeratech Megafleet Dragon'], ends: 'Their Extra Monster Zone boss gone'}
 ],
 locks: [
  {card: 'Toon World', lock: 'Toons cannot do much without it; Goblin Attack Force dies if it is destroyed', advice: 'play it (or Kingdom) first and protect it (Bookmark, Kingdom)'},
  {card: 'Toon Kingdom', lock: 'one Field Spell at a time: a second Toon Kingdom replaces the first and banishes 3 more cards (Toon World is a Continuous Spell and does not replace it)', advice: 'keep the spare Kingdom in hand for after the first is destroyed'},
  {card: 'Toon Black Luster Soldier', lock: 'cannot attack the turn it banishes', advice: ''}
 ],
 endPhase: []
};

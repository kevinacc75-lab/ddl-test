// r34 deck brain: Toon (Ink Riot), TCG 19 Oct 2026 list. Claude, 23 Oct 2026. STATUS: DRAFT, Akiza review pending.
// Same format as branded-brain.mjs. Every line was read against the printed card text.
export default {
 deck: 'toon',
 status: 'DRAFT (Claude, 23 Oct 2026). Akiza review pending.',
 plan: 'Get Toon World (or Toon Kingdom, which counts as Toon World and protects your Toons) onto the field first. Then Red-Eyes Toon Dragon and Toon Dark Magician bring out more Toons ignoring their summoning rules, building up to Toon Black Luster Soldier, which banishes a card. Toons attack directly while they have no Toons of their own; Toon Terror and the hand traps protect the turn.',
 roles: {starter: 'Starts a full combo on its own', extender: 'Adds to a combo that has started', payoff: 'The board the combo builds to', interruption: 'Stops the opponent on their turn', handtrap: 'Used from the hand on the opponent\'s turn', utility: 'Fills a gap: material, card draw or recovery'},
 cards: {
  'Toon Black Luster Soldier': {role: 'payoff', does: 'Special Summon it by Tributing Toons whose Levels total 8+ (or bring it out with Red-Eyes Toon Dragon / Toon Dark Magician / Page-Flip ignoring that). With Toon World: banish a card once per turn; attacks directly when they have no Toons.'},
  'Toon Dark Magician': {role: 'extender', does: 'Once per turn: discard a Toon card to Special Summon a Toon from the Deck ignoring its summoning rules (Black Luster Soldier), or add a Toon Spell/Trap.', links: {summon: ['Toon Black Luster Soldier', 'Red-Eyes Toon Dragon', 'Toon Harpie Lady', 'Toon Cyber Dragon']}},
  'Red-Eyes Toon Dragon': {role: 'extender', does: 'Once per turn: Special Summon another Toon from the hand ignoring its summoning rules. The Black Stone of Legend summons it from the Deck.', links: {summon: ['Toon Black Luster Soldier', 'Toon Dark Magician']}},
  'Toon Cyber Dragon': {role: 'utility', does: 'Special Summon it from the hand if only they control a monster. Material for Chimeratech Megafleet Dragon.'},
  'Toon Goblin Attack Force': {role: 'utility', does: 'A 2300 ATK Level 4 beater that attacks directly with Toon World out.'},
  'Toon Harpie Lady': {role: 'extender', does: 'With Toon World: Special Summon it from the hand and, with another Toon out, destroy a Spell/Trap of theirs.'},
  'Mulcharmy Fuwalos': {role: 'handtrap', does: 'With no cards on your field: draw each time they Special Summon from the Deck or Extra Deck.'},
  'Ash Blossom & Joyous Spring': {role: 'handtrap', does: 'Negates a search, a Special Summon from the Deck or a send from the Deck on their turn.'},
  'Mulcharmy Purulia': {role: 'handtrap', does: 'With no cards on your field: draw each time they add cards to the hand outside the Draw Phase.'},
  'The Black Stone of Legend': {role: 'starter', does: 'Tribute it: Special Summon Red-Eyes Toon Dragon (a Level 7 or lower Red-Eyes) from the Deck. From the GY it returns to the hand by shuffling a Red-Eyes back.', links: {summon: ['Red-Eyes Toon Dragon']}},
  'One for One': {role: 'starter', does: 'Send a monster from the hand to the GY: Special Summon a Level 1 (The Black Stone of Legend) from the hand or Deck.', links: {summon: ['The Black Stone of Legend']}},
  'Shadow Toon': {role: 'utility', does: 'With Toon World: burn them for one of their monster\'s ATK.'},
  'Raigeki': {role: 'utility', does: 'Destroy all their monsters.'},
  'Harpie\'s Feather Duster': {role: 'utility', does: 'Destroy all their Spells and Traps.'},
  'Terraforming': {role: 'starter', does: 'Add a Field Spell: Toon Kingdom.', links: {search: ['Toon Kingdom']}},
  'Triple Tactics Thrust': {role: 'utility', does: 'After they activate a monster effect: add a Normal Trap (Toon Mask).'},
  'Mimicat': {role: 'utility', does: 'With Toon World and a Toon: take a monster or Spell/Trap from their GY.'},
  'Toon Table of Contents': {role: 'starter', does: 'Add any Toon card: Toon World / Kingdom first, otherwise a Toon monster.', links: {search: ['Toon World', 'Toon Kingdom', 'Toon Dark Magician', 'Red-Eyes Toon Dragon', 'Toon Black Luster Soldier']}},
  'Toon Bookmark': {role: 'starter', does: 'Add Toon World or a card that mentions it. From the GY it saves Toon World from destruction.', links: {search: ['Toon World', 'Toon Kingdom', 'Toon Page-Flip', 'Comic Hand']}},
  'Toon Mask': {role: 'interruption', does: 'Trap with Toon World: Special Summon a Toon from the hand or Deck with a Level up to their monster\'s Level/Rank, ignoring its rules.'},
  'Toon Terror': {role: 'interruption', does: 'Counter Trap with Toon World and a Toon: negate a Spell, Trap or monster effect and destroy it.'},
  'Toon Page-Flip': {role: 'extender', does: 'Quick-Play with Toon World: reveal 3 different Toons from the Deck; they pick one at random and you Special Summon it ignoring its rules.'},
  'Toon World': {role: 'starter', does: 'Pay 1000 LP. Everything Toon needs it on the field.'},
  'Comic Hand': {role: 'utility', does: 'With Toon World: equip to their monster and take it (as a Toon).'},
  'Toon Kingdom': {role: 'starter', does: 'Field Spell named Toon World on the field: banish your top 3 face-down to activate. Your Toons cannot be targeted, and you banish the top card of the Deck instead of losing a Toon.'},
  'Infinite Impermanence': {role: 'handtrap', does: 'Negates a face-up monster on their field for the turn.'},
  'Chimeratech Megafleet Dragon': {role: 'payoff', does: 'Send Toon Cyber Dragon (a Cyber Dragon) and Extra Monster Zone monsters from either field to the GY: 1200 ATK per material. Removes their Extra Monster Zone monsters.'},
  'Cyber Dragon Infinity': {role: 'payoff', does: 'Rank 6 on top of Cyber Dragon Nova: negates an activation by detaching.'},
  'Cyber Dragon Nova': {role: 'utility', does: 'Rank 5 from two Level 5 Machines (Toon Cyber Dragons); Infinity goes on top.'},
  'Underworld Goddess of the Closed World': {role: 'payoff', does: 'Link 5 that can use one of their monsters: negates their monsters on summon.'},
  'Black Luster Soldier - Soldier of Chaos': {role: 'payoff', does: 'Link 3 from three different names; with a Level 7+ material it is untargetable and indestructible by them.'},
  'Knightmare Unicorn': {role: 'utility', does: 'Link 3: discard to shuffle a card into the Deck.'},
  'Knightmare Phoenix': {role: 'utility', does: 'Link 2: discard to destroy a Spell/Trap.'},
  'S:P Little Knight': {role: 'interruption', does: 'Link 2: banishes a card when made from an Extra Deck monster; on their turn banishes two monsters until the End Phase.'},
  'I:P Masquerena': {role: 'interruption', does: 'Link 2: on their Main Phase, Link Summon using it.'},
  'Relinquished Anima': {role: 'utility', does: 'Link 1 from a Level 1 (The Black Stone of Legend): equips a monster it points to and takes its ATK.'},
  'Gravity Controller': {role: 'utility', does: 'Link 1 from an Extra Monster Zone monster: returns their Extra Monster Zone monster to the Deck in battle.'}
 },
 routes: [
  {id: 'TO-01', from: ['Toon Table of Contents', 'Toon Bookmark', 'Terraforming', 'Toon Kingdom', 'Toon World'], steps: ['Get Toon World or Toon Kingdom onto the field first', 'The Black Stone of Legend (or One for One into it) brings Red-Eyes Toon Dragon from the Deck', 'Red-Eyes Toon Dragon Special Summons Toon Dark Magician or Black Luster Soldier from the hand', 'Toon Dark Magician (discard a Toon) Special Summons Toon Black Luster Soldier from the Deck', 'Set Toon Terror / Toon Mask'], ends: 'Toon Black Luster Soldier + Toon Dragon / Magician, Toon Terror set'},
  {id: 'R-PAGEFLIP', from: ['Toon Page-Flip'], steps: ['With Toon World: reveal three Toons, they pick one for you to summon'], ends: 'A free Toon body'},
  {id: 'R-MEGAFLEET', from: ['Toon Cyber Dragon'], steps: ['Going second: Special Summon Toon Cyber Dragon (only they control a monster)', 'Send it and their Extra Monster Zone monster for Chimeratech Megafleet Dragon'], ends: 'Their Extra Monster Zone boss gone'}
 ],
 locks: [
  {card: 'Toon World', lock: 'Toons cannot do much without it; Goblin Attack Force dies if it is destroyed', advice: 'play the Field Spell first and protect it (Bookmark, Kingdom)'},
  {card: 'Toon Kingdom', lock: 'only one Field Spell at a time: a second Toon Kingdom or Toon World just replaces the first (and Kingdom banishes 3 more cards)', advice: 'keep the spare copy in hand for after the first is destroyed'},
  {card: 'Toon Black Luster Soldier', lock: 'cannot attack the turn it banishes', advice: ''}
 ],
 endPhase: []
};

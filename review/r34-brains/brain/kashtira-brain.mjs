// r34 deck brain: Kashtira (Sealed Horizon), TCG 19 Oct 2026 list. Claude, 23 Oct 2026. STATUS: DRAFT, Akiza review
// pending. Same format as branded-brain.mjs. Every line was read against the printed card text.
export default {
 deck: 'kashtira',
 status: 'DRAFT (Claude, 23 Oct 2026). Akiza review pending.',
 plan: 'Summon two Level 7s and make Kashtira Shangri-Ira, which locks a zone every time one of their cards is banished face-down and pulls a Kashtira from the Deck each Standby. The Level 7 Kashtira summon themselves when you control no monsters and each searches once (Fenrir a monster, Unicorn a Spell, Ogre a Trap); Riseheart becomes Level 7 by banishing their top 3 cards face-down.',
 roles: {starter: 'Starts a full combo on its own', extender: 'Adds to a combo that has started', payoff: 'The board the combo builds to', interruption: 'Stops the opponent on their turn', handtrap: 'Used from the hand on the opponent\'s turn', utility: 'Fills a gap: material, card draw or recovery'},
 cards: {
  'Kashtira Fenrir': {role: 'starter', does: 'Special Summon it if you control no monsters. Main Phase: add a Kashtira monster (Riseheart). When it attacks or they activate a monster effect: banish one of their face-up cards face-down.', links: {search: ['Kashtira Riseheart', 'Kashtira Unicorn', 'Kashtira Ogre']}},
  'Kashtira Unicorn': {role: 'starter', does: 'Special Summon it if you control no monsters. Main Phase: add a Kashtira Spell (Kashtiratheosis or Birth). On attack or their monster effect: banish a card from their Extra Deck face-down.', links: {search: ['Kashtiratheosis', 'Kashtira Birth']}},
  'Kashtira Riseheart': {role: 'extender', does: 'With a Kashtira out: Special Summon it from the hand (only Xyz from the Extra Deck that turn). Summoned this turn: banish a Kashtira card from the Deck to banish their top 3 face-down and become Level 7, the second Level 7 for Shangri-Ira.'},
  'Kashtira Ogre': {role: 'starter', does: 'Special Summon it if you control no monsters. Main Phase: add a Kashtira Trap (Big Bang or Preparations). On attack or their monster effect: excavate their top 5 and banish one face-down.', links: {search: ['Kashtira Big Bang', 'Kashtira Preparations']}},
  'Tearlaments Kashtira': {role: 'extender', does: 'Quick Effect in the Main Phase: Special Summon it from the hand by banishing a Kashtira card from the hand or GY. Summoned: send the top 3 of either Deck to the GY. A Level 7 body on either turn.'},
  'Scareclaw Kashtira': {role: 'extender', does: 'Quick Effect in the Main Phase: Special Summon it from the hand by banishing a Kashtira card. Your Kashtira negate the monsters they battle.'},
  'The Ascended of Thunder': {role: 'utility', does: 'Pay 3000 LP to Special Summon a Level 7 body; gain 5000 if they destroy it. Only worth it with something to Xyz into.'},
  'Kumongous, the Sticky String Kaiju': {role: 'interruption', does: 'Tribute one of their monsters to put it on their field; with Kaiju Counters, newly summoned monsters cannot attack and are negated.'},
  'Radian, the Multidimensional Kaiju': {role: 'interruption', does: 'Tribute one of their monsters to put it on their field; makes a Level 7 token with counters.'},
  'Interrupted Kaiju Slumber': {role: 'utility', does: 'Going second: destroy every monster, then put a Kaiju on each side. From the GY (a later turn): add a Kaiju.'},
  'Kashtiratheosis': {role: 'extender', does: 'Target a Kashtira you control: Special Summon a Kashtira with a different Attribute from the Deck in Defense Position (a second Level 7). Only Xyz afterwards. Banished: add back a banished Kashtira card.', links: {summon: ['Kashtira Fenrir', 'Kashtira Unicorn', 'Kashtira Ogre', 'Kashtira Riseheart']}},
  'Kashtira Birth': {role: 'extender', does: 'Continuous Spell: Normal Summon Level 7s without Tributing; once per turn revive a banished or GY Kashtira; banishes 3 of their GY cards when they use a Spell.'},
  'Kashtira Overlap': {role: 'utility', does: 'Quick-Play: banish a 1500 / 2100 monster (Riseheart) for +1500 ATK; banished: negate one of their Effect Monsters.'},
  'Sacred Sword of Seven Stars': {role: 'utility', does: 'Banish a Level 7 from the hand or field: draw 2.'},
  'Kashtira Big Bang': {role: 'interruption', does: 'Trap: with a Kashtira Xyz out, each player with 2+ monsters banishes down to one, face-down. Banished: take a Kashtira back from an Xyz\'s materials and summon it.'},
  'Macro Cosmos': {role: 'interruption', does: 'Continuous Trap: while face-up, every card sent to the GY is banished instead.'},
  'Waking the Dragon': {role: 'interruption', does: 'Set Trap: if their effect removes it, Special Summon any monster from the Deck or Extra Deck.'},
  'Kashtira Preparations': {role: 'extender', does: 'Continuous Trap: on either turn Special Summon a Kashtira from the hand or banishment; strips a card from their hand when they use a Trap.'},
  'Kashtira Shangri-Ira': {role: 'payoff', does: 'Rank 7 from 2+ Level 7s. Each time their card is banished face-down, lock one of their zones. Each Standby: Special Summon a Kashtira from the Deck. Detaches to survive.'},
  'Number 11: Big Eye': {role: 'payoff', does: 'Rank 7: detach to take control of one of their monsters.'},
  'Dark Armed, the Dragon of Annihilation': {role: 'utility', does: 'Rank 7: detach to destroy one of their cards.'},
  'Raidraptor - Rising Rebellion Falcon': {role: 'utility', does: 'Needs five Level 13 Winged Beasts: not summonable from this deck (an Extra Deck filler).'},
  'Infinitrack Mountain Smasher': {role: 'utility', does: 'Rank 7: steals material by battle and pumps itself.'},
  'Number 28: Titanic Moth': {role: 'utility', does: 'Rank 7: attacks directly alone and burns for their hand.'},
  'Kerzebs, the Gaoled Glutton': {role: 'interruption', does: 'Rank 7: absorbs a Normal or Quick-Play Spell they activate.'},
  'Virtual World Kyubi - Shenshen': {role: 'utility', does: 'Level 9 Synchro; this deck has almost no Tuners, so it is rarely made.'},
  'Bloom Diva the Melodious Choir': {role: 'utility', does: 'Needs Melodious materials: not summonable from this deck (an Extra Deck filler).'}
 },
 routes: [
  {id: 'K-01', from: ['Kashtira Fenrir', 'Kashtira Unicorn', 'Kashtira Ogre'], steps: ['With no monsters, Special Summon a Level 7 Kashtira and use its search (Fenrir adds Riseheart)', 'Special Summon Riseheart; banish a Kashtira card from the Deck so it becomes Level 7 (their top 3 banished face-down)', 'Kashtiratheosis or Kashtira Birth adds a second body', 'Two Level 7s: Kashtira Shangri-Ira'], ends: 'Shangri-Ira, often with a second Kashtira and Birth'},
  {id: 'R-QUICK', from: ['Tearlaments Kashtira', 'Scareclaw Kashtira'], steps: ['On either Main Phase: Special Summon them from the hand by banishing a Kashtira card', 'With another Level 7 out, Xyz into Shangri-Ira or Big Eye'], ends: 'A Rank 7 made on their turn too'},
  {id: 'R-KAIJU', from: ['Kumongous, the Sticky String Kaiju', 'Radian, the Multidimensional Kaiju', 'Interrupted Kaiju Slumber'], steps: ['Going second: tribute their best monster for a Kaiju (or Slumber destroys everything)', 'Then build Level 7s into Shangri-Ira'], ends: 'Their boss gone'}
 ],
 locks: [
  {card: 'Kashtira Riseheart', lock: 'only Xyz Monsters from the Extra Deck after its summon effect', advice: ''},
  {card: 'Kashtiratheosis', lock: 'only Xyz Monsters from the Extra Deck afterwards', advice: ''},
  {card: 'Kashtira Fenrir', lock: 'its self-summon needs an empty field', advice: 'summon the free Level 7 before anything else'}
 ],
 endPhase: ['Shangri-Ira: Special Summon a Kashtira from the Deck in each Standby Phase']
};

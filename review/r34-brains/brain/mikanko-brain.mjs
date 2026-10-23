// r34 deck brain: Mikanko / Kaiju (Borrowed Bosses), TCG 19 Oct 2026 list. Claude, 23 Oct 2026. STATUS: DRAFT, Akiza
// review pending. Same format as branded-brain.mjs. Every line was read against the printed card text. Route ids that are
// not book lines start with "R-" (the Mikanko book has no scripted lines yet; search decides its turns).
export default {
 deck: 'mikanko',
 status: 'DRAFT (Claude, 23 Oct 2026). Akiza review pending.',
 plan: 'A control deck that uses the opponent\'s monsters against them. Mikanko monsters wear Equip Spells, which turn on their searches and protection and send battle damage back. Kaiju and Lava Golem remove a boss by tributing it; Spiritwalk and Reflection Rondo steal monsters. Going first it sets up Uzuhime, equips and traps; going second it breaks the board.',
 roles: {starter: 'Starts a full combo on its own', extender: 'Adds to a combo that has started', payoff: 'The board the combo builds to', interruption: 'Stops the opponent on their turn', handtrap: 'Used from the hand on the opponent\'s turn', utility: 'Fills a gap: material, card draw or recovery'},
 cards: {
  'Ohime the Manifested Mikanko': {role: 'starter', does: 'Reveal it from the hand: add any Mikanko card from the Deck, then discard 1. Quick Effect: equip an Equip Spell from the GY to a monster. Battle damage it would take goes to the opponent; it is not destroyed by battle.', links: {search: ['Mikanko Water Arabesque', 'Mikanko Fire Dance', 'Mikanko Shinbu - Noble Twins', 'Sanaki the Mikanko Devotee', 'Mikanko Spiritwalk']}},
  'Sanaki the Mikanko Devotee': {role: 'extender', does: 'When an Equip Card is equipped to it: Special Summon a non-Illusion Mikanko (Hu-Li or Ha-Re) from the Deck; only Mikanko monsters from the Extra Deck for the rest of the turn. Returns a Mikanko card to the hand. Sent to the GY: it equips itself to a monster as an Equip Spell.', links: {summon: ['Hu-Li the Jewel Mikanko', 'Ha-Re the Sword Mikanko']}},
  'Hu-Li the Jewel Mikanko': {role: 'extender', does: 'Equipped: add a Mikanko Trap (Spiritwalk) from the Deck. While you control an Equip Card, your Mikanko cards cannot be targeted. Level 3 for Uzuhime.', links: {search: ['Mikanko Spiritwalk']}},
  'Ha-Re the Sword Mikanko': {role: 'extender', does: 'Equipped: add a Mikanko Equip Spell from the Deck. Level 3 for Uzuhime.', links: {search: ['Mikanko Water Arabesque', 'Mikanko Fire Dance', 'Mikanko Dance - Mayowashidori', 'Mikanko Reflection Rondo']}},
  'Lava Golem': {role: 'interruption', does: 'Special Summon it to their field by tributing two of their monsters (a board breaker going second). They take 1000 each Standby Phase.'},
  'Jizukiru, the Star Destroying Kaiju': {role: 'interruption', does: 'Special Summon it to their field by tributing one of their monsters (their best one). On your field it negates a single-target effect and destroys a card, using Kaiju Counters.'},
  'Thunder King, the Lightningstrike Kaiju': {role: 'interruption', does: 'Tributes one of their monsters like Jizukiru. With 3 Kaiju Counters it stops them activating anything that turn and attacks up to three times.'},
  'Preparation of Rites': {role: 'starter', does: 'Add a Level 7 or lower Ritual Monster (Ohime) from the Deck, and a Ritual Spell back from the GY.', links: {search: ['Ohime the Manifested Mikanko']}},
  'Mikanko Shinbu - Noble Twins': {role: 'starter', does: 'Send a Mikanko card from the Deck to the GY (Sanaki, which equips itself, or Mayowashidori, which revives a Mikanko from the GY), then Set a Mikanko Spell/Trap from the Deck. Only Mikanko monsters from the Extra Deck afterwards. From the GY: detach a material to Special Summon a Mikanko Ritual Monster (Ohime) from the hand or Deck.', links: {send: ['Sanaki the Mikanko Devotee', 'Mikanko Dance - Mayowashidori'], summon: ['Ohime the Manifested Mikanko']}},
  'Mikanko Water Arabesque': {role: 'starter', does: 'Equip Spell (the monster is not destroyed by effects). In your Main Phase: Special Summon a differently named Mikanko from the hand or Deck, move this card onto it and return the old one to the hand. Each move triggers Hu-Li, Ha-Re or Sanaki again.', links: {summon: ['Hu-Li the Jewel Mikanko', 'Ha-Re the Sword Mikanko', 'Sanaki the Mikanko Devotee']}},
  'Mikanko Fire Dance': {role: 'extender', does: 'Special Summon a Mikanko from the hand or GY equipped with it (protected from effects); you may also give them back a monster from their GY with its effects negated (material for Lava Golem or a Kaiju).'},
  'The Great Mikanko Ceremony': {role: 'extender', does: 'Quick-Play: Special Summon a Mikanko from the hand ignoring its Summoning conditions (Ohime without a Ritual); it returns to the hand in their End Phase. From the GY: send a Mikanko card from the Deck to the GY.', links: {summon: ['Ohime the Manifested Mikanko']}},
  'Mikanko Dance - Mayowashidori': {role: 'extender', does: 'Equip Spell. From the GY: revive a Mikanko from the GY equipped with it (banished when it leaves). After your Mikanko battles: bounce a card.'},
  'Mikanko Reflection Rondo': {role: 'interruption', does: 'Equip to their monster: while you control a Mikanko, you control it and nobody can use its effects.'},
  'Double-Edged Sword': {role: 'utility', does: 'Equip: +2000 ATK and both players take the battle damage, which Ohime, Uzuhime and equipped Hu-Li / Ha-Re send back to the opponent.'},
  'Forbidden Droplet': {role: 'handtrap', does: 'Quick-Play: send cards from the hand or field to negate and halve their monsters; they cannot respond with cards of the sent types.'},
  'Triple Tactics Thrust': {role: 'utility', does: 'After they activate a monster effect this turn: add a Normal Trap from the Deck.'},
  'Raigeki': {role: 'utility', does: 'Destroy all their monsters (going second).'},
  'Lightning Storm': {role: 'utility', does: 'With no face-up cards of your own: destroy all their Attack Position monsters or all their Spells/Traps.'},
  'Harpie\'s Feather Duster': {role: 'utility', does: 'Destroy all their Spells and Traps.'},
  'Cosmic Cyclone': {role: 'utility', does: 'Pay 1000: banish a Spell/Trap.'},
  'Mulcharmy Fuwalos': {role: 'handtrap', does: 'With no cards on your field: discard it to draw each time they Special Summon from the Deck or Extra Deck.'},
  'Mikanko Spiritwalk': {role: 'interruption', does: 'Trap: equip their face-up monster to your Mikanko as an Equip Spell (removing it and triggering Hu-Li / Ha-Re / Sanaki); with a Ritual Monster out, burn 500 per Equip. From the GY: Special Summon a banished or hand Mikanko.'},
  'Uzuhime the Manifested Mikanko': {role: 'payoff', does: 'Rank 3 from two Level 3 Mikanko (Hu-Li, Ha-Re, Sanaki). Special Summoned: add an Equip Spell from the Deck or GY. Not destroyed by battle; battle damage goes to them; attacks again by detaching.'},
  'Number 49: Fortune Tune': {role: 'utility', does: 'Rank 3 from two Level 3s: untargetable, detaches instead of being destroyed, gains 500 LP each Standby.'},
  'Downerd Magician': {role: 'utility', does: 'Rank 4 that can go on top of a Rank 3 in Main Phase 2.'},
  'Divine Arsenal AA-ZEUS - Sky Thunder': {role: 'utility', does: 'Goes on an Xyz that battled: detach 2 to send every other card on the field to the GY.'},
  'Super Starslayer TY-PHON - Sky Crisis': {role: 'utility', does: 'Goes on their highest-ATK monster after they Special Summon twice from the Extra Deck; stops 3000+ ATK effects and bounces a monster.'},
  'Salamangreat Almiraj': {role: 'utility', does: 'Link 1 from a low-ATK Normal Summoned monster: tribute it to protect a monster.'},
  'S:P Little Knight': {role: 'interruption', does: 'Link 2: banishes a card when made from an Extra Deck monster; banishes two monsters until the End Phase on their turn.'},
  'Knightmare Phoenix': {role: 'utility', does: 'Link 2: discard to destroy a Spell/Trap.'},
  'Lyna the Light Charmer, Lustrous': {role: 'utility', does: 'Link 2 with a LIGHT: revive a LIGHT monster from their GY to your side.'},
  'Dharc the Dark Charmer, Gloomy': {role: 'utility', does: 'Link 2 with a DARK: revive a DARK monster from their GY to your side.'},
  'I:P Masquerena': {role: 'interruption', does: 'Link 2: on their Main Phase, Link Summon using it (protects the new Link).'},
  'Knightmare Unicorn': {role: 'utility', does: 'Link 3: discard to shuffle a card into the Deck.'},
  'Accesscode Talker': {role: 'payoff', does: 'Link 4: big ATK; banish Links to destroy their cards, and nobody can respond.'},
  'Underworld Goddess of the Closed World': {role: 'payoff', does: 'Link 5 that can use one of their monsters: negates their monsters on summon and stops GY revivals.'}
 },
 routes: [
  {id: 'MK-UZU', from: ['Ohime the Manifested Mikanko', 'Ha-Re the Sword Mikanko', 'Hu-Li the Jewel Mikanko', 'Mikanko Water Arabesque', 'Mikanko Fire Dance'], steps: ['Reveal Ohime: add Ha-Re if you have no Mikanko to summon, otherwise Water Arabesque; discard Mayowashidori or a going-second card', 'Fire Dance or a Normal Summon puts Ha-Re on the field; equipping it adds Water Arabesque', 'Water Arabesque on Ha-Re: Special Summon Sanaki from the Deck (Sanaki, now equipped, Special Summons Hu-Li); Ha-Re returns to the hand', 'Two Level 3 Mikanko: Uzuhime, which adds another Equip Spell'], ends: 'Uzuhime + a Level 3 Mikanko, Spiritwalk set'},
  {id: 'R-OHIME', from: ['Ohime the Manifested Mikanko', 'Preparation of Rites'], steps: ['Preparation of Rites adds Ohime', 'Reveal Ohime: add Water Arabesque (or Fire Dance), discard 1', 'Equip and move Arabesque between Mikanko: each new equip triggers Hu-Li (Spiritwalk), Ha-Re (an Equip Spell) or Sanaki (a Mikanko from the Deck)'], ends: 'Equipped Mikanko, a Trap set, Equip Spells in hand'},
  {id: 'R-TWINS', from: ['Mikanko Shinbu - Noble Twins'], steps: ['Noble Twins: send Sanaki (it equips itself) or Mayowashidori, and Set a Mikanko Spell/Trap', 'Two Level 3 Mikanko on the field: Uzuhime, which adds an Equip Spell', 'Later: banish Noble Twins and detach to Special Summon Ohime from the Deck'], ends: 'Uzuhime + equips; Ohime on the way'},
  {id: 'R-KAIJU', from: ['Jizukiru, the Star Destroying Kaiju', 'Thunder King, the Lightningstrike Kaiju', 'Lava Golem'], steps: ['Going second: tribute their best monster (an Extra Deck boss first) for a Kaiju, two for Lava Golem', 'Then Spiritwalk / Reflection Rondo take another, and Raigeki or Lightning Storm clear the rest'], ends: 'Their board broken'}
 ],
 locks: [
  {card: 'Mikanko Shinbu - Noble Twins', lock: 'only Mikanko monsters from the Extra Deck after it resolves', advice: 'Links and other Xyz first'},
  {card: 'Sanaki the Mikanko Devotee', lock: 'only Mikanko monsters from the Extra Deck after its summon effect', advice: ''},
  {card: 'Jizukiru, the Star Destroying Kaiju', lock: 'only one Kaiju on the field', advice: 'a second Kaiju goes to your side only when they already have one'}
 ],
 endPhase: ['The Great Mikanko Ceremony\'s monster returns to the hand in their End Phase', 'Lava Golem burns its controller 1000 each Standby Phase']
};

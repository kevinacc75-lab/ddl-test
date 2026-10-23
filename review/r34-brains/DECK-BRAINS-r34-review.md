# Deck brains r34 — for ChatGPT's card-by-card rules review (Claude, 23 Oct 2026)

Source: r18 commit beaa21f (r34 candidate, unpublished). Each section is generated from `dist/ai/brain/<deck>-brain.mjs`; the SHA-256 is of that file. Deck lists are the 19 Oct TCG variants in `dist/decks.json`. DRAFT — not yet reviewed by Akiza. Please report: wrong card text claims, impossible links/routes, missing locks, wrong roles.

## Crimson Abyss (branded)

SHA-256 `0806e2e8790b9fa43401e5f7ab138c6cbce90cad47892e66df418fc15e3ec1c9` · status: DRAFT (Claude, 23 Oct 2026; V53-QC route corrected after ChatGPT RELAY-013 N5). Akiza review pending.

**Main (40):** 3x Aluber the Jester of Despia, 3x Mulcharmy Fuwalos, 3x Ash Blossom & Joyous Spring, 2x Fallen of Albaz, 1x Fallen of the White Dragon, 2x Guiding Quem, the Virtuous, 2x Blazing Cartesia, the Virtuous, 1x Incredible Ecclesia, the Virtuous, 1x Dogmatika Fleurdelis, the Knighted, 1x Springans Kitt, 1x Tri-Brigade Mercourier, 1x Albion the Shrouded Dragon, 1x Bystial Magnamhut, 1x Bystial Saronir, 1x Phara the Primordial Goddess, 3x Fusion Deployment, 3x Nadir Servant, 3x Super Polymerization, 2x The Fallen & The Virtuous, 1x Branded Fusion, 1x Branded Opening, 1x Branded in High Spirits, 1x Branded in Red, 1x Branded Retribution

**Extra (15):** 2x Mirrorjade the Iceblade Dragon, 1x Lubellion the Searing Dragon, 2x Granguignol the Dusk Dragon, 2x The Dragon that Devours the Dogma, 1x Titaniklad the Ash Dragon, 1x Rindbrumm the Striking Dragon, 1x Albion the Sanctifire Dragon, 1x Alba-Lenatus the Abyss Dragon, 1x Garura, Wings of Resonant Life, 1x Mixousia the Confounder, 1x Predaplant Dragostapelia, 1x Despian Luluwalilith

**Plan:** Make Mirrorjade on turn 1, usually through Lubellion, with a second Fusion or Cartesia ready for their turn. Most lines need one starter: Aluber, Branded Fusion, Branded Opening, Fusion Deployment or Fallen of the White Dragon.

### Cards
- **Aluber the Jester of Despia** — starter: Normal or Special Summon: add any Branded Spell/Trap from the Deck, usually Branded Fusion. _(links — search: Branded Fusion, Branded Opening, Branded in High Spirits, Branded in Red, Branded Retribution, The Fallen & The Virtuous)_
- **Branded Fusion** — starter: Fusion Summons an Albaz Fusion Monster using monsters from the hand, Deck or field, so Fallen of Albaz and a DARK monster can come straight from the Deck. Locks you to Fusion Monsters from the Extra Deck. _(links — fusion: Lubellion the Searing Dragon, Albion the Sanctifire Dragon, Titaniklad the Ash Dragon, The Dragon that Devours the Dogma, Rindbrumm the Striking Dragon, Alba-Lenatus the Abyss Dragon; uses: Fallen of Albaz)_
- **Branded Opening** — starter: Discard 1: take a Despia monster from the Deck (Aluber, or Guiding Quem, which counts as Despia) to the hand or the field. Later, banish it from the GY to save a Fusion Monster from destruction. _(links — search: Aluber the Jester of Despia, Guiding Quem, the Virtuous; summon: Aluber the Jester of Despia, Guiding Quem, the Virtuous)_
- **Fusion Deployment** — starter: Reveal a Fusion Monster and Special Summon one of its named materials from the hand or Deck: Fallen of Albaz (any Albaz Fusion) or Blazing Cartesia (Granguignol). _(links — summon: Fallen of Albaz, Blazing Cartesia, the Virtuous)_
- **Fallen of the White Dragon** — starter: Send an Albaz Fusion from the Extra Deck to the GY to Special Summon it from the hand (Titaniklad is the usual cost), then Special Summon Incredible Ecclesia from the Deck. Counts as Fallen of Albaz. Locks you to Level 8 Fusion or Synchro Monsters. _(links — send: Titaniklad the Ash Dragon; summon: Incredible Ecclesia, the Virtuous)_
- **Fallen of Albaz** — utility: The core Fusion Material. Its own summon effect only fuses with the opponent's monsters, so going first it is sent or summoned by other cards instead of Normal Summoned. _(links — materialFor: Mirrorjade the Iceblade Dragon, Lubellion the Searing Dragon, Albion the Sanctifire Dragon, Titaniklad the Ash Dragon, The Dragon that Devours the Dogma, Rindbrumm the Striking Dragon, Alba-Lenatus the Abyss Dragon)_
- **Guiding Quem, the Virtuous** — extender: Normal Summon: send Fallen of Albaz (or a card that mentions it) from the Deck to the GY, which turns on Blazing Cartesia and Branded in Red. When a card leaves the Extra Deck, revive an Albaz monster from the GY. A LIGHT Spellcaster for Albion the Sanctifire. _(links — send: Fallen of Albaz; summon: Fallen of Albaz; materialFor: Albion the Sanctifire Dragon, Granguignol the Dusk Dragon)_
- **Blazing Cartesia, the Virtuous** — extender: With Fallen of Albaz on the field or in the GY it Special Summons itself; then, in either Main Phase, it Fusion Summons a Level 8+ Fusion from the hand or field (a Quick Effect, so it can also fuse on their turn). Returns to the hand in the End Phase if a Fusion went to the GY. _(links — fusion: Granguignol the Dusk Dragon, Mirrorjade the Iceblade Dragon, Albion the Sanctifire Dragon; materialFor: Granguignol the Dusk Dragon)_
- **Incredible Ecclesia, the Virtuous** — extender: Quick Effect: Tribute it to Special Summon Fallen of Albaz from the hand or Deck. Comes from the Deck with Fallen of the White Dragon; returns to the hand in the End Phase if a Fusion went to the GY. Turns on the revive mode of The Fallen & The Virtuous. _(links — summon: Fallen of Albaz)_
- **Dogmatika Fleurdelis, the Knighted** — interruption: Quick Effect while a monster Special Summoned from the Extra Deck is on the field: Special Summon it from the hand and, with another Dogmatika, negate a monster. Kept in hand for their turn; never Tribute Summoned.
- **Springans Kitt** — extender: With an Albaz Fusion on the field or in the GY it Special Summons itself; on summon it adds a Branded Spell/Trap from the Deck, GY or banishment (Branded Fusion again). Normal Summoned going first for the same search. _(links — search: Branded Fusion, Branded in High Spirits, Branded in Red, Branded Opening, Branded Retribution)_
- **Tri-Brigade Mercourier** — interruption: While we control an Albaz Fusion: send it from the hand or field to negate a monster effect. If banished (for example as Branded in Red material) it adds an Albaz monster from the Deck. _(links — search: Fallen of Albaz)_
- **Albion the Shrouded Dragon** — extender: Named Fallen of Albaz on the field and in the GY. Send Albaz or a Branded Spell/Trap from the hand to Special Summon it, or from the Deck to cycle it (it goes to the bottom and you draw). _(links — send: Fallen of Albaz, Branded in High Spirits, Branded Opening, Branded Retribution, The Fallen & The Virtuous)_
- **Bystial Magnamhut** — utility: Banish a LIGHT or DARK monster from either GY to Special Summon it (a Quick Effect if they control a monster). End Phase: add a Dragon from the Deck or GY. A DARK Dragon for Lubellion and a discard for Branded in High Spirits.
- **Bystial Saronir** — utility: Special Summons itself like Magnamhut. Sent to the GY: send a Branded Spell/Trap from the Deck to the GY (for Kitt or Branded Retribution). _(links — send: Branded Retribution, Branded in High Spirits)_
- **Phara the Primordial Goddess** — utility: Reveal it with a Spell in hand: nobody can respond to that Spell this turn or next, so Ash Blossom cannot stop Branded Fusion. Sent to the GY by a Spell (Branded Opening discard, Super Polymerization material) it revives and takes their strongest monster.
- **Nadir Servant** — utility: Send an Extra Deck monster to the GY (Titaniklad) and add Fallen of Albaz or a Dogmatika. It locks the Extra Deck for the rest of the turn, so it is played last. _(links — send: Titaniklad the Ash Dragon; search: Fallen of Albaz, Dogmatika Fleurdelis, the Knighted, Guiding Quem, the Virtuous)_
- **Super Polymerization** — interruption: Discard 1: Fusion Summon using monsters from either field, and nobody can respond. Usually set and used on their turn on their best monster. Going first with no other Fusion Spell it makes Lubellion from our own Albaz + DARK monster. _(links — fusion: Mirrorjade the Iceblade Dragon, Lubellion the Searing Dragon, The Dragon that Devours the Dogma)_
- **The Fallen & The Virtuous** — interruption: Quick-Play: send an Albaz Fusion from the Extra Deck to destroy a face-up card, or with an Ecclesia on our field or in our GY revive a monster from either GY. Its Extra Deck cost also triggers Guiding Quem. _(links — send: Titaniklad the Ash Dragon, Granguignol the Dusk Dragon)_
- **Branded in High Spirits** — extender: Reveal a Dragon in hand and send a Level 8 Dragon Fusion with 2500 ATK or DEF (Titaniklad) to the GY; discard the Dragon to add Fallen of Albaz or a card that mentions it. Returns in the End Phase if a Fusion went to the GY. _(links — send: Titaniklad the Ash Dragon; search: Fallen of Albaz)_
- **Branded in Red** — extender: Add Fallen of Albaz or a Despia monster from the GY, then you may Fusion Summon a Level 8+ Fusion by banishing its materials from the hand or field (Albaz + Guiding Quem for Albion the Sanctifire). _(links — fusion: Albion the Sanctifire Dragon, Mirrorjade the Iceblade Dragon)_
- **Branded Retribution** — interruption: Counter Trap: return an Albaz Fusion to the Extra Deck (one on the field or two in the GY) to negate and destroy a card that Special Summons. Banish it from the GY to add another Branded Spell/Trap.
- **Ash Blossom & Joyous Spring** — handtrap: Negates a search, a Special Summon from the Deck or a send from the Deck on their turn.
- **Mulcharmy Fuwalos** — handtrap: With no cards on our field: discard it to draw each time they Special Summon from the Deck or Extra Deck this turn.
- **Mirrorjade the Iceblade Dragon** — payoff: Once per turn (Quick Effect): send an Albaz Fusion from the Extra Deck to banish a monster. If the opponent removes it, destroy all their monsters in the End Phase. Albaz + a Fusion, Synchro, Xyz or Link Monster. _(links — send: Titaniklad the Ash Dragon, Granguignol the Dusk Dragon)_
- **Lubellion the Searing Dragon** — payoff: The bridge to Mirrorjade: on Fusion Summon, discard 1 to Fusion Summon a Level 8 or lower Fusion by shuffling its materials (Albaz and Lubellion itself) back from the field or GY. _(links — fusion: Mirrorjade the Iceblade Dragon)_
- **Granguignol the Dusk Dragon** — payoff: Cartesia + a LIGHT or DARK monster. On Fusion Summon it sends a Level 6+ LIGHT or DARK monster from the Deck or Extra Deck to the GY (Titaniklad). When they Special Summon with a monster effect, banish it to bring out a Dogmatika or a Despia Fusion.
- **Titaniklad the Ash Dragon** — payoff: Mostly a GY card: sent there this turn, in the End Phase it adds or Special Summons Fallen of Albaz or a Dogmatika (Fleurdelis). The usual Extra Deck cost. _(links — search: Fallen of Albaz, Dogmatika Fleurdelis, the Knighted; summon: Fallen of Albaz, Dogmatika Fleurdelis, the Knighted)_
- **The Dragon that Devours the Dogma** — payoff: Albaz + a LIGHT or DARK monster + an Effect Monster. Unaffected by other cards while an Ecclesia is on the field or in a GY; shuffles two cards from a GY or banishment back on summon.
- **Rindbrumm the Striking Dragon** — interruption: Negates an Extra Deck monster's effect and bounces a monster. From the GY on their turn it swaps with Albaz.
- **Albion the Sanctifire Dragon** — payoff: Albaz + a LIGHT Spellcaster (Quem, Cartesia, Ecclesia, Fleurdelis). Untargetable; on their turn it revives two monsters from the GYs, one to each field.
- **Alba-Lenatus the Abyss Dragon** — utility: Albaz + Dragons. Sent to the GY this turn, in the End Phase it adds a "Fusion" Normal Spell (Branded Fusion or Fusion Deployment). _(links — search: Branded Fusion, Fusion Deployment)_
- **Despian Luluwalilith** — utility: Level 12 Synchro (Level 4 Tuner + Level 4s): negates a card when a card leaves the Extra Deck. Only without an Extra Deck lock.
- **Garura, Wings of Resonant Life** — utility: A draw: sent to the GY, draw 1.
- **Mixousia the Confounder** — utility: Spellcaster + non-Spellcaster; fuses again on their Main Phase by banishing itself.
- **Predaplant Dragostapelia** — interruption: A Fusion + a DARK monster: negates their monster's activated effects with a Predator Counter.

### Routes
- **L-01** (from Aluber the Jester of Despia): 1. Normal Summon Aluber: add Branded Fusion 2. Branded Fusion: Fallen of Albaz + a DARK monster from the Deck for Lubellion 3. Lubellion (discard 1): shuffle Albaz and Lubellion back for Mirrorjade → **Aluber + Mirrorjade**
- **L-05** (from Branded Opening): 1. Branded Opening (discard 1): Aluber from the Deck 2. Aluber adds Branded Fusion 3. as 1-card Aluber → **Mirrorjade**
- **L-02** (from Branded Fusion): 1. Branded Fusion: Albaz + a DARK monster from the Deck for Lubellion 2. Lubellion: Mirrorjade → **Mirrorjade**
- **V53-WD** (from Fallen of the White Dragon): 1. Send Titaniklad from the Extra Deck: Special Summon White Dragon 2. Special Summon Incredible Ecclesia from the Deck 3. Ecclesia (Quick Effect): Tribute it for Fallen of Albaz 4. Albaz on the field: Blazing Cartesia from the hand, then Cartesia fuses 5. End Phase: Titaniklad adds or summons Albaz / Fleurdelis → **Level 8 Fusion + Cartesia or Fleurdelis**
- **V53-QC** (from Guiding Quem, the Virtuous / Blazing Cartesia, the Virtuous): 1. Normal Summon Quem: send Fallen of Albaz to the GY 2. Albaz in the GY: Special Summon Cartesia from the hand 3. Cartesia fuses itself with a LIGHT or DARK monster from the hand (Ecclesia, Fleurdelis, Aluber) for Granguignol, keeping Quem on the field 4. Granguignol leaving the Extra Deck lets Quem revive Albaz from the GY; Granguignol sends Titaniklad 5. If Quem has to be the second material instead, it goes to the GY and there is no revival → **Granguignol + Quem + Albaz (Granguignol alone if Quem was the material); Titaniklad in the GY**
- **B-02** (from Fusion Deployment): 1. Fusion Deployment: reveal an Albaz Fusion, Special Summon Fallen of Albaz from the Deck 2. Cartesia or a Fusion Spell uses it → **Depends on the rest of the hand**
- **R33-PHARA** (from Phara the Primordial Goddess): 1. Reveal Phara with the starter Spell before playing it 2. Nobody can respond to that Spell: Ash Blossom cannot stop it → **Protects any route above**
- **R33-SPL** (from Super Polymerization): 1. With our own Albaz-named monster and a DARK monster on the field, no other Fusion route, and two other cards in hand (both effects discard) 2. Super Polymerization (discard 1): Lubellion 3. Lubellion (discard 1): Mirrorjade → **Mirrorjade**
- **G-01** (from Fallen of Albaz): 1. Going second: Normal Summon Albaz (discard 1) and fuse with their monster → **Their monster gone, an Albaz Fusion on our side**

### Locks
- **Nadir Servant**: no Extra Deck summons for the rest of the turn — play it last
- **Branded Fusion**: Fusion Monsters only from the Extra Deck this turn — no Luluwalilith after it
- **Branded Opening**: Fusion Monsters only from the Extra Deck after it resolves — Synchro first if you need one
- **Fusion Deployment**: Fusion Monsters only from the Extra Deck this turn
- **Fallen of the White Dragon**: Level 8 Fusion or Synchro Monsters only — Lubellion and Mirrorjade are Level 8
- **Lubellion the Searing Dragon**: Fusion Monsters only from the Extra Deck this turn

### End Phase
- Titaniklad (sent this turn): add or summon Albaz / Fleurdelis
- Cartesia and Ecclesia return to the hand if a Fusion went to the GY
- Branded in High Spirits returns to the hand the same way
- Alba-Lenatus (sent this turn): add Branded Fusion

## Moonlit Hunt (luna)

SHA-256 `842b6d9b8609aeba85a7494c4615d53e9ecf5a91299ebadaa386b2d6fb068ab3` · status: DRAFT (Claude, 23 Oct 2026). Akiza review pending.

**Main (40):** 3x Lunalight Gold Leo, 2x Lunalight Kaleido Chick, 2x Lunalight Black Sheep, 2x Lunalight Silver Hound, 2x Lunalight Scarlet Tiger, 1x Lunalight Emerald Bird, 1x Lunalight Yellow Marten, 1x Lunalight Tiger, 1x Lunalight Wolf, 1x Tri-Brigade Fraktall, 3x Ash Blossom & Joyous Spring, 3x Fire Formation - Tenki, 3x Lunalight Masquerade, 2x Luna Light Perfume, 2x Super Duper Polymerization, 3x Foolish Burial Goods, 1x Lunalight Fusion, 1x Polymerization, 1x Foolish Burial, 1x Ghost Belle & Haunted Mansion, 3x Infinite Impermanence, 1x Lunalight Serenade Dance

**Extra (15):** 1x Lunalight Cat Dancer, 1x Lunalight Panther Dancer, 2x Lunalight Leo Dancer, 2x Lunalight Liger Dancer, 2x Lunalight Perfume Dancer, 1x Lunalight Sabre Dancer, 1x Guardian Chimera, 1x Tri-Brigade Ferrijit the Barren Blossom, 1x Brotherhood of the Fire Fist - Tiger King, 1x Gorgon of Zilofthonia, 1x Primathmech Alembertian, 1x Knightmare Phoenix

**Plan:** Build up the Lunalight Fusion ladder (Cat Dancer → Panther Dancer → Leo Dancer → Liger Dancer) on turn 1. The shortcut is Kaleido Chick: it sends Leo Dancer (or Panther Dancer) from the Extra Deck to the GY and counts as that monster for a Fusion, so Kaleido + Lunalights skip steps. Liger Dancer is unaffected by non-Lunalight cards and wipes their Special Summoned monsters.

### Cards
- **Lunalight Gold Leo** — starter: Normal or Special Summon: add a Lunalight monster from the Deck, then discard 1 (discarding Silver Hound or Scarlet Tiger starts their GY effects). While on the field, when Lunalights go to the GY, add one back. _(links — search: Lunalight Kaleido Chick, Lunalight Black Sheep, Lunalight Silver Hound, Lunalight Scarlet Tiger, Lunalight Emerald Bird, Lunalight Yellow Marten)_
- **Lunalight Kaleido Chick** — extender: Once per turn: send a Lunalight from the Deck or Extra Deck to the GY, and it counts as that monster's name for a Fusion this turn (send Leo Dancer, then fuse it as Leo Dancer into Liger Dancer). Sent to the GY by an effect: add Polymerization back from the GY. _(links — send: Lunalight Leo Dancer, Lunalight Panther Dancer, Lunalight Silver Hound; search: Polymerization)_
- **Lunalight Black Sheep** — starter: Discard it: add Polymerization from the Deck, or a Lunalight from the GY. Used as Fusion Material: add a face-up Lunalight Pendulum from the Extra Deck or a Lunalight from the GY. _(links — search: Polymerization)_
- **Lunalight Silver Hound** — extender: Sent to the GY by an effect (a discard, Foolish Burial, Fraktall, Masquerade): Special Summon a Lunalight from the Deck. While that monster is face-up you can only Special Summon Lunalights from the Extra Deck. From the GY it can negate a Spell/Trap on the field by banishing itself and a Lunalight Fusion. _(links — summon: Lunalight Gold Leo, Lunalight Kaleido Chick, Lunalight Emerald Bird)_
- **Lunalight Scarlet Tiger** — extender: When you activate a Lunalight monster effect: Special Summon it from the hand (and add Polymerization if they have activated something this turn). Sent to the GY by an effect: Special Summon a non-Level 5 Lunalight from the face-up Extra Deck or GY (effects negated). _(links — search: Polymerization)_
- **Lunalight Emerald Bird** — extender: Normal or Special Summon: send a Lunalight card from the hand to the GY and draw 1 (send Silver Hound for another body). Sent to the GY by an effect: revive a Level 4 or lower Lunalight from the GY or banishment in Defense Position (effects negated).
- **Lunalight Yellow Marten** — extender: From the hand or GY: return another Lunalight you control to the hand to Special Summon itself in Defense Position (it is banished when it leaves). Re-uses Gold Leo's search. Sent to the GY by an effect: add a Lunalight Spell/Trap from the Deck. _(links — search: Lunalight Masquerade, Lunalight Serenade Dance)_
- **Lunalight Tiger** — utility: Pendulum: once per turn revive a Lunalight from the GY (effects negated, destroyed in the End Phase) for Fusion Material. As a monster, when it is destroyed it revives a Lunalight.
- **Lunalight Wolf** — extender: In the Pendulum Zone: once per turn, Fusion Summon a Lunalight Fusion by banishing its materials from the field or GY, a free extra Fusion.
- **Tri-Brigade Fraktall** — starter: Send it from the hand or field to the GY to send a Level 3 or lower Beast-Warrior from the Deck (Silver Hound, which then Special Summons a Lunalight from the Deck). Banish Beast-Warriors from the GY for a Tri-Brigade Link (Ferrijit). Locks Link Material to Beasts. _(links — send: Lunalight Silver Hound, Lunalight Tiger)_
- **Fire Formation - Tenki** — starter: Continuous Spell: on activation, add a Level 4 or lower Beast-Warrior from the Deck (Gold Leo or Kaleido Chick). Beast-Warriors gain 100 ATK. _(links — search: Lunalight Gold Leo, Lunalight Kaleido Chick, Lunalight Emerald Bird)_
- **Lunalight Masquerade** — starter: Continuous Spell. The turn it is activated: send a Lunalight from the Deck to the GY (Silver Hound for a body, or Black Sheep / Scarlet Tiger). When you Fusion Summon a Lunalight: add Polymerization back from the GY or banishment, and you may discard 1 so the next Lunalight Fusion can also banish GY monsters as material. _(links — send: Lunalight Silver Hound, Lunalight Scarlet Tiger; search: Polymerization)_
- **Luna Light Perfume** — extender: Revive a Lunalight from the GY. Later, banish it from the GY and discard 1 to add a Lunalight from the Deck. Perfume Dancer adds it.
- **Super Duper Polymerization** — interruption: Pay 2000 LP and target an Effect Monster: Special Summon a monster from the Extra Deck with the same Type and Attribute but a different Level, then fuse the two (or send it to the GY). Nobody can respond.
- **Foolish Burial Goods** — utility: Send a Spell/Trap from the Deck to the GY: Luna Light Perfume (banish it to search) or Serenade Dance (banish it to Special Summon a Lunalight).
- **Lunalight Fusion** — starter: Fusion Summon a Lunalight Fusion using the hand or field; if they control a monster from the Extra Deck, one material may come from the Deck or Extra Deck. _(links — fusion: Lunalight Cat Dancer, Lunalight Perfume Dancer, Lunalight Panther Dancer, Lunalight Leo Dancer)_
- **Polymerization** — extender: Fusion Summon from the hand or field. Black Sheep, Kaleido Chick, Scarlet Tiger and Masquerade keep bringing it back. _(links — fusion: Lunalight Cat Dancer, Lunalight Perfume Dancer, Lunalight Panther Dancer, Lunalight Leo Dancer, Lunalight Liger Dancer, Lunalight Sabre Dancer)_
- **Foolish Burial** — starter: Send a monster from the Deck to the GY: Silver Hound (Special Summon a Lunalight from the Deck) or Scarlet Tiger. _(links — send: Lunalight Silver Hound, Lunalight Scarlet Tiger)_
- **Lunalight Serenade Dance** — interruption: Continuous Trap: when you Fusion Summon, give them a 2000 token and pump your Fusion. From the GY in your Main Phase: banish it, send a hand card to the GY and Special Summon a Lunalight from the Deck.
- **Ash Blossom & Joyous Spring** — handtrap: Negates a search, a Special Summon from the Deck or a send from the Deck on their turn.
- **Ghost Belle & Haunted Mansion** — handtrap: Negates an effect that moves cards out of the GY.
- **Infinite Impermanence** — handtrap: Negates a face-up monster on their field for the turn.
- **Lunalight Cat Dancer** — extender: 2 Lunalights. The first rung of the ladder: Cat Dancer + a Lunalight makes Panther Dancer.
- **Lunalight Panther Dancer** — extender: Cat Dancer + a Lunalight. Panther Dancer + 2 Lunalights makes Leo Dancer.
- **Lunalight Leo Dancer** — payoff: Panther Dancer + 2 Lunalights (Kaleido Chick can stand in as Panther). Untargetable; attacks twice and destroys their Special Summoned monsters after attacking. Leo Dancer + 3 Lunalights makes Liger Dancer.
- **Lunalight Liger Dancer** — payoff: Leo Dancer + 3 Lunalights (Kaleido Chick can stand in as Leo Dancer). Unaffected by non-Lunalight cards, attacks twice, and once per turn (Quick Effect) sends a Lunalight from the Extra Deck to destroy all their Special Summoned monsters.
- **Lunalight Perfume Dancer** — extender: 2 Lunalights. On Fusion Summon: add Luna Light Perfume. Return another Lunalight to the hand or Extra Deck and Special Summon one from the hand (re-use Gold Leo or Fusions). From the GY: their monsters lose ATK equal to their DEF. _(links — search: Luna Light Perfume)_
- **Lunalight Sabre Dancer** — payoff: 3 Lunalights; grows with every Beast-Warrior in the GYs and banishment. From the GY: a Fusion gains 3000 ATK.
- **Guardian Chimera** — payoff: 3 monsters with different names from the hand AND field: draw for each from the hand, destroy for each from the field.
- **Tri-Brigade Ferrijit the Barren Blossom** — utility: Link 2 from Fraktall: Special Summon a Level 4 or lower Beast-Warrior from the hand; in the GY it draws 1.
- **Brotherhood of the Fire Fist - Tiger King** — utility: Rank 4 from two Level 4 Beast-Warriors: sets a Fire Formation from the Deck; negates non-Beast-Warrior monsters.
- **Gorgon of Zilofthonia** — utility: Link from 2+ Effect Monsters: negates monsters it points to. Only worth it next to Liger or Leo Dancer, never alone.
- **Primathmech Alembertian** — utility: Rank 4 from 2+ Level 4s: detach 3 to add a Level 4 monster (Gold Leo), or 4 for a Spell/Trap.
- **Knightmare Phoenix** — utility: Link 2 from two different names: discard 1 to destroy a Spell/Trap. Never made from Liger or Leo Dancer.

### Routes
- **LU-01** (from Lunalight Gold Leo / Lunalight Masquerade / Fire Formation - Tenki): 1. Normal Summon Gold Leo (Tenki can add it): add Silver Hound, then discard it 2. Silver Hound Special Summons Kaleido Chick from the Deck, and Gold Leo adds Silver Hound back from the GY 3. Black Sheep (discard) adds Polymerization; Polymerization: 2 Lunalights for Perfume Dancer (adds Luna Light Perfume) 4. Kaleido Chick sends Leo Dancer and counts as Leo Dancer 5. Polymerization or Lunalight Wolf: Kaleido (as Leo Dancer) + 3 Lunalights for Liger Dancer → **Liger Dancer, often with a second Fusion**
- **R-HOUND** (from Foolish Burial / Tri-Brigade Fraktall / Lunalight Masquerade): 1. Send Silver Hound to the GY 2. Silver Hound Special Summons Gold Leo from the Deck 3. continue as LU-01 → **as LU-01**
- **R-SHEEP** (from Lunalight Black Sheep): 1. Discard Black Sheep: add Polymerization 2. Polymerization with two Lunalights; Black Sheep's material effect gets a Lunalight back → **A Fusion plus a refilled hand**
- **R-PERFUME** (from Lunalight Perfume Dancer): 1. Perfume Dancer returns a used Lunalight to the hand and Special Summons one from the hand 2. Luna Light Perfume revives a GY Lunalight for more material → **More bodies for the next rung**

### Locks
- **Lunalight Silver Hound**: only Lunalight monsters from the Extra Deck while the monster it summoned is face-up — no Knightmare / Tiger King until that monster is used as material
- **Tri-Brigade Fraktall**: Link Material must be Beasts, Beast-Warriors or Winged Beasts after its Link effect
- **Tri-Brigade Ferrijit the Barren Blossom**: Link Material must be Beasts after its summon effect
- **Lunalight Liger Dancer**: needs Leo Dancer (or Kaleido Chick naming it) + 3 Lunalights — keep four Lunalight bodies for the last step

### End Phase
- Lunalight Tiger's Pendulum revive is destroyed in the End Phase: use it as material first
- Yellow Marten is banished when it leaves the field

## Borrowed Bosses (mikanko)

SHA-256 `09a877e045c5304d4ab8b9430bea08680511ea8e7ae32da0e547fcf664f6eb70` · status: DRAFT (Claude, 23 Oct 2026). Akiza review pending.

**Main (40):** 3x Ohime the Manifested Mikanko, 1x Sanaki the Mikanko Devotee, 2x Hu-Li the Jewel Mikanko, 1x Ha-Re the Sword Mikanko, 3x Lava Golem, 2x Jizukiru, the Star Destroying Kaiju, 1x Thunder King, the Lightningstrike Kaiju, 3x Preparation of Rites, 3x Mikanko Shinbu - Noble Twins, 3x Mikanko Water Arabesque, 2x Mikanko Fire Dance, 1x The Great Mikanko Ceremony, 1x Mikanko Dance - Mayowashidori, 1x Mikanko Reflection Rondo, 1x Double-Edged Sword, 3x Forbidden Droplet, 3x Triple Tactics Thrust, 1x Raigeki, 1x Lightning Storm, 1x Harpie's Feather Duster, 1x Cosmic Cyclone, 1x Mulcharmy Fuwalos, 1x Mikanko Spiritwalk

**Extra (15):** 2x Uzuhime the Manifested Mikanko, 1x Number 49: Fortune Tune, 1x Downerd Magician, 1x Divine Arsenal AA-ZEUS - Sky Thunder, 1x Super Starslayer TY-PHON - Sky Crisis, 1x Salamangreat Almiraj, 1x S:P Little Knight, 1x Knightmare Phoenix, 1x Lyna the Light Charmer, Lustrous, 1x Dharc the Dark Charmer, Gloomy, 1x I:P Masquerena, 1x Knightmare Unicorn, 1x Accesscode Talker, 1x Underworld Goddess of the Closed World

**Plan:** A control deck that uses the opponent's monsters against them. Mikanko monsters wear Equip Spells, which turn on their searches and protection and send battle damage back. Kaiju and Lava Golem remove a boss by tributing it; Spiritwalk and Reflection Rondo steal monsters. Going first it sets up Uzuhime, equips and traps; going second it breaks the board.

### Cards
- **Ohime the Manifested Mikanko** — starter: Reveal it from the hand: add any Mikanko card from the Deck, then discard 1. Quick Effect: equip an Equip Spell from the GY to a monster. Battle damage it would take goes to the opponent; it is not destroyed by battle. _(links — search: Mikanko Water Arabesque, Mikanko Fire Dance, Mikanko Shinbu - Noble Twins, Sanaki the Mikanko Devotee, Mikanko Spiritwalk)_
- **Sanaki the Mikanko Devotee** — extender: When an Equip Card is equipped to it: Special Summon a non-Illusion Mikanko (Hu-Li or Ha-Re) from the Deck; only Mikanko monsters from the Extra Deck for the rest of the turn. Returns a Mikanko card to the hand. Sent to the GY: it equips itself to a monster as an Equip Spell. _(links — summon: Hu-Li the Jewel Mikanko, Ha-Re the Sword Mikanko)_
- **Hu-Li the Jewel Mikanko** — extender: Equipped: add a Mikanko Trap (Spiritwalk) from the Deck. While you control an Equip Card, your Mikanko cards cannot be targeted. Level 3 for Uzuhime. _(links — search: Mikanko Spiritwalk)_
- **Ha-Re the Sword Mikanko** — extender: Equipped: add a Mikanko Equip Spell from the Deck. Level 3 for Uzuhime. _(links — search: Mikanko Water Arabesque, Mikanko Fire Dance, Mikanko Dance - Mayowashidori, Mikanko Reflection Rondo)_
- **Lava Golem** — interruption: Special Summon it to their field by tributing two of their monsters (a board breaker going second). They take 1000 each Standby Phase.
- **Jizukiru, the Star Destroying Kaiju** — interruption: Special Summon it to their field by tributing one of their monsters (their best one). On your field it negates a single-target effect and destroys a card, using Kaiju Counters.
- **Thunder King, the Lightningstrike Kaiju** — interruption: Tributes one of their monsters like Jizukiru. With 3 Kaiju Counters it stops them activating anything that turn and attacks up to three times.
- **Preparation of Rites** — starter: Add a Level 7 or lower Ritual Monster (Ohime) from the Deck, and a Ritual Spell back from the GY. _(links — search: Ohime the Manifested Mikanko)_
- **Mikanko Shinbu - Noble Twins** — starter: Send a Mikanko card from the Deck to the GY (Sanaki, which equips itself, or Mayowashidori, which revives a Mikanko from the GY), then Set a Mikanko Spell/Trap from the Deck. Only Mikanko monsters from the Extra Deck afterwards. From the GY: detach a material to Special Summon a Mikanko Ritual Monster (Ohime) from the hand or Deck. _(links — send: Sanaki the Mikanko Devotee, Mikanko Dance - Mayowashidori; summon: Ohime the Manifested Mikanko)_
- **Mikanko Water Arabesque** — starter: Equip Spell (the monster is not destroyed by effects). In your Main Phase: Special Summon a differently named Mikanko from the hand or Deck, move this card onto it and return the old one to the hand. Each move triggers Hu-Li, Ha-Re or Sanaki again. _(links — summon: Hu-Li the Jewel Mikanko, Ha-Re the Sword Mikanko, Sanaki the Mikanko Devotee)_
- **Mikanko Fire Dance** — extender: Special Summon a Mikanko from the hand or GY equipped with it (protected from effects); you may also give them back a monster from their GY with its effects negated (material for Lava Golem or a Kaiju).
- **The Great Mikanko Ceremony** — extender: Quick-Play: Special Summon a Mikanko from the hand ignoring its Summoning conditions (Ohime without a Ritual); it returns to the hand in their End Phase. From the GY: send a Mikanko card from the Deck to the GY. _(links — summon: Ohime the Manifested Mikanko)_
- **Mikanko Dance - Mayowashidori** — extender: Equip Spell. From the GY: revive a Mikanko from the GY equipped with it (banished when it leaves). After your Mikanko battles: bounce a card.
- **Mikanko Reflection Rondo** — interruption: Equip to their monster: while you control a Mikanko, you control it and nobody can use its effects.
- **Double-Edged Sword** — utility: Equip: +2000 ATK and both players take the battle damage, which Ohime, Uzuhime and equipped Hu-Li / Ha-Re send back to the opponent.
- **Forbidden Droplet** — handtrap: Quick-Play: send cards from the hand or field to negate and halve their monsters; they cannot respond with cards of the sent types.
- **Triple Tactics Thrust** — utility: After they activate a monster effect this turn: add a Normal Trap from the Deck.
- **Raigeki** — utility: Destroy all their monsters (going second).
- **Lightning Storm** — utility: With no face-up cards of your own: destroy all their Attack Position monsters or all their Spells/Traps.
- **Harpie's Feather Duster** — utility: Destroy all their Spells and Traps.
- **Cosmic Cyclone** — utility: Pay 1000: banish a Spell/Trap.
- **Mulcharmy Fuwalos** — handtrap: With no cards on your field: discard it to draw each time they Special Summon from the Deck or Extra Deck.
- **Mikanko Spiritwalk** — interruption: Trap: equip their face-up monster to your Mikanko as an Equip Spell (removing it and triggering Hu-Li / Ha-Re / Sanaki); with a Ritual Monster out, burn 500 per Equip. From the GY: Special Summon a banished or hand Mikanko.
- **Uzuhime the Manifested Mikanko** — payoff: Rank 3 from two Level 3 Mikanko (Hu-Li, Ha-Re, Sanaki). Special Summoned: add an Equip Spell from the Deck or GY. Not destroyed by battle; battle damage goes to them; attacks again by detaching.
- **Number 49: Fortune Tune** — utility: Rank 3 from two Level 3s: untargetable, detaches instead of being destroyed, gains 500 LP each Standby.
- **Downerd Magician** — utility: Rank 4 that can go on top of a Rank 3 in Main Phase 2.
- **Divine Arsenal AA-ZEUS - Sky Thunder** — utility: Goes on an Xyz that battled: detach 2 to send every other card on the field to the GY.
- **Super Starslayer TY-PHON - Sky Crisis** — utility: Goes on their highest-ATK monster after they Special Summon twice from the Extra Deck; stops 3000+ ATK effects and bounces a monster.
- **Salamangreat Almiraj** — utility: Link 1 from a low-ATK Normal Summoned monster: tribute it to protect a monster.
- **S:P Little Knight** — interruption: Link 2: banishes a card when made from an Extra Deck monster; banishes two monsters until the End Phase on their turn.
- **Knightmare Phoenix** — utility: Link 2: discard to destroy a Spell/Trap.
- **Lyna the Light Charmer, Lustrous** — utility: Link 2 with a LIGHT: revive a LIGHT monster from their GY to your side.
- **Dharc the Dark Charmer, Gloomy** — utility: Link 2 with a DARK: revive a DARK monster from their GY to your side.
- **I:P Masquerena** — interruption: Link 2: on their Main Phase, Link Summon using it (protects the new Link).
- **Knightmare Unicorn** — utility: Link 3: discard to shuffle a card into the Deck.
- **Accesscode Talker** — payoff: Link 4: big ATK; banish Links to destroy their cards, and nobody can respond.
- **Underworld Goddess of the Closed World** — payoff: Link 5 that can use one of their monsters: negates their monsters on summon and stops GY revivals.

### Routes
- **MK-UZU** (from Ohime the Manifested Mikanko / Ha-Re the Sword Mikanko / Hu-Li the Jewel Mikanko / Mikanko Water Arabesque / Mikanko Fire Dance): 1. Reveal Ohime: add Ha-Re if you have no Mikanko to summon, otherwise Water Arabesque; discard Mayowashidori or a going-second card 2. Fire Dance or a Normal Summon puts Ha-Re on the field; equipping it adds Water Arabesque 3. Water Arabesque on Ha-Re: Special Summon Sanaki from the Deck (Sanaki, now equipped, Special Summons Hu-Li); Ha-Re returns to the hand 4. Two Level 3 Mikanko: Uzuhime, which adds another Equip Spell → **Uzuhime + a Level 3 Mikanko, Spiritwalk set**
- **R-OHIME** (from Ohime the Manifested Mikanko / Preparation of Rites): 1. Preparation of Rites adds Ohime 2. Reveal Ohime: add Water Arabesque (or Fire Dance), discard 1 3. Equip and move Arabesque between Mikanko: each new equip triggers Hu-Li (Spiritwalk), Ha-Re (an Equip Spell) or Sanaki (a Mikanko from the Deck) → **Equipped Mikanko, a Trap set, Equip Spells in hand**
- **R-TWINS** (from Mikanko Shinbu - Noble Twins): 1. Noble Twins: send Sanaki (it equips itself) or Mayowashidori, and Set a Mikanko Spell/Trap 2. Two Level 3 Mikanko on the field: Uzuhime, which adds an Equip Spell 3. Later: banish Noble Twins and detach to Special Summon Ohime from the Deck → **Uzuhime + equips; Ohime on the way**
- **R-KAIJU** (from Jizukiru, the Star Destroying Kaiju / Thunder King, the Lightningstrike Kaiju / Lava Golem): 1. Going second: tribute their best monster (an Extra Deck boss first) for a Kaiju, two for Lava Golem 2. Then Spiritwalk / Reflection Rondo take another, and Raigeki or Lightning Storm clear the rest → **Their board broken**

### Locks
- **Mikanko Shinbu - Noble Twins**: only Mikanko monsters from the Extra Deck after it resolves — Links and other Xyz first
- **Sanaki the Mikanko Devotee**: only Mikanko monsters from the Extra Deck after its summon effect
- **Jizukiru, the Star Destroying Kaiju**: only one Kaiju on the field — a second Kaiju goes to your side only when they already have one

### End Phase
- The Great Mikanko Ceremony's monster returns to the hand in their End Phase
- Lava Golem burns its controller 1000 each Standby Phase

## Zero Protocol (sky)

SHA-256 `4899036cb47fdb9ea91ab2e58c09972146afb6c29b35f66254177d4fd7645a0b` · status: DRAFT (Claude, 23 Oct 2026). Akiza review pending.

**Main (40):** 3x Sky Striker Ace - Raye, 2x Sky Striker Ace - Roze, 3x Ash Blossom & Joyous Spring, 1x Droll & Lock Bird, 1x Ghost Belle & Haunted Mansion, 2x Sky Striker Mobilize - Engage!, 1x Sky Striker Maneuver - Jamming Waves!, 3x Sky Striker Mobilize - Linkage!, 3x Sky Striker Mecha - Widow Anchor, 1x Sky Striker Mecha - Shark Cannon, 1x Sky Striker Mecha - Hornet Drones, 1x Reinforcement of the Army, 1x Sky Striker Special Maneuver - Lemnisgate!, 1x Sky Striker Mecha Modules - Multirole, 3x Upstart Goblin, 2x Pot of Desires, 1x Sky Striker Mecha - Eagle Booster, 1x Mulcharmy Fuwalos, 3x Forbidden Droplet, 2x Sky Striker Maneuver - Afterburners!, 1x Sky Striker Airspace - Area Zero, 3x Infinite Impermanence

**Extra (15):** 3x Sky Striker Ace = Zero, 3x Sky Striker Ace - Kagari, 1x Sky Striker Ace - Shizuku, 1x Sky Striker Ace - Hayate, 1x Sky Striker Ace - Azalea, 1x Sky Striker Ace - Camellia, 1x Prototype Sky Striker Ace - Amatsu, 1x Sky Striker Ace - Zeke, 1x Sky Striker Ace - Kaina, 1x S:P Little Knight, 1x Combined Maneuver - Engage Zero!

**Plan:** Play one monster at a time from the Extra Monster Zone and keep the Main Monster Zones empty, because almost every Sky Striker Spell needs "no monsters in your Main Monster Zone". Each Spell trades one-for-one and fills the GY; at 3+ Spells in the GY they get stronger. Going first: Raye into a Link with a Sky Striker Spell searched and Widow Anchor set; going second: Spells break their board one card at a time.

### Cards
- **Sky Striker Ace - Raye** — starter: Quick Effect: Tribute it to Special Summon a Sky Striker Ace Link to the Extra Monster Zone (Kagari to re-use a Spell, Shizuku to weaken them, Hayate to attack directly). In the GY it comes back when your Ace Link is destroyed or removed by them. _(links — summon: Sky Striker Ace - Kagari, Sky Striker Ace - Shizuku, Sky Striker Ace - Hayate, Sky Striker Ace - Kaina, Prototype Sky Striker Ace - Amatsu)_
- **Sky Striker Ace - Roze** — extender: When another Sky Striker Ace is summoned: Special Summon it from the hand (a second body for Zero or Azalea). From the GY: returns when their Extra Monster Zone monster is destroyed, and negates a monster.
- **Sky Striker Mobilize - Engage!** — starter: With no Main Monster Zone monsters: add any Sky Striker card (Raye first), then draw 1 with 3+ Spells in the GY. _(links — search: Sky Striker Ace - Raye, Sky Striker Mecha - Widow Anchor, Sky Striker Mobilize - Linkage!, Sky Striker Mecha - Hornet Drones, Sky Striker Airspace - Area Zero)_
- **Sky Striker Maneuver - Jamming Waves!** — utility: Destroy a Set Spell/Trap; with 3+ Spells in the GY also destroy a monster.
- **Sky Striker Mobilize - Linkage!** — extender: Quick-Play: send another card you control to the GY to Special Summon a Sky Striker Ace Link to the Extra Monster Zone (+1000 ATK with LIGHT and DARK Aces). Only Ace monsters from the Extra Deck afterwards. _(links — summon: Sky Striker Ace - Kagari, Sky Striker Ace - Shizuku, Sky Striker Ace - Hayate, Sky Striker Ace - Kaina)_
- **Sky Striker Mecha - Widow Anchor** — interruption: Quick-Play, usually Set: negate a face-up Effect Monster for the turn; with 3+ Spells in the GY take control of it too.
- **Sky Striker Mecha - Shark Cannon** — interruption: Banish a monster from their GY, or with 3+ Spells in the GY Special Summon it to your field.
- **Sky Striker Mecha - Hornet Drones** — starter: Special Summon a Sky Striker Ace Token in Defense Position (1500/1500 with 3+ Spells). The token is material for Kagari / Shizuku / Hayate.
- **Reinforcement of the Army** — starter: Add a Level 4 or lower Warrior (Raye or Roze). _(links — search: Sky Striker Ace - Raye, Sky Striker Ace - Roze)_
- **Sky Striker Special Maneuver - Lemnisgate!** — extender: Shuffle Aces and Spells from the GY back to bounce cards. From the GY: when a Sky Striker is Special Summoned, banish it to Link Summon an Ace Link right away (on either turn).
- **Sky Striker Mecha Modules - Multirole** — extender: Continuous Spell: send another card you control to the GY so they cannot respond to your Spells this turn. End Phase: Set Sky Striker Spells from the GY (one per Sky Striker Spell activated this turn).
- **Upstart Goblin** — utility: Draw 1 (they gain 1000 LP) and adds a Spell to the GY. Played, never left in hand at the end of the turn.
- **Pot of Desires** — utility: Banish the top 10 face-down: draw 2. Once per turn.
- **Sky Striker Mecha - Eagle Booster** — interruption: Quick-Play: your monster is unaffected by other cards this turn (and not destroyed by battle with 3+ Spells).
- **Sky Striker Maneuver - Afterburners!** — utility: Destroy a face-up monster; with 3+ Spells also a Spell/Trap.
- **Sky Striker Airspace - Area Zero** — extender: Field Spell: send another card you control to excavate 3 and add a Sky Striker card. Sent to the GY by an effect: Special Summon a Sky Striker Ace from the Deck.
- **Ash Blossom & Joyous Spring** — handtrap: Negates a search, a Special Summon from the Deck or a send from the Deck on their turn.
- **Droll & Lock Bird** — handtrap: After they add a card outside the Draw Phase: nobody can add cards for the rest of the turn.
- **Ghost Belle & Haunted Mansion** — handtrap: Negates an effect that moves cards out of the GY.
- **Mulcharmy Fuwalos** — handtrap: With no cards on your field: draw each time they Special Summon from the Deck or Extra Deck.
- **Forbidden Droplet** — handtrap: Quick-Play: send cards to negate and halve their monsters.
- **Infinite Impermanence** — handtrap: Negates a face-up monster on their field for the turn.
- **Sky Striker Ace = Zero** — payoff: 2 Aces, never Link Material. Special Summoned: add a Sky Striker Spell. Quick Effect: Tribute it for Raye and Roze from the Deck / GY, then destroy a card.
- **Sky Striker Ace - Kagari** — extender: From a non-FIRE Ace (Raye). Special Summoned: add a Sky Striker Spell back from the GY. Gains 100 ATK per Spell in the GY.
- **Sky Striker Ace - Shizuku** — payoff: From a non-WATER Ace. Their monsters lose 100 ATK/DEF per Spell in your GY; in the End Phase it adds a Sky Striker Spell not already in the GY. The usual turn-1 end.
- **Sky Striker Ace - Hayate** — utility: From a non-WIND Ace. Attacks directly; after battle sends a Sky Striker card from the Deck to the GY.
- **Sky Striker Ace - Azalea** — interruption: Link 2 from LIGHT/DARK monsters: destroy a card on summon.
- **Sky Striker Ace - Camellia** — utility: Link 2: sends a Sky Striker card from the Deck; from the GY it swaps itself for their monster.
- **Prototype Sky Striker Ace - Amatsu** — interruption: From an Ace: changes a 2000+ ATK monster's effect into "destroy their Ace Link"; destroys a card when it battles.
- **Sky Striker Ace - Zeke** — interruption: Link 2: banishes a face-up monster until their next End Phase.
- **Sky Striker Ace - Kaina** — utility: From a non-EARTH Ace: one of their monsters cannot attack; LP for each Sky Striker Spell.
- **S:P Little Knight** — interruption: Link 2: banishes a card when made from an Extra Deck monster; on their turn banishes two monsters until the End Phase.
- **Combined Maneuver - Engage Zero!** — payoff: Link 2, counts as an Ace: negates a 2500+ ATK monster on summon; with Raye and Roze in the GY it destroys all their monsters when it attacks.

### Routes
- **R-RAYE** (from Sky Striker Mobilize - Engage! / Reinforcement of the Army / Sky Striker Ace - Raye): 1. Engage! or Reinforcement adds Raye 2. Normal Summon Raye; Tribute it (Quick Effect) for Kagari, which adds Engage! back 3. Play Spells while the Main Monster Zones stay empty; set Widow Anchor 4. Kagari / Linkage! into Shizuku for the End Phase search → **Shizuku or Kagari in the Extra Monster Zone, Widow Anchor set, Spells in hand**
- **R-DRONES** (from Sky Striker Mecha - Hornet Drones): 1. Hornet Drones makes a token 2. Token into Kagari or Shizuku (Link 1 from an Ace) → **An Ace Link without using a Normal Summon**
- **R-ZERO** (from Sky Striker Ace - Raye / Sky Striker Ace - Roze): 1. Two Aces on the field: Sky Striker Ace = Zero (adds a Spell) 2. On their turn: Tribute Zero for Raye and Roze and destroy a card → **An interruption that rebuilds itself**

### Locks
- **Sky Striker Mobilize - Linkage!**: only Sky Striker Ace monsters from the Extra Deck afterwards
- **Sky Striker Mobilize - Engage!**: needs no monsters in the Main Monster Zones (true of most Sky Striker Spells) — keep Raye and Roze moving into the Extra Monster Zone

### End Phase
- Shizuku (summoned this turn): add a Sky Striker Spell with a new name
- Multirole: Set Sky Striker Spells from the GY

### Never Normal Summon
- Ghost Belle & Haunted Mansion, Ash Blossom & Joyous Spring, Mulcharmy Fuwalos, Droll & Lock Bird — a hand trap Normal Summoned sits in a Main Monster Zone and switches off every Sky Striker Spell (seen: Ghost Belle, 3 of 30 hands)

## Azure Sovereign (blueeyes)

SHA-256 `dccf0340b7c1d46343d213322ff3c1894b8dc954cda47745644af6d7418c1423` · status: DRAFT (Claude, 23 Oct 2026). Akiza review pending.

**Main (40):** 1x Lunar Rabbit Omajinai, 2x Blue-Eyes White Dragon, 3x Maiden of White, 3x Sage with Eyes of Blue, 3x Primite Dragon Ether Beryl, 3x Mulcharmy Fuwalos, 3x Ash Blossom & Joyous Spring, 2x Effect Veiler, 2x Ghost Mourner & Moonlit Chill, 2x Ghost Belle & Haunted Mansion, 2x Wishes for Eyes of Blue, 1x Roar of the Blue-Eyed Dragons, 1x Mausoleum of White, 3x Primite Lordly Lode, 1x Primite Drillbeam, 3x Infinite Impermanence, 3x Dominus Purge, 1x Majesty of the White Dragons, 1x True Light

**Extra (15):** 3x Blue-Eyes Spirit Dragon, 2x Blue-Eyes Ultimate Spirit Dragon, 1x Lightstorm Dragon, 1x Ancient Fairy Life Dragon, 1x Cosmic Blazar Dragon, 1x Crimson Dragon, 1x Black Rose Moonlight Dragon, 1x Blue-Eyes Tyrant Dragon, 1x Neo Blue-Eyes Ultimate Dragon, 1x Hieratic Seal of the Heavenly Spheres, 2x Spirit with Eyes of Blue

**Plan:** Get Blue-Eyes White Dragon (a Normal Monster) onto the field with a Level 1 LIGHT Tuner (Maiden of White or Sage with Eyes of Blue), then Synchro Summon Blue-Eyes Spirit Dragon or, with two Tuners, Blue-Eyes Ultimate Spirit Dragon, which negates an activation on the field. The Primite engine (Lordly Lode, Ether Beryl) finds and summons the Normal Monsters; True Light protects Blue-Eyes and revives it.

### Cards
- **Lunar Rabbit Omajinai** — utility: A Level 1 LIGHT Normal Tuner: a Normal Monster for the Primite cards and a Tuner for the Synchros.
- **Blue-Eyes White Dragon** — utility: The Normal Monster everything is built around: Synchro and Fusion Material, revived by True Light, Roar and Lordly Lode.
- **Maiden of White** — starter: Send it from the hand or field to the GY: place True Light face-up from the hand, Deck or GY. When you Special Summon Blue-Eyes it returns from the GY (a Tuner for Spirit Dragon). Targeted or attacked: revive Blue-Eyes or a Level 1 LIGHT Tuner. _(links — summon: Blue-Eyes White Dragon)_
- **Sage with Eyes of Blue** — starter: Normal Summon: add a Level 1 LIGHT Tuner (Maiden of White). Discard it and send an Effect Monster you control to the GY: Special Summon a Blue-Eyes from the Deck. _(links — search: Maiden of White; summon: Blue-Eyes White Dragon)_
- **Primite Dragon Ether Beryl** — starter: Normal Summon: Set a Primite Spell/Trap from the Deck (Drillbeam). Tribute it: send a Normal Monster (Blue-Eyes) from the Deck to the GY, ready for True Light or Roar. Returns to the hand each Standby with a Normal Monster around. _(links — send: Blue-Eyes White Dragon, Lunar Rabbit Omajinai)_
- **Mulcharmy Fuwalos** — handtrap: With no cards on your field: draw each time they Special Summon from the Deck or Extra Deck.
- **Ash Blossom & Joyous Spring** — handtrap: Negates a search, a Special Summon from the Deck or a send from the Deck on their turn.
- **Effect Veiler** — handtrap: Negates a face-up monster on their field.
- **Ghost Mourner & Moonlit Chill** — handtrap: When they Special Summon: discard it to negate one of those monsters; if it leaves the field they take damage equal to its ATK.
- **Ghost Belle & Haunted Mansion** — handtrap: Negates an effect that moves cards out of the GY.
- **Wishes for Eyes of Blue** — starter: Discard 1: add a Level 1 LIGHT Tuner and a Spell/Trap that mentions Blue-Eyes. From the GY: equip a Blue-Eyes from the Extra Deck to Blue-Eyes (+400; turns on Tyrant Dragon). _(links — search: Maiden of White, Sage with Eyes of Blue, Roar of the Blue-Eyed Dragons, True Light, Majesty of the White Dragons, Mausoleum of White)_
- **Roar of the Blue-Eyed Dragons** — starter: Special Summon a Blue-Eyes from the Deck, GY or banishment in Defense Position (Blue-Eyes White Dragon first). Only Dragons from the Extra Deck that turn. From the GY: Fusion Summon with a Blue-Eyes. _(links — summon: Blue-Eyes White Dragon)_
- **Mausoleum of White** — extender: Field Spell: an extra Normal Summon for a Level 1 LIGHT Tuner. Sends a Normal Monster from the hand or Deck to the GY to pump a monster. From the GY: add Burst Stream of Destruction.
- **Primite Lordly Lode** — starter: Continuous Spell. On activation add a Primite card (Ether Beryl or Drillbeam). Declare a Normal Monster to Special Summon it from the hand, Deck or GY (Blue-Eyes), but Special Summoned monsters cannot use effects that turn. _(links — search: Primite Dragon Ether Beryl, Primite Drillbeam; summon: Blue-Eyes White Dragon, Lunar Rabbit Omajinai)_
- **Primite Drillbeam** — interruption: Quick-Play: negate and banish a face-up card (reveal a Primite or Normal Monster, or none needed with a Normal Monster out). Sets itself again from the GY with a Primite monster.
- **Infinite Impermanence** — handtrap: Negates a face-up monster on their field for the turn.
- **Dominus Purge** — handtrap: Trap (from the hand if they control a card): negate an effect that adds from the Deck to the hand.
- **Majesty of the White Dragons** — interruption: Show up to 3 Blue-Eyes White Dragons: destroy that many of their cards.
- **True Light** — extender: Continuous Trap (Maiden places it): your Blue-Eyes White Dragons cannot be targeted. Once per turn: Special Summon Blue-Eyes from the hand or GY, or Set a Spell/Trap that lists Blue-Eyes. If it leaves the field you lose all your monsters. _(links — summon: Blue-Eyes White Dragon)_
- **Blue-Eyes Spirit Dragon** — payoff: Synchro (Tuner + Blue-Eyes): negates a GY effect once per turn and stops them summoning 2+ monsters at once. Tribute it for another LIGHT Dragon Synchro on either turn.
- **Blue-Eyes Ultimate Spirit Dragon** — payoff: Synchro (2+ Tuners + Blue-Eyes): negates an activation on the field (+1000 ATK); they cannot banish your GY; when destroyed it revives a LIGHT Dragon.
- **Lightstorm Dragon** — utility: Synchro: destroys Spells/Traps on summon.
- **Ancient Fairy Life Dragon** — utility: Level 8 Synchro: draws 1 on Synchro Summon.
- **Cosmic Blazar Dragon** — payoff: Synchro from Synchro Monsters: banishes itself to negate an activation, a summon or an attack.
- **Crimson Dragon** — utility: Level 12 Synchro: swaps itself for another Dragon Synchro of the same Level as a target.
- **Black Rose Moonlight Dragon** — utility: Synchro: bounces one of their Special Summoned monsters.
- **Blue-Eyes Tyrant Dragon** — payoff: Fusion of Blue-Eyes + a Dragon: unaffected by Traps, attacks every monster.
- **Neo Blue-Eyes Ultimate Dragon** — payoff: Fusion of three Blue-Eyes; from the GY it negates an effect targeting your Blue-Eyes.
- **Hieratic Seal of the Heavenly Spheres** — interruption: Link 2 from two Dragons: on their turn bounce a card; when Tributed, Special Summon a Dragon from the hand or Deck.
- **Spirit with Eyes of Blue** — extender: Link 1 from a Level 4 or lower Dragon/Spellcaster (Ether Beryl): add or send Mausoleum of White; Tribute it to Special Summon a Blue-Eyes from the hand or GY. _(links — summon: Blue-Eyes White Dragon)_

### Routes
- **BE-SAGE** (from Primite Lordly Lode / Sage with Eyes of Blue): 1. Lordly Lode adds Ether Beryl 2. Lordly Lode declares Blue-Eyes White Dragon: Special Summon it 3. Normal Summon Sage: add Maiden of White (Sage was Normal Summoned, so Lordly Lode does not stop it) 4. Sage + Blue-Eyes: Spirit Dragon; Maiden can place True Light for a second one → **Blue-Eyes Spirit Dragon (often two)**
- **BE-SPIRIT** (from Primite Lordly Lode / Primite Dragon Ether Beryl): 1. Lordly Lode adds Ether Beryl; Normal Summon it (Set a Primite card) 2. Ether Beryl: Link Summon Spirit with Eyes of Blue, which takes Mausoleum of White 3. Mausoleum sends Blue-Eyes White Dragon to the GY; Spirit with Eyes of Blue Tributes itself to bring it back 4. Only now Lordly Lode declares Lunar Rabbit (its lock would have stopped Spirit with Eyes of Blue) 5. Lunar Rabbit + Blue-Eyes: Spirit Dragon → **Blue-Eyes Spirit Dragon**
- **BE-01** (from Primite Lordly Lode / Primite Dragon Ether Beryl): 1. Lordly Lode adds Ether Beryl; Normal Summon it and Set a Primite Spell/Trap 2. Tribute Ether Beryl: send Blue-Eyes White Dragon to the GY 3. Maiden of White places True Light; True Light revives Blue-Eyes, which brings Maiden back 4. Maiden + Blue-Eyes: Blue-Eyes Spirit Dragon → **Spirit Dragon (or Ultimate Spirit Dragon with a second Tuner), True Light, Drillbeam set**
- **R-SAGE** (from Sage with Eyes of Blue): 1. Normal Summon Sage: add Maiden of White 2. Send Maiden from the hand to the GY: place True Light 3. True Light Special Summons Blue-Eyes from the hand or GY, and Maiden returns from the GY 4. Sage or Maiden (Tuners) + Blue-Eyes for Spirit Dragon; both Tuners + Blue-Eyes for Ultimate Spirit Dragon → **Spirit Dragon or Ultimate Spirit Dragon + True Light (needs Blue-Eyes in the hand or GY)**
- **R-ROAR** (from Roar of the Blue-Eyed Dragons / Wishes for Eyes of Blue): 1. Wishes (discard Maiden of White) adds a Tuner and Roar 2. Roar Special Summons Blue-Eyes from the Deck; that brings Maiden back from the GY 3. Maiden + Blue-Eyes: Spirit Dragon → **Spirit Dragon**

### Locks
- **Primite Lordly Lode**: monsters it Special Summons cannot use effects that turn — summon Blue-Eyes with it, not an effect monster
- **Roar of the Blue-Eyed Dragons**: only Dragons from the Extra Deck that turn — Spirit Dragon and Ultimate are Dragons
- **Blue-Eyes Spirit Dragon**: nobody can Special Summon 2+ monsters at once while it is out — it limits you too
- **True Light**: if it leaves the field, destroy all your monsters — protect it

### End Phase
- Ether Beryl returns from the GY in your Standby Phase if a Normal Monster is in your field or GY
- Spirit Dragon's replacement Synchro is destroyed in the End Phase

## Sealed Horizon (kashtira)

SHA-256 `c3b154371a47c51707ccd9df2314bd1745307147c20452d45fc776031882e11e` · status: DRAFT (Claude, 23 Oct 2026). Akiza review pending.

**Main (40):** 1x Kashtira Fenrir, 1x Kashtira Unicorn, 3x Kashtira Riseheart, 3x Kashtira Ogre, 3x Tearlaments Kashtira, 3x Scareclaw Kashtira, 3x The Ascended of Thunder, 2x Kumongous, the Sticky String Kaiju, 2x Radian, the Multidimensional Kaiju, 3x Interrupted Kaiju Slumber, 3x Kashtiratheosis, 2x Kashtira Birth, 1x Kashtira Overlap, 2x Sacred Sword of Seven Stars, 1x Kashtira Big Bang, 3x Macro Cosmos, 3x Waking the Dragon, 1x Kashtira Preparations

**Extra (15):** 3x Kashtira Shangri-Ira, 3x Number 11: Big Eye, 2x Dark Armed, the Dragon of Annihilation, 1x Raidraptor - Rising Rebellion Falcon, 2x Infinitrack Mountain Smasher, 1x Number 28: Titanic Moth, 1x Kerzebs, the Gaoled Glutton, 1x Virtual World Kyubi - Shenshen, 1x Bloom Diva the Melodious Choir

**Plan:** Summon two Level 7s and make Kashtira Shangri-Ira, which locks a zone every time one of their cards is banished face-down and pulls a Kashtira from the Deck each Standby. The Level 7 Kashtira summon themselves when you control no monsters and each searches once (Fenrir a monster, Unicorn a Spell, Ogre a Trap); Riseheart becomes Level 7 by banishing their top 3 cards face-down.

### Cards
- **Kashtira Fenrir** — starter: Special Summon it if you control no monsters. Main Phase: add a Kashtira monster (Riseheart). When it attacks or they activate a monster effect: banish one of their face-up cards face-down. _(links — search: Kashtira Riseheart, Kashtira Unicorn, Kashtira Ogre)_
- **Kashtira Unicorn** — starter: Special Summon it if you control no monsters. Main Phase: add a Kashtira Spell (Kashtiratheosis or Birth). On attack or their monster effect: banish a card from their Extra Deck face-down. _(links — search: Kashtiratheosis, Kashtira Birth)_
- **Kashtira Riseheart** — extender: With a Kashtira out: Special Summon it from the hand (only Xyz from the Extra Deck that turn). Summoned this turn: banish a Kashtira card from the Deck to banish their top 3 face-down and become Level 7, the second Level 7 for Shangri-Ira.
- **Kashtira Ogre** — starter: Special Summon it if you control no monsters. Main Phase: add a Kashtira Trap (Big Bang or Preparations). On attack or their monster effect: excavate their top 5 and banish one face-down. _(links — search: Kashtira Big Bang, Kashtira Preparations)_
- **Tearlaments Kashtira** — extender: Quick Effect in the Main Phase: Special Summon it from the hand by banishing a Kashtira card from the hand or GY. Summoned: send the top 3 of either Deck to the GY. A Level 7 body on either turn.
- **Scareclaw Kashtira** — extender: Quick Effect in the Main Phase: Special Summon it from the hand by banishing a Kashtira card. Your Kashtira negate the monsters they battle.
- **The Ascended of Thunder** — utility: Pay 3000 LP to Special Summon a Level 7 body; gain 5000 if they destroy it. Only worth it with something to Xyz into.
- **Kumongous, the Sticky String Kaiju** — interruption: Tribute one of their monsters to put it on their field; with Kaiju Counters, newly summoned monsters cannot attack and are negated.
- **Radian, the Multidimensional Kaiju** — interruption: Tribute one of their monsters to put it on their field; makes a Level 7 token with counters.
- **Interrupted Kaiju Slumber** — utility: Going second: destroy every monster, then put a Kaiju on each side. From the GY (a later turn): add a Kaiju.
- **Kashtiratheosis** — extender: Target a Kashtira you control: Special Summon a Kashtira with a different Attribute from the Deck in Defense Position (a second Level 7). Only Xyz afterwards. Banished: add back a banished Kashtira card. _(links — summon: Kashtira Fenrir, Kashtira Unicorn, Kashtira Ogre, Kashtira Riseheart)_
- **Kashtira Birth** — extender: Continuous Spell: Normal Summon Level 7s without Tributing; once per turn revive a banished or GY Kashtira; banishes 3 of their GY cards when they use a Spell.
- **Kashtira Overlap** — utility: Quick-Play: banish a 1500 / 2100 monster (Riseheart) for +1500 ATK; banished: negate one of their Effect Monsters.
- **Sacred Sword of Seven Stars** — utility: Banish a Level 7 from the hand or field: draw 2.
- **Kashtira Big Bang** — interruption: Trap: with a Kashtira Xyz out, each player with 2+ monsters banishes down to one, face-down. Banished: take a Kashtira back from an Xyz's materials and summon it.
- **Macro Cosmos** — interruption: Continuous Trap: while face-up, every card sent to the GY is banished instead.
- **Waking the Dragon** — interruption: Set Trap: if their effect removes it, Special Summon any monster from the Deck or Extra Deck.
- **Kashtira Preparations** — extender: Continuous Trap: on either turn Special Summon a Kashtira from the hand or banishment; strips a card from their hand when they use a Trap.
- **Kashtira Shangri-Ira** — payoff: Rank 7 from 2+ Level 7s. Each time their card is banished face-down, lock one of their zones. Each Standby: Special Summon a Kashtira from the Deck. Detaches to survive.
- **Number 11: Big Eye** — payoff: Rank 7: detach to take control of one of their monsters.
- **Dark Armed, the Dragon of Annihilation** — utility: Rank 7: detach to destroy one of their cards.
- **Raidraptor - Rising Rebellion Falcon** — utility: Needs five Level 13 Winged Beasts: not summonable from this deck (an Extra Deck filler).
- **Infinitrack Mountain Smasher** — utility: Rank 7: steals material by battle and pumps itself.
- **Number 28: Titanic Moth** — utility: Rank 7: attacks directly alone and burns for their hand.
- **Kerzebs, the Gaoled Glutton** — interruption: Rank 7: absorbs a Normal or Quick-Play Spell they activate.
- **Virtual World Kyubi - Shenshen** — utility: Level 9 Synchro; this deck has almost no Tuners, so it is rarely made.
- **Bloom Diva the Melodious Choir** — utility: Needs Melodious materials: not summonable from this deck (an Extra Deck filler).

### Routes
- **K-01** (from Kashtira Fenrir / Kashtira Unicorn / Kashtira Ogre): 1. With no monsters, Special Summon a Level 7 Kashtira and use its search (Fenrir adds Riseheart) 2. Special Summon Riseheart; banish a Kashtira card from the Deck so it becomes Level 7 (their top 3 banished face-down) 3. Kashtiratheosis or Kashtira Birth adds a second body 4. Two Level 7s: Kashtira Shangri-Ira → **Shangri-Ira, often with a second Kashtira and Birth**
- **R-QUICK** (from Tearlaments Kashtira / Scareclaw Kashtira): 1. On either Main Phase: Special Summon them from the hand by banishing a Kashtira card 2. With another Level 7 out, Xyz into Shangri-Ira or Big Eye → **A Rank 7 made on their turn too**
- **R-KAIJU** (from Kumongous, the Sticky String Kaiju / Radian, the Multidimensional Kaiju / Interrupted Kaiju Slumber): 1. Going second: tribute their best monster for a Kaiju (or Slumber destroys everything) 2. Then build Level 7s into Shangri-Ira → **Their boss gone**

### Locks
- **Kashtira Riseheart**: only Xyz Monsters from the Extra Deck after its summon effect
- **Kashtiratheosis**: only Xyz Monsters from the Extra Deck afterwards
- **Kashtira Fenrir**: its self-summon needs an empty field — summon the free Level 7 before anything else

### End Phase
- Shangri-Ira: Special Summon a Kashtira from the Deck in each Standby Phase

## Ink Riot (toon)

SHA-256 `7a222a4781521119525c196baa6cc436d7941147df4dea35ba7af2572367742e` · status: DRAFT (Claude, 23 Oct 2026). Akiza review pending.

**Main (50):** 1x Toon Black Luster Soldier, 2x Toon Dark Magician, 2x Red-Eyes Toon Dragon, 3x Toon Cyber Dragon, 2x Toon Goblin Attack Force, 3x Toon Harpie Lady, 3x Mulcharmy Fuwalos, 3x Ash Blossom & Joyous Spring, 2x Mulcharmy Purulia, 3x The Black Stone of Legend, 1x One for One, 1x Shadow Toon, 1x Raigeki, 1x Harpie's Feather Duster, 1x Terraforming, 3x Triple Tactics Thrust, 1x Mimicat, 1x Toon Table of Contents, 1x Toon Bookmark, 1x Toon Mask, 1x Toon Terror, 1x Toon Page-Flip, 3x Toon World, 3x Comic Hand, 3x Toon Kingdom, 3x Infinite Impermanence

**Extra (12):** 2x Chimeratech Megafleet Dragon, 1x Cyber Dragon Infinity, 1x Cyber Dragon Nova, 1x Underworld Goddess of the Closed World, 1x Black Luster Soldier - Soldier of Chaos, 1x Knightmare Unicorn, 1x Knightmare Phoenix, 1x S:P Little Knight, 1x I:P Masquerena, 1x Relinquished Anima, 1x Gravity Controller

**Plan:** Get Toon World (or Toon Kingdom, which counts as Toon World and protects your Toons) onto the field first. Then Red-Eyes Toon Dragon and Toon Dark Magician bring out more Toons ignoring their summoning rules, building up to Toon Black Luster Soldier, which banishes a card. Toons attack directly while they have no Toons of their own; Toon Terror and the hand traps protect the turn.

### Cards
- **Toon Black Luster Soldier** — payoff: Special Summon it by Tributing Toons whose Levels total 8+ (or bring it out with Red-Eyes Toon Dragon / Toon Dark Magician / Page-Flip ignoring that). With Toon World: banish a card once per turn; attacks directly when they have no Toons.
- **Toon Dark Magician** — extender: Once per turn: discard a Toon card to Special Summon a Toon from the Deck ignoring its summoning rules (Black Luster Soldier), or add a Toon Spell/Trap. _(links — summon: Toon Black Luster Soldier, Red-Eyes Toon Dragon, Toon Harpie Lady, Toon Cyber Dragon)_
- **Red-Eyes Toon Dragon** — extender: Once per turn: Special Summon another Toon from the hand ignoring its summoning rules. The Black Stone of Legend summons it from the Deck. _(links — summon: Toon Black Luster Soldier, Toon Dark Magician)_
- **Toon Cyber Dragon** — utility: Special Summon it from the hand if only they control a monster. Material for Chimeratech Megafleet Dragon.
- **Toon Goblin Attack Force** — utility: A 2300 ATK Level 4 beater that attacks directly with Toon World out.
- **Toon Harpie Lady** — extender: With Toon World: Special Summon it from the hand and, with another Toon out, destroy a Spell/Trap of theirs.
- **Mulcharmy Fuwalos** — handtrap: With no cards on your field: draw each time they Special Summon from the Deck or Extra Deck.
- **Ash Blossom & Joyous Spring** — handtrap: Negates a search, a Special Summon from the Deck or a send from the Deck on their turn.
- **Mulcharmy Purulia** — handtrap: With no cards on your field: draw each time they add cards to the hand outside the Draw Phase.
- **The Black Stone of Legend** — starter: Tribute it: Special Summon Red-Eyes Toon Dragon (a Level 7 or lower Red-Eyes) from the Deck. From the GY it returns to the hand by shuffling a Red-Eyes back. _(links — summon: Red-Eyes Toon Dragon)_
- **One for One** — starter: Send a monster from the hand to the GY: Special Summon a Level 1 (The Black Stone of Legend) from the hand or Deck. _(links — summon: The Black Stone of Legend)_
- **Shadow Toon** — utility: With Toon World: burn them for one of their monster's ATK.
- **Raigeki** — utility: Destroy all their monsters.
- **Harpie's Feather Duster** — utility: Destroy all their Spells and Traps.
- **Terraforming** — starter: Add a Field Spell: Toon Kingdom. _(links — search: Toon Kingdom)_
- **Triple Tactics Thrust** — utility: After they activate a monster effect: add a Normal Trap (Toon Mask).
- **Mimicat** — utility: With Toon World and a Toon: take a monster or Spell/Trap from their GY.
- **Toon Table of Contents** — starter: Add any Toon card: Toon World / Kingdom first, otherwise a Toon monster. _(links — search: Toon World, Toon Kingdom, Toon Dark Magician, Red-Eyes Toon Dragon, Toon Black Luster Soldier)_
- **Toon Bookmark** — starter: Add Toon World or a card that mentions it. From the GY it saves Toon World from destruction. _(links — search: Toon World, Toon Kingdom, Toon Page-Flip, Comic Hand)_
- **Toon Mask** — interruption: Trap with Toon World: Special Summon a Toon from the hand or Deck with a Level up to their monster's Level/Rank, ignoring its rules.
- **Toon Terror** — interruption: Counter Trap with Toon World and a Toon: negate a Spell, Trap or monster effect and destroy it.
- **Toon Page-Flip** — extender: Quick-Play with Toon World: reveal 3 different Toons from the Deck; they pick one at random and you Special Summon it ignoring its rules.
- **Toon World** — starter: Pay 1000 LP. Everything Toon needs it on the field.
- **Comic Hand** — utility: With Toon World: equip to their monster and take it (as a Toon).
- **Toon Kingdom** — starter: Field Spell named Toon World on the field: banish your top 3 face-down to activate. Your Toons cannot be targeted, and you banish the top card of the Deck instead of losing a Toon.
- **Infinite Impermanence** — handtrap: Negates a face-up monster on their field for the turn.
- **Chimeratech Megafleet Dragon** — payoff: Send Toon Cyber Dragon (a Cyber Dragon) and Extra Monster Zone monsters from either field to the GY: 1200 ATK per material. Removes their Extra Monster Zone monsters.
- **Cyber Dragon Infinity** — payoff: Rank 6 on top of Cyber Dragon Nova: negates an activation by detaching.
- **Cyber Dragon Nova** — utility: Rank 5 from two Level 5 Machines (Toon Cyber Dragons); Infinity goes on top.
- **Underworld Goddess of the Closed World** — payoff: Link 5 that can use one of their monsters: negates their monsters on summon.
- **Black Luster Soldier - Soldier of Chaos** — payoff: Link 3 from three different names; with a Level 7+ material it is untargetable and indestructible by them.
- **Knightmare Unicorn** — utility: Link 3: discard to shuffle a card into the Deck.
- **Knightmare Phoenix** — utility: Link 2: discard to destroy a Spell/Trap.
- **S:P Little Knight** — interruption: Link 2: banishes a card when made from an Extra Deck monster; on their turn banishes two monsters until the End Phase.
- **I:P Masquerena** — interruption: Link 2: on their Main Phase, Link Summon using it.
- **Relinquished Anima** — utility: Link 1 from a Level 1 (The Black Stone of Legend): equips a monster it points to and takes its ATK.
- **Gravity Controller** — utility: Link 1 from an Extra Monster Zone monster: returns their Extra Monster Zone monster to the Deck in battle.

### Routes
- **TO-01** (from Toon Table of Contents / Toon Bookmark / Terraforming / Toon Kingdom / Toon World): 1. Get Toon World or Toon Kingdom onto the field first 2. The Black Stone of Legend (or One for One into it) brings Red-Eyes Toon Dragon from the Deck 3. Red-Eyes Toon Dragon Special Summons Toon Dark Magician or Black Luster Soldier from the hand 4. Toon Dark Magician (discard a Toon) Special Summons Toon Black Luster Soldier from the Deck 5. Set Toon Terror / Toon Mask → **Toon Black Luster Soldier + Toon Dragon / Magician, Toon Terror set**
- **R-PAGEFLIP** (from Toon Page-Flip): 1. With Toon World: reveal three Toons, they pick one for you to summon → **A free Toon body**
- **R-MEGAFLEET** (from Toon Cyber Dragon): 1. Going second: Special Summon Toon Cyber Dragon (only they control a monster) 2. Send it and their Extra Monster Zone monster for Chimeratech Megafleet Dragon → **Their Extra Monster Zone boss gone**

### Locks
- **Toon World**: Toons cannot do much without it; Goblin Attack Force dies if it is destroyed — play the Field Spell first and protect it (Bookmark, Kingdom)
- **Toon Kingdom**: only one Field Spell at a time: a second Toon Kingdom or Toon World just replaces the first (and Kingdom banishes 3 more cards) — keep the spare copy in hand for after the first is destroyed
- **Toon Black Luster Soldier**: cannot attack the turn it banishes

## HERO — Mask & Vision (hero)

SHA-256 `29fcceef767c0701c5d303e69ef16e076c02e2af4d5de5adf85e91fefe065633` · status: DRAFT (Claude, 23 Oct 2026). Akiza review pending.

**Main (40):** 1x Elemental HERO Neos, 2x Elemental HERO Stratos, 1x Elemental HERO Shadow Mist, 1x Masked HERO Dusk Crow, 1x Masked HERO Furnace, 1x Masked HERO Fountain, 3x Vision HERO Faris, 2x Vision HERO Vyon, 1x Vision HERO Increase, 3x Destiny HERO - Malicious, 1x Destiny HERO - Denier, 2x Miracle Ejector, 1x Neo-Spacian Aqua Dolphin, 3x Ash Blossom & Joyous Spring, 3x Mulcharmy Fuwalos, 1x Droll & Lock Bird, 1x Forbidden Droplet, 2x A Hero Lives, 3x Fusion Destiny, 1x Polymerization, 1x Miracle Fusion, 1x Mask Change, 1x E - Emergency Call, 1x EN Shuffle, 1x Favorite Contact, 1x Foolish Burial

**Extra (15):** 1x Destiny HERO - Destroyer Phoenix Enforcer, 1x Elemental HERO Flame Wingman - Infernal Rage, 1x Elemental HERO Sunrise, 1x Elemental HERO Thunder Giant - Voltic Thunder, 1x Elemental HERO Shining Neos Wingman, 2x Contrast HERO Chaos, 2x Masked HERO Dark Law, 2x Xtra HERO Cross Crusader, 1x Xtra HERO Infernal Devicer, 1x Xtra HERO Wonder Driver, 1x Wake Up Your Elemental HERO, 1x Vision HERO Trinity

**Plan:** Three engines that feed each other. Destiny HERO: Fusion Destiny makes Destroyer Phoenix Enforcer from the hand or Deck, and Malicious keeps summoning itself from the Deck. Mask Change turns a DARK HERO into Masked HERO Dark Law, which banishes cards from their hand when they search. Vision HERO: Faris, Vyon and Increase fill the GY and field. End with Enforcer (destroys a card on either turn), Dark Law and Contrast HERO Chaos (negates a card) when possible.

### Cards
- **Elemental HERO Neos** — utility: A Level 7 Normal HERO: material for Fusions, and EN Shuffle's draw.
- **Elemental HERO Stratos** — starter: Normal or Special Summon: add a HERO monster from the Deck (Vyon, Shadow Mist or Malicious), or destroy Spells/Traps. _(links — search: Vision HERO Vyon, Elemental HERO Shadow Mist, Destiny HERO - Malicious, Vision HERO Faris, Masked HERO Furnace)_
- **Elemental HERO Shadow Mist** — extender: Special Summoned: add Mask Change. Sent to the GY (for example by Mask Change): add another HERO. A DARK HERO for Mask Change into Dark Law. _(links — search: Mask Change)_
- **Masked HERO Dusk Crow** — extender: Banish a HERO from the GY to Special Summon it from the hand. Summoned: add another Masked HERO from the Deck or GY (Furnace or Fountain). DARK, so Mask Change makes Dark Law. _(links — search: Masked HERO Furnace, Masked HERO Fountain)_
- **Masked HERO Furnace** — starter: Reveal it: add Mask Change or Polymerization, then discard 1 (discard Malicious). Only HERO monsters from the Extra Deck that turn. Comes back when you Special Summon a non-FIRE HERO Fusion. _(links — search: Mask Change, Polymerization)_
- **Masked HERO Fountain** — extender: Reveal it: Special Summon a HERO from the hand in Defense Position. Sent to the GY by an effect or as a cost: Set Mask Change from the Deck or GY.
- **Vision HERO Faris** — starter: Discard another HERO (Malicious) to Special Summon it from the hand. Summoned: place Vision HERO Increase from the Deck as a Continuous Trap. Only HERO monsters from the Extra Deck that turn. _(links — summon: Vision HERO Increase)_
- **Vision HERO Vyon** — starter: Summoned: send a HERO from the Deck to the GY (Malicious, which then summons another Malicious). Banish a HERO from the GY: add Polymerization. _(links — send: Destiny HERO - Malicious, Elemental HERO Shadow Mist; search: Polymerization)_
- **Vision HERO Increase** — extender: As a Continuous Trap (Faris places it): Tribute a HERO to Special Summon it, then Special Summon a Level 4 or lower Vision HERO (Vyon) from the Deck. Returns to the Spell/Trap Zone when you take damage. _(links — summon: Vision HERO Vyon)_
- **Destiny HERO - Malicious** — extender: Banish it from the GY: Special Summon another Malicious from the Deck. Level 6 DARK: Enforcer material, and a body for Mask Change.
- **Destiny HERO - Denier** — utility: Summoned: put a Destiny HERO on top of the Deck. Once per Duel it revives itself with a Destiny HERO out.
- **Miracle Ejector** — starter: Send Neo-Spacian Aqua Dolphin from the Deck to Special Summon it. Summoned: add a Spell/Trap that mentions an Elemental HERO (EN Shuffle, Favorite Contact, A Hero Lives). Counts as an Elemental HERO. _(links — search: EN Shuffle, Favorite Contact, A Hero Lives, E - Emergency Call, Miracle Fusion)_
- **Neo-Spacian Aqua Dolphin** — utility: Ejector's cost. Discard 1 to look at their hand and destroy a weaker monster.
- **Ash Blossom & Joyous Spring** — handtrap: Negates a search, a Special Summon from the Deck or a send from the Deck on their turn.
- **Mulcharmy Fuwalos** — handtrap: With no cards on your field: draw each time they Special Summon from the Deck or Extra Deck.
- **Droll & Lock Bird** — handtrap: After they add a card outside the Draw Phase: nobody adds cards for the rest of the turn.
- **Forbidden Droplet** — handtrap: Quick-Play: send cards to negate and halve their monsters.
- **A Hero Lives** — starter: With no face-up monsters: pay half your LP to Special Summon a Level 4 or lower Elemental HERO from the Deck (Shadow Mist for Mask Change, else Stratos). _(links — summon: Elemental HERO Shadow Mist, Elemental HERO Stratos)_
- **Fusion Destiny** — starter: Fusion Summon a Fusion that names a Destiny HERO using the hand or Deck (Malicious + a Level 6+ HERO for Destroyer Phoenix Enforcer). It is destroyed at the end of the next turn, and only DARK HEROs can be Special Summoned for the rest of this turn. _(links — fusion: Destiny HERO - Destroyer Phoenix Enforcer)_
- **Polymerization** — extender: Fusion Summon a HERO Fusion from the hand or field (Contrast HERO Chaos from two Masked HEROs).
- **Miracle Fusion** — extender: Fusion Summon an Elemental HERO Fusion by banishing materials from the field or GY.
- **Mask Change** — interruption: Quick-Play: send your HERO to the GY and Special Summon a Masked HERO of its Attribute from the Extra Deck (DARK: Dark Law). Usable on their turn. _(links — summon: Masked HERO Dark Law)_
- **E - Emergency Call** — starter: Add an Elemental HERO from the Deck (Stratos). _(links — search: Elemental HERO Stratos, Elemental HERO Shadow Mist)_
- **EN Shuffle** — extender: Shuffle an Elemental HERO / Neo-Spacian you control into the Deck to Special Summon a different one (Ejector into Shadow Mist or Stratos). _(links — summon: Elemental HERO Shadow Mist, Elemental HERO Stratos)_
- **Favorite Contact** — extender: Trap: Special Summon a HERO Fusion ignoring its rules by putting its materials from anywhere on the bottom of the Deck.
- **Foolish Burial** — starter: Send Malicious (or Shadow Mist) from the Deck to the GY. _(links — send: Destiny HERO - Malicious, Elemental HERO Shadow Mist)_
- **Destiny HERO - Destroyer Phoenix Enforcer** — payoff: Their monsters lose 200 ATK per HERO card in your GY. Quick Effect: destroy one of your cards and one card on the field. If destroyed, a Destiny HERO returns next Standby.
- **Elemental HERO Flame Wingman - Infernal Rage** — utility: Fusion: adds a "Favorite" card on summon.
- **Elemental HERO Sunrise** — payoff: Fusion of two HEROs with different Attributes: adds Miracle Fusion; destroys a card when your HERO is attacked or attacks.
- **Elemental HERO Thunder Giant - Voltic Thunder** — utility: Fusion: if they have more cards, destroys everything else on summon.
- **Elemental HERO Shining Neos Wingman** — payoff: Neos + a Wingman Fusion: destroys cards on summon; cannot be destroyed by effects.
- **Contrast HERO Chaos** — payoff: Fusion of two Masked HEROs: on either turn, negate a face-up card.
- **Masked HERO Dark Law** — payoff: From Mask Change on a DARK HERO. Cards going to their GY are banished; each time they search, banish a random card from their hand.
- **Xtra HERO Cross Crusader** — extender: Link 2: revive a Destiny HERO; Tribute a Destiny HERO to add a HERO.
- **Xtra HERO Infernal Devicer** — extender: Link 2: reveal a HERO Fusion and add two of its materials.
- **Xtra HERO Wonder Driver** — extender: Link 2: when a HERO is summoned where it points, Set a Polymerization, Fusion or Change Spell from the GY.
- **Wake Up Your Elemental HERO** — payoff: Fusion of an Elemental HERO Fusion + Warriors: attacks many times and burns.
- **Vision HERO Trinity** — payoff: Fusion of three HEROs: double ATK and three attacks the turn it is made.

### Routes
- **HE-FD** (from Fusion Destiny): 1. Fusion Destiny: Malicious + a Level 6+ HERO from the hand or Deck for Destroyer Phoenix Enforcer 2. Malicious in the GY summons another Malicious later → **Enforcer (destroys a card on their turn)**
- **HE-FURN** (from Masked HERO Furnace): 1. Reveal Furnace: add Mask Change, discard Malicious 2. Malicious summons another Malicious; Mask Change makes Dark Law → **Dark Law + Malicious**
- **HE-FARIS** (from Vision HERO Faris): 1. Discard Malicious: Special Summon Faris and place Vision HERO Increase 2. Increase: Tribute a HERO for itself and Vyon from the Deck 3. Vyon sends Malicious; Malicious summons Malicious → **A full field of HEROs for Fusions or Mask Change**
- **HE-AHL** (from A Hero Lives): 1. Empty field: A Hero Lives summons Shadow Mist (adds Mask Change) or Stratos (adds a HERO) → **Mask Change into Dark Law**
- **HE-VYON** (from Vision HERO Vyon): 1. Vyon sends Malicious; Malicious brings a second Malicious 2. Two bodies for Links or Fusion Destiny's follow-up → **Vyon + Malicious bodies**
- **HE-EJ** (from Miracle Ejector): 1. Ejector sends Aqua Dolphin to summon itself, adds EN Shuffle 2. EN Shuffle turns Ejector into Shadow Mist or Stratos → **Shadow Mist + Mask Change**

### Locks
- **Fusion Destiny**: only DARK HERO monsters can be Special Summoned for the rest of the turn; the Fusion is destroyed at the end of the next turn — play it after non-DARK summons
- **Vision HERO Faris**: only HERO monsters from the Extra Deck after its summon effect
- **Masked HERO Furnace**: only HERO monsters from the Extra Deck the turn you reveal it
- **Xtra HERO Cross Crusader**: only HERO monsters the turn you use its effects

### End Phase
- Destroyer Phoenix Enforcer from Fusion Destiny is destroyed at the end of the next turn (and then revives a Destiny HERO)
- Furnace summoned by its own effect is banished when it leaves


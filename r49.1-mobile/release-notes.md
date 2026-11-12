# Duel Doctrine Lab · r49.1 TEST · Gold Sarcophagus art · 13 November 2026

Kevy, 13 Nov 2026, 00:05 AEDT: "I noticed we are missing card art for Gold Sarcophagus." The image was already in art/ but the card library listed the card without art, so the hand showed its name on a plain tile. New file art-additions.json, applied by library-worker.mjs only to cards with no art. A check of every card in all nine preset decks (all banlist variants) found Gold Sarcophagus was the only one affected. Nothing else changed from r49.

# Duel Doctrine Lab · r49 TEST · Mobile layout · 12 November 2026

Kevy, 12 Nov 2026, 19:45 AEDT: "Let's optimize so it runs and looks right on mobile devices. For example I use a Google Pixel 9 Pro, then my Samsung tablet. You mentioned it's a bit clunky, let's fix that interface." Built and self-verified by Claude; independent review requested. Layout only: engine, rules, decks, AI and the Play flow files are r48.1.

New file css/r49-mobile.css (loaded last) and small additions to play-comfort.mjs:
- Phone held upright (checked at 412 x 790, the Pixel 9 Pro's width): the duel has its own layout. Opponent strip at the top, the field across the full width, your Life Points strip, your hand as a row you can swipe sideways (cards about 86 px wide so four fit), and one bottom bar: the Chain setting on the left, and "View actions" or "No response" beside it. The list of choices opens as a sheet from the bottom that fits the screen (in r48.1 it was wider than the screen and cut off), with compact rows. The "rotate your phone" card is skipped on phones.
- Tablet held upright (checked at 800 x 1200): the choices list was wider than the screen; it is now a centred sheet. The Chain setting and "No response" sit in the free strip beside the opponent's panel.
- Tablet on its side (checked at 1280 x 740): the Chain setting is top left, "No response" top centre; nothing sits over your hand any more.
- Every size, in Play: the old floating "Skip unusable / Auto-pass until relevant" bar is hidden (one response control now: the Chain button); its action is a button in Duel controls ("Auto-pass until I can respond"). The floating Pause / One action pair and the pace switch are hidden in Play (all three are in Duel controls; they still show in Watch). Notices appear compact at the top instead of over your hand, and the "offline files are ready" notice is dismissed when a duel is on.

Known, not changed here: a phone held on its side still shows the scaled-down table (small text; upright is the better way to play on a phone); the gold aura does not yet mark Graveyard / Extra Deck / banished piles; attack by tapping attacker then target is not built yet.

# Duel Doctrine Lab · r48.1 TEST · Play comfort retry fix · 12 November 2026

r48 with one fix, found by ChatGPT's independent review (RELAY-147, R48-01): if you pressed "No response" (or a Pass setting or auto-place answered for you) while the screen was still showing an animation, the answer waited in the queue; if you then cancelled it to think again, r48 quietly queued the same answer again. Now an automatic answer is offered to the page once: as soon as the page accepts it, the add-on stops, and a cancelled answer stays cancelled. The "No response" button comes back so you can still use it. Nothing else changed: engine, rules, decks, AI and visuals are r48.

ChatGPT's review of r48 also confirmed: a conceded game saved to a replay file and opened again shows as finished (served site, Chrome); the benchmark recount 100-28 = 100-28 (no gain from the S1 position rule; it stays a candidate).

Known, not changed here: the gold aura covers hand and field cards, not yet Graveyard / Extra Deck / banished piles; two chain-related controls (the old "Auto-pass until relevant" bar and the new Chain setting) still sit side by side; phone layout is crowded.

# Duel Doctrine Lab · r48 TEST · Play comfort · 12 November 2026

Built on r47 (same engine, rules data, decks, card art, Aurora visuals, randomness). Kevy approved on 12 Nov 2026, 10:58 AEDT ("I approve all of the above ... auto card placement on as default and auto chain on by default but have these options as a toggle feature for the player"). Built and self-verified by Claude; independent review requested.

Play comfort (new file play-comfort.mjs; it only presses choices the duel engine already offers; the Play flow files are unchanged):
- "No response" button: whenever you can chain a card, a gold button at the bottom of the screen says which cards you could chain. Tap it, or press Space, to decline and play on. The normal list of choices is still there.
- Chain setting (small button bottom right, and in Duel controls): Auto (asks whenever you can respond; the default), Pass this turn, Pass all. A pass made for you is announced on screen ("Passed · you could have chained ..."). Mandatory effects always ask. Every visit starts on Auto.
- Auto-place (default ON, switch in Duel controls): when a card needs one zone on your own field it is placed for you (Extra Monster Zone first, then the centre outwards). OFF: you choose the zone as before. Zones on the opponent's field and multi-zone choices always ask.
- Gold aura: the cards you can Summon, Set, activate or attack with right now glow gold (switch in Duel controls).

Also:
- A concession is now kept in a saved replay (seat and the point in the duel) and restored when the replay is opened, so a conceded game reopens as finished. Fixes ChatGPT's RELAY-142 finding.
- AI rule S1: a monster Special Summoned on the opponent's turn with 2000 or less ATK, or under a monster with at least its ATK, takes Defense Position (seen in Sky Striker losses: Roze and Raye brought out in Attack Position under a 3000 ATK dragon). Benchmark, same machine and 128 seeded games vs WindBot: r47 100-28, with S1 100-28 (Sky Striker vs WindBot Branded 6-10 -> 7-9, Branded mirror 24-8 -> 23-9). No overall gain; kept ON as a candidate, switch R46.posGuard.
- W1 note (RELAY-142/144/145): Called by the Grave is Forbidden on the 19 Oct 2026 list and in none of our lists, so no exception was added. W1 stays a tactical restriction: on our own chain link only monster negates are allowed, and only against an opposing face-up Effect Monster.
- The r47 notes below said Sky Striker 5-11; the figure for that run is 6-10. Corrected.

Not in this build: a full Master Duel / Duel Links style pass over the Play screen layout, Egyptian-style art direction.

# Duel Doctrine Lab · r47 TEST · AI battle + chain rule fix, Concede · 12 November 2026

Built on r46 (same engine, rules data, decks, card art, Aurora visuals, randomness and prompt timing). Kevy approved the build on 11 Nov 2026, 17:18 AEDT ("Yes let's carry on and build"). It answers ChatGPT's RELAY-140 review of r46. Built and self-verified by Claude; independent review requested.

- Attack rule (W12) corrected: it now uses the monster's real battle value (DEF when it attacks from Defense Position, e.g. Scareclaw Kashtira), never holds back a monster whose own text changes the battle (Ohime the Manifested Mikanko reflecting damage, monsters that cannot be destroyed by battle or have a battle effect) or while we control an Equip Card, and leaves an equal-ATK trade to the AI's normal judgement. Hopeless attacks are still held back.
- Hand-trap rule (W1) corrected: Infinite Impermanence, Effect Veiler, Forbidden Droplet, Widow Anchor and Ghost Mourner may again be chained to our own card when the opponent has a face-up Effect Monster to use them on (e.g. our Droplet on our own Branded Fusion against their Lubellion). Ash Blossom and the other "answer" hand traps are still never chained to our own cards.
- Concede button (Play mode): ⚙ Duel controls → Concede, two taps. The duel ends, the opponent's victory screen shows, end reason "Conceded".
- Benchmark, same machine, same 128 seeded games vs WindBot: r45 97-31, r47 100-28 (Branded mirror 21-11 -> 24-8; Blue-Eyes vs WindBot Branded 12-4 both; Sky Striker vs WindBot Branded 6-10 both (corrected 12 Nov: this line first said 5-11, which was Seto's earlier figure, not this run)). A small gain, mostly from the mirror; not an independent holdout.
- Not runnable on the build machine (reference files only on Seto's box): the four older deck-list test files and one stylesheet-bundle test. r47 changes no decklist or stylesheet bundle order.

# Duel Doctrine Lab · r46 TEST · AI WindBot port + victory boss art · 11 November 2026

Built on r45 (same engine, rules data, decks, card art, Aurora visuals, randomness and prompt timing). Kevy approved on 11 Nov 2026, 14:54 AEDT: "I approve all ... If we can out perform Windbot that should be our new goal", and asked for "the official boss monster art" on the victory screen "so it can be easily identified who won". r37 to r45 are unchanged.

- Victory screen: the winner's official boss card art (each deck's boss entry) now fills the victory frame, labelled "WINNER · deck name · card name", for every deck, either seat, Watch and Play, desktop and phone portrait. If the art cannot load, the deck's own emblem is shown instead.
- AI, rules ported from WindBot's expert Albaz executor and its default trap logic (adapted to Kevy's 41-card list with Alba-Lenatus + Albion the Sanctifire Dragon):
  - W1: hand traps (Ash Blossom, Ghost Ogre, Ghost Belle, Impermanence, Veiler, Called by the Grave, Crossout, Droll, Mourner, Droplet, Widow Anchor) are only used against the opponent's chain, never our own. In r45 Ghost Ogre sometimes destroyed our own Albaz or Cartesia.
  - W2: Ghost Ogre targets the opponent's newest card on the field, never their Mirrorjade.
  - W3: on the opponent's turn Mirrorjade waits for an Extra Deck monster, an activating Albaz, the Battle Phase or the End Phase.
  - W4: Mirrorjade's cost follows WindBot's order: Rindbrumm, Titaniklad, Alba-Lenatus, Lubellion, then Sanctifire.
  - W9: Fuwalos is used only on the opponent's turn, before battle.
  - W10: set Impermanence, Widow Anchor and Forbidden Droplet answer monster effects.
  - W11: Cartesia only fuses with monsters of 2500 ATK or less, and never fuses away our Mirrorjade on their turn.
  - W12: attack only when the attack can destroy something or deal damage.
- Blue-Eyes and Kashtira executors were not ported (those decks already beat WindBot in r45).
- Safety holds B1 to B4 are unchanged. Seeded 128-game benchmark against WindBot: 98-30 (r45 97-30-1, r44 99-28-1); Branded mirror 24-8 (r45 21-11, r44 23-9), median win turn 5. Sky Striker vs WindBot Branded is still 5-11. Review notes: the r46 RELAY note in the Drive Handover folder.

---

# Duel Doctrine Lab · r45 TEST · AI v4 (expert lines + decision-point search) · 11 November 2026

Built on r44 (same engine, rules data, decks, card art, Aurora visuals, boss art, randomness and prompt timing). Kevy approved on 11 Nov 2026, 11:53 AEDT: "Yes, build the v4 AI after r44", with the hybrid direction (scripted expert lines, search only at decision points) agreed at 11:57 AEDT. r37 to r44 are unchanged.

- Display: the Branded deck is now shown as "Kevy's Branded Deck" on the deck tile, deck screen, deck pickers, duel name plates, victory banner and alt text (Kevy, 11:55 AEDT). Its internal id, list (41/15/15 with Alba-Lenatus + Albion the Sanctifire Dragon, 3 Dogma, no Wingman) and file names are unchanged.
- AI, lethal: in Main Phase 1 from turn 2, when the visible board is lethal the AI goes straight to battle instead of extending. On turn 2 it no longer ends Main Phase 1 without attacking when it has a damaging attack.
- AI, Branded second turn: with our face-up Fallen of Albaz and an opposing face-up Dragon (not Mirrorjade), the AI Special Summons Alba-Lenatus the Abyss Dragon using our Albaz plus their Dragon(s).
- AI, recovery after an interrupted first turn: backup lines through Albion the Shrouded Dragon, Incredible Ecclesia, Quem and Cartesia, used only when no opening line applies.
- AI, The Fallen & The Virtuous: never revives the opponent's hand trap (for example their Ash Blossom). When that is the only revive target and nothing can be destroyed, F&V is held (safety hold B4).
- AI, hand traps: Fallen of Albaz, Albion the Shrouded Dragon, Super Polymerization, Tri-Brigade Mercourier and Cocatorium are now key cards to stop against Branded.
- AI, look-ahead: the search stays within its time budget (soft stop at 1.25 s inside the 1.5 s move deadline, capped world refills), and its status reports "full" relative to the world-pool size plus an honest "finished" flag.
- Sky Striker: expert lines were written and tested but are switched OFF in this build because they lost more often than r44 in benchmark pilots. Sky Striker plays as in r44.
- Safety holds B1 to B4 are unchanged. Benchmark and review notes: Drive RELAY-138.

---

# Duel Doctrine Lab · r44 TEST · Aurora boss art on deck select · 11 November 2026

Built on r43 (same engine, rules data, decks, AI, randomness, prompt timing and Duel Links-style FX). Kevy asked on 11 Nov 2026, 01:48 AEDT: "In the deck selection menu Keep the boss monster of each deck as the background and art work". r37 to r43 are unchanged.

- Deck select: every deck tile now shows its boss monster's card art (the same official card image used on cards), with a blurred copy as the tile background under an Aurora gradient so the name and description stay readable. Bosses come from each deck's existing boss entry: Branded Mirrorjade the Iceblade Dragon, Borrowed Bosses Uzuhime the Manifested Mikanko, Zero Protocol Sky Striker Ace - Kagari, Moonlit Hunt Lunalight Liger Dancer, Azure Sovereign Blue-Eyes White Dragon, Sealed Horizon Kashtira Shangri-Ira, Ink Riot Toon Dark Magician, HERO Contrast HERO Chaos, Time Typhoon Red-Eyes Black Dragon Exceed. A deck without boss art (for example an imported one) keeps its original emblem.
- The home banner crest, LP plate avatars and victory frame keep the original r43 emblems.
- AI fix (RELAY-135, Kevy approved 11 Nov 2026, 01:58 AEDT): Super Polymerization can use our own face-down monsters as material. The AI's Super Poly check only counted face-up monsters, so it refused a legal Albion the Sanctifire Dragon (our face-up Fallen of Albaz + our face-down Incredible Ecclesia) and could swap it for Mirrorjade. It now counts our own monsters in any position and the opponent's only face-up. The other guards stay: Sanctifire and Alba-Lenatus are never Fusion Material, and Alba-Lenatus still needs Albaz plus a real Dragon. Nothing hidden on the opponent's side is read.
- Safety holds B1 to B4 are unchanged.

---

# Duel Doctrine Lab · r43 TEST · Aurora P1 visual system · 10 November 2026

Built on r42 (same engine, rules data, decks, AI, randomness, prompt timing and Duel Links-style FX). Kevy approved phase P1 of the polish plan on 10 Nov 2026, 23:50 AEDT, choosing the new Aurora theme, a bright Duel Links-style field, a real phone portrait layout later (P2), card art kept on cards with decorative art replaced, and P1 first. r37 to r42 are unchanged.

- New default theme, Aurora: bright indigo, cyan and magenta with a saturated blue-violet duel field and light zones. Every TCG zone is unchanged. Showtime (the r42 look), Vibrant, Classic dark and High contrast stay selectable in FX settings and Duel controls. If you were on the old default (Showtime or Vibrant), the lab switches you to Aurora once; Classic dark and High contrast choices are kept.
- One design-token sheet (css/tokens.css) for type scale 12/14/16/20/28/40, spacing, radius 8/14/20, elevation and motion 120/220/400 ms; breakpoints planned for phone portrait, phone landscape and tablet.
- The 23 stylesheets are now 7 bundles (tokens, base, theme-showtime, duel, panels, fx, aurora), built in the same cascade order by tools/build-css.mjs. The original files stay in the folder for comparison. 147 of 910 legacy !important flags were removed where a cascade scan proved they never mattered.
- Type: Inter for all UI text and Orbitron for headings and life points. No italic all-caps in Aurora panels. Duel micro-labels are at least 12 px in Aurora.
- Original art: the home banner, deck tiles, LP plate avatars and victory frame now use original vector emblems. Official card images still appear on cards in play, in hand, in the deck list, in the summon cutscene for the card being summoned and for Field Spells on the field.
- Fixes: the FX settings panel stays on screen (it was cut off on the left on desktop). The release line moved from the header into Help as "About this build", with a small TEST r43 badge in the header. Phone portrait overview: the field fits the screen width again (it was squeezed to 0 px), with both LP plates visible. The full portrait layout is still P2.
- Text: the Branded deck description now names Alba-Lenatus the Abyss Dragon and Albion the Sanctifire Dragon. Deck list card images have alt text.
- Safety holds B1 to B4 are unchanged.

---

# Duel Doctrine Lab · r42 TEST · budget Extra Deck (Alba-Lenatus + Sanctifire) · 10 November 2026

Built on r41 (same engine, rules data, card art, randomness and Duel Links-style FX). Kevy approved this on 10 Nov 2026, 23:20 AEDT: "Let's go Alba lentus and sanctsfire dragon". r37 to r41 are unchanged.

- Deck: Alba-Lenatus the Abyss Dragon and Albion the Sanctifire Dragon replace Hyperinvoked Aeon and Ecclesia and the Dark Dragon in the Extra Deck. Extra: Mirrorjade, 3 Dogma, Mixousia, Quaeritis, 2 Granguignol, Lubellion, Rindbrumm, Titaniklad, Garura, Three Champions, Alba-Lenatus, Sanctifire. Main 41 and Side 15 are unchanged; still 41/15/15 and legal on the TCG 19 Oct 2026 list.
- AI: the Aeon route is gone. After Fallen of the White Dragon recruits Ecclesia, the AI makes the Three Champions Synchro only when the opponent has a worthwhile face-up card to negate; otherwise it makes no Synchro at all (the base policy cannot fall back to one either). With Cartesia it can fuse White (treated as Albaz) + Ecclesia into Albion the Sanctifire Dragon.
- AI: Sanctifire and Alba-Lenatus are never chosen as Fusion Material (neither can be). Super Polymerization only picks them when Albaz (or White) and their other material are on a field. Both stay good White, F&V, Nadir and Mirrorjade sends; Alba-Lenatus sent this turn searches Branded Fusion in the End Phase (not Super Polymerization, a Quick-Play). Sanctifire's opponent-turn revive is held unless one of our Albaz-line monsters is in the GY, and it gives the opponent the weakest card.
- Teaching: tailored Sanctifire and Alba-Lenatus cards and routes; the Springans Kitt lesson now says the search happens only when the original Springans Kitt is Normal or Special Summoned, and that Tri-Brigade Springans Kitt has no search.
- Safety holds B1–B4 are unchanged.

---

# Duel Doctrine Lab · r41 TEST · RELAY-131 fixes + 15:40 Extra Deck · 10 November 2026

Built on r40 (same engine, rules data, card art, randomness and Duel Links-style FX). Kevy approved this fixed version on 10 Nov 2026, 22:48 AEDT: "Yes, build the fixed version with all four fixes and switch the Extra Deck to 3 Dogma, no Wingman like the video". r37, r38, r39 and r40 are unchanged.

- Deck: the Extra Deck now matches the video's 15:40 frame: 3 The Dragon that Devours the Dogma and no Favorite HERO Shining Flare Wingman. Main 41 and Side 15 are unchanged; still 41/15/15 and legal on the TCG 19 Oct 2026 list.
- Teaching fix 1: Branded in White has no Extra Deck lock, so a Synchro does not lock it out. Its Fusion only needs a Dragon among the materials, not a Fusion that lists Albaz; with Albaz as a material it can also banish GY monsters. Branded Fusion still cannot be activated after a Synchro. The AI still prefers to spend the Fusion spell first for tactical reasons (safety hold B3 kept).
- Teaching and AI fix 2: Tri-Brigade Springans Kitt has no Normal Summon effect. It is no longer treated as a starter or Normal Summoned "to search". The AI only Special Summons it from hand while Mercourier is on the field, as a body or material whose GY effect can revive Albaz. Original Springans Kitt is still the Branded searcher.
- FX fix 3: in the legacy chain display a negated link now always shows a NEGATED · CL n badge, at the card that activated it or, if that is unknown, at the centre of the table.
- FX fix 4: every Duel Links-style accent (turn strip, damage number, zone tags, summon pillar, chain tags, attack slash) and its sound now ends within the time the batch already allows. The only exception is the small coin/dice chip shown when the full coin cutscene is off; it never holds play and the next scene or Skip FX clears it.
- Safety holds B1–B4 are unchanged.

---

# Duel Doctrine Lab · r40 TEST · Duel Links-style FX · 10 November 2026

Built on r39 (Branded MetaGamesGX 41/15/15, same AI). Kevy approved the Duel Links-inspired visuals and sounds as a new separate TEST version on 10 Nov 2026, 01:20 AEDT. Everything here is ORIGINAL: drawn with CSS and synthesised with Web Audio. No Konami or Duel Links art, audio, logos, characters or layouts were used. Presentation only. The engine, rules data, decks, AI, randomness and timings are byte-identical to r39 except the replay BUILD label.

- Summon pillar: a short column of light over the Monster Zone after the engine confirms a summon, tagged NORMAL, SPECIAL or FLIP SUMMON.
- Zone tags: a text chip at each public move's destination, named only from the engine's reason bits. Examples: COST → GY, MATERIAL → GY, DESTROYED, DISCARDED, BANISHED, BANISHED · FACE-DOWN, ADDED FROM DECK and SET. Tags never show card names, so they can't reveal hidden cards.
- Chain tags: ACTIVATE · CL n, RESOLVING · CL n and NEGATED · CL n. Each uses a different word and shape, not just colour. "Resolving" does not claim the effect succeeded.
- Attack slash: a streak from the attacker to its target, or to the defending player's LP for a direct attack, tagged ATTACK DECLARED. Damage appears only when the engine reports it.
- Damage burst: a large number by the LP display for battle damage, effect damage, LP costs and LP gains.
- Turn sweep: a thin "TURN n · deck" strip along the top edge of the table.
- Coin toss and dice roll: they keep their dedicated sounds from r35.12/r36. When the full cutscene is off, a small corner chip now shows the engine's result with the same coin or dice sounds. Coin Toss and Dice Roll tiles, plus the four new accents, are in the Sound Studio so you can hear them anytime.
- Controls: "Duel Links-style field FX" toggles are in FX settings and Duel controls; switching off removes the decoration only. Reduced motion shows still tags only. Instant pace shows nothing, and a new batch or Skip FX clears all accents.
- Timing: the accents fit inside time the presentation already allows (capped at 1.5 s Learning, 1.1 s Duel, 0.75 s Broadcast) and never hold, extend or pause play.

---

# Duel Doctrine Lab · 2.0.1 · 12 October 2026

Completed GPT-INSTRUCTION-PACK-1.1.0 on the recovered 2.0.0 source; the public Site was 1.1.0 when this task began. Preserve the newer work rather than downgrade to the pack's suggested 1.2.0.

- Learning builds at 1.2 seconds per link, locks for 0.6 seconds, then reads each resolving clause for four seconds plus long-clause extensions. Three short links total 16.2 seconds; a single link gets one four-second scene. The legacy path now follows the same fast-build policy, skips redundant pre-rolls and holds only resolutions.
- Manual simultaneous triggers can be ranked with the existing up/down controls; one Optimal profile remains the Watch default with no play-style roulette. Broadened removal safeguards cover own continuous Spell/Trap targets and additional backrow-removal sources.
- Unmapped effects retain official labels when available and show the card name plus a printed-clause preview, marked unverified; card art remains visible when available. Summon banners wrap, the hand uses horizontal overflow and the 16:10 stage fits the viewport. FX settings close by button, outside click and Escape.
- Factual correction: Titaniklad has 2500 ATK / 2000 DEF, per Konami's official TCG card database (cid 15272). The pack's proposed DEF 2500 would introduce a rules error. Keep 2000, tested by direct native query and native battle.

Verification and exact run counts are in QA_REPORT.md; resume guidance is in HANDOVER.md. Review on the actual tablet/Pixel remains necessary for rendered layout, audio balance and frame rate.

---

# Duel Doctrine Lab · 2.0.0 · 12 October 2026

This release implements Master Brief v2, stages S1–S5, on the existing public Site. The native engine, rules/scripts, deck lists, seed shuffling and journal identity system remain in place. Best-of-three siding remains deferred as requested.

## S1 · Chain flow
Fast chain building, a short lock, and top-down resolving scenes. Learning / Duel / Broadcast / Instant presets, extra time for long clauses, optional tap-to-continue, field chain coins, target lines and negation stamps. CL1 is buffered until a second link confirms a multi-link chain: a single-link activation has only one reading scene. In-resolution branch decisions are collected before presentation so the selected clause and results share one scene. Skip affects the current scene only. The new flow can be disabled in Duel controls for legacy playback.

## S2 · Audio
Original Web Audio cues, five volume buses, seat panning, repeat variation, cue deduplication, music ducking and three generated music stems for each deck flavour. Climax reacts to low LP and projected lethal. Optional device voice callouts. All audio nodes share master mute. See SOUND_CREDITS.md.

## S3 · AI
One Optimal pilot, with no selectable styles or deliberate decision variety. Deck-specific game-plan files, deterministic ranking, two-layer bounded engine beam search in the existing Web Worker, relevant interrupts, battle-sequence planning and a guard for wasteful own-card removal, payoff costs and discard preservation. Native engine preflight checks protection-sensitive removal and optional secondary effects. Preserve Dragoon's last discard. Journal and coach retain decision explanations and guard blocks.

The search assumes optional opposing replies pass during its own-turn projection; forced opposing decisions end the projection. It evaluates only known public opposing zones and its own resources. It is bounded, not mathematically optimal. The normal search budget is 650 ms; Instant uses 12 ms and one search layer. Device speed can affect how much of the bounded search finishes. Action-list replay is deterministic; identical seeds reproduce opening hands, but a time-limited pilot may choose a different line across devices.

## S4 · App and field
Optional fixed 1600 × 1000 stage, tilted mat, card piles and hand fan, deck avatars, reactions and cut-ins; native-size text spotlights and controls. 44-pixel control targets account for stage scaling. Landscape recommendation with a portrait overview. Hand swipe and long-press inspection. AI Watch, Deal a Hand, Play vs AI, seed replay, journal rewind, local bookmarks and post-duel key-play summary. Installable PWA with locally cached engine/data/art/fonts. Offline voices depend on installed device voices.

## S5 · Polish and checks
Inter UI/card text, Orbitron banners and tabular LP numbers. FX popover close behavior verified. Ticker moved away from scene titles; summon text can wrap and scroll. Automated DOM, native engine, chain, mixer, beam-search and worker checks plus the tournament harness. A real tablet/GPU, rendered browser screenshots and subjective audio audition are not available in this environment; the device review remains necessary.

## How to test
1. Open AI Watch, Branded vs Mikanko, seed 2026, Deck A first, Learning pace.
2. Look for fast activation coins, a lock banner, and a four-second resolution with the chosen clause highlighted. Watch a multi-link chain resolve in reverse order.
3. Press Skip FX during a chain; only the current scene should advance. Turn on Tap to continue and verify that each resolution waits.
4. Open the gear and vary all five sound sliders. Sound off must silence music, effects and callouts. Compare deck music and low-LP intensity.
5. In the coach, inspect the reason and deck game plan. In the journal, bookmark a moment, rewind, then resume.
6. Try Deal a Hand and Play vs AI. Replay an entered seed. Compare opening hands.
7. Test landscape and portrait. Long-press a card and swipe up on the hand. Check legibility and cut-in clipping on the actual tablet.
8. Wait for the offline-ready notice, install from the browser menu, disable network and reload. Start a duel offline.

See tests/tournament-result.json and QA_REPORT.md for release evidence and remaining limitations.

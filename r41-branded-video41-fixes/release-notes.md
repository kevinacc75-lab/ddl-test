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

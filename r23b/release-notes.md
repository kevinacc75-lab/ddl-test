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

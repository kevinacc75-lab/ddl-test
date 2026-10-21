# Duel Doctrine Lab 2.0 · Sound credits
All currently played effects and three music stems per deck theme are original procedural Web Audio synthesis in `dist/sound-engine.mjs`. They use oscillators, generated noise, envelopes and filters. No Konami or Master Duel audio has been copied. There are no external music downloads or licence dependencies.

The older, unused `dist/audio/heavy-chain.mp3` remains for compatibility with legacy source versions: DenisChardonnet / BigSoundBank, sound 0359, CC0. See `dist/audio/CREDITS.md` for its original source and licence.

Optional callouts use the browser/device's Speech Synthesis API with the user's installed voice. Voice availability and quality vary by device. The voice bus controls callout level; master mute cancels speech. Procedural sound is available offline; device voices may require their own installed offline voice pack.

## r23-fx (21 Oct 2026)
The soundtrack is an original, procedurally written upbeat jazz score (`dist/jazz-score.mjs`), synthesised live in `dist/sound-engine.mjs`: walking bass, swing ride and brushes, rootless keyboard comping, horn stabs and a short lead riff, in a different key and tempo per deck. The chord plans, bass rules, drum and comping patterns and riffs were written for Duel Doctrine Lab; no samples, recordings or existing tunes are used. The three intensity layers work as before (bass/drums/comping always; busier comping and accents on a tense board; horns and lead near lethal).

Sound effects were sharpened in the same engine (fast attacks, a short transient click, sub-bass punch) and gained original cues for Field Spells, Equip Spells, chain links (a rising bell) and moves to or from the Deck (a card riffle). Still no Konami or Master Duel audio.

## r24 duel soundtrack (21 Oct 2026)
The duel music is now Kevy's own original tracks, made with Suno: "Pulse", "Buoyant Groove" and "Buoyant Groove II" (`dist/audio/ddl-track-*.mp3`, listed in `dist/audio/soundtrack.json`). They were loudness-matched to about −16 LUFS, with the embedded cover image and tags removed; the music itself is unedited. The built-in procedural score remains as the fallback when no track is listed or a file cannot be loaded.

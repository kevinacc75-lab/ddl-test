# Duel Doctrine Lab 2.0 · Sound credits
All currently played effects and three music stems per deck theme are original procedural Web Audio synthesis in `dist/sound-engine.mjs`. They use oscillators, generated noise, envelopes and filters. No Konami or Master Duel audio has been copied. There are no external music downloads or licence dependencies.

The older, unused `dist/audio/heavy-chain.mp3` remains for compatibility with legacy source versions: DenisChardonnet / BigSoundBank, sound 0359, CC0. See `dist/audio/CREDITS.md` for its original source and licence.

Optional callouts use the browser/device's Speech Synthesis API with the user's installed voice. Voice availability and quality vary by device. The voice bus controls callout level; master mute cancels speech. Procedural sound is available offline; device voices may require their own installed offline voice pack.

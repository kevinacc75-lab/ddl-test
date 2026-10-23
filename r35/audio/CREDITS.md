# Cinematic sound bank · 0.9

**Heavy chain** — DenisChardonnet, BigSoundBank, sound 0359.
Source: https://bigsoundbank.com/heavy-chain-s0359.html
Original recording: https://bigsoundbank.com/UPLOAD/mp3/0359.mp3
Licence: CC0 / public-domain equivalent, confirmed on the source page 12 October 2026.

The source page permits editing, remixing and redistribution, including games.
The hosted MP3 is trimmed to 3.4 seconds, high/low-pass filtered, loudness normalised
and faded at both edges. Different passages/rates accompany building and resolving
links. Original generated impacts and metallic transients are mixed with it.

All other impact, energy, paper/flutter, portal, phase and victory layers are
original Web Audio synthesis in presentation.mjs. Master Duel serves as a
presentation reference; its audio assets are not included.

Research references:
- KONAMI development-team message: https://www.konami.com/yugioh/masterduel/us/en/message/
- Gameplay/details reference found on YouTube: https://www.youtube.com/watch?v=_rO4BGPfhNw

YouTube playback was unavailable in the development environment; no claim is
made that these sounds reproduce or were auditioned against that video's audio.

## r28 (22 Oct 2026)
`sfx/chain-*.mp3` and `sfx/chain-resolve.mp3` layer slices of the CC0 "Heavy chain" recording above (pitched and filtered) under original synthesized metal hits. Every other file in `sfx/` is original synthesis from `tools/r28-render-sfx.py`.

## r34.1 (23 Oct 2026)
`sfx/chain-1..4.mp3`, `sfx/chain-lock.mp3` and `sfx/chain-resolve.mp3` were re-rendered as a "card slap" (a short whoosh into a card slammed on the table; Kevy's pick over gong, chime, hyoshigi, tsuke and taiko versions) by `tools/r34-render-wood-sfx.py ... card-slap`. Original synthesis; the same CC0 "Heavy chain" slices stay quietly underneath.

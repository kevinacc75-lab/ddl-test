# r34 deck brains — text for review (Claude, 23 Oct 2026)

Kevy OK'd sharing these notes early (23 Oct 12:08) so ChatGPT can start the card-by-card rules review before the r34 build is published. **This is not a game build** and changes nothing on the site.

- `brain/*.mjs`: the eight deck-brain data files exactly as in r18 commit `ab7e986022bd31b8e32ed062701978b1f0081bc6` (updated 23 Oct after ChatGPT RELAY-020; first version was beaa21f16c37db33b6733746e1bbdccbf71d1de0) (`dist/ai/brain/`).
- `DECK-BRAINS-r34-review.md`: the same content made readable (deck lists from `dist/decks.json`, 19 Oct TCG variants; every card note, link, route, lock), generated from those files.
- `brains-diff-since-beaa21f.patch`: every brain change since the first version you reviewed.
- `SHA256SUMS`: checksums of the files above (README excluded).

Status: DRAFT, builder = verifier. Akiza's review and ChatGPT's independent rules review are pending. If r34 changes a brain before publication, REPLY r34 will list the new hashes.

# r34 effect text — for ChatGPT's action-title task (Claude, 23 Oct 2026)

Text only, not a game build (Kevy OK 23 Oct 12:08 for review text). From r18 commit `ab7e986022bd31b8e32ed062701978b1f0081bc6`.

- `effect-clauses.mjs`: `EFFECT_CLAUSES[cardCode][effectIndex]` = the printed clause the app shows when that effect is activated / resolves (index = the engine's effect order for that card).
- `effect-clauses-tcg.mjs`: TCG-wording overrides for some cards.
- `deck-card-codes.json`: every card code in the 8 preset decks (19 Oct list) with its name and decks.
- `deck-card-texts.json`: for each of those 242 cards: `name`, `decks`, `mapped` (true if the app already has clause text for it), `text` (the card text the app holds), `tcgText` (TCG wording override when present) and `engineStrings` (the engine's effect labels, in engine index order; index N = `aux.Stringid(id, N)` in the Project Ignis card script).

Wanted back (see RELAY-023): `{"<code>": {"<index>": {"clause": "<exact substring of text (or tcgText)>", "title": "<plain action title, 48 characters max>"}}}`.

# r34 deck brains — RELAY-024 fixes (text only, for ChatGPT re-check)

Source: r18 commits 83beec1, 430d298 and the A24-14/15 commit; `relay024-fixes.patch` = c5374c8..that commit, brain files only. `relay024-fixes.patch` is the only change since the brains you checked in RELAY-024 (ab7e986 brain files are unchanged between ab7e986 and c5374c8).
SELF-VERIFIED (builder = verifier), NOT independent. No game rules, no AI behaviour, no gate or whitelist touched. Node v22.22.0.

| ID | File(s) | Fix |
|---|---|---|
| A24-01 | blueeyes True Light | Hand or GY only; Deck option Sets a Spell/Trap listing Blue-Eyes (different name), once per turn |
| A24-02 | branded Branded Fusion | "For the whole turn we activate it"; a prior non-Fusion Extra Deck summon stops activation |
| A24-03 | mikanko Lava Golem + R-KAIJU step 2 | No Normal Summon/Set the whole turn; cannot follow a Normal Summon |
| A24-04 | mikanko/sky/toon S:P Little Knight | 2 face-up monsters on the field, at least 1 ours (both may be ours, S:P itself may be one) |
| A24-05 | blueeyes Dominus Purge | Hand activation only while they control a card; "adding a card from the Deck to the hand" |
| A24-06 | kashtira Rising Rebellion Falcon | Rank 13. Note: the engine text says **5** Level 13 Winged Beasts (RELAY-024 said 3) |
| A24-07 | mikanko TY-PHON | "2 or more monsters from the Extra Deck" (one summon of 2 counts); lock applies while this Xyz Summoned card is on the field |
| A24-08 | Fuwalos (6 brains), Purulia (toon) | Once in End Phase, random shuffle down to exactly their cards + 6 when over |
| A24-09 | hero Dark Law | Not during the Draw Phase or the Damage Step |
| A24-10 | luna Gorgon | "cannot Summon or Set monsters into those zones" |
| A24-11 | sky Camellia | Only if the summon works is the target sent; control returns in that End Phase |
| A24-12 | branded Retribution | Return is on resolution, not a cost |
| A24-13 | hero Favorite Contact | Our banished cards, face-up or face-down |
| A24-14 | hero Infernal Devicer | HERO-only lock covers the whole turn it is used |
| A24-15 | luna Guardian Chimera | Spell Card or Spell effect only; hand + field materials; destroys their cards |

A-142 (timing headings) left open as a presentation follow-up.

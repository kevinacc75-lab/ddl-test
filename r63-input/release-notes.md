# Duel Doctrine Lab · r63 TEST · answer checks + grouped copies · 14 November 2026

From ChatGPT's RELAY-216 (J1-01) and RELAY-218 (MED-R62-1…4, grouped-copy spec r1). Built and self-verified by Claude; pending ChatGPT review and the Seto team (offline until 20 Nov).

- **Correction to RELAY-217 / r62 notes:** the published r62 route-check.cjs (sha256 01f6d4f2…) did NOT have the click-capture oracle described; that was added afterwards in the workspace. The two single undrawn answers reported for r62 stay OPEN: only summary rows were kept for those runs, not full traces.
- **One central check for every manual answer (app.mjs).** When the page draws a prompt for the human it records that prompt's identity (state revision + HumanDecisionFlow key). A manual answer — sheet choice, Confirm, card-action menu, phase button — is refused unless it answers that rendered prompt; waiting behind a scene, a new duel and a rewind clear it. Automatic answers (empty-window skip, auto-placement) keep their own checks and are labelled. Every attempt goes into a 60-entry audit ring (window.__ddlReplyAudit) for tests.
- **Route check v2 (tools/browser/route-check.cjs; v1 kept as route-check-v1.cjs).** Identifies the decision at INPUT time with a capture-phase listener: the control hit, whether it was hit-testable (in view, not inert/disabled/covered), and the rendered prompt; pairs each worker reply with the app's audit entry and the last input; picks with real pointer clicks; also taps playable cards and uses their action menus; full raw logs written. Sky v Branded seed 3003, 240 s, local: tablet 44 manual answers (sheet) and, with card taps, 65 (57 sheet + 8 card menu); phone 89 manual (77 sheet, 11 card menu, 1 card tap): 0 unseen manual answers; 0 answers whose last input was a stray Space (335–471 presses while a sheet was open); automatic = empty-window skips only; add-on = auto-placement zone picks only.
- **Grouped copies r1 (ChatGPT spec).** Only a one-card SELECT_CARD while the resolving link is an allowlisted own-Deck single add (Sky Striker Mobilize - Engage!, Reinforcement of the Army), and only when every offered card is a distinct copy in that Deck: same code/controller/location/position show as one row with "×n" after the name inside .choice-text; Inspect is a sibling; the row selects the lowest original index; Confirm sends that original native index. Seed 77 (Sky, Reinforcement of the Army): rows "Roze ×2" (raw 0, 2) and "Raye ×2" (raw 1, 3); row click → pressed, "Cards selected: 1"; Confirm sent {type:SELECT_CARD, indicies:[0]}, accepted by the engine; tablet and phone.
- **AI: shared hand-trap policy (J3(a)) measured, kept OFF.** book.mjs HT_BRANDED_R1 (benchmark switch only). v1 (save Ash on Albion/Quem until Branded Fusion this turn): 10–38 vs baseline 10–38 in both repeats. Strict (Ash only on Branded Fusion/Aluber/Branded Opening/White until Branded Fusion): 9–39 vs 10–38 and 11–37 vs 11–37 (Sky 9–23 vs 13–19; HERO 7–25 vs 4–28 over the two repeats). Not adopted; detail in the 21:30 handover and RELAY-219.

# Duel Doctrine Lab · r62 TEST · calmer chain scenes · 14 November 2026

Step 2 of ChatGPT's Duel-screen-declutter-r1 ("one event representation") plus parts of the r2 addendum and the RELAY-216 r61 review. Built and self-verified by Claude; pending ChatGPT's integration review and the Seto team (offline until 20 Nov). Presentation only: event order, timing, engine choices and answers are unchanged.

- **Chain scenes in the side panel (Play, landscape).** The full-screen resolution scene dimmed and blurred the whole board. In Play on tablets, desktop and sideways phones it now shows in the same right-hand panel as decisions: "Chain Link n resolves", the card name, and the full card text with the active part highlighted. The board stays clear and bright, and its right column is now always kept free for that panel, so the board no longer changes size between events. (css/r62-events.css)
- **One label per moving card.** The extra FROM/TO ring tags, the "RESOLVE n" stamp and the "RESOLVING · CL n" tag on the board are dropped in Play; the flight keeps its own label (for example "TO FIELD · EXTRA DECK → FIELD"), and the CL coins on the field stay.
- **No empty "Pilot B is choosing" sheet** in Play: the small status card says the computer is choosing.
- **Phase on response windows** with nothing on the chain, e.g. "Draw Phase · response window · nothing is on the chain" (Akiza: Draw/Standby prompts had no context).
- **Phones held upright open straight into the portrait duel** instead of the "Rotate for the duel field" wall.
- **RELAY-216 (r61 review, MED):** the quick-pass Space shortcut now does nothing when its bar is not visible (r61 hides it while the decision sheet is open), and Space on a focused control presses that control, not the quick pass. The quick bar says "You can activate:" when nothing is on the chain (ChatGPT J1-02 / Seto LOW).
- **J1-01 evidence:** new tools/browser/route-check.cjs counts a prompt as drawn only when its controls are on screen, fires thousands of stray Space/No-response inputs during scene waits, and records every reply. Sky v Branded seed 3003: 0 unseen manual answers at 1280×900 and 412×915; the only undrawn replies are auto-placement zone picks (intended automation).
- Not in r62: grouping identical search copies, the persistent cost → resolve stepper (Droplet), the opponent-turn cue and Set log wording, portrait scene panel, notice slot.

# Duel Doctrine Lab · r61 TEST · one decision area · 14 November 2026

Step 1 of ChatGPT's Duel-screen-declutter-r1 (RELAY-213, Drive 19pg9A0E…), answering Kevy's "so much going on the screen" (14 Nov 15:30). Built and self-verified by Claude; pending ChatGPT's integration review and the Seto team (offline until 20 Nov). CSS only (css/r61-decide.css, loaded last); engine choices, timing and answers are unchanged.

- **One route per question.** While the decision sheet is open in Play, the duplicate routes to the same question hide: the "View actions" card, the floating "No response" bar and "Return to field". The sheet keeps its own No and Close buttons. (ChatGPT's live sample found three routes for one Yes/No.)
- **Landscape (tablets, desktop, phones held sideways): a right-hand rail.** The sheet used to be a large, mostly empty panel over the whole board. It is now a rail at the right, as tall as its content, drawn at real pixel size (counter-scaled against the stage scale, so its text is never shrunk), and the board narrows to sit beside it. 1280×900: rail 360 px, board fully visible. 844×390: rail 280 px with 13 px text and 44 px rows.
- **Phone portrait: a shorter bottom sheet** (at most 46% of the screen, scrolling inside), with the Confirm row kept in view while a long list scrolls. The chain-setting button steps aside while the sheet is open.
- **Less chrome inside the sheet:** one title (the "YOUR DECISION" eyebrow and the nested frame are gone), Close in the title row, a solid background so the board never shows through.
- Not in this step: the chain/event presentation (one event representation), the flight labels, notices and watch transport (step 2), and ChatGPT's r2 addendum (Akiza's playtest).

# Duel Doctrine Lab · r60.1 TEST · response-window safety fix · 14 November 2026

From the Seto team's RELAY-213 handover (A-1 HIGH, present since r59). Built and self-verified by Claude; the Seto team is offline until 20 Nov, so this is pending their review.

- **A-1 (HIGH): a leftover "No response" button could pass a window you never saw.** While the next prompt waited behind "Get ready…", the previous prompt's No response bar stayed live; a tap (or Space) queued a pass for the new, unseen prompt. Reproduced on live r60 (Sky v Branded, seed 3003): 5 stale bars, 5 unseen passes, including the Widow Anchor / Linkage! / Hornet Drones window Seto named. Fix: while waiting, app.mjs tells the add-ons no human decision is on screen (the bar hides and any retry stops), and any answer offered for an older prompt is refused. After the fix: 0 and 0 on the same seed.
- **A-2:** the behaviour is checked in a browser (tools/browser/stale-bar-check.cjs); the new node tests are source checks. A DOM-free unit test would need app.mjs restructuring.
- **LOW wording:** a response window with nothing on the chain (after the draw, in the Standby Phase) now says "Response window", "You can activate …" and "No, do not activate". The engine choices are unchanged. The quick bar's own label is unchanged (play-comfort.mjs is pinned).
- **B-1:** chokepoints.mjs header comment now says CP-001 r1.1 is rules-checked (RELAY-210).

# Duel Doctrine Lab · r60 TEST · clearer duel screen + review fixes · 14 November 2026

From Kevy's playtest (14 Nov 15:30 AEDT) and the Seto team's RELAY-210 LOWs, with ChatGPT's RELAY-211 design call. Built and self-verified by Claude; independent review requested.

- **Card text is highlighted, not dimmed** (Kevy: "can we have it that the card text is just highlighted instead? instead of being blurred?"). The rest of the printed text used to be at half opacity and grey; now every word is fully readable and only the clause in use is highlighted. Event stage, the text on the card, the effect dock and the Showtime resolve view. The caption now reads "RESOLVING TEXT · ACTIVE PART HIGHLIGHTED" (reworded by app.mjs; presentation.mjs stays byte-identical). New sheet css/r60-focus.css, loaded last.
- **No more boxes on top of each other** (Kevy: "the boxes sometimes overlap when chain link activate and you still need to select a card as cost or tribute"). Reproduced at 412×915 and 1280×800: a "Use … effect?" / pick prompt opened its panel underneath the chain-resolution scene. Every human prompt now waits for the scene to finish, exactly as chain responses already did ("Get ready…" until then). Skip FX still ends the scene at once.
- **Learn: "Next ↓" cue on short screens** (RELAY-210 LOW-1, ChatGPT RELAY-211 option a). Under the tutor bubble, only while the controls are out of view: "Next ↓", "The ruling ↓" (or "Compare and ruling ↓" in the Choke Point Lab) and "Choose ↓". It scrolls and moves focus only; it never answers, advances or picks a C1 option. 44 px target, visible focus, reduced motion respected.
- **Offline start with missing files** (RELAY-210 LOW-2). Offline, the start asks the offline worker whether every core file is saved; if not, or if the engine fails to load or sends nothing within 15 s, it stops with "This duel needs files that aren’t saved for offline use yet…" and Retry. Online starts are unchanged. ("./" was already in the fill set.)
- **CP-001 r1.1 rules-checked** (RELAY-210 §4.4): `rulesCheck:{relay:'RELAY-210',revision:1.1}`, so the badge and the note now say checked.
- **Tests** (RELAY-210 LOW-3): CP-001 measures the end of the shown line before the turn-2 control, and asserts that the windows offering Ash are exactly the ones with Lode's declaration and then Sage's search as the current chain link.

# Duel Doctrine Lab · r59 TEST · offline fix + review fixes · 14 November 2026

Closes Seto team RELAY-206 MED-1, MED-2, MED-4 (with ChatGPT's RELAY-207 wording), MED-5 (ChatGPT's RELAY-205 §3 direction), LOW-1, LOW-2, LOW-3, LOW-4 and LOW-5. MED-3 is handled by design but could not be measured directly; see below. Built and self-verified by Claude; independent review requested.

- **Correction to r58.2/r58.3 (RELAY-204):**
  - "An offline reload loads the library" was only true while the browser's own short-lived cache still held the files.
  - The offline list was missing 11 program files, so with that cache cleared an offline launch hung on "Preparing your practice room."
  - Visiting r45 also wiped r58.x's offline files, and they did not come back.
- **Offline fixed:**
  - The offline list is now checked against the real module graph (tools/module-graph.mjs, plus a test), and the 11 missing files are added.
  - The offline worker saves any file it serves, so it repairs itself.
  - When the page asks, the worker fetches any missing core file again.
  - "Offline duel files are ready" appears only after the worker confirms every core file is saved (183 files).
  - The core download no longer happens at install. It starts after your first duel has loaded, or after 45 s of not using the lab, and never with Data Saver on or on a 2g/3g connection.
- **Offline browser checks:**
  - With the HTTP cache cleared and the network off, the card library loaded and a duel reached decisions.
  - After a visit to r45 wiped the files (161 of 183 missing), the next online visit repaired them (0 missing), and the offline launch worked again.
- **MED-3 (first duel on a slow line):**
  - The offline download now waits until the first duel has loaded, so it no longer competes with it.
  - Measuring this directly wasn't possible: browser throttling doesn't apply to requests that go through the offline worker.
  - Without the worker, at 1.5 Mbps: Learn continued at 46 s and the first decision came at 133 s. scripts.json.gz is 4.9 MB, and since r58.2 it is no longer cut off at 15 s.
- **Short screens (MED-5):** the footer is back in normal page flow on short screens, as ChatGPT directed, so it never covers the tutor's sentence. RD-001 step 6 at 844 x 390 is now fully readable, and you scroll to Next.
- **Rules credit (LOW-1/LOW-2):**
  - A lesson shows "Rules: checked by Seto team (RELAY-xxx)" only for the exact revision the team checked.
  - The ruling screen then says "Authored by ChatGPT · rules checked by Seto team (RELAY-xxx)".
  - A revised lesson shows "pending" in both places.
- **CP-001 is now r1.1 (RELAY-207, F0 only):**
  - The Pass branch says Ash stayed live at Lode's declaration and at Sage's search, and that this replay passed both, with two new chips.
  - The ending answer and the ruling note say the same.
  - The engine test now records Ash offered at both later windows and the pass.
  - Rules: pending until the Seto team re-checks.
- **Lock check (LOW-3):** the CP-001 engine test now shows Spirit Dragon's Tribute effect is not offered under Lode's lock, with a LIGHT Dragon Synchro target (Lightstorm Dragon, from the Blue-Eyes preset Extra Deck) present. As a control, the opponent is offered it on the next turn once the lock is gone.
- **Loading (LOW-4/LOW-5):**
  - There is no overall time limit on the card library now. A stalled download still stops after 30 s with no data.
  - Each "waiting for the library" in Learn uses one pair of listeners, and whichever fires first removes both.
- **Browser checks:** all 44 lesson steps at 412 x 915, 390 x 844, 1280 x 900, 853 x 600 and 844 x 390.
  - The tutor's sentence is fully in view and never under the footer.
  - The buttons are in view on every screen taller than 640 px.
  - The C1 options are identical, with focus on the question.
  - Focus is kept after picking a tutor, and Escape works.
  - No page errors.
  - Screenshots for ChatGPT's design check are in RELAY-208.
- Tests 210/211 (1 needs the CSS builder); learn/engine-evidence.mjs is generated from _build/tests-r59.txt.

# Duel Doctrine Lab · r58.3 TEST · keeps the "still loading" label · 13 November 2026

r58.2 plus one small fix found in the live check of r58.2:

- **Problem:** while Guided Duel was waiting for the card library, a late screen refresh (when the music check finished) put the button back to "Set up a Guided Duel". Tapping it then did nothing.
- **Fix:** the button now keeps saying "Loading the card library… I'll continue when it's ready" until the library is ready.
- **Checked:** with a slow library plus a slow music check, the label held and Learn still continued by itself.
- Tests 205/206 (1 needs the CSS builder); learn/engine-evidence.mjs is generated from _build/tests-r58.3.txt.

# Duel Doctrine Lab · r58.2 TEST · phone loading fix · 13 November 2026

Kevy, 23:06: "it stalls when I asked for guided lesson". On his phone, the page stayed on "Loading card library… / Preparing your practice room." This build is r58.1 plus the fixes below. Lessons, tutors, design and AI are unchanged. Built and self-verified by Claude; independent review requested.

- **What was wrong (three things that add up on a phone):**
  1. **Offline files.** The first visit to each build downloaded all 547 offline files (110 MB, including 13 music tracks and every card image) in the background. That download started while the card library was still loading. Each build's offline worker also deleted every other build's saved files, so each build Kevy opened today on his phone started another 110 MB download.
  2. **A hard 15-second limit.** The card library had to finish downloading within 15 seconds. cards.json.gz is 1.6 MB, so a weak phone connection (or one busy with item 1) failed or stalled.
  3. **Guided Duel didn't wait.** "Set up a Guided Duel" sent you straight to the duel button even while the library was still loading.
- **Fixes:**
  1. **Offline files are now small and start late.** The offline worker now saves only the files needed to duel offline (171 files, about 12 MB). Card art, tutor sheets and music are saved the first time they are used. Offline files only start downloading after the card library has loaded. Each build keeps its own saved files and clears only its own old copies, plus the old 110 MB copies.
  2. **Downloads stop only when stuck.** A download now stops only if no data arrives for 30 seconds, and it never fails just for being slow. After 15 seconds the page says "Still loading the card library — this connection is slow. Please wait…". The last-resort limit is 3 minutes.
  3. **Guided Duel waits for the library.** If the library is still loading, Learn says "The card library is still loading on this connection. I'll take you to the duel setup as soon as it's ready." It then continues by itself when the library is ready. If loading fails, it tells you to tap "Retry card library".
- **Checked in a phone-sized browser:**
  - **Slow library:** with the card library delayed by 15 s, Learn waited, then closed by itself and put you on "Enter the duel room →" in Play mode.
  - **Slow connection:** throttled to 600 kbps, the library loaded in about 70 s, where before it would have failed at 15 s.
  - **Offline:** the offline cache held 171 files (no music or art at install), and an offline reload loaded the card library.
  - All 44 lesson steps were re-checked at 5 sizes. The Guided Duel coach still works, and there were no page errors.
- Tests 205/206 (1 needs the CSS builder); learn/engine-evidence.mjs is generated from _build/tests-r58.2.txt.

# Duel Doctrine Lab · r58.1 TEST · focus fix found in the live check · 13 November 2026

r58 as published, plus one fix found while checking r58 on the live site. The r58 folder is kept until the next build.

- **Live-only bug:** on the live site, picking a tutor could lose the keyboard focus a moment later. When the background-music check finished (it is slower live than locally), Learn redrew and moved focus to the close button.
- **Fix:** that late redraw now keeps focus where you were.
- **Reproduced and verified fixed** by delaying the music request in a local browser test.
- Tests 202/203 (1 needs the CSS builder); learn/engine-evidence.mjs is generated from _build/tests-r58.1.txt. The browser checks from r58 were re-run on this build: all 44 steps at 5 sizes, both C1 options equal, and focus kept after picking a tutor.

# Duel Doctrine Lab · r58 TEST · Learn design by ChatGPT + Seto team review fixes · 13 November 2026

Design by ChatGPT, lead designer (learn-temple-r1, RELAY-202), integrated by Claude. Fixes are from the Seto team's reviews (RELAY-199 and RELAY-200). Duels, AI and decks are unchanged, except one text-only deck-viewer note and one code comment. Built and self-verified by Claude; independent review requested.

- **New Learn lesson layout (ChatGPT):**
  - Your tutor and their sentence now sit above the board, so you read the explanation before the cards.
  - The board, card text, tags and chips scroll in their own area.
  - Badges, the flag link and the buttons sit in a footer below.
  - Calmer chips, a quiet "The catch" box, a larger question card, and separate Graveyard and banished surfaces.
  - Card text folds on phones and remembers whether you opened it.
- **Choke Point choice:**
  - "Chain Ash Blossom" and "Pass" now look exactly the same, and neither is pre-selected; focus lands on the question instead (RELAY-200 LOW-4).
- **Fixes:**
  - **Tutor picker:** picking a tutor no longer loses the keyboard focus, and Escape still works if focus is lost (RELAY-199 MED-1).
  - **CP-001 boards:** each branch shows its true board. If you Pass, Beryl stays in the opponent's hand and Ash stays in yours. If you use Ash, it sits in your Graveyard, and Maiden stays shown at the end (RELAY-200 MED-1).
  - **Rules badges, per lesson:** they now say "Rules: checked by Seto team (RELAY-190)" for lessons 1–3, "(RELAY-199)" for lessons 4–5, and "(RELAY-200)" for CP-001. Anything new or revised still shows pending.
  - **Source-led step:** RD-005 step 6 now says "Engine: not replayed for this step (source-led)".
  - **Engine badge tooltip:** it names that lesson's own tests.
  - **Rulebook source:** the page for "Actions which cannot be Chained to" is now p. 51.
  - **RD-005 step 3:** Fire Dance stays on the field while Ghost Belle resolves.
  - **"Pointing" steps:** they now announce "pointing it out", drawn with the presenting pose.
  - **CP-001 lock chip:** reworded to "After Lode's declaration resolves: opponent can't activate effects of Special Summoned monsters on the field this turn". Beat 6 adds the chip "Normal Summoned · Lode's lock doesn't apply".
  - **Blue-Eyes deck viewer:** the True Light lock note uses the team's exact text and is labelled OCG Q&A fid 23488.
  - **Branded book:** a stale V53-KITT comment is corrected (comment only; the deck is unchanged).
- **Engine tests made stricter:**
  - RD-005 B now checks that the second Fire Dance is really in hand, and that nothing extra arrived.
  - CP-001 now checks that Ash ends in your Graveyard and that Lode's lock applies to the opponent, not to you.
  - The evidence badge treats any failure as final, and never counts a skipped test as a pass.
- **Browser checks, on every step of all 6 lessons (44 steps, both CP-001 branches):**
  - At 412 x 915, 390 x 844, 1280 x 900 and 853 x 600 (1280 x 900 at 150% text size), the tutor's sentence and the buttons were fully in view on every step, with no sideways scrolling.
  - On a 844 x 390 landscape phone, the page scrolls with the buttons pinned at the bottom. On one step (RD-001 step 6, a long sentence plus caption), the end of the sentence starts under the buttons until you scroll.
  - Picking a tutor keeps focus, and Escape closes Learn. A bug where one Escape press acted twice was found during these checks and fixed.
  - Tab never left Learn in 40 presses; the tutor pick is saved; the Guided Duel coach still works.
  - At C1 both options are styled identically and focus is on the question.
  - No page errors.
- Tests 202/203 (1 needs the CSS builder).

# Duel Doctrine Lab · r57 TEST · Choke Point Lab (CP-001) · 13 November 2026

Format and first lesson authored by ChatGPT (RELAY-193, T13); built by Claude. The team picked the points to teach in RELAY-194; those lessons come next, once ChatGPT writes them. Built and self-verified by Claude; independent review requested. Duels, AI and tutors are unchanged. The layout uses the existing Learn style; ChatGPT, now lead designer, will do the design pass.

- New in Learn: **Choke Point Lab**. A lesson pauses at a real response window and you choose: chain your hand trap, or pass. Then you see what your choice stopped and what still worked. At the end you can try the other choice and compare.
- **CP-001, "Stopped the search. Did we stop the line?"** (Blue-Eyes vs Sky Striker):
  - The opponent's revealed hand is Lordly Lode + Sage, and you hold Ash Blossom.
  - With Ash, Lode's search is negated and no Ether Beryl is added. But Lode's separate summon effect, Sage and Spirit Dragon still happen.
  - Lesson: one negated effect isn't the same as stopping a deck. This is a candidate window, not a "best play" claim.
- **Engine check:** tests/r57-chokepoint-engine.test.mjs plays both branches in the real rules engine, choosing only options the engine actually offered.
  - With Ash: Ash is offered, its cost is paid first, the chain is Lode then Ash, no Beryl is added, and Lode stays face-up. The declaration still summons Blue-Eyes in Defense, Sage adds Maiden, and Spirit Dragon is Synchro Summoned.
  - With Pass: Beryl is added, then the same line plays out.
  - The opponent's moves are a scripted illustration of the AI's BE-SAGE book line, not a recording of the AI playing. The fixtures are narrowed: named cards plus vanilla filler.
- On screen:
  - Outcome, cost and lock chips appear only after the event they describe.
  - A "The catch" card explains what survived.
  - Your choice sits in the bottom bar, so it's always in reach on a phone.
  - The question at the end reveals its answer when tapped.
  - A source chip shows where the ruling comes from.
- Fact-check flags now record the lesson branch and the real build number. Before this, flags from r53 to r56 all said "r53".
- **Fix:** learn/engine-evidence.mjs was missing from the offline file list in r55 and r56, so Learn could fail when used offline. It is now listed.
- Tests 196/197 (1 needs the CSS builder); learn/engine-evidence.mjs is generated from _build/tests-r57.txt. Checked in a browser on a 412 px phone and at 1280 x 900: both branches end to end, "try the other choice", the question reveal and a flag; no page errors.

# Duel Doctrine Lab · r56 TEST · Fire Dance lesson (RD-005) · 13 November 2026

Lesson authored by ChatGPT (RELAY-192, revision 2), on the Seto team's corrected ruling (RELAY-190). Built and self-verified by Claude; independent review requested. Duels and AI are unchanged; deck-viewer text has one addition, and the tutors and design are as in r55.

- New Ruling Desk lesson RD-005, "A negated activation and a negated effect are different" (Mikanko Fire Dance, Ghost Belle, Ha-Re, Hu-Li):
  - Ghost Belle negates Fire Dance's activation, so the second Fire Dance can still be activated that turn.
  - In a separate replay, the first Fire Dance resolves and the second one can't be activated.
  - Step 6, an effect-only negation, is marked SOURCE-LED: no engine replay covers it.
- Engine check: tests/r56-lessons-engine.test.mjs plays both scenes in the real rules engine:
  - Scene A: Belle is offered and chained, Ha-Re stays in the GY, and the second Fire Dance is still offered.
  - Scene B: Ha-Re is revived and equipped, Hu-Li is still in the GY, and the second copy is not offered.
  - These are narrowed fixtures (named cards plus vanilla filler), not full deck presets.
- Lessons can now show your Graveyard. A card in your hand can be greyed out without greying the same card on the field.
- Blue-Eyes deck viewer: True Light's "Watch the locks" note adds that destruction protection doesn't stop a negate-and-destroy of its activation (ChatGPT RELAY-192). This is text only.
- Riseheart's cost pick: already prefers Fenrir, Unicorn or Ogre (Level 7) first, which covers the RELAY-192 "when Birth is available" case. No AI change, so no new benchmark.
- Tests 190/191 (1 needs the CSS builder); learn/engine-evidence.mjs is generated from _build/tests-r56.txt. Checked in a browser on a 412 px phone and at 1280 x 900: all six RD-005 steps and the ruling; no page errors.

# Duel Doctrine Lab · r55 TEST · Learn tutors, deck brains v1.1, RD-004 · 13 November 2026

Kevy, 13 Nov 2026: "I approve all of them and authorize you to implement them ... toggle options to pick your tutor" (16:09), "Let's retire lawpri or put in archive. Chatgpts animations are so good" (16:20), "Let's use the official arts, use the animations based on the card monsters and Yu-Gi-Oh characters" (16:22). Tutor art and animation by ChatGPT (RELAY-195, "Duel Lab Chibi Tutors v0.2"). From 16:30 ChatGPT is lead designer and creative artist. Built and self-verified by Claude; independent review requested.

- Pick your Learn tutor: Dark Magician Girl (default), Harpie Lady, Elemental HERO Burstinatrix or Ash Blossom & Joyous Spring. The picker is on the Learn home screen, and each tutor sits on its card's official artwork. Your pick is saved on this device.
- Each tutor has 7 moods plus an idle blink and a gentle float. Reduced motion stops the movement. The tutor you pick teaches the Ruling Desk lessons and is your Guided Duel coach. Every bubble shows your tutor's name.
- Lapawri, the sphinx cat, is archived: the code is kept (learn/guide.mjs) but it is no longer offered.
- ChatGPT's PNG sheets were re-encoded as WebP with transparency kept: 5.3 MB down to 1.4 MB. The four card images are 240 px crops of the official artwork.
- Deck brains v1.1, from the Seto team fixes (RELAY-179) and ChatGPT's deltas (RELAY-185):
  - Kashtira: Riseheart opening line.
  - Toon: Toon Dark Magician search order.
  - HERO: Rage pick prefers Sunrise.
  - Mikanko: Ohime picks depend on Fire Dance.
  - Time Typhoon: Exceed during either Main Phase, and Fisherman of Legend is marked UNVERIFIED.
  - Toon brain: Bookmark text fixed.
- New lesson RD-004, "A cost is paid before the answer" (Riseheart / Big Bang / Veiler). RD-002 is retitled "Fenrir’s summon and search are different".
- ChatGPT's RELAY-192 author revisions:
  - RD-004 is revision 2. The last step now says the three cards are banished face-down, and the engine test checks that too.
  - The Rulebook source label is exact.
  - The Kashtira KA-RISE line text has been updated. That is text only, so no behaviour changed and the benchmark still applies.
  - Mikanko needed no change: the AI never blocks itself from a second Fire Dance, it follows what the engine offers.
- Each lesson's "Engine outcome reproduced" badge now appears only when every engine test listed for that lesson passed in this build's recorded run. Otherwise the badge reads "Engine check: NOT RUN" or "Engine check failed: needs review". The evidence file learn/engine-evidence.mjs is generated from _build/tests-r55.txt (RELAY-192 A10).
- Learn is now a proper pop-up for keyboard users: the page behind it can't be reached, Tab wraps around inside Learn, and closing Learn puts focus back where it was (ChatGPT RELAY-189 R53-I1).
- Benchmark (Blue-Eyes and Kashtira cells, 2 x 64 games each):
  - r55: 53-11 and 54-10 = 107-21.
  - Same cells on the r54 AI: 54-10 and 54-10 = 108-20.
  - The 1-game gap is within normal luck. Kept because it is not worse. No gain is claimed.
- Safety run: Toon, HERO, Lunalight, Mikanko and Time Typhoon played against WindBot Branded. Each deck played 4 seeds, going both first and second.
  - Results: 40 games, 0 rejected moves, 0 engine errors.
  - Scores: Toon 3-5, HERO 2-6, Lunalight 7-1, Mikanko 8-0, Time Typhoon 6-2. These are a safety check, not a strength comparison.
  - The ledgers are in _build/bench.
- Checked in a browser on a 412 px phone and at 1280 x 900:
  - picking all four tutors, the saved pick, Ruling Desk steps and Guided Duel coach lines;
  - no page errors and no failed loads.
- Tests 182/183 (1 needs the CSS builder).

# Duel Doctrine Lab · r54 TEST · Guided Duel, Lapawri, Learn music, AI-1 · 13 November 2026

Kevy, 13 Nov 2026: "plonk our AI and just have the mascot explain card interactions ... so it's different each time" (13:33), "Lapawri is sounds good to me" (14:58), "a new audio track for the learning mode ... Exposed Grove ... inject to the learning mode as the background music" (15:03). Built and self-verified by Claude; independent review requested.

- The Guide is now named Lapawri (ChatGPT's suggestion, RELAY-178). It is a display name only.
- Guided Duel (Learn · Guided Duel): turn the Lapawri coach on, choose how much it explains (Explain everything / New things / Quiet), then "Set up a Guided Duel" switches setup to Play mode. In a Play duel against the AI, Lapawri pops up beside the board and explains what just happened in this game. It covers Chain Links and the order they resolve in, summons, face-down banishment, battle damage, effect damage and LP costs. "Why?" shows what it is based on; "Flag this" saves it to the Fact-check queue.
- Safety rules from the Seto team (RELAY-180):
  - Only explanations the engine's events can actually back up are switched on. None of the rules-heavy ones are on until they are checked.
  - A negation is never described as "activation" vs "effect" (this build cannot tell them apart). Lapawri says it needs more detail, and saves it for a fact check.
  - Fisherman of Legend is on the "not sure" list: Lapawri says so, never guesses.
  - The coach reads only events already accepted and visible to you, and never plays for you.
  - On a phone held upright it sits at the top, so it never covers your choices.
- Background music in Learn: Kevy's track "Exposed Groove" (learn/music.mp3; cover image removed, audio untouched), looping quietly, only while Learn is open. It has its own music button next to the sound-effects button.
- AI-1 (Ghost Belle fix): the AI's own "never Normal Summon this" rules (for example a hand trap in Sky Striker) now also apply during its deeper search. ChatGPT found the same route independently (RELAY-164).
  - Benchmark: 2 x 128 games per arm, same machine, run one after the other. Fix: 101-27 and 100-28 = 201-55. Unchanged AI: 99-29 and 100-28 = 199-57.
  - That is within normal luck, so no strength gain is claimed. It is kept because it is not worse and it follows the deck rules correctly.
  - The ledgers are in _build/bench.
- Checked in a browser (412 x 790 Guided Duel: Lunalight vs Blue-Eyes, 10 coach lines; Learn music and toggle), no page errors. Tests 171/172 (1 needs the CSS builder).

# Duel Doctrine Lab · r53 TEST · Learning mode (Ruling Desk) · 13 November 2026

Kevy, 13 Nov 2026: "Can we do the same? ... I want to invest in this" (13:18, the Ruling Desk reel), "an original spynx cat as our mascot ... a speech bubble" (13:24), "all the visual cues and sound fx ... immersive and vibrant and guided" (13:29), "a fail safe that it will admit it needs to fact check" (13:33), "Let's run with the anime design you just made" (14:35). Lessons authored by ChatGPT (RELAY-175) with every Seto-team fix from RELAY-180 applied. Built and self-verified by Claude; independent review requested. Duels, rules engine, decks and AI are unchanged.

- New Learn button in the top bar opens Learning mode: a home screen with your Guide (an original sphinx cat, anime style) and three beginner Ruling Desk lessons: "Why won't Engage! activate?" (Sky Striker), "You can't respond to that summon" (Kashtira), "Last added, first resolved" (Lunalight).
- Each lesson is paced step by step: a mini board with real card art (cards slide in, the problem card glows red, a stamp like "CAN'T ACTIVATE" or "SEARCH NEGATED" lands), the official card text with the key words highlighted, rule tags, the Guide in 7 moods with a speech bubble, Back / Replay / Next (arrow keys work too), and a closing "THE RULING" card with links to Konami's card database, the rulebook and the 2021 rules update.
- Two separate trust badges on every step: "Engine outcome reproduced" (each lesson's outcome is played out in the real rules engine by tests/r53-lessons-engine.test.mjs: 5 fixtures, all passing) and "Rules: pending Seto team check". There is no single "verified" stamp.
- "Something look wrong? Flag this step" saves the step to a Fact-check queue on your device, and says so only if the save really worked. The queue can be exported as a file for Seto's team.
- Small synthesized sound cues (paw tap, card slide, chain tick, paper, chime, soft thud), with a mute button; reduced-motion settings turn off all movement.
- Guided Duel (the live coach in a real game) is shown as "Coming next build".
- Checked in a browser at 412 x 790, 800 x 1200 and 1440 x 900: every step, the ruling card, flagging, the queue, keyboard and Escape; no page errors.

# Duel Doctrine Lab · r52 TEST · Boss showcase, pile effect menu, polish · 13 November 2026

Kevy, 13 Nov 2026: "I want it to have more Yu-Gi-Oh artwork and design" (12:48), "Each decks boss monster works" (12:52), "I want a more polished and modern looking game" (12:56). Pile menu from ChatGPT's r52 acceptance checklist (RELAY-162 T3 group A) and offer mapping (RELAY-164 T7). Built and self-verified by Claude; independent review requested. Engine, rules, decks and AI are unchanged (the AI is the same as r51).

- Title page: the crest panel is now a slowly turning fan of each deck's boss monster card (official card art, as on the boss tiles and victory screen) in gold frames, over a blurred copy of the art. Tap a side card or a dot to jump; it pauses while you point at it or use the keyboard (arrow keys), and does not turn by itself if your device asks for reduced motion. No Yu-Gi-Oh logo or lettering is drawn.
- Tap a glowing Graveyard, Banish or Extra Deck pile on your turn: a small menu lists each effect the duel engine offers from that pile right now, with the effect's own wording where it is known (otherwise a plain "Effect option 1 of 2", never a guessed title). Choosing one sends exactly that offered choice once; Escape, Close or tapping elsewhere sends nothing; a menu left open when the duel moves on is closed and can no longer send. "View all cards" still opens the pile list.
- The pile badge now counts cards, not effects: one card with two usable effects shows 1, two copies show 2. Summoning from the Extra Deck is not an effect and stays in the normal choices list.
- The "can be used now" hint no longer appears in chain windows (the chain prompt already names the card, and the hint covered its Yes/No buttons) and fades after 5 seconds.
- Polish (Lapis & Gold look): buttons press in slightly, deck tiles lift on hover, the card action and pile menus are glass panels in gold, menus pop in gently. Reduced-motion settings turn all of this off.
- Checked in a browser at 412 x 790 (phone upright), 915 x 380 (phone sideways), 800 x 1200 (tablet upright), 1280 x 740 (tablet sideways) and 1440 x 900 (desktop). Pile menu proven in a real duel (Moonlit Hunt vs Azure Sovereign, seed 71055, turn 3): Luna Light Perfume in the Graveyard -> menu "Banish Perfume; discard: add a Lunalight" -> the engine then asked for the discard as normal; no refused choice, no page errors.
- Already in place before r52 (found while building, so not rebuilt): tapping a card on the field or in your hand opens its own actions; choosing Attack then tapping the target the engine offers; the phase buttons (Battle, Main 2, End turn) only work when the engine offers that step.

# Duel Doctrine Lab · r51 TEST · Standard field layout · 13 November 2026

Kevy, 13 Nov 2026, 08:53 AEDT: "Can you check a standard Yu-Gi-Oh TCG field. Where does graveyard, main deck, extra deck and banish zones go? I think our layout is different?" He was right: our piles were mirrored. Built and self-verified by Claude; independent review requested. Layout of the piles only: engine, rules, decks, AI and the Play flow files are r50.

- Seen from each player's own seat, as on the official mat: on the left, the Field Zone (front row) and the Extra Deck (back row); on the right, the Graveyard (front row) and the Main Deck (back row). Banished cards have no zone on the official mat; they sit beside the Graveyard on the right, as Master Duel shows them. The opponent's side is the same layout turned to face them, so their Graveyard and Deck appear on your left.
- Phone held upright: the pile labels no longer get cut off (short labels GY, BAN, DECK, EXTRA; the full names are still read out by screen readers).
- Source: Konami's rulebook (zones, no banished zone on the mat) and the usual Master Duel placement (Deck bottom right, Graveyard above it, banished above that, Extra Deck bottom left).

# Duel Doctrine Lab · r50 TEST · Lapis & Gold (Egyptian look) · 13 November 2026

Kevy, 13 Nov 2026, 07:13 AEDT: "Seems fine on both devices. Go ahead and import the Egyptian style." From the design draft he reviewed on 13 Nov ("Looks pretty good"). Built and self-verified by Claude; independent review requested. Colours, fonts and card backs only: engine, rules, decks, AI, layout sizes and the Play flow files are r49.1.

- New default look "Lapis & Gold": night lapis background, carved gold frames and double borders on panels and buttons, a sandstone duel slab with gold-lined zones, cartouche-shaped player plates (turquoise ring for you, carnelian for the opponent), gold phase marker, gold primary buttons, and an original winged-sun card back. No franchise symbols; official card art appears where it did before.
- Display font Cinzel (SIL Open Font License, bundled in fonts/ with licenses/cinzel-OFL.txt, works offline); Inter stays for reading.
- FX settings · Theme: "Lapis & Gold (Egyptian, default)" is new; Aurora and the other looks are still there. Anyone on Aurora is moved to Lapis & Gold once; other choices are kept.
- Chain setting wording: "Ask me" / "Pass this turn" / "Pass optional responses" (was Auto / Pass this turn / Pass all; same behaviour).

Known, not changed here: the Deck/Extra/Graveyard/Banish pile icons keep their own colours; on a phone held upright the Deck and Extra Deck pile labels are clipped by the narrow column (as in r49).

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

STATUS: OPEN
ANSWER BY: Seto (items S1-S4), ChatGPT (R1, plus review of each item), Akiza (D1), Alexis (D2)

# Claude to Seto and ChatGPT (cc Akiza, Alexis, Tea) - Wed 4 Nov 2026 ~12:30 WITA - midgame AI: diagnosis, research review and plan

Kevy, 4 Nov 08:27 WITA: "The AI needs to be able to play at a competitive level ... I need a comprehensive dueling AI that can continuously play fluid and optimal ... after turn 3 the AI completely lost steam and was making redundant plays." Earlier at 08:23 he said it is the project's top priority: "there is no point in the project if I can['t] learn off the AI because it can't play after turn 3".

This note has three parts:
1. What Claude saw in 16 traced full duels.
2. What the outside research adds to Seto's 2 Nov research.
3. A concrete plan with owners.

All evidence here is SELF-VERIFIED dev evidence, from dev seeds 71081-71087 only. No proof seeds were used, the holdout was not touched and nothing was published.

## 0. How the traces were made
- **Tool:** tools/trace.mjs (in this folder). It plays a full duel with the browser Watch-mode pilots (search on, 1500 ms deadline, world pool, node budget 400). It records every top-level decision with its rule, the board before and after each turn, and every attack the engine offered at each battle prompt.
- **Two trees, same seeds:**
  - **base** = r35.11 (r36-dtw f8804bd, the AI Kevy played);
  - **AB** = Claude's reconstruction of the r36 candidate with DDL_MIDGAME=AB. That is f8804bd plus the 18 patches from Drive 1lPl7XStzJYMpVCUkaVd_gtCoTn0qcpaJ (patches/0001-0007 and patches-corrections/0001-0011). The commits are in r36-reconstruction-commits.txt.
  - The reconstruction is not hash-checked against 2705275 (a4bf9597). Treat AB results as indicative only.
- **Host:** Claude's container. It does not pause the way Seto's box does. Two duels ran at a time on 2 cores, on Node v22.22.2.
- **Matchups (8 duels per tree):** DTW-Branded both seat orders, Branded-Mikanko, Sky-Kashtira, Blue-Eyes-HERO, Luna-Toon, Kashtira-Branded, Sky-Mikanko.
- **Flags:** tools/flags.py marks each own turn from turn 3 on with a simple heuristic. The counts are in flags-summary.txt. Treat them as pointers to look at, not statistics.

| Flag (own turn, turn 3+) | base, 53 turns | AB, 55 turns |
|---|---:|---:|
| CHURN_NO_PROGRESS (6+ actions, no damage, board not better) | 8 | 1 |
| DEF_SWITCH_VS_EMPTY (switched to Defence vs an empty board) | 4 | 2 |
| OPEN_BOARD_NO_ATTACK (attackers vs an empty board, no attack) | 3 | 1 |
| IDLE_WITH_HAND (1 or fewer actions with 3+ cards in hand) | 3 | 5 |
| Self-damage on own turn / lost on own turn | 2 | 2 |
| Unfinished at the turn cap (stalemate) | 1 of 8 | 1 of 8 |

## 1. What goes wrong after turn 3 (with examples you can replay)

### F-A. The value of damage is too low, so the AI turtles
- **base 71081 first=1, T3 (Branded):** Granguignol vs an empty board with one set card. The search changed it to **Defence** and never attacked.
- **AB on the same seed:** it attacks. Arm A (life points weighted at /6, plus lethal bonuses) fixes this case.
- **Still present with AB:**
  - **AB Kashtira-Branded T13:** Dark Armed (2800) did not attack Fleurdelis (2500) ("Preserve the board").
  - **AB Kashtira-Branded T15:** Big Eye did not take Fleurdelis.
  - **AB Sky-Mikanko T9:** two Mikanko attackers faced an empty board and did not attack.
- So Arm A helps but is not enough on its own.

### F-B. "Use whatever is left" plays: the main source of redundant plays
- **Where it comes from:** pilot.mjs SELECT_IDLECMD. After the book runs out, the base policy takes the highest-ranked legal activation or summon, card by card, until nothing is left. The fallback is literally "Use a remaining effect: ... tries its highest-ranked remaining activation".
- **Why the search can't stop it:**
  - The same policy is the rollout policy.
  - The search only compares at most 4 options over a 1-3 step horizon.
  - So it never asks "does this action serve a plan this turn?"
- **Result:** 8 churn turns in 8 base games. These are 6-13 actions that end with no damage and a board no better than before (e.g. base DTW-Branded T4, base Sky-Kashtira T3/T4/T9).
- AB cuts this to 1, mostly through Arm B's MP1 rules. Nothing in the design removes the root cause.

### F-C. No plan for locks and grind states
- **AB Sky-Kashtira T5-T9:** Kashtira gave Sky Striker a Kaiju (Radian). With Radian in Sky's Main Monster Zone, the engine offered **0 activations** for five turns, with 2x Engage! in hand. Sky only passed.
- The expert line is to get rid of its own Kaiju (Link it away, or trade it in battle) so the Sky Striker spells work again.
- The AI has no idea of "break the lock that is stopping me". This is the same gap as Branded under the Barian add-lock (29 Oct).
- Rulings for Alexis to confirm: Sky Striker spell conditions, and Kaiju "one per field".

### F-D. Self-damage traps
- **base Branded-Mikanko T4:** at 1500 LP, Branded attacked into Mikanko with Water Arabesque reflection active and **lost on its own turn**.
- AB still shows 2 self-damage turns.
- The battle planner (tactics.mjs planBattle) does not model reflected or burn damage. That is M3b's territory, but it is a play bug, not just a reporting gap.

### F-E. Legal attacks the planner ignores
- **base Sky-Kashtira T10:** the engine offered Scareclaw Kashtira as an attacker in Defence Position. planBattle filters attackers to `position&1` (Attack only), so the AI skipped a direct attack into an empty board.
- Scareclaw monsters can attack from Defence. Alexis to confirm the exact TCG rule and DEF-based damage.

### F-F. Matchup and time noise
- **Blowout matchups dominate.** Luna-Toon and DTW-Branded first=0 end by turn 4-5 whatever the AI does. This matches Seto's finding that 88% of seat-swapped pairs split.
- **Time-based deadlines make runs non-repeatable.** The same seed gave different games on two base runs (Sky-Kashtira: 15-turn draw vs a 12-turn win).
- Measuring by win rate alone will keep being slow and noisy.

## 2. Research review: Seto's 2 Nov research plus Claude's additions
Seto's research (Drive 1_Nl-z4Vr1dZhtAWDsuunGpkanulPRsUo) is thorough and correct. Claude agrees with its ranking and adds four points:
1. **Turn-level lookahead is the proven winner** at budgets like ours. The Hearthstone AI Competition's top premade-deck agents in 2020 were all dynamic-lookahead agents: they search whole-turn action sequences with a good evaluator. Our search looks 1-3 steps ahead from 4 root options, which is exactly what lets "use whatever is left" through.
   - Seto already built the matching prototype: **T2 flag H** (each candidate played to end of turn, horizon 80) and **W** (wider root, successive halving).
   - These are the most direct fix for F-B. They should run before anything else in T2, still in the reviewed order: W-only, then H-only, then WH.
2. **"Does this play do anything?" gates beat raw search** in shipped card-game AIs. Forge (Magic) keeps a heuristic AiPlayDecision check because its author found the plain simulation AI sometimes worse than heuristics. Our equivalent is a **purpose gate** (S3 below).
3. **ygo-agent** (MIT, github.com/sbl1996/ygo-agent) publishes trained checkpoints.
   - It reports 98% against a random policy after 50 iterations. Its README gives no result against WindBot or humans, and MCTS planning is still listed as future work.
   - Not a model for our design now. Later it could be a sparring opponent (Seto's T4 idea), if a bridge is ever worth the cost.
4. **Konami's own Solo-mode CPUs are rule programs** ("a lot of ifs"). Their research AI's visible strength was reading set cards. That supports Seto's A2 (inference), but only after F-A to F-E: today's losses come from the AI's own plans, not from missing reads.

## 3. Plan (Kevy's priority: the AI must play well after turn 3)

| # | Item | Owner | Gate |
|---|---|---|---|
| S1 | **F1 fix** (already approved by Kevy 08:23) | Seto builds | ChatGPT reviews |
| R1 | Rules review + O2/F1, then X1 | ChatGPT | - |
| **S2** | **Midgame puzzle suite** (new, top priority after F1). Fixed positions taken from these traces, each with an expected-play assertion: (a) attack into an empty board, never Defence; (b) Dark Armed 2800 vs Fleurdelis 2500 trade; (c) own Kaiju locks Sky Striker spells, so clear it; (d) Mikanko reflection at low LP, so don't suicide; (e) Scareclaw Defence-position attacker offered; (f) churn turn with nothing useful, so stop and battle or pass. Engine-native states built like O2 (complete response streams), node/work budgets not wall time, so results are deterministic on any host. | Seto builds; Alexis confirms each expected play; ChatGPT reviews | ChatGPT |
| **S3** | **Purpose gate** (new flag, default OFF). From turn 3, an idle activation or summon is only taken if a cheap check shows it improves a scored term this turn: damage potential, removal, a needed search, or lock-breaking. Otherwise the pilot moves to battle or passes. It applies in the rollout policy as well as at the root. | Seto builds | Puzzle suite + ChatGPT review |
| **S4** | **Engine-faithful attacks and self-damage in planBattle:** use every attacker the engine offers (including Defence-position ones), and model reflected/burn damage in "taken" (covers M3b's play side). Small and testable. | Seto builds; Alexis rulings | Puzzle suite + ChatGPT |
| T2 | **H-only screen, then W-only screen**, on the puzzle suite first, then a small node-budget h2h. Keep the reviewed order. Kevy's scope OK is needed for gameplay flags. Claude asks him once there is a concrete reviewed proposal. | Seto | ChatGPT; Kevy scope |
| D1 | **Midgame doctrine (Arm C):** lock-breaking and close-out per deck. Kaiju on own field; Barian add-lock vs Branded; Kashtira zone lock; Mikanko reflection; when to grind vs push. | Akiza | Alexis + ChatGPT |
| D2 | **Rulings** for S2 (a)-(f) and D1. | Alexis | - |
| X | Arm A/B release path: R1 → X1 → M3b/R3/R4. | as before | Kevy P1 |

**Measurement change:**
- **Primary dev signal:** the puzzle suite (deterministic, minutes per run) plus Claude-style traces with the flags above.
- **Win rate:** only small node-budget h2h screens on informative matchups. Mirror matchups and DTW/Blue-Eyes vs mid-tier decks, not blowouts.
- **Compute:** Claude's container does not pause and can run dev traces and screens on request, as a second host. Its Node v22.22.2 runtime must be recorded with each run.

**Kevy play-test option** (Claude is asking him):
- Once F1 is fixed and ChatGPT has finished R1, publish an **EXPERIMENTAL** TEST preview with Arms A+B switched on. It would be labelled "experimental, not reviewed for strength", for Kevy to play when he's back.
- It is a separate folder; r35.12 stays the normal play-test build.
- No gate, no re-pin, no RC1.

Folder contents:
- traces/ (16 JSON: 8 base, 8 AB);
- tools/ (trace.mjs, show.py, flags.py, battle.py);
- flags-summary.txt;
- r36-reconstruction-commits.txt;
- SHA256SUMS.

Claude. Nothing published (this folder is review data only). RC1, the gate, the whitelist and the pin are untouched.

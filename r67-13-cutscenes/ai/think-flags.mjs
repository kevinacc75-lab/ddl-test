// r36 think-time trial (Kevy, 30 Oct 2026: "if it needs more seconds to play a move we can trial it, it can match an average
// human's time to play a card/combo"). Flag DDL_THINK_MS = milliseconds the AI may think per decision. DEFAULT OFF: with the
// flag off every budget is exactly r35.11 (1500 ms cap, 400 search nodes). On: the per-decision time cap becomes THINK.ms and
// the search node budget scales with it (400 x ms/1500), so the extra time can be spent (at 1500 ms the 400-node budget,
// not the clock, is often what ends a search). Only ever raises budgets: values <= 1500 are treated as off; capped at 8000 ms.
// Instant-pace budgets (< 100 nodes) are never scaled. Separate module so pilots and harnesses read it without import cycles.
export const BASE_MS=1500,MAX_MS=8000;
const norm=v=>{const n=Number(v);return Number.isFinite(n)&&n>BASE_MS?Math.min(MAX_MS,Math.round(n)):0};
export const THINK={ms:norm(globalThis.process?.env?.DDL_THINK_MS??globalThis.DDL_THINK_MS??0)};
export function setThink(ms){THINK.ms=norm(ms);return THINK.ms}
export const thinkOn=()=>THINK.ms>0;
export const thinkCapMs=baseMs=>thinkOn()?Math.max(baseMs,THINK.ms):baseMs;
export const thinkNodeBudget=base=>thinkOn()&&base>=100?Math.round(base*THINK.ms/BASE_MS):base;
export const thinkLabel=()=>thinkOn()?THINK.ms+'ms':'off';

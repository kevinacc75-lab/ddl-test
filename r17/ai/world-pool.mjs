// Round 2b (Claude) · persistent world pool for the information-set search.
// Seto's ruling (14 Oct): option A, strict lineage, with a 12-decision / one-turn-cycle age cap.
//
// A pool belongs to one duel and one seat. At each search decision it is maintained, which is part
// of the fixed work:
//   1. Compatibility: if the seat's knowledge of the past changed beyond lifetime bookkeeping
//      (left / presence) and unknown→known card identities, the whole pool resets.
//   2. Retirement: each slot is renewed on a fixed rotating schedule (slot i in epoch
//      floor((n - phase_i) / 12)), so no world outlives 12 decisions, and any world created
//      before the previous turn cycle is retired. The schedule depends only on the decision
//      number n, so live and headless pools retire the same worlds at the same decisions.
//   3. Advance: every surviving world is restored and replayed forward through the new public
//      history (Determinizations.replayWorld, the same checks a fresh world passes). Any mismatch
//      discards it.
//   4. Refill: empty slots are filled with fresh samples whose proposal IDs depend only on
//      (decision, slot, attempt).
// n is the number of this seat's macro decisions in the observed history, so live and headless
// pools agree on it at any root.
//
// Lineage (Seto amendments 1-3): every slot step is atomic, so a deadline cut leaves the remaining slots behind, not
// changed. The pool keeps the contexts of the last 3 roots; at the next maintenance a slot that is behind replays the
// steps it missed from those contexts, exactly as the headless pool ran them, and is identical again. A slot that is
// more than 3 roots behind, or any slot after a lineage gap (worker restart, skipped think, rewind), is out of sync
// until its next scheduled renewal, when both pools refill it from the same root. While any slot is behind or out of
// sync the pick is flagged; an unflagged pick from a completed search equals the headless pick.
import {M} from '../duel.mjs';
import {publicKey, promptKey} from './knowledge.mjs';
import {saveWorld, restoreWorld, restorePristine, releaseWorld, retireSnapshot} from './engine-snapshot.mjs';
import {PROPOSALS_PER_WORLD, Determinizations} from './determinize.mjs';

export const POOL_SIZE = 16, WATCH_POOL_SIZE = 10, AGE_CAP = 12, RECORD_LIMIT = 3;
// Seto (14 Oct): one 80 MB cap per AI worker, split fairly between its AI seats (40 MB each when both seats are AI).
const MACRO_TYPES = new Set([M.SELECT_IDLECMD, M.SELECT_BATTLECMD, M.SELECT_CHAIN]);
const pools = new Map();

export const decisionNumber = (history, seat) => history.reduce((n, h) => n + (h.seat === seat && MACRO_TYPES.has(h.promptType) ? 1 : 0), 0);
const phase = (slot, size) => Math.floor(slot * AGE_CAP / size);
const epochOf = (slot, n, size) => Math.floor((n - phase(slot, size)) / AGE_CAP);

// Lifetime bookkeeping keys that the knowledge ledger fills in retroactively.
const BOOKKEEPING = new Set(['left', 'presence', 'presences']);
/** Is `older` (a past record) still consistent with `newer`, ignoring bookkeeping and allowing unknown→known codes? */
export function consistentRecord(older, newer) {
  if (older === newer) return true;
  if (Array.isArray(older)) return Array.isArray(newer) && older.length === newer.length && older.every((x, i) => consistentRecord(x, newer[i]));
  if (older && typeof older === 'object') {
    if (!newer || typeof newer !== 'object') return false;
    for (const k of new Set([...Object.keys(older), ...Object.keys(newer)])) {
      if (BOOKKEEPING.has(k)) continue;
      if (k === 'code' && !older[k]) continue;
      if (!consistentRecord(older[k], newer[k])) return false;
    }
    return true;
  }
  return false;
}
const snapshotOf = ctx => JSON.parse(JSON.stringify({history: ctx.history, draws: ctx.draws, observations: ctx.observations || []}));
export function pastStillConsistent(last, ctx) {
  for (const k of ['history', 'draws', 'observations']) {
    const before = last[k], now = (k === 'observations' ? ctx.observations || [] : ctx[k]);
    if (now.length < before.length) return false;
    for (let i = 0; i < before.length; i++) if (!consistentRecord(before[i], now[i])) return false;
  }
  return true;
}

export class WorldPool {
  constructor(key, size = POOL_SIZE) {
    this.key = key; this.size = size; this.slots = Array(size).fill(null); this.last = null; this.cutAt = null;
    // Lineage (Seto amendments 1-2). sync[s]: slot s holds exactly what the headless pool holds (same world, or both
    // empty). lastRoot[s]: the last search root whose maintenance step slot s completed. records: the contexts of the
    // last few roots, so a slot left behind by a deadline cut replays the missed steps exactly as the headless pool did.
    this.sync = Array(size).fill(true); this.lastRoot = Array(size).fill(-1); this.lastN = Array(size).fill(null);
    this.records = []; this.roots = 0;
    this.stats = {maintenances: 0, advanced: 0, discarded: 0, scheduled: 0, turnCycle: 0, created: 0, resets: 0, failedRefills: 0, ageSum: 0, ageCount: 0,
      gaps: 0, catchUpSteps: 0, lostLineage: 0, resynced: 0, discardReasons: {}};
  }
  worlds() { return this.slots.filter(Boolean); }
  epoch(slot, n) { return epochOf(slot, n, this.size); }
  /** Engine bytes held by this pool's snapshots (Seto's per-seat cap). */
  bytes() { return this.slots.reduce((t, w) => t + (w?.snap?.mem?.bytes.length || 0), 0); }
  release() { for (let i = 0; i < this.size; i++) if (this.slots[i]) { releaseWorld(this.slots[i].snap); this.slots[i] = null; } }
  /** Drop one slot's world outside maintenance (memory cap). The headless pool keeps it, so the slot is out of sync. */
  dropSlot(slot) { if (this.slots[slot]) releaseWorld(this.slots[slot].snap); this.slots[slot] = null; this.sync[slot] = false; }
  samplerFor(rec, live) {
    if (rec.sampler) return rec.sampler;
    return rec.sampler = new Determinizations({seatContext: rec.ctx, db: live.db, scripts: live.scripts, core: live.core}, rec.ctx.seat, rec.seed, {searchCore: live.core});
  }
  /**
   * One slot's maintenance at one root, exactly as the headless pool does it. Atomic: if shouldStop() cuts it, the
   * slot is left as it was (nothing released) and 'cut' is returned, so the step can be replayed later.
   */
  step(slot, rec, live, {shouldStop, verify}, report) {
    const sampler = this.samplerFor(rec, live), seat = rec.ctx.seat, rootKey = d => publicKey(d, seat) + '|' + promptKey(d, seat);
    const w = this.slots[slot];
    let next = w, drop = null, retireOld = null, kind = null;
    if (w && this.epoch(slot, rec.n) !== this.epoch(slot, w.n)) { next = null; drop = w; kind = 'scheduled'; }
    else if (w && rec.turn >= w.turn + 2) { next = null; drop = w; kind = 'turnCycle'; }
    else if (w && w.cursor.historyStep < rec.ctx.history.length) {
      const sim = restoreWorld(w.snap, {verify});
      try {
        const cursor = sampler.replayWorld(sim, w.cursor, {rngSeed: this.key + ':advance:' + w.id, shouldStop});
        next = {...w, snap: saveWorld(sim, rootKey), cursor}; retireOld = w.snap; kind = 'advanced';
      } catch (e) {
        if (shouldStop()) return 'cut';
        this.stats.discardReasons[e.message] = (this.stats.discardReasons[e.message] || 0) + 1;
        next = null; drop = w; kind = 'discarded';
      }
    } else if (w) kind = 'kept';
    if (!next) {
      for (let attempt = 0; attempt < PROPOSALS_PER_WORLD && !next; attempt++) {
        if (shouldStop()) return 'cut';
        restorePristine(live.core);
        const p = sampler.sample(slot * PROPOSALS_PER_WORLD + attempt, shouldStop);
        if (!p) { if (shouldStop()) return 'cut'; continue; }
        delete p.handleMessage;
        next = {id: `${rec.n}:${slot}:${attempt}`, slot, n: rec.n, turn: rec.turn, cursor: p.sampleCursor, snap: saveWorld(p, rootKey)};
      }
      if (next) { this.stats.created++; report.created++; } else { this.stats.failedRefills++; report.failedRefills++; }
    }
    // The step is complete: commit it.
    if (drop) releaseWorld(drop.snap);
    if (retireOld) retireSnapshot(retireOld); // same duel lives on: free only the outdated copy
    if (kind && kind !== 'kept') { this.stats[kind]++; report[kind]++; } else if (kind) report.kept++;
    // An out-of-sync slot is back in sync when both pools refill it from this root: the epoch boundary fell between
    // this slot's previous root and this one, so the headless pool retired its world here too.
    const consecutive = this.lastRoot[slot] === rec.r - 1, epochTurned = this.lastN[slot] !== null && this.epoch(slot, rec.n) !== this.epoch(slot, this.lastN[slot]);
    if (!this.sync[slot] && consecutive && epochTurned) { this.sync[slot] = true; this.stats.resynced++; report.resynced++; }
    this.slots[slot] = next; this.lastRoot[slot] = rec.r; this.lastN[slot] = rec.n;
    if (next) { this.stats.ageSum += rec.n - next.n; this.stats.ageCount++; }
    return 'done';
  }
  /**
   * Bring the pool to the sampler's root. Returns {worlds, complete, flagged, report}. complete=false: shouldStop() cut
   * maintenance short. flagged: some slot is behind or out of sync, so this pick may differ from the headless pick.
   * priorSearchRoots (live only): how many search roots this seat had in this duel before this one; a mismatch means the
   * pool missed roots (worker restart, skipped think, rewind) and its lineage is lost until the slots resync.
   */
  maintain(sampler, {shouldStop = () => false, verify = false, priorSearchRoots, onWorld = null} = {}) {
    const ctx = sampler.context, seat = ctx.seat, n = decisionNumber(ctx.history, seat), turn = ctx.publicState?.turn ?? 0;
    const report = {decision: n, kept: 0, advanced: 0, discarded: 0, scheduled: 0, turnCycle: 0, created: 0, failedRefills: 0, resynced: 0,
      catchUpSteps: 0, lostLineage: 0, reset: false, gap: false, complete: true};
    const r = priorSearchRoots ?? this.roots;
    let gap = priorSearchRoots !== undefined && priorSearchRoots !== this.roots;
    if (this.last && ctx.history.length < this.last.history.length) gap = true;      // rewind
    this.roots = r + 1; this.stats.maintenances++;
    if (gap) { report.gap = true; this.stats.gaps++; this.records = []; this.sync.fill(false); this.lastN.fill(null); }
    if (this.worlds().length && (!this.last || !pastStillConsistent(this.last, ctx))) {
      this.release(); this.stats.resets++; report.reset = true; this.records = [];
      // Both pools empty every slot and refill it from this root: identical unless the lineage has a gap.
      this.sync.fill(!gap);
    }
    if (report.reset || gap || this.stats.maintenances === 1) this.lastRoot.fill(r - 1);
    const rec = {r, n, turn, seed: sampler.seed, ctx: structuredClone(ctx), sampler};
    this.records.push(rec);
    // Seto's timebox: a slot may catch up at most 3 roots; anything older is lost lineage (resyncs at its next epoch).
    while (this.records.length > RECORD_LIMIT + 1) this.records.shift();
    const live = {db: sampler.db, scripts: sampler.scripts, core: sampler.core}, opts = {shouldStop, verify};
    for (let slot = 0; slot < this.size && report.complete; slot++) {
      if (this.lastRoot[slot] < r - 1 && !this.records.some(x => x.r === this.lastRoot[slot] + 1)) {
        this.sync[slot] = false; this.lastRoot[slot] = r - 1; this.lastN[slot] = null; this.stats.lostLineage++; report.lostLineage++;
      }
      for (const x of this.records) {
        if (x.r <= this.lastRoot[slot]) continue;
        if (this.step(slot, x, live, opts, report) === 'cut') { report.complete = false; break; }
        if (x !== rec) { this.stats.catchUpSteps++; report.catchUpSteps++; }
      }
      // A slot that is now current hands its world to the search straight away, so a deadline cut still leaves the
      // worlds already maintained fully compared (Round 2b live-speed finding: maintaining all 16 first left nothing).
      const w = this.slots[slot];
      if (onWorld && w && this.lastRoot[slot] === r) { w.inSync = this.sync[slot]; onWorld(slot, w); }
    }
    rec.sampler = null; // later catch-ups rebuild a sampler from the stored context
    restorePristine(sampler.core);
    const usable = this.slots.filter((w, s) => w && this.lastRoot[s] === r);
    const behind = this.lastRoot.filter(x => x < r).length, outOfSync = this.sync.filter(x => !x).length;
    const flagged = !report.complete || behind > 0 || outOfSync > 0;
    if (flagged) this.cutAt ??= n; else this.cutAt = null;
    for (const w of usable) w.inSync = this.sync[w.slot];
    Object.assign(report, {behind, outOfSync, inSync: usable.filter(w => w.inSync).length, flagged, cutAt: this.cutAt});
    this.last = snapshotOf(ctx);
    return {worlds: usable, complete: report.complete, flagged, report};
  }
  summary() {
    const s = this.stats;
    return {...s, averageWorldAge: s.ageCount ? +(s.ageSum / s.ageCount).toFixed(2) : null,
      replacementsPerDecision: s.maintenances ? +((s.created) / s.maintenances).toFixed(2) : null};
  }
}

// Headless pilots key a pool by the Duel object they search (one pool per duel and seat); the live AI worker, which
// rebuilds its root duel for every think, keys by the duel worker's duel number instead.
const duelIds = new WeakMap(); let nextDuelId = 0;
export const duelIdentity = d => { let id = duelIds.get(d); if (id === undefined) duelIds.set(d, id = 'duel' + (++nextDuelId)); return id; };

/** One pool per (duel, seat). The key must identify the duel; history consistency guards reuse. */
export const MAX_POOLS = 2; // one per seat; older duels' pools are dropped to free engine memory
export function poolFor(key, size = POOL_SIZE) {
  let p = pools.get(key);
  if (!p) { while (pools.size >= MAX_POOLS) dropPool(pools.keys().next().value); pools.set(key, p = new WorldPool(key, size)); }
  return p;
}
export function dropPool(key) { const p = pools.get(key); if (p) { p.release(); pools.delete(key); } }
export function dropAllPools() { for (const k of [...pools.keys()]) dropPool(k); }

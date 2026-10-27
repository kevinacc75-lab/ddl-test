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
import {seedHash, randomStream} from '../random.mjs';

export const POOL_SIZE = 16, WATCH_POOL_SIZE = 10, AGE_CAP = 12, RECORD_LIMIT = 3;
// Seto (21 Oct): renew-when-ready may keep a world past AGE_CAP, but never past HARD_AGE_CAP decisions.
export const HARD_AGE_CAP = 24;
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
    // r35 world-pool fix (Claude, 24 Oct; Seto S2b FAIL on seeds 808 and 4242): headless keys start with the process-wide duel
    // counter ("duel17|0|16"), and the pool's own random streams (identity swap, sibling repair, advance replay) were
    // seeded from that key, so replaying the same seed later in the same process drew different random numbers.
    // seedKey drops the counter; the map key stays unique per duel. Live ("live:<n>") and tool keys are unchanged.
    this.seedKey = String(key).replace(/^duel\d+\|/, 'duel|');
    this.key = key; this.size = size; this.slots = Array(size).fill(null); this.last = null; this.cutAt = null;
    // Lineage (Seto amendments 1-2). sync[s]: slot s holds exactly what the headless pool holds (same world, or both
    // empty). lastRoot[s]: the last search root whose maintenance step slot s completed. records: the contexts of the
    // last few roots, so a slot left behind by a deadline cut replays the missed steps exactly as the headless pool did.
    this.sync = Array(size).fill(true); this.lastRoot = Array(size).fill(-1); this.lastN = Array(size).fill(null);
    this.records = []; this.roots = 0; this.repairFrom = Array(size).fill(null);
    this.stats = {maintenances: 0, advanced: 0, discarded: 0, scheduled: 0, turnCycle: 0, created: 0, resets: 0, failedRefills: 0, ageSum: 0, ageCount: 0,
      gaps: 0, catchUpSteps: 0, lostLineage: 0, resynced: 0, discardReasons: {}};
  }
  worlds() { return this.slots.filter(Boolean); }
  epoch(slot, n) { return epochOf(slot, n, this.size); }
  /** Engine bytes held by this pool's snapshots (Seto's per-seat cap). */
  bytes() { return this.slots.reduce((t, w) => t + (w?.snap?.mem?.bytes.length || 0), 0); }
  release() { for (let i = 0; i < this.size; i++) if (this.slots[i]) { releaseWorld(this.slots[i].snap); this.slots[i] = null; } this.repairFrom?.fill(null); }
  /** Drop one slot's world outside maintenance (memory cap). The headless pool keeps it, so the slot is out of sync. */
  dropSlot(slot) { if (this.slots[slot]) releaseWorld(this.slots[slot].snap); this.slots[slot] = null; this.sync[slot] = false; }
  samplerFor(rec, live) {
    if (rec.sampler) return rec.sampler;
    return rec.sampler = new Determinizations({seatContext: rec.ctx, db: live.db, scripts: live.scripts, core: live.core}, rec.ctx.seat, rec.seed, {searchCore: live.core});
  }
  /**
   * r20 sibling refill. An empty slot is rebuilt from a current world of this pool (the donor) with one hidden card of
   * the opponent's hand exchanged with a card still in their Deck: a different hand the seat cannot rule out. The donor's
   * deck order and core seed are the base (one replay with the usual repairs), so it almost always succeeds. Card
   * identity comes from the donor's own engine (a hint script on a restored copy; nothing is changed or kept). Only cards
   * the seat's ledger does not know are exchanged; the strict checks of the replay still decide.
   */
  /** Card identities (engine card ID, code, owner seat, location, sequence) in a loaded world, via a hint script. */
  static cardIds(sim) {
    const before = sim.core.duelGetMessage(sim.handle).length;
    if (!sim.core.loadScript(sim.handle, 'r20_card_ids.lua', 'local g=Duel.GetFieldGroup(0,0xff,0xff) for c in g:Iter() do c:SetHint(0,(c:GetCardID()<<32)|c:GetOriginalCode()) end')) return null;
    const cards = sim.core.duelGetMessage(sim.handle).slice(before).filter(m => m.type === M.CARD_HINT).map(m => { const v = BigInt(m.description); return {id: Number(v >> 32n), code: Number(v & 0xFFFFFFFFn), player: sim.fromEngine(m.controller), location: m.location, sequence: m.sequence}; });
    return cards.length ? cards : null;
  }
  /**
   * r20 exact swap repair. The world failed to advance because a card it must show (a known draw, or a card the
   * opponent now uses from the hand) is still in that player's Deck. Exchange it, in the world's starting deck order,
   * with the card that took its place (the card the world drew, or one hand card the seat has never seen), so one replay
   * of this same world shows the right card. Returns new deck orders, or null when no such exchange exists.
   */
  exactSwap(sim, w, e, live, seat, after = null, before = null, ctx = null) {
    if (!w.orders || !e?.code || e.controller === undefined || !['known draw differs', 'semantic card unavailable', 'hidden deck packet differs'].includes(e.message)) return null;
    if (e.message !== 'hidden deck packet differs' && ![1, 2, 4, 8].includes(e.location)) return null;
    const p = e.controller, cards = after || WorldPool.cardIds(sim); if (!cards) return null;
    const firstId = Math.min(...cards.map(c => c.id)), offset = p === 0 ? 0 : w.orders[0].main.length + w.orders[0].extra.length, main = w.orders[p].main;
    const same = (a, b) => a === b || live.db?.[a]?.alias === b || live.db?.[b]?.alias === a, index = c => c.id - firstId - offset;
    const mine = cards.filter(c => c.player === p && index(c) >= 0 && index(c) < main.length && same(main[index(c)], c.code));
    const rng = randomStream(seedHash(this.seedKey + ':swap:' + w.id + ':' + e.code)), known = q => sim.knowledge?.[seat]?.reference(p, 2, q)?.code || 0;
    // Hidden to the seat: the opponent's hand cards and face-down cards (field, banished) it has never seen (its own cards
    // are all known to it).
    // Codes of this player that the seat has seen in any public event (searched, revealed, moved face-up): a hand card of
    // such a code may be that public card, so it is never exchanged (conservative).
    const seen = new Set((ctx?.observations || []).filter(o => o.player === p && (o.code || o.ref?.code)).map(o => o.code || o.ref.code));
    const hidden = c => p !== seat && !seen.has(c.code) && [2, 4, 8, 32].includes(c.location) && !(sim.knowledge?.[seat]?.reference(p, c.location, c.sequence)?.code) && (c.location === 2 || !(sim.zone(p, c.location)?.[c.sequence]?.position & 5));
    const hiddenHand = mine.filter(c => c.location === 2 && hidden(c));
    // Starting positions of pre-shuffle draws whose card the seat knows (all of its own; the opponent's once revealed) are
    // facts and are never exchanged.
    const drawnAt = new Set((ctx?.draws || []).filter(r => r.player === p).flatMap(r => r.refs.filter(x => p === seat || x.code).map(x => x.initialIndex)).filter(x => x !== null && x !== undefined));
    const hiddenCopy = (code, not) => mine.filter(c => same(c.code, code) && c.id !== not?.id && !drawnAt.has(index(c)) && (c.location === 1 || hidden(c))).sort((a, b) => (a.location === 1 ? 0 : 1) - (b.location === 1 ? 0 : 1))[0];
    const pairs = [];
    if (e.message === 'hidden deck packet differs') {
      // A face-down packet out of the Deck (e.g. Pot of Desires) shows other cards: each missing code takes the place of
      // one extra card in the packet (both were in the Deck when the packet left it).
      const used = new Set();
      for (let k = 0; k < (e.missing || []).length; k++) {
        const t = mine.find(c => c.location === 1 && same(c.code, e.missing[k]) && !used.has(c.id) && !drawnAt.has(index(c))), v = mine.find(c => c.location === 32 && same(c.code, (e.extra || [])[k]) && !used.has(c.id) && !drawnAt.has(index(c)));
        if (!t || !v) return null; used.add(t.id); used.add(v.id); pairs.push([v, t]);
      }
    } else if (e.location === 1) {
      // The card must still be in the Deck (e.g. a public search) but this world put it in the opponent's hidden hand.
      if (p === seat) return null;
      const t = hiddenHand.filter(c => same(c.code, e.code) && !drawnAt.has(index(c)))[0], options = mine.filter(c => c.location === 1 && !same(c.code, e.code) && !drawnAt.has(index(c)));
      if (!t || !options.length) return null; pairs.push([t, options[rng() % options.length]]);
    } else {
      let victim;
      // The card the world just drew: in the hand now, not in the hand at the world's previous root (same card ID).
      if (e.message === 'known draw differs') { const had = new Set((before || []).filter(c => c.player === p && c.location === 2).map(c => c.id)); victim = mine.filter(c => c.location === 2 && same(c.code, e.drawn) && (!before || !had.has(c.id)) && !drawnAt.has(index(c))).sort((a, b) => b.sequence - a.sequence)[0]; }
      else { const list = mine.filter(c => c.location === e.location && hidden(c) && !same(c.code, e.code) && !drawnAt.has(index(c))); if (list.length) victim = list[rng() % list.length]; }
      if (!victim) return null;
      const target = hiddenCopy(e.code, victim);
      if (!target) return null; pairs.push([victim, target]);
    }
    if (!pairs.length) return null;
    const orders = w.orders.map(o => ({main: [...o.main], extra: [...o.extra]}));
    for (const [a, b] of pairs) { const i = index(a), j = index(b); [orders[p].main[i], orders[p].main[j]] = [orders[p].main[j], orders[p].main[i]]; }
    Object.defineProperty(orders, 'swap', {value: {p, pairs: pairs.map(([a, b]) => [index(a), a.location, index(b), b.location]), drawnAt: drawnAt.size}});
    return orders;
  }
  siblingFrom(slot, rec, live) {
    const donors = this.slots.filter((w, s) => w && w.orders && this.lastRoot[s] === rec.r);
    if (!donors.length) return null;
    const rng = randomStream(seedHash(this.seedKey + ':sibling:' + rec.n + ':' + slot)), donor = donors[rng() % donors.length], seat = rec.ctx.seat, opp = 1 - seat;
    let cards = [];
    try {
      const sim = restoreWorld(donor.snap), before = sim.core.duelGetMessage(sim.handle).length;
      if (!sim.core.loadScript(sim.handle, 'r20_sibling_ids.lua', 'local g=Duel.GetFieldGroup(0,0xff,0xff) for c in g:Iter() do c:SetHint(0,(c:GetCardID()<<32)|c:GetOriginalCode()) end')) return null;
      const known = seq => sim.knowledge?.[seat]?.reference(opp, 2, seq)?.code || 0;
      cards = sim.core.duelGetMessage(sim.handle).slice(before).filter(m => m.type === M.CARD_HINT).map(m => { const v = BigInt(m.description); return {id: Number(v >> 32n), code: Number(v & 0xFFFFFFFFn), player: sim.fromEngine(m.controller), location: m.location, sequence: m.sequence}; });
      for (const c of cards) c.known = c.player === opp && c.location === 2 && !!known(c.sequence);
    } catch { return null; } finally { restorePristine(live.core); }
    if (!cards.length) return null;
    // Card IDs are dealt in creation order: player 0 Main, player 0 Extra, player 1 Main, player 1 Extra.
    const firstId = Math.min(...cards.map(c => c.id)), offset = opp === 0 ? 0 : donor.orders[0].main.length + donor.orders[0].extra.length, main = donor.orders[opp].main;
    const index = c => c.id - firstId - offset, same = (code, c) => code === c || live.db?.[code]?.alias === c || live.db?.[c]?.alias === code;
    const mine = cards.filter(c => c.player === opp && index(c) >= 0 && index(c) < main.length && same(main[index(c)], c.code));
    const hand = mine.filter(c => c.location === 2 && !c.known), deck = mine.filter(c => c.location === 1);
    if (!hand.length || !deck.length) return null;
    const h = hand[rng() % hand.length], choices = deck.filter(c => !same(c.code, h.code));
    if (!choices.length) return null;
    const k = choices[rng() % choices.length], i = index(h), j = index(k);
    const orders = donor.orders.map(o => ({main: [...o.main], extra: [...o.extra]}));
    [orders[opp].main[i], orders[opp].main[j]] = [orders[opp].main[j], orders[opp].main[i]];
    return {orders, coreSeed: donor.coreSeed, native: donor.native, n: rec.n, turn: rec.turn, sibling: donor.id, maxFailures: 2};
  }
  /**
   * One slot's maintenance at one root, exactly as the headless pool does it. Atomic: if shouldStop() cuts it, the
   * slot is left as it was (nothing released) and 'cut' is returned, so the step can be replayed later.
   */
  step(slot, rec, live, {shouldStop, verify, defer = false, noRetire = false}, report) {
    const sampler = this.samplerFor(rec, live), seat = rec.ctx.seat, rootKey = d => publicKey(d, seat) + '|' + promptKey(d, seat);
    const w = this.slots[slot];
    let next = w, drop = null, retireOld = null, kind = null;
    if (w && rec.n - w.n >= HARD_AGE_CAP) { next = null; drop = w; kind = 'scheduled'; this.stats.hardCapped = (this.stats.hardCapped || 0) + 1; report.hardCapped = (report.hardCapped || 0) + 1; }
    else if (w && !noRetire && this.epoch(slot, rec.n) !== this.epoch(slot, w.n)) { next = null; drop = w; kind = 'scheduled'; }
    else if (w && !noRetire && rec.turn >= w.turn + 2) { next = null; drop = w; kind = 'turnCycle'; }
    else if (w && w.cursor.historyStep < rec.ctx.history.length) {
      const sim = restoreWorld(w.snap, {verify}); sim.nativeByStep = w.native ? [...w.native] : [];
      try {
        const cursor = sampler.replayWorld(sim, w.cursor, {rngSeed: this.seedKey + ':advance:' + w.id, shouldStop});
        next = {...w, snap: saveWorld(sim, rootKey), cursor, native: sim.nativeByStep}; retireOld = w.snap; kind = 'advanced';
      } catch (e) {
        if (shouldStop()) return 'cut';
        this.stats.discardReasons[e.message] = (this.stats.discardReasons[e.message] || 0) + 1;
        next = null; drop = w; kind = 'discarded';
        // r20 repair-refill: keep this world's deck order and core seed so the slot is rebuilt from it (one replay
        // with the usual repairs) instead of a fresh random deal.
        let swapped = null; try { const after = WorldPool.cardIds(sim), before = e.message === 'known draw differs' ? WorldPool.cardIds(restoreWorld(w.snap)) : null; swapped = this.exactSwap(sim, w, e, live, seat, after, before, rec.ctx); } catch { swapped = null; }
        if (swapped) { this.stats.exactSwaps = (this.stats.exactSwaps || 0) + 1; report.exactSwaps = (report.exactSwaps || 0) + 1; }
        if ((this.stats.discardSamples ??= []).length >= 40) this.stats.discardSamples.shift();
        this.stats.discardSamples.push({n: rec.n, reason: e.message, controller: e.controller ?? null, location: e.location ?? null, code: e.code || null, swapped: !!swapped});
        // A repair must fit in one decision's budget (it is atomic): 3 replays after an exact exchange, 2 without one.
        if (w.orders) this.repairFrom[slot] = {orders: swapped || w.orders, coreSeed: w.coreSeed, native: w.native, reason: e.message, id: w.id, n: w.n, turn: w.turn, maxFailures: swapped ? 3 : 2};
      }
    } else if (w) kind = 'kept';
    // r20: a refill never runs in the advance pass; the slot is emptied now and refilled after every slot has advanced.
    if (!next && defer) {
      if (drop) releaseWorld(drop.snap);
      if (kind) { this.stats[kind]++; report[kind]++; }
      this.slots[slot] = null; this.lastRoot[slot] = rec.r - 1; this.lastN[slot] = rec.n;
      return 'deferred';
    }
    if (!next && !this.repairFrom[slot] && this.siblingRefill !== false) { const sib = this.siblingFrom(slot, rec, live); if (sib) { this.repairFrom[slot] = sib; this.stats.siblings = (this.stats.siblings || 0) + 1; report.siblings = (report.siblings || 0) + 1; } }
    if (!next && this.repairFrom[slot]) {
      const from = this.repairFrom[slot];
      if (shouldStop()) return 'cut';
      restorePristine(live.core);
      const p = sampler.sample(slot * PROPOSALS_PER_WORLD, shouldStop, from);
      if (!p && shouldStop()) { from.cuts = (from.cuts || 0) + 1; if (from.cuts >= 2) this.repairFrom[slot] = null; return 'cut'; }
      this.repairFrom[slot] = null;
      if (p) { delete p.handleMessage; next = {id: `${rec.n}:${slot}:r`, slot, n: from.n ?? rec.n, born: rec.n, turn: from.turn ?? rec.turn, cursor: p.sampleCursor, orders: p.sampleOrders, coreSeed: p.sampleCoreSeed, native: p.nativeByStep || [], snap: saveWorld(p, rootKey)}; this.stats.repaired = (this.stats.repaired || 0) + 1; report.repaired = (report.repaired || 0) + 1; }
      else { this.stats.failedRepairs = (this.stats.failedRepairs || 0) + 1; report.failedRepairs = (report.failedRepairs || 0) + 1; if ((this.stats.repairFailures ??= []).length >= 30) this.stats.repairFailures.shift(); this.stats.repairFailures.push({n: rec.n, why: from.reason, swap: from.orders?.swap || null, swapped: from.maxFailures === 3, sibling: !!from.sibling, failures: sampler.failures.slice(-(from.maxFailures || 2)).map(f => f.reason.slice(0, 50) + '@' + f.historyStep + (f.requiredCode ? ':' + f.requiredCode : ''))}); }
    }
    if (!next) {
      for (let attempt = 0; attempt < PROPOSALS_PER_WORLD && !next; attempt++) {
        if (shouldStop()) return 'cut';
        restorePristine(live.core);
        const p = sampler.sample(slot * PROPOSALS_PER_WORLD + attempt, shouldStop);
        if (!p) { if (shouldStop()) return 'cut'; continue; }
        delete p.handleMessage;
        next = {id: `${rec.n}:${slot}:${attempt}`, slot, n: rec.n, turn: rec.turn, cursor: p.sampleCursor, orders: p.sampleOrders, coreSeed: p.sampleCoreSeed, native: p.nativeByStep || [], snap: saveWorld(p, rootKey)};
      }
      if (next) { this.stats.created++; report.created++; } else { this.stats.failedRefills++; report.failedRefills++; }
      this.repairFrom[slot] = null;
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
    // r18 TASK a0 (live 0/16-worlds starvation): two passes. Pass 1 brings every slot that only needs keeping or
    // advancing up to this root and hands it to the search (cheap: a suffix replay). Pass 2 then refills empty slots
    // and slots due for renewal. A slot that needs a fresh world is refilled straight at this root: replaying stale
    // roots first only to throw the world away was where a cut deadline spent its time, so the pool never caught up.
    // Skipping stale roots for such a slot marks it out of sync (flag only), exactly like a lost lineage. Every slot
    // step stays atomic and deterministic; with no deadline every slot ends exactly as before.
    const pending = slot => this.records.filter(x => x.r > this.lastRoot[slot]);
    const due = (slot, w, x) => this.epoch(slot, x.n) !== this.epoch(slot, w.n) || x.turn >= w.turn + 2;
    // r20: renew-when-ready. A world due for its scheduled/turn-cycle renewal keeps serving (advanced in pass 1) until a
    // fresh replacement is actually built in pass 3, so a renewal cut by the budget never leaves an empty slot.
    const needsFresh = slot => !this.slots[slot];
    const fresh = Array.from({length: this.size}, (_, slot) => needsFresh(slot));
    // r20: pass 1 only keeps/advances (a slot whose world fails to advance is emptied and joins pass 2). Pass 2 refills,
    // repair-refills first (one replay of a world that was valid one root ago), then fresh samples.
    const order = pass => { const list = Array.from({length: this.size}, (_, s) => s).filter(s => pass ? fresh[s] : !fresh[s]); return pass ? [...list.filter(s => this.repairFrom[s]), ...list.filter(s => !this.repairFrom[s])] : list; };
    for (const pass of [false, true]) for (const slot of order(pass)) {
      if (!report.complete) break;
      if (this.lastRoot[slot] < r - 1 && !this.records.some(x => x.r === this.lastRoot[slot] + 1)) {
        this.sync[slot] = false; this.lastRoot[slot] = r - 1; this.lastN[slot] = null; this.stats.lostLineage++; report.lostLineage++;
      }
      if (pass && this.lastRoot[slot] < r - 1) { // refill at this root only; the skipped roots are lost lineage
        if (this.slots[slot]) { releaseWorld(this.slots[slot].snap); this.slots[slot] = null; }
        this.sync[slot] = false; this.lastRoot[slot] = r - 1; this.lastN[slot] = null; this.stats.skippedStale = (this.stats.skippedStale || 0) + 1; report.skippedStale = (report.skippedStale || 0) + 1;
      }
      let deferred = false;
      for (const x of this.records) {
        if (x.r <= this.lastRoot[slot]) continue;
        const done = this.step(slot, x, live, {...opts, defer: !pass, noRetire: !pass}, report);
        if (done === 'cut') { report.complete = false; break; }
        if (done === 'deferred') { deferred = true; fresh[slot] = true; break; }
        if (x !== rec) { this.stats.catchUpSteps++; report.catchUpSteps++; }
      }
      if (deferred) continue;
      // A slot that is now current hands its world to the search straight away, so a deadline cut still leaves the
      // worlds already maintained fully compared (Round 2b live-speed finding: maintaining all 16 first left nothing).
      const w = this.slots[slot];
      if (onWorld && w && this.lastRoot[slot] === r) { w.inSync = this.sync[slot]; onWorld(slot, w); }
    }
    // r20 pass 3: scheduled / turn-cycle renewals, oldest first, while the budget lasts. The old world is released only
    // once its replacement exists; otherwise it stays (counted as renewDeferred) and is renewed at a later decision.
    const renewals = Array.from({length: this.size}, (_, s) => s).filter(s => this.slots[s] && this.lastRoot[s] === r && due(s, this.slots[s], rec)).sort((a, b) => this.slots[a].n - this.slots[b].n);
    for (const slot of renewals) {
      if (!report.complete || shouldStop()) { report.renewDeferred = (report.renewDeferred || 0) + 1; this.stats.renewDeferred = (this.stats.renewDeferred || 0) + 1; continue; }
      const old = this.slots[slot], kind = this.epoch(slot, rec.n) !== this.epoch(slot, old.n) ? 'scheduled' : 'turnCycle', s2 = this.samplerFor(rec, live), rootKey = d => publicKey(d, seat) + '|' + promptKey(d, seat);
      let made = null;
      for (let attempt = 0; attempt < PROPOSALS_PER_WORLD && !made && !shouldStop(); attempt++) {
        restorePristine(live.core);
        const p = s2.sample(slot * PROPOSALS_PER_WORLD + attempt, shouldStop);
        if (p) { delete p.handleMessage; made = {id: `${rec.n}:${slot}:${attempt}`, slot, n: rec.n, turn: rec.turn, cursor: p.sampleCursor, orders: p.sampleOrders, coreSeed: p.sampleCoreSeed, native: p.nativeByStep || [], snap: saveWorld(p, rootKey)}; }
      }
      if (made) { releaseWorld(old.snap); this.slots[slot] = made; this.stats[kind]++; report[kind]++; this.stats.created++; report.created++; }
      else { report.renewDeferred = (report.renewDeferred || 0) + 1; this.stats.renewDeferred = (this.stats.renewDeferred || 0) + 1; if (shouldStop()) report.complete = false; }
    }
    // Seto (21 Oct): log every world serving past its 12-decision renewal (renew-when-ready), oldest age included.
    const overAge = this.slots.map((w, s) => w && this.lastRoot[s] === r && rec.n - w.n > AGE_CAP ? {slot: s, id: w.id, age: rec.n - w.n} : null).filter(Boolean);
    if (overAge.length) { report.keptOverAge = overAge.length; report.oldestAge = Math.max(...overAge.map(x => x.age)); this.stats.keptOverAge = (this.stats.keptOverAge || 0) + overAge.length;
      for (const x of overAge) { if ((this.stats.overAgeLog ??= []).length >= 50) this.stats.overAgeLog.shift(); this.stats.overAgeLog.push({n: rec.n, ...x}); } }
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
  if (!p) {
    // r35 (Claude, 24 Oct): a new duel's first pool frees every pool left by an earlier duel at once (both seats), instead
    // of one per new pool, so a finished duel's snapshots never sit beside the next duel's (S2a seed 808 heap growth).
    const duel = String(key).split('|')[0];
    for (const k of [...pools.keys()]) if (String(k).split('|')[0] !== duel) dropPool(k);
    while (pools.size >= MAX_POOLS) dropPool(pools.keys().next().value); pools.set(key, p = new WorldPool(key, size));
  }
  return p;
}
export function dropPool(key) { const p = pools.get(key); if (p) { p.release(); pools.delete(key); } }
export function dropAllPools() { for (const k of [...pools.keys()]) dropPool(k); }

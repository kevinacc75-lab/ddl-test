// Engine snapshots for the information-set search (Round 2, Claude).
//
// Instead of replaying a sampled world's whole response history for every evaluation, the
// search replays each world to the root once, saves the engine's WebAssembly memory plus the
// Duel wrapper's own JS state, and restores that copy for every branch.
//
// Safety rules (Seto, Round 2 approval):
//  1. Search cores only. Snapshots work only on a core made by createSearchCore(). A live duel
//     must never share an engine instance with the search, because a restore rewinds every
//     duel in that instance. saveWorld/restoreWorld throw on any other core.
//  2. One timeline. Only the duel whose memory is currently loaded may call into the engine.
//     Every engine method that takes a duel handle is guarded; a call from any other duel
//     throws loudly instead of silently corrupting a rewound world.
//  3. Memory growth. A snapshot stores the used region of engine memory (everything above it
//     was zero when saved). Every restore writes that region back and zeroes everything above
//     it, so a restore is byte-identical to a full copy even if memory grew in between.
//  4. State outside memory. Saves happen only between engine calls (stack balanced). Each
//     snapshot records a root fingerprint; restoreWorld(..., {verify: true}) recomputes it and
//     throws on any difference. Tests verify every restore.
//  5. Never true hidden state. This module copies whatever the caller built; sampling rules
//     are unchanged.
import {Duel} from '../duel.mjs';
import {releaseDuelCallbacksOnly} from '../engine-lifetime.mjs';

const PAGE = 4096;
const cores = new WeakMap();          // search core -> {module, owner, pristine, bytesHeld}

const handleArg = x => x && typeof x === 'object' && Object.getOwnPropertySymbols(x).length === 1 && Object.keys(x).length === 0;

/** Create an engine core reserved for search, with its memory reachable for snapshots. */
export async function createSearchCore(db, scripts) {
  let module = null;
  const host = await Duel.create(db, scripts, {postRun: [m => { module = m; }]});
  if (!module?.HEAPU8?.buffer) throw Error('Engine memory unavailable for snapshots');
  const core = host.core, state = {module, owner: null, pristine: null, bytesHeld: 0};
  cores.set(core, state);
  // Guard every engine call that takes a duel handle (rule 2).
  for (const [name, fn] of Object.entries(core)) {
    if (typeof fn !== 'function' || name === 'createDuel') continue;
    core[name] = function (...args) {
      if (handleArg(args[0]) && args[0] !== state.owner)
        throw Error('Engine snapshot timeline violation: ' + name + ' called for a duel whose memory is not loaded');
      return fn.apply(this, args);
    };
  }
  const create = core.createDuel;
  core.createDuel = options => { const handle = create(options); if (handle) state.owner = handle; return handle; };
  state.pristine = capture(state);            // clean engine: card library loaded, no duels
  return core;
}

export const isSearchCore = core => cores.has(core);
export const snapshotBytesHeld = core => cores.get(core)?.bytesHeld ?? 0;

function search(core) {
  const state = cores.get(core);
  if (!state) throw Error('Engine snapshots require a search core; the live duel must never share one');
  return state;
}

// Rule 3: store only the used region. Scan down from the top for the last non-zero byte.
function usedBytes(heap) {
  const words = new Uint32Array(heap.buffer, 0, heap.byteLength >>> 2);
  for (let i = words.length - 1; i >= 0; i--) if (words[i]) return Math.min(heap.byteLength, Math.ceil(((i + 1) * 4) / PAGE) * PAGE);
  return 0;
}
// The snapshot is everything below the highest non-zero byte; every restore zeroes everything
// above it. The restored memory is therefore byte-identical to the full memory at save time,
// whatever the allocator's own boundary is, and whatever a branch or growth left above it.
// The WASM stack pointer lives outside linear memory, so it is saved and restored explicitly.
function capture(state) {
  const heap = new Uint8Array(state.module.HEAPU8.buffer), used = usedBytes(heap);
  return {bytes: heap.slice(0, used), memSize: heap.byteLength, stack: state.module.stackSave()};
}
function load(state, mem) {
  const heap = new Uint8Array(state.module.HEAPU8.buffer);
  if (heap.byteLength < mem.memSize) throw Error('Engine memory shrank below snapshot size');
  heap.set(mem.bytes);
  heap.fill(0, mem.bytes.length);              // zero everything above the saved region
  state.module.stackRestore(mem.stack);
}

// Prototype-preserving deep copy of the wrapper's JS state. Engine, card data and duel handle
// are kept by reference; functions are shared (they close over the same Duel object).
const SHARED = new Set(['core', 'db', 'scripts', 'handle']);
function deepCopy(v, memo = new Map()) {
  if (v === null || typeof v !== 'object') return v;
  if (memo.has(v)) return memo.get(v);
  if (ArrayBuffer.isView(v)) { const c = v.slice(); memo.set(v, c); return c; }
  if (v instanceof Map) { const c = new Map(); memo.set(v, c); for (const [k, x] of v) c.set(deepCopy(k, memo), deepCopy(x, memo)); return c; }
  if (v instanceof Set) { const c = new Set(); memo.set(v, c); for (const x of v) c.add(deepCopy(x, memo)); return c; }
  if (Array.isArray(v)) { const c = new Array(v.length); memo.set(v, c); for (let i = 0; i < v.length; i++) c[i] = deepCopy(v[i], memo); return c; }
  const c = Object.create(Object.getPrototypeOf(v)); memo.set(v, c);
  for (const k of Reflect.ownKeys(v)) {
    const desc = Object.getOwnPropertyDescriptor(v, k);
    if ('value' in desc) desc.value = deepCopy(desc.value, memo);
    Object.defineProperty(c, k, desc);
  }
  return c;
}
// The wrapper's fields are copied as ONE object graph with ONE copy map, so an object held by two
// fields (e.g. pendingIdentityEntries and log) is still a single shared object after a restore
// (ChatGPT, Round 2a review). The Duel itself and the shared engine/data objects map to themselves.
function pinnedMemo(duel) {
  const memo = new Map([[duel, duel]]);
  for (const k of SHARED) if (duel[k] && typeof duel[k] === 'object') memo.set(duel[k], duel[k]);
  return memo;
}
function copyWrapper(duel) {
  const memo = pinnedMemo(duel), js = {};
  for (const k of Reflect.ownKeys(duel)) js[k] = SHARED.has(k) ? duel[k] : deepCopy(duel[k], memo);
  return js;
}
function loadWrapper(duel, js) {
  const memo = pinnedMemo(duel);
  for (const k of Reflect.ownKeys(duel)) if (!(k in js)) delete duel[k];
  for (const k of Reflect.ownKeys(js)) duel[k] = SHARED.has(k) ? js[k] : deepCopy(js[k], memo);
}

/** Test hook: how many objects are reachable from two or more of the wrapper's fields. */
export function sharedObjectCount(duel) {
  const seen = new Map(), skip = new Set([duel, ...[...SHARED].map(k => duel[k])]);
  for (const k of Reflect.ownKeys(duel)) {
    if (SHARED.has(k)) continue;
    const stack = [duel[k]], mine = new Set();
    while (stack.length) {
      const v = stack.pop();
      if (v === null || typeof v !== 'object' || skip.has(v) || mine.has(v)) continue;
      mine.add(v); seen.set(v, (seen.get(v) || 0) + 1);
      if (v instanceof Map) for (const [a, b] of v) stack.push(a, b);
      else if (v instanceof Set || Array.isArray(v)) for (const x of v) stack.push(x);
      else if (!ArrayBuffer.isView(v)) for (const p of Reflect.ownKeys(v)) { const d = Object.getOwnPropertyDescriptor(v, p); if ('value' in d) stack.push(d.value); }
    }
  }
  let shared = 0; for (const n of seen.values()) if (n > 1) shared++;
  return shared;
}
export const engineStackPointer = core => search(core).module.stackSave();

/**
 * Save a world duel at a quiet point. `fingerprint(duel)` should summarise everything the
 * search relies on (public state, prompt, history); it is re-checked on verified restores.
 */
export function saveWorld(duel, fingerprint) {
  const state = search(duel.core);
  if (!duel.handle) throw Error('Cannot snapshot a stopped duel');
  if (state.owner !== duel.handle) throw Error('Engine snapshot timeline violation: saving a duel whose memory is not loaded');
  const mem = capture(state), snap = {core: duel.core, duel, handle: duel.handle, mem, js: copyWrapper(duel),
    root: fingerprint ? fingerprint(duel) : null, fingerprint, released: false};
  state.bytesHeld += mem.bytes.length;
  return snap;
}

/** Load a world back into the engine and into its Duel object, in place. */
export function restoreWorld(snap, {verify = false} = {}) {
  if (snap.released) throw Error('World snapshot was released');
  const state = search(snap.core);
  load(state, snap.mem);
  state.owner = snap.handle;
  loadWrapper(snap.duel, snap.js);
  if (verify && snap.fingerprint) {
    const now = snap.fingerprint(snap.duel);
    if (now !== snap.root) throw Error('Restored world differs from its saved root fingerprint');
  }
  return snap.duel;
}

/** Return the engine to its clean state (no duels), ready to build the next world. */
export function restorePristine(core) {
  const state = search(core);
  load(state, state.pristine);
  state.owner = null;
}

/**
 * Replace-only: free an outdated snapshot of a world that lives on (it has just been advanced and
 * saved again). Unlike releaseWorld, the duel, its handle and its callbacks are untouched.
 */
export function retireSnapshot(snap) {
  if (snap.released) return;
  search(snap.core).bytesHeld -= snap.mem.bytes.length;
  snap.released = true; snap.mem = null; snap.js = null;
}

/** Finish with a world: free its memory copy and its JS callback payload (no engine call). */
export function releaseWorld(snap) {
  if (snap.released) return;
  const state = search(snap.core);
  state.bytesHeld -= snap.mem.bytes.length;
  if (state.owner === snap.handle) restorePristine(snap.core);
  releaseDuelCallbacksOnly(snap.core, snap.handle);
  snap.duel.handle = null;
  snap.released = true;
  snap.mem = null; snap.js = null;
}

/** Test hook: a view of the engine's current memory. */
export const engineHeap = core => new Uint8Array(search(core).module.HEAPU8.buffer);

/** Test hook: force the engine to grow its memory, then free the block. */
export function forceMemoryGrowth(core, bytes) {
  const {module} = search(core), before = module.HEAPU8.buffer.byteLength;
  const ptr = module._malloc(bytes);
  if (!ptr) throw Error('Engine allocation failed');
  module.HEAPU8.fill(7, ptr, ptr + Math.min(bytes, module.HEAPU8.byteLength - ptr));  // dirty the new pages
  module._free(ptr);
  return {before, after: module.HEAPU8.buffer.byteLength};
}

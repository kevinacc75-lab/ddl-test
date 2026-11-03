// Deck validator (Tea's spec 2.1.0 §3; Seto: a named item in Build 2d). Pure, no DOM. Reports every problem, not the
// first. errors block a duel; warnings show but don't block. Counts copies by name (alias), across Main+Extra+Side.
const EXTRA_TYPES = 0x40 | 0x2000 | 0x800000 | 0x4000000; // Fusion, Synchro, Xyz, Link
const nameKey = (db, id) => db[id]?.alias && Math.abs(db[id].alias - id) < 20 ? db[id].alias : id;
export function validateDeck(deck, db, list, {scripts = null} = {}) {
  const errors = [], warnings = [], zones = ['main', 'extra', 'side'];
  for (const zone of zones) for (const id of deck[zone] || []) if (!db[id]) errors.push({code: 'UNKNOWN_CARD', id, zone});
  const main = deck.main || [], extra = deck.extra || [], side = deck.side || [];
  if (main.length < 40 || main.length > 60) errors.push({code: 'MAIN_SIZE', count: main.length});
  if (extra.length > 15) errors.push({code: 'EXTRA_SIZE', count: extra.length});
  if (side.length > 15) errors.push({code: 'SIDE_SIZE', count: side.length});
  for (const id of main) if (db[id] && db[id].type & EXTRA_TYPES) errors.push({code: 'ZONE', id, name: db[id].name, zone: 'main'});
  for (const id of extra) if (db[id] && !(db[id].type & EXTRA_TYPES)) errors.push({code: 'ZONE', id, name: db[id].name, zone: 'extra'});
  // Resolve the list's own keys too (Tea: some lists key an alt-art passcode only), so lookups work either way.
  const limits = new Map(); for (const [k, e] of Object.entries(list?.cards || {})) { const key = db[k] ? nameKey(db, Number(k)) : Number(k); const prev = limits.get(key); if (!prev || e.max < prev.max) limits.set(key, e); }
  const counts = new Map();
  for (const zone of zones) for (const id of deck[zone] || []) if (db[id]) { const k = nameKey(db, id); counts.set(k, (counts.get(k) || 0) + 1); }
  for (const [id, count] of counts) {
    if (count > 3) errors.push({code: 'COPIES', id, name: db[id]?.name, count, max: 3});
    const entry = limits.get(id);
    if (entry && entry.max === 0) errors.push({code: 'FORBIDDEN', id, name: db[id]?.name, count, max: 0});
    else if (entry && count > entry.max) errors.push({code: 'OVER_LIMIT', id, name: db[id]?.name, count, max: entry.max});
  }
  if (scripts) for (const zone of zones) for (const id of deck[zone] || []) {
    const c = db[id]; if (!c || !(c.type & (32 | 2 | 4 | 16777216))) continue;
    if (!scripts['c' + (c.alias || c.code) + '.lua'] && !scripts['c' + c.code + '.lua']) (zone === 'main' ? errors : warnings).push({code: 'NO_SCRIPT', id, name: c.name, zone});
  }
  for (const zone of zones) for (const id of deck[zone] || []) if (db[id] && db[id].type & 0x4000) warnings.push({code: 'TOKEN', id, name: db[id].name, zone});
  return {ok: errors.length === 0, errors, warnings};
}
export function describeProblem(p) {
  const n = p.name ? `${p.name}` : `card ${p.id}`;
  switch (p.code) {
    case 'UNKNOWN_CARD': return `Unknown card ${p.id} in the ${p.zone} deck.`;
    case 'MAIN_SIZE': return `The Main Deck has ${p.count} cards; it needs 40 to 60.`;
    case 'EXTRA_SIZE': return `The Extra Deck has ${p.count} cards; the most is 15.`;
    case 'SIDE_SIZE': return `The Side Deck has ${p.count} cards; the most is 15.`;
    case 'ZONE': return p.zone === 'main' ? `${n} belongs in the Extra Deck.` : `${n} can't go in the Extra Deck.`;
    case 'COPIES': return `${p.count} copies of ${n}; the most is 3.`;
    case 'FORBIDDEN': return `${n} is Forbidden.`;
    case 'OVER_LIMIT': return `${p.count} copies of ${n}; it's ${p.max === 1 ? 'Limited' : 'Semi-Limited'} (${p.max}).`;
    case 'NO_SCRIPT': return `${n} can't be played yet (no engine script).`;
    case 'TOKEN': return `${n} is a Token and can't be in a deck.`;
    default: return p.code;
  }
}

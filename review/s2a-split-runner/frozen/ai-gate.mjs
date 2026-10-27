#!/usr/bin/env node
// AI-A gate for Duel Doctrine Lab. Review tool by Akiza Izinski (Meta & Strategy).
// Usage: node tests/ai-gate.mjs --stage S2a|S2b|S2c|EQ [--duels N] [--budget nodes] [--random-seeds K] [--engine snapshot|replay]
//        [--auditor-seed X] [--candidate dist/optimal-pilot.mjs] [--baseline tests/baseline/dist/optimal-pilot.mjs]
//        [--whitelist tests/self-target-whitelist.json] [--out tests/ai-gate-result.json]
// Exit codes: 0 = PASS, 1 = gate FAIL (one or more checks missed), 2 = harness error (could not evaluate).
import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto';
import {gunzipSync} from 'node:zlib'; import {pathToFileURL} from 'node:url';
const ROOT = process.cwd();
const arg = (k, def) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : def; };
const STAGE = arg('stage', 'S2a'), DUELS = Number(arg('duels', 200)), BUDGET = Number(arg('budget', 400));
const RANDOM_SEEDS = Number(arg('random-seeds', 0)), AUDITOR_SEED = arg('auditor-seed', crypto.randomBytes(4).toString('hex'));
const CANDIDATE = arg('candidate', 'dist/optimal-pilot.mjs'), BASELINE = arg('baseline', 'tests/baseline/dist/optimal-pilot.mjs');
const WL_PATH = arg('whitelist', 'tests/self-target-whitelist.json'), OUT = arg('out', 'tests/ai-gate-result.json');
// auditor-approved ruling 6 (Seto, 14 Oct 2026): the candidate gets its own search core. snapshot = branches restored
// from engine snapshots (what the live worker runs); replay = the identical search with every branch rebuilt by a full
// replay. The frozen baseline is untouched. Stage EQ is the one-time equivalence check on S2b's 8 fixed seeds.
const ENGINE = arg('engine', 'snapshot'); if (!['snapshot', 'replay'].includes(ENGINE)) { console.error('--engine must be snapshot or replay'); process.exit(2); }
const ACCEPT_SEEDS = [2026, 12345, 808, 777, 4242, 555, 31337, 99];            // fixed acceptance set (do not edit)
const HARM = new Map([[502, 'destroy'], [503, 'banish'], [575, 'negate'], [520, 'return'], [551, 'target']]);
// auditor-approved ruling 5: append every strict own-pick trace for rules/value review.
fs.mkdirSync(path.resolve(ROOT,'tests/qa-output'),{recursive:true});
function ownTrace(d,p,plan,e) { const safe=v=>JSON.stringify(v,(_,x)=>typeof x==='bigint'?String(x):x,2);fs.appendFileSync(path.resolve(ROOT,'tests/qa-output/own-picks.md'), `\n## ${e.card} · seed ${d.seed} · turn ${d.turn} · decision ${d.responseHistory.length}\n\nCard: ${e.card} (${e.code}); effect: ${e.effect}; hint: ${d.hint}.\n\nPrompt and legal options:\n\n\`\`\`json\n${safe(p)}\n\`\`\`\n\nChosen:\n\n\`\`\`json\n${safe(plan.response)}\n\`\`\`\n\nReason: ${plan.reason||plan.rule||'No reason supplied'}\nGuard: ${safe(d.log.filter(x=>x.kind==='guard'&&x.actionIndex===d.responseHistory.length))}\n`); }
const CAP_RULE = /long line|action cap|loop guard|cap reached/i;
const sha1 = s => crypto.createHash('sha1').update(s).digest('hex');
const imp = p => import(pathToFileURL(path.resolve(ROOT, p)).href);
const result = {tool: 'ai-gate', stage: STAGE, budget: BUDGET, duelsRequested: DUELS, auditorSeed: AUDITOR_SEED, node: process.version, engine: {mode: ENGINE}, checks: [], metrics: {}, samples: {}};
const check = (id, value, op, limit, note = '') => { const pass = op === '==' ? value === limit : op === '<=' ? value <= limit : op === '>=' ? value >= limit : false; result.checks.push({id, value, op, limit, pass, note}); return pass; };
const finish = code => { result.verdict = code === 0 ? 'PASS' : code === 1 ? 'FAIL' : 'ERROR'; fs.writeFileSync(path.resolve(ROOT, OUT), JSON.stringify(result, (_, v) => typeof v === 'bigint' ? String(v) : v, 2));
  for (const c of result.checks) console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.id}: ${c.value} (need ${c.op} ${c.limit}) ${c.note}`); console.log(`VERDICT ${result.verdict} → ${OUT}`); process.exit(code); };
let Duel, M, db, scripts, decks, searchCore;
async function load() {
  ({Duel, M} = await imp('dist/duel.mjs'));
  db = JSON.parse(gunzipSync(fs.readFileSync(path.resolve(ROOT, 'dist/cards.json.gz'))));
  scripts = JSON.parse(gunzipSync(fs.readFileSync(path.resolve(ROOT, 'dist/scripts.json.gz'))));
  decks = JSON.parse(fs.readFileSync(path.resolve(ROOT, 'dist/decks.json'))).decks.filter(d => ['branded', 'luna', 'sky', 'mikanko'].includes(d.id));
  if (decks.length !== 4) throw Error('Expected the 4 preset decks');
  // ruling 6: one dedicated search core for the candidate; record which engine ran.
  const {createSearchCore} = await imp('dist/ai/engine-snapshot.mjs'); searchCore = await createSearchCore(db, scripts);
  const files = ['dist/ai/engine-snapshot.mjs', 'dist/ai/info-set.mjs', 'dist/ai/determinize.mjs'];
  result.engine = {mode: ENGINE, version: JSON.parse(fs.readFileSync(path.resolve(ROOT, 'package.json'))).version, sha1: Object.fromEntries(files.map(f => [f, sha1(fs.readFileSync(path.resolve(ROOT, f)))]))};
}
const withEngine = (make, mode) => args => { const pilots = make({...args, searchCore}); if (mode === 'replay') for (const p of pilots) p.branchByReplay = true; return pilots; };
function seedList(n) { // fixed acceptance seeds first, then deterministic schedule, then auditor-chosen random seeds
  const fixed = [...ACCEPT_SEEDS]; for (let i = 0; fixed.length < Math.max(0, n - RANDOM_SEEDS); i++) fixed.push(300001 + i * 7919);
  const rnd = []; for (let i = 0; i < RANDOM_SEEDS; i++) rnd.push(parseInt(sha1(AUDITOR_SEED + ':' + i).slice(0, 8), 16) >>> 0);
  return [...fixed.slice(0, n - rnd.length), ...rnd];
}
function schedule(n) { // every unordered pairing (incl. mirrors) × both first seats, round-robin
  const pairs = []; for (let a = 0; a < 4; a++) for (let b = a; b < 4; b++) for (const first of [0, 1]) pairs.push([a, b, first]);
  return seedList(n).map((seed, i) => ({seed, a: pairs[i % pairs.length][0], b: pairs[i % pairs.length][1], first: pairs[i % pairs.length][2]}));
}
// Plays one duel. Pilots per seat come from `factories[seat]`. Returns metrics + decision-log hash.
async function playDuel(job, factories, {clockScale = 1, measureThink = false} = {}) {
  const d = await Duel.create(db, scripts); const realNow = performance.now.bind(performance), realDate = Date.now;
  if (clockScale !== 1) { const t0 = realNow(), d0 = realDate(); performance.now = () => t0 + (realNow() - t0) * clockScale; Date.now = () => d0 + (realDate() - d0) * clockScale; }
  const m = {seed: job.seed, pair: [decks[job.a].id, decks[job.b].id], first: job.first, ownHarmWithOppTarget: [], nonWhitelistedOwn: [], cutShortTurns: [], forcedOwnPicks: [], forcedOwnUnlogged: [], throws: [], stalls: [], retries: 0, decisions: 0, searched: 0, finished: false, winner: null, thinkMs: [], log: []};
  try {
    d.start([decks[job.a], decks[job.b]], {seed: job.seed, first: job.first});
    const pilots = [0, 1].map(s => factories[s]({seed: job.seed, budget: BUDGET, nodeBudget: BUDGET})[s]);
    let steps = 0;
    while (d.prompt && !d.finished && steps++ < 2500) {
      const p = d.prompt, seat = p.seat, pilot = pilots[seat]; let plan;
      const guardBefore = d.log.filter(e => e.kind === 'guard').length;
      try { const thinkStart = measureThink ? realNow() : 0; plan = pilot.plan(d); if (measureThink) m.thinkMs.push(realNow() - thinkStart); } catch (e) { m.throws.push({turn: d.turn, decision: d.responseHistory?.length, message: e.message}); break; }
      if (!plan?.response) { m.stalls.push({turn: d.turn, type: p.type, why: 'no decision'}); break; }
      if(plan.search?.status){const q=plan.search;rootQuality.push({seed:job.seed,pair:[decks[job.a].id,decks[job.b].id],first:job.first,decision:d.responseHistory.length,seat,status:q.status,worlds:q.determinizations,aggregatedWorlds:q.aggregatedWorlds||0,logged:q.status==='full'||d.log.filter(e=>e.kind==='guard').length>guardBefore,matchedWorlds:q.matchedWorlds??null,engine:q.engine||null,firstMisaligned:q.firstMisaligned||null})}
      const r = plan.response, cards = p.selects || p.select_cards || [], picks = r.indicies || (r.index != null && [M.SELECT_CARD, M.SELECT_TRIBUTE, M.SELECT_UNSELECT_CARD].includes(p.type) ? [r.index] : []);
      // --- S2a: own-card harm detection from the prompt hint + card controller (engine message data only)
      if ([M.SELECT_CARD, M.SELECT_UNSELECT_CARD, M.SELECT_TRIBUTE].includes(p.type) && HARM.has(d.hint)) {
        const own = c => d.fromEngine(c.controller) === seat, oppOffered = cards.some(c => !own(c)), src = d.currentEffect?.code;
        const wl = (WL[src] || []), allOwn = cards.length > 0 && cards.every(own), forced = !p.can_cancel && (p.min || 1) >= 1;
        for (const i of picks) { const c = cards[i]; if (!c || !own(c)) continue;
          const listed = wl.some(w => w.hint === d.hint && (w.targetCode === '*' || w.targetCode === c.code));
          const e = {turn: d.turn, decision: d.responseHistory.length, effect: d.name(src || 0), effectCode: src, card: d.name(c.code), code: c.code, location: c.location, hint: d.hint, kind: HARM.get(d.hint), oppOffered, whitelisted: listed};
          if (oppOffered && !listed && d.hint !== 551) m.ownHarmWithOppTarget.push(e);
          if (oppOffered && !listed && d.hint === 551) m.ownHarmWithOppTarget.push(e); // a target on own card with an opponent target available
          ownTrace(d,p,plan,e);if (!listed) m.nonWhitelistedOwn.push(e);
          if (allOwn && forced && !listed) { m.forcedOwnPicks.push(e); }
        }
      }
      // --- S2a: cut-short turn: the cap/loop rule moved phase while the active seat still had a non-pass action
      if (p.type === M.SELECT_IDLECMD && seat === d.active && [6, 7].includes(r.action) && CAP_RULE.test(String(plan.rule || plan.title || '') + ' ' + JSON.stringify(plan.explain || plan.reasons || ''))) {
        const live = (p.summons?.length || 0) + (p.special_summons?.length || 0) + (p.activates?.length || 0) + (p.spsummons?.length || 0);
        if (live > 0) m.cutShortTurns.push({turn: d.turn, decision: d.responseHistory.length, liveActions: live, rule: plan.rule || plan.title});
      }
      m.log.push(JSON.stringify(r)); const before = d.retries; d.respond(r); if (d.retries > before) { m.retries++; m.stalls.push({turn: d.turn, why: 'engine rejected selection'}); break; }
      pilot.observe?.(plan); m.decisions++;if(m.decisions%25===0)console.log('progress '+STAGE+' seed '+job.seed+' turn '+d.turn+' decision '+m.decisions+' search '+m.searched+' heapMB '+Math.round(process.memoryUsage().heapUsed/1048576)); if (plan.search && plan.search.nodes > 0) m.searched++;
      if (m.forcedOwnPicks.length && m.forcedOwnPicks.at(-1).decision === d.responseHistory.length - 1) { const logged = d.log.filter(e => e.kind === 'guard').length > guardBefore; if (!logged) m.forcedOwnUnlogged.push(m.forcedOwnPicks.at(-1)); }
    }
    m.finished = !!d.finished; m.winner = d.winner ?? null; if (!d.finished && !m.throws.length && !m.stalls.length) m.stalls.push({why: 'step limit 2500'});
  } finally { performance.now = realNow; Date.now = realDate; m.hash = sha1(m.log.join('\n')); m.turns = d.turn; d.stop(); }
  delete m.log; return m;
}
let WL = {};const rootQuality=[];
async function main() {
  await load(); const wlRaw = fs.readFileSync(path.resolve(ROOT, WL_PATH), 'utf8'); WL = JSON.parse(wlRaw);
  result.whitelist = {path: WL_PATH, sha1: sha1(wlRaw), entries: Object.values(WL).flat().length,
    missingReason: Object.entries(WL).flatMap(([k, v]) => v.filter(w => !w.why || w.why.length < 20).map(w => k))};
  const cand = await imp(CANDIDATE), rawMake = cand.createOptimalPilots; if (!rawMake) throw Error(CANDIDATE + ' must export createOptimalPilots');
  const make = withEngine(rawMake, ENGINE);
  if (STAGE === 'S2a') {
    const jobs = schedule(DUELS), per = [];
    for (const j of jobs) { const r = await playDuel(j, [make, make]); per.push({seed: r.seed, pair: r.pair, first: r.first, own: r.nonWhitelistedOwn.length, harmWithOpp: r.ownHarmWithOppTarget.length, cutShort: r.cutShortTurns.length, throws: r.throws.length, stalls: r.stalls.length});
      for (const k of ['ownHarmWithOppTarget', 'nonWhitelistedOwn', 'cutShortTurns', 'throws', 'stalls', 'forcedOwnUnlogged']) (result.samples[k] ??= []).push(...r[k].map(x => ({seed: r.seed, pair: r.pair, first: r.first, ...x})));
      process.stdout.write(`seed ${r.seed} ${r.pair.join('-')} f${r.first}: own=${r.nonWhitelistedOwn.length} harmOpp=${r.ownHarmWithOppTarget.length} cut=${r.cutShortTurns.length} throw=${r.throws.length} stall=${r.stalls.length}\n`); }
    const sum = k => result.samples[k]?.length || 0; result.metrics = {duels: per.length, perDuel: per, coverage: [...new Set(per.map(p => p.pair.join('-') + ':' + p.first))].length};
    check('S2a.coverage.matchupsTimesSeats', result.metrics.coverage, '>=', Math.min(20, DUELS), 'all 10 pairings × both first seats');
    check('S2a.duels', per.length, '>=', 200, 'gate requires 200 duels');
    check('S2a.ownHarmWithOppTarget', sum('ownHarmWithOppTarget'), '==', 0, 'own destroy/banish/negate/return/target when an opponent card was offered');
    check('S2a.nonWhitelistedOwnPicks', sum('nonWhitelistedOwn'), '==', 0, 'any own pick under hints 502/503/520/551/575 not in the whitelist');
    check('S2a.cutShortTurns', sum('cutShortTurns'), '==', 0, 'cap/loop rule fired while a non-pass action was legal');
    check('S2a.throws', sum('throws'), '==', 0); check('S2a.stalls', sum('stalls'), '==', 0, 'no decision, rejected selection, or step limit');
    check('S2a.forcedFallbackUnlogged', sum('forcedOwnUnlogged'), '==', 0, 'forced all-own picks must emit a guard log line');
    check('S2a.whitelistReasons', result.whitelist.missingReason.length, '==', 0, 'every entry needs a printed-payoff reason');
  } else if (STAGE === 'S2b') {
    // static check: no wall clock in the search path
    const src = fs.readFileSync(path.resolve(ROOT, CANDIDATE), 'utf8'); const clockHits = (src.match(/performance\.now\s*\(|Date\.now\s*\(|new Date\s*\(/g) || []).length;
    result.metrics.wallClockCallsInCandidate = clockHits;
    check('S2b.noWallClockInSearchPath', clockHits, '==', 0, CANDIDATE);
    // auditor-approved ruling 1: transport fixtures are excluded; fresh evidence stays here.
    // Evidence check (Alexis, 2.1.1): stage11.test.mjs "proves" replay-hash determinism with pilot.mjs choosePilot and
    // replayed responseHistory, not the live Optimal search. Determinism evidence must not use either.
    const testDir = path.resolve(ROOT, 'tests'), bad = [];
    for (const f of fs.readdirSync(testDir).filter(f => f.endsWith('.mjs') && f !== 'ai-gate.mjs' && !f.replaceAll('\\','/').startsWith('transport/'))) { const t = fs.readFileSync(path.join(testDir, f), 'utf8');
      if (/hash|determinis|identical/i.test(t) && (/\bchoosePilot\b/.test(t) || /responseHistory\.slice\(|for\s*\(const\s+\w+\s+of\s+\w*[Rr]esponses\)|savedResponses|recordedResponses/.test(t))) bad.push(f); }
    result.metrics.heuristicOrReplayDeterminismTests = bad;
    check('S2b.noHeuristicOrReplayDeterminismTests', bad.length, '==', 0, bad.length ? 'determinism evidence uses choosePilot or recorded responses: ' + bad.join(', ') : 'determinism must come from this gate driving optimal-pilot search()');
    const noSearch = [], decisionCounts = [];
    const mismatch = []; const jobs = ACCEPT_SEEDS.map((seed, i) => ({seed, a: 0, b: [1, 2, 3, 0][i % 4], first: i % 2}));
    for (const j of jobs) { const run1 = await playDuel(j, [make, make]), run2 = await playDuel(j, [make, make]), slow = await playDuel(j, [make, make], {clockScale: 4}), fast = await playDuel(j, [make, make], {clockScale: 0.25});
      const hashes = [run1.hash, run2.hash, slow.hash, fast.hash]; decisionCounts.push({seed: j.seed, decisions: [run1.decisions, run2.decisions, slow.decisions, fast.decisions]}); if ([run1, run2, slow, fast].some(r => r.searched === 0)) noSearch.push(j.seed); const same = new Set(hashes).size === 1; if (!same) mismatch.push({seed: j.seed, pair: run1.pair, hashes});
      console.log(`seed ${j.seed}: ${same ? 'identical' : 'MISMATCH'} ${hashes.map(h => h.slice(0, 8)).join(' ')}`); }
    // auditor-approved ruling 4: auditor random seeds add two fresh plays, never recorded responses.
    const randomJobs = Array.from({length:RANDOM_SEEDS},(_,i)=>({seed:parseInt(sha1(AUDITOR_SEED+':'+i).slice(0,8),16)>>>0,a:i%4,b:(i+1)%4,first:i%2}));
    for (const j of randomJobs) { const one=await playDuel(j,[make,make]),two=await playDuel(j,[make,make]); const hashes=[one.hash,two.hash]; decisionCounts.push({seed:j.seed,auditorRandom:true,decisions:[one.decisions,two.decisions]}); if (!one.searched||!two.searched) noSearch.push(j.seed); if (one.hash!==two.hash) mismatch.push({seed:j.seed,auditorRandom:true,pair:one.pair,hashes}); console.log(`auditor seed ${j.seed}: ${one.hash===two.hash?'identical':'MISMATCH'} ${hashes.join(' ')}`); }
    result.metrics.randomSeeds=RANDOM_SEEDS;result.metrics.freshPlays=32+2*RANDOM_SEEDS;
    result.samples.mismatch = mismatch; result.samples.decisionCounts = decisionCounts;
    check('S2b.liveSearchDriven', noSearch.length, '==', 0, 'every run must invoke optimal-pilot search() (plan.search.nodes>0); no saved responses are replayed');
    check('S2b.identicalAcrossRunsAndClocks', mismatch.length, '==', 0, '8 fixed ×4 clock plays plus auditor random seeds ×2 fresh plays');
  } else if (STAGE === 'S2c') {
    // Auditor-approved semantic alignment: capture ACCEPTED native roots,
    // independent of the number of hidden optional response windows replayed.
    const samples=[];let live=null;const sampled=new WeakSet();
    const {setRootObserver}=await imp('dist/ai/determinize.mjs');
    const codes=(x,s,l)=>x.zone(s,l).filter(Boolean).filter(c=>!c.isPublic).map(c=>c.code).join(',');
    setRootObserver((clone,context)=>{if(!live||sampled.has(clone))return;sampled.add(clone);const seat=context.seat,opp=1-seat;samples.push({turn:live.turn,oppHandDiffers:codes(live,opp,2)!==codes(clone,opp,2),oppDeckDiffers:codes(live,opp,1)!==codes(clone,opp,1),ownDeckDiffers:codes(live,seat,1)!==codes(clone,seat,1)})});
    const origStop = Duel.prototype.stop;
    const jobs = schedule(Math.min(DUELS, 20)); for (const j of jobs) { const d = await Duel.create(db, scripts); live = d; d.start([decks[j.a], decks[j.b]], {seed: j.seed, first: j.first});
      const pilots = make({seed: j.seed, budget: BUDGET, nodeBudget: BUDGET}); let steps = 0; while (d.prompt && !d.finished && steps++ < 400 && samples.length < 2000) { const pl = pilots[d.prompt.seat].plan(d); if (!pl) break; d.respond(pl.response); pilots[d.prompt?.seat ?? 0]; }
      live = null; origStop.call(d); }
    setRootObserver(null);
    const n = samples.length, differs = samples.filter(s => s.oppHandDiffers || s.oppDeckDiffers).length;
    result.metrics.leak = {samples: n, hiddenDiffersShare: n ? differs / n : null, oppHandIdentical: samples.filter(s => !s.oppHandDiffers).length};
    check('S2c.searchClonesCaptured', n, '>=', 50, 'the search must actually run');
    check('S2c.hiddenZonesDiffer', n ? Math.round(1000 * differs / n) / 10 : 0, '>=', 95, '% of search copies whose hidden opponent hand/deck differ from the truth');
    // Strength: candidate vs baseline at equal node budget, paired seeds (each seed played with seats swapped).
    if (fs.existsSync(path.resolve(ROOT, BASELINE))) { const frozen = (await imp(BASELINE)).createOptimalPilots; let wins = 0, games = 0;
      // auditor-approved ruling 2: candidate median actual decision compute, then baseline ms.
      const times = [], calibrationGames = Math.min(DUELS, 20);
      for (const job of schedule(calibrationGames)) { const measured = await playDuel(job, [make, make], {measureThink:true}); times.push(...measured.thinkMs); }
      times.sort((a,b)=>a-b); if (!times.length) throw Error('No candidate think-time samples');
      const mid = Math.floor(times.length/2), matchedMs = times.length%2 ? times[mid] : (times[mid-1]+times[mid])/2;
      const base = args => frozen({...args, budget:matchedMs});
      result.metrics.matchedCompute = {candidateNodeBudget:BUDGET, candidateMedianThinkMs:matchedMs, baselineBudgetMs:matchedMs, decisions:times.length, calibrationGames, node:process.version};
      for (const j of schedule(Math.min(DUELS, 400))) for (const candSeat of [0, 1]) { const f = candSeat === 0 ? [make, base] : [base, make]; const r = await playDuel(j, f); if (r.finished) { games++; if (r.winner === candSeat) wins++; else if (r.winner === null) wins += 0.5; } }
      // auditor-approved ruling 3: --duels N schedules 2N paired games.
      check('S2c.games', games, '>=', 400, '--duels 200 means 400 games, both candidate seats');
      result.metrics.strength = {games, wins, rate: games ? wins / games : null};
      check('S2c.strengthVsBaseline', games ? Math.round(1000 * wins / games) / 10 : 0, '>=', 55, `% score vs ${BASELINE} at matched compute ${result.metrics.matchedCompute.baselineBudgetMs} ms baseline / ${BUDGET} candidate nodes over ${games} games (final 2.2.0 gate: 400 games)`);
    } else check('S2c.strengthVsBaseline', 'baseline missing', '==', 'present', 'copy the 2.1.1 optimal-pilot.mjs to ' + BASELINE);
  } else if (STAGE === 'EQ') {
    // ruling 6: one-time equivalence. Same build, S2b's 8 fixed seeds, snapshot vs replay engine; every decision identical.
    const jobs = ACCEPT_SEEDS.map((seed, i) => ({seed, a: 0, b: [1, 2, 3, 0][i % 4], first: i % 2})), rows = [];
    for (const j of jobs) { const snap = await playDuel(j, [withEngine(rawMake, 'snapshot'), withEngine(rawMake, 'snapshot')]), rep = await playDuel(j, [withEngine(rawMake, 'replay'), withEngine(rawMake, 'replay')]);
      const row = {seed: j.seed, pair: snap.pair, first: j.first, identical: snap.hash === rep.hash, decisions: [snap.decisions, rep.decisions], searched: [snap.searched, rep.searched], hashes: [snap.hash, rep.hash]}; rows.push(row);
      console.log(`EQ seed ${j.seed}: ${row.identical ? 'identical' : 'MISMATCH'} ${row.hashes.map(h => h.slice(0, 8)).join(' ')} decisions ${row.decisions.join('/')} searched ${row.searched.join('/')}`);
      fs.writeFileSync(path.resolve(ROOT, OUT + '.partial'), JSON.stringify(rows, null, 2)); }
    result.engine.mode = 'snapshot vs replay'; result.samples.equivalence = rows;
    check('EQ.seeds', rows.length, '==', 8, 'S2b fixed acceptance seeds');
    check('EQ.searchRan', rows.filter(r => !r.searched[0] || !r.searched[1]).length, '==', 0, 'both engines ran the live search in every duel');
    check('EQ.snapshotEqualsReplay', rows.filter(r => !r.identical).length, '==', 0, 'every pick identical; if any differ, snapshot results do not count');
  } else { console.error('Unknown --stage ' + STAGE); process.exit(2); }
  // Auditor-approved anti-stall gate: full / reduced / public fallback roots.
  const total=rootQuality.length,full=rootQuality.filter(r=>r.status==='full').length,fallback=rootQuality.filter(r=>r.status==='fallback').length,unlogged=rootQuality.filter(r=>r.status!=='full'&&!r.logged).length;
  const mw=rootQuality.map(r=>r.matchedWorlds).filter(x=>x!==null).sort((a,b)=>a-b);
  result.metrics.rootQuality={roots:total,full16:full,reduced:total-full-fallback,fallback,fullShare:total?full/total:null,fallbackShare:total?fallback/total:null,unlogged,engine:ENGINE,matchedWorlds:{roots:mw.length,min:mw[0]??null,median:mw.length?mw[Math.floor(mw.length/2)]:null,atLeast8:mw.filter(x=>x>=8).length,full16:mw.filter(x=>x>=16).length}};
  result.samples.reducedAndFallback=rootQuality.filter(r=>r.status!=='full');
  check(STAGE+'.rootQuality.full16',total?100*full/total:0,'>=',95,'auditor-approved anti-stall rule');
  check(STAGE+'.rootQuality.fallback',total?100*fallback/total:100,'<=',1,'public-information fallback only below eight aggregated worlds');
  check(STAGE+'.rootQuality.logged',unlogged,'==',0,'every reduced/fallback case logged');
  finish(result.checks.every(c => c.pass) ? 0 : 1);
}
main().catch(e => { result.error = e.stack; console.error(e); finish(2); });

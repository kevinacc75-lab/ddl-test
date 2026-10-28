// S2a diagnosis replay (Claude, 28 Oct 2026; Seto's 22:15 ruling). NOT a gate tool and NOT counting: it changes no verdict
// and writes nothing under runs/. It loads the frozen gate's own prefix byte for byte (same identity checks as the split
// runner), then plays ONE job with the gate's exact decision loop (pilot.plan -> respond, BUDGET, snapshot engine), and
// records the board, chain and the pilot's own explanation for every decision in a window, so the code path behind a
// flagged pick can be read. Usage:
//   node tools/s2a-diagnose-job.mjs --job 29 --from 850 --to 890 --save <file.json>
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import crypto from 'node:crypto';import {pathToFileURL} from 'node:url';
import {PIN} from './s2a-common.mjs';
const ROOT=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..');
const arg=(k,v)=>{const i=process.argv.indexOf('--'+k);return i>0?process.argv[i+1]:v};
const JOB=+arg('job',29),FROM=+arg('from',850),TO=+arg('to',890),OUT=arg('save',null);
const sha256=b=>crypto.createHash('sha256').update(b).digest('hex');
const src=fs.readFileSync(path.join(ROOT,'tests/ai-gate.mjs'),'utf8'),CUT='async function main() {',at=src.indexOf(CUT),prefix=src.slice(0,at);
const ident={gate:sha256(fs.readFileSync(path.join(ROOT,'tests/ai-gate.mjs'))),whitelist:sha256(fs.readFileSync(path.join(ROOT,'tests/self-target-whitelist.json'))),prefix:sha256(prefix),node:process.version};
if(ident.gate!==PIN.frozen['tests/ai-gate.mjs']||ident.whitelist!==PIN.frozen['tests/self-target-whitelist.json']||ident.prefix!==PIN.prefixSha256||process.version!==PIN.node){console.error('REFUSED identity '+JSON.stringify(ident));process.exit(2)}
const DRIVER=`
// ---- diagnosis driver (not part of the frozen gate) ----
export async function __diag(jobIndex, FROM, TO, onProgress){
  await load(); WL = JSON.parse(fs.readFileSync(path.resolve(ROOT, WL_PATH), 'utf8'));
  const cand = await imp(CANDIDATE), make = withEngine(cand.createOptimalPilots, ENGINE), job = schedule(200)[jobIndex];
  const d = await Duel.create(db, scripts); const out = {job: jobIndex, def: job, window: []};
  const names = (seat, l) => d.zone(seat, l).map(c => c ? (c.position & 5 ? d.name(c.code) : 'face-down ' + d.name(c.code)) : null);
  try {
    d.start([decks[job.a], decks[job.b]], {seed: job.seed, first: job.first});
    const pilots = [0, 1].map(s => make({seed: job.seed, budget: BUDGET, nodeBudget: BUDGET})[s]);
    let steps = 0, n = 0;
    while (d.prompt && !d.finished && steps++ < 2500) {
      const p = d.prompt, seat = p.seat, plan = pilots[seat].plan(d), dec = d.responseHistory.length;
      if (dec >= FROM && dec <= TO) {
        let labels = []; try { labels = d.choices().map(c => c.label); } catch {}
        const r = plan.response, idx = r?.indicies ?? (r?.index != null ? [r.index] : null);
        out.window.push({decision: dec, turn: d.turn, phase: d.phase, active: d.active, seat, promptType: p.type, hint: d.hint,
          currentEffect: d.currentEffect ? d.name(d.currentEffect.code) : null, chain: (d.chain || []).map(c => d.name(c.code) + ' (seat ' + d.fromEngine(c.controller) + ')'),
          lp: [d.lp[0], d.lp[1]], st: [names(0, 8), names(1, 8)], monsters: [names(0, 4), names(1, 4)], hand: d.zone(seat, 2).map(c => d.name(c.code)),
          choices: labels, response: r, picked: idx, pickedLabel: idx && labels.length ? idx.map(i => labels[i]) : (r?.action != null && labels[r.index] ? [labels[r.index]] : null),
          rule: plan.rule || plan.title || null, reason: plan.reason || null, kind: plan.kind || null, book: plan.bookTag || plan.book || null,
          search: plan.search ? {status: plan.search.status, nodes: plan.search.nodes, worlds: plan.search.determinizations} : null,
          guardsSoFar: d.log.filter(e => e.kind === 'guard' && e.actionIndex >= FROM).map(e => e.text).slice(-3)});
      }
      if (dec > TO) break;
      d.respond(plan.response); pilots[seat].observe?.(plan); n++; if (n % 50 === 0) onProgress?.(d.turn, n);
    }
  } finally { out.turn = d.turn; d.stop(); }
  return out;
}`;
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'s2a-diag-'));const gen=path.join(tmp,'gate-prefix-plus-diag.mjs');fs.writeFileSync(gen,prefix+DRIVER);
const G=await import(pathToFileURL(gen).href);const t0=Date.now();
const res=await G.__diag(JOB,FROM,TO,(turn,n)=>process.stderr.write(`[diag] job ${JOB} turn ${turn} decision ${n} ${Math.round((Date.now()-t0)/1000)}s\n`));
res.identity=ident;res.wallMs=Date.now()-t0;
const text=JSON.stringify(res,null,1);if(OUT)fs.writeFileSync(OUT,text);console.log(OUT?('wrote '+OUT+' window '+res.window.length):text);

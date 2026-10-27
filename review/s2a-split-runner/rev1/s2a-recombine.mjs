#!/usr/bin/env node
// S2a recombine (Claude, 27 Oct 2026). Re-scores split-runner job lines EXACTLY as the frozen tests/ai-gate.mjs scores
// S2a: the same 9 S2a check ids, operators and limits, plus the 3 root-quality checks pooled over the raw root entries of
// every duel (never averaged per shard). The schedule used for validation is the gate's own schedule(200), taken from the
// verbatim frozen prefix (same cut as the runner). The check code below mirrors ai-gate.mjs lines 98-115 and 183-191;
// the reviewer should diff it against those lines.
//
// Refuses to score (exit 2) unless: one line per job index (no duplicates; a re-run needs a logged reason in
// --rerun-reasons, and the FIRST result is kept); every line carries the frozen hashes, Node v22.22.2, budget 400, the
// same prefix hash; seed/pair/first match schedule(200); no non-counting or S2b-repro lines.
// Interim mode (--interim): scores the jobs present and is labelled "CANDIDATE (interim, n/200), not a PASS"; it can
// never print PASS. Final mode needs all 200.
//   node tools/s2a-recombine.mjs --in-dir runs/s2a [--interim] --out runs/s2a/recombined.json
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import os from 'node:os';import {pathToFileURL} from 'node:url';
const ROOT=process.cwd();const a=(k,d)=>{const i=process.argv.indexOf('--'+k);return i>0?process.argv[i+1]:d};const has=k=>process.argv.includes('--'+k);
const FROZEN={'tests/ai-gate.mjs':'1c380d58afc51f07ce76615d4b5cd8f185e7675de19b3fea72e1950088a14dee','tests/self-target-whitelist.json':'9f1fb5f5487ea60ea7afdc3aac624c269608510e4cdab598878c2ec86bae0ee3','dist/ai/world-pool.mjs':'807133d3049dc7af690042b258d7bba8f7e2672c8e908af27605ed1bb4b000b8'};
const sha256b=b=>crypto.createHash('sha256').update(b).digest('hex'),sha1=s=>crypto.createHash('sha1').update(s).digest('hex');
for(const [f,h] of Object.entries(FROZEN))if(sha256b(fs.readFileSync(path.resolve(ROOT,f)))!==h){console.error('REFUSED: '+f+' is not the frozen file');process.exit(2)}
const src=fs.readFileSync(path.resolve(ROOT,'tests/ai-gate.mjs'),'utf8'),prefix=src.slice(0,src.indexOf('async function main() {')),prefixSha=sha256b(prefix);
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'s2a-recombine-'));const gen=path.join(tmp,'prefix.mjs');fs.writeFileSync(gen,prefix+'\nexport const __schedule = n => schedule(n);\n');
const {__schedule}=await import(pathToFileURL(gen).href);
const decks=JSON.parse(fs.readFileSync(path.resolve(ROOT,'dist/decks.json'))).decks.filter(d=>['branded','luna','sky','mikanko'].includes(d.id)).map(d=>d.id);/* same filter/order as load() */
const sched=__schedule(200);
const inDir=path.resolve(ROOT,a('in-dir','runs/s2a')),interim=has('interim');
const files=fs.readdirSync(inDir).filter(f=>/^jobs-shard.*\.jsonl$/.test(f)).sort();
const reasons=a('rerun-reasons')?JSON.parse(fs.readFileSync(a('rerun-reasons'),'utf8')):{};
const errs=[],byJob=new Map(),inputs=[];
for(const f of files){const raw=fs.readFileSync(path.join(inDir,f));inputs.push({file:f,sha256:sha256b(raw)});
 raw.toString('utf8').split('\n').filter(Boolean).forEach((t,n)=>{let r;try{r=JSON.parse(t)}catch{errs.push(f+':'+(n+1)+' unparseable');return}
  if(r.nonCounting||r.s2bRepro){errs.push(f+':'+(n+1)+' non-counting/repro line');return}
  if(!Number.isInteger(r.job)||r.job<0||r.job>199){errs.push(f+':'+(n+1)+' bad job index '+r.job);return}
  if(byJob.has(r.job)){if(!reasons[r.job])errs.push('duplicate job '+r.job+' without a logged re-run reason');return}/* first result kept */
  byJob.set(r.job,r)})}
for(const [j,r] of byJob){const s=sched[j],pair=[decks[s.a],decks[s.b]];
 if(r.seed!==s.seed||r.first!==s.first||r.a!==s.a||r.b!==s.b||JSON.stringify(r.pair)!==JSON.stringify(pair))errs.push('job '+j+' does not match schedule(200): '+JSON.stringify({seed:r.seed,pair:r.pair,first:r.first})+' vs '+JSON.stringify({seed:s.seed,pair,first:s.first}));
 for(const [f,h] of Object.entries(FROZEN))if(r.frozen?.[f]!==h)errs.push('job '+j+' frozen hash differs: '+f);
 if(r.node!=='v22.22.2')errs.push('job '+j+' node '+r.node);if(r.budget!==400)errs.push('job '+j+' budget '+r.budget);if(r.prefixSha256!==prefixSha)errs.push('job '+j+' ran a different gate prefix');
 if(!Array.isArray(r.rootQuality))errs.push('job '+j+' has no rootQuality entries')}
const present=[...byJob.keys()].sort((x,y)=>x-y);
if(!interim){const missing=[];for(let j=0;j<200;j++)if(!byJob.has(j))missing.push(j);if(missing.length)errs.push('missing jobs: '+missing.join(','))}
if(errs.length){console.error('REFUSED:\n '+errs.join('\n '));process.exit(2)}
// ---- scoring: mirrors ai-gate.mjs S2a branch + root-quality block
const result={tool:'ai-gate (recombined by tools/s2a-recombine.mjs)',stage:'S2a',budget:400,duelsRequested:200,node:'v22.22.2',engine:{mode:'snapshot'},checks:[],metrics:{},samples:{},inputs,prefixSha256:prefixSha,mode:interim?'interim':'final'};
const check=(id,value,op,limit,note='')=>{const pass=op==='=='?value===limit:op==='<='?value<=limit:op==='>='?value>=limit:false;result.checks.push({id,value,op,limit,pass,note});return pass};
const wlRaw=fs.readFileSync(path.resolve(ROOT,'tests/self-target-whitelist.json'),'utf8'),WL=JSON.parse(wlRaw);
result.whitelist={path:'tests/self-target-whitelist.json',sha1:sha1(wlRaw),entries:Object.values(WL).flat().length,missingReason:Object.entries(WL).flatMap(([k,v])=>v.filter(w=>!w.why||w.why.length<20).map(w=>k))};
const per=[],rootQuality=[];
for(const j of present){const r=byJob.get(j);per.push({seed:r.seed,pair:r.pair,first:r.first,own:r.nonWhitelistedOwn.length,harmWithOpp:r.ownHarmWithOppTarget.length,cutShort:r.cutShortTurns.length,throws:r.throws.length,stalls:r.stalls.length,job:j,hash:r.hash,decisions:r.decisions});
 for(const k of ['ownHarmWithOppTarget','nonWhitelistedOwn','cutShortTurns','throws','stalls','forcedOwnUnlogged'])(result.samples[k]??=[]).push(...r[k].map(x=>({seed:r.seed,pair:r.pair,first:r.first,...x})));
 rootQuality.push(...r.rootQuality)}
const DUELS=200,sum=k=>result.samples[k]?.length||0;result.metrics={duels:per.length,perDuel:per,coverage:[...new Set(per.map(p=>p.pair.join('-')+':'+p.first))].length};
check('S2a.coverage.matchupsTimesSeats',result.metrics.coverage,'>=',Math.min(20,DUELS),'all 10 pairings × both first seats');
check('S2a.duels',per.length,'>=',200,'gate requires 200 duels');
check('S2a.ownHarmWithOppTarget',sum('ownHarmWithOppTarget'),'==',0,'own destroy/banish/negate/return/target when an opponent card was offered');
check('S2a.nonWhitelistedOwnPicks',sum('nonWhitelistedOwn'),'==',0,'any own pick under hints 502/503/520/551/575 not in the whitelist');
check('S2a.cutShortTurns',sum('cutShortTurns'),'==',0,'cap/loop rule fired while a non-pass action was legal');
check('S2a.throws',sum('throws'),'==',0);check('S2a.stalls',sum('stalls'),'==',0,'no decision, rejected selection, or step limit');
check('S2a.forcedFallbackUnlogged',sum('forcedOwnUnlogged'),'==',0,'forced all-own picks must emit a guard log line');
check('S2a.whitelistReasons',result.whitelist.missingReason.length,'==',0,'every entry needs a printed-payoff reason');
const total=rootQuality.length,full=rootQuality.filter(r=>r.status==='full').length,fallback=rootQuality.filter(r=>r.status==='fallback').length,unlogged=rootQuality.filter(r=>r.status!=='full'&&!r.logged).length;
const mw=rootQuality.map(r=>r.matchedWorlds).filter(x=>x!==null).sort((a,b)=>a-b);
result.metrics.rootQuality={roots:total,full16:full,reduced:total-full-fallback,fallback,fullShare:total?full/total:null,fallbackShare:total?fallback/total:null,unlogged,engine:'snapshot',matchedWorlds:{roots:mw.length,min:mw[0]??null,median:mw.length?mw[Math.floor(mw.length/2)]:null,atLeast8:mw.filter(x=>x>=8).length,full16:mw.filter(x=>x>=16).length}};
result.samples.reducedAndFallback=rootQuality.filter(r=>r.status!=='full');
check('S2a.rootQuality.full16',total?100*full/total:0,'>=',95,'auditor-approved anti-stall rule');
check('S2a.rootQuality.fallback',total?100*fallback/total:100,'<=',1,'public-information fallback only below eight aggregated worlds');
check('S2a.rootQuality.logged',unlogged,'==',0,'every reduced/fallback case logged');
const allPass=result.checks.every(c=>c.pass);
result.verdict=interim?(present.length===200&&allPass?'CANDIDATE (interim mode used with 200/200; run final mode for a verdict)':'CANDIDATE (interim, '+present.length+'/200), not a PASS'+(result.checks.filter(c=>!c.pass&&!/^S2a\.(duels|coverage\.|rootQuality\.)/.test(c.id)).length?' - BLOCKING FAILURE PRESENT (a per-duel blunder check failed)':'')+'; interim root quality is information only (Seto plan s7)'):(allPass?'PASS':'FAIL');
const out=path.resolve(ROOT,a('out',path.join(inDir,interim?'recombined-interim.json':'recombined.json')));fs.writeFileSync(out,JSON.stringify(result,(_,v)=>typeof v==='bigint'?String(v):v,2));
for(const c of result.checks)console.log(`${c.pass?'PASS':'FAIL'}  ${c.id}: ${c.value} (need ${c.op} ${c.limit}) ${c.note}`);
console.log('VERDICT '+result.verdict+' → '+out);process.exit(interim?0:(allPass?0:1));

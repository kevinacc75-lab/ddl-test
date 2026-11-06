// r36 bounded pin helper (Claude as builder, 5 Nov 2026; ChatGPT RELAY-107/108 pin rulings). Historical source pins of
// files that r36 / the AI selector must change are kept, NOT re-pinned: each such file has a reviewed unified diff
// tests/fixtures/r36-pins/<file>.patch (r35.12 d3177e0 -> the candidate). historical(file):
//   1. asserts the file's WHOLE candidate SHA-256 (so no change can hide inside or outside a hunk),
//   2. reverse-applies exactly that patch with every context and added line checked in place (no fuzz, no offsets
//      beyond the patch's own), and asserts the result is the r35.12 bytes,
// and returns those historical bytes for the test's own historical pin/normalisation. Any change to these files needs
// a new reviewed patch and candidate hash here.
import assert from 'node:assert/strict';import fs from 'node:fs';import crypto from 'node:crypto';
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
export const R3512={'dist/app.mjs':'831386c3c97f4ded44b0dc483f47decde970f9dd6bf519ae87b9dc9958c64212','dist/worker.mjs':'12f0070b744ed1e0a3fcc3dbd27b828cf44f26282908ccffb684ce46845b2560','dist/optimal-pilot.mjs':'ed03a478d999605e6089898ac5d97cc7c102494e160853776aaa1a3dea490948','dist/presentation.mjs':'a6088b5a44f7105bb2997874c712d34227ccc5bb87dc1060575aa56912d5c67b'/* r36 default build: finished-duel dock line (RELAY-119) */};
export const CANDIDATE=JSON.parse(fs.readFileSync(new URL('../fixtures/r36-pins/CANDIDATE.json',import.meta.url),'utf8'));
function reverseApply(text,patch,file){
 const cur=text.split('\n'),out=[];let at=0,hunks=0;const lines=patch.split('\n');
 for(let i=0;i<lines.length;i++){const h=lines[i].match(/^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);if(!h)continue;hunks++;
  const start=+h[3]-1+(+h[4]===0?1:0),body=[];for(i++;i<lines.length&&!lines[i].startsWith('@@')&&!lines[i].startsWith('diff ');i++)if(/^[ +-]/.test(lines[i]))body.push(lines[i]);i--;
  const now=body.filter(l=>l[0]!=='-').map(l=>l.slice(1)),old=body.filter(l=>l[0]!=='+').map(l=>l.slice(1));
  assert.ok(start>=at,file+': hunk order');out.push(...cur.slice(at,start));
  assert.deepEqual(cur.slice(start,start+now.length),now,file+': hunk '+hunks+' context/added lines must match exactly');out.push(...old);at=start+now.length}
 assert.ok(hunks>0,file+': patch has hunks');out.push(...cur.slice(at));return out.join('\n')}
export function historical(file,text=fs.readFileSync(file,'utf8')){
 assert.ok(CANDIDATE[file]&&R3512[file],file+': has a reviewed r36 patch');assert.equal(sha(text),CANDIDATE[file],file+' = the reviewed candidate bytes (whole file)');
 const base=reverseApply(text,fs.readFileSync(new URL('../fixtures/r36-pins/'+file.split('/').pop()+'.patch',import.meta.url),'utf8'),file);
 assert.equal(sha(base),R3512[file],file+' minus exactly its reviewed r36 patch = r35.12 (d3177e0) bytes');return base}

#!/usr/bin/env python3
# Runs tests/r45-ai-v4.test.mjs against the r44 dist (a temporary copy of /workspace/r44-build) and lists pass/fail.
# Tests marked "(fails on r44)" must fail here; the others are guards that may pass on r44 too.
import shutil, subprocess, tempfile, os, re, sys
src = '/workspace/r45-build'; old = '/workspace/r44-build'
tmp = tempfile.mkdtemp(prefix='r45-on-r44-')
try:
    shutil.copytree(old + '/dist', tmp + '/dist'); shutil.copytree(src + '/tests', tmp + '/tests')
    for f in ['approved.json']:
        if os.path.exists(old + '/' + f): shutil.copy(old + '/' + f, tmp)
    out = subprocess.run(['node', '--test', 'tests/r45-ai-v4.test.mjs'], cwd=tmp, capture_output=True, text=True, timeout=900).stdout
    rows = re.findall(r'^(✔|✖) (\(R45-[^)]*\)[^\n]*?) \(\d', out, re.M)
    seen = set(); bad = 0
    for mark, name in rows:
        if name in seen: continue
        seen.add(name); marked = '(fails on r44)' in name
        ok = (mark == '✖') if marked else True
        bad += not ok
        print(('FAIL-ON-R44 ' if mark == '✖' else 'pass-on-r44 ') + ('OK ' if ok else 'UNEXPECTED ') + name)
    print('top-level:', out.strip().splitlines()[-8:] if not rows else '', 'unexpected:', bad)
    sys.exit(1 if bad or not rows else 0)
finally:
    shutil.rmtree(tmp, ignore_errors=True)

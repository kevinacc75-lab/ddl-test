# Addendum - Claude, Thu 29 Oct 2026 ~23:00 AEDT - Seto 21:20 notes (a), (b), (c)

SELF-VERIFIED builder evidence. No dist/ change, nothing published, RC1 / gate / whitelist / pin 9337e197 untouched.

- (a) Position-test control: r36-dtw commit 69572cb adds check (4) to tests/r36-dtw-position.test.mjs.
  - Time Typhoon seat with the book switched off (createOptimalPilots book:false): printed-0 Barian goes to Defence,
    so the Attack answer comes from P5 alone (a doctrine-disabled control on the same seat).
  - Another deck's seat: identical answer with the book on and off, and the book pick hook returns null (strict).
  - Run on Node v22.22.2: pass (r36-dtw-position-69572cb.log). Against the p5-before dtw-plan.mjs it still fails at
    "(2) Time Typhoon pilot: Attack Position" (r36-dtw-position-against-p5-before.log).
  - Patch: 0015-seto-notes-position-control-pyc.patch; final test file alongside.
- (b) The 66/66 suite log at d645c14 (Node v22.22.2) is now in the package: ../suite-r36-d645c14.txt and the 66
  per-test logs in ../suite-logs-d645c14/. Its dist manifest line is the repo-root hash at d645c14.
- (c) tools/__pycache__/cdb-to-card.cpython-313.pyc is removed from the branch (same commit 69572cb) and
  .gitignore gains __pycache__/. Patch 0001 in this package is unchanged, so the --exclude note still applies to it.

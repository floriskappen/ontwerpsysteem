# DECISIONS — exact-readiness-evidence

## 1. The strict-spec count is 10, not the proposal's 9 — record literal output with its composition

**What:** `docs/releases/v1.0.0-readiness.md` records **"10 passed, 0 failed (10 items) = 9 capability
specs + 1 active-change delta"** for `openspec validate --all --strict` at commit `1fd61d5`.

**Divergence:** The proposal's Why says "the current repository now has … 9 strict specs", and the task
1.1 wording implies a bare capability-spec count. Neither matches what the cited command actually prints:
`--all` also validates this change's own unarchived delta, so the observed total at the final correction
state is 10 (9 specs + this preparation). The audit's blocker #5 happened because a *derived* number
(9) was recorded instead of command output; recording another derived number would recreate the defect.

**Why this reading:** The spec says "record the observed result of … strict OpenSpec validation,
including exact counts where a gate reports them". Observed result = the command's Totals line, labelled
with its composition so it cannot be misread as "9 capabilities passed" or confused with test totals
(design risk 3). The regression test compares the report against the same command's live output, so the
comparison stays like-for-like before and after archiving.

## 2. Task-2.2's conditional regression: condition met — nothing enforced the readiness contract

**What:** Added `test/readiness-evidence.test.mjs` (6 cases). It enforces, against live gate output:
every executed machine gate is recorded with its command; the strict-spec total equals a fresh
`openspec validate --all --strict`; the test-file count equals the collected suite (`vitest list
--filesOnly`) and zero failures are claimed; human-owned checks are separated and marked unperformed;
repository state and VERSION stance are identified; reproducibility evidence stands apart from the
strict-spec count.

**Rejected:** No new test at all (task 2.2 makes the regression conditional). Rejected because grep over
`test/` and `scripts/` found zero references to the readiness report: the drift that produced audit
blocker #5 was invisible to every existing gate and would be invisible again. Also rejected a heavier
design that re-runs the full suite inside itself for case counts (recursive vitest invocation, fragile)
— see decision 3.

**Scope guard:** The new file touches only `docs/releases/v1.0.0-readiness.md` and repo tooling output;
it adds no component, skin, effect, dependency, version, pin, release artifact, or baseline change, per
the modified `propagation-validation` requirement.

## 3. Enforcement boundary: numeric for strict specs, structural for pass/fail case totals

The spec scenario "gives a count that differs from the current gate output → review fails" cannot be
fully automated for the test-case totals: re-deriving them requires running the suite inside the suite.
So the test enforces numerically what is cheaply exact (strict-spec total via CLI re-run ~0.7s;
test-file count via `vitest list` collection ~5s), and structurally otherwise (a recorded summary must
exist, must claim 0 failures, must carry the file count). Case-total staleness beyond that remains with
the report's explicit instruction to re-run after any further commit. Recorded here rather than hidden:
the requirement is enforced to the boundary of what a non-recursive check can observe.

## 4. Commit identification is presence-checked, not HEAD-pinned

The report identifies its state by full commit hash; the test checks that an identifier exists but does
not require it to equal current HEAD. Pinning would force an evidence refresh on every later commit
(including the archive/push steps of this very workflow), making the suite permanently red during normal
flow without any real staleness. Gate-output comparisons are where drift is detectable regardless of
commits, and those are pinned.

## 5. No cleanup group existed in the tasks list

The apply brief referenced working through "its cleanup group"; `tasks.md` defines only groups 1–2. The
closest cleanup obligations were honoured anyway: dead code removed from the new test during writing
(an unused helper), scope review confirming no stray artifacts (final diff = report + one test + change
folder), and all existing targeted suites retained untouched. Noted so the omission isn't mistaken for
an unmet task.

## 6. Report rows are formatted for machine parsing

The gate table's row order and cell phrasing (command in backticks in one cell, observed result in the
next) were chosen so `gateRowFor()` can locate rows reliably; the Tests row precedes any other mention
of `` `npm test` `` because the matcher takes the first hit. This couples the prose to the test more
tightly than ideal, but the alternative (free-form prose evidence) is exactly what drifted twice.

---

## Review rulings (review phase)

Ruled against the repository constitution (bounded corrections, evidence over assertion) and existing
conventions; claims verified where cheaply verifiable.

1. **Strict-spec count as literal Totals plus composition — accepted.** The spec demands the "observed
   result … including exact counts"; recording a derived 9 would recreate blocker #5's defect class.
   Verified live during review: the command prints `Totals: 10 passed, 0 failed (10 items)` and the
   report matches.
2. **Adding `test/readiness-evidence.test.mjs` despite the conditional task — accepted.** Premise
   re-verified independently: before this change nothing referenced the report except roadmap prose and
   the archived prepare-v1 change, so the readiness contract had zero enforcement. The addition stayed
   bounded (report + one test + change folder).
3. **Numeric-for-exact / structural-for-case-totals boundary — accepted.** It is the honest limit of
   non-recursive enforcement and is documented in-file rather than hidden. The one scenario clause it
   left under-enforced is fixed by ruling 7.
4. **Commit presence-checked, not HEAD-pinned — accepted.** HEAD-pinning would hold the gate red through
   this workflow's own archive/push commits with no real staleness; drift detection lives where it is
   observable, in live command output.
5. **Missing cleanup group noted — accepted as observation.** Confirmed independently: every import and
   helper in the new suite is used; no orphaned code exists.
6. **Table phrasing coupled to first-hit matching — accepted, then hardened.** `gateRowFor()` now
   considers only markdown table rows and prefers a command cell that equals the needle, so a prose
   mention of `` `npm test` `` can no longer shadow the Tests row and row order no longer decides the
   match. This makes the decision's own caveat ("the Tests row must precede any other mention") moot;
   report prose stays free-form.
7. **Review strengthening: fabricated human checks now fail anywhere in the report.** The scenario clause
   "presents an unobserved human/device check as complete" was only enforced for bullets inside §5 — a
   fabricated human/device result in prose or another section passed all six tests while violating the
   spec. The human-separation test now also scans everything outside the human-owned section and fails
   on any line naming a human check (taste/skin/browser/device/responsive/adoption) together with
   completion language and no unperformed marker. Checked line-by-line against the current report: no
   false positives today.

# Decisions — motion-contract-consistency

Recorded during apply. Each entry: what was done, what was rejected, and why.

## D1 — Which motion tokens count as "smooth UI affordances"

- **Did:** removed `duration.ui-fast`, `duration.ui`, `duration.ui-slow` and the whole
  primitive `easing` group from `primitive/motion.tokens.json`; removed
  `motion.duration.hover`, `motion.duration.transition` and the semantic `motion.easing`
  group from `semantic/motion.tokens.json`. Kept `duration.bloom`,
  `motion.duration.bloom`, `duration.breathe-*` and `duration.drift-*`.
- **Rejected:** also removing the bloom/breathe/drift durations. The audit names exactly
  hover, transition, and the standard easing as blocker #1; the kept tokens are periodic
  loop lengths (or a lag for an ambient effect), not transition/easing affordances, and
  removing them would expand the correction beyond the audited blocker.
- **Why:** the design doc scopes removal to "unused smooth UI duration/easing tokens";
  the kept durations carry no easing semantics and are referenced by recipes/effects.

## D2 — "Byte-identical baseline" scenario read as oracle-preservation, not byte equality

- **Did:** implemented the showcase spec's "Accepted baseline remains the visual oracle"
  as: the accepted baseline file is never edited (pinned by hash in the scope test), and
  the existing selector-set parity gates pass — while the rebuilt page necessarily differs
  in bytes where `ease-in-out` became stepped timing.
- **Rejected:** reading "byte-identical to the accepted baseline" literally.
- **Why:** that scenario cannot hold literally at the same time as its sibling scenario in
  the same requirement ("periodic atmosphere animation timing uses stepped timing rather
  than `ease`, `linear`, or cubic easing") — the atmosphere styles are embedded in the
  built page, so fixing them changes built bytes. Tasks/specs disagreement recorded here;
  the audit itself requires the easing fix, so byte identity was the weaker, impossible
  reading. (Also filed as ROADMAP-FEEDBACK.)

## D3 — Stepped timing means the system's 8 fps clock, quantised per animation

- **Did:** converted atmosphere easing to `steps()` at the established 8 fps rate:
  per-cell `--tf` emitted by `grid.mjs` (`steps(round(d × 8))`, d ∈ 7–16 s) consumed by
  `.grid i`, fixed `steps(304|408|536)` for the three blooms (38/51/67 s × 8), matching
  `weather-particles.mjs`'s existing `stepTF` rule.
- **Rejected:** a single small step count per cycle (e.g. `steps(8)`), which would have
  been a smaller diff but would invent a new, chunkier clock that contradicts the
  documented "configured system-wide at 8fps".
- **Why:** design decision 2 says "use the existing stepped motion convention"; the
  existing convention is the 8 fps flip-book rate (`motion.clock.stepped` recipe,
  `language/motion.md`, brief). Selectors, keyframes, durations, endpoints, and all
  reduced-motion rules are unchanged, as required.

## D4 — Motion-contract gate scans four surfaces; prose is exempt by structure

- **Did:** new `scripts/lib/motion-contract.mjs` gate (wired into `npm run validate`
  beside the retained keyframe-coverage gate) checks: (1) authored motion tokens — no
  cubic-bezier/transition-typed or interaction-named duration/easing token, no `easing`
  group; (2) recipe JSON fields — no field declares a transition declaration or smooth
  easing literal, with the `avoid` field exempt because it names what a recipe rejects,
  not what it does; (3) language docs — only fenced code blocks are scanned, so normative
  prose may name the prohibitions freely while example CSS cannot smuggle smooth motion
  in; (4) shipped CSS + built zoo page `<style>`/inline styles — no `transition*`
  declaration anywhere, no `ease|ease-in-out|linear(?!-gradient)|cubic-bezier(` in any
  timing position or custom-property value.
- **Rejected:** scanning recipe/doc prose wholesale (would fail on the documents'
  own normative prohibitions like "no transitions"), and scanning only dist (design doc:
  "a source-only check would miss build-transform regressions; a shipped-only check would
  allow contradictory authored recipes to remain").
- **Why:** every rule is mechanically checkable in both directions, which is what the
  propagation-validation scenarios demand ("fails … and identifies", "passes").

## D5 — Scope test pins the frozen v1 surface

- **Did:** new scope regression test (`test/motion-scope.test.mjs`) pins: the accepted
  baseline file's sha256 *and* its directory holding exactly `index.html`; no runtime
  dependencies and the frozen devDependency set; `design-system/VERSION` = 0.1.1 plus
  the CHANGELOG's released-version set {0.1.0, 0.1.1}; the effect-module, zoo-style-module,
  skin-id and component-class enumerations.
- **Rejected:** relying on review alone for "no new component, skin, effect, dependency,
  version, or release artifact".
- **Why:** the showcase/propagation-validation specs require an out-of-scope change to
  *fail*, and a requirement nothing can fail is not a requirement. A future legitimate
  addition updates these pins deliberately, in review, rather than silently.

## D6 — The duplicated stepped-clock helper is hoisted to effects/helpers.mjs (build break found by the new tests)

- **Did:** task 1.2 declared a module-scope `stepTF` in `grid.mjs`, colliding with the
  identical helper in `weather-particles.mjs` — the shipped-effects inliner concatenates
  all effect sources into one ESM file, so the build failed with
  `Identifier 'stepTF' has already been declared`. Hoisted one shared
  `STEP_FPS`/`stepTF` into `effects/helpers.mjs`; both modules import it. Also added the
  per-cell `tf` field to the shipped `GridCell` interface in the generated `effects.d.ts`.
- **Rejected:** renaming grid's local copy to dodge the collision — it would duplicate
  the stepped-clock rule (the exact constant the contract now hangs on) in two modules.
- **Why:** helpers.mjs already exists as the shared escape/memo plumbing both modules
  import; one definition of the system clock rate keeps the 8 fps rule single-sourced.

## D7 — Byte-level gates that pinned smooth-motion bytes were updated with a recorded exemption, not weakened

- **Did:** two existing tests asserted the old bytes: `effects-contract` expected grid
  cells shaped exactly `{index,a,b,d,dl}` (now gains required `tf: steps(N)`, and its
  wrapper check asserts data↔markup agreement on `--tf`), and `showcase` compared effect
  markup byte-for-byte against the accepted baseline (now strips exactly
  `;--tf:steps(<n>)` from both sides first, citing design.md's "byte-identical output
  outside the intended motion correction", mirroring how `zoo-parity` records C7's
  rest-frame relocations). Every other byte difference still fails; the weather fields'
  pre-existing `--tf` vars are untouched.
- **Rejected:** loosening either test to selector/shape comparison, or leaving them red
  as "expected failures".
- **Why:** the correction's whole point is that those specific bytes move; a recorded,
  minimal exemption keeps the oracle at full strength everywhere else while letting the
  intended change land. Tasks/specs disagreement with the literal "byte-identical"
  scenario was already recorded in D2.

## D8 — Gate false-positive surface verified before relying on it

- **Did:** swept recipes/*.json and all fenced language-doc code blocks for
  ease/easing/cubic-bezier/linear tokens before trusting the gate's green state;
  confirmed `linear-gradient()` geometry is excluded by lookahead (tested) and that the
  only remaining repo mention of the removed tokens is the audit document describing the
  defect.
- **Rejected:** shipping the gate on the strength of one passing run alone.
- **Why:** a gate whose pass could be a false negative (pattern never exercised against
  real vocabulary) is weaker than the spec's "fails … and identifies" demand; the sweep
  plus fixture tests close that gap.

---

## Post-gate-failure corrections (second apply pass)

## D9 — Test-gate redness was a test-infrastructure defect, not a contract gap

- **Found:** the recorded gate failure had two faces. (1) `motion-contract` /
  "inline style attributes are checked too" failed deterministically because its own
  assertion did `errors.join(' ')` over `{file, rule, path, message}` objects — printing
  `[object Object]` and never reading `.message`. The gate itself was correct: it
  reported an error naming `--tf` for an inline `style="--tf:ease-in-out"`. (2) `showcase`
  / "hover and focus states keep responding through the built chain" timed out at the
  default 5s; that test awaits a full production build (~2.8s alone), which crosses 5s
  when vitest workers run builds in parallel on this box. It passes consistently with
  headroom once scheduled alone.
- **Did:** fixed the assertion to join `e.message` (and assert non-empty errors); gave
  the suite an explicit 20s per-test/hook budget in `vitest.config.mjs`.
- **Rejected:** leaving the 5s default ("it passed this time") — a gate whose colour
  depends on machine load is not a gate; and lowering parallelism or caching a committed
  build artifact to buy speed, which would trade real coverage or reproducibility for
  wall clock.
- **Why:** none of these tests is expected to hang; a genuinely hung test still fails,
  just after an honest budget. No assertion was weakened.

---

## Review ruling (review phase)

Each implementer decision ruled on explicitly. All eight are **accepted**; two carry
corrections applied during review, recorded here.

- **D1 — accepted.** Scoped exactly to audited blocker #1; keeping periodic loop lengths
  is right — they are clocks, not easing affordances, and the gate now enforces that
  distinction mechanically.
- **D2 — accepted.** The literal "byte-identical" reading contradicts its sibling scenario
  in the same requirement (stepped timing necessarily moves built bytes). Oracle-
  preservation with pinned baseline hash is the only coherent reading.
- **D3 — accepted.** Per-animation quantisation at the documented 8 fps rate reuses the
  existing convention instead of inventing a chunkier clock; grid/bloom counts
  (`steps(56–128)`, `304|408|536`) check out against `stepTF` and the authored durations.
- **D4 — accepted, with one review correction.** The four-surface split and the `avoid`
  exemption are right. But surface 4's page extraction read only the *first* `<style>`
  block of the built page; the page ships two (bundle styles, then ~13 KB of demo/skin
  styles), so smooth motion in the second block would have passed every gate and every
  test. Fixed: `extractShippedCss` now scans every `<style>` block, with regression tests
  for a later block and for inline style attributes. Both blocks verified clean today, so
  nothing turns red from the widening.
- **D5 — accepted.** Scope pins make the out-of-scope scenarios fail-able rather than
  aspirational; the deliberate-widening path is documented in the test itself.
- **D6 — accepted, with one review correction.** Hoisting the duplicated stepped-clock
  helper to `helpers.mjs` was the right fix for the concatenation collision. The hoist
  exported `STEP_FPS`, which no module imports (both callers import only `stepTF`);
  de-exported during review so the clock stays single-sourced without dead export surface.
- **D7 — accepted, with one caveat recorded.** The minimal `;--tf:steps(<n>)` strip keeps
  the parity oracle at full strength everywhere else. Note its exact reach: it also strips
  the weather fields' *pre-existing* `--tf` attributes on both sides, masking those bytes
  from byte-parity too. Accepted because weather timing remains pinned two other ways —
  effects-contract asserts each field's `--tf` var↔data agreement, and motion-scope pins
  the baseline hash — but any future widening of this exemption must be justified against
  those two remaining pins, not assumed harmless.
- **D8 — accepted.** Independently re-verified during review: no live reference to the
  removed tokens outside the frozen baseline, historical changelog, and the audit document
  naming the defect.

Review also added the one missing spec→test mapping: design-language / "Reader finds the
stepped-motion rule stated normatively" had no test that could fail (repo-structure.test.mjs
asserted only the rest-pose rule); the immediate-interaction/stepped-periodic statement in
`language/motion.md` is now asserted directly beside it.

## Second-pass review ruling (independent re-verification)

Every D1–D9 ruling above was re-checked against the code, not taken on faith; all stand.
Verification trail: the D4 widening is real (`extractShippedCss` matchAll over `<style>` plus
the later-block and inline-style regression tests); the D6 de-export is real (helpers.mjs line:
`const STEP_FPS`); D3's counts check out (grid 7–16 s × 8 → steps(56–128); blooms 304|408|536);
D8's sweep reproduced by grep — surviving mentions of the removed tokens are only the frozen
baseline, CHANGELOG history, and decision prose.

Spec→test mapping re-walked requirement by requirement: rest-pose normative → retained
repo-structure rest-pose assertions; stepped-motion normative → repo-structure
"motion language states the immediate-interaction, stepped-periodic rule"; smooth-affordance
rejection (design-language) and both propagation-validation failure scenarios → named fixture
tests per surface, each asserting the error identifies the offender; stepped+rest-pose passes →
the both-gates test plus its dropped-rest-pose negative; out-of-scope rejected → each
motion-scope pin (baseline sha256 + directory, dependencies, VERSION/changelog, effect/style/
skin modules, component classes) fails on its own violation; showcase contract + oracle →
gate end-to-end over a real build, built-page stepped assertions, effects-contract --tf
data↔markup agreement, 160-cell grid count, stripMotionClock parity under the recorded D7
exemption. No requirement is left without a test that would fail under violation.

One residual defect found and fixed during this pass, same shape as D6's finding:
`fencedCodeBlocks` in motion-contract.mjs was exported with no importer outside its own module
(the tests exercise `checkLanguageExamples`, not the helper); de-exported, and the module
header now says "every `<style>` block", matching what extraction actually does.

Seam audit: no dead seams. The gate's only non-test importer is scripts/validate.mjs via
`npm run validate` (production wiring), and `stepTF` has two real effect callers. Nothing to
route to ROADMAP-FEEDBACK on wiring grounds; the existing feedback entry stands as written.

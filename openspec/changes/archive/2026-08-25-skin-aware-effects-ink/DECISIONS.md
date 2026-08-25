# DECISIONS — skin-aware-effects-ink

## 1. Relative-colour syntax instead of bare `var(--color-ink)` in alpha-painted declarations

**What we did:** the four particle declarations whose ink carries an authored alpha
(`--bo` on `.grid i`, `--o` on `.gust`/`.mote`/`.drop`/`.splash`) were rewritten as
`rgb(from var(--color-ink) r g b / <unchanged alpha>)`; `.flake`'s fixed `0.55` border
alpha was kept literally inside the same form. `.flake` has no alpha variable at all, so
its *literal* alpha was retained — the requirement concerns the colour component, and the
design fixes "retain each declaration's existing alpha".

**Why:** task 1.1's shorthand "use the existing `--color-ink` role while preserving their
opacity variables" cannot be read as bare `var(--color-ink)` substitution: `#1f1b16`
carries no alpha channel, and moving the alpha elsewhere (element `opacity`, pre-derived
soft roles) would change what is painted and break the accepted baseline. Relative colour
syntax is the only form that replaces *only* the hardcoded colour component while keeping
every alpha exactly as authored. It is Baseline across evergreen browsers (Chrome/Edge
119+, Safari 16.4+, Firefox 128+) and passes through the repo's scope-preserving build
untouched. The design's own wording ("replace only the hardcoded colour component … with
`var(--color-ink)`") supports this; the task compressed it.

**Rejected:** new per-effect alpha tokens (design explicitly rejects new roles); element
`opacity` restructuring (changes animation/rest-frame semantics and risks the baseline);
`color-mix(in srgb, … calc(…))` (equivalent result, harder to read, same support class).

## 2. "Root form" of the effects CSS = the built zoo page's inlined sheet

**What we did:** the regression inspects two surfaces: `dist/css/effects.scoped.css` (the
shipped scoped bundle) and the styles inlined in `dist/zoo/index.html` (the unscoped,
root-selector rendering of the same sources), extracted with the existing
`extractShippedCss` helper.

**Why:** unlike tokens, the build emits no standalone root-form effects file — the root
form exists only as the zoo page's inline sheet. Both are built from the same source
files by the same run, so together they satisfy "root and scoped generated CSS" /
"both consumer CSS forms". A third copy (`release/values/css/effects.scoped.css`) is
assembly-copied from the dev output and already covered by distribution determinism tests.

## 3. The stranded-literal check lives in shared test helpers, not the validate gate

**What we did:** the checker (`collectEffectInk`, `effectInkViolations`,
`effectInkCoverageGaps`, `resolveInk`, `EFFECT_INK_FAMILIES`) lives in `test/helpers.mjs`
and is exercised by `test/effects-ink.test.mjs`, including a failing-fixture replay.

**Why:** the spec requires "the validation and regression suite SHALL verify"; the tasks
ask for focused regression coverage only. Wiring a new rule into `scripts/validate.mjs`
would add production machinery beyond the bounded-correction requirement ("add only
targeted regression coverage"). If a later change wants this as a CLI gate, the pure
functions are ready to move into `scripts/lib/`.

## 4. Vacuity protection is a separate coverage check

**What we did:** violations (cream literal present / any hardcoded colour without the
role) are reported by `effectInkViolations`; missing family/declaration pairs are reported
separately by `effectInkCoverageGaps`, asserted alongside violations on the real outputs.

**Why:** a gate that silently finds nothing is the failure mode three roadmap audits
flagged. Keeping coverage separate lets fixtures exercise single families while full
outputs must still offer up every declared paint site.

## 5. Discovered constraint: zoo-inlined comments are gated surface

The zoo page inlines the source styles *including comments*, and the showcase suite fails
on the words "primitive"/"semantic" appearing in the page. The first draft of the new
source comments used "semantic ink role" and broke `showcase.test.mjs > does not dump
tokens, tiers, or a state matrix`; the comments now say "ink colour role". Not a task/spec
disagreement — recorded because any future comment edit on these files hits the same wall.

## Reviewer rulings (review phase)

1. **Relative-colour syntax — accept.** Faithful to design.md decision 1 ("replace only
   the hardcoded colour component … retaining each declaration's existing alpha
   variable"): bare `var(--color-ink)` cannot carry an authored alpha, so relative-colour
   syntax is the only form that satisfies both the role requirement and baseline
   preservation. Verified: no `31 27 22` literal remains anywhere in source/scripts;
   `.fleck`/`.pollen`/`.firefly`/`.sunpool`/`.haze` already painted through roles, which
   is why the six-family spec list is complete.
2. **Root form = the zoo page's inlined sheet — accept.** Claim verified against
   `scripts/lib/build-core.mjs`: the effects emission writes only
   `css/effects.scoped.css`; no standalone root-form effects file exists, so the inline
   sheet is the root form. Both surfaces come from the same sources in one run.
3. **Checker in `test/helpers.mjs`, not the validate gate — accept.** The spec's own
   bounded-correction clause limits added machinery to targeted regression coverage, and
   the motion/shadcn gates entered validate as features of their own changes, not as
   bounded corrections. The functions are pure and move-ready if a later change wants a
   CLI gate.
4. **Separate coverage check — accept.** A silent gate is worthless; fixtures exercise
   single families while full outputs must offer every declared paint site.

Reviewer notes (not decisions): `collectEffectInk` inspects only the first occurrence of
a property per rule body — correct for today's one-declaration sites; remember if
fallback declarations ever appear. And `helpers.mjs` now holds two brace-matched CSS
walkers (the pre-existing keyframes/rules parser plus `rulesWithBodies`) — flagged in
ROADMAP-FEEDBACK rather than unified here, because the older walker's per-rule output
shape has existing consumers and this phase does not run the suite.

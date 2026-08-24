# Decisions — reduced-motion-rest-frames-travel-with-states

Recorded while implementing. Each entry: what was done, what was rejected, why.

## 1. The old rest frames were partly inert — rest rules re-specified per animation selector

**What:** every co-located reduced-motion rule names its selectors exactly as the
animation rule names them (`.wx-rain .wxc`, `.bloom .b1`, …), and the gate demands
that exact match.

**Found:** the old `responsive.css` block grouped its stops as
`.bloom i, .grid i, .wxc { animation: none }`. Those selectors lose the cascade to
the very animations they meant to stop — `.bloom i` (0,1,1) vs `.bloom .b1` (0,2,0);
`.wxc` (0,1,0) vs `.wx-rain .wxc` (0,2,0); media queries do not raise specificity.
So in a real browser the bloom drifts and the per-glyph header weather kept playing
under `prefers-reduced-motion` even where the block looked like it covered them.
"Moving the frames" verbatim (roadmap bullet, task 1.5) would have shipped that
defect into consumer bundles; only the states' three poses were effective before.

**Rejected:** keeping combined low-specificity groupings for tidiness, or patching
with `!important`. Mirroring the animation selector is structural: equal specificity,
later in source order, wins — and it is exactly what the gate can check.

## 2. Ripe rest pose carries `transform: scale(1)` (spec wording over the old block)

The old shipped block posed only `.ripe { background: … }`; the spec requires a
declared static value *for each property the keyframe animates* (`ontwerp-ripen`
animates background AND transform), and the roadmap itself says "accent fill @
scale(1)". Implemented with both declarations. Our own gate would fail the old line —
evidence it bites on real regressions, not just synthetic fixtures.

## 3. Particle removal is declared per class, not only on `.wx-field`

**What:** weather.css's reduced-motion block hides `.wx-field` AND lists
`.gust, .mote, .drop, .is-rain .drop, .splash, .fleck, .pollen, .firefly, .flake,
.haze, .sunpool { display: none; animation: none; }`.

**Why:** task 1.3(a) names only `.wx-field`, but the propagation-validation spec
requires coverage for *every selector that references* each shipped keyframe, and
removal must be visible to a mechanical gate. Ancestor inference (".gust lives inside
.wx-field") is a DOM fact a CSS-only gate cannot know without coupling the validator
to generated markup. Naming the particles is belt-and-braces in real CSS too: a
consumer who rebuilds a field container of their own still gets the accessible default.
`.is-rain .drop` is listed because it overrides `animation-name` at higher specificity;
the gate treats it as ontwerp-drop-land's referencing selector.

## 4. Gate matching semantics (scripts/lib/keyframe-coverage.mjs)

- Coverage = an `@media (prefers-reduced-motion: reduce)` rule whose selector list
  contains the referencing selector **exactly** (whitespace-normalised). Exactness
  doubles as the specificity guarantee (decision 1).
- One rule must satisfy both clauses: stop (`animation`/`animation-name: none`) and
  pose (`display: none`, or a declared value for every property the keyframe animates,
  custom properties included — `--bo` counts via `@property`).
- Keyframes nothing references demand nothing (they ship dead); usage and declaration
  may sit in different files of the same scanned bundle.
- Two-pass parse because animation declarations precede their `@keyframes`
  (`.gseed { animation: ontwerp-germinate … }` comes first in states.css).
- Rejected: substring/glob matching (false coverage), cross-rule pose accumulation
  (a stop in one rule and a pose in another is two half-fallbacks), scoring partial
  coverage as pass.

## 5. Gate lives in `scripts/validate.mjs`, reading `design-system/dist/css/**`

Task 2.2 keys the gate to built output; task 2.3 wires it into the existing entry
point. It is deliberately **not** inside `validateTokenDir`: the build calls that
pre-build, and gating a build on output the build has not produced yet would deadlock
a cold run. `npm run check`/CI order (build → validate) makes the bundle exist by the
time the gate runs; a missing bundle fails loudly with "run npm run build" rather than
skipping silently — a silent skip would be a requirement no run can fail.

## 6. Playwright without adding a dependency

Task 4.4 wants a browser check with `prefers-reduced-motion` emulated. No playwright
package exists in this repo and installing one (plus matching browser) costs a
download this box avoids; the browsers are already cached machine-wide and sibling
checkouts carry matching module versions. `scripts/verify-reduced-motion.mjs`
(`npm run check:motion`) resolves the module repo-local → `$MOTION_PLAYWRIGHT_PATH` →
known sibling paths, pins to an existing chromium binary, scopes HOME/XDG_CONFIG_HOME
to a temp dir (crashpad cannot write under a sandboxed $HOME), closes the browser in
`finally`, and takes **no screenshots** (prohibited here). If no module can be found
it exits non-zero with instructions — the check can fail, it never silently skips.

## 7. zoo-parity checker evolved honestly instead of loosened

Moving rest frames between modules necessarily changes which stylesheet lines carry
them, so the old line-string comparison would fail forever after. Rather than delete
the comparison or touch the accepted baseline (forbidden): the checker now splits
selectors by media context, compares the unconditional surface exactly as before,
compares the reduced-motion set per individual selector, and carries an explicit
`RELOCATED_REST_FRAMES` record mapping the two replaced combined selectors to their
per-selector replacements. Everything else must survive verbatim; the rebuild must
cover strictly more than the baseline did. The replacement assertions are stronger
than what they replaced (gate + co-location tests + browser behaviour vs a string match).

## 8. material.css ships no keyframes — asserted, not assumed

Task 1.4 says confirm and record. Confirmed by grep, and pinned by a test assertion
(`showcase.test.mjs`) so the claim degrades loudly if a keyframe ever appears there.

## 9. Rising keeps its authored pose `translateY(45%)`

The roadmap names no number for rising ("settled vessel"); 45% is the value the
system had already authored for that pose. Kept; the vessel shows water part-way up.

## 10. Recipes untouched

`motion.recipes.json` entries already declare `"reducedMotion": "disabled"`; the specs'
deltas name no recipe change, and inventing a rest-pose schema field here would be
scope creep. Language prose + shipped CSS + gates carry the change.

---

## Review rulings (review phase)

Each decision above, ruled on against AGENTS.md / brief / change-propagation and the
V1 handoff traps — not against plausibility.

- **§1 ACCEPT** — re-specifying selectors exactly fixes a real shipped defect and is
  what makes the gate mechanically checkable; consistent with the handoff trap that
  the gate keys to shipped CSS.
- **§2 ACCEPT** — `transform: scale(1)` follows from the spec clause ("each property
  the keyframe animates") plus the roadmap's own "@ scale(1)" wording.
- **§3 ACCEPT** — per-class removal keeps removal visible to a CSS-only gate without
  coupling it to generated markup; no visual values were invented.
- **§4 ACCEPT, strengthened** — the exact-selector property was asserted in this file
  and the module header but no test would fail if the gate accepted a broader
  selector (the precise regression §1 found). Added
  `test/keyframe-coverage.test.mjs → "a rest rule naming a different selector does
  not cover the referencing one"`; it fails under any substring/suffix matching.
- **§5 ACCEPT** — dist-keyed gate with loud missing-bundle failure matches tasks 2.2–2.3
  and avoids the pre-build deadlock; a silent skip would be untestable.
- **§6 ACCEPT, caveat recorded** — no new dependency, cached browsers, no screenshots,
  browser closed in `finally`, loud failure when absent: all house rules honoured. The
  hardcoded sibling paths and fixed `/tmp/pw-home` are machine-specific dev machinery,
  tolerable behind `$MOTION_PLAYWRIGHT_PATH`; see ROADMAP-FEEDBACK for the seam that
  nothing automated calls.
- **§7 ACCEPT, one correction applied** — the checker's evolution is honest (baseline
  untouched; unconditional surface still compared exactly), but its own claim
  ("rebuild must cover strictly more") was asserted with `toBeGreaterThanOrEqual`.
  Strengthened to `toBeGreaterThan` (built carries 27 reduced-motion selectors vs the
  baseline's 7) so the test says what §7 says.
- **§8 ACCEPT** — claim pinned by assertion rather than assumed; house style.
- **§9 ACCEPT** — authored value kept; nothing invented.
- **§10 ACCEPT** — verified: `motion.recipes.json` already declares
  `"reducedMotion": "disabled"` on every entry; a new schema field would be scope creep.

Review-phase edits beyond the rulings: dead export removed (`parseCoverageModel` had
no importer anywhere; now module-private), and the keyframe-coverage module header
corrected — it claimed validate.mjs owns reading dist while `cssEntriesUnder` (this
module) does that reading; the header now describes the actual split.

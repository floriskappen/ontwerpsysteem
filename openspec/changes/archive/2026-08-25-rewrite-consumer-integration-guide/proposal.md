## Why

The consumer documentation describes one adoption story — greenfield, whole-app, `:root` — while
every real consumer so far has been partial: a scoped island in a shared DOM (de-ontwerper's tool
chrome) or an existing app being retrofitted. Consumers hit the same four frictions the roadmap
recorded (S1 scope-on-ancestor trap, S3 retrofit honesty, S13 Preflight counter-rule, S16 brittle
presentation-coupled tests, S18 utility-mark over-application) and each had to solve them by hand.
The machinery for all three adoption modes now ships; the docs still teach only one of them.

## What Changes

- Rewrite the consumer integration guide around three first-class cases: **A — whole-app** (`:root`
  builds, unchanged and simplest), **B — island / partial adoption** (scope class on chrome roots
  only, never on an ancestor of an excluded subtree; `.ontwerp-boundary` at seams; scoped bundles;
  scoped font wiring), and **C — retrofit** of an existing app (honest: a component-by-component
  reskin, with the migration checklist — shadows→none, radius→0, palette→roles, font→Archivo,
  status glyphs→marks/states — and the shadcn adapter as the accelerator).
- Carry the hard-won operational notes into the shipped bundle: the CSS-reset interaction (the
  Preflight `text-transform` counter-rule recipe; the voice-assumes-inheritance statement), testing
  guidance (consumer tests assert roles/semantics — never raw palette utilities or glyphs), and the
  font/scope rules already shipped by earlier changes.
- Normative type-language edit: mono-uppercase **utility marks are for data** (numerals, counts,
  machine identifiers, coded events); prose labels, subtitles, and eyebrows stay in the Archivo
  lowercase voice. BREAKING-adjacent for anyone who mono-uppercased labels — flagged for the v1
  changelog.
- Update `templates/consumer-AGENTS.md`, `templates/consumer-README.md`, `templates/DESIGN.md`
  (pin file records the adoption case), and this repo's `README.md` Cases 1–3 to match.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `openspec/specs/distribution`: the bundle's consumer documentation SHALL document the three
  adoption cases end-to-end, the CSS-reset interaction, and role-based consumer testing guidance.
- `openspec/specs/design-language`: the type language SHALL reserve the mono-uppercase utility mark
  for data, distinct from prose labels.

## Impact

Consumer-facing templates (`design-system/templates/`), `language/type.md`, repo `README.md`, and
the tests that assert bundle contents. No build outputs, token values, component sources, or zoo
behaviour change — the zoo is untouched and no baseline regeneration is needed. Existing whole-app
guidance remains valid; the change adds the two missing stories and the operational notes around
them rather than replacing the working path.

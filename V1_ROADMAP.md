# V1 Roadmap — from consumer pain to a v1.0.0 release

Input: `DESIGN_SYSTEM_STRUGGLES.md` — 26 concrete frictions (S1–S26) hit while integrating
the pinned `v0.1.1` bundle into de-ontwerper, a *scoped* consumer (design system on the
tool chrome only, a sandboxed shadcn subtree in the same DOM that must stay untouched).

This roadmap turns those into OpenSpec changes. Every struggle maps to exactly one change
(coverage matrix at the bottom). Changes are grouped into waves; changes within a wave
are independent and can run in parallel.

---

## Root-cause analysis

The 26 struggles are symptoms of three architectural gaps:

### R1. The distribution assumes whole-app, `:root`, no-reset adoption
Everything ships as bare globals: `:root { … }` tokens, a bare `@theme` block, global
component classes, global keyframe names (`germinate`, `gust`, `bo`), and a voice set via
inherited properties on `body`. The build also **flattens every alias to a literal**
(`base.css` re-links them with `var()` at runtime only inside the zoo). A consumer that
needs the system scoped to part of a page must therefore hand-copy, re-scope, re-derive,
and re-sync **every** layer — tokens, component classes, states, atmosphere — on every pin
advance, and skins stop working because the alias chains they rely on were flattened away.
→ S1, S5, S6, S7, S8, S10, S11, S12, S17, S22

### R2. The zoo is a demo, not a library
The effects/generators emit HTML/SVG **strings** for `innerHTML`, entangling data with
presentation. Stated principles — determinism, reduced-motion rest states, perf budgets,
mount cardinality — are prose intentions, not enforced properties of the shipped code.
Common chrome primitives (status mark, tab/segmented control, per-glyph weather markup)
have no shipped component or recipe, so each consumer invents divergent ones.
→ S14, S15, S19, S20, S21, S24, S25, S26

### R3. The consumer contract has gaps
No roles for focus-ring / destructive / disabled; no dark story; no shadcn crosswalk; no
retrofit path for an existing app (the guide only covers greenfield/whole-app); no
boundary/reset recipe; the "utility mark" voice over-applies to prose; Archivo ships
without the 400 weight its own token references; no note on CSS-reset (Preflight)
interactions or how consumer tests should assert the system.
→ S2, S3, S4, S9, S13, S16, S18, S23

**The strategic shift for v1:** the unit of distribution moves from *"a token file you
import at `:root`"* to *"a scope-able, alias-preserving, data-first bundle that can be
mounted as an island."* Whole-app adoption stays a trivial special case (scope = `:root`).

---

## Wave 1 — Distribution foundations (4 changes, all parallel)

These four changes fix the load-bearing layer everything else builds on. No change in
this wave depends on another.

### Change 1: `add-scoped-css-distribution`
**Fixes:** S1, S6, S7, S8, S11, S12, S17 · **Root cause:** R1

The single highest-leverage change. Ship scope-aware build targets so a consumer imports
instead of copying.

- **Scoped token build:** emit `values/css/tokens.scoped.css` with the token block under a
  scope class (default `.ontwerp`) alongside the existing `:root` build. Make the class a
  build parameter so the default bundle carries `.ontwerp` but the choice is documented.
- **Scoped component/state/atmosphere CSS:** emit the zoo's `components.css`, `states.css`,
  `atmosphere.css`, `material.css`, `weather.css` as a consumable, `.ontwerp`-scoped
  bundle (e.g. `values/css/components.scoped.css` + `effects.scoped.css`) — today these
  are zoo-internal and every consumer ports them by hand (S12, S22).
- **Namespaced keyframes:** all keyframe names get the `ontwerp-` prefix in shipped CSS
  (`ontwerp-germinate`, `ontwerp-gust`, `ontwerp-bo`, …) so they can't collide in a shared
  document. The zoo consumes the namespaced names (one source of truth, no drift).
- **Boundary primitive:** ship `.ontwerp-boundary` — a documented reset class that stops
  the system at a descendant seam: re-points `--font-sans`/`--font-heading` to a consumer
  slot (`--ontwerp-boundary-font`, with a system-ui default), and pins the inherited
  voice properties (`font-family`, `text-transform`, `letter-spacing`) to initial values.
  This is the S7/S17 island seam, solved once, upstream.
- **Skin-override slot:** the scoped token build reserves an explicit place for skin
  overrides that survives aggressive CSS pipelines (S11: Lightning CSS drops a second
  same-target custom-property rule). Concretely: document that skins must be merged into
  the scope block or applied via a *distinct* selector the bundler can't dedupe (e.g.
  `.ontwerp[data-skin="rose"]`), and ship skins in that shape (see Change 6).
- **Tailwind namespace (decided):** the Tailwind theme output is namespaced
  (`--color-ontwerp-paper`, `--font-ontwerp-sans`, `--radius-ontwerp-*`). Breaking, but
  S6 showed bare names silently redefine what `font-sans`/`rounded-md` mean in any
  Tailwind v4 consumer — v1.0 is the moment to break it. The changelog entry carries the
  rename table.

**Spec impact:** `build-pipeline` (new outputs, scope parameter), `distribution` (bundle
contents), `showcase` (zoo consumes the namespaced keyframes).
**Done when:** a consumer can `@import` scoped tokens + components + effects under
`.ontwerp`, mount an island, and delete their hand-maintained copies; a test asserts the
scoped outputs are generated from the same source as the `:root` build (no drift).

### Change 2: `keep-token-aliases-live-in-css`
**Fixes:** S10 (root cause) · **Root cause:** R1

The build currently flattens `component → semantic → primitive` alias chains to literals
in the CSS outputs; the zoo's `base.css` then manually re-links ~20 of them with `var()`
so its theme bar works. That re-linking is exactly what scoped consumers lose.

- CSS outputs (both `:root` and scoped) preserve alias chains as `var()` references:
  `--button-border-default: var(--color-border-strong)`, etc. Literals remain only at the
  primitive tier.
- Delete the manual re-link block from `base.css` — the built output now carries it.
- Make the button halftone token-driven: `radial-gradient(var(--color-ink) 1px, …)`
  instead of the hardcoded `rgb(31 27 22)` (`components.css:19`), so it reskins.
- JS output and manifest keep resolved values (agents reading values want literals) but
  the manifest records the alias chain per token.

**Spec impact:** `build-pipeline` (CSS emits aliases), `token-format` (manifest carries
alias metadata).
**Done when:** overriding only the semantic colour roles in a scoped consumer restyles
buttons/fields/cards/badges/links with zero component-token edits — the zoo's theme bar
works via the built output, not a hand-maintained re-link.

### Change 3: `complete-the-colour-role-contract`
**Fixes:** S2 (roles half), S10 (derivation half) · **Root cause:** R3

The semantic layer is missing roles real apps need, and the derivation of the "long tail"
colours (greys, on-ink, borders, blooms) from the core trio is implicit.

- Add explicit semantic roles: `--color-focus-ring` (today: accent doubles), `--color-
  destructive` + `-soft` (today: the one red doubles as accent *and* danger), disabled
  text/border/surface roles, and a documented "muted" tier mapping (`text-quiet`/`-faint`
  are close but unnamed for this purpose).
- Document the **derivation rules**: how `ink-soft/quiet/faint`, `border-*`, `on-ink`,
  surface-deep/claim, and the bloom colours are derived from a skin's ink + paper + accent
  (mix ratios / alpha ramps). This is what S10 had to reverse-engineer and is the contract
  Change 6 (complete skins) and Change 9 (dark skin) build on.
- `language/colour.md` grows a roles table: every role, what may consume it, and whether
  a skin must supply it or may derive it.

**Spec impact:** `token-format` (naming grammar additions), `design-language`.
**Done when:** a consumer mapping the system onto another semantic contract (shadcn or
otherwise) finds every role they need defined, and a skin author knows exactly which
values to supply and how the rest derive.

### Change 4: `fix-font-shipping-and-weights`
**Fixes:** S9, S5 · **Root cause:** R3 · **Small; fully parallel.**

- Resolve the Archivo range mismatch (decided: **ship the face**): the shipped face
  covers `500 700` while `--weight-regular: 400` exists — a token that promises a weight
  the font can't render is a defect. Ship a variable face covering 400–700; the few KB
  of woff2 is nothing.
- Verify Caveat is actually shipped and referenced consistently (`language/type.md`
  mentions it; confirm the `@font-face` + usage survive into the bundle).
- Document font application as a **scoped concern**: the `@font-face` rules ship as a
  standalone `values/css/fonts.css` (paths relative to `fonts/`), and the guide shows
  setting the voice on the scope root, never on `html`/`body`, with the
  `.ontwerp-boundary` recipe (Change 1) as the escape hatch.

**Spec impact:** `distribution` (fonts contract), `design-language` (type).
**Done when:** every weight token maps to a real glyph range and the bundle documents
scope-safe font wiring.

---

## Wave 2 — Library-grade primitives (4 changes, mostly parallel)

### Change 5: `effects-as-pure-data-modules`
**Fixes:** S19, S20, S22 (generator half) · **Root cause:** R2 · **Depends on:** nothing
hard; coordinates with Change 1 on the scoped effects CSS.

Invert the generators from string-emitters to data functions, and make determinism a
property of the code.

- Every generator returns **data, not markup**: `seedHead(n) → {cx, cy, r, index}[]`,
  `renderGrid → {a, b, d, dl}[]` cell data, weather fns → `Particle[]`. Thin
  `renderX()` wrappers (markup from data) keep the zoo build working — the zoo becomes
  the first consumer of the data API rather than the only consumer of a string API.
- **Bake in determinism (S20):** seeding strictly by index, memoization per parameter set
  (byte-identical output across calls), and an architecture test forbidding
  `Math.random` / `Date.now` / `performance.now` in `effects/` — the guarantee the brief
  states but the code doesn't enforce.
- The data functions ship in the bundle (`values/js/effects.js` or similar) so a React/
  Vue/Svelte consumer renders `<circle>`/`<i>` elements idiomatically instead of
  `dangerouslySetInnerHTML` — de-ontwerper's inversion (S19) becomes the supported path.

**Spec impact:** `showcase` (zoo generated from the data API), `distribution` (effects
module in bundle), possibly a new `effects-contract` capability.
**Done when:** no shipped generator returns an HTML/SVG string as its primary API; the
determinism test exists; the zoo output is byte-identical before/after.

### Change 6: `ship-skins-as-complete-role-sets`
**Fixes:** S10 · **Depends on:** Change 2 (live aliases), Change 3 (derivation rules).

- Redefine the skin format: a skin supplies the core roles **and** every derived
  colour-carrying role (or names the derivation from Change 3 that produces them) —
  greys, on-ink, borders, blooms, pollen included. No more 7-var skins that strand the
  rest on cream.
- Ship skins in the S11-safe shape from Change 1 (`.ontwerp[data-skin="…"]` /
  `[data-skin]` on `:root` for whole-app), as importable CSS, not just zoo demo data
  (`skins.mjs` stays as the zoo's source but is generated from / validated against the
  shipped skin files).
- Validation: a test walks every colour-carrying token and asserts each skin covers or
  derives it — a new skin can't silently strand a token.
- Candidate: upstream de-ontwerper's hand-derived **rose** skin as the first complete
  non-zoo skin (it already exists and exercised the derivation).

**Spec impact:** `token-format` or a new `theming` capability, `distribution`.
**Done when:** applying one shipped skin file to a scoped consumer reskins *everything*
(borders, on-ink, greys, component tokens, halftone) with no hand-derivation.

### Change 7: `reduced-motion-rest-frames-travel-with-states`
**Fixes:** S21, S26 (reduced-motion half) · **Depends on:** Change 1 (scoped/namespaced
CSS is where the frames land); parallel with 5/6.

- Every animated state/effect ships its reduced-motion rest frame **in the same shipped
  CSS** (germinating → filled seed head @ 0.9, ripe → accent fill @ scale(1), rising →
  settled vessel, particle fields → hidden, per-glyph header motion → static).
- Move the frames out of the zoo-only `responsive.css` into the states/weather layers so
  they travel with the scoped bundles from Change 1.
- Add a validation gate: every `@keyframes` in shipped CSS must have a corresponding
  reduced-motion rule (the test de-ontwerper had to write lives upstream now).
- `language/motion.md` states the rule: an animated state without a deliberate rest pose
  is incomplete, not optional polish.

**Spec impact:** `showcase`, `propagation-validation` (the keyframe-coverage gate),
`design-language` (motion).
**Done when:** a consumer importing any state/atmosphere CSS gets accessible defaults
for free, and the validator fails on an uncovered keyframe.

### Change 8: `add-status-mark-and-segmented-control`
**Fixes:** S14, S15 · **Depends on:** Change 3 (destructive role for fail marks);
otherwise parallel.

Two missing chrome primitives, built the repo's way (language → recipe → zoo section →
shipped CSS):

- **Status mark:** the static, non-animated answer to pass/fail/warn — the compliant
  fallback for consumers who can't mount the animated lifecycle states. Define its
  relationship to the organic states explicitly (a status mark is the *rest frame* of a
  lifecycle state, rendered inert): pass = ripe-at-rest, fail = red confined to a rule
  (destructive role), warn = quiet. Recipe: `state.mark.static`.
- **Tab / segmented control:** square hairline cells sharing an ink rule; selected =
  solid ink + paper text, unselected = paper + ink text; instant switch (no slide).
  Settles the selected-state contract S15 had to invent. Recipe:
  `component.tabs.segmented`.
- Both appear in the zoo (worked example), in `component.recipes.json` /
  `state.recipes.json`, and in the scoped component CSS from Change 1.

**Spec impact:** `design-language`, `showcase`. (Per `openspec/config.yaml` the visual
values are content — the *change* specs the machinery additions: new recipes exist, zoo
renders them, scoped CSS ships them.)
**Done when:** a consumer reaching for pass/fail or a mode-switcher finds a shipped
recipe + class instead of inventing one.

---

## Wave 3 — Consumer surface (4 changes)

### Change 9: `declare-light-only-theming`
**Fixes:** S4 · **Depends on:** nothing — pure docs; can run any time. (Decided:
**light-only, by design.**)

The system claims "theming = role swap"; S4 calls the bluff. The answer is a stance, not
a skin: paper *is* the material thesis, and the grain/multiply/ink language is built on a
light ground.

- `language/theming.md`: state explicitly that skins vary hue, not lightness polarity —
  every skin is a paper. Dark mode is out of scope by design, not omission.
- `language/anti-goals.md`: add the entry ("no dark mode — a dark ground collapses the
  multiply/ink material language").
- Consumer guidance (feeds Change 13): an app with an existing `.dark` theme should keep
  the system's chrome light (a physical sheet doesn't invert) or keep the DS out of
  dark-mode surfaces — either is now a *supported* answer instead of a unilateral
  deviation to record.

**Spec impact:** `design-language`.
**Done when:** a consumer with an existing `.dark` theme finds the light-only stance and
its rationale in the bundle, and stops owing themselves a dark palette.

### Change 10: `add-shadcn-adapter`
**Fixes:** S2 (mapping half) · **Depends on:** Change 3 (needs ring/destructive/muted
roles to map).

- Ship `values/shadcn/adapter.css`: a block mapping DS semantic roles onto the shadcn
  variable contract (`--background: var(--color-surface-page)`, `--primary`, `--border`,
  `--ring: var(--color-focus-ring)`, `--destructive`, `--muted`/`--muted-foreground`,
  `--card`, …), in both `:root` and scoped flavours.
- Document the judgment calls in the file itself (what `--muted` means here, why
  `--ring` isn't the accent, radius mapping to 0).
- This is the first framework adapter — keep it a *values-only crosswalk* (no component
  re-implementations), consistent with `roadmap.md`'s "defer adapters" stance; it earns
  its place because two real consumers needed exactly this file.

**Spec impact:** `distribution` (optional adapter dir), new `adapters` capability or a
`distribution` requirement.
**Done when:** a shadcn/Tailwind consumer imports tokens + adapter and their existing
shadcn-shaped chrome picks up the system without hand-authoring a crosswalk.

### Change 11: `document-atmosphere-mount-and-cost-contract`
**Fixes:** S23, S24 · **Depends on:** Change 5 (data generators are what gets mounted);
docs can draft in parallel.

Make the atmosphere's implicit operating envelope explicit:

- **Mount cardinality:** the ambient stack is chrome-level, mounted **once per chrome
  root**, never per tile/card/list-item. State it in `language/atmosphere.md` and the
  recipe JSON (`mountCardinality: "once-per-root"`).
- **Cost budget:** cap and document generator counts (grid cells, particles per field
  6–51, blooms 3); weather is opt-in and off by default. Encode caps as generator
  defaults + a validation test, not prose.
- **Fixed-behind-scope recipe:** document the stacking-context dance S23 solved —
  `isolation: isolate` on the chrome root, ambient layers as DOM descendants of the
  scope (tokens need the tree), content lifted above `z-0`. Ship it as a documented
  pattern + the CSS the scoped bundle needs (`.ontwerp-root { isolation: isolate }`).

**Spec impact:** `design-language` (atmosphere), `propagation-validation` (cap test),
recipe schema gains cost/cardinality fields.
**Done when:** the cost model and mount pattern travel with the layer; a consumer can't
reasonably multiply the atmosphere by tile count out of ignorance.

### Change 12: `canvas-and-pointer-ambient-primitives` — **deferred to v1.1**
**Fixes:** S25, S26 (component halves) · **Depends on:** Change 5. · **Decided: out of
v1.0.** De-ontwerper *re-authored* these from scratch rather than copying DS source, so
they carry no re-sync burden on pin advance — unlike everything else here — and they
serve one consumer shape (canvas tools). Kept specced below as the v1.1 opener.

The atmosphere currently only works on static pages; tools have canvases and cursors.

- **Transform-aware grid:** offer the breathing grid as a layer that accepts a scale +
  offset (CSS vars the consumer's viewport publishes), with a documented LOD policy
  (cell-size snapping across zoom steps) — de-ontwerper's re-authored lattice, upstreamed
  as the recipe `atmosphere.grid.tracking`.
- **Per-glyph weather helper:** a data/markup helper that splits a heading into indexed
  `.wxc` spans with the accessibility contract built in (full text as label, spans
  hidden) — the `WeatherText` component's logic, shipped framework-neutral (data fn +
  reference renderer, per Change 5's pattern).
- **Pointer-reactive ambience:** one sanctioned primitive for "ambience answers the
  cursor" (the pointer-masked grid highlight), with its reduced-motion rest defined
  (Change 7's gate covers it).

**Spec impact:** `showcase`, `design-language` (atmosphere/motion), recipes.
**Done when:** a canvas tool can mount a grid that tracks its transform, and per-glyph
weather is a helper call, not a hand-splitting chore.

### Change 13: `rewrite-consumer-integration-guide`
**Fixes:** S1, S3, S13, S16, S18 · **Depends on:** finalize *after* Waves 1–2 land (it
documents them); drafting can start immediately.

The consumer docs currently describe one adoption story (greenfield, whole-app). Rewrite
around three:

- **Case A — whole-app:** today's path, now via `:root` builds (unchanged, simplest).
- **Case B — island / partial adoption (new, first-class):** scope class on chrome roots
  only, never on an ancestor of an excluded subtree (S7's rule), `.ontwerp-boundary` at
  seams, scoped bundles from Change 1, fonts per Change 4.
- **Case C — retrofit of an existing app (new):** be honest that adoption = a
  component-by-component reskin, with the migration checklist S3 asked for
  (shadows→none, radius→0, palette→roles, font→Archivo, status-glyphs→marks/states) and
  the shadcn adapter as the accelerator.

Plus the hard-won operational notes:

- **CSS-reset interaction (S13):** the Preflight `text-transform` counter-rule recipe;
  the general statement that the DS voice assumes inheritance and what to re-assert
  inside a reset environment.
- **Testing guidance (S16):** consumer tests should assert roles/semantics (a mark
  exists, red is a rule) — never raw palette utilities — so skin swaps don't churn tests.
- **Utility-mark scoping (S18):** normative edit to `language/type.md`: mono-uppercase
  is for **data** (numerals, counts, machine identifiers, coded events); prose labels,
  subtitles, and eyebrows stay in the Archivo lowercase voice. This is a real language
  change (BREAKING-adjacent for anyone who mono-uppercased labels) — changelog it.
- Update `templates/consumer-AGENTS.md`, `templates/DESIGN.md`, and `README.md` Cases
  1–3 to match.

**Spec impact:** `distribution` (bundle docs contract), `design-language` (type).
**Done when:** the next scoped consumer follows Case B start-to-finish without hitting
any of S1/S5/S7/S13; the type voice rule is unambiguous.

---

## Wave 4 — Ship it

### Change 14: `release-v1`
**Depends on:** everything intended for v1 archived.

- Reconcile specs: `openspec validate --all --strict` passes; no contradictions between
  specs, `AGENTS.md`, and the new bundle shape.
- `CHANGELOG.md`: one v1.0.0 entry per changed recipe/language ID with propagation notes;
  mark the breaking ones (flattened→live aliases, keyframe renames, skin format, weight
  token, utility-mark scope) **BREAKING** with migration notes keyed to what de-ontwerper
  already did by hand (its copies become deletions).
- Bump `design-system/VERSION` → `1.0.0`, publish to `release` + tag (human-approved,
  per `change-propagation.md`).
- Victory condition: **de-ontwerper advances its pin to v1.0.0 and deletes its
  hand-maintained copies** (re-scoped tokens, ported components/states/atmosphere,
  `.ontwerp-reset`, hand-derived rose skin, its own reduced-motion block and determinism
  tests). That app is the acceptance test for this entire roadmap.

---

## Dependency graph

```
Wave 1 (parallel)          Wave 2                        Wave 3                    Wave 4
────────────────           ──────────────────            ────────────────          ──────
C1 scoped-distribution ──┬─→ C5 effects-as-data ──┬────→ C11 atmosphere-contract ─┐
                         │                        │                               │
C2 live-aliases ────┬────┼─→ C6 complete-skins ───┤      C9 light-only docs ──────┤
C3 colour-roles ────┘────┤                        │                               ├─→ C14 release-v1
   │                     └─→ C7 rest-frames       │                               │
   └─────────────────────┬─→ C8 status/tabs ──────┘                               │
C4 fonts ────────────────┴──────────────────────────────→ C10 shadcn-adapter ─────┤
                                                          C13 integration guide ──┘
                                                          (drafts from day 1,
                                                           finalizes last)

v1.1: C12 canvas/pointer primitives (after C5)
```

Maximum parallelism: **C1–C4 simultaneously**, then **C5/C7/C8 + C6** once their inputs
land, then **C9–C11 + C13** (C9 is pure docs and can slot anywhere). C13 is the
long-running doc track: open it early, land it last.

---

## Decisions (resolved 2026-07-16)

- **D1 — Tailwind namespace → namespace it.** Bare `@theme` names silently redefine
  `font-sans`/`rounded-md` in any Tailwind v4 consumer (S6). Breaking; v1.0 is the
  moment. Rename table ships in the changelog. (Lands in C1.)
- **D2 — Archivo 400 → ship the face.** A weight token the font can't render is a
  defect, not a trade-off. (Lands in C4.)
- **D3 — Dark mode → light-only, by design.** Paper is the material thesis; skins vary
  hue, never lightness polarity. C9 becomes a docs change to `theming.md` +
  `anti-goals.md` with consumer guidance for apps that ship a `.dark` theme.
- **D4 — C12 → v1.1.** De-ontwerper re-authored (not copied) the canvas grid and glyph
  weather, so no re-sync burden accrues; it's the only change serving one consumer
  shape. v1.0 loses nothing.

---

## Struggle coverage matrix

| Struggle | Change | | Struggle | Change |
|---|---|---|---|---|
| S1 island adoption | C1 + C13 | | S14 status mark | C8 |
| S2 shadcn crosswalk/roles | C3 + C10 | | S15 segmented control | C8 |
| S3 retrofit honesty | C13 | | S16 test guidance | C13 |
| S4 dark mode | C9 (light-only) | | S17 boundary reset | C1 |
| S5 font scoping | C4 (+C1) | | S18 utility-mark scope | C13 |
| S6 @theme collision | C1 (namespaced) | | S19 string-emitting effects | C5 |
| S7 scope-on-ancestor trap | C1 + C13 | | S20 determinism unenforced | C5 |
| S8 no scoped build | C1 | | S21 reduced-motion gaps | C7 |
| S9 Archivo 400 | C4 (ship face) | | S22 atmosphere re-scope burden | C1 + C5 |
| S10 partial skins / flattening | C2 + C3 + C6 | | S23 fixed-behind-scope | C11 |
| S11 bundler drops override | C1 (skin slot) + C6 | | S24 perf ceiling / caps | C11 |
| S12 component-class copies | C1 | | S25 transform-aware grid | C12 (v1.1) |
| S13 Preflight interaction | C13 | | S26 glyph weather / pointer | C7 + C12 (v1.1) |

All 26 covered; none double-owned without a named split.

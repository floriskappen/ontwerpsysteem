# Changelog

Releases of the ontwerp design system. Each entry lists the **recipe and language
IDs** whose durable behaviour changed and a short **propagation note** — what a
consuming application must re-check after advancing its pin. Versions are semver:
**MAJOR** = breaking design/contract change, **MINOR** = additive, **PATCH** = fixes.
Exploratory (non-durable) changes do not appear here.

Entry format:

```
## <version> — <date>

### Added | Changed | Removed
- <recipe-or-language-id>: <what changed>   [**BREAKING** if it changes meaning]

**Propagation:** <what a consumer must re-check after advancing the pin>
```

## Unreleased

### Added
- Built values (scoped CSS distribution): the bundle now ships scope-aware CSS
  targets under `values/css/` alongside the `:root` tokens — `tokens.scoped.css`
  (every token under the `.ontwerp` scope class; the class is a build parameter),
  `components.scoped.css` (the component classes, descendant-scoped), and
  `effects.scoped.css` (lifecycle states, atmosphere, material, weather —
  descendant-scoped). All are generated from the same sources as the `:root`
  build and the zoo, so island adoption is import-only: apply `class="ontwerp"`
  to a subtree and delete any hand-maintained re-scoped copies.
- Distribution (`theming`): a boundary reset primitive, `.ontwerp-boundary`,
  ships inside both token CSS outputs. Applied to a descendant seam it re-points
  the font slots (`--font-sans`, `--font-heading`) to the consumer slot
  `--ontwerp-boundary-font` (neutral system stack by default) and pins
  `font-family`, `text-transform`, and `letter-spacing`, stopping the system's
  voice at the seam.
- Distribution (`theming`): skins apply through the reserved, dedupe-safe
  selector slot `.ontwerp[data-skin="<name>"]` (whole-app: `:root[data-skin]`).
  A second bare scope-class rule is not a supported override mechanism.
- Distribution (`type`): the bundle now ships an importable fonts CSS,
  `values/css/fonts.css` — one `@font-face` per shipped face with relative
  `src` urls resolving to the bundle's `fonts/`. Both it and the zoo's inlined
  rules are generated from one canonical face-definition file,
  `fonts/faces.json` (family, file, style, declared weight range, token
  binding, provenance), so they cannot drift. Wiring the fonts is now an
  import, not a hand-authored copy of zoo internals.
- Validation (fonts): two new gates run on every validate/build. Gate A —
  every `fontWeight` token must sit inside the declared weight range of the
  token-bound face in `faces.json`. Gate B — every face's declared range must
  be contained in the binary's real weight-axis coverage, read from the woff2
  itself at validation time (`fvar` wght axis for variable faces,
  `OS/2 usWeightClass` for statics; no recorded coverage is trusted).
- Recipes (`state.mark.static`, `component.tabs.segmented`): two chrome
  primitives ship with worked examples in the zoo, recipe metadata, and scoped
  CSS in `values/css/components.scoped.css`. The status mark is the static,
  non-animated answer to pass/fail/warn (pass = ripe-at-rest, fail = red
  confined to a rule of the destructive role, warn = quiet ink); the segmented
  control is square hairline cells sharing an ink rule with an instant,
  solid-ink selected state. Consumers reaching for pass/fail marks or a mode
  switcher use these instead of inventing one.
- Language (`theming`, `anti-goals`): the theming stance is now stated
  explicitly — light-only by design. Skins vary hue, never lightness polarity;
  there is no dark mode and none is owed. Consumers with their own `.dark`
  theme get two supported responses: keep this system's chrome light while
  their surfaces switch, or keep the system off those surfaces.
- Values (`values/shadcn/`): an optional ontwerp⇄shadcn variable crosswalk
  ships in root (`adapter.css`) and scoped (`adapter.scoped.css`) forms. It is
  a values-only layer: every shadcn semantic variable (background/foreground,
  card, popover, primary, secondary, muted, accent, destructive, border,
  input, ring, radius) maps onto an ontwerp semantic role, so skins cascade
  through it. The mapping's judgment calls (muted → quiet roles, ring → the
  dedicated focus-ring role rather than the accent, destructive keeps its own
  pigment, radius → square corners) are documented next to the declarations.
  No components, scripts, or dependencies ship with it; importing it beside
  the token CSS is the whole integration.
- Consumer documentation: the integration guide now covers three adoption
  cases end-to-end — whole-app (`values/css/tokens.css`), island (scoped
  imports, scope class on chrome roots only, never on an ancestor of a subtree
  that must stay neutral, `.ontwerp-boundary` at inner seams, fonts via
  `values/css/fonts.css`), and retrofit (honest per-component checklist:
  shadows→none, radius→0, palette utilities→semantic roles, font→Archivo,
  status glyphs→marks/states). It also carries the CSS-reset counter-rule
  (`.ontwerp button, .ontwerp select { text-transform: inherit }`) and testing
  guidance: assert roles and semantics, never palette utilities or glyphs.

### Changed
- Shipped CSS keyframes: **BREAKING** — every `@keyframes` name in shipped CSS
  (and in the zoo, which consumes the same sources) now carries the `ontwerp-`
  prefix, so shipped animations cannot collide with a consumer's keyframes in a
  shared document. Rename rule: `<name>` → `ontwerp-<name>`, applied to all 27
  keyframes:

  | old | new |
  | --- | --- |
  | `germinate` | `ontwerp-germinate` |
  | `ripen` | `ontwerp-ripen` |
  | `rise` | `ontwerp-rise` |
  | `bo` | `ontwerp-bo` |
  | `d1` | `ontwerp-d1` |
  | `d2` | `ontwerp-d2` |
  | `d3` | `ontwerp-d3` |
  | `wx-wind` | `ontwerp-wx-wind` |
  | `wx-rain` | `ontwerp-wx-rain` |
  | `wx-leaves` | `ontwerp-wx-leaves` |
  | `wx-drift` | `ontwerp-wx-drift` |
  | `wx-fireflies` | `ontwerp-wx-fireflies` |
  | `wx-snow` | `ontwerp-wx-snow` |
  | `wx-mist` | `ontwerp-wx-mist` |
  | `wx-sun` | `ontwerp-wx-sun` |
  | `drop-land` | `ontwerp-drop-land` |
  | `gust` | `ontwerp-gust` |
  | `bob` | `ontwerp-bob` |
  | `drop` | `ontwerp-drop` |
  | `splash` | `ontwerp-splash` |
  | `fleckfall` | `ontwerp-fleckfall` |
  | `drift` | `ontwerp-drift` |
  | `firefly-wander` | `ontwerp-firefly-wander` |
  | `firefly-blink` | `ontwerp-firefly-blink` |
  | `snowfall` | `ontwerp-snowfall` |
  | `haze-drift` | `ontwerp-haze-drift` |
  | `sunpool-breathe` | `ontwerp-sunpool-breathe` |

- Built values (Tailwind theme): **BREAKING** — every variable in
  `values/tailwind/theme.css` now carries the `ontwerp` namespace segment,
  inserted after the first path segment (`color.text.default` →
  `--color-ontwerp-text-default`), so importing the theme cannot silently
  redefine a consumer's own theme variables (`--font-sans`, the `--radius-*`
  scale, …) or the utilities derived from them. The rule is uniform — component
  tokens included — and alias `var()` references inside the theme point at the
  namespaced names. Utilities read as `bg-ontwerp-paper`, `font-ontwerp-sans`, ….
  Full rename table (all 137 variables):

  | old | new |
  | --- | --- |
  | `--button-text-default` | `--button-ontwerp-text-default` |
  | `--button-text-hover` | `--button-ontwerp-text-hover` |
  | `--button-surface-default` | `--button-ontwerp-surface-default` |
  | `--button-surface-hover` | `--button-ontwerp-surface-hover` |
  | `--button-border-default` | `--button-ontwerp-border-default` |
  | `--button-border-hover` | `--button-ontwerp-border-hover` |
  | `--button-radius` | `--button-ontwerp-radius` |
  | `--button-padding-block` | `--button-ontwerp-padding-block` |
  | `--button-padding-inline` | `--button-ontwerp-padding-inline` |
  | `--button-typography` | `--button-ontwerp-typography` |
  | `--field-text` | `--field-ontwerp-text` |
  | `--field-placeholder` | `--field-ontwerp-placeholder` |
  | `--field-surface` | `--field-ontwerp-surface` |
  | `--field-border-default` | `--field-ontwerp-border-default` |
  | `--field-border-focus` | `--field-ontwerp-border-focus` |
  | `--field-radius` | `--field-ontwerp-radius` |
  | `--field-padding-block` | `--field-ontwerp-padding-block` |
  | `--field-padding-inline` | `--field-ontwerp-padding-inline` |
  | `--field-typography` | `--field-ontwerp-typography` |
  | `--selection-accent` | `--selection-ontwerp-accent` |
  | `--selection-text` | `--selection-ontwerp-text` |
  | `--card-surface` | `--card-ontwerp-surface` |
  | `--card-text` | `--card-ontwerp-text` |
  | `--card-border` | `--card-ontwerp-border` |
  | `--card-radius` | `--card-ontwerp-radius` |
  | `--card-padding` | `--card-ontwerp-padding` |
  | `--card-typography` | `--card-ontwerp-typography` |
  | `--badge-text` | `--badge-ontwerp-text` |
  | `--badge-surface` | `--badge-ontwerp-surface` |
  | `--badge-border` | `--badge-ontwerp-border` |
  | `--badge-radius` | `--badge-ontwerp-radius` |
  | `--badge-padding-block` | `--badge-ontwerp-padding-block` |
  | `--badge-padding-inline` | `--badge-ontwerp-padding-inline` |
  | `--badge-typography` | `--badge-ontwerp-typography` |
  | `--alert-surface` | `--alert-ontwerp-surface` |
  | `--alert-text` | `--alert-ontwerp-text` |
  | `--alert-border` | `--alert-ontwerp-border` |
  | `--alert-radius` | `--alert-ontwerp-radius` |
  | `--alert-padding` | `--alert-ontwerp-padding` |
  | `--link-text-default` | `--link-ontwerp-text-default` |
  | `--link-text-hover` | `--link-ontwerp-text-hover` |
  | `--link-underline-default` | `--link-ontwerp-underline-default` |
  | `--link-underline-hover` | `--link-ontwerp-underline-hover` |
  | `--color-paper` | `--color-ontwerp-paper` |
  | `--color-paper-warm` | `--color-ontwerp-paper-warm` |
  | `--color-paper-deep` | `--color-ontwerp-paper-deep` |
  | `--color-ink` | `--color-ontwerp-ink` |
  | `--color-ink-soft` | `--color-ontwerp-ink-soft` |
  | `--color-ink-quiet` | `--color-ontwerp-ink-quiet` |
  | `--color-ink-faint` | `--color-ontwerp-ink-faint` |
  | `--color-red` | `--color-ontwerp-red` |
  | `--color-red-soft` | `--color-ontwerp-red-soft` |
  | `--color-amber` | `--color-ontwerp-amber` |
  | `--color-cream-bloom` | `--color-ontwerp-cream-bloom` |
  | `--color-ink-a25` | `--color-ontwerp-ink-a25` |
  | `--color-ink-a65` | `--color-ontwerp-ink-a65` |
  | `--color-ink-a95` | `--color-ontwerp-ink-a95` |
  | `--color-red-a85` | `--color-ontwerp-red-a85` |
  | `--color-cream-bloom-a55` | `--color-ontwerp-cream-bloom-a55` |
  | `--color-cream-bloom-a85` | `--color-ontwerp-cream-bloom-a85` |
  | `--color-amber-a55` | `--color-ontwerp-amber-a55` |
  | `--color-amber-a18` | `--color-ontwerp-amber-a18` |
  | `--color-surface-page` | `--color-ontwerp-surface-page` |
  | `--color-surface-warm` | `--color-ontwerp-surface-warm` |
  | `--color-surface-deep` | `--color-ontwerp-surface-deep` |
  | `--color-surface-claim` | `--color-ontwerp-surface-claim` |
  | `--color-surface-claim-hover` | `--color-ontwerp-surface-claim-hover` |
  | `--color-surface-ink` | `--color-ontwerp-surface-ink` |
  | `--color-text-default` | `--color-ontwerp-text-default` |
  | `--color-text-soft` | `--color-ontwerp-text-soft` |
  | `--color-text-quiet` | `--color-ontwerp-text-quiet` |
  | `--color-text-faint` | `--color-ontwerp-text-faint` |
  | `--color-text-on-ink` | `--color-ontwerp-text-on-ink` |
  | `--color-accent-base` | `--color-ontwerp-accent-base` |
  | `--color-accent-soft` | `--color-ontwerp-accent-soft` |
  | `--color-border-default` | `--color-ontwerp-border-default` |
  | `--color-border-quiet` | `--color-ontwerp-border-quiet` |
  | `--color-border-strong` | `--color-ontwerp-border-strong` |
  | `--color-border-accent` | `--color-ontwerp-border-accent` |
  | `--space-xs` | `--space-ontwerp-xs` |
  | `--space-sm` | `--space-ontwerp-sm` |
  | `--space-md` | `--space-ontwerp-md` |
  | `--space-lg` | `--space-ontwerp-lg` |
  | `--space-xl` | `--space-ontwerp-xl` |
  | `--space-2xl` | `--space-ontwerp-2xl` |
  | `--space-inset` | `--space-ontwerp-inset` |
  | `--space-inline-gap` | `--space-ontwerp-inline-gap` |
  | `--space-control-block` | `--space-ontwerp-control-block` |
  | `--space-control-inline` | `--space-ontwerp-control-inline` |
  | `--space-badge-block` | `--space-ontwerp-badge-block` |
  | `--space-badge-inline` | `--space-ontwerp-badge-inline` |
  | `--radius-0` | `--radius-ontwerp-0` |
  | `--radius-1` | `--radius-ontwerp-1` |
  | `--radius-2` | `--radius-ontwerp-2` |
  | `--radius-none` | `--radius-ontwerp-none` |
  | `--radius-chip` | `--radius-ontwerp-chip` |
  | `--radius-chip-max` | `--radius-ontwerp-chip-max` |
  | `--size-hairline` | `--size-ontwerp-hairline` |
  | `--size-dot` | `--size-ontwerp-dot` |
  | `--size-tick` | `--size-ontwerp-tick` |
  | `--size-cell-min` | `--size-ontwerp-cell-min` |
  | `--size-page-inset` | `--size-ontwerp-page-inset` |
  | `--size-page-left` | `--size-ontwerp-page-left` |
  | `--size-margin-rule-x` | `--size-ontwerp-margin-rule-x` |
  | `--blur-bloom` | `--blur-ontwerp-bloom` |
  | `--blur-cursor` | `--blur-ontwerp-cursor` |
  | `--font-sans` | `--font-ontwerp-sans` |
  | `--font-mono` | `--font-ontwerp-mono` |
  | `--weight-regular` | `--weight-ontwerp-regular` |
  | `--weight-medium` | `--weight-ontwerp-medium` |
  | `--weight-semibold` | `--weight-ontwerp-semibold` |
  | `--weight-bold` | `--weight-ontwerp-bold` |
  | `--duration-bloom` | `--duration-ontwerp-bloom` |
  | `--duration-ui-fast` | `--duration-ontwerp-ui-fast` |
  | `--duration-ui` | `--duration-ontwerp-ui` |
  | `--duration-ui-slow` | `--duration-ontwerp-ui-slow` |
  | `--duration-breathe-min` | `--duration-ontwerp-breathe-min` |
  | `--duration-breathe-max` | `--duration-ontwerp-breathe-max` |
  | `--duration-drift-1` | `--duration-ontwerp-drift-1` |
  | `--duration-drift-2` | `--duration-ontwerp-drift-2` |
  | `--duration-drift-3` | `--duration-ontwerp-drift-3` |
  | `--easing-paper` | `--easing-ontwerp-paper` |
  | `--opacity-muted` | `--opacity-ontwerp-muted` |
  | `--motion-duration-bloom` | `--motion-ontwerp-duration-bloom` |
  | `--motion-duration-hover` | `--motion-ontwerp-duration-hover` |
  | `--motion-duration-transition` | `--motion-ontwerp-duration-transition` |
  | `--motion-easing-standard` | `--motion-ontwerp-easing-standard` |
  | `--typography-display` | `--typography-ontwerp-display` |
  | `--typography-heading-xl` | `--typography-ontwerp-heading-xl` |
  | `--typography-heading-lg` | `--typography-ontwerp-heading-lg` |
  | `--typography-heading-md` | `--typography-ontwerp-heading-md` |
  | `--typography-heading-sm` | `--typography-ontwerp-heading-sm` |
  | `--typography-body` | `--typography-ontwerp-body` |
  | `--typography-body-lg` | `--typography-ontwerp-body-lg` |
  | `--typography-body-sm` | `--typography-ontwerp-body-sm` |
  | `--typography-mark` | `--typography-ontwerp-mark` |
  | `--typography-label` | `--typography-ontwerp-label` |

- Built values (CSS custom properties, Tailwind theme): **BREAKING** — the CSS
  variable outputs (`values/css/tokens.css`, `values/tailwind/theme.css`) now keep
  alias chains live instead of flattening them. A token whose source value is an
  alias is emitted as `var(--<target-name>)` (e.g.
  `--button-border-default: var(--color-border-strong)`); only raw-valued
  (primitive-tier) tokens carry literals. Every reference resolves within the same
  file. Overriding a colour role on the token scope root now reskins everything
  downstream of it, with no consumer-side re-linking. Known caveat: Tailwind
  opacity-modifier utilities compose over the variable via `color-mix()`, which
  tolerates `var()` values.
- Built values (token manifest): additive — each aliased entry in
  `values/manifest/tokens.json` now carries `chain`, the ordered dot-paths from its
  immediate reference down to the token holding the raw value, alongside the
  existing resolved `value` and immediate `ref`. JS/TS output is unchanged (fully
  resolved literals).
- `theming` / `theme.recipes.json`: the zoo's theming demo reskins through the
  built alias-preserving CSS alone — its hand-maintained component-var re-link
  block is gone, and skin overrides land on `:root` (the token scope root).
- `components` / `component.button.ink-press`: the button halftone dot screen is
  token-driven (`var(--color-ink)` instead of a hardcoded ink literal), so it
  participates in a reskin.
- Shipped fonts (`type`): `fonts/archivo-latin.woff2` is replaced with a latin
  variable instance genuinely covering weights **400–700** (previously declared
  `500 700`; the public token `--weight-regular: 400` promised a weight the
  declaration excluded, so 400 text faux-synthesized — S9). The `@font-face`
  range widens from `500 700` to `400 700`. `fonts/caveat-latin.woff2` is
  likewise replaced with a variable instance genuinely covering 500–700 (the
  previous binary was a static 500 face declared — and used at — up to 700).
  Same upstream versions (Archivo 2.001, Caveat 2.000), same glyph sets;
  provenance recorded in `fonts/faces.json`.
- `type` language: `language/type.md` now documents the face coverage
  (Archivo 400–700), the fonts.css wiring path, and scope-safe font
  application — the voice is set on the consumer's scope root, never on
  `html`/`body`, with `.ontwerp-boundary` as the escape hatch for neutral
  descendant subtrees.
- `type` language: **BREAKING** — the mono-uppercase utility mark is now
  explicitly reserved for data: numerals, counts, measurements, machine
  identifiers, and coded events. Prose labels, subtitles, section headers,
  taxonomy tags, and eyebrows are NOT utility marks; they render in the
  Archivo lowercase voice. Mono-uppercase applied to prose was always outside
  the system's intent and is now ruled out normatively.

- `typography.display`, `typography.heading-xl`, `typography.heading-lg`: the fluid
  ranges these tokens described in prose are now carried in the values themselves —
  `clamp(72px, 11vw, 168px)`, `clamp(48px, 6vw, 88px)` and `clamp(28px, 3vw, 40px)`.
  Each previously shipped only its ceiling, so display and heading type never scaled
  down and narrow viewports overflowed horizontally. The CSS `font` shorthand carries
  the clamp, so `--typography-*` is fluid everywhere it is consumed; rendering at or
  above the ceiling width is unchanged.
- `component.button.ink-press`, `components` language: the keyboard focus indicator
  now ships with the component. `.btn:focus-visible` draws a 2px outline in the
  focus-ring role, offset off the edge, from `values/css/components.scoped.css`. It
  previously lived only in the showcase's page reset, which is not part of the bundle,
  so a consumer importing the component CSS received a button with no focus indicator
  while the zoo demonstrated one. Bare `<a>`/`<button>` focus is unchanged and stays
  the host page's responsibility: the scoped bundle styles only class-rooted selectors.

**Propagation:** consumers that parsed literal values out of
`values/css/tokens.css` or `values/tailwind/theme.css` must read
`values/manifest/tokens.json` or `values/js/tokens.js` instead — those stay fully
resolved. Skin/theme overrides must target the token scope root (the element that
carries the token declarations, `:root` for the baseline build): a custom
property's `var()` resolves where the property is declared, so overrides on a
descendant element no longer re-link the chain. Consumers who hand-wrote a focus
style for `.btn`, or who re-declared display/heading sizes to get responsive type,
should delete those local copies: both now ship. Anything that pinned a literal
`168px`/`88px`/`40px` off `--typography-*` should re-measure — those values are now
the ceilings of a clamp, not constants.

Scoped distribution: island consumers should delete hand-maintained re-scoped
copies of the tokens/components/effects CSS and import
`values/css/tokens.scoped.css` + `components.scoped.css` + `effects.scoped.css`
instead, with `class="ontwerp"` on the island root. Any consumer CSS or JS that
names a shipped keyframe must adopt the `ontwerp-` prefixed names (table above).
Tailwind consumers must rename every `@theme`-derived utility/variable to the
`ontwerp`-namespaced form (table above) — e.g. `bg-paper` → `bg-ontwerp-paper`;
your own `--font-sans` / `--radius-*` definitions are no longer shadowed. Skins
must target `.ontwerp[data-skin="<name>"]` (or `:root[data-skin]` whole-app);
a second bare scope-class rule is not a supported override mechanism.

Fonts: consumers that hand-authored `@font-face` rules for the shipped faces
should delete them and import `values/css/fonts.css` from its shipped location
instead (relative urls resolve to the bundle's `fonts/`). Text at
`--weight-regular` (400) in Archivo was previously faux-synthesized and now
renders the true face — re-check any UI tuned around the synthesized rendering.
Apply the voice at the scope root per `language/type.md`, never on `html`/`body`.

New chrome primitives, theming stance, adapter, and guide: consumers should
replace invented pass/fail glyphs and mode switchers with `state.mark.static`
and `component.tabs.segmented`; read the light-only stance before planning any
dark palette; shadcn-shaped chrome imports `values/shadcn/adapter.css` beside
the token CSS instead of hand-authoring a crosswalk; and re-read the bundle's
`AGENTS.md` → "Adopting the system" — it now documents all three adoption
modes, the Preflight counter-rule, and role-based testing guidance. Any label,
subtitle, or eyebrow styled in mono-uppercase must move to the Archivo
lowercase voice (BREAKING note above); mono-uppercase remains correct only on
data — numerals, counts, machine identifiers, coded events.

## 0.1.1 — 2026-06-27

### Changed
- Distribution contract: the consumer pin-file location moved from
  `.design/DESIGN.md` to `docs/DESIGN.md`. Updated `templates/DESIGN.md`,
  `templates/consumer-README.md`, and the repo's integration guide (`README.md`).
  No recipe, language, or value tokens changed.

**Propagation:** existing consumers should move their pin file from
`.design/DESIGN.md` to `docs/DESIGN.md` and update any references to it in their
own `AGENTS.md` / `CLAUDE.md`. New consumers: copy `templates/DESIGN.md` to
`docs/DESIGN.md` instead of `.design/`.

## 0.1.0 — 2026-06-02

Initial release — the full accepted design language and its worked example (the zoo).

### Added
- Language: `principles`, `atmosphere`, `material`, `motion`, `colour`, `type`,
  `components`, `states`, `theming`, `anti-goals`.
- Recipes: `atmosphere.grid.breathing`, `material.surface.paper-grain`,
  `material.pigment.multiply-blot`, `motion.clock.stepped`, `motion.weather.wind`,
  `motion.weather.rain`, `state.loading.germinating`, `state.done.ripe`,
  `component.button.ink-press`, and the theme recipes.
- Built values (CSS custom properties, JS/TS, Tailwind theme, token manifest) and
  embedded fonts.

**Propagation:** first release — adopt the surface you need and record what you
adopt, adapt, or omit in your pin file (`DESIGN.md`).

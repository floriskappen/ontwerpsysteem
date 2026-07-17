# Tasks — add-scoped-css-distribution

## 1. Namespace keyframes at the source (single source of truth)

- [x] 1.1 Rename every `@keyframes` in `design-system/source/zoo/styles/` to carry the `ontwerp-` prefix: `states.css` (`germinate`, `ripen`, `rise`), `atmosphere.css` (`bo`, `d1`–`d3`), `weather.css` (`wx-*`, `drop-land`, `gust`, `bob`, `drop`, `splash`, `fleckfall`, `drift`, `firefly-wander`, `firefly-blink`, `snowfall`, `haze-drift`, `sunpool-breathe`)
- [x] 1.2 Update every `animation`/`animation-name` reference to the renamed keyframes across the zoo styles (including `responsive.css` if it names keyframes) and verify no inline styles in `sections/`/`effects/` reference keyframe names
  > Note: `responsive.css` names no keyframes (only `animation: none`), and no inline styles in `sections/`/`effects/` reference keyframe names (verified by grep) — no changes needed there.
- [x] 1.3 Rebuild and check the zoo against `design-system/reference/accepted-zoo/generated/index.html` — behaviourally identical, only keyframe identifiers differ
  > Note: checked structurally — `test/zoo-parity.test.mjs` now compares keyframe identifiers modulo the `ontwerp-` prefix (all other selectors byte-compared as before) and passes; the visual render is judged by the human per repo rule (no agent screenshots).

## 2. Scoped token CSS output

- [x] 2.1 Add a `scopeClass` parameter to `runBuild` in `scripts/lib/build-core.mjs` (default `.ontwerp`) and emit a second `css/variables` file `dist/css/tokens.scoped.css` with the scope class as its selector, from the same Style Dictionary run
- [x] 2.2 Append the `.ontwerp-boundary` primitive to both token CSS outputs: re-point `--font-sans`/`--font-heading` to `var(--ontwerp-boundary-font, <system stack>)` and pin `font-family`, `text-transform`, `letter-spacing` (see design decision 6)
  > Note: the current token set declares no `--font-heading` token yet (that arrives with `fix-font-shipping-and-weights`); the boundary still re-points the `--font-heading` slot as specced, so it is already correct when that change lands. The boundary class/slot derive from the scope class (`.acme` build → `.acme-boundary` / `--acme-boundary-font`); the default build matches the spec names exactly.

## 3. Scoped component and effects CSS outputs

- [x] 3.1 Add a build step that generates `dist/css/components.scoped.css` (from `components.css`) and `dist/css/effects.scoped.css` (from `states.css` + `atmosphere.css` + `material.css` + `weather.css`) by descendant-prefixing every selector with the scope class
  > Note: `atmosphere.css` carried one non-class rule, the page-level `body::before` grain. It was moved to `base.css` (zoo-only page styling, per design decision 3: base styles the page, not the system) so the shipped source is fully class-rooted; panel-level grain still ships via `material.css`. The zoo output is unchanged apart from rule ordering (both files concatenate into the same page). Effects sources are bundled in the zoo's own cascade order (atmosphere, material, states, weather).
- [x] 3.2 Make the scoping step fail the build on any selector it cannot confidently scope (non-class top-level selectors), rather than passing it through bare
  > Note: `scopeCss()` throws on any non-class-rooted selector, any unknown at-rule, and nested rules. `@keyframes`/`@property`/`@font-face` pass through (document-global by nature; keyframes are namespaced at source), `@media`/`@supports` recurse.
- [x] 3.3 Confirm the zoo build still reads the same source files unchanged (zoo keeps its own compilation path; only the shipped bundles are scoped)
  > Note: the zoo still concatenates the raw style sources via `renderShowcase`; a `stylesDir` parameter (defaulting to the repo styles) was threaded through `runBuild` → `renderShowcase` so tests can point one build at an edited copy and watch it land on both surfaces.

## 4. Tailwind theme namespacing (BREAKING)

- [x] 4.1 Register a name transform for the Tailwind platform in `build-core.mjs` inserting the `ontwerp` segment after the first path segment (`color.text.muted` → `--color-ontwerp-text-muted`)
- [x] 4.2 Record the full old-name → new-name rename table (Tailwind variables and keyframes) in the repo so the next release's changelog entry can carry it, marked **BREAKING** per `change-propagation.md`
  > Note: recorded in `CHANGELOG.md` under Unreleased — full tables (27 keyframes, 137 Tailwind variables), both marked **BREAKING**, with the propagation note extended. `npm run release` was NOT run.

## 5. Skin-override slot and consumer documentation

- [x] 5.1 Document the `.ontwerp[data-skin="<name>"]` skin slot (and the whole-app attribute form) plus the scoped-adoption import list and `.ontwerp-boundary` usage in `design-system/templates/consumer-AGENTS.md` / `consumer-README.md`, stating that a second bare scope-class rule is not a supported override mechanism
- [x] 5.2 Verify `assembleBundle` carries the new `dist/css/` files into `dist/release/values/css/` (existing directory copy) and the bundle docs name them
  > Note: the existing whole-directory copy carries them; verified under test (`bundle ships scope-aware css targets`). Both consumer templates name the files.

## 6. Validation — named checks per scenario

- [x] 6.1 `test/build-pipeline.test.mjs` — "scoped token css is emitted": `tokens.scoped.css` exists, selector is `.ontwerp`, declares a property per token (spec: build-pipeline / Scenario: Scoped token CSS is emitted)
- [x] 6.2 `test/build-pipeline.test.mjs` — "scope class is a build parameter": `runBuild({ scopeClass })` into a temp dir emits that selector; default emits `.ontwerp` (Scenario: Scope class is a build parameter)
- [x] 6.3 `test/build-pipeline.test.mjs` — "scoped and root token outputs cannot drift": declaration sets of `tokens.css` and `tokens.scoped.css` are identical modulo selector (Scenario: Scoped and root token outputs cannot drift)
- [x] 6.4 `test/build-pipeline.test.mjs` — "scoped bundles regenerate from zoo style sources": build into a temp dir with a sentinel rule added to a style source; sentinel appears scoped in the emitted bundle (Scenario: Scoped bundles are emitted from the showcase's style sources)
- [x] 6.5 `test/build-pipeline.test.mjs` — "every rule is confined to the scope": parse both scoped bundles; every rule's selectors start with the scope class (Scenario: Every rule is confined to the scope)
- [x] 6.6 `test/build-pipeline.test.mjs` — "all keyframes carry the namespace": scan all shipped CSS; every `@keyframes` name begins `ontwerp-` and every `animation(-name)` reference resolves to a declared prefixed keyframe (Scenario: All keyframes carry the namespace)
- [x] 6.7 `test/build-pipeline.test.mjs` — "tailwind names carry the ontwerp segment": every `theme.css` variable matches `--<ns>-ontwerp-…`, none unnamespaced; extend the name-derivation test for the `color.text.muted` → `--color-ontwerp-text-muted` mapping (Scenarios: Stable name derivation; Tailwind theme is emitted with namespaced variables)
  > Note: no `color.text.muted` token exists in the real set, so the derivation test asserts the rule on the real `color.text.default` (→ `--color-ontwerp-text-default`), on the spec's example path shape via the mapping function (`color.text.muted` → `color-ontwerp-text-muted`), and on every token in the manifest. The pre-existing alias/raw-literal theme assertions were updated to look up the namespaced names (with alias `var()` refs required to point at namespaced targets, keeping the artifact self-contained).
- [x] 6.8 `test/distribution.test.mjs` — "bundle ships scope-aware css targets": `dist/release/values/css/` contains root tokens, scoped tokens, scoped components, scoped effects; root file keeps `:root` (Scenarios: Island adoption is import-only; Whole-app adoption needs no scope class)
- [x] 6.9 `test/distribution.test.mjs` — "boundary primitive ships and re-points the voice": both token CSS outputs contain `.ontwerp-boundary` re-pointing `--font-sans`/`--font-heading` to `var(--ontwerp-boundary-font, …)` and pinning the three inherited voice properties (Scenarios: Boundary neutralises the inherited voice; Consumer re-points the boundary font)
- [x] 6.10 `test/distribution.test.mjs` — "skin slot is documented and dedupe-safe by shape": consumer docs in the bundle name `.ontwerp[data-skin=` and its selector differs from the base token block's selector (Scenarios: Skin override survives same-selector deduplication; The slot is documented)
- [x] 6.11 `test/showcase.test.mjs` — "showcase consumes the shipped keyframe names": every `@keyframes` in the generated zoo HTML is `ontwerp-`-prefixed and each name also appears in `effects.scoped.css`/`components.scoped.css` (Scenario: Showcase and shipped bundles share one set of keyframe names)
- [x] 6.12 `test/showcase.test.mjs` — "a keyframe edit propagates to both surfaces": temp-dir build with an edited keyframe shows the edit in both the zoo HTML and the effects bundle (Scenario: A keyframe edit propagates to both surfaces)
- [x] 6.13 Full gate: `npm run validate`, `npm run build`, `npm test` all pass; `openspec validate add-scoped-css-distribution` passes
  > Note: validate ✓, build ✓, tests 56/56 across 7 files ✓ (44 pre-existing kept green, 12 added), `openspec validate add-scoped-css-distribution --strict` ✓.

## 7. Consumer proof (done-when)

- [x] 7.1 Dry-run the island path against the built release bundle: an example page `@import`s scoped tokens + components + effects, applies `.ontwerp` to one subtree, and renders the system inside it and nothing outside it — confirming a consumer can delete hand-maintained re-scoped copies
  > Note: dry-run executed against `dist/release/values/css/` (page + copied bundle in the session scratchpad `island-dry-run/`): all three `@import`s resolve to shipped files; all 109 style rules across the imports are confined to `.ontwerp` (27 namespaced keyframes, no dangling animation refs); `--button-border-default`, `--color-surface-page`, `--color-text-default` resolve fully inside the island's own imports. The in-browser render is left to the human per repo rule (no agent screenshots).

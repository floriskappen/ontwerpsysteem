# Fix font shipping and weights

## Why

The shipped Archivo face covers `font-weight` 500–700 while the token layer defines `--weight-regular: 400` — a public token that promises a weight the font cannot render, so 400 text synthesizes a faux weight (S9). And the `@font-face` rules exist only base64-inlined inside the zoo HTML: a consumer gets raw woff2 files in `fonts/` but no importable CSS to wire them, and no guidance that font application is a scoped concern — the voice cascades into subtrees that must stay neutral (S5). Decided (roadmap D2): ship the face, don't retire the token.

## What Changes

- Replace the shipped Archivo woff2 with a latin variable instance genuinely covering weights 400–700; the `@font-face` weight-range declaration matches the real face coverage.
- Emit the `@font-face` rules as a standalone built output `values/css/fonts.css` (src paths relative to the bundle's `fonts/`), generated from the same single source of truth the zoo inlines — no drift between the two.
- Add a validation gate: a `fontWeight` token outside the shipped face's declared weight range fails validation, and the declared range is checked against the actual face coverage.
- Verify Caveat ships end-to-end: `@font-face` and usage survive into the consumer bundle, consistent with `language/type.md`.
- Document font application as a scoped concern in the type language: the voice is set on the scope root, never `html`/`body`; the `.ontwerp-boundary` escape hatch (owned by `add-scoped-css-distribution`) is referenced, not specced here.

All additive: a new build output, a widened face, a new validation gate, and docs. No token names, tiers, or output names change. The `@font-face` weight range widens from `500 700` to `400 700`, which only makes previously-synthesized renderings correct.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `build-pipeline`: new built output — a standalone fonts CSS file carrying the `@font-face` declarations, generated from the same font-source definition as the zoo's inlined copy.
- `distribution`: the bundle's fonts contract — shipped faces, an importable fonts CSS, and weight coverage that satisfies every `fontWeight` token.
- `propagation-validation`: new cross-layer gate — `fontWeight` tokens must fall inside the shipped face's weight range; the declared `@font-face` range must match the real face.
- `design-language`: the type language documents scope-safe font application.

## Impact

- `assets/fonts/archivo-latin.woff2` (replaced with a 400–700 variable instance), `scripts/lib/build-core.mjs` (`fontCss()` becomes shared source for both zoo inlining and the new `values/css/fonts.css`), `scripts/lib/validate-core.mjs` (weight-range gate), `design-system/language/type.md`, `design-system/dist/release/` bundle contents.
- Coordinates with the parallel `add-scoped-css-distribution` change, which owns `.ontwerp-boundary` and scoping machinery — this change only references it.

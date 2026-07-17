# Design — keep-token-aliases-live-in-css

## Context

Style Dictionary is configured with `outputReferences: false` on both `css/variables` targets (`scripts/lib/build-core.mjs`), so every alias flattens to a literal. The zoo compensates with a ~20-line `var()` re-link block on `body` in `source/zoo/styles/base.css`, and its theme bar overrides colour roles via `body:has(#th-…:checked)` — the re-link and the overrides share the `body` element, which is the only reason the demo cascades. The button halftone hardcodes `rgb(31 27 22)` (`components.css`). The manifest already records the *immediate* alias (`ref`), not the chain.

## Goals / Non-Goals

**Goals:** alias chains live in every CSS variable output; manifest carries the full chain; zoo reskins through the built output alone; halftone tokenised.

**Non-Goals:** scoped build targets, keyframe/Tailwind namespacing (`add-scoped-css-distribution`); new semantic roles or derivation rules (`complete-the-colour-role-contract`); skin file format (`ship-skins-as-complete-role-sets`); changing JS/ESM output shape.

## Decisions

1. **Flip `outputReferences: true` on both `css/variables` targets** rather than writing a custom CSS format. SD substitutes `var(--derived-name)` whenever the original `$value` is a pure `{ref}` alias — which is every alias in this repo, since the tier rules forbid partial/embedded refs at the component and semantic tiers for colour. Alternative (custom formatter walking `original.$value`) rejected: more code to own for the same output. Caveat to verify in tests: SD falls back to the resolved literal when a *transform* has changed a referenced value (`outputReferencesTransformed`); composite `typography` tokens go through the shorthand transform, so a component alias like `button.typography → {typography.label}` may emit resolved. That is acceptable — the reskin contract this change carries is about colour-carrying chains; the output-assertion test pins colour aliases exactly and only smoke-checks the rest.

2. **Cascade mechanics are a documented constraint, not something the build can fix.** `var()` inside a custom property resolves on the element where the property is *declared*; the computed value inherits. So role overrides re-link the chain only when they land on the same element that carries the token declarations (`:root` for the baseline build; the scope element for future scoped builds). Consequence for the zoo: the theme-bar skin rules move from `body:has(…)` to `:root:has(…)` when the `body` re-link block is deleted. Consequence for consumers: skins target the token scope root — which is already the S11-safe shape `add-scoped-css-distribution` documents.

3. **Manifest gains `chain`, keeps `ref`.** `ref` (immediate hop) is already consumed; removing it would be a second break for no gain. `chain` is an ordered array of dot-paths from the token's first reference down to the token holding the raw value (e.g. `["color.border.strong", "color.ink-a95"]`), computed by walking `original.$value` through the token map. Additive, deterministic.

4. **Halftone reads `var(--color-ink)`** (the primitive the current literal equals) rather than a new component token. Introducing `button.halftone` is content design that belongs with `complete-the-colour-role-contract` / skin work; referencing the existing custom property is the minimal change that makes the dot screen reskin. The zoo may later re-point it when a proper role exists.

5. **Tailwind theme also preserves references.** `@theme` variables are emitted to `:root` by Tailwind v4, and utilities reference them with `var()`, so runtime aliasing holds there too; flattening only the Tailwind output would reintroduce S10 for Tailwind consumers. Known caveat (record in changelog, not spec): opacity-modifier utilities compose via `color-mix()` over the variable, which tolerates `var()` values.

## Risks / Trade-offs

- [SD emits a literal where we expect `var()` (transform interaction)] → output-assertion test walks the manifest: every colour-typed token whose source is an alias must appear in both CSS outputs as `var()` to its target's derived name.
- [Zoo visual drift when the re-link block is removed] → computed values are identical by construction; verify against `design-system/reference/accepted-zoo/` baseline and exercise the theme bar in a browser check (all skins restyle buttons/fields/cards/badges/links and the halftone).
- [Consumers parsing literals out of `tokens.css` break] → **BREAKING** changelog entry with propagation note pointing at the manifest/JS output; ships inside the v1.0.0 break set.
- [A future token author embeds a ref inside a composite value and silently gets a literal] → the manifest `chain` makes flattening visible; the assertion test fails on colour tokens, the highest-value class.

## Migration Plan

Build-config flip + manifest format + zoo edits land together in one change; `npm run build` regenerates everything; no consumer action until release, where the changelog carries the BREAKING note and migration line ("read literals from `values/manifest/tokens.json` or `values/js/tokens.js`, not the CSS").

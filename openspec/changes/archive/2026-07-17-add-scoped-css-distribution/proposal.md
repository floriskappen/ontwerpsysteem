# Proposal: add-scoped-css-distribution

## Why

The distribution assumes whole-app, `:root`, no-reset adoption: tokens ship only as a `:root` block, the component/state/atmosphere/weather CSS is zoo-internal with bare global selectors and global keyframe names, and the Tailwind theme redefines bare names (`--font-sans`, `--radius-*`) in any Tailwind v4 consumer. A consumer that mounts the system as an island in a shared DOM (de-ontwerper, struggles S1/S6/S7/S8/S11/S12/S17/S22) must hand-copy and re-scope every layer and re-sync those copies on every pin advance. This change makes the scoped island the supported unit of distribution; whole-app stays the trivial special case.

## What Changes

This change touches the **build pipeline** (new CSS outputs, a scope-class parameter), the **distribution** contract (new bundle contents, boundary primitive, skin-override slot), and the **showcase** (the zoo consumes the same namespaced keyframes it ships). It touches build outputs consumers depend on — the highest-risk surface.

- **Scoped token build (additive):** the build also emits `values/css/tokens.scoped.css` — the same token set under a scope class (default `.ontwerp`, a build parameter) — alongside the existing `:root` build.
- **Scoped component/effects CSS (additive):** the zoo's `components.css`, `states.css`, `atmosphere.css`, `material.css`, `weather.css` become consumable, `.ontwerp`-scoped build outputs (component bundle + effects bundle) generated from the same source files the zoo uses.
- **Namespaced keyframes (BREAKING within shipped CSS):** every `@keyframes` name in shipped CSS gains the `ontwerp-` prefix (`ontwerp-germinate`, `ontwerp-gust`, `ontwerp-bo`, …); the zoo source consumes the namespaced names, so there is one source of truth and no drift.
- **Boundary primitive (additive):** ship `.ontwerp-boundary` — a reset class that stops the system at a descendant seam: re-points `--font-sans`/`--font-heading` to a consumer slot (`--ontwerp-boundary-font`, system-ui default) and pins the inherited voice properties (`font-family`, `text-transform`, `letter-spacing`).
- **Skin-override slot (additive):** the scoped build documents and reserves a skin-override selector shape (`.ontwerp[data-skin="…"]`) that aggressive CSS bundlers cannot dedupe away (Lightning CSS drops a second same-target custom-property rule).
- **Tailwind theme namespacing (BREAKING):** the Tailwind `@theme` output is namespaced (`--color-ontwerp-paper`, `--font-ontwerp-sans`, `--radius-ontwerp-*`) so it cannot silently redefine what `font-sans`/`rounded-md` mean in a consumer. Migration: MAJOR bump; the changelog entry carries the full old-name → new-name rename table.
- **No-drift guarantee:** a test asserts the scoped outputs are generated from the same source as the `:root` build and the zoo styles — a consumer's import can never lag the zoo.

Related parallel changes (kept out of scope here): `keep-token-aliases-live-in-css` (alias preservation in CSS outputs), `complete-the-colour-role-contract` (semantic roles), `fix-font-shipping-and-weights` (font faces and scoped font wiring).

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `build-pipeline`: new build outputs — scoped token CSS (scope class as a build parameter), scoped component and effects CSS bundles generated from the zoo style sources, keyframe namespacing applied to shipped CSS, and the namespaced Tailwind theme output.
- `distribution`: the consumer bundle contains the scoped CSS targets, the `.ontwerp-boundary` reset primitive, and the documented skin-override selector slot.
- `showcase`: the zoo consumes the namespaced keyframe names from the same style sources that produce the shipped bundles (single source of truth).

## Impact

- Code: `scripts/lib/build-core.mjs` (new CSS platform outputs, scope parameter, CSS scoping/namespacing step), `scripts/build.mjs`, `design-system/source/zoo/styles/*.css` (keyframe renames), `design-system/source/zoo/index.mjs` (unchanged flow, renamed animation references), tests.
- Build outputs: `dist/css/tokens.scoped.css`, scoped component + effects CSS files, renamed Tailwind theme variables — all flow into `dist/release/values/`.
- Consumers: Tailwind variable renames and keyframe renames are breaking (MAJOR); scoped outputs let consumers delete hand-maintained re-scoped copies.

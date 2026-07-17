# Keep Token Aliases Live in CSS

## Why

The build flattens every `component → semantic → primitive` alias chain to a literal in the CSS outputs (`outputReferences: false`), so overriding a semantic colour role at runtime reskins nothing downstream of it. The zoo papers over this by hand-re-linking ~20 component variables with `var()` in `base.css`; scoped consumers get no such re-link, so a skin that overrides only the semantic roles strands every component/border/on-ink token on the cream literals (struggle S10 — the root cause of partial-skin breakage in de-ontwerper). This is a Wave 1 foundation for `add-scoped-css-distribution` (scoped builds need live aliases to be reskinnable) and `ship-skins-as-complete-role-sets`.

## What Changes

- **BREAKING** — the build's CSS custom-property outputs preserve alias chains as `var()` references instead of flattening them: a token whose source `$value` is an alias emits `var(--<derived-name-of-target>)`. Literal values appear only where the source holds a raw value (the primitive tier, per the tier rules). Consumers who parsed literal values out of the CSS files must switch to the JS output or the manifest, which stay fully resolved.
- The token manifest additionally records the full alias chain per token (ordered references down to the primitive), not just the immediate reference. JS/ESM output is unchanged: resolved literals.
- The zoo's hand-maintained re-link block in `source/zoo/styles/base.css` is deleted — the built CSS now carries the same links, and the theme bar reskins via the built output.
- The zoo button halftone becomes token-driven (`radial-gradient(var(--color-ink) …)` instead of a hardcoded `rgb(31 27 22)`) so it participates in a reskin.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `build-pipeline`: the CSS custom-properties requirement changes from "values fully resolved" to "alias sources emit `var()` references that resolve within the file"; the manifest requirement gains the full alias chain per aliased token.
- `showcase`: the theming demo requirement now demands the reskin work through the built alias-preserving CSS (no showcase-side re-linking of built tokens), and component styling must draw colour from tokens rather than hardcoded colour literals.

## Impact

- **Build outputs (public contract, highest-risk surface):** `dist/css/tokens.css` and `dist/tailwind/theme.css` change shape (literals → `var()` chains). Token names and the JS output are untouched. Changelog entry marked **BREAKING** with a propagation note; semver MAJOR at the next release (folds into the v1.0.0 break set).
- **Code:** `scripts/lib/build-core.mjs` (output-references config, manifest format), `design-system/source/zoo/styles/base.css` (delete re-link block), `design-system/source/zoo/styles/components.css` (halftone), tests under `scripts`/`tests`.
- **Coordination:** sibling change `add-scoped-css-distribution` also touches `build-pipeline` (new scoped targets); this change stays scoped to alias preservation so the scoped targets inherit it. `complete-the-colour-role-contract` adds roles; no overlap in requirements.

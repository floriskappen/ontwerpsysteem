# Design — add-scoped-css-distribution

## Context

Every CSS surface currently ships as bare globals: `:root` tokens, a bare `@theme`, zoo-internal component/effect classes, global keyframe names. Scoped consumers (de-ontwerper, S1/S6–S8/S11/S12/S17/S22) hand-copy and re-scope all of it and re-sync on every pin advance. This change makes scoped builds first-class while keeping `:root` adoption the trivial special case. Parallel changes own alias preservation, colour roles, and fonts — this one stays on scoping, namespacing, the boundary, and bundle outputs.

## Goals / Non-Goals

**Goals:** scoped token/component/effects CSS as generated build outputs; namespaced keyframes with the zoo as first consumer; a shipped boundary reset; a dedupe-safe skin slot; a namespaced Tailwind theme; a no-drift guarantee under test.

**Non-Goals:** preserving `var()` alias chains in CSS outputs (`keep-token-aliases-live-in-css`); new semantic roles (`complete-the-colour-role-contract`); font files/wiring (`fix-font-shipping-and-weights`); skin *content* completeness (Change 6); reduced-motion frame relocation (Change 7); converting effects generators to data APIs (Change 5).

## Decisions

1. **Scoped outputs are build-generated transforms of one source, never parallel authored files.** The token block is emitted twice by Style Dictionary (selector `:root` / selector `.ontwerp`); component/effects bundles are produced by scoping the zoo's own style sources at build time. Alternative — maintaining `.scoped.css` sources by hand — recreates the consumer's drift problem inside the repo and was rejected outright.

2. **Scope class is a `runBuild` parameter, defaulting to `.ontwerp`.** The published bundle always carries the default; the parameter exists so a consumer forking the build can rebrand the scope. A per-import runtime mechanism (e.g. `:where()` + attribute) adds selector weight for no consumer we have.

3. **Component and effects bundles are scoped by descendant-prefixing class selectors.** The five shipped sources (`components.css`, `states.css`, `atmosphere.css`, `material.css`, `weather.css`) contain only class-based selectors, so `.btn` → `.ontwerp .btn` is a mechanical, verifiable rewrite. Zoo-only files (`base.css`, `type.css`, `themes.css`, `responsive.css`) stay internal — they style the page (`body`, `.sheet`), not the system. Two bundles (components vs effects) rather than five files: consumers adopt chrome and ambience independently; finer splits multiply imports without a use case.

4. **Keyframes are renamed in the source, not rewritten by the build.** The zoo sources declare `ontwerp-germinate`, `ontwerp-gust`, `ontwerp-bo`, … directly and the zoo consumes them. A build-time rename step would need to parse `animation` shorthands reliably and would leave two live name sets (source vs shipped) — exactly the drift S19/S22 complained about. One set of names everywhere.

5. **Tailwind namespace rule: insert `ontwerp` after the first path segment** (`color.text.muted` → `--color-ontwerp-text-muted`). Tailwind v4 derives utility meaning from the variable's leading namespace (`--color-*`, `--font-*`, `--radius-*`), so the prefix must stay first and the brand segment goes second (D1, S6). Prefixing the whole name (`--ontwerp-color-*`) would eject every token from its Tailwind namespace and kill utility generation. The rule applies **uniformly, including component tokens** (`--button-ontwerp-text-default`): `@theme` variables land on `:root`, so a bare `--button-*` could collide with a consumer's own variables exactly as `--font-sans` did (S6) — and the theme's guarantee is "importing cannot redefine *any* consumer variable", not just Tailwind utility namespaces. Cross-output name divergence is acceptable because the plain CSS build and the Tailwind theme are alternative consumption paths, never co-imported (that would double-declare every token). Breaking: the release changelog entry carries the full rename table. The plain CSS outputs stay unprefixed — they are confined by `:root`-vs-scope, not by naming.

6. **The boundary primitive ships inside both token CSS outputs.** `.ontwerp-boundary` re-points `--font-sans`/`--font-heading` to `var(--ontwerp-boundary-font, <system stack>)` because the in-scope token value is exactly the polluted value a boundary must escape (S17) — it needs a fresh slot, not a reference. It rides with the tokens (not the component bundle) since it bounds the voice the tokens establish, and whole-app consumers need it too; emitting it in both files means no extra import to forget.

7. **Skin slot = distinct attribute selector, documented, not enforced by machinery.** Lightning CSS dedupes a second same-selector custom-property rule (S11), so "layer a skin on top" silently dies in consumer pipelines. `.ontwerp[data-skin="…"]` differs from the base selector, so dedup can't merge it, and specificity keeps it winning. This change reserves and documents the shape; shipping complete skins in that shape is Change 6.

8. **No-drift is asserted structurally, not by convention.** A test compares the declaration sets of `tokens.css` and `tokens.scoped.css` (identical modulo selector) and asserts the scoped bundles are regenerated from the zoo style sources each build (a sentinel edit propagates). This is the guarantee that lets consumers delete their copies.

## Risks / Trade-offs

- [Descendant-prefixing misses a future non-class selector in a shipped source] → the scoping step fails the build on any selector it cannot confidently scope, rather than passing it through bare.
- [Keyframe + Tailwind renames break existing pinned consumers on advance] → MAJOR bump; rename tables in the changelog; de-ontwerper already uses the namespaced keyframe names, so its migration is deletion.
- [Custom properties still inherit past the scope root into excluded subtrees] → accepted; the boundary pins the *voice* (the observable leak), and colour custom properties inheriting is harmless until a descendant consumes them. Documented, not fought.
- [Two token CSS files double the surface to keep in sync] → both come from one Style Dictionary run over one source; the no-drift test makes divergence a build failure.

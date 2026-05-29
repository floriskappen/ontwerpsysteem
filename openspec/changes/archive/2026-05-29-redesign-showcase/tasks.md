## 1. Rework the showcase generator (capability: showcase)

- [x] 1.1 Rewrite `scripts/lib/showcase-core.mjs` to render a curated, paper-themed page (masthead, palette, type specimen, components in use) styled through the system's own `var(--…)` tokens.
- [x] 1.2 Curate the palette from the manifest — solid primitive colours only, deduped; rgba rule/bloom variants left off the page.
- [x] 1.3 Show components in use with real `:hover` / `:focus` (buttons invert, fields go red on focus); remove the interaction-state matrix and the tier galleries.
- [x] 1.4 Honour the system's aesthetic: explicit cream surface (no `color-scheme` reliance), global square-corner reset, the a–l rooster axis, red margin rule, grain + bloom atmosphere.
- [x] 1.5 Add an explicit `:focus-visible` indicator so interactive components show visible focus.

## 2. Self-host fonts

- [x] 2.1 Commit Archivo + JetBrains Mono latin woff2 under `assets/fonts/`.
- [x] 2.2 Base64-inline them as `@font-face` at build time in `runBuild`, keeping the page a single self-contained file with no network requests.

## 3. Tests & verification

- [x] 3.1 Replace the showcase tests with ones for the new design: paper theme (no `color-scheme`, square reset), curated palette (primitives only, deduped), no tier/state-matrix/token-dump, components present, fonts inlined, self-contained, deterministic.
- [x] 3.2 Fix the unrelated stable-name-derivation test to a token that exists post content-port.
- [x] 3.3 `npm run validate && npm run build && npm test` green; showcase regenerates deterministically and stays git-ignored.

## 4. Reconcile spec

- [x] 4.1 MODIFY/REMOVE/ADD the `showcase` capability requirements to match the built reality; keep "renders only from built outputs" unchanged.
- [x] 4.2 `npx openspec validate redesign-showcase` passes.

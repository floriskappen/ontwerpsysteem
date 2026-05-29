## 1. Token manifest output (capability: build-pipeline)

- [x] 1.1 Add a Style Dictionary manifest platform + custom `json/manifest` format emitting `dist/manifest/tokens.json` — an array with one entry per token: `path`, `name` (kebab), `tier`, `type` (resolved `$type`), `value` (resolved), `ref` (raw `{alias}` or `null`), `description` (when present).
- [x] 1.2 Derive `tier` from each token's source `filePath` (primitive/semantic/component); derive `ref` from the token's pre-resolution `original.$value`.
- [x] 1.3 Keep the manifest deterministic (stable token order, no timestamps) and gated by validation like the other outputs.

## 2. Showcase generator (capability: showcase)

- [x] 2.1 Add `scripts/lib/showcase-core.mjs` exporting `renderShowcase({ manifest, tokenCss })` → HTML string. Pure: it reads only the passed-in built data, never `tokens/` sources.
- [x] 2.2 Token galleries: group entries by tier then `$type`; render a per-type visual (color→swatch, dimension→bar, fontFamily/fontWeight/typography→specimen, duration/cubicBezier/transition→replayable sample, shadow/border/gradient/strokeStyle→applied box, number→value); show the resolved value and, for aliases, the referenced token.
- [x] 2.3 Demo UI elements: curated set (button, text input, selection control, card, badge, link/alert) styled only via `var(--token)` custom properties — no literal colors/sizes in the demo styles; a missing token leaves the property unset so the gap is visible.
- [x] 2.4 Interaction-state matrix per element: default/hover/active/focus via CSS pseudo-classes, disabled via attribute, loading/error as explicit variants.
- [x] 2.5 Motion + focus a11y: gate animated samples behind `prefers-reduced-motion` (no auto-play when reduced) with a manual replay control; ensure a visible focus indicator on focusable demo elements.
- [x] 2.6 Self-contained output: inline the manifest data and the token CSS into the HTML so it opens from `dist/` over `file://` with no server and no network/module fetches.

## 3. Wire into the build

- [x] 3.1 Have `runBuild` generate the showcase to `dist/showcase/index.html` after Style Dictionary emits its outputs (still behind the validation gate); add `scripts/showcase.mjs` if a standalone entry is useful.
- [x] 3.2 Confirm `dist/` (incl. `manifest/` and `showcase/`) stays gitignored.

## 4. Tests (one per scenario)

- [x] 4.1 build-pipeline: manifest carries per-token metadata (path/name/tier/type/value/description); an aliased token records both resolved value and raw `ref` with a determinable tier; manifest output is deterministic.
- [x] 4.2 showcase: renders every manifest token grouped by tier and `$type`; aliases show their resolution; the curated demo elements are present with the full state matrix; a `prefers-reduced-motion` rule and a focus indicator are present; output is self-contained (no external/network references) and reads no `tokens/` sources; rendering twice is byte-identical.

## 5. Verify

- [x] 5.1 Clean `npm install && npm run validate && npm run build && npm test` green; `dist/{css,js,tailwind,manifest,showcase}` all produced.
- [x] 5.2 `dist/showcase/index.html` is valid, self-contained HTML (galleries + demo elements present); manifest and showcase regenerate byte-identically and stay untracked by git.
- [x] 5.3 `npx openspec validate add-showcase` passes; update design/CONSTITUTION if the realized approach diverged.

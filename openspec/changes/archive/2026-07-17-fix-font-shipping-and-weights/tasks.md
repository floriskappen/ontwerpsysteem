# Tasks — fix-font-shipping-and-weights

## 1. Ship an Archivo face covering 400–700

- [x] 1.1 Obtain a latin variable Archivo instance covering at least weights 400–700: download the upstream variable font from Google Fonts (`Archivo[wdth,wght].ttf` or the wght-only master, OFL-licensed; record the upstream version/commit), then subset it to the latin set with an instanced weight axis, e.g. `pyftsubset` / `fonttools varLib.instancer --wght=400:700` + `--flavor=woff2 --unicodes=<latin ranges matching the current subset>`. Record the exact source URL, upstream version, and full subsetting command.
  > Done with fonttools 4.63.0. Source: google/fonts commit `6c70c829f09ea345d3590406693220ea35c6553f` (`ofl/archivo/Archivo[wdth,wght].ttf`, upstream Version 2.001 — the same upstream version the previous subset came from). Full commands recorded in `assets/fonts/faces.json` provenance.
- [x] 1.2 Replace `assets/fonts/archivo-latin.woff2` with the new instance; confirm the file's `fvar` wght axis really spans 400–700 and the size stays within a few KB of the current 35 KB.
  > Replaced. Verified `fvar` wght axis: min 400.0 / default 600.0 / max 700.0; identical 230-codepoint cmap to the previous subset; 30 228 bytes (previous: 34 940).
  > **Deviation (necessary):** `assets/fonts/caveat-latin.woff2` was ALSO replaced. The previous Caveat binary was a *static* 500-weight face (`OS/2 usWeightClass` 500, no `fvar`), while the zoo declares — and uses (`.fig`/`.spec-fig` at `font-weight: 700`) — Caveat at 500–700, and task 2.1 requires faces.json to declare Caveat 500–700. Gate B (declaration honesty, task 4.3) would correctly fail that declaration over the static binary. Shipped instead a latin variable Caveat instance genuinely covering 500–700, same sourcing path (google/fonts commit `a85fc09e44c70c7159761adfdc9d5dd007792c15`, upstream Version 2.000 — same upstream version as the previous static file; identical 226-codepoint cmap; 74 324 bytes vs 50 904 — larger because it now carries the variable gvar deltas). Provenance in faces.json.
- [x] 1.3 Rebuild the zoo and diff against `design-system/reference/accepted-zoo/generated/index.html` for structural parity (the font payload and declared range are the intended deltas; the user checks visuals themselves).
  > Both zoo-parity tests pass (no dropped selectors, no newly-unstyled classes); section structure byte-identical; the only `@font-face` deltas are the Archivo range (`500 700` → `400 700`) and the two replaced payloads.

## 2. Canonical face definition (`assets/fonts/faces.json`)

- [x] 2.1 Create `assets/fonts/faces.json`: one record per face — family, file, style, declared weight range (`Archivo` 400–700, `JetBrains Mono` 500, `Caveat` 500–700), a flag marking the face bound to the `fontWeight` tokens (Archivo), and provenance (source URL, upstream version, subsetting command from 1.1).
  > JetBrains Mono's provenance predates faces.json (static Medium subset, upstream Version 2.211); recorded honestly as such — Gate B still verifies its binary coverage on every run.
- [x] 2.2 Refactor `fontCss()` in `scripts/lib/build-core.mjs` to generate `@font-face` declarations from `faces.json`, with two flavours: base64-inlined `src` (zoo) and relative-`url()` `src` resolving to the bundle's `fonts/` directory (fonts.css). No hardcoded family/weight strings remain.

## 3. Build output `values/css/fonts.css`

- [x] 3.1 Emit `values/css/fonts.css` from the relative-URL flavour during the build, alongside the existing `values/css/tokens.css`; the release assembly picks it up via the existing values copy (verify it lands in `design-system/dist/release/values/css/fonts.css` next to the shipped `fonts/`).
  > Verified: `design-system/dist/release/values/css/fonts.css` lands with `../../fonts/…` urls next to the shipped `fonts/` (which also carries `faces.json` via the existing directory copy — the provenance ships with the binaries).
- [x] 3.2 Named check `build-pipeline: fonts.css emitted` (in `test/build-pipeline.test.mjs`) — covers Scenario "Fonts CSS is emitted": build output contains `values/css/fonts.css` with one `@font-face` per face in `faces.json`, and each `src` relative URL resolves to an existing file under the bundle's `fonts/`.
- [x] 3.3 Named check `build-pipeline: zoo and fonts.css share one face definition` — covers Scenario "Showcase and fonts CSS share one face definition": parse `@font-face` blocks from the built zoo HTML and from `fonts.css`; assert identical family names, weight ranges, and styles per face.

## 4. Validation gates (weights vs. faces)

- [x] 4.1 Add a minimal woff2 reader to `scripts/lib/validate-core.mjs` (no new dependencies; `zlib.brotliDecompressSync` + table directory parsing) that reports a font file's real weight coverage: `fvar` wght axis min/max for variable faces, `OS/2 usWeightClass` for statics. Unit-test it against all three shipped woff2 files.
  > `readFontWeightCoverage()` exported; unit test in `test/font-contract.test.mjs`. Reads: Archivo 400–700 (fvar), JetBrains Mono 500 (static OS/2), Caveat 500–700 (fvar).
- [x] 4.2 Gate A — weight-token coverage: validation fails when any `fontWeight` token value lies outside the declared weight range of the token-bound face in `faces.json`; the error names the token, its value, and the range.
  > `validateFonts()` in validate-core.mjs; wired into `validateTokenDir` (fonts dir resolved relative to tokensDir, like the colour registry), so `npm run validate` and the build gate both run it.
- [x] 4.3 Gate B — declaration honesty: validation fails when any face's declared weight range in `faces.json` is not contained in the binary's real coverage (from 4.1); the error names the file, declared range, and actual coverage.
- [x] 4.4 Named check `propagation-validation: weight token outside shipped range fails` — covers Scenario "Weight token outside the shipped range fails": fixture with a `fontWeight` token of 300 against a 400–700 face asserts failure and the error contents.
- [x] 4.5 Named check `propagation-validation: weight tokens inside range pass` — covers Scenario "Weight tokens inside the range pass": the real source tree passes Gate A (this is the check that would have caught S9: 400 vs the old 500–700 face).
- [x] 4.6 Named check `propagation-validation: declared range exceeding real coverage fails` — covers Scenario "Declaration exceeding real coverage fails": fixture declaring 100–900 over the shipped Archivo asserts failure naming file, declared range, and actual coverage.
- [x] 4.7 Named check `propagation-validation: replaced font file is re-checked` — covers Scenario "Replacing a font file is re-checked": Gate B reads coverage from the binary at validation time (point the fixture at a different file and assert the verdict changes); no cached/recorded coverage value is trusted.
  > Tasks 4.4–4.7 live in the new `test/font-contract.test.mjs` under `describe('propagation-validation')`.

## 5. Distribution contract checks

- [x] 5.1 Named check `distribution: fonts wire up by import alone` (in `test/distribution.test.mjs`) — covers Scenario "Fonts wire up by import alone": from the assembled bundle, resolve every `src` URL in `values/css/fonts.css` against its own location and assert each target exists in the bundle's `fonts/`; assert no `@font-face` outside fonts.css is required (tokens.css contains none).
  > Also asserts tokens.scoped.css / components.scoped.css / effects.scoped.css carry no `@font-face`.
- [x] 5.2 Named check `distribution: every referenced family is shipped` — covers Scenario "Every referenced family is shipped": collect font family names from the built values (manifest `fontFamily` tokens) and from `design-system/language/` prose (Archivo, JetBrains Mono, Caveat); assert each has a binary in the bundle's `fonts/` and a matching declaration in fonts.css. This is the Caveat end-to-end verification.
- [x] 5.3 Named check `distribution: weight tokens render without synthesis` — covers Scenario "Weight tokens render without synthesis": every `fontWeight` token in the built manifest lies inside the token-bound face's declared range in the shipped fonts.css (bundle-side mirror of Gate A).
  > Bundle-side: reads the token-bound face from the SHIPPED `fonts/faces.json` and its range from the SHIPPED fonts.css — no reach-back into the source tree.

## 6. Type-language documentation

- [x] 6.1 Update `design-system/language/type.md`: fonts are wired by importing `values/css/fonts.css`; the voice (families + inherited voice properties) is set on the consumer's scope root, never on `html`/`body`; neutral descendant subtrees use the `.ontwerp-boundary` escape hatch (defined by `add-scoped-css-distribution` — reference it by name only). Correct the face description to weights 400–700.
- [x] 6.2 Sync the stale "weights 500–700" copy: `design-system/source/values/primitive/font.tokens.json` (`font.sans` `$description`) and the zoo type section foot (`design-system/source/zoo/sections/type.mjs`); update `design-system/templates/consumer-AGENTS.md` item 6 to mention `values/css/fonts.css` as the wiring path.
- [x] 6.3 Named check `design-language: type language documents scoped font application` (extend `test/repo-structure.test.mjs` or a docs test) — covers Scenario "Consumer finds the scoped-application rule": `language/type.md` mentions the scope-root rule, the `html`/`body` prohibition, and the boundary primitive by name.
  > Added as `describe('design-language')` in `test/repo-structure.test.mjs`; also asserts the `values/css/fonts.css` wiring path is documented.

## 7. Verification

- [x] 7.1 Baseline gates: `npm run validate` passes (DTCG schema, alias resolution, new Gates A+B); `npm run build` succeeds and is deterministic (two runs byte-identical, including fonts.css and the zoo HTML with the new inlined face).
  > `npm run validate` ✓; `npm run build` ✓; determinism ✓ via the two byte-identical-build tests (`build-pipeline: Deterministic output`, `repo-structure: Outputs are reproducible`), whose trees now include fonts.css and the zoo HTML with the new inlined faces.
- [x] 7.2 `npm test` passes with all named checks from 3.2–3.3, 4.4–4.7, 5.1–5.3, 6.3 present and green.
  > 82 tests / 9 files, all passing (baseline before this change: 71 / 8; +11 checks: 3.2, 3.3, the 4.1 reader unit test, 4.4–4.7, 5.1–5.3, 6.3).
- [x] 7.3 `openspec validate fix-font-shipping-and-weights` passes.
  > Passes with `--strict`.

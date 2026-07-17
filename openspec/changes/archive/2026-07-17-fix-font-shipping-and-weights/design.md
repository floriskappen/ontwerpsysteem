# Design — fix-font-shipping-and-weights

## Context

The `@font-face` rules live only inside `fontCss()` in `scripts/lib/build-core.mjs`, base64-inlined into the zoo HTML. The bundle ships raw woff2 files in `fonts/` with no CSS to wire them. Archivo is declared `font-weight: 500 700` and the shipped subset matches, while the public token `weight.regular = 400` promises a weight the face cannot render (S9). Nothing validates tokens against face coverage, and the type language says nothing about where the voice may be applied (S5).

## Goals / Non-Goals

**Goals:**
- Ship an Archivo face genuinely covering 400–700 (roadmap decision D2), with the declaration matching reality.
- Make font wiring an import (`values/css/fonts.css`), not a hand-authored copy of zoo internals.
- Make token-vs-face drift a validation failure, permanently.
- Document scoped font application in the type language.

**Non-Goals:**
- Scoping machinery, the `.ontwerp-boundary` primitive, and scoped CSS builds — owned by the parallel `add-scoped-css-distribution` change; this change only references the boundary by name.
- Retiring or renaming any weight token (D2 explicitly rejects that path).
- Non-latin subsets, italics, or additional families.

## Decisions

**D2: ship the face, keep the token.** Alternative — drop/relabel `--weight-regular` to 500 — was rejected upstream: it breaks every consumer using the token and papers over the real defect (the shipped asset, not the token, is wrong). Archivo is OFL-licensed with a variable weight axis 100–900, so a latin variable instance covering 400–700 costs a few KB. Widening coverage is invisible to existing consumers except that 400 text stops being synthesized.

**Canonical face definition file.** A committed `assets/fonts/faces.json` records, per face: family name, file, style, declared weight range, whether it is the face bound to the `fontWeight` tokens, plus provenance (source URL, subsetting command). Both `@font-face` flavours — base64-inlined for the zoo, relative-`url()` for `values/css/fonts.css` — are generated from it, so the two outputs cannot drift (today the declaration is hardcoded in `fontCss()`). Alternative — generate fonts.css by regexing the zoo output — rejected as backwards: derive both from data, not one output from another.

**Two-sided validation.** (1) Every `fontWeight` token must sit inside the declared range of the token-bound face (`faces.json`); (2) each declared range must be contained in the binary's real weight-axis coverage, read from the woff2 itself (`fvar` axis for variable faces, `OS/2 usWeightClass` for statics). Node's `zlib.brotliDecompressSync` decompresses woff2 table data, so a small reader needs no new dependency. Alternative — trust a hand-recorded coverage value in faces.json — rejected: a self-attesting sidecar re-creates exactly the drift this gate exists to catch (the current bug *is* a hand-written declaration nobody checked). If the woff2 transformed-table parsing proves brittle, the fallback is verifying faces.json coverage against the binary's SHA-256 recorded at subsetting time — weaker, but still tamper-evident.

**fonts.css uses relative paths, not base64.** The zoo inlines fonts because it must stay a single self-contained file; a consumer bundle has a `fonts/` directory sitting next to `values/`, and relative `url()`s (`../../fonts/…`) keep the CSS small, cacheable, and readable. Consumers who need inlining can do it themselves; the reverse is impossible.

**Docs live in `language/type.md`.** The scoped-application rule (voice on the scope root, never `html`/`body`; boundary primitive for neutral subtrees) belongs with the type language, where a consumer deciding how to wire fonts is already reading. The consumer templates point at it rather than duplicating it.

## Risks / Trade-offs

- [Re-subsetted Archivo renders slightly differently at 500–700 than the current file] → subset from the same upstream Archivo version with the same glyph set; zoo baseline comparison (`reference/accepted-zoo`) catches visible regressions.
- [woff2 parsing complexity: transformed `glyf` tables, varint directory] → the reader only needs the table directory and the untransformed `fvar`/`OS/2` tables; keep it minimal and covered by a unit test against the shipped files.
- [Caveat is used by the zoo but absent from the token layer] → it is referenced by the design language (`type.md`), so the distribution rule "every family referenced by built values *or* design language ships" covers it without inventing a token.
- [Parallel change also touches the bundle's `values/css/`] → additive file additions on both sides; coordinate at archive time, no shared files edited.

## 1. Project setup

- [x] 1.1 Initialize `package.json` (npm), add dev deps: `style-dictionary` (latest), `ajv` (+ `ajv-formats` if needed), and a test runner (`vitest`).
- [x] 1.2 Add scripts: `validate`, `build`, `test`. `build` runs `validate` first and aborts on failure.
- [x] 1.3 Add `.gitignore` entry for `dist/` (already present from setup — confirm).

## 2. Directory structure & placeholder tokens

- [x] 2.1 Create `tokens/primitive/`, `tokens/semantic/`, `tokens/component/`.
- [x] 2.2 Add a disposable placeholder set: one primitive (e.g. `tokens/primitive/color.tokens.json` with a raw color) and one semantic alias of it (`tokens/semantic/color.tokens.json` → `{...}`). Enough to exercise every check and output.

## 3. Validation gate (capability: token-format)

- [x] 3.1 Author a focused DTCG 2025.10 JSON Schema (the `$type` vocabulary + token/group structure) under e.g. `schema/`.
- [x] 3.2 Write `scripts/validate.mjs`: load all `tokens/**/*.tokens.json`, run ajv (covers `Token missing a resolvable type`, `Type outside the vocabulary`), then custom checks for naming grammar, tier/reference direction, and alias resolution. Exit non-zero with token paths on any violation.
- [x] 3.3 Tier inference from directory path (covers `Source file in a tier directory`); reject `.tokens.json` outside the three tier dirs (covers `File outside the tier directories`).

## 4. Build pipeline (capability: build-pipeline)

- [x] 4.1 Write Style Dictionary config consuming `tokens/**/*.tokens.json` (DTCG parser enabled), using the kebab path→name transform.
- [x] 4.2 CSS custom properties target → `dist/css/` (covers `CSS variables are emitted`, `Stable name derivation`).
- [x] 4.3 JS/TS ESM target → `dist/js/` with type declarations (covers `ESM module is importable`).
- [x] 4.4 Tailwind v4 `@theme` target → `dist/tailwind/` (covers `Tailwind theme is emitted`).
- [x] 4.5 Make `build` depend on `validate` and abort without writing `dist/` on failure (covers `Build runs only on valid tokens`).

## 5. Tests (one per scenario)

- [x] 5.1 token-format tests: `Token missing a resolvable type`, `Type outside the vocabulary`, `Valid intent-based semantic name`, `Appearance-named semantic token`, `Semantic aliases a primitive`, `Component references a primitive directly`, `Dangling or circular reference`, `Validation blocks a non-conforming change` — using fixture token files.
- [x] 5.2 repo-structure tests: `File outside the tier directories`; `Outputs are reproducible and ignored` (build twice → byte-identical, `dist/` git-ignored); `Clean install runs the pipeline`.
- [x] 5.3 build-pipeline tests: `Build runs only on valid tokens`, `Deterministic output`, `Stable name derivation`, plus presence of each of the three output artifacts.

## 6. Verify

- [x] 6.1 Run `npm install && npm run validate && npm run build && npm test` from clean — all green.
- [x] 6.2 Confirm `dist/` regenerates identically after deletion and stays untracked by git.
- [x] 6.3 `npx openspec validate scaffold-token-pipeline` passes; update CONSTITUTION/README if the realized layout diverged from the spec.

# Tasks — effects-as-pure-data-modules

## 1. Data-first generator API (with thin string wrappers)

- [ ] 1.1 In `effects/phyllotaxis.mjs`, add data primaries returning `{cx,cy,r,index}[]` — `seedHeadData(n)` and `growingSeedHeadData(n)` (the latter also carrying `gi`) — and rewrite `seedHead`/`growingSeedHead`/`renderDivider` to build their existing `<circle>` strings from that data (byte-identical output). `leafMark` (static, no field) stays as-is.
- [ ] 1.2 In `effects/grid.mjs`, add `gridData()` returning `{cells: {a,b,d,dl,index}[], cols, rows}` and rewrite `renderGrid` to build the `<div class="grid">…<i>…` string from it.
- [ ] 1.3 In `effects/weather-particles.mjs`, add a data primary per field (`windParticlesData`, `rainParticlesData`, `fleckParticlesData`, `driftParticlesData`, `fireflyParticlesData`, `flakeParticlesData`, `hazeParticlesData`, `sunpoolParticlesData`) returning `Particle[]`, and add `weatherTextData(str) → {char,index}[]`. Rewrite each `*Particles` and `weatherText` wrapper to render its markup from that data.
- [ ] 1.4 Confirm every field-producing generator's primary export is the data function and no module's only export is a markup-string function (spec: effects-contract / Scenario: Every generator has a data primary).

## 2. Determinism: seed-by-index, memoization, clock-free

- [ ] 2.1 Keep all randomness derived strictly from the element index via the existing LCG; ensure no data function reads call order or elapsed time (spec: effects-contract / Scenario: Output depends only on the index and declared inputs).
- [ ] 2.2 Add a module-level memo per data function keyed by its parameter set so repeated calls return the same result (spec: effects-contract / Scenario: Repeated calls are byte-identical).
- [ ] 2.3 Confirm `effects/` modules reference no `Math.random` / `Date.now` / `performance.now` (spec: effects-contract / Scenario: Effect modules are clock-free).

## 3. Framework-neutral effects module in the bundle

- [ ] 3.1 Emit `dist/js/effects.js` (framework-neutral ESM re-exporting the data functions) plus `dist/js/effects.d.ts` from the effect sources in `scripts/lib/build-core.mjs`; ensure `assembleBundle` carries them into `dist/release/values/js/` (spec: distribution / Scenario: Effects module ships in the bundle).
- [ ] 3.2 Confirm the shipped module's data functions are the same deterministic functions the zoo renders from — one source, no parallel copy (spec: distribution / Scenario: Effects module is consumable without tooling).

## 4. Zoo consumes the data-derived wrappers

- [ ] 4.1 Verify `index.mjs`, `sections/states.mjs`, `sections/weather.mjs`, `sections/masthead.mjs`, `sections/colophon.mjs` still call the wrappers and the generated zoo effect markup is byte-identical to the accepted baseline (spec: showcase / Scenario: Effect markup comes from the data-derived wrappers; Scenario: Effect output stays stable across rebuilds).

## 5. Validation — named checks per scenario

- [ ] 5.1 `test/effects-contract.test.mjs` — "primary export returns structured data": each generator's data function returns an array of plain objects (or object-of-arrays) with coordinate/parameter/`index` fields and no markup string (spec: effects-contract / Scenario: Primary export returns structured data).
- [ ] 5.2 `test/effects-contract.test.mjs` — "every generator has a data primary": each field-producing effect module exports a data function; none exports only a string function (Scenario: Every generator has a data primary).
- [ ] 5.3 `test/effects-contract.test.mjs` — "repeated calls are byte-identical": two calls with the same inputs are deeply equal and served from the memo (Scenario: Repeated calls are byte-identical).
- [ ] 5.4 `test/effects-contract.test.mjs` — "effect modules are clock-free": scan every file under `design-system/source/zoo/effects/` for `Math.random`/`Date.now`/`performance.now`; assert none present (Scenario: Effect modules are clock-free).
- [ ] 5.5 `test/effects-contract.test.mjs` — "output depends only on index and inputs": element values reproduce from index alone regardless of call count/order (Scenario: Output depends only on the index and declared inputs).
- [ ] 5.6 `test/effects-contract.test.mjs` — "wrapper renders from the data function": each wrapper emits exactly one markup element per datum, in order, matching the data function's cardinality (Scenarios: Wrapper renders from the data function; Wrapper and data agree on the field).
- [ ] 5.7 `test/showcase.test.mjs` — "effect markup is byte-identical to baseline": the generated zoo effect markup matches `design-system/reference/accepted-zoo/generated/index.html` (Scenario: Effect output stays stable across rebuilds), and `test/zoo-parity.test.mjs` stays green (Scenario: Effect markup comes from the data-derived wrappers).
- [ ] 5.8 `test/distribution.test.mjs` — "bundle ships the effects module": `dist/release/values/js/` contains `effects.js` + `effects.d.ts`; importing `effects.js` exposes the data functions and they return the same data the zoo renders from (Scenarios: Effects module ships in the bundle; Effects module is consumable without tooling).
- [ ] 5.9 Full gate: `npm run validate`, `npm run build`, `npm test` all pass; `openspec validate effects-as-pure-data-modules --strict` passes.

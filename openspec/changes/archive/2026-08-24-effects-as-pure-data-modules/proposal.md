# Proposal: effects-as-pure-data-modules

## Why

The zoo's effect generators (`design-system/source/zoo/effects/`) emit HTML/SVG **strings** for `innerHTML` as their only API, entangling data with presentation, and their determinism is a stated principle the code never enforces. A consumer rendering them in a framework (de-ontwerper, struggles S19/S20/S22) had to invert every generator to return data, render elements idiomatically to drop `dangerouslySetInnerHTML`, and re-earn determinism (seed by index, memoize, forbid clock APIs) the brief promises but the generators leave to the caller. This change makes the data-first, deterministic shape the shipped contract.

## What Changes

- **Data-first generator API:** every generator's primary export returns plain data, not markup — `seedHead(n) → {cx,cy,r,index}[]`, `renderGrid → {cells: {a,b,d,dl,index}[], cols, rows}`, each weather field → `Particle[]`, `weatherText → {char,index}[]`. Markup-returning `renderX()` wrappers are kept as thin functions that build the existing strings **from** that data, so the zoo HTML build is byte-identical.
- **Determinism baked into the code (not the caption):** generators seed strictly by index, memoize per parameter set so repeated calls are byte-identical, and the `effects/` modules are clock-free — an architecture test forbids `Math.random` / `Date.now` / `performance.now` there.
- **Framework-neutral effects module in the bundle:** the data functions ship as `values/js/effects.js` (plus a `.d.ts`) so a React/Vue/Svelte consumer can map the returned data onto `<circle>`/`<i>` elements idiomatically — S19's inversion becomes the supported path, not a re-authoring chore.
- **Zoo becomes the first consumer of the data API:** the zoo's markup is produced by the render wrappers that call the data functions, so it exercises the same contract it ships.

Non-breaking for existing consumers: the string wrappers keep their names and output; the data exports and the shipped module are additive.

## Capabilities

### New Capabilities

- `effects-contract`: the generator contract — every effect generator exposes a data-returning primary function, determinism is an enforced property (seed-by-index, memoized, clock-free), and thin markup wrappers are derived from the data. Distinct, consumer-facing surface not covered by the zoo page or the bundle manifest.

### Modified Capabilities

- `showcase`: the zoo renders its effect markup through the wrappers built on the data API (the zoo consumes the data contract it ships), and stays byte-identical to the accepted baseline.
- `distribution`: the consumer bundle ships a framework-neutral effects JS module exposing the data functions.

## Impact

- Code: `design-system/source/zoo/effects/*.mjs` (data exports + memoization + wrappers), `scripts/lib/build-core.mjs` + `assembleBundle` (emit `values/js/effects.js`/`.d.ts`), tests (architecture + parity + module contract).
- Build outputs: new `dist/js/effects.js` (+ `.d.ts`) flowing into `dist/release/values/js/`; the zoo HTML output is unchanged.
- Consumers: gain an importable data API; no rename or removal of existing string helpers.

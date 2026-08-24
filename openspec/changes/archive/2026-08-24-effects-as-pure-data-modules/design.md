## Context

The effect generators in `design-system/source/zoo/effects/` return HTML/SVG strings as their only API and leave determinism to the caller — the brief promises "deterministic, free of runtime clock jitter", but the code contains a raw index-LCG a caller could reseed per render, no memoization, and nothing forbidding a clock API. A scoped consumer (de-ontwerper, S19/S20/S22) inverted every generator to return data, rendered elements idiomatically to drop `dangerouslySetInnerHTML`, and re-earned determinism by hand. This change upstreams that inversion. The parallel Wave 2 changes own reduced-motion rest frames (C7), skins (C6), and new components (C8); this one stays on the generator contract and the bundle module.

## Goals / Non-Goals

**Goals:** a data-returning primary API for every generator; determinism as an enforced code property (seed-by-index, memoization, clock-free architecture test); a framework-neutral effects module in the bundle; the zoo re-expressed as the first consumer of the data API, byte-identical to baseline.

**Non-Goals:** reduced-motion rest frames (C7); transform-aware grid / per-glyph weather helper / pointer ambience (C12, v1.1); atmosphere mount cardinality and particle caps (C11); any change to the effect CSS, keyframe names, or visual values.

## Decisions

1. **New capability `effects-contract`, not folded into `showcase`.** The data-first shape and determinism guarantee are a durable, consumer-facing contract on a distinct surface — the generator modules — that outlives the zoo page and the bundle manifest. `showcase` specs what the zoo *renders*; `distribution` specs what the bundle *contains*; neither states that a generator's primary API returns data or that the modules are clock-free. Folding this into `showcase` would bury a public API contract inside a page spec, and a future zoo rewrite could not touch the generator contract without appearing to rewrite the showcase. The contract earns its own capability, analogous to `token-format` owning the token-source contract. `showcase` and `distribution` take thin deltas (the zoo consumes the API; the bundle ships the module).

2. **Keep the string wrappers; make them thin renderers over the data.** `renderGrid`, `seedHead`'s `renderDivider`, `growingSeedHead`, and each `*Particles` function keep their names and byte-identical output, but rebuild their markup from the new data function. Alternative — deleting the string API — would break the zoo sections and every pinned consumer of the strings for no gain; the wrapper is a few lines and the parity test pins its output.

3. **Data function is primary, wrapper derives from it — one source of cardinality.** Each module exports e.g. `seedHeadData(n) → {cx,cy,r,index}[]` and `seedHead(n)` maps that to `<circle>` strings. The wrapper never re-derives coordinates, so markup and data cannot diverge; a single memo backs both.

4. **Memoize per parameter set with a module-level cache keyed by the arguments.** Repeated calls (the zoo calls `driftParticles()` in two places) return the same array reference, so the field is computed once and is provably stable. Alternative — recomputing each call — is deterministic in values but re-runs the LCG and invites a future clock dependency; the memo makes stability observable in a test (`===`).

5. **Clock-free is enforced by an architecture test, not convention.** A test greps the effect modules for `Math.random` / `Date.now` / `performance.now` and fails on any hit — the exact guard the consumer had to author, now upstream. This turns S20's prose principle into a build-gated property.

6. **Ship the module as `values/js/effects.js` (+ `.d.ts`), assembled from the effect sources.** The effect modules are already dependency-free ESM, so the build emits a framework-neutral bundle re-exporting the data functions into `dist/js/`, which `assembleBundle` carries into `values/js/` alongside the token JS. Placing it under built values (not buried in `zoo/source/effects/`) makes it a first-class consumable, matching where `tokens.js` lives. The data functions in the shipped module are the same ones the zoo renders from, so the two cannot drift.

## Risks / Trade-offs

- [Wrapper output drifts from the accepted zoo baseline] → the existing `zoo-parity` selector/parity checks stay green and a new check asserts the wrapper renders one element per datum; the string output is pinned byte-for-byte.
- [A future generator adds a non-index random source] → the clock-free architecture test fails the build; seeding-by-index is a spec requirement, not a style note.
- [Memoization holds arrays across calls, so a caller could mutate shared data] → accepted; the effects are read-only render inputs and the memo is an internal build-time/consumer optimisation, documented as return-value-is-immutable.
- [Two surfaces render effects (zoo strings + shipped data module)] → both derive from one data function per generator; the parity and module-contract tests make divergence a failure.

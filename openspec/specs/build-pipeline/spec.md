# build-pipeline Specification

## Purpose
Defines how value sources become shippable artifacts: the build validates the sources under `design-system/source/values/`, then emits platform outputs under `design-system/dist/` — CSS custom properties, JS/TS ESM, a Tailwind v4 theme, and a structured token manifest. Builds are deterministic, and outputs are generated rather than committed.
## Requirements
### Requirement: Build transforms canonical tokens into platform outputs

The build SHALL read all value source files under `design-system/source/values/`, validate them, and emit built platform outputs (CSS custom properties, JS/TS ESM, Tailwind v4 theme, and structured token manifest) under `design-system/dist/`.

#### Scenario: Build executes and outputs to design-system/dist
- **WHEN** the build is run on a valid set of source files
- **THEN** it generates the platform outputs inside `design-system/dist/`

### Requirement: Output names map deterministically from token paths

Every output target SHALL derive consumer-facing names from a token's dot-path by a single, documented rule, so the same token yields a predictable name across builds. The path-to-name mapping is part of the public contract: changing it is a breaking change.

#### Scenario: Stable name derivation

- **WHEN** a token at path `color.text.muted` is built
- **THEN** the CSS output exposes it as `--color-text-muted`
- **AND** the JS/TS and Tailwind outputs expose the same token under the same derived name shape

### Requirement: CSS custom properties output

The build SHALL emit a CSS file exposing every token as a custom property under `:root`, with values fully resolved (or expressed as `var(--…)` references that resolve within the file). This is the baseline web target.

#### Scenario: CSS variables are emitted

- **WHEN** the build completes
- **THEN** `dist/` contains a CSS file declaring each token as a `--…` custom property under `:root`

### Requirement: JS/TS ESM output

The build SHALL emit an ES module exporting the resolved tokens as a typed object, suitable for programmatic and type-safe consumption.

#### Scenario: ESM module is importable

- **WHEN** a consumer imports the generated ESM module
- **THEN** it receives an object whose keys are the derived token names and whose values are the resolved token values

### Requirement: Tailwind v4 theme output

The build SHALL emit a Tailwind v4 theme artifact (a `@theme` CSS layer or equivalent preset) so Tailwind v4 projects consume the tokens directly without re-declaring them.

#### Scenario: Tailwind theme is emitted

- **WHEN** the build completes
- **THEN** `dist/` contains a Tailwind v4 theme artifact that maps the tokens into Tailwind theme variables

### Requirement: Structured token manifest output

The build SHALL emit a structured token manifest as a JSON artifact under `dist/`, describing every token in the built set. Each manifest entry SHALL carry the token's dot-path, its derived (kebab) output name, its tier (primitive, semantic, or component), its resolved `$type`, its fully resolved `$value`, the raw alias it references when the token is an alias, and its `$description` when present. The manifest is a generated artifact subject to the same validation gate and determinism rules as every other output.

#### Scenario: Manifest carries per-token metadata

- **WHEN** the build completes
- **THEN** `dist/` contains a JSON manifest with one entry per token
- **AND** each entry includes the token's path, derived name, tier, resolved `$type`, resolved value, and its `$description` when present

#### Scenario: Aliased token records its reference

- **WHEN** a manifest entry describes a token whose `$value` is an alias, such as a semantic token pointing at a primitive
- **THEN** the entry records both the resolved value and the raw alias it references
- **AND** the referenced token's tier is determinable from the manifest

### Requirement: Build assembles the consumer bundle

The build SHALL assemble the consumer bundle from its built outputs and the durable design surface into a dedicated release directory under `design-system/dist/`. Assembly SHALL copy the built value outputs and embedded fonts, the `language/`, `recipes/` (including the generated index), the zoo source and its rendered `index.html`, the consumer `AGENTS.md`, `VERSION`, and `CHANGELOG.md`, and SHALL exclude development machinery. Re-assembling from unchanged inputs SHALL be deterministic.

#### Scenario: Bundle is assembled by the build
- **WHEN** the build runs
- **THEN** a release directory under `design-system/dist/` contains the consumer bundle with built values, fonts, language, recipes, zoo source, rendered `index.html`, consumer `AGENTS.md`, `VERSION`, and `CHANGELOG.md`

#### Scenario: Assembly is deterministic
- **WHEN** the bundle is assembled twice from unchanged inputs
- **THEN** the two outputs are identical


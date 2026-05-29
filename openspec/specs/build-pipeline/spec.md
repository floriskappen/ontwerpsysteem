# build-pipeline Specification

## Purpose
TBD - created by archiving change scaffold-token-pipeline. Update Purpose after archive.
## Requirements
### Requirement: Build transforms canonical tokens into platform outputs

The build SHALL read all token sources under `tokens/`, resolve aliases, and emit platform outputs under `dist/`. The build SHALL run the validation gate first and SHALL NOT emit any output if validation fails. Given unchanged sources, the build SHALL be deterministic — repeated runs produce identical outputs.

#### Scenario: Build runs only on valid tokens

- **WHEN** the build is invoked and the validation gate fails
- **THEN** the build aborts and `dist/` is not written or modified

#### Scenario: Deterministic output

- **WHEN** the build is run twice with no source changes
- **THEN** the two `dist/` results are byte-identical

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


## ADDED Requirements

### Requirement: Token sources are organized by tier

Canonical token source files SHALL live under a top-level `tokens/` directory, with exactly one subdirectory per tier: `tokens/primitive/`, `tokens/semantic/`, and `tokens/component/`. Source files SHALL use the `.tokens.json` extension. A token's tier is determined by which subdirectory it lives in, so the same logical grouping (e.g. color) MAY appear as a separate file in each tier.

#### Scenario: Source file in a tier directory

- **WHEN** a contributor adds a token file at `tokens/semantic/color.tokens.json`
- **THEN** its tokens are treated as semantic-tier tokens by validation and the build
- **AND** no further per-file tier declaration is needed

#### Scenario: File outside the tier directories

- **WHEN** a `.tokens.json` file exists under `tokens/` but not inside `primitive/`, `semantic/`, or `component/`
- **THEN** validation fails with an error naming the offending file and the allowed tier directories

### Requirement: Generated outputs are separate from sources and not committed

Build outputs SHALL be written under a top-level `dist/` directory and SHALL NOT be committed to version control (listed in `.gitignore`). Outputs are reproducible artifacts of `npm run build` and SHALL never be hand-edited. The `tokens/` sources are the single source of truth; nothing under `dist/` is.

#### Scenario: Outputs are reproducible and ignored

- **WHEN** `dist/` is deleted and `npm run build` is run
- **THEN** `dist/` is regenerated with identical contents
- **AND** `git status` shows no tracked changes under `dist/`

### Requirement: Node project with build and validate scripts

The repo SHALL be an npm project (`package.json`) exposing at least two scripts: `validate` (runs the conformance gate over `tokens/`) and `build` (produces `dist/`). Dependencies SHALL be declared in `package.json` so the pipeline is reproducible from a clean `npm install`.

#### Scenario: Clean install runs the pipeline

- **WHEN** a fresh clone runs `npm install` then `npm run validate && npm run build`
- **THEN** both scripts complete successfully using only declared dependencies

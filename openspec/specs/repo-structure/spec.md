# repo-structure Specification

## Purpose
Defines the repository layout so the system is legible to agents: the design system lives under a single `design-system/` root (`language/`, `recipes/`, `source/`, `reference/`, `dist/`), value sources are organized by tier under `source/values/`, generated outputs are confined to `dist/` and never committed, and an `AGENTS.md` at the root declares the reading order. It keeps sources, generated artifacts, and the agent entry point cleanly separated.
## Requirements
### Requirement: Token sources are organized by tier

Canonical token/value source files SHALL live under `design-system/source/values/`, organized by primitive, semantic, and component tiers. Source files SHALL use the `.tokens.json` extension.

#### Scenario: Value tier validation
- **WHEN** value files are validated
- **THEN** they are located in `design-system/source/values/{primitive,semantic,component}/`

### Requirement: Generated outputs are separate from sources and not committed

All build outputs and generated showcase files SHALL be written to `design-system/dist/` and SHALL NOT be committed to version control.

#### Scenario: Clean build output location
- **WHEN** the build runs
- **THEN** output files are written to `design-system/dist/`

### Requirement: Node project with build and validate scripts

The repo SHALL be an npm project (`package.json`) exposing at least two scripts: `validate` (runs the conformance gate over `design-system/source/values/`) and `build` (produces `design-system/dist/`). Dependencies SHALL be declared in `package.json` so the pipeline is reproducible from a clean `npm install`.

#### Scenario: Clean install runs the pipeline

- **WHEN** a fresh clone runs `npm install` then `npm run validate && npm run build`
- **THEN** both scripts complete successfully using only declared dependencies

### Requirement: Design system files are organized under a single design-system directory

The entire design system, including language principles, recipes, source code, and reference baselines, SHALL live under a top-level `design-system/` directory. The structure SHALL adhere to the following subdirectories: `language/`, `recipes/`, `source/`, `reference/`, and `dist/`.

#### Scenario: Layout verification
- **WHEN** the repository is inspected
- **THEN** all files relating to the design system are located under the `design-system/` root directory

### Requirement: Agent reading order is defined by AGENTS.md

The repository root SHALL contain an `AGENTS.md` file that specifies a strict entry point and reading order for agentic workflows.

#### Scenario: Agent checks reading order
- **WHEN** an agent reads the repository
- **THEN** `AGENTS.md` is present at the root and maps out the designated reading paths


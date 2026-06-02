# distribution Specification

## Purpose
TBD - created by archiving change add-distribution-contract. Update Purpose after archive.
## Requirements
### Requirement: Consumer bundle is a self-contained, agent-readable surface

The system SHALL produce a consumer bundle: a self-contained surface that a downstream application can consume to apply the design system, readable by an agent without running any build step. The bundle SHALL contain the built value outputs (CSS custom properties, JS/TS values, the token manifest) and embedded fonts, the `language/` prose, the `recipes/` JSON and their index, the modular zoo source and its rendered `index.html` as the canonical worked example, a consumer-oriented `AGENTS.md` entry point, and the current `VERSION` and `CHANGELOG.md`. The bundle SHALL exclude development machinery — build scripts, tests, the OpenSpec workflow, and the accepted-zoo regression baseline.

#### Scenario: Bundle is consumable without tooling
- **WHEN** an agent is given only the consumer bundle
- **THEN** it can read the design language, recipes, values, and worked example, and apply the system, without installing dependencies or running a build

#### Scenario: Bundle declares its own entry point
- **WHEN** the bundle is inspected
- **THEN** it contains a consumer `AGENTS.md` declaring the reading order, and the built values, language, recipes, zoo source, rendered `index.html`, `VERSION`, and `CHANGELOG.md`

#### Scenario: Bundle omits dev machinery
- **WHEN** the bundle is inspected
- **THEN** it does not include build scripts, the test suite, the OpenSpec directory, or the accepted-zoo baseline

### Requirement: Releases are versioned

The system SHALL carry a `VERSION` whose value increases monotonically across releases. Each published release SHALL correspond to exactly one version, recorded in `VERSION` and reachable by a matching tag, so any release can be referenced by an exact, stable identifier.

#### Scenario: A release is identifiable
- **WHEN** a release is published
- **THEN** `VERSION` holds its version and a tag names that release

#### Scenario: Versions are ordered
- **WHEN** two releases are compared
- **THEN** their versions establish which is newer

### Requirement: Changelog records durable changes keyed to recipe and language IDs

The bundle SHALL include a `CHANGELOG.md` with one entry per release. Each entry SHALL name the recipe and language IDs whose durable behaviour changed, carry a short propagation note describing what a consuming application must re-check, and distinguish additive changes from breaking ones. Exploratory or non-durable changes SHALL NOT produce changelog entries.

#### Scenario: An entry guides propagation
- **WHEN** a release changes a durable recipe or language definition
- **THEN** its changelog entry names the affected recipe/language IDs and states what consumers must re-check

#### Scenario: Breaking changes are marked
- **WHEN** a release changes the meaning of an existing recipe, language rule, or public value
- **THEN** its changelog entry marks the change as breaking

### Requirement: Releases are published on a dedicated channel pinned by consumers

The consumer bundle SHALL be published to a dedicated `release` branch and matching tags, separate from the development branch. The `release` branch history SHALL contain exactly one commit per release, so that the set of changes between any two releases is the changelog entries between them. Consuming applications SHALL pin to an exact release (for example, by adding the `release` branch as a git submodule fixed to a release commit or tag).

#### Scenario: Consumer pins an exact release
- **WHEN** a consuming application adopts the design system
- **THEN** it references an exact release commit or tag, not a moving branch tip

#### Scenario: Change set between pins is the changelog
- **WHEN** a consumer advances its pin from one release to a newer one
- **THEN** the releases crossed, and their changelog entries, describe everything that changed

### Requirement: Cutting a release is agent-drafted and human-approved

The release step SHALL bump `VERSION` and draft `CHANGELOG.md` entries from the recipe and language IDs touched by durable changes since the previous release. A release SHALL NOT be published without explicit human approval; the system SHALL NOT publish releases automatically.

#### Scenario: Release is drafted from durable changes
- **WHEN** the release step runs
- **THEN** it proposes the next version and draft changelog entries derived from the touched recipe/language IDs

#### Scenario: Publishing requires approval
- **WHEN** a release has been drafted
- **THEN** it is published only after a human approves, and never automatically

### Requirement: Consuming applications maintain a pin file

A consuming application SHALL maintain a pin file, kept current by its agent, that records the pinned design-system version and commit, the parts of the system it has adopted, and — recorded by deviation rather than exhaustively — what it has adapted, omitted, or extended relative to the design system. On advancing the pin, the agent SHALL update this file to reflect the new version and any propagation it performed.

#### Scenario: Pin file records the adopted version and deviations
- **WHEN** a consuming application has applied the design system
- **THEN** its pin file names the pinned version and commit and lists deviations (adapted, omitted, or extended), not every conforming element

#### Scenario: Pin file is updated on sync
- **WHEN** a consuming application advances its pin and propagates changes
- **THEN** its agent updates the pin file with the new version and what was propagated


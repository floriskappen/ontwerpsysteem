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

### Requirement: Bundle ships scope-aware CSS targets

The consumer bundle SHALL contain, as importable files under its built values, both the `:root` token CSS and the scoped CSS targets — the scoped token CSS, the scoped component CSS bundle, and the scoped effects CSS bundle — so an application can adopt the system whole-app or mount it as an island under the scope class without copying, editing, or re-scoping any shipped file.

#### Scenario: Island adoption is import-only

- **WHEN** a consumer imports the scoped token, component, and effects CSS and applies the scope class to an element
- **THEN** the system's tokens, component classes, and effects apply within that element's subtree
- **AND** no shipped file needed to be copied or re-scoped by the consumer

#### Scenario: Whole-app adoption needs no scope class

- **WHEN** a consumer imports the `:root` token CSS
- **THEN** the token custom properties apply document-wide with no scope class required

### Requirement: Bundle ships a boundary reset primitive

The shipped CSS SHALL include a `.ontwerp-boundary` class that stops the system's inherited voice at a descendant seam inside a scoped (or whole-app) subtree. The boundary SHALL re-point the font slots (`--font-sans`, `--font-heading`) to a consumer-overridable custom property (`--ontwerp-boundary-font`) whose default is a neutral system stack, and SHALL pin the inherited voice properties (`font-family`, `text-transform`, `letter-spacing`) so the system's voice does not cascade past the boundary.

#### Scenario: Boundary neutralises the inherited voice

- **WHEN** `.ontwerp-boundary` is applied to an element that is a descendant of a scope root
- **THEN** text within that element renders in the neutral default stack with initial transform and spacing, not in the system's voice

#### Scenario: Consumer re-points the boundary font

- **WHEN** a consumer sets `--ontwerp-boundary-font` on or above a boundary element
- **THEN** the bounded subtree renders in that font stack instead of the neutral default

### Requirement: Skin overrides use a dedupe-safe selector slot

The scoped distribution SHALL reserve a documented selector shape for skin overrides that is distinct from the base scope selector: `.ontwerp[data-skin="<name>"]` (with the equivalent attribute form for whole-app adoption). Because the slot's selector differs from the base token block's, CSS bundlers that deduplicate same-selector custom-property rules cannot drop the override. The bundle's consumer documentation SHALL state that skins apply via this slot and that a second bare scope-class rule is not a supported override mechanism.

#### Scenario: Skin override survives same-selector deduplication

- **WHEN** a skin override authored on `.ontwerp[data-skin="<name>"]` is processed by a bundler that deduplicates same-selector custom-property rules
- **THEN** the override remains in the output and takes effect on elements carrying both the scope class and the matching `data-skin` attribute

#### Scenario: The slot is documented

- **WHEN** the bundle's consumer documentation is inspected
- **THEN** it names the `data-skin` selector slot as the supported way to apply a skin over the scoped tokens

### Requirement: Bundle ships a complete, importable font layer

The consumer bundle SHALL contain the font binaries under `fonts/` and an importable fonts CSS under `values/css/` whose `@font-face` declarations cover every font family that the built values or the design language reference. Every `fontWeight` token in the built values SHALL be renderable by the shipped face bound to the typographic voice without synthetic (faux) weights.

#### Scenario: Fonts wire up by import alone

- **WHEN** a consumer imports the bundle's fonts CSS from its shipped location
- **THEN** the relative `src` URLs resolve to the bundle's `fonts/` directory and every declared family renders from the shipped binaries, with no hand-authored `@font-face` required

#### Scenario: Every referenced family is shipped

- **WHEN** the bundle is inspected
- **THEN** each font family named by the built values or the design language has both a font binary in `fonts/` and a matching `@font-face` declaration in the fonts CSS

#### Scenario: Weight tokens render without synthesis

- **WHEN** any `fontWeight` token from the built values is applied to the typographic voice's face
- **THEN** the shipped face's weight coverage includes that weight

### Requirement: Bundle ships skins as complete, importable role sets

The consumer bundle SHALL contain, as importable files under its built values, one skin
file per shipped alternate skin (the base palette ships as the bundle's token CSS itself,
so it takes no override file), authored under the dedupe-safe `.ontwerp[data-skin="<name>"]`
slot (with the equivalent attribute form for whole-app adoption). Each skin file SHALL declare a
value for every colour-carrying semantic role — the skin-supplied roles and every derived
role — so that applying one skin file reskins the entire colour surface (surfaces, greys,
borders, on-ink, blooms, the disabled tier, accent, and destructive) with no hand-derivation.
Importing a skin file and setting the `data-skin` attribute SHALL be the only steps required
to apply a shipped skin over the bundle's token CSS.

#### Scenario: One skin file reskins the whole colour surface

- **WHEN** a consumer imports a shipped skin file and sets the matching `data-skin` attribute on a scoped (or whole-app) root
- **THEN** every colour-carrying role — including the greys, borders, on-ink, disabled tier, and destructive — takes the skin's value
- **AND** no role falls back to the base palette and no value is hand-derived by the consumer

#### Scenario: Danger reads as danger per skin

- **WHEN** a shipped skin is applied
- **THEN** the destructive role carries that skin's own supplied danger pigment rather than a single global value shared across skins

### Requirement: Shipped skins carry their own danger pigment

Each shipped skin SHALL supply its own value for the destructive role (`color.destructive.base`),
distinct from the accent, so that danger reads as danger against that skin's accent; the
softened destructive role SHALL derive from it. A skin SHALL NOT inherit a single global
destructive value shared across all skins.

#### Scenario: Destructive is supplied, its soft variant derived

- **WHEN** a shipped skin is inspected
- **THEN** it supplies its own `color.destructive.base`
- **AND** `color.destructive.soft` is present as a value derived from that supplied pigment

## ADDED Requirements

### Requirement: Consumer bundle ships an optional shadcn values adapter
The consumer bundle SHALL include an optional shadcn variable crosswalk under `values/shadcn/` in both whole-document and scoped forms. The crosswalk SHALL map the shadcn semantic contract to ontwerp semantic roles, including background, foreground, primary, card, border, ring, destructive, muted, and their foreground roles, without requiring consumers to hand-author those mappings.

#### Scenario: Whole-app consumer imports the adapter
- **WHEN** a consumer imports the adapter's root form alongside the root ontwerp token CSS
- **THEN** shadcn semantic variables resolve to the corresponding ontwerp semantic roles at the document root
- **AND** the focus ring resolves through `color.focus-ring` and destructive actions resolve through `color.destructive.base`

#### Scenario: Island consumer imports the adapter
- **WHEN** a consumer imports the adapter's scoped form and applies the `.ontwerp` scope to an island
- **THEN** the same shadcn variables resolve within that island
- **AND** the adapter does not establish those variables outside the island

### Requirement: Shadcn adapter is values-only
The shadcn adapter SHALL contain only custom-property declarations and explanatory comments for the crosswalk. It SHALL NOT reimplement components, define component selectors, add runtime JavaScript, load a runtime dependency, or require a consumer-side loader beyond importing CSS.

#### Scenario: Adapter stays a thin crosswalk
- **WHEN** the shipped adapter files are inspected
- **THEN** they contain no component selectors, component markup, scripts, package dependency metadata, or runtime loader
- **AND** the adapter can be consumed by importing CSS alone

### Requirement: Adapter mapping decisions are documented
The shipped adapter SHALL document the semantic judgment calls that affect interoperability, including that muted variables use the system's quiet roles, focus uses the dedicated focus-ring role rather than the accent by convention, and the radius mapping preserves the system's square-corner contract.

#### Scenario: Consumer can identify non-obvious mappings
- **WHEN** a consumer reads the adapter source
- **THEN** the meaning of muted, ring, destructive, and radius mappings is stated next to the crosswalk
- **AND** the documentation does not imply that the adapter supplies shadcn component implementations

## ADDED Requirements

### Requirement: Build emits root and scoped shadcn adapter forms
The build SHALL generate the shadcn adapter outputs from one canonical adapter source and place both the root form and the `.ontwerp`-scoped form in the consumer bundle under `values/shadcn/`. Generated outputs SHALL be deterministic and SHALL not require a second hand-maintained mapping.

#### Scenario: Adapter outputs are present after a build
- **WHEN** the build completes with valid token sources
- **THEN** the consumer bundle contains a root shadcn adapter and a `.ontwerp`-scoped shadcn adapter
- **AND** both files are importable CSS artifacts under `values/shadcn/`

#### Scenario: Root and scoped adapters cannot drift
- **WHEN** the root and scoped adapter outputs from one build are compared
- **THEN** they declare the same custom-property names and values
- **AND** they differ only in the selector context that contains those declarations

### Requirement: Adapter generation fails on incomplete role mapping
The validation or build gate SHALL reject an adapter whose declared shadcn variable crosswalk contains an unresolved ontwerp role or omits a required variable in either output form, and SHALL identify the missing or unresolved mapping.

#### Scenario: Missing role mapping fails the gate
- **WHEN** an adapter source references an unavailable ontwerp semantic role or lacks a required shadcn variable
- **THEN** the build or validation command exits unsuccessfully
- **AND** the failure identifies the adapter mapping that cannot be resolved

### Requirement: Adapter generation has no runtime dependency
The adapter build path SHALL use the repository's existing build inputs and tooling only; it SHALL not add a package dependency or execute runtime component code to produce the crosswalk.

#### Scenario: Dependency-free values build
- **WHEN** the adapter is built in the repository's normal build
- **THEN** the adapter is emitted without a new runtime package or component implementation
- **AND** the resulting files remain plain CSS values consumable without JavaScript

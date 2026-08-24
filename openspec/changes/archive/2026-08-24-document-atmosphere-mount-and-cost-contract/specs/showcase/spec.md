## ADDED Requirements

### Requirement: Shipped atmosphere CSS provides an isolated fixed-behind scope
The shipped atmosphere CSS SHALL provide the documented chrome-root mounting primitive with `isolation: isolate`, and its ambient layers SHALL be usable as descendants of the scoped root while content is lifted above `z-0`. The primitive SHALL not require ambient layers to be mounted globally or outside the token scope.

#### Scenario: Scoped atmosphere mounting is available
- **WHEN** a consumer imports the shipped atmosphere CSS and mounts the ambient stack under a chrome root
- **THEN** the chrome root can establish an isolated stacking context
- **AND** the ambient layers remain inside the scope tree
- **AND** content can be placed above the ambient layers at `z-0` or higher

#### Scenario: Atmosphere CSS does not force global mounting
- **WHEN** the shipped atmosphere CSS is inspected
- **THEN** its fixed-behind-scope primitive is scoped to the chrome-root pattern
- **AND** it does not require a global body/html ambient layer that would escape consumer boundaries

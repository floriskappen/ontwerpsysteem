## ADDED Requirements

### Requirement: Atmosphere declares its mount cardinality and cost contract
The atmosphere language and its machine-readable recipes SHALL state that the ambient stack mounts once per chrome root, never once per tile, card, or list item. The contract SHALL identify the default field limits of 6–51 particles per weather field and three blooms, and SHALL state that weather is opt-in and disabled by default.

#### Scenario: Recipe exposes the atmosphere operating envelope
- **WHEN** a consumer reads the atmosphere recipe metadata
- **THEN** it finds `mountCardinality` set to `once-per-root`
- **AND** it finds the particle and bloom limits and weather's opt-in default

#### Scenario: Per-item mounting violates the contract
- **WHEN** an atmosphere integration mounts a complete ambient stack for each tile, card, or list item
- **THEN** the integration fails the atmosphere contract because the stack is not mounted once per chrome root

### Requirement: Atmosphere documents the fixed-behind-scope mounting pattern
The atmosphere language SHALL define the supported stacking pattern: the chrome root is an isolated stacking context, ambient layers are descendants of the scoped root so they inherit its tokens, and content is lifted above `z-0` while the ambient layers remain behind it.

#### Scenario: Atmosphere remains behind scoped content
- **WHEN** a consumer applies the documented atmosphere mounting pattern
- **THEN** the chrome root has `isolation: isolate`
- **AND** ambient layers are descendants of the scope root
- **AND** content is above the ambient layers at `z-0` or higher

#### Scenario: Unisolated or out-of-scope ambience is rejected
- **WHEN** ambient layers are mounted outside the scope tree or the chrome root lacks isolation
- **THEN** the integration fails the fixed-behind-scope contract

### Requirement: Atmosphere constraints are enforced rather than prose-only
The decided particle, bloom, and weather defaults SHALL be represented by generator defaults and an executable validation check. Documentation or recipe metadata alone SHALL NOT be sufficient to satisfy the atmosphere cost contract.

#### Scenario: Cost drift fails validation
- **WHEN** a generator's default field count exceeds the declared 6–51 particle envelope or the default bloom count differs from three
- **THEN** validation fails and identifies the violated atmosphere cost limit

#### Scenario: Weather enabled by default fails validation
- **WHEN** the default atmosphere configuration mounts weather without an explicit opt-in
- **THEN** validation fails and identifies that weather must be opt-in and off by default

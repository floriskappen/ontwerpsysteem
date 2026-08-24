## ADDED Requirements

### Requirement: Atmosphere cost and default validation
The validation gate SHALL inspect the shipped atmosphere generator contract and fail when any default weather field has fewer than 6 or more than 51 particles, when the ambient bloom default is not exactly three, or when weather is enabled without explicit opt-in. The check SHALL validate executable generator/configuration defaults, not merely prose or recipe metadata.

#### Scenario: Valid atmosphere defaults pass
- **WHEN** every default weather field contains between 6 and 51 particles, the bloom default is three, and weather is disabled by default
- **THEN** the atmosphere cost validation passes

#### Scenario: Out-of-range particle default fails
- **WHEN** a default weather field contains fewer than 6 or more than 51 particles
- **THEN** validation fails and names the field and observed count

#### Scenario: Bloom count drift fails
- **WHEN** the default ambient bloom count is not three
- **THEN** validation fails and names the observed bloom count

#### Scenario: Default weather activation fails
- **WHEN** the atmosphere's default configuration enables weather without an explicit opt-in
- **THEN** validation fails and identifies the weather default

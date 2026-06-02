## MODIFIED Requirements

### Requirement: Generated outputs are separate from sources and not committed

All build outputs and generated showcase files SHALL be written to `design-system/dist/` and SHALL NOT be committed to version control on the development branch. The sole exception is the dedicated `release` branch, which exists to publish the consumer bundle: there, the assembled bundle SHALL be committed, as that branch is the distribution channel rather than a working tree.

#### Scenario: Clean build output location
- **WHEN** the build runs on the development branch
- **THEN** output files are written to `design-system/dist/` and are not committed

#### Scenario: Release branch carries the published bundle
- **WHEN** a release is published
- **THEN** the assembled consumer bundle is committed on the dedicated `release` branch, separate from the development branch's working tree

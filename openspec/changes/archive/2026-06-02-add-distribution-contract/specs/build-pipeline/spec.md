## ADDED Requirements

### Requirement: Build assembles the consumer bundle

The build SHALL assemble the consumer bundle from its built outputs and the durable design surface into a dedicated release directory under `design-system/dist/`. Assembly SHALL copy the built value outputs and embedded fonts, the `language/`, `recipes/` (including the generated index), the zoo source and its rendered `index.html`, the consumer `AGENTS.md`, `VERSION`, and `CHANGELOG.md`, and SHALL exclude development machinery. Re-assembling from unchanged inputs SHALL be deterministic.

#### Scenario: Bundle is assembled by the build
- **WHEN** the build runs
- **THEN** a release directory under `design-system/dist/` contains the consumer bundle with built values, fonts, language, recipes, zoo source, rendered `index.html`, consumer `AGENTS.md`, `VERSION`, and `CHANGELOG.md`

#### Scenario: Assembly is deterministic
- **WHEN** the bundle is assembled twice from unchanged inputs
- **THEN** the two outputs are identical

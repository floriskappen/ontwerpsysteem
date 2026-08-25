## ADDED Requirements

### Requirement: A release is published only against a readiness report

The repository SHALL produce, before any release is drafted for publication, a durable
release-readiness report recording: the result of every quality gate (build, validation, test
suite, strict spec validation) at the state proposed for release, the drafted changelog entry
with its BREAKING marks and per-ID migration notes, and the explicit list of steps that remain
human-approved. The report lives in the development repository's documentation (not the consumer
bundle), so a human approving a publish can verify the evidence without re-deriving it.

#### Scenario: An approver finds the evidence

- **WHEN** a human reviews a proposed release
- **THEN** a readiness report exists in the repo docs recording gate results and the drafted
  entry with migration notes
- **AND** it names the steps that still require human approval and have not been performed

#### Scenario: The report is not shipped to consumers

- **WHEN** the consumer bundle is assembled
- **THEN** it contains no readiness report — the report is development-side governance material

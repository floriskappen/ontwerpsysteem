## MODIFIED Requirements

### Requirement: Validation gate enforces the contract

The validation gate SHALL run the full conformance check (DTCG JSON Schema, naming grammar, tier/reference rules, alias resolution) over all files located under `design-system/source/values/`. The gate SHALL exit non-zero on any violation.

#### Scenario: Validation of the new values path
- **WHEN** the validation gate is executed
- **THEN** it scans the files under `design-system/source/values/` and reports any non-conforming tokens

## Purpose

Defines trustworthy release-readiness evidence for the design system by separating reproducible repository gates from checks that require explicit human approval or observation.

## ADDED Requirements

### Requirement: Readiness reports record exact observed gate evidence

The release-readiness report SHALL identify the repository state and record the observed result of build, validation, tests, strict OpenSpec validation, and reproducibility checks, including exact counts where a gate reports them. It SHALL distinguish machine-observed results from human-owned checks.

#### Scenario: Stale or incomplete gate evidence fails review
- **WHEN** the readiness report omits an executed gate, gives a count that differs from the current gate output, or presents an unobserved human/device check as complete
- **THEN** readiness review fails and names the stale, missing, or unsupported evidence

#### Scenario: Current machine evidence and human ownership are separated
- **WHEN** the report is reconciled after the final correction commit
- **THEN** it records only observed results from the current build, validation, test, strict-spec, and reproducibility runs, and labels browser/device or release-approval checks as human-owned when they have not been performed

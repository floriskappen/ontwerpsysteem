## MODIFIED Requirements

### Requirement: Coherence correction remains bounded

A coherence correction SHALL preserve the accepted showcase baseline and existing gates, and SHALL NOT add a component, skin, effect, dependency, version change, downstream pin change, release publication/tag, or visual redesign. It SHALL add only targeted regression coverage needed to protect the corrected contract, and its readiness evidence SHALL report only observed machine results while leaving human/device checks explicitly human-owned.

#### Scenario: Out-of-scope correction is rejected

- **WHEN** the change alters the accepted baseline, adds a component, skin, effect, dependency, version or release artifact, changes a downstream pin, publishes or tags a release, introduces a visual redesign, or records fabricated human/device evidence
- **THEN** review fails and the correction is not accepted

#### Scenario: Bounded correction preserves gates and baseline

- **WHEN** the correction is checked against the accepted baseline and existing build, validation, test, and strict-spec gates
- **THEN** the baseline remains unchanged, all existing gates remain runnable, and any added regression is targeted to the corrected contract

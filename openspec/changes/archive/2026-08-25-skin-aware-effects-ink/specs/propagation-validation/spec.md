## ADDED Requirements

### Requirement: Effect ink skin regression gate

The validation and regression suite SHALL verify that the shipped effect styles use the
existing skin-overridable ink role for every ink-painted grid, wind, rain, splash, mote, and
snow layer. The check SHALL exercise all shipped alternate skins against both consumer CSS
forms and SHALL identify any effect declaration that remains on the base cream ink literal.

#### Scenario: All shipped skins recolour ink effects

- **WHEN** the focused effect-ink regression runs for every shipped alternate skin
- **THEN** the grid, wind streaks and motes, rain drops and splashes, and snow outlines resolve to each skin's ink role in both root and scoped generated CSS

#### Scenario: A stranded effect ink literal fails

- **WHEN** a shipped effect declaration uses the base cream ink literal instead of the skin-overridable ink role
- **THEN** the regression fails and identifies the affected effect family and declaration

### Requirement: Coherence correction remains bounded

A coherence correction SHALL preserve the accepted showcase baseline and existing gates, and
SHALL NOT add a component, skin, effect, dependency, version change, downstream pin change,
release publication/tag, or visual redesign. It SHALL add only targeted regression coverage
needed to protect the corrected contract.

#### Scenario: Out-of-scope correction is rejected

- **WHEN** the change alters the accepted baseline, adds a component, skin, effect, dependency, version or release artifact, changes a downstream pin, publishes or tags a release, or introduces visual redesign
- **THEN** review fails and the correction is not accepted

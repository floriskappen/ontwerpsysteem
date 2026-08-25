## ADDED Requirements

### Requirement: Motion contract validation

The validation gate SHALL inspect the authored motion values, design-language recipes, and shipped CSS and fail when interaction motion exposes a CSS transition or smooth easing affordance, or when periodic atmosphere animation uses continuous easing instead of stepped timing. The check SHALL retain the existing shipped-keyframe reduced-motion coverage gate.

#### Scenario: Smooth interaction affordance fails validation

- **WHEN** an authored motion value, recipe, or shipped interaction rule declares a generic transition or continuous easing
- **THEN** validation fails and identifies the smooth interaction affordance

#### Scenario: Smooth atmosphere timing fails validation

- **WHEN** a shipped periodic atmosphere animation uses `ease`, `linear`, or cubic easing rather than stepped timing
- **THEN** validation fails and identifies the atmosphere animation

#### Scenario: Stepped motion with reduced-motion coverage passes

- **WHEN** interaction rules have no transitions or smooth easing, periodic atmosphere animation uses stepped timing, and every shipped keyframe has its required reduced-motion rest pose
- **THEN** the motion contract validation passes

#### Scenario: Out-of-scope correction is rejected

- **WHEN** the correction changes the accepted showcase baseline, adds a component, skin, effect, dependency, version, or release artifact, or introduces a visual redesign
- **THEN** the change fails review and must not be accepted as motion-contract consistency work

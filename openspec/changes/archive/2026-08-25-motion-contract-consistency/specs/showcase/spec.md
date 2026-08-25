## MODIFIED Requirements

### Requirement: Showcase honours motion and focus accessibility

The showcase SHALL honour `prefers-reduced-motion`: when reduced motion is requested, every animated state and effect it renders — the lifecycle states, the ambient atmosphere layers, the particle fields, and the per-glyph header weather — SHALL stop its animation and settle into a deliberate, legible rest pose (a settled frame, or removal of an ambient field), rather than continuing to play or freezing mid-cycle. Each reduced-motion rest-pose rule SHALL be authored in the same style source module as the animation it neutralises, not in a separate reduced-motion-only stylesheet, so the accessible fallback ships wherever the animation ships. Interactive components SHALL show a visible focus indicator on keyboard focus. Interactions SHALL remain immediate without CSS transitions or smooth easing, and periodic atmosphere motion SHALL use stepped timing rather than continuous easing. The correction SHALL preserve the accepted showcase baseline and shall not add components, skins, effects, dependencies, or visual redesign.

#### Scenario: Reduced motion settles every animated surface

- **WHEN** the viewer has `prefers-reduced-motion` set
- **THEN** every animated state and effect — including the per-glyph header weather — has its animation stopped and holds a deliberate rest pose, or is removed if it is an ambient field
- **AND** none continues animating or holds a frozen mid-cycle frame

#### Scenario: Reduced motion is respected

- **WHEN** the viewer has `prefers-reduced-motion` set
- **THEN** ambient animation does not play

#### Scenario: Rest-pose rules are co-located with their animation

- **WHEN** a style source module that declares an animation is inspected
- **THEN** the reduced-motion rest-pose rule that neutralises that animation is present in the same module
- **AND** no separate reduced-motion-only stylesheet carries it

#### Scenario: Focus is visible

- **WHEN** an interactive component receives keyboard focus
- **THEN** a visible focus indicator is shown

#### Scenario: Interactions and periodic atmosphere retain the motion contract

- **WHEN** the generated showcase and shipped CSS are inspected
- **THEN** interactive rules contain no CSS transition or smooth easing affordance
- **AND** periodic atmosphere animation timing uses stepped timing rather than `ease`, `linear`, or cubic easing

#### Scenario: Accepted baseline remains the visual oracle

- **WHEN** the change is built from unchanged non-motion inputs
- **THEN** the generated showcase remains byte-identical to the accepted baseline
- **AND** no new component, skin, effect, dependency, or visual redesign is introduced

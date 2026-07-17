# showcase Delta — add-scoped-css-distribution

## ADDED Requirements

### Requirement: Showcase consumes the shipped keyframe names

The showcase's animation CSS SHALL declare and reference its keyframes under the same `ontwerp-`-prefixed names that appear in the shipped CSS bundles, drawn from the same style source files, so the showcase exercises exactly the animation names consumers receive and no second, unprefixed set of names exists.

#### Scenario: Showcase and shipped bundles share one set of keyframe names

- **WHEN** the generated showcase is scanned
- **THEN** every `@keyframes` it declares carries the `ontwerp-` prefix
- **AND** each such name also appears in the shipped CSS bundles built from the same sources

#### Scenario: A keyframe edit propagates to both surfaces

- **WHEN** a keyframe in a style source file is changed and the system is rebuilt
- **THEN** the generated showcase and the shipped effects bundle both reflect the change

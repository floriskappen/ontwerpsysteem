## MODIFIED Requirements

### Requirement: Motion language documents the reduced-motion rest-pose rule

The motion language documentation under `design-system/language/` SHALL state, normatively, that every animated state or effect requires a deliberate reduced-motion rest pose — a settled, legible frame the surface holds when `prefers-reduced-motion` is requested — and that an animated state shipped without one is incomplete rather than optional polish. It SHALL describe the rest pose as a stopped animation together with an explicit rest frame (or the removal of an ambient field), distinct from a frozen mid-cycle frame, and SHALL state that interactions are immediate while periodic motion uses stepped timing without smooth easing affordances.

#### Scenario: Reader finds the rest-pose rule stated normatively

- **WHEN** a reader consults the motion language documentation
- **THEN** it states that every animated state or effect requires a deliberate reduced-motion rest pose
- **AND** it states that an animated state without one is incomplete, not optional polish

#### Scenario: Reader finds the stepped-motion rule stated normatively

- **WHEN** a reader consults the motion language documentation
- **THEN** it states that interactions are immediate and periodic motion is stepped rather than smoothly eased

#### Scenario: Smooth motion affordances are rejected by the documented contract

- **WHEN** a motion recipe or language example declares a generic transition or continuous easing for an interaction or periodic effect
- **THEN** the design-language validation fails and identifies the conflicting smooth-motion affordance

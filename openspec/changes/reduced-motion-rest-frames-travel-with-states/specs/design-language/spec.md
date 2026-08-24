## ADDED Requirements

### Requirement: Motion language documents the reduced-motion rest-pose rule

The motion language documentation under `design-system/language/` SHALL state, normatively, that every animated state or effect requires a deliberate reduced-motion rest pose — a settled, legible frame the surface holds when `prefers-reduced-motion` is requested — and that an animated state shipped without one is incomplete rather than optional polish. The documentation SHALL describe the rest pose as a stopped animation together with an explicit rest frame (or the removal of an ambient field), distinct from a frozen mid-cycle frame.

#### Scenario: Reader finds the rest-pose rule stated normatively

- **WHEN** a reader consults the motion language documentation
- **THEN** it states that every animated state or effect requires a deliberate reduced-motion rest pose
- **AND** it states that an animated state without one is incomplete, not optional polish

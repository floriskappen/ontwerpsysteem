# design-language Delta

## ADDED Requirements

### Requirement: Stepped-height reveal is a registered motion recipe

The design language SHALL register a stepped-height reveal motion recipe
(`motion.reveal.stepped-height`) in `design-system/recipes/` carrying the full recipe shape
(stable unique ID, intent, usage rules, source module references, value references, and a
`reducedMotion` field). The recipe SHALL define reveal as a one-shot animation on the
system's stepped clock whose container grows from zero to its intrinsic block size, and SHALL state the
boundary that separates it from an interaction: an element already rendered changes state
immediately, while a surface that was not previously rendered grows in stepped frames.
Its content SHALL NOT carry per-member delay, opacity animation, or transform animation.

#### Scenario: Reveal recipe is registered and complete

- **WHEN** the recipes are compiled and validated
- **THEN** `motion.reveal.stepped-height` is present with a stable ID, intent, usage rules,
  resolvable source module and value references, and a `reducedMotion` field

#### Scenario: The reveal boundary is documented

- **WHEN** a consumer reads the motion language document
- **THEN** it states that a state change on an already-rendered element is immediate and
  that a newly-rendered surface grows to its intrinsic height on the stepped clock
- **AND** it states that reveal is not licence for a transition or an easing curve on an
  interaction

### Requirement: Reveal surfaces are registered chrome primitives

The design language SHALL register a component recipe for each reveal surface — a
dropdown menu, a popover note, a dialog sheet, and a disclosure fold — in
`design-system/recipes/`, and SHALL document them in the components language prose. Each
recipe SHALL carry the full recipe shape and SHALL name `motion.reveal.stepped-height` as the
motion it composes. The dialog-sheet recipe SHALL state that it is a non-modal surface
that neither traps focus nor renders an inert backdrop, and SHALL name the native modal
element as the route for a consumer requiring one.

#### Scenario: Each reveal-surface recipe is registered and complete

- **WHEN** the recipes are compiled and validated
- **THEN** each of the four reveal-surface recipes is present with a stable ID, intent,
  usage rules, resolvable source module and value references, and a `reducedMotion` field
- **AND** each names the staggered-reveal motion recipe it composes

#### Scenario: The sheet's modality limits are documented

- **WHEN** a consumer reads the dialog-sheet recipe
- **THEN** it states that the sheet does not trap focus or render an inert backdrop
- **AND** it names the native modal element as the route for a consumer requiring one

### Requirement: Cards and popover notes are opaque paper

The design language SHALL map standard cards and popover notes to an opaque paper role.
Neither surface SHALL use an alpha-bearing claim role that permits atmosphere or content
behind it to show through.

#### Scenario: Opaque component grounds are registered

- **WHEN** card values and the popover-note recipe are inspected
- **THEN** both reference an opaque paper role
- **AND** their rendered backgrounds fully mask the surface behind them

## MODIFIED Requirements

### Requirement: Motion language documents the reduced-motion rest-pose rule

The motion language documentation under `design-system/language/` SHALL state, normatively, that every animated state or effect requires a deliberate reduced-motion rest pose — a settled, legible frame the surface holds when `prefers-reduced-motion` is requested — and that an animated state shipped without one is incomplete rather than optional polish. It SHALL describe the rest pose as a stopped animation together with an explicit rest frame (or the removal of an ambient field), distinct from a frozen mid-cycle frame, and SHALL state that a state change on an already-rendered element is immediate while periodic motion and the arrival of a newly-rendered surface both use stepped timing without smooth easing affordances.

#### Scenario: Reader finds the rest-pose rule stated normatively

- **WHEN** a reader consults the motion language documentation
- **THEN** it states that every animated state or effect requires a deliberate reduced-motion rest pose
- **AND** it states that an animated state without one is incomplete, not optional polish

#### Scenario: Reader finds the stepped-motion rule stated normatively

- **WHEN** a reader consults the motion language documentation
- **THEN** it states that a state change on an already-rendered element is immediate and that periodic motion and surface arrival are stepped rather than smoothly eased

#### Scenario: Smooth motion affordances are rejected by the documented contract

- **WHEN** a motion recipe or language example declares a generic transition or continuous easing for an interaction, a periodic effect, or a surface reveal
- **THEN** the design-language validation fails and identifies the conflicting smooth-motion affordance

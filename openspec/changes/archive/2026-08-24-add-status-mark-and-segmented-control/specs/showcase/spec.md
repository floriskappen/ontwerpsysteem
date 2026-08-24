# showcase Delta

## ADDED Requirements

### Requirement: Showcase presents the status mark and segmented control in use

The showcase SHALL render both the static status mark and the segmented control as worked
examples, styled through the system's tokens like the other components. The status mark's
fail treatment SHALL draw its colour from the `color.destructive` role rather than the
accent, and neither primitive SHALL use a green-check or checkbox glyph. The segmented
control SHALL present a selected cell that inverts the unselected treatment, and its switch
SHALL be immediate, with no transition or slide. Because both primitives are transition-free,
the showcase SHALL introduce no `@keyframes` for them.

#### Scenario: Both primitives are shown token-styled

- **WHEN** the showcase is generated
- **THEN** it renders the status mark (pass / fail / warn) and the segmented control, with
  their colours drawn from the system's token custom properties

#### Scenario: The fail mark uses the destructive role, not the accent

- **WHEN** the status mark's fail treatment is rendered
- **THEN** its colour resolves from the `color.destructive` role and is confined to a rule,
  not the accent and not a filled success glyph

#### Scenario: Status is not a green tick or checkbox

- **WHEN** the status mark is rendered
- **THEN** it shows status without a green-check icon or a checkbox glyph

#### Scenario: The segmented switch is immediate

- **WHEN** the selected cell of the segmented control changes
- **THEN** the selected cell inverts the unselected treatment instantly, with no transition
  or slide, and no `@keyframes` drives the switch

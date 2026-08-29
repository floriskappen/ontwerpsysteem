# showcase Delta

## ADDED Requirements

### Requirement: Showcase renders the reveal surfaces without script

The showcase SHALL render a worked example of each reveal surface — a dropdown menu, a
popover note, a dialog sheet, and a disclosure fold — styled from the built tokens. It
SHALL drive their open state through native platform state (the disclosure element's open
attribute and the popover attribute with its invoker) and SHALL NOT introduce a script to
the generated page, which remains a single self-contained HTML file.

#### Scenario: Each reveal surface is shown token-styled

- **WHEN** the showcase is rebuilt
- **THEN** the dropdown menu, popover note, dialog sheet, and disclosure fold are rendered
  from the live built tokens

#### Scenario: The generated page carries no script

- **WHEN** the generated showcase page is inspected
- **THEN** it contains no script element
- **AND** each reveal surface's open state is driven by native platform state

### Requirement: Reveal surfaces grow on the stepped clock

The showcase SHALL animate each reveal surface's container from zero to its intrinsic
block size with a short one-shot stepped animation. Its content SHALL NOT animate or
stagger independently, and the reveal SHALL NOT use a CSS transition or a smooth easing
literal. The invoking interaction itself SHALL remain immediate.

#### Scenario: Container height arrives stepped

- **WHEN** a reveal surface's styles are inspected
- **THEN** its reveal container carries a stepped block-size animation
- **AND** its members carry no animation or index-keyed delay
- **AND** no transition declaration or smooth easing literal appears in the reveal path

### Requirement: Reveal surfaces hold a fully-arrived rest pose

Each reveal surface's reduced-motion rest pose SHALL hold the surface fully arrived —
its reveal container at intrinsic block size with the animation stopped — and SHALL be
authored in the same style source module as the reveal animation it neutralises.

#### Scenario: Reduced motion holds every member arrived

- **WHEN** the viewer has `prefers-reduced-motion` set and a reveal surface is opened
- **THEN** every reveal container is at intrinsic block size with its animation stopped
- **AND** none is held mid-arrival

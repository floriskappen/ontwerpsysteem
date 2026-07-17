# showcase Spec Delta

## MODIFIED Requirements

### Requirement: Showcase demonstrates theming by swapping colour roles

The showcase SHALL demonstrate the system's "theme by swapping" principle by presenting
alternate skins that change only colour roles (surface, ink, accent, border) while the
structure, type and components stay identical, switchable in-page without a server or
network. The reskin SHALL work through the built, alias-preserving token CSS: the
showcase SHALL NOT re-declare or re-link built token custom properties to make the swap
cascade — overriding the colour-role custom properties alone restyles the components.
These demo skins are illustrative of the swap mechanism and SHALL be presented
as a demonstration; they SHALL NOT be represented as the system's shipped token set.

#### Scenario: The reskin is shown by swapping only colour roles

- **WHEN** the viewer switches between the demo skins
- **THEN** only the colour roles change while the same layout, type and components remain
- **AND** switching works with no server and no network request

#### Scenario: The swap cascades through the built output alone

- **WHEN** the showcase source styles are inspected
- **THEN** they contain no re-declaration of built token custom properties whose purpose is to re-link component tokens to colour roles
- **AND** a demo-skin override of the colour roles still restyles buttons, fields, cards, badges, and links

#### Scenario: Demo skins are not misrepresented as shipped tokens

- **WHEN** the theming demo is shown
- **THEN** it is presented as an illustrative demonstration of swapping, distinct from the
  system's real palette drawn from the build outputs

### Requirement: Components are shown in use with real interaction

The showcase SHALL present a curated set of representative components (such as buttons, fields, folio marks, and a card) as they actually appear, styled through the system's component and semantic tokens. Every colour a component style paints — including decorative layers such as the button's halftone dot screen — SHALL be drawn from token custom properties, not hardcoded colour literals, so a colour-role override reskins the whole component. Interaction states SHALL be shown through real CSS states (hover, focus) rather than an enumerated grid of every state.

#### Scenario: Components styled from tokens

- **WHEN** a component is shown
- **THEN** its appearance derives from the system's tokens via the built CSS custom properties
- **AND** its decorative layers (such as the button halftone) take their colour from token custom properties rather than hardcoded colour values

#### Scenario: States are real, not enumerated

- **WHEN** a user hovers or focuses a component
- **THEN** the component responds with its real interaction state
- **AND** the page does not render a fixed grid of every state

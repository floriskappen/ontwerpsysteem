## MODIFIED Requirements

### Requirement: Showcase demonstrates theming by swapping colour roles

The showcase SHALL demonstrate the system's "theme by swapping" principle by presenting
alternate skins that change only colour roles while the structure, type and components stay
identical, switchable in-page without a server or network. Each demo skin SHALL apply a
complete colour role set — the skin-supplied roles plus every derived role — so the full
colour surface moves per theme: surfaces, ink, accent, borders, tertiary greys, the disabled
tier, blooms, destructive, and every shipped grid or weather effect that paints ink. The demo
skins SHALL be generated from the canonical skin source (never hand-authored partial overrides),
so the theme bar exercises the same complete skins the bundle ships. The reskin SHALL work
through the built, alias-preserving token CSS: the showcase SHALL NOT re-declare or re-link
built component token custom properties to make the swap cascade — a skin declares the
semantic colour roles and the component and effect layers follow their live aliases. These
demo skins are illustrative of the swap mechanism and SHALL be presented as a demonstration;
they SHALL NOT be represented as the system's shipped token set.

#### Scenario: The reskin swaps the complete colour role set

- **WHEN** the viewer switches between the demo skins
- **THEN** the whole colour surface changes — surfaces, ink, accent, borders, tertiary greys, the disabled tier, blooms, destructive, and ink-painted grid and weather effects — while the same layout, type and components remain
- **AND** switching works with no server and no network request

#### Scenario: Effect ink follows the selected skin

- **WHEN** the viewer switches to any alternate demo skin
- **THEN** every shipped grid, wind, rain, splash, mote, and snow effect resolves its ink from that skin's colour role rather than the base paper/ink literal

#### Scenario: The reskin is shown by swapping only colour roles

- **WHEN** the viewer switches between the demo skins
- **THEN** only the colour roles change while the same layout, type and components remain
- **AND** switching works with no server and no network request

#### Scenario: The swap cascades through the built output alone

- **WHEN** the showcase source styles are inspected
- **THEN** they contain no re-declaration of built component token custom properties or hardcoded effect ink literals whose purpose would strand a skin on the base palette
- **AND** a demo skin's colour-role values restyle buttons, fields, cards, badges, links, ambient blooms, and ink-painted effects

#### Scenario: Demo skins are generated, not hand-authored partial overrides

- **WHEN** the theme bar's skin data is inspected
- **THEN** it is generated from the canonical skin source and carries each skin's complete role set
- **AND** it is not a hand-authored subset that leaves derived roles or effect ink on the base palette

#### Scenario: Demo skins are not misrepresented as shipped tokens

- **WHEN** the theming demo is shown
- **THEN** it is presented as an illustrative demonstration of swapping, distinct from the system's real palette drawn from the build outputs

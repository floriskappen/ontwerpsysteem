## ADDED Requirements

### Requirement: Showcase demonstrates theming by swapping colour roles

The showcase SHALL demonstrate the system's "theme by swapping" principle by presenting
alternate skins that change only colour roles (surface, ink, accent, border) while the
structure, type and components stay identical, switchable in-page without a server or
network. These demo skins are illustrative of the swap mechanism and SHALL be presented
as a demonstration; they SHALL NOT be represented as the system's shipped token set.

#### Scenario: The reskin is shown by swapping only colour roles

- **WHEN** the viewer switches between the demo skins
- **THEN** only the colour roles change while the same layout, type and components remain
- **AND** switching works with no server and no network request

#### Scenario: Demo skins are not misrepresented as shipped tokens

- **WHEN** the theming demo is shown
- **THEN** it is presented as an illustrative demonstration of swapping, distinct from the
  system's real palette drawn from the build outputs

## MODIFIED Requirements

### Requirement: Showcase renders only from built outputs

The showcase SHALL draw the design system's real values exclusively from build artifacts
under `dist/` — the token manifest and the built CSS — and SHALL NOT read or re-resolve
token source files under `tokens/`, so the system as shown is always what ships.
Clearly-illustrative demonstration content (such as the theming-by-swapping skins) is
permitted provided it does not misrepresent the shipped token set.

#### Scenario: Showcase reflects the built set

- **WHEN** the tokens change and the build is re-run
- **THEN** the showcase reflects the new built values with no edit to the showcase itself

#### Scenario: Sources are never read directly

- **WHEN** the showcase is generated
- **THEN** it consumes only artifacts under `dist/` and does not read files under `tokens/`

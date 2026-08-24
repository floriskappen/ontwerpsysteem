## ADDED Requirements

### Requirement: Bundle ships skins as complete, importable role sets

The consumer bundle SHALL contain, as importable files under its built values, one skin
file per shipped alternate skin (the base palette ships as the bundle's token CSS itself,
so it takes no override file), authored under the dedupe-safe `.ontwerp[data-skin="<name>"]`
slot (with the equivalent attribute form for whole-app adoption). Each skin file SHALL declare a
value for every colour-carrying semantic role — the skin-supplied roles and every derived
role — so that applying one skin file reskins the entire colour surface (surfaces, greys,
borders, on-ink, blooms, the disabled tier, accent, and destructive) with no hand-derivation.
Importing a skin file and setting the `data-skin` attribute SHALL be the only steps required
to apply a shipped skin over the bundle's token CSS.

#### Scenario: One skin file reskins the whole colour surface

- **WHEN** a consumer imports a shipped skin file and sets the matching `data-skin` attribute on a scoped (or whole-app) root
- **THEN** every colour-carrying role — including the greys, borders, on-ink, disabled tier, and destructive — takes the skin's value
- **AND** no role falls back to the base palette and no value is hand-derived by the consumer

#### Scenario: Danger reads as danger per skin

- **WHEN** a shipped skin is applied
- **THEN** the destructive role carries that skin's own supplied danger pigment rather than a single global value shared across skins

### Requirement: Shipped skins carry their own danger pigment

Each shipped skin SHALL supply its own value for the destructive role (`color.destructive.base`),
distinct from the accent, so that danger reads as danger against that skin's accent; the
softened destructive role SHALL derive from it. A skin SHALL NOT inherit a single global
destructive value shared across all skins.

#### Scenario: Destructive is supplied, its soft variant derived

- **WHEN** a shipped skin is inspected
- **THEN** it supplies its own `color.destructive.base`
- **AND** `color.destructive.soft` is present as a value derived from that supplied pigment

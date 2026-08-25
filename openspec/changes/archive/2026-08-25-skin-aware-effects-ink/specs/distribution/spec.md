## MODIFIED Requirements

### Requirement: Bundle ships skins as complete, importable role sets

The consumer bundle SHALL contain, as importable files under its built values, one skin
file per shipped alternate skin (the base palette ships as the bundle's token CSS itself,
so it takes no override file), authored under the dedupe-safe `.ontwerp[data-skin="<name>"]`
slot (with the equivalent attribute form for whole-app adoption). Each skin file SHALL declare a
value for every colour-carrying semantic role — the skin-supplied roles and every derived
role — so that applying one skin file reskins the entire colour surface (surfaces, greys,
borders, on-ink, blooms, the disabled tier, accent, destructive, and ink-painted effects)
with no hand-derivation. The generated effects CSS SHALL resolve effect ink through the
same skin-overridable colour role rather than a base-palette literal. Importing a skin file
and setting the `data-skin` attribute SHALL be the only steps required to apply a shipped skin
over the bundle's token CSS.

#### Scenario: One skin file reskins the whole colour surface

- **WHEN** a consumer imports a shipped skin file and sets the matching `data-skin` attribute on a scoped (or whole-app) root
- **THEN** every colour-carrying role — including the greys, borders, on-ink, disabled tier, destructive, blooms, and effect ink — takes the skin's value
- **AND** no role falls back to the base palette and no value is hand-derived by the consumer

#### Scenario: Effect CSS keeps ink skin-aware

- **WHEN** the root and scoped effects CSS outputs are inspected after a build
- **THEN** all shipped grid, wind, rain, splash, mote, and snow ink declarations resolve through the existing ink role/custom property
- **AND** neither output contains the base cream ink literal in those declarations

#### Scenario: Danger reads as danger per skin

- **WHEN** a shipped skin is applied
- **THEN** the destructive role carries that skin's own supplied danger pigment rather than a single global value shared across skins

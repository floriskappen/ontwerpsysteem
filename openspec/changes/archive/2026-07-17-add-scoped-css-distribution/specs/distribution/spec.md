# distribution Delta — add-scoped-css-distribution

## ADDED Requirements

### Requirement: Bundle ships scope-aware CSS targets

The consumer bundle SHALL contain, as importable files under its built values, both the `:root` token CSS and the scoped CSS targets — the scoped token CSS, the scoped component CSS bundle, and the scoped effects CSS bundle — so an application can adopt the system whole-app or mount it as an island under the scope class without copying, editing, or re-scoping any shipped file.

#### Scenario: Island adoption is import-only

- **WHEN** a consumer imports the scoped token, component, and effects CSS and applies the scope class to an element
- **THEN** the system's tokens, component classes, and effects apply within that element's subtree
- **AND** no shipped file needed to be copied or re-scoped by the consumer

#### Scenario: Whole-app adoption needs no scope class

- **WHEN** a consumer imports the `:root` token CSS
- **THEN** the token custom properties apply document-wide with no scope class required

### Requirement: Bundle ships a boundary reset primitive

The shipped CSS SHALL include a `.ontwerp-boundary` class that stops the system's inherited voice at a descendant seam inside a scoped (or whole-app) subtree. The boundary SHALL re-point the font slots (`--font-sans`, `--font-heading`) to a consumer-overridable custom property (`--ontwerp-boundary-font`) whose default is a neutral system stack, and SHALL pin the inherited voice properties (`font-family`, `text-transform`, `letter-spacing`) so the system's voice does not cascade past the boundary.

#### Scenario: Boundary neutralises the inherited voice

- **WHEN** `.ontwerp-boundary` is applied to an element that is a descendant of a scope root
- **THEN** text within that element renders in the neutral default stack with initial transform and spacing, not in the system's voice

#### Scenario: Consumer re-points the boundary font

- **WHEN** a consumer sets `--ontwerp-boundary-font` on or above a boundary element
- **THEN** the bounded subtree renders in that font stack instead of the neutral default

### Requirement: Skin overrides use a dedupe-safe selector slot

The scoped distribution SHALL reserve a documented selector shape for skin overrides that is distinct from the base scope selector: `.ontwerp[data-skin="<name>"]` (with the equivalent attribute form for whole-app adoption). Because the slot's selector differs from the base token block's, CSS bundlers that deduplicate same-selector custom-property rules cannot drop the override. The bundle's consumer documentation SHALL state that skins apply via this slot and that a second bare scope-class rule is not a supported override mechanism.

#### Scenario: Skin override survives same-selector deduplication

- **WHEN** a skin override authored on `.ontwerp[data-skin="<name>"]` is processed by a bundler that deduplicates same-selector custom-property rules
- **THEN** the override remains in the output and takes effect on elements carrying both the scope class and the matching `data-skin` attribute

#### Scenario: The slot is documented

- **WHEN** the bundle's consumer documentation is inspected
- **THEN** it names the `data-skin` selector slot as the supported way to apply a skin over the scoped tokens

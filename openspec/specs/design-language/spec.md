# design-language Specification

## Purpose
Captures the system's durable design language so agents can understand and reuse it without reverse-engineering the zoo: human-readable principles in Markdown under `design-system/language/` and machine-readable recipes in JSON under `design-system/recipes/`. Recipes carry stable IDs, intent, usage rules, and references to the source modules and values that implement them, and are compiled into a single index for external consumption.

## Requirements

### Requirement: Structured design language principles and recipes

The design system SHALL define a durable design language comprising human-readable principles in Markdown files under `design-system/language/` and machine-readable recipes in JSON files under `design-system/recipes/`. Recipes SHALL define stable, unique IDs and specify their intent, usage rules, source modules, and value references.

#### Scenario: Valid recipe definition
- **WHEN** a recipe JSON file contains a stable ID, intent, usage rules, source module references, and value references
- **THEN** the recipe is considered valid and registered in the system

### Requirement: Design language index manifest

The design system SHALL generate an index of all recipes as a structured JSON file at `design-system/recipes/index.json` compiling all registered recipes for easy consumption by external agents.

#### Scenario: Manifest compiles all recipes
- **WHEN** the recipes are compiled by the validation or build tool
- **THEN** `design-system/recipes/index.json` is updated to include all recipe metadata and references

### Requirement: Colour language document enumerates the complete role contract

`design-system/language/colour.md` SHALL contain a roles table with one row per semantic
colour role, giving: the role's token path, what may consume it (which components or
layers), and its provenance — skin-supplied, or derived with the ID of the derivation
rule that produces it. The validation gate SHALL check the table against the token
source: a semantic colour token absent from the table, a table row naming a role with no
corresponding token, or a table row whose provenance contradicts the token's declared
provenance SHALL each fail validation.

#### Scenario: Semantic colour token missing from the roles table

- **WHEN** a semantic token of type `color` exists in the token source but no roles-table
  row names it
- **THEN** validation fails, naming the uncovered token

#### Scenario: Roles-table row without a backing token

- **WHEN** a roles-table row names a role for which no semantic colour token exists
- **THEN** validation fails, naming the stale row

#### Scenario: Roles-table provenance contradicts token metadata

- **WHEN** a roles-table row states a provenance different from the token's declared
  `ontwerp.role` provenance
- **THEN** validation fails, identifying the mismatched role

### Requirement: Colour derivation rules are registered machine-readably

Colour derivation rules SHALL be registered in
`design-system/language/colour.derivations.json`. Each rule SHALL define a stable unique
ID, its input roles, and its formula (a mix ratio or an alpha step over its inputs)
precisely enough that an implementation can compute the derived value from the inputs
alone. Every input SHALL reference a semantic colour role whose declared provenance is
skin-supplied, so that a complete skin is exactly the set of supplied roles and every
other colour computes from them. `language/colour.md` SHALL document the same rules in
prose alongside the roles table.

#### Scenario: Registry entry missing a required field

- **WHEN** a derivation rule entry lacks an ID, input roles, or a formula
- **THEN** validation fails, naming the incomplete rule

#### Scenario: Duplicate derivation rule IDs

- **WHEN** two registry entries declare the same rule ID
- **THEN** validation fails, naming the colliding ID

#### Scenario: Derivation input references a non-supplied role

- **WHEN** a derivation rule's input names a role that does not exist or whose provenance
  is not skin-supplied
- **THEN** validation fails, identifying the rule and the invalid input

### Requirement: Type language documents scope-safe font application

The type language documentation under `design-system/language/` SHALL document font application as a scoped concern: the typographic voice (font families and the inherited voice properties) is set on the consumer's scope root element, never on `html` or `body`, so the voice cannot cascade into subtrees that must stay neutral. The documentation SHALL reference the boundary primitive as the escape hatch for excluding a descendant subtree inside a scoped region.

#### Scenario: Consumer finds the scoped-application rule

- **WHEN** a consumer reads the type language documentation
- **THEN** it states that the voice is applied at the scope root, states that `html`/`body` application is not the supported path, and points to the boundary primitive for neutral descendant subtrees

### Requirement: The utility mark is reserved for data

The type language documentation SHALL state, normatively, the scope of the mono-uppercase utility mark: it is for **data** — numerals, counts, measurements, machine identifiers, and coded events, where a monospaced face genuinely encodes "measured value / code". Prose labels, subtitles, section headers, taxonomy tags, and eyebrows are NOT utility marks: they stay in the Archivo lowercase voice. The documentation SHALL name this split explicitly enough that a consumer reaching for a small label style does not default to mono-uppercase.

#### Scenario: A reader can tell data marks from prose labels

- **WHEN** a reader consults the type language documentation to style a small label
- **THEN** they find mono-uppercase reserved for data/identifiers/coded values with examples of each
- **AND** they find prose labels, subtitles, and eyebrows assigned to the Archivo lowercase voice, with the statement that mono-uppercase on prose is out of system

### Requirement: Motion language documents the reduced-motion rest-pose rule

The motion language documentation under `design-system/language/` SHALL state, normatively, that every animated state or effect requires a deliberate reduced-motion rest pose — a settled, legible frame the surface holds when `prefers-reduced-motion` is requested — and that an animated state shipped without one is incomplete rather than optional polish. It SHALL describe the rest pose as a stopped animation together with an explicit rest frame (or the removal of an ambient field), distinct from a frozen mid-cycle frame, and SHALL state that interactions are immediate while periodic motion uses stepped timing without smooth easing affordances.

#### Scenario: Reader finds the rest-pose rule stated normatively

- **WHEN** a reader consults the motion language documentation
- **THEN** it states that every animated state or effect requires a deliberate reduced-motion rest pose
- **AND** it states that an animated state without one is incomplete, not optional polish

#### Scenario: Reader finds the stepped-motion rule stated normatively

- **WHEN** a reader consults the motion language documentation
- **THEN** it states that interactions are immediate and periodic motion is stepped rather than smoothly eased

#### Scenario: Smooth motion affordances are rejected by the documented contract

- **WHEN** a motion recipe or language example declares a generic transition or continuous easing for an interaction or periodic effect
- **THEN** the design-language validation fails and identifies the conflicting smooth-motion affordance

### Requirement: Atmosphere declares its mount cardinality and cost contract
The atmosphere language and its machine-readable recipes SHALL state that the ambient stack mounts once per chrome root, never once per tile, card, or list item. The contract SHALL identify the default field limits of 6–51 particles per weather field and three blooms, and SHALL state that weather is opt-in and disabled by default.

#### Scenario: Recipe exposes the atmosphere operating envelope
- **WHEN** a consumer reads the atmosphere recipe metadata
- **THEN** it finds `mountCardinality` set to `once-per-root`
- **AND** it finds the particle and bloom limits and weather's opt-in default

#### Scenario: Per-item mounting violates the contract
- **WHEN** an atmosphere integration mounts a complete ambient stack for each tile, card, or list item
- **THEN** the integration fails the atmosphere contract because the stack is not mounted once per chrome root

### Requirement: Atmosphere documents the fixed-behind-scope mounting pattern
The atmosphere language SHALL define the supported stacking pattern: the chrome root is an isolated stacking context, ambient layers are descendants of the scoped root so they inherit its tokens, and content is lifted above `z-0` while the ambient layers remain behind it.

#### Scenario: Atmosphere remains behind scoped content
- **WHEN** a consumer applies the documented atmosphere mounting pattern
- **THEN** the chrome root has `isolation: isolate`
- **AND** ambient layers are descendants of the scope root
- **AND** content is above the ambient layers at `z-0` or higher

#### Scenario: Unisolated or out-of-scope ambience is rejected
- **WHEN** ambient layers are mounted outside the scope tree or the chrome root lacks isolation
- **THEN** the integration fails the fixed-behind-scope contract

### Requirement: Atmosphere constraints are enforced rather than prose-only
The decided particle, bloom, and weather defaults SHALL be represented by generator defaults and an executable validation check. Documentation or recipe metadata alone SHALL NOT be sufficient to satisfy the atmosphere cost contract.

#### Scenario: Cost drift fails validation
- **WHEN** a generator's default field count exceeds the declared 6–51 particle envelope or the default bloom count differs from three
- **THEN** validation fails and identifies the violated atmosphere cost limit

#### Scenario: Weather enabled by default fails validation
- **WHEN** the default atmosphere configuration mounts weather without an explicit opt-in
- **THEN** validation fails and identifies that weather must be opt-in and off by default

### Requirement: Static status mark is a registered chrome primitive

The design language SHALL register a static status-mark recipe (`state.mark.static`) in
`design-system/recipes/` and document it in the states language prose. The recipe SHALL
carry the full recipe shape (stable unique ID, intent, usage rules, source module
references, value references, and a `reducedMotion` field) and SHALL declare that the
status mark is the inert rest frame of a lifecycle state — the non-animated pass / fail /
warn primitive a consumer reaches for when it cannot mount the animated lifecycle states.
The states language document SHALL state this same relationship, so the static mark and
the animated states read as one status idiom rather than a second, parallel one.

#### Scenario: Status-mark recipe is registered and complete

- **WHEN** the recipes are compiled and validated
- **THEN** `state.mark.static` is present with a stable ID, intent, usage rules, resolvable
  source module and value references, and a `reducedMotion` field

#### Scenario: The mark's relationship to the lifecycle states is documented

- **WHEN** a consumer reads the states language document
- **THEN** it states that the static status mark is the inert rest frame of a lifecycle
  state and is the compliant fallback when the animated states cannot be mounted

### Requirement: Segmented control is a registered chrome primitive

The design language SHALL register a segmented-control recipe
(`component.tabs.segmented`) in `design-system/recipes/` and document it in the components
language prose. The recipe SHALL carry the full recipe shape (stable unique ID, intent,
usage rules, source module references, value references, and a `reducedMotion` field) and
SHALL define the selected-state contract for a pick-one control: a selected cell reads as
the inverse of an unselected one, and switching is immediate. The components language
document SHALL describe the segmented control as a reusable mode selector distinct from
the theme-switch affordance.

#### Scenario: Segmented-control recipe is registered and complete

- **WHEN** the recipes are compiled and validated
- **THEN** `component.tabs.segmented` is present with a stable ID, intent, usage rules,
  resolvable source module and value references, and a `reducedMotion` field

#### Scenario: The selected-state contract is documented

- **WHEN** a consumer reads the components language document
- **THEN** it describes the segmented control as a pick-one mode selector whose selected
  cell inverts the unselected treatment and whose switch is immediate

### Requirement: Theming is light-only by design

The design language documentation SHALL define every skin as a light paper surface whose colour roles may vary by hue, while dark mode and lightness-polarity inversion are out of scope because they conflict with the paper, grain, multiply, and ink material language.

#### Scenario: Consumer finds the light-only stance
- **WHEN** a consumer reads the theming and anti-goals language
- **THEN** it finds that skins retain a light paper ground, that dark mode is intentionally out of scope, and why the material language requires that ground

### Requirement: Existing dark themes have a supported integration response

Consumer-facing design-system guidance SHALL state that an application with an existing `.dark` theme MUST either keep design-system chrome on its light paper surface or omit the design system from dark-mode surfaces, rather than requiring a dark design-system palette.

#### Scenario: Consumer integrates with an existing dark application
- **WHEN** an application switches its own surfaces to `.dark`
- **THEN** its integration guidance offers keeping the design-system chrome light or excluding the design system from those dark surfaces as supported choices

### Requirement: Light-only theming remains documentation-only

The light-only theming change SHALL not add a dark skin, dark-mode runtime behavior, or new visual token values; the constraint is violated if the change introduces any of those implementation artifacts.

#### Scenario: No dark implementation is introduced
- **WHEN** the change's source, token, and generated-value outputs are reviewed
- **THEN** they contain no new dark skin, dark-mode runtime path, or visual token values beyond the existing light system

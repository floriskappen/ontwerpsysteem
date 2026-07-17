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


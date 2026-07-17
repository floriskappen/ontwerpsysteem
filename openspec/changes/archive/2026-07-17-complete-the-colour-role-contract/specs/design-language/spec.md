# design-language Delta

## ADDED Requirements

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

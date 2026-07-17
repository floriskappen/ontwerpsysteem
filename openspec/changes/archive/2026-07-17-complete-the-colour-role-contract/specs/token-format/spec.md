# token-format Delta

## ADDED Requirements

### Requirement: Alpha-variant primitive names follow the alpha-ramp grammar

The naming check SHALL recognise `<base>-a<step>` as an alpha-ramp production at the
primitive tier, where `<base>` is the name of another primitive token in the same
collection and `<step>` is an integer from 1 to 99 denoting the opacity percentage
applied to the base value. The check SHALL fail when the referenced base primitive does
not exist, and SHALL reject alpha-variant names at the semantic and component tiers
(where names express intent, not composition).

#### Scenario: Alpha variant with an existing base primitive

- **WHEN** a primitive token is named `<base>-a<step>` and a primitive named `<base>`
  exists in the same collection
- **THEN** the naming check passes and the token is classified as an alpha-ramp step over
  that base

#### Scenario: Alpha variant whose base does not exist

- **WHEN** a primitive token carries the `-a<step>` suffix but no primitive with the base
  name exists
- **THEN** the naming check fails with an error naming the token and the missing base

#### Scenario: Alpha-variant name above the primitive tier

- **WHEN** a semantic- or component-tier token name carries the `-a<step>` suffix
- **THEN** the naming check fails, pointing at the token and the intent-naming rule

### Requirement: Semantic colour tokens declare skin provenance

Every semantic-tier token of type `color` SHALL carry a DTCG `$extensions` entry under
the `ontwerp.role` key declaring its provenance: `"supply"` (a skin must provide this
value) or `"derive"` (the value is computed from skin-supplied roles). A token declaring
`"derive"` SHALL name the rule that produces it in a `derivation` field; a token
declaring `"supply"` SHALL NOT carry a `derivation` field. The validation gate SHALL
enforce this over all semantic colour tokens under `design-system/source/values/`.

#### Scenario: Semantic colour token without a provenance declaration

- **WHEN** a semantic token of type `color` has no `ontwerp.role` provenance entry in
  `$extensions`
- **THEN** validation fails with an error identifying the token path

#### Scenario: Derived role without a derivation reference

- **WHEN** a semantic colour token declares provenance `"derive"` but names no
  `derivation` rule
- **THEN** validation fails, naming the token and the missing rule reference

#### Scenario: Supplied role carrying a derivation reference

- **WHEN** a semantic colour token declares provenance `"supply"` and also carries a
  `derivation` field
- **THEN** validation fails, because a supplied value has no producing rule

### Requirement: Derivation references resolve against the derivation registry

Every `derivation` rule ID named in a semantic colour token's provenance metadata SHALL
resolve to a rule registered in the colour derivation registry at
`design-system/language/colour.derivations.json`. The validation gate SHALL fail on a
reference to an unregistered rule ID.

#### Scenario: Token names an unregistered derivation rule

- **WHEN** a semantic colour token's `derivation` field names an ID not present in the
  derivation registry
- **THEN** validation fails, identifying the token and the unknown rule ID

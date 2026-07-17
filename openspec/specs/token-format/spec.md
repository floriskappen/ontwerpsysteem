# token-format Specification

## Purpose
Defines the conformance rules for value sources so the design system's values stay consistent and machine-checkable: DTCG-format `.tokens.json` files under `design-system/source/values/`, a naming grammar, primitive/semantic/component tiering, and alias/reference resolution. A validation gate enforces these rules and exits non-zero on any violation.
## Requirements
### Requirement: Tokens conform to the DTCG 2025.10 format

Every token SHALL be a JSON object with a `$value`, and a `$type` drawn from the DTCG 2025.10 vocabulary — atomic (`color`, `dimension`, `fontFamily`, `fontWeight`, `duration`, `cubicBezier`, `number`) or composite (`typography`, `shadow`, `border`, `strokeStyle`, `gradient`, `transition`). `$type` MAY be omitted on a token when it is inherited from an ancestor group's `$type`. `$description` is optional plain text. Conformance SHALL be checked against a DTCG JSON Schema.

#### Scenario: Token missing a resolvable type

- **WHEN** a token has neither its own `$type` nor an inherited group `$type`
- **THEN** validation fails with an error identifying the token path

#### Scenario: Type outside the vocabulary

- **WHEN** a token declares a `$type` not in the DTCG 2025.10 vocabulary
- **THEN** schema validation fails and the build does not run

### Requirement: Token names follow the intent-based naming grammar

Token and group names SHALL be lowercase kebab-case segments joined by dots to form a path, and SHALL NOT begin with `$` or contain `{`, `}`, or `.` within a segment. Semantic- and component-tier names SHALL express intent (role/meaning), not appearance — e.g. `color.text.muted` is valid; an appearance-named alias such as `color.gray-600` at the semantic tier is invalid. Primitive-tier names MAY be descriptive of the raw value. The grammar SHALL be enforced by a naming check.

#### Scenario: Valid intent-based semantic name

- **WHEN** a semantic token is named `color.text.muted`
- **THEN** the naming check passes

#### Scenario: Appearance-named semantic token

- **WHEN** a semantic or component token name encodes appearance rather than intent (e.g. `color.blue-500`)
- **THEN** the naming check fails with an error pointing at the token and explaining the intent rule

### Requirement: References respect the three-tier hierarchy

The system SHALL have exactly three tiers — primitive, semantic, component — and no more. Aliases SHALL use DTCG `{group.token}` syntax. Primitive tokens SHALL hold raw values and MUST NOT contain references. References SHALL point only to a lower tier: semantic tokens reference primitives, and component tokens reference semantic tokens. Component tokens MUST NOT reference primitives directly. All references SHALL resolve, with no dangling targets and no cycles.

#### Scenario: Semantic aliases a primitive

- **WHEN** a semantic token's `$value` is `{color.brand.base}` pointing at a primitive token
- **THEN** the tier check passes and the reference resolves

#### Scenario: Component references a primitive directly

- **WHEN** a component token's `$value` references a primitive token instead of a semantic one
- **THEN** the tier check fails with an error naming the token and the disallowed reference

#### Scenario: Dangling or circular reference

- **WHEN** a token references a path that does not exist, or a reference chain forms a cycle
- **THEN** validation fails and identifies the broken or circular reference

### Requirement: Validation gate enforces the contract

The validation gate SHALL run the full conformance check (DTCG JSON Schema, naming grammar, tier/reference rules, alias resolution) over all files located under `design-system/source/values/`. The gate SHALL exit non-zero on any violation.

#### Scenario: Validation of the new values path
- **WHEN** the validation gate is executed
- **THEN** it scans the files under `design-system/source/values/` and reports any non-conforming tokens

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


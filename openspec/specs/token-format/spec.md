# token-format Specification

## Purpose
TBD - created by archiving change scaffold-token-pipeline. Update Purpose after archive.
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

The validation gate SHALL run the full conformance check over `tokens/`: the DTCG JSON Schema, the naming grammar check, the tier/reference rules, and alias resolution. The gate SHALL exit non-zero on any violation and report the offending token path(s). The build SHALL depend on this gate passing.

#### Scenario: Validation blocks a non-conforming change

- **WHEN** the validation gate finds any schema, naming, tier, or reference violation
- **THEN** it exits non-zero and prints each violation with its token path


## ADDED Requirements

### Requirement: Structured token manifest output

The build SHALL emit a structured token manifest as a JSON artifact under `dist/`, describing every token in the built set. Each manifest entry SHALL carry the token's dot-path, its derived (kebab) output name, its tier (primitive, semantic, or component), its resolved `$type`, its fully resolved `$value`, the raw alias it references when the token is an alias, and its `$description` when present. The manifest is a generated artifact subject to the same validation gate and determinism rules as every other output.

#### Scenario: Manifest carries per-token metadata

- **WHEN** the build completes
- **THEN** `dist/` contains a JSON manifest with one entry per token
- **AND** each entry includes the token's path, derived name, tier, resolved `$type`, resolved value, and its `$description` when present

#### Scenario: Aliased token records its reference

- **WHEN** a manifest entry describes a token whose `$value` is an alias, such as a semantic token pointing at a primitive
- **THEN** the entry records both the resolved value and the raw alias it references
- **AND** the referenced token's tier is determinable from the manifest

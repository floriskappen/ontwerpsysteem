# build-pipeline Spec Delta

## MODIFIED Requirements

### Requirement: CSS custom properties output

The build SHALL emit a CSS file exposing every token as a custom property under `:root`. A token whose source `$value` is an alias SHALL be emitted as a `var(--…)` reference to the derived name of the referenced token, keeping the alias chain live at runtime; a token whose source holds a raw value SHALL be emitted as a literal. Every emitted reference SHALL resolve within the file. This is the baseline web target.

#### Scenario: Aliased token emits a var() reference

- **WHEN** a component token such as `button.border.default` aliases a semantic token such as `color.border.strong`
- **THEN** the CSS declares `--button-border-default: var(--color-border-strong)`
- **AND** the semantic token is itself declared as a `var(--…)` reference to its primitive, so the full chain is followable inside the file

#### Scenario: Raw values emit literals

- **WHEN** a token's source `$value` is a raw value rather than an alias
- **THEN** the CSS declares it with the literal value

#### Scenario: Overriding a role cascades through the chain

- **WHEN** a consumer stylesheet overrides a semantic custom property (e.g. `--color-border-strong`) on the same scope root that carries the token declarations (e.g. a later `:root` rule)
- **THEN** every component custom property that aliases that role computes to the overridden value, with no component-level redeclaration

### Requirement: Structured token manifest output

The build SHALL emit a structured token manifest as a JSON artifact under `dist/`, describing every token in the built set. Each manifest entry SHALL carry the token's dot-path, its derived (kebab) output name, its tier (primitive, semantic, or component), its resolved `$type`, its fully resolved `$value`, and its `$description` when present. For a token whose source `$value` is an alias, the entry SHALL additionally carry the raw alias it references and the full ordered reference chain from the token down to the token that holds the raw value. The manifest is a generated artifact subject to the same validation gate and determinism rules as every other output.

#### Scenario: Manifest carries per-token metadata

- **WHEN** the build completes
- **THEN** `dist/` contains a JSON manifest with one entry per token
- **AND** each entry includes the token's path, derived name, tier, resolved `$type`, resolved value, and its `$description` when present

#### Scenario: Aliased token records its full chain

- **WHEN** a manifest entry describes a token whose `$value` is an alias, such as a component token pointing at a semantic token that points at a primitive
- **THEN** the entry records the resolved value, the raw alias it references, and the ordered chain of references ending at the token holding the raw value
- **AND** each referenced token's tier is determinable from the manifest

## ADDED Requirements

### Requirement: Alias preservation applies to every CSS variable output

Every CSS custom-property output the build emits — the baseline `:root` file, the Tailwind theme artifact, and any scoped or derived CSS variable output — SHALL apply the same alias rule: alias sources emit `var(--…)` references to derived names, raw sources emit literals, and all references resolve within the emitted artifact. Outputs whose purpose is resolved data (the JS/TS ESM module, the manifest `value` field) SHALL continue to carry fully resolved values.

#### Scenario: Tailwind theme preserves aliases

- **WHEN** the Tailwind theme artifact is emitted
- **THEN** tokens whose source `$value` is an alias appear as `var(--…)` references to the derived name of their target, declared within the same artifact

#### Scenario: Resolved-data outputs stay literal

- **WHEN** the JS/TS ESM module is emitted
- **THEN** every exported token value is a fully resolved literal, with no `var(--…)` references

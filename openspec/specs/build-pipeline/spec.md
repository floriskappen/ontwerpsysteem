# build-pipeline Specification

## Purpose
Defines how value sources become shippable artifacts: the build validates the sources under `design-system/source/values/`, then emits platform outputs under `design-system/dist/` — CSS custom properties, JS/TS ESM, a Tailwind v4 theme, and a structured token manifest. Builds are deterministic, and outputs are generated rather than committed.

## Requirements

### Requirement: Build transforms canonical tokens into platform outputs

The build SHALL read all value source files under `design-system/source/values/`, validate them, and emit built platform outputs (CSS custom properties, JS/TS ESM, Tailwind v4 theme, and structured token manifest) under `design-system/dist/`.

#### Scenario: Build executes and outputs to design-system/dist
- **WHEN** the build is run on a valid set of source files
- **THEN** it generates the platform outputs inside `design-system/dist/`

### Requirement: Output names map deterministically from token paths

Every output target SHALL derive consumer-facing names from a token's dot-path by a single, documented rule, so the same token yields a predictable name across builds. The CSS, JS/TS, and manifest targets use the kebab-cased path unchanged; the Tailwind target derives its name by inserting the literal segment `ontwerp` between the first path segment and the remainder, so the theme's variables sit in an `ontwerp` namespace within each Tailwind variable namespace. The path-to-name mapping, including the Tailwind namespace rule, is part of the public contract: changing it is a breaking change.

#### Scenario: Stable name derivation

- **WHEN** a token at path `color.text.muted` is built
- **THEN** the CSS output exposes it as `--color-text-muted`
- **AND** the JS/TS and manifest outputs expose the same token under the same derived name shape
- **AND** the Tailwind output exposes it as `--color-ontwerp-text-muted`

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

### Requirement: JS/TS ESM output

The build SHALL emit an ES module exporting the resolved tokens as a typed object, suitable for programmatic and type-safe consumption.

#### Scenario: ESM module is importable

- **WHEN** a consumer imports the generated ESM module
- **THEN** it receives an object whose keys are the derived token names and whose values are the resolved token values

### Requirement: Tailwind v4 theme output

The build SHALL emit a Tailwind v4 theme artifact (a `@theme` CSS layer or equivalent preset) so Tailwind v4 projects consume the tokens directly without re-declaring them. Every variable in the theme SHALL carry the `ontwerp` namespace segment, so importing the theme cannot redefine a consumer's unnamespaced Tailwind theme variables (such as `--font-sans` or the `--radius-*` scale) or silently change the meaning of the utilities derived from them.

#### Scenario: Tailwind theme is emitted with namespaced variables

- **WHEN** the build completes
- **THEN** `dist/` contains a Tailwind v4 theme artifact that maps the tokens into Tailwind theme variables
- **AND** every variable it declares carries the `ontwerp` namespace segment, with no unnamespaced theme variable declared

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

### Requirement: Build assembles the consumer bundle

The build SHALL assemble the consumer bundle from its built outputs and the durable design surface into a dedicated release directory under `design-system/dist/`. Assembly SHALL copy the built value outputs and embedded fonts, the `language/`, `recipes/` (including the generated index), the zoo source and its rendered `index.html`, the consumer `AGENTS.md`, `VERSION`, and `CHANGELOG.md`, and SHALL exclude development machinery. Re-assembling from unchanged inputs SHALL be deterministic.

#### Scenario: Bundle is assembled by the build
- **WHEN** the build runs
- **THEN** a release directory under `design-system/dist/` contains the consumer bundle with built values, fonts, language, recipes, zoo source, rendered `index.html`, consumer `AGENTS.md`, `VERSION`, and `CHANGELOG.md`

#### Scenario: Assembly is deterministic
- **WHEN** the bundle is assembled twice from unchanged inputs
- **THEN** the two outputs are identical

### Requirement: Alias preservation applies to every CSS variable output

Every CSS custom-property output the build emits — the baseline `:root` file, the Tailwind theme artifact, and any scoped or derived CSS variable output — SHALL apply the same alias rule: alias sources emit `var(--…)` references to derived names, raw sources emit literals, and all references resolve within the emitted artifact. Outputs whose purpose is resolved data (the JS/TS ESM module, the manifest `value` field) SHALL continue to carry fully resolved values.

#### Scenario: Tailwind theme preserves aliases

- **WHEN** the Tailwind theme artifact is emitted
- **THEN** tokens whose source `$value` is an alias appear as `var(--…)` references to the derived name of their target, declared within the same artifact

#### Scenario: Resolved-data outputs stay literal

- **WHEN** the JS/TS ESM module is emitted
- **THEN** every exported token value is a fully resolved literal, with no `var(--…)` references

### Requirement: Scoped token CSS output

The build SHALL emit a scoped variant of the token CSS alongside the `:root` variant: a file declaring every token as a custom property under a scope-class selector instead of `:root`. The scope class SHALL be a build parameter; the default build SHALL use `.ontwerp`. The scoped variant SHALL be generated in the same build from the same token sources as the `:root` variant, never authored or copied by hand.

#### Scenario: Scoped token CSS is emitted

- **WHEN** the build completes
- **THEN** `dist/css/` contains a scoped token CSS file whose selector is the scope class (`.ontwerp` by default)
- **AND** it declares a custom property for every token

#### Scenario: Scope class is a build parameter

- **WHEN** the build is invoked with a different scope class
- **THEN** the scoped outputs use that class as their selector, with `.ontwerp` used when no class is given

#### Scenario: Scoped and root token outputs cannot drift

- **WHEN** the `:root` token CSS and the scoped token CSS from the same build are compared
- **THEN** they declare an identical set of custom properties with identical values, differing only in the enclosing selector

### Requirement: Scoped component and effects CSS outputs

The build SHALL emit consumable, scoped CSS bundles for the system's component classes and for its effects layers (lifecycle states, atmosphere, material, weather): a component CSS bundle and an effects CSS bundle under `dist/css/`, generated from the same style source files the showcase compiles. Every style rule in these bundles SHALL be scoped so it only applies within an element carrying the scope class.

#### Scenario: Scoped bundles are emitted from the showcase's style sources

- **WHEN** the build completes
- **THEN** `dist/css/` contains a scoped component CSS bundle and a scoped effects CSS bundle
- **AND** a change to a rule in the corresponding style source appears in the emitted bundle after rebuild

#### Scenario: Every rule is confined to the scope

- **WHEN** the scoped component or effects bundle is inspected
- **THEN** every style rule's selector is the scope class itself or a descendant of it, with no bare global selectors

### Requirement: Keyframe names in shipped CSS are namespaced

Every `@keyframes` declaration in any shipped CSS output SHALL use a name carrying the `ontwerp-` prefix, and every `animation`/`animation-name` reference in shipped CSS SHALL resolve to a keyframe declared under such a name, so shipped animations cannot collide with a consumer's keyframes in a shared document.

#### Scenario: All keyframes carry the namespace

- **WHEN** the shipped CSS outputs are scanned
- **THEN** every `@keyframes` name begins with `ontwerp-`
- **AND** every animation reference names a keyframe that is declared with that prefix

### Requirement: Standalone fonts CSS output

The build SHALL emit a fonts CSS file at `values/css/fonts.css` under `dist/` containing one `@font-face` declaration per shipped font file, with `src` URLs expressed as relative paths that resolve against the bundle's `fonts/` directory. Family names, weight ranges, styles, and file bindings SHALL be generated from a single canonical face-definition source that also drives the showcase's inlined `@font-face` rules, so the two can never disagree.

#### Scenario: Fonts CSS is emitted

- **WHEN** the build completes
- **THEN** `dist/` contains `values/css/fonts.css` declaring every shipped face
- **AND** each declaration's `src` is a relative URL that resolves to a font file shipped in the bundle's `fonts/` directory

#### Scenario: Showcase and fonts CSS share one face definition

- **WHEN** the showcase HTML and `values/css/fonts.css` are built
- **THEN** the inlined showcase `@font-face` rules and the fonts CSS declare identical family names, weight ranges, and styles for every face, derived from the same face-definition source

### Requirement: Skin CSS is generated by expanding a canonical skin source

The build SHALL read a canonical skin source in which each skin declares only the
skin-supplied colour roles (those whose semantic-token provenance is `supply`), and SHALL
emit one importable skin CSS file per alternate skin (the base palette ships as the token
CSS, so it takes no override file). For each skin the build SHALL compute every
`derive`-provenance semantic colour role by evaluating its registered derivation rule from
`design-system/language/colour.derivations.json` over that skin's supplied roles, and SHALL
declare the supplied roles and computed roles together as custom properties under the
skin's dedupe-safe selector. Skin outputs are generated artifacts under `design-system/dist/`,
never hand-authored, and re-emitting from an unchanged skin source SHALL be deterministic.

#### Scenario: Skin file declares every colour role

- **WHEN** a skin file is emitted from a canonical skin definition
- **THEN** it declares a custom property for every colour-carrying semantic role
- **AND** the supplied roles carry the skin's own values and the derived roles carry values computed from them

#### Scenario: Derived role is computed from the skin's supplied core

- **WHEN** the build evaluates a `derive`-provenance role for a skin
- **THEN** it applies that role's registered derivation rule to the skin's supplied roles
- **AND** the emitted value depends only on the skin's supplied core, not on the base palette's primitives

#### Scenario: An unregistered or unresolvable derivation halts skin emission

- **WHEN** a `derive`-provenance role names a derivation rule absent from the registry, or a rule's input is not one of the skin's supplied roles
- **THEN** the build fails, naming the skin, the role, and the missing rule or input

### Requirement: Zoo skin data is generated from the canonical skin source

The build SHALL generate the zoo's skin data (the source the showcase theme bar consumes)
from the same canonical skin source that drives the emitted skin CSS, so the demonstrated
skins and the shipped skin files cannot diverge. The generated zoo skin data SHALL carry
each skin's complete role set, not a partial subset.

#### Scenario: Zoo skin data matches the shipped skins

- **WHEN** the canonical skin source changes and the system is rebuilt
- **THEN** both the emitted skin CSS files and the zoo skin data reflect the change
- **AND** each carries the same complete role set for every skin

### Requirement: Build emits root and scoped shadcn adapter forms

The build SHALL generate the shadcn adapter outputs from one canonical adapter source and place both the root form and the `.ontwerp`-scoped form in the consumer bundle under `values/shadcn/`. Generated outputs SHALL be deterministic and SHALL not require a second hand-maintained mapping.

#### Scenario: Adapter outputs are present after a build

- **WHEN** the build completes with valid token sources
- **THEN** the consumer bundle contains a root shadcn adapter and a `.ontwerp`-scoped shadcn adapter
- **AND** both files are importable CSS artifacts under `values/shadcn/`

#### Scenario: Root and scoped adapters cannot drift

- **WHEN** the root and scoped adapter outputs from one build are compared
- **THEN** they declare the same custom-property names and values
- **AND** they differ only in the selector context that contains those declarations

### Requirement: Adapter generation fails on incomplete role mapping

The validation or build gate SHALL reject an adapter whose declared shadcn variable crosswalk contains an unresolved ontwerp role or omits a required variable in either output form, and SHALL identify the missing or unresolved mapping.

#### Scenario: Missing role mapping fails the gate

- **WHEN** an adapter source references an unavailable ontwerp semantic role or lacks a required shadcn variable
- **THEN** the build or validation command exits unsuccessfully
- **AND** the failure identifies the adapter mapping that cannot be resolved

### Requirement: Adapter generation has no runtime dependency

The adapter build path SHALL use the repository's existing build inputs and tooling only; it SHALL not add a package dependency or execute runtime component code to produce the crosswalk.

#### Scenario: Dependency-free values build

- **WHEN** the adapter is built in the repository's normal build
- **THEN** the adapter is emitted without a new runtime package or component implementation
- **AND** the resulting files remain plain CSS values consumable without JavaScript

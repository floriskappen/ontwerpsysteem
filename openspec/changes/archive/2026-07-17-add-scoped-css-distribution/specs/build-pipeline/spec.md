# build-pipeline Delta — add-scoped-css-distribution

## ADDED Requirements

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

## MODIFIED Requirements

### Requirement: Output names map deterministically from token paths

Every output target SHALL derive consumer-facing names from a token's dot-path by a single, documented rule, so the same token yields a predictable name across builds. The CSS, JS/TS, and manifest targets use the kebab-cased path unchanged; the Tailwind target derives its name by inserting the literal segment `ontwerp` between the first path segment and the remainder, so the theme's variables sit in an `ontwerp` namespace within each Tailwind variable namespace. The path-to-name mapping, including the Tailwind namespace rule, is part of the public contract: changing it is a breaking change.

#### Scenario: Stable name derivation

- **WHEN** a token at path `color.text.muted` is built
- **THEN** the CSS output exposes it as `--color-text-muted`
- **AND** the JS/TS and manifest outputs expose the same token under the same derived name shape
- **AND** the Tailwind output exposes it as `--color-ontwerp-text-muted`

### Requirement: Tailwind v4 theme output

The build SHALL emit a Tailwind v4 theme artifact (a `@theme` CSS layer or equivalent preset) so Tailwind v4 projects consume the tokens directly without re-declaring them. Every variable in the theme SHALL carry the `ontwerp` namespace segment, so importing the theme cannot redefine a consumer's unnamespaced Tailwind theme variables (such as `--font-sans` or the `--radius-*` scale) or silently change the meaning of the utilities derived from them.

#### Scenario: Tailwind theme is emitted with namespaced variables

- **WHEN** the build completes
- **THEN** `dist/` contains a Tailwind v4 theme artifact that maps the tokens into Tailwind theme variables
- **AND** every variable it declares carries the `ontwerp` namespace segment, with no unnamespaced theme variable declared

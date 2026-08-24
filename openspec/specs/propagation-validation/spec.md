# propagation-validation Specification

## Purpose
Keeps the design language, recipes, zoo source, and values from drifting apart by making cross-layer references checkable. The validation gate fails when a recipe points at a source module or value that does not exist, or when a major zoo source module under `design-system/source/zoo/` fails to declare (via `implementsRecipes`) the recipes it implements or names a recipe that is not defined. This makes it hard to change one layer and silently leave another stale.

## Requirements

### Requirement: Cross-layer reference validation

The validation gate SHALL verify that all source modules and value references declared in `design-system/recipes/` actually exist in the filesystem. Any dangling reference SHALL cause validation to fail.

#### Scenario: Recipe references a non-existent source module
- **WHEN** a recipe JSON file declares a source module at a path that does not exist
- **THEN** the validation gate fails and prints a descriptive error naming the broken reference

### Requirement: Showcase module recipe declarations

The validation gate SHALL verify that all major showcase source modules under `design-system/source/zoo/` declare the recipes they implement (using `implementsRecipes` metadata) and that all declared recipes exist.

#### Scenario: Showcase module missing recipe declaration or referencing invalid recipe
- **WHEN** a showcase module does not declare its implemented recipes, or references a recipe ID that is not defined in the system
- **THEN** the validation gate fails and lists the offending module and missing/invalid recipe ID

### Requirement: Font weight tokens resolve within shipped face coverage

The validation gate SHALL verify that every `fontWeight` token value falls inside the declared weight range of the shipped face bound to the system's token-driven typographic voice. A weight token outside that range SHALL fail validation with an error naming the token, its value, and the face's declared range.

#### Scenario: Weight token outside the shipped range fails

- **WHEN** a `fontWeight` token's value lies outside the declared weight range of the face bound to the weight tokens
- **THEN** the validation gate fails, naming the token, its value, and the declared range

#### Scenario: Weight tokens inside the range pass

- **WHEN** every `fontWeight` token value lies inside the bound face's declared weight range
- **THEN** the weight-coverage check passes

### Requirement: Declared @font-face ranges match actual face coverage

The validation gate SHALL verify, for each shipped font file, that the declared `@font-face` weight range is contained within the weight-axis coverage of the font binary itself (a static face counts as covering exactly its single weight). A declaration promising weights the binary does not carry SHALL fail validation with an error naming the file, the declared range, and the actual coverage.

#### Scenario: Declaration exceeding real coverage fails

- **WHEN** a face's declared weight range includes a weight the shipped font binary's weight axis does not cover
- **THEN** the validation gate fails, naming the font file, the declared range, and the binary's actual coverage

#### Scenario: Replacing a font file is re-checked

- **WHEN** a shipped font file is replaced and the gate runs
- **THEN** the declared range is re-verified against the new binary's actual coverage

### Requirement: Skin coverage gate

The validation gate SHALL verify, for every shipped skin, that the set of roles the skin
supplies is exactly the set of semantic colour roles whose declared provenance is
skin-supplied, and that expanding the skin yields a value for every colour-carrying
semantic token — each token either supplied by the skin or produced by its registered
derivation rule over the skin's supplied roles. The gate SHALL fail when a skin omits a
supplied role, supplies a role whose provenance is derived, or leaves any colour-carrying
token without a supplied-or-derived value, naming the skin and the offending role.

#### Scenario: A skin that strands a colour token fails

- **WHEN** a shipped skin leaves a colour-carrying semantic token that is neither supplied nor produced by a derivation over the skin's supplied roles
- **THEN** the validation gate fails, naming the skin and the stranded token

#### Scenario: A skin whose supply set does not match the contract fails

- **WHEN** a skin omits a supply-provenance role, or supplies a role whose declared provenance is derived
- **THEN** the validation gate fails, naming the skin and the mismatched role

#### Scenario: A complete skin passes

- **WHEN** a skin supplies exactly the supply-provenance roles and every derived role resolves from them
- **THEN** the skin coverage gate passes for that skin

### Requirement: Reduced-motion coverage for shipped keyframes

The validation gate SHALL verify that every `@keyframes` declared in the shipped CSS has a corresponding `@media (prefers-reduced-motion: reduce)` rule that neutralises it for the selectors that reference it: the rule SHALL stop the animation (an `animation`/`animation-name` reset such as `animation: none`) and SHALL assert an explicit rest pose — a declared static value for each property the keyframe animates, or removal of the animated element from the layout. A shipped keyframe with no such reduced-motion rule, or one whose reduced-motion rule stops the animation without asserting a rest pose, SHALL fail validation with an error naming the uncovered keyframe. The check reads the shipped CSS, so a reduced-motion rule in a stylesheet that is not part of the shipped output does not count as coverage.

#### Scenario: Uncovered keyframe fails

- **WHEN** a `@keyframes` in the shipped CSS has no `@media (prefers-reduced-motion: reduce)` rule that both stops its animation and asserts a rest pose for the selectors referencing it
- **THEN** the validation gate fails, naming the uncovered keyframe

#### Scenario: Covered keyframe passes

- **WHEN** every `@keyframes` in the shipped CSS has a reduced-motion rule that stops its animation and asserts a rest pose or removes the animated element
- **THEN** the keyframe-coverage check passes

#### Scenario: A rest frame outside the shipped CSS does not satisfy the gate

- **WHEN** a shipped keyframe's only reduced-motion rule lives in a stylesheet that the build does not ship
- **THEN** the gate reports that shipped keyframe as uncovered

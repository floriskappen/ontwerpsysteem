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


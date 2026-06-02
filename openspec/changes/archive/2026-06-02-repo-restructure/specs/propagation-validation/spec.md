## ADDED Requirements

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

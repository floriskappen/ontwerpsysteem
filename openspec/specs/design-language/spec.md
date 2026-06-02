# design-language Specification

## Purpose
Captures the system's durable design language so agents can understand and reuse it without reverse-engineering the zoo: human-readable principles in Markdown under `design-system/language/` and machine-readable recipes in JSON under `design-system/recipes/`. Recipes carry stable IDs, intent, usage rules, and references to the source modules and values that implement them, and are compiled into a single index for external consumption.
## Requirements
### Requirement: Structured design language principles and recipes

The design system SHALL define a durable design language comprising human-readable principles in Markdown files under `design-system/language/` and machine-readable recipes in JSON files under `design-system/recipes/`. Recipes SHALL define stable, unique IDs and specify their intent, usage rules, source modules, and value references.

#### Scenario: Valid recipe definition
- **WHEN** a recipe JSON file contains a stable ID, intent, usage rules, source module references, and value references
- **THEN** the recipe is considered valid and registered in the system

### Requirement: Design language index manifest

The design system SHALL generate an index of all recipes as a structured JSON file at `design-system/recipes/index.json` compiling all registered recipes for easy consumption by external agents.

#### Scenario: Manifest compiles all recipes
- **WHEN** the recipes are compiled by the validation or build tool
- **THEN** `design-system/recipes/index.json` is updated to include all recipe metadata and references


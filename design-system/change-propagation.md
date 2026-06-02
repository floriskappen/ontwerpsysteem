# Change Propagation Guide

This document defines how changes must propagate across the design system layers. Every agent working in this repository must follow this workflow to ensure consistency.

## Propagation Workflow

The design system has four layers:
1. **Language principles** (`design-system/language/`): Concise prose.
2. **Recipes** (`design-system/recipes/`): Structured JSON metadata.
3. **Source** (`design-system/source/`): Zoo source code and value layers.
4. **Dist/Generated** (`design-system/dist/`): Built CSS, JS, and HTML zoo page.

### Change Rules

- **If Zoo source changes**:
  - Determine if the change is *exploratory* (temporary/experiment) or *durable* (part of the system contract).
  - If exploratory, mark it in source code with `// EXPLORATORY` comments.
  - If durable, update the matching language docs, recipes, value definitions, and tests to document the new behavior.
- **If a Value changes**:
  - Re-run the build pipeline (`npm run build`) to regenerate the outputs and the showcase.
  - Run the validation gate (`npm run validate`).
- **If a Recipe changes**:
  - Update the implementation files and tests that exercise that recipe.
  - Regenerate `design-system/recipes/index.json`.

## Pre-Flight Change Checklist

Before finishing any task or submitting a change, run through this checklist:

- [ ] **Durable vs Exploratory**: Did you change the visual or component code? Is it durable? If yes, are matching recipes, language docs, or tokens updated?
- [ ] **Reduced Motion**: Does the interaction or effect support `prefers-reduced-motion` with a deliberate static rest state?
- [ ] **Cross-Layer Integrity**: Does the recipe JSON file's `sourceModules` and `valueRefs` match existing, valid paths in the codebase?
- [ ] **Baseline Check**: Does the new showcase output visually and behaviorally match the reference baseline in `design-system/reference/accepted-zoo/`?
- [ ] **Tests & Validation**: Does `npm run test` and `npm run validate` pass?

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

## Releasing to consumers

Downstream applications consume a **pinned release** of this system (the consumer
bundle on the `release` branch). Propagation to them is driven by `CHANGELOG.md`, not
raw commit history.

- A release is cut with `npm run release` (semver: MAJOR = breaking design/contract
  change, MINOR = additive, PATCH = fixes). The version lives in `design-system/VERSION`.
- **Agent drafts, human approves.** `npm run release` proposes the next version and a
  draft changelog entry built from the recipe/language IDs whose source changed since
  the last release. `--write` applies the draft; you then **edit `CHANGELOG.md`** to say
  what actually changed (per ID) and the propagation note. `--publish` ships the bundle
  to the `release` branch + tag. Nothing publishes automatically, and nothing is pushed
  to a remote without you.
- **Every changelog entry is keyed to recipe/language IDs** and carries a one-line
  *propagation note* — what a consuming app must re-check. Exploratory changes get no
  entry. Mark meaning-changing entries **BREAKING**.

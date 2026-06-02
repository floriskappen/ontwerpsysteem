## 1. Baseline Preservation

- [x] 1.1 Create the directory structure `design-system/reference/accepted-zoo/source/` and `design-system/reference/accepted-zoo/generated/`
- [x] 1.2 Copy showcase-core.mjs, other dependencies, and test/showcase.test.mjs into the baseline source directory
- [x] 1.3 Generate the current self-contained showcase HTML page using `npm run build` and save it at `design-system/reference/accepted-zoo/generated/index.html`
- [x] 1.4 Write `design-system/reference/accepted-zoo/README.md` explaining the purpose of the reference baseline

## 2. Reframe Repository Contract

- [x] 2.1 Create `AGENTS.md` at the repository root defining strict reading order for agents
- [x] 2.2 Create `design-system/brief.md` summarizing the core design thesis
- [x] 2.3 Create `design-system/change-propagation.md` defining checklists for design changes
- [x] 2.4 Update `README.md` to reflect the agent-readable design system contract
- [x] 2.5 Retire or rewrite `CONSTITUTION.md` to ensure no duplication with AGENTS.md

## 3. Modularize the Showcase Zoo

- [x] 3.1 Create directories `design-system/source/zoo/sections/`, `design-system/source/zoo/styles/`, and `design-system/source/zoo/effects/`
- [x] 3.2 Split `scripts/lib/showcase-core.mjs` into modular files matching sections, styles, and effects
- [x] 3.3 Implement the build compiler in `scripts/build.mjs` to bundle these modules into `design-system/dist/zoo/index.html`
- [x] 3.4 Verify that the new modular showcase visually matches the baseline and runs cleanly

## 4. Extract Language and Recipes

- [x] 4.1 Write design language Markdown documents in `design-system/language/` (principles, atmosphere, material, motion, colour, type, components, states, theming, anti-goals)
- [x] 4.2 Create recipe JSON files in `design-system/recipes/` with stable IDs and structured metadata
- [x] 4.3 Update the build/validate script to compile and generate `design-system/recipes/index.json`

## 5. Reorganize Value Layer

- [x] 5.1 Migrate `tokens/` files into `design-system/source/values/`
- [x] 5.2 Update build and test configurations to read token source from `design-system/source/values/` and output to `design-system/dist/`

## 6. Build and Validation Tooling Updates

- [x] 6.1 Update `package.json` scripts to refer to the new validation and build file paths
- [x] 6.2 Add cross-layer validation in `scripts/validate.mjs` to check recipe source references and showcase recipe metadata
- [x] 6.3 Update the vitest test files in `test/` to align with the new folder structures and verify all tests pass

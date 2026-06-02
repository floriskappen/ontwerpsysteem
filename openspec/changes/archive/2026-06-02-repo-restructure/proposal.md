## Why

The current repository is structured primarily as a design token pipeline with a single large showcase page ("the zoo") attached to it. While visually and behaviorally rich, this makes it difficult for agentic workflows to reason about, locate, and modify specific design decisions, animations, and component rules. We need to restructure the repository into an agent-readable design language system where principles, recipes, source code, and values are clearly modularized, and where changes propagate predictably across these layers.

## What Changes

We will execute the restructure outlined in the repository roadmap:
- **Change 0**: Preserve the current accepted zoo showcase as a baseline in `design-system/reference/accepted-zoo/` (both source and built static HTML) so we can ensure visual parity throughout the refactoring.
- **Change 1**: Reframe the repository contract by creating `AGENTS.md` and `design-system/brief.md` to define strict agent reading orders and design-language principles.
- **Change 2**: Modularize the showcase ("zoo") source code by splitting the large `scripts/lib/showcase-core.mjs` into modular sections, styles, and effects files inside `design-system/source/zoo/`.
- **Change 3**: Extract core design language principles and structured recipes into `design-system/language/*.md` and `design-system/recipes/*.json` respectively, allowing agents to easily reference and reuse patterns.
- **Change 4**: Decide on and rebuild the value layer (whether keeping DTCG tokens, using a simpler format, or using a hybrid format).
- **Change 5**: Add propagation validation tooling to enforce consistency between the zoo source, recipes, and value definitions.
- **Change 6**: Update and reconcile OpenSpec specs to align with the new modular architecture.

## Capabilities

### New Capabilities
- `design-language`: Formalizes design principles and structured recipes (e.g. JSON format) that represent UI patterns and animations.
- `propagation-validation`: Validates that changes to any layer (zoo source, recipes, values) propagate correctly and adhere to validation rules.

### Modified Capabilities
- `repo-structure`: Updates the repository structure to group files under `design-system/` and establishes the agent reading paths.
- `showcase`: Refactors the showcase "zoo" to build from modular source files and the value layer rather than a single monolithic showcase file.
- `token-format`: Adapts the token format constraints to allow simplified values or hybrid representations if needed.
- `build-pipeline`: Adjusts build scripts to run over the new paths and produce the modular showcase and value artifacts.

## Impact

- **Affected Directory Layout**: The top-level `tokens/` directory will be migrated to `design-system/source/values/` (or similar depending on Change 4).
- **Showcase Script**: `scripts/lib/showcase-core.mjs` will be dismantled and replaced by modular files inside `design-system/source/zoo/`.
- **OpenSpec Configurations**: Specs under `openspec/specs/` will be updated to reflect the new architecture.
- **Build / Test Scripts**: `package.json` scripts and `test/` suites will be updated to point to the new layout and validate modularity and propagation rules.

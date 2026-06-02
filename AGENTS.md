# Agent Read Order & Repository Rules

Welcome, AI Agent! This repository is designed to be an agent-readable design language system, not merely a token pipeline. Please follow the strict entry point and reading order defined below to understand the architecture, principles, and change processes.

## Strict Reading Order

When onboarded to this repository or working on a task, you MUST read files in the following order:

1. **[design-system/brief.md](file:///Users/kade/git/personal/ontwerpsysteem/design-system/brief.md)**: The core system thesis (paper, ink, pigment, grain, deterministic atmosphere).
2. **[design-system/change-propagation.md](file:///Users/kade/git/personal/ontwerpsysteem/design-system/change-propagation.md)**: The workflow instructions and checklist for making and verifying changes.
3. **[design-system/language/](file:///Users/kade/git/personal/ontwerpsysteem/design-system/language/)**: Concise prose files explaining specific system layers (principles, motion, material, components, states, etc.).
4. **[design-system/recipes/](file:///Users/kade/git/personal/ontwerpsysteem/design-system/recipes/)**: Reusable UI patterns, layouts, and animations represented as structured JSON metadata.
5. **[design-system/source/zoo/](file:///Users/kade/git/personal/ontwerpsysteem/design-system/source/zoo/)**: The modular showcase ("zoo") source files, implementing the visual system.
6. **[design-system/source/values/](file:///Users/kade/git/personal/ontwerpsysteem/design-system/source/values/)**: The design values and token tier files (primitive, semantic, component).

## Core Rules for Agents

- **Modularity is King**: Never write monolithic files. Keep layout, styles, and animation logic in separate modules within `design-system/source/zoo/`.
- **Taste & Principles over Defaults**: Missing components, layouts, or transitions must be invented from recipes and design principles, not framework defaults.
- **Durable vs. Experimental**: Explicitly separate exploratory experiments from durable, production-ready changes. Durable changes must update matching language documents, recipes, and value files.
- **Verification against Baseline**: If you change the showcase or styles, ensure visual parity and correctness by verifying against the accepted baseline under `design-system/reference/accepted-zoo/generated/index.html`.

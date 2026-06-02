## Context

The current codebase contains a single monolithic showcase site generator (`scripts/lib/showcase-core.mjs`) and a token pipeline that processes DTCG tokens from `tokens/` into `dist/`. While this functions well, it lacks clear separation of concerns, making it difficult to maintain and reason about design principles or apply components to external systems. The roadmap outlines a new architecture under `design-system/` to make the repository an agent-friendly, modular design language.

## Goals / Non-Goals

**Goals:**
- Preserve the current accepted showcase ("zoo") as a committed baseline before executing changes.
- Establish a modular architecture under a top-level `design-system/` folder.
- Split the monolithic showcase generator into structured modules (sections, styles, and effects).
- Formalize design principles as readable Markdown and reusable recipes as JSON schemas.
- Build validation checks that enforce cross-layer references and propagation rules.

**Non-Goals:**
- Making visual/behavioral changes to the design system's aesthetic or component features (we aim for strict visual parity with the baseline).
- Creating platform-specific adapters (e.g. Flutter/Material UI) in this phase.
- Modifying the core design token values themselves.

## Decisions

### Decision 1: Target Directory Layout under `design-system/`
We will reorganize the repository into the structure proposed in the roadmap. This groups all design-system files under `design-system/` (including `language/`, `recipes/`, `source/`, `reference/`, and `dist/`).
- *Alternatives considered*: Keeping tokens at the top level. *Rationale*: Moving them inside `design-system/source/values/` groups all core assets together under a single folder, simplifying access control and documentation for agents.

### Decision 2: Showcase Modularization Strategy
We will break up `scripts/lib/showcase-core.mjs` into smaller ES modules under `design-system/source/zoo/` (split into `sections/`, `styles/`, `effects/`, and `data/`). The build script will read these modules and assemble them into the final self-contained HTML page using Node.
- *Alternatives considered*: Converting the showcase into a Next.js or Vite-based SPA. *Rationale*: Maintaining a zero-dependency, single-file HTML output is a core requirement of the `showcase` spec, ensuring offline capability with no server requirements.

### Decision 3: Recipe Format and Validation
We will use JSON files to represent design recipes in `design-system/recipes/` and compile them into an index. JSON allows structured validation.
- *Alternatives considered*: Storing recipes as raw markdown or JS blocks. *Rationale*: Structured JSON allows the validation pipeline to automatically parse and check links between recipes, source modules, and value tokens.

### Decision 4: Value Layer Structure
We will adopt the hybrid approach (Option C). We will keep DTCG tokens under `design-system/source/values/` for simple variables (colors, spacing, typography) and use recipes/language for the complex aspects that DTCG cannot model (weather particles, breathing grids, stepped motion clocks).
- *Alternatives considered*: Completely replacing tokens with custom JSON formats. *Rationale*: Keeping DTCG format keeps Style Dictionary and existing Tailwind/ESM outputs fully functional.

## Risks / Trade-offs

- **Risk**: Refactoring a 69KB monolithic JS script into modules could introduce subtle runtime errors or break visual styling in the showcase.
  - *Mitigation*: We will save the original showcase (source and static HTML) in `design-system/reference/accepted-zoo/` as a baseline. We will run regression tests and manual browser checks to compare the new modular showcase with the baseline.
- **Risk**: Validation complexity when checking cross-layer references.
  - *Mitigation*: Implement simple, robust checks using Node fs module queries and schema matching in `scripts/validate.mjs`.

# ontwerpsysteem

A vendor-neutral, agent-readable design system codebase.

This repository is structured to be an agent-readable design language system, where design principles, interactive recipes, source modules, and design values (tokens) are clearly separated and validated.

## Key entry point

If you are an AI agent, you **MUST** start by reading:
- **[AGENTS.md](file:///Users/kade/git/personal/ontwerpsysteem/AGENTS.md)**: Outlines the reading path and rules of the repository.
- **[design-system/brief.md](file:///Users/kade/git/personal/ontwerpsysteem/design-system/brief.md)**: Summarizes the visual thesis (paper, ink, pigment, stepped motion).
- **[design-system/change-propagation.md](file:///Users/kade/git/personal/ontwerpsysteem/design-system/change-propagation.md)**: Governs how updates propagate.

## Repository Layout

- `design-system/brief.md`: Compressed system thesis.
- `design-system/change-propagation.md`: Workflow checklist for agents.
- `design-system/language/`: Readable design principles (prose).
- `design-system/recipes/`: Reusable behaviors (JSON).
- `design-system/source/zoo/`: Modular showcase source files.
- `design-system/source/values/`: Design tokens / value files.
- `design-system/reference/accepted-zoo/`: Pre-refactor visual baseline.
- `openspec/`: OpenSpec workflow change logs and capability specifications.

## Developer Workflows

### Setup
Ensure you have Node.js installed, then install dependencies:
```bash
npm install
```

### Validate
Runs the full validation suite (JSON Schemas, naming grammar, tier referencing, and cross-layer recipe references):
```bash
npm run validate
```

### Build
Runs the Style Dictionary build and compiles the showcase "zoo":
```bash
npm run build
```

### Test
Runs integration tests:
```bash
npm run test
```

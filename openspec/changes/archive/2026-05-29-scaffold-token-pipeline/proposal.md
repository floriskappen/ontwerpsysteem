## Why

The repo has its principles and contract (CONSTITUTION.md) but no working machinery: there is nowhere to put tokens, no validation that they conform to the contract, and no build that turns them into consumable outputs. Before any design-system *content* can be authored, the apparatus that holds and serves it must exist and be provably working end-to-end.

## What Changes

- Establish the canonical **file/folder structure**: where token source files live (organized by tier — primitive / semantic / component), where build outputs go, and what is committed vs generated.
- Adopt the **DTCG 2025.10 token format** as the contract and define the **naming grammar** and **tier rules**, enforced by a **JSON Schema** (validated with ajv) plus **naming/tier checks** (references only point down a tier; no dangling or circular aliases).
- Stand up the **build pipeline** (Style Dictionary) that transforms canonical tokens into platform outputs — **CSS custom properties**, **JS/TS (ESM)**, and a **Tailwind v4 theme** — via `npm run build`.
- Ship a minimal **placeholder token set** (one primitive → one semantic alias) purely to prove the pipeline validates and builds end-to-end. This is scaffolding, not design content; it gets replaced when real tokens are ported.
- Add Node project setup (`package.json`, scripts: `build`, `validate`) and `.gitignore` for build outputs.

Tooling: Style Dictionary (latest, first-class DTCG support), npm, ajv for schema validation. Not breaking — this is all net-new.

## Capabilities

### New Capabilities

- `repo-structure`: the canonical directory contract — where token sources live (by tier), where generated outputs go, what is committed vs gitignored, and the Node project layout.
- `token-format`: DTCG 2025.10 conformance, the intent-based naming grammar, the tier/reference rules, and the JSON Schema + validation gate that enforce them.
- `build-pipeline`: the Style Dictionary transform from canonical tokens to platform outputs (CSS custom properties, JS/TS ESM, Tailwind v4 theme), its output contract, and the build command.

### Modified Capabilities

<!-- none — this is the first change; no existing specs -->

## Impact

- New: `package.json`, `tokens/` (sources), `dist/` (generated, gitignored), Style Dictionary config, a DTCG JSON Schema, validation script, a placeholder `.tokens.json`.
- Establishes the contract every later change and every consumer depends on; the directory layout and naming grammar are the highest-risk surface here.
- Adds dev dependencies: Style Dictionary, ajv (JSON Schema validation).
